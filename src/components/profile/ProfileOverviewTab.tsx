import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Gift,
  Package,
  Radio,
  ShoppingCart,
  Sparkles,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import type { CustomerProfile, Order, VirtualNumberOrder } from '../../types'
import {
  formatDisplayPhone,
  formatToman,
  toPersianDigits,
} from '../../utils/formatters'

interface ProfileOverviewTabProps {
  customer: CustomerProfile
  orders: Order[]
  virtualOrders: VirtualNumberOrder[]
  onSelectTab: (tabId: string) => void
  onOpenWalletModal: () => void
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  customer,
  orders,
  virtualOrders,
  onSelectTab,
  onOpenWalletModal,
}) => {
  const activeNumbers = virtualOrders.filter(
    (v) => v.status === 'PENDING' || v.status === 'RECEIVED',
  )
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED')
  const pendingOrders = orders.filter(
    (o) =>
      o.status !== 'COMPLETED' &&
      o.status !== 'REFUNDED' &&
      o.status !== 'FAILED',
  )
  const latestOrder = orders[0] || null

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'diamond':
        return 'عضو الماس 💎'
      case 'gold':
        return 'عضو طلایی 👑'
      case 'silver':
        return 'عضو نقره‌ای ⭐'
      default:
        return 'عضو برنزی (سطح پایه)'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Bento Grid KPIs - Graphite Technical Minimal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wallet Balance */}
        <div className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground flex flex-col justify-between hover:border-border duration-motion ease-motion transition-all shadow-surface group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">
              موجودی کیف پول
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <Wallet className="w-4 h-4 text-brand" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground font-latin">
              {formatToman(customer.balance_toman || 0)}
              <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                تومان
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              موجودی نقدی در دسترس
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="mt-3 w-full h-8 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1 cursor-pointer"
          >
            + شارژ کیف پول
          </button>
        </div>

        {/* KPI 2: Total Orders */}
        <div
          onClick={() => onSelectTab('orders')}
          className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground flex flex-col justify-between hover:border-border duration-motion ease-motion transition-all shadow-surface cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">
              کل سفارش‌ها
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <ShoppingCart className="w-4 h-4 text-foreground" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground font-latin">
              {toPersianDigits(orders.length)}
              <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                سفارش
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {toPersianDigits(completedOrders.length)} سفارش تحویل شده
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors pt-1 border-t border-border/40">
            <span>مشاهده تاریخچه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Active AI Subscriptions */}
        <div
          onClick={() => onSelectTab('products')}
          className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground flex flex-col justify-between hover:border-border duration-motion ease-motion transition-all shadow-surface cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">
              اشتراک‌های فعال
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground font-latin">
              {toPersianDigits(completedOrders.length)}
              <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                سرویس
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              اکانت‌های فعال قانونی
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors pt-1 border-t border-border/40">
            <span>مدیریت لایسنس‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Active Virtual Numbers */}
        <div
          onClick={() => onSelectTab('numbers')}
          className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground flex flex-col justify-between hover:border-border duration-motion ease-motion transition-all shadow-surface cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">
              شماره‌های مجازی من
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center relative shadow-control">
              <Radio className="w-4 h-4 text-brand" />
              {activeNumbers.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground font-latin">
              {toPersianDigits(activeNumbers.length)}
              <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                شماره
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeNumbers.length > 0
                ? '🟢 در انتظار دریافت پیامک'
                : 'شماره فعالی در حال حاضر ندارید'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors pt-1 border-t border-border/40">
            <span>میزکار پیامک</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Dynamic Live Customer Cards from Database (Replacing the 3 static hardcoded boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: VIP Club & Loyalty Status */}
        <div
          onClick={() => onSelectTab('loyalty')}
          className="p-4 rounded-surface border border-border/60 bg-card hover:border-border duration-motion ease-motion transition-all shadow-surface flex items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
              <Crown className="w-5 h-5 text-brand" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-foreground group-hover:text-foreground/80 transition-colors truncate">
                باشگاه مشتریان VIP
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {getTierLabel(customer.tier)}
              </p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:-translate-x-1" />
        </div>

        {/* Card 2: Latest / Pending Order Status */}
        <div
          onClick={() => onSelectTab('orders')}
          className="p-4 rounded-surface border border-border/60 bg-card hover:border-border duration-motion ease-motion transition-all shadow-surface flex items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-foreground group-hover:text-foreground/80 transition-colors truncate">
                {pendingOrders.length > 0
                  ? 'سفارش در جریان'
                  : 'آخرین سفارش ثبت‌شده'}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {latestOrder
                  ? `${latestOrder.product_title || 'سفارش'} (#${latestOrder.order_no})`
                  : 'هنوز سفارشی ثبت نشده است'}
              </p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:-translate-x-1" />
        </div>

        {/* Card 3: Referral & Affiliate Earnings */}
        <div
          onClick={() => onSelectTab('referral')}
          className="p-4 rounded-surface border border-border/60 bg-card hover:border-border duration-motion ease-motion transition-all shadow-surface flex items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
              <Gift className="w-5 h-5 text-brand" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-foreground group-hover:text-foreground/80 transition-colors truncate">
                همکاری در فروش و معرف
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                موجودی درآمد:{' '}
                {formatToman(customer.referral_balance_toman || 0)} تومان
              </p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:-translate-x-1" />
        </div>
      </div>

      {/* 3. Recent Activity Timeline */}
      <div className="rounded-surface border border-border/60 bg-card p-5 shadow-surface duration-motion ease-motion">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            فعالیت‌های اخیر حساب کاربری
          </h3>
          <span className="text-[11px] text-muted-foreground">
            ثبت خودکار رویدادهای امنیتی و تراکنش‌ها
          </span>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">
                  ورود موفق به حساب کاربری
                </span>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  کد ورود یکبارمصرف پیامکی با موفقیت تایید شد (نشست فعال فعلی)
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                هم‌اکنون
              </span>
            </div>
          </div>

          {orders.slice(0, 3).map((order) => (
            <div
              key={order.order_no}
              className="flex items-start gap-3 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">
                    ثبت سفارش {order.product_title}
                  </span>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    شماره سفارش: #{order.order_no} • مبلغ:{' '}
                    {formatToman(order.amount_toman)} تومان
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {new Date(order.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">
                  ایجاد و اعتبارسنجی اولیه حساب کاربری
                </span>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {customer.phone && !/^098[0-9a-f]{8}$/i.test(customer.phone)
                    ? `شماره تلفن همراه ${formatDisplayPhone(customer.phone)} با موفقیت در سامانه فعال شد`
                    : `حساب کاربری با آدرس ایمیل ${customer.email || 'شما'} با موفقیت فعال گردید`}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {customer.created_at
                  ? new Date(customer.created_at).toLocaleDateString('fa-IR')
                  : 'عضویت اولیه'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
