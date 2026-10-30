import {
  AlertCircle,
  Coins,
  CreditCard,
  Crown,
  Landmark,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../services/api'
import type {
  CartItem,
  CouponValidation,
  CustomerLoyaltyProfile,
  CustomerProfile,
  PaymentGateway,
  Product,
} from '../types'
import { getSiteBrandName } from '../utils/brand'
import { formatToman } from '../utils/formatters'
import { validateIranianMobile } from '../utils/validators'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface CheckoutModalProps {
  product?: Product | null
  cartItems?: CartItem[]
  coupon?: CouponValidation | null
  payments: PaymentGateway[]
  customer?: CustomerProfile | null
  userBalance?: number
  onClose: () => void
  onSubmit: (data: {
    product_id?: string | number
    items?: { product_id: string; quantity: number }[]
    payment_platform: string
    customer_phone: string
    account_email?: string
    account_password?: string
    coupon_code?: string
  }) => Promise<void>
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  cartItems = [],
  coupon,
  payments,
  customer,
  userBalance = 0,
  onClose,
  onSubmit,
}) => {
  const defaultGateway = payments.find((p) => p.is_default) || payments[0]
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    defaultGateway?.platform || 'balance',
  )
  const [phone, setPhone] = useState(customer?.phone || '')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loyaltyProfile, setLoyaltyProfile] =
    useState<CustomerLoyaltyProfile | null>(null)

  useEffect(() => {
    if (customer?.phone) {
      apiService
        .getCustomerLoyaltyProfile(customer.phone)
        .then((lp) => setLoyaltyProfile(lp))
        .catch(() => {})
    }
  }, [customer?.phone])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isCartMode = cartItems.length > 0 && !product
  const subtotal = isCartMode
    ? cartItems.reduce(
        (sum, item) => sum + item.product.price_toman * item.quantity,
        0,
      )
    : product?.price_toman || 0

  let couponDiscount = 0
  if (coupon?.valid) {
    if (coupon.discount_type === 'percentage') {
      couponDiscount = (subtotal * coupon.discount_value) / 100
    } else {
      couponDiscount = coupon.discount_value
    }
    if (couponDiscount > subtotal) couponDiscount = subtotal
  }

  // Calculate dynamic loyalty discount from database tier (only when system is active)
  const isLoyaltyActive =
    loyaltyProfile?.system_status !== 'disabled' &&
    loyaltyProfile?.system_status !== 'coming_soon'
  const loyaltyDiscountPercent = isLoyaltyActive
    ? loyaltyProfile?.active_discount_pct || 0
    : 0
  const loyaltyDiscount =
    loyaltyDiscountPercent > 0 ? (subtotal * loyaltyDiscountPercent) / 100 : 0

  const totalDiscount = Math.min(subtotal, couponDiscount + loyaltyDiscount)

  const selectedGateway =
    payments.find((p) => p.platform === selectedPlatform) || defaultGateway
  const fee = selectedGateway
    ? (Math.max(0, subtotal - totalDiscount) * selectedGateway.fee_percentage) /
      100
    : 0
  const finalAmount = Math.max(0, subtotal - totalDiscount) + fee

  const needsAccountUpgrade =
    product?.delivery_mode === 'UPGRADE_EXISTING' ||
    cartItems.some((it) => it.product.delivery_mode === 'UPGRADE_EXISTING')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const mobCheck = validateIranianMobile(phone)
    if (!mobCheck.valid) {
      setErrorMsg(
        mobCheck.error ||
          'لطفا یک شماره موبایل معتبر جهت دریافت فاکتور و اطلاع‌رسانی وارد کنید.',
      )
      return
    }

    if (needsAccountUpgrade) {
      if (!accountEmail || !accountPassword) {
        setErrorMsg(
          'جهت فعال‌سازی روی اکانت شما، ورود ایمیل و پسورد اکانت الزامی است.',
        )
        return
      }
    }

    if (selectedPlatform === 'balance') {
      if (!customer) {
        setErrorMsg(
          'جهت پرداخت از موجودی کیف پول، ابتدا باید وارد حساب کاربری خود شوید.',
        )
        return
      }
      if (userBalance < finalAmount) {
        setErrorMsg(
          `موجودی کیف پول شما (${formatToman(userBalance)} تومان) کافی نیست. لطفا درگاه شتاب را انتخاب کنید یا حساب خود را شارژ نمایید.`,
        )
        return
      }
    }

    setLoading(true)
    try {
      if (isCartMode) {
        await onSubmit({
          items: cartItems.map((it) => ({
            product_id: String(it.product.id),
            quantity: it.quantity,
          })),
          payment_platform: selectedPlatform,
          customer_phone: phone,
          account_email: accountEmail || undefined,
          account_password: accountPassword || undefined,
          coupon_code: coupon?.code,
        })
      } else if (product) {
        await onSubmit({
          product_id: product?.id,
          payment_platform: selectedPlatform,
          customer_phone: phone,
          account_email: accountEmail || undefined,
          account_password: accountPassword || undefined,
          coupon_code: coupon?.code,
        })
      }
    } catch {
      setErrorMsg('خطایی در پردازش سفارش رخ داد. لطفا دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const getGatewayIcon = (iconType: string) => {
    switch (iconType) {
      case 'wallet':
        return (
          <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        )
      case 'credit-card':
      case 'zarinpal':
        return (
          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        )
      case 'bank':
        return <Landmark className="h-5 w-5 text-sky-600 dark:text-sky-400" />
      case 'bitcoin':
      case 'crypto':
        return <Coins className="h-5 w-5 text-amber-500" />
      default:
        return <Wallet className="h-5 w-5 text-blue-600" />
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in-0"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl text-foreground max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              تکمیل سفارش و پرداخت
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCartMode
                ? `${cartItems.length} قلم کالا در سبد خرید`
                : product?.title_fa || 'محصول انتخابی'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Customer Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              شماره موبایل جهت ارسال رسید و پیامک فعال‌سازی:
            </label>
            <Input
              type="tel"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Mode C: Personal Account Credentials */}
          {needsAccountUpgrade && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>اطلاعات اکانت شخصی شما جهت ارتقا قانونی</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  ایمیل اکانت:
                </label>
                <Input
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  رمز عبور اکانت:
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="••••••••••••"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? 'مخفی' : 'نمایش'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground pt-1">
                <Lock className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span>
                  <b>ضمانت امنیت {getSiteBrandName('پلی شاپ')}:</b> رمز عبور با
                  AES-256-GCM رمزنگاری شده و بلافاصله پس از تکمیل سفارش، برای
                  همیشه از سرور پاکسازی (Zeroize) خواهد شد.
                </span>
              </div>
            </div>
          )}

          {/* Payment Gateways */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              انتخاب روش پرداخت:
            </label>
            <div className="space-y-2">
              {payments
                .filter(
                  (p) =>
                    p.display_mode !== 'hidden' &&
                    (p.enable !== false ||
                      p.display_mode === 'disabled_visible'),
                )
                .map((p) => {
                  const isDisabled = p.display_mode === 'disabled_visible'
                  const isSelected =
                    selectedPlatform === p.platform && !isDisabled
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isDisabled) return
                        setSelectedPlatform(p.platform)
                      }}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                        isDisabled
                          ? 'opacity-55 cursor-not-allowed bg-muted/20 border-border/40 select-none'
                          : isSelected
                            ? 'border-blue-600 bg-blue-500/10 shadow-sm shadow-blue-500/10 ring-1 ring-blue-600 cursor-pointer'
                            : 'border-border bg-card hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border">
                          {p.icon_url ? (
                            <img
                              src={p.icon_url}
                              alt={p.name}
                              className={`w-5 h-5 object-contain rounded-xs ${isDisabled ? 'grayscale opacity-70' : ''}`}
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display =
                                  'none'
                              }}
                            />
                          ) : (
                            getGatewayIcon(p.icon_type)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {p.name}
                            </span>
                            {isDisabled ? (
                              <Badge
                                variant="amber"
                                className="text-[10px] py-0 px-1.5 font-bold"
                              >
                                موقتاً غیرفعال
                              </Badge>
                            ) : p.is_default ? (
                              <Badge
                                variant="blue"
                                className="text-[10px] py-0 px-1.5 font-normal"
                              >
                                پیش‌فرض
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isDisabled
                              ? 'این روش پرداخت در حال حاضر موقتاً در دسترس نیست'
                              : p.platform === 'balance'
                                ? customer
                                  ? `موجودی شما: ${formatToman(userBalance)} تومان`
                                  : 'پرداخت از موجودی حساب (نیاز به ورود)'
                                : p.description_fa}
                          </p>
                        </div>
                      </div>

                      <div className="text-left font-latin text-xs" dir="ltr">
                        {p.fee_percentage === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            بدون کارمزد
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            کارمزد: {p.fee_percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>قیمت کل اقلام:</span>
              <span className="font-bold text-foreground">
                {formatToman(subtotal)} تومان
              </span>
            </div>

            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  تخفیف وفاداری ({loyaltyProfile?.current_tier?.name || 'VIP'} -{' '}
                  {loyaltyDiscountPercent}٪):
                </span>
                <span className="font-bold">
                  - {formatToman(Math.round(loyaltyDiscount))} تومان
                </span>
              </div>
            )}

            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>کد تخفیف ({coupon?.code}):</span>
                <span>- {formatToman(Math.round(couponDiscount))} تومان</span>
              </div>
            )}

            {fee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>کارمزد درگاه:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatToman(fee)} تومان
                </span>
              </div>
            )}
            <div className="flex justify-between items-baseline border-t border-border pt-2 text-sm font-bold">
              <span>مبلغ نهایی پرداخت:</span>
              <span className="text-base text-blue-600 dark:text-blue-400">
                {formatToman(finalAmount)} تومان
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  <span>در حال پردازش...</span>
                </>
              ) : (
                <span>تایید و پرداخت نهایی</span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              انصراف
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
