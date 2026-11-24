import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "@fontsource/lato/latin-400.css";
import "@fontsource/lato/latin-400-italic.css";
import "@fontsource/literata/latin-400.css";
import "@fontsource/fraunces/latin-400.css";
import "@fontsource/newsreader/latin-400.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/caveat/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-400.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
