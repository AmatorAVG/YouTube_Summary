"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
  disabled?: boolean
}

export function UrlInput({ onSubmit, isLoading, disabled = false }: UrlInputProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 h-12 text-base bg-card border-input"
          disabled={isLoading || disabled}
          required
        />
        <Button 
          type="submit" 
          disabled={isLoading || disabled || !url.trim()}
          className="h-12 px-8 text-base font-medium"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Обработка...
            </>
          ) : (
            "Краткое содержание"
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Поддерживаются видео до 15 минут с субтитрами
      </p>
    </form>
  )
}
