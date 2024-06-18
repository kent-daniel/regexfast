// app/actions/matchRegex.ts
"use server";

export interface Match {
  index: number;
  text: string;
}

export async function getRegexMatches(
  pattern: string,
  text: string,
  flag: string
): Promise<Match[]> {
  try {
    const regex = new RegExp(pattern, flag || "");
    const matches: Match[] = [];
    const match = regex.exec(text);

    if (!flag && match) {
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
    throw new Error("Internal server error");
  }
}
