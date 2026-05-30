import { parentPort } from 'worker_threads';
import OpenAI from 'openai';
import {
  ollamaConfig,
  ollamaEmbeddingsUrl,
  ollamaGenerateUrl,
  openaiConfig,
} from '../../../lib/serverConfig.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: openaiConfig.baseUrl,
});

// Optimized rate limiting constants
const MIN_DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds
const MAX_RETRIES = 5;
const INITIAL_DELAY = 2000;
const MAX_PROMPT_LENGTH = 2000;
const REQUEST_TIMEOUT = 30000; // 30 seconds

let lastRequestTime = 0;

// Optimized wait function
async function waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
}

// Optimized retry function
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES, initialDelay = INITIAL_DELAY) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            if (error.message.includes('429') || error.message.includes('rate limit')) {
                const delay = initialDelay * Math.pow(2, retries);
                console.log(`Rate limited, retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
            } else if (error.message.includes('404')) {
                console.error('OpenAI API endpoint not found. Please check the API configuration.');
                throw new Error('OpenAI API configuration error');
            } else {
                throw error;
            }
        }
    }
    throw new Error(`Max retries reached after ${maxRetries} attempts`);
}

async function createContextWithGPT4(chunk, fullText) {
    return retryWithBackoff(async () => {
        try {
                
            const prompt = `Document:\n${fullText}\n\nChunk:\n${chunk}\n\nWhat is the most relevant context from the document that helps understand this chunk? Keep it brief and focused.`;
            
            // Wait for rate limit before making the request
            await waitForRateLimit();
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            try {
                const response = await fetch(ollamaGenerateUrl(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      model: ollamaConfig.generateModel,
                      prompt: prompt,
                      stream: false,
                    }),
                  });
                  
                const data = await response.json();
                const context = data.response?.trim() || "";

                clearTimeout(timeout);

                if (!context) {
                    throw new Error("No context extracted from llama response");
                }

                return `${context}\n${chunk}`;
            } catch (error) {
                clearTimeout(timeout);
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out after 30 seconds');
                }
                throw error;
            }
        } catch (error) {
            console.error("Error in createContextWithGPT4:", error);
            throw error;
        }
    });
}

async function processChunk(chunk, sessionId, userId, i, source, fullText, fileName) {
    try {
        const contextText = await createContextWithGPT4(chunk, fullText);
        // console.log("Context text:", contextText);
        
        // Wait for rate limit before making embedding request
        await waitForRateLimit();
        
        // const response = await openai.embeddings.create({
        //     model: "text-embedding-3-small",
        //     input: contextText,
        // });

        // const embedding = response.data[0].embedding;
        const response = await fetch(ollamaEmbeddingsUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: ollamaConfig.embedModel,
              prompt: contextText,
            }),
          });

        const data = await response.json();
        console.log("Embedding response:", data); // Debug log

        if (!data || !data.embedding) {
            throw new Error("Invalid embedding response structure");
        }

        const embedding = data.embedding;

        if (!Array.isArray(embedding)) {
            throw new Error("Embedding is not an array");
        }

        return {
            id: `${sessionId}-chunk-${i}`,
            values: embedding,
            metadata: {
                text: chunk,
                contextText: contextText,
                type: "user-query",
                timestamp: new Date().toISOString(),
                source: source,
                sessionId: sessionId,
                userId: userId,
                fileName: fileName || "unknown"
            },
        };
    } catch (error) {
        console.error('Error processing chunk:', error);
        throw error;
    }
}

// Listen for messages from the main thread
parentPort.on('message', async (data) => {
    try {
        const result = await processChunk(
            data.chunk,
            data.sessionId,
            data.userId,
            data.index,
            data.source,
            data.fullText,
            data.fileName  // Pass fileName to processChunk
        );
        parentPort.postMessage(result);
    } catch (error) {
        console.error('Worker error:', error);
        parentPort.postMessage({ error: error.message });
    }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in worker:', error);
    parentPort.postMessage({ error: error.message });
});

// import { parentPort } from 'worker_threads';
// import OpenAI from 'openai';

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Add rate limiting constants
// const MIN_DELAY_BETWEEN_REQUESTS = 8000; // Increased to 8 seconds
// const MAX_RETRIES = 12; // Increased from 10 to 12
// const INITIAL_DELAY = 10000; // Increased from 8000 to 10000
// const MAX_TOKENS_PER_MINUTE = 8000; // Reduced from 9000 to leave more buffer
// const MAX_PROMPT_LENGTH = 2000; // Reduced from 4000
// let lastRequestTime = 0;
// let tokenUsage = 0;
// let lastTokenReset = Date.now();

// // Reset token usage every minute
// function resetTokenUsage() {
//     const now = Date.now();
//     if (now - lastTokenReset >= 60000) { // 1 minute
//         tokenUsage = 0;
//         lastTokenReset = now;
//     }
// }

// // Estimate token count (rough approximation)
// function estimateTokens(text) {
//     // Rough estimate: 1 token ≈ 4 characters
//     return Math.ceil(text.length / 4);
// }

// // Add delay between requests
// async function waitForRateLimit(prompt) {
//     resetTokenUsage();
    
//     const estimatedTokens = estimateTokens(prompt);
//     const now = Date.now();
    
//     // Check if we need to wait for token limit
//     if (tokenUsage + estimatedTokens > MAX_TOKENS_PER_MINUTE) {
//         const waitTime = 60000 - (now - lastTokenReset);
//         console.log(`Token limit reached. Waiting ${waitTime}ms for reset...`);
//         await delay(waitTime);
//         tokenUsage = 0;
//         lastTokenReset = Date.now();
//     }
    
//     // Check if we need to wait for request rate limit
//     const timeSinceLastRequest = now - lastRequestTime;
//     if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
//         const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
//         console.log(`Waiting ${waitTime}ms for rate limit...`);
//         await delay(waitTime);
//     }
    
//     lastRequestTime = Date.now();
//     tokenUsage += estimatedTokens;
// }

// // Add delay between chunks
// async function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Retry function with exponential backoff
// async function retryWithBackoff(fn, maxRetries = MAX_RETRIES, initialDelay = INITIAL_DELAY) {
//     let retries = 0;
//     while (retries < maxRetries) {
//         try {
//             return await fn();
//         } catch (error) {
//             if (error.message.includes('429') || error.message.includes('rate limit')) {
//                 const delay = initialDelay * Math.pow(2, retries);
//                 console.log(`Rate limited, retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
//                 await new Promise(resolve => setTimeout(resolve, delay));
//                 retries++;
//             } else {
//                 throw error;
//             }
//         }
//     }
//     throw new Error(`Max retries reached after ${maxRetries} attempts`);
// }

// async function createContextWithGPT4(chunk, fullText) {
//     return retryWithBackoff(async () => {
//         try {
//             // Truncate both the full text and chunk if needed
//             const truncatedFullText = fullText.length > MAX_PROMPT_LENGTH 
//                 ? fullText.substring(0, MAX_PROMPT_LENGTH) + "..."
//                 : fullText;
                
//             const truncatedChunk = chunk.length > MAX_PROMPT_LENGTH/2
//                 ? chunk.substring(0, MAX_PROMPT_LENGTH/2) + "..."
//                 : chunk;
                
//             const prompt = `Document:\n${truncatedFullText}\n\nChunk:\n${truncatedChunk}\n\nWhat is the most relevant context from the document that helps understand this chunk? Keep it brief and focused.`;
//             console.log("Sending request to OpenAI with prompt length:", prompt.length);
            
//             // Wait for rate limit before making the request
//             await waitForRateLimit(prompt);
            
//             const controller = new AbortController();
//             const timeout = setTimeout(() => controller.abort(), 45000); // Increased to 45 seconds

//             try {
//                 const response = await fetch("https://api.openai.com/v1/chat/completions", {
//                     method: "POST",
//                     headers: {
//                         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify({
//                         model: "gpt-4",
//                         messages: [
//                             { role: "system", content: "You are a helpful assistant that extracts helpful context for understanding paragraphs." },
//                             { role: "user", content: prompt }
//                         ],
//                         max_tokens: 100,
//                         temperature: 0.3,
//                     }),
//                     signal: controller.signal
//                 });

//                 clearTimeout(timeout);

//                 if (!response.ok) {
//                     const errorText = await response.text();
//                     console.error("OpenAI API Error:", {
//                         status: response.status,
//                         statusText: response.statusText,
//                         error: errorText
//                     });
//                     throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
//                 }
            
//                 const json = await response.json();
                
//                 if (!json.choices || !json.choices[0] || !json.choices[0].message) {
//                     console.error("Unexpected OpenAI response structure:", json);
//                     throw new Error("Unexpected OpenAI response structure");
//                 }
                
//                 const context = json.choices[0].message.content?.trim();
//                 console.log("Context length:", context?.length);

//                 if (!context) {
//                     console.error("No context extracted from OpenAI response");
//                     throw new Error("No context extracted from OpenAI response");
//                 }

//                 const contextualChunk = `${context}\n${chunk}`;
//                 return contextualChunk;
//             } catch (error) {
//                 clearTimeout(timeout);
//                 if (error.name === 'AbortError') {
//                     throw new Error('Request timed out after 45 seconds');
//                 }
//                 throw error;
//             }
//         } catch (error) {
//             console.error("Error in createContextWithGPT4:", error);
//             throw error;
//         }
//     });
// }

// async function processChunk(chunk, sessionId, userId, i, source, fullText) {
//     const contextText = await createContextWithGPT4(chunk, fullText);

//     const response = await openai.embeddings.create({
//         model: "text-embedding-3-small",
//         input: contextText,
//     });

//     const embedding = response.data[0].embedding;

//     return {
//         id: `${sessionId}-chunk-${i}`,
//         values: embedding,
//         metadata: {
//             text: chunk,
//             context:contextText,
//             type: "user-query",
//             timestamp: new Date().toISOString(),
//             source: source,
//             sessionId: sessionId,
//             userId: userId,
//         },
//     };
// }

// // Listen for messages from the main thread
// parentPort.on('message', async (data) => {
//     try {
//         console.log('Worker received message:', { chunkLength: data.chunk?.length });
//         const result = await processChunk(
//             data.chunk,
//             data.sessionId,
//             data.userId,
//             data.index,
//             data.source,
//             data.fullText
//         );
//         parentPort.postMessage(result);
//     } catch (error) {
//         console.error('Worker error:', error);
//         parentPort.postMessage({ error: error.message });
//     }
// });

// // Handle uncaught errors
// process.on('uncaughtException', (error) => {
//     console.error('Uncaught exception in worker:', error);
//     parentPort.postMessage({ error: error.message });
// });

// process.on('unhandledRejection', (error) => {
//     console.error('Unhandled rejection in worker:', error);
//     parentPort.postMessage({ error: error.message });
// });


