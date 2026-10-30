import {
  Award,
  BellRing,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Coins,
  Copy,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  FolderPlus,
  Globe,
  History,
  Image as ImageIcon,
  Key,
  KeyRound,
  LayoutTemplate,
  Link2,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, apiService } from '../../services/api'
import type {
  FooterTrustBadge,
  PaymentGateway,
  SystemAnnouncement,
  ThemeSettings,
} from '../../types'
import { cleanMediaUrl, getSiteBrandName } from '../../utils/brand'
import { formatToman, toPersianDigits } from '../../utils/formatters'
import {
  getGatewayDisplay,
  registerPaymentGateways,
} from '../../utils/paymentIcons'
import { RichContentEditor } from '../content/RichContentEditor'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminActionLogView } from './AdminActionLogView'
import { AdminBillingSettingsView } from './AdminBillingSettingsView'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { SMSGatewayView } from './SMSGatewayView'

export type SettingsSubTab =
  | 'branding-seo'
  | 'site-menus'
  | 'apikeys'
  | 'billing'
  | 'sms'
  | 'gateways'
  | 'auth'
  | 'notifications'
  | 'audit-logs'

interface SubMenuItem {
  id: string
  title: string
  link: string
  desc?: string
  icon_url?: string
}

interface HeaderMenuItem {
  id: string
  title: string
  link: string
  icon_url?: string
  badge?: string
  is_active: boolean
  children?: SubMenuItem[]
}

interface FooterMenuItem {
  id: string
  title: string
  link: string
}

interface AdminCoreSettingsViewProps {
  initialSubTab?: SettingsSubTab
}

