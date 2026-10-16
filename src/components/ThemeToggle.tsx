import { Moon, Sun } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

export const ThemeToggle: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anahix-theme')
      if (saved === 'light' || saved === 'dark') return saved
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
    localStorage.setItem('anahix-theme', theme)
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
