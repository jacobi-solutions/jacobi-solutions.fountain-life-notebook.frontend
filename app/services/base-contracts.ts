import type { BaseRequest as GeneratedBaseRequest, ErrorInfo } from "../api/generated/fountain-life-api";

export type BaseRequest<TPayload = unknown> = GeneratedBaseRequest & {
  payload?: TPayload;
};

export type BaseResponse<TData = unknown> = {
  correlationId?: string;
  data?: TData;
  errors: ErrorInfo[];
  isSuccess: boolean;
};

export function unwrapResponse<TData>(response: BaseResponse<TData>): TData {
  if (response.isSuccess) {
    return response.data as TData;
  }

  const message =
    response.errors.map((error) => error.errorMessage).filter(Boolean).join("; ") ||
    "The API request failed.";
  throw new Error(message);
}
