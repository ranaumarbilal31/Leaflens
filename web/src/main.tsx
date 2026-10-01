import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root")!;
const page = (
  <React.StrictMode>
    <App path={window.location.pathname} />
  </React.StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, page);
else createRoot(root).render(page);
