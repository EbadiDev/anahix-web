import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Radio,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'
import type { CustomerProfile, Order, VirtualNumberOrder } from '../../types'
import { Button } from '../ui/button'

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
  const activeProductsCount = completedOrders.length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Bento Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Wallet Balance */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              موجودی کیف پول
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {(customer.balance_toman || 0).toLocaleString('fa-IR')}
              <span className="text-xs font-normal text-slate-400 mr-1.5">
                تومان
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              موجودی نقدی در دسترس
            </p>
          </div>
          <Button
            size="sm"
            onClick={onOpenWalletModal}
            className="mt-3 w-full h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold"
          >
            + شارژ کیف پول
          </Button>
        </div>

        {/* KPI 2: Total Orders */}
        <div
          onClick={() => onSelectTab('orders')}
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              کل سفارش‌ها
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {orders.length.toLocaleString('fa-IR')}
              <span className="text-xs font-normal text-slate-400 mr-1.5">
                سفارش
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {completedOrders.length.toLocaleString('fa-IR')} سفارش تحویل شده
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors pt-1">
            <span>مشاهده تاریخچه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 3: Active AI Subscriptions */}
        <div
          onClick={() => onSelectTab('products')}
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              اشتراک‌های فعال
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeProductsCount.toLocaleString('fa-IR')}
              <span className="text-xs font-normal text-slate-400 mr-1.5">
                سرویس
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              اکانت‌های هوش مصنوعی فعال
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors pt-1">
            <span>مدیریت لایسنس‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KPI 4: Active Virtual Numbers */}
        <div
          onClick={() => onSelectTab('numbers')}
          className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              شماره‌های مجازی من
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center relative">
              <Radio className="w-4 h-4" />
              {activeNumbers.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeNumbers.length.toLocaleString('fa-IR')}
              <span className="text-xs font-normal text-slate-400 mr-1.5">
                شماره
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeNumbers.length > 0
                ? '🟢 در انتظار دریافت پیامک'
                : 'شماره فعالی در حال حاضر ندارید'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors pt-1">
            <span>میزکار پیامک</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Quick Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 flex items-center gap-3 transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              خرید اکانت هوش مصنوعی
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تحویل فوری ChatGPT، Claude و Cursor
            </p>
          </div>
        </Link>

        <Link
          to="/virtual-numbers"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 flex items-center gap-3 transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              دریافت شماره مجازی (SMS)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ارسال پیامک از ۱۵۰+ کشور جهان
            </p>
          </div>
        </Link>

        <div
          onClick={() => onSelectTab('support')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 flex items-center gap-3 transition-all shadow-2xs cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              پشتیبانی و تیکت آنلاین
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              پاسخگویی آنی اپراتور ۲۴/۷
            </p>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity Timeline */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            فعالیت‌های اخیر حساب
          </h3>
          <span className="text-[11px] text-slate-400">
            ثبت خودکار رویدادهای امنیتی و تراکنش‌ها
          </span>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ورود موفق به حساب کاربری
                </span>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  کد ورود یکبارمصرف پیامکی با موفقیت تایید شد (آی‌پی فعلی)
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                هم‌اکنون
              </span>
            </div>
          </div>

          {orders.slice(0, 3).map((order) => (
            <div
              key={order.order_no}
              className="flex items-start gap-3 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ثبت سفارش {order.product_title}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    شماره سفارش: {order.order_no} • مبلغ:{' '}
                    {order.amount_toman.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(order.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-1.5 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ایجاد و اعتبارسنجی اولیه حساب کاربری
                </span>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  شماره تلفن همراه {customer.phone} با موفقیت در سامانه فعال شد
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
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
