import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminBannersView } from '../../components/admin/AdminBannersView'
import { AdminBIAnalyticsView } from '../../components/admin/AdminBIAnalyticsView'
import { AdminCalendarView } from '../../components/admin/AdminCalendarView'
import { AdminContentView } from '../../components/admin/AdminContentView'
import { AdminCoreSettingsView } from '../../components/admin/AdminCoreSettingsView'
import { AdminCouponsView } from '../../components/admin/AdminCouponsView'
import { AdminLoyaltyTiersView } from '../../components/admin/AdminLoyaltyTiersView'
import { AdminOperationsCenterView } from '../../components/admin/AdminOperationsCenterView'
import { AdminOrdersTableView } from '../../components/admin/AdminOrdersTableView'
import {
  AdminSidebar,
  type AdminTabType,
} from '../../components/admin/AdminSidebar'
import { AdminSupportAndReviewsView } from '../../components/admin/AdminSupportAndReviewsView'
import { AdminUsersView } from '../../components/admin/AdminUsersView'
import { Header } from '../../components/Header'
import { apiService } from '../../services/api'

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTabType>('bi-analytics')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [reviewsPendingCount, setReviewsPendingCount] = useState<number>(0)
  const [ticketsPendingCount, setTicketsPendingCount] = useState<number>(0)
  const [queueCount, setQueueCount] = useState<number>(0)

  // Auth Guard & Automatic Admin Session Handshake
  useEffect(() => {
    const initAdminSession = async () => {
      // 1. If user is logged in as an admin customer on storefront, exchange token for fresh Admin JWT
      if (apiService.isCustomerLoggedIn()) {
        const exchanged = await apiService.exchangeAdminToken()
        if (exchanged) {
          const admUser = apiService.getAdminUser()
          setAdminUser(
            admUser || {
              username: 'admin',
              full_name: 'مدیر کل سیستم',
              role: 'super_admin',
            },
          )
          return
        }
      }

      // 2. Check existing admin token
      const token = apiService.getAdminToken()
      if (!token) {
        navigate('/admin/login')
        return
      }

      const user = apiService.getAdminUser()
      if (user) {
        setAdminUser(user)
      } else {
        apiService
          .getCustomerProfile()
          .then((cust) => {
            if (cust?.is_admin) {
              const adm = {
                username: cust.email || cust.phone,
                full_name: cust.full_name || 'مدیر سیستم',
                role: 'super_admin',
              }
              apiService.setAdminUser(adm)
              setAdminUser(adm)
            } else {
              navigate('/admin/login')
            }
          })
          .catch(() => {
            navigate('/admin/login')
          })
      }
    }

    initAdminSession()
  }, [navigate])

  const handleLogout = () => {
    apiService.clearAdminToken()
    navigate('/admin/login')
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-200"
    >
      {/* Responsive Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        adminUser={adminUser}
        queueCount={queueCount}
        ticketsPendingCount={ticketsPendingCount}
        reviewsPendingCount={reviewsPendingCount}
        vnEnabled={true}
        vnStatus="active"
        deliveryEnabled={true}
        deliveryStatus="active"
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header with Profile, Wallet, and Mobile Menu Toggle */}
        <Header
          hideNavLinks
          hideAnnouncementBar
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Content Container */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
          {/* TAB: BI & ANALYTICS DASHBOARD */}
          {activeTab === 'bi-analytics' && <AdminBIAnalyticsView />}

          {/* TAB: JALALI CALENDAR & HOLIDAYS */}
          {activeTab === 'calendar' && <AdminCalendarView />}

          {/* TAB: BANNERS & PROMOTIONS MANAGEMENT */}
          {activeTab === 'banners' && <AdminBannersView />}

          {/* TAB: ANNOUNCEMENTS & POPUP BROADCAST ENGINE */}
          {activeTab === 'announcements' && (
            <AdminCoreSettingsView initialSubTab="notifications" />
          )}

          {/* TAB: COUPONS & DISCOUNT ENGINE */}
          {activeTab === 'coupons' && <AdminCouponsView />}

          {/* TAB: VIP CLUB & LOYALTY TIERS */}
          {activeTab === 'loyalty-tiers' && <AdminLoyaltyTiersView />}

          {/* TAB: 360-DEGREE USER MANAGEMENT */}
          {activeTab === 'users' && <AdminUsersView />}

          {/* TAB: ENHANCED ALL-ORDERS MANAGEMENT TABLE */}
          {activeTab === 'all-orders' && <AdminOrdersTableView />}

          {/* TAB: BLOG & KNOWLEDGE BASE SEO ENGINE */}
          {activeTab === 'content' && <AdminContentView />}

          {/* UNIFIED OPERATIONS, PRODUCTS & DELIVERY DESK */}
          {(activeTab === 'products' ||
            activeTab === 'delivery' ||
            activeTab === 'queue' ||
            activeTab === 'virtual-numbers') && (
            <AdminOperationsCenterView
              initialTab={
                activeTab === 'delivery'
                  ? 'bot-settings'
                  : activeTab === 'queue'
                    ? 'queue'
                    : activeTab === 'virtual-numbers'
                      ? 'virtual-numbers'
                      : 'products'
              }
              onQueueCountUpdated={setQueueCount}
            />
          )}

          {/* TAB: SUPPORT, TICKETS & REVIEWS (UNIFIED CUSTOMER RELATIONS DESK) */}
          {(activeTab === 'support' ||
            activeTab === 'tickets' ||
            activeTab === 'reviews') && (
            <AdminSupportAndReviewsView
              adminUser={adminUser}
              initialTab={activeTab === 'reviews' ? 'reviews' : 'tickets'}
              onTicketsCountUpdated={setTicketsPendingCount}
              onReviewsStatsUpdated={(stats) =>
                setReviewsPendingCount(stats.pending_reviews)
              }
            />
          )}

          {/* TAB: SYSTEM & CORE CONFIGURATION (UNIFIED SETTINGS DESK) */}
          {activeTab === 'settings' && <AdminCoreSettingsView />}
          {activeTab === ('billing' as any) && (
            <AdminCoreSettingsView initialSubTab="billing" />
          )}
          {activeTab === ('sms-gateway' as any) && (
            <AdminCoreSettingsView initialSubTab="sms" />
          )}
          {activeTab === ('system' as any) && (
            <AdminCoreSettingsView initialSubTab="gateways" />
          )}
          {activeTab === ('audit-logs' as any) && (
            <AdminCoreSettingsView initialSubTab="audit-logs" />
          )}
        </div>
      </div>
    </div>
  )
}
