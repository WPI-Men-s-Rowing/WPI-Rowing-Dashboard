import { initQueryClient } from "@ts-rest/react-query";
import contract from "api-schema";
import { createContext } from "react";

// Context for the query client
export default createContext(
  initQueryClient(contract, {
    baseUrl: "",
    baseHeaders: {},
  }),
);
