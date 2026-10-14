import { Moon, Sun } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anahix-theme')
      if (saved === 'light' || saved === 'dark') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
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
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg border-border text-foreground hover:bg-accent"
      title={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-blue-600 transition-all" />
      )}
      <span className="sr-only">تغییر تم</span>
    </Button>
  )
}
