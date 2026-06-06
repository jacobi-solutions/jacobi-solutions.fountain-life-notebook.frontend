import type { ApiClient } from "./api-client";
import type { components } from "../api/generated/fountain-life-api";
import type { BaseResponse } from "./base-contracts";
import { unwrapResponse } from "./base-contracts";

export type AccountResponse = components["schemas"]["AccountResponseDto"];

export class AccountsService {
  constructor(private readonly api: ApiClient) {}

  async registerCurrentUser() {
    return unwrapResponse(
      await this.api.post<BaseResponse<AccountResponse>>("/accounts/register", {}),
    );
  }
}
