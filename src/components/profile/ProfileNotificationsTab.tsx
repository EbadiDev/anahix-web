import { Bell, Check, Mail, Radio, Send, Smartphone } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export const ProfileNotificationsTab: React.FC = () => {
  const [saved, setSaved] = useState(false)

  // Channels state
  const [prefs, setPrefs] = useState({
    // SMS
    smsOrders: true,
    smsVirtualNumbers: true,
    smsSecurity: true,
    smsMarketing: false,

    // Telegram
    tgOrders: true,
    tgVirtualNumbers: true,
    tgExpiration: true,
    tgMarketing: false,

    // Email
    emailInvoices: true,
    emailCredentials: true,
    emailSecurity: true,
    emailNewsletter: false,
  })

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              تنظیمات پیشرفته اطلاع‌رسانی و اعلان‌ها (Notification Settings)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعیین نحوه و کانال‌های دریافت پیامک‌های تایید، کدهای OTP شماره‌های
            مجازی و فاکتورها
          </p>
        </div>

        {saved && (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-xs px-3 py-1 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            ذخیره خودکار شد
          </Badge>
        )}
      </div>

      {/* 2. Virtual Numbers High-Priority Alert Box */}
      <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>ارسال فوری کد OTP شماره‌های مجازی به تلگرام</span>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-0 text-[9px] px-1.5 py-0">
                پیشنهاد ویژه
              </Badge>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              با فعال‌سازی ربات تلگرام آناهیکس، به محض دریافت پیامک شماره موقت،
              کد تایید بلافاصله روی تلگرام شما فوروارد می‌شود.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-4 shrink-0"
        >
          اتصال به ربات تلگرام
        </Button>
      </div>

      {/* 3. Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Channel 1: SMS Notifications */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              پیامک خدماتی سیم‌کارت (SMS)
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                به‌روزرسانی و تکمیل سفارش‌ها
              </span>
              <input
                type="checkbox"
                checked={prefs.smsOrders}
                onChange={() => togglePref('smsOrders')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                دریافت پیامک شماره مجازی
              </span>
              <input
                type="checkbox"
                checked={prefs.smsVirtualNumbers}
                onChange={() => togglePref('smsVirtualNumbers')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                هشدارهای امنیتی ورود به حساب
              </span>
              <input
                type="checkbox"
                checked={prefs.smsSecurity}
                onChange={() => togglePref('smsSecurity')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                اطلاع‌رسانی تخفیف‌ها و جشنواره
              </span>
              <input
                type="checkbox"
                checked={prefs.smsMarketing}
                onChange={() => togglePref('smsMarketing')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Channel 2: Telegram Bot */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Send className="w-4 h-4 text-sky-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              ربات اختصاصی تلگرام
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                وضعیت و لینک‌های تحویل سفارش
              </span>
              <input
                type="checkbox"
                checked={prefs.tgOrders}
                onChange={() => togglePref('tgOrders')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                ارسال آنی کدهای OTP شماره‌ها
              </span>
              <input
                type="checkbox"
                checked={prefs.tgVirtualNumbers}
                onChange={() => togglePref('tgVirtualNumbers')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                یادآوری تمدید و انقضای اکانت
              </span>
              <input
                type="checkbox"
                checked={prefs.tgExpiration}
                onChange={() => togglePref('tgExpiration')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                پیشنهادات باشگاه مشتریان
              </span>
              <input
                type="checkbox"
                checked={prefs.tgMarketing}
                onChange={() => togglePref('tgMarketing')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Channel 3: Email Notifications */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              پست الکترونیک (Email)
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                فاکتور رسمی و تاییدیه پرداخت
              </span>
              <input
                type="checkbox"
                checked={prefs.emailInvoices}
                onChange={() => togglePref('emailInvoices')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                اطلاعات اکانت و لایسنس‌ها
              </span>
              <input
                type="checkbox"
                checked={prefs.emailCredentials}
                onChange={() => togglePref('emailCredentials')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                هشدارهای امنیتی و تغییر مشخصات
              </span>
              <input
                type="checkbox"
                checked={prefs.emailSecurity}
                onChange={() => togglePref('emailSecurity')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300">
                خبرنامه اخبار هوش مصنوعی
              </span>
              <input
                type="checkbox"
                checked={prefs.emailNewsletter}
                onChange={() => togglePref('emailNewsletter')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
