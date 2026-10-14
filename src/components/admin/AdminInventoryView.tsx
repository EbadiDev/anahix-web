import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  Key,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminProduct,
  CouponItem,
  InventoryItem,
  InventoryStats,
} from '../../types'

export const AdminInventoryView: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<
    'catalog' | 'inventory' | 'coupons'
  >('catalog')
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([])
  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Catalog search & filter state
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogGroupFilter, setCatalogGroupFilter] = useState('all')
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all')

  // Product Modal (Create / Edit) state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  )
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productFormError, setProductFormError] = useState('')

  // Product Form fields
  const [pTitleFA, setPTitleFA] = useState('')
  const [pTitleEN, setPTitleEN] = useState('')
  const [pSlug, setPSlug] = useState('')
  const [pCategory, setPCategory] = useState('ai_chat')
  const [pDeliveryType, setPDeliveryType] = useState<
    'instant' | 'manual_timed'
  >('instant')
  const [pGroupTag, setPGroupTag] = useState('general')
  const [pGroupTitleFA, setPGroupTitleFA] = useState('')
  const [pPriceToman, setPPriceToman] = useState<number>(500000)
  const [pBaseCostUSD, setPBaseCostUSD] = useState<number>(0)
  const [pSLAMin, setPSLAMin] = useState<number>(10)
  const [pSLAMax, setPSLAMax] = useState<number>(30)
  const [pSLAText, setPSLAText] = useState('تحویل ۱۰ الی ۳۰ دقیقه')
  const [pOperatingHours, setPOperatingHours] = useState('۹:۰۰ تا ۲۴:۰۰')
  const [pDescription, setPDescription] = useState('')
  const [pInstructions, setPInstructions] = useState('')
  const [pIsActive, setPIsActive] = useState(true)
  const [pDeliveryStrategy, setPDeliveryStrategy] = useState('manual_operator')

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(
    null,
  )
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportedKeys, setExportedKeys] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [copiedExport, setCopiedExport] = useState(false)

  // Replace Key Modal state
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [replaceOrderId, setReplaceOrderId] = useState('')
  const [replaceOldItemId, setReplaceOldItemId] = useState('')
  const [replaceReason, setReplaceReason] = useState('گارانتی تعویض اکانت')
  const [replaceLoading, setReplaceLoading] = useState(false)
  const [replaceSuccessMsg, setReplaceSuccessMsg] = useState('')
  const [replaceErrorMsg, setReplaceErrorMsg] = useState('')

  // Create Coupon Modal state
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>(
    'percentage',
  )
  const [couponValue, setCouponValue] = useState(10)
  const [minSpend, setMinSpend] = useState(0)
  const [maxDiscount, setMaxDiscount] = useState(0)
  const [perUserLimit, setPerUserLimit] = useState(1)
  const [maxUsage, setMaxUsage] = useState(100)
  const [createCouponLoading, setCreateCouponLoading] = useState(false)
  const [createCouponError, setCreateCouponError] = useState('')

  // Initial fetch
  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, couponsData, adminProdsData] = await Promise.all([
        apiService.getInventoryStats().catch(() => null),
        apiService.listCoupons().catch(() => []),
        apiService.adminListProducts().catch(() => []),
      ])
      if (statsData) setStats(statsData)
      setCoupons(couponsData)
      setAdminProducts(adminProdsData)

      // Fetch items
      const itemsRes = await apiService
        .listInventory(
          selectedProduct === 'all' ? undefined : selectedProduct,
          selectedStatus === 'all' ? undefined : selectedStatus,
        )
        .catch(() => ({ items: [], total: 0, page: 1, limit: 50 }))
      setItems(itemsRes.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Refetch items when filters change
  useEffect(() => {
    if (activeSubtab === 'inventory') {
      apiService
        .listInventory(
          selectedProduct === 'all' ? undefined : selectedProduct,
          selectedStatus === 'all' ? undefined : selectedStatus,
        )
        .then((res) => setItems(res.items || []))
        .catch(() => setItems([]))
    }
  }, [selectedProduct, selectedStatus, activeSubtab])

  const openCreateProductModal = () => {
    setEditingProduct(null)
    setPTitleFA('')
    setPTitleEN('')
    setPSlug('')
    setPCategory('ai_chat')
    setPDeliveryType('instant')
    setPGroupTag('general')
    setPGroupTitleFA('')
    setPPriceToman(500000)
    setPBaseCostUSD(0)
    setPSLAMin(10)
    setPSLAMax(30)
    setPSLAText('تحویل ۱۰ الی ۳۰ دقیقه')
    setPOperatingHours('۹:۰۰ تا ۲۴:۰۰')
    setPDescription('')
    setPInstructions('')
    setPIsActive(true)
    setPDeliveryStrategy('manual_operator')
    setProductFormError('')
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (p: AdminProduct) => {
    setEditingProduct(p)
    setPTitleFA(p.title_fa || '')
    setPTitleEN(p.title || '')
    setPSlug(p.slug || '')
    setPCategory(p.category || 'ai_chat')
    setPDeliveryType(p.delivery_type || 'instant')
    setPGroupTag(p.group_tag || 'general')
    setPGroupTitleFA(p.group_title_fa || '')
    setPPriceToman(p.price_toman || 0)
    setPBaseCostUSD(p.base_cost_usd || 0)
    setPSLAMin(p.sla_min_minutes || 10)
    setPSLAMax(p.sla_max_minutes || 30)
    setPSLAText(p.sla_display_text || '')
    setPOperatingHours(p.operating_hours || '')
    setPDescription(p.description || '')
    setPInstructions(p.instructions || '')
    setPIsActive(p.is_active !== false)
    setPDeliveryStrategy(p.delivery_strategy || 'manual_operator')
    setProductFormError('')
    setIsProductModalOpen(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pTitleFA.trim()) {
      setProductFormError('لطفاً عنوان فارسی محصول را وارد کنید')
      return
    }
    if (!pTitleEN.trim()) {
      setProductFormError('لطفاً عنوان انگلیسی محصول را وارد کنید')
      return
    }
    if (pPriceToman <= 0) {
      setProductFormError('قیمت فروش محصول به تومان باید بیشتر از صفر باشد')
      return
    }

    const slugFinal = pSlug.trim()
      ? pSlug.trim().toLowerCase().replace(/\s+/g, '-')
      : pTitleEN
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `prod-${Date.now()}`

    setProductSubmitting(true)
    setProductFormError('')

    const payload: Partial<AdminProduct> = {
      title_fa: pTitleFA.trim(),
      title: pTitleEN.trim(),
      slug: slugFinal,
      category: pCategory,
      delivery_type: pDeliveryType,
      group_tag: pGroupTag,
      group_title_fa: pGroupTitleFA.trim() || undefined,
      price_toman: Number(pPriceToman),
      base_cost_usd: Number(pBaseCostUSD) || 0,
      sla_min_minutes: Number(pSLAMin) || 10,
      sla_max_minutes: Number(pSLAMax) || 30,
      sla_display_text: pSLAText.trim(),
      operating_hours: pOperatingHours.trim(),
      description: pDescription.trim(),
      instructions: pInstructions.trim(),
      is_active: pIsActive,
      delivery_strategy: pDeliveryStrategy,
    }

    try {
      if (editingProduct) {
        await apiService.adminUpdateProduct(editingProduct.id, payload)
      } else {
        await apiService.adminCreateProduct(payload)
      }
      setIsProductModalOpen(false)
      loadData()
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در ثبت اطلاعات محصول')
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleToggleProductActive = async (p: AdminProduct) => {
    try {
      const updated = await apiService.adminUpdateProduct(p.id, {
        is_active: !p.is_active,
      })
      setAdminProducts((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, is_active: updated.is_active } : item,
        ),
      )
    } catch (err: any) {
      console.error('Error toggling product active status:', err)
    }
  }

  const openDeleteModal = (p: AdminProduct) => {
    setProductToDelete(p)
    setDeleteError('')
    setIsDeleteModalOpen(true)
  }

  const handleDeleteProductSubmit = async () => {
    if (!productToDelete) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await apiService.adminDeleteProduct(productToDelete.id)
      setIsDeleteModalOpen(false)
      setProductToDelete(null)
      loadData()
    } catch (err: any) {
      setDeleteError(err.message || 'خطا در حذف محصول')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    setIsExportOpen(true)
    try {
      const keys = await apiService.exportInventoryKeys(
        selectedProduct === 'all' ? undefined : selectedProduct,
        selectedStatus === 'all' ? undefined : selectedStatus,
      )
      setExportedKeys(keys)
    } catch {
      setExportedKeys([])
    } finally {
      setExportLoading(false)
    }
  }

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedKeys.join('\n'))
    setCopiedExport(true)
    setTimeout(() => setCopiedExport(false), 2000)
  }

  const handleReplaceKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReplaceLoading(true)
    setReplaceSuccessMsg('')
    setReplaceErrorMsg('')
    try {
      const res = await apiService.replaceInventoryKey(
        replaceOrderId,
        replaceOldItemId,
        replaceReason,
      )
      setReplaceSuccessMsg(
        `کلید جدید با شناسه #${res.new_inventory_item_id} با موفقیت جایگزین شد.`,
      )
      setTimeout(() => {
        setIsReplaceOpen(false)
        setReplaceSuccessMsg('')
        setReplaceOrderId('')
        setReplaceOldItemId('')
        loadData()
      }, 2000)
    } catch (err: any) {
      setReplaceErrorMsg(err.message || 'خطا در تعویض کلید')
    } finally {
      setReplaceLoading(false)
    }
  }

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateCouponLoading(true)
    setCreateCouponError('')
    try {
      const created = await apiService.createCoupon({
        code: couponCode.trim().toUpperCase(),
        discount_type: couponType,
        discount_value: Number(couponValue),
        min_order_amount_toman: Number(minSpend) || 0,
        max_discount_toman: Number(maxDiscount) || 0,
        per_user_limit: Number(perUserLimit) || 1,
        max_usage: Number(maxUsage) || 100,
        is_active: true,
      })
      setCoupons((prev) => [created, ...prev])
      setIsCreateCouponOpen(false)
      setCouponCode('')
      setCouponValue(10)
    } catch (err: any) {
      setCreateCouponError(err.message || 'خطا در ساخت کوپن')
    } finally {
      setCreateCouponLoading(false)
    }
  }

  const filteredAdminProducts = adminProducts.filter((p) => {
    const q = catalogSearch.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.title_fa?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.group_tag?.toLowerCase().includes(q)

    const matchesGroup =
      catalogGroupFilter === 'all' || p.group_tag === catalogGroupFilter
    const matchesCategory =
      catalogCategoryFilter === 'all' || p.category === catalogCategoryFilter

    return matchesSearch && matchesGroup && matchesCategory
  })

  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      it.product_title?.toLowerCase().includes(q) ||
      it.payload_preview?.toLowerCase().includes(q) ||
      it.batch_tag?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>مدیریت محصولات، موجودی انبار و کوپن‌ها</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            ایجاد و ویرایش کاتالوگ فروشگاه، نظارت بر مخزن لایسنس‌ها و کدهای تخفیف
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveSubtab('catalog')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubtab === 'catalog'
                ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>کاتالوگ محصولات ({adminProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubtab === 'inventory'
                ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>موجودی لایسنس و کلیدها</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubtab('coupons')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubtab === 'coupons'
                ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>کدهای تخفیف ({coupons.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row for Catalog */}
      {activeSubtab === 'catalog' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              کل محصولات کاتالوگ
            </span>
            <span className="text-xl font-black text-foreground mt-1 block font-mono">
              {adminProducts.length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              فعال در ویترین فروشگاه
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.is_active)
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
              تحویل آنی کلید / وب‌هوک
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.delivery_type === 'instant')
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 block">
              ارتقای دستی / اپراتور (Mode C)
            </span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.delivery_type === 'manual_timed')
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      )}

      {/* Metrics Row for Inventory & Coupons */}
      {activeSubtab !== 'catalog' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-right">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              کل موجودی انبار
            </span>
            <span className="text-xl font-black text-foreground mt-1 block font-mono">
              {stats.total_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              موجود و آماده تحویل
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
              {stats.available_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
              رزرو شده موقت
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block font-mono">
              {stats.reserved_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
              فروخته و تحویل شده
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
              {stats.sold_delivered_count.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block">
              سوخته یا ابطال شده
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block font-mono">
              {stats.void_count.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      )}

      {/* SUBTAB 0: PRODUCT CATALOG MANAGEMENT */}
      {activeSubtab === 'catalog' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                aria-label="فیلتر دسته‌بندی"
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                <option value="ai_chat">هوش مصنوعی و چت‌بات</option>
                <option value="coding_ai">دستیار کدنویسی</option>
                <option value="ai_account">اکانت اختصاصی</option>
                <option value="personal_upgrade">ارتقای اکانت شخصی</option>
                <option value="vpn">فیلترشکن و شبکه</option>
                <option value="api_key">کلید API</option>
              </select>

              {/* Group Tag Filter */}
              <select
                aria-label="فیلتر برند و گروه"
                value={catalogGroupFilter}
                onChange={(e) => setCatalogGroupFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه گروه‌ها و برندها</option>
                <option value="chatgpt">ChatGPT / OpenAI</option>
                <option value="claude">Claude / Anthropic</option>
                <option value="gemini">Gemini / Google</option>
                <option value="cursor">Cursor AI</option>
                <option value="vpn">VPN / شبکه</option>
                <option value="general">عمومی (General)</option>
              </select>

              {/* Search Box */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="جستجو در عنوان، اسلاگ..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="h-9 pr-9 pl-3 rounded-xl border border-border bg-background text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
                />
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="تازه‌سازی لیست"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {/* Create Product Button */}
            <button
              type="button"
              onClick={openCreateProductModal}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>ایجاد محصول جدید</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs">
                  در حال بارگذاری کاتالوگ محصولات...
                </span>
              </div>
            ) : filteredAdminProducts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/40 stroke-1" />
                <div className="text-sm font-semibold">
                  محصولی در کاتالوگ یافت نشد
                </div>
                <p className="text-xs max-w-sm mx-auto text-muted-foreground/70">
                  محصولات پیش‌فرض هاردکد با موفقیت حذف شدند. اکنون می‌توانید اولین
                  محصول فروشگاه را با مشخصات دلخواه ایجاد کنید.
                </p>
                <button
                  type="button"
                  onClick={openCreateProductModal}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>ایجاد اولین محصول</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-semibold">
                    <tr>
                      <th className="p-3.5">محصول و عنوان</th>
                      <th className="p-3.5">دسته‌بندی و شیوه تحویل</th>
                      <th className="p-3.5">قیمت فروش</th>
                      <th className="p-3.5">قیمت تمام‌شده</th>
                      <th className="p-3.5">موجودی / SLA</th>
                      <th className="p-3.5">وضعیت</th>
                      <th className="p-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAdminProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span>{p.title_fa}</span>
                            {p.group_tag && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                                {p.group_tag}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{p.title}</span>
                            <span className="font-mono text-[10px] text-muted-foreground/70">
                              ({p.slug})
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                              {p.category === 'ai_chat'
                                ? 'هوش مصنوعی'
                                : p.category === 'coding_ai'
                                  ? 'دستیار کد'
                                  : p.category === 'personal_upgrade'
                                    ? 'ارتقای اکانت'
                                    : p.category === 'vpn'
                                      ? 'شبکه و VPN'
                                      : p.category}
                            </span>
                            <span
                              className={`text-[10px] font-semibold flex items-center gap-1 ${
                                p.delivery_type === 'instant'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {p.delivery_type === 'instant'
                                ? '⚡ تحویل آنی خودکار'
                                : '👤 دستی اپراتور (Mode C)'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold font-mono text-foreground">
                          {p.price_toman.toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            تومان
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {p.base_cost_usd > 0 ? (
                            <span>${p.base_cost_usd.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {p.delivery_type === 'instant' ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  (p.available_stock ?? 0) > 0
                                    ? 'bg-emerald-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-mono font-bold">
                                {(p.available_stock ?? 0).toLocaleString(
                                  'fa-IR',
                                )}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                کلید موجود
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground">
                              {p.sla_display_text ||
                                `${p.sla_min_minutes} الی ${p.sla_max_minutes} دقیقه`}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(p)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              p.is_active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            title="کلیک برای تغییر وضعیت"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                            />
                            <span>
                              {p.is_active ? 'فعال در فروشگاه' : 'غیرفعال'}
                            </span>
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                              title="ویرایش محصول"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                              title="حذف محصول"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 1: INVENTORY & KEYS */}
      {activeSubtab === 'inventory' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Product Select */}
              <select
                aria-label="فیلتر بر اساس محصول"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه محصولات</option>
                {adminProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title_fa}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                aria-label="فیلتر بر اساس وضعیت"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="available">موجود (Available)</option>
                <option value="reserved">رزرو شده (Reserved)</option>
                <option value="sold">فروخته شده (Sold)</option>
                <option value="void">سوخته/باطل (Void)</option>
              </select>

              {/* Search Box */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="جستجو در کلیدها، عنوان، برچسب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pr-9 pl-3 rounded-xl border border-border bg-background text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
                />
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="تازه‌سازی"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {/* Export & Replace Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReplaceOpen(true)}
                className="h-9 px-3 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-medium transition flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                <span>تعویض کلید سفارش (گارانتی)</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>خروجی گرفتن از کلیدها (Export)</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs">در حال بارگذاری لیست انبار...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Key className="h-10 w-10 mx-auto text-muted-foreground/50 stroke-1" />
                <div className="text-xs font-medium">
                  کلیدی با این مشخصات یافت نشد
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-semibold">
                    <tr>
                      <th className="p-3.5">شناسه</th>
                      <th className="p-3.5">محصول متصل</th>
                      <th className="p-3.5">پیش‌نمایش کلید / محتوا</th>
                      <th className="p-3.5">وضعیت</th>
                      <th className="p-3.5">برچسب پارت</th>
                      <th className="p-3.5">سفارش متصل</th>
                      <th className="p-3.5">تاریخ ثبت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((it) => (
                      <tr key={it.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5 font-mono text-muted-foreground">
                          #{it.id}
                        </td>
                        <td className="p-3.5 font-medium text-foreground">
                          {it.product_title || 'سرویس نامشخص'}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground/90 max-w-[220px] truncate">
                          {it.payload_preview}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              it.status === 'available'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : it.status === 'reserved'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : it.status === 'sold'
                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {it.status === 'available'
                              ? 'موجود'
                              : it.status === 'reserved'
                                ? 'رزرو شده'
                                : it.status === 'sold'
                                  ? 'فروخته شده'
                                  : 'سوخته/باطل'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                          {it.batch_tag || '-'}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {it.reserved_order_id ? (
                            <span className="text-blue-600 dark:text-blue-400">
                              #{it.reserved_order_id.slice(0, 8)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground text-[11px]">
                          {it.created_at
                            ? new Date(it.created_at).toLocaleDateString(
                                'fa-IR',
                              )
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: COUPONS */}
      {activeSubtab === 'coupons' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                کدهای تخفیف فعال و زمان‌دار
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تخفیف‌های درصدی یا مبلغ ثابت با محدودیت سقف و تعداد دفعات استفاده
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateCouponOpen(true)}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>ایجاد کوپن جدید</span>
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {coupons.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Ticket className="h-10 w-10 mx-auto text-muted-foreground/50 stroke-1" />
                <div className="text-xs font-medium">
                  هیچ کد تخفیفی تاکنون تعریف نشده است
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-semibold">
                    <tr>
                      <th className="p-3.5">کد تخفیف</th>
                      <th className="p-3.5">نوع و مقدار</th>
                      <th className="p-3.5">حداقل خرید</th>
                      <th className="p-3.5">سقف تخفیف</th>
                      <th className="p-3.5">تعداد استفاده</th>
                      <th className="p-3.5">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5">
                          <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-foreground">
                          {c.discount_type === 'percentage'
                            ? `${c.discount_value}% تخفیف`
                            : `${c.discount_value.toLocaleString('fa-IR')} تومان`}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {c.min_order_amount_toman > 0
                            ? `${c.min_order_amount_toman.toLocaleString('fa-IR')} تومان`
                            : 'بدون حداقل'}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {c.max_discount_toman > 0
                            ? `${c.max_discount_toman.toLocaleString('fa-IR')} تومان`
                            : 'بدون سقف'}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {(c.current_usage ?? 0).toLocaleString('fa-IR')} /{' '}
                          {c.max_usage.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.is_active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {c.is_active ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-card rounded-2xl border border-border shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    {editingProduct
                      ? 'ویرایش اطلاعات محصول'
                      : 'ایجاد محصول جدید در کاتالوگ'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    تنظیم عناوین، دسته‌بندی، شیوه تحویل، قیمت و قوانین SLA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleProductSubmit}
              className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs"
            >
              {productFormError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              {/* Persian & English Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="p-title-fa"
                    className="font-bold text-foreground block mb-1"
                  >
                    عنوان فارسی محصول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="p-title-fa"
                    type="text"
                    required
                    placeholder="مثال: اکانت چت‌جی‌پی‌تی پلاس ۱ ماهه"
                    value={pTitleFA}
                    onChange={(e) => setPTitleFA(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="p-title-en"
                    className="font-bold text-foreground block mb-1"
                  >
                    عنوان انگلیسی محصول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="p-title-en"
                    type="text"
                    required
                    placeholder="مثال: ChatGPT Plus 1 Month"
                    value={pTitleEN}
                    onChange={(e) => setPTitleEN(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Slug & Group Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="p-slug"
                    className="font-bold text-foreground block mb-1"
                  >
                    اسلاگ یکتا (Slug)
                  </label>
                  <input
                    id="p-slug"
                    type="text"
                    placeholder="مثال: chatgpt-plus-1m (خالی = خودکار)"
                    value={pSlug}
                    onChange={(e) => setPSlug(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="p-group-tag"
                    className="font-bold text-foreground block mb-1"
                  >
                    گروه برند (Group Tag)
                  </label>
                  <select
                    id="p-group-tag"
                    value={pGroupTag}
                    onChange={(e) => setPGroupTag(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="general">عمومی (General)</option>
                    <option value="chatgpt">ChatGPT / OpenAI</option>
                    <option value="claude">Claude / Anthropic</option>
                    <option value="gemini">Gemini / Google</option>
                    <option value="cursor">Cursor AI</option>
                    <option value="vpn">سرویس‌های VPN</option>
                  </select>
                </div>
              </div>

              {/* Category & Delivery Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="p-category"
                    className="font-bold text-foreground block mb-1"
                  >
                    دسته‌بندی فروشگاه
                  </label>
                  <select
                    id="p-category"
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ai_chat">
                      هوش مصنوعی و چت‌بات (ai_chat)
                    </option>
                    <option value="coding_ai">
                      دستیار کدنویسی (coding_ai)
                    </option>
                    <option value="personal_upgrade">
                      ارتقای اکانت شخصی (personal_upgrade)
                    </option>
                    <option value="ai_account">
                      اکانت اختصاصی آماده (ai_account)
                    </option>
                    <option value="vpn">فیلترشکن و دور زدن تحریم (vpn)</option>
                    <option value="api_key">
                      کلید API و توسعه‌دهنده (api_key)
                    </option>
                    <option value="digital_code">
                      کد دیجیتال و گیفت‌کارت (digital_code)
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="p-delivery-type"
                    className="font-bold text-foreground block mb-1"
                  >
                    شیوه تحویل محصول
                  </label>
                  <select
                    id="p-delivery-type"
                    value={pDeliveryType}
                    onChange={(e) => setPDeliveryType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="instant">
                      تحویل آنی خودکار (تخصیص کلید از انبار یا وب‌هوک)
                    </option>
                    <option value="manual_timed">
                      تحویل دستی اپراتور (صف کاری / تبادل کد ۲FA)
                    </option>
                  </select>
                </div>
              </div>

              {/* Prices: Toman & USD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="p-price-toman"
                    className="font-bold text-foreground block mb-1"
                  >
                    قیمت فروش مشتری (تومان){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="p-price-toman"
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={pPriceToman}
                    onChange={(e) => setPPriceToman(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    {pPriceToman > 0
                      ? `${Number(pPriceToman).toLocaleString('fa-IR')} تومان`
                      : ''}
                  </span>
                </div>
                <div>
                  <label
                    htmlFor="p-base-usd"
                    className="font-bold text-foreground block mb-1"
                  >
                    قیمت تمام‌شده دلاری (USD)
                  </label>
                  <input
                    id="p-base-usd"
                    type="number"
                    min={0}
                    step={0.01}
                    value={pBaseCostUSD}
                    onChange={(e) => setPBaseCostUSD(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    هزینه خرید یا تأمین از پرووایدر
                  </span>
                </div>
              </div>

              {/* SLA Min/Max & SLA Text */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="p-sla-min"
                    className="font-bold text-foreground block mb-1"
                  >
                    حداقل زمان SLA (دقیقه)
                  </label>
                  <input
                    id="p-sla-min"
                    type="number"
                    min={1}
                    value={pSLAMin}
                    onChange={(e) => setPSLAMin(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="p-sla-max"
                    className="font-bold text-foreground block mb-1"
                  >
                    حداکثر زمان SLA (دقیقه)
                  </label>
                  <input
                    id="p-sla-max"
                    type="number"
                    min={1}
                    value={pSLAMax}
                    onChange={(e) => setPSLAMax(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="p-sla-text"
                    className="font-bold text-foreground block mb-1"
                  >
                    متن نمایشی زمان تحویل
                  </label>
                  <input
                    id="p-sla-text"
                    type="text"
                    placeholder="مثال: ۱۰ الی ۳۰ دقیقه"
                    value={pSLAText}
                    onChange={(e) => setPSLAText(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Operating Hours & Delivery Strategy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="p-operating-hours"
                    className="font-bold text-foreground block mb-1"
                  >
                    ساعات کاری اپراتور
                  </label>
                  <input
                    id="p-operating-hours"
                    type="text"
                    placeholder="مثال: ۹:۰۰ تا ۲۴:۰۰"
                    value={pOperatingHours}
                    onChange={(e) => setPOperatingHours(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="p-strategy"
                    className="font-bold text-foreground block mb-1"
                  >
                    استراتژی تأمین سفارش
                  </label>
                  <select
                    id="p-strategy"
                    value={pDeliveryStrategy}
                    onChange={(e) => setPDeliveryStrategy(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="manual_operator">
                      میز کار اپراتور انسانی (Desk)
                    </option>
                    <option value="third_party_instant">
                      تأمین آنی از InsightX Store
                    </option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="p-desc"
                  className="font-bold text-foreground block mb-1"
                >
                  توضیحات و ویژگی‌های محصول
                </label>
                <textarea
                  id="p-desc"
                  rows={2}
                  placeholder="توضیحات تکمیلی محصول که در صفحه فروشگاه نمایش داده می‌شود..."
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Instructions */}
              <div>
                <label
                  htmlFor="p-instructions"
                  className="font-bold text-foreground block mb-1"
                >
                  راهنمای تحویل برای خریدار
                </label>
                <textarea
                  id="p-instructions"
                  rows={2}
                  placeholder="راهنمای فعال‌سازی یا اتصال که پس از خرید به کاربر نشان داده می‌شود..."
                  value={pInstructions}
                  onChange={(e) => setPInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <span className="font-bold text-foreground block">
                    فعال در ویترین فروشگاه
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    در صورت غیرفعال بودن، مشتریان این محصول را در کاتالوگ اصلی
                    نخواهند دید.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsActive}
                    onChange={(e) => setPIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {productSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>
                    {editingProduct
                      ? 'ذخیره تغییرات محصول'
                      : 'ثبت و انتشار محصول در کاتالوگ'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PRODUCT MODAL */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-foreground">
                حذف محصول از کاتالوگ
              </h3>
              <p className="text-xs text-muted-foreground">
                آیا از حذف محصول{' '}
                <strong className="text-foreground">
                  {productToDelete.title_fa}
                </strong>{' '}
                اطمینان دارید؟ این عملیات قابل بازگشت نیست.
              </p>
            </div>
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteProductSubmit}
                disabled={deleteLoading}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>بله، حذف شود</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setProductToDelete(null)
                }}
                className="h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">
                  خروجی کلیدهای انبار
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {exportLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-xs">در حال دریافت داده‌ها...</span>
              </div>
            ) : exportedKeys.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                هیچ کلیدی برای خروجی یافت نشد.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  تعداد کلیدهای استخراج شده:{' '}
                  <span className="font-bold text-foreground">
                    {exportedKeys.length}
                  </span>
                </p>
                <textarea
                  readOnly
                  rows={8}
                  value={exportedKeys.join('\n')}
                  className="w-full p-3 rounded-xl border border-border bg-background font-mono text-[11px] select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  {copiedExport ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>در کلیپ‌بورد کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>کپی همه کلیدها</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPLACE KEY MODAL */}
      {isReplaceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReplaceKeySubmit}
            className="max-w-md w-full bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">
                  تعویض کلید سفارش (گارانتی)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReplaceOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {replaceSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{replaceSuccessMsg}</span>
              </div>
            )}

            {replaceErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{replaceErrorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="replace-order-id"
                  className="font-bold text-foreground block mb-1"
                >
                  شناسه سفارش (Order UUID)
                </label>
                <input
                  id="replace-order-id"
                  type="text"
                  required
                  placeholder="مثال: a1b2c3d4-..."
                  value={replaceOrderId}
                  onChange={(e) => setReplaceOrderId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="replace-old-item"
                  className="font-bold text-foreground block mb-1"
                >
                  شناسه کلید قدیمی معیوب (اختیاری)
                </label>
                <input
                  id="replace-old-item"
                  type="text"
                  placeholder="در صورت خالی بودن، خودکار تشخیص داده می‌شود"
                  value={replaceOldItemId}
                  onChange={(e) => setReplaceOldItemId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="replace-reason"
                  className="font-bold text-foreground block mb-1"
                >
                  دلیل تعویض
                </label>
                <input
                  id="replace-reason"
                  type="text"
                  required
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={replaceLoading}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {replaceLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>جایگزینی کلید جدید</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReplaceOpen(false)}
                className="h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCreateCouponOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCouponSubmit}
            className="max-w-md w-full bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">
                  ایجاد کوپن تخفیف جدید
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCouponOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createCouponError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createCouponError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label
                  htmlFor="create-coupon-code"
                  className="font-bold text-foreground block mb-1"
                >
                  کد تخفیف (لاتین)
                </label>
                <input
                  id="create-coupon-code"
                  type="text"
                  required
                  placeholder="مثال: NOROOZ1404"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="create-coupon-type"
                    className="font-bold text-foreground block mb-1"
                  >
                    نوع تخفیف
                  </label>
                  <select
                    id="create-coupon-type"
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="percentage">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="create-coupon-val"
                    className="font-bold text-foreground block mb-1"
                  >
                    {couponType === 'percentage'
                      ? 'درصد تخفیف'
                      : 'مبلغ (تومان)'}
                  </label>
                  <input
                    id="create-coupon-val"
                    type="number"
                    min={1}
                    value={couponValue}
                    onChange={(e) => setCouponValue(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="create-min-spend"
                    className="font-bold text-foreground block mb-1"
                  >
                    حداقل خرید (تومان)
                  </label>
                  <input
                    id="create-min-spend"
                    type="number"
                    min={0}
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="create-max-discount"
                    className="font-bold text-foreground block mb-1"
                  >
                    سقف تخفیف (تومان)
                  </label>
                  <input
                    id="create-max-discount"
                    type="number"
                    min={0}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="create-per-user"
                    className="font-bold text-foreground block mb-1"
                  >
                    دفعات مجاز هر کاربر
                  </label>
                  <input
                    id="create-per-user"
                    type="number"
                    min={1}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="create-max-usage"
                    className="font-bold text-foreground block mb-1"
                  >
                    حداکثر سقف مصرف کل
                  </label>
                  <input
                    id="create-max-usage"
                    type="number"
                    min={1}
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={createCouponLoading}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createCouponLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>ثبت و فعال‌سازی کوپن</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateCouponOpen(false)}
                className="h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
