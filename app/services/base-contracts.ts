import type { components } from "../api/generated/fountain-life-api";

export interface ErrorDto {
  errorCode?: string;
  errorMessage: string;
}

export type BaseRequest<TPayload = unknown> = components["schemas"]["BaseRequestDto"] & {
  payload?: TPayload;
};

export type BaseResponse<TData = unknown> = {
  correlationId?: string;
  data?: TData;
  errors: ErrorDto[];
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
