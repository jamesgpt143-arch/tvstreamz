import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import 'shaka-player/dist/controls.css';

// DevTools protection disabled temporarily
// if (import.meta.env.PROD) {
//   document.addEventListener('contextmenu', (e) => e.preventDefault());
//   document.addEventListener('keydown', (e) => {
//     if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) e.preventDefault();
//   });
//   (function loop() { setInterval(() => { (function(){return false;})['constructor']('debugger')['call'](); }, 50); })();
// }

createRoot(document.getElementById("root")!).render(<App />);
