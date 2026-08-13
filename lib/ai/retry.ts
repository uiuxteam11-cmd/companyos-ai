export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryable?: (error: unknown) => boolean;
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy,
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => Promise<void> | void,
): Promise<T> {
  const maxAttempts = Math.max(1, policy.maxAttempts);
  const baseDelayMs = policy.baseDelayMs ?? 250;
  const maxDelayMs = policy.maxDelayMs ?? 2000;
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      return await operation();
    } catch (error) {
      const shouldRetry = attempt < maxAttempts && (policy.retryable ? policy.retryable(error) : true);
      if (!shouldRetry) {
        throw error;
      }

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      if (onRetry) {
        await onRetry(attempt, error, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
