import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiSuccessEnvelope } from "../../types/api-envelope";

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiSuccessEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessEnvelope<T>> {
    const request = context.switchToHttp().getRequest();
    const correlationId: string = request.correlationId ?? "unknown";

    return next.handle().pipe(
      map((data) => ({
        success: true,
        correlationId,
        data,
      })),
    );
  }
}
