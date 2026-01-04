import { Match } from "@/models";
import { getRegexUseCase } from "@/use-cases/use-cases";

export const runtime = "edge";

export async function POST(request: Request): Promise<Response> {
  try {
    const { pattern, text, flag } = await request.json();

    if (!text || text.length === 0 || !pattern || pattern.length === 0) {
      return Response.json({ status: "invalid", timeSpent: "0", matches: [] });
    }

    const { status, timeSpent, matches } = await getRegexUseCase(
      pattern,
      text,
      flag
    );

    return Response.json({
      status,
      timeSpent: timeSpent.toFixed(2),
      matches,
    });
  } catch (error) {
    return Response.json({ status: "invalid", timeSpent: "0", matches: [] });
  }
}
