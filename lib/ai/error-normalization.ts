export type NormalizedAiErrorCode =
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "PROVIDER_ERROR"
  | "RATE_LIMIT_ERROR"
  | "TIMEOUT_ERROR"
  | "TOOL_ERROR"
  | "VALIDATION_ERROR"
  | "CANCELLED_ERROR"
  | "UNKNOWN_ERROR";

export type NormalizedAiError = {
  code: NormalizedAiErrorCode;
  message: string;
  retryable: boolean;
  statusCode?: number;
  metadata?: Record<string, unknown>;
};

export function normalizeAiError(error: unknown, fallbackMessage = "AI execution failed."): NormalizedAiError {
  if (error instanceof Error) {
    const message = error.message || fallbackMessage;
    const lower = message.toLowerCase();

    if (lower.includes("unauthorized") || lower.includes("auth")) {
      return { code: "AUTHENTICATION_ERROR", message, retryable: false, statusCode: 401 };
    }
    if (lower.includes("not authorized") || lower.includes("permission")) {
      return { code: "AUTHORIZATION_ERROR", message, retryable: false, statusCode: 403 };
    }
    if (lower.includes("timeout")) {
      return { code: "TIMEOUT_ERROR", message, retryable: true, statusCode: 408 };
    }
    if (lower.includes("rate limit") || lower.includes("429")) {
      return { code: "RATE_LIMIT_ERROR", message, retryable: true, statusCode: 429 };
    }
    if (lower.includes("cancel")) {
      return { code: "CANCELLED_ERROR", message, retryable: false, statusCode: 409 };
    }
    if (lower.includes("tool")) {
      return { code: "TOOL_ERROR", message, retryable: false, statusCode: 400 };
    }
    if (lower.includes("validation") || lower.includes("invalid") || lower.includes("required")) {
      return { code: "VALIDATION_ERROR", message, retryable: false, statusCode: 400 };
    }
    if (lower.includes("openai") || lower.includes("provider") || lower.includes("fetch")) {
      return { code: "PROVIDER_ERROR", message, retryable: true, statusCode: 502 };
    }

    return { code: "UNKNOWN_ERROR", message, retryable: false, statusCode: 500 };
  }

  return { code: "UNKNOWN_ERROR", message: fallbackMessage, retryable: false, statusCode: 500 };
}

export function maskAiErrorForClient(error: NormalizedAiError | unknown) {
  const normalized = error instanceof Object && "code" in error ? (error as NormalizedAiError) : normalizeAiError(error);
  return {
    code: normalized.code,
    message: normalized.message,
    retryable: normalized.retryable,
  };
}
