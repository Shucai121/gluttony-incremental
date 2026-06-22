import "./ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startGame } from "./engine/game";
import { useRender } from "./state/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Drive the game loop; bump the render store each tick so the UI samples live state.
startGame(() => useRender.getState().bump());
