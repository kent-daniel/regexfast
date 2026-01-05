// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied."
} as const;

// Token limit for sessions
export const TOKEN_LIMIT = 250_000;

export const SUBAGENT_STATUS_DATA_PART_TYPE = "data-subagent-status" as const;

export type SubagentPhase = "generating" | "executing" | "evaluating";

export type SubagentStatusEvent = {
  toolCallId: string;
  agent: string;
  phase: SubagentPhase;
  iteration?: number;
  maxIterations?: number;
  message?: string;
  at: string;
};
