import {
  ArrowLeft,
  ChevronLeft,
  Package,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { RangeSlider } from '../components/vibefarsi/RangeSlider'
import { api, apiService } from '../services/api'
import type { BannerItem, ContentCategory, Order, Product } from '../types'

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

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

  const [orders, setOrders] = useState<Order[]>(() =>
    apiService.getCustomerOrders(),
  )

  useEffect(() => {
    const currentSlug = slug || ''
    if (!currentSlug) return

    async function loadData() {
      setLoading(true)
      try {
        const [cats, allProds, catBanners] = await Promise.all([
          api.getContentCategories('product').catch(() => []),
          apiService.getProducts().catch(() => []),
          api.getBanners('category_header').catch(() => []),
        ])
        setCategoryBanners(catBanners)

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
          const matchedCat = cats.find(
            (c: ContentCategory) => c.slug === currentSlug,
          )

          if (matchedCat) {
            setCategory(matchedCat)
            setSubcategories(matchedCat.children || [])
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
    return products.filter((p) => {
      // Subcategory / Brand filter
      if (selectedSubcategory !== 'all') {
        const matchesGroup = p.group_tag === selectedSubcategory
        const matchesSlug = (p.slug || '')
          .toLowerCase()
          .includes(selectedSubcategory.toLowerCase())
        if (!matchesGroup && !matchesSlug) return false
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
  }, [
    products,
    selectedSubcategory,
    searchQuery,
    maxPrice,
    deliveryFilter,
    durationFilter,
  ])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-border/40 pb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">
              فروشگاه
            </Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-foreground font-bold">
              {category?.name || 'دسته‌بندی'}
            </span>
          </div>
        </div>

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

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-control border border-border/60 bg-muted/40 text-xs font-bold text-foreground">
                <span>
                  {toPersianDigits(filteredProducts.length)} محصول آماده سفارش
                </span>
              </div>
              <Link
                to="/"
                className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5"
              >
                <span>کاتالوگ کل</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
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

        {/* Subcategories Filter Chips if available */}
        {subcategories.length > 0 && (
          <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSubcategory('all')}
              className={`px-3.5 py-1.5 rounded-control text-xs font-bold whitespace-nowrap transition-all duration-motion ease-motion cursor-pointer ${
                selectedSubcategory === 'all'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              همه سرویس‌ها
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubcategory(sub.slug)}
                className={`px-3.5 py-1.5 rounded-control text-xs font-bold whitespace-nowrap transition-all duration-motion ease-motion cursor-pointer ${
                  selectedSubcategory === sub.slug
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </section>
        )}

        {/* Category Filters Bar: Search, Price Range & Delivery Type (Vibe Farsi Graphite) */}
        <section className="rounded-surface border border-border/60 bg-card p-5 space-y-4 shadow-surface duration-motion ease-motion">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search within Category */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={`جستجو در ${category?.name || 'این دسته‌بندی'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pr-9 pl-4 text-xs rounded-field bg-muted/30 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
              <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Delivery Mode & Duration Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Delivery Filter */}
              <div className="flex items-center gap-1.5 self-start md:self-auto bg-muted/40 p-1 rounded-control border border-border/40">
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('all')}
                  className={`px-3 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    deliveryFilter === 'all'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  همه شیوه‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('instant')}
                  className={`px-3 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    deliveryFilter === 'instant'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  تحویل آنی
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('manual_timed')}
                  className={`px-3 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    deliveryFilter === 'manual_timed'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ارتقای شخصی
                </button>
              </div>

              {/* Duration Filter */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-control border border-border/40">
                <button
                  type="button"
                  onClick={() => setDurationFilter('all')}
                  className={`px-2.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    durationFilter === 'all'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  همه دوره‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setDurationFilter('1m')}
                  className={`px-2.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    durationFilter === '1m'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ۱ ماهه
                </button>
                <button
                  type="button"
                  onClick={() => setDurationFilter('3m')}
                  className={`px-2.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    durationFilter === '3m'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ۳ ماهه
                </button>
                <button
                  type="button"
                  onClick={() => setDurationFilter('12m')}
                  className={`px-2.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    durationFilter === '12m'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ۱۲ ماهه
                </button>
                <button
                  type="button"
                  onClick={() => setDurationFilter('long')}
                  className={`px-2.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                    durationFilter === 'long'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ۱۸ ماهه+
                </button>
              </div>
            </div>
          </div>

          {/* Vibe Farsi Range Slider for Category Price Filtering */}
          <div className="pt-2 max-w-sm">
            <RangeSlider
              min={200000}
              max={10000000}
              step={100000}
              value={maxPrice}
              onChange={(val) => setMaxPrice(val)}
              label="فیلتر بر اساس سقف قیمت:"
            />
          </div>
        </section>

        {/* Products Grid for this Category */}
        <section>
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
                  setSelectedSubcategory('all')
                }}
                className="mt-2 h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
              >
                پاکسازی فیلترها
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => {}}
                />
              ))}
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
        }}
      />
    </div>
  )
}
