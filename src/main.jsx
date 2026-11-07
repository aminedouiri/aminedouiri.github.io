import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/panel.css";
import "./styles/controls.css";
import "./styles/frameworks.css";

// No <StrictMode>: it would build the 3D world twice in development.
createRoot(document.getElementById("root")).render(<App />);
