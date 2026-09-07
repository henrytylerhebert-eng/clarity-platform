import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RevOps } from "./workspaces/RevOps";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname.endsWith("/rev-ops") ? <RevOps /> : <App />}
  </StrictMode>,
);
