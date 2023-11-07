import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import HttpsRedirect from "react-https-redirect";
import NkAuthProvider from "./nk-auth/NkAuthProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HttpsRedirect disabled={import.meta.env.DEV}>
      <NkAuthProvider
        redirectCallback={(state, code) => {
          console.log(state);
          console.log(code);
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
