import { initContract } from "@ts-rest/core";
import nkAccounts from "./routes/nk-accounts.ts";

const contract = initContract();
export default contract.router(
  {
    nkAccounts: nkAccounts,
  },
  {
    validateResponseOnClient: true,
    strictStatusCodes: true,
    pathPrefix: "/api",
  },
);
