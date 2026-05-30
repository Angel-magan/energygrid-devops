import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const savedMode = localStorage.getItem("eg_theme");
    if (savedMode) {
      return savedMode === "dark";
    }
    return true; 
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("eg_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("eg_theme", "light");
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);

  return { isDark, toggleDarkMode };
}
