export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: string;
  traceId?: string;
  path: string;
  timestamp: string;
}
