import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import bm25 from "wink-bm25-text-search";
import nlp from "wink-nlp-utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone();
// Helper function to simulate thinking time

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const prompt = formData.get("prompt")
      ? formData.get("prompt")
      : `Read the text or file`;
    const extractedText = formData.get("extractedText");

    let allText = "";
    let hasProcessingError = false;
    let processingErrors = [];

    if (!extractedText && files.length === 0) {
      console.log("Using only prompt as input");
      allText = prompt;
    } else {
      // Use extracted text if available
      if (extractedText) {
        console.log("Using extracted text from image");
        allText = extractedText;
      }

    }

    console.log("Text length:", allText.length);
    if (extractedText && allText.length < 10) {
      return NextResponse.json(
        {
          message: "No text content found",
          response:
            "I couldn't find any text content to analyze. Please make sure your file contains text or try uploading a different file.",
          context: { sources: [] },
          processingErrors:
            processingErrors.length > 0 ? processingErrors : undefined,
        },
        { status: 200 }
      );
    }

    console.log("Starting chunking process");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    // Ensure we have enough text to process
    let textToProcess = allText;
    if (textToProcess.length < 100) {  // If text is too short
      textToProcess = textToProcess + "\n\n" + textToProcess;  // Duplicate the text to ensure we have enough content
    }
    
    const chunks = await textSplitter.splitText(textToProcess);
    console.log("Chunks created:", chunks.length);

    console.log("Initializing embeddings");
    const embeddings = new OpenAIEmbeddings();

    console.log("Getting Pinecone index");
    const indexName = process.env.PINECONE_INDEX_NAME;
    console.log("Index name:", indexName);
    const index = pinecone.Index(indexName);
    console.log("Pinecone index initialized");

    // Generate a unique ID for this session
    const sessionId = `session-${Date.now()}`;
    const userId = session.user.id;  // Get the user ID from the session

    console.log("Creating vectors");
    const textStore = [];
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      const chunk = chunks[i];
      const embedding = await embeddings.embedQuery(chunk);

      vectors.push({
        id: `${sessionId}-chunk-${i}`,
        values: embedding,
        metadata: {
          text: chunk,
          type: "user-query",
          timestamp: new Date().toISOString(),
          source: extractedText ? "file/image" : "prompt",
          sessionId: sessionId,
          userId: userId,  // Store the user ID
        },
      });

      textStore.push({ id: `${sessionId}-chunk-${i}`, text: chunk });
    }
    console.log("Vectors created:", vectors.length);

    console.log("Upserting to Pinecone");
    await index.upsert(vectors);
    console.log("Vectors upserted successfully");

    console.log("Querying Pinecone for similar vectors");
    const queryEmbedding = await embeddings.embedQuery(prompt);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
      includeValues: true,
      filter: {
        userId: userId,  // Only match the current user's data
        $or: [
          { sessionId: sessionId },  // Current session
          { type: "user-query" }     // Historical queries
        ]
      },
    });

    const engine = bm25();
    engine.defineConfig({ fldWeights: { text: 1 } });
    engine.definePrepTasks([
      nlp.string.lowerCase,
      nlp.string.tokenize0,
      nlp.tokens.removeWords,
      nlp.tokens.stem,
    ]);

    // Index all your chunk texts (from textStore)
    let bm25Results = [];
    if (textStore.length >= 2) {
      textStore.forEach((doc) => {
        engine.addDoc({ text: doc.text }, doc.id);
      });
      engine.consolidate();
      bm25Results = engine.search(prompt);
    } else {
      bm25Results = queryResponse.matches.map(match => ({
        id: match.id,
        score: 0.8
      }));
    }

    // Create a map of BM25 scores
    const bm25ScoreMap = new Map();
    bm25Results.forEach((r) => {
      bm25ScoreMap.set(r.id, r.score);
    });

    // Now rerank Pinecone results by combining vector score + BM25
    const rerankedMatches = queryResponse.matches
      .map((match) => {
        const bm25Score = bm25ScoreMap.get(match.id) || 0;
        return {
          ...match,
          rerankScore: match.score * 0.7 + bm25Score * 0.3,
        };
      })
      .sort((a, b) => b.rerankScore - a.rerankScore);

    console.log("Query results:", rerankedMatches);
    const relevantContext = rerankedMatches && rerankedMatches.length > 0
      ? rerankedMatches
          .filter((match) => match.rerankScore >= 0.8) 
          .map((match) =>
            match.metadata.text.length > 20
              ? match.metadata.text
              : "[Skipped short text]"
          )
          .join("\n\n")
      : null;

    // Format the prompt for OpenAI with better context handling
    const formattedPrompt = relevantContext
      ? `Here is the content to analyze:\n\n${relevantContext}\n\nUser Query: ${prompt}\n\nPlease analyze this content and provide specific information about the writer, tasks, deadlines, and organization strategies. If the user is asking about specific details like the writer's name, please extract and provide that information directly.
      If you get any relevant context from the user query, you should write it separately in the context section after contextualised, like {relevant context: ${relevantContext}}.
      If user tells do's and don't's, you should coperate with it.`
      : `Please analyze the following content and provide insights about tasks, deadlines, and organization strategies:\n\n${allText}\n\nUser Query: ${prompt}`;

    console.log("Generating response with OpenAI");
    console.log("Prompt length:", formattedPrompt.length);

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Create an AbortController for the streaming
    const controller = new AbortController();
    const signal = controller.signal;

    // Start the OpenAI streaming response in the background
    (async () => {
      try {
        const history = [{ role: "user", content: prompt }];
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
              Your goal is to carefully analyze the provided input and deliver clear, actionable insights.
              You give queries answer to the user in a friendly and engaging manner. If user ask about the context of the query, you give the context of the query.
              You search in the pinecone to see the score of the chunk related to the user query, and give relevant context to the user query. You create contextual answer to the user query.

              Focus on:
              - Identifying key tasks, action items, and deadlines.
              - Highlighting task priorities and critical timelines.
              - Organizing information logically (using bullet points or numbered lists if necessary).
              - Suggesting improvements in task organization, time management, or prioritization.
              - Keeping the advice practical, specific, and easy to implement.

              When providing guidance:
              1. Start with a clear summary of the main tasks or issues identified
              2. Break down complex tasks into smaller, manageable steps
              3. Prioritize tasks using methods like Eisenhower Matrix (Urgent/Important)
              4. Suggest specific time management techniques (Pomodoro, time blocking, etc.)
              5. Provide concrete examples and templates when relevant
              6. Include code snippets or formulas for task-related calculations
              7. Recommend appropriate tools or apps for specific task types
              8. Explain the reasoning behind your recommendations

              For technical tasks:
              - Provide code examples in appropriate languages
              - Include step-by-step implementation guides
              - Explain best practices and potential pitfalls
              - Suggest testing strategies and validation approaches

              For project management:
              - Recommend appropriate methodologies (Agile, Waterfall, etc.)
              - Suggest project structure and organization
              - Provide templates for project planning and tracking
              - Include risk assessment and mitigation strategies

              Always ensure your tone is professional, encouraging, and solution-oriented. 
              If the input is unclear or missing details, politely suggest how to improve task clarity.
              
              End your responses with a clear call to action or next steps to help users move forward.`,
            },
            ...history,
            {
              role: "user",
              content: formattedPrompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
          stream: true,
        }, { signal });  // Pass the signal to the OpenAI call

        // Process the stream
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            await writer.write(encoder.encode(content));
          }
        }

        await writer.close();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Streaming was aborted');
          await writer.write(encoder.encode('\n\n[Response stopped by user]'));
        } else {
          console.error("Streaming error:", error);
          await writer.abort(error);
        }
      }
    })();

    // Return the readable stream with proper headers
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Processing error:", error);
    return NextResponse.json(
      {
        message: "Processing failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
