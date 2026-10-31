import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnnouncementPopupModal } from './components/AnnouncementPopupModal'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { NotificationProvider } from './components/vibefarsi/NotificationContext'
import { VibeThemeProvider } from './components/vibefarsi/ThemeContext'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { StorefrontPage } from './pages/StorefrontPage'
import { api, apiService } from './services/api'
import type { Order, ThemeSettings } from './types'
import { cleanMediaUrl } from './utils/brand'

// Lazy-loaded route components for optimized bundle size & code-splitting
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({
    default: m.AdminLoginPage,
  })),
)
const UserProfilePage = lazy(() =>
  import('./pages/UserProfilePage').then((m) => ({
    default: m.UserProfilePage,
  })),
)
const VirtualNumbersPage = lazy(() =>
  import('./pages/VirtualNumbersPage').then((m) => ({
    default: m.VirtualNumbersPage,
  })),
)
const OffersPage = lazy(() =>
  import('./pages/OffersPage').then((m) => ({ default: m.OffersPage })),
)
const BestSellersPage = lazy(() =>
  import('./pages/BestSellersPage').then((m) => ({
    default: m.BestSellersPage,
  })),
)
const CategoryDetailPage = lazy(() =>
  import('./pages/CategoryDetailPage').then((m) => ({
    default: m.CategoryDetailPage,
  })),
)
const OrderTrackingPage = lazy(() =>
  import('./pages/OrderTrackingPage').then((m) => ({
    default: m.OrderTrackingPage,
  })),
)
const PaymentCallbackPage = lazy(() =>
  import('./pages/PaymentCallbackPage').then((m) => ({
    default: m.PaymentCallbackPage,
  })),
)
const BlogListPage = lazy(() =>
  import('./pages/BlogListPage').then((m) => ({ default: m.BlogListPage })),
)
const BlogDetailPage = lazy(() =>
  import('./pages/BlogDetailPage').then((m) => ({
    default: m.BlogDetailPage,
  })),
)
const HelpListPage = lazy(() =>
  import('./pages/HelpListPage').then((m) => ({ default: m.HelpListPage })),
)
const HelpDetailPage = lazy(() =>
  import('./pages/HelpDetailPage').then((m) => ({
    default: m.HelpDetailPage,
  })),
)

const PageLoadingFallback = (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    <span className="text-xs font-sans">در حال بارگذاری...</span>
  </div>
)

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
        link.href = cleanMediaUrl(settings.site_favicon_url)
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
          <Suspense fallback={PageLoadingFallback}>
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

              {/* Payment Gateway Redirect Callbacks */}
              <Route
                path="/payment/callback/payping"
                element={
                  <PaymentCallbackPage onOrderUpdated={handleUpdateOrder} />
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
          </Suspense>
          <AnnouncementPopupModal />
        </BrowserRouter>
      </NotificationProvider>
    </VibeThemeProvider>
  )
}

export default App
