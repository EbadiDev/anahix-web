import {
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { BannerItem } from '../../types'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ShimmerButton } from '../vibefarsi/ShimmerButton'

export const AdminBannersView: React.FC = () => {
  const { success, error } = useNotification()
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(true)
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

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>مدیریت بنرهای تبلیغاتی و اسلایدرهای صفحه اول</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            کنترل بنرهای بالای هیرو، اسلایدر اصلی، بنرهای میانی و تخفیف‌های
            جشنواره
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBanners}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="به‌روزرسانی"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>

          <ShimmerButton
            onClick={handleOpenCreate}
            className="text-xs font-bold px-4 py-2.5 rounded-2xl"
          >
            <Plus className="h-4 w-4" />
            <span>ایجاد بنر جدید</span>
          </ShimmerButton>
        </div>
      </div>

      {/* Banners Grid / Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">
            در حال دریافت بنرهای سیستم...
          </p>
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground space-y-3">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <h3 className="font-bold text-foreground">هیچ بنری ثبت نشده است</h3>
          <p className="text-xs max-w-sm mx-auto">
            برای جذب خریداران و اطلاع‌رسانی جشنواره‌ها، اولین بنر تبلیغاتی را
            ایجاد کنید.
          </p>
          <ShimmerButton
            onClick={handleOpenCreate}
            className="text-xs font-bold mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت اولین بنر</span>
          </ShimmerButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Banner Image Preview */}
                <div className="relative h-44 w-full bg-muted overflow-hidden">
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                        b.is_active
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-rose-500/80 text-white'
                      }`}
                    >
                      {b.is_active ? 'فعال در سایت' : 'غیرفعال'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-mono">
                      ترتیب: {b.sort_order}
                    </span>
                  </div>

                  {b.badge_text && (
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold">
                        {b.badge_text}
                      </span>
                    </div>
                  )}
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
                  <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="rounded-lg bg-muted px-2 py-0.5 font-mono">
                      موقعیت: {b.position}
                    </span>
                    {b.link_url && (
                      <span className="text-blue-600 truncate max-w-[140px]">
                        {b.link_url}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 border-t border-border/60 mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted p-2 text-xs font-bold text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-blue-600" />
                  <span>ویرایش</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-xl border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 transition-colors"
                  title="حذف بنر"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl text-foreground max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 left-5 p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black text-foreground mb-4">
              {editingBanner.id ? 'ویرایش بنر تبلیغاتی' : 'ایجاد بنر جدید'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-foreground">
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
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-foreground">
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
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
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
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    موقعیت نمایش
                  </label>
                  <select
                    value={editingBanner.position || 'main_slider'}
                    onChange={(e) =>
                      setEditingBanner((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  >
                    <option value="main_slider">اسلایدر اصلی هیرو</option>
                    <option value="hero_side">کنار هیرو</option>
                    <option value="middle_strip">نوار تبلیغاتی میانی</option>
                    <option value="flash_sale">بنر جشنواره تخفیف</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Upload button */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>آدرس تصویر بنر *</span>
                  <label className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1 font-normal">
                    <Upload className="h-3 w-3" />
                    <span>آپلود تصویر جدید</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </label>
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
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono outline-none focus:border-blue-500"
                  placeholder="https://..."
                  required
                />
                {uploadingImage && (
                  <p className="text-[11px] text-blue-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>در حال بارگذاری عکس...</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    لینک مقصد کلیک
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
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono outline-none focus:border-blue-500"
                    placeholder="/products/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
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
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
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
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1 flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="banner-is-active"
                    checked={editingBanner.is_active ?? true}
                    onChange={(e) =>
                      setEditingBanner((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <label
                    htmlFor="banner-is-active"
                    className="text-xs font-bold text-foreground cursor-pointer"
                  >
                    بنر فعال و قابل مشاهده در سایت باشد
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground transition-colors"
                >
                  انصراف
                </button>

                <ShimmerButton
                  type="submit"
                  disabled={saveLoading}
                  className="text-xs font-bold px-6 py-2 rounded-xl"
                >
                  {saveLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>ذخیره بنر</span>
                  )}
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
