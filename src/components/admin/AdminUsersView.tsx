import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  Layers,
  Mail,
  Minus,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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

export const AdminUsersView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
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
  const [sortBy, setSortBy] = useState<
    | 'created_at'
    | 'last_login_at'
    | 'total_spent'
    | 'balance'
    | 'referral_balance'
    | 'profile_completed'
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

  // Password reset state
  const [newCustomerPassword, setNewCustomerPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [blockConfirm, setBlockConfirm] = useState<{
    isOpen: boolean
    user: AdminCustomerListItem | null
    loading: boolean
  }>({
    isOpen: false,
    user: null,
    loading: false,
  })

  const showToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      notifySuccess('عملیات موفق', text)
    } else {
      notifyError('خطا در عملیات', text)
    }
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
  }, [page, statusFilter, tierFilter, sortBy, sortOrder])

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
      showToast(
        'error',
        'درج علت تراکنش جهت ثبت در اسناد مالی و لاگ حسابرسی الزامی است.',
      )
      return
    }
    if (walletAmount <= 0) {
      showToast('error', 'مبلغ باید بزرگتر از صفر باشد.')
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

  // Quick Toggle Block Status with ConfirmModal
  const handleToggleBlock = (user: AdminCustomerListItem) => {
    if (user.is_active) {
      setBlockConfirm({
        isOpen: true,
        user,
        loading: false,
      })
    } else {
      executeToggleBlock(user, true, '')
    }
  }

  const executeToggleBlock = async (
    user: AdminCustomerListItem,
    nextState: boolean,
    reason: string,
  ) => {
    setBlockConfirm((prev) => ({ ...prev, loading: true }))
    try {
      const payload: AdminUpdateCustomerStatusRequest = {
        is_active: nextState,
        block_reason: reason,
      }
      await apiService.updateCustomerStatus(user.id, payload)
      showToast(
        'success',
        `حساب کاربری ${user.full_name || user.phone} با موفقیت ${nextState ? 'فعال و رفع انسداد' : 'مسدود'} شد.`,
      )
      setBlockConfirm({ isOpen: false, user: null, loading: false })
      loadCustomers()
      if (selectedCustomerId === user.id) {
        openCustomerDrawer(user.id)
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطا در تغییر وضعیت حساب')
      setBlockConfirm((prev) => ({ ...prev, loading: false }))
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

  // Generate random password
  const handleGenerateRandomPassword = () => {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let generated = ''
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCustomerPassword(generated)
    setShowNewPassword(true)
  }

  // Save new password
  const handleSaveNewPassword = async () => {
    if (!customer360 || !newCustomerPassword.trim()) return
    if (newCustomerPassword.trim().length < 6) {
      showToast('error', 'کلمه عبور جدید باید حداقل ۶ کاراکتر باشد')
      return
    }

    setPasswordSubmitting(true)
    try {
      await apiService.updateCustomerStatus(customer360.customer.id, {
        new_password: newCustomerPassword.trim(),
      })
      showToast(
        'success',
        `رمز عبور کاربر ${customer360.customer.full_name || customer360.customer.phone} با موفقیت تغییر یافت.`,
      )
      setNewCustomerPassword('')
    } catch (err: any) {
      showToast('error', err.message || 'خطا در تغییر رمز عبور کاربر')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  // Direct SMS Send
  const handleSendDirectSMS = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer360) return
    if (!smsMessage.trim()) {
      showToast('error', 'متن پیامک نمی‌تواند خالی باشد.')
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
      showToast('error', 'لایسنس یا کلید جدید الزامی است.')
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
      {/* Top Header Card & Stats Banner */}
      <AdminHeaderBanner
        icon={Users}
        title="مدیریت کاربران"
        subtitle="مشاهده پرونده کاربران، کنترل دسترسی‌ها، مدیریت کیف پول و سوابق سفارشات"
        badgeText="مدیریت کاربران"
        actions={
          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>به‌روزرسانی داده‌ها</span>
          </button>
        }
      />

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-surface border border-border/80 p-4 shadow-surface">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>کل کاربران ثبت‌نامی</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-black text-foreground font-sans">
            {formatNumber(data?.total || 0)}
          </div>
        </div>

        <div className="bg-card rounded-surface border border-border/80 p-4 shadow-surface">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>کاربران فعال</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-sans">
            {formatNumber(data?.total_active || 0)}
          </div>
        </div>

        <div className="bg-card rounded-surface border border-border/80 p-4 shadow-surface">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>همکاران و مشترکین VIP</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 font-sans">
            {formatNumber(data?.total_vip || 0)}
          </div>
        </div>

        <div className="bg-card rounded-surface border border-border/80 p-4 shadow-surface">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
            <span>کل موجودی کیف پول‌ها</span>
            <Wallet className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-sans text-foreground truncate">
            {formatToman(data?.total_balance_toman || 0)}{' '}
            <span className="text-xs font-normal text-muted-foreground font-sans">
              تومان
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Toolbar */}
      <div className="bg-card rounded-surface border border-border/80 p-4 sm:p-5 shadow-surface space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onSearch={() => {
            setPage(1)
            loadCustomers()
          }}
          placeholder="جستجوی سریع بر اساس: شماره موبایل، نام و نام‌خانوادگی، ایمیل، یا کد معرف..."
          debounceMs={300}
        />

        {/* Filter Pills and Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-muted/30 border border-border/40 p-1 rounded-control">
              <span className="text-[11px] font-bold text-muted-foreground px-2">
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
                  className={`px-3 py-1 rounded-control text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-primary text-primary-foreground shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'all' && 'همه'}
                  {st === 'active' && 'فعال'}
                  {st === 'blocked' && 'مسدود'}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1.5 bg-muted/30 border border-border/40 p-1 rounded-control">
              <span className="text-[11px] font-bold text-muted-foreground px-2">
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
                  className={`px-3 py-1 rounded-control text-xs font-bold transition-all cursor-pointer ${
                    tierFilter === tr
                      ? 'bg-primary text-primary-foreground shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tr === 'all' && 'همه'}
                  {tr === 'standard' && 'عادی'}
                  {tr === 'colleague' && 'همکار'}
                  {tr === 'vip' && 'VIP'}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground">
              مرتب‌سازی:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any)
                setPage(1)
              }}
              className="h-8 px-2.5 rounded-control border border-border/60 bg-card text-foreground text-xs focus:outline-none focus:border-brand font-bold cursor-pointer"
            >
              <option value="created_at">تاریخ عضویت</option>
              <option value="last_login_at">آخرین ورود</option>
              <option value="total_spent">مجموع خرید</option>
              <option value="balance">موجودی کیف پول</option>
              <option value="referral_balance">درآمد معرف (ریفرال)</option>
              <option value="profile_completed">پروفایل‌های تکمیل‌شده</option>
            </select>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
              }
              className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition shadow-control cursor-pointer"
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
      <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold select-none">
                <th className="py-4 px-4 text-center">
                  اطلاعات هویتی و شماره موبایل
                </th>
                <th className="py-4 px-4 text-center">
                  موجودی کیف پول (تومان)
                </th>
                <th className="py-4 px-4 text-center">تعداد سفارش‌ها</th>
                <th className="py-4 px-4 text-center">درآمد معرف (ریفرال)</th>
                <th className="py-4 px-4 text-center">آخرین ورود و وضعیت</th>
                <th className="py-4 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <LoadingState message="در حال فراخوانی اطلاعات کاربران..." />
                  </td>
                </tr>
              )}

              {!loading &&
                (!data?.customers || data.customers.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
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
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Identity & Mobile */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="relative shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || 'کاربر'}
                                className="w-10 h-10 rounded-control object-cover border border-border/60 shadow-control"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-control bg-secondary text-foreground border border-border/60 flex items-center justify-center font-bold text-sm shadow-control">
                                {user.full_name?.charAt(0) || 'ک'}
                              </div>
                            )}
                            {user.is_online && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse"
                                title="کاربر آنلاین است"
                              />
                            )}
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openCustomerDrawer(user.id)}
                                className="font-bold text-foreground hover:text-brand text-right transition-colors cursor-pointer"
                              >
                                {user.full_name || 'کاربر بدون نام'}
                              </button>
                              {user.tier === 'vip' && (
                                <span className="px-1.5 py-0.5 rounded-control text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                  VIP
                                </span>
                              )}
                              {user.tier === 'colleague' && (
                                <span className="px-1.5 py-0.5 rounded-control text-[10px] font-black bg-brand/10 text-brand border border-brand/30">
                                  همکار
                                </span>
                              )}
                              {user.full_name && user.email ? (
                                <span className="px-1.5 py-0.2 rounded-control text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  پروفایل کامل ✓
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded-control text-[9px] font-bold bg-muted text-muted-foreground border border-border/40">
                                  شماره خام
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono font-latin mt-0.5">
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
                      <td className="py-3.5 px-4 font-sans text-center">
                        <span
                          className={`font-bold text-sm ${
                            isPositiveBalance
                              ? 'text-emerald-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatToman(user.balance_toman)}
                        </span>
                        <span className="text-[10px] text-muted-foreground mr-1 font-sans">
                          تومان
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-sans font-bold text-foreground">
                            {formatNumber(user.total_orders_count)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-sans">
                            (
                            {user.store_orders_count > 0
                              ? `${toPersianDigits(user.store_orders_count)} اشتراک`
                              : '۰'}
                            {user.virtual_orders_count > 0
                              ? ` + ${toPersianDigits(user.virtual_orders_count)} شماره`
                              : ''}
                            )
                          </span>
                        </div>
                      </td>

                      {/* Referral Income */}
                      <td className="py-3.5 px-4 font-sans text-center">
                        <div className="font-bold text-foreground">
                          {formatToman(user.referral_balance_toman)}{' '}
                          <span className="text-[10px] font-sans font-normal text-muted-foreground">
                            تومان
                          </span>
                        </div>
                        <div className="text-[10px] text-brand font-bold font-latin">
                          کد: {user.referral_code}
                        </div>
                      </td>

                      {/* Last Login & Online Status */}
                      <td className="py-3.5 px-4 text-[11px] text-center">
                        {user.last_login_at ? (
                          <div className="space-y-0.5 inline-block text-center">
                            <div className="font-mono font-latin text-foreground">
                              {new Date(user.last_login_at).toLocaleDateString(
                                'fa-IR',
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="font-mono font-latin">
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
                          <span className="text-muted-foreground">
                            بدون ورود
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {/* 360 Profile Drawer Button */}
                          <button
                            type="button"
                            onClick={() => openCustomerDrawer(user.id)}
                            className="h-8 px-3 rounded-control bg-brand/10 text-brand hover:bg-brand/20 border border-brand/30 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold duration-motion active:scale-[0.98]"
                            title="مشاهده پرونده کامل مشتری، وضعیت حساب و مدیریت مالی"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده پرونده</span>
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
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="font-sans">
              نمایش صفحه {toPersianDigits(data.page)} از{' '}
              {toPersianDigits(Math.ceil(data.total / data.page_size) || 1)}{' '}
              (مجموع {formatNumber(data.total)} کاربر)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground disabled:opacity-40 transition shadow-control cursor-pointer"
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={page >= Math.ceil(data.total / data.page_size)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground disabled:opacity-40 transition shadow-control cursor-pointer"
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
      {selectedCustomerId &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div
                className="w-full max-w-4xl my-auto bg-card rounded-surface border border-border/80 shadow-overlay flex flex-col text-foreground overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
                dir="rtl"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-12 h-12 rounded-control bg-secondary border border-border/60 overflow-hidden shrink-0 flex items-center justify-center shadow-control">
                      {customer360?.customer.avatar_url ? (
                        <img
                          src={customer360.customer.avatar_url}
                          alt={customer360.customer.full_name || 'کاربر'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="font-bold text-lg text-brand font-latin">
                          {customer360?.customer.full_name?.charAt(0) || 'ک'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-foreground">
                          {customer360?.customer.full_name || 'کاربر بدون نام'}
                        </h3>
                        {customer360?.customer.tier && (
                          <span className="px-2 py-0.5 rounded-control text-[10px] font-black bg-brand/10 text-brand border border-brand/20 font-latin">
                            سطح: {customer360.customer.tier.toUpperCase()}
                          </span>
                        )}
                        {customer360?.customer.is_online && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            آنلاین
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1 font-mono font-latin">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-brand" />
                          {customer360?.customer.phone}
                        </span>
                        {customer360?.customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-brand" />
                            {customer360.customer.email}
                          </span>
                        )}
                        <span className="font-sans text-[11px] text-muted-foreground">
                          عضویت:{' '}
                          {customer360?.customer.created_at &&
                            new Date(
                              customer360.customer.created_at,
                            ).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ModalCloseButton onClick={closeDrawer} size="sm" />
                </div>

                {/* 5 Vital Tabs Bar */}
                <div className="flex items-center border-b border-border/60 px-4 sm:px-6 bg-card shrink-0 overflow-x-auto text-xs font-semibold scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('wallet')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeDrawerTab === 'wallet'
                        ? 'border-brand text-brand font-black'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>کیف پول و مدیریت مالی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('orders')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeDrawerTab === 'orders'
                        ? 'border-brand text-brand font-black'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>
                      سفارشات اشتراک ({customer360?.orders.length || 0})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('virtual_numbers')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeDrawerTab === 'virtual_numbers'
                        ? 'border-brand text-brand font-black'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Radio className="w-4 h-4" />
                    <span>
                      شماره‌های مجازی ({customer360?.virtual_numbers.length || 0}
                      )
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('affiliate')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeDrawerTab === 'affiliate'
                        ? 'border-brand text-brand font-black'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>
                      زیرمجموعه‌ها و معرف (
                      {customer360?.affiliate_stats.referred_count || 0})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDrawerTab('security')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeDrawerTab === 'security'
                        ? 'border-brand text-brand font-black'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>کنترل دسترسی، یادداشت و پیامک</span>
                  </button>
                </div>

                {/* Drawer Body Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                  {drawerLoading && (
                    <LoadingState message="در حال بارگذاری پرونده ۳۶۰ درجه مشتری..." />
                  )}

                  {!drawerLoading && customer360 && (
                    <>
                      {/* TAB 1: WALLET & FINANCIAL ADJUSTMENT */}
                      {activeDrawerTab === 'wallet' && (
                        <div className="space-y-6">
                          {/* Balance Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-surface border border-border/80 bg-card p-5 shadow-surface relative overflow-hidden space-y-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-bold">
                                  موجودی فعلی کیف پول
                                </span>
                                <Wallet className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div className="text-3xl font-black font-mono font-latin text-foreground">
                                {customer360.customer.balance_toman.toLocaleString(
                                  'fa-IR',
                                )}{' '}
                                <span className="text-sm font-sans font-normal text-muted-foreground">
                                  تومان
                                </span>
                              </div>
                              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWalletAction('credit')
                                    openWalletModal(customer360.customer)
                                  }}
                                  className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition-all flex items-center gap-1.5 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
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
                                  className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold transition-all flex items-center gap-1.5 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                  <span>کسر دستی</span>
                                </button>
                              </div>
                            </div>

                            <div className="rounded-surface border border-border/80 bg-card p-5 shadow-surface flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="font-bold">
                                    موجودی پورسانت ریفرال
                                  </span>
                                  <Share2 className="w-4 h-4 text-brand" />
                                </div>
                                <div className="text-2xl font-black font-mono font-latin text-foreground mt-1">
                                  {customer360.customer.referral_balance_toman.toLocaleString(
                                    'fa-IR',
                                  )}{' '}
                                  <span className="text-xs font-sans font-normal text-muted-foreground">
                                    تومان
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                                کاربر می‌تواند این مبلغ را مستقیماً به کیف پول
                                خرید خود منتقل کرده یا درخواست تسویه ریالی ثبت
                                کند.
                              </p>
                            </div>
                          </div>

                          {/* Transactions History Table */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand" />
                                <span>تاریخچه تراکنش‌های کیف پول مشتری</span>
                              </h4>
                              <span className="text-xs text-muted-foreground font-mono font-latin">
                                {customer360.wallet_transactions.length} تراکنش
                                اخیر
                              </span>
                            </div>

                            <div className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface">
                              {customer360.wallet_transactions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                  هیچ تراکنش مالی برای این کاربر ثبت نشده است.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-center text-xs">
                                    <thead>
                                      <tr className="bg-muted/40 text-muted-foreground border-b border-border/60 font-semibold select-none">
                                        <th className="py-2.5 px-3 text-center">
                                          کد تراکنش
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          نوع عملیات
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          مبلغ (تومان)
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          شرح و علت
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          تاریخ
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                      {customer360.wallet_transactions.map(
                                        (tx: any) => (
                                          <tr
                                            key={tx.id}
                                            className="hover:bg-muted/30 transition-colors"
                                          >
                                            <td className="py-3 px-3 font-mono font-latin font-bold text-brand text-center">
                                              {tx.transaction_number}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[10px] font-bold border ${
                                                  tx.order_type ===
                                                    'admin_adjustment' ||
                                                  tx.order_type === 'deposit'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                }`}
                                              >
                                                {tx.order_type ===
                                                  'admin_adjustment' &&
                                                  'تعدیل دستی ادمین'}
                                                {tx.order_type === 'deposit' &&
                                                  'شارژ آنلاین'}
                                                {tx.order_type === 'refund' &&
                                                  'استرداد وجه'}
                                                {tx.order_type ===
                                                  'store_order' &&
                                                  'خرید اشتراک'}
                                                {tx.order_type ===
                                                  'virtual_number' &&
                                                  'شماره مجازی'}
                                              </span>
                                            </td>
                                            <td className="py-3 px-3 font-mono font-latin font-bold text-foreground text-center">
                                              {tx.amount_toman.toLocaleString(
                                                'fa-IR',
                                              )}
                                            </td>
                                            <td className="py-3 px-3 text-muted-foreground max-w-[220px] truncate text-center mx-auto">
                                              {tx.description || '-'}
                                            </td>
                                            <td className="py-3 px-3 font-mono font-latin text-muted-foreground text-[11px] text-center">
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
                            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                              <Layers className="w-4 h-4 text-brand" />
                              <span>
                                تاریخچه خریدهای لایسنس و اشتراک‌های اختصاصی
                              </span>
                            </h4>
                            <span className="text-xs text-muted-foreground font-mono font-latin">
                              مجموع {customer360.orders.length} سفارش
                            </span>
                          </div>

                          {customer360.orders.length === 0 ? (
                            <div className="rounded-surface border border-border/80 bg-card p-12 text-center text-muted-foreground text-xs shadow-surface">
                              هنوز سفارشی برای این مشتری ثبت نشده است.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {customer360.orders.map((ord) => (
                                <div
                                  key={ord.id}
                                  className="rounded-surface border border-border/80 bg-card p-4 space-y-3 shadow-surface hover:border-brand/40 transition-colors"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-latin font-bold text-brand text-xs">
                                          {ord.order_number}
                                        </span>
                                        <span className="font-black text-xs text-foreground">
                                          {ord.product_title}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-muted-foreground font-mono font-latin mt-0.5 block">
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
                                      <span className="px-2.5 py-1 rounded-control text-[10px] font-bold bg-muted text-muted-foreground border border-border/60">
                                        {ord.status}
                                      </span>
                                      <span className="font-mono font-latin font-bold text-xs text-foreground">
                                        {ord.total_amount_toman.toLocaleString(
                                          'fa-IR',
                                        )}{' '}
                                        تومان
                                      </span>
                                    </div>
                                  </div>

                                  {/* Delivered Payload / Key Area */}
                                  {ord.delivered_payload ? (
                                    <div className="bg-muted/20 p-3 rounded-control border border-border/60 flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-[10px] text-muted-foreground mb-0.5 font-bold">
                                          لایسنس / مشخصات تحویل داده شده به
                                          مشتری:
                                        </div>
                                        <div className="font-mono font-latin text-xs text-foreground truncate select-all">
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
                                          className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition-colors cursor-pointer"
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
                                          onClick={() =>
                                            openReplaceKeyModal(ord)
                                          }
                                          className="h-8 px-2.5 rounded-control bg-secondary text-brand hover:bg-muted border border-border/60 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer duration-motion active:scale-[0.98]"
                                        >
                                          <Key className="w-3 h-3" />
                                          <span>تعویض کلید</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
                                      <span>
                                        هنوز کلید یا لایسنسی تحویل داده نشده
                                        است.
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openReplaceKeyModal(ord)}
                                        className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer duration-motion active:scale-[0.98] shadow-control"
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
                            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                              <Radio className="w-4 h-4 text-brand" />
                              <span>
                                تاریخچه شماره‌های مجازی خریداری‌شده (5SIM)
                              </span>
                            </h4>
                            <span className="text-xs text-muted-foreground font-mono font-latin">
                              {customer360.virtual_numbers.length} شماره
                            </span>
                          </div>

                          {customer360.virtual_numbers.length === 0 ? (
                            <div className="rounded-surface border border-border/80 bg-card p-12 text-center text-muted-foreground text-xs shadow-surface">
                              این کاربر هیچ خرید شماره مجازی نداشته است.
                            </div>
                          ) : (
                            <div className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface">
                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr className="bg-muted/40 text-muted-foreground border-b border-border/60 font-semibold select-none">
                                      <th className="py-3 px-3 text-center">
                                        کشور و سرویس
                                      </th>
                                      <th className="py-3 px-3 text-center">
                                        شماره دریافتی
                                      </th>
                                      <th className="py-3 px-3 text-center">
                                        کد SMS دریافتی
                                      </th>
                                      <th className="py-3 px-3 text-center">
                                        قیمت (تومان)
                                      </th>
                                      <th className="py-3 px-3 text-center">
                                        وضعیت
                                      </th>
                                      <th className="py-3 px-3 text-center">
                                        تاریخ
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60">
                                    {customer360.virtual_numbers.map(
                                      (vn: any) => (
                                        <tr
                                          key={vn.id}
                                          className="hover:bg-muted/30 transition-colors"
                                        >
                                          <td className="py-3 px-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              <span className="text-base">
                                                {vn.country_flag || '🌐'}
                                              </span>
                                              <div className="text-right">
                                                <div className="font-bold text-foreground">
                                                  {vn.service_name_fa ||
                                                    vn.service}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-latin">
                                                  {vn.country_name_fa ||
                                                    vn.country}{' '}
                                                  ({vn.operator})
                                                </div>
                                              </div>
                                            </div>
                                          </td>

                                          <td className="py-3 px-3 font-mono font-latin font-bold text-foreground text-center">
                                            {vn.phone}
                                          </td>

                                          <td className="py-3 px-3 text-center">
                                            {vn.sms_code ? (
                                              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono font-latin font-bold px-2.5 py-1 rounded-control">
                                                <span>{vn.sms_code}</span>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    copyToClipboard(
                                                      vn.sms_code,
                                                      vn.id,
                                                    )
                                                  }
                                                  className="p-0.5 hover:bg-emerald-500/20 rounded cursor-pointer"
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
                                              <span className="text-muted-foreground text-xs">
                                                در انتظار پیامک...
                                              </span>
                                            )}
                                          </td>

                                          <td className="py-3 px-3 font-mono font-latin font-bold text-foreground text-center">
                                            {vn.price_toman.toLocaleString(
                                              'fa-IR',
                                            )}
                                          </td>

                                          <td className="py-3 px-3 text-center">
                                            <span
                                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border ${
                                                vn.status === 'RECEIVED' ||
                                                vn.status === 'FINISHED'
                                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                                  : vn.status === 'CANCELED'
                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                              }`}
                                            >
                                              {vn.status}
                                            </span>
                                          </td>

                                          <td className="py-3 px-3 font-mono font-latin text-[11px] text-muted-foreground text-center">
                                            {new Date(
                                              vn.created_at,
                                            ).toLocaleDateString('fa-IR')}
                                          </td>
                                        </tr>
                                      ),
                                    )}
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
                          <div className="rounded-surface border border-border/80 bg-card p-5 shadow-surface flex items-center justify-between gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground font-bold">
                                کد معرف اختصاصی این کاربر:
                              </div>
                              <div className="text-2xl font-black font-mono font-latin text-brand mt-0.5 tracking-wider">
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
                              className="h-9 px-3.5 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                            >
                              {copiedKey === 'ref-code' ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              <span>کپی کد معرف</span>
                            </button>
                          </div>

                          {/* 4 Stats Cards */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="rounded-surface border border-border/60 bg-muted/20 p-3.5 space-y-1">
                              <div className="text-[11px] text-muted-foreground font-bold">
                                تعداد زیرمجموعه‌ها
                              </div>
                              <div className="text-xl font-black font-mono font-latin text-foreground mt-1">
                                {customer360.affiliate_stats.referred_count.toLocaleString(
                                  'fa-IR',
                                )}
                              </div>
                            </div>

                            <div className="rounded-surface border border-border/60 bg-muted/20 p-3.5 space-y-1">
                              <div className="text-[11px] text-muted-foreground font-bold">
                                کل درآمد کمیسیون
                              </div>
                              <div className="text-lg font-black font-mono font-latin text-emerald-500 mt-1">
                                {customer360.affiliate_stats.total_commission_toman.toLocaleString(
                                  'fa-IR',
                                )}
                              </div>
                            </div>

                            <div className="rounded-surface border border-border/60 bg-muted/20 p-3.5 space-y-1">
                              <div className="text-[11px] text-muted-foreground font-bold">
                                انتقال به کیف پول
                              </div>
                              <div className="text-lg font-black font-mono font-latin text-brand mt-1">
                                {customer360.affiliate_stats.transferred_commission_toman.toLocaleString(
                                  'fa-IR',
                                )}
                              </div>
                            </div>

                            <div className="rounded-surface border border-border/60 bg-muted/20 p-3.5 space-y-1">
                              <div className="text-[11px] text-muted-foreground font-bold">
                                آماده تسویه
                              </div>
                              <div className="text-lg font-black font-mono font-latin text-amber-500 mt-1">
                                {customer360.affiliate_stats.available_commission_toman.toLocaleString(
                                  'fa-IR',
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Referred Customers List */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                              <Users className="w-4 h-4 text-brand" />
                              <span>
                                لیست کاربران عضو شده با لینک این مشتری
                              </span>
                            </h4>

                            <div className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface">
                              {customer360.affiliate_stats.referred_users
                                .length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                  هنوز کاربری با لینک این معرف عضو نشده است.
                                </div>
                              ) : (
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr className="bg-muted/40 text-muted-foreground border-b border-border/60 font-semibold select-none">
                                      <th className="py-2.5 px-3 text-center">
                                        نام و مشخصات
                                      </th>
                                      <th className="py-2.5 px-3 text-center">
                                        شماره تماس
                                      </th>
                                      <th className="py-2.5 px-3 text-center">
                                        تاریخ عضویت
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60">
                                    {customer360.affiliate_stats.referred_users.map(
                                      (ru) => (
                                        <tr
                                          key={ru.id}
                                          className="hover:bg-muted/30 transition-colors"
                                        >
                                          <td className="py-2.5 px-3 font-bold text-foreground text-center">
                                            {ru.full_name}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono font-latin text-muted-foreground text-center">
                                            {ru.phone}
                                          </td>
                                          <td className="py-2.5 px-3 font-mono font-latin text-muted-foreground text-[11px] text-center">
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
                          {/* Account Active / Blocked Status Card */}
                          {customer360?.customer && (
                            <div className="flex items-center justify-between p-4 rounded-surface border border-border/80 bg-muted/20 shadow-xs">
                              <div className="space-y-0.5">
                                <span className="font-black text-foreground text-xs block">
                                  وضعیت فعال بودن حساب کاربری خریدار
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  در صورت مسدود بودن، کاربر امکان ورود و ثبت
                                  سفارش جدید را نخواهد داشت.
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${
                                    customer360.customer.is_active
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                  }`}
                                >
                                  {customer360.customer.is_active
                                    ? 'حساب فعال'
                                    : 'حساب مسدود'}
                                </span>
                                <ToggleSwitch
                                  size="sm"
                                  checked={customer360.customer.is_active}
                                  onChange={() =>
                                    handleToggleBlock(customer360.customer)
                                  }
                                  ariaLabel="وضعیت فعال یا مسدود بودن حساب کاربری"
                                />
                              </div>
                            </div>
                          )}

                          {/* Change / Reset User Password */}
                          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-4">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                              <div className="flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-brand" />
                                <h4 className="text-sm font-black text-foreground">
                                  تغییر و بازنشانی رمز عبور کاربر
                                </h4>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-latin font-bold bg-muted px-2 py-0.5 rounded-control border border-border/40">
                                BCrypt Hash Security
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">
                                  کلمه عبور جدید (حداقل ۶ کاراکتر):
                                </label>
                                <div className="relative">
                                  <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newCustomerPassword}
                                    onChange={(e) =>
                                      setNewCustomerPassword(e.target.value)
                                    }
                                    placeholder="رمز عبور جدید را وارد فرمایید..."
                                    className="w-full h-10 pr-3.5 pl-10 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin text-foreground focus:outline-none focus:border-brand"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowNewPassword(!showNewPassword)
                                    }
                                    className="absolute left-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                    title={
                                      showNewPassword ? 'مخفی‌سازی' : 'نمایش'
                                    }
                                  >
                                    {showNewPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5 flex flex-col justify-end">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleGenerateRandomPassword}
                                    className="h-10 px-3.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>تولید رمز تصادفی</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleSaveNewPassword}
                                    disabled={
                                      passwordSubmitting ||
                                      !newCustomerPassword.trim()
                                    }
                                    className="h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-control duration-motion active:scale-[0.98] disabled:opacity-40"
                                  >
                                    {passwordSubmitting && (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                                    )}
                                    <span>ذخیره رمز عبور</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Security & Access Controls */}
                          <form
                            onSubmit={handleSaveSecurityNotes}
                            className="bg-card rounded-surface border border-border/80 p-5 sm:p-6 shadow-surface space-y-4 text-foreground"
                          >
                            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-brand" />
                              <span>
                                سطح کاربری، وضعیت انسداد و یادداشت‌های محرمانه
                                اپراتور
                              </span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">
                                  تعیین سطح کاربری:
                                </label>
                                <select
                                  value={editTier}
                                  onChange={(e) =>
                                    setEditTier(e.target.value as CustomerTier)
                                  }
                                  className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-xs font-bold text-foreground focus:outline-none focus:border-brand cursor-pointer"
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

                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">
                                  دلیل مسدودسازی حساب (در صورت مسدود بودن):
                                </label>
                                <input
                                  type="text"
                                  value={editBlockReason}
                                  onChange={(e) =>
                                    setEditBlockReason(e.target.value)
                                  }
                                  placeholder="مثلاً: تلاش برای تقلب یا نقض قوانین"
                                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-sans"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">
                                یادداشت‌های محرمانه داخلی اپراتورها (Internal
                                Notes):
                              </label>
                              <textarea
                                rows={3}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="مثلاً: مشتری بسیار وفادار است، در تحویل اکانت‌های ۲FA حساس دقت شود..."
                                className="w-full p-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-sans leading-relaxed resize-none"
                              />
                            </div>

                            {securityFeedback && (
                              <div
                                className={`p-3 rounded-control text-xs font-bold flex items-center gap-2 ${
                                  securityFeedback.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{securityFeedback.text}</span>
                              </div>
                            )}

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={securitySubmitting}
                                className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                              >
                                {securitySubmitting && (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                                )}
                                <span>ذخیره تنظیمات و یادداشت</span>
                              </button>
                            </div>
                          </form>

                          {/* Direct SMS Sender using SMS.ir */}
                          <form
                            onSubmit={handleSendDirectSMS}
                            className="bg-card rounded-surface border border-border/80 p-5 sm:p-6 shadow-surface space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                              <div>
                                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-emerald-500" />
                                  <span>
                                    ارسال پیامک مستقیم به مشتری از طریق پنل
                                    SMS.ir
                                  </span>
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono font-latin">
                                  شماره گیرنده: {customer360.customer.phone}
                                </p>
                              </div>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-control font-latin">
                                SMS.ir Gateway
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">
                                متن پیامک ارسالی:
                              </label>
                              <textarea
                                rows={3}
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                                placeholder="متن پیام خود به کاربر را اینجا تایپ کنید (مثلاً اعلام رفع مشکل، هدیه شارژ کیف پول و...)"
                                className="w-full p-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-sans leading-relaxed resize-none"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">
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
                                className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin"
                              />
                            </div>

                            {smsFeedback && (
                              <div
                                className={`p-3 rounded-control text-xs font-bold flex items-center gap-2 ${
                                  smsFeedback.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{smsFeedback.text}</span>
                              </div>
                            )}

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={smsSubmitting}
                                className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                              >
                                {smsSubmitting ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
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
          </div>,
          document.body,
        )}

      {/* ==================================================================== */}
      {/* WALLET MANUAL CREDIT/DEBIT MODAL                                    */}
      {/* ==================================================================== */}
      {isWalletModalOpen &&
        walletTargetUser &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div
                className="w-full max-w-lg my-auto bg-card text-card-foreground rounded-surface shadow-overlay border border-border/80 p-6 space-y-5 animate-in zoom-in-95 duration-200"
                dir="rtl"
              >
                <div className="flex items-start justify-between border-b border-border/60 pb-4">
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      <Coins className="w-5 h-5 text-emerald-500" />
                      شارژ یا کسر دستی موجودی کیف پول کاربر
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      مشتری: {walletTargetUser.full_name} (
                      {walletTargetUser.phone})
                    </p>
                  </div>

                  <ModalCloseButton
                    onClick={() => setIsWalletModalOpen(false)}
                    size="sm"
                  />
                </div>

                <form onSubmit={handleWalletSubmit} className="space-y-4">
                  {/* Current Balance Indicator */}
                  <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-bold">
                      موجودی فعلی حساب:
                    </span>
                    <span className="font-mono font-latin font-bold text-foreground">
                      {walletTargetUser.balance_toman.toLocaleString('fa-IR')}{' '}
                      تومان
                    </span>
                  </div>

                  {/* Action Toggle (Credit / Debit) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWalletAction('credit')}
                      className={`h-10 px-4 rounded-control text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                        walletAction === 'credit'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-control font-black'
                          : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>شارژ (افزایش موجودی)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalletAction('debit')}
                      className={`h-10 px-4 rounded-control text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                        walletAction === 'debit'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-control font-black'
                          : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      <span>کسر (کاهش موجودی)</span>
                    </button>
                  </div>

                  {/* Amount Input & Quick Chips */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      مبلغ تراکنش (تومان):
                    </label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(Number(e.target.value))}
                      required
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin text-sm font-bold focus:outline-none focus:border-brand text-left"
                    />

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setWalletAmount(amt)}
                          className="px-2.5 py-1 rounded-control bg-secondary hover:bg-muted text-[11px] font-mono font-latin text-foreground border border-border/60 transition shadow-xs cursor-pointer"
                        >
                          {amt.toLocaleString('fa-IR')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mandatory Reason Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      علت تراکنش{' '}
                      <span className="text-destructive">* (اجباری)</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={walletReason}
                      onChange={(e) => setWalletReason(e.target.value)}
                      required
                      placeholder="مثلاً: واریز کارت به کارت آفلاین فیش شماره ۱۲۳۴۵، یا جبران خسارت قطعی اکانت"
                      className="w-full p-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-sans leading-relaxed resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      این علت در لاگ حسابرسی (AuditLog) و لاگ مالی تراکنش‌های
                      مشتری ثبت خواهد شد.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={walletSubmitting}
                      className={`w-full h-11 rounded-control text-primary-foreground text-xs font-black transition-all shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50 ${
                        walletAction === 'credit'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {walletSubmitting && (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      )}
                      <span>
                        {walletAction === 'credit'
                          ? 'تایید و شارژ کیف پول کاربر'
                          : 'تایید و کسر از کیف پول کاربر'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ==================================================================== */}
      {/* REPLACE KEY MODAL                                                    */}
      {/* ==================================================================== */}
      {isReplaceKeyOpen &&
        replaceTargetOrder &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div
                className="w-full max-w-lg my-auto bg-card text-card-foreground rounded-surface shadow-overlay border border-border/80 p-6 space-y-5 animate-in zoom-in-95 duration-200"
                dir="rtl"
              >
                <div className="flex items-start justify-between border-b border-border/60 pb-4">
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      <Key className="w-5 h-5 text-brand" />
                      تعویض یا درج کلید و لایسنس جدید
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      سفارش: {replaceTargetOrder.order_number} (
                      {replaceTargetOrder.product_title})
                    </p>
                  </div>

                  <ModalCloseButton
                    onClick={() => setIsReplaceKeyOpen(false)}
                    size="sm"
                  />
                </div>

                <form onSubmit={handleReplaceKeySubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      کلید، لایسنس یا اکانت جدید تحویلی به خریدار:
                    </label>
                    <textarea
                      rows={4}
                      value={newKeyPayload}
                      onChange={(e) => setNewKeyPayload(e.target.value)}
                      required
                      placeholder="کلید یا لینک فعال‌سازی جدید را اینجا وارد فرمایید..."
                      className="w-full p-3.5 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin text-foreground focus:outline-none focus:border-brand text-left resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      علت تعویض کلید (جهت ثبت در لاگ و حسابرسی):
                    </label>
                    <input
                      type="text"
                      value={replaceKeyReason}
                      onChange={(e) => setReplaceKeyReason(e.target.value)}
                      placeholder="مثلاً: قطع شدن اکانت قبلی، درخواست تمدید، رفع اشکال لایسنس"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setIsReplaceKeyOpen(false)}
                      className="h-10 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground transition shadow-control cursor-pointer"
                    >
                      انصراف
                    </button>

                    <button
                      type="submit"
                      disabled={replaceKeySubmitting}
                      className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                    >
                      {replaceKeySubmitting && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                      )}
                      <span>ثبت و تعویض کلید</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Block Account Confirmation Modal */}
      <ConfirmModal
        isOpen={blockConfirm.isOpen && Boolean(blockConfirm.user)}
        onClose={() =>
          setBlockConfirm({ isOpen: false, user: null, loading: false })
        }
        onConfirm={() => {
          if (blockConfirm.user) {
            executeToggleBlock(
              blockConfirm.user,
              false,
              'مسدودسازی توسط مدیر سیستم',
            )
          }
        }}
        title="مسدودسازی حساب کاربری"
        description={`آیا از مسدودسازی دسترسی کاربر «${blockConfirm.user?.full_name || blockConfirm.user?.phone || ''}» اطمینان دارید؟ کاربر امکان ورود به حساب و ثبت سفارش جدید را نخواهد داشت.`}
        confirmText="بله، حساب مسدود شود"
        cancelText="انصراف"
        loading={blockConfirm.loading}
        variant="danger"
      />
    </div>
  )
}
