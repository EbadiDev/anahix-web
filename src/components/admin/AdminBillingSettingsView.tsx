import { Building2, FileText, Receipt, RefreshCw, Save } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type { BillingSettings } from '../../types'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'
import { useNotification } from '../vibefarsi/NotificationContext'

export const AdminBillingSettingsView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [settings, setSettings] = useState<BillingSettings>({
    seller_company_name: 'فروشگاه هوش مصنوعی آناهیکس',
    seller_brand_fa: 'آناهیکس (Anahix)',
    seller_national_id: '',
    seller_economic_code: '',
    seller_registration_no: '',
    seller_postal_code: '',
    seller_province: '',
    seller_city: '',
    seller_address: '',
    seller_phone: '021-88776655',
    seller_email: 'support@anahix.com',
    seller_website: 'https://anahix.com',
    vat_percent: 0,
    vat_enabled: false,
    invoice_notes:
      'از خرید و اعتماد شما به آناهیکس صمیمانه متشکریم! پشتیبانی ۲۴ ساعته در کنار شماست.',
    tax_memory_id: '',
    stamp_signature_url: '',
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await apiService.getBillingSettings()
      setSettings(data)
    } catch (err: any) {
      notifyError('خطا در بارگذاری تنظیمات فاکتور', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiService.updateBillingSettings(settings)
      notifySuccess(
        'تنظیمات فاکتور',
        'تنظیمات فاکتور و هویت تجاری فروشگاه با موفقیت ذخیره شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات فاکتور', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="space-y-6 max-w-4xl animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* Header Bar */}
      <div className="p-6 rounded-surface border border-border/80 bg-card shadow-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-control bg-secondary text-brand flex items-center justify-center font-bold text-xl border border-border/60 shrink-0 shadow-control">
              <Receipt className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <span>تنظیمات فاکتور رسمی و مشخصات حقوقی</span>
                <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                  صورتحساب الکترونیکی
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                تنظیم نام و برند فروشگاه، اطلاعات پشتیبانی و یادداشت تشکر مندرج
                در صورتحساب‌ها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <FileText className="w-3.5 h-3.5 text-brand" />
              <span>پیش‌نمایش فاکتور</span>
            </button>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="p-2.5 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition shadow-control cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
              title="بارگذاری مجدد"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="p-6 rounded-surface border border-border/80 bg-card shadow-surface space-y-4">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 pb-3 border-b border-border/60">
            <Building2 className="w-4 h-4 text-brand" />
            <span>اطلاعات نمایش در صورتحساب و فاکتور</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                نام نمایشی فروشگاه (فارسی) *
              </label>
              <input
                type="text"
                value={settings.seller_brand_fa}
                onChange={(e) =>
                  setSettings({ ...settings, seller_brand_fa: e.target.value })
                }
                placeholder="مثال: فروشگاه هوش مصنوعی آناهیکس"
                className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                آدرس وب‌سایت رسمی
              </label>
              <input
                type="text"
                dir="ltr"
                value={settings.seller_website}
                onChange={(e) =>
                  setSettings({ ...settings, seller_website: e.target.value })
                }
                placeholder="https://anahix.com"
                className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                شماره تماس یا آیدی تلگرام پشتیبانی
              </label>
              <input
                type="text"
                dir="ltr"
                value={settings.seller_phone}
                onChange={(e) =>
                  setSettings({ ...settings, seller_phone: e.target.value })
                }
                placeholder="021-88776655 یا @anahix_support"
                className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                ایمیل رسمی پشتیبانی
              </label>
              <input
                type="email"
                dir="ltr"
                value={settings.seller_email}
                onChange={(e) =>
                  setSettings({ ...settings, seller_email: e.target.value })
                }
                placeholder="support@anahix.com"
                className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                پیام تشکر و یادداشت پایانی فاکتور
              </label>
              <textarea
                rows={3}
                value={settings.invoice_notes}
                onChange={(e) =>
                  setSettings({ ...settings, invoice_notes: e.target.value })
                }
                className="w-full p-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand resize-none"
                placeholder="متن دلخواه تشکر از خرید و نکات پشتیبانی..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات فاکتور'}
            </span>
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <OfficialInvoiceModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          orderIdOrNo="sample"
          isAdmin={true}
        />
      )}
    </div>
  )
}
