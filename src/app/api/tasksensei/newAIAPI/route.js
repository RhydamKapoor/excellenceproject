import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Worker } from "worker_threads";
import path from "path";
// import { ChatGrok } from "@langchain/groq";
import { Pinecone } from "@pinecone-database/pinecone";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import Groq from "groq-sdk";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

const pinecone = new Pinecone();
// Constants for worker pool
const NUM_WORKERS = 4; // Reduced to 1 worker
const WORKER_TIMEOUT = 420000; // 5 minutes per worker
const OVERALL_TIMEOUT = 900000; // 15 minutes total
const CHUNK_SIZE = 400; // Reduced chunk size
const CHUNK_OVERLAP = 200; // Reduced overlap

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const prompt = formData.get("prompt")
      ? formData.get("prompt")
      : `Read the text or file and give a short summary of the text or file.`;
    const extractedText = formData.get("extractedText");
    const isVectorSearch = formData.get("isVectorSearch");
    const fileName = formData.get("fileName");

    const groqai = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    if (isVectorSearch === "false") {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      (async () => {
        try {
          const completion = await groqai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
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
              {
                role: "user",
                content: prompt,
              },
            ],
            stream: true,
            temperature: 0.7,
          });

          for await (const chunk of completion) {
            if (req.signal.aborted) {
              console.log("Request was aborted by client");
              break;
            }

            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              await writer.write(new TextEncoder().encode(content));
            }
          }
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("Streaming was aborted");
          } else {
            console.error("Error in streaming:", error);
            await writer.write(
              new TextEncoder().encode("Error generating response.")
            );
          }
        } finally {
          try {
            await writer.close();
          } catch (error) {
            console.error("Error closing writer:", error);
          }
        }
      })();

      return new NextResponse(stream.readable, {
        headers: {
          "Content-Type": "text/plain",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      separators: ["\n\n", "\n", " ", ""],
    });

    const chunks = await splitter.splitText(extractedText);
    // console.log(`Chunks: ${chunks}`);

    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = pinecone.Index(indexName);

    // Generate a unique ID for this session
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userId = session.user.id;

    // Step 3: Add context to chunks using GPT-4o
    const vectors = [];
    const workers = [];
    const workerPromises = [];

    console.log("Starting vector creation with chunks:", chunks.length);

    // Only create vectors if we have extractedText (files)
    if (extractedText) {
      // Created worker pool
      for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = new Worker(
          path.join(process.cwd(), "src/app/api/tasksensei/worker.js")
        );
        workers.push(worker);

        // Create a promise for each worker with timeout
        const promise = new Promise((resolve, reject) => {
          let timeoutId = setTimeout(() => {
            console.error(
              `Worker ${i} timed out after ${WORKER_TIMEOUT / 1000} seconds`
            );
            worker.terminate();
            reject(new Error(`Worker ${i} timed out`));
          }, WORKER_TIMEOUT);

          worker.on("message", (result) => {
            if (result.error) {
              console.error(`Worker ${i} error:`, result.error);
              if (result.error.includes("rate limit")) {
                const waitTime = 30000; // Wait 30 seconds before retrying
                console.log(
                  `Worker ${i} hit rate limit. Waiting ${
                    waitTime / 1000
                  } seconds before retrying...`
                );
                setTimeout(() => {
                  if (chunks.length > 0) {
                    const nextChunk = chunks.shift();
                    console.log(
                      `Worker ${i} retrying with next chunk after rate limit`
                    );
                    worker.postMessage({
                      chunk: nextChunk,
                      sessionId,
                      userId,
                      index: vectors.length,
                      source: "file/image",
                      fullText: extractedText,
                      fileName: fileName,
                    });
                  } else {
                    clearTimeout(timeoutId);
                    resolve();
                  }
                }, waitTime);
              } else {
                clearTimeout(timeoutId);
                // Instead of rejecting, try to recover
                console.log(
                  `Worker ${i} encountered error, attempting to recover...`
                );
                if (chunks.length > 0) {
                  const nextChunk = chunks.shift();
                  worker.postMessage({
                    chunk: nextChunk,
                    sessionId,
                    userId,
                    index: vectors.length,
                    source: "file/image",
                    fullText: extractedText,
                    fileName: fileName, // Add fileName to the message
                  });
                } else {
                  resolve();
                }
              }
              return;
            }

            vectors.push(result);
            console.log(
              `Worker ${i} processed chunk ${vectors.length} of ${
                chunks.length + vectors.length
              }`
            );

            if (chunks.length > 0) {
              const nextChunk = chunks.shift();
              worker.postMessage({
                chunk: nextChunk,
                sessionId,
                userId,
                index: vectors.length,
                source: "file/image",
                fullText: extractedText,
                fileName: fileName,
              });
            } else {
              console.log(`Worker ${i} completed all tasks`);
              clearTimeout(timeoutId);
              resolve();
            }
          });

          worker.on("error", (error) => {
            clearTimeout(timeoutId);
            console.error(`Worker ${i} error:`, error);
            // Instead of rejecting, try to recover
            console.log(
              `Worker ${i} encountered error, attempting to recover...`
            );
            if (chunks.length > 0) {
              const nextChunk = chunks.shift();
              worker.postMessage({
                chunk: nextChunk,
                sessionId,
                userId,
                index: vectors.length,
                source: "file/image",
                fullText: extractedText,
                fileName: fileName, // Add fileName to the message
              });
            } else {
              resolve();
            }
          });

          worker.on("exit", (code) => {
            clearTimeout(timeoutId);
            if (code !== 0) {
              console.error(`Worker ${i} stopped with exit code ${code}`);
              // Instead of rejecting, try to recover
              console.log(`Worker ${i} exited, attempting to recover...`);
              if (chunks.length > 0) {
                const nextChunk = chunks.shift();
                worker.postMessage({
                  chunk: nextChunk,
                  sessionId,
                  userId,
                  index: vectors.length,
                  source: "file/image",
                  fullText: extractedText,
                  fileName: fileName, // Add fileName to the message
                });
              } else {
                resolve();
              }
            }
          });

          // Start processing the first chunk
          if (chunks.length > 0) {
            const chunk = chunks.shift();
            worker.postMessage({
              chunk,
              sessionId,
              userId,
              index: vectors.length,
              source: "file/image",
              fullText: extractedText,
              fileName: fileName,
            });
          } else {
            resolve();
          }
        });

        workerPromises.push(promise);
      }

      try {
        console.log("Starting worker processing...");
        // Wait for all workers to complete with timeout
        await Promise.race([
          Promise.all(workerPromises),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Overall processing timeout after ${
                      OVERALL_TIMEOUT / 1000
                    } seconds`
                  )
                ),
              OVERALL_TIMEOUT
            )
          ),
        ]);
        console.log("All workers completed successfully");
      } catch (error) {
        console.error("Error in worker processing:", error);
        // Terminate all workers in case of error
        workers.forEach((worker) => {
          try {
            worker.terminate();
          } catch (e) {
            console.error("Error terminating worker:", e);
          }
        });
        throw error;
      } finally {
        console.log("Cleaning up workers...");
        // Always terminate workers
        workers.forEach((worker) => {
          try {
            worker.terminate();
          } catch (e) {
            console.error("Error terminating worker:", e);
          }
        });
        console.log("Workers cleaned up");
      }

      // Filter out any error objects and validate vectors before upserting
      const validVectors = vectors.filter((vector) => {
        if (vector.error) {
          console.error("Skipping invalid vector with error:", vector.error);
          return false;
        }
        if (!vector.values || !Array.isArray(vector.values)) {
          console.error("Skipping invalid vector without values:", vector);
          return false;
        }
        return true;
      });

      if (validVectors.length === 0) {
        console.error("No valid vectors to upsert!");
        return NextResponse.json(
          { error: "Failed to create valid vectors from the text" },
          { status: 500 }
        );
      }

      // Log the structure of the first vector for debugging
      console.log("First valid vector structure:", JSON.stringify(validVectors[0], null, 2));

      // Upserting the vectors to Pinecone
      await index.upsert(validVectors);
      console.log(`Vectors upserted successfully: ${validVectors}`);
    }

    // Step 5: Contextual Retrieval (Semantic Search)
    const queryResponse = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: prompt,
      }),
    });
    const data = await queryResponse.json();
    const queryEmbedding = data.embedding;

    

    const semanticResults = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });
    const semanticDocs = semanticResults.matches.map((match) => ({
      pageContent: match.metadata.text,
      metadata: { id: match.id },
    }));

    // Step 6: BM25 Retrieval
    const bm25Docs = vectors
      .filter(vector => vector.metadata && vector.metadata.contextText)
      .map((vector) => ({
        pageContent: vector.metadata.contextText,
        metadata: { id: vector.id },
      }));

    if (bm25Docs.length === 0) {
      console.error("No valid documents for BM25 retrieval");
      return NextResponse.json(
        { error: "No valid documents available for search" },
        { status: 500 }
      );
    }

    console.log(`Processing BM25 retrieval with ${bm25Docs.length} documents`);
    const bm25Retriever = BM25Retriever.fromDocuments(bm25Docs, { k: 5 });
    let bm25Results = [];
    try {
      bm25Results = await bm25Retriever.invoke(prompt);
      console.log(`BM25 retrieval completed with ${bm25Results.length} results`);
    } catch (error) {
      console.error("Error in BM25 retrieval:", error);
      // Continue with empty results instead of failing
      bm25Results = [];
    }

    // Step 7: Reciprocal Rank Fusion (RRF)
    const scores = new Map();
    const allDocs = new Map();
    bm25Results.forEach((doc, index) => {
      const id = doc.metadata.id;
      allDocs.set(id, doc.pageContent);
      scores.set(id, (scores.get(id) || 0) + 1 / (60 + index + 1));
    });
    semanticDocs.forEach((doc, index) => {
      const id = doc.metadata.id;
      allDocs.set(id, doc.pageContent);
      scores.set(id, (scores.get(id) || 0) + 1 / (60 + index + 1));
    });
    const fusedResults = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => ({ id, text: allDocs.get(id) }));

    // Step 8: Re-rank with Groq
    const reRankPrompt = `You are a relevance ranker. Given a query and a list of documents, rank the documents by relevance to the query. Return only the top 3 documents in order of relevance, with their IDs and text.
  
        Query: ${prompt}
        
        Documents:
        ${fusedResults
          .map((doc, i) => `[${i + 1}] ID: ${doc.id}\nText: ${doc.text}`)
          .join("\n\n")}
        
        Output format:
        1. ID: <id>, Text: <text>
        2. ID: <id>, Text: <text>
        3. ID: <id>, Text: <text>
        `;
    const reRankResponse = await groqai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a precise evaluator. Return only the ranked documents in the specified format.",
        },
        {
          role: "user",
          content: reRankPrompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });
    
    const reRankedDocs = reRankResponse.choices[0].message.content
      .split("\n")
      .filter((line) => line.match(/^\d+\.\sID:/))
      .map((line) => {
        const match = line.match(/^\d+\.\sID:\s([^,]+),\sText:\s(.+)/);
        if (!match) {
          console.warn(`Failed to parse line: ${line}`);
          return null;
        }
        const [, id, text] = match;
        return { id, text };
      })
      .filter(Boolean); // Remove any null entries from failed parsing

    if (reRankedDocs.length === 0) {
      console.error("Failed to parse any documents from Groq response");
      return NextResponse.json({ 
        error: "Failed to parse ranked documents from Groq response",
        rawResponse: reRankResponse.choices[0].message.content 
      }, { status: 500 });
    }

    // Step 9: Generate final response with Groq
    const context = reRankedDocs.map((doc) => doc.text).join("\n\n");
    const generationPrompt = `Answer the following question based on the provided context:\n\nContext:\n${context}\n\nQuestion: ${prompt}`;
    const response = await groqai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides accurate and relevant answers based on the given context.",
        },
        {
          role: "user",
          content: generationPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true
    });

    console.log(`Response: ${response}`);
    

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        for await (const chunk of response) {
          if (chunk.choices[0]?.delta?.content) {
            await writer.write(new TextEncoder().encode(chunk.choices[0].delta.content));
          }
        }
      } catch (error) {
        console.error("Error in streaming:", error);
        await writer.write(new TextEncoder().encode("Error generating response."));
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in newAIAPI:", error);
    return NextResponse.json({ error: "Error in newAIAPI" }, { status: 500 });
  }
}
