"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UrlInput } from "@/components/url-input"
import { SummaryResult } from "@/components/summary-result"
import { HydrationWrapper } from "@/components/hydration-wrapper"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, LogOut, Loader2 } from "lucide-react"

interface SummaryResponse {
  title?: string
  summary?: string
  error?: string
}

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SummaryResponse | null>(null)
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loadingGenerations, setLoadingGenerations] = useState(true)

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? null)
        const { data } = await (supabase as any).rpc("get_remaining_generations", { p_user_id: user.id })
        setRemainingGenerations(data ?? 0)
      }
      setLoadingGenerations(false)
    }
    loadUserData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSubmit = async (url: string) => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ error: data.error || "Произошла ошибка при обработке видео" })
      } else {
        setResult(data)
        // Обновить счётчик оставшихся генераций
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          const { data: gens } = await (supabase as any).rpc("get_remaining_generations", { p_user_id: userData.user.id })
          setRemainingGenerations(gens ?? 0)
        }
      }
    } catch (error) {
      console.error("[v0] Error submitting URL:", error)
      setResult({ error: "Не удалось связаться с сервером. Попробуйте позже." })
    } finally {
      setIsLoading(false)
    }
  }

  const isLimitReached = remainingGenerations === 0

  return (
    <HydrationWrapper>
      <main className="min-h-screen flex flex-col items-center justify-start px-4 py-12 md:py-20">
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          {/* Header with user info */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Play className="h-6 w-6" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  YouTube Summary
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {email && (
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {email}
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Выйти
                </Button>
              </div>
            </div>

            {/* Generations counter */}
            <div className="flex items-center gap-2">
              {loadingGenerations ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Badge variant={isLimitReached ? "destructive" : "default"}>
                    {remainingGenerations} / 5 генераций осталось
                  </Badge>
                  {isLimitReached && (
                    <span className="text-sm text-destructive">
                      Лимит исчерпан
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg text-pretty text-center">
              Получите краткое изложение любого YouTube видео за секунды
            </p>
          </div>

          <UrlInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            disabled={isLimitReached}
          />

          {result && (
            <SummaryResult
              title={result.title}
              summary={result.summary}
              error={result.error}
            />
          )}

          <footer className="mt-auto pt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Бесплатный сервис для экономии вашего времени
            </p>
          </footer>
        </div>
      </main>
    </HydrationWrapper>
  )
}