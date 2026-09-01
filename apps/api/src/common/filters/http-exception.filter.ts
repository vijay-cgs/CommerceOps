import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response, Request } from "express";
import type { ApiErrorEnvelope } from "../../types/api-envelope";

@Catch()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = request.correlationId ?? "unknown";
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : "Unexpected server error";

    let errorCode = status >= 500 ? "internal_error" : "request_error";
    let errorMessage = message;
    let details: unknown;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const maybeCode = (exceptionResponse as { code?: unknown }).code;
        const maybeMessage = (exceptionResponse as { message?: unknown }).message;
        const maybeDetails = (exceptionResponse as { details?: unknown }).details;

        if (typeof maybeCode === "string" && maybeCode.length > 0) {
          errorCode = maybeCode;
        }

        if (Array.isArray(maybeMessage)) {
          errorCode = errorCode === "request_error" ? "validation_error" : errorCode;
          errorMessage = maybeMessage.join("; ");
          details = maybeMessage;
        } else if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
          errorMessage = maybeMessage;
        }

        if (errorMessage === "Bad Request Exception" || errorMessage === "Bad Request") {
          if (Array.isArray(details) && details.length > 0) {
            errorMessage = details.join("; ");
          } else {
            errorMessage = "Invalid input data. Please check required fields and formats.";
          }
        }

        if (typeof maybeDetails !== "undefined") {
          details = maybeDetails;
        }
      }
    }

    const body: ApiErrorEnvelope = {
      success: false,
      correlationId,
      error: {
        code: errorCode,
        message: errorMessage,
        details,
      },
    };

    response.status(status).json(body);
  }
}
