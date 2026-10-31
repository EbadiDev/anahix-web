import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoadingState } from '../components/vibefarsi/LoadingState'
import { apiService } from '../services/api'
import type { Order } from '../types'

interface PaymentCallbackPageProps {
  onOrderUpdated?: (order: Order) => void
}

export const PaymentCallbackPage: React.FC<PaymentCallbackPageProps> = ({
  onOrderUpdated,
}) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code') || ''
    const refid = searchParams.get('refid') || ''
    const clientrefid =
      searchParams.get('clientrefid') || searchParams.get('order_no') || ''
    const status = searchParams.get('status') || ''

    const verify = async () => {
      try {
        const query = new URLSearchParams()
        if (code) query.set('code', code)
        if (refid) query.set('refid', refid)
        if (clientrefid) query.set('clientrefid', clientrefid)
        if (status) query.set('status', status)

        const res = await fetch(
          `/api/v1/payments/verify/payping?${query.toString()}&format=json`,
          {
            headers: { Accept: 'application/json' },
          },
        )
        const json = await res.json()
        if (res.ok && json.code === 200 && json.data) {
          if (onOrderUpdated) {
            onOrderUpdated(json.data)
          }
          apiService.saveCustomerOrder(json.data)
          navigate(
            `/track?order_no=${encodeURIComponent(json.data.order_number)}&payment_status=success`,
            { replace: true },
          )
          return
        }

        const orderNo = clientrefid || json.data?.order_number || ''
        navigate(
          `/track?order_no=${encodeURIComponent(orderNo)}&payment_status=failed&msg=${encodeURIComponent(json.msg || 'پرداخت از طریق درگاه بانکی تایید نشد')}`,
          { replace: true },
        )
      } catch (err: any) {
        setError(err.message || 'خطا در ارتباط با سرور تایید پرداخت')
      }
    }

    verify()
  }, [searchParams, navigate, onOrderUpdated])

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans p-4"
      dir="rtl"
    >
      <div className="max-w-md w-full p-8 rounded-surface border border-border/80 bg-card shadow-surface text-center space-y-4">
        {error ? (
          <div className="space-y-3">
            <span className="text-sm font-bold text-rose-500 block">
              خطا در فرآیند تایید پرداخت
            </span>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : (
          <LoadingState
            message="در حال اعتبارسنجی و تایید تراکنش بانکی..."
            subMessage="لطفاً شکیبا باشید، در حال اتصال به شبکه شاپرک و صدور لایسنس"
          />
        )}
      </div>
    </div>
  )
}
