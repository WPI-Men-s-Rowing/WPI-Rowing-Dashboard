import axios, { AxiosResponse } from "axios";
import { PostAuthCodes } from "common";
import React from "react";
import ReactDOM from "react-dom/client";
import HttpsRedirect from "react-https-redirect";
import { z } from "zod";
import App from "./App.tsx";
import "./index.css";
import NkAuthProvider from "./nk-auth/NkAuthProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HttpsRedirect disabled={import.meta.env.DEV}>
      <NkAuthProvider
        redirectCallback={(state, code) => {
          console.log(state);

          // Post the auth code
          type PostAuthCodeType = z.infer<typeof PostAuthCodes>;
          void axios.post<PostAuthCodeType, AxiosResponse<void>>(
            "/api/nk-accounts/auth-codes",
            {
              code: code,
            } satisfies PostAuthCodeType,
          );
        }}
        redirectError={() => {
          console.log("error");
        }}
      >
        <App />
      </NkAuthProvider>
    </HttpsRedirect>
  </React.StrictMode>,
);
