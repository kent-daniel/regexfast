// app/actions/matchRegex.ts
"use server";

export interface Match {
  index: number;
  text: string;
}

export async function getRegexMatches(
  pattern: string,
  text: string,
  flag: string,
  language: string
): Promise<Match[]> {
  try {
    const lan: string = language;
    const regex = new RegExp(pattern, flag || "");
    const matches: Match[] = [];

    if (text.length === 0 || pattern.length === 0) {
      return [];
    }
    const match = regex.exec(text);
    if (!flag.includes("g") && match) {
      return [{ index: match.index, text: match[0] }];
    }

    let currentMatch = match;
    while (currentMatch !== null) {
      matches.push({ index: currentMatch.index, text: currentMatch[0] });
      currentMatch = regex.exec(text);
    }

    return matches;
  } catch (error) {
    console.error("Error in getRegexMatches:", error);
    return [];
  }
}
