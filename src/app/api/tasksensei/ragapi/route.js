import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { getServerSession } from "next-auth";
import bm25 from "wink-bm25-text-search";
import nlp from "wink-nlp-utils";
import { Worker } from "worker_threads";
import path from "path";
import { authOptions } from "../../auth/[...nextauth]/route";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone();
// Constants for worker pool
const NUM_WORKERS = 4; // Reduced to 1 worker
const WORKER_TIMEOUT = 420000; // 5 minutes per worker
const OVERALL_TIMEOUT = 900000; // 15 minutes total
const CHUNK_SIZE = 500; // Reduced chunk size
const CHUNK_OVERLAP = 200; // Reduced overlap

// Helper function to simulate thinking time

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accessing form data
    const formData = await req.formData();

    // Getting values of prompt and extractedText
    const prompt = formData.get("prompt")
      ? formData.get("prompt")
      : `Read the text or file`;
    const extractedText = formData.get("extractedText");
    const isVectorSearch = formData.get("isVectorSearch");
    console.log(isVectorSearch);
    

    // If not vector search, use GPT-4 directly
    if (isVectorSearch === "false") {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      (async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
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
              console.log('Request was aborted by client');
              break;
            }
            
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              await writer.write(new TextEncoder().encode(content));
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Streaming was aborted');
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
            console.error('Error closing writer:', error);
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

    // Continue with RAG processing for vector search
    let textToProcess = extractedText || prompt;
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    // ------------------Split the text into chunks----------------------

    // Splitting the text into chunks
    const chunks = await textSplitter.splitText(textToProcess);

    // ------------------Split the text into chunks----------------------

    console.log("Initializing embeddings");

    // Getting Pinecone index
    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = pinecone.Index(indexName);

    // Generate a unique ID for this session
    const sessionId = `session-${Date.now()}`;
    const userId = session.user.id; // Get the user ID from the session

    // ------------Creating vectors using chunks------------

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
                      fullText: textToProcess,
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
                    fullText: textToProcess,
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
                fullText: textToProcess,
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
                fullText: textToProcess,
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
                  fullText: textToProcess,
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
              fullText: textToProcess,
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
        return true;
      });

      if (validVectors.length === 0) {
        console.error("No valid vectors to upsert!");
        return NextResponse.json(
          { error: "Failed to create valid vectors from the text" },
          { status: 500 }
        );
      }

      // Upserting the vectors to Pinecone
      await index.upsert(validVectors);
      console.log("Vectors upserted successfully");
    }

    let vectorEmbedding;

    if (vectors.length > 0) {
      console.log("Vectors found, using first vector");
      vectorEmbedding = vectors[0].values;
    } else {
      console.log("No vectors found, creating embedding for prompt");
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: prompt,
      });
      vectorEmbedding = res.data[0].embedding;
    }

    // Add retry logic for Pinecone query
    let queryResponse;
    let retryCount = 0;
    const maxRetries = 5; // Increased from 3 to 5
    const retryDelay = 5000; // Increased from 1000 to 5000 (5 seconds)
    const queryTimeout = 30000; // 30 seconds timeout for each query

    while (retryCount < maxRetries) {
      try {
        console.log(
          `Attempting Pinecone query (attempt ${retryCount + 1}/${maxRetries})`
        );

        // Create a promise that will reject after timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Query timeout")), queryTimeout);
        });

        // Create the query promise
        const queryPromise = index.query({
          vector: vectorEmbedding,
          topK: 10, // Increased from 5 to 10
          includeMetadata: true,
          includeValues: true,
          filter: {
            userId: userId,
            $or: [{ sessionId: sessionId }, { type: "user-query" }],
          },
        });

        // Race between the query and timeout
        queryResponse = await Promise.race([queryPromise, timeoutPromise]);

        // If we got results, break the retry loop
        if (queryResponse.matches && queryResponse.matches.length > 0) {
          console.log(`Found ${queryResponse.matches.length} matches`);
          break;
        }

        // If no results, wait and retry
        console.log("No results found, retrying...");
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`Waiting ${delay / 1000} seconds before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(
          `Error in Pinecone query (attempt ${retryCount + 1}):`,
          error
        );
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`Waiting ${delay / 1000} seconds before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If still no results after retries, try a broader search
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      console.log("No results after retries, trying broader search...");
      try {
        queryResponse = await index.query({
          vector: vectorEmbedding,
          topK: 5,
          includeMetadata: true,
          includeValues: true,
          filter: {
            userId: userId,
          },
        });
      } catch (error) {
        console.error("Error in broader Pinecone search:", error);
      }
    }

    console.log("Query response:", queryResponse.matches);

    const pineconeResults = queryResponse.matches.map((m) => ({
      text: m.metadata.text,
      context: m.metadata.context,
      source: "pinecone",
      score: m.score,
    }));
    // console.log("Pinecone results:", pineconeResults);

    // If still no results, return early with a helpful message
    if (pineconeResults.length === 0) {
      console.log("No results found in Pinecone after all attempts");
      return NextResponse.json(
        {
          error:
            "No relevant information found. Please try rephrasing your query or check if the document has been properly processed.",
          details:
            "The system couldn't find any matching content in the processed documents.",
        },
        { status: 404 }
      );
    }

    // Initialize BM25 engine
    const engine = bm25();
    engine.defineConfig({ fldWeights: { text: 1 } });
    engine.definePrepTasks([
      nlp.string.lowerCase,
      nlp.string.tokenize0,
      nlp.tokens.removeWords,
      nlp.tokens.stem,
    ]);

    // Add documents to BM25 engine
    const bm25Docs = [];
    pineconeResults.forEach((doc, i) => {
      if (doc.context && doc.context.trim().length > 0) {
        const text = `${doc.context}`;
        engine.addDoc({ text }, i);
        bm25Docs.push({ ...doc, text });
      }
    });

    // Get BM25 results
    let bm25Results = [];
    
    if (bm25Docs.length > 0) {
      try {
        console.log(`Processing BM25 with ${bm25Docs.length} valid documents`);
        engine.consolidate();
        const results = engine.search(prompt);
       
        // If no results from BM25, use Pinecone results directly
        if (!results || results.length === 0) {
          console.log("No BM25 results, falling back to Pinecone results");
          bm25Results = pineconeResults.slice(0, 5).map((doc) => ({
            text: doc.text || doc.context || "",
            context: doc.context || doc.text || "",
            bm25Score: 1.0,
            source: "pinecone",
          }));
        } else {
          bm25Results = results.slice(0, 5).map(([id, score]) => {
            const doc = bm25Docs[parseInt(id)];
            return {
              text: doc.text || doc.context || "",
              context: doc.context || doc.text || "",
              bm25Score: score,
              source: "bm25",
            };
          });
        }
        console.log("BM25 results:", bm25Results);
      } catch (error) {
        console.error("BM25 processing failed:", error);
        // Fallback to using valid documents directly
        bm25Results = bm25Docs.slice(0, 5).map((doc) => ({
          text: doc.text || doc.context || "",
          context: doc.context || doc.text || "",
          bm25Score: 1.0,
          source: "fallback",
        }));
      }
    } else {
      console.log(
        "Not enough valid documents for BM25, using Pinecone results directly"
      );
      bm25Results = pineconeResults
        .filter(
          (doc) =>
            (doc.context || doc.text) &&
            (doc.context || doc.text).trim().length > 0
        )
        .slice(0, 5)
        .map((doc) => ({
          text: doc.text || doc.context || "",
          context: doc.context || doc.text || "",
          bm25Score: 1.0,
          source: "pinecone",
        }));
    }

    // Validate that we have results
    if (bm25Results.length === 0) {
      console.error("No valid results found after BM25 processing");
      return NextResponse.json(
        { error: "No relevant results found" },
        { status: 404 }
      );
    }

    // Use GPT-4 to select the most relevant result
    try {
      console.log("Starting GPT-4 selection...");
      const selectionPrompt = `
      You are an intelligent reranker helping a Retrieval-Augmented Generation (RAG) system.

      Your task is to rank chunks of text (contexts) based on how well they answer the user query.

      - Only choose contexts that directly and clearly relate to the query.
      - Do NOT assume or infer meaning beyond the given context.
      - Prioritize contexts that use specific terms, names, or keywords from the query.
      - Be strict — if a context doesn't seem relevant, rank it lower.
      - Return only the most relevant context with a short explanation.
      - If no context is relevant, return index 0 with an explanation of why none are relevant.

      ---

      User Query:
      "${prompt}"

      ---

      Contexts:
      ${bm25Results
        .map((ctx, i) => `Context [${i + 1}]: ${ctx.context || ctx.text}`)
        .join("\n\n")}

      ---

      Instructions:
      1. Evaluate all contexts above for how relevant they are to answering the user query.
      2. Return a JSON object with the index of the most relevant context and your reasoning.
      3. If no context is relevant, use index 0 and explain why.

      Response Format:
      {
        "index": 0,
        "reason": "This context is most relevant because..."
      }
      `;

      const selectionResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a precise evaluator. Return only valid JSON with the index of the most relevant context and your reasoning. If no context is relevant, use index 0 and explain why.",
          },
          {
            role: "user",
            content: selectionPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const selectedResult = JSON.parse(
        selectionResponse.choices[0].message.content
      );
      console.log("Selected result:", selectedResult);

      // Handle case where no context is relevant
      if (selectedResult.index === -1) {
        console.log(
          "No relevant context found, using first result with explanation"
        );
      }

      
      const finalResult = selectedResult.index !== 0 ? bm25Results[selectedResult.index - 1] : {text:`No relevant information found.`, context:`No relevant information found or maybe missing`, reason: "No relevant information found."};

      // Create a streaming response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start streaming the response
      (async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
                Your goal is to carefully analyze the provided input and deliver clear, actionable insights. 
                Use ONLY the information from the provided context to answer the query.
                If the context doesn't contain relevant information, say so explicitly.
                Be direct and concise in your response.
                If no relevant information is found, explain why.`,
              },
              {
                role: "user",
                content: `Context:\n${
                  finalResult.context || finalResult.text
                }\n\nQuestion: ${prompt}\n\nPlease provide a direct answer using ONLY the information from the context above. If no relevant information is found, explain why.`,
              },
            ],
            stream: true,
            temperature: 0.2,
          });

          // Stream the response
          for await (const chunk of completion) {
            // Check if the request was aborted
            if (req.signal.aborted) {
              console.log('Request was aborted by client');
              break;
            }
            
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              await writer.write(new TextEncoder().encode(content));
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Streaming was aborted');
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
            console.error('Error closing writer:', error);
          }
        }
      })();

      return new NextResponse(stream.readable, {
        headers: {
          "Content-Type": "text/plain",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (error) {
      console.error("Error in GPT-4 selection:", error);
      // Fallback to first valid result
      const fallbackResult = bm25Results[0];
      if (!fallbackResult) {
        return NextResponse.json(
          { error: "No valid results available" },
          { status: 404 }
        );
      }

      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are TaskSensei, a helpful assistant. 
            Use ONLY the information from the provided context to answer the query.
            If the context doesn't contain relevant information, say so explicitly.
            Be direct and concise in your response.`,
          },
          {
            role: "user",
            content: `Context:\n${fallbackResult.text}\n\nQuestion: ${prompt}\n\nPlease provide a direct answer using ONLY the information from the context above.`,
          },
        ],
        stream: true,
        temperature: 0.2,
      });

      // Stream the response
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          await writer.write(new TextEncoder().encode(content));
        }
      }
      await writer.close();

      return new NextResponse(stream.readable, {
        headers: {
          "Content-Type": "text/plain",
          "Transfer-Encoding": "chunked",
        },
      });
    }
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
