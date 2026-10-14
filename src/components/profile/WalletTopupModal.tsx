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
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface WalletTopupModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000, 2000000]

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                افزایش موجودی کیف پول
              </h3>
              <p className="text-[11px] text-slate-400">
                شارژ آنی با کارت‌های بانکی عضو شتاب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              کیف پول با موفقیت شارژ شد!
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              +{amount.toLocaleString('fa-IR')} تومان به موجودی اضافه گردید
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Amount input */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                مبلغ شارژ (تومان)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  dir="ltr"
                  value={
                    customAmount
                      ? Number(customAmount).toLocaleString('fa-IR')
                      : ''
                  }
                  onChange={handleCustomChange}
                  placeholder="۱۰۰,۰۰۰"
                  className="h-11 text-center text-lg font-bold rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleSelectPreset(val)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all text-xs ${
                    amount === val
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {val.toLocaleString('fa-IR')}
                </button>
              ))}
            </div>

            {/* Gateway Info */}
            <div className="space-y-2 pt-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                درگاه پرداخت الکترونیک
              </label>
              <div className="p-3 rounded-xl border border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="block text-xs">
                      کارت‌های بانکی عضو شتاب
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      شاپرک (پرداخت آنلاین با کلیه بانک‌های کشور)
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || amount < 10000}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  در حال اتصال به درگاه شاپرک...
                </>
              ) : (
                `پرداخت و شارژ ${amount.toLocaleString('fa-IR')} تومان`
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
