import type {
  AdminActionLogRecord,
  AdminAdjustCustomerWalletRequest,
  AdminBIOverviewRequest,
  AdminBIOverviewResponse,
  AdminCustomerDetail360Response,
  AdminCustomerListItem,
  AdminListCustomersRequest,
  AdminListCustomersResponse,
  AdminOrderListResult,
  AdminProduct,
  AdminReplaceCustomerKeyRequest,
  AdminReplyTicketPayload,
  AdminReviewListResponse,
  AdminSendCustomerSMSRequest,
  AdminTicketListResponse,
  AdminUpdateCustomerStatusRequest,
  AdminUpdateOrderStatusRequest,
  AdminUpdateTicketPayload,
  ArticleComment,
  ArticleDetail,
  ArticleListItem,
  BannerItem,
  BillingSettings,
  ContentCategory,
  ContentListResponse,
  ContentTemplate,
  CouponItem,
  CouponValidation,
  CreateOrUpdateLoyaltyTierRequest,
  CreateTicketPayload,
  CustomerLoyaltyProfile,
  CustomerProfile,
  DeliveryMode,
  HelpGuideDetail,
  HelpGuideListItem,
  InstantDeliverySettings,
  InventoryItem,
  InventoryStats,
  LoyaltyTier,
  NotificationListResponse,
  OfficialInvoice,
  Order,
  OrderStatus,
  PaginatedLogsResponse,
  PaymentGateway,
  Product,
  ProductDetail,
  ProductGroup,
  ProductReviewsResponse,
  ProviderCatalogItem,
  ReferralStats,
  ReplyTicketPayload,
  ReviewEligibilityResponse,
  ReviewItem,
  SendOTPResponse,
  ServiceTarget,
  SMSSettings,
  SubmitReviewRequest,
  SubmitReviewResponse,
  ThemeSettings,
  TicketAttachment,
  TicketDetailResponse,
  TicketItem,
  TicketMessage,
  TransactionRecord,
  UpdateBuyerInvoicePayload,
  VerifyOTPResponse,
  VirtualNumberCountry,
  VirtualNumberOrder,
  VirtualNumberService,
  VirtualNumberSettings,
  WalletLedgerItem,
} from '../types'

function normalizeProduct(raw: any): Product {
  let mode: DeliveryMode = 'INSTANT_LINK'
  if (raw.delivery_mode) {
    mode = raw.delivery_mode
  } else if (
    raw.delivery_type === 'manual_timed' ||
    raw.category === 'personal_upgrade'
  ) {
    mode = 'UPGRADE_EXISTING'
  } else if (raw.category === 'ai_account') {
    mode = 'INSTANT_ACCOUNT'
  } else {
    mode = 'INSTANT_LINK'
  }

  const defaultFeatures: Record<DeliveryMode, string[]> = {
    INSTANT_LINK: [
      'تحویل آنی بلافاصله پس از پرداخت',
      'فعال‌سازی با یک کلیک روی اکانت شخصی',
      'تضمین اصالت لایسنس و عدم قطعی',
    ],
    INSTANT_ACCOUNT: [
      'تحویل درجا (ایمیل و پسورد اختصاصی)',
      'امکان تغییر رمز عبور و شخصی‌سازی کامل',
      'دسترسی اختصاصی بدون قطعی',
    ],
    UPGRADE_EXISTING: [
      'فعال‌سازی روی ایمیل و اکانت شخصی شما',
      'تبادل لایو کد ۲FA جهت حفظ امنیت کامل',
      'پرداخت قانونی با کارت معتبر بین‌المللی',
      'سیاست نابودسازی خودکار رمزها (Zeroize)',
    ],
  }

  return {
    id: raw.id,
    title_fa: raw.title_fa || raw.title,
    title_en: raw.title || raw.title_fa,
    slug: raw.slug || '',
    category: raw.category || 'ai_chat',
    delivery_mode: mode,
    delivery_type: raw.delivery_type || 'instant',
    price_toman: Number(raw.price_toman || 0),
    price_usd: Number(raw.base_cost_usd || raw.price_usd || 0),
    sla_minutes: raw.sla_min_minutes || raw.sla_minutes || 20,
    sla_min_minutes: raw.sla_min_minutes || 10,
    sla_max_minutes: raw.sla_max_minutes || 30,
    sla_display_text: raw.sla_display_text,
    operating_hours: raw.operating_hours,
    description_fa:
      raw.description_fa ||
      raw.description ||
      raw.sla_display_text ||
      raw.operating_hours ||
      'تحویل آنی و مطمئن آناهیکس',
    features:
      Array.isArray(raw.features) && raw.features.length > 0
        ? raw.features
        : defaultFeatures[mode],
    in_stock: raw.is_active !== false,
    stock_count: raw.available_stock ?? raw.stock_count ?? 12,
    group_tag: raw.group_tag,
    group_title_fa: raw.group_title_fa,
    plans: raw.plans,
    comparison_table: raw.comparison_table,
    activation_guide: raw.activation_guide,
    faqs: raw.faqs,
    seo: raw.seo,
  }
}

function normalizeProductDetail(raw: any): ProductDetail {
  const base = normalizeProduct(raw)
  return {
    ...base,
    description: raw.description || raw.description_fa || '',
    instructions: raw.instructions || '',
    delivery_strategy: raw.delivery_strategy,
    meta_title: raw.meta_title,
    meta_description: raw.meta_description,
    og_image_url: raw.og_image_url,
    plans_json: raw.plans_json,
    comparison_json: raw.comparison_json,
    guide_json: raw.guide_json,
    faq_json: raw.faq_json,
    features_json: raw.features_json,
  }
}

function normalizePayment(raw: any): PaymentGateway {
  return {
    id: raw.id,
    name: raw.name_fa || raw.name,
    platform: raw.platform,
    fee_percentage: raw.fee_percentage ?? 0,
    is_default: raw.id === -1 || raw.platform === 'balance',
    icon_type: raw.icon || raw.icon_type || 'wallet',
    description_fa: raw.description || raw.description_fa || '',
  }
}

// Helper to safely parse JSON responses and guard against non-JSON text/404 errors
async function safeJsonParse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    if (!res.ok) {
      throw new Error(text || `خطای ارتباط با سرور (${res.status})`)
    }
    return { code: res.status, msg: text, data: null }
  }
  return await res.json()
}

