import {
  BellRing,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Globe2,
  Layers,
  Megaphone,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { SystemAnnouncement } from '../../types'
import { toPersianDigits } from '../../utils/formatters'
import { MarkdownRenderer } from '../content/MarkdownRenderer'
import { RichContentEditor } from '../content/RichContentEditor'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'

export const AdminAnnouncementsView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()

  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [loadingAnnounce, setLoadingAnnounce] = useState(false)
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false)
  const [editingAnnounce, setEditingAnnounce] =
    useState<SystemAnnouncement | null>(null)
  const [savingAnnounce, setSavingAnnounce] = useState(false)
  const [deleteAnnounceId, setDeleteAnnounceId] = useState<string | null>(null)
  const [uploadingAnnounceImage, setUploadingAnnounceImage] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [filterDisplayType, setFilterDisplayType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [previewAnnounce, setPreviewAnnounce] =
    useState<SystemAnnouncement | null>(null)

  // Announcement Form Fields
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceContent, setAnnounceContent] = useState('')
  const [announceImage, setAnnounceImage] = useState('')
  const [announceTargetPages, setAnnounceTargetPages] = useState('all')
  const [announceDisplayType, setAnnounceDisplayType] = useState<
    'bell_only' | 'popup_first_load' | 'bell_and_popup' | 'banner_top'
  >('bell_and_popup')
  const [announceSeverity, setAnnounceSeverity] = useState<
    'info' | 'warning' | 'discount' | 'success'
  >('info')
  const [announceExpiresAt, setAnnounceExpiresAt] = useState('')
  const [announceDismissDuration, setAnnounceDismissDuration] = useState<
    'every_load' | '24h' | '7d' | '30d' | 'forever'
  >('7d')
  const [announceIsActive, setAnnounceIsActive] = useState(true)

  // Active Main Tab ('broadcast' | 'customer_messages')
  const [activeMainTab, setActiveMainTab] = useState<
    'broadcast' | 'customer_messages'
  >('broadcast')

  // Customer In-App Account Notifications State
  const [customerMessages, setCustomerMessages] = useState<any[]>([])
  const [loadingCustMessages, setLoadingCustMessages] = useState(false)
  const [isSendCustModalOpen, setIsSendCustModalOpen] = useState(false)
  const [sendTarget, setSendTarget] = useState<'all' | 'specific'>('all')
  const [sendCustId, setSendCustId] = useState('')
  const [sendTitle, setSendTitle] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendType, setSendType] = useState<
    'system' | 'security' | 'loyalty' | 'order'
  >('system')
  const [sendLink, setSendLink] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [deleteCustMessageId, setDeleteCustMessageId] = useState<string | null>(
    null,
  )
  const [custSearchQuery, setCustSearchQuery] = useState('')

  const loadCustomerMessages = async () => {
    setLoadingCustMessages(true)
    try {
      const data = await apiService.adminListCustomerNotifications()
      setCustomerMessages(data || [])
    } catch (err: any) {
      notifyError('خطا در بارگذاری پیام‌های کاربران', err.message)
    } finally {
      setLoadingCustMessages(false)
    }
  }

  const handleSendCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendTitle.trim() || !sendMessage.trim()) return
    setSendingMessage(true)
    try {
      await apiService.adminSendCustomerNotification({
        target: sendTarget,
        customer_id: sendTarget === 'specific' ? sendCustId.trim() : undefined,
        title: sendTitle.trim(),
        message: sendMessage.trim(),
        type: sendType,
        link: sendLink.trim() || undefined,
      })
      notifySuccess(
        'پیام ارسال شد',
        sendTarget === 'all'
          ? 'پیام به کلیه کاربران ثبت‌نامی ارسال گردید.'
          : 'پیام با موفقیت به حساب کاربر ارسال شد.',
      )
      setIsSendCustModalOpen(false)
      setSendTitle('')
      setSendMessage('')
      setSendLink('')
      setSendCustId('')
      loadCustomerMessages()
    } catch (err: any) {
      notifyError('خطا در ارسال پیام', err.message)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDeleteCustMessage = async () => {
    if (!deleteCustMessageId) return
    try {
      await apiService.adminDeleteCustomerNotification(deleteCustMessageId)
      notifySuccess('پیام حذف شد', 'پیام مورد نظر از صندوق کاربران حذف شد.')
      setDeleteCustMessageId(null)
      loadCustomerMessages()
    } catch (err: any) {
      notifyError('خطا در حذف پیام', err.message)
    }
  }

  const filteredCustomerMessages = useMemo(() => {
    if (!custSearchQuery.trim()) return customerMessages
    const q = custSearchQuery.toLowerCase().trim()
    return customerMessages.filter((m) => {
      const title = (m.title || '').toLowerCase()
      const msg = (m.message || '').toLowerCase()
      const phone = (m.customer_phone || '').toLowerCase()
      const name = (m.customer_name || '').toLowerCase()
      return (
        title.includes(q) ||
        msg.includes(q) ||
        phone.includes(q) ||
        name.includes(q)
      )
    })
  }, [customerMessages, custSearchQuery])

  const loadAnnouncements = async () => {
    setLoadingAnnounce(true)
    try {
      const list = await apiService.adminListAnnouncements()
      setAnnouncements(list)
    } catch (err: any) {
      notifyError('خطا در بارگذاری اعلان‌ها', err.message)
    } finally {
      setLoadingAnnounce(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
    loadCustomerMessages()
  }, [])

  const handleOpenCreateAnnounce = () => {
    setEditingAnnounce(null)
    setAnnounceTitle('')
    setAnnounceContent('')
    setAnnounceImage('')
    setAnnounceTargetPages('all')
    setAnnounceDisplayType('bell_and_popup')
    setAnnounceSeverity('info')
    setAnnounceExpiresAt('')
    setAnnounceDismissDuration('7d')
    setAnnounceIsActive(true)
    setIsAnnounceModalOpen(true)
  }

  const handleOpenEditAnnounce = (item: SystemAnnouncement) => {
    setEditingAnnounce(item)
    setAnnounceTitle(item.title)
    setAnnounceContent(item.content)
    setAnnounceImage(item.image_url || '')
    setAnnounceTargetPages(item.target_pages || 'all')
    setAnnounceDisplayType(item.display_type || 'bell_and_popup')
    setAnnounceSeverity(item.severity || 'info')
    setAnnounceExpiresAt(item.expires_at ? item.expires_at.slice(0, 16) : '')
    setAnnounceDismissDuration((item.dismiss_duration as any) || '7d')
    setAnnounceIsActive(item.is_active)
    setIsAnnounceModalOpen(true)
  }

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announceTitle.trim() || !announceContent.trim()) return

    setSavingAnnounce(true)
    try {
      const payload: Partial<SystemAnnouncement> = {
        title: announceTitle.trim(),
        content: announceContent.trim(),
        image_url: announceImage.trim() || undefined,
        target_pages: announceTargetPages,
        display_type: announceDisplayType,
        severity: announceSeverity,
        dismiss_duration: announceDismissDuration,
        is_active: announceIsActive,
        expires_at: announceExpiresAt
          ? new Date(announceExpiresAt).toISOString()
          : undefined,
      }

      if (editingAnnounce) {
        await apiService.adminUpdateAnnouncement(editingAnnounce.id, payload)
        notifySuccess('اعلان به‌روزرسانی شد', 'تغییرات اعلان با موفقیت ثبت شد.')
      } else {
        await apiService.adminCreateAnnouncement(payload)
        notifySuccess('اعلان ثبت شد', 'اعلان جدید در سیستم ثبت گردید.')
      }
      setIsAnnounceModalOpen(false)
      loadAnnouncements()
    } catch (err: any) {
      notifyError('خطا در ذخیره اعلان', err.message)
    } finally {
      setSavingAnnounce(false)
    }
  }

  const handleDeleteAnnouncement = async () => {
    if (!deleteAnnounceId) return
    try {
      await apiService.adminDeleteAnnouncement(deleteAnnounceId)
      notifySuccess('اعلان حذف شد', 'اعلان مورد نظر با موفقیت حذف گردید.')
      setDeleteAnnounceId(null)
      loadAnnouncements()
    } catch (err: any) {
      notifyError('خطا در حذف اعلان', err.message)
    }
  }

  const handleUploadAnnounceImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAnnounceImage(true)
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        setAnnounceImage(res.file_url)
        notifySuccess('تصویر آپلود شد', 'تصویر بنر اعلان با موفقیت ذخیره شد.')
      }
    } catch (err: any) {
      notifyError('خطا در آپلود تصویر', err.message)
    } finally {
      setUploadingAnnounceImage(false)
    }
  }

  const handleToggleActive = async (item: SystemAnnouncement) => {
    const nextState = !item.is_active
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, is_active: nextState } : a)),
    )
    try {
      await apiService.adminUpdateAnnouncement(item.id, {
        is_active: nextState,
      })
      notifySuccess(
        nextState ? 'اعلان فعال شد' : 'اعلان غیرفعال شد',
        `وضعیت اعلان «${item.title}» با موفقیت تغییر کرد.`,
      )
    } catch (err: any) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === item.id ? { ...a, is_active: !nextState } : a,
        ),
      )
      notifyError('خطا در تغییر وضعیت', err.message)
    }
  }

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (filterStatus === 'active' && !a.is_active) return false
      if (filterStatus === 'inactive' && a.is_active) return false
      if (filterDisplayType !== 'all' && a.display_type !== filterDisplayType)
        return false
      if (filterSeverity !== 'all' && a.severity !== filterSeverity)
        return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = (a.title || '').toLowerCase().includes(q)
        const matchContent = (a.content || '').toLowerCase().includes(q)
        const matchTarget = (a.target_pages || '').toLowerCase().includes(q)
        if (!matchTitle && !matchContent && !matchTarget) return false
      }
      return true
    })
  }, [
    announcements,
    filterStatus,
    filterDisplayType,
    filterSeverity,
    searchQuery,
  ])

  const handleDuplicateAnnounce = async (item: SystemAnnouncement) => {
    try {
      const payload: Partial<SystemAnnouncement> = {
        title: `${item.title} (کپی)`,
        content: item.content,
        image_url: item.image_url || undefined,
        target_pages: item.target_pages,
        display_type: item.display_type,
        severity: item.severity,
        is_active: false,
      }
      await apiService.adminCreateAnnouncement(payload)
      notifySuccess(
        'اعلان کپی شد',
        'نسخه جدید در حالت پیش‌نویس (غیرفعال) ثبت گردید.',
      )
      await loadAnnouncements()
    } catch (err: any) {
      notifyError('خطا در کپی اعلان', err.message)
    }
  }

  // Overview KPIs
  const totalCount = announcements.length
  const activeCount = announcements.filter((a) => a.is_active).length
  const bellCount = announcements.filter(
    (a) =>
      a.is_active &&
      (a.display_type === 'bell_only' || a.display_type === 'bell_and_popup'),
  ).length
  const popupCount = announcements.filter(
    (a) =>
      a.is_active &&
      (a.display_type === 'popup_first_load' ||
        a.display_type === 'bell_and_popup'),
  ).length

  return (
    <div
      className="space-y-6 text-right select-none animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Top Banner Header */}
      <AdminHeaderBanner
        icon={BellRing}
        title="مدیریت اعلان‌ها، پیام‌های سراسری و صندوق کاربران"
        subtitle="ارسال پیام‌های بازشو در اولین ورود، بنرهای اعلان بالای سایت و ارسال پیام‌های مستقیم به صندوق حساب کاربران"
        badgeText="سیستم هوشمند اطلاع‌رسانی"
        actions={
          <div className="flex items-center gap-2">
            {activeMainTab === 'broadcast' ? (
              <button
                type="button"
                onClick={handleOpenCreateAnnounce}
                className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>ایجاد اعلان سراسری</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSendCustModalOpen(true)}
                className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>ارسال پیام جدید به حساب کاربران</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                loadAnnouncements()
                loadCustomerMessages()
              }}
              disabled={loadingAnnounce || loadingCustMessages}
              className="p-2.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition shadow-control cursor-pointer"
              title="تازه‌سازی لیست"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingAnnounce || loadingCustMessages
                    ? 'animate-spin text-brand'
                    : ''
                }`}
              />
            </button>
          </div>
        }
      />

      {/* Sub-Tabs Navigation */}
      <div className="bg-card rounded-surface border border-border/80 p-1.5 shadow-surface flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveMainTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'broadcast'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>اطلاعیه‌ها و پیام‌های سراسری سایت</span>
          <span className="px-1.5 py-0.2 rounded-control bg-secondary text-foreground text-[10px] font-latin">
            {toPersianDigits(announcements.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('customer_messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'customer_messages'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>پیام‌های اختصاصی حساب کاربران (In-App)</span>
          <span className="px-1.5 py-0.2 rounded-control bg-secondary text-foreground text-[10px] font-latin">
            {toPersianDigits(customerMessages.length)}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: SYSTEM BROADCAST ANNOUNCEMENTS                                 */}
      {/* ===================================================================== */}
      {activeMainTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Quick KPI Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>کل اعلان‌های سیستم</span>
                <Megaphone className="w-4 h-4 text-brand" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground font-latin">
                {toPersianDigits(totalCount)}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                تمامی رکوردهای فعال و غیرفعال
              </span>
            </div>

            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>اعلان‌های فعال و جاری</span>
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-500 font-latin">
                {toPersianDigits(activeCount)}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                در حال انتشار در فرانت‌اند
              </span>
            </div>

            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>زنگوله هدر و پروفایل</span>
                <BellRing className="w-4 h-4 text-brand" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand font-latin">
                {toPersianDigits(bellCount)}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                دارای نشان در نوار بالای سایت
              </span>
            </div>

            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>پاپ‌آپ‌های بازشو (Modal)</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-500 font-latin">
                {toPersianDigits(popupCount)}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                نمایش در اولین لود صفحات
              </span>
            </div>
          </div>

          {/* Main Table / Container */}
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="w-full sm:w-80">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="جستجو در عنوان یا متن اعلان..."
                  debounceMs={300}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-control border border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                      filterStatus === 'all'
                        ? 'bg-primary text-primary-foreground shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    همه ({toPersianDigits(totalCount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('active')}
                    className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                      filterStatus === 'active'
                        ? 'bg-emerald-600 text-white shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    فعال ({toPersianDigits(activeCount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('inactive')}
                    className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                      filterStatus === 'inactive'
                        ? 'bg-muted text-foreground shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    غیرفعال ({toPersianDigits(totalCount - activeCount)})
                  </button>
                </div>

                {/* Display Type Select */}
                <select
                  value={filterDisplayType}
                  onChange={(e) => setFilterDisplayType(e.target.value)}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-bold text-foreground outline-none cursor-pointer"
                >
                  <option value="all">همه حالت‌های نمایش</option>
                  <option value="bell_and_popup">زنگوله + پاپ‌آپ</option>
                  <option value="bell_only">فقط زنگوله</option>
                  <option value="popup_first_load">فقط پاپ‌آپ بازشو</option>
                  <option value="banner_top">بنر اعلان هدر</option>
                </select>

                {/* Severity Filter Select */}
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-bold text-foreground outline-none cursor-pointer"
                >
                  <option value="all">همه نوع پیام‌ها</option>
                  <option value="discount">🔥 تخفیف و جشنواره</option>
                  <option value="warning">⚠️ هشدارهای مهم</option>
                  <option value="success">✅ بروزرسانی‌ها</option>
                  <option value="info">📢 اطلاعیه‌های عمومی</option>
                </select>
              </div>
            </div>

            {loadingAnnounce ? (
              <LoadingState message="در حال بارگذاری اعلان‌های سراسری سیستم..." />
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground bg-muted/10 rounded-surface border border-dashed border-border/60 space-y-3">
                <BellRing className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">
                  {searchQuery ||
                  filterStatus !== 'all' ||
                  filterDisplayType !== 'all'
                    ? 'موردی با فیلترهای انتخابی یافت نشد'
                    : 'هنوز اعلانی در سیستم ثبت نشده است'}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery ||
                  filterStatus !== 'all' ||
                  filterDisplayType !== 'all'
                    ? 'می‌توانید فیلترها را ریست کرده یا کلمات دیگری را جستجو فرمایید.'
                    : 'با زدن دکمه «ایجاد اعلان جدید»، اطلاعیه، بنر هدر یا پاپ‌آپ بازشوی سراسری ایجاد فرمایید.'}
                </p>
                {searchQuery ||
                filterStatus !== 'all' ||
                filterDisplayType !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterStatus('all')
                      setFilterDisplayType('all')
                    }}
                    className="mt-2 h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-control cursor-pointer"
                  >
                    <span>پاکسازی فیلترها</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCreateAnnounce}
                    className="mt-2 h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black inline-flex items-center gap-1.5 shadow-control cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ایجاد اولین اعلان</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold select-none text-right">
                        <th className="p-3.5 text-center w-12">#</th>
                        <th className="p-3.5 text-center w-16">پوستر</th>
                        <th className="p-3.5 text-right min-w-[220px]">
                          عنوان و محتوای پیام
                        </th>
                        <th className="p-3.5 text-center">صفحات هدف</th>
                        <th className="p-3.5 text-center">کانال نمایش</th>
                        <th className="p-3.5 text-center">درجه فوریت</th>
                        <th className="p-3.5 text-center">انقضا</th>
                        <th className="p-3.5 text-center">وضعیت فعال</th>
                        <th className="p-3.5 text-center w-28">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredAnnouncements.map((a, idx) => (
                        <tr
                          key={a.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-3 text-center text-muted-foreground font-latin font-bold">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="p-3 text-center">
                            {a.image_url ? (
                              <img
                                src={a.image_url}
                                alt=""
                                className="w-10 h-10 object-cover rounded-control border border-border/60 mx-auto shadow-xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-control bg-muted/40 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground/60">
                                <Megaphone className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-black text-foreground text-xs leading-snug">
                              {a.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-normal line-clamp-1 max-w-[320px] mt-0.5 leading-relaxed">
                              {a.content}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] font-bold bg-muted/40 text-foreground border border-border/60">
                              <Globe2 className="w-3 h-3 text-brand" />
                              <span>
                                {a.target_pages === 'all'
                                  ? 'تمام صفحات'
                                  : a.target_pages}
                              </span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-secondary text-secondary-foreground border border-border/40 font-sans">
                              {a.display_type === 'bell_only'
                                ? 'زنگوله هدر'
                                : a.display_type === 'popup_first_load'
                                  ? 'پاپ‌آپ لود اول'
                                  : a.display_type === 'banner_top'
                                    ? 'بنر بالای صفحه'
                                    : 'زنگوله + پاپ‌آپ'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border font-sans ${
                                a.severity === 'discount'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                  : a.severity === 'warning'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : a.severity === 'success'
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                      : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              }`}
                            >
                              {a.severity === 'discount'
                                ? '🔥 تخفیف'
                                : a.severity === 'warning'
                                  ? '⚠️ هشدار'
                                  : a.severity === 'success'
                                    ? '✅ موفق'
                                    : '📢 اطلاع‌رسانی'}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[11px] text-muted-foreground font-sans">
                            {a.expires_at ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span>
                                  {toPersianDigits(
                                    new Date(a.expires_at).toLocaleDateString(
                                      'fa-IR',
                                    ),
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60">
                                نامحدود
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center">
                              <ToggleSwitch
                                size="sm"
                                checked={a.is_active}
                                onChange={() => handleToggleActive(a)}
                              />
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewAnnounce(a)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-amber-500 transition-colors cursor-pointer shadow-control"
                                title="پیش‌نمایش زنده در قالب خریدار"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-500" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateAnnounce(a)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-emerald-500 transition-colors cursor-pointer shadow-control"
                                title="کپی و ایجاد نمونه مشابه از این اعلان"
                              >
                                <Copy className="w-3.5 h-3.5 text-emerald-500" />
                              </button>
                              {a.target_pages && a.target_pages !== 'all' ? (
                                <a
                                  href={`/${a.target_pages.replace(/^\//, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-blue-500 transition-colors cursor-pointer shadow-control"
                                  title="مشاهده صفحه هدف"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                </a>
                              ) : (
                                <a
                                  href="/"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-blue-500 transition-colors cursor-pointer shadow-control"
                                  title="مشاهده در سایت"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditAnnounce(a)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control"
                                title="ویرایش کامل اعلان"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-brand" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAnnounceId(a.id)}
                                className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                                title="حذف اعلان"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: CUSTOMER IN-APP ACCOUNT NOTIFICATIONS MANAGEMENT               */}
      {/* ===================================================================== */}
      {activeMainTab === 'customer_messages' && (
        <div className="space-y-6">
          {/* Quick KPI Overview Cards for Customer Messages */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>کل پیام‌های حساب کاربران</span>
                <BellRing className="w-4 h-4 text-brand" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground font-latin">
                {toPersianDigits(customerMessages.length)}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                موجود در صندوق‌های ورودی کاربران
              </span>
            </div>

            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>پیام‌های خوانده‌شده</span>
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-500 font-latin">
                {toPersianDigits(
                  customerMessages.filter((m) => m.is_read).length,
                )}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                توسط مشتری مشاهده شده است
              </span>
            </div>

            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>خوانده‌نشده / در انتظار</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-500 font-latin">
                {toPersianDigits(
                  customerMessages.filter((m) => !m.is_read).length,
                )}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                هنوز باز نشده است
              </span>
            </div>

            <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>پیام‌های امنیتی و سشن</span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-latin">
                {toPersianDigits(
                  customerMessages.filter(
                    (m) => m.type === 'security' || m.type === 'system',
                  ).length,
                )}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                هشدار سشن و پروتکل Zeroize
              </span>
            </div>
          </div>

          {/* Customer Messages Table Container */}
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="w-full sm:w-80">
                <SearchInput
                  value={custSearchQuery}
                  onChange={setCustSearchQuery}
                  placeholder="جستجو در کاربر، عنوان یا متن پیام..."
                  debounceMs={300}
                />
              </div>
            </div>

            {loadingCustMessages ? (
              <LoadingState message="در حال بارگذاری پیام‌های صندوق کاربران..." />
            ) : filteredCustomerMessages.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground bg-muted/10 rounded-surface border border-dashed border-border/60 space-y-3">
                <BellRing className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">
                  پیامی در صندوق کاربران یافت نشد
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  با زدن دکمه «ارسال پیام جدید به حساب کاربران»، اطلاعیه
                  خوش‌آمدگویی، هشدار امنیتی یا پیام تبریک به کاربران ارسال
                  فرمایید.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSendCustModalOpen(true)}
                  className="mt-2 h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black inline-flex items-center gap-1.5 shadow-control cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال اولین پیام</span>
                </button>
              </div>
            ) : (
              <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold select-none text-right">
                        <th className="p-3.5 text-center w-12">#</th>
                        <th className="p-3.5 text-right">کاربر دریافت‌کننده</th>
                        <th className="p-3.5 text-right min-w-[200px]">
                          عنوان و متن پیام
                        </th>
                        <th className="p-3.5 text-center">نوع پیام</th>
                        <th className="p-3.5 text-center">لینک ارجاع</th>
                        <th className="p-3.5 text-center">وضعیت</th>
                        <th className="p-3.5 text-center">تاریخ ارسال</th>
                        <th className="p-3.5 text-center w-20">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredCustomerMessages.map((msg, idx) => (
                        <tr
                          key={msg.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-3 text-center text-muted-foreground font-latin font-bold">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="p-3 text-right">
                            {msg.customer_phone ? (
                              <div>
                                <span className="font-bold text-foreground block font-latin">
                                  {msg.customer_phone}
                                </span>
                                {msg.customer_name && (
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                                    {msg.customer_name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-control bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">
                                همگانی (تمام کاربران)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="font-black text-foreground text-xs leading-snug">
                              {msg.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-normal line-clamp-1 max-w-[300px] mt-0.5 leading-relaxed">
                              {msg.message}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border font-sans ${
                                msg.type === 'security'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                  : msg.type === 'loyalty'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : msg.type === 'order'
                                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                      : 'bg-secondary text-secondary-foreground border-border/40'
                              }`}
                            >
                              {msg.type === 'security'
                                ? '🛡️ امنیت'
                                : msg.type === 'loyalty'
                                  ? '✨ وفاداری'
                                  : msg.type === 'order'
                                    ? '📦 سفارش'
                                    : '🔔 سیستمی'}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[11px] font-latin font-mono text-muted-foreground">
                            {msg.link ? (
                              <span className="text-brand truncate max-w-[120px] inline-block">
                                {msg.link}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border font-sans ${
                                msg.is_read
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              }`}
                            >
                              {msg.is_read ? 'خوانده شده ✓' : 'خوانده نشده'}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[11px] text-muted-foreground font-sans">
                            {msg.created_at
                              ? toPersianDigits(
                                  new Date(msg.created_at).toLocaleDateString(
                                    'fa-IR',
                                  ),
                                )
                              : '-'}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setDeleteCustMessageId(msg.id)}
                                className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                                title="حذف پیام کاربر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Announcement Modal */}
      {isAnnounceModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="w-full max-w-2xl bg-card rounded-surface border border-border/80 shadow-surface p-6 space-y-4 text-right animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-brand" />
                  <span>
                    {editingAnnounce
                      ? 'ویرایش اعلان سیستم'
                      : 'ثبت و انتشار اعلان جدید'}
                  </span>
                </h4>
                <ModalCloseButton
                  onClick={() => setIsAnnounceModalOpen(false)}
                />
              </div>

              <form
                onSubmit={handleSaveAnnouncement}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">
                    عنوان اعلان / پاپ‌آپ *:
                  </label>
                  <input
                    type="text"
                    required
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="مثلاً: جشنواره تابستانه با ۲۰٪ تخفیف روی تمامی اشتراک‌ها"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    متن و محتوای اعلان (تکست‌ادیتور پیشرفته / مارک‌داون) *:
                  </label>
                  <RichContentEditor
                    value={announceContent}
                    onChange={setAnnounceContent}
                    placeholder="توضیحات کامل اعلان یا پیام خوش‌آمدگویی (پشتیبانی کامل از مارک‌داون، تیترها، اموجی و فرمت‌بندی)..."
                    minHeight="200px"
                    label="محتوای اعلان"
                  />
                </div>

                {/* Image Upload / Link */}
                <div className="space-y-1.5 p-3 rounded-surface border border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      تصویر بنر یا پوستر پاپ‌آپ:
                    </span>
                    <label className="text-brand hover:underline cursor-pointer flex items-center gap-1 font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingAnnounceImage
                          ? 'در حال آپلود...'
                          : 'آپلود تصویر'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingAnnounceImage}
                        onChange={handleUploadAnnounceImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    value={announceImage}
                    onChange={(e) => setAnnounceImage(e.target.value)}
                    placeholder="https://... یا از دکمه آپلود تصویر استفاده فرمایید"
                    className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-foreground font-sans text-xs outline-none focus:border-brand"
                  />
                  {announceImage && (
                    <div className="pt-2">
                      <img
                        src={announceImage}
                        alt="پیش‌نمایش"
                        className="h-24 w-full object-cover rounded-control border border-border/60"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      صفحات هدف نمایش:
                    </label>
                    <select
                      value={announceTargetPages}
                      onChange={(e) => setAnnounceTargetPages(e.target.value)}
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-card text-foreground text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="all">🌐 تمام صفحات سایت (سراسری)</option>
                      <option value="/">🏠 فقط صفحه اصلی</option>
                      <option value="/products">
                        🛍️ صفحات کاتالوگ و محصولات
                      </option>
                      <option value="/category">🗂️ صفحات دسته‌بندی</option>
                      <option value="/profile">👤 پنل کاربری خریدار</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      نحوه نمایش:
                    </label>
                    <select
                      value={announceDisplayType}
                      onChange={(e: any) =>
                        setAnnounceDisplayType(e.target.value)
                      }
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-card text-foreground text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="bell_and_popup">
                        🔔 زنگوله هدر + پاپ‌آپ اولین لود
                      </option>
                      <option value="popup_first_load">
                        💥 فقط پاپ‌آپ بازشو در اولین ورود
                      </option>
                      <option value="bell_only">🔕 فقط منوی زنگوله هدر</option>
                      <option value="banner_top">📌 بنر بالای صفحه</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      درجه فوریت / تگ:
                    </label>
                    <select
                      value={announceSeverity}
                      onChange={(e: any) => setAnnounceSeverity(e.target.value)}
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-card text-foreground text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="info">📢 اطلاعیه معمولی</option>
                      <option value="discount">🔥 تخفیف و جشنواره</option>
                      <option value="warning">⚠️ هشدار مهم</option>
                      <option value="success">✅ بروزرسانی موفق</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      تاریخ انقضا (حذف خودکار):
                    </label>
                    <input
                      type="datetime-local"
                      value={announceExpiresAt}
                      onChange={(e) => setAnnounceExpiresAt(e.target.value)}
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-foreground text-xs font-sans outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* LocalStorage Dismiss Duration Settings */}
                <div className="space-y-1.5 p-3 rounded-surface border border-border/60 bg-muted/20 text-right">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground block text-xs">
                      رفتار دکمه «متوجه شدم» و ماندگاری در لوکال‌استوریج:
                    </label>
                    <span className="text-[10px] text-brand font-black">
                      نمایش در هر لود تا زمان تایید
                    </span>
                  </div>
                  <select
                    value={announceDismissDuration}
                    onChange={(e: any) =>
                      setAnnounceDismissDuration(e.target.value)
                    }
                    className="w-full h-9 px-3 rounded-control border border-border/60 bg-card text-foreground text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="7d">
                      📅 به مدت ۷ روز در لوکال استوریج (عدم نمایش مجدد تا ۱ هفته
                      - استاندارد)
                    </option>
                    <option value="24h">
                      ⏱️ به مدت ۲۴ ساعت در لوکال استوریج (عدم نمایش مجدد تا ۱
                      روز)
                    </option>
                    <option value="30d">
                      🗓️ به مدت ۳۰ روز در لوکال استوریج (عدم نمایش مجدد تا ۱ ماه)
                    </option>
                    <option value="every_load">
                      🔄 نمایش با هر بار لود و رفرش تا زمان کلیک روی متوجه شدم
                    </option>
                    <option value="forever">
                      🔒 عدم نمایش همیشگی پس از تایید متوجه شدم (تا ابد)
                    </option>
                  </select>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
                    این اعلان با هر بار لود یا رفرش صفحات به کاربر نمایش داده
                    می‌شود مگر اینکه کاربر دکمه «متوجه شدم» را بزند؛ در این صورت
                    به مدت انتخاب‌شده در لوکال‌استوریج خریدار پنهان خواهد شد.
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-control border border-border/60 bg-muted/20">
                  <span className="font-bold text-foreground">
                    وضعیت فعال‌سازی اعلان:
                  </span>
                  <ToggleSwitch
                    checked={announceIsActive}
                    onChange={setAnnounceIsActive}
                    size="md"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsAnnounceModalOpen(false)}
                    className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={savingAnnounce}
                    className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                  >
                    {savingAnnounce ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {editingAnnounce
                        ? 'ذخیره تغییرات'
                        : 'انتشار اعلان سراسری'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Announcement Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteAnnounceId)}
        onClose={() => setDeleteAnnounceId(null)}
        onConfirm={handleDeleteAnnouncement}
        title="حذف اعلان سراسری"
        message="آیا از حذف این اعلان اطمینان دارید؟ این پیام بلافاصله از تمامی صفحات و هدر پاک خواهد شد."
        confirmText="بله، حذف شود"
      />

      {/* SEND CUSTOMER NOTIFICATION MODAL */}
      {isSendCustModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface p-6 space-y-4 text-right animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand" />
                  <span>ارسال پیام جدید به صندوق کاربران</span>
                </h4>
                <ModalCloseButton
                  onClick={() => setIsSendCustModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSendCustomerMessage} className="space-y-4">
                {/* Target User Switcher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    مخاطب پیام:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-control bg-muted/30 border border-border/60 text-xs">
                    <button
                      type="button"
                      onClick={() => setSendTarget('all')}
                      className={`py-2 px-2.5 rounded-control font-black transition-all cursor-pointer ${
                        sendTarget === 'all'
                          ? 'bg-primary text-primary-foreground shadow-control'
                          : 'bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ارسال همگانی (همه کاربران)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendTarget('specific')}
                      className={`py-2 px-2.5 rounded-control font-black transition-all cursor-pointer ${
                        sendTarget === 'specific'
                          ? 'bg-primary text-primary-foreground shadow-control'
                          : 'bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ارسال به یک کاربر خاص
                    </button>
                  </div>
                </div>

                {sendTarget === 'specific' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground block">
                      شناسه کاربر یا شماره موبایل:
                    </label>
                    <input
                      type="text"
                      required
                      value={sendCustId}
                      onChange={(e) => setSendCustId(e.target.value)}
                      placeholder="مثال: UUID کاربر یا شماره ۰۹..."
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-bold text-foreground outline-none focus:border-brand"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    عنوان پیام:
                  </label>
                  <input
                    type="text"
                    required
                    value={sendTitle}
                    onChange={(e) => setSendTitle(e.target.value)}
                    placeholder="مثال: وضعیت سفارش یا ارتقای سطح حساب..."
                    className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-bold text-foreground outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    متن کامل پیام:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    placeholder="متن پیام اختصاصی که در تب اعلان‌های پروفایل کاربر قرار می‌گیرد..."
                    className="w-full p-3 rounded-control border border-border/60 bg-muted/20 text-xs font-medium text-foreground outline-none focus:border-brand leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground block">
                      دسته‌بندی پیام:
                    </label>
                    <select
                      value={sendType}
                      onChange={(e: any) => setSendType(e.target.value)}
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-card text-foreground text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="system">🔔 اطلاع‌رسانی سیستمی</option>
                      <option value="security">🛡️ امنیت و سشن</option>
                      <option value="loyalty">✨ باشگاه وفاداری</option>
                      <option value="order">📦 سفارش و فاکتور</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground block">
                      لینک ارجاع (اختیاری):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={sendLink}
                      onChange={(e) => setSendLink(e.target.value)}
                      placeholder="/profile?tab=orders"
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin text-foreground outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsSendCustModalOpen(false)}
                    className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {sendingMessage ? 'در حال ارسال...' : 'ارسال به صندوق'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Customer Notification Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteCustMessageId)}
        onClose={() => setDeleteCustMessageId(null)}
        onConfirm={handleDeleteCustMessage}
        title="حذف پیام کاربر"
        message="آیا از حذف این پیام از صندوق کاربر اطمینان دارید؟"
        confirmText="بله، حذف شود"
      />

      {/* Live Preview Modal for Announcement */}
      {previewAnnounce &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483600] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
            dir="rtl"
          >
            <div className="w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden space-y-4 text-right animate-in zoom-in-95 duration-200 text-foreground">
              {previewAnnounce.image_url && (
                <div className="w-full h-44 sm:h-52 overflow-hidden bg-muted relative">
                  <img
                    src={previewAnnounce.image_url}
                    alt={previewAnnounce.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <ModalCloseButton
                      onClick={() => setPreviewAnnounce(null)}
                      size="sm"
                    />
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6 space-y-4 pt-2">
                {!previewAnnounce.image_url && (
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shadow-xs">
                        <Megaphone className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-control text-[10px] font-bold border bg-brand/10 text-brand border-brand/20">
                          پیش‌نمایش خریدار
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-foreground mt-0.5">
                          {previewAnnounce.title}
                        </h3>
                      </div>
                    </div>
                    <ModalCloseButton
                      onClick={() => setPreviewAnnounce(null)}
                      size="sm"
                    />
                  </div>
                )}

                {previewAnnounce.image_url && (
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {previewAnnounce.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-control text-[10px] font-bold border bg-brand/10 text-brand border-brand/20">
                      پیش‌نمایش خریدار
                    </span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground leading-relaxed max-h-60 overflow-y-auto">
                  <MarkdownRenderer content={previewAnnounce.content} />
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    هدف: {previewAnnounce.target_pages || 'تمام صفحات'} | حالت:{' '}
                    {previewAnnounce.display_type}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewAnnounce(null)}
                    className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    بستن پیش‌نمایش
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
