import {
  AlertTriangle,
  BookOpen,
  Bot,
  Brain,
  ChevronLeft,
  Clock,
  Code,
  FileText,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Palette,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { api } from '../services/api'
import type {
  ContentCategory,
  HelpGuideListItem,
  ServiceTarget,
} from '../types'

export const HelpListPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const initialService = searchParams.get('service') || ''
  const initialSearch = searchParams.get('search') || ''

  const [guides, setGuides] = useState<HelpGuideListItem[]>([])
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [services, setServices] = useState<ServiceTarget[]>([])
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory)
  const [selectedService, setSelectedService] = useState<string>(initialService)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch)
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Fetch dynamic categories and service targets from database
  useEffect(() => {
    api
      .getContentCategories('help')
      .then((data) => setCategories(data))
      .catch((err) => console.error(err))

    api
      .getContentServices()
      .then((data) => setServices(data))
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => {
    setIsLoading(true)
    api
      .getHelpGuides({
        category: selectedCategory || undefined,
        service_target: selectedService || undefined,
        search: searchQuery || undefined,
        page_size: 30,
      })
      .then((res) => {
        setGuides(res.items || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false))
  }, [selectedCategory, selectedService, searchQuery])

  // Dynamic Icon resolver based on icon string saved in database
  const getCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      AlertTriangle,
      KeyRound,
      Radio,
      ShieldCheck,
      BookOpen,
      HelpCircle,
      LifeBuoy,
      Bot,
      Brain,
      Palette,
      Code,
      Zap,
      Sparkles,
    }
    return iconMap[iconName] || HelpCircle
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dir-rtl">
      <Header onOpenCart={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="flex-1 pb-16">
        {/* Help Hero Search */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-blue-50/60 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>پایگاه دانش و مرکز پشتیبانی هوشمند آناهیکس</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
              چگونه می‌توانیم به شما{' '}
              <span className="text-primary">کمک کنیم؟</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              پاسخ به سوالات پرتکرار، راهنماهای گام‌به‌گام رفع خطاهای Access
              Denied و ۴۰۳، نحوه دریافت پیامک در شماره‌های مجازی و قوانین
              گارانتی.
            </p>

            {/* Large Search Input */}
            <div className="max-w-2xl mx-auto mt-6 relative">
              <Search className="h-5 w-5 absolute right-4 top-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مشکل، ارور یا نام سرویس (مثلاً: عدم دریافت کد، خطای ۴۰۳، فعال‌سازی جمینای)..."
                className="w-full rounded-2xl border border-border bg-card/90 backdrop-blur-md pl-4 pr-12 py-3.5 text-sm shadow-md focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
          {/* Quick Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">
                دسته‌بندی موضوعی راهنماها
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.icon || '')
                const isSelected = selectedCategory === cat.slug

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(isSelected ? '' : cat.slug)
                    }
                    className={`p-5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/40 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {cat.article_count || 0} راهنما
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground mb-1">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {cat.description || 'راهنماهای اختصاصی این بخش'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Service Target Filter Pills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                فیلتر بر اساس سرویس هوش مصنوعی
              </h2>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="text-xs text-primary hover:underline"
                >
                  پاکسازی فیلتر دسته
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedService('')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  !selectedService
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                همه سرویس‌ها
              </button>
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedService(s.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    selectedService === s.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Help Guides List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>لیست مقالات راهنما و خطایابی</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({guides.length} مورد)
                </span>
              </h3>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-border bg-card animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : guides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guides.map((g) => (
                  <Link
                    key={g.id}
                    to={`/help/${g.slug}`}
                    className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary px-2.5 py-0.5 rounded-md bg-blue-500/10 text-[11px]">
                          {g.category_name}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span>{g.reading_time_minutes} دقیقه</span>
                          </span>
                          <span>•</span>
                          <span className="bg-muted px-1.5 py-0.2 rounded font-medium">
                            {g.difficulty}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                        {g.title}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {g.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold">
                        <ThumbsUp className="h-3 w-3" />
                        <span>
                          {g.helpful_yes} نفر این راهنما را مفید دانسته‌اند
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-primary font-semibold group-hover:underline">
                        <span>مشاهده راهنما</span>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-2xl p-6 space-y-3">
                <HelpCircle className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <h4 className="font-bold text-sm text-foreground">
                  راهنمایی با این عبارت یافت نشد
                </h4>
                <p className="text-xs text-muted-foreground">
                  می‌توانید مستقیماً با تیم پشتیبانی فنی در ارتباط باشید.
                </p>
              </div>
            )}
          </div>

          {/* Need More Help Banner */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 text-right">
              <h3 className="font-bold text-base text-foreground">
                هنوز پاسخ سوال یا مشکل خود را پیدا نکرده‌اید؟
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                کارشناسان فنی آناهیکس آماده‌اند تا در رفع خطاهای تحریم، راه‌اندازی
                اکانت و دریافت پیامک شماره‌های مجازی شما را راهنمایی کنند.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/profile"
                className="px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted font-bold text-xs transition-colors"
              >
                ثبت تیکت پشتیبانی
              </Link>
              <a
                href="https://t.me/AnahixSupport"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>پشتیبانی تلگرام</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
