import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Get the worker URL based on environment
 */
function getWorkerUrl(): string {
  // Check for explicit environment variable first
  if (process.env.AGENT_WORKER_URL) {
    return process.env.AGENT_WORKER_URL;
  }
  
  // Default to localhost for development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8787";
  }
  
  // Production worker URL
  return "https://agent-worker-do.outwork.workers.dev";
}

/**
 * POST /api/regex/test
 * 
 * Proxies regex test requests to the agent worker's regex-test endpoint.
 */
export async function POST(request: NextRequest) {
  const workerUrl = getWorkerUrl();
  
  try {
    const body = await request.json();
    
    const response = await fetch(`${workerUrl}/api/regex/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response from worker:", text);
      return NextResponse.json(
        { error: `Worker returned non-JSON response: ${text}` },
        { status: response.status || 502 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Regex test proxy error:", error);
    
    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to worker at ${workerUrl}. Is it running?` },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to proxy request to worker" },
      { status: 500 }
    );
  }
}
