import type { BaseResponse, ErrorInfo } from "../api/generated/fountain-life-api";

export type ApiBaseResponse = BaseResponse & {
  correlationId?: string;
  errors: ErrorInfo[];
  isSuccess: boolean;
};

export function assertResponseSuccess(response: ApiBaseResponse) {
  if (response.isSuccess) {
    return;
  }

  const message =
    response.errors.map((error) => error.errorMessage).filter(Boolean).join("; ") ||
    "The API request failed.";
  throw new Error(message);
}
