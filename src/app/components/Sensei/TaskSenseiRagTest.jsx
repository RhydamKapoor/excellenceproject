"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorker } from "tesseract.js";

export default function TaskSenseiRagTest() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [files, setFiles] = useState([]);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const router = useRouter();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    if (file.type === "text/plain") {
      setExtractedText( await file.text());
      return;
    }
    setSelectedImage(file);
    setIsLoading(true);

    try {
      const worker = await createWorker();

      const {
        data: { text },
      } = await worker.recognize(file);
      setExtractedText(text);

      await worker.terminate();
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Error extracting text from image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    setSources([]);

    try {
      const formData = new FormData();
      if (extractedText) {
        formData.append("extractedText", extractedText);
      }
      formData.append("prompt", prompt);

      // Add files to FormData
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/tasksensei/ragapi", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResponse(data.response);
      } else {
        setResponse(`Error: ${data.message}`);
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setFiles([]);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">
          RAG Chat Interface
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Upload Image for OCR (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*, text/plain"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                />
              </div>

              {selectedImage && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              )}

              {isLoading && (
                <div className="text-center text-blue-600">
                  Extracting text from image...
                </div>
              )}

              {extractedText && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Extracted Text:
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {extractedText}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="prompt"
                  className="text-sm font-medium text-gray-700"
                >
                  Enter your question
                </label>
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ask a question..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-2 rounded-md text-white font-medium
                                    ${
                                      loading
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }`}
              >
                {loading ? "Processing..." : "Submit Question"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Response</h2>
            <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
              {response ? (
                <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
              ) : (
                <p className="text-gray-500">Response will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
