import { Lock, LogIn } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import { AuthModal } from '../AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const isLoggedIn = apiService.isCustomerLoggedIn()

  if (!isLoggedIn) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-200"
      >
        <div className="max-w-md w-full bg-card rounded-surface border border-border/80 p-8 shadow-overlay text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-surface bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-foreground">
              ورود به حساب کاربری الزامی است
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              برای مشاهده سوابق خرید، مدیریت کیف پول و پنل کاربری، لطفاً ابتدا
              وارد حساب کاربری خود شوید یا ثبت‌نام نمایید.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="flex-1 h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ورود یا ثبت‌نام سریع</span>
            </button>

            <Link
              to="/"
              className="h-10 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground duration-motion active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <span>بازگشت به خانه</span>
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          initialMode="login"
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => {
            setIsAuthOpen(false)
            window.location.reload()
          }}
        />
      </div>
    )
  }

  return <>{children}</>
}
