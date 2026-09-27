import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void }

const ThemeContext = createContext<ThemeContextValue>({ theme: "system", setTheme: () => undefined })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("supralinux-theme") as Theme) || "system")

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches)
      root.classList.toggle("dark", dark)
      root.style.colorScheme = dark ? "dark" : "light"
    }
    apply()
    media.addEventListener("change", apply)
    localStorage.setItem("supralinux-theme", theme)
    return () => media.removeEventListener("change", apply)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
