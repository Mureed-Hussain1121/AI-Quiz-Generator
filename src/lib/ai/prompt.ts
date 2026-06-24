import type { GenerateQuizParams } from "./types";

/**
 * Builds the system prompt sent to any AI provider.
 * The prompt is engineered to:
 * 1. Prevent hallucination (only use PDF content)
 * 2. Return strict JSON
 * 3. Respect question type and difficulty
 */
export function buildQuizPrompt(params: GenerateQuizParams): string {
  const {
    extractedText,
    numberOfQuestions,
    difficulty,
    questionType,
    topicFocus,
    language,
    includeExplanations,
  } = params;

  // Truncate text to ~12000 chars to stay within token limits
  const truncatedText =
    extractedText.length > 12000
      ? extractedText.slice(0, 12000) + "\n\n[Content truncated for length]"
      : extractedText;

  const questionTypeInstruction = getQuestionTypeInstruction(questionType);
  const difficultyInstruction = getDifficultyInstruction(difficulty);
  const topicInstruction = topicFocus
    ? `Focus specifically on the topic: "${topicFocus}".`
    : "Cover the main topics from the content evenly.";

  const explanationInstruction = includeExplanations
    ? 'Include a clear "explanation" field for each question explaining why the answer is correct.'
    : 'Omit the "explanation" field (set it to null or omit it entirely).';

  const prompt = `You are an expert educational quiz generator. Your task is to create a high-quality quiz based STRICTLY on the provided PDF content.

STRICT RULES:
1. Generate questions ONLY from the provided PDF content. Do NOT use any external knowledge.
2. Return ONLY a valid JSON object. No markdown, no code blocks, no explanations outside JSON.
3. Do NOT hallucinate or invent information not present in the PDF.
4. Every question must be answerable from the provided text.
5. All text must be in ${language}.

PDF CONTENT:
---
${truncatedText}
---

QUIZ PARAMETERS:
- Number of questions: ${numberOfQuestions}
- Difficulty: ${difficulty} — ${difficultyInstruction}
- Question type: ${questionType} — ${questionTypeInstruction}
- Topic focus: ${topicInstruction}
- Explanations: ${explanationInstruction}

OUTPUT FORMAT — Return exactly this JSON structure and nothing else:
{
  "title": "A descriptive quiz title based on the PDF content",
  "difficulty": "${difficulty}",
  "questions": [
    ${getExampleQuestion(questionType, includeExplanations)}
  ]
}

QUESTION TYPE RULES:
${getTypeRules(questionType)}

Generate exactly ${numberOfQuestions} questions now.`;

  return prompt;
}

function getQuestionTypeInstruction(type: string): string {
  const map: Record<string, string> = {
    MCQ: "Generate multiple choice questions with exactly 4 options (A, B, C, D). The correctAnswer must be the full text of the correct option.",
    TRUE_FALSE:
      'Generate true/false questions. Options must be ["True", "False"]. The correctAnswer must be either "True" or "False".',
    SHORT_ANSWER:
      "Generate short answer questions. No options field. The correctAnswer should be a concise 1-3 sentence answer.",
    MIXED:
      "Generate a mix of MCQ, true/false, and short answer questions in roughly equal proportions.",
  };
  return map[type] ?? map["MCQ"];
}

function getDifficultyInstruction(difficulty: string): string {
  const map: Record<string, string> = {
    easy: "Use straightforward questions testing basic recall and definitions. Clear and unambiguous.",
    medium:
      "Use application and comprehension questions. Require understanding concepts, not just memorization.",
    hard: "Use analysis, synthesis, and evaluation questions. Require deep understanding and critical thinking.",
  };
  return map[difficulty] ?? map["medium"];
}

function getExampleQuestion(type: string, includeExplanations: boolean): string {
  const expField = includeExplanations
    ? '"explanation": "The answer is correct because..."'
    : '"explanation": null';

  if (type === "MCQ" || type === "MIXED") {
    return `{
      "type": "mcq",
      "question": "What is the main concept described?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      ${expField}
    }`;
  }
  if (type === "TRUE_FALSE") {
    return `{
      "type": "true_false",
      "question": "The concept X means Y.",
      "options": ["True", "False"],
      "correctAnswer": "True",
      ${expField}
    }`;
  }
  return `{
    "type": "short_answer",
    "question": "Explain the main concept.",
    "options": null,
    "correctAnswer": "The main concept is...",
    ${expField}
  }`;
}

function getTypeRules(type: string): string {
  const rules: Record<string, string> = {
    MCQ: `- type: must be "mcq"
- options: array of exactly 4 strings
- correctAnswer: must match one of the options exactly`,
    TRUE_FALSE: `- type: must be "true_false"
- options: must be ["True", "False"]
- correctAnswer: must be "True" or "False"`,
    SHORT_ANSWER: `- type: must be "short_answer"
- options: must be null or omitted
- correctAnswer: a clear 1-3 sentence answer`,
    MIXED: `- For MCQ: type="mcq", 4 options, correctAnswer matches an option
- For True/False: type="true_false", options=["True","False"]
- For Short Answer: type="short_answer", options=null`,
  };
  return rules[type] ?? rules["MCQ"];
}

/**
 * Safely parses the raw AI string response into JSON.
 * Handles cases where the model wraps output in markdown code blocks.
 */
export function parseAIResponse(raw: string): unknown {
  let cleaned = raw.trim();

  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  // Extract JSON object if there's surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON. Raw response: ${raw.slice(0, 200)}`
    );
  }
}
