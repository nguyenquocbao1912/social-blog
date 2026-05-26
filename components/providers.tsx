"use client"

import { SessionProvider } from "next-auth/react"
import { createContext, useContext, useEffect, useState } from "react"

export type ThemeMode = "light" | "dark"

type ThemeContextType = {
  theme: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light"

    const savedTheme = window.localStorage.getItem("pixelverse-theme") as ThemeMode
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light"
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem("pixelverse-theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark")

  // Return provider right away to avoid hydration mismatch layout issues,
  // the script in layout.tsx will handle initial HTML data-theme
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
