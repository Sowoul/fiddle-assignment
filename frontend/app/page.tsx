"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import TextEditor from "@/components/text-editor"

export default function Home() {
  const [text, setText] = useState("")
  const [tone, setTone] = useState(50)
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID())
    }
  }, [sessionId])

  const transformText = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to transform",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          tone,
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to transform text")
      }

      const data = await response.json()
      setText(data.transformed)
      if (data.session_id) {
        setSessionId(data.session_id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/undo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to undo")
      }

      const data = await response.json()
      setText(data.text)
    } catch (error) {
      toast({
        title: "Cannot Undo",
        description: error instanceof Error ? error.message : "No more history to undo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/redo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to redo")
      }

      const data = await response.json()
      setText(data.text)
    } catch (error) {
      toast({
        title: "Cannot Redo",
        description: error instanceof Error ? error.message : "No more history to redo",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetHistory = async () => {
    setIsLoading(true)
    try {
      await fetch("http://localhost:5000/api/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      setText("")
      setTone(50)
      toast({
        title: "Reset Complete",
        description: "Text editor has been reset",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FC] p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <TextEditor text={text} onTextChange={setText} onTransform={transformText} isLoading={isLoading} />

          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUndo}
                  disabled={isLoading}
                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRedo}
                  disabled={isLoading}
                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetHistory}
                  disabled={isLoading}
                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={transformText}
                disabled={isLoading || !text.trim()}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white"
                size="sm"
              >
                {isLoading ? "Transforming..." : "Transform"}
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Casual</span>
                <span className="font-medium text-gray-700">Tone: {tone}</span>
                <span>Formal</span>
              </div>
              <Slider
                value={[tone]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setTone(value[0])}
                disabled={isLoading}
                className="py-1"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
