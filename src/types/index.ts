export type DeliveryMode =
  | 'INSTANT_LINK'
  | 'INSTANT_ACCOUNT'
  | 'UPGRADE_EXISTING'

export interface ProductPlan {
  id: string
  title: string
  duration_days: number
  duration_text: string
  price_toman: number
  original_price_toman?: number
  base_cost_usd?: number
  badge?: string
  is_default: boolean
  delivery_type?: string
  features?: string[]
}

export interface ComparisonColumn {
  key: string
  title: string
  subtitle?: string
  badge?: string
  highlight: boolean
}

export interface ComparisonFeature {
  name: string
  category?: string
  values: Record<string, string>
}

export interface ProductComparison {
  columns: ComparisonColumn[]
  features: ComparisonFeature[]
}

export interface ActivationStep {
  step_number: number
  title: string
  description: string
  icon?: string
  tip?: string
  image_url?: string
}

export interface ProductFAQ {
  question: string
  answer: string
}

export interface ProductSEO {
  meta_title: string
  meta_description: string
  og_image_url?: string
}

export interface Product {
  id: string | number
  title_fa: string
  title_en: string
  slug?: string
  category: string
  delivery_mode: DeliveryMode
  delivery_type?: 'instant' | 'manual_timed'
  price_toman: number
  price_usd: number
  duration_days?: number
  is_shared?: boolean
  sla_minutes?: number
  sla_min_minutes?: number
  sla_max_minutes?: number
  sla_display_text?: string
  operating_hours?: string
  description_fa: string
  features?: string[]
  in_stock: boolean
  stock_count: number
  icon_name?: string
  group_tag?: string
  group_title_fa?: string
  plans?: ProductPlan[]
  comparison_table?: ProductComparison
  activation_guide?: ActivationStep[]
  faqs?: ProductFAQ[]
  seo?: ProductSEO
}

export interface ProductDetail extends Product {
  description: string
  instructions: string
  delivery_strategy?: string
  meta_title?: string
  meta_description?: string
  og_image_url?: string
  plans_json?: string
  comparison_json?: string
  guide_json?: string
  faq_json?: string
  features_json?: string
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
  meta_title?: string
  meta_description?: string
  og_image_url?: string
  plans_json?: string
  comparison_json?: string
  guide_json?: string
  faq_json?: string
  features_json?: string
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
  product_slug?: string
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

