import { Coins, CreditCard, Landmark, Wallet } from 'lucide-react'
import type React from 'react'

export interface GatewayDisplayInfo {
  label: string
  icon: React.ReactNode
  badgeClass: string
}

// Local cache of gateway custom icons (populated from localStorage or registered at runtime)
const GATEWAY_CACHE_KEY = 'anahix_gateway_icons_registry'

export function registerPaymentGateways(
  gateways: {
    platform?: string
    icon?: string
    icon_url?: string
    name_fa?: string
    name?: string
  }[],
) {
  try {
    const existing = getRegisteredGatewaysMap()
    gateways.forEach((g) => {
      const plat = (g.platform || '').toLowerCase().trim()
      if (plat) {
        const iconUrl = g.icon_url || g.icon
        existing[plat] = {
          icon: iconUrl || existing[plat]?.icon || '',
          name: g.name_fa || g.name || existing[plat]?.name || '',
        }
      }
    })
    localStorage.setItem(GATEWAY_CACHE_KEY, JSON.stringify(existing))
  } catch {}
}

export function getRegisteredGatewaysMap(): Record<
  string,
  { icon?: string; name?: string }
> {
  try {
    const raw = localStorage.getItem(GATEWAY_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {}
  return {}
}

export function getGatewayDisplay(
  platform?: string | null,
  customIconUrl?: string | null,
): GatewayDisplayInfo {
  const p = (platform || '').toLowerCase().trim()
  const registry = getRegisteredGatewaysMap()
  const registered = registry[p]

  const effectiveIcon = customIconUrl || registered?.icon
  if (
    effectiveIcon &&
    (effectiveIcon.startsWith('/') || effectiveIcon.startsWith('http'))
  ) {
    return {
      label: registered?.name || getGatewayName(p),
      icon: (
        <img
          src={effectiveIcon}
          alt={p}
          className="w-4 h-4 object-contain rounded-xs brightness-90 dark:brightness-100"
          onError={(e) => {
            ;(e.target as HTMLElement).style.display = 'none'
          }}
        />
      ),
      badgeClass: 'bg-secondary text-foreground border-border/60',
    }
  }

  switch (p) {
    case 'balance':
    case 'wallet':
      return {
        label: 'کیف پول کاربر',
        icon: <Wallet className="w-3.5 h-3.5 text-emerald-500" />,
        badgeClass:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      }
    case 'zarinpal':
      return {
        label: 'درگاه زرین‌پال',
        icon: <CreditCard className="w-3.5 h-3.5 text-amber-500" />,
        badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      }
    case 'payping':
      return {
        label: 'درگاه پی‌پینگ',
        icon: <CreditCard className="w-3.5 h-3.5 text-blue-500" />,
        badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      }
    case 'card_to_card':
    case 'bank':
      return {
        label: 'کارت به کارت',
        icon: <Landmark className="w-3.5 h-3.5 text-blue-500" />,
        badgeClass:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    case 'crypto':
    case 'tether':
    case 'usdt':
      return {
        label: 'رمزارز (تتر / ترون)',
        icon: <Coins className="w-3.5 h-3.5 text-purple-400" />,
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      }
    default:
      return {
        label: platform ? getGatewayName(p) : 'پیش‌فرض',
        icon: <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />,
        badgeClass: 'bg-secondary text-muted-foreground border-border/40',
      }
  }
}

export function getGatewayName(platform: string): string {
  switch (platform) {
    case 'balance':
      return 'کیف پول کاربری'
    case 'zarinpal':
      return 'درگاه پرداخت زرین‌پال'
    case 'payping':
      return 'درگاه پرداخت پی‌پینگ'
    case 'card_to_card':
      return 'کارت به کارت شتابی'
    case 'crypto':
      return 'پرداخت کریپتو (تتر)'
    default:
      return platform
  }
}
