import {
  type AccountSummary,
  registerCurrentAccount,
} from "../api/generated/fountain-life-api";
import { unwrapResponse } from "./base-contracts";

export type AccountResponse = AccountSummary;

export class AccountsService {
  async registerCurrentUser() {
    const response = await registerCurrentAccount({});
    return unwrapResponse(response.data);
  }
}
