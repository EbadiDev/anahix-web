import type React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type VibeFarsiThemeKey =
  | 'graphite'
  | 'lapis'
  | 'turquoise'
  | 'saffron'
  | 'pomegranate'
  | 'custom'

export interface ThemeConfig {
  id: VibeFarsiThemeKey
  nameFA: string
  nameEN: string
  primary: string
  primaryHover: string
  accent: string
  description: string
}

export const VIBE_THEMES: Record<VibeFarsiThemeKey, ThemeConfig> = {
  graphite: {
    id: 'graphite',
    nameFA: 'گرافیت (Graphite)',
    nameEN: 'Graphite',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    accent: '#3b82f6',
    description: 'سیستم طراحی ذغالی مات و مدرن فین‌تک با کنتراست فوق‌العاده بالا',
  },
  lapis: {
    id: 'lapis',
    nameFA: 'لاجوردی (Lapis)',
    nameEN: 'Lapis',
    primary: '#1d4ed8',
    primaryHover: '#1e40af',
    accent: '#60a5fa',
    description: 'آبی سلطنتی و لاجوردی اصیل و عمیق',
  },
  turquoise: {
    id: 'turquoise',
    nameFA: 'فیروزه‌ای (Turquoise)',
    nameEN: 'Turquoise',
    primary: '#0891b2',
    primaryHover: '#0e7490',
    accent: '#22d3ee',
    description: 'فیروزه‌ای شفاف نئونی با حس تازگی و سرعت',
  },
  saffron: {
    id: 'saffron',
    nameFA: 'زعفرانی (Saffron)',
    nameEN: 'Saffron',
    primary: '#d97706',
    primaryHover: '#b45309',
    accent: '#fbbf24',
    description: 'طلایی کهربایی زعفرانی گرم و لوکس',
  },
  pomegranate: {
    id: 'pomegranate',
    nameFA: 'اناری (Pomegranate)',
    nameEN: 'Pomegranate',
    primary: '#e11d48',
    primaryHover: '#be123c',
    accent: '#fb7185',
    description: 'قرمز یاقوتی اناری پرانرژی و جذاب ویژه جشنواره‌ها',
  },
  custom: {
    id: 'custom',
    nameFA: 'تم دلخواه (Custom)',
    nameEN: 'Custom',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    accent: '#3b82f6',
    description: 'انتخاب دلخواه رنگ اصلی و تاکیدی سازمانی',
  },
}

interface VibeThemeContextType {
  activeTheme: VibeFarsiThemeKey
  themeConfig: ThemeConfig
  customPrimary: string
  customAccent: string
  setTheme: (theme: VibeFarsiThemeKey) => void
  setCustomColors: (primary: string, accent: string) => void
}

const VibeThemeContext = createContext<VibeThemeContextType | undefined>(
  undefined,
)

export const VibeThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTheme, setActiveTheme] = useState<VibeFarsiThemeKey>(() => {
    const saved = localStorage.getItem('vibefarsi-theme') as VibeFarsiThemeKey
    return saved && VIBE_THEMES[saved] ? saved : 'graphite'
  })

  const [customPrimary, setCustomPrimary] = useState<string>(() => {
    return localStorage.getItem('vibefarsi-custom-primary') || '#2563eb'
  })

  const [customAccent, setCustomAccent] = useState<string>(() => {
    return localStorage.getItem('vibefarsi-custom-accent') || '#3b82f6'
  })

  const applyThemeVariables = useCallback(
    (themeKey: VibeFarsiThemeKey, pColor: string, aColor: string) => {
      const root = document.documentElement
      root.setAttribute('data-theme', themeKey)

      const color =
        themeKey === 'custom' ? pColor : VIBE_THEMES[themeKey].primary
      const accent =
        themeKey === 'custom' ? aColor : VIBE_THEMES[themeKey].accent

      root.style.setProperty('--primary-color', color)
      root.style.setProperty('--accent-color', accent)
    },
    [],
  )

  useEffect(() => {
    applyThemeVariables(activeTheme, customPrimary, customAccent)
  }, [activeTheme, customPrimary, customAccent, applyThemeVariables])

  const setTheme = useCallback((theme: VibeFarsiThemeKey) => {
    setActiveTheme(theme)
    localStorage.setItem('vibefarsi-theme', theme)
  }, [])

  const setCustomColors = useCallback((primary: string, accent: string) => {
    setCustomPrimary(primary)
    setCustomAccent(accent)
    localStorage.setItem('vibefarsi-custom-primary', primary)
    localStorage.setItem('vibefarsi-custom-accent', accent)
    setActiveTheme('custom')
    localStorage.setItem('vibefarsi-theme', 'custom')
  }, [])

  const currentConfig: ThemeConfig =
    activeTheme === 'custom'
      ? {
          ...VIBE_THEMES.custom,
          primary: customPrimary,
          accent: customAccent,
        }
      : VIBE_THEMES[activeTheme]

  return (
    <VibeThemeContext.Provider
      value={{
        activeTheme,
        themeConfig: currentConfig,
        customPrimary,
        customAccent,
        setTheme,
        setCustomColors,
      }}
    >
      {children}
    </VibeThemeContext.Provider>
  )
}

export const useVibeTheme = (): VibeThemeContextType => {
  const context = useContext(VibeThemeContext)
  if (!context) {
    throw new Error('useVibeTheme must be used within a VibeThemeProvider')
  }
  return context
}
