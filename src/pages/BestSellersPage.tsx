import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Star,
  TrendingUp,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { Breadcrumb } from '../components/vibefarsi/Breadcrumb'
import { LoadingState } from '../components/vibefarsi/LoadingState'
import { SearchInput } from '../components/vibefarsi/SearchInput'
import { api, apiService } from '../services/api'
import type { Order, Product } from '../types'
import { getSiteBrandName } from '../utils/brand'
import { formatNumber } from '../utils/formatters'

export const BestSellersPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<
    'sales' | 'rating' | 'price_asc' | 'price_desc'
  >('sales')
  const [dynamicCategories, setDynamicCategories] = useState<
    { id: string; label: string }[]
  >([])
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(9)

  const [orders] = useState<Order[]>(() => apiService.getCustomerOrders())

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [allProds, cats] = await Promise.all([
          apiService.getProducts().catch(() => []),
          api.getContentCategories('product').catch(() => []),
        ])

        // Best sellers or popular items
        const popular = (allProds || []).filter(
          (p: Product) =>
            p.is_best_seller ||
            (p.sales_count && p.sales_count > 0) ||
            (p.rating_average && p.rating_average >= 4.8),
        )

        // If fewer than 3, fallback to all available products sorted by sales
        const bestItems = popular.length > 0 ? popular : allProds
        setProducts(bestItems)

        if (cats && Array.isArray(cats) && cats.length > 0) {
          setDynamicCategories([
            { id: 'all', label: 'همه دسته‌بندی‌ها' },
            ...cats.map((c: any) => ({ id: c.slug, label: c.name })),
          ])
        } else {
          const uniqueGroups = Array.from(
            new Set(
              bestItems
                .map((p) => p.group_title_fa || p.group_tag || p.category)
                .filter(Boolean),
            ),
          )
          setDynamicCategories([
            { id: 'all', label: 'همه دسته‌بندی‌ها' },
            ...uniqueGroups.map((g: any) => ({ id: g, label: g })),
          ])
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredAndSorted = useMemo(() => {
    const list = products.filter((p) => {
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
      if (sortBy === 'sales') {
        return (b.sales_count || 0) - (a.sales_count || 0)
      }
      if (sortBy === 'rating') {
        return (b.rating_average || 0) - (a.rating_average || 0)
      }
      if (sortBy === 'price_asc') {
        return a.price_toman - b.price_toman
      }
      if (sortBy === 'price_desc') {
        return b.price_toman - a.price_toman
      }
      return 0
    })
  }, [products, categoryFilter, searchQuery, sortBy])

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1
  const paginatedProducts = filteredAndSorted.slice(
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
        <Breadcrumb items={[{ label: 'پرفروش‌ترین اشتراک‌ها و سرویس‌ها' }]} />

        {/* Hero Header Banner (Home button removed per request) */}
        <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 shadow-surface duration-motion ease-motion relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-radial-[at_top_left] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 text-right space-y-2">
            <div className="inline-flex items-center gap-2 rounded-control border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              <span>
                برترین و محبوب‌ترین اشتراک‌های {getSiteBrandName('پلی شاپ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              پرفروش‌ترین و محبوب‌ترین اشتراک‌های هوش مصنوعی
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              انتخاب اول برنامه‌نویسان، پژوهشگران و طراحان؛ سرویس‌هایی که با
              بیشترین رضایت خریداران و بالاترین امتیاز کیفی ثبت سفارش شده‌اند.
            </p>
          </div>
        </section>

        {/* Filter and Search Toolbar (Sleek Dropdown matching Order Table & Offers) */}
        <div className="bg-card rounded-surface border border-border/80 p-3.5 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Dynamic Category, Sorting & Page Size Dropdowns */}
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
                <option value="sales">بیشترین فروش</option>
                <option value="rating">بالاترین امتیاز</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
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

          {/* Search box with Debounce & Action Buttons */}
          <div className="w-full sm:w-60">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val)
                setPage(1)
              }}
              placeholder="جستجو در پرفروش‌ها..."
              debounceMs={250}
            />
          </div>
        </div>

        {/* Products Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <span>لیست اشتراک‌های پرفروش و محبوب</span>
            </h2>
            <span className="text-xs text-muted-foreground font-sans font-bold">
              {formatNumber(filteredAndSorted.length)} محصول آماده سفارش
            </span>
          </div>

          {loading ? (
            <LoadingState message="در حال دریافت محبوب‌ترین اشتراک‌ها..." />
          ) : filteredAndSorted.length === 0 ? (
            <div className="rounded-surface border border-border/80 bg-card p-12 text-center text-muted-foreground space-y-3 shadow-surface">
              <HelpCircle className="h-10 w-10 mx-auto opacity-50" />
              <h3 className="font-bold text-foreground">
                محصولی با این مشخصات یافت نشد
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                می‌توانید فیلتر دسته‌بندی را تغییر دهید یا عبارت جستجو را پاک
                نمایید.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={`bestseller-page-${product.id}`}
                    product={product}
                    onSelect={() => {}}
                  />
                ))}
              </div>

              {/* Full Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3.5 bg-card rounded-surface border border-border/80 shadow-surface text-xs">
                  <span className="text-muted-foreground">
                    صفحه {page} از {totalPages} (مجموع{' '}
                    {filteredAndSorted.length} محصول)
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
                          key={`bestseller-page-btn-${pNum}`}
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
