import { generateText } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { createClient } from "@/lib/supabase/server"

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// Extract YouTube video ID from various URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// Validate YouTube URL
function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.hostname === "www.youtube.com" ||
      parsedUrl.hostname === "youtube.com" ||
      parsedUrl.hostname === "youtu.be" ||
      parsedUrl.hostname === "m.youtube.com"
    )
  } catch {
    return false
  }
}

// Fetch transcript from Supadata.ai
async function getTranscript(videoId: string): Promise<{ text: string; title?: string }> {
  if (!SUPADATA_API_KEY) {
    throw new Error("SUPADATA_API_KEY не настроен")
  }

  const response = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
    {
      headers: {
        "x-api-key": SUPADATA_API_KEY,
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("[v0] Supadata API error:", errorData)

    if (response.status === 404) {
      throw new Error("Субтитры для этого видео недоступны")
    }
    if (response.status === 400) {
      throw new Error("Неверный формат ссылки на видео")
    }
    throw new Error("Не удалось получить субтитры видео")
  }

  const data = await response.json()

  if (!data.content || data.content.length === 0) {
    throw new Error("Субтитры для этого видео недоступны")
  }

  // Combine all transcript segments
  const fullText = data.content
    .map((segment: { text: string }) => segment.text)
    .join(" ")

  // Check video duration (approximately 150 words per minute)
  const wordCount = fullText.split(/\s+/).length
  const estimatedMinutes = wordCount / 150

  if (estimatedMinutes > 15) {
    throw new Error("Видео слишком длинное. Поддерживаются видео до 15 минут")
  }

  return {
    text: fullText,
    title: data.title,
  }
}

// Generate summary using LLM via OpenRouter
async function generateSummary(transcript: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY не настроен")
  }

  const openrouter = createOpenRouter({
    apiKey: OPENROUTER_API_KEY,
  })

  const systemPrompt = `Ты - эксперт по созданию кратких изложений видеоконтента. 
Твоя задача - создать информативное и структурированное краткое изложение на русском языке.

Правила:
1. Выдели основные идеи и ключевые моменты
2. Сохрани логическую структуру изложения
3. Используй понятный и грамотный русский язык
4. Избегай повторов и воды
5. Изложение должно быть компактным, но информативным
6. Не добавляй информацию, которой нет в исходном тексте`

  const { text } = await generateText({
    model: openrouter("stepfun/step-3.5-flash:free"),
    system: systemPrompt,
    prompt: `Создай краткое изложение следующего транскрипта видео:\n\n${transcript}`,
    maxOutputTokens: 1500,
    temperature: 0.3,
  })

  return text
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    // Check generation limit
    const { data: remaining } = await (supabase as any).rpc("get_remaining_generations", {
      p_user_id: user.id,
    })

    if ((remaining ?? 0) <= 0) {
      return Response.json(
        { error: "Вы исчерпали лимит генераций (5). Обратитесь к администратору." },
        { status: 403 }
      )
    }

    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return Response.json(
        { error: "Пожалуйста, укажите ссылку на YouTube видео" },
        { status: 400 }
      )
    }

    if (!isValidYouTubeUrl(url)) {
      return Response.json(
        { error: "Пожалуйста, укажите корректную ссылку на YouTube видео" },
        { status: 400 }
      )
    }

    const videoId = extractVideoId(url)

    if (!videoId) {
      return Response.json(
        { error: "Не удалось извлечь ID видео из ссылки" },
        { status: 400 }
      )
    }

    console.log("[v0] Processing video:", videoId)

    // Get transcript
    const { text: transcript, title } = await getTranscript(videoId)
    console.log("[v0] Got transcript, length:", transcript.length)

    // Generate summary
    const summary = await generateSummary(transcript)
    console.log("[v0] Generated summary, length:", summary.length)

    // Record the generation
    await (supabase as any).from("user_generations").insert({
      user_id: user.id,
      video_url: url,
    })

    return Response.json({
      title,
      summary,
    })
  } catch (error) {
    console.error("[v0] Error processing video:", error)

    const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка"

    return Response.json(
      { error: message },
      { status: 500 }
    )
  }
}