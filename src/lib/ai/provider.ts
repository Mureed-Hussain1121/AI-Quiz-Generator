import type { AIProvider, GenerateQuizParams } from "./types";
import { GeminiProvider } from "./gemini";
import { buildQuizPrompt, parseAIResponse } from "./prompt";
import { aiQuizResponseSchema } from "@/lib/validations/quiz";
import type { AIQuizResponse } from "@/types/quiz";

// ── OpenAI-compatible provider (works for OpenAI, Groq, OpenRouter) ──────────

class OpenAICompatibleProvider implements AIProvider {
  public readonly name: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(name: string, apiKey: string, model: string, baseUrl: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async generateQuiz(params: GenerateQuizParams): Promise<AIQuizResponse> {
    const prompt = buildQuizPrompt(params);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        // OpenRouter requires a site URL header
        ...(this.name === "openrouter" && {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
          "X-Title": "AI Quiz Generator",
        }),
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert quiz generator. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 8192,
        response_format: { type: "json_object" }, // Works for OpenAI + Groq
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `${this.name} API error ${response.status}: ${errorText.slice(0, 200)}`
      );
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error(`${this.name} returned empty content`);
    }

    const parsed = parseAIResponse(rawContent);
    const validated = aiQuizResponseSchema.safeParse(parsed);

    if (!validated.success) {
      const issues = validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`AI response validation failed: ${issues}`);
    }

    return validated.data as AIQuizResponse;
  }
}

// ── Provider Factory ──────────────────────────────────────────

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER ?? "gemini";

  switch (providerName.toLowerCase()) {
    case "gemini":
      cachedProvider = new GeminiProvider();
      break;

    case "openai":
      cachedProvider = new OpenAICompatibleProvider(
        "openai",
        process.env.OPENAI_API_KEY ?? "",
        process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        "https://api.openai.com/v1"
      );
      break;

    case "groq":
      cachedProvider = new OpenAICompatibleProvider(
        "groq",
        process.env.GROQ_API_KEY ?? "",
        process.env.GROQ_MODEL ?? "llama-3.1-70b-versatile",
        "https://api.groq.com/openai/v1"
      );
      break;

    case "openrouter":
      cachedProvider = new OpenAICompatibleProvider(
        "openrouter",
        process.env.OPENROUTER_API_KEY ?? "",
        process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5",
        "https://openrouter.ai/api/v1"
      );
      break;

    default:
      console.warn(
        `Unknown AI_PROVIDER "${providerName}", falling back to Gemini`
      );
      cachedProvider = new GeminiProvider();
  }

  return cachedProvider;
}

// Re-export for convenience
export type { GenerateQuizParams };
