import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootAnalytics } from "./lib/analytics";

// Initialize dataLayer + consent mode before React renders.
// If the user previously accepted analytics, GTM loads immediately.
bootAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
