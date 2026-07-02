import type { ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

import { ToolShowContainer } from "./ToolCall";

type DisplayToolResponseProps = {
  message: ToolMessage;
};

export default function DisplayToolResponse({
  message,
}: DisplayToolResponseProps) {
  const [showToolCall, setShowToolCall] = useState(false);

  const handleDownload = (filename: string, content: string) => {
    const decodedText = atob(content);
    const blob = new Blob([decodedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  console.log(typeof message.content);
  return (
    <div className="top-0">
      {/* Toggle Button */}
      <button
        onClick={() => setShowToolCall((prev) => !prev)}
        className="w-full px-3 py-1 mb-3 text-sm font-semibold text-black transition hover:cursor-pointer"
      >
        {showToolCall ? (
          <ToolShowContainer>
            Hide Tool Response <FaArrowUp />
          </ToolShowContainer>
        ) : (
          <ToolShowContainer>
            Show Tool Response <FaArrowDown />
          </ToolShowContainer>
        )}
      </button>

      {/* Conditional Render */}
      {showToolCall && (
        <div className="border-t-2 border-b-2 border-gray-300 p-3 rounded-md bg-gray-50">
          <div key={message.id} className="p-2 border-b last:border-none">
            <div className="font-semibold text-gray-800">
              Tool Response: {String(message.content)}
              <br />
              Status: {message.status ?? "unknown"}
              {message.name === "prepare_file" &&
                (() => {
                  let data;

                  try {
                    data = JSON.parse(String(message.content));
                    console.log(data);
                  } catch (err) {
                    console.error(
                      "Invalid JSON in message.content:",
                      message.content,
                    );
                    return (
                      <div className="text-red-600">
                        Error parsing file data
                      </div>
                    );
                  }

                  return (
                    <div className="mt-2 p-3 bg-green-50 border border-green-400 rounded-md">
                      <p className="font-medium text-green-700">
                        📄 A downloadable file is ready:
                      </p>

                      <button
                        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                        onClick={() =>
                          handleDownload(data.filename, data.base64)
                        }
                      >
                        Download {data.filename}
                      </button>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
