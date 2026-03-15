import { useState, useEffect } from "react";

export type Theme = "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    localStorage.setItem("spark_theme", "dark");
  }, [theme]);

  return { theme, setTheme };
}
