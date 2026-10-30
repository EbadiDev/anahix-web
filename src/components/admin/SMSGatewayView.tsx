import {
  BellRing,
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
import { formatNumber } from '../../utils/formatters'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

type TemplateKey = 'otp' | 'two_factor' | 'order_complete' | 'renewal'

export const SMSGatewayView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
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
  const [ticketSMSMode, setTicketSMSMode] = useState<
    'default_on' | 'default_off' | 'disabled'
  >('default_on')

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
      setTicketSMSMode(data.ticket_sms_mode || 'default_on')
    } catch (err: any) {
      notifyError(
        'خطا در بارگذاری',
        err.message || 'خطا در بارگذاری تنظیمات سامانه پیامک',
      )
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
        ticket_sms_mode: ticketSMSMode,
      })
      notifySuccess(
        'تنظیمات پیامک ذخیره شد',
        'تمامی تنظیمات وب‌سرویس و شناسه‌های الگو با موفقیت ذخیره شدند.',
      )
      setApiKey('')
      await fetchSettings()
    } catch (err: any) {
      notifyError(
        'خطا در ذخیره',
        err.message || 'خطا در ذخیره تنظیمات درگاه پیامک',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testMobile || testMobile.length < 11) {
      notifyError(
        'خطای اعتبارسنجی',
        'لطفاً یک شماره موبایل معتبر (۱۱ رقم) وارد کنید.',
      )
      return
    }

    setTesting(true)
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
      notifySuccess(
        'ارسال موفق پیامک تست',
        resp.message ||
          `پیامک آزمایشی الگوی "${getTemplateTitle(selectedTestTemplate)}" با موفقیت ارسال شد.`,
      )
    } catch (err: any) {
      notifyError(
        'خطا در ارسال تست',
        err.message || 'ارسال پیامک آزمایشی با خطا مواجه شد.',
      )
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
      <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface text-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-control bg-secondary text-brand flex items-center justify-center font-bold text-xl shadow-control border border-border/60 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-foreground">
                  سیستم الگوهای پیامک خدماتی (SMS.ir Pattern Manager)
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-control">
                  عبور تضمینی از بلک‌لیست
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
              className="h-9 px-3.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 transition cursor-pointer shadow-xs duration-motion active:scale-[0.98]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
              />
              <span>بروزرسانی وضعیت</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
          <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">
                ارتباط با سرور SMS.ir
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {settings?.api_key_mask
                  ? 'متصل به حساب اصلی'
                  : 'حالت شبیه‌ساز توسعه (Simulator)'}
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">
                مانده اعتبار ریالی
              </div>
              <div className="text-sm font-black text-foreground mt-0.5 font-sans">
                {settings?.live_credit
                  ? formatNumber(settings.live_credit)
                  : '۱,۰۰۰'}{' '}
                <span className="text-[11px] font-sans font-normal text-muted-foreground">
                  ریال
                </span>
              </div>
            </div>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>

          <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">
                الگوهای فعال رویدادها
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5 font-mono font-latin">
                ۴ الگوی تایید سریع
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-brand" />
          </div>

          <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">
                خطوط اختصاصی ارسال
              </div>
              <div className="text-sm font-bold text-foreground mt-0.5 font-mono font-latin">
                {settings?.lines?.length || 1} خط پیامکی
              </div>
            </div>
            <Layers className="w-5 h-5 text-brand" />
          </div>
        </div>
      </div>

      {/* Main Grid: Form & Live Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Patterns & Connection Settings (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Core Event Templates Manager Card */}
            <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-5 text-foreground">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand" />
                  <h3 className="font-bold text-foreground text-sm">
                    شناسه‌های الگوی رویدادهای سیستمی (SMS.ir Template IDs)
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  پیکربندی پترن‌های ارسال سریع
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template 1: OTP */}
                <div className="p-4 rounded-surface border border-border/60 bg-muted/20 hover:border-brand/40 transition-all text-foreground shadow-xs space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-control bg-brand/10 text-brand flex items-center justify-center">
                        <Key className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        الگوی خوش‌آمدگویی و ورود OTP
                      </span>
                    </div>
                    <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-control font-mono font-latin font-bold">
                      #Code#
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    کد یکبار مصرف ۵ رقمی جهت ورود، ثبت‌نام و احراز هویت اولیه
                    مشتری با عبور از لیست سیاه مخابراتی
                  </p>
                  <div>
                    <label
                      htmlFor="template-otp-input"
                      className="block text-[11px] font-bold text-foreground mb-1"
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
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-card text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded-control bg-secondary/60 border border-border/40 text-[10px] text-muted-foreground font-mono font-latin">
                    کد ورود به آناهیکس: #Code#
                  </div>
                </div>

                {/* Template 2: 2FA Request */}
                <div className="p-4 rounded-surface border border-border/60 bg-muted/20 hover:border-brand/40 transition-all text-foreground shadow-xs space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-control bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        الگوی اعلام درخواست کد ۲FA
                      </span>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-control font-mono font-latin font-bold">
                      #Order# #Prompt#
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    اطلاع‌رسانی فوری هنگام درخواست اپراتور برای کد تایید دو
                    مرحله‌ای جهت فعال‌سازی روی اکانت شخصی
                  </p>
                  <div>
                    <label
                      htmlFor="template-2fa-input"
                      className="block text-[11px] font-bold text-foreground mb-1"
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
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-card text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded-control bg-secondary/60 border border-border/40 text-[10px] text-muted-foreground font-mono font-latin">
                    نیاز به تایید ۲FA سفارش #Order#: #Prompt#
                  </div>
                </div>

                {/* Template 3: License Delivery / Order Completed */}
                <div className="p-4 rounded-surface border border-border/60 bg-muted/20 hover:border-brand/40 transition-all text-foreground shadow-xs space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-control bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <PackageCheck className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        الگوی تحویل لایسنس و تکمیل سفارش
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-control font-mono font-latin font-bold">
                      #Order# #License#
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    ارسال کد لایسنس دیجیتال و اعلام اتمام موفق پردازش سفارش به
                    شماره همراه خریدار
                  </p>
                  <div>
                    <label
                      htmlFor="template-order-input"
                      className="block text-[11px] font-bold text-foreground mb-1"
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
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-card text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded-control bg-secondary/60 border border-border/40 text-[10px] text-muted-foreground font-mono font-latin">
                    سفارش #Order# تکمیل شد. لایسنس: #License#
                  </div>
                </div>

                {/* Template 4: Subscription Renewal Reminder */}
                <div className="p-4 rounded-surface border border-border/60 bg-muted/20 hover:border-brand/40 transition-all text-foreground shadow-xs space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-control bg-brand/10 text-brand flex items-center justify-center">
                        <BellRing className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        الگوی یادآور تمدید اشتراک
                      </span>
                    </div>
                    <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-control font-mono font-latin font-bold">
                      #Service# #Days# #Link#
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    یادآوری قبل از به پایان رسیدن مهلت اشتراک و دعوت مشتری به
                    تمدید سرویس با لینک مستقیم
                  </p>
                  <div>
                    <label
                      htmlFor="template-renewal-input"
                      className="block text-[11px] font-bold text-foreground mb-1"
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
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-card text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                  <div className="mt-2.5 p-2 rounded-control bg-secondary/60 border border-border/40 text-[10px] text-muted-foreground font-mono font-latin">
                    اشتراک #Service# شما #Days# روز دیگر منقضی می‌شود. تمدید:
                    #Link#
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Ticket Support SMS Notification Settings */}
            <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-4 text-foreground">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <BellRing className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-foreground text-sm">
                  تنظیمات اطلاع‌رسانی پیامکی تیکت‌های پشتیبانی
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  تعیین رفتار پیش‌فرض تاگل اطلاع‌رسانی پیامک هنگام پاسخ به تیکت‌ها
                  در پنل خریدار و میز ادمین:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'default_on',
                      label: 'پیش‌فرض فعال (Default ON)',
                      desc: 'تاگل در پنل کاربر به طور پیش‌فرض روشن است اما کاربر می‌تواند خاموش کند',
                    },
                    {
                      id: 'default_off',
                      label: 'پیش‌فرض غیرفعال (Default OFF)',
                      desc: 'تاگل به طور پیش‌فرض خاموش است و با تمایل کاربر فعال می‌شود',
                    },
                    {
                      id: 'disabled',
                      label: 'عدم نمایش و غیرفعال کامل (Disabled)',
                      desc: 'سیستم پیامک تیکت کاملاً خاموش بوده و در پنل کاربر و تیکت‌ها نمایش داده نمی‌شود',
                    },
                  ].map((mode) => (
                    <label
                      key={mode.id}
                      className={`p-3.5 rounded-control border flex flex-col justify-between gap-2 cursor-pointer transition select-none ${
                        ticketSMSMode === mode.id
                          ? 'border-brand bg-brand/10 shadow-xs'
                          : 'border-border/60 bg-muted/20 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="ticket_sms_mode"
                          value={mode.id}
                          checked={ticketSMSMode === mode.id}
                          onChange={() => setTicketSMSMode(mode.id as any)}
                          className="accent-brand cursor-pointer"
                        />
                        <span className="text-xs font-bold text-foreground">
                          {mode.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pr-5">
                        {mode.desc}
                      </p>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. API Credentials & Gateway Parameters */}
            <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-4 text-foreground">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <Key className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-foreground text-sm">
                  اتصال وب‌سرویس و شماره خطوط فرستنده (SMS.ir Credentials)
                </h3>
              </div>

              <div className="space-y-4">
                {/* API Key */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="sms-api-key-input"
                    className="block text-xs font-bold text-foreground"
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
                      className="w-full h-10 px-3.5 pl-10 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    در پنل SMS.ir از بخش برنامه‌نویسان / کلیدهای وب‌سرویس، کلید
                    جدید ایجاد کرده و در این کادر قرار دهید.
                  </p>
                </div>

                {/* Line Number & Sandbox */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="sms-line-number-input"
                      className="block text-xs font-bold text-foreground"
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
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      شماره خط خدماتی ۳۰۰۰ جهت ارسال پیامک‌های عادی/پشتیبانی
                    </p>
                  </div>

                  <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        محیط شبیه‌ساز (Sandbox)
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        در صورت عدم وجود کلید واقعی، پیامک‌ها در لاگ سرور
                        شبیه‌سازی می‌شوند
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={isSandbox}
                      onChange={setIsSandbox}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black flex items-center gap-2 shadow-control transition-all cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  )}
                  <span>ذخیره تمامی تنظیمات و الگوها</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Console: Live Pattern SMS Test Dispatcher (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-4 text-foreground">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <Send className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-foreground text-sm">
                کنسول تست زنده ارسال الگوها
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              جهت ارزیابی صحت پیکربندی الگوها در SMS.ir و دریافت واقعی روی گوشی
              موبایل، الگوی مد نظر را انتخاب و تست نمایید.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              {/* Select Pattern */}
              <div className="space-y-1.5">
                <label
                  htmlFor="test-template-select"
                  className="block text-xs font-bold text-foreground"
                >
                  انتخاب الگوی تست
                </label>
                <select
                  id="test-template-select"
                  value={selectedTestTemplate}
                  onChange={(e) =>
                    setSelectedTestTemplate(e.target.value as TemplateKey)
                  }
                  className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand cursor-pointer"
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
                <div className="space-y-1.5">
                  <label
                    htmlFor="test-code-input"
                    className="block text-[11px] font-bold text-foreground"
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
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                  />
                </div>
              )}

              {selectedTestTemplate === 'two_factor' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="test-order-2fa-input"
                      className="block text-[11px] font-bold text-foreground"
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
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="test-prompt-input"
                      className="block text-[11px] font-bold text-foreground"
                    >
                      مقدار پارامتر #Prompt#
                    </label>
                    <input
                      id="test-prompt-input"
                      type="text"
                      value={testParamPrompt}
                      onChange={(e) => setTestParamPrompt(e.target.value)}
                      placeholder="لطفاً کد ۶ رقمی را وارد کنید"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )}

              {selectedTestTemplate === 'order_complete' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="test-order-complete-input"
                      className="block text-[11px] font-bold text-foreground"
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
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="test-license-input"
                      className="block text-[11px] font-bold text-foreground"
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
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )}

              {selectedTestTemplate === 'renewal' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="test-service-input"
                      className="block text-[11px] font-bold text-foreground"
                    >
                      مقدار پارامتر #Service#
                    </label>
                    <input
                      id="test-service-input"
                      type="text"
                      value={testParamService}
                      onChange={(e) => setTestParamService(e.target.value)}
                      placeholder="ChatGPT Plus 1M"
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="test-days-input"
                        className="block text-[11px] font-bold text-foreground"
                      >
                        #Days# (روز)
                      </label>
                      <input
                        id="test-days-input"
                        type="text"
                        value={testParamDays}
                        onChange={(e) => setTestParamDays(e.target.value)}
                        placeholder="۳"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs text-center font-bold outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="test-link-input"
                        className="block text-[11px] font-bold text-foreground"
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
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="test-sms-mobile-input"
                  className="block text-xs font-bold text-foreground"
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
                  className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                />
              </div>

              <button
                type="submit"
                disabled={testing || !testMobile}
                className="w-full h-11 rounded-control bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-control transition-all cursor-pointer duration-motion active:scale-[0.98]"
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
          <div className="rounded-surface border border-border/60 bg-muted/20 p-5 space-y-3 text-foreground">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <HelpCircle className="w-4 h-4 text-brand" />
              <span>راهنمای تایید قالب‌ها در پنل SMS.ir</span>
            </div>

            <ol className="space-y-2 text-[11px] text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>
                در پنل SMS.ir به منوی{' '}
                <strong className="text-foreground">ارسال سریع (Verify)</strong>{' '}
                و سپس بخش <strong className="text-foreground">قالب‌ها</strong>{' '}
                مراجعه فرمایید.
              </li>
              <li>
                قالب‌های فوق را با متغیرهای تعریف شده بسازید و منتظر تایید توسط
                کارشناسان سامانه بمانید (معمولاً زیر ۱۰ دقیقه تایید می‌شوند).
              </li>
              <li>
                پس از تایید،{' '}
                <strong className="text-foreground font-mono font-latin">
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
