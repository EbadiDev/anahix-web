import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { NotificationProvider } from './components/vibefarsi/NotificationContext'
import { VibeThemeProvider } from './components/vibefarsi/ThemeContext'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogListPage } from './pages/BlogListPage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import { HelpDetailPage } from './pages/HelpDetailPage'
import { HelpListPage } from './pages/HelpListPage'
import { OrderTrackingPage } from './pages/OrderTrackingPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { StorefrontPage } from './pages/StorefrontPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { VirtualNumbersPage } from './pages/VirtualNumbersPage'
import { apiService } from './services/api'
import type { Order } from './types'

export function App() {
  const [orders, setOrders] = useState<Order[]>(() =>
    apiService.getCustomerOrders(),
  )

  const handleOrderCreated = (newOrder: Order) => {
    apiService.saveCustomerOrder(newOrder)
    setOrders((prev) => [newOrder, ...prev])
  }

  const handleUpdateOrder = (updated: Order) => {
    apiService.updateCustomerOrder(updated)
    setOrders((prev) =>
      prev.map((o) => (o.order_no === updated.order_no ? updated : o)),
    )
  }

  return (
    <VibeThemeProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Storefront */}
            <Route
              path="/"
              element={
                <StorefrontPage
                  orders={orders}
                  onOrderCreated={handleOrderCreated}
                />
              }
            />

            {/* Dedicated Product Detail Page (PDP) */}
            <Route
              path="/products/:slug"
              element={
                <ProductDetailPage
                  orders={orders}
                  onOrderCreated={handleOrderCreated}
                />
              }
            />

            {/* Dedicated Dynamic Category Page */}
            <Route path="/category/:slug" element={<CategoryDetailPage />} />

            {/* Customer Profile (Protected by Auth Gate) */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Public Order Tracking */}
            <Route
              path="/track"
              element={
                <OrderTrackingPage
                  orders={orders}
                  onUpdateOrder={handleUpdateOrder}
                />
              }
            />

            {/* Virtual Numbers Receiving SMS */}
            <Route path="/virtual-numbers" element={<VirtualNumbersPage />} />

            {/* Blog & Knowledge Base (SEO Engine) */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/help" element={<HelpListPage />} />
            <Route path="/help/:slug" element={<HelpDetailPage />} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Dashboard */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </VibeThemeProvider>
  )
}

export default App
