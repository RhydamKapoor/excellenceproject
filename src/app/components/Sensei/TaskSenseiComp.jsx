"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Copy, Check, Paperclip, X, FileText, Folder, Square } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import { PDFDocument } from "pdf-lib";

export default function TaskSenseiComp({isAnimate}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  

  // Function to stop the AI response generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      // Update the last message to indicate it was stopped
      setMessages((prev) => 
        prev.map((msg, index) => 
          index === prev.length - 1 && msg.role === "assistant" && msg.isStreaming
            ? { ...msg, isStreaming: false, content: msg.content + "\n\n[Response stopped by user]" }
            : msg
        )
      );
      
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim() && !selectedFile) return;
    
    // Add user message to chat
    const userMessage = { 
      role: "user", 
      content: prompt,
      file: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      } : null
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      // Create FormData to send both text and file
      const formData = new FormData();
      formData.append("prompt", prompt);
      
      if (selectedFile) {
        // If it's a PDF that was converted to an image
        if (selectedFile.dataUrl) {
          // Convert data URL to blob
          const response = await fetch(selectedFile.dataUrl);
          const blob = await response.blob();
          formData.append("file", blob, selectedFile.name);
        } else {
          formData.append("file", selectedFile);
        }
      }
      
      // Add a placeholder AI message that will be updated with streaming content
      const aiMessageId = Date.now();
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "", 
        id: aiMessageId,
        isStreaming: true
      }]);
      
      // Create an AbortController to allow stopping the request
      abortControllerRef.current = new AbortController();
      
      // Call the TaskSensei API with fetch
      const response = await fetch("/api/tasksensei", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Get the reader from the response body stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and update the message
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        
        // Update the AI message with the accumulated content
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: accumulatedContent } 
              : msg
          )
        );
      }
      
      // Mark the message as no longer streaming
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
      
      // Clear file after successful submission
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      // Check if the error is due to aborting the request
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        // The message was already updated in the stopGeneration function
      } else {
        console.error("Error calling TaskSensei API:", error);
        toast.error("Failed to get a response from TaskSensei");
        
        // Remove the streaming message if there was an error
        setMessages((prev) => prev.filter(msg => !msg.isStreaming));
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  // Function to handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'text/csv', 'text/markdown'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG), PDF, or text file");
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDFs, show a PDF icon
      setFilePreview('pdf');
    } else if (file.type.startsWith('text/')) {
      // For text files, show a text icon
      setFilePreview('text');
    }
  };

  // Function to remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to copy code to clipboard
  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedIndex(index);
        toast.success("Code copied to clipboard!");
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      })
      .catch(err => {
        console.error("Failed to copy code: ", err);
        toast.error("Failed to copy code");
      });
  };

  // Function to format message content with code blocks
  const formatMessage = (content) => {
    // Split the content by code blocks (```code```)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract the language and code
        const codeContent = part.slice(3, -3);
        const firstLineEnd = codeContent.indexOf('\n');
        const language = firstLineEnd > 0 ? codeContent.substring(0, firstLineEnd) : '';
        const code = firstLineEnd > 0 ? codeContent.substring(firstLineEnd + 1) : codeContent;
        
        return (
          <div key={index} className="my-2">
            <div className="bg-[var(--dark-btn)] text-slate-100 p-2 rounded-t-lg text-sm font-mono capitalize flex justify-between items-center">
              <span>{language || 'code'}</span>
              <button 
                onClick={() => copyToClipboard(code, index)}
                className="text-slate-100 hover:text-white transition-colors"
                title="Copy code"
              >
                {copiedIndex === index ? <Check size={16} /> : <Copy size={16} className="cursor-pointer"/>}
              </button>
            </div>
            <pre className="border border-[var(--dark-btn)] bg-[var(--ourbackground)] text-slate-800 rounded-b-lg pt-2 overflow-x-auto font-mono text-sm p-2">
              <code className="font-(family-name:--font-roboto)">{code}</code>
            </pre>
          </div>
        );
      }
      
      // Regular text
      return <p key={index} className="whitespace-pre-wrap">{part}</p>;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 790);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // run on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <motion.div className="flex flex-col justify-center rounded-lg overflow-hidden h-full" 
    initial={{width: isAnimate ? "0vw" : "100vw"}}
    animate={{ 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" , width: isMobile ? "90vw" : "60vw"
    }} 
    transition={{duration: 0.8, delay: 0.1, type: "spring", boxShadow: { delay: 1}}}>
      {/* Chat header */}
      <div className="bg-[var(--dark-btn)] text-white p-4  rounded-t-lg">
        <motion.h2 initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.3, duration: 0.4}} className="text-xl font-semibold max-sm:text-lg">TaskSensei</motion.h2>
        <motion.p initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.3, duration: 0.4}} className="text-sm opacity-80 max-sm:text-xs">Ask me anything about task management</motion.p>
      </div>
      
      {/* Chat messages */}
      <motion.div className="h-full overflow-y-auto space-y-4 sensei_scroll p-4" initial={{height: isAnimate ? "0%" : "100%"}} animate={{height: isAnimate ? "100%" : "100%"}} transition={{delay: 0.8, duration: 0.4}}>
        {messages.length === 0 ? (
          <motion.div className="flex flex-col gap-y-5 items-center justify-center text-gray-500 h-full m-0" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.8, duration: 0.5}}>
            <p className="text-center text-xl font-semibold max-sm:text-lg">Ask TaskSensei for help with your tasks</p>
            <ul className="text-sm list-disc gap-y-1 flex flex-col text-slate-400 max-sm:text-xs max-sm:pl-4">
              <li>How can I prioritize my tasks effectively?</li>
              <li>What's the best way to break down a large project?</li>
              <li>How do I manage my time better?</li>
              <li>Upload a document or image for analysis</li>
            </ul>
          </motion.div>
          
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] max-[450px]:text-sm p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-[var(--dark-btn)] text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.role === "user" ? (
                  <div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.file && (
                      <div className="mt-2 p-2 bg-white text-slate-800 bg-opacity-20 rounded flex items-center">
                        <Paperclip size={16} className="mr-2" />
                        <span className="text-sm truncate">{message.file.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {formatMessage(message.content)}
                    {message.isStreaming && (
                      <span className="inline-block w-1 h-4 ml-1 animate-pulse bg-gray-700"></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </motion.div>
      
      {/* File Preview */}
      {filePreview && (
        <div className="relative mt-2 p-1 border rounded-md bg-gray-50 flex items-center">
          {filePreview === 'pdf' ? (
            <div className="flex items-center p-2">
              <div className="text-center flex items-center gap-x-2">
                <Folder size={20} color="red"/>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
              </div>
            </div>
          ) : filePreview === 'text' ? (
            <div className="flex items-center p-2">
              <div className="text-center flex items-center gap-x-2">
                <FileText size={20} color="blue"/>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
              </div>
            </div>
          ) : (
              <div className="text-center flex items-center gap-x-2">
            <img
              src={filePreview}
              alt="Preview"
              className="max-h-12"
            />
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
              </div>
          )}
          <button
            onClick={removeFile}
            className="absolute top-1/2 -translate-y-1/2 right-1 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Stop button - only visible when a response is being generated */}
      {/* {(
        <div className="flex justify-center p-2">
          <button
            onClick={stopGeneration}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Square size={16} />
            <span>Stop Generation</span>
          </button>
        </div>
      )} */}
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-center relative">
            <div className="absolute -left-0.5 h-full flex items-center justify-center rounded-l-lg w-10 border-r border-slate-200 group cursor-pointer" onClick={() => fileInputRef.current.click()} >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,application/pdf,text/plain,text/csv,text/markdown"
                className="hidden"
                />
                <button
                type="button"
                className="text-gray-500 group-hover:text-gray-700 p-1 cursor-pointer"
                title="Attach file"
                >
                <Paperclip size={20}/>
                </button>
            </div>
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask TaskSensei for help..."
                className="flex-1 py-2 pl-12 pr-12 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--dark-btn)] max-sm:text-sm text-slate-600"
                disabled={isLoading}
            />
            {
              isLoading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="bg-red-700 text-white rounded-r-lg hover:bg-opacity-90 transition-colors w-10 h-full flex items-center justify-center cursor-pointer absolute -right-0.5"
                >
                  <span className=" w-fit"><Square size={20} /></span>
                </button>
                )
                :
                <button
                  type="submit"
                  className="bg-[var(--dark-btn)] text-white rounded-r-lg hover:bg-opacity-90 transition-colors w-10 h-full flex items-center justify-center cursor-pointer absolute -right-0.5"
                  disabled={isLoading || (!prompt.trim() && !selectedFile)}
                >
                  <span className="-translate-x-0.5 w-fit"><Send size={20} /></span>
                </button>
            }
            
        </div>
      </form>
    </motion.div>
  );
}