export const AdminCoreSettingsView: React.FC<AdminCoreSettingsViewProps> = ({
  initialSubTab = 'branding-seo',
}) => {
  const [activeSubTab, setActiveSubTab] =
    useState<SettingsSubTab>(initialSubTab)
  const settingsTabsRef = useRef<HTMLDivElement>(null)
  const scrollSettingsTabs = (direction: 'left' | 'right') => {
    if (settingsTabsRef.current) {
      const amount = direction === 'left' ? -220 : 220
      settingsTabsRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab)
    }
  }, [initialSubTab])
  const { success: notifySuccess, error: notifyError } = useNotification()

  // General theme / branding / SEO / apikeys state
  const [themeSettings, setThemeSettings] = useState<Partial<ThemeSettings>>({})
  const [_loadingTheme, setLoadingTheme] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)

  // Payment Gateways state
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(
    null,
  )

  // SwapWallet / Exchange Rate state
  const [exchangeRateSettings, setExchangeRateSettings] = useState<{
    rate_priority: 'manual' | 'swapwallet'
    usd_rate: number
    margin_percent: number
    live_usd_rate: number
    effective_usd_rate: number
    active_rate_source: string
  }>({
    rate_priority: 'manual',
    usd_rate: 98500,
    margin_percent: 25,
    live_usd_rate: 98500,
    effective_usd_rate: 98500,
    active_rate_source: 'manual',
  })
  const [_loadingExchangeRate, setLoadingExchangeRate] = useState(false)
  const [savingExchangeRate, setSavingExchangeRate] = useState(false)

  // Uploading state
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // System Announcements State
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [loadingAnnounce, setLoadingAnnounce] = useState(false)
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false)
  const [editingAnnounce, setEditingAnnounce] =
    useState<SystemAnnouncement | null>(null)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceContent, setAnnounceContent] = useState('')
  const [announceImage, setAnnounceImage] = useState('')
  const [announceTargetPages, setAnnounceTargetPages] = useState('all')
  const [announceDisplayType, setAnnounceDisplayType] = useState<
    'bell_only' | 'popup_first_load' | 'banner_top' | 'bell_and_popup'
  >('bell_and_popup')
  const [announceSeverity, setAnnounceSeverity] = useState<
    'info' | 'discount' | 'warning' | 'success'
  >('info')
  const [announceExpiresAt, setAnnounceExpiresAt] = useState('')
  const [announceIsActive, setAnnounceIsActive] = useState(true)
  const [savingAnnounce, setSavingAnnounce] = useState(false)
  const [uploadingAnnounceImage, setUploadingAnnounceImage] = useState(false)
  const [deleteAnnounceId, setDeleteAnnounceId] = useState<string | null>(null)

  // Multi-Auth System Settings state
  const [authSettings, setAuthSettings] = useState({
    auth_google_enabled: true,
    auth_github_enabled: true,
    auth_password_enabled: true,
    auth_email_enabled: true,
    auth_otp_required: false,
  })
  const [authSaveLoading, setAuthSaveLoading] = useState(false)

  // Visibility states for masked secrets
  const [showSecrets, setShowSecrets] = useState<{ [k: string]: boolean }>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [expandedMenuIds, setExpandedMenuIds] = useState<
    Record<string, boolean>
  >({})

  // Header Menu Items state
  const [headerMenus, setHeaderMenus] = useState<HeaderMenuItem[]>([
    {
      id: 'vn',
      title: 'شماره مجازی (SMS)',
      link: '/virtual-numbers',
      badge: 'جدید',
      is_active: true,
    },
    {
      id: 'blog',
      title: 'وبلاگ و آموزش‌ها',
      link: '/blog',
      is_active: true,
    },
    {
      id: 'help',
      title: 'پایگاه دانش',
      link: '/help',
      is_active: true,
    },
    {
      id: 'offers',
      title: 'تخفیف‌ها و رویدادها',
      link: '/offers',
      badge: 'ویژه',
      is_active: true,
    },
  ])

  // Notification Channels state
  const [ticketSMSMode, setTicketSMSMode] = useState<
    'default_on' | 'default_off' | 'disabled'
  >('default_on')
  const [ticketEmailMode, setTicketEmailMode] = useState<
    'default_on' | 'default_off' | 'disabled'
  >('default_on')
  const [savingNotifSettings, setSavingNotifSettings] = useState(false)
  // Footer Quick Links state
  const [footerLinks, setFooterLinks] = useState<FooterMenuItem[]>([
    { id: '1', title: 'کاتالوگ اشتراک‌ها', link: '#products-catalog' },
    {
      id: '2',
      title: 'شماره مجازی (SMS Verification)',
      link: '/virtual-numbers',
    },
    { id: '3', title: 'وبلاگ و آموزش‌ها (SEO Engine)', link: '/blog' },
    {
      id: '4',
      title: 'پایگاه دانش و رفع ارورها (Help Center)',
      link: '/help',
    },
    { id: '5', title: 'پیگیری سفارش و فاکتورها', link: '/track' },
  ])
  const [footerDescription, setFooterDescription] = useState('')
  const [footerBadges, setFooterBadges] = useState<FooterTrustBadge[]>([
    {
      id: 'enamad',
      title: 'نماد اعتماد الکترونیکی (اینماد)',
      image_url: '/images/enamad.png',
      link_url: 'https://enamad.ir',
      is_active: true,
    },
    {
      id: 'samandehi',
      title: 'نشان ساماندهی رسانه‌های دیجیتال',
      image_url: '/images/samandehi.png',
      link_url: 'https://samandehi.ir',
      is_active: true,
    },
    {
      id: 'union',
      title: 'عضو اتحادیه کشوری کسب‌وکارهای مجازی',
      image_url: '/images/union.png',
      link_url: 'https://ecunion.ir',
      is_active: true,
    },
    {
      id: 'security_vault',
      title: 'ضمانت امنیت داده‌ها و پروتکل Zeroize',
      image_url: '/images/security-seal.png',
      link_url: '#',
      is_active: true,
    },
  ])
  const [uploadingBadgeIdx, setUploadingBadgeIdx] = useState<number | null>(
    null,
  )

  const handleUploadBadgeImage = async (
    badgeIdx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBadgeIdx(badgeIdx)
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        setFooterBadges((prev) =>
          prev.map((b, i) =>
            i === badgeIdx
              ? { ...b, image_url: cleanMediaUrl(res.file_url) }
              : b,
          ),
        )
        notifySuccess('تصویر نماد ذخیره شد', 'فایل نماد با موفقیت آپلود گردید.')
      }
    } catch (err: any) {
      notifyError('خطا در آپلود نماد', err.message)
    } finally {
      setUploadingBadgeIdx(null)
    }
  }

  const toggleSecretMask = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(field)
    setTimeout(() => setCopiedKey(null), 2000)
    notifySuccess('کپی شد', 'مقدار با موفقیت در حافظه کپی گردید.')
  }

  const loadThemeSettings = async () => {
    setLoadingTheme(true)
    try {
      const s = await api.getAdminThemeSettings()
      if (s) {
        setThemeSettings(s)
        setAuthSettings({
          auth_google_enabled: s.auth_google_enabled !== false,
          auth_github_enabled: s.auth_github_enabled !== false,
          auth_password_enabled: s.auth_password_enabled !== false,
          auth_email_enabled: s.auth_email_enabled !== false,
          auth_otp_required: Boolean(s.auth_otp_required),
        })

        if (s.header_menu_json) {
          try {
            const parsed = JSON.parse(s.header_menu_json)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHeaderMenus(parsed)
            }
          } catch {}
        }

        if (s.ticket_sms_mode) setTicketSMSMode(s.ticket_sms_mode)
        if (s.ticket_email_mode) setTicketEmailMode(s.ticket_email_mode)

        if (s.footer_menu_json) {
          try {
            const parsed = JSON.parse(s.footer_menu_json)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFooterLinks(parsed)
            }
          } catch {}
        }

        if (s.footer_badges_json) {
          try {
            const parsed = JSON.parse(s.footer_badges_json)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFooterBadges(parsed)
            }
          } catch {}
        }

        if (s.footer_description) {
          setFooterDescription(s.footer_description)
        }
      }
    } catch {
    } finally {
      setLoadingTheme(false)
    }
  }

  const loadPayments = async () => {
    setLoadingPayments(true)
    try {
      const list = await apiService.adminListPayments()
      setPayments(list)
    } catch {
    } finally {
      setLoadingPayments(false)
    }
  }

  const loadExchangeRateSettings = async () => {
    setLoadingExchangeRate(true)
    try {
      const vnSettings = await apiService
        .getVirtualNumberSettings()
        .catch(() => null)
      if (vnSettings) {
        setExchangeRateSettings({
          rate_priority: (vnSettings.rate_priority as any) || 'manual',
          usd_rate: vnSettings.usd_rate || 98500,
          margin_percent: vnSettings.margin_percent || 25,
          live_usd_rate: vnSettings.live_usd_rate || 98500,
          effective_usd_rate: vnSettings.effective_usd_rate || 98500,
          active_rate_source: vnSettings.active_rate_source || 'manual',
        })
      }
    } finally {
      setLoadingExchangeRate(false)
    }
  }

  const handleSaveExchangeRate = async () => {
    setSavingExchangeRate(true)
    try {
      await apiService.updateVirtualNumberSettings({
        rate_priority: exchangeRateSettings.rate_priority,
        usd_rate: Number(exchangeRateSettings.usd_rate),
        margin_percent: Number(exchangeRateSettings.margin_percent),
      })
      notifySuccess(
        'تنظیمات نرخ ارز ذخیره شد',
        'تنظیمات SwapWallet و نرخ تبدیل تتر با موفقیت ثبت شد.',
      )
      loadExchangeRateSettings()
    } catch (err: any) {
      notifyError('خطا در ذخیره نرخ ارز', err.message)
    } finally {
      setSavingExchangeRate(false)
    }
  }

  const handleUploadFavicon = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFavicon(true)
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        setThemeSettings((prev) => ({
          ...prev,
          site_favicon_url: res.file_url,
        }))
        // Immediately persist to backend database so refresh never loses it
        await api.updateAdminThemeSettings({ site_favicon_url: res.file_url })
        try {
          localStorage.setItem('site_favicon_url', res.file_url)
          const link: HTMLLinkElement | null =
            document.querySelector("link[rel*='icon']")
          if (link) link.href = res.file_url
        } catch {}
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', {
            detail: { site_favicon_url: res.file_url },
          }),
        )
        notifySuccess(
          'فاوآیکون در دیتابیس ثبت شد',
          'فاوآیکون جدید در سرور ذخیره گردید.',
        )
      }
    } catch (err: any) {
      notifyError('خطا در آپلود', err.message)
    } finally {
      setUploadingFavicon(false)
    }
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        setThemeSettings((prev) => ({ ...prev, site_logo_url: res.file_url }))
        // Immediately persist to backend database so refresh never loses it
        await api.updateAdminThemeSettings({ site_logo_url: res.file_url })
        try {
          localStorage.setItem('site_logo_url', res.file_url)
        } catch {}
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', {
            detail: { site_logo_url: res.file_url },
          }),
        )
        notifySuccess(
          'لوگو در دیتابیس ثبت شد',
          'لوگوی جدید رسمی در سرور ذخیره گردید.',
        )
      }
    } catch (err: any) {
      notifyError('خطا در آپلود', err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleUploadMenuIcon = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        const next = headerMenus.map((m, i) =>
          i === idx ? { ...m, icon_url: res.file_url } : m,
        )
        setHeaderMenus(next)
        await api.updateAdminThemeSettings({
          header_menu_json: JSON.stringify(next),
        })
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', {
            detail: { header_menu_json: JSON.stringify(next) },
          }),
        )
        notifySuccess(
          'آیکون منو در دیتابیس ذخیره شد',
          'آیکون منو با موفقیت ثبت شد.',
        )
      }
    } catch (err: any) {
      notifyError('خطا در آپلود آیکون', err.message)
    }
  }

  const handleUploadSubmenuIcon = async (
    menuIdx: number,
    subIdx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        const next = headerMenus.map((m, i) =>
          i === menuIdx
            ? {
                ...m,
                children: (m.children || []).map((c, ci) =>
                  ci === subIdx ? { ...c, icon_url: res.file_url } : c,
                ),
              }
            : m,
        )
        setHeaderMenus(next)
        await api.updateAdminThemeSettings({
          header_menu_json: JSON.stringify(next),
        })
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', {
            detail: { header_menu_json: JSON.stringify(next) },
          }),
        )
        notifySuccess(
          'آیکون زیرمنو در دیتابیس ذخیره شد',
          'آیکون زیرمنو با موفقیت ثبت شد.',
        )
      }
    } catch (err: any) {
      notifyError('خطا در آپلود آیکون زیرمنو', err.message)
    }
  }

  const handleUploadPaymentIcon = async (
    paymentId: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await apiService.uploadMedia(file)
      if (res.file_url) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, icon_url: res.file_url } : p,
          ),
        )
        const target = payments.find((p) => p.id === paymentId)
        if (target) {
          registerPaymentGateways([
            {
              platform: target.platform,
              icon_url: res.file_url,
              name: target.name,
            },
          ])
        }
        await apiService.adminUpdatePayment(paymentId, { icon: res.file_url })
        notifySuccess(
          'آیکون درگاه ذخیره شد',
          'آیکون با موفقیت در دیتابیس ثبت شد.',
        )
      }
    } catch (err: any) {
      notifyError('خطا در آپلود آیکون درگاه', err.message)
    }
  }

  const loadAnnouncements = async () => {
    setLoadingAnnounce(true)
    try {
      const list = await apiService.adminListAnnouncements()
      setAnnouncements(list)
    } finally {
      setLoadingAnnounce(false)
    }
  }

  const handleOpenCreateAnnounce = () => {
    setEditingAnnounce(null)
    setAnnounceTitle('')
    setAnnounceContent('')
    setAnnounceImage('')
    setAnnounceTargetPages('all')
    setAnnounceDisplayType('bell_and_popup')
    setAnnounceSeverity('info')
    setAnnounceExpiresAt('')
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

  useEffect(() => {
    loadThemeSettings()
    loadPayments()
    loadExchangeRateSettings()
    loadAnnouncements()
  }, [])

  const handleSaveThemeField = async (payload: Partial<ThemeSettings>) => {
    setSavingTheme(true)
    try {
      const sanitizedPayload = { ...payload }
      if (sanitizedPayload.site_favicon_url) {
        sanitizedPayload.site_favicon_url = cleanMediaUrl(
          sanitizedPayload.site_favicon_url,
        )
      }
      if (sanitizedPayload.site_logo_url) {
        sanitizedPayload.site_logo_url = cleanMediaUrl(
          sanitizedPayload.site_logo_url,
        )
      }
      if (sanitizedPayload.og_image_url) {
        sanitizedPayload.og_image_url = cleanMediaUrl(
          sanitizedPayload.og_image_url,
        )
      }
      const updated = { ...themeSettings, ...sanitizedPayload }
      await api.updateAdminThemeSettings(sanitizedPayload)
      setThemeSettings(updated)

      if (sanitizedPayload.site_name_fa !== undefined) {
        localStorage.setItem(
          'site_name_fa',
          sanitizedPayload.site_name_fa
            ? sanitizedPayload.site_name_fa.trim()
            : '',
        )
      }
      if (sanitizedPayload.site_name_en !== undefined) {
        localStorage.setItem(
          'site_name_en',
          sanitizedPayload.site_name_en
            ? sanitizedPayload.site_name_en.trim()
            : '',
        )
      }
      if (sanitizedPayload.site_subtitle !== undefined) {
        localStorage.setItem(
          'site_subtitle',
          sanitizedPayload.site_subtitle
            ? sanitizedPayload.site_subtitle.trim()
            : '',
        )
      }
      if (sanitizedPayload.site_favicon_url) {
        localStorage.setItem(
          'site_favicon_url',
          sanitizedPayload.site_favicon_url,
        )
        try {
          const link: HTMLLinkElement | null =
            document.querySelector("link[rel*='icon']")
          if (link) link.href = sanitizedPayload.site_favicon_url
        } catch {}
      }
      if (sanitizedPayload.site_logo_url) {
        localStorage.setItem('site_logo_url', sanitizedPayload.site_logo_url)
      }
      if (sanitizedPayload.meta_title || sanitizedPayload.site_name_fa) {
        document.title =
          sanitizedPayload.meta_title ||
          sanitizedPayload.site_name_fa ||
          document.title
      }

      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: updated }),
      )
      notifySuccess(
        'ذخیره موفق',
        'تنظیمات با موفقیت ذخیره و در سیستم اعمال شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات', err.message)
    } finally {
      setSavingTheme(false)
    }
  }

  const handleSaveAuthSettings = async () => {
    setAuthSaveLoading(true)
    try {
      await api.updateAdminThemeSettings(authSettings)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: authSettings }),
      )
      notifySuccess(
        'تنظیمات ورود ذخیره شد',
        'پیکربندی روش‌های ورود و ثبت‌نام مشتریان با موفقیت ذخیره شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات ورود', err.message)
    } finally {
      setAuthSaveLoading(false)
    }
  }

  const handleSaveMenus = async () => {
    setSavingTheme(true)
    try {
      const payload: Partial<ThemeSettings> = {
        header_menu_json: JSON.stringify(headerMenus),
        footer_menu_json: JSON.stringify(footerLinks),
        footer_badges_json: JSON.stringify(footerBadges),
        footer_description: footerDescription,
      }
      await api.updateAdminThemeSettings(payload)
      setThemeSettings((prev) => ({ ...prev, ...payload }))
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      notifySuccess(
        'تنظیمات ناوبری و فوتر ذخیره شد',
        'پیکربندی منوی هدر، پیوندها و نمادهای اعتماد فوتر در سرور و دیتابیس ثبت شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره منوها', err.message)
    } finally {
      setSavingTheme(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setSavingNotifSettings(true)
    try {
      const payload: Partial<ThemeSettings> = {
        ticket_sms_mode: ticketSMSMode,
        ticket_email_mode: ticketEmailMode,
      }
      await api.updateAdminThemeSettings(payload)
      setThemeSettings((prev) => ({ ...prev, ...payload }))
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      notifySuccess(
        'تنظیمات اعلان‌ها ذخیره شد',
        'پیکربندی کانال‌های پیامک و ایمیل تیکت‌های پشتیبانی با موفقیت اعمال گردید.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات اعلان‌ها', err.message)
    } finally {
      setSavingNotifSettings(false)
    }
  }

  const subTabs = [
    {
      id: 'branding-seo' as const,
      label: 'هویت برند، فاوآیکون و سئو',
      icon: Globe,
    },
    {
      id: 'site-menus' as const,
      label: 'مدیریت منوها، ناوبری و فوتر سایت',
      icon: LayoutTemplate,
    },
    {
      id: 'apikeys' as const,
      label: 'مرکز کلیدهای دسترسی (API Keys)',
      icon: Key,
    },
    {
      id: 'billing' as const,
      label: 'فاکتور رسمی و مشخصات حقوقی',
      icon: ReceiptText,
    },
    {
      id: 'sms' as const,
      label: 'سامانه پیامک و اعتبارسنجی',
      icon: Smartphone,
    },
    {
      id: 'gateways' as const,
      label: 'درگاه‌های پرداخت و سیستم',
      icon: CreditCard,
    },
    {
      id: 'auth' as const,
      label: 'روش‌های ورود و ثبت‌نام (Multi-Auth)',
      icon: KeyRound,
    },
    {
      id: 'audit-logs' as const,
      label: 'لاگ فعالیت مدیران',
      icon: History,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" dir="rtl">
      {/* Top Banner Header */}
      <AdminHeaderBanner
        icon={Settings}
        title="تنظیمات و پیکربندی سیستم"
        subtitle="مدیریت متمرکز هویت برند، فاوآیکون، سئو، منوهای سایت، کلیدهای وب‌سرویس، فاکتور رسمی، درگاه‌های پرداخت و احراز هویت"
        badgeText="پیکربندی هسته سیستم"
      />

      {/* Modern Subtabs Navigation with Right & Left Arrow Controls (Image 5 Standard) */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => scrollSettingsTabs('right')}
          className="p-1.5 rounded-control bg-secondary hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground shadow-xs shrink-0 cursor-pointer ml-1 duration-motion active:scale-95"
          title="اسکرول به راست"
          aria-label="اسکرول به راست"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={settingsTabsRef}
          className="flex-1 flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 overflow-x-auto scrollbar-none scroll-smooth"
        >
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-control'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollSettingsTabs('left')}
          className="p-1.5 rounded-control bg-secondary hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground shadow-xs shrink-0 cursor-pointer mr-1 duration-motion active:scale-95"
          title="اسکرول به چپ"
          aria-label="اسکرول به چپ"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* TAB CONTENT 0: BRANDING, FAVICON & ADVANCED SEO */}
      {activeSubTab === 'branding-seo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    هویت برند، فاوآیکون و تنظیمات پیشرفته موتورهای جستجو (SEO)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تغییر نام فروشگاه، فاوآیکون مرورگر، لوگوی رسمی، کلمات کلیدی،
                    شعار و عنوان متای تب مرورگر بدون نیاز به تغییر کد
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveThemeField(themeSettings)}
                disabled={savingTheme}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTheme
                    ? 'در حال ذخیره‌سازی...'
                    : 'ذخیره کل تغییرات برند'}
                </span>
              </button>
            </div>

            {/* Visual Brand Assets (FavIcon & Logo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-surface border border-border/60 bg-muted/20">
              {/* Favicon Settings & Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    <span>آیکون مرورگر (FavIcon URL):</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    فرمت‌های SVG یا PNG (اندازه ۳۲×۳۲)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-control bg-card border border-border/80 flex items-center justify-center shrink-0 shadow-xs p-1">
                    {themeSettings.site_favicon_url ? (
                      <img
                        key={themeSettings.site_favicon_url}
                        src={cleanMediaUrl(themeSettings.site_favicon_url)}
                        alt="پیش‌نمایش FavIcon"
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <Globe className="w-6 h-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={themeSettings.site_favicon_url || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        site_favicon_url: e.target.value,
                      }))
                    }
                    onBlur={(e) => {
                      const cleaned = cleanMediaUrl(e.target.value)
                      if (cleaned !== e.target.value) {
                        setThemeSettings((prev) => ({
                          ...prev,
                          site_favicon_url: cleaned,
                        }))
                      }
                    }}
                    placeholder="/favicon.svg یا https://..."
                    className="flex-1 h-10 px-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <label className="h-10 px-3.5 rounded-field bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs duration-motion active:scale-[0.98]">
                    <Upload className="w-3.5 h-3.5 text-brand" />
                    <span>
                      {uploadingFavicon ? 'در حال آپلود...' : 'آپلود فایل'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFavicon}
                      disabled={uploadingFavicon}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  این آیکون در نوار زبانه (Tab) مرورگر خریداران و بوک‌مارک‌ها
                  نمایش داده می‌شود.
                </p>
              </div>

              {/* Logo Settings & Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand" />
                    <span>لوگوی رسمی فروشگاه (Site Logo URL):</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    تصویر افقی ترنسپرنت (PNG / WebP)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-20 rounded-control bg-card border border-border/80 flex items-center justify-center shrink-0 shadow-xs p-1">
                    {themeSettings.site_logo_url ? (
                      <img
                        key={themeSettings.site_logo_url}
                        src={cleanMediaUrl(themeSettings.site_logo_url)}
                        alt="پیش‌نمایش لوگو"
                        className="max-h-8 max-w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        بدون تصویر
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={themeSettings.site_logo_url || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        site_logo_url: e.target.value,
                      }))
                    }
                    onBlur={(e) => {
                      const cleaned = cleanMediaUrl(e.target.value)
                      if (cleaned !== e.target.value) {
                        setThemeSettings((prev) => ({
                          ...prev,
                          site_logo_url: cleaned,
                        }))
                      }
                    }}
                    placeholder="/images/logo.png یا https://..."
                    className="flex-1 h-10 px-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <label className="h-10 px-3.5 rounded-field bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs duration-motion active:scale-[0.98]">
                    <Upload className="w-3.5 h-3.5 text-brand" />
                    <span>
                      {uploadingLogo ? 'در حال آپلود...' : 'آپلود لوگو'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  در صورت خالی بودن، لوگوی متنی استاندارد {getSiteBrandName()}{' '}
                  نمایش داده خواهد شد.
                </p>
              </div>
            </div>

            {/* Names & Slogans (Optional fields) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground">
                    نام فارسی وب‌سایت:
                  </label>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    (اختیاری)
                  </span>
                </div>
                <input
                  type="text"
                  value={themeSettings.site_name_fa || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      site_name_fa: e.target.value,
                    }))
                  }
                  placeholder="اختیاری (مثلاً: پلی شاپ)"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground">
                    نام لاتین برند:
                  </label>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    (اختیاری)
                  </span>
                </div>
                <input
                  type="text"
                  value={themeSettings.site_name_en || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      site_name_en: e.target.value,
                    }))
                  }
                  placeholder="اختیاری (e.g. plyshop)"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground">
                    شعار و زیرعنوان هدر:
                  </label>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    (اختیاری)
                  </span>
                </div>
                <input
                  type="text"
                  value={themeSettings.site_subtitle || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      site_subtitle: e.target.value,
                    }))
                  }
                  placeholder="اختیاری (مثلاً: فروشگاه رسمی سرویس‌های بین‌المللی)"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-medium"
                />
              </div>
            </div>

            {/* Advanced SEO Metadata */}
            <div className="pt-4 border-t border-border/60 space-y-4">
              <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>
                  تنظیمات متای سئو و شبکه‌های اجتماعی (OpenGraph Meta Tags)
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    عنوان سئو صفحه اصلی (Meta Title):
                  </label>
                  <input
                    type="text"
                    value={themeSettings.meta_title || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        meta_title: e.target.value,
                      }))
                    }
                    placeholder="آناهیکس | پلتفرم تحویل فوری اشتراک‌های هوش مصنوعی"
                    className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    تصویر اشتراک‌گذاری در شبکه‌های اجتماعی (OG Image URL):
                  </label>
                  <input
                    type="text"
                    value={themeSettings.og_image_url || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        og_image_url: e.target.value,
                      }))
                    }
                    placeholder="/images/og-share.png یا https://..."
                    className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  توضیحات متا برای موتورهای جستجو (Meta Description):
                </label>
                <textarea
                  rows={2}
                  value={themeSettings.meta_description || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))
                  }
                  placeholder="آناهیکس - تحویل آنی و هوشمند اشتراک‌های Gemini Pro، ChatGPT Plus، Claude Pro، Cursor و ابزارهای پریمیوم با پرداخت ریالی و رمزارز"
                  className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  کلمات کلیدی سئو (با کاما جدا کنید):
                </label>
                <input
                  type="text"
                  value={themeSettings.meta_keywords || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      meta_keywords: e.target.value,
                    }))
                  }
                  placeholder="خرید اکانت chatgpt, اکانت کلود پرو, جمینای ادونسد, شماره مجازی ۵sim, اکانت cursor"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Support and Social Channels */}
            <div className="pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شماره تماس رسمی پشتیبانی:
                </label>
                <input
                  type="text"
                  value={themeSettings.support_phone || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      support_phone: e.target.value,
                    }))
                  }
                  placeholder="۰۲۱-۹۱۰۰۰۰۰۰"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  آیدی کانال / پشتیبانی تلگرام:
                </label>
                <input
                  type="text"
                  value={themeSettings.support_telegram || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      support_telegram: e.target.value,
                    }))
                  }
                  placeholder="@AnahixSupport"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: SITE MENUS AND NAVIGATION MANAGER */}
      {activeSubTab === 'site-menus' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <LayoutTemplate className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    مدیریت منوها و پیوندهای ناوبری فروشگاه (Header & Footer
                    Links)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    افزودن، ویرایش، حذف و فعال/غیرفعال کردن لینک‌های منوی بالای
                    سایت و پاورقی
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMenus}
                disabled={savingTheme}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTheme ? 'در حال ذخیره‌سازی...' : 'ذخیره کل منوها'}
                </span>
              </button>
            </div>

            {/* Header Navigation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-brand" />
                  <span>
                    پیوندهای منوی اصلی بالای سایت (Desktop Header Navigation)
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setHeaderMenus((prev) => [
                      ...prev,
                      {
                        id: String(Date.now()),
                        title: 'لینک جدید',
                        link: '/',
                        is_active: true,
                      },
                    ])
                  }
                  className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 border border-border/60 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن آیتم جدید</span>
                </button>
              </div>

              <div className="space-y-3">
                {headerMenus.map((item, idx) => {
                  const isExpanded = expandedMenuIds[item.id] ?? false
                  const childrenCount = item.children?.length || 0
                  return (
                    <div
                      key={item.id}
                      className="rounded-surface border border-border/60 bg-muted/20 overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-card/60">
                        <div className="w-7 h-7 rounded-control bg-secondary border border-border/60 flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 font-latin">
                          {idx + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              setHeaderMenus((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? { ...m, title: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            placeholder="عنوان منو"
                            className="h-9 px-3 rounded-field border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-brand"
                          />
                          <input
                            type="text"
                            value={item.link}
                            onChange={(e) =>
                              setHeaderMenus((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? { ...m, link: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            placeholder="آدرس مسیر (e.g. /category/ai_chat)"
                            className="h-9 px-3 rounded-field border border-border/60 bg-card text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand"
                          />
                          <input
                            type="text"
                            value={item.badge || ''}
                            onChange={(e) =>
                              setHeaderMenus((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? { ...m, badge: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            placeholder="بج اختیاری (مثلاً: جدید)"
                            className="h-9 px-3 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand"
                          />
                          <div className="flex items-center gap-1.5">
                            {item.icon_url && (
                              <img
                                src={item.icon_url}
                                alt=""
                                className="w-6 h-6 object-contain rounded-control border border-border/60 p-0.5 bg-card shrink-0 brightness-90 dark:brightness-100"
                              />
                            )}
                            <input
                              type="text"
                              value={item.icon_url || ''}
                              onChange={(e) =>
                                setHeaderMenus((prev) =>
                                  prev.map((m, i) =>
                                    i === idx
                                      ? { ...m, icon_url: e.target.value }
                                      : m,
                                  ),
                                )
                              }
                              placeholder="آدرس آیکون"
                              className="h-9 px-2 rounded-field border border-border/60 bg-card text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand flex-1"
                            />
                            <label
                              className="h-9 px-2 rounded-field bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                              title="آپلود آیکون منو"
                            >
                              <Upload className="w-3.5 h-3.5 text-brand" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadMenuIcon(idx, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Toggle Submenu Expand Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMenuIds((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                            className={`h-8 px-2.5 rounded-control border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              childrenCount > 0
                                ? 'bg-brand/10 text-brand border-brand/30'
                                : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                            }`}
                            title="مشاهده و مدیریت زیرمنوها (Dropdown/Flyout)"
                          >
                            <span>زیرمنوها ({childrenCount})</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              نمایش:
                            </span>
                            <ToggleSwitch
                              size="sm"
                              checked={item.is_active}
                              onChange={(checked) =>
                                setHeaderMenus((prev) =>
                                  prev.map((m, i) =>
                                    i === idx
                                      ? { ...m, is_active: checked }
                                      : m,
                                  ),
                                )
                              }
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setHeaderMenus((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="p-1.5 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="حذف آیتم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Submenus & Dropdown Links Builder */}
                      {isExpanded && (
                        <div className="p-3.5 bg-muted/30 border-t border-border/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                              <LayoutTemplate className="w-3.5 h-3.5 text-brand" />
                              <span>
                                زیرمنوهای شناور «{item.title || 'منو'}»
                                (Dropdown / Submenus):
                              </span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const presets: SubMenuItem[] = [
                                    {
                                      id: `${Date.now()}-1`,
                                      title: 'هوش مصنوعی چت (ChatGPT, Claude)',
                                      link: '/category/ai_chat',
                                      desc: 'دسترسی به قدرتمندترین مدل‌های زبانی',
                                    },
                                    {
                                      id: `${Date.now()}-2`,
                                      title:
                                        'دستیارهای کدنویسی (Cursor, Copilot)',
                                      link: '/category/coding_ai',
                                      desc: 'ابزارهای هوشمند توسعه‌دهندگان',
                                    },
                                    {
                                      id: `${Date.now()}-3`,
                                      title: 'ارتقای اکانت و لایسنس اختصاصی',
                                      link: '/category/personal_upgrade',
                                      desc: 'فعال‌سازی روی ایمیل شخصی',
                                    },
                                    {
                                      id: `${Date.now()}-4`,
                                      title: 'ابزارهای شبکه و امنیت',
                                      link: '/category/vpn',
                                      desc: 'اتصال پایدار و امن',
                                    },
                                  ]
                                  setHeaderMenus((prev) =>
                                    prev.map((m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            children: [
                                              ...(m.children || []),
                                              ...presets,
                                            ],
                                          }
                                        : m,
                                    ),
                                  )
                                  notifySuccess(
                                    'دسته‌ها اضافه شدند',
                                    '۴ زیرمنوی دسته‌بندی با موفقیت اضافه شد.',
                                  )
                                }}
                                className="h-7 px-2.5 rounded-control bg-secondary text-brand hover:bg-muted text-[11px] font-bold border border-border/60 transition flex items-center gap-1 cursor-pointer"
                              >
                                <FolderPlus className="w-3 h-3" />
                                <span>درج دسته‌های کاتالوگ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const newChild: SubMenuItem = {
                                    id: String(Date.now()),
                                    title: 'زیرمنوی جدید',
                                    link: '/',
                                    desc: '',
                                  }
                                  setHeaderMenus((prev) =>
                                    prev.map((m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            children: [
                                              ...(m.children || []),
                                              newChild,
                                            ],
                                          }
                                        : m,
                                    ),
                                  )
                                }}
                                className="h-7 px-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3 h-3" />
                                <span>افزودن زیرمنو</span>
                              </button>
                            </div>
                          </div>

                          {!item.children || item.children.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground bg-card/60 p-3 rounded-control border border-border/40 text-center">
                              هنوز زیرمنویی برای این آیتم تعریف نشده است. با زدن
                              دکمه «افزودن زیرمنو» یا «درج دسته‌های کاتالوگ»،
                              منوی کشویی بسازید.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {item.children.map((sub, sIdx) => (
                                <div
                                  key={sub.id}
                                  className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-control bg-card border border-border/60"
                                >
                                  <div className="text-[10px] text-muted-foreground font-mono font-latin px-1.5 shrink-0">
                                    #{sIdx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).map((c, ci) =>
                                                  ci === sIdx
                                                    ? {
                                                        ...c,
                                                        title: e.target.value,
                                                      }
                                                    : c,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    placeholder="عنوان زیرمنو (مثلاً: ChatGPT Plus)"
                                    className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-xs font-bold text-foreground focus:outline-none focus:border-brand flex-1 w-full"
                                  />
                                  <input
                                    type="text"
                                    value={sub.link}
                                    onChange={(e) =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).map((c, ci) =>
                                                  ci === sIdx
                                                    ? {
                                                        ...c,
                                                        link: e.target.value,
                                                      }
                                                    : c,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    placeholder="آدرس مسیر (e.g. /products/chatgpt-plus)"
                                    className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand flex-1 w-full"
                                  />
                                  <input
                                    type="text"
                                    value={sub.desc || ''}
                                    onChange={(e) =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).map((c, ci) =>
                                                  ci === sIdx
                                                    ? {
                                                        ...c,
                                                        desc: e.target.value,
                                                      }
                                                    : c,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    placeholder="توضیح کوتاه (اختیاری)"
                                    className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand flex-1 w-full"
                                  />
                                  <div className="flex items-center gap-1 shrink-0">
                                    {sub.icon_url && (
                                      <img
                                        src={sub.icon_url}
                                        alt=""
                                        className="w-5 h-5 object-contain rounded-xs border border-border/60 p-0.5 bg-card shrink-0 brightness-90 dark:brightness-100"
                                      />
                                    )}
                                    <label
                                      className="h-8 px-2 rounded-field bg-secondary hover:bg-muted text-foreground border border-border/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                      title="آپلود آیکون زیرمنو"
                                    >
                                      <Upload className="w-3 h-3 text-brand" />
                                      <span>آیکون</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleUploadSubmenuIcon(idx, sIdx, e)
                                        }
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).filter(
                                                  (_, ci) => ci !== sIdx,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    className="p-1 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                                    title="حذف زیرمنو"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Links Section */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-brand" />
                  <span>
                    پیوندهای دسترسی سریع فوتر سایت (Footer Quick Links)
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setFooterLinks((prev) => [
                      ...prev,
                      {
                        id: String(Date.now()),
                        title: 'لینک جدید فوتر',
                        link: '/',
                      },
                    ])
                  }
                  className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 border border-border/60 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن لینک فوتر</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {footerLinks.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2.5 rounded-surface border border-border/60 bg-muted/20"
                  >
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        setFooterLinks((prev) =>
                          prev.map((f, i) =>
                            i === idx ? { ...f, title: e.target.value } : f,
                          ),
                        )
                      }
                      className="flex-1 h-8 px-2.5 rounded-field border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-brand"
                    />
                    <input
                      type="text"
                      value={item.link}
                      onChange={(e) =>
                        setFooterLinks((prev) =>
                          prev.map((f, i) =>
                            i === idx ? { ...f, link: e.target.value } : f,
                          ),
                        )
                      }
                      className="flex-1 h-8 px-2.5 rounded-field border border-border/60 bg-card text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFooterLinks((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="p-1 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer About Text / Description */}
            <div className="pt-6 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <span>متن معرفی و توضیحات زیر لوگوی فوتر (Footer Bio)</span>
                </h4>
              </div>
              <textarea
                rows={3}
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="توضیحات کوتاه درباره فروشگاه، ضمانت‌ها و مجوزها در فوتر سایت..."
                className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand resize-none leading-relaxed"
              />
            </div>

            {/* Footer Trust Badges & Certification Management */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>
                      مدیریت نمادهای اعتماد و مجوزهای رسمی فوتر (Trust Badges &
                      E-Namad)
                    </span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    افزودن و آپلود نماد اعتماد الکترونیکی (اینماد)، نشان
                    ساماندهی، اتحادیه کشوری و امکان لینک‌گذاری اختصاصی
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaults: FooterTrustBadge[] = [
                        {
                          id: `badge-${Date.now()}-1`,
                          title: 'نماد اعتماد الکترونیکی (اینماد)',
                          image_url: '/images/enamad.png',
                          link_url: 'https://enamad.ir',
                          is_active: true,
                        },
                        {
                          id: `badge-${Date.now()}-2`,
                          title: 'نشان ساماندهی رسانه‌های دیجیتال',
                          image_url: '/images/samandehi.png',
                          link_url: 'https://samandehi.ir',
                          is_active: true,
                        },
                        {
                          id: `badge-${Date.now()}-3`,
                          title: 'عضو اتحادیه کشوری کسب‌وکارهای مجازی',
                          image_url: '/images/union.png',
                          link_url: 'https://ecunion.ir',
                          is_active: true,
                        },
                        {
                          id: `badge-${Date.now()}-4`,
                          title: 'پرداخت امن شاپرک و تتر TRC20',
                          image_url: '/images/security-seal.png',
                          link_url: '#',
                          is_active: true,
                        },
                      ]
                      setFooterBadges(defaults)
                      notifySuccess(
                        'نمادهای پیش‌فرض درج شدند',
                        '۴ نماد معتبر جهت ویرایش آماده شد.',
                      )
                    }}
                    className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold border border-border/60 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>درج نمادهای آماده</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFooterBadges((prev) => [
                        ...prev,
                        {
                          id: `badge-${Date.now()}`,
                          title: 'نماد جدید',
                          image_url: '',
                          link_url: '',
                          is_active: true,
                        },
                      ])
                    }
                    className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black flex items-center gap-1.5 shadow-control cursor-pointer duration-motion active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن نماد</span>
                  </button>
                </div>
              </div>

              {footerBadges.length === 0 ? (
                <div className="py-8 text-center bg-muted/10 border border-dashed border-border/60 rounded-surface space-y-2">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground font-bold">
                    هیچ نمادی تعریف نشده است. با زدن دکمه «درج نمادهای آماده» یا
                    «افزودن نماد» موارد دلخواه را اضافه نمایید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {footerBadges.map((badge, bIdx) => (
                    <div
                      key={badge.id}
                      className="p-3 rounded-surface border border-border/60 bg-muted/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Live Badge Preview Box */}
                          <div className="w-12 h-12 rounded-control bg-card border border-border/80 flex items-center justify-center shrink-0 p-1 shadow-xs">
                            {badge.image_url ? (
                              <img
                                src={cleanMediaUrl(badge.image_url)}
                                alt={badge.title}
                                className="max-h-9 max-w-full object-contain"
                                onError={(e) => {
                                  ;(e.target as HTMLElement).style.display =
                                    'none'
                                }}
                              />
                            ) : (
                              <ShieldCheck className="w-6 h-6 text-muted-foreground/50" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              value={badge.title}
                              onChange={(e) =>
                                setFooterBadges((prev) =>
                                  prev.map((b, i) =>
                                    i === bIdx
                                      ? { ...b, title: e.target.value }
                                      : b,
                                  ),
                                )
                              }
                              placeholder="عنوان نماد (مثلاً: اینماد)"
                              className="h-8 px-2.5 rounded-field border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-brand w-48 sm:w-56"
                            />
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] text-brand hover:underline font-bold flex items-center gap-1 cursor-pointer">
                                <Upload className="w-3 h-3" />
                                <span>
                                  {uploadingBadgeIdx === bIdx
                                    ? 'در حال آپلود...'
                                    : 'آپلود تصویر'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingBadgeIdx === bIdx}
                                  onChange={(e) =>
                                    handleUploadBadgeImage(bIdx, e)
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ToggleSwitch
                            size="sm"
                            checked={badge.is_active}
                            onChange={(checked) =>
                              setFooterBadges((prev) =>
                                prev.map((b, i) =>
                                  i === bIdx ? { ...b, is_active: checked } : b,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFooterBadges((prev) =>
                                prev.filter((_, i) => i !== bIdx),
                              )
                            }
                            className="p-1 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="حذف این نماد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-bold block">
                          لینک استعلام یا مقصد نماد (URL):
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={badge.link_url || ''}
                          onChange={(e) =>
                            setFooterBadges((prev) =>
                              prev.map((b, i) =>
                                i === bIdx
                                  ? { ...b, link_url: e.target.value }
                                  : b,
                              ),
                            )
                          }
                          placeholder="https://trustseal.enamad.ir/?id=..."
                          className="w-full h-8 px-2.5 rounded-field border border-border/60 bg-card text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CENTRALIZED API KEYS & SECRETS */}
      {activeSubTab === 'apikeys' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    مرکز دریافت و مدیریت کلیدهای وب‌سرویس و API Keyها
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    مدیریت کلیدهای اتصال به سامانه پیامک، درگاه زرین‌پال، سامانه
                    شماره مجازی ۵SIM و اعتبارسنجی اجتماعی
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveThemeField(themeSettings)}
                disabled={savingTheme}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTheme ? 'در حال ذخیره‌سازی...' : 'ذخیره کلیه کلیدها'}
                </span>
              </button>
            </div>

            {/* Secret Field Component */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMS.ir API Key */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand" />
                    <span>کلید وب‌سرویس سامانه پیامک (SMS.ir API Key):</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-brand/10 text-brand font-latin">
                    SMS Gateway
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.sms_api_key ? 'text' : 'password'}
                    value={themeSettings.sms_api_key || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        sms_api_key: e.target.value,
                      }))
                    }
                    placeholder="API Key سامانه پیامک..."
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('sms_api_key')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title={showSecrets.sms_api_key ? 'مخفی‌سازی' : 'نمایش'}
                    >
                      {showSecrets.sms_api_key ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.sms_api_key || '',
                          'sms_api_key',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title="کپی در کلیپ‌بورد"
                    >
                      {copiedKey === 'sms_api_key' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    شماره خط فرستنده اختصاصی پیامک:
                  </label>
                  <input
                    type="text"
                    value={themeSettings.sms_line_number || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        sms_line_number: e.target.value,
                      }))
                    }
                    placeholder="3000..."
                    className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
              </div>

              {/* ZarinPal Merchant ID */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>مرچنت کد درگاه زرین‌پال / شاپرک:</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-emerald-500/10 text-emerald-500 font-latin">
                    Payment Gateway
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.zarinpal ? 'text' : 'password'}
                    value={themeSettings.zarinpal_merchant_id || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        zarinpal_merchant_id: e.target.value,
                      }))
                    }
                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('zarinpal')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showSecrets.zarinpal ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.zarinpal_merchant_id || '',
                          'zarinpal',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'zarinpal' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  شناسه مرچنت اختصاصی درگاه زرین‌پال جهت پرداخت آنلاین متصل به
                  شاپرک.
                </p>
              </div>

              {/* 5SIM Virtual Numbers API Key */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span>کلید وب‌سرویس سامانه شماره مجازی ۵SIM:</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-purple-500/10 text-purple-500 font-latin">
                    5SIM.net API
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.fivesim ? 'text' : 'password'}
                    value={themeSettings.fivesim_api_key || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        fivesim_api_key: e.target.value,
                      }))
                    }
                    placeholder="Bearer eyJhbGciOi..."
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('fivesim')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showSecrets.fivesim ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.fivesim_api_key || '',
                          'fivesim',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'fivesim' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  جهت خرید خودکار شماره و دریافت پیامک‌های کد تایید در ماژول
                  شماره مجازی.
                </p>
              </div>

              {/* OAuth Client Keys */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-500" />
                    <span>شناسه کلاینت Google OAuth Client ID:</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-blue-500/10 text-blue-500 font-latin">
                    Google Sign-In
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.google ? 'text' : 'password'}
                    value={themeSettings.google_client_id || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        google_client_id: e.target.value,
                      }))
                    }
                    placeholder="client_id.apps.googleusercontent.com"
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('google')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showSecrets.google ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.google_client_id || '',
                          'google',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'google' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    شناسه GitHub OAuth Client ID:
                  </label>
                  <input
                    type="text"
                    value={themeSettings.github_client_id || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        github_client_id: e.target.value,
                      }))
                    }
                    placeholder="Iv1..."
                    className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: BILLING & OFFICIAL INVOICE */}
      {activeSubTab === 'billing' && <AdminBillingSettingsView />}

      {/* TAB CONTENT 4: SMS GATEWAY */}
      {activeSubTab === 'sms' && <SMSGatewayView />}

      {/* TAB CONTENT 5: PAYMENT GATEWAYS & SYSTEM PARAMETERS */}
      {activeSubTab === 'gateways' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Global Exchange Rate & SwapWallet Engine Panel */}
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Coins className="w-4 h-4 text-brand" />
                  <span>
                    موتور نرخ ارز زنده تتر SwapWallet و اولویت قیمت‌گذاری سراسری
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تنظیم اولویت استعلام نرخ ارز دلاری و تومانی محصولات و شماره‌های
                  مجازی
                </p>
              </div>

              {exchangeRateSettings.live_usd_rate ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-mono font-latin bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    نرخ زنده تتر SwapWallet:{' '}
                    {toPersianDigits(
                      exchangeRateSettings.live_usd_rate.toLocaleString(
                        'fa-IR',
                      ),
                    )}{' '}
                    تومان
                  </span>
                </div>
              ) : null}
            </div>

            {/* Priority Option Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setExchangeRateSettings((prev) => ({
                    ...prev,
                    rate_priority: 'manual',
                  }))
                }
                className={`p-4 rounded-surface border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  exchangeRateSettings.rate_priority === 'manual'
                    ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-surface'
                    : 'border-border/60 hover:border-border bg-muted/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control flex items-center justify-center bg-primary text-primary-foreground shadow-control">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-foreground">
                        اولویت ۱: نرخ دستی ثابت
                      </h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        کنترل ۱۰۰٪ دستی بر مبنای نرخ اعلامی شما
                      </p>
                    </div>
                  </div>
                  {exchangeRateSettings.rate_priority === 'manual' && (
                    <span className="text-[10px] font-black text-brand">
                      فعال ✓
                    </span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExchangeRateSettings((prev) => ({
                    ...prev,
                    rate_priority: 'swapwallet',
                  }))
                }
                className={`p-4 rounded-surface border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  exchangeRateSettings.rate_priority === 'swapwallet'
                    ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-surface'
                    : 'border-border/60 hover:border-border bg-muted/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control flex items-center justify-center bg-emerald-600 text-white shadow-control">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-foreground">
                        اولویت ۲: مبدل زنده تتر SwapWallet
                      </h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        استعلام لحظه‌ای بازار (فال‌بک خودکار به نرخ دستی در صورت
                        قطعی)
                      </p>
                    </div>
                  </div>
                  {exchangeRateSettings.rate_priority === 'swapwallet' && (
                    <span className="text-[10px] font-black text-emerald-400">
                      فعال ✓
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Inputs: USD Rate & Global Margin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground block">
                  نرخ مبنای دستی دلار / تتر (تومان):
                </label>
                <input
                  type="number"
                  step="any"
                  value={exchangeRateSettings.usd_rate}
                  onChange={(e) =>
                    setExchangeRateSettings((prev) => ({
                      ...prev,
                      usd_rate: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground block">
                  مارجین سود پیش‌فرض (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={exchangeRateSettings.margin_percent}
                  onChange={(e) =>
                    setExchangeRateSettings((prev) => ({
                      ...prev,
                      margin_percent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground block">
                  نرخ موثر اعمالی در سایت:
                </label>
                <div className="h-10 px-3.5 rounded-field border border-border/40 bg-muted/40 text-foreground text-xs flex items-center justify-between font-sans font-bold">
                  <span>
                    {formatToman(
                      exchangeRateSettings.rate_priority === 'swapwallet' &&
                        exchangeRateSettings.live_usd_rate
                        ? exchangeRateSettings.live_usd_rate
                        : exchangeRateSettings.usd_rate,
                    )}{' '}
                    تومان
                  </span>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    (
                    {exchangeRateSettings.rate_priority === 'swapwallet'
                      ? 'SwapWallet Live'
                      : 'دستی'}
                    )
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={handleSaveExchangeRate}
                disabled={savingExchangeRate}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
              >
                {savingExchangeRate ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>ذخیره تنظیمات نرخ ارز و SwapWallet</span>
              </button>
            </div>
          </div>

          {/* 2. Payment Gateways Desk */}
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand" />
                  <span>درگاه‌های پرداخت فعال سیستم (پردازش و تسویه)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  مدیریت عناوین، آیکون‌ها و وضعیت فعال‌سازی درگاه‌های پرداخت آنلاین
                  و بانکی
                </p>
              </div>
              <button
                type="button"
                onClick={loadPayments}
                disabled={loadingPayments}
                className="p-2 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition shadow-control cursor-pointer"
                title="به‌روزرسانی درگاه‌ها"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin text-brand' : ''}`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {payments.map((p) => {
                const gw = getGatewayDisplay(p.platform, p.icon_url)
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3.5 text-right flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-control bg-card border border-border/60 flex items-center justify-center p-1 shrink-0 shadow-xs">
                            {gw.icon}
                          </div>
                          <div>
                            <span className="font-bold text-foreground text-xs block">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono font-latin">
                              پلتفرم: {p.platform}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-control text-[10px] font-bold border ${
                            p.display_mode === 'disabled_visible'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : p.display_mode === 'hidden'
                                ? 'bg-muted text-muted-foreground border-border/40'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {p.display_mode === 'disabled_visible'
                            ? 'نمایش غیرفعال'
                            : p.display_mode === 'hidden'
                              ? 'مخفی'
                              : 'فعال جهت پرداخت'}
                        </span>
                      </div>

                      {/* Title & Icon Input with Upload Button */}
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                            نام نمایشی درگاه:
                          </label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) =>
                              setPayments((prev) =>
                                prev.map((item) =>
                                  item.id === p.id
                                    ? { ...item, name: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                            آیکون اختصاصی درگاه (تصویر یا آدرس SVG/PNG):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={p.icon_url || ''}
                              onChange={(e) =>
                                setPayments((prev) =>
                                  prev.map((item) =>
                                    item.id === p.id
                                      ? { ...item, icon_url: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                              placeholder="/icons/gateway.svg یا https://..."
                              className="flex-1 h-8 px-2.5 text-xs rounded-control border border-border/60 bg-card text-foreground font-mono font-latin dir-ltr text-left outline-none focus:border-brand"
                            />
                            <label
                              className="h-8 px-2.5 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                              title="آپلود تصویر آیکون"
                            >
                              <Upload className="w-3 h-3 text-brand" />
                              <span>آپلود</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleUploadPaymentIcon(p.id, e)
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                        {/* Display & Processing Status Selector */}
                        <div>
                          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                            وضعیت نمایش و تسویه درگاه:
                          </label>
                          <select
                            value={
                              p.display_mode ||
                              (p.enable !== false ? 'active' : 'hidden')
                            }
                            onChange={(e: any) =>
                              setPayments((prev) =>
                                prev.map((item) =>
                                  item.id === p.id
                                    ? {
                                        ...item,
                                        display_mode: e.target.value,
                                        enable: e.target.value === 'active',
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="w-full h-8 px-2.5 text-xs rounded-control border border-border/60 bg-card text-foreground font-bold outline-none focus:border-brand cursor-pointer"
                          >
                            <option value="active">
                              🟢 فعال و قابل پرداخت (نمایش بده)
                            </option>
                            <option value="disabled_visible">
                              🟡 نمایش بده ولی غیرفعال (غیرقابل کلیک)
                            </option>
                            <option value="hidden">
                              ⚪ مخفی (عدم نمایش در فروشگاه و پنل)
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-latin">
                        کارمزد: {p.fee_percentage}%
                      </span>
                      <button
                        type="button"
                        disabled={updatingPaymentId === p.id}
                        onClick={async () => {
                          setUpdatingPaymentId(p.id)
                          try {
                            const curMode =
                              p.display_mode ||
                              (p.enable !== false ? 'active' : 'hidden')
                            registerPaymentGateways([
                              {
                                platform: p.platform,
                                icon_url: p.icon_url,
                                name: p.name,
                              },
                            ])
                            await apiService.adminUpdatePayment(p.id, {
                              name_fa: p.name,
                              icon: p.icon_url,
                              display_mode: curMode,
                              enable: curMode === 'active',
                            })
                            notifySuccess(
                              'درگاه ذخیره شد',
                              `تنظیمات ${p.name} با موفقیت ثبت شد.`,
                            )
                          } catch (err: any) {
                            notifyError('خطا در ذخیره', err.message)
                          } finally {
                            setUpdatingPaymentId(null)
                          }
                        }}
                        className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control flex items-center gap-1 cursor-pointer duration-motion active:scale-[0.98]"
                      >
                        {updatingPaymentId === p.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>ذخیره درگاه</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: MULTI-AUTH SYSTEM CONTROLS */}
      {activeSubTab === 'auth' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    تنظیمات روش‌های ورود و ثبت‌نام مشتریان (Multi-Auth System)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    فعال‌سازی و غیرفعال‌سازی گزینه‌های احراز هویت در مدال ورود
                    فروشگاه (گوگل، گیت‌هاب، کلمه عبور ثابت و کد پیامکی OTP)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAuthSettings}
                disabled={authSaveLoading}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {authSaveLoading
                    ? 'در حال ذخیره...'
                    : 'ذخیره تنظیمات احراز هویت'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Google OAuth */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ورود سریع با Google
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_google_enabled}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_google_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    امکان ورود و ثبت‌نام با ۱ کلیک از طریق حساب جیمیل با آواتار و
                    نام خودکار.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  OAuth 2.0 Client
                </div>
              </div>

              {/* GitHub OAuth */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ورود توسعه‌دهندگان GitHub
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_github_enabled}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_github_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ورود آسان ویژه برنامه‌نویسان و خریداران ابزارهای هوش مصنوعی و
                    سرویس‌های فنی.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  OAuth 2.0 GitHub
                </div>
              </div>

              {/* Static Password Login */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ورود با کلمه عبور
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_password_enabled}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_password_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ورود با شماره موبایل یا ایمیل به همراه رمز عبور رمزنگاری‌شده
                    BCrypt.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  BCrypt Auth Flow
                </div>
              </div>

              {/* Email Authentication */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ثبت‌نام و ورود با ایمیل
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_email_enabled !== false}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_email_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    امکان عضویت و ورود مستقیم با آدرس ایمیل، تایید هویت ایمیلی و
                    بازیابی حساب.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  Email Authentication
                </div>
              </div>

              {/* SMS OTP Mandatory */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      الزام پیامک تایید OTP
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_otp_required}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_otp_required: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ارسال کد تایید یکبار مصرف پیامکی ۵ رقمی به تلفن همراه قبل از
                    دسترسی به حساب.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  SMS Gateway OTP
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS & ANNOUNCEMENTS */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* SECTION 1: BROADCAST ANNOUNCEMENTS & FIRST-LOAD POPUPS */}
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-brand" />
                  <span>
                    مدیریت اعلان‌ها، پاپ‌آپ‌های بازشو و پیام‌های سراسری (Broadcast
                    Announcements)
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  ارسال پیام‌های بازشو در اولین ورود به صفحات خاص، اطلاعیه‌های
                  تخفیف و اخبار در منوی زنگوله هدر و پنل کاربری
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenCreateAnnounce}
                  className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>ایجاد اعلان جدید</span>
                </button>

                <button
                  type="button"
                  onClick={loadAnnouncements}
                  disabled={loadingAnnounce}
                  className="p-2 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition shadow-control cursor-pointer"
                  title="تازه‌سازی لیست"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingAnnounce ? 'animate-spin text-brand' : ''}`}
                  />
                </button>
              </div>
            </div>

            {loadingAnnounce ? (
              <LoadingState message="در حال بارگذاری اعلان‌های سراسری سیستم..." />
            ) : announcements.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-surface border border-dashed border-border/60 space-y-2">
                <BellRing className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  هنوز اعلانی ثبت نشده است
                </p>
                <p className="text-[11px] text-muted-foreground">
                  با زدن دکمه «ایجاد اعلان جدید»، اطلاعیه یا پاپ‌آپ سراسری ایجاد
                  فرمایید.
                </p>
              </div>
            ) : (
              <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold select-none">
                        <th className="p-3.5 text-center">تصویر</th>
                        <th className="p-3.5 text-center">عنوان اعلان</th>
                        <th className="p-3.5 text-center">صفحات هدف</th>
                        <th className="p-3.5 text-center">نوع نمایش</th>
                        <th className="p-3.5 text-center">درجه فوریت</th>
                        <th className="p-3.5 text-center">وضعیت</th>
                        <th className="p-3.5 text-center">تاریخ انقضا</th>
                        <th className="p-3.5 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {announcements.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-3 text-center">
                            {a.image_url ? (
                              <img
                                src={a.image_url}
                                alt=""
                                className="w-10 h-10 object-cover rounded-control border border-border/60 mx-auto"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                بدون عکس
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-foreground">
                            <div>{a.title}</div>
                            <div className="text-[10px] text-muted-foreground font-normal line-clamp-1 max-w-[200px] mx-auto mt-0.5">
                              {a.content}
                            </div>
                          </td>
                          <td className="p-3 text-center font-latin text-[11px]">
                            {a.target_pages === 'all'
                              ? '🌐 تمام صفحات'
                              : a.target_pages}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-secondary text-secondary-foreground border border-border/40">
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
                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border ${
                                a.severity === 'discount'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                  : a.severity === 'warning'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    : a.severity === 'success'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-brand/10 text-brand border-brand/20'
                              }`}
                            >
                              {a.severity === 'discount'
                                ? '🔥 تخفیف'
                                : a.severity === 'warning'
                                  ? '⚠️ هشدار'
                                  : a.severity === 'success'
                                    ? '✅ بروزرسانی'
                                    : '📢 اطلاعیه'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <ToggleSwitch
                              checked={a.is_active}
                              onChange={async (val) => {
                                setAnnouncements((prev) =>
                                  prev.map((item) =>
                                    item.id === a.id
                                      ? { ...item, is_active: val }
                                      : item,
                                  ),
                                )
                                await apiService.adminUpdateAnnouncement(a.id, {
                                  is_active: val,
                                })
                              }}
                              size="sm"
                            />
                          </td>
                          <td className="p-3 text-center text-muted-foreground font-latin text-[11px]">
                            {a.expires_at
                              ? new Date(a.expires_at).toLocaleDateString(
                                  'fa-IR',
                                )
                              : 'نامحدود'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAnnounce(a)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition shadow-xs cursor-pointer"
                                title="ویرایش اعلان"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-brand" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAnnounceId(a.id)}
                                className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition shadow-xs cursor-pointer"
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

          {/* SECTION 2: TICKET NOTIFICATION CHANNELS (SMS.ir) */}
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                  <span>
                    کانال‌های اطلاع‌رسانی پیامکی تیکت‌ها و پشتیبانی (SMS.ir
                    Gateway)
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  تعیین نحوه ارسال پیامک خودکار به خریداران هنگام پاسخ‌گویی
                  اپراتور
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveNotificationSettings}
                disabled={savingNotifSettings}
                className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control transition flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
              >
                {savingNotifSettings ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>ذخیره تنظیمات پیامک تیکت</span>
              </button>
            </div>

            <div className="p-5 rounded-surface border border-border/80 bg-muted/20 space-y-4 max-w-2xl text-right">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span className="font-black text-sm text-foreground">
                  پیامک خدماتی تیکت‌ها (SMS.ir)
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                رفتار تاگل دریافت پیامک در فرم ایجاد تیکت و پنجره چت مشتری:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'default_on',
                    label: 'پیش‌فرض فعال (Default ON)',
                    desc: 'تاگل پیامک به صورت پیش‌فرض روشن است اما کاربر می‌تواند آن را خاموش کند',
                  },
                  {
                    id: 'default_off',
                    label: 'پیش‌فرض غیرفعال (Default OFF)',
                    desc: 'تاگل پیامک به صورت پیش‌فرض خاموش است و با تمایل کاربر روشن می‌شود',
                  },
                  {
                    id: 'disabled',
                    label: 'عدم نمایش و غیرفعال کامل (Disabled)',
                    desc: 'پیامک تیکت کاملاً خاموش بوده و هیچ تاگل یا گزینه‌ای به کاربر نمایش داده نمی‌شود',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-3 rounded-control border flex items-start gap-2.5 cursor-pointer transition select-none ${
                      ticketSMSMode === opt.id
                        ? 'border-brand bg-brand/10 shadow-xs'
                        : 'border-border/60 bg-card hover:border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ticket_sms_setting"
                      value={opt.id}
                      checked={ticketSMSMode === opt.id}
                      onChange={() => setTicketSMSMode(opt.id as any)}
                      className="mt-0.5 accent-brand cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground block">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground block leading-relaxed">
                        {opt.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      {isAnnounceModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="w-full max-w-2xl bg-card rounded-surface border border-border/80 shadow-surface p-5 sm:p-6 space-y-4 text-right animate-in zoom-in-95 duration-200 text-foreground my-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-control bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">
                    {editingAnnounce
                      ? 'ویرایش اعلان سراسری'
                      : 'ایجاد اعلان و پاپ‌آپ جدید'}
                  </h4>
                </div>
                <ModalCloseButton
                  onClick={() => setIsAnnounceModalOpen(false)}
                  size="sm"
                />
              </div>

              <form
                onSubmit={handleSaveAnnouncement}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">
                    عنوان اعلان <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="مثال: تخفیف ویژه بهاره آغاز شد!"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground block">
                    متن و محتوای اعلان (تکست‌ادیتور / مارک‌داون){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <RichContentEditor
                    value={announceContent}
                    onChange={setAnnounceContent}
                    placeholder="متن کامل پیام یا اعلان..."
                    minHeight="180px"
                    label="محتوای اعلان"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      تصویر / بنر اعلان (اختیاری):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={announceImage}
                        onChange={(e) => setAnnounceImage(e.target.value)}
                        placeholder="/images/banner.jpg یا https://..."
                        className="flex-1 h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin dir-ltr text-left outline-none focus:border-brand"
                      />
                      <label className="h-9 px-3 rounded-field bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5 text-brand" />
                        <span>
                          {uploadingAnnounceImage ? 'آپلود...' : 'آپلود عکس'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadAnnounceImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">
                      صفحات هدف جهت نمایش:
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
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

      {/* TAB CONTENT 7: ADMIN AUDIT & ACTIVITY LOGS */}
      {activeSubTab === 'audit-logs' && <AdminActionLogView />}
    </div>
  )
}
