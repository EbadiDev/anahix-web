import {
  CheckCircle2,
  Headphones,
  KeyRound,
  Mail,
  Phone,
  ShieldAlert,
  Trash2,
  UserCheck,
} from 'lucide-react'
import type React from 'react'
import type { Order } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface OperatorDeskViewProps {
  orders: Order[]
  onRequest2FA: (orderNo: string) => void
  onCompleteOrder: (orderNo: string) => void
}

export const OperatorDeskView: React.FC<OperatorDeskViewProps> = ({
  orders,
  onRequest2FA,
  onCompleteOrder,
}) => {
  const modeCOrders = orders.filter(
    (o) => o.delivery_mode === 'UPGRADE_EXISTING',
  )

  return (
    <div className="space-y-6">
      {/* Operator Header Bar */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                میز کار اپراتور آناهیکس (Operator Queue Desk)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                مدیریت سفارشات نیازمند ورود به اکانت کاربر، تبادل لایو ۲FA و
                ارتقای قانونی
              </p>
            </div>
          </div>

          <Badge variant="blue" className="px-3 py-1 font-semibold text-xs">
            سفارشات در صف:{' '}
            {modeCOrders.filter((o) => o.status !== 'COMPLETED').length} مورد
          </Badge>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {modeCOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-foreground">
              صف کاری اپراتور خالی است
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              تمامی سفارشات فعال‌سازی روی اکانت با موفقیت تکمیل شده‌اند.
            </p>
          </Card>
        ) : (
          modeCOrders.map((order) => {
            const isCompleted = order.status === 'COMPLETED'
            const isWaiting2FA = order.status === 'WAITING_CUSTOMER_2FA'

            return (
              <Card
                key={order.order_no}
                className={`p-6 transition-all ${
                  isWaiting2FA
                    ? 'border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-latin text-base font-bold text-blue-600 dark:text-blue-400">
                        {order.order_no}
                      </span>
                      <Badge variant="amber" className="text-[11px]">
                        <UserCheck className="h-3 w-3 ml-1" />
                        {order.product_title}
                      </Badge>
                      {isCompleted && (
                        <Badge variant="emerald" className="text-[11px]">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          تکمیل و رمزها پاک شد
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{order.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{order.account_email || 'ایمیل ثبت نشده'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-latin" dir="ltr">
                    <div className="text-base font-bold text-foreground">
                      {order.amount_toman.toLocaleString('fa-IR')} تومان
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      درگاه: {order.payment_platform}
                    </div>
                  </div>
                </div>

                {/* 2FA Waiting State */}
                {isWaiting2FA && (
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>
                        درخواست ۲FA برای کاربر ارسال شد. در انتظار وارد کردن کد
                        توسط کاربر...
                      </span>
                    </div>
                    <span className="font-bold text-[11px]">وضعیت: لایو</span>
                  </div>
                )}

                {/* 2FA Code Received */}
                {order.two_factor_code && (
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>کد ۲FA کاربر دریافت شد:</span>
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 font-mono text-sm font-black text-white tracking-widest">
                        {order.two_factor_code}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      اکنون می‌توانید وارد شده و خرید را نهایی کنید.
                    </span>
                  </div>
                )}

                {/* Operator Actions */}
                {!isCompleted && (
                  <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequest2FA(order.order_no)}
                      className="text-xs h-9"
                    >
                      <KeyRound className="h-3.5 w-3.5 ml-1.5 text-blue-600 dark:text-blue-400" />
                      <span>درخواست کد تایید ۲FA از کاربر</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => onCompleteOrder(order.order_no)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 ml-1.5" />
                      <span>تکمیل موفق و پاکسازی امن رمزها (Zeroize)</span>
                    </Button>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
