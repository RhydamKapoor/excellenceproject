'use client'
import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, X, FileText } from "lucide-react"
import toast from "react-hot-toast"

export default function Testing() {
    const [file, setFile] = useState(null);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            
            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview(e.target.result);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setFilePreview(null);
            }
        }
    }

    const removeFile = () => {
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() && !file) {
            toast.error('Please enter a question or upload a file');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Add user message to chat
        const userMessage = { 
            role: "user", 
            content: input || "File uploaded",
            file: file ? {
                name: file.name,
                type: file.type,
                size: file.size
            } : null
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");

        try {
            const formData = new FormData();
            if (file) {
                // If it's a PDF that was converted to an image
                if (file.dataUrl) {
                    // Convert data URL to blob
                    const response = await fetch(file.dataUrl);
                    const blob = await response.blob();
                    formData.append('file', blob, file.name);
                } else {
                    formData.append('file', file);
                }
            }
            if (input) formData.append('prompt', input);

            const response = await fetch('/api/tasksensei/ragapi', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: data.response }
            ]);
            
            setFile(null);
            setFilePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <div className="mb-4 space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                        message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'
                    }`}>
                        <div className="flex items-start space-x-2">
                            <div className="flex-1">
                                <strong className={`font-semibold ${
                                    message.role === 'user' ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                    {message.role === 'user' ? 'You' : 'Assistant'}:
                                </strong>
                                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {file && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <FileText className="text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                
                <div className="flex space-x-2">
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.jpg,.jpeg,.png"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700"
                    >
                        <Paperclip size={20} />
                    </button>
                    
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Enter your question..."
                        className="flex-1 border-2 border-gray-300 rounded-md p-2 outline-none focus:border-blue-500"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
            
            {error && (
                <p className="mt-4 text-red-500">
                    Error: {error}
                </p>
            )}
        </div>
    )
}
