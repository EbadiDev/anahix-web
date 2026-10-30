import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Ticket,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { AdminProduct, CouponItem } from '../../types'
import {
  formatNumber,
  formatToman,
  toPersianDigits,
} from '../../utils/formatters'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'

export const AdminCouponsView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()

  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'scheduled' | 'expired' | 'disabled'
  >('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>(
    'all',
  )

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form Fields
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage')
  const [formValue, setFormValue] = useState<number>(20)
  const [formLabel, setFormLabel] = useState('')
  const [formMinSpend, setFormMinSpend] = useState<number>(0)
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(0)
  const [formMaxUsage, setFormMaxUsage] = useState<number>(100)
  const [formPerUserLimit, setFormPerUserLimit] = useState<number>(1)
  const [formStartsAt, setFormStartsAt] = useState<string>(
    new Date().toISOString().split('T')[0],
  )
  const [formExpiresAt, setFormExpiresAt] = useState<string>('')
  const [formIsActive, setFormIsActive] = useState<boolean>(true)
  const [formShowInCart, setFormShowInCart] = useState<boolean>(true)

  // Subscription Scope: 'all' | 'group' | 'specific'
  const [formScopeType, setFormScopeType] = useState<
    'all' | 'group' | 'specific'
  >('all')
  const [formSelectedGroup, setFormSelectedGroup] = useState<string>('chatgpt')
  const [formSelectedProductSlugs, setFormSelectedProductSlugs] = useState<
    string[]
  >([])

  // Delete Confirm State
  const [couponToDelete, setCouponToDelete] = useState<CouponItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const data = await apiService.listCoupons()
      setCoupons(Array.isArray(data) ? data : [])
    } catch (err: any) {
      notifyError('خطا در دریافت کدهای تخفیف', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
    apiService
      .adminListProducts()
      .then((prods) => {
        if (Array.isArray(prods)) setAdminProducts(prods)
      })
      .catch(() => {})

    const handleCouponSync = () => {
      apiService
        .listCoupons()
        .then(setCoupons)
        .catch(() => {})
    }
    window.addEventListener('anahix:coupon:changed', handleCouponSync)
    return () =>
      window.removeEventListener('anahix:coupon:changed', handleCouponSync)
  }, [])

  const handleOpenCreate = () => {
    setEditingCouponId(null)
    setFormCode('')
    setFormType('percentage')
    setFormValue(20)
    setFormLabel('')
    setFormMinSpend(0)
    setFormMaxDiscount(0)
    setFormMaxUsage(100)
    setFormPerUserLimit(1)
    setFormStartsAt(new Date().toISOString().split('T')[0])
    setFormExpiresAt('')
    setFormIsActive(true)
    setFormShowInCart(true)
    setFormScopeType('all')
    setFormSelectedGroup('chatgpt')
    setFormSelectedProductSlugs([])
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (c: CouponItem) => {
    setEditingCouponId(c.id)
    setFormCode(c.code)
    setFormType((c.discount_type as any) || 'percentage')
    setFormValue(c.discount_value)
    setFormLabel(c.label || '')
    setFormMinSpend(c.min_order_amount_toman || 0)
    setFormMaxDiscount(c.max_discount_toman || 0)
    setFormMaxUsage(c.max_usage || 100)
    setFormPerUserLimit(c.per_user_limit || 1)
    setFormStartsAt(
      c.created_at
        ? c.created_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    )
    setFormExpiresAt(c.expires_at ? c.expires_at.split('T')[0] : '')
    setFormIsActive(c.is_active !== false)
    setFormShowInCart(c.show_in_cart !== false)

    // Parse category scope
    const cat = c.category || 'all'
    if (cat.startsWith('group:')) {
      setFormScopeType('group')
      setFormSelectedGroup(cat.replace('group:', ''))
      setFormSelectedProductSlugs([])
    } else if (cat !== 'all' && cat.includes(',')) {
      setFormScopeType('specific')
      setFormSelectedProductSlugs(cat.split(',').filter(Boolean))
    } else if (cat !== 'all' && adminProducts.some((p) => p.slug === cat)) {
      setFormScopeType('specific')
      setFormSelectedProductSlugs([cat])
    } else {
      setFormScopeType('all')
      setFormSelectedGroup('chatgpt')
      setFormSelectedProductSlugs([])
    }

    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = formCode.trim().toUpperCase()
    if (!cleanCode) {
      setFormError('کد تخفیف نمی‌تواند خالی باشد.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    // Compute scope string
    let resolvedCategory = 'all'
    if (formScopeType === 'group') {
      resolvedCategory = `group:${formSelectedGroup}`
    } else if (formScopeType === 'specific') {
      resolvedCategory =
        formSelectedProductSlugs.length > 0
          ? formSelectedProductSlugs.join(',')
          : 'all'
    }

    try {
      const payload = {
        code: cleanCode,
        discount_type: formType,
        discount_value: Number(formValue),
        min_order_amount_toman: Number(formMinSpend) || 0,
        max_discount_toman: Number(formMaxDiscount) || 0,
        per_user_limit: Number(formPerUserLimit) || 1,
        max_usage: Number(formMaxUsage) || 100,
        category: resolvedCategory,
        label: formLabel.trim() || undefined,
        expires_at: formExpiresAt ? `${formExpiresAt}T23:59:59Z` : undefined,
        show_in_cart: formShowInCart,
        is_active: formIsActive,
      }

      if (editingCouponId) {
        await apiService.adminUpdateCoupon(editingCouponId, payload as any)
        notifySuccess(
          'ویرایش کد تخفیف',
          `کد تخفیف «${cleanCode}» با موفقیت ویرایش شد.`,
        )
      } else {
        await apiService.createCoupon(payload as any)
        notifySuccess(
          'ایجاد کد تخفیف',
          `کد تخفیف «${cleanCode}» با موفقیت ایجاد و فعال شد.`,
        )
      }

      setIsModalOpen(false)
      await loadCoupons()
      window.dispatchEvent(
        new CustomEvent('anahix:coupon:changed', {
          detail: {
            code: cleanCode,
            action: editingCouponId ? 'updated' : 'created',
          },
        }),
      )
    } catch (err: any) {
      setFormError(err.message || 'خطا در ثبت کد تخفیف')
      notifyError('خطا در ثبت کد تخفیف', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (c: CouponItem) => {
    try {
      const updated = await apiService.adminToggleCoupon(c.id)
      setCoupons((prev) =>
        prev.map((item) => (item.id === c.id ? updated : item)),
      )
      notifySuccess(
        'تغییر وضعیت کد تخفیف',
        `کد تخفیف «${c.code}» اکنون ${updated.is_active ? 'فعال' : 'غیرفعال'} شد.`,
      )
      window.dispatchEvent(
        new CustomEvent('anahix:coupon:changed', {
          detail: {
            code: c.code,
            action: 'toggled',
            is_active: updated.is_active,
          },
        }),
      )
    } catch (err: any) {
      notifyError('خطا در تغییر وضعیت کد تخفیف', err.message)
    }
  }

  const handleToggleShowInCart = async (c: CouponItem) => {
    try {
      const nextVal = c.show_in_cart === false
      const updated = await apiService.adminUpdateCoupon(c.id, {
        show_in_cart: nextVal,
        is_active: c.is_active,
      })
      setCoupons((prev) =>
        prev.map((item) =>
          item.id === c.id
            ? {
                ...item,
                show_in_cart: nextVal,
                is_active: updated?.is_active ?? c.is_active,
              }
            : item,
        ),
      )
      notifySuccess(
        'تغییر وضعیت نمایش',
        `کد تخفیف «${c.code}» اکنون در سبد خرید ${nextVal ? 'نمایش داده می‌شود' : 'مخفی شد'}.`,
      )
      window.dispatchEvent(
        new CustomEvent('anahix:coupon:changed', {
          detail: {
            code: c.code,
            action: 'toggled_cart',
            show_in_cart: nextVal,
            is_active: c.is_active,
          },
        }),
      )
    } catch (err: any) {
      notifyError('خطا در تغییر وضعیت نمایش', err.message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return
    setDeleting(true)
    try {
      await apiService.adminDeleteCoupon(couponToDelete.id)
      const deletedCode = couponToDelete.code
      setCoupons((prev) => prev.filter((item) => item.id !== couponToDelete.id))
      setCouponToDelete(null)
      notifySuccess(
        'حذف کد تخفیف',
        `کد تخفیف «${deletedCode}» از پایگاه‌داده حذف شد.`,
      )
      window.dispatchEvent(
        new CustomEvent('anahix:coupon:changed', {
          detail: { code: deletedCode, action: 'deleted' },
        }),
      )
    } catch (err: any) {
      notifyError('خطا در حذف کد تخفیف', err.message)
    } finally {
      setDeleting(false)
    }
  }

  const getCouponStatus = (c: CouponItem) => {
    const now = new Date()
    if (!c.is_active) {
      return {
        status: 'disabled',
        label: 'غیرفعال دستی',
        className: 'bg-muted text-muted-foreground border-border/60',
      }
    }
    if (c.expires_at && new Date(c.expires_at) < now) {
      return {
        status: 'expired',
        label: 'منقضی شده',
        className: 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-black',
      }
    }
    return {
      status: 'active',
      label: 'فعال و معتبر',
      className:
        'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-black',
    }
  }

  const renderScopeBadge = (cat?: string) => {
    if (!cat || cat === 'all') {
      return (
        <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-muted/30 text-muted-foreground border border-border/40">
          تمامی محصولات
        </span>
      )
    }
    if (cat.startsWith('group:')) {
      const g = cat.replace('group:', '')
      const groupNames: Record<string, string> = {
        chatgpt: 'گروه ChatGPT',
        gemini: 'گروه Gemini',
        claude: 'گروه Claude',
        dev_tools: 'ابزارهای هوش مصنوعی',
        vpn: 'شبکه و VPN',
        virtual_numbers: 'شماره‌های مجازی',
      }
      return (
        <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
          {groupNames[g] || g}
        </span>
      )
    }
    const slugs = cat.split(',').filter(Boolean)
    return (
      <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-latin">
        {toPersianDigits(slugs.length)} اشتراک منتخب
      </span>
    )
  }

  // Filtered coupons list
  const filteredCoupons = useMemo(() => {
    const now = new Date()
    return coupons.filter((c) => {
      // Status filter
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'expired') {
        if (!c.expires_at) return false
        const expDate = new Date(c.expires_at)
        if (expDate >= now) return false
      }

      // Type filter
      if (typeFilter !== 'all' && c.discount_type !== typeFilter) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchCode = c.code.toLowerCase().includes(q)
        const matchLabel = (c.label || '').toLowerCase().includes(q)
        const matchCat = (c.category || '').toLowerCase().includes(q)
        if (!matchCode && !matchLabel && !matchCat) return false
      }

      return true
    })
  }, [coupons, statusFilter, typeFilter, searchQuery])

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = coupons.length
    const activeCount = coupons.filter((c) => c.is_active).length
    const totalUsage = coupons.reduce(
      (sum, c) => sum + (c.current_usage || 0),
      0,
    )
    return { total, activeCount, totalUsage }
  }, [coupons])

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Banner */}
      <AdminHeaderBanner
        icon={Ticket}
        title="سیستم جامع مدیریت کدهای تخفیف"
        subtitle="تعریف کدهای تخفیف درصدی و تومانی، پایش میزان مصرف، تعیین مهلت انقضا و اتصال به محصولات"
        badgeText="مدیریت تخفیف‌ها"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCoupons}
              disabled={loading}
              className="p-2.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-control"
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد کد تخفیف جدید</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              کل کدهای تخفیف
            </span>
            <div className="text-xl font-black text-foreground font-sans">
              {formatNumber(stats.total)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              کدهای فعال و قابل استفاده
            </span>
            <div className="text-xl font-black text-brand font-sans">
              {formatNumber(stats.activeCount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-control bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              مجموع دفعات استفاده‌شده
            </span>
            <div className="text-xl font-black text-foreground font-sans">
              {formatNumber(stats.totalUsage)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Dropdown Filters */}
      <div className="bg-card rounded-surface border border-border/80 p-3.5 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-bold shrink-0">
              وضعیت:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال‌ها</option>
              <option value="expired">منقضی‌شده‌ها</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-bold shrink-0">
              نوع تخفیف:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
            >
              <option value="all">همه انواع</option>
              <option value="percentage">درصدی (%)</option>
              <option value="fixed">مبلغ ثابت (تومانی)</option>
            </select>
          </div>
        </div>

        {/* Debounced Search */}
        <div className="w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="جستجوی کد، برچسب یا دسته..."
            debounceMs={300}
          />
        </div>
      </div>

      {/* Main Table: 100% Centered */}
      <div className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] font-semibold">
              <tr>
                <th className="p-3.5 text-center">کد تخفیف</th>
                <th className="p-3.5 text-center">نوع و مقدار</th>
                <th className="p-3.5 text-center">برچسب سبد خرید</th>
                <th className="p-3.5 text-center">میزان مصرف</th>
                <th className="p-3.5 text-center">سقف / حداقل خرید</th>
                <th className="p-3.5 text-center">اشتراک‌های مجاز</th>
                <th className="p-3.5 text-center">نمایش در سبد</th>
                <th className="p-3.5 text-center">مهلت انقضا</th>
                <th className="p-3.5 text-center">وضعیت</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-0">
                    <LoadingState message="در حال دریافت کدهای تخفیف..." />
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-muted-foreground text-xs space-y-2"
                  >
                    <Ticket className="w-8 h-8 mx-auto text-muted-foreground/50" />
                    <p className="font-bold text-foreground">
                      کد تخفیفی با این مشخصات یافت نشد
                    </p>
                    <p className="text-[11px]">
                      می‌توانید با زدن دکمه «ایجاد کد تخفیف جدید» اولین کد تخفیف
                      را ثبت کنید.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired =
                    c.expires_at && new Date(c.expires_at) < new Date()
                  const usagePercent =
                    c.max_usage > 0
                      ? Math.min(
                          100,
                          Math.round(
                            ((c.current_usage || 0) / c.max_usage) * 100,
                          ),
                        )
                      : 0

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Code */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono font-bold text-foreground bg-muted/40 border border-border/60 px-2.5 py-1 rounded-control font-latin text-xs">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(c.code)
                              notifySuccess(
                                'کپی کد',
                                `کد «${c.code}» در کلیپ‌بورد کپی شد.`,
                              )
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="کپی کردن کد"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="p-3.5 text-center">
                        {c.discount_type === 'percentage' ? (
                          <span className="px-2 py-0.5 rounded-control bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black font-sans text-xs">
                            {toPersianDigits(c.discount_value)}٪ تخفیف
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 font-black text-xs">
                            {formatToman(c.discount_value)}
                          </span>
                        )}
                      </td>

                      {/* Label */}
                      <td className="p-3.5 text-center">
                        {c.label ? (
                          <span className="text-[11px] font-bold text-foreground bg-muted/30 px-2 py-0.5 rounded-control border border-border/40">
                            {c.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">
                            محاسبه خودکار
                          </span>
                        )}
                      </td>

                      {/* Usage Progress */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1 min-w-[90px]">
                          <span className="font-mono text-[11px] font-bold text-foreground font-latin">
                            {toPersianDigits(c.current_usage || 0)} /{' '}
                            {c.max_usage > 0
                              ? toPersianDigits(c.max_usage)
                              : '∞'}
                          </span>
                          {c.max_usage > 0 && (
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-brand rounded-full transition-all duration-300"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Limits */}
                      <td className="p-3.5 text-center text-[11px] text-muted-foreground">
                        <div>
                          حداقل:{' '}
                          {c.min_order_amount_toman > 0
                            ? formatToman(c.min_order_amount_toman)
                            : 'ندارد'}
                        </div>
                        {c.max_discount_toman > 0 && (
                          <div className="text-[10px] text-muted-foreground/70">
                            سقف: {formatToman(c.max_discount_toman)}
                          </div>
                        )}
                      </td>

                      {/* Category Scope */}
                      <td className="p-3.5 text-center">
                        {renderScopeBadge(c.category)}
                      </td>

                      {/* Show in Cart Drawer */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ToggleSwitch
                            size="sm"
                            checked={c.show_in_cart !== false}
                            onChange={() => handleToggleShowInCart(c)}
                            ariaLabel="نمایش در سبد خرید"
                          />
                          <span
                            className={`text-[10px] font-bold ${
                              c.show_in_cart !== false
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {c.show_in_cart !== false
                              ? 'نمایش در سبد'
                              : 'مخفی در سبد'}
                          </span>
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="p-3.5 text-center">
                        {c.expires_at ? (
                          <div
                            className={`text-[11px] font-mono font-latin ${isExpired ? 'text-destructive font-black' : 'text-muted-foreground'}`}
                          >
                            {new Date(c.expires_at).toLocaleDateString('fa-IR')}
                            {isExpired && (
                              <span className="block text-[9px] text-destructive">
                                منقضی‌شده
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">
                            نامحدود
                          </span>
                        )}
                      </td>

                      {/* Active Status Badge with ToggleSwitch */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ToggleSwitch
                            size="sm"
                            checked={c.is_active}
                            onChange={() => handleToggle(c)}
                            ariaLabel="وضعیت فعال یا غیرفعال"
                          />
                          {(() => {
                            const st = getCouponStatus(c)
                            return (
                              <span
                                className={`px-2 py-0.5 rounded-control text-[10px] border ${st.className}`}
                              >
                                {st.label}
                              </span>
                            )
                          })()}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition-colors cursor-pointer shadow-control"
                            title="ویرایش کد تخفیف"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-brand" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCouponToDelete(c)}
                            className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                            title="حذف کامل از دیتابیس"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in z-[99999]"
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-center justify-center">
              <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-brand" />
                    <span>
                      {editingCouponId
                        ? `ویرایش کد تخفیف: ${formCode}`
                        : 'ایجاد کد تخفیف جدید'}
                    </span>
                  </h3>
                  <ModalCloseButton
                    onClick={() => setIsModalOpen(false)}
                    size="sm"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-control bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  {/* Code & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        کد تخفیف (یکتا) *
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) =>
                          setFormCode(e.target.value.toUpperCase())
                        }
                        placeholder="مثال: NOROOZ1405"
                        required
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin uppercase outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        نوع تخفیف
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-bold outline-none focus:border-brand cursor-pointer"
                      >
                        <option value="percentage">درصدی (%)</option>
                        <option value="fixed">مبلغ ثابت (تومانی)</option>
                      </select>
                    </div>
                  </div>

                  {/* Value & Label */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        {formType === 'percentage'
                          ? 'درصد تخفیف (%) *'
                          : 'مبلغ تخفیف (تومان) *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formValue}
                        onChange={(e) => setFormValue(Number(e.target.value))}
                        required
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        برچسب نمایشی در سبد خرید
                      </label>
                      <input
                        type="text"
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value)}
                        placeholder="مثال: ۲۵٪ تخفیف عیدانه"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Limits: Min spend & Max discount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        حداقل مبلغ سفارش (تومان)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={formMinSpend}
                        onChange={(e) =>
                          setFormMinSpend(Number(e.target.value))
                        }
                        placeholder="۰ برای بدون شرط"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        حداکثر سقف تخفیف (تومان)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={formMaxDiscount}
                        onChange={(e) =>
                          setFormMaxDiscount(Number(e.target.value))
                        }
                        placeholder="۰ برای نامحدود"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Usage Limits: Total & Per User */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        سقف کل دفعات استفاده
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formMaxUsage}
                        onChange={(e) =>
                          setFormMaxUsage(Number(e.target.value))
                        }
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        سقف استفاده به ازای هر کاربر
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formPerUserLimit}
                        onChange={(e) =>
                          setFormPerUserLimit(Number(e.target.value))
                        }
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Subscription / Product Scope Section */}
                  <div className="space-y-2 p-3.5 rounded-surface border border-border/60 bg-muted/20 text-right">
                    <label className="font-bold text-foreground block text-xs">
                      شمول و محدودیت اشتراک‌ها (کدام سرویس‌ها شامل شوند؟)
                    </label>

                    {/* Scope Type Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormScopeType('all')}
                        className={`py-1.5 px-2 rounded-control text-[11px] font-bold border transition-colors cursor-pointer ${
                          formScopeType === 'all'
                            ? 'bg-primary text-primary-foreground font-black shadow-control'
                            : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        همه محصولات
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormScopeType('group')}
                        className={`py-1.5 px-2 rounded-control text-[11px] font-bold border transition-colors cursor-pointer ${
                          formScopeType === 'group'
                            ? 'bg-primary text-primary-foreground font-black shadow-control'
                            : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        کل یک گروه
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormScopeType('specific')}
                        className={`py-1.5 px-2 rounded-control text-[11px] font-bold border transition-colors cursor-pointer ${
                          formScopeType === 'specific'
                            ? 'bg-primary text-primary-foreground font-black shadow-control'
                            : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        اشتراک‌های خاص (تگ‌دار)
                      </button>
                    </div>

                    {formScopeType === 'group' && (
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[11px] text-muted-foreground font-bold">
                          انتخاب گروه اشتراک‌ها:
                        </label>
                        <select
                          value={formSelectedGroup}
                          onChange={(e) => setFormSelectedGroup(e.target.value)}
                          className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-foreground font-bold outline-none focus:border-brand cursor-pointer text-xs"
                        >
                          <option value="chatgpt">
                            اکانت‌های چت‌جی‌پی‌تی (ChatGPT)
                          </option>
                          <option value="gemini">
                            اکانت‌های گوگل جمینای (Gemini)
                          </option>
                          <option value="claude">اکانت‌های کلود (Claude)</option>
                          <option value="dev_tools">
                            ابزارهای برنامه‌نویسی و هوش مصنوعی
                          </option>
                          <option value="vpn">ابزارهای تحریم‌شکن و VPN</option>
                          <option value="virtual_numbers">
                            شماره‌های مجازی (SMS)
                          </option>
                        </select>
                      </div>
                    )}

                    {formScopeType === 'specific' && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[11px] text-muted-foreground font-bold">
                          افزودن اشتراک به لیست مجاز:
                        </label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value
                            if (
                              val &&
                              !formSelectedProductSlugs.includes(val)
                            ) {
                              setFormSelectedProductSlugs((prev) => [
                                ...prev,
                                val,
                              ])
                            }
                            e.target.value = ''
                          }}
                          defaultValue=""
                          className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-foreground font-bold outline-none focus:border-brand cursor-pointer text-xs"
                        >
                          <option value="" disabled>
                            برای افزودن کلیک کنید...
                          </option>
                          {adminProducts.map((p) => (
                            <option key={p.slug} value={p.slug}>
                              {p.title_fa || p.title} ({p.slug})
                            </option>
                          ))}
                        </select>

                        {/* Selected Tag Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {formSelectedProductSlugs.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground">
                              هیچ اشتراکی هنوز انتخاب نشده است (شامل همه خواهد
                              بود).
                            </span>
                          ) : (
                            formSelectedProductSlugs.map((slug) => {
                              const prod = adminProducts.find(
                                (p) => p.slug === slug,
                              )
                              return (
                                <span
                                  key={slug}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold"
                                >
                                  <span>
                                    {prod?.title_fa || prod?.title || slug}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormSelectedProductSlugs((prev) =>
                                        prev.filter((s) => s !== slug),
                                      )
                                    }
                                    className="hover:text-destructive cursor-pointer p-0.5 text-xs font-black"
                                    title="حذف این اشتراک"
                                  >
                                    ✕
                                  </button>
                                </span>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates: Starts At & Expires At */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        تاریخ شروع تخفیف (پیش‌فرض امروز)
                      </label>
                      <input
                        type="date"
                        value={formStartsAt}
                        onChange={(e) => setFormStartsAt(e.target.value)}
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        تاریخ انقضا (اختیاری)
                      </label>
                      <input
                        type="date"
                        value={formExpiresAt}
                        onChange={(e) => setFormExpiresAt(e.target.value)}
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Show in Cart Drawer Toggle */}
                  <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 text-right">
                      <span className="font-bold text-foreground block">
                        نمایش در پیشنهادات سریع سبد خرید
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        با فعال‌بودن، این کد در کشوی سبد خرید خریداران به عنوان
                        چیپ آماده با ۱ کلیک قابل اعمال خواهد بود.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formShowInCart}
                      onChange={setFormShowInCart}
                    />
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 text-right">
                      <span className="font-bold text-foreground block">
                        وضعیت فعال‌بودن کد تخفیف
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        در صورت فعال بودن، مشتریان می‌توانند کد را در سبد خرید
                        وارد کنند.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formIsActive}
                      onChange={setFormIsActive}
                    />
                  </div>

                  {/* Full-width submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 duration-motion active:scale-[0.98]"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Ticket className="w-4 h-4" />
                      )}
                      <span>
                        {editingCouponId
                          ? 'ذخیره تغییرات کد تخفیف'
                          : 'ثبت و انتشار کد تخفیف'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(couponToDelete)}
        onClose={() => setCouponToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="حذف کامل کد تخفیف"
        description={`آیا از حذف کامل کد تخفیف «${couponToDelete?.code || ''}» از پایگاه‌داده اطمینان دارید؟ این عملیات غیرقابل بازگشت است و کد از سبد خرید تمامی کاربران پاک خواهد شد.`}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        loading={deleting}
      />
    </div>
  )
}
