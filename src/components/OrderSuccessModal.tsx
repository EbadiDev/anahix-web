import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import type { Order } from '../types'
import { ModalCloseButton } from './vibefarsi/ModalCloseButton'
import { useNotification } from './vibefarsi/NotificationContext'

interface OrderSuccessModalProps {
  isOpen: boolean
  order: Order | null
  onClose: () => void
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  const navigate = useNavigate()
  const { success: notifySuccess } = useNotification()
  const [copiedKey, setCopiedKey] = useState(false)

  if (!isOpen || !order) return null

  // Determine if instant or manual
  const isInstant =
    order.status === 'COMPLETED' ||
    Boolean(order.delivered_link) ||
    Boolean(order.delivered_credentials) ||
    order.delivered_items?.some((i) => Boolean(i.payload))

  const payload =
    order.delivered_link || order.delivered_items?.[0]?.payload || ''

  const isLink = payload.startsWith('http://') || payload.startsWith('https://')

  const handleCopyPayload = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    notifySuccess('کپی شد', 'اطلاعات لایسنس در کلیپ‌بورد کپی گردید.')
    setTimeout(() => setCopiedKey(false), 2500)
  }

  const handleGoToTrack = () => {
    onClose()
    navigate(`/track?order_no=${encodeURIComponent(order.order_no)}`)
  }

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="relative w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-overlay overflow-hidden flex flex-col my-auto text-foreground animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Badge */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-control flex items-center justify-center font-bold shadow-control ${
                isInstant
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {isInstant ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  {isInstant
                    ? 'خرید شما با موفقیت انجام شد!'
                    : 'سفارش شما با موفقیت ثبت شد'}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-control font-bold ${
                    isInstant
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  {isInstant ? 'تحویل آنی ۰ ثانیه' : 'در صف اپراتور'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                شماره پیگیری سفارش:{' '}
                <span className="font-mono font-latin font-bold text-foreground">
                  #{order.order_no}
                </span>
              </p>
            </div>
          </div>

          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-right text-xs">
          {/* Instant Delivery Result Box */}
          {isInstant ? (
            <div className="p-4 rounded-surface border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4" />
                  اطلاعات تحویل سرویس:
                </span>
                <span className="text-[11px] text-muted-foreground font-mono font-latin">
                  {order.product_title}
                </span>
              </div>

              {payload && (
                <div className="p-3 rounded-control bg-card border border-border/60 flex items-center justify-between gap-2">
                  <span className="font-mono font-latin font-bold text-xs sm:text-sm text-foreground truncate select-all">
                    {payload}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isLink ? (
                      <a
                        href={payload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ورود به لینک</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyPayload(payload)}
                        className="h-8 px-2.5 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey ? 'کپی شد' : 'کپی کد'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {order.delivered_credentials && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between bg-card p-2 rounded-control border border-border/40 font-mono font-latin">
                    <span className="text-muted-foreground font-sans text-xs">
                      ایمیل:
                    </span>
                    <span className="font-bold">
                      {order.delivered_credentials.email}
                    </span>
                  </div>
                  <div className="flex justify-between bg-card p-2 rounded-control border border-border/40 font-mono font-latin">
                    <span className="text-muted-foreground font-sans text-xs">
                      کلمه عبور:
                    </span>
                    <span className="font-bold">
                      {order.delivered_credentials.password}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                این اطلاعات برای شما پیامک شده و همیشه در بخش «سفارش‌های من» پنل
                کاربری نیز در دسترس است.
              </p>
            </div>
          ) : (
            /* Manual Operator Queue Notice */
            <div className="p-4 rounded-surface border border-brand/30 bg-brand/5 space-y-3">
              <div className="flex items-center gap-2 text-brand font-bold text-xs">
                <Clock className="w-4 h-4 shrink-0" />
                <span>سفارش شما در صف بررسی کارشناسان آناهیکس قرار گرفت</span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                کارشناس ما در سریع‌ترین زمان ممکن اقدام به بررسی، ارتقا یا
                فعال‌سازی اکانت شما خواهد نمود.
              </p>

              <div className="flex items-center justify-between p-2.5 rounded-control bg-card border border-border/60 text-[11px]">
                <span className="text-muted-foreground font-bold">
                  زمان تقریبی انجام سفارش:
                </span>
                <span className="font-bold text-foreground">
                  ۱۰ الی ۳۰ دقیقه
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  در صورت نیاز به تبادل کد ۲FA، در بخش پیگیری سفارش به شما اطلاع
                  داده می‌شود.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border/60 bg-muted/10 space-y-2">
          <button
            type="button"
            onClick={handleGoToTrack}
            className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
          >
            <span>مشاهده و رهگیری زنده سفارش در سامانه (/track)</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
