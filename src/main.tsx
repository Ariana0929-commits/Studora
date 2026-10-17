import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AccountBoundary } from "./Account";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><AccountBoundary><App /></AccountBoundary></React.StrictMode>
);
