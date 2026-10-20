import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../services/api'
import type { BannerItem } from '../../types'
import { useNotification } from '../vibefarsi/NotificationContext'
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
  const [saveLoading, setSaveLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

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

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این بنر اطمینان دارید؟')) return
    try {
      await api.deleteBanner(id)
      success('بنر با موفقیت حذف شد')
      loadBanners()
    } catch (err: any) {
      error('خطا در حذف بنر', err.message)
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return '-'
    return `${d.toLocaleDateString('fa-IR')} ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Unified Admin Header Banner */}
      <AdminHeaderBanner
        icon={ImageIcon}
        title="مدیریت بنرها، اسلایدرها و پروموشن‌های فروشگاه"
        subtitle="کنترل اسلایدر هیرو، بنرهای دوقلوی میانی به سبک دیجی‌کالا و کمپین‌های جشنواره‌ای"
        badgeText="کمپین‌های گرافیکی"
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

            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد بنر جدید</span>
            </button>
          </div>
        }
      />

      {/* Position Dropdown, Page Size & Search Toolbar (Matching Orders Table - Image 4 Request) */}
      <div className="bg-card rounded-surface border border-border/80 p-3.5 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Position Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-bold shrink-0">
            موقعیت نمایش:
          </span>
          <select
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
          >
            <option value="all">همه موقعیت‌ها ({banners.length})</option>
            <option value="main_slider">
              اسلایدر اصلی هیرو (
              {banners.filter((b) => b.position === 'main_slider').length})
            </option>
            <option value="middle_strip">
              بنرهای میانی دوقلو (
              {banners.filter((b) => b.position === 'middle_strip').length})
            </option>
            <option value="hero_side">
              کنار هیرو (
              {banners.filter((b) => b.position === 'hero_side').length})
            </option>
            <option value="flash_sale">
              جشنواره تخفیف (
              {banners.filter((b) => b.position === 'flash_sale').length})
            </option>
            <option value="category_header">
              هدر دسته‌بندی‌ها (
              {banners.filter((b) => b.position === 'category_header').length})
            </option>
          </select>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Page Size Selector: 9, 18, 27 only */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hidden sm:inline font-bold">تعداد در صفحه:</span>
            {([9, 18, 27] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPageSize(size)
                  setPage(1)
                }}
                className={`w-7 h-7 rounded-control font-bold font-latin cursor-pointer transition-colors ${
                  pageSize === size
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'bg-muted/30 hover:bg-muted text-muted-foreground border border-border/60'
                }`}
                title={`نمایش ${size} بنر در هر صفحه`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="جستجوی عنوان یا برچسب..."
              className="h-9 pr-9 pl-3 w-40 sm:w-52 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Banners Grid / Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-brand animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">
            در حال دریافت بنرهای سیستم...
          </p>
        </div>
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
                      <span
                        className={`px-2.5 py-0.5 rounded-control text-[11px] font-black shadow-control flex items-center gap-1.5 ${
                          b.is_active
                            ? 'bg-emerald-600 text-white border border-emerald-400/40'
                            : 'bg-rose-600 text-white border border-rose-400/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.is_active
                              ? 'bg-white animate-pulse'
                              : 'bg-white/80'
                          }`}
                        />
                        <span>{b.is_active ? 'فعال' : 'غیرفعال'}</span>
                      </span>
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

                    {/* Creation & Update Timestamps */}
                    <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground select-none">
                      <div
                        className="flex items-center gap-1 truncate"
                        title={`تاریخ ثبت: ${formatDateTime(b.created_at)}`}
                      >
                        <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                        <span className="truncate">
                          ایجاد: {formatDateTime(b.created_at)}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 truncate text-left dir-ltr"
                        title={`آخرین ویرایش: ${formatDateTime(b.updated_at)}`}
                      >
                        <span className="truncate">
                          {formatDateTime(b.updated_at)}
                        </span>
                        <span className="dir-rtl shrink-0">:ویرایش</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer - Seamless without harsh border */}
                <div className="p-4 pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted p-2 text-xs font-bold text-foreground transition-colors cursor-pointer shadow-control"
                  >
                    <Pencil className="h-3.5 w-3.5 text-brand" />
                    <span>ویرایش بنر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="p-2 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="حذف بنر"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 bg-card rounded-surface border border-border/80 shadow-surface text-xs">
              <span className="text-muted-foreground">
                صفحه {page} از {totalPages} (مجموع {filteredBanners.length} بنر)
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                    }}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
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
                    <button
                      type="button"
                      onClick={() =>
                        setEditingBanner((prev) => ({
                          ...prev,
                          is_active: !(prev?.is_active ?? true),
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (editingBanner.is_active ?? true)
                          ? 'bg-emerald-600'
                          : 'bg-muted border-border/60'
                      }`}
                      title="تغییر وضعیت فعال/غیرفعال"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          (editingBanner.is_active ?? true)
                            ? '-translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
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
    </div>
  )
}
