import {
  ChevronLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { Breadcrumb } from '../components/vibefarsi/Breadcrumb'
import { api, apiService } from '../services/api'
import type { Order, Product, ThemeSettings } from '../types'

export const OffersPage: React.FC = () => {
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dynamicCategories, setDynamicCategories] = useState<
    { id: string; label: string }[]
  >([])
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(9)
  const [sortBy, setSortBy] = useState<
    'discount' | 'price_asc' | 'price_desc' | 'sales'
  >('discount')
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)

  const [orders] = useState<Order[]>(() => apiService.getCustomerOrders())

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [allProds, cats, theme] = await Promise.all([
          apiService.getProducts().catch(() => []),
          api.getContentCategories('product').catch(() => []),
          api.getThemeSettings().catch(() => null),
        ])

        if (theme) {
          setThemeSettings(theme)
        }

        const offers = (allProds || []).filter(
          (p: Product) =>
            p.is_flash_sale ||
            (p.discount_percent && p.discount_percent > 0) ||
            (p.original_price_toman && p.original_price_toman > p.price_toman),
        )
        setDiscountedProducts(offers)

        // Populate dynamic categories from database / products
        if (cats && Array.isArray(cats) && cats.length > 0) {
          setDynamicCategories([
            { id: 'all', label: 'همه تخفیف‌ها' },
            ...cats.map((c: any) => ({ id: c.slug, label: c.name })),
          ])
        } else {
          const uniqueGroups = Array.from(
            new Set(
              offers
                .map((p) => p.group_title_fa || p.group_tag || p.category)
                .filter(Boolean),
            ),
          )
          setDynamicCategories([
            { id: 'all', label: 'همه تخفیف‌ها' },
            ...uniqueGroups.map((g: any) => ({ id: g, label: g })),
          ])
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredOffers = useMemo(() => {
    const list = discountedProducts.filter((p) => {
      if (categoryFilter !== 'all') {
        const matchesCat = p.category === categoryFilter
        const matchesGroup =
          p.group_tag === categoryFilter || p.group_title_fa === categoryFilter
        if (!matchesCat && !matchesGroup) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchFa = (p.title_fa || '').toLowerCase().includes(q)
        const matchEn = (p.title_en || '').toLowerCase().includes(q)
        const matchDesc = (p.description_fa || '').toLowerCase().includes(q)
        if (!matchFa && !matchEn && !matchDesc) return false
      }

      return true
    })

    return list.sort((a, b) => {
      if (sortBy === 'discount') {
        const discA =
          a.discount_percent ||
          (a.original_price_toman && a.original_price_toman > a.price_toman
            ? ((a.original_price_toman - a.price_toman) /
                a.original_price_toman) *
              100
            : 0)
        const discB =
          b.discount_percent ||
          (b.original_price_toman && b.original_price_toman > b.price_toman
            ? ((b.original_price_toman - b.price_toman) /
                b.original_price_toman) *
              100
            : 0)
        return discB - discA
      }
      if (sortBy === 'price_asc') {
        return a.price_toman - b.price_toman
      }
      if (sortBy === 'price_desc') {
        return b.price_toman - a.price_toman
      }
      if (sortBy === 'sales') {
        return (b.sales_count || 0) - (a.sales_count || 0)
      }
      return 0
    })
  }, [discountedProducts, categoryFilter, searchQuery, sortBy])

  const totalPages = Math.ceil(filteredOffers.length / pageSize) || 1
  const paginatedOffers = filteredOffers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

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
        {/* Unified Graphite Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: 'جشنواره تخفیف‌ها و آفرها' }]} />

        {/* Hero Header Banner (Dynamic Texts from Admin, Home button removed per request) */}
        <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 shadow-surface duration-motion ease-motion relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-radial-[at_top_left] from-brand/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 text-right space-y-2">
            <div className="inline-flex items-center gap-2 rounded-control border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-500">
              <Flame className="h-3.5 w-3.5 animate-pulse" />
              <span>
                {themeSettings?.offers_badge_text ||
                  'جشنواره سراسری تخفیف‌های زمان‌دار آناهیکس'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              {themeSettings?.offers_title ||
                'آفرها و اشتراک‌های دارای تخفیف ویژه'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {themeSettings?.offers_subtitle ||
                'کلیه لایسنس‌ها و اشتراک‌های هوش مصنوعی که هم‌اکنون با تخفیف نقدی ویژه ۲۰٪ تا ۵۰٪ از پنل مدیریت عرضه شده‌اند.'}
            </p>
          </div>
        </section>

        {/* Filter and Search Toolbar (Sleek Dropdowns matching Order Table - Image 4 Request) */}
        <div className="bg-card rounded-surface border border-border/80 p-3.5 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Dynamic Category & Page Size Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                دسته‌بندی:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
              >
                {dynamicCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                مرتب‌سازی:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 px-2.5 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
              >
                <option value="discount">بیشترین تخفیف</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="sales">پرفروش‌ترین</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                تعداد:
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="h-9 px-2.5 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer font-latin"
              >
                <option value={9}>۹ در صفحه</option>
                <option value={18}>۱۸ در صفحه</option>
                <option value={27}>۲۷ در صفحه</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="جستجو در تخفیف‌ها..."
              className="h-9 pr-9 pl-3 w-full sm:w-60 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Discounted Products Grid ONLY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <span>محصولات تخفیف‌دار آماده تحویل</span>
            </h2>
            <span className="text-xs text-muted-foreground font-latin font-bold">
              {Number(filteredOffers.length).toLocaleString('fa-IR')} محصول فعال
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-brand animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">
                در حال دریافت لیست محصولات تخفیف‌دار...
              </p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="rounded-surface border border-border/80 bg-card p-12 text-center text-muted-foreground space-y-3 shadow-surface">
              <HelpCircle className="h-10 w-10 mx-auto opacity-50" />
              <h3 className="font-bold text-foreground">
                محصولی با این مشخصات یافت نشد
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                می‌توانید فیلتر دسته‌بندی را تغییر دهید یا عبارت جستجو را پاک
                کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedOffers.map((product) => (
                  <ProductCard
                    key={`offer-prod-${product.id}`}
                    product={product}
                    onSelect={() => {}}
                  />
                ))}
              </div>

              {/* Full Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3.5 bg-card rounded-surface border border-border/80 shadow-surface text-xs">
                  <span className="text-muted-foreground">
                    صفحه {page} از {totalPages} (مجموع {filteredOffers.length}{' '}
                    محصول)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                      title="صفحه قبلی"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pNum) => (
                        <button
                          key={`offer-page-btn-${pNum}`}
                          type="button"
                          onClick={() => setPage(pNum)}
                          className={`w-7 h-7 rounded-control font-bold font-latin cursor-pointer transition-colors ${
                            page === pNum
                              ? 'bg-primary text-primary-foreground font-black'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {pNum}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                      title="صفحه بعدی"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
