import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Layers,
  Loader2,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { SMSSettings } from '../../types'

type TemplateKey = 'otp' | 'two_factor' | 'order_complete' | 'renewal'

export const SMSGatewayView: React.FC = () => {
  const [settings, setSettings] = useState<SMSSettings | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [testing, setTesting] = useState<boolean>(false)

  // API Connection states
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  const [lineNumber, setLineNumber] = useState<string>('')
  const [isSandbox, setIsSandbox] = useState<boolean>(true)

  // Template ID states
  const [templateOTP, setTemplateOTP] = useState<string>('100000')
  const [template2FA, setTemplate2FA] = useState<string>('100001')
  const [templateOrderComplete, setTemplateOrderComplete] =
    useState<string>('100002')
  const [templateRenewal, setTemplateRenewal] = useState<string>('100003')

  // Test Console state
  const [testMobile, setTestMobile] = useState<string>('')
  const [selectedTestTemplate, setSelectedTestTemplate] =
    useState<TemplateKey>('otp')
  const [testParamCode, setTestParamCode] = useState<string>('12345')
  const [testParamOrder, setTestParamOrder] = useState<string>('ANX-9824')
  const [testParamPrompt, setTestParamPrompt] = useState<string>(
    'لطفاً کد تایید ۲FA را وارد نمایید',
  )
  const [testParamLicense, setTestParamLicense] = useState<string>(
    'ANHX-PRO-DEMO-LICENSE-KEY',
  )
  const [testParamService, setTestParamService] =
    useState<string>('Google One 2TB')
  const [testParamDays, setTestParamDays] = useState<string>('۳')
  const [testParamLink, setTestParamLink] = useState<string>('anahix.ir/renew')

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
      setIsSandbox(data.is_sandbox ?? true)

      setTemplateOTP(data.template_otp || data.template_id || '100000')
      setTemplate2FA(data.template_2fa || '100001')
      setTemplateOrderComplete(data.template_order_complete || '100002')
      setTemplateRenewal(data.template_renewal || '100003')
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
        template_id: templateOTP.trim() || undefined,
        template_otp: templateOTP.trim() || undefined,
        template_2fa: template2FA.trim() || undefined,
        template_order_complete: templateOrderComplete.trim() || undefined,
        template_renewal: templateRenewal.trim() || undefined,
        is_sandbox: isSandbox,
      })
      setNotification({
        type: 'success',
        message: 'تمامی تنظیمات وب‌سرویس و شناسه‌های الگو با موفقیت ذخیره شدند.',
      })
      setApiKey('')
      await fetchSettings()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'خطا در ذخیره تنظیمات درگاه پیامک',
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
      let params: Record<string, string> = {}
      let targetTid = 0

      if (selectedTestTemplate === 'otp') {
        params = { Code: testParamCode }
        targetTid = Number(templateOTP) || 100000
      } else if (selectedTestTemplate === 'two_factor') {
        params = { Order: testParamOrder, Prompt: testParamPrompt }
        targetTid = Number(template2FA) || 100001
      } else if (selectedTestTemplate === 'order_complete') {
        params = { Order: testParamOrder, License: testParamLicense }
        targetTid = Number(templateOrderComplete) || 100002
      } else if (selectedTestTemplate === 'renewal') {
        params = {
          Service: testParamService,
          Days: testParamDays,
          Link: testParamLink,
        }
        targetTid = Number(templateRenewal) || 100003
      }

      const resp = await api.sendTestSMS(
        testMobile.trim(),
        selectedTestTemplate,
        targetTid,
        params,
      )
      setNotification({
        type: 'success',
        message:
          resp.message ||
          `پیامک آزمایشی الگوی "${getTemplateTitle(selectedTestTemplate)}" با موفقیت ارسال شد.`,
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

  const getTemplateTitle = (key: TemplateKey) => {
    switch (key) {
      case 'otp':
        return 'خوش‌آمدگویی و ورود OTP'
      case 'two_factor':
        return 'اعلام درخواست کد ۲FA'
      case 'order_complete':
        return 'تحویل لایسنس و تکمیل سفارش'
      case 'renewal':
        return 'یادآور تمدید اشتراک'
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
                  سیستم الگوهای پیامک خدماتی (SMS.ir Pattern Manager)
                </h2>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  عبور تضمینی از بلک‌لیست
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تنظیم شناسه‌های الگو (Template ID) برای رویدادهای OTP، اعلام ۲FA،
                تحویل لایسنس و یادآور تمدید اشتراک با ارسال سریع زیر ۵ ثانیه
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                ارتباط با سرور SMS.ir
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
                مانده اعتبار ریالی
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
                الگوهای فعال رویدادها
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                ۴ الگوی تایید سریع
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                خطوط اختصاصی ارسال
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                {settings?.lines?.length || 1} خط پیامکی
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

      {/* Main Grid: Form & Live Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Patterns & Connection Settings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Core Event Templates Manager Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    شناسه‌های الگوی رویدادهای سیستمی (SMS.ir Template IDs)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  پیکربندی پترن‌های ارسال سریع
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template 1: OTP */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:border-blue-300 dark:hover:border-blue-800 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Key className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        الگوی خوش‌آمدگویی و ورود OTP
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                      #Code#
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    کد یکبار مصرف ۵ رقمی جهت ورود، ثبت‌نام و احراز هویت اولیه
                    مشتری با عبور از لیست سیاه مخابراتی
                  </p>
                  <div>
                    <label
                      htmlFor="template-otp-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      شناسه قالب (Template ID)
                    </label>
                    <input
                      id="template-otp-input"
                      type="text"
                      value={templateOTP}
                      onChange={(e) => setTemplateOTP(e.target.value)}
                      placeholder="100000"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    کد ورود به آناهیکس: #Code#
                  </div>
                </div>

                {/* Template 2: 2FA Request */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:border-amber-300 dark:hover:border-amber-800 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        الگوی اعلام درخواست کد ۲FA
                      </span>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      #Order# #Prompt#
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    اطلاع‌رسانی فوری هنگام درخواست اپراتور برای کد تایید دو
                    مرحله‌ای جهت فعال‌سازی روی اکانت شخصی
                  </p>
                  <div>
                    <label
                      htmlFor="template-2fa-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      شناسه قالب (Template ID)
                    </label>
                    <input
                      id="template-2fa-input"
                      type="text"
                      value={template2FA}
                      onChange={(e) => setTemplate2FA(e.target.value)}
                      placeholder="100001"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    نیاز به تایید ۲FA سفارش #Order#: #Prompt#
                  </div>
                </div>

                {/* Template 3: License Delivery / Order Completed */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <PackageCheck className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        الگوی تحویل لایسنس و تکمیل سفارش
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                      #Order# #License#
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    ارسال کد لایسنس دیجیتال و اعلام اتمام موفق پردازش سفارش به
                    شماره همراه خریدار
                  </p>
                  <div>
                    <label
                      htmlFor="template-order-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      شناسه قالب (Template ID)
                    </label>
                    <input
                      id="template-order-input"
                      type="text"
                      value={templateOrderComplete}
                      onChange={(e) => setTemplateOrderComplete(e.target.value)}
                      placeholder="100002"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    سفارش #Order# تکمیل شد. لایسنس: #License#
                  </div>
                </div>

                {/* Template 4: Subscription Renewal Reminder */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:border-purple-300 dark:hover:border-purple-800 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <BellRing className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        الگوی یادآور تمدید اشتراک
                      </span>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                      #Service# #Days# #Link#
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    یادآوری قبل از به پایان رسیدن مهلت اشتراک و دعوت مشتری به
                    تمدید سرویس با لینک مستقیم
                  </p>
                  <div>
                    <label
                      htmlFor="template-renewal-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      شناسه قالب (Template ID)
                    </label>
                    <input
                      id="template-renewal-input"
                      type="text"
                      value={templateRenewal}
                      onChange={(e) => setTemplateRenewal(e.target.value)}
                      placeholder="100003"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    اشتراک #Service# شما #Days# روز دیگر منقضی می‌شود. تمدید:
                    #Link#
                  </div>
                </div>
              </div>
            </div>

            {/* 2. API Credentials & Gateway Parameters */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Key className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  اتصال وب‌سرویس و شماره خطوط فرستنده (SMS.ir Credentials)
                </h3>
              </div>

              <div className="space-y-4">
                {/* API Key */}
                <div>
                  <label
                    htmlFor="sms-api-key-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    کلید وب‌سرویس سامانه پیامک (SMS.ir API Key)
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
                          : 'کلید API اختصاصی سامانه SMS.ir را وارد نمایید...'
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
                    در پنل SMS.ir از بخش برنامه‌نویسان / کلیدهای وب‌سرویس، کلید
                    جدید ایجاد کرده و در این کادر قرار دهید.
                  </p>
                </div>

                {/* Line Number & Sandbox */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      شماره خط خدماتی ۳۰۰۰ جهت ارسال پیامک‌های عادی/پشتیبانی
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        محیط شبیه‌ساز (Sandbox)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        در صورت عدم وجود کلید واقعی، پیامک‌ها در لاگ سرور
                        شبیه‌سازی می‌شوند
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
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>ذخیره تمامی تنظیمات و الگوها</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Console: Live Pattern SMS Test Dispatcher (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                کنسول تست زنده ارسال الگوها
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              جهت ارزیابی صحت پیکربندی الگوها در SMS.ir و دریافت واقعی روی گوشی
              موبایل، الگوی مد نظر را انتخاب و تست نمایید.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              {/* Select Pattern */}
              <div>
                <label
                  htmlFor="test-template-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  انتخاب الگوی تست
                </label>
                <select
                  id="test-template-select"
                  value={selectedTestTemplate}
                  onChange={(e) =>
                    setSelectedTestTemplate(e.target.value as TemplateKey)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="otp">
                    ۱. الگوی خوش‌آمدگویی و ورود OTP (قالب #{templateOTP})
                  </option>
                  <option value="two_factor">
                    ۲. الگوی اعلام درخواست کد ۲FA (قالب #{template2FA})
                  </option>
                  <option value="order_complete">
                    ۳. الگوی تحویل لایسنس و تکمیل سفارش (قالب #
                    {templateOrderComplete})
                  </option>
                  <option value="renewal">
                    ۴. الگوی یادآور تمدید اشتراک (قالب #{templateRenewal})
                  </option>
                </select>
              </div>

              {/* Dynamic Parameter Inputs based on chosen template */}
              {selectedTestTemplate === 'otp' && (
                <div>
                  <label
                    htmlFor="test-code-input"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    مقدار پارامتر #Code#
                  </label>
                  <input
                    id="test-code-input"
                    type="text"
                    value={testParamCode}
                    onChange={(e) => setTestParamCode(e.target.value)}
                    placeholder="12345"
                    dir="ltr"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                  />
                </div>
              )}

              {selectedTestTemplate === 'two_factor' && (
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="test-order-2fa-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      مقدار پارامتر #Order#
                    </label>
                    <input
                      id="test-order-2fa-input"
                      type="text"
                      value={testParamOrder}
                      onChange={(e) => setTestParamOrder(e.target.value)}
                      placeholder="ANX-9824"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="test-prompt-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      مقدار پارامتر #Prompt#
                    </label>
                    <input
                      id="test-prompt-input"
                      type="text"
                      value={testParamPrompt}
                      onChange={(e) => setTestParamPrompt(e.target.value)}
                      placeholder="لطفاً کد ۶ رقمی را وارد کنید"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedTestTemplate === 'order_complete' && (
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="test-order-complete-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      مقدار پارامتر #Order#
                    </label>
                    <input
                      id="test-order-complete-input"
                      type="text"
                      value={testParamOrder}
                      onChange={(e) => setTestParamOrder(e.target.value)}
                      placeholder="ANX-9824"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="test-license-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      مقدار پارامتر #License#
                    </label>
                    <input
                      id="test-license-input"
                      type="text"
                      value={testParamLicense}
                      onChange={(e) => setTestParamLicense(e.target.value)}
                      placeholder="ANHX-XXXX-YYYY"
                      dir="ltr"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedTestTemplate === 'renewal' && (
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="test-service-input"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      مقدار پارامتر #Service#
                    </label>
                    <input
                      id="test-service-input"
                      type="text"
                      value={testParamService}
                      onChange={(e) => setTestParamService(e.target.value)}
                      placeholder="ChatGPT Plus 1M"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="test-days-input"
                        className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        #Days# (روز)
                      </label>
                      <input
                        id="test-days-input"
                        type="text"
                        value={testParamDays}
                        onChange={(e) => setTestParamDays(e.target.value)}
                        placeholder="۳"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-center font-bold"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="test-link-input"
                        className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        #Link#
                      </label>
                      <input
                        id="test-link-input"
                        type="text"
                        value={testParamLink}
                        onChange={(e) => setTestParamLink(e.target.value)}
                        placeholder="anahix.ir/renew"
                        dir="ltr"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Input */}
              <div>
                <label
                  htmlFor="test-sms-mobile-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  شماره همراه گیرنده تست (۱۱ رقم)
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
                <span>ارسال تست به این شماره</span>
              </button>
            </form>
          </div>

          {/* Quick Setup Guide Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>راهنمای تایید قالب‌ها در پنل SMS.ir</span>
            </div>

            <ol className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
              <li>
                در پنل SMS.ir به منوی{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  ارسال سریع (Verify)
                </strong>{' '}
                و سپس بخش{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  قالب‌ها
                </strong>{' '}
                مراجعه فرمایید.
              </li>
              <li>
                قالب‌های فوق را با متغیرهای تعریف شده بسازید و منتظر تایید توسط
                کارشناسان سامانه بمانید (معمولاً زیر ۱۰ دقیقه تایید می‌شوند).
              </li>
              <li>
                پس از تایید،{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  Template ID
                </strong>{' '}
                عددی اختصاص یافته را در فیلدهای مربوطه ثبت و دکمه ذخیره را کلیک
                کنید.
              </li>
              <li>
                پیامک‌های ارسال شده از طریق وب‌سرویس Verify حتی به شماره‌هایی که
                پیامک تبلیغاتی خود را مسدود کرده‌اند (بلک‌لیست) در عرض کمتر از ۵
                ثانیه تحویل داده می‌شوند.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
