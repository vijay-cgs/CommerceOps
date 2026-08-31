export type ApiSuccessEnvelope<T> = {
  success: true;
  correlationId: string;
  data: T;
};

export type ApiErrorEnvelope = {
  success: false;
  correlationId: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
