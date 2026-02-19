import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import 'shaka-player/dist/controls.css';

// DevTools protection temporarily disabled
// TODO: Re-enable when needed

createRoot(document.getElementById("root")!).render(<App />);
