type RetryOptions = {
  attempts?: number;
  delayMs?: number;
};

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));

export const withRetry = async <T>(
  operation: () => Promise<T>,
  { attempts = 2, delayMs = 700 }: RetryOptions = {},
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await wait(delayMs);
    }
  }

  throw lastError;
};
