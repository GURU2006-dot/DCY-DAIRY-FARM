export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected server error';
}
