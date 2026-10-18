import {
  ArrowLeft,
  Flame,
  Gift,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { ArrowLink } from '../components/vibefarsi/ArrowLink'
import { ScrollReveal } from '../components/vibefarsi/ScrollReveal'
import { api, apiService } from '../services/api'
import type { BannerItem, Order, Product } from '../types'

export const OffersPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  const [orders] = useState<Order[]>(() => apiService.getCustomerOrders())

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [allBanners, allProds] = await Promise.all([
          api.getAdminBanners().catch(() => []),
          apiService.getProducts().catch(() => []),
        ])

        const activeBanners = (allBanners || []).filter(
          (b: BannerItem) => b.is_active,
        )
        setBanners(activeBanners)

        const offers = (allProds || []).filter(
          (p: Product) =>
            p.is_flash_sale ||
            (p.discount_percent && p.discount_percent > 0) ||
            (p.original_price_toman && p.original_price_toman > p.price_toman),
        )
        setDiscountedProducts(offers)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredBanners = banners.filter((b) => {
    if (selectedFilter === 'all') return true
    return b.position === selectedFilter
  })

  const getPositionBadge = (pos?: string) => {
    switch (pos) {
      case 'main_slider':
        return 'اسلایدر هیرو'
      case 'middle_strip':
        return 'بنر دوقلو میانی'
      case 'flash_sale':
        return 'جشنواره تخفیف'
      case 'hero_side':
        return 'کنار هیرو'
      case 'category_header':
        return 'هدر دسته‌بندی‌ها'
      default:
        return 'پروموشن ویژه'
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200"
    >
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground select-none">
          <Link to="/" className="hover:text-foreground transition-colors">
            صفحه اصلی
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">
            جشنواره آفرها و پروموشن‌های ویژه
          </span>
        </nav>

        {/* Hero Header Banner */}
        <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 shadow-surface duration-motion ease-motion relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-radial-[at_top_left] from-brand/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-right">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-control border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                <Gift className="h-3.5 w-3.5" />
                <span>جشنواره سراسری پروموشن‌ها و تخفیف‌ها</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                آفرها، بنرهای ویژه و اشتراک‌های تخفیف‌دار آناهیکس
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                کلیه پیشنهادهای شگفت‌انگیز، بنرهای جشنواره‌ای زمان‌دار و اشتراک‌های
                هوش مصنوعی با بیشترین درصد تخفیف نقدی در این صفحه گردآوری
                شده‌اند.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/"
                className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground duration-motion active:scale-[0.98] flex items-center gap-1.5 shadow-control"
              >
                <span>بازگشت به خانه</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Filter Tabs for Offer Types */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {[
            { id: 'all', label: 'همه آفرها و بنرها', count: banners.length },
            {
              id: 'middle_strip',
              label: 'بنرهای میانی دوقلو',
              count: banners.filter((b) => b.position === 'middle_strip')
                .length,
            },
            {
              id: 'flash_sale',
              label: 'جشنواره شگفت‌انگیز',
              count: banners.filter((b) => b.position === 'flash_sale').length,
            },
            {
              id: 'hero_side',
              label: 'کنار هیرو',
              count: banners.filter((b) => b.position === 'hero_side').length,
            },
            {
              id: 'main_slider',
              label: 'اسلایدر اصلی',
              count: banners.filter((b) => b.position === 'main_slider').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-control transition-all whitespace-nowrap shrink-0 cursor-pointer duration-motion active:scale-[0.98] flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-control font-latin font-bold ${
                  selectedFilter === tab.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Section 1: Promotional Banners Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <span>بنرهای تبلیغاتی و فرصت‌های فعال</span>
            </h2>
            <span className="text-xs text-muted-foreground font-latin">
              {filteredBanners.length} بنر فعال
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-brand animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">
                در حال بارگذاری آفرها و بنرها...
              </p>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="rounded-surface border border-border/80 bg-card p-12 text-center text-muted-foreground space-y-3 shadow-surface">
              <HelpCircle className="h-10 w-10 mx-auto opacity-50" />
              <h3 className="font-bold text-foreground">
                بنری در این بخش یافت نشد
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                در حال حاضر بنر فعالی با این فیلتر ثبت نشده است.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBanners.map((b) => (
                <div
                  key={b.id}
                  className="group relative overflow-hidden rounded-surface border border-border/80 bg-card shadow-surface hover:border-brand/40 duration-motion transition-all flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-5 text-right text-white space-y-1.5 select-none">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-control bg-slate-950/85 backdrop-blur-md text-sky-300 border border-sky-400/30 text-[11px] font-black shadow-control">
                          {getPositionBadge(b.position)}
                        </span>
                        {b.badge_text && (
                          <span className="px-2.5 py-0.5 rounded-control bg-brand text-white font-black text-[11px] shadow-control">
                            {b.badge_text}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-sm sm:text-base text-white">
                        {b.title}
                      </h3>
                      {b.subtitle && (
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                          {b.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between text-xs">
                    <Link
                      to={b.link_url || '/'}
                      className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
                    >
                      <span>{b.button_text || 'مشاهده و خرید'}</span>
                      <span>←</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Discounted Products Catalog */}
        {discountedProducts.length > 0 && (
          <ScrollReveal>
            <section className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <Flame className="h-5 w-5 text-rose-500" />
                    <span>محصولات و اشتراک‌های دارای تخفیف ویژه</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    کلیه اشتراک‌هایی که هم‌اکنون تخفیف نقدی یا قیمت شگفت‌انگیز
                    دارند
                  </p>
                </div>

                <ArrowLink to="/category/all?discount=true">
                  مشاهده در کاتالوگ با فیلتر
                </ArrowLink>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {discountedProducts.map((product) => (
                  <ProductCard
                    key={`offer-prod-${product.id}`}
                    product={product}
                    onSelect={() => {}}
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
