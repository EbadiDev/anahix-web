import {
  AlertTriangle,
  Check,
  Download,
  Languages,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { ThemeToggle } from '../ThemeToggle'
import { Button } from '../ui/button'

interface ProfileSettingsTabProps {
  onLogout: () => void
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  onLogout,
}) => {
  const [lang, setLang] = useState('fa')
  const [dataExported, setDataExported] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleExportData = () => {
    setDataExported(true)
    // Create download json
    const blob = new Blob(
      [
        JSON.stringify(
          {
            user: 'Customer Export Data',
            date: new Date().toISOString(),
            status: 'Verified',
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anahix_account_data_${Date.now()}.json`
    a.click()
    setTimeout(() => setDataExported(false), 3000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Appearance & Theme */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>ظاهر و پوسته رابط کاربری (Appearance)</span>
          <ThemeToggle />
        </h3>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          پلتفرم آناهیکس از پوسته دوگانه روز (سفید شفاف با رنگ سازمانی آبی
          سلطنتی) و شب (تیره فین‌تک با آبی الکتریک) پشتیبانی کامل می‌کند.
        </div>
      </div>

      {/* 2. Language & Localization */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-600" />
          <span>زبان و چیدمان رابط کاربری (Language & RTL)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setLang('fa')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              lang === 'fa'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <div>
              <h5 className="text-xs font-bold">فارسی (Persian / Vazirmatn)</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                چیدمان راست‌به‌چپ بومی با فونت وزیرمتن
              </p>
            </div>
            {lang === 'fa' && <Check className="w-4 h-4 text-blue-600" />}
          </div>

          <div
            onClick={() => setLang('en')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              lang === 'en'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <div>
              <h5 className="text-xs font-bold">English (International)</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Left-to-Right layout with Outfit font
              </p>
            </div>
            {lang === 'en' && <Check className="w-4 h-4 text-blue-600" />}
          </div>
        </div>
      </div>

      {/* 3. Data Export */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Download className="w-4 h-4 text-slate-500" />
            <span>دریافت نسخه پشتیبان از داده‌های حساب (Data Export)</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            دانلود فایل JSON حاوی تمامی فاکتورها، تاریخچه شماره‌های مجازی،
            تراکنش‌ها و سفارش‌های ثبت‌شده شما
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportData}
          className="h-8 text-xs rounded-xl px-3 shrink-0"
        >
          {dataExported ? (
            <>
              <Check className="w-3.5 h-3.5 ml-1 text-emerald-500" />
              فایل دانلود شد
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 ml-1" />
              دانلود خروجی JSON
            </>
          )}
        </Button>
      </div>

      {/* 4. Danger Zone */}
      <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20 p-6 shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          منطقه حساس (Danger Zone)
        </h4>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-red-100 dark:border-red-900/40">
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              حذف کامل حساب کاربری و اطلاعات
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              با حذف حساب، تمامی نشست‌ها، کیف پول و لایسنس‌ها برای همیشه مسدود
              خواهند شد.
            </p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDeleteModalOpen(true)}
            className="h-8 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-950/80 rounded-xl px-3 shrink-0 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 ml-1.5" />
            حذف حساب کاربری
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold">
                آیا از حذف حساب مطمئن هستید؟
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              این عملیات برگشت‌ناپذیر است. موجودی کیف پول و لایسنس‌های فعال شما
              غیرقابل استرداد خواهند بود.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-9 text-xs rounded-xl"
              >
                انصراف
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  onLogout()
                }}
                className="h-9 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                بله، حساب حذف شود
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
