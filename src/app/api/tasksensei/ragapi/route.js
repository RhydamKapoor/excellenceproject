import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import { OpenAIEmbeddings } from '@langchain/openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { Document } from 'langchain/document'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone()

// Helper function to extract text from PDF
async function extractTextFromPDF(buffer) {
    const pdfDoc = await PDFDocument.load(buffer);
    let text = '';
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        text += await page.getText();
    }
    return text;
}

// Helper function to extract text from text file
async function extractTextFromTextFile(buffer) {
    return buffer.toString('utf-8');
}

export const POST = async (req) => {
    try {
        console.log('API request received');
        const formData = await req.formData()
        const prompt = formData.get('prompt') ? formData.get('prompt') : `Read the text file`;
        console.log('Prompt:', prompt);
        
        const files = formData.getAll('files')
        const extractedText = formData.get('extractedText')
        console.log('Extracted text:', extractedText ? 'Present' : 'Not present');
        console.log('Files:', files.length > 0 ? 'Present' : 'Not present');
        
        let allText = '';
        let hasProcessingError = false;
        let processingErrors = [];

        // If only prompt is provided, use it directly
        if (!extractedText && files.length === 0) {
            console.log('Using only prompt as input');
            allText = prompt;
        } else {
            // Use extracted text if available
            if (extractedText) {
                console.log('Using extracted text from image');
                allText = extractedText;
            }

            // Process files if any
            if (files.length > 0) {
                for (const file of files) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    let fileText = '';

                    try {
                        if (file.type === 'application/pdf') {
                            console.log('Processing PDF file:', file.name);
                            fileText = await extractTextFromPDF(buffer);
                        } else if (file.type.startsWith('text/')) {
                            console.log('Processing text file:', file.name);
                            fileText = await extractTextFromTextFile(buffer);
                        } else if (file.type.startsWith('image/')) {
                            console.log('Skipping image file as we already have extracted text');
                            continue;
                        } else {
                            console.log('Unsupported file type:', file.type);
                            processingErrors.push({
                                fileName: file.name,
                                error: 'Unsupported file type'
                            });
                            continue;
                        }

                        if (fileText.trim()) {
                            allText += '\n\n' + fileText;
                            console.log(`Successfully processed ${file.name}`);
                        } else {
                            processingErrors.push({
                                fileName: file.name,
                                error: 'No text could be extracted'
                            });
                        }
                    } catch (error) {
                        console.error(`Error processing ${file.name}:`, error);
                        processingErrors.push({
                            fileName: file.name,
                            error: error.message
                        });
                    }
                }
            }
        }

        console.log('Text length:', allText.length);
        if (extractedText && allText.length < 10) {
            return NextResponse.json({
                message: 'No text content found',
                response: 'I couldn\'t find any text content to analyze. Please make sure your file contains text or try uploading a different file.',
                context: { sources: [] },
                processingErrors: processingErrors.length > 0 ? processingErrors : undefined
            }, { status: 200 });
        }

        console.log('Starting chunking process');
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        })
        const chunks = await textSplitter.splitText(allText)
        console.log('Chunks created:', chunks.length);

        console.log('Initializing embeddings');
        const embeddings = new OpenAIEmbeddings()
        
        console.log('Getting Pinecone index');
        const indexName = process.env.PINECONE_INDEX_NAME
        console.log('Index name:', indexName);
        const index = pinecone.Index(indexName)
        console.log('Pinecone index initialized');

        // Generate a unique ID for this session
        const sessionId = `session-${Date.now()}`;
        console.log('Using session ID:', sessionId);

        console.log('Creating vectors');
        const vectors = []
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Processing chunk ${i + 1}/${chunks.length}`);
            const chunk = chunks[i]
            const embedding = await embeddings.embedQuery(chunk)
            
            vectors.push({
                id: `${sessionId}-chunk-${i}`,
                values: embedding,
                metadata: {
                    text: chunk,
                    timestamp: new Date().toISOString(),
                    source: extractedText ? 'image' : (files.length > 0 ? 'file' : 'prompt'),
                    sessionId: sessionId
                }
            })
        }
        console.log('Vectors created:', vectors.length);

        console.log('Upserting to Pinecone');
        await index.upsert(vectors)
        console.log('Vectors upserted successfully');
        
        console.log('Querying Pinecone for similar vectors');
        const queryEmbedding = await embeddings.embedQuery(prompt)
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true,
            includeValues: true,
            filter: {
                sessionId: sessionId
            }
        })
        console.log('Query results:', queryResponse.matches);

        const relevantContext = queryResponse.matches && queryResponse.matches.length > 0
            ? queryResponse.matches
                .filter(match => match.score >= 0.7)
                .map(match => match.metadata.text)
                .join('\n\n')
            : null;

        console.log('Relevant context:', relevantContext ? 'Present' : 'Not present');
        if (relevantContext) {
            console.log('Context length:', relevantContext.length);
        }

        // Format the prompt for OpenAI
        const formattedPrompt = relevantContext 
            ? `Here is the content to analyze:\n\n${relevantContext}\n\nPlease analyze this content and provide insights about tasks, deadlines, and organization strategies.`
            : `Please analyze the following content and provide insights about tasks, deadlines, and organization strategies:\n\n${allText}`;

        console.log('Generating response with OpenAI');
        console.log('Prompt length:', formattedPrompt.length);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
        Your goal is to carefully analyze the provided input and deliver clear, actionable insights.

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
        
        End your responses with a clear call to action or next steps to help users move forward.`
                },
                {
                    role: "user",
                    content: formattedPrompt
                }
            ],
            temperature: 0.2,
            max_tokens: 1000
        })

        const response = completion.choices[0].message.content
        console.log('OpenAI response generated');
        console.log('Response length:', response.length);

        const sources = queryResponse.matches && queryResponse.matches.length > 0
            ? queryResponse.matches
                .filter(match => match.score >= 0.7)
                .map(match => ({
                    id: match.id,
                    score: match.score,
                    text: match.metadata.text
                }))
            : [];

        return NextResponse.json({
            message: 'Response generated successfully',
            response: response,
            context: {
                sources: sources
            },
            processingErrors: processingErrors.length > 0 ? processingErrors : undefined
        }, { status: 200 })

    } catch (error) {
        console.error('Processing error:', error)
        return NextResponse.json({ 
            message: 'Processing failed',
            error: error.message 
        }, { status: 500 })
    }
}
