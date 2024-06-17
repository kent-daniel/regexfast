// app/actions/matchRegex.ts
"use server";

export interface Match {
  index: number;
  text: string;
}

export async function getRegexMatches(
  pattern: string,
  text: string
): Promise<Match[]> {
  try {
    const regex = new RegExp(pattern, "g");
    const matches: Match[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({ index: match.index, text: match[0] });
    }

    return matches;
  } catch (error) {
    console.error("Error while matching regex:", error);
    throw new Error("Internal server error");
  }
}
