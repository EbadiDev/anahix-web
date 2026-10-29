import {
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { OrderSuccessModal } from '../components/OrderSuccessModal'
import { ProductCard } from '../components/ProductCard'
import { Breadcrumb } from '../components/vibefarsi/Breadcrumb'
import { RangeSlider } from '../components/vibefarsi/RangeSlider'
import { SearchInput } from '../components/vibefarsi/SearchInput'
import { api, apiService } from '../services/api'
import type { BannerItem, ContentCategory, Order, Product } from '../types'

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const isDiscountOnly =
    searchParams.get('discount') === 'true' ||
    slug === 'discounts' ||
    slug === 'flash-sale'

  const [category, setCategory] = useState<ContentCategory | null>(null)
  const [categoryBanners, setCategoryBanners] = useState<BannerItem[]>([])
  const [subcategories, setSubcategories] = useState<ContentCategory[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [successOrderModal, setSuccessOrderModal] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState<number>(10000000)
  const [deliveryFilter, setDeliveryFilter] = useState<
    'all' | 'instant' | 'manual_timed'
  >('all')
  const [durationFilter, setDurationFilter] = useState<
    'all' | '1m' | '3m' | '12m' | 'long'
  >('all')
  const [sortBy, setSortBy] = useState<
    'default' | 'price_asc' | 'price_desc' | 'sales'
  >('default')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(9)

  const [orders, setOrders] = useState<Order[]>(() =>
    apiService.getCustomerOrders(),
  )

  useEffect(() => {
    const currentSlug = slug || ''
    if (!currentSlug) return

    async function loadData() {
      setLoading(true)
      try {
        const [storeCats, allProds, catBanners] = await Promise.all([
          apiService.getStoreCategories().catch(() => []),
          apiService.getProducts().catch(() => []),
          api.getBanners('category_header').catch(() => []),
        ])
        setCategoryBanners(catBanners)

        if (allProds.length > 0) {
          const maxP = Math.max(...allProds.map((p) => p.price_toman || 0))
          if (maxP > 0) {
            setMaxPrice(Math.ceil(maxP / 500000) * 500000)
          }
        }

        if (isDiscountOnly) {
          setCategory({
            id: 'discounts',
            name: 'جشنواره محصولات و اشتراک‌های تخفیف‌دار',
            slug: 'discounts',
            type: 'product',
            icon: 'Flame',
            description:
              'لیست کلیه اشتراک‌ها و لایسنس‌هایی که از پنل ادمین با تخفیف ویژه قیمت‌گذاری شده‌اند',
            sort_order: 1,
            is_active: true,
          })
          setSubcategories([])
          const filtered = allProds.filter(
            (p: Product) =>
              p.is_flash_sale ||
              (p.discount_percent && p.discount_percent > 0) ||
              (p.original_price_toman &&
                p.original_price_toman > p.price_toman),
          )
          setProducts(filtered)
        } else {
          const matchedCat = storeCats.find((c: any) => c.slug === currentSlug)

          if (matchedCat) {
            setCategory({
              id: matchedCat.id,
              name: matchedCat.title_fa,
              slug: matchedCat.slug,
              type: 'product',
              icon: matchedCat.icon_url || 'Package',
              description: matchedCat.description || '',
              sort_order: matchedCat.sort_order || 1,
              is_active: matchedCat.is_active,
            })
            setSubcategories(
              (matchedCat.children || []).map((sub: any) => ({
                id: sub.id,
                name: sub.title_fa,
                slug: sub.slug,
                type: 'product',
                icon: sub.icon_url || 'Tag',
                sort_order: sub.sort_order || 1,
                is_active: sub.is_active,
              })),
            )
          } else {
            setCategory({
              id: currentSlug,
              name:
                currentSlug === 'all'
                  ? 'همه محصولات و اشتراک‌ها'
                  : currentSlug.replace(/_/g, ' '),
              slug: currentSlug,
              type: 'product',
              icon: 'Package',
              description:
                'لیست کامل محصولات و اشتراک‌های مرتبط با این دسته‌بندی',
              sort_order: 1,
              is_active: true,
            })
            setSubcategories([])
          }

          const filtered = allProds.filter(
            (p: Product) =>
              currentSlug === 'all' ||
              p.category === currentSlug ||
              (p.group_tag && p.group_tag === currentSlug),
          )
          setProducts(filtered)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [slug])

  // Filtered products within category based on price, delivery, and subcategory
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // Subcategory / Brand filter
      if (selectedSubcategory !== 'all') {
        const matchesCat = p.category === selectedSubcategory
        const matchesParent = p.parent_category_slug === selectedSubcategory
        const matchesGroup = p.group_tag === selectedSubcategory
        const matchesSlug = (p.slug || '')
          .toLowerCase()
          .includes(selectedSubcategory.toLowerCase())
        if (!matchesCat && !matchesParent && !matchesGroup && !matchesSlug)
          return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchTitleFa = p.title_fa.toLowerCase().includes(q)
        const matchTitleEn = p.title_en.toLowerCase().includes(q)
        const matchDesc = (p.description_fa || '').toLowerCase().includes(q)
        if (!matchTitleFa && !matchTitleEn && !matchDesc) return false
      }

      // Price filter
      const effectivePrice =
        p.is_flash_sale && p.flash_sale_price_toman
          ? p.flash_sale_price_toman
          : p.price_toman
      if (effectivePrice > maxPrice) return false

      // Delivery mode filter
      if (deliveryFilter === 'instant' && p.delivery_type !== 'instant')
        return false
      if (
        deliveryFilter === 'manual_timed' &&
        p.delivery_type !== 'manual_timed'
      )
        return false

      // Duration filter
      if (durationFilter !== 'all') {
        const plans = p.plans || []
        const hasPlanMatching = plans.some((plan) => {
          if (durationFilter === '1m') return plan.duration_days <= 31
          if (durationFilter === '3m')
            return plan.duration_days > 31 && plan.duration_days <= 95
          if (durationFilter === '12m')
            return plan.duration_days > 95 && plan.duration_days <= 370
          if (durationFilter === 'long') return plan.duration_days > 370
          return true
        })
        const productDays = p.duration_days || 30
        const matchesProductDuration = (() => {
          if (durationFilter === '1m') return productDays <= 31
          if (durationFilter === '3m')
            return productDays > 31 && productDays <= 95
          if (durationFilter === '12m')
            return productDays > 95 && productDays <= 370
          if (durationFilter === 'long') return productDays > 370
          return true
        })()
        if (!hasPlanMatching && !matchesProductDuration) return false
      }

      return true
    })

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_toman - b.price_toman
      if (sortBy === 'price_desc') return b.price_toman - a.price_toman
      if (sortBy === 'sales') return (b.sales_count || 0) - (a.sales_count || 0)
      return 0
    })
  }, [
    products,
    selectedSubcategory,
    searchQuery,
    maxPrice,
    deliveryFilter,
    durationFilter,
    sortBy,
  ])

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-8">
        {/* Unified Graphite Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: category?.name || 'دسته‌بندی' }]} />

        {/* Category Header Card - Graphite Technical Minimal */}
        <section className="rounded-surface border border-border/60 bg-card p-6 sm:p-8 shadow-surface duration-motion ease-motion">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-right">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-control border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                <span>دسته‌بندی اختصاصی فروشگاه</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {category?.name}
              </h1>
              {category?.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Promotional Category Header Banner from Admin */}
        {categoryBanners.length > 0 && (
          <section className="space-y-4">
            {categoryBanners.slice(0, 1).map((cb) => (
              <div
                key={cb.id}
                className="relative overflow-hidden rounded-surface border border-border/80 bg-card shadow-surface h-44 sm:h-56 select-none group"
              >
                <img
                  src={cb.image_url}
                  alt={cb.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex flex-col justify-end p-6 text-right text-white space-y-1.5">
                  {cb.badge_text && (
                    <span className="self-start px-2.5 py-0.5 rounded-control bg-brand text-white font-black text-xs shadow-control">
                      {cb.badge_text}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm">
                    {cb.title}
                  </h2>
                  {cb.subtitle && (
                    <p className="text-xs sm:text-sm text-white/90 max-w-xl line-clamp-2">
                      {cb.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Category Filters Bar: Search, Dropdowns, and Range Slider (matching /offers and /best-sellers) */}
        <div className="bg-card rounded-surface border border-border/80 p-3.5 shadow-surface flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Dynamic Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {subcategories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                  زیردسته:
                </span>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => {
                    setSelectedSubcategory(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
                >
                  <option value="all">همه سرویس‌ها</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                شیوه تحویل:
              </span>
              <select
                value={deliveryFilter}
                onChange={(e) => {
                  setDeliveryFilter(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 px-2.5 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
              >
                <option value="all">همه شیوه‌ها</option>
                <option value="instant">تحویل آنی</option>
                <option value="manual_timed">ارتقای شخصی</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-bold shrink-0">
                مدت دوره:
              </span>
              <select
                value={durationFilter}
                onChange={(e) => {
                  setDurationFilter(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 px-2.5 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
              >
                <option value="all">همه دوره‌ها</option>
                <option value="1m">۱ ماهه</option>
                <option value="3m">۳ ماهه</option>
                <option value="12m">۱۲ ماهه</option>
                <option value="long">۱۸ ماهه+</option>
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
                <option value="default">پیش‌فرض</option>
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

          {/* Search box with Debounce & Clear */}
          <div className="w-full sm:w-60">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val)
                setPage(1)
              }}
              placeholder="جستجو در این دسته‌بندی..."
              debounceMs={250}
            />
          </div>
        </div>

        {/* RangeSlider Card - Graphite Minimal Technical */}
        <div className="rounded-surface border border-border/80 bg-card p-4 sm:p-5 shadow-surface">
          <RangeSlider
            min={200000}
            max={10000000}
            step={100000}
            value={maxPrice}
            onChange={(val) => {
              setMaxPrice(val)
              setPage(1)
            }}
            label="فیلتر بر اساس سقف قیمت:"
            presets={[
              { label: 'تا ۲ میلیون', value: 2000000 },
              { label: 'تا ۴ میلیون', value: 4000000 },
              { label: 'تا ۷ میلیون', value: 7000000 },
              { label: 'همه مبالغ (نامحدود)', value: 10000000 },
            ]}
          />
        </div>

        {/* Products Grid for this Category */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" />
              <span>اشتراک‌های آماده سفارش {category?.name || ''}</span>
            </h2>
            <span className="text-xs text-muted-foreground font-latin font-bold">
              {Number(filteredProducts.length).toLocaleString('fa-IR')} محصول
              آماده سفارش
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-foreground animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">
                در حال بارگذاری محصولات دسته‌بندی...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-surface border border-border/60 bg-card p-12 text-center text-muted-foreground space-y-3 shadow-surface">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <h3 className="font-bold text-foreground">
                محصولی با این مشخصات یافت نشد
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                لطفاً فیلتر قیمت را افزایش داده یا عبارت جستجو را تغییر دهید.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setMaxPrice(10000000)
                  setDeliveryFilter('all')
                  setDurationFilter('all')
                  setSelectedSubcategory('all')
                  setPage(1)
                }}
                className="mt-2 h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
              >
                پاکسازی فیلترها
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
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
                    {Number(filteredProducts.length).toLocaleString('fa-IR')}{' '}
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
                          key={`cat-page-btn-${pNum}`}
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

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={null}
        payments={[]}
        onSubmit={async (data) => {
          setIsCartOpen(false)
          const newOrder = await apiService.createOrder(data)
          setOrders((prev) => [newOrder, ...prev])
          setSuccessOrderModal(newOrder)
        }}
      />

      {/* Post-Purchase Order Success & Fulfillment Modal */}
      <OrderSuccessModal
        isOpen={Boolean(successOrderModal)}
        order={successOrderModal}
        onClose={() => setSuccessOrderModal(null)}
      />
    </div>
  )
}
