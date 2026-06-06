import {
  type AccountSummary,
  registerCurrentAccount,
} from "../api/generated/fountain-life-api";
import { assertResponseSuccess } from "./base-contracts";

export type AccountResponse = AccountSummary;

export class AccountsService {
  async registerCurrentUser() {
    const response = await registerCurrentAccount({});
    assertResponseSuccess(response.data);
    return response.data.account;
  }
}
