import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Layers,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { SMSSettings } from '../../types'

export const SMSGatewayView: React.FC = () => {
  const [settings, setSettings] = useState<SMSSettings | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [testing, setTesting] = useState<boolean>(false)

  // Form states
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  const [lineNumber, setLineNumber] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('123456')
  const [isSandbox, setIsSandbox] = useState<boolean>(true)

  // Test SMS state
  const [testMobile, setTestMobile] = useState<string>('')
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await api.getSMSSettings()
      setSettings(data)
      setLineNumber(data.line_number || '')
      setTemplateId(data.template_id || '123456')
      setIsSandbox(data.is_sandbox ?? true)
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'خطا در بارگذاری تنظیمات سامانه پیامک',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setNotification(null)

    try {
      await api.updateSMSSettings({
        api_key: apiKey.trim() || undefined,
        line_number: lineNumber.trim() || undefined,
        template_id: templateId.trim() || undefined,
        is_sandbox: isSandbox,
      })
      setNotification({
        type: 'success',
        message: 'تنظیمات وب‌سرویس پیامک با موفقیت به‌روزرسانی شد.',
      })
      setApiKey('')
      await fetchSettings()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'خطا در ذخیره تنظیمات',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testMobile || testMobile.length < 11) {
      setNotification({
        type: 'error',
        message: 'لطفاً یک شماره موبایل معتبر (۱۱ رقم) وارد کنید.',
      })
      return
    }

    setTesting(true)
    setNotification(null)
    try {
      const resp = await api.sendTestSMS(testMobile.trim())
      setNotification({
        type: 'success',
        message:
          resp.message || 'پیامک آزمایشی با موفقیت به شماره مقصد ارسال شد.',
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'ارسال پیامک آزمایشی با خطا مواجه شد.',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  درگاه پیامک خدماتی و اعتبارسنجی
                </h2>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  ملی و خدماتی
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تامین و ارسال آنی کدهای اعتبارسنجی ورود و ثبت‌نام مشتریان از طریق
                الگوهای تایید سریع و مستقیم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSettings}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>بروزرسانی وضعیت</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                وضعیت ارتباط سامانه پیامک
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {settings?.api_key_mask
                  ? 'متصل به حساب اصلی'
                  : 'حالت شبیه‌ساز توسعه (Simulator)'}
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                مانده اعتبار ریالی پیامک
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {settings?.live_credit
                  ? settings.live_credit.toLocaleString('fa-IR')
                  : '۱,۰۰۰'}{' '}
                <span className="text-[11px] font-sans font-normal text-slate-400">
                  ریال
                </span>
              </div>
            </div>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                خطوط فعال ارسال
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                {settings?.lines?.length || 1} خط اختصاصی/خدماتی
              </div>
            </div>
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Feedback Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Grid: Settings Form & Live SMS Test Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Key className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              پیکربندی کلید و پارامترهای اتصال سامانه پیامک
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* API Key */}
            <div>
              <label
                htmlFor="sms-api-key-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                کلید وب‌سرویس سامانه پیامک
              </label>
              <div className="relative">
                <input
                  id="sms-api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    settings?.api_key_mask
                      ? `کلید فعال ذخیره شده: ${settings.api_key_mask} (جهت تغییر وارد نمایید)`
                      : 'کلید API اختصاصی سامانه پیامک را وارد نمایید...'
                  }
                  dir="ltr"
                  className="w-full h-10 px-3 pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                کلید دسترسی وب‌سرویس امن جهت احراز هویت درخواست‌ها
              </p>
            </div>

            {/* Template ID & Line Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sms-template-id-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  شناسه قالب تایید سریع (Template ID)
                </label>
                <input
                  id="sms-template-id-input"
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="شناسه الگو (مثال: 100000)"
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  شناسه الگوی اعتبارسنجی سریع (با متغیر Code)
                </p>
              </div>

              <div>
                <label
                  htmlFor="sms-line-number-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  شماره خط فرستنده (Line Number)
                </label>
                <input
                  id="sms-line-number-input"
                  type="text"
                  value={lineNumber}
                  onChange={(e) => setLineNumber(e.target.value)}
                  placeholder="30004505000017"
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  خط خدماتی ۳۰۰۰ یا ۵۰۰۰ جهت عبور از بلک‌لیست
                </p>
              </div>
            </div>

            {/* Sandbox Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  حالت آزمایشی (Sandbox)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  در صورت فعال بودن، پیامک‌های اعتبارسنجی بدون کسر شارژ و با قالب
                  تست ارسال می‌شوند
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>ذخیره تغییرات درگاه پیامک</span>
              </button>
            </div>
          </form>
        </div>

        {/* Test SMS Dispatcher (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                تست زنده ارسال پیامک تایید
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              جهت ارزیابی صحت اتصال به سامانه و قالب انتخابی، یک پیامک
              اعتبارسنجی تستی ارسال کنید.
            </p>

            <form onSubmit={handleSendTest} className="space-y-3">
              <div>
                <label
                  htmlFor="test-sms-mobile-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  شماره موبایل گیرنده تست
                </label>
                <input
                  id="test-sms-mobile-input"
                  type="tel"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  placeholder="09121234567"
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={testing || !testMobile}
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>ارسال پیامک تستی به این شماره</span>
              </button>
            </form>
          </div>

          {/* Quick Setup Guide Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>راهنمای یکپارچه‌سازی قالب تایید</span>
            </div>

            <ol className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
              <li>
                در پنل مدیریت پیامک وارد بخش قالب‌های ارسال سریع اعتبارسنجی شوید.
              </li>
              <li>
                یک قالب جدید با متغیر{' '}
                <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">
                  #CODE#
                </code>{' '}
                بسازید.
              </li>
              <li>
                نمونه متن قالب: <br />
                <span className="italic block mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px]">
                  کد ورود به آناهیکس: #CODE#
                  <br />
                  این کد محرمانه است و نباید در اختیار دیگران قرار گیرد.
                </span>
              </li>
              <li>
                پس از تایید قالب،{' '}
                <strong className="text-slate-900 dark:text-white">
                  شناسه قالب (Template ID)
                </strong>{' '}
                عددی را در فرم بالا ثبت فرمایید.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
