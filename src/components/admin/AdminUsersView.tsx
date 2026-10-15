import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Eye,
  Key,
  Layers,
  Mail,
  Minus,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  UserX,
  Wallet,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminAdjustCustomerWalletRequest,
  AdminCustomerDetail360Response,
  AdminCustomerListItem,
  AdminCustomerOrderBrief,
  AdminListCustomersRequest,
  AdminListCustomersResponse,
  AdminReplaceCustomerKeyRequest,
  AdminSendCustomerSMSRequest,
  AdminUpdateCustomerStatusRequest,
  CustomerTier,
} from '../../types'

export const AdminUsersView: React.FC = () => {
  // Main Users Table State
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AdminListCustomersResponse | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'blocked'
  >('all')
  const [tierFilter, setTierFilter] = useState<
    'all' | 'standard' | 'colleague' | 'vip'
  >('all')
  const [hasBalanceFilter, setHasBalanceFilter] = useState(false)
  const [sortBy, setSortBy] = useState<
    'created_at' | 'last_login_at' | 'total_spent' | 'balance'
  >('created_at')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)

  // Drawer / 360-Degree Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [customer360, setCustomer360] =
    useState<AdminCustomerDetail360Response | null>(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState<
    'wallet' | 'orders' | 'virtual_numbers' | 'affiliate' | 'security'
  >('wallet')

  // Wallet Adjustment Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [walletTargetUser, setWalletTargetUser] =
    useState<AdminCustomerListItem | null>(null)
  const [walletAction, setWalletAction] = useState<'credit' | 'debit'>('credit')
  const [walletAmount, setWalletAmount] = useState<number>(50000)
  const [walletReason, setWalletReason] = useState('')
  const [walletSubmitting, setWalletSubmitting] = useState(false)

  // Replace Key Modal State
  const [isReplaceKeyOpen, setIsReplaceKeyOpen] = useState(false)
  const [replaceTargetOrder, setReplaceTargetOrder] =
    useState<AdminCustomerOrderBrief | null>(null)
  const [selectedOrderItemId, setSelectedOrderItemId] = useState('')
  const [newKeyPayload, setNewKeyPayload] = useState('')
  const [replaceKeyReason, setReplaceKeyReason] = useState('')
  const [replaceKeySubmitting, setReplaceKeySubmitting] = useState(false)

  // Direct SMS State
  const [smsMessage, setSmsMessage] = useState('')
  const [smsTemplateId, setSmsTemplateId] = useState<number | undefined>(
    undefined,
  )
  const [smsSubmitting, setSmsSubmitting] = useState(false)
  const [smsFeedback, setSmsFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Security & Notes Update State
  const [editTier, setEditTier] = useState<CustomerTier>('standard')
  const [editNotes, setEditNotes] = useState('')
  const [editBlockReason, setEditBlockReason] = useState('')
  const [securitySubmitting, setSecuritySubmitting] = useState(false)
  const [securityFeedback, setSecurityFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Global Notification / Toast
  const [toastMsg, setToastMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 4000)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Load Customers
  const loadCustomers = async () => {
    setLoading(true)
    try {
      const params: AdminListCustomersRequest = {
        search: search.trim() || undefined,
        status: statusFilter,
        has_balance: hasBalanceFilter || undefined,
        tier: tierFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 15,
      }
      const res = await apiService.getAdminCustomers(params)
      setData(res)
    } catch (err: any) {
      showToast('error', err.message || 'خطا در بارگذاری لیست کاربران')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [page, statusFilter, tierFilter, hasBalanceFilter, sortBy, sortOrder])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadCustomers()
  }

  // Load Customer 360
  const openCustomerDrawer = async (customerId: string) => {
    setSelectedCustomerId(customerId)
    setDrawerLoading(true)
    setCustomer360(null)
    setActiveDrawerTab('wallet')
    setSmsFeedback(null)
    setSecurityFeedback(null)

    try {
      const res = await apiService.getAdminCustomer360(customerId)
      setCustomer360(res)
      setEditTier(res.customer.tier || 'standard')
      setEditNotes(res.customer.internal_notes || '')
      setEditBlockReason(res.customer.block_reason || '')
    } catch (err: any) {
      showToast('error', err.message || 'خطا در بارگذاری پرونده کاربر')
      setSelectedCustomerId(null)
    } finally {
      setDrawerLoading(false)
    }
  }

  const closeDrawer = () => {
    setSelectedCustomerId(null)
    setCustomer360(null)
  }

  // Handle Wallet Adjustment
  const openWalletModal = (user: AdminCustomerListItem) => {
    setWalletTargetUser(user)
    setWalletAmount(50000)
    setWalletAction('credit')
    setWalletReason('')
    setIsWalletModalOpen(true)
  }

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletTargetUser) return
    if (!walletReason.trim()) {
      alert('درج علت تراکنش جهت ثبت در اسناد مالی و لاگ حسابرسی الزامی است.')
      return
    }
    if (walletAmount <= 0) {
      alert('مبلغ باید بزرگتر از صفر باشد.')
      return
    }

    setWalletSubmitting(true)
    try {
      const payload: AdminAdjustCustomerWalletRequest = {
        amount_toman: Number(walletAmount),
        action: walletAction,
        reason: walletReason.trim(),
      }
      const updated = await apiService.adjustCustomerWallet(
        walletTargetUser.id,
        payload,
      )
      showToast(
        'success',
        `تراکنش ${walletAction === 'credit' ? 'شارژ' : 'کسر'} کیف پول با موفقیت ثبت شد. موجودی جدید: ${updated.balance_toman.toLocaleString('fa-IR')} تومان`,
      )
      setIsWalletModalOpen(false)
      loadCustomers()
      if (selectedCustomerId === walletTargetUser.id) {
        openCustomerDrawer(walletTargetUser.id)
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطا در ثبت تراکنش کیف پول')
    } finally {
      setWalletSubmitting(false)
    }
  }

  // Quick Toggle Block Status
  const handleToggleBlock = async (user: AdminCustomerListItem) => {
    const nextState = !user.is_active
    const promptReason = nextState
      ? ''
      : prompt('علت مسدودسازی این کاربر را وارد نمایید (اختیاری):') || ''
    try {
      const payload: AdminUpdateCustomerStatusRequest = {
        is_active: nextState,
        block_reason: promptReason,
      }
      await apiService.updateCustomerStatus(user.id, payload)
      showToast(
        'success',
        `حساب کاربری ${user.phone} با موفقیت ${nextState ? 'فعال و رفع انسداد' : 'مسدود'} شد.`,
      )
      loadCustomers()
      if (selectedCustomerId === user.id) {
        openCustomerDrawer(user.id)
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطا در تغییر وضعیت حساب')
    }
  }

  // Save Security, Tier & Notes
  const handleSaveSecurityNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer360) return

    setSecuritySubmitting(true)
    setSecurityFeedback(null)
    try {
      const payload: AdminUpdateCustomerStatusRequest = {
        tier: editTier,
        internal_notes: editNotes,
        block_reason: editBlockReason,
      }
      const updated = await apiService.updateCustomerStatus(
        customer360.customer.id,
        payload,
      )
      setCustomer360((prev) => (prev ? { ...prev, customer: updated } : null))
      setSecurityFeedback({
        type: 'success',
        text: 'یادداشت‌های محرمانه و سطح کاربری با موفقیت به‌روزرسانی شدند.',
      })
      loadCustomers()
    } catch (err: any) {
      setSecurityFeedback({
        type: 'error',
        text: err.message || 'خطا در ذخیره تغییرات امنیتی',
      })
    } finally {
      setSecuritySubmitting(false)
    }
  }

  // Direct SMS Send
  const handleSendDirectSMS = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer360) return
    if (!smsMessage.trim()) {
      alert('متن پیامک نمی‌تواند خالی باشد.')
      return
    }

    setSmsSubmitting(true)
    setSmsFeedback(null)
    try {
      const payload: AdminSendCustomerSMSRequest = {
        message: smsMessage.trim(),
        template_id: smsTemplateId ? Number(smsTemplateId) : undefined,
      }
      const res = await apiService.sendCustomerSMS(
        customer360.customer.id,
        payload,
      )
      setSmsFeedback({
        type: 'success',
        text: res.message || 'پیامک با موفقیت از طریق پنل پیامک ارسال گردید.',
      })
      setSmsMessage('')
    } catch (err: any) {
      setSmsFeedback({
        type: 'error',
        text: err.message || 'خطا در ارسال پیامک',
      })
    } finally {
      setSmsSubmitting(false)
    }
  }

  // Replace Order Key Modal
  const openReplaceKeyModal = (order: AdminCustomerOrderBrief) => {
    setReplaceTargetOrder(order)
    setSelectedOrderItemId(order.items?.[0]?.id || '')
    setNewKeyPayload('')
    setReplaceKeyReason('')
    setIsReplaceKeyOpen(true)
  }

  const handleReplaceKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer360 || !replaceTargetOrder || !selectedOrderItemId) return
    if (!newKeyPayload.trim()) {
      alert('لایسنس یا کلید جدید الزامی است.')
      return
    }

    setReplaceKeySubmitting(true)
    try {
      const payload: AdminReplaceCustomerKeyRequest = {
        order_item_id: selectedOrderItemId,
        new_payload: newKeyPayload.trim(),
        reason: replaceKeyReason.trim() || 'تعویض دستی کلید توسط اپراتور',
      }
      await apiService.replaceCustomerOrderKey(customer360.customer.id, payload)
      showToast('success', 'کلید و لایسنس سفارش با موفقیت تعویض شد.')
      setIsReplaceKeyOpen(false)
      openCustomerDrawer(customer360.customer.id)
    } catch (err: any) {
      showToast('error', err.message || 'خطا در تعویض کلید سفارش')
    } finally {
      setReplaceKeySubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-6 left-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : 'bg-red-600 text-white border-red-500 shadow-red-500/20'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card & Stats Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-600/10 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold border border-white/20">
              <ShieldCheck className="w-4 h-4 text-blue-200" />
              <span>مرکز کنترل و مدیریت کاربران آناهیکس (User 360°)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              مدیریت جامع کاربران و نمای ۳۶۰ درجه پرونده مشتریان
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              مشاهده پرونده کامل، کنترل کیف پول، تاریخچه سفارشات لایسنس و
              شماره‌های مجازی، مدیریت شبکه بازاریابی معرف‌ها و یادداشت‌های امنیتی
              محرمانه اپراتورها.
            </p>
          </div>

          <button
            onClick={loadCustomers}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-2 self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی داده‌ها</span>
          </button>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-xs mb-1">
              <span>کل کاربران ثبت‌نامی</span>
              <Users className="w-4 h-4 opacity-80" />
            </div>
            <div className="text-2xl font-black font-mono">
              {(data?.total || 0).toLocaleString('fa-IR')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-xs mb-1">
              <span>کاربران فعال</span>
              <UserCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-300">
              {(data?.total_active || 0).toLocaleString('fa-IR')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-xs mb-1">
              <span>همکاران و مشترکین VIP</span>
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-300">
              {(data?.total_vip || 0).toLocaleString('fa-IR')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-blue-200 text-xs mb-1">
              <span>کل موجودی کیف پول‌ها</span>
              <Wallet className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-200 truncate">
              {(data?.total_balance_toman || 0).toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal">تومان</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی سریع بر اساس: شماره موبایل، نام و نام‌خانوادگی، ایمیل، یا کد معرف..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 shadow-sm shadow-blue-600/20"
          >
            جستجو و اعمال
          </button>
        </form>

        {/* Filter Pills and Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 px-2">
                وضعیت:
              </span>
              {(['all', 'active', 'blocked'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st)
                    setPage(1)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'all' && 'همه'}
                  {st === 'active' && 'فعال'}
                  {st === 'blocked' && 'مسدود'}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 px-2">
                سطح کاربری:
              </span>
              {(['all', 'standard', 'colleague', 'vip'] as const).map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => {
                    setTierFilter(tr)
                    setPage(1)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    tierFilter === tr
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tr === 'all' && 'همه'}
                  {tr === 'standard' && 'عادی'}
                  {tr === 'colleague' && 'همکار'}
                  {tr === 'vip' && 'VIP'}
                </button>
              ))}
            </div>

            {/* Has Balance Toggle */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasBalanceFilter}
                onChange={(e) => {
                  setHasBalanceFilter(e.target.checked)
                  setPage(1)
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium">
                فقط کاربران با موجودی کیف پول
              </span>
            </label>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any)
                setPage(1)
              }}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="created_at">تاریخ عضویت</option>
              <option value="last_login_at">آخرین ورود</option>
              <option value="total_spent">مجموع خرید</option>
              <option value="balance">موجودی کیف پول</option>
            </select>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
              }
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title={sortOrder === 'desc' ? 'نزولی' : 'صعودی'}
            >
              {sortOrder === 'desc' ? (
                <ArrowDownLeft className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Users Table View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold select-none">
                <th className="py-4 px-4">اطلاعات هویتی و شماره موبایل</th>
                <th className="py-4 px-4">موجودی کیف پول (تومان)</th>
                <th className="py-4 px-4 text-center">تعداد سفارش‌ها</th>
                <th className="py-4 px-4">درآمد معرف (ریفرال)</th>
                <th className="py-4 px-4">آخرین ورود و وضعیت</th>
                <th className="py-4 px-4 text-center">وضعیت حساب</th>
                <th className="py-4 px-4 text-left">عملیات سریع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>در حال فراخوانی اطلاعات کاربران...</span>
                  </td>
                </tr>
              )}

              {!loading &&
                (!data?.customers || data.customers.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-slate-500"
                    >
                      <UserX className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <span className="font-bold">
                        هیچ کاربری با فیلترهای مشخص‌شده یافت نشد.
                      </span>
                    </td>
                  </tr>
                )}

              {!loading &&
                data?.customers?.map((user) => {
                  const isPositiveBalance = user.balance_toman > 0
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Identity & Mobile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shadow-sm">
                              {user.full_name?.charAt(0) || 'ک'}
                            </div>
                            {user.is_online && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse"
                                title="کاربر آنلاین است"
                              />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openCustomerDrawer(user.id)}
                                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-right transition-colors"
                              >
                                {user.full_name}
                              </button>
                              {user.tier === 'vip' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/80">
                                  VIP
                                </span>
                              )}
                              {user.tier === 'colleague' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300/80">
                                  همکار
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              <span>{user.phone}</span>
                              {user.email && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[150px]">
                                    {user.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Balance */}
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-bold text-sm ${
                            isPositiveBalance
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {user.balance_toman.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-[10px] text-slate-400 mr-1 font-sans">
                          تومان
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {user.total_orders_count.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (
                            {user.store_orders_count > 0
                              ? `${user.store_orders_count} اکانت`
                              : '۰'}
                            {user.virtual_orders_count > 0
                              ? ` + ${user.virtual_orders_count} شماره`
                              : ''}
                            )
                          </span>
                        </div>
                      </td>

                      {/* Referral Income */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {user.referral_balance_toman.toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-sans font-normal text-slate-400">
                            تومان
                          </span>
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400">
                          کد: {user.referral_code}
                        </div>
                      </td>

                      {/* Last Login & Online Status */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {user.last_login_at ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-slate-700 dark:text-slate-300">
                              {new Date(user.last_login_at).toLocaleDateString(
                                'fa-IR',
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(
                                  user.last_login_at,
                                ).toLocaleTimeString('fa-IR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">بدون ورود</span>
                        )}
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            user.is_active
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>فعال</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              <span>مسدود</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 360 Profile Drawer Button */}
                          <button
                            type="button"
                            onClick={() => openCustomerDrawer(user.id)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors"
                            title="مشاهده پرونده ۳۶۰ درجه مشتری"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Wallet Topup/Debit */}
                          <button
                            type="button"
                            onClick={() => openWalletModal(user)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors"
                            title="شارژ یا کسر موجودی کیف پول"
                          >
                            <Coins className="w-4 h-4" />
                          </button>

                          {/* Block/Unblock Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(user)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              user.is_active
                                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 border-red-200 dark:border-red-900'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border-emerald-200 dark:border-emerald-900'
                            }`}
                            title={
                              user.is_active
                                ? 'مسدودسازی حساب کاربری'
                                : 'رفع مسدودی و فعال‌سازی'
                            }
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.total > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              نمایش صفحه {data.page} از{' '}
              {Math.ceil(data.total / data.page_size) || 1} (مجموع{' '}
              {data.total.toLocaleString('fa-IR')} کاربر)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={page >= Math.ceil(data.total / data.page_size)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 360-DEGREE CUSTOMER DRAWER / PROFILE MODAL                           */}
      {/* ==================================================================== */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#020817] h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden animate-in slide-in-from-right duration-300"
            dir="rtl"
          >
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20 shrink-0">
                  {customer360?.customer.full_name?.charAt(0) || 'ک'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {customer360?.customer.full_name || 'در حال بارگذاری...'}
                    </h3>
                    {customer360?.customer.tier && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        سطح: {customer360.customer.tier.toUpperCase()}
                      </span>
                    )}
                    {customer360?.customer.is_online && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        آنلاین
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {customer360?.customer.phone}
                    </span>
                    {customer360?.customer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {customer360.customer.email}
                      </span>
                    )}
                    <span className="font-sans text-[11px] text-slate-400">
                      عضویت:{' '}
                      {customer360?.customer.created_at &&
                        new Date(
                          customer360.customer.created_at,
                        ).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    customer360 && openWalletModal(customer360.customer)
                  }
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>شارژ / کسر</span>
                </button>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 5 Vital Tabs Bar */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto text-xs font-semibold scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveDrawerTab('wallet')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeDrawerTab === 'wallet'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>کیف پول و مدیریت مالی</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab('orders')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeDrawerTab === 'orders'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>سفارشات لایسنس ({customer360?.orders.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab('virtual_numbers')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeDrawerTab === 'virtual_numbers'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>
                  شماره‌های مجازی ({customer360?.virtual_numbers.length || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab('affiliate')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeDrawerTab === 'affiliate'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>
                  زیرمجموعه‌ها و ریفرال (
                  {customer360?.affiliate_stats.referred_count || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab('security')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeDrawerTab === 'security'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>کنترل دسترسی، یادداشت و پیامک</span>
              </button>
            </div>

            {/* Drawer Body Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {drawerLoading && (
                <div className="py-24 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                  <span>در حال بارگذاری پرونده ۳۶۰ درجه مشتری...</span>
                </div>
              )}

              {!drawerLoading && customer360 && (
                <>
                  {/* TAB 1: WALLET & FINANCIAL ADJUSTMENT */}
                  {activeDrawerTab === 'wallet' && (
                    <div className="space-y-6">
                      {/* Balance Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg shadow-emerald-600/10 relative overflow-hidden">
                          <div className="flex items-center justify-between text-xs text-emerald-100 mb-1">
                            <span>موجودی فعلی کیف پول</span>
                            <Wallet className="w-5 h-5 opacity-80" />
                          </div>
                          <div className="text-3xl font-black font-mono mt-1">
                            {customer360.customer.balance_toman.toLocaleString(
                              'fa-IR',
                            )}{' '}
                            <span className="text-sm font-sans font-normal">
                              تومان
                            </span>
                          </div>
                          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setWalletAction('credit')
                                openWalletModal(customer360.customer)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>شارژ دستی</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setWalletAction('debit')
                                openWalletModal(customer360.customer)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                              <Minus className="w-3.5 h-3.5" />
                              <span>کسر دستی</span>
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>موجودی پورسانت ریفرال</span>
                              <Share2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                              {customer360.customer.referral_balance_toman.toLocaleString(
                                'fa-IR',
                              )}{' '}
                              <span className="text-xs font-sans font-normal text-slate-400">
                                تومان
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                            کاربر می‌تواند این مبلغ را مستقیماً به کیف پول خرید
                            خود منتقل کرده یا درخواست تسویه ریالی ثبت کند.
                          </p>
                        </div>
                      </div>

                      {/* Transactions History Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            تاریخچه تراکنش‌های کیف پول مشتری
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {customer360.wallet_transactions.length} تراکنش اخیر
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          {customer360.wallet_transactions.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                              هیچ تراکنش مالی برای این کاربر ثبت نشده است.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-right text-xs">
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                                    <th className="py-2.5 px-3">کد تراکنش</th>
                                    <th className="py-2.5 px-3">نوع عملیات</th>
                                    <th className="py-2.5 px-3">
                                      مبلغ (تومان)
                                    </th>
                                    <th className="py-2.5 px-3">شرح و علت</th>
                                    <th className="py-2.5 px-3">تاریخ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {customer360.wallet_transactions.map(
                                    (tx: any) => (
                                      <tr
                                        key={tx.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                      >
                                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                          {tx.transaction_number}
                                        </td>
                                        <td className="py-3 px-3">
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                              tx.order_type ===
                                                'admin_adjustment' ||
                                              tx.order_type === 'deposit'
                                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                            }`}
                                          >
                                            {tx.order_type ===
                                              'admin_adjustment' &&
                                              'تعدیل دستی ادمین'}
                                            {tx.order_type === 'deposit' &&
                                              'شارژ آنلاین'}
                                            {tx.order_type === 'refund' &&
                                              'استرداد وجه'}
                                            {tx.order_type === 'store_order' &&
                                              'خرید اشتراک'}
                                            {tx.order_type ===
                                              'virtual_number' && 'شماره مجازی'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                          {tx.amount_toman.toLocaleString(
                                            'fa-IR',
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[220px] truncate">
                                          {tx.description || '-'}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                                          {new Date(
                                            tx.created_at,
                                          ).toLocaleDateString('fa-IR')}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LICENSE ORDERS HISTORY */}
                  {activeDrawerTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          تاریخچه خریدهای لایسنس و اشتراک‌های اختصاصی
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          مجموع {customer360.orders.length} سفارش
                        </span>
                      </div>

                      {customer360.orders.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 text-xs">
                          هنوز سفارشی برای این مشتری ثبت نشده است.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {customer360.orders.map((ord) => (
                            <div
                              key={ord.id}
                              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                                      {ord.order_number}
                                    </span>
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                      {ord.product_title}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    ثبت:{' '}
                                    {new Date(
                                      ord.created_at,
                                    ).toLocaleDateString('fa-IR')}{' '}
                                    -{' '}
                                    {new Date(
                                      ord.created_at,
                                    ).toLocaleTimeString('fa-IR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {ord.status}
                                  </span>
                                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                    {ord.total_amount_toman.toLocaleString(
                                      'fa-IR',
                                    )}{' '}
                                    تومان
                                  </span>
                                </div>
                              </div>

                              {/* Delivered Payload / Key Area */}
                              {ord.delivered_payload ? (
                                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-[10px] text-slate-400 mb-0.5">
                                      لایسنس / مشخصات تحویل داده شده به مشتری:
                                    </div>
                                    <div className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                                      {ord.delivered_payload}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyToClipboard(
                                          ord.delivered_payload || '',
                                          ord.id,
                                        )
                                      }
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                      title="کپی کلید"
                                    >
                                      {copiedKey === ord.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openReplaceKeyModal(ord)}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                    >
                                      <Key className="w-3 h-3" />
                                      <span>تعویض کلید</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                                  <span>
                                    هنوز کلید یا لایسنسی تحویل داده نشده است.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openReplaceKeyModal(ord)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
                                  >
                                    <Key className="w-3 h-3" />
                                    <span>ثبت / درج لایسنس</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: VIRTUAL NUMBERS HISTORY */}
                  {activeDrawerTab === 'virtual_numbers' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Radio className="w-4 h-4 text-blue-600" />
                          تاریخچه شماره‌های مجازی خریداری‌شده (5SIM)
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {customer360.virtual_numbers.length} شماره
                        </span>
                      </div>

                      {customer360.virtual_numbers.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 text-xs">
                          این کاربر هیچ خرید شماره مجازی نداشته است.
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                                  <th className="py-3 px-3">کشور و سرویس</th>
                                  <th className="py-3 px-3">شماره دریافتی</th>
                                  <th className="py-3 px-3">کد SMS دریافتی</th>
                                  <th className="py-3 px-3">قیمت (تومان)</th>
                                  <th className="py-3 px-3">وضعیت</th>
                                  <th className="py-3 px-3">تاریخ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {customer360.virtual_numbers.map((vn: any) => (
                                  <tr
                                    key={vn.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                  >
                                    <td className="py-3 px-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">
                                          {vn.country_flag || '🌐'}
                                        </span>
                                        <div>
                                          <div className="font-bold text-slate-900 dark:text-white">
                                            {vn.service_name_fa || vn.service}
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            {vn.country_name_fa || vn.country} (
                                            {vn.operator})
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                      {vn.phone}
                                    </td>

                                    <td className="py-3 px-3">
                                      {vn.sms_code ? (
                                        <div className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-2.5 py-1 rounded-lg">
                                          <span>{vn.sms_code}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyToClipboard(
                                                vn.sms_code,
                                                vn.id,
                                              )
                                            }
                                            className="p-0.5 hover:bg-emerald-200 rounded"
                                            title="کپی کد"
                                          >
                                            {copiedKey === vn.id ? (
                                              <Check className="w-3 h-3" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">
                                          در انتظار پیامک...
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                      {vn.price_toman.toLocaleString('fa-IR')}
                                    </td>

                                    <td className="py-3 px-3">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          vn.status === 'RECEIVED' ||
                                          vn.status === 'FINISHED'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                            : vn.status === 'CANCELED'
                                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                        }`}
                                      >
                                        {vn.status}
                                      </span>
                                    </td>

                                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                                      {new Date(
                                        vn.created_at,
                                      ).toLocaleDateString('fa-IR')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: AFFILIATE & REFERRAL NETWORK */}
                  {activeDrawerTab === 'affiliate' && (
                    <div className="space-y-6">
                      {/* Referral Code Box */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-blue-200">
                            کد معرف اختصاصی این کاربر:
                          </div>
                          <div className="text-2xl font-black font-mono mt-0.5 tracking-wider">
                            {customer360.affiliate_stats.referral_code}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              customer360.affiliate_stats.referral_code,
                              'ref-code',
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          {copiedKey === 'ref-code' ? (
                            <Check className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>کپی کد معرف</span>
                        </button>
                      </div>

                      {/* 4 Stats Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">
                            تعداد زیرمجموعه‌ها
                          </div>
                          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                            {customer360.affiliate_stats.referred_count.toLocaleString(
                              'fa-IR',
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">
                            کل درآمد کمیسیون
                          </div>
                          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                            {customer360.affiliate_stats.total_commission_toman.toLocaleString(
                              'fa-IR',
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">
                            انتقال به کیف پول
                          </div>
                          <div className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                            {customer360.affiliate_stats.transferred_commission_toman.toLocaleString(
                              'fa-IR',
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                          <div className="text-[11px] text-slate-400">
                            آماده تسویه
                          </div>
                          <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                            {customer360.affiliate_stats.available_commission_toman.toLocaleString(
                              'fa-IR',
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Referred Customers List */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          لیست کاربران عضو شده با لینک این مشتری
                        </h4>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          {customer360.affiliate_stats.referred_users.length ===
                          0 ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                              هنوز کاربری با لینک این معرف عضو نشده است.
                            </div>
                          ) : (
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-medium">
                                  <th className="py-2.5 px-3">نام و مشخصات</th>
                                  <th className="py-2.5 px-3">شماره تماس</th>
                                  <th className="py-2.5 px-3">تاریخ عضویت</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {customer360.affiliate_stats.referred_users.map(
                                  (ru) => (
                                    <tr
                                      key={ru.id}
                                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                    >
                                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                                        {ru.full_name}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                                        {ru.phone}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                        {new Date(
                                          ru.created_at,
                                        ).toLocaleDateString('fa-IR')}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ACCESS CONTROL, INTERNAL NOTES & DIRECT SMS */}
                  {activeDrawerTab === 'security' && (
                    <div className="space-y-6">
                      {/* Security & Access Controls */}
                      <form
                        onSubmit={handleSaveSecurityNotes}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
                      >
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          سطح کاربری، وضعیت انسداد و یادداشت‌های محرمانه اپراتور
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              تعیین سطح کاربری:
                            </label>
                            <select
                              value={editTier}
                              onChange={(e) =>
                                setEditTier(e.target.value as CustomerTier)
                              }
                              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              <option value="standard">
                                کاربر عادی (Standard)
                              </option>
                              <option value="colleague">
                                همکار / فروشنده (Colleague)
                              </option>
                              <option value="vip">
                                مشترک ویژه سازمانی (VIP Pro)
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              دلیل مسدودسازی حساب (در صورت مسدود بودن):
                            </label>
                            <input
                              type="text"
                              value={editBlockReason}
                              onChange={(e) =>
                                setEditBlockReason(e.target.value)
                              }
                              placeholder="مثلاً: تلاش برای تقلب یا نقض قوانین"
                              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            یادداشت‌های محرمانه داخلی اپراتورها (Internal Notes):
                          </label>
                          <textarea
                            rows={3}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="مثلاً: مشتری بسیار وفادار است، در تحویل اکانت‌های ۲FA حساس دقت شود..."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans leading-relaxed"
                          />
                        </div>

                        {securityFeedback && (
                          <div
                            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                              securityFeedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{securityFeedback.text}</span>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={securitySubmitting}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                          >
                            {securitySubmitting && (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            )}
                            <span>ذخیره تنظیمات و یادداشت</span>
                          </button>
                        </div>
                      </form>

                      {/* Direct SMS Sender using SMS.ir */}
                      <form
                        onSubmit={handleSendDirectSMS}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-emerald-600" />
                              ارسال پیامک مستقیم به مشتری از طریق پنل SMS.ir
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              ارسال به شماره موبایل {customer360.customer.phone}
                            </p>
                          </div>
                          <span className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                            SMS.ir Gateway
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            متن پیامک ارسالی:
                          </label>
                          <textarea
                            rows={3}
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            placeholder="متن پیام خود به کاربر را اینجا تایپ کنید (مثلاً اعلام رفع مشکل، هدیه شارژ کیف پول و...)"
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            شناسه قالب اعتبارسنجی (اختیاری - ویژه ارسال سریع
                            Verify):
                          </label>
                          <input
                            type="number"
                            value={smsTemplateId || ''}
                            onChange={(e) =>
                              setSmsTemplateId(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            placeholder="در صورت ارسال متنی عادی خالی بگذارید"
                            className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                          />
                        </div>

                        {smsFeedback && (
                          <div
                            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                              smsFeedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{smsFeedback.text}</span>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={smsSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {smsSubmitting
                                ? 'در حال ارسال پیامک...'
                                : 'ارسال مستقیم پیامک'}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* WALLET MANUAL CREDIT/DEBIT MODAL                                    */}
      {/* ==================================================================== */}
      {isWalletModalOpen && walletTargetUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  شارژ یا کسر دستی موجودی کیف پول کاربر
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  مشتری: {walletTargetUser.full_name} ({walletTargetUser.phone})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              {/* Current Balance Indicator */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
                <span className="text-slate-500">موجودی فعلی حساب:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {walletTargetUser.balance_toman.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              {/* Action Toggle (Credit / Debit) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalletAction('credit')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    walletAction === 'credit'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>شارژ (افزایش موجودی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletAction('debit')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    walletAction === 'debit'
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>کسر (کاهش موجودی)</span>
                </button>
              </div>

              {/* Amount Input & Quick Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  مبلغ تراکنش (تومان):
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(Number(e.target.value))}
                  required
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 text-left"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWalletAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {amt.toLocaleString('fa-IR')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandatory Reason Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  علت تراکنش <span className="text-red-500">* (اجباری)</span>:
                </label>
                <textarea
                  rows={2}
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  required
                  placeholder="مثلاً: واریز کارت به کارت آفلاین فیش شماره ۱۲۳۴۵، یا جبران خسارت قطعی اکانت"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  این علت در لاگ حسابرسی (AuditLog) و لاگ مالی تراکنش‌های مشتری
                  ثبت خواهد شد.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={walletSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                    walletAction === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  {walletSubmitting && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {walletAction === 'credit'
                      ? 'تایید و شارژ کیف پول'
                      : 'تایید و کسر از کیف پول'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REPLACE KEY MODAL                                                    */}
      {/* ==================================================================== */}
      {isReplaceKeyOpen && replaceTargetOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  تعویض یا درج کلید و لایسنس جدید
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  سفارش: {replaceTargetOrder.order_number} (
                  {replaceTargetOrder.product_title})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReplaceKeyOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplaceKeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  کلید، لایسنس یا اکانت جدید تحویلی به خریدار:
                </label>
                <textarea
                  rows={4}
                  value={newKeyPayload}
                  onChange={(e) => setNewKeyPayload(e.target.value)}
                  required
                  placeholder="کلید یا لینک فعال‌سازی جدید را اینجا وارد فرمایید..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  علت تعویض کلید (جهت ثبت در لاگ و حسابرسی):
                </label>
                <input
                  type="text"
                  value={replaceKeyReason}
                  onChange={(e) => setReplaceKeyReason(e.target.value)}
                  placeholder="مثلاً: قطع شدن اکانت قبلی، درخواست تمدید، رفع اشکال لایسنس"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReplaceKeyOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={replaceKeySubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  {replaceKeySubmitting && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>ثبت و تعویض کلید</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
