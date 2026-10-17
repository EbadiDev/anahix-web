import { Moon, Sun } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, type ThemeMode } from '../constants/theme'

export const ThemeToggle: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved === 'light' || saved === 'dark') return saved as ThemeMode
      return 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`h-9 w-9 rounded-control border-line bg-card hover:bg-muted text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center justify-center transition-all shadow-control cursor-pointer ${className}`}
      title={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
      aria-label="تغییر تم"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-brand transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-foreground transition-all" />
      )}
      <span className="sr-only">تغییر تم</span>
    </button>
  )
}
