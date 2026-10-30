import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Flame,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../services/api'
import type { BannerItem, ThemeSettings } from '../../types'
import { toPersianDigits } from '../../utils/formatters'
import { BannerCarousel } from '../vibefarsi/BannerCarousel'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ScrollingAnnouncement } from '../vibefarsi/ScrollingAnnouncement'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { BannerPositionSelect } from './BannerPositionSelect'

export const AdminBannersView: React.FC = () => {
  const { success, error } = useNotification()
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<9 | 18 | 27>(9)
  const [editingBanner, setEditingBanner] =
    useState<Partial<BannerItem> | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    bannerId: string | null
    loading: boolean
  }>({
    isOpen: false,
    bannerId: null,
    loading: false,
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Active Primary Sub-Tab ('banners' | 'trust_ticker' | 'scrolling_ticker')
  const [activeMainTab, setActiveMainTab] = useState<
    'banners' | 'trust_ticker' | 'scrolling_ticker'
  >('banners')

  // Theme settings for Trust Ticker & Scrolling Announcement
  const [trustTickerEnabled, setTrustTickerEnabled] = useState(true)
  const [trustTickerItems, setTrustTickerItems] = useState<
    Array<{
      id: string
      icon: string
      title: string
      desc: string
      active: boolean
    }>
  >([
    {
      id: 't-1',
      icon: 'zap',
      title: 'تحویل آنی ۰ ثانیه‌ای',
      desc: 'صدور بلافاصله پس از پرداخت',
      active: true,
    },
    {
      id: 't-2',
      icon: 'credit-card',
      title: 'پرداخت امن ریالی و تتر',
      desc: 'شبکه شتاب و تتر TRC20',
      active: true,
    },
    {
      id: 't-3',
      icon: 'shield-check',
      title: 'ضمانت ۳۰ روزه تعویض',
      desc: 'گارانتی کامل و عدم مسدودی',
      active: true,
    },
    {
      id: 't-4',
      icon: 'headphones',
      title: 'پشتیبانی ۲۴ ساعته تلگرام',
      desc: 'پاسخگویی سریع کارشناسان',
      active: true,
    },
  ])
  const [scrollingEnabled, setScrollingEnabled] = useState(true)
  const [scrollingText, setScrollingText] = useState(
    '🔥 جشنواره تخفیف ویژه هوش مصنوعی: تا ۴۰٪ تخفیف روی اکانت‌های قانونی ChatGPT Plus و Claude با تحویل فوری ⚡ تمامی سرویس‌ها فعال و تحویل خودکار ۰ ثانیه‌ای برقرار است • بیش از ۱۲,۰۰۰ سفارش موفق در سامانه',
  )
  const [scrollingBadge, setScrollingBadge] = useState('رویداد زنده')
  const [scrollingIcon, setScrollingIcon] = useState('flame')

  // Hero Section Customizer State (Title, Typewriter, Description, Buttons)
  const [heroBadgeText, setHeroBadgeText] = useState(
    'تحویل آنی لایسنس و اکانت‌های هوش مصنوعی',
  )
  const [heroTitle, setHeroTitle] = useState('خرید قانونی اشتراک‌های')
  const [heroTypewriterWords, setHeroTypewriterWords] = useState(
    'ChatGPT Plus, Claude 3.7 Sonnet, Gemini Advanced, Cursor AI Pro, Google One 2TB',
  )
  const [heroDescription, setHeroDescription] = useState(
    'دسترسی مستقیم و پایدار به قدرتمندترین ابزارهای هوش مصنوعی روز جهان با پرداخت ریالی عضو شتاب، تضمین بدون مسدودی و پروتکل امنیتی Zeroize.',
  )
  const [heroBtn1Text, setHeroBtn1Text] = useState('مشاهده کاتالوگ اشتراک‌ها')
  const [heroBtn1Link, setHeroBtn1Link] = useState('#products-catalog')
  const [heroBtn2Text, setHeroBtn2Text] = useState('شماره مجازی (SMS)')
  const [heroBtn2Link, setHeroBtn2Link] = useState('/virtual-numbers')
  const [isHeroTextModalOpen, setIsHeroTextModalOpen] = useState(false)
  const [savingHeroText, setSavingHeroText] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // Load theme settings for Trust Ticker & Scrolling ticker
  useEffect(() => {
    api
      .getAdminThemeSettings()
      .then((s) => {
        if (s) {
          setTrustTickerEnabled(s.trust_ticker_enabled !== false)
          setScrollingEnabled(s.scrolling_announcement_enabled !== false)
          if (s.scrolling_announcement_text) {
            setScrollingText(s.scrolling_announcement_text)
          }
          if (s.scrolling_announcement_badge) {
            setScrollingBadge(s.scrolling_announcement_badge)
          }
          if (s.scrolling_announcement_icon) {
            setScrollingIcon(s.scrolling_announcement_icon)
          }
          if (s.hero_badge_text) setHeroBadgeText(s.hero_badge_text)
          if (s.hero_title) setHeroTitle(s.hero_title)
          if (s.hero_typewriter_words) {
            setHeroTypewriterWords(s.hero_typewriter_words)
          }
          if (s.hero_description) setHeroDescription(s.hero_description)
          if (s.hero_btn1_text) setHeroBtn1Text(s.hero_btn1_text)
          if (s.hero_btn1_link) setHeroBtn1Link(s.hero_btn1_link)
          if (s.hero_btn2_text) setHeroBtn2Text(s.hero_btn2_text)
          if (s.hero_btn2_link) setHeroBtn2Link(s.hero_btn2_link)
          if (s.trust_ticker_json) {
            try {
              const parsed = JSON.parse(s.trust_ticker_json)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTrustTickerItems(parsed)
              }
            } catch {}
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveHeroText = async () => {
    setSavingHeroText(true)
    try {
      const payload: Partial<ThemeSettings> = {
        hero_badge_text: heroBadgeText.trim(),
        hero_title: heroTitle.trim(),
        hero_typewriter_words: heroTypewriterWords.trim(),
        hero_description: heroDescription.trim(),
        hero_btn1_text: heroBtn1Text.trim(),
        hero_btn1_link: heroBtn1Link.trim(),
        hero_btn2_text: heroBtn2Text.trim(),
        hero_btn2_link: heroBtn2Link.trim(),
      }
      await api.updateAdminThemeSettings(payload)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      success('تنظیمات متنی و دکمه‌های هیرو با موفقیت ذخیره شد')
      setIsHeroTextModalOpen(false)
    } catch (err: any) {
      error('خطا در ذخیره تنظیمات هیرو', err.message)
    } finally {
      setSavingHeroText(false)
    }
  }

  const handleToggleTrustTicker = async (enabled: boolean) => {
    setTrustTickerEnabled(enabled)
    try {
      const payload: Partial<ThemeSettings> = {
        trust_ticker_enabled: enabled,
        trust_ticker_json: JSON.stringify(trustTickerItems),
      }
      await api.updateAdminThemeSettings(payload)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      success(
        enabled ? 'نوار تضمینات فعال شد' : 'نوار تضمینات غیرفعال و مخفی شد',
      )
    } catch (err: any) {
      error('خطا در ذخیره وضعیت نوار تضمینات', err.message)
    }
  }

  const handleDeleteTrustItem = async (id: string) => {
    const next = trustTickerItems.filter((t) => t.id !== id)
    setTrustTickerItems(next)
    try {
      const payload: Partial<ThemeSettings> = {
        trust_ticker_enabled: trustTickerEnabled,
        trust_ticker_json: JSON.stringify(next),
      }
      await api.updateAdminThemeSettings(payload)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      success('نشان حذف و تغییرات ذخیره شد')
    } catch (err: any) {
      error('خطا در ذخیره تغییرات', err.message)
    }
  }

  const handleToggleScrolling = async (enabled: boolean) => {
    setScrollingEnabled(enabled)
    try {
      const payload: Partial<ThemeSettings> = {
        scrolling_announcement_enabled: enabled,
        scrolling_announcement_text: scrollingText.trim(),
        scrolling_announcement_badge: scrollingBadge.trim(),
        scrolling_announcement_icon: scrollingIcon,
      }
      await api.updateAdminThemeSettings(payload)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      success(enabled ? 'نوار متحرک فعال شد' : 'نوار متحرک غیرفعال و مخفی شد')
    } catch (err: any) {
      error('خطا در ذخیره وضعیت نوار متحرک', err.message)
    }
  }

  const handleSaveTrustTicker = async () => {
    setSavingSettings(true)
    try {
      const payload: Partial<ThemeSettings> = {
        trust_ticker_enabled: trustTickerEnabled,
        trust_ticker_json: JSON.stringify(trustTickerItems),
      }
      await api.updateAdminThemeSettings(payload)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      success('تنظیمات نوار تضمین خدمات با موفقیت ذخیره شد')
    } catch (err: any) {
      error('خطا در ذخیره تنظیمات', err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveScrollingTicker = async () => {
    setSavingSettings(true)
    try {
      const payload: Partial<ThemeSettings> = {
        scrolling_announcement_enabled: scrollingEnabled,
        scrolling_announcement_text: scrollingText.trim(),
        scrolling_announcement_badge: scrollingBadge.trim(),
        scrolling_announcement_icon: scrollingIcon,
      }
      await api.updateAdminThemeSettings(payload)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      success('تنظیمات نوار متحرک اعلان با موفقیت ذخیره شد')
    } catch (err: any) {
      error('خطا در ذخیره نوار متحرک', err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const heroSliderBanners = useMemo(() => {
    return banners.filter((b) => b.position === 'main_slider' && b.is_active)
  }, [banners])

  const heroSideBanners = useMemo(() => {
    return banners.filter((b) => b.position === 'hero_side' && b.is_active)
  }, [banners])

  const loadBanners = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminBanners()
      setBanners(data)
    } catch (err: any) {
      error('خطا در دریافت لیست بنرها', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  const handleOpenCreate = () => {
    setEditingBanner({
      title: '',
      subtitle: '',
      badge_text: 'پیشنهاد شگفت‌انگیز',
      image_url:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      link_url: '/#flash-sale',
      position: 'main_slider',
      bg_gradient: 'from-blue-600 via-indigo-700 to-slate-900',
      button_text: 'مشاهده و خرید',
      secondary_button_text: '',
      secondary_link_url: '',
      sort_order: (banners.length + 1) * 10,
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner({ ...banner })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, bannerId: id, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.bannerId) return
    setDeleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      await api.deleteBanner(deleteConfirm.bannerId)
      success('بنر با موفقیت حذف شد')
      setDeleteConfirm({ isOpen: false, bannerId: null, loading: false })
      loadBanners()
    } catch (err: any) {
      error('خطا در حذف بنر', err.message)
      setDeleteConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleToggleActive = async (banner: BannerItem) => {
    try {
      await api.updateBanner(banner.id, {
        ...banner,
        is_active: !banner.is_active,
      })
      setBanners((prev) =>
        prev.map((b) =>
          b.id === banner.id ? { ...b, is_active: !b.is_active } : b,
        ),
      )
      success(
        'وضعیت بنر تغییر یافت',
        `بنر «${banner.title}» اکنون ${!banner.is_active ? 'فعال' : 'غیرفعال'} شد.`,
      )
    } catch (err: any) {
      error('خطا در تغییر وضعیت بنر', err.message)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBanner?.title || !editingBanner?.image_url) {
      error('عنوان بنر و آدرس تصویر الزامی است')
      return
    }

    setSaveLoading(true)
    try {
      if (editingBanner.id) {
        await api.updateBanner(editingBanner.id, editingBanner)
        success('بنر با موفقیت ویرایش شد')
      } else {
        await api.createBanner(editingBanner)
        success('بنر جدید با موفقیت ایجاد شد')
      }
      setIsModalOpen(false)
      setEditingBanner(null)
      loadBanners()
    } catch (err: any) {
      error('خطا در ذخیره بنر', err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const resp = await api.uploadMedia(file)
      setEditingBanner((prev) => ({
        ...prev,
        image_url: resp.file_url,
      }))
      success('تصویر با موفقیت بارگذاری شد')
    } catch (err: any) {
      error('خطا در بارگذاری تصویر', err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const filteredBanners = banners.filter((b) => {
    if (positionFilter !== 'all' && b.position !== positionFilter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.subtitle || '').toLowerCase().includes(q) ||
      (b.badge_text || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filteredBanners.length / pageSize) || 1
  const paginatedBanners = filteredBanners.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const getPositionLabel = (pos?: string) => {
    switch (pos) {
      case 'main_slider':
        return 'اسلایدر هیرو'
      case 'middle_strip':
        return 'بنر دوقلو میانی'
      case 'flash_sale':
        return 'جشنواره تخفیف'
      case 'hero_side':
        return 'کنار هیرو'
      case 'category_header':
        return 'هدر دسته‌بندی‌ها'
      default:
        return pos || 'عمومی'
    }
  }

  const isBannerEdited = (created?: string, updated?: string) => {
    if (!created || !updated) return false
    const tCreate = new Date(created).getTime()
    const tUpdate = new Date(updated).getTime()
    if (Number.isNaN(tCreate) || Number.isNaN(tUpdate)) return false
    // Difference greater than 10 seconds means it was genuinely edited after creation
    return Math.abs(tUpdate - tCreate) > 10000
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return '-'
    const date = d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const time = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${date} ساعت ${time}`
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Unified Admin Header Banner */}
      <AdminHeaderBanner
        icon={ImageIcon}
        title="مدیریت بنرها، اسلایدرها و پروموشن‌های فروشگاه"
        subtitle="کنترل اسلایدر هیرو، بنرهای دوقلوی کنار هیرو، نوار تضمین خدمات خریدار و اعلان اسکرولی جشنواره"
        badgeText="کمپین‌های گرافیکی و پروموشن"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadBanners}
              disabled={loading}
              className="p-2.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
              />
            </button>

            {activeMainTab === 'banners' && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ایجاد بنر جدید</span>
              </button>
            )}
          </div>
        }
      />

      {/* Primary Sub-Tabs Navigation */}
      <div className="bg-card rounded-surface border border-border/80 p-1.5 shadow-surface flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveMainTab('banners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'banners'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>بنرها و اسلایدرهای تصویری</span>
          <span className="px-1.5 py-0.2 rounded-control bg-secondary text-foreground text-[10px] font-latin">
            {toPersianDigits(banners.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('trust_ticker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'trust_ticker'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>نوار تضمین خدمات خریدار (Trust Ticker)</span>
          <span
            className={`w-2 h-2 rounded-full ${
              trustTickerEnabled ? 'bg-emerald-400' : 'bg-muted-foreground/50'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('scrolling_ticker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeMainTab === 'scrolling_ticker'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>نوار متحرک اسکرول اعلان جشنواره (Scrolling Ticker)</span>
          <span
            className={`w-2 h-2 rounded-full ${
              scrollingEnabled ? 'bg-emerald-400' : 'bg-muted-foreground/50'
            }`}
          />
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 2: TRUST & ASSURANCE TICKER MANAGEMENT (IDEA 2)                   */}
      {/* ===================================================================== */}
      {activeMainTab === 'trust_ticker' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>مدیریت نوار تضمین خدمات و اعتماد خریداران</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  این نوار در صفحه اصلی فروشگاه زیر سرچ‌بار نمایش می‌یابد و ۴ نشان
                  تضمینی با پالس سبز را به خریداران ارائه می‌دهد.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-foreground">
                  نمایش نوار در فروشگاه:
                </span>
                <ToggleSwitch
                  size="md"
                  checked={trustTickerEnabled}
                  onChange={handleToggleTrustTicker}
                />
              </div>
            </div>

            {/* List of Ticker Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trustTickerItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-surface border border-border/60 bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground">
                      نشان شماره {toPersianDigits(idx + 1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTrustItem(item.id)}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      حذف نشان
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                        انتخاب آیکون نشان:
                      </label>
                      <select
                        value={item.icon || 'zap'}
                        onChange={(e) => {
                          const val = e.target.value
                          setTrustTickerItems((prev) =>
                            prev.map((t) =>
                              t.id === item.id ? { ...t, icon: val } : t,
                            ),
                          )
                        }}
                        className="w-full h-9 px-3 rounded-control bg-card border border-border/60 text-xs font-bold text-foreground outline-none focus:border-brand cursor-pointer"
                      >
                        <option value="zap">
                          ⚡ رعدوبرق (تحویل فوری ۰ ثانیه‌ای)
                        </option>
                        <option value="credit-card">
                          💳 کارت بانکی (پرداخت شتاب و تتر)
                        </option>
                        <option value="shield-check">
                          🛡️ سپر امنیتی (ضمانت تعویض ۳۰ روزه)
                        </option>
                        <option value="headphones">
                          🎧 هدفون (پشتیبانی ۲۴ ساعته)
                        </option>
                        <option value="lock">
                          🔒 قفل (پروتکل امنیتی Zeroize)
                        </option>
                        <option value="star">
                          ⭐ ستاره (رضایت بالای خریداران)
                        </option>
                        <option value="sparkles">
                          ✨ جرقه (هوش مصنوعی قانونی)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                        عنوان اصلی نشان:
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const val = e.target.value
                          setTrustTickerItems((prev) =>
                            prev.map((t) =>
                              t.id === item.id ? { ...t, title: val } : t,
                            ),
                          )
                        }}
                        className="w-full h-9 px-3 rounded-control bg-card border border-border/60 text-xs font-bold text-foreground outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                        زیرعنوان / توضیحات کوتاه:
                      </label>
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => {
                          const val = e.target.value
                          setTrustTickerItems((prev) =>
                            prev.map((t) =>
                              t.id === item.id ? { ...t, desc: val } : t,
                            ),
                          )
                        }}
                        className="w-full h-9 px-3 rounded-control bg-card border border-border/60 text-xs text-muted-foreground outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const newId = `t-${Date.now()}`
                  setTrustTickerItems((prev) => [
                    ...prev,
                    {
                      id: newId,
                      icon: 'check',
                      title: 'تضمین جدید',
                      desc: 'توضیحات تضمین خدمات',
                      active: true,
                    },
                  ])
                }}
                className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن نشان جدید</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTrustTicker}
                disabled={savingSettings}
                className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-95 shadow-control cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {savingSettings
                    ? 'در حال ذخیره...'
                    : 'ذخیره و اعمال نوار تضمین'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SCROLLING ANNOUNCEMENT MANAGEMENT (IDEA 3)                      */}
      {/* ===================================================================== */}
      {activeMainTab === 'scrolling_ticker' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <span>مدیریت نوار اسکرول اعلان جشنواره و فروش زنده</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  این نوار افقی به صورت متحرک و لمسی (اسکرول دستی و ماوس) در زیر
                  نوار تضمینات برای جذب خریداران رندر می‌شود.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-foreground">
                  نمایش نوار متحرک:
                </span>
                <ToggleSwitch
                  size="md"
                  checked={scrollingEnabled}
                  onChange={handleToggleScrolling}
                />
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground block">
                پیش‌نمایش زنده در صفحه اصلی (حرکت با درگ دست یا ماوس):
              </span>
              <div className="rounded-surface border border-brand/30 bg-brand/5 p-3 shadow-xs">
                <ScrollingAnnouncement
                  text={scrollingText}
                  icon={
                    scrollingIcon === 'zap' ? (
                      <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : scrollingIcon === 'sparkles' ? (
                      <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : scrollingIcon === 'megaphone' ? (
                      <Megaphone className="h-4 w-4 text-brand shrink-0" />
                    ) : scrollingIcon === 'tag' ? (
                      <Tag className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : (
                      <Flame className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
                    )
                  }
                  prefix={
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-control bg-brand text-brand-foreground shadow-xs shrink-0 font-sans">
                      {scrollingBadge || 'رویداد زنده'}
                    </span>
                  }
                  className="text-xs font-bold text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  متن نشان / بج پیشوند رویداد:
                </label>
                <input
                  type="text"
                  value={scrollingBadge}
                  onChange={(e) => setScrollingBadge(e.target.value)}
                  placeholder="مثال: رویداد زنده، پیشنهاد داغ، تخفیف ویژه"
                  className="w-full h-9 px-3 rounded-control bg-muted/20 border border-border/60 text-xs font-bold text-foreground outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  آیکون متحرک رویداد:
                </label>
                <select
                  value={scrollingIcon}
                  onChange={(e) => setScrollingIcon(e.target.value)}
                  className="w-full h-9 px-3 rounded-control bg-muted/20 border border-border/60 text-xs font-bold text-foreground outline-none focus:border-brand cursor-pointer"
                >
                  <option value="flame">🔥 آتش (جشنواره داغ)</option>
                  <option value="sparkles">✨ جرقه (پیشنهاد طلایی)</option>
                  <option value="zap">⚡ رعدوبرق (تحویل فوری)</option>
                  <option value="megaphone">📢 بلندگو (اطلاعیه مهم)</option>
                  <option value="tag">🏷️ برچسب (تخفیف ویژه)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                متن کامل اعلان متحرک (پشتیبانی از ایموجی و عبارات تبلیغاتی):
              </label>
              <textarea
                rows={4}
                value={scrollingText}
                onChange={(e) => setScrollingText(e.target.value)}
                placeholder="متن پیام جشنواره و تخفیف‌های زمان‌دار..."
                className="w-full p-3 rounded-control bg-muted/20 border border-border/60 text-xs font-medium text-foreground outline-none focus:border-brand leading-relaxed"
              />
              <span className="text-[11px] text-muted-foreground block text-left font-latin">
                {toPersianDigits(scrollingText.length)} نویسه
              </span>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={handleSaveScrollingTicker}
                disabled={savingSettings}
                className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-95 shadow-control cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {savingSettings
                    ? 'در حال ذخیره...'
                    : 'ذخیره و انتشار نوار متحرک'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: VISUAL BANNERS & SLIDERS WORKBENCH                              */}
      {/* ===================================================================== */}
      {activeMainTab === 'banners' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Hero Section Interactive Live Workbench (Matching Screenshot 1 Layout) */}
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-brand" />
                <div>
                  <h3 className="text-base font-black text-foreground">
                    میز کار و پیش‌نمایش چیدمان هیرو سکشن (اسلایدر و بنرهای دوبل)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    نمایش زنده چیدمان صفحه اصلی بر اساس اسلایدرهای فعال و ۲ بنر
                    پروموشن کناری (مطابق اسکرین‌شات ۱)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner({
                      title: 'جشنواره تخفیف ویژه هوش مصنوعی',
                      subtitle:
                        'تا ۴۰٪ تخفیف روی اکانت‌های قانونی ChatGPT Plus و Claude با تحویل فوری',
                      badge_text: 'جشنواره شگفت‌انگیز',
                      image_url:
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
                      link_url: '/#flash-sale',
                      position: 'main_slider',
                      button_text: 'مشاهده تخفیف‌های زمان‌دار',
                      sort_order: 10,
                      is_active: true,
                    })
                    setIsModalOpen(true)
                  }}
                  className="h-8 px-3 rounded-control bg-primary/10 hover:bg-primary/20 text-brand border border-brand/30 text-xs font-bold inline-flex items-center gap-1.5 duration-motion active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن اسلاید هیرو</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner({
                      title: 'کره‌ی زمین',
                      subtitle: 'چند تا سیاره داریم',
                      badge_text: 'پیشنهاد',
                      image_url:
                        'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop',
                      link_url: '/#explore',
                      position: 'hero_side',
                      button_text: 'لذت ببر',
                      sort_order: 10,
                      is_active: true,
                    })
                    setIsModalOpen(true)
                  }}
                  className="h-8 px-3 rounded-control bg-secondary text-foreground hover:bg-muted border border-border/60 text-xs font-bold inline-flex items-center gap-1.5 duration-motion active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن بنر کناری هیرو</span>
                </button>
              </div>
            </div>

            {/* Live Hero Layout Visual Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-4 sm:p-5 rounded-surface bg-muted/20 border border-border/60">
              {/* Left Preview: Text & Branding side of Hero */}
              <div className="lg:col-span-7 space-y-4 text-right bg-card/60 p-4 sm:p-5 rounded-surface border border-border/80 relative">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-control border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{heroBadgeText}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsHeroTextModalOpen(true)}
                    className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-95 shadow-control flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>ویرایش متون و دکمه‌های هیرو</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-foreground leading-snug">
                  {heroTitle}{' '}
                  <span className="text-brand font-latin underline decoration-brand/60 underline-offset-4">
                    {heroTypewriterWords.split(',')[0] || 'ChatGPT Plus'}
                  </span>
                </h2>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {heroDescription}
                </p>

                <div className="flex items-center gap-2 text-xs pt-1 flex-wrap">
                  <span className="px-3 py-1.5 rounded-control bg-primary text-primary-foreground font-black shadow-xs">
                    {heroBtn1Text} ←
                  </span>
                  <span className="px-3 py-1.5 rounded-control bg-secondary text-foreground border border-border/60 font-bold shadow-xs">
                    {heroBtn2Text}
                  </span>
                </div>
              </div>

              {/* Right Preview: Live Swiper Carousel + 2 Mini Cards (Screenshot 1) */}
              <div className="lg:col-span-5 space-y-3">
                {/* Live Slider Carousel */}
                <div className="relative group">
                  {heroSliderBanners.length > 0 ? (
                    <BannerCarousel banners={heroSliderBanners as any} />
                  ) : (
                    <div className="h-64 rounded-surface border border-dashed border-border/80 bg-card flex flex-col items-center justify-center p-6 text-center space-y-2">
                      <LayoutTemplate className="w-8 h-8 text-muted-foreground" />
                      <p className="text-xs font-bold text-foreground">
                        هنوز اسلاید فعالی در هیرو ثبت نشده است
                      </p>
                    </div>
                  )}
                </div>

                {/* Live Dual Side Promotional Banners (Matching Screenshot 1) */}
                <div className="space-y-2.5">
                  {heroSideBanners.slice(0, 2).map((sb) => (
                    <div
                      key={sb.id}
                      className="group relative overflow-hidden rounded-surface border border-border/80 bg-card p-3 shadow-surface hover:border-brand/40 duration-motion transition-all flex items-center justify-between gap-3 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sb)}
                          className="h-8 px-2.5 rounded-control border border-border/80 bg-secondary hover:bg-muted text-xs font-bold text-foreground inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          title="ویرایش این بنر"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-brand" />
                          <span>{sb.button_text || 'مشاهده'}</span>
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {sb.badge_text && (
                              <span className="text-[10px] px-2 py-0.5 rounded-control bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black shrink-0">
                                {sb.badge_text}
                              </span>
                            )}
                            <span className="font-black text-xs sm:text-sm text-foreground truncate">
                              {sb.title}
                            </span>
                          </div>
                          {sb.subtitle && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {sb.subtitle}
                            </p>
                          )}
                        </div>

                        {sb.image_url && (
                          <img
                            src={sb.image_url}
                            alt={sb.title}
                            className="w-12 h-12 rounded-control object-cover shrink-0 border border-border/60 group-hover:scale-105 transition-transform shadow-xs"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Position Segmented Tabs & Search Filter Toolbar */}
          <div className="bg-card rounded-surface border border-border/80 p-4 shadow-surface space-y-3 text-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Position Segmented Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-muted/30 rounded-control border border-border/60">
                {[
                  {
                    id: 'all',
                    label: `همه موقعیت‌ها (${toPersianDigits(banners.length)})`,
                  },
                  {
                    id: 'main_slider',
                    label: `اسلایدر اصلی هیرو (${toPersianDigits(
                      banners.filter((b) => b.position === 'main_slider')
                        .length,
                    )})`,
                  },
                  {
                    id: 'hero_side',
                    label: `بنرهای دوقلوی کنار هیرو (${toPersianDigits(
                      banners.filter((b) => b.position === 'hero_side').length,
                    )})`,
                  },
                  {
                    id: 'middle_strip',
                    label: `نوار تبلیغاتی میانی (${toPersianDigits(
                      banners.filter((b) => b.position === 'middle_strip')
                        .length,
                    )})`,
                  },
                  {
                    id: 'flash_sale',
                    label: `جشنواره تخفیف (${toPersianDigits(
                      banners.filter((b) => b.position === 'flash_sale').length,
                    )})`,
                  },
                  {
                    id: 'category_header',
                    label: `هدر دسته‌بندی‌ها (${toPersianDigits(
                      banners.filter((b) => b.position === 'category_header')
                        .length,
                    )})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setPositionFilter(tab.id)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-control font-bold whitespace-nowrap transition-all duration-motion cursor-pointer ${
                      positionFilter === tab.id
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="w-full sm:w-64">
                  <SearchInput
                    value={searchQuery}
                    onChange={(val) => {
                      setSearchQuery(val)
                      setPage(1)
                    }}
                    placeholder="جستجو در عنوان یا متن بنر..."
                    debounceMs={300}
                  />
                </div>

                {/* Page Size Select */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) as any)
                    setPage(1)
                  }}
                  className="h-9 px-2.5 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer font-latin shrink-0"
                >
                  <option value={9}>۹ مورد</option>
                  <option value={18}>۱۸ مورد</option>
                  <option value={27}>۲۷ مورد</option>
                </select>
              </div>
            </div>
          </div>

          {/* Banners Grid / Table */}
          {loading ? (
            <LoadingState message="در حال دریافت بنرهای سیستم..." />
          ) : filteredBanners.length === 0 ? (
            <div className="rounded-surface border border-border/80 bg-card p-12 text-center text-muted-foreground space-y-3 shadow-surface">
              <ImageIcon className="h-10 w-10 mx-auto opacity-50" />
              <h3 className="font-bold text-foreground">
                بنری در این موقعیت یافت نشد
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                برای جذب خریداران و اطلاع‌رسانی جشنواره‌ها، بنر تبلیغاتی جدید ثبت
                نمایید.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>ثبت بنر جدید</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedBanners.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface flex flex-col justify-between group hover:border-brand/40 duration-motion transition-all"
                  >
                    <div>
                      {/* Banner Image Preview */}
                      <div className="relative h-44 w-full bg-muted overflow-hidden">
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />

                        {/* Top Badges: Order on Right, Status on Left (Image 4 logical layout) */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-control bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono font-latin border border-white/20 shadow-xs">
                            #{b.sort_order}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(b)
                            }}
                            className={`px-2.5 py-0.5 rounded-control text-[11px] font-black shadow-control flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${
                              b.is_active
                                ? 'bg-emerald-600 text-white border border-emerald-400/40 hover:bg-emerald-500'
                                : 'bg-rose-600 text-white border border-rose-400/40 hover:bg-rose-500'
                            }`}
                            title="برای تغییر وضعیت کلیک کنید"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.is_active
                                  ? 'bg-white animate-pulse'
                                  : 'bg-white/80'
                              }`}
                            />
                            <span>{b.is_active ? 'فعال' : 'غیرفعال'}</span>
                          </button>
                        </div>

                        {/* Bottom Badges: Position on Right, Promo Badge on Left */}
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-1.5">
                          <span className="px-2.5 py-1 rounded-control bg-slate-950/85 backdrop-blur-md text-sky-300 border border-sky-400/30 text-[11px] font-black shadow-control flex items-center gap-1">
                            <span>{getPositionLabel(b.position)}</span>
                          </span>
                          {b.badge_text ? (
                            <span className="px-2.5 py-1 rounded-control bg-slate-950/85 backdrop-blur-md text-amber-300 border border-amber-400/30 text-[11px] font-black shadow-control truncate max-w-[140px]">
                              {b.badge_text}
                            </span>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>

                      {/* Banner Content */}
                      <div className="p-4 space-y-2 text-right">
                        <h4 className="text-sm font-black text-foreground">
                          {b.title}
                        </h4>
                        {b.subtitle && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {b.subtitle}
                          </p>
                        )}
                        {b.link_url && (
                          <div className="text-[11px] text-brand truncate pt-0.5 font-latin">
                            {b.link_url}
                          </div>
                        )}

                        {/* Creation & Update Timestamps - Redesigned Graphite UI/UX */}
                        <div className="pt-2.5 border-t border-border/60 space-y-1.5 text-[11px] select-none">
                          <div
                            className="flex items-center justify-between p-1.5 px-2.5 rounded-control bg-muted/20 border border-border/40"
                            title={`تاریخ و ساعت ثبت: ${formatDateTime(b.created_at)}`}
                          >
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                              <span className="text-[10px] font-bold">
                                زمان ایجاد:
                              </span>
                            </div>
                            <span className="font-sans text-[10px] font-bold text-foreground/80">
                              {formatDateTime(b.created_at)}
                            </span>
                          </div>

                          {isBannerEdited(b.created_at, b.updated_at) && (
                            <div
                              className="flex items-center justify-between p-1.5 px-2.5 rounded-control bg-brand/5 border border-brand/20 animate-in fade-in"
                              title={`تاریخ و ساعت آخرین ویرایش: ${formatDateTime(b.updated_at)}`}
                            >
                              <div className="flex items-center gap-1.5 text-brand">
                                <Pencil className="w-3.5 h-3.5 text-brand shrink-0" />
                                <span className="text-[10px] font-black">
                                  آخرین ویرایش:
                                </span>
                              </div>
                              <span className="font-sans text-[10px] font-bold text-brand">
                                {formatDateTime(b.updated_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer - Vibe Farsi Action Controls */}
                    <div className="p-3.5 pt-2 flex items-center justify-between gap-2 border-t border-border/40 mt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="p-2 rounded-control border border-border/80 bg-secondary/80 hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control flex items-center gap-1.5 text-xs font-bold"
                          title="ویرایش بنر"
                        >
                          <Pencil className="w-3.5 h-3.5 text-brand" />
                          <span>ویرایش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="p-2 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="حذف بنر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <ToggleSwitch
                        size="sm"
                        checked={Boolean(b.is_active)}
                        onChange={() => handleToggleActive(b)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Toolbar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3.5 bg-card rounded-surface border border-border/80 shadow-surface text-xs">
                  <span className="text-muted-foreground">
                    صفحه {page} از {totalPages} (مجموع {filteredBanners.length}{' '}
                    بنر)
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
                          key={`banner-pg-btn-${pNum}`}
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
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen &&
        editingBanner &&
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
              <div className="relative w-full max-w-xl my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-brand" />
                    <span>
                      {editingBanner.id
                        ? 'ویرایش بنر تبلیغاتی'
                        : 'ایجاد بنر جدید'}
                    </span>
                  </h3>
                  <ModalCloseButton
                    onClick={() => {
                      setIsModalOpen(false)
                    }}
                    size="sm"
                  />
                </div>

                {/* Live Visual Card Preview Box */}
                <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span>پیش‌نمایش زنده بنر</span>
                    <span className="text-[10px] text-brand font-mono font-latin">
                      {editingBanner.position || 'main_slider'}
                    </span>
                  </div>
                  <div className="relative h-36 sm:h-40 w-full rounded-control overflow-hidden bg-muted border border-border/40 select-none">
                    {editingBanner.image_url ? (
                      <img
                        src={editingBanner.image_url}
                        alt="پیش‌نمایش"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-l from-blue-600 via-indigo-700 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-4 text-right text-white space-y-1">
                      {editingBanner.badge_text && (
                        <span className="self-start px-2 py-0.5 rounded-control bg-brand text-white font-black text-[10px] shadow-xs">
                          {editingBanner.badge_text}
                        </span>
                      )}
                      <h4 className="text-sm sm:text-base font-black text-white drop-shadow-xs line-clamp-1">
                        {editingBanner.title || 'عنوان بنر شما'}
                      </h4>
                      {editingBanner.subtitle && (
                        <p className="text-[11px] text-white/80 line-clamp-1 font-normal">
                          {editingBanner.subtitle}
                        </p>
                      )}
                      <div className="pt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-control bg-primary text-primary-foreground font-black text-[10px] shadow-xs">
                          <span>
                            {editingBanner.button_text || 'مشاهده و خرید'}
                          </span>
                          <span>←</span>
                        </span>
                        {editingBanner.secondary_button_text && (
                          <span className="inline-flex items-center h-7 px-2.5 rounded-control border border-white/30 bg-white/10 text-white font-bold text-[10px] backdrop-blur-md">
                            {editingBanner.secondary_button_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-foreground block">
                      عنوان اصلی بنر *
                    </label>
                    <input
                      type="text"
                      value={editingBanner.title || ''}
                      onChange={(e) =>
                        setEditingBanner((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="مثال: شماره‌های مجازی ۱۸۰ کشور با گارانتی تعویض"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-foreground block">
                      زیرعنوان / متن توضیحات
                    </label>
                    <input
                      type="text"
                      value={editingBanner.subtitle || ''}
                      onChange={(e) =>
                        setEditingBanner((prev) => ({
                          ...prev,
                          subtitle: e.target.value,
                        }))
                      }
                      placeholder="دریافت آنی پیامک تایید تلگرام، اوپن‌ای‌آی، گوگل و اینستاگرام با عودت وجه تضمینی"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand transition-colors"
                    />
                  </div>

                  {/* Standalone full-width position selector row for zero text wrapping/truncation (Image 1 fix) */}
                  <BannerPositionSelect
                    className="w-full text-right"
                    value={editingBanner.position || 'main_slider'}
                    onChange={(pos) =>
                      setEditingBanner((prev) => ({
                        ...prev,
                        position: pos,
                      }))
                    }
                  />

                  {/* Badge text & CTA Button text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        متن برچسب (Badge)
                      </label>
                      <input
                        type="text"
                        value={editingBanner.badge_text || ''}
                        onChange={(e) =>
                          setEditingBanner((prev) => ({
                            ...prev,
                            badge_text: e.target.value,
                          }))
                        }
                        placeholder="مثال: پیشنهاد شگفت‌انگیز یا پرفروش"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        متن دکمه CTA
                      </label>
                      <input
                        type="text"
                        value={editingBanner.button_text || 'مشاهده و خرید'}
                        onChange={(e) =>
                          setEditingBanner((prev) => ({
                            ...prev,
                            button_text: e.target.value,
                          }))
                        }
                        placeholder="مشاهده و خرید"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Image URL & Upload button with live compact thumbnail preview */}
                  <div className="space-y-1.5 text-right">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>آدرس تصویر بنر و پیش‌نمایش *</span>
                      <label className="text-brand hover:underline cursor-pointer flex items-center gap-1 font-bold text-xs">
                        <Upload className="h-3.5 w-3.5" />
                        <span>آپلود تصویر جدید</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Compact Live Thumbnail Preview */}
                      <div className="w-16 h-11 rounded-control bg-muted/40 border border-border/60 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                        {editingBanner.image_url ? (
                          <img
                            src={editingBanner.image_url}
                            alt="پیش‌نمایش"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                'none'
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* URL Input */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          dir="ltr"
                          value={editingBanner.image_url || ''}
                          onChange={(e) =>
                            setEditingBanner((prev) => ({
                              ...prev,
                              image_url: e.target.value,
                            }))
                          }
                          className="w-full h-11 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                          placeholder="https://... یا تصویر آپلود شده"
                          required
                        />
                      </div>
                    </div>

                    {uploadingImage && (
                      <p className="text-[11px] text-brand flex items-center gap-1 font-bold">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>در حال بارگذاری عکس...</span>
                      </p>
                    )}
                  </div>

                  {/* Link URL and Sort Order Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        لینک مقصد دکمه اول *
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingBanner.link_url || ''}
                        onChange={(e) =>
                          setEditingBanner((prev) => ({
                            ...prev,
                            link_url: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                        placeholder="/products/... یا /category/..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        ترتیب نمایش (عددی)
                      </label>
                      <input
                        type="number"
                        value={editingBanner.sort_order ?? 10}
                        onChange={(e) =>
                          setEditingBanner((prev) => ({
                            ...prev,
                            sort_order: Number(e.target.value),
                          }))
                        }
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Dual Action CTA Buttons (Optional Secondary Button) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        متن دکمه دوم (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={editingBanner.secondary_button_text || ''}
                        onChange={(e) =>
                          setEditingBanner((prev) => ({
                            ...prev,
                            secondary_button_text: e.target.value,
                          }))
                        }
                        placeholder="مثال: اطلاعات بیشتر یا پلن‌ها"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        لینک دکمه دوم (اختیاری)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={editingBanner.secondary_link_url || ''}
                        onChange={(e) =>
                          setEditingBanner((prev) => ({
                            ...prev,
                            secondary_link_url: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                        placeholder="/products/..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-field border border-border/60 bg-muted/20">
                    <div className="space-y-0.5 text-right">
                      <span className="text-xs font-bold text-foreground block">
                        وضعیت انتشار و نمایش در فروشگاه
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {(editingBanner.is_active ?? true)
                          ? 'بنر فعال است و در موقعیت تعیین‌شده به خریداران نمایش داده می‌شود'
                          : 'بنر غیرفعال است و از ویترین فروشگاه مخفی شده است'}
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={editingBanner.is_active ?? true}
                      onChange={(checked) =>
                        setEditingBanner((prev) => ({
                          ...prev,
                          is_active: checked,
                        }))
                      }
                    />
                  </div>

                  {/* Modal Action: Full Width Save Button (No Cancel Button as requested) */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-sm duration-motion ease-motion active:scale-[0.99] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {saveLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>در حال ذخیره‌سازی...</span>
                        </>
                      ) : (
                        <span>
                          {editingBanner.id
                            ? 'ذخیره بنر'
                            : 'ایجاد و ثبت بنر جدید'}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* HERO SECTION TEXT CUSTOMIZER MODAL */}
      {isHeroTextModalOpen &&
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
              <div className="relative w-full max-w-xl my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-brand" />
                    <span>ویرایش متون، عناوین و دکمه‌های هیرو سکشن</span>
                  </h3>
                  <ModalCloseButton
                    onClick={() => setIsHeroTextModalOpen(false)}
                    size="sm"
                  />
                </div>

                <div className="space-y-3.5 text-right text-xs">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      نشان کوچک بالای تیتر:
                    </label>
                    <input
                      type="text"
                      value={heroBadgeText}
                      onChange={(e) => setHeroBadgeText(e.target.value)}
                      placeholder="تحویل آنی لایسنس و اکانت‌های هوش مصنوعی"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      تیتر اصلی هیرو:
                    </label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="خرید قانونی اشتراک‌های"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-black outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      کلمات متحرک تایپ‌رایتر (با کاما انگلیسی « , » جدا کنید):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={heroTypewriterWords}
                      onChange={(e) => setHeroTypewriterWords(e.target.value)}
                      placeholder="ChatGPT Plus, Claude 3.7 Sonnet, Gemini Advanced, Cursor AI Pro, Google One 2TB"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      متن کامل توضیحات هیرو:
                    </label>
                    <textarea
                      rows={3}
                      value={heroDescription}
                      onChange={(e) => setHeroDescription(e.target.value)}
                      className="w-full p-3 rounded-control border border-border/60 bg-muted/20 text-foreground text-xs leading-relaxed outline-none focus:border-brand"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        متن دکمه اول (اصلی):
                      </label>
                      <input
                        type="text"
                        value={heroBtn1Text}
                        onChange={(e) => setHeroBtn1Text(e.target.value)}
                        placeholder="مشاهده کاتالوگ اشتراک‌ها"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        لینک دکمه اول:
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={heroBtn1Link}
                        onChange={(e) => setHeroBtn1Link(e.target.value)}
                        placeholder="#products-catalog"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        متن دکمه دوم (ثانویه):
                      </label>
                      <input
                        type="text"
                        value={heroBtn2Text}
                        onChange={(e) => setHeroBtn2Text(e.target.value)}
                        placeholder="شماره مجازی (SMS)"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        لینک دکمه دوم:
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={heroBtn2Link}
                        onChange={(e) => setHeroBtn2Link(e.target.value)}
                        placeholder="/virtual-numbers"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleSaveHeroText}
                      disabled={savingHeroText}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-sm duration-motion ease-motion active:scale-[0.99] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {savingHeroText
                          ? 'در حال ذخیره‌سازی...'
                          : 'ذخیره و اعمال تنظیمات هیرو'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="حذف بنر تبلیغاتی"
        message="آیا از حذف کامل این بنر از ویترین فروشگاه اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
        confirmText="بله، بنر حذف شود"
        cancelText="انصراف"
        loading={deleteConfirm.loading}
        onConfirm={confirmDelete}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, bannerId: null, loading: false })
        }
      />
    </div>
  )
}
