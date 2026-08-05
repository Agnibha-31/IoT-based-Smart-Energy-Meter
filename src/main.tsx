
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/globals.css";
  import "./styles/theme-overrides.css";

  // Apply saved theme before React mounts to avoid flash
  (() => {
    try {
      const saved = localStorage.getItem('smartmeter_theme') || 'dark';
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = saved === 'dark' || (saved === 'auto' && prefersDark);
      document.documentElement.classList.toggle('dark', useDark);
      const useLight = saved === 'light' || (saved === 'auto' && !prefersDark);
      document.documentElement.classList.toggle('theme-light', useLight);
    } catch {}
  })();

  createRoot(document.getElementById("root")!).render(<App />);
  