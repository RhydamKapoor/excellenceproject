"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Copy,
  Check,
  Paperclip,
  X,
  FileText,
  Folder,
  Square,
  Database,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export default function TaskSenseiComp({ isAnimate = false }) {
  const [prompt, setPrompt] = useState("");
  const [isVectorSearch, setIsVectorSearch] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [prevName, setPrevName] = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
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
      try {
        abortControllerRef.current.abort();
        console.log('Request aborted successfully');
        
        // Update the last message to indicate it was stopped
        setMessages((prev) => 
          prev.map((msg, index) => 
            index === prev.length - 1 && msg.role === "assistant"
              ? { 
                  ...msg, 
                  content: { response: msg.content.response + "\n\n[Response stopped by user]" },
                  isStreaming: false,
                  isTyping: false,
                  isThinking: false
                }
              : msg
          )
        );
      } catch (error) {
        console.error('Error aborting request:', error);
      } finally {
        // Reset all states
        setIsLoading(false);
        setIsTyping(false);
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!prompt.trim() && !extractedText) return;
    
    // Add user message to chat
    const userMessage = { 
      role: "user", 
      content: prompt,
      file: extractedText ? extractedText : null
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setIsThinking(true);
    
    // Create an AbortController to allow stopping the request
    abortControllerRef.current = new AbortController();
    
    // Add a placeholder AI message that will be updated with streaming content
    const aiMessageId = Date.now();
    setMessages((prev) => [...prev, { 
      role: "assistant", 
      content: { response: "Thinking..." }, 
      id: aiMessageId,
      isStreaming: true,
      isThinking: true
    }]);
    
    try {
      const formData = new FormData();
      if (extractedText) {
        formData.append("extractedText", extractedText);
        // Add the file name if available
        if (selectedFile) {
          formData.append("fileName", selectedFile.name.toLowerCase());
        }
      }
      formData.append("prompt", prompt.toLowerCase());
      formData.append("isVectorSearch", isVectorSearch);

      if(!extractedText){
        selectedFile !== "undefined" && setPrevName([...prevName, ""]);
      }
      
      // Call the API with the appropriate endpoint
      const response = await fetch("/api/tasksensei/newAIAPI", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      setIsThinking(false);
      setIsTyping(true);
      
      // Update the message to show typing cursor
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: { response: "" }, isThinking: false } 
            : msg
        )
      );
      
      setFilePreview(null);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        
        try {
          const parsedContent = JSON.parse(accumulatedContent);
          const contextText = parsedContent.context && parsedContent.context[0] ? parsedContent.context[0].text : "";
          
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: { response: contextText } } 
                : msg
            )
          );
        } catch (e) {
          // If JSON parsing fails, just show the raw content
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: { response: accumulatedContent } } 
                : msg
            )
          );
        }
      }
      
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
      
      setSelectedFile(null);
      setExtractedText("");
      setSelectedImage(null);
      setFilePreview(null);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, isStreaming: false, content: { response: msg.content.response + "\n\n[Response stopped by user]" } } 
              : msg
          )
        );
      } else {
        console.error("Error calling TaskSensei API:", error);
        toast.error("Failed to get a response from TaskSensei");
        setMessages((prev) => prev.filter(msg => !msg.isStreaming));
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsThinking(false);
      abortControllerRef.current = null;
    }
  };
  

  // Function to handle file selection
  const handleFileChange = async (e) => {
    const file = e?.target?.files[0];
    
    
    file && file !== "undefined" && setPrevName([...prevName, file?.name]);
    
    if (!file) return;
    
    setSelectedFile(file);
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'text/csv', 'text/markdown'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG), PDF, or text file");
      return;
    }
    
    // Check file size (max 5MB)
    if (file.type === "application/pdf" && file.size > 3 * 1024 * 1024) {
      toast.error("File size should be less than 3MB");
      return;
    }
    
    if (file.type === "text/plain") {
      setExtractedText(await file.text());
      setFilePreview('text');
      return;
    }

    if (file.type === "application/pdf") {
      setFilePreview('pdf');
      setIsLoading(true);
      
      try {
        const { default: pdfToText } = await import("react-pdftotext");
        const text = await pdfToText(file);
        
        setExtractedText(text);
      } catch (error) {
        console.error("PDF Extraction Error:", error);
        toast.error("Error extracting text from PDF. Please try again.");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Handle image files
    setFilePreview('image');
    setIsLoading(true);
    
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker();

      const {
        data: { text },
      } = await worker.recognize(file);
      setExtractedText(text);

      await worker.terminate();
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Error extracting text from image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setExtractedText("");
    setFilePreview(null);
    setPrevName(prevName.slice(0, -1));
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
    // If content is an object (API response), extract the response text
    
    
    // Split the content by code blocks (```code```)
    const parts = content?.split(/(```[\s\S]*?```)/g);
    
    return parts?.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract the language and code
        const codeContent = part.slice(3, -3);
        const firstLineEnd = codeContent.indexOf('\n');
        const language = firstLineEnd > 0 ? codeContent.substring(0, firstLineEnd) : '';
        const code = firstLineEnd > 0 ? codeContent.substring(firstLineEnd + 1) : codeContent;
        
        return (
          <div key={index} className="my-2 overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between bg-primary px-3 py-2 text-xs font-medium capitalize text-primary-foreground">
              <span>{language || "code"}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(code, index)}
                className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-primary-foreground/20"
                title="Copy code"
              >
                {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="overflow-x-auto bg-muted/50 p-3 font-mono text-xs text-foreground">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <p
          key={index}
          className={`whitespace-pre-wrap text-sm leading-relaxed ${
            content === "Thinking..." ? "animate-pulse text-muted-foreground" : ""
          }`}
        >
          {part}
        </p>
      );
    });
    // return <p className="whitespace-pre-wrap">{content}</p>;
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 790);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // run on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    selectedFile ? setIsVectorSearch(true) : setIsVectorSearch(false);
  }, [selectedFile]);

  const isModal = !isAnimate;

  const suggestions = [
    "How do I prioritize my tasks?",
    "Break down a large project",
    "Upload a doc and ask about it",
  ];

  const handleSuggestion = (text) => setPrompt(text);

  const chatContent = (
    <>
      {/* Messages */}
      <div className="sensei_scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-4 px-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">How can I help?</p>
              <p className="text-xs text-muted-foreground">
                Ask about tasks, productivity, or attach a file to analyze.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="cursor-pointer rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${
                    message.role === "user"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-tr-md bg-primary text-primary-foreground"
                      : "rounded-tl-md border border-border bg-muted/60 text-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.file && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-2 py-1.5">
                          <Paperclip className="size-3.5 shrink-0" />
                          <span className="truncate text-xs opacity-90">{prevName[index / 2]}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {formatMessage(message.content.response)}
                      {message.isStreaming && !message.isThinking && (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {filePreview && selectedFile && (
        <div className="mx-4 mb-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
          {filePreview === "pdf" && <Folder className="size-4 shrink-0 text-red-500" />}
          {filePreview === "image" && (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="size-8 rounded-lg object-cover"
            />
          )}
          {selectedFile.type === "text/plain" && (
            <FileText className="size-4 shrink-0 text-primary" />
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{selectedFile.name}</span>
          <button
            type="button"
            onClick={removeFile}
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card p-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,application/pdf,text/plain,text/csv,text/markdown"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Attach file"
            >
              <Paperclip className="size-4" />
            </button>

            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask TaskSensei..."
                className="input-field h-10 w-full pr-3 text-sm"
                disabled={isLoading}
              />
            </div>

            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="size-10 shrink-0 rounded-xl"
                onClick={stopGeneration}
              >
                <Square className="size-4 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="size-10 shrink-0 rounded-xl"
                disabled={!prompt.trim() && !selectedFile}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pl-12 pr-1">
            <button
              type="button"
              onClick={() => !selectedFile && setIsVectorSearch(!isVectorSearch)}
              disabled={!!selectedFile}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isVectorSearch
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              } ${selectedFile ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <Database className="size-3" />
              Vector search
            </button>
            <span className="text-[10px] text-muted-foreground">PDF · Image · Text</span>
          </div>
        </div>
      </form>
    </>
  );

  if (isModal) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        {chatContent}
      </div>
    );
  }

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
      initial={{ width: "0vw" }}
      animate={{
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        width: isMobile ? "90vw" : "60vw",
      }}
      transition={{ duration: 0.8, delay: 0.1, type: "spring", boxShadow: { delay: 1 } }}
    >
      <div className="shrink-0 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-lg font-semibold max-sm:text-base"
        >
          TaskSensei
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-xs opacity-90"
        >
          Ask me anything about task management
        </motion.p>
      </div>
      <motion.div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        initial={{ height: "0%" }}
        animate={{ height: "100%" }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        {chatContent}
      </motion.div>
    </motion.div>
  );
}
