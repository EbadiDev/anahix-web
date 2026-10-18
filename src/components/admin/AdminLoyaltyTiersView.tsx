import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Crown,
  Diamond,
  Edit2,
  Layers,
  Medal,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { CreateOrUpdateLoyaltyTierRequest, LoyaltyTier } from '../../types'
import { AdminHeaderBanner } from './AdminHeaderBanner'

export const AdminLoyaltyTiersView: React.FC = () => {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [_settingsLoading, _setSettingsLoading] = useState<boolean>(false)
  const [settings, setSettings] = useState<Record<string, string>>({
    loyalty_enabled: 'true',
    loyalty_calculation_period: 'monthly_30d',
    loyalty_auto_upgrade: 'true',
  })
  const [savingSettings, setSavingSettings] = useState<boolean>(false)
  const [actionMsg, setActionMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)

  // Form Fields
  const [formCode, setFormCode] = useState<string>('')
  const [formName, setFormName] = useState<string>('')
  const [formNameEN, setFormNameEN] = useState<string>('')
  const [formMinSpend, setFormMinSpend] = useState<number>(0)
  const [formDiscount, setFormDiscount] = useState<number>(0)
  const [formPriority, setFormPriority] = useState<number>(0)
  const [formColor, setFormColor] = useState<string>('#eab308')
  const [formIcon, setFormIcon] = useState<string>('crown')
  const [formDesc, setFormDesc] = useState<string>('')
  const [formPerks, setFormPerks] = useState<string[]>([])
  const [newPerkInput, setNewPerkInput] = useState<string>('')
  const [formIsActive, setFormIsActive] = useState<boolean>(true)
  const [formOrderIndex, setFormOrderIndex] = useState<number>(1)

  const loadData = async () => {
    setLoading(true)
    try {
      const [tiersRes, settingsRes] = await Promise.all([
        apiService.getAdminLoyaltyTiers(),
        apiService.getAdminLoyaltySettings(),
      ])
      setTiers(tiersRes)
      if (settingsRes) {
        setSettings(settingsRes)
      }
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err?.message || 'خطا در بارگذاری اطلاعات سطوح وفاداری',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingTier(null)
    setFormCode('')
    setFormName('')
    setFormNameEN('')
    setFormMinSpend(10000000)
    setFormDiscount(3)
    setFormPriority(20)
    setFormColor('#3b82f6')
    setFormIcon('zap')
    setFormDesc('')
    setFormPerks([
      'تخفیف خودکار روی تمامی لایسنس‌ها',
      'اولویت بالا در صف اپراتور',
    ])
    setFormIsActive(true)
    setFormOrderIndex(tiers.length + 1)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (t: LoyaltyTier) => {
    setEditingTier(t)
    setFormCode(t.code)
    setFormName(t.name)
    setFormNameEN(t.name_en || '')
    setFormMinSpend(t.min_spend_toman)
    setFormDiscount(t.discount_percent)
    setFormPriority(t.queue_priority)
    setFormColor(t.badge_color || '#eab308')
    setFormIcon(t.icon || 'crown')
    setFormDesc(t.description || '')
    setFormPerks(t.perks || [])
    setFormIsActive(t.is_active)
    setFormOrderIndex(t.order_index)
    setIsModalOpen(true)
  }

  const handleAddPerk = () => {
    const trimmed = newPerkInput.trim()
    if (!trimmed) return
    if (!formPerks.includes(trimmed)) {
      setFormPerks([...formPerks, trimmed])
    }
    setNewPerkInput('')
  }

  const handleRemovePerk = (index: number) => {
    setFormPerks(formPerks.filter((_, i) => i !== index))
  }

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formCode.trim()) {
      alert('لطفاً عنوان و کد یکتای سطح را وارد نمایید.')
      return
    }

    setModalLoading(true)
    try {
      const payload: CreateOrUpdateLoyaltyTierRequest = {
        code: formCode.trim().toLowerCase(),
        name: formName.trim(),
        name_en: formNameEN.trim(),
        min_spend_toman: Number(formMinSpend),
        discount_percent: Number(formDiscount),
        queue_priority: Number(formPriority),
        badge_color: formColor,
        icon: formIcon,
        description: formDesc.trim(),
        perks: formPerks,
        order_index: Number(formOrderIndex),
        is_active: formIsActive,
      }

      if (editingTier) {
        await apiService.updateAdminLoyaltyTier(editingTier.id, payload)
        setActionMsg({
          type: 'success',
          text: `سطح «${payload.name}» با موفقیت ویرایش شد.`,
        })
      } else {
        await apiService.createAdminLoyaltyTier(payload)
        setActionMsg({
          type: 'success',
          text: `سطح جدید «${payload.name}» با موفقیت ایجاد گردید.`,
        })
      }

      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      alert(err?.message || 'خطا در ثبت اطلاعات سطح')
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteTier = async (t: LoyaltyTier) => {
    if (t.code === 'bronze') {
      alert('سطح پایه برنزی سیستم غیرقابل حذف است.')
      return
    }
    const confirmDelete = window.confirm(
      `آیا از حذف سطح وفاداری «${t.name}» اطمینان دارید؟ کاربران این سطح به سطح برنزی منتقل خواهند شد.`,
    )
    if (!confirmDelete) return

    try {
      await apiService.deleteAdminLoyaltyTier(t.id)
      setActionMsg({
        type: 'success',
        text: `سطح «${t.name}» با موفقیت حذف گردید.`,
      })
      loadData()
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err?.message || 'خطا در حذف سطح',
      })
    }
  }

  const handleSaveGlobalSettings = async () => {
    setSavingSettings(true)
    try {
      await apiService.updateAdminLoyaltySettings(settings)
      setActionMsg({
        type: 'success',
        text: 'تنظیمات سراسری باشگاه مشتریان با موفقیت ذخیره شد.',
      })
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err?.message || 'خطا در ذخیره تنظیمات',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const renderTierIcon = (iconName: string) => {
    switch (iconName) {
      case 'crown':
        return <Crown className="w-5 h-5" />
      case 'star':
        return <Star className="w-5 h-5" />
      case 'diamond':
        return <Diamond className="w-5 h-5" />
      case 'zap':
        return <Zap className="w-5 h-5" />
      case 'medal':
        return <Medal className="w-5 h-5" />
      case 'shield':
        return <Shield className="w-5 h-5" />
      default:
        return <Award className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" dir="rtl">
      {/* Top Banner & Header */}
      <AdminHeaderBanner
        icon={Crown}
        title="باشگاه مشتریان و سطوح وفاداری (VIP Club & Loyalty Tiers)"
        subtitle="تعریف پویا و بدون هاردکد سطوح برنزی، نقره‌ای، طلایی و سازمانی به همراه تخفیف خودکار و اولویت در صف اپراتور"
        badgeText="موتور وفاداری VIP"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="p-2.5 bg-card hover:bg-muted text-foreground rounded-control border border-border/60 transition shadow-control cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-brand' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف سطح وفاداری جدید</span>
            </button>
          </div>
        }
      />

      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-surface text-xs font-bold flex items-center justify-between border ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMsg(null)}
            className="p-1 rounded-control text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Loyalty Settings Panel */}
      <div className="bg-card rounded-surface border border-border/80 p-5 sm:p-6 shadow-surface space-y-4 text-foreground">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-500" />
            پیکربندی و تنظیمات هوشمند باشگاه وفاداری (System Settings)
          </h2>
          <button
            type="button"
            onClick={handleSaveGlobalSettings}
            disabled={savingSettings}
            className="h-9 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-control duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Setting 1: System Status (3 states per user requirement) */}
          <div className="bg-muted/20 p-4 rounded-surface border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                وضعیت باشگاه مشتریان (VIP Engine)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-control border ${
                  settings.loyalty_enabled === 'active' ||
                  settings.loyalty_enabled === 'true'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : settings.loyalty_enabled === 'coming_soon'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-muted text-muted-foreground border-border/60'
                }`}
              >
                {settings.loyalty_enabled === 'active' ||
                settings.loyalty_enabled === 'true'
                  ? 'فعال کامل'
                  : settings.loyalty_enabled === 'coming_soon'
                    ? 'به‌زودی'
                    : 'غیرفعال'}
              </span>
            </div>
            <select
              value={
                settings.loyalty_enabled === 'active' ||
                settings.loyalty_enabled === 'true'
                  ? 'active'
                  : settings.loyalty_enabled === 'coming_soon'
                    ? 'coming_soon'
                    : 'disabled'
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  loyalty_enabled: e.target.value,
                })
              }
              className="w-full h-9 bg-card border border-border/60 rounded-control px-2.5 text-xs text-foreground focus:outline-none focus:border-brand font-bold"
            >
              <option value="active">
                🟢 فعال کامل (نمایش در پنل کاربری و اعمال خودکار تخفیف)
              </option>
              <option value="coming_soon">
                🟡 به‌زودی (نمایش بج به‌زودی، غیرقابل کلیک در پنل و مسدود بودن
                لینک)
              </option>
              <option value="disabled">
                🔴 غیرفعال کامل (حذف کامل از منوی پنل کاربری و سبد خرید)
              </option>
            </select>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              کنترل وضعیت نمایش عمومی، رفتار لینک‌ها در پنل مشتری و اعمال تخفیف
            </p>
          </div>

          {/* Setting 2: Calculation Period */}
          <div className="bg-muted/20 p-4 rounded-surface border border-border/60 space-y-2">
            <label className="text-xs font-bold text-foreground block">
              دوره محاسبه حجم خرید جهت ارتقای سطح
            </label>
            <select
              value={settings.loyalty_calculation_period || 'monthly_30d'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  loyalty_calculation_period: e.target.value,
                })
              }
              className="w-full h-9 bg-card border border-border/60 rounded-control px-2.5 text-xs text-foreground focus:outline-none focus:border-brand"
            >
              <option value="monthly_30d">
                حجم خرید ۳۰ روز اخیر (توصیه شده - حفظ انگیزه خرید مداوم)
              </option>
              <option value="all_time">
                کل حجم خریدهای موفق از ابتدا (مادام‌العمر / Cumulative)
              </option>
            </select>
            <p className="text-[11px] text-muted-foreground">
              سطح کاربر بر اساس مجموع خریدهای واجد شرایط در این بازه محاسبه
              می‌گردد.
            </p>
          </div>

          {/* Setting 3: Auto Level-Up */}
          <div className="bg-muted/20 p-4 rounded-surface border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                ارتقای خودکار سطح (Auto-Upgrade)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.loyalty_auto_upgrade === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      loyalty_auto_upgrade: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ارتقای خودکار سطح بلافاصله پس از پرداخت یا تکمیل سفارش بدون نیاز
              به تایید دستی اپراتور
            </p>
          </div>
        </div>
      </div>

      {/* Loyalty Tiers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" />
            سطوح فعال وفاداری در دیتابیس ({tiers.length} سطح)
          </h2>
          <span className="text-xs text-muted-foreground">
            ترتیب اعمال خودکار بر اساس آستانه خرید (از کمترین به بیشترین)
          </span>
        </div>

        {tiers.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-surface p-12 text-center text-muted-foreground text-xs shadow-surface">
            هیچ سطح وفاداری تعریف نشده است. با کلیک بر روی دکمه «تعریف سطح
            وفاداری جدید» شروع کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-card text-card-foreground border border-border/80 rounded-surface p-5 shadow-surface relative overflow-hidden flex flex-col justify-between group hover:border-brand/40 transition-colors space-y-4"
              >
                {/* Header Badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-3 py-1 rounded-control text-xs font-black flex items-center gap-1.5 shadow-xs"
                      style={{
                        backgroundColor: `${tier.badge_color}18`,
                        color: tier.badge_color,
                        borderColor: `${tier.badge_color}40`,
                        borderWidth: 1,
                      }}
                    >
                      {renderTierIcon(tier.icon)}
                      {tier.name}
                    </span>

                    <span className="text-[11px] font-mono font-latin px-2 py-0.5 rounded-control bg-secondary text-secondary-foreground border border-border/60">
                      #{tier.code}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] pt-1">
                    {tier.description || 'بدون توضیحات اختصاصی'}
                  </p>
                </div>

                {/* Key Numbers */}
                <div className="bg-muted/20 p-3.5 rounded-surface border border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">تخفیف خودکار:</span>
                    <span className="font-black text-emerald-400 text-sm font-latin">
                      {tier.discount_percent > 0
                        ? `${tier.discount_percent}٪ تخفیف نقدی`
                        : 'بدون تخفیف (پایه)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      حداقل حجم خرید:
                    </span>
                    <span className="font-bold text-foreground font-latin">
                      {tier.min_spend_toman > 0
                        ? `${tier.min_spend_toman.toLocaleString('fa-IR')} تومان`
                        : '۰ تومان (عضویت رایگان)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      اولویت صف اپراتور:
                    </span>
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded-control text-[11px] ${
                        tier.queue_priority >= 50
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : tier.queue_priority >= 10
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tier.queue_priority >= 50
                        ? `VIP طلایی (${tier.queue_priority})`
                        : tier.queue_priority >= 10
                          ? `اولویت بالا (${tier.queue_priority})`
                          : `عادی (${tier.queue_priority})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <span className="text-muted-foreground">
                      کاربران این سطح:
                    </span>
                    <span className="font-bold text-brand font-latin">
                      {(tier.user_count || 0).toLocaleString('fa-IR')} کاربر
                    </span>
                  </div>
                </div>

                {/* Perks Checklist */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    مزایا و امکانات این سطح:
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {(tier.perks || []).map((p) => (
                      <div
                        key={p}
                        className="text-[11px] text-slate-300 flex items-start gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tier.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {tier.is_active ? 'فعال در سیستم' : 'غیرفعال'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(tier)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="ویرایش سطح"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {tier.code !== 'bronze' && (
                      <button
                        onClick={() => handleDeleteTier(tier)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                        title="حذف سطح"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Loyalty Tier */}
      {isModalOpen &&
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
              <div className="bg-card text-card-foreground border border-border/80 rounded-surface w-full max-w-xl p-6 shadow-overlay relative space-y-5 my-auto animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    {editingTier
                      ? `ویرایش سطح وفاداری: ${editingTier.name}`
                      : 'تعریف سطح وفاداری جدید (VIP Tier)'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTier} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        عنوان سطح (فارسی) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="مثال: طلایی (ریسلرها و همکاران)"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        کد یکتا (انگلیسی) *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={editingTier?.code === 'bronze'}
                        value={formCode}
                        onChange={(e) =>
                          setFormCode(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_-]/g, ''),
                          )
                        }
                        placeholder="مثال: gold یا diamond"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        حداقل حجم خرید به تومان (Spend Threshold) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={100000}
                        value={formMinSpend}
                        onChange={(e) =>
                          setFormMinSpend(Number(e.target.value))
                        }
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                      />
                      <span className="text-[11px] text-muted-foreground block font-latin">
                        {formMinSpend.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        درصد تخفیف نقدی خودکار (%) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        max={50}
                        step={0.5}
                        value={formDiscount}
                        onChange={(e) =>
                          setFormDiscount(Number(e.target.value))
                        }
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                      />
                      <span className="text-[11px] text-muted-foreground block">
                        اعمال خودکار روی کلیه سبدهای خرید این کاربر
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        اولویت در صف اپراتور
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={formPriority}
                        onChange={(e) =>
                          setFormPriority(Number(e.target.value))
                        }
                        placeholder="0=عادی، 10=بالا، 50=VIP"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        آیکون نشان سطح
                      </label>
                      <select
                        value={formIcon}
                        onChange={(e) => setFormIcon(e.target.value)}
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      >
                        <option value="crown">👑 تاج (Crown - طلایی)</option>
                        <option value="star">⭐ ستاره (Star - نقره‌ای)</option>
                        <option value="medal">🥉 مدال (Medal - برنزی)</option>
                        <option value="diamond">
                          💎 الماس (Diamond - سازمانی)
                        </option>
                        <option value="zap">⚡ صاعقه (Zap)</option>
                        <option value="shield">🛡️ سپر (Shield)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="font-bold text-foreground block">
                        رنگ نشان (HEX)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formColor}
                          onChange={(e) => setFormColor(e.target.value)}
                          className="w-10 h-10 rounded-control bg-transparent border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formColor}
                          onChange={(e) => setFormColor(e.target.value)}
                          className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-foreground block">
                      توضیحات کوتاه سطح
                    </label>
                    <textarea
                      rows={2}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="توضیحاتی که کاربر در پنل خود درباره این سطح مشاهده می‌کند..."
                      className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand resize-none"
                    />
                  </div>

                  {/* Dynamic Perks Manager */}
                  <div className="space-y-2 text-right">
                    <label className="font-bold text-foreground block">
                      مزایا و ویژگی‌های اختصاصی (Perks)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPerkInput}
                        onChange={(e) => setNewPerkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddPerk()
                          }
                        }}
                        placeholder="یک ویژگی جدید اضافه کنید (مثلاً: پشتیبانی تلفنی VIP)"
                        className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={handleAddPerk}
                        className="h-10 px-4 bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 font-bold rounded-control transition shrink-0 cursor-pointer"
                      >
                        افزودن
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {formPerks.map((p, idx) => (
                        <span
                          key={p}
                          className="px-3 py-1 bg-secondary text-secondary-foreground border border-border/60 rounded-control text-xs flex items-center gap-1.5 font-medium shadow-xs"
                        >
                          {p}
                          <button
                            type="button"
                            onClick={() => handleRemovePerk(idx)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status & Submit */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/60">
                    <label className="flex items-center gap-2 cursor-pointer text-foreground font-semibold">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded accent-brand cursor-pointer"
                      />
                      <span>سطح فعال و قابل محاسبه برای کاربران باشد</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="h-10 px-4 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted rounded-control font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="h-10 px-6 bg-primary hover:bg-primary-hover text-primary-foreground rounded-control font-black shadow-control duration-motion active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        {modalLoading ? 'در حال ثبت...' : 'ذخیره سطح وفاداری'}
                      </button>
                    </div>
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