export const apiService = {
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/v1/products')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data.map(normalizeProduct)
        }
      }
    } catch (err) {
      console.error('Failed to fetch products from backend:', err)
    }
    return []
  },

  async getProductBySlug(slug: string): Promise<ProductDetail | null> {
    try {
      const res = await fetch(`/api/v1/products/${encodeURIComponent(slug)}`)
      if (res.ok) {
        const json = await res.json()
        if (json.code === 200 && json.data) {
          return normalizeProductDetail(json.data)
        }
      }
    } catch (err) {
      console.error(`Failed to fetch product by slug [${slug}]:`, err)
    }
    return null
  },

  async getPayments(): Promise<PaymentGateway[]> {
    try {
      const res = await fetch('/api/v1/payments')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data.map(normalizePayment)
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments from backend:', err)
    }
    return []
  },

  // Customer Orders Storage in localStorage
  getCustomerOrders(): Order[] {
    const raw = localStorage.getItem('anahix_customer_orders')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
    return []
  },

  saveCustomerOrder(order: Order) {
    const current = this.getCustomerOrders()
    const filtered = current.filter((o) => o.order_no !== order.order_no)
    localStorage.setItem(
      'anahix_customer_orders',
      JSON.stringify([order, ...filtered]),
    )
  },

  updateCustomerOrder(order: Order) {
    const current = this.getCustomerOrders()
    const updated = current.map((o) =>
      o.order_no === order.order_no ? { ...o, ...order } : o,
    )
    localStorage.setItem('anahix_customer_orders', JSON.stringify(updated))
  },

  // Customer Virtual Number Orders in localStorage
  getCustomerVirtualOrders(): VirtualNumberOrder[] {
    const raw = localStorage.getItem('anahix_customer_virtual_orders')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
    return []
  },

  saveCustomerVirtualOrder(order: VirtualNumberOrder) {
    const current = this.getCustomerVirtualOrders()
    const filtered = current.filter((o) => o.id !== order.id)
    localStorage.setItem(
      'anahix_customer_virtual_orders',
      JSON.stringify([order, ...filtered]),
    )
  },

  updateCustomerVirtualOrder(order: VirtualNumberOrder) {
    const current = this.getCustomerVirtualOrders()
    const updated = current.map((o) =>
      o.id === order.id ? { ...o, ...order } : o,
    )
    localStorage.setItem(
      'anahix_customer_virtual_orders',
      JSON.stringify(updated),
    )
  },

  async createOrder(payload: {
    product_id?: string | number
    items?: { product_id: string; quantity: number }[]
    payment_platform: string
    customer_phone: string
    customer_email?: string
    account_email?: string
    account_password?: string
    customer_notes?: string
    coupon_code?: string
    referral_code?: string
  }): Promise<Order> {
    const backendPayload = {
      product_id: payload.product_id ? String(payload.product_id) : undefined,
      items: payload.items,
      payment_method: payload.payment_platform,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email || payload.account_email || '',
      customer_account_email: payload.account_email || '',
      customer_account_password: payload.account_password || '',
      customer_notes: payload.customer_notes || '',
      coupon_code: payload.coupon_code,
      referral_code: payload.referral_code,
    }

    const res = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    })

    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data?.order_number) {
      throw new Error(json.msg || 'خطا در ثبت سفارش')
    }

    // Retrieve genuine order record from database
    const realOrder = await this.getOrderDetail(
      json.data.order_number,
      json.data.access_token,
    )

    // Persist to local customer order history
    this.saveCustomerOrder(realOrder)

    return realOrder
  },

  async getOrderDetail(orderIdOrNo: string, token?: string): Promise<Order> {
    const url = token
      ? `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}?token=${encodeURIComponent(token)}`
      : `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}`

    const res = await fetch(url)
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'سفارش یافت نشد')
    }

    const d = json.data
    let status: OrderStatus = 'PAID'
    const s = (d.status || '').toLowerCase()
    if (s === 'completed') status = 'COMPLETED'
    else if (
      d.two_factor_status === 'requested' ||
      s === 'awaiting_customer_action'
    )
      status = 'WAITING_CUSTOMER_2FA'
    else if (s === 'processing' || d.two_factor_status === 'submitted')
      status = 'PROCESSING'
    else if (s === 'in_queue' || s === 'operator_queue')
      status = 'OPERATOR_QUEUE'
    else if (s === 'pending_payment') status = 'PENDING_PAYMENT'
    else if (s === 'failed') status = 'FAILED'
    else if (s === 'refunded') status = 'REFUNDED'
    else status = 'PAID'

    let mode: DeliveryMode = 'INSTANT_LINK'
    if (
      d.delivery_type === 'manual_timed' ||
      d.delivery_type === 'upgrade_existing'
    ) {
      mode = 'UPGRADE_EXISTING'
    } else if (d.delivery_type === 'instant_account') {
      mode = 'INSTANT_ACCOUNT'
    }

    let deliveredLink: string | undefined
    let deliveredCreds: Order['delivered_credentials'] | undefined
    if (
      d.delivered_items &&
      Array.isArray(d.delivered_items) &&
      d.delivered_items.length > 0
    ) {
      const first = d.delivered_items[0]
      if (first.payload?.startsWith('http')) {
        deliveredLink = first.payload
      } else if (first.payload) {
        deliveredCreds = {
          email: d.customer_email || 'اکانت اختصاصی',
          password: first.payload,
          notes: first.instructions,
        }
      }
    }

    return {
      id: d.order_id,
      order_no: d.order_number,
      token: token,
      product_id: d.order_id,
      product_title:
        d.delivered_items?.[0]?.product_title ||
        (mode === 'UPGRADE_EXISTING'
          ? 'ارتقای اشتراک روی اکانت شخصی'
          : 'لایسنس آنی هوش مصنوعی'),
      delivery_mode: mode,
      amount_toman: Number(d.total_amount_toman || 0),
      status: status,
      payment_platform: d.payment_method || 'balance',
      customer_phone: d.customer_phone || '',
      account_email: d.customer_account_email || d.customer_email,
      two_factor_prompt: d.two_factor_prompt,
      two_factor_status: d.two_factor_status,
      two_factor_requested_at: d.two_factor_requested_at,
      delivered_link: deliveredLink,
      delivered_credentials: deliveredCreds,
      delivered_items: d.delivered_items,
      created_at: d.created_at || new Date().toISOString(),
    }
  },

  async submitOrderTwoFactor(
    orderIdOrNo: string,
    token: string,
    code: string,
  ): Promise<boolean> {
    const url = token
      ? `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}/2fa?token=${encodeURIComponent(token)}`
      : `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}/2fa`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Order-Token': token,
      },
      body: JSON.stringify({ two_factor_code: code }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'ارسال کد ۲FA ناموفق بود')
    }
    return true
  },

  // Admin Token Storage
  getAdminToken(): string | null {
    return localStorage.getItem('anahix_admin_token')
  },
  setAdminToken(token: string) {
    localStorage.setItem('anahix_admin_token', token)
  },
  clearAdminToken() {
    localStorage.removeItem('anahix_admin_token')
    localStorage.removeItem('anahix_admin_user')
  },
  getAdminUser(): any | null {
    const raw = localStorage.getItem('anahix_admin_user')
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
    return null
  },
  setAdminUser(user: any) {
    localStorage.setItem('anahix_admin_user', JSON.stringify(user))
  },

  // Admin Auth
  async adminLogin(
    username: string,
    password: string,
  ): Promise<{
    token: string
    username: string
    full_name: string
    role: string
  }> {
    const res = await fetch('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'نام کاربری یا رمز عبور اشتباه است')
    }
    this.setAdminToken(json.data.token)
    this.setAdminUser(json.data)
    return json.data
  },

  // Admin Queue Orders
  async getAdminQueueOrders(): Promise<any[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json.data
    }
    return []
  },

  // Admin Request 2FA
  async requestAdmin2FA(
    orderId: string,
    promptMessage: string,
  ): Promise<boolean> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/orders/${orderId}/2fa-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt_message: promptMessage }),
    })
    return res.ok
  },

  // Admin Complete Order
  async completeAdminOrder(orderId: string, notes?: string): Promise<boolean> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/orders/${orderId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ operator_notes: notes }),
    })
    return res.ok
  },

  // Admin Virtual Number Provider Settings
  async getVirtualNumberSettings(): Promise<VirtualNumberSettings> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/virtual-numbers', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
    throw new Error('خطا در دریافت تنظیمات سامانه شماره‌های مجازی')
  },

  async updateVirtualNumberSettings(payload: {
    enabled?: boolean
    api_key?: string
    margin_percent?: number
    usd_rate?: number
    rub_rate?: number
    default_operator?: string
    rate_priority?: 'manual' | 'swapwallet'
  }): Promise<VirtualNumberSettings> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/virtual-numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره تنظیمات سامانه شماره‌های مجازی')
    }
    return json.data
  },

  async getAdminVirtualOrders(): Promise<any[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/virtual-numbers/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.ok) {
      const json = await res.json()
      return json.data || []
    }
    return []
  },

  // Public Virtual Numbers
  async getVirtualServices(): Promise<VirtualNumberService[]> {
    try {
      const res = await fetch('/api/v1/virtual-numbers/services')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data
        }
      }
    } catch {
      // fallback
    }
    return []
  },

  async getVirtualCountries(service: string): Promise<VirtualNumberCountry[]> {
    try {
      const res = await fetch(
        `/api/v1/virtual-numbers/countries?service=${encodeURIComponent(service)}`,
      )
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data
        }
      }
    } catch {
      // fallback
    }
    return []
  },

  async getVirtualCatalog(): Promise<any[]> {
    try {
      const res = await fetch('/api/v1/virtual-numbers/catalog')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          return json.data
        }
      }
    } catch {
      // fallback
    }
    return []
  },

  async buyVirtualNumber(payload: {
    country: string
    service: string
    operator?: string
    customer_phone: string
    payment_method?: string
  }): Promise<any> {
    const res = await fetch('/api/v1/virtual-numbers/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در خرید شماره مجازی')
    }
    return json.data
  },

  async getVirtualOrderDetail(orderId: string): Promise<any> {
    const res = await fetch(`/api/v1/virtual-numbers/orders/${orderId}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'سفارش یافت نشد')
    }
    return json.data
  },

  async cancelVirtualOrder(orderId: string): Promise<boolean> {
    const res = await fetch(
      `/api/v1/virtual-numbers/orders/${orderId}/cancel`,
      {
        method: 'POST',
      },
    )
    return res.ok
  },

  async finishVirtualOrder(orderId: string): Promise<boolean> {
    const res = await fetch(
      `/api/v1/virtual-numbers/orders/${orderId}/finish`,
      {
        method: 'POST',
      },
    )
    return res.ok
  },

  // Delivery Engine & Instant Fulfillment Infrastructure API Methods

  async getInstantDeliverySettings(): Promise<InstantDeliverySettings> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/instant-delivery', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      return json.data
    }
    throw new Error('خطا در دریافت تنظیمات موتور تحویل آنی')
  },

  async updateInstantDeliverySettings(payload: {
    enabled?: boolean
    api_key?: string
    margin_percent?: number
  }): Promise<any> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/instant-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره تنظیمات موتور تحویل آنی')
    }
    return json.data
  },

  async getProviderCatalog(): Promise<ProviderCatalogItem[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/delivery/provider-catalog', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      return json.data || []
    }
    throw new Error('خطا در دریافت کاتالوگ انبار لایسنس‌های آنی')
  },

  async getProductGroups(): Promise<ProductGroup[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/delivery/groups', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      return json.data || []
    }
    throw new Error('خطا در دریافت گروه‌های محصولات')
  },

  async updateGroupDeliveryStrategy(
    groupTag: string,
    strategy: 'manual_operator' | 'third_party_instant',
  ): Promise<any> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/delivery/groups/strategy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        group_tag: groupTag,
        delivery_strategy: strategy,
      }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در به‌روزرسانی استراتژی تحویل گروه')
    }
    return json.data
  },

  async linkProductProvider(
    productId: string,
    externalProductId: number,
    strategy?: string,
  ): Promise<any> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/delivery/products/link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        external_product_id: externalProductId,
        delivery_strategy: strategy,
      }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در اتصال محصول به انبار تحویل آنی')
    }
    return json.data
  },

  // Admin Audit & Financial Transaction Logs
  async getTransactionLogs(params?: {
    page?: number
    page_size?: number
    query?: string
    status?: string
    order_type?: string
  }): Promise<PaginatedLogsResponse<TransactionRecord>> {
    const token = this.getAdminToken()
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.page_size)
      queryParams.set('page_size', params.page_size.toString())
    if (params?.query) queryParams.set('query', params.query)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.order_type) queryParams.set('order_type', params.order_type)

    const url = `/api/v1/admin/logs/transactions?${queryParams.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json.data
    }
    return { total: 0, items: [] }
  },

  async getAdminActionLogs(params?: {
    page?: number
    page_size?: number
    query?: string
    action?: string
    resource?: string
  }): Promise<PaginatedLogsResponse<AdminActionLogRecord>> {
    const token = this.getAdminToken()
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.page_size)
      queryParams.set('page_size', params.page_size.toString())
    if (params?.query) queryParams.set('query', params.query)
    if (params?.action) queryParams.set('action', params.action)
    if (params?.resource) queryParams.set('resource', params.resource)

    const url = `/api/v1/admin/logs/actions?${queryParams.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      if (json.data) return json.data
    }
    return { total: 0, items: [] }
  },

  // Customer Token & Session Management
  getCustomerToken(): string | null {
    return localStorage.getItem('anahix_customer_token')
  },

  isCustomerLoggedIn(): boolean {
    return Boolean(this.getCustomerToken())
  },

  setCustomerToken(token: string) {
    localStorage.setItem('anahix_customer_token', token)
  },

  removeCustomerToken() {
    localStorage.removeItem('anahix_customer_token')
    localStorage.removeItem('anahix_customer_user')
  },

  setCustomerUser(customer: CustomerProfile) {
    localStorage.setItem('anahix_customer_user', JSON.stringify(customer))
  },

  getCustomerUser(): CustomerProfile | null {
    try {
      const raw = localStorage.getItem('anahix_customer_user')
      if (raw) return JSON.parse(raw)
    } catch {}
    return null
  },

  // Customer OTP Auth
  async sendOTP(mobile: string): Promise<SendOTPResponse> {
    const res = await fetch('/api/v1/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ارسال کد تایید پیامکی')
    }
    return json.data
  },

  async verifyOTP(mobile: string, code: string): Promise<VerifyOTPResponse> {
    const res = await fetch('/api/v1/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, code }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'کد تایید وارد شده نامعتبر است')
    }
    if (json.data?.token) {
      this.setCustomerToken(json.data.token)
    }
    return json.data
  },

  async getCustomerProfile(): Promise<CustomerProfile | null> {
    const token = this.getCustomerToken()
    if (!token) return null
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok && json.code === 200 && json.data) {
        return json.data
      }
      if (res.status === 401 || json.code === 401) {
        this.removeCustomerToken()
      }
      return null
    } catch {
      return null
    }
  },

  async updateCustomerProfile(payload: {
    first_name?: string
    last_name?: string
    full_name?: string
    email?: string
    phone?: string
    avatar_url?: string
    is_corporate?: boolean
    company_name?: string
    national_id?: string
    economic_code?: string
    registration_no?: string
    postal_code?: string
    company_address?: string
    company_phone?: string
  }): Promise<CustomerProfile> {
    const token = this.getCustomerToken()
    if (!token) throw new Error('کاربر وارد نشده است')
    const res = await fetch('/api/v1/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در به‌روزرسانی مشخصات')
    }
    if (json.data) {
      this.setCustomerUser(json.data)
    }
    return json.data
  },

  // Admin SMS Settings
  async getSMSSettings(): Promise<SMSSettings> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/sms', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت تنظیمات سامانه پیامک')
    }
    return json.data
  },

  async updateSMSSettings(data: {
    api_key?: string
    line_number?: string
    template_id?: string
    template_otp?: string
    template_2fa?: string
    template_order_complete?: string
    template_renewal?: string
    is_sandbox?: boolean
  }): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره تنظیمات سامانه پیامک')
    }
  },

  async sendTestSMS(
    mobile: string,
    templateType?: string,
    templateId?: number,
    parameters?: Record<string, string>,
    message?: string,
  ): Promise<{ status: string; message: string }> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/sms/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mobile,
        template_type: templateType,
        template_id: templateId,
        parameters,
        message: message || 'تست اتصال وب‌سرویس پیامک آناهیکس',
      }),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ارسال پیامک آزمایشی')
    }
    return json.data
  },

  // Coupons & Discounts
  async getPublicCoupons(): Promise<
    Array<{
      code: string
      label: string
      discount_type: string
      discount_value: number
    }>
  > {
    try {
      const res = await fetch('/api/v1/coupons')
      const json = await res.json()
      if (res.ok && json.code === 200 && Array.isArray(json.data)) {
        return json.data
      }
    } catch {}
    return []
  },

  async validateCoupon(payload: {
    code: string
    subtotal_toman: number
    customer_phone?: string
    category?: string
  }): Promise<CouponValidation> {
    const res = await fetch('/api/v1/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      return {
        valid: false,
        code: payload.code,
        discount_type: 'percentage',
        discount_value: 0,
        discount_toman: 0,
        final_amount_toman: payload.subtotal_toman,
        message: json.msg || 'کد تخفیف نامعتبر است',
      }
    }
    return json.data
  },

  // Referral System
  async getReferralStats(phone?: string): Promise<ReferralStats | null> {
    try {
      const token = this.getCustomerToken()
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : ''
      const res = await fetch(`/api/v1/referrals/stats${query}`, { headers })
      const json = await res.json()
      if (res.ok && json.code === 200 && json.data) {
        return json.data
      }
    } catch (err) {
      console.error('Failed to get referral stats:', err)
    }
    return null
  },

  async transferReferralCommission(): Promise<{
    success: boolean
    message: string
    new_balance?: number
  }> {
    const token = this.getCustomerToken()
    const res = await fetch('/api/v1/referrals/transfer-to-wallet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return {
        success: true,
        message:
          json.data?.message || 'کمیسیون با موفقیت به کیف پول منتقل گردید',
        new_balance: json.data?.new_balance_toman,
      }
    }
    throw new Error(json.msg || 'خطا در انتقال کمیسیون')
  },

  // Customer Wallet Ledger
  async getWalletLedger(phone?: string): Promise<WalletLedgerItem[]> {
    try {
      const token = this.getCustomerToken()
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : ''
      const res = await fetch(`/api/v1/wallet/ledger${query}`, { headers })
      const json = await res.json()
      if (res.ok && json.code === 200 && Array.isArray(json.data)) {
        return json.data
      }
    } catch (err) {
      console.error('Failed to get wallet ledger:', err)
    }
    return []
  },

  // Customer In-App Notifications
  async getInAppNotifications(): Promise<NotificationListResponse> {
    const token = this.getCustomerToken()
    if (!token) return { total: 0, unread_count: 0, items: [] }
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await safeJsonParse(res)
      if (!res.ok || json.code !== 200 || !json.data) {
        return { total: 0, unread_count: 0, items: [] }
      }
      return json.data
    } catch {
      return { total: 0, unread_count: 0, items: [] }
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const token = this.getCustomerToken()
    if (!token) return
    try {
      await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {}
  },

  async markAllNotificationsAsRead(): Promise<void> {
    const token = this.getCustomerToken()
    if (!token) return
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {}
  },

  // Admin Inventory Management
  async getInventoryStats(): Promise<InventoryStats> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/inventory/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    return {
      total_count: 0,
      available_count: 0,
      reserved_count: 0,
      sold_delivered_count: 0,
      void_count: 0,
    }
  },

  async listInventory(
    productId?: string,
    status?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ total: number; items: InventoryItem[] }> {
    const token = this.getAdminToken()
    const params = new URLSearchParams()
    if (productId) params.set('product_id', productId)
    if (status && status !== 'all') params.set('status', status)
    params.set('page', String(page))
    params.set('page_size', String(pageSize))

    const res = await fetch(`/api/v1/admin/inventory?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    return { total: 0, items: [] }
  },

  async replaceInventoryKey(
    orderId: string | number,
    oldInventoryItemId: string | number,
    reason?: string,
  ): Promise<{
    success: boolean
    new_inventory_item_id: string
    delivered_payload: string
    message: string
  }> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/inventory/replace-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        old_inventory_item_id: oldInventoryItemId,
        reason,
      }),
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در جایگزینی کلید')
  },

  async exportInventoryKeys(
    productId?: string,
    status?: string,
  ): Promise<string[]> {
    const token = this.getAdminToken()
    const params = new URLSearchParams()
    if (productId) params.set('product_id', productId)
    if (status && status !== 'all') params.set('status', status)

    const res = await fetch(
      `/api/v1/admin/inventory/export?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (res.ok && json.code === 200 && Array.isArray(json.data?.keys)) {
      return json.data.keys
    }
    return []
  },

  async listCoupons(): Promise<CouponItem[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/coupons', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && Array.isArray(json.data)) {
      return json.data
    }
    return []
  },

  async createCoupon(data: {
    code: string
    discount_type: string
    discount_value: number
    min_order_amount_toman?: number
    max_discount_toman?: number
    per_user_limit?: number
    max_usage?: number
    category?: string
    is_active?: boolean
  }): Promise<CouponItem> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ایجاد کوپن تخفیف')
  },

  // Admin Product Catalog Management
  async adminListProducts(): Promise<AdminProduct[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && Array.isArray(json.data)) {
      return json.data
    }
    return []
  },

  async adminGetProduct(id: string): Promise<AdminProduct> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در دریافت مشخصات محصول')
  },

  async adminCreateProduct(data: Partial<AdminProduct>): Promise<AdminProduct> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ایجاد محصول')
  },

  async adminUpdateProduct(
    id: string,
    data: Partial<AdminProduct>,
  ): Promise<AdminProduct> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در بروزرسانی محصول')
  },

  async adminDeleteProduct(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف محصول')
    }
  },

  // ==========================================
  // Social Proof & Buyer Reviews Services
  // ==========================================

  async getProductReviews(
    slug: string,
    options?: {
      rating?: number
      sort?: string
      has_comment?: boolean
      page?: number
      page_size?: number
    },
  ): Promise<ProductReviewsResponse | null> {
    try {
      const params = new URLSearchParams()
      if (options?.rating && options.rating > 0)
        params.append('rating', String(options.rating))
      if (options?.sort) params.append('sort', options.sort)
      if (options?.has_comment !== undefined)
        params.append('has_comment', String(options.has_comment))
      if (options?.page) params.append('page', String(options.page))
      if (options?.page_size)
        params.append('page_size', String(options.page_size))

      const q = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/v1/products/${slug}/reviews${q}`)
      const json = await res.json()
      if (res.ok && json.code === 200 && json.data) {
        return json.data
      }
      return null
    } catch {
      return null
    }
  },

  async checkReviewEligibility(
    slug: string,
  ): Promise<ReviewEligibilityResponse> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const res = await fetch(`/api/v1/products/${slug}/review-eligibility`, {
        headers,
      })
      const json = await res.json()
      if (res.ok && json.code === 200 && json.data) {
        return json.data
      }
      return { eligible: false, reason: json.msg || 'خطا در استعلام صلاحیت' }
    } catch {
      return { eligible: false, reason: 'خطا در ارتباط با سرور' }
    }
  },

  async submitReview(
    payload: SubmitReviewRequest,
  ): Promise<SubmitReviewResponse> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch('/api/v1/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ثبت نظر')
  },

  async voteReviewHelpful(reviewId: string): Promise<number> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(`/api/v1/reviews/${reviewId}/helpful`, {
      method: 'POST',
      headers,
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data.helpful_count
    }
    return 0
  },

  async getCustomerReviews(): Promise<ReviewItem[]> {
    const token = this.getCustomerToken()
    if (!token) return []

    try {
      const res = await fetch('/api/v1/auth/my-reviews', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      if (res.ok && json.code === 200 && Array.isArray(json.data)) {
        return json.data
      }
      return []
    } catch {
      return []
    }
  },

  async getAdminReviews(options?: {
    status?: string
    product_id?: string
    search?: string
    page?: number
    page_size?: number
  }): Promise<AdminReviewListResponse | null> {
    const token = this.getAdminToken()
    if (!token) return null

    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.product_id) params.append('product_id', options.product_id)
    if (options?.search) params.append('search', options.search)
    if (options?.page) params.append('page', String(options.page))
    if (options?.page_size)
      params.append('page_size', String(options.page_size))

    const q = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`/api/v1/admin/reviews${q}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در دریافت لیست نظرات مدیریت')
  },

  async updateAdminReviewStatus(
    reviewId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ): Promise<boolean> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/reviews/${reviewId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
        rejection_reason: rejectionReason || '',
      }),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return true
    }
    throw new Error(json.msg || 'خطا در تغییر وضعیت نظر')
  },

  async replyAdminReview(
    reviewId: string,
    reply: string,
    author?: string,
  ): Promise<boolean> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        reply,
        author: author || 'پشتیبانی رسمی آناهیکس',
      }),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return true
    }
    throw new Error(json.msg || 'خطا در ارسال پاسخ مدیریت')
  },

  async featureAdminReview(
    reviewId: string,
    isFeatured: boolean,
  ): Promise<boolean> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/reviews/${reviewId}/feature`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        is_featured: isFeatured,
      }),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return true
    }
    throw new Error(json.msg || 'خطا در تغییر وضعیت برگزیده')
  },

  async deleteAdminReview(reviewId: string): Promise<boolean> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return true
    }
    throw new Error(json.msg || 'خطا در حذف نظر')
  },

  // ----------------------------------------------------
  // Customer Support & Real Ticketing Engine Endpoints
  // ----------------------------------------------------

  async getMyTickets(): Promise<TicketItem[]> {
    const token = this.getCustomerToken()
    const res = await fetch('/api/v1/tickets', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data || []
    }
    throw new Error(json.msg || 'خطا در دریافت لیست تیکت‌ها')
  },

  async getTicketDetail(ticketId: string): Promise<TicketDetailResponse> {
    const token = this.getCustomerToken()
    const res = await fetch(`/api/v1/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در دریافت جزئیات تیکت')
  },

  async createTicket(
    payload: CreateTicketPayload,
  ): Promise<TicketDetailResponse> {
    const token = this.getCustomerToken()
    const res = await fetch('/api/v1/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ثبت تیکت جدید')
  },

  async replyTicket(
    ticketId: string,
    payload: ReplyTicketPayload,
  ): Promise<TicketMessage> {
    const token = this.getCustomerToken()
    const res = await fetch(`/api/v1/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ارسال پاسخ تیکت')
  },

  async closeTicket(ticketId: string): Promise<{ closed: boolean }> {
    const token = this.getCustomerToken()
    const res = await fetch(`/api/v1/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در بستن تیکت')
  },

  async rateTicket(
    ticketId: string,
    rating: number,
    comment?: string,
  ): Promise<{ rated: boolean }> {
    const token = this.getCustomerToken()
    const res = await fetch(`/api/v1/tickets/${ticketId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment: comment || '' }),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ثبت امتیاز تیکت')
  },

  async uploadTicketAttachment(file: File): Promise<TicketAttachment> {
    const token = this.getCustomerToken()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/v1/tickets/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در آپلود فایل')
  },

  // ----------------------------------------------------
  // Admin Support & Real Ticketing Engine Endpoints
  // ----------------------------------------------------

  async getAdminTickets(params?: {
    status?: string
    department?: string
    priority?: string
    search?: string
    page?: number
    page_size?: number
  }): Promise<AdminTicketListResponse> {
    const token = this.getAdminToken()
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.department) query.set('department', params.department)
    if (params?.priority) query.set('priority', params.priority)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))

    const res = await fetch(`/api/v1/admin/tickets?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در دریافت لیست تیکت‌های مدیریت')
  },

  async getAdminTicketDetail(ticketId: string): Promise<TicketDetailResponse> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در دریافت جزئیات تیکت')
  },

  async adminReplyTicket(
    ticketId: string,
    payload: AdminReplyTicketPayload,
  ): Promise<TicketMessage> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در ارسال پاسخ تیکت توسط ادمین')
  },

  async adminUpdateTicket(
    ticketId: string,
    payload: AdminUpdateTicketPayload,
  ): Promise<TicketItem> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در به‌روزرسانی مشخصات تیکت')
  },

  async adminDeleteTicket(ticketId: string): Promise<{ deleted: boolean }> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در حذف تیکت')
  },

  async uploadAdminTicketAttachment(file: File): Promise<TicketAttachment> {
    const token = this.getAdminToken()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/v1/admin/tickets/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    const json = await res.json()
    if (res.ok && json.code === 200) {
      return json.data
    }
    throw new Error(json.msg || 'خطا در آپلود فایل توسط ادمین')
  },

  // ==========================================
  // Official Tax Invoice & Seller Billing API
  // ==========================================

  async getOrderInvoice(
    orderIdOrNo: string,
    token?: string,
  ): Promise<OfficialInvoice> {
    const custToken = this.getCustomerToken()
    const headers: Record<string, string> = {}
    if (custToken) {
      headers.Authorization = `Bearer ${custToken}`
    }

    const url = token
      ? `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}/invoice?token=${encodeURIComponent(token)}`
      : `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}/invoice`

    const res = await fetch(url, { headers })
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'فاکتور سفارش یافت نشد')
    }
    return json.data
  },

  async updateBuyerInvoice(
    orderIdOrNo: string,
    token: string,
    payload: UpdateBuyerInvoicePayload,
  ): Promise<void> {
    const custToken = this.getCustomerToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (custToken) {
      headers.Authorization = `Bearer ${custToken}`
    }

    const url = token
      ? `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}/invoice-buyer?token=${encodeURIComponent(token)}`
      : `/api/v1/orders/${encodeURIComponent(orderIdOrNo)}/invoice-buyer`

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره مشخصات حقوقی خریدار')
    }
  },

  async getBillingSettings(): Promise<BillingSettings> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/billing', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در دریافت تنظیمات فاکتور رسمی')
    }
    return json.data
  },

  async updateBillingSettings(
    payload: Partial<BillingSettings>,
  ): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/billing', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره تنظیمات فاکتور رسمی')
    }
  },

  async getAdminOrderInvoice(orderIdOrNo: string): Promise<OfficialInvoice> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/orders/${encodeURIComponent(orderIdOrNo)}/invoice`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در دریافت فاکتور رسمی سفارش')
    }
    return json.data
  },

  // ---------------------------------------------------------------------------
  // Customer 360 & User Management
  // ---------------------------------------------------------------------------

  async getAdminCustomers(
    params?: AdminListCustomersRequest,
  ): Promise<AdminListCustomersResponse> {
    const token = this.getAdminToken()
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.has_balance !== undefined)
      query.set('has_balance', String(params.has_balance))
    if (params?.tier) query.set('tier', params.tier)
    if (params?.sort_by) query.set('sort_by', params.sort_by)
    if (params?.sort_order) query.set('sort_order', params.sort_order)
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))

    const res = await fetch(`/api/v1/admin/customers?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در دریافت لیست کاربران')
    }
    return json.data
  },

  async getAdminCustomer360(
    customerId: string,
  ): Promise<AdminCustomerDetail360Response> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/customers/${encodeURIComponent(customerId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در دریافت پرونده ۳۶۰ درجه مشتری')
    }
    return json.data
  },

  async adjustCustomerWallet(
    customerId: string,
    data: AdminAdjustCustomerWalletRequest,
  ): Promise<AdminCustomerListItem> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/customers/${encodeURIComponent(customerId)}/wallet-adjust`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در تعدیل موجودی کیف پول کاربر')
    }
    return json.data
  },

  async updateCustomerStatus(
    customerId: string,
    data: AdminUpdateCustomerStatusRequest,
  ): Promise<AdminCustomerListItem> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/customers/${encodeURIComponent(customerId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در به‌روزرسانی اطلاعات کاربر')
    }
    return json.data
  },

  async sendCustomerSMS(
    customerId: string,
    data: AdminSendCustomerSMSRequest,
  ): Promise<{ sent: boolean; message: string }> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/customers/${encodeURIComponent(customerId)}/sms`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ارسال پیامک به کاربر')
    }
    return json.data || { sent: true, message: 'پیامک با موفقیت ارسال شد' }
  },

  async replaceCustomerOrderKey(
    customerId: string,
    data: AdminReplaceCustomerKeyRequest,
  ): Promise<{ updated: boolean; message: string }> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/customers/${encodeURIComponent(customerId)}/replace-key`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در جایگزینی کلید سفارش')
    }
    return (
      json.data || {
        updated: true,
        message: 'لایسنس با موفقیت به‌روزرسانی شد',
      }
    )
  },

  // ---------------------------------------------------------------------------
  // Enhanced Orders Management
  // ---------------------------------------------------------------------------

  async getAdminAllOrders(params?: {
    status?: string
    delivery_type?: string
    payment_method?: string
    search?: string
    page?: number
    page_size?: number
  }): Promise<AdminOrderListResult> {
    const token = this.getAdminToken()
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.delivery_type) query.set('delivery_type', params.delivery_type)
    if (params?.payment_method)
      query.set('payment_method', params.payment_method)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))

    const res = await fetch(`/api/v1/admin/orders/all?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200 || !json.data) {
      throw new Error(json.msg || 'خطا در دریافت لیست کلی سفارش‌ها')
    }
    return json.data
  },

  async updateAdminOrderStatus(
    orderId: string,
    data: AdminUpdateOrderStatusRequest,
  ): Promise<{ updated: boolean; message: string }> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در به‌روزرسانی وضعیت سفارش')
    }
    return (
      json.data || {
        updated: true,
        message: 'وضعیت سفارش با موفقیت به‌روزرسانی شد',
      }
    )
  },

  // ---------------- BLOG & KNOWLEDGE BASE APIs ----------------

  async getContentCategories(type?: string): Promise<ContentCategory[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : ''
    const res = await fetch(`/api/v1/content/categories${query}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت دسته‌بندی‌ها')
    }
    return json.data || []
  },

  async getArticles(params?: {
    page?: number
    page_size?: number
    category?: string
    tag?: string
    search?: string
  }): Promise<ContentListResponse<ArticleListItem>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))
    if (params?.category) query.set('category', params.category)
    if (params?.tag) query.set('tag', params.tag)
    if (params?.search) query.set('search', params.search)

    const res = await fetch(`/api/v1/articles?${query.toString()}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت مقالات وبلاگ')
    }
    return json.data
  },

  async getArticleDetail(slug: string): Promise<ArticleDetail> {
    const res = await fetch(`/api/v1/articles/${encodeURIComponent(slug)}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'مقاله مورد نظر یافت نشد')
    }
    return json.data
  },

  async likeArticle(
    slug: string,
  ): Promise<{ like_count: number; is_liked: boolean }> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(
      `/api/v1/articles/${encodeURIComponent(slug)}/like`,
      {
        method: 'POST',
        headers,
      },
    )
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ثبت پسندیدن مقاله')
    }
    return {
      like_count: json.data?.like_count || 0,
      is_liked: Boolean(json.data?.is_liked),
    }
  },

  async submitArticleComment(
    slug: string,
    payload: { author_name: string; email?: string; content: string },
  ): Promise<void> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(
      `/api/v1/articles/${encodeURIComponent(slug)}/comments`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ارسال دیدگاه')
    }
  },

  async getHelpGuides(params?: {
    page?: number
    page_size?: number
    category?: string
    service_target?: string
    search?: string
  }): Promise<ContentListResponse<HelpGuideListItem>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))
    if (params?.category) query.set('category', params.category)
    if (params?.service_target)
      query.set('service_target', params.service_target)
    if (params?.search) query.set('search', params.search)

    const res = await fetch(`/api/v1/help/guides?${query.toString()}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت راهنماهای پایگاه دانش')
    }
    return json.data
  },

  async getHelpGuideDetail(slug: string): Promise<HelpGuideDetail> {
    const res = await fetch(`/api/v1/help/guides/${encodeURIComponent(slug)}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'راهنمای مورد نظر یافت نشد')
    }
    return json.data
  },

  async voteHelpGuide(
    slug: string,
    is_helpful: boolean,
  ): Promise<{ helpful_yes: number; helpful_no: number; status: string }> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(
      `/api/v1/help/guides/${encodeURIComponent(slug)}/vote`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ is_helpful }),
      },
    )
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ثبت بازخورد')
    }
    return {
      helpful_yes: json.data?.helpful_yes || 0,
      helpful_no: json.data?.helpful_no || 0,
      status: json.data?.status || 'voted',
    }
  },

  // Admin Content Management
  async getAdminArticles(params?: {
    page?: number
    page_size?: number
    search?: string
    category?: string
    is_published?: string
  }): Promise<ContentListResponse<ArticleListItem>> {
    const token = this.getAdminToken()
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)
    if (params?.is_published) query.set('is_published', params.is_published)

    const res = await fetch(`/api/v1/admin/articles?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت مقالات مدیریت')
    }
    return json.data
  },

  async getAdminArticle(id: string): Promise<ArticleDetail> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/articles/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'مقاله مورد نظر یافت نشد')
    }
    return json.data
  },

  async createAdminArticle(payload: any): Promise<ArticleDetail> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/articles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ایجاد مقاله')
    }
    return json.data
  },

  async updateAdminArticle(id: string, payload: any): Promise<ArticleDetail> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/articles/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش مقاله')
    }
    return json.data
  },

  async deleteAdminArticle(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/articles/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف مقاله')
    }
  },

  async getAdminHelpGuides(params?: {
    page?: number
    page_size?: number
    search?: string
    category?: string
    service_target?: string
  }): Promise<ContentListResponse<HelpGuideListItem>> {
    const token = this.getAdminToken()
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.page_size) query.set('page_size', String(params.page_size))
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)
    if (params?.service_target)
      query.set('service_target', params.service_target)

    const res = await fetch(`/api/v1/admin/help/guides?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت راهنماهای مدیریت')
    }
    return json.data
  },

  async getAdminHelpGuide(id: string): Promise<HelpGuideDetail> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/help/guides/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'راهنمای مورد نظر یافت نشد')
    }
    return json.data
  },

  async createAdminHelpGuide(payload: any): Promise<HelpGuideDetail> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/help/guides', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ایجاد راهنما')
    }
    return json.data
  },

  async updateAdminHelpGuide(
    id: string,
    payload: any,
  ): Promise<HelpGuideDetail> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/help/guides/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش راهنما')
    }
    return json.data
  },

  async deleteAdminHelpGuide(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/help/guides/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف راهنما')
    }
  },

  async getAdminContentCategories(type?: string): Promise<ContentCategory[]> {
    const token = this.getAdminToken()
    const query = type ? `?type=${encodeURIComponent(type)}` : ''
    const res = await fetch(`/api/v1/admin/content/categories${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت دسته‌بندی‌ها')
    }
    return json.data || []
  },

  async createAdminContentCategory(payload: any): Promise<ContentCategory> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/content/categories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ایجاد دسته‌بندی')
    }
    return json.data
  },

  async updateAdminContentCategory(id: string, payload: any): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/categories/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش دسته‌بندی')
    }
  },

  async deleteAdminContentCategory(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/categories/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف دسته‌بندی')
    }
  },

  async getAdminArticleComments(
    articleId?: string,
    status?: string,
  ): Promise<ArticleComment[]> {
    const token = this.getAdminToken()
    const query = new URLSearchParams()
    if (articleId) query.set('article_id', articleId)
    if (status) query.set('status', status)
    const res = await fetch(
      `/api/v1/admin/content/comments?${query.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت نظرات')
    }
    return json.data || []
  },

  async updateAdminCommentStatus(
    id: string,
    status: string,
    reply?: string,
  ): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/comments/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reply }),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در به‌روزرسانی نظر')
    }
  },

  async deleteAdminComment(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/comments/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف نظر')
    }
  },

  // Dynamic Content Templates (DB-driven)
  async getContentTemplates(type?: string): Promise<ContentTemplate[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : ''
    const res = await fetch(`/api/v1/content/templates${query}`)
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت قالب‌های نگارش')
    }
    return json.data || []
  },

  async getContentServices(): Promise<ServiceTarget[]> {
    const res = await fetch('/api/v1/content/services')
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت لیست پلتفرم‌ها')
    }
    return json.data || []
  },

  async getAdminContentTemplates(type?: string): Promise<ContentTemplate[]> {
    const token = this.getAdminToken()
    const query = type ? `?type=${encodeURIComponent(type)}` : ''
    const res = await fetch(`/api/v1/admin/content/templates${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت قالب‌های مدیریت')
    }
    return json.data || []
  },

  async createAdminContentTemplate(payload: any): Promise<ContentTemplate> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/content/templates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ایجاد قالب')
    }
    return json.data
  },

  async updateAdminContentTemplate(id: string, payload: any): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/templates/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش قالب')
    }
  },

  async deleteAdminContentTemplate(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/templates/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف قالب')
    }
  },

  async getAdminContentServices(): Promise<ServiceTarget[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/content/services', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت سرویس‌های مدیریت')
    }
    return json.data || []
  },

  async createAdminContentService(payload: any): Promise<ServiceTarget> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/content/services', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در افزودن سرویس')
    }
    return json.data
  },

  async updateAdminContentService(id: string, payload: any): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/services/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش سرویس')
    }
  },

  async deleteAdminContentService(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/content/services/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف سرویس')
    }
  },

  // ==========================================
  // Business Intelligence (BI) Analytics API
  // ==========================================
  async getBIOverview(
    params?: AdminBIOverviewRequest,
  ): Promise<AdminBIOverviewResponse> {
    const token = this.getAdminToken()
    const searchParams = new URLSearchParams()
    if (params?.range) searchParams.set('range', params.range)
    if (params?.group_by) searchParams.set('group_by', params.group_by)
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const res = await fetch(`/api/v1/admin/bi/overview${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت آمارهای هوش تجاری')
    }
    return json.data
  },

  // ==========================================
  // VIP Club & Loyalty Tiers Admin Management
  // ==========================================
  async getAdminLoyaltyTiers(): Promise<LoyaltyTier[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/loyalty/tiers', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت لیست سطوح وفاداری')
    }
    return json.data || []
  },

  async createAdminLoyaltyTier(
    data: CreateOrUpdateLoyaltyTierRequest,
  ): Promise<LoyaltyTier> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/loyalty/tiers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ایجاد سطح وفاداری جدید')
    }
    return json.data
  },

  async updateAdminLoyaltyTier(
    id: string,
    data: CreateOrUpdateLoyaltyTierRequest,
  ): Promise<LoyaltyTier> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/loyalty/tiers/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش سطح وفاداری')
    }
    return json.data
  },

  async deleteAdminLoyaltyTier(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(
      `/api/v1/admin/loyalty/tiers/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف سطح وفاداری')
    }
  },

  async getAdminLoyaltySettings(): Promise<Record<string, string>> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/loyalty/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت تنظیمات باشگاه وفاداری')
    }
    return json.data || {}
  },

  async updateAdminLoyaltySettings(
    settings: Record<string, string>,
  ): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/loyalty/settings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره تنظیمات باشگاه وفاداری')
    }
  },

  // ==========================================
  // Public Storefront VIP Loyalty Profile
  // ==========================================
  async getCustomerLoyaltyProfile(
    phone?: string,
  ): Promise<CustomerLoyaltyProfile> {
    const token = this.getCustomerToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : ''
    const res = await fetch(`/api/v1/loyalty/profile${query}`, { headers })
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت اطلاعات باشگاه وفاداری')
    }
    return json.data
  },

  async getPublicLoyaltyTiers(): Promise<LoyaltyTier[]> {
    const res = await fetch('/api/v1/loyalty/tiers')
    const json = await res.json()
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در دریافت سطوح وفاداری')
    }
    return json.data || []
  },

  // ==========================================
  // Promotional Banners & Flash Deals
  // ==========================================
  async getBanners(position?: string): Promise<BannerItem[]> {
    const query = position ? `?position=${encodeURIComponent(position)}` : ''
    const res = await fetch(`/api/v1/banners${query}`)
    const json = await safeJsonParse(res)
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    return []
  },

  async getAdminBanners(): Promise<BannerItem[]> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/banners', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await safeJsonParse(res)
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    return []
  },

  async createBanner(data: Partial<BannerItem>): Promise<BannerItem> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/banners', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ثبت بنر جدید')
    }
    return json.data
  },

  async updateBanner(
    id: string,
    data: Partial<BannerItem>,
  ): Promise<BannerItem> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/banners/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ویرایش بنر')
    }
    return json.data
  },

  async deleteBanner(id: string): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch(`/api/v1/admin/banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در حذف بنر')
    }
  },

  // ==========================================
  // Dynamic Holiday Theme & System Settings
  // ==========================================
  async getThemeSettings(): Promise<ThemeSettings> {
    const res = await fetch('/api/v1/system/theme')
    const json = await safeJsonParse(res)
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    return {
      default_theme: 'graphite',
      event_name: 'عادی',
      event_active: false,
      primary_color: '#2563eb',
      accent_color: '#3b82f6',
      header_announcement:
        'تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی برقرار است',
      event_effect: 'none',
      event_icon: 'sparkles',
      auth_google_enabled: true,
      auth_github_enabled: true,
      auth_password_enabled: true,
      auth_otp_required: false,
    }
  },

  async getAdminThemeSettings(): Promise<ThemeSettings> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/theme', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await safeJsonParse(res)
    if (res.ok && json.code === 200 && json.data) {
      return json.data
    }
    return this.getThemeSettings()
  },

  async updateAdminThemeSettings(data: Partial<ThemeSettings>): Promise<void> {
    const token = this.getAdminToken()
    const res = await fetch('/api/v1/admin/settings/theme', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ذخیره تنظیمات تم و رویداد')
    }
  },

  // ==========================================
  // Multi-Method Customer Authentication
  // ==========================================
  async loginWithPassword(
    identifier: string,
    password: string,
  ): Promise<VerifyOTPResponse> {
    const res = await fetch('/api/v1/auth/password/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'کلمه عبور وارد شده نادرست است')
    }
    if (json.data?.token) {
      this.setCustomerToken(json.data.token)
    }
    return json.data
  },

  async registerWithPassword(data: {
    email: string
    password: string
    full_name?: string
    phone?: string
  }): Promise<VerifyOTPResponse> {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ثبت‌نام با ایمیل و رمز عبور')
    }
    if (json.data?.token) {
      this.setCustomerToken(json.data.token)
    }
    return json.data
  },

  async loginWithSocial(
    provider: 'google' | 'github',
    id: string,
    email: string,
    name?: string,
    avatar?: string,
  ): Promise<VerifyOTPResponse> {
    const res = await fetch('/api/v1/auth/social/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, id, email, name, avatar }),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در ورود از طریق حساب کاربری')
    }
    if (json.data?.token) {
      this.setCustomerToken(json.data.token)
    }
    return json.data
  },

  async setCustomerPassword(
    newPassword: string,
    currentPassword?: string,
  ): Promise<void> {
    const token = this.getCustomerToken()
    const res = await fetch('/api/v1/auth/password/set', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_password: newPassword,
        current_password: currentPassword,
      }),
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در تنظیم کلمه عبور')
    }
  },

  async uploadMedia(
    file: File,
  ): Promise<{ file_url: string; file_name: string }> {
    const token = this.getAdminToken()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/v1/admin/upload/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const json = await safeJsonParse(res)
    if (!res.ok || json.code !== 200) {
      throw new Error(json.msg || 'خطا در آپلود تصویر')
    }
    return json.data
  },
}

export const api = apiService
