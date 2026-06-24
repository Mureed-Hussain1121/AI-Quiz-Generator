import { GoogleGenAI } from "@google/genai";
import type { AIProvider, GenerateQuizParams } from "./types";
import { buildQuizPrompt, parseAIResponse } from "./prompt";
import { aiQuizResponseSchema } from "@/lib/validations/quiz";
import type { AIQuizResponse } from "@/types/quiz";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function logFullError(error: unknown) {
  console.error("========== FULL ERROR START ==========");

  if (error instanceof Error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  } else {
    console.error("Non-Error object:", error);
  }

  console.dir(error, { depth: null });
  console.error("========== FULL ERROR END ==========");
}

export class GeminiProvider implements AIProvider {
  public readonly name = "gemini";
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    console.log("========== GEMINI PROVIDER ==========");
    console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
    console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);
    console.log("GEMINI_API_KEY exists:", Boolean(apiKey));

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

    console.log("Using Gemini model:", this.modelName);
  }

  async generateQuiz(params: GenerateQuizParams): Promise<AIQuizResponse> {
    console.log("========== GEMINI generateQuiz START ==========");

    const basePrompt = buildQuizPrompt(params);

    const prompt = `
${basePrompt}

IMPORTANT OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT wrap JSON inside \`\`\`json.
- Do NOT add explanation outside the JSON.
- Follow the exact JSON structure requested above.
- Make sure every required field is present.
- The explanation field must always be a string.
- If explanations are disabled, use an empty string "" instead of null.
- Never use null for explanation.
`.trim();

    console.log("Prompt length:", prompt.length);
    console.log("Received params keys:", Object.keys(params as Record<string, unknown>));
    console.log("Difficulty:", (params as any).difficulty);
    console.log("Question count:", (params as any).questionCount);
    console.log("Question types:", (params as any).questionTypes);

    let rawResponse = "";

    try {
      console.log("Calling Gemini API...");

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      rawResponse = response.text || "";

      console.log("Gemini API call completed");
      console.log("Raw response length:", rawResponse.length);
      console.log("Raw response preview:");
      console.log(rawResponse.slice(0, 2000));
    } catch (error: unknown) {
      console.error("Gemini API call failed");
      logFullError(error);

      throw new Error(`Gemini API error: ${getErrorMessage(error)}`);
    }

    if (!rawResponse.trim()) {
      throw new Error("Gemini returned an empty response");
    }

    let parsed: unknown;

    try {
      console.log("Parsing Gemini response...");

      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        parsed = parseAIResponse(rawResponse);
      }

      console.log("Parsed response:");
      console.dir(parsed, { depth: null });
    } catch (error: unknown) {
      console.error("Failed to parse Gemini response");
      console.error("Raw response was:");
      console.log(rawResponse);
      logFullError(error);

      throw new Error(`AI response parsing failed: ${getErrorMessage(error)}`);
    }

    // Normalize Gemini response before Zod validation
    if (
      parsed &&
      typeof parsed === "object" &&
      "questions" in parsed &&
      Array.isArray((parsed as any).questions)
    ) {
      (parsed as any).questions = (parsed as any).questions.map((q: any) => ({
        ...q,
        explanation:
          typeof q.explanation === "string"
            ? q.explanation
            : "",
      }));
    }
    const validated = aiQuizResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("========== ZOD VALIDATION FAILED ==========");
      console.error("Validation issues:");
      console.dir(validated.error.issues, { depth: null });

      console.error("Parsed object that failed:");
      console.dir(parsed, { depth: null });

      const issues = validated.error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join(".") : "root";
          return `${path}: ${issue.message}`;
        })
        .join("; ");

      throw new Error(`AI response validation failed: ${issues}`);
    }

    console.log("Zod validation successful");
    console.log("========== GEMINI generateQuiz SUCCESS ==========");

    return validated.data as AIQuizResponse;
  }
}
