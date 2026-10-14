import type React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { OrderTrackingView } from '../components/OrderTrackingView'
import type { Order } from '../types'

interface OrderTrackingPageProps {
  orders: Order[]
  onUpdateOrder: (order: Order) => void
  balance?: number
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  orders,
  onUpdateOrder,
}) => {
  const [searchParams] = useSearchParams()
  const initialOrderNo = searchParams.get('order_no') || ''

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <OrderTrackingView
          orders={orders}
          onUpdateOrder={onUpdateOrder}
          initialOrderNo={initialOrderNo}
        />
      </main>
    </div>
  )
}