  // Corporate profile fields
  is_corporate?: boolean
  company_name?: string
  national_id?: string
  economic_code?: string
  registration_no?: string
  postal_code?: string
  company_address?: string
  company_phone?: string

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
  plan?: ProductPlan
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

// Social Proof & Buyer Reviews Types

export interface ReviewItem {
  id: string
  product_id: string
  product_slug: string
  product_title: string
  order_id?: string
  order_number?: string
  customer_name: string
  customer_phone?: string
  rating: number
  comment: string
  experience_tags: string[]
  status: 'pending' | 'approved' | 'rejected'
  is_verified_buyer: boolean
  is_featured: boolean
  helpful_count: number
  admin_reply?: string
  admin_reply_author?: string
  admin_replied_at?: string
  rejection_reason?: string
  created_at: string
}

export interface RatingBreakdown {
  star_5: number
  star_4: number
  star_3: number
  star_2: number
  star_1: number
  star_5_percent: number
  star_4_percent: number
  star_3_percent: number
  star_2_percent: number
  star_1_percent: number
}

export interface ExperienceTagSummary {
  tag: string
  count: number
  percent: number
}

export interface ProductReviewsSummary {
  average_rating: number
  total_reviews: number
  rating_breakdown: RatingBreakdown
  top_tags: ExperienceTagSummary[]
  verified_buyers_count: number
  satisfaction_rate: number
}

export interface ProductReviewsResponse {
  summary: ProductReviewsSummary
  reviews: ReviewItem[]
  total: number
}

export interface SubmitReviewRequest {
  product_id?: string
  product_slug?: string
  order_id?: string
  order_number?: string
  order_access_token?: string
  customer_phone?: string
  customer_name?: string
  rating: number
  comment?: string
  experience_tags?: string[]
}

export interface SubmitReviewResponse {
  review_id: string
  status: string
  message: string
  requires_approval: boolean
}

export interface ReviewEligibilityResponse {
  eligible: boolean
  reason?: string
  order_id?: string
  order_number?: string
  product_title?: string
  existing_review?: ReviewItem
}

export interface AdminReviewStats {
  total_reviews: number
  pending_reviews: number
  approved_reviews: number
  rejected_reviews: number
  average_rating: number
}

export interface AdminReviewListResponse {
  items: ReviewItem[]
  total: number
  stats: AdminReviewStats
}

// Support & Real Ticketing Engine Types

export type TicketStatusType =
  | 'awaiting_admin' // در انتظار پاسخ پشتیبان
  | 'awaiting_user' // در انتظار پاسخ کاربر
  | 'in_progress' // در حال بررسی
  | 'resolved' // حل شده
  | 'closed' // بسته شده

export type TicketPriorityType = 'low' | 'medium' | 'high' | 'urgent'

export interface TicketAttachment {
  id: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  is_image: boolean
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: 'customer' | 'admin' | 'system'
  sender_id: string
  sender_name: string
  message: string
  attachments: TicketAttachment[]
  is_internal?: boolean
  created_at: string
}

export interface TicketItem {
  id: string
  ticket_number: string
  customer_id: string
  customer_phone: string
  customer_name: string
  customer_email: string
  subject: string
  department: string
  priority: TicketPriorityType
  status: TicketStatusType
  related_order_no?: string
  notify_via_sms: boolean
  notify_via_email: boolean
  assigned_admin_name?: string
  satisfaction_rating?: number
  satisfaction_comment?: string
  last_reply_at?: string
  last_reply_by: 'customer' | 'admin'
  messages_count: number
  created_at: string
  updated_at: string
}

export interface TicketDetailResponse {
  ticket: TicketItem
  messages: TicketMessage[]
}

export interface CreateTicketPayload {
  subject: string
  department: string
  priority?: TicketPriorityType
  related_order_no?: string
  notify_via_sms?: boolean
  notify_via_email?: boolean
  message: string
  attachments?: TicketAttachment[]
}

export interface ReplyTicketPayload {
  message: string
  attachments?: TicketAttachment[]
  notify_via_sms?: boolean
  notify_via_email?: boolean
}

export interface AdminReplyTicketPayload {
  message: string
  is_internal?: boolean
  attachments?: TicketAttachment[]
  status?: TicketStatusType
  notify_sms?: boolean
  notify_email?: boolean
}

export interface AdminUpdateTicketPayload {
  status?: TicketStatusType
  priority?: TicketPriorityType
  department?: string
  assigned_admin_name?: string
  notify_sms?: boolean
  notify_email?: boolean
}

export interface AdminTicketStats {
  total: number
  awaiting_admin: number
  awaiting_user: number
  in_progress: number
  resolved: number
  closed: number
}

export interface AdminTicketListResponse {
  items: TicketItem[]
  total: number
  stats: AdminTicketStats
}

// ==========================================
// Official Tax Invoice & Billing Interfaces
// ==========================================

export interface SellerBillingInfo {
  company_name: string
  brand_fa: string
  national_id: string
  economic_code: string
  registration_no: string
  postal_code: string
  province: string
  city: string
  address: string
  phone: string
  email: string
  website: string
  tax_memory_id: string
  stamp_signature_url: string
}

export interface BuyerBillingInfo {
  is_corporate: boolean
  company_name?: string
  full_name: string
  national_id?: string
  economic_code?: string
  registration_no?: string
  postal_code?: string
  address?: string
  phone: string
  email?: string
}

export interface InvoiceItem {
  row_index: number
  product_id: string
  product_title: string
  product_slug: string
  delivery_type: string
  quantity: number
  unit_price_toman: number
  subtotal_toman: number
  discount_toman: number
  total_after_discount_toman: number
  tax_rate_percent: number
  tax_toman: number
  final_amount_toman: number
}

export interface OfficialInvoice {
  invoice_number: string
  order_number: string
  order_id: string
  invoice_type: 'proforma' | 'official'
  invoice_type_fa: string
  issue_date: string
  issue_date_jalali: string
  paid_at?: string
  paid_at_jalali?: string
  payment_method: string
  payment_method_fa: string
  payment_ref_id?: string
  payment_authority?: string
  payment_status: string
  payment_status_fa: string
  seller: SellerBillingInfo
  buyer: BuyerBillingInfo
  items: InvoiceItem[]
  subtotal_toman: number
  total_discount_toman: number
  amount_after_discount_toman: number
  tax_rate_percent: number
  total_tax_toman: number
  final_total_toman: number
  final_total_toman_words: string
  final_total_rials: number
  notes: string
}

export interface UpdateBuyerInvoicePayload {
  is_corporate: boolean
  company_name?: string
  full_name?: string
  national_id?: string
  economic_code?: string
  registration_no?: string
  postal_code?: string
  address?: string
  phone?: string
  email?: string
}

export interface BillingSettings {
  seller_company_name: string
  seller_brand_fa: string
  seller_national_id: string
  seller_economic_code: string
  seller_registration_no: string
  seller_postal_code: string
  seller_province: string
  seller_city: string
  seller_address: string
  seller_phone: string
  seller_email: string
  seller_website: string
  vat_percent: number
  vat_enabled: boolean
  invoice_notes: string
  tax_memory_id: string
  stamp_signature_url: string
}
