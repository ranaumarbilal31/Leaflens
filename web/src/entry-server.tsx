import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";

export function render(path: string) {
  return renderToString(
    <React.StrictMode>
      <App path={path} />
    </React.StrictMode>,
  );
}
