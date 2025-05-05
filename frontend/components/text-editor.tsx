"use client"

import type React from "react"
import { Loader2 } from "lucide-react"

interface TextEditorProps {
  text: string
  onTextChange: (text: string) => void
  onTransform: () => void
  isLoading: boolean
}

const TextEditor: React.FC<TextEditorProps> = ({ text, onTextChange, onTransform, isLoading }) => {
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute right-4 top-4 flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          Processing...
        </div>
      )}

      <textarea
        placeholder="Enter your text here..."
        className="min-h-[320px] w-full resize-none border-0 bg-white p-5 text-[15px] leading-relaxed text-gray-800 outline-none focus:outline-none focus:ring-0"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            onTransform()
          }
        }}
      />
    </div>
  )
}

export default TextEditor
