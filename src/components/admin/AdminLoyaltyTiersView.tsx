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
import { apiService } from '../../services/api'
import type { CreateOrUpdateLoyaltyTierRequest, LoyaltyTier } from '../../types'

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
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
                باشگاه مشتریان و سطوح وفاداری (VIP Club & Loyalty Tiers)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Dynamic Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                تعریف پویا و بدون هاردکد سطوح برنزی، نقره‌ای، طلایی و سازمانی به
                همراه تخفیف خودکار و اولویت در صف اپراتور
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`}
            />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            تعریف سطح وفاداری جدید
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button
            onClick={() => setActionMsg(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Loyalty Settings Panel */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            پیکربندی و تنظیمات هوشمند باشگاه وفاداری (System Settings)
          </h2>
          <button
            onClick={handleSaveGlobalSettings}
            disabled={savingSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Setting 1: System Switch */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                وضعیت باشگاه مشتریان
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.loyalty_enabled === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      loyalty_enabled: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              فعال‌سازی تخفیف‌های خودکار VIP، نشان‌های کاربری در سبد خرید و پروفایل
            </p>
          </div>

          {/* Setting 2: Calculation Period */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
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
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="monthly_30d">
                حجم خرید ۳۰ روز اخیر (توصیه شده - حفظ انگیزه خرید مداوم)
              </option>
              <option value="all_time">
                کل حجم خریدهای موفق از ابتدا (مادام‌العمر / Cumulative)
              </option>
            </select>
            <p className="text-[11px] text-slate-400">
              سطح کاربر بر اساس مجموع خریدهای واجد شرایط در این بازه محاسبه
              می‌گردد.
            </p>
          </div>

          {/* Setting 3: Auto Level-Up */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
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
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ارتقای خودکار سطح بلافاصله پس از پرداخت یا تکمیل سفارش بدون نیاز
              به تایید دستی اپراتور
            </p>
          </div>
        </div>
      </div>

      {/* Loyalty Tiers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            سطوح فعال وفاداری در دیتابیس ({tiers.length} سطح)
          </h2>
          <span className="text-xs text-slate-400">
            ترتیب اعمال خودکار بر اساس آستانه خرید (از کمترین به بیشترین)
          </span>
        </div>

        {tiers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
            هیچ سطح وفاداری تعریف نشده است. با کلیک بر روی دکمه «تعریف سطح
            وفاداری جدید» شروع کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition space-y-4"
              >
                {/* Header Badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                      style={{
                        backgroundColor: `${tier.badge_color}20`,
                        color: tier.badge_color,
                        borderColor: `${tier.badge_color}45`,
                        borderWidth: 1,
                      }}
                    >
                      {renderTierIcon(tier.icon)}
                      {tier.name}
                    </span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      #{tier.code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] pt-1">
                    {tier.description || 'بدون توضیحات اختصاصی'}
                  </p>
                </div>

                {/* Key Numbers */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">تخفیف خودکار:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {tier.discount_percent > 0
                        ? `${tier.discount_percent}٪ تخفیف نقدی`
                        : 'بدون تخفیف (پایه)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">حداقل حجم خرید:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {tier.min_spend_toman > 0
                        ? `${tier.min_spend_toman.toLocaleString('fa-IR')} تومان`
                        : '۰ تومان (عضویت رایگان)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">اولویت صف اپراتور:</span>
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                        tier.queue_priority >= 50
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : tier.queue_priority >= 10
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tier.queue_priority >= 50
                        ? `VIP طلایی (${tier.queue_priority})`
                        : tier.queue_priority >= 10
                          ? `اولویت بالا (${tier.queue_priority})`
                          : `عادی (${tier.queue_priority})`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">کاربران این سطح:</span>
                    <span className="font-bold text-blue-400">
                      {(tier.user_count || 0).toLocaleString('fa-IR')} کاربر
                    </span>
                  </div>
                </div>

                {/* Perks Checklist */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                {editingTier
                  ? `ویرایش سطح وفاداری: ${editingTier.name}`
                  : 'تعریف سطح وفاداری جدید (VIP Tier)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    عنوان سطح (فارسی) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: طلایی (ریسلرها و همکاران)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    حداقل حجم خرید به تومان (Spend Threshold) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100000}
                    value={formMinSpend}
                    onChange={(e) => setFormMinSpend(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    {formMinSpend.toLocaleString('fa-IR')} تومان
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    درصد تخفیف نقدی خودکار (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={50}
                    step={0.5}
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    اعمال خودکار روی کلیه سبدهای خرید این کاربر
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    اولویت در صف اپراتور
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    placeholder="0=عادی، 10=بالا، 50=VIP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    آیکون نشان سطح
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
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

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    رنگ نشان (HEX)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">
                  توضیحات کوتاه سطح
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="توضیحاتی که کاربر در پنل خود درباره این سطح مشاهده می‌کند..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Dynamic Perks Manager */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPerk}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition shrink-0"
                  >
                    افزودن
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {formPerks.map((p, idx) => (
                    <span
                      key={p}
                      className="px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePerk(idx)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status & Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>سطح فعال و قابل محاسبه برای کاربران باشد</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-600/20 disabled:opacity-50"
                  >
                    {modalLoading ? 'در حال ثبت...' : 'ذخیره سطح وفاداری'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
