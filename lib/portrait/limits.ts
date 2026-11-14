/** Hard per-turn bounds for the live gateway agent. The reservation is computed from
 * these numbers, so raising one raises every turn's worst-case hold. */
export const AGENT_LIMITS = {
  /** Model calls per visitor turn; the last one has every tool removed. */
  calls: 3,
  /** Application-executed library tool calls per turn. */
  functionCalls: 4,
  /** Provider-executed web searches per turn (each billed separately). */
  webSearches: 2,
  /** max_output_tokens per call; includes reasoning tokens. */
  outputTokensPerCall: 1000,
  /** UTF-8 bytes of application-supplied input per call (system, history, data, tool results).
   * A byte is an upper bound on byte-level BPE tokens. Enforced before every dispatch. */
  inputBytesPerCall: 32000,
  /** Measured hidden tool framing the provider adds when web_search is offered (~4.5k
   * tokens on November 13, 2026), rounded up. */
  hiddenFramingTokens: 6000,
  /** Upper bound on search-content tokens one low-context web search injects (measured
   * ~4.1k), rounded up. A larger observed charge kills admission for reconciliation. */
  webSearchInputTokens: 12000,
  /** Provider response body ceiling per call. */
  responseBytes: 200_000,
  /** Single call deadline. */
  callTimeoutMs: 20000,
} as const;
/** Whole-turn deadline; an active reservation older than this becomes uncertain. */
export const TURN_DEADLINE_MS = 45000;
