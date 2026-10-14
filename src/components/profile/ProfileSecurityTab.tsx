import { CheckCircle2, Laptop, LogOut, Shield, Smartphone } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'
import type { CustomerProfile } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface ProfileSecurityTabProps {
  customer: CustomerProfile
  onLogout: () => void
}

function detectClientEnv(): { os: string; browser: string; isMobile: boolean } {
  const ua = navigator.userAgent
  let os = 'نامشخص'
  let browser = 'مرورگر استاندارد'
  let isMobile = false

  if (/android/i.test(ua)) {
    os = 'Android'
    isMobile = true
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS'
    isMobile = true
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS'
  } else if (/windows/i.test(ua)) {
    os = 'Windows'
  }

  if (/edg/i.test(ua)) {
    browser = 'Edge'
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome'
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox'
  } else if (/safari/i.test(ua)) {
    browser = 'Safari'
  }

  return { os, browser, isMobile }
}

export const ProfileSecurityTab: React.FC<ProfileSecurityTabProps> = ({
  customer,
  onLogout,
}) => {
  const clientEnv = useMemo(() => detectClientEnv(), [])

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Authentication Method */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="pb-4 border-b border-border/60">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            روش ورود به حساب
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            ورود به حساب کاربری با کد تایید یکبارمصرف پیامکی (OTP) محافظت می‌شود
          </p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  ورود با شماره موبایل
                </span>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1 px-2 py-0.5"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>تاییدشده</span>
                </Badge>
              </div>
              <p
                className="text-xs font-mono text-muted-foreground mt-0.5"
                dir="ltr"
              >
                {customer.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Session */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="pb-4 border-b border-border/60">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-600" />
            دستگاه و نشست فعال
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            دستگاهی که هم‌اکنون از طریق آن به حساب کاربری متصل هستید
          </p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {clientEnv.isMobile ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Laptop className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {clientEnv.browser} ({clientEnv.os})
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  نشست فعلی
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                دسترسی فعال به امکانات کاربری آناهیکس
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="h-9 px-4 rounded-xl text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold gap-1.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
