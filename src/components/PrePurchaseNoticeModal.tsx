import { AlertCircle, Check, ShieldAlert } from 'lucide-react'
import type React from 'react'
import { createPortal } from 'react-dom'
import type { Product, ProductPlan } from '../types'
import { MarkdownRenderer } from './content/MarkdownRenderer'
import { ModalCloseButton } from './vibefarsi/ModalCloseButton'

interface PrePurchaseNoticeModalProps {
  isOpen: boolean
  product: Product
  plan?: ProductPlan | null
  onConfirm: () => void
  onClose: () => void
}

export const PrePurchaseNoticeModal: React.FC<PrePurchaseNoticeModalProps> = ({
  isOpen,
  product,
  plan,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null

  const notice = product.pre_purchase_notice || ''
  const snoozeDays = product.pre_purchase_snooze_days || 7

  const handleConfirmAndSnooze = () => {
    try {
      if (snoozeDays > 0) {
        const expiresAt = Date.now() + snoozeDays * 24 * 60 * 60 * 1000
        localStorage.setItem(
          `anahix_notice_snooze_${product.id}`,
          expiresAt.toString(),
        )
      } else {
        sessionStorage.setItem(`anahix_notice_snooze_${product.id}`, 'true')
      }
    } catch {}

    onConfirm()
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="relative w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col my-auto text-foreground animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground">
                نکات مهم قبل از خرید {product.title_fa}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {plan
                  ? `پلن انتخابی: ${plan.title}`
                  : 'لطفاً شرایط و نکات فعال‌سازی را مطالعه فرمایید'}
              </p>
            </div>
          </div>

          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Notice Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto text-xs space-y-3 leading-relaxed text-right scrollbar-thin">
          <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 space-y-2">
            <MarkdownRenderer content={notice} />
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              با تایید این بخش، تا{' '}
              {snoozeDays > 0 ? `${snoozeDays} روز آینده` : 'پایان سشن'} این
              پیام مجدداً به شما نمایش داده نخواهد شد.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/10">
          <button
            type="button"
            onClick={handleConfirmAndSnooze}
            className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>متوجه شدم و تایید می‌کنم (افزودن به سبد خرید)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
