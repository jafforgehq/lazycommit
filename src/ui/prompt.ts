import { createInterface } from "node:readline";

export type UserAction = "approve" | "edit" | "reject" | "regenerate" | "ai";

export async function promptUser(hasAI: boolean): Promise<UserAction> {
  const labels = [
    "y: approve",
    "n: reject",
    "e: edit",
    "r: regenerate",
    ...(hasAI ? ["a: use AI"] : []),
  ];

  const prompt = `  ${labels.join("  |  ")}\n  > `;

  const answer = await readLine(prompt);
  const choice = answer.trim().toLowerCase();

  switch (choice) {
    case "y":
    case "yes":
      return "approve";
    case "e":
    case "edit":
      return "edit";
    case "n":
    case "no":
      return "reject";
    case "r":
    case "regenerate":
      return "regenerate";
    case "a":
    case "ai":
      return hasAI ? "ai" : "reject";
    default:
      return "approve"; // Default to approve on Enter
  }
}

export async function promptEdit(currentMessage: string): Promise<string> {
  console.log("  Edit the commit message (press Enter to confirm):");
  console.log();

  const lines = currentMessage.split("\n");
  const editedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const defaultValue = lines[i];
    const answer = await readLine(`  ${i === 0 ? "Subject" : `Line ${i + 1}`}: `, defaultValue);
    editedLines.push(answer);
  }

  // Allow adding new lines
  let addMore = true;
  while (addMore) {
    const answer = await readLine("  New line (empty to finish): ");
    if (answer.trim() === "") {
      addMore = false;
    } else {
      editedLines.push(answer);
    }
  }

  return editedLines.join("\n").trim();
}

function readLine(prompt: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer || defaultValue || "");
    });
  });
}
