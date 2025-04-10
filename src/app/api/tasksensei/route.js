import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PDFDocument } from "pdf-lib";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to simulate thinking time
const simulateThinkingTime = async (contentLength) => {
  // Base delay of 1 second
  let delay = 1000;

  // Add more time based on content length (roughly 100ms per 100 characters)
  if (contentLength) {
    delay += Math.min((contentLength / 100) * 100, 5000); // Cap at 5 seconds additional
  }

  // Add some randomness to make it feel more natural
  delay += Math.random() * 1000;

  await new Promise((resolve) => setTimeout(resolve, delay));
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const prompt = formData.get("prompt") || "";
    const file = formData.get("file");

    if (!prompt && !file) {
      return NextResponse.json(
        { error: "Either prompt or file is required" },
        { status: 400 }
      );
    }

    let fileContent = "";
    let fileType = "";

    if (file) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      fileType = file.type;

      if (fileType.startsWith("image/")) {
        // Handle image files
        const base64Image = fileBuffer.toString("base64");

        const systemMessage = {
          role: "system",
          content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
          Your goal is to carefully analyze the provided input (text, image, or PDF metadata) and deliver clear, actionable insights.

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
        };

        const userMessage = {
          role: "user",
          content: [
            {
              type: "text",
              text:
                prompt || "Analyze this image for task management insights.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${fileType};base64,${base64Image}` },
            },
          ],
        };

        // Use streaming for image analysis
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [systemMessage, userMessage],
          max_tokens: 1000,
          stream: true,
        });

        // Create a TransformStream to handle the streaming response
        const encoder = new TextEncoder();
        const streamResponse = new TransformStream();
        const writer = streamResponse.writable.getWriter();

        // Process the stream in the background
        (async () => {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                await writer.write(encoder.encode(content));
              }
            }
            await writer.close();
          } catch (error) {
            console.error("Streaming error:", error);
            await writer.abort(error);
          }
        })();

        // Return the readable stream
        return new Response(streamResponse.readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        });
      } else if (fileType === "application/pdf") {
        try {
          // For PDFs, we'll use a different approach
          // Instead of trying to send the PDF to OpenAI, we'll extract metadata
          // and provide a response based on that

          // Load the PDF document
          const pdfDoc = await PDFDocument.load(fileBuffer);

          // Get basic metadata
          const pageCount = pdfDoc.getPageCount();
          const title = pdfDoc.getTitle() || "Untitled PDF";
          const author = pdfDoc.getAuthor() || "Unknown Author";
          const subject = pdfDoc.getSubject() || "No subject";
          const keywords = pdfDoc.getKeywords() || "No keywords";

          // Create a system message for analyzing the PDF metadata
          const systemMessage = {
            role: "system",
            content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
            Your goal is to carefully analyze the provided input (text, image, or PDF metadata) and deliver clear, actionable insights.

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
          };

          const userMessage = {
            role: "user",
            content:
              prompt ||
              `Analyze this PDF metadata for task management insights:
            Title: ${title}
            Author: ${author}
            Subject: ${subject}
            Keywords: ${keywords}
            Page Count: ${pageCount}
            
            Please provide insights based on this metadata.`,
          };

          // Use streaming for PDF analysis
          const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [systemMessage, userMessage],
            max_tokens: 1000,
            stream: true,
          });

          // Create a TransformStream to handle the streaming response
          const encoder = new TextEncoder();
          const streamResponse = new TransformStream();
          const writer = streamResponse.writable.getWriter();

          // Process the stream in the background
          (async () => {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                  await writer.write(encoder.encode(content));
                }
              }
              await writer.close();
            } catch (error) {
              console.error("Streaming error:", error);
              await writer.abort(error);
            }
          })();

          // Return the readable stream
          return new Response(streamResponse.readable, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Transfer-Encoding": "chunked",
            },
          });
        } catch (error) {
          console.error("PDF processing error:", error);
          return NextResponse.json({
            response:
              "I encountered an issue processing the PDF. Here are some suggestions for working with PDF documents:\n\n" +
              "1. If the PDF contains text, try copying and pasting the relevant sections directly into our chat.\n" +
              "2. For scanned documents, consider using OCR software first to extract the text.\n" +
              "3. If the PDF is password-protected, please remove the protection before uploading.\n" +
              "4. For large PDFs, you might want to extract the most relevant pages or sections.\n\n" +
              "Would you like to try uploading the PDF again, or would you prefer to copy and paste the text directly?",
            error: true,
          });
        }
      } else if (fileType.startsWith("text/")) {
        // Handle text files
        try {
          // Convert buffer to text
          const textContent = fileBuffer.toString("utf-8");

          // Create a system message for analyzing the text content
          const systemMessage = {
            role: "system",
            content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
            Your goal is to carefully analyze the provided input (text, image, or PDF metadata) and deliver clear, actionable insights.

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
          };

          const userMessage = {
            role: "user",
            content:
              prompt ||
              `Analyze this text content for task management insights:\n\n${textContent}`,
          };

          // Use streaming for text file analysis
          const stream = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [systemMessage, userMessage],
            max_tokens: 1000,
            stream: true,
          });

          // Create a TransformStream to handle the streaming response
          const encoder = new TextEncoder();
          const streamResponse = new TransformStream();
          const writer = streamResponse.writable.getWriter();

          // Process the stream in the background
          (async () => {
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                  await writer.write(encoder.encode(content));
                }
              }
              await writer.close();
            } catch (error) {
              console.error("Streaming error:", error);
              await writer.abort(error);
            }
          })();

          // Return the readable stream
          return new Response(streamResponse.readable, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Transfer-Encoding": "chunked",
            },
          });
        } catch (error) {
          console.error("Text file processing error:", error);
          return NextResponse.json({
            response:
              "I encountered an issue processing the text file. Please try again or copy and paste the text directly into our chat.",
            error: true,
          });
        }
      }
    }

    // If no file was processed, fallback to text-only prompt
    if (!fileContent) {
      const systemMessage = {
        role: "system",
        content: `You are TaskSensei, a world-class expert in task management, productivity, and organization strategies. 
        Your goal is to carefully analyze the provided input (text, image, or PDF metadata) and deliver clear, actionable insights.

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
      };

      const userMessage = {
        role: "user",
        content: prompt,
      };

      // Use streaming for text-only prompts
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemMessage, userMessage],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      // Create a TransformStream to handle the streaming response
      const encoder = new TextEncoder();
      const streamResponse = new TransformStream();
      const writer = streamResponse.writable.getWriter();

      // Process the stream in the background
      (async () => {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              await writer.write(encoder.encode(content));
            }
          }
          await writer.close();
        } catch (error) {
          console.error("Streaming error:", error);
          await writer.abort(error);
        }
      })();

      // Return the readable stream
      return new Response(streamResponse.readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    return NextResponse.json({ response: fileContent });
  } catch (error) {
    console.error("Error in TaskSensei API:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
