import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnnouncementPopupModal } from './components/AnnouncementPopupModal'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { NotificationProvider } from './components/vibefarsi/NotificationContext'
import { VibeThemeProvider } from './components/vibefarsi/ThemeContext'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { BestSellersPage } from './pages/BestSellersPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { BlogListPage } from './pages/BlogListPage'
import { CategoryDetailPage } from './pages/CategoryDetailPage'
import { HelpDetailPage } from './pages/HelpDetailPage'
import { HelpListPage } from './pages/HelpListPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OffersPage } from './pages/OffersPage'
import { OrderTrackingPage } from './pages/OrderTrackingPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { StorefrontPage } from './pages/StorefrontPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { VirtualNumbersPage } from './pages/VirtualNumbersPage'
import { api, apiService } from './services/api'
import type { Order, ThemeSettings } from './types'

export function App() {
  const [orders, setOrders] = useState<Order[]>(() =>
    apiService.getCustomerOrders(),
  )

  // Dynamic Site Branding, Favicon & SEO Sync from Database
  useEffect(() => {
    const applyThemeToDocument = (settings: ThemeSettings) => {
      if (settings.site_name_fa) {
        try {
          localStorage.setItem('site_name_fa', settings.site_name_fa)
        } catch {}
      }

      // 1. Meta Title & Document Title
      if (settings.meta_title) {
        document.title = settings.meta_title
      } else if (settings.site_name_fa) {
        const en = settings.site_name_en ? ` (${settings.site_name_en})` : ''
        document.title = `${settings.site_name_fa}${en} | پلتفرم تحویل فوری اشتراک‌های هوش مصنوعی`
      }

      // 2. FavIcon
      if (settings.site_favicon_url) {
        let link: HTMLLinkElement | null =
          document.querySelector("link[rel*='icon']")
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = settings.site_favicon_url
      }

      // 3. Meta Description
      if (settings.meta_description) {
        const metaDesc = document.querySelector("meta[name='description']")
        if (metaDesc) {
          metaDesc.setAttribute('content', settings.meta_description)
        }
      }

      // 4. Meta Keywords
      if (settings.meta_keywords) {
        let metaKeywords = document.querySelector("meta[name='keywords']")
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta')
          metaKeywords.setAttribute('name', 'keywords')
          document.head.appendChild(metaKeywords)
        }
        metaKeywords.setAttribute('content', settings.meta_keywords)
      }
    }

    api
      .getThemeSettings()
      .then((settings) => {
        if (settings) applyThemeToDocument(settings)
      })
      .catch(() => {})

    const handleThemeEvent = (e: any) => {
      if (e.detail) {
        applyThemeToDocument(e.detail)
      }
    }

    window.addEventListener('anahix:theme:updated', handleThemeEvent)
    return () =>
      window.removeEventListener('anahix:theme:updated', handleThemeEvent)
  }, [])

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

            {/* Promotional Offers & Banners Showcase */}
            <Route path="/offers" element={<OffersPage />} />

            {/* Best Sellers Page */}
            <Route path="/best-sellers" element={<BestSellersPage />} />

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

            {/* Admin Dashboard (Protected by Admin Auth Gate) */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboardPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            {/* 404 Not Found Page for unmatched URLs */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <AnnouncementPopupModal />
        </BrowserRouter>
      </NotificationProvider>
    </VibeThemeProvider>
  )
}

export default App
