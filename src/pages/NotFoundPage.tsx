import {
  Compass,
  FileQuestion,
  Headphones,
  Home,
  Package,
  Search,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { Breadcrumb } from '../components/vibefarsi/Breadcrumb'
import { ScrollReveal } from '../components/vibefarsi/ScrollReveal'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/category/all?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200"
    >
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full flex flex-col justify-center items-center text-center space-y-8 my-auto">
        {/* Breadcrumb Navigation */}
        <div className="w-full text-right">
          <Breadcrumb items={[{ label: 'صفحه ۴۰۴ یافت نشد' }]} />
        </div>

        <ScrollReveal>
          <div className="space-y-6 max-w-xl mx-auto">
            {/* 404 Visual Hero */}
            <div className="relative flex items-center justify-center">
              <div className="text-7xl sm:text-9xl font-black font-latin tracking-tighter text-muted/50 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-surface bg-secondary text-brand border border-border/80 flex items-center justify-center shadow-overlay animate-bounce duration-1000">
                  <Compass className="w-10 h-10 text-brand" />
                </div>
              </div>
            </div>

            {/* Explanatory Content */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                صفحه مورد نظر یافت نشد!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                متأسفانه صفحه‌ای که به دنبال آن بودید وجود ندارد، حذف شده یا آدرس
                (URL) آن اشتباه وارد شده است.
              </p>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در سرویس‌ها و مقالات آناهیکس..."
                className="w-full h-11 pr-10 pl-24 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute left-1.5 top-1.5 h-8 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all shadow-control cursor-pointer"
              >
                جستجو
              </button>
            </form>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-right">
              <Link
                to="/"
                className="p-3.5 rounded-surface border border-border/80 bg-card hover:border-brand/40 shadow-surface transition-all flex items-center gap-3 group select-none"
              >
                <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-xs">
                  <Home className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-foreground group-hover:text-brand transition-colors">
                    صفحه اصلی فروشگاه
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    بازگشت به ویترین و آخرین اخبار
                  </p>
                </div>
              </Link>

              <Link
                to="/offers"
                className="p-3.5 rounded-surface border border-border/80 bg-card hover:border-brand/40 shadow-surface transition-all flex items-center gap-3 group select-none"
              >
                <div className="w-9 h-9 rounded-control bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-xs">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-foreground group-hover:text-brand transition-colors">
                    جشنواره تخفیف‌ها و آفرها
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    مشاهده لایسنس‌های دارای تخفیف ویژه
                  </p>
                </div>
              </Link>

              <Link
                to="/category/all"
                className="p-3.5 rounded-surface border border-border/80 bg-card hover:border-brand/40 shadow-surface transition-all flex items-center gap-3 group select-none"
              >
                <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-foreground group-hover:text-brand transition-colors">
                    کاتالوگ کلیه اشتراک‌ها
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    دسترسی به تمام مدل‌های هوش مصنوعی
                  </p>
                </div>
              </Link>

              <Link
                to="/help"
                className="p-3.5 rounded-surface border border-border/80 bg-card hover:border-brand/40 shadow-surface transition-all flex items-center gap-3 group select-none"
              >
                <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-foreground group-hover:text-brand transition-colors">
                    مرکز پشتیبانی و راهنما
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    راهنمای فعال‌سازی و رفع تحریم‌ها
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
