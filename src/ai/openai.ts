import type { AIProvider, AIContext } from "./provider.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./provider.js";
import { DEFAULT_OPENAI_MODEL } from "../config/defaults.js";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_OPENAI_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateCommitMessage(diff: string, context: AIContext): Promise<string> {
    let OpenAI: any;
    try {
      const module = await import("openai");
      OpenAI = module.default || module.OpenAI;
    } catch {
      throw new Error(
        "OpenAI SDK not installed. Run: npm install openai"
      );
    }

    const client = new OpenAI({ apiKey: this.apiKey });

    const response = await client.chat.completions.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(diff, context) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return content.trim();
  }
}
