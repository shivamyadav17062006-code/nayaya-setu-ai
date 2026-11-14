import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./i18n";
import "./index.css";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1e3,
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><QueryClientProvider client={queryClient}><App /><Toaster
    position="top-right"
    gutter={8}
    toastOptions={{
      duration: 4e3,
      style: {
        background: "#1E293B",
        color: "#F8FAFC",
        borderRadius: "12px",
        fontSize: "14px",
        fontFamily: "'Noto Sans', sans-serif"
      },
      success: {
        iconTheme: { primary: "#138808", secondary: "#fff" }
      },
      error: {
        iconTheme: { primary: "#EF4444", secondary: "#fff" }
      }
    }}
  /></QueryClientProvider></React.StrictMode>
);
