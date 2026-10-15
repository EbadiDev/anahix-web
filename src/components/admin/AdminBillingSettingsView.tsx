import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Receipt,
  RefreshCw,
  Save,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type { BillingSettings } from '../../types'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

export const AdminBillingSettingsView: React.FC = () => {
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
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await apiService.getBillingSettings()
      setSettings(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری تنظیمات فاکتور')
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
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await apiService.updateBillingSettings(settings)
      setSuccessMsg('تنظیمات فاکتور و نام فروشگاه با موفقیت ذخیره شد.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره تنظیمات فاکتور')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Bar */}
      <Card className="p-6 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/20 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>تنظیمات فاکتور و رسید سفارشات</span>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 text-xs"
                >
                  فاکتور ساده و خودمانی
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تنظیم نام و برند فروشگاه، اطلاعات پشتیبانی و پیام تشکر مندرج در
                صورتحساب‌ها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="h-9 text-xs rounded-xl px-3 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <FileText className="w-3.5 h-3.5 ml-1.5" />
              <span>پیش‌نمایش فاکتور</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadSettings}
              disabled={loading}
              className="h-9 text-xs rounded-xl px-3"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ml-1.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>بازخوانی</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>اطلاعات نمایش در فاکتور</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام نمایشی فروشگاه
              </label>
              <Input
                type="text"
                value={settings.seller_brand_fa}
                onChange={(e) =>
                  setSettings({ ...settings, seller_brand_fa: e.target.value })
                }
                placeholder="مثال: فروشگاه هوش مصنوعی آناهیکس"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                آدرس وب‌سایت
              </label>
              <Input
                type="text"
                dir="ltr"
                value={settings.seller_website}
                onChange={(e) =>
                  setSettings({ ...settings, seller_website: e.target.value })
                }
                placeholder="https://anahix.com"
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شماره تماس یا آیدی تلگرام پشتیبانی
              </label>
              <Input
                type="text"
                dir="ltr"
                value={settings.seller_phone}
                onChange={(e) =>
                  setSettings({ ...settings, seller_phone: e.target.value })
                }
                placeholder="021-88776655 یا @anahix_support"
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ایمیل پشتیبانی
              </label>
              <Input
                type="email"
                dir="ltr"
                value={settings.seller_email}
                onChange={(e) =>
                  setSettings({ ...settings, seller_email: e.target.value })
                }
                placeholder="support@anahix.com"
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                پیام تشکر و یادداشت پایانی فاکتور
              </label>
              <textarea
                rows={3}
                value={settings.invoice_notes}
                onChange={(e) =>
                  setSettings({ ...settings, invoice_notes: e.target.value })
                }
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                placeholder="متن دلخواه تشکر از خرید..."
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="submit"
            disabled={saving}
            className="h-10 text-xs rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4 ml-1.5" />
            <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات'}</span>
          </Button>
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
