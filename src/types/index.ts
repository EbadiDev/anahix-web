export type DeliveryMode =
  | 'INSTANT_LINK'
  | 'INSTANT_ACCOUNT'
  | 'UPGRADE_EXISTING'

export interface Product {
  id: string | number
  title_fa: string
  title_en: string
  category: string
  delivery_mode: DeliveryMode
  price_toman: number
  price_usd: number
  duration_days?: number
  is_shared?: boolean
  sla_minutes?: number
  description_fa: string
  features?: string[]
  in_stock: boolean
  stock_count: number
  icon_name?: string
}

export interface AdminProduct {
  id: string
  title: string
  title_fa: string
  slug: string
  description?: string
  category: string
  delivery_type: 'instant' | 'manual_timed'
  sla_min_minutes: number
  sla_max_minutes: number
  sla_display_text?: string
  operating_hours?: string
  base_cost_usd: number
  price_toman: number
  is_active: boolean
  instructions?: string
  group_tag: string
  group_title_fa?: string
  delivery_strategy?: string
  available_stock?: number
  created_at?: string
  updated_at?: string
}

export interface PaymentGateway {
  id: number
  name: string
  name_fa?: string
  platform: string
  fee_percentage: number
  is_default: boolean
  icon_type: string
  description_fa: string
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'ALLOCATING_INVENTORY'
  | 'OPERATOR_QUEUE'
  | 'PROCESSING'
  | 'WAITING_CUSTOMER_2FA'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'

export interface Order {
  id: string | number
  order_no: string
  product_id: string | number
  product_title: string
  delivery_mode: DeliveryMode
  amount_toman: number
  status: OrderStatus
  payment_platform: string
  customer_phone: string
  account_email?: string
  two_factor_code?: string
  two_factor_requested_at?: string
  sla_deadline?: string
  delivered_link?: string
  delivered_credentials?: {
    email: string
    password: string
    notes?: string
  }
  token?: string
  two_factor_prompt?: string
  two_factor_status?: string
  delivered_items?: Array<{
    product_title: string
    product_slug?: string
    delivery_type: string
    payload: string
    instructions: string
  }>
  created_at: string
}

export interface ExchangeRateInfo {
  usd_irr: number
  last_updated: string
}

export interface VirtualNumberCatalogItem {
  service: string
  service_name_fa: string
  country: string
  country_name_fa: string
  country_flag: string
  base_cost: number
  price_toman: number
  original_price_toman: number
  available_stock: number
  success_rate_percent: number
  icon: string
}

export interface VirtualNumberService {
  slug: string
  name: string
  name_fa: string
  category: string
  total_qty: number
  min_price_usd: number
  min_price_toman: number
  icon: string
  is_popular: boolean
}

export interface VirtualNumberOperator {
  operator: string
  cost_usd: number
  price_toman: number
  count: number
  rate: number
}

export interface VirtualNumberCountry {
  country: string
  country_name_fa: string
  country_flag: string
  total_stock: number
  best_rate: number
  cheapest_price_toman: number
  cheapest_price_usd: number
  default_operator: string
  operators: VirtualNumberOperator[]
}

export interface VirtualNumberOrder {
  id: string
  order_no: string
  phone: string
  country: string
  country_name_fa: string
  country_flag: string
  service: string
  service_name_fa: string
  price_toman: number
  status: 'PENDING' | 'RECEIVED' | 'FINISHED' | 'CANCELED' | 'TIMEOUT'
  sms_code: string
  sms_text: string
  expires_at: string
  seconds_remaining: number
  created_at: string
}

export interface VirtualNumberSettings {
  enabled: boolean
  api_key_masked: string
  has_api_key: boolean
  margin_percent: number
  usd_rate: number
  rub_rate: number
  default_operator: string
  rate_priority: 'manual' | 'swapwallet'
  live_usd_rate: number
  effective_usd_rate: number
  active_rate_source: string
  balance: number
  rating: number
  status_message: string
  is_mock: boolean
}

export interface AdminProfile {
  token: string
  username: string
  full_name: string
  role: string
}

export interface ProductGroupItem {
  id: string
  title: string
  title_fa: string
  slug: string
  price_toman: number
  delivery_type: string
  delivery_strategy: string
  external_provider: string
  external_product_id: number
  external_product_name: string
  is_active: boolean
}

export interface ProductGroup {
  group_tag: string
  group_title_fa: string
  delivery_strategy: 'manual_operator' | 'third_party_instant'
  linked_provider_product_id?: number
  linked_provider_name?: string
  products_count: number
  products: ProductGroupItem[]
}

export interface InstantDeliverySettings {
  enabled: boolean
  api_key_masked: string
  has_api_key: boolean
  balance_usdt: number
  balance_toman: number
  effective_usd_rate: number
  margin_percent: number
  rate_limit: number
  status_message: string
}

export interface ProviderCatalogItem {
  id: number
  name: string
  emoji: string
  description: string
  price_usdt: number
  price_toman: number
  stock: number
  available: boolean
  unlimited: boolean
  is_linked: boolean
  linked_products?: string[]
}

export type TransactionType =
  | 'store_order'
  | 'virtual_number'
  | 'deposit'
  | 'refund'
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED'

export interface TransactionRecord {
  id: string
  transaction_number: string
  order_id?: string
  order_type: TransactionType
  customer_phone: string
  customer_email: string
  amount_toman: number
  amount_usd: number
  payment_method: string
  payment_ref_id: string
  payment_authority: string
  status: TransactionStatus
  description: string
  metadata?: string
  created_at: string
  updated_at: string
}

export interface AdminActionLogRecord {
  id: string
  admin_id?: string
  admin_username: string
  action: string
  resource: string
  resource_id: string
  description: string
  details: string
  ip_address: string
  user_agent: string
  created_at: string
}

export interface PaginatedLogsResponse<T> {
  total: number
  items: T[]
}

export interface CustomerProfile {
  id: string
  phone: string
  mobile: string
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  balance_toman: number
  balance: number
  referral_code?: string
  referral_balance_toman?: number
  is_active: boolean
  is_admin?: boolean
  created_at: string
}

export interface SendOTPResponse {
  sent: boolean
  cooldown: number
  expires_in: number
  message: string
}

export interface VerifyOTPResponse {
  token: string
  is_new?: boolean
  customer: CustomerProfile
}

export interface SMSSettings {
  provider: string
  api_key_mask: string
  line_number: string
  template_id: string
  is_sandbox: boolean
  live_credit: number
  lines: string[]
}

// Cart & Ecommerce Types

export interface CartItem {
  product: Product
  quantity: number
}

export interface CouponValidation {
  valid: boolean
  code: string
  discount_type: string
  discount_value: number
  discount_toman: number
  final_amount_toman: number
  message: string
}

export interface CouponItem {
  id: string
  code: string
  discount_type: string
  discount_value: number
  min_order_amount_toman: number
  max_discount_toman: number
  per_user_limit: number
  max_usage: number
  current_usage: number
  category: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface ReferralStats {
  referral_code: string
  referral_url: string
  commission_rate_percent: number
  total_referrals: number
  successful_orders: number
  total_commission_toman: number
  withdrawable_commission_toman: number
}

export interface InventoryItem {
  id: string
  product_id: string
  product_title: string
  item_type: string
  status: string
  cost_usd: number
  cost_toman: number
  expiration_date?: string
  batch_tag?: string
  reserved_order_id?: string
  delivered_at?: string
  created_at: string
  payload_preview?: string
}

export interface InventoryStats {
  total_count: number
  available_count: number
  reserved_count: number
  sold_delivered_count: number
  void_count: number
}

export interface WalletLedgerItem {
  id: string
  transaction_number: string
  title: string
  type: string
  amount_toman: number
  status: string
  payment_method: string
  payment_ref_id?: string
  created_at: string
}
