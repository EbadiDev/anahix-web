/**
 * Graphite Design System & Theme Constants (Vibe Farsi)
 * Centralizes theme configuration and storage keys across the client.
 */

export const THEME_STORAGE_KEY = 'anahix-theme' as const
export const LIKED_ARTICLES_KEY = 'anahix_liked_articles' as const
export const VIRTUAL_ORDERS_KEY = 'anahix_virtual_orders' as const
export const CUSTOMER_ORDERS_KEY = 'anahix_customer_orders' as const

export type ThemeMode = 'dark' | 'light'

export const GRAPHITE_TOKENS = {
  radius: '0.625rem',
  motion: '200ms',
  motionEase: 'cubic-bezier(0.2, 0, 0, 1)',
  shapeControl: 'calc(var(--radius) - 2px)',
  shapeField: 'calc(var(--radius) - 2px)',
  shapeSurface: 'calc(var(--radius) + 12px)',
  shapeOverlay: 'calc(var(--radius) + 4px)',
} as const
