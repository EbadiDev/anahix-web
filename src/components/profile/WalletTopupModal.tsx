import {
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

interface WalletTopupModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000, 2000000]

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const WalletTopupModal: React.FC<WalletTopupModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(100000)
  const [customAmount, setCustomAmount] = useState<string>('100000')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSelectPreset = (val: number) => {
    setAmount(val)
    setCustomAmount(String(val))
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setCustomAmount(raw)
    setAmount(Number(raw) || 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount < 10000) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      const newBal = currentBalance + amount
      onSuccess(newBal)

      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    }, 1000)
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
      }}
      dir="rtl"
    >
      <div className="w-full max-w-md bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-5 text-foreground animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                افزایش موجودی کیف پول
              </h3>
              <p className="text-[11px] text-muted-foreground">
                شارژ آنی با کارت‌های بانکی عضو شبکه شتاب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-foreground">
              کیف پول با موفقیت شارژ شد!
            </h4>
            <p className="text-xs text-muted-foreground font-latin">
              +{toPersianDigits(amount.toLocaleString())} تومان به موجودی اضافه
              گردید
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Amount input */}
            <div className="space-y-1.5 text-right">
              <label className="block font-bold text-foreground">
                مبلغ شارژ (تومان)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={
                    customAmount
                      ? toPersianDigits(Number(customAmount).toLocaleString())
                      : ''
                  }
                  onChange={handleCustomChange}
                  placeholder="۱۰۰,۰۰۰"
                  className="w-full h-11 px-3 text-center text-lg font-black font-latin rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-brand transition-colors"
                  required
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((val) => {
                const isSelected = amount === val
                return (
                  <button
                    type="button"
                    key={`topup-preset-${val}`}
                    onClick={() => handleSelectPreset(val)}
                    className={`py-2 px-2 rounded-control border text-center duration-motion ease-motion active:scale-[0.98] transition-all text-xs font-latin cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-black border-transparent shadow-control'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {toPersianDigits(val.toLocaleString())}
                  </button>
                )
              })}
            </div>

            {/* Gateway Info */}
            <div className="space-y-1.5 pt-1 text-right">
              <label className="block font-bold text-foreground">
                درگاه پرداخت الکترونیک
              </label>
              <div className="p-3 rounded-control border border-border/60 bg-muted/30 text-foreground flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-brand shrink-0" />
                  <div>
                    <span className="block text-xs font-bold">
                      کارت‌های بانکی عضو شتاب
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      شاپرک (پرداخت آنلاین با کلیه بانک‌های کشور)
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Submit button: Graphite style - White with black text */}
            <button
              type="submit"
              disabled={loading || amount < 10000}
              className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال اتصال به درگاه شاپرک...</span>
                </>
              ) : (
                <span>
                  پرداخت و شارژ {toPersianDigits(amount.toLocaleString())} تومان
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
