import type { AIProvider, AIContext } from "./provider.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./provider.js";
import { DEFAULT_ANTHROPIC_MODEL } from "../config/defaults.js";

export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCommitMessage(diff: string, context: AIContext): Promise<string> {
    let Anthropic: any;
    try {
      const module = await import("@anthropic-ai/sdk");
      Anthropic = module.default || module.Anthropic;
    } catch {
      throw new Error(
        "Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk"
      );
    }

    const client = new Anthropic({ apiKey: this.apiKey });

    const message = await client.messages.create({
      model: DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(diff, context),
        },
      ],
    });

    const textBlock = message.content.find((block: any) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Anthropic");
    }

    return textBlock.text.trim();
  }
}
