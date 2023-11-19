import { initQueryClient } from "@ts-rest/react-query";
import contract from "api-schema";
import React from "react";
import ReactDOM from "react-dom/client";
import HttpsRedirect from "react-https-redirect";
import App from "./App.tsx";
import QueryClientContext from "./QueryClientContext.ts";
import "./index.css";
import NkAuthProvider from "./nk-auth/NkAuthProvider.tsx";

const queryClient = initQueryClient(contract, {
  baseUrl: "",
  baseHeaders: {},
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HttpsRedirect disabled={import.meta.env.DEV}>
      <QueryClientContext.Provider value={queryClient}>
        <NkAuthProvider
          redirectCallback={(state, code) => {
            console.log(state);

            if (state.firstName == undefined || state.lastName == undefined) {
              console.log("state error");
              return;
            }

            void queryClient.nkAccounts.postNkAccount.mutation({
              body: {
                firstName: state.firstName,
                lastName: state.lastName,
                code: code,
              },
            });
          }}
          redirectError={() => {
            console.log("error");
          }}
        >
          <App />
        </NkAuthProvider>
      </QueryClientContext.Provider>
    </HttpsRedirect>
  </React.StrictMode>,
);
