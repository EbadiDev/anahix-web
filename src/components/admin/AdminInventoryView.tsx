import {
  AlertCircle,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  Flame,
  Globe,
  GripVertical,
  HelpCircle,
  Key,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Table,
  Tag,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type {
  AdminProduct,
  InventoryItem,
  InventoryStats,
  ProductPlan,
  StoreCategory,
} from '../../types'
import { getSiteBrandName } from '../../utils/brand'
import { RichContentEditor } from '../content/RichContentEditor'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminBotExplorerView } from './AdminBotExplorerView'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { FetchBotModal } from './FetchBotModal'

interface AdminInventoryViewProps {
  defaultSubTab?: 'catalog' | 'inventory'
  hideHeaderTabs?: boolean
  onOpenFetchBotModal?: () => void
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  defaultSubTab = 'catalog',
  hideHeaderTabs = false,
  onOpenFetchBotModal: _onOpenFetchBotModal,
}) => {
  const [activeSubtab, setActiveSubtab] = useState<'catalog' | 'inventory'>(
    defaultSubTab,
  )
  const [catalogSourceTab, setCatalogSourceTab] = useState<
    'store_products' | 'bot_catalog'
  >('store_products')
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [pOriginalPriceToman, setPOriginalPriceToman] = useState<number>(0)
  const [pDiscountPercent, setPDiscountPercent] = useState<number | string>(0)
  const [pCostToman, setPCostToman] = useState<number>(0)
  const [localFetchBotOpen, setLocalFetchBotOpen] = useState(false)

  // Bulk Import Keys State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [bulkImportProductId, setBulkImportProductId] = useState('')
  const [bulkImportItemType, setBulkImportItemType] = useState('license_key')
  const [bulkImportBatchTag, setBulkImportBatchTag] = useState('')
  const [bulkImportLines, setBulkImportLines] = useState('')
  const [bulkImportLoading, setBulkImportLoading] = useState(false)
  const [copiedKeyId, setCopiedKeyId] = useState<string | number | null>(null)

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubtab(defaultSubTab)
    }
  }, [defaultSubTab])

  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Catalog search & filter state
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogGroupFilter, setCatalogGroupFilter] = useState('all')
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all')

  // Product Modal (Create / Edit) state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  )
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productFormError, setProductFormError] = useState('')

  // Product Form fields (9 Comprehensive Tabs)
  const [productModalTab, setProductModalTab] = useState<
    | 'general'
    | 'delivery'
    | 'plans'
    | 'notice'
    | 'features'
    | 'comparison'
    | 'guide'
    | 'faq'
    | 'trust'
    | 'seo'
  >('general')
  const [pTitleFA, setPTitleFA] = useState('')
  const [pTitleEN, setPTitleEN] = useState('')
  const [pSlug, setPSlug] = useState('')
  const [pCategory, setPCategory] = useState('ai_chat')
  const [pDeliveryType, setPDeliveryType] = useState<
    'instant' | 'manual_timed'
  >('instant')
  const [pGroupTag, setPGroupTag] = useState('general')
  const [pGroupTitleFA, setPGroupTitleFA] = useState('')
  const [pPriceToman, setPPriceToman] = useState<number>(500000)
  const [pBaseCostUSD, setPBaseCostUSD] = useState<number>(0)
  const [pSLAMin, setPSLAMin] = useState<number>(10)
  const [pSLAMax, setPSLAMax] = useState<number>(30)
  const [pSLAText, setPSLAText] = useState('تحویل ۱۰ الی ۳۰ دقیقه')
  const [pOperatingHours, setPOperatingHours] = useState('۹:۰۰ تا ۲۴:۰۰')
  const [pDescription, setPDescription] = useState('')
  const [pInstructions, setPInstructions] = useState('')
  const [pIsActive, setPIsActive] = useState(true)
  const [pDeliveryStrategy, setPDeliveryStrategy] = useState('manual_operator')

  // Upstream Bot & Multi-Delivery fields
  const [pExternalProvider, setPExternalProvider] = useState('manual_vault')
  const [pExternalProductIDStr, setPExternalProductIDStr] = useState('')
  const [pRequiredCustomerInput, setPRequiredCustomerInput] = useState('none')
  const [pDeliveredPayloadType, setPDeliveredPayloadType] =
    useState('license_code')
  const [pPrePurchaseNotice, setPPrePurchaseNotice] = useState('')
  const [pPrePurchaseNoticeMode, setPPrePurchaseNoticeMode] = useState<
    'none' | 'inline' | 'modal_confirm' | 'both'
  >('none')
  const [pPrePurchaseSnoozeDays, setPPrePurchaseSnoozeDays] = useState(7)
  const [pStockDisplayMode, setPStockDisplayMode] = useState<
    'show_exact' | 'show_status_only' | 'hide' | 'custom_text'
  >('show_exact')
  const [pStockMode, setPStockMode] = useState<
    'auto' | 'always_in_stock' | 'manual' | 'out_of_stock'
  >('auto')
  const [pManualStock, setPManualStock] = useState<number>(50)
  const [pOutOfStockText, setPOutOfStockText] = useState(
    'در حال تهیه و تامین مجدد',
  )
  const [activePlanContext, setActivePlanContext] = useState<string>('base')
  const [pShowProgress, setPShowProgress] = useState(true)
  const [pShowSalesCount, setPShowSalesCount] = useState(true)
  const [pLiveUSDTRate, setPLiveUSDTRate] = useState(98500)
  const [pMarginPercent, setPMarginPercent] = useState<number | string>(25.0)
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([])

  // Computed distinct group tags from database products
  const uniqueGroupTags = useMemo(() => {
    const map = new Map<string, string>()
    adminProducts.forEach((p) => {
      if (p.group_tag) {
        map.set(p.group_tag, p.group_title_fa || p.group_tag)
      }
    })
    return Array.from(map.entries()).map(([tag, title]) => ({ tag, title }))
  }, [adminProducts])

  // Product Image & Merchandising Enhancements
  const [pImageURL, setPImageURL] = useState('')
  const [pIconURL, setPIconURL] = useState('')
  const [uploadingProductIcon, setUploadingProductIcon] = useState(false)
  const [pIsFlashSale, setPIsFlashSale] = useState(false)
  const [pFlashSalePriceToman, setPFlashSalePriceToman] = useState<number>(0)
  const [pFlashSaleStock, setPFlashSaleStock] = useState<number>(50)
  const [pFlashSaleSold, setPFlashSaleSold] = useState<number>(0)
  const [pFlashSaleEndAt, setPFlashSaleEndAt] = useState<string>('')
  const [pBadgesText, setPBadgesText] = useState<string>('')
  const [pRatingAverage, setPRatingAverage] = useState<number>(5.0)
  const [pShowRating, setPShowRating] = useState<boolean>(true)
  const [pIsBestSeller, setPIsBestSeller] = useState(false)
  const [pIsFeatured, setPIsFeatured] = useState(false)
  const [uploadingProductImage, setUploadingProductImage] = useState(false)

  // PDP specific form fields
  const [pMetaTitle, setPMetaTitle] = useState('')
  const [pMetaDescription, setPMetaDescription] = useState('')
  const [pOgImageURL, setPOgImageURL] = useState('')
  const [pPlans, setPPlans] = useState<ProductPlan[]>([])
  const [pPlansJSON, setPPlansJSON] = useState('')
  const [pComparisonJSON, setPComparisonJSON] = useState('')
  const [pGuideJSON, setPGuideJSON] = useState('')
  const [pFaqJSON, setPFaqJSON] = useState('')
  const [pFeaturesText, setPFeaturesText] = useState('')

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(
    null,
  )
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [draggedPlanIdx, setDraggedPlanIdx] = useState<number | null>(null)

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportedKeys, setExportedKeys] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [copiedExport, setCopiedExport] = useState(false)

  // Replace Key Modal state
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [replaceOrderId, setReplaceOrderId] = useState('')
  const [replaceOldItemId, setReplaceOldItemId] = useState('')
  const [replaceReason, setReplaceReason] = useState('گارانتی تعویض اکانت')
  const [replaceLoading, setReplaceLoading] = useState(false)
  const [replaceSuccessMsg, setReplaceSuccessMsg] = useState('')
  const [replaceErrorMsg, setReplaceErrorMsg] = useState('')

  // Initial fetch
  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, adminProdsData, deliverySettings, storeCats] =
        await Promise.all([
          apiService.getInventoryStats().catch(() => null),
          apiService.adminListProducts().catch(() => []),
          apiService.getInstantDeliverySettings().catch(() => null),
          apiService.adminGetStoreCategories().catch(() => []),
        ])
      if (statsData) setStats(statsData)
      setAdminProducts(adminProdsData)
      setStoreCategories(storeCats)
      if (deliverySettings?.effective_usd_rate) {
        setPLiveUSDTRate(deliverySettings.effective_usd_rate)
      }

      // Fetch items
      const itemsRes = await apiService
        .listInventory(
          selectedProduct === 'all' ? undefined : selectedProduct,
          selectedStatus === 'all' ? undefined : selectedStatus,
        )
        .catch(() => ({ items: [], total: 0, page: 1, limit: 50 }))
      setItems(itemsRes.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Refetch items when filters change
  useEffect(() => {
    if (activeSubtab === 'inventory') {
      apiService
        .listInventory(
          selectedProduct === 'all' ? undefined : selectedProduct,
          selectedStatus === 'all' ? undefined : selectedStatus,
        )
        .then((res) => setItems(res.items || []))
        .catch(() => setItems([]))
    }
  }, [selectedProduct, selectedStatus, activeSubtab])

  const openCreateProductModal = () => {
    setEditingProduct(null)
    setProductModalTab('general')
    setPTitleFA('')
    setPTitleEN('')
    setPSlug('')
    setPCategory(storeCategories[0]?.slug || 'ai_chat')
    setPDeliveryType('instant')
    setPGroupTag('general')
    setPGroupTitleFA('')
    setPPriceToman(500000)
    setPBaseCostUSD(0)
    setPMarginPercent(25.0)
    setPOriginalPriceToman(0)
    setPDiscountPercent(0)
    setPCostToman(0)
    setPSLAMin(10)
    setPSLAMax(30)
    setPSLAText('تحویل ۱۰ الی ۳۰ دقیقه')
    setPOperatingHours('۹:۰۰ تا ۲۴:۰۰')
    setPDescription('')
    setPInstructions('')
    setPIsActive(true)
    setPDeliveryStrategy('manual_operator')
    setPMetaTitle('')
    setPMetaDescription('')
    setPOgImageURL('')
    setPPlans([])
    setPPlansJSON('')
    setPComparisonJSON('')
    setPGuideJSON('')
    setPFaqJSON('')
    setPFeaturesText('')
    setPExternalProvider('manual_vault')
    setPExternalProductIDStr('')
    setPRequiredCustomerInput('none')
    setPDeliveredPayloadType('license_code')
    setPPrePurchaseNotice('')
    setPPrePurchaseNoticeMode('none')
    setPPrePurchaseSnoozeDays(7)
    setPStockDisplayMode('show_exact')
    setPStockMode('auto')
    setPManualStock(50)
    setPOutOfStockText('در حال تهیه و تامین مجدد')
    setActivePlanContext('base')
    setPShowProgress(true)
    setPShowSalesCount(true)
    setPImageURL('')
    setPIconURL('')
    setPIsFlashSale(false)
    setPFlashSalePriceToman(0)
    setPFlashSaleStock(50)
    setPFlashSaleSold(0)
    setPFlashSaleEndAt('')
    setPBadgesText('')
    setPRatingAverage(5.0)
    setPShowRating(true)
    setPIsBestSeller(false)
    setPIsFeatured(false)
    setProductFormError('')
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (p: AdminProduct) => {
    setEditingProduct(p)
    setProductModalTab('general')
    setPTitleFA(p.title_fa || '')
    setPTitleEN(p.title || '')
    setPSlug(p.slug || '')
    setPCategory(p.category || 'ai_chat')
    setPDeliveryType(p.delivery_type || 'instant')
    setPGroupTag(p.group_tag || 'general')
    setPGroupTitleFA(p.group_title_fa || '')
    setPPriceToman(p.price_toman || 0)
    setPBaseCostUSD(p.base_cost_usd || 0)
    const origPrice = p.original_price_toman || 0
    setPOriginalPriceToman(origPrice)
    if (p.discount_percent && p.discount_percent > 0) {
      setPDiscountPercent(p.discount_percent)
    } else if (origPrice > (p.price_toman || 0) && origPrice > 0) {
      const d = ((origPrice - (p.price_toman || 0)) / origPrice) * 100
      setPDiscountPercent(parseFloat(d.toFixed(1)))
    } else {
      setPDiscountPercent(0)
    }
    setPCostToman(Math.round((p.base_cost_usd || 0) * pLiveUSDTRate))
    if (p.base_cost_usd && p.base_cost_usd > 0 && pLiveUSDTRate > 0) {
      const sellUSD = (p.price_toman || 0) / pLiveUSDTRate
      const m = ((sellUSD - p.base_cost_usd) / p.base_cost_usd) * 100.0
      setPMarginPercent(parseFloat(m.toFixed(2)))
    } else {
      setPMarginPercent(25.0)
    }
    setPSLAMin(p.sla_min_minutes || 10)
    setPSLAMax(p.sla_max_minutes || 30)
    setPSLAText(p.sla_display_text || '')
    setPOperatingHours(p.operating_hours || '')
    setPDescription(p.description || '')
    setPInstructions(p.instructions || '')
    setPIsActive(p.is_active !== false)
    setPDeliveryStrategy(p.delivery_strategy || 'manual_operator')
    setPExternalProvider(p.external_provider || 'manual_vault')
    setPExternalProductIDStr(
      p.external_product_id_str ||
        (p.external_product_id ? String(p.external_product_id) : ''),
    )
    setPRequiredCustomerInput(p.required_customer_input || 'none')
    setPDeliveredPayloadType(p.delivered_payload_type || 'license_code')
    setPPrePurchaseNotice(p.pre_purchase_notice || '')
    setPPrePurchaseNoticeMode(p.pre_purchase_notice_mode || 'none')
    setPPrePurchaseSnoozeDays(p.pre_purchase_snooze_days || 7)
    setPStockDisplayMode(p.stock_display_mode || 'show_exact')
    setPStockMode((p.stock_mode as any) || 'auto')
    setPManualStock(p.manual_stock || 50)
    setPOutOfStockText(p.out_of_stock_text || 'در حال تهیه و تامین مجدد')
    setActivePlanContext('base')
    setPShowProgress(p.show_progress !== false)
    setPShowSalesCount(p.show_sales_count !== false)
    setPImageURL(p.image_url || '')
    setPIconURL(p.icon_url || '')
    setPIsFlashSale(p.is_flash_sale || false)
    setPFlashSalePriceToman(p.flash_sale_price_toman || 0)
    setPFlashSaleStock(p.flash_sale_stock || 50)
    setPFlashSaleSold(p.flash_sale_sold || 0)
    setPFlashSaleEndAt(
      p.flash_sale_end_at ? p.flash_sale_end_at.substring(0, 16) : '',
    )
    if (p.badges_json) {
      try {
        const arr = JSON.parse(p.badges_json)
        if (Array.isArray(arr)) setPBadgesText(arr.join('\n'))
        else setPBadgesText('')
      } catch {
        setPBadgesText('')
      }
    } else {
      setPBadgesText('')
    }
    const r = p.rating_average !== undefined ? Number(p.rating_average) : 5.0
    setPRatingAverage(r > 0 ? r : 5.0)
    setPShowRating(r > 0)
    setPIsBestSeller(p.is_best_seller || false)
    setPIsFeatured(p.is_featured || false)
    setPMetaTitle(p.meta_title || '')
    setPMetaDescription(p.meta_description || '')
    setPOgImageURL(p.og_image_url || '')
    setPPlansJSON(p.plans_json || '')
    setPComparisonJSON(p.comparison_json || '')
    setPGuideJSON(p.guide_json || '')
    setPFaqJSON(p.faq_json || '')

    if (p.plans_json) {
      try {
        const arr = JSON.parse(p.plans_json)
        if (Array.isArray(arr)) setPPlans(arr)
        else setPPlans([])
      } catch {
        setPPlans([])
      }
    } else {
      setPPlans([])
    }

    if (p.features_json) {
      try {
        const arr = JSON.parse(p.features_json)
        if (Array.isArray(arr)) setPFeaturesText(arr.join('\n'))
        else setPFeaturesText('')
      } catch {
        setPFeaturesText('')
      }
    } else {
      setPFeaturesText('')
    }

    setProductFormError('')
    setIsProductModalOpen(true)

    // Background fetch to guarantee full JSON fields
    apiService
      .adminGetProduct(p.id)
      .then((full) => {
        if (full) {
          if (full.meta_title) setPMetaTitle(full.meta_title)
          if (full.meta_description) setPMetaDescription(full.meta_description)
          if (full.og_image_url) setPOgImageURL(full.og_image_url)
          if (full.plans_json) {
            setPPlansJSON(full.plans_json)
            try {
              const arr = JSON.parse(full.plans_json)
              if (Array.isArray(arr)) setPPlans(arr)
            } catch {}
          }
          if (full.comparison_json) setPComparisonJSON(full.comparison_json)
          if (full.guide_json) setPGuideJSON(full.guide_json)
          if (full.faq_json) setPFaqJSON(full.faq_json)
          if (full.features_json) {
            try {
              const arr = JSON.parse(full.features_json)
              if (Array.isArray(arr)) setPFeaturesText(arr.join('\n'))
            } catch {}
          }
        }
      })
      .catch(() => {})
  }

  const handleUploadProductImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProductImage(true)
    try {
      const resp = await apiService.uploadMedia(file)
      setPImageURL(resp.file_url)
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در بارگذاری عکس محصول')
    } finally {
      setUploadingProductImage(false)
    }
  }

  const handleUploadProductIcon = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProductIcon(true)
    try {
      const resp = await apiService.uploadMedia(file)
      setPIconURL(resp.file_url)
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در بارگذاری آیکون محصول')
    } finally {
      setUploadingProductIcon(false)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pTitleFA.trim()) {
      setProductFormError('لطفاً عنوان فارسی محصول را وارد کنید')
      return
    }
    if (!pTitleEN.trim()) {
      setProductFormError('لطفاً عنوان انگلیسی محصول را وارد کنید')
      return
    }
    if (pPriceToman <= 0) {
      setProductFormError('قیمت فروش محصول به تومان باید بیشتر از صفر باشد')
      return
    }

    const slugFinal = pSlug.trim()
      ? pSlug.trim().toLowerCase().replace(/\s+/g, '-')
      : pTitleEN
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `prod-${Date.now()}`

    setProductSubmitting(true)
    setProductFormError('')

    const featuresList = pFeaturesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const finalPlansJSON =
      pPlans.length > 0 ? JSON.stringify(pPlans, null, 2) : pPlansJSON.trim()

    const payload: Partial<AdminProduct> = {
      title_fa: pTitleFA.trim(),
      title: pTitleEN.trim(),
      slug: slugFinal,
      category: pCategory,
      delivery_type: pDeliveryType,
      group_tag: pGroupTag,
      group_title_fa: pGroupTitleFA.trim() || undefined,
      price_toman: Number(pPriceToman),
      original_price_toman: Number(pOriginalPriceToman) || undefined,
      discount_percent: Number(pDiscountPercent) || undefined,
      base_cost_usd: Number(pBaseCostUSD) || 0,
      sla_min_minutes: Number(pSLAMin) || 10,
      sla_max_minutes: Number(pSLAMax) || 30,
      sla_display_text: pSLAText.trim(),
      operating_hours: pOperatingHours.trim(),
      description: pDescription.trim(),
      instructions: pInstructions.trim(),
      is_active: pIsActive,
      delivery_strategy: pDeliveryStrategy,
      meta_title: pMetaTitle.trim() || undefined,
      meta_description: pMetaDescription.trim() || undefined,
      og_image_url: pOgImageURL.trim() || undefined,
      image_url: pImageURL.trim() || undefined,
      icon_url: pIconURL.trim() || undefined,
      is_flash_sale: pIsFlashSale,
      flash_sale_price_toman: Number(pFlashSalePriceToman) || 0,
      flash_sale_stock: Number(pFlashSaleStock) || 0,
      flash_sale_sold: Number(pFlashSaleSold) || 0,
      flash_sale_end_at: pFlashSaleEndAt
        ? new Date(pFlashSaleEndAt).toISOString()
        : undefined,
      badges_json: pBadgesText.trim()
        ? JSON.stringify(
            pBadgesText
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean),
          )
        : undefined,
      rating_average: pShowRating ? Number(pRatingAverage) || 5.0 : 0,
      is_best_seller: pIsBestSeller,
      is_featured: pIsFeatured,
      external_provider: pExternalProvider,
      external_product_id_str: pExternalProductIDStr,
      required_customer_input: pRequiredCustomerInput,
      delivered_payload_type: pDeliveredPayloadType,
      pre_purchase_notice: pPrePurchaseNotice,
      pre_purchase_notice_mode: pPrePurchaseNoticeMode,
      pre_purchase_snooze_days: pPrePurchaseSnoozeDays,
      stock_display_mode: pStockDisplayMode,
      stock_mode: pStockMode,
      manual_stock: Number(pManualStock) || 0,
      out_of_stock_text: pOutOfStockText.trim() || undefined,
      show_sales_count: pShowSalesCount,
      show_progress: pShowProgress,
      plans_json: finalPlansJSON || undefined,
      comparison_json: pComparisonJSON.trim() || undefined,
      guide_json: pGuideJSON.trim() || undefined,
      faq_json: pFaqJSON.trim() || undefined,
      features_json:
        featuresList.length > 0 ? JSON.stringify(featuresList) : undefined,
    }

    try {
      if (editingProduct) {
        await apiService.adminUpdateProduct(editingProduct.id, payload)
      } else {
        await apiService.adminCreateProduct(payload)
      }
      setIsProductModalOpen(false)
      loadData()
    } catch (err: any) {
      setProductFormError(err.message || 'خطا در ثبت اطلاعات محصول')
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleGenerateDefaultPlans = () => {
    const basePrice = pPriceToman > 0 ? pPriceToman : 1500000
    const originalBase = Math.round((basePrice * 1.18) / 10000) * 10000
    const threeMonth = Math.round((basePrice * 2.8) / 10000) * 10000
    const threeMonthOrig = Math.round((basePrice * 3.4) / 10000) * 10000
    const oneYear = Math.round((basePrice * 9.5) / 10000) * 10000
    const oneYearOrig = Math.round((basePrice * 12.0) / 10000) * 10000

    const defaultPlans: ProductPlan[] = [
      {
        id: 'plan-1m',
        title: 'اشتراک ۱ ماهه اختصاصی',
        duration_days: 30,
        duration_text: '۱ ماهه',
        price_toman: basePrice,
        original_price_toman: originalBase,
        base_cost_usd: pBaseCostUSD || 20,
        badge: 'محبوب‌ترین',
        is_default: true,
        delivery_type: pDeliveryType,
        features: [
          'دسترسی کامل به تمامی امکانات نسخه پرو',
          'گارانتی ۳۰ روزه تعویض و عدم قطعی',
          'پشتیبانی ۲۴ ساعته تلگرام',
        ],
      },
      {
        id: 'plan-3m',
        title: 'اشتراک ۳ ماهه اقتصادی',
        duration_days: 90,
        duration_text: '۳ ماهه',
        price_toman: threeMonth,
        original_price_toman: threeMonthOrig,
        base_cost_usd: (pBaseCostUSD || 20) * 2.8,
        badge: 'تخفیف ویژه',
        is_default: false,
        delivery_type: pDeliveryType,
        features: [
          'صرفه‌جویی قابل توجه در هزینه نسبت به ماهانه',
          'گارانتی کامل ۹۰ روزه اختصاصی',
          'اولویت بالا در صف پردازش سفارشات',
        ],
      },
      {
        id: 'plan-1y',
        title: 'اشتراک ۱ ساله ویژه',
        duration_days: 365,
        duration_text: '۱ ساله',
        price_toman: oneYear,
        original_price_toman: oneYearOrig,
        base_cost_usd: (pBaseCostUSD || 20) * 9.5,
        badge: 'بیشترین تخفیف',
        is_default: false,
        delivery_type: pDeliveryType,
        features: [
          'بیشترین صرفه‌جویی و راحتی بدون نیاز به تمدید ماهانه',
          'پشتیبانی VIP و گارانتی ۳۶۵ روزه',
          'دسترسی زودهنگام به مدل‌ها و قابلیت‌های جدید',
        ],
      },
    ]

    setPPlans(defaultPlans)
    setPPlansJSON(JSON.stringify(defaultPlans, null, 2))
  }

  const handleGenerateDefaultSEO = () => {
    const title = pTitleFA.trim() || 'سرویس دیجیتال'
    const brandName = getSiteBrandName()
    setPMetaTitle(`خرید ${title} | تحویل آنی و قانونی - ${brandName}`)
    setPMetaDescription(
      pDescription.trim() ||
        `خرید اشتراک قانونی ${title} با تحویل فوری، گارانتی عدم قطعی، پرداخت شتابی و پشتیبانی ۲۴ ساعته در ${brandName}.`,
    )
    setPOgImageURL('/assets/hero.png')
  }

  const handleGenerateDefaultComparison = () => {
    const brand = `${pGroupTag} ${pTitleEN}`.toLowerCase()
    if (brand.includes('chatgpt')) {
      setPComparisonJSON(
        JSON.stringify(
          {
            columns: [
              {
                key: 'free',
                title: 'نسخه رایگان (Free)',
                subtitle: 'کاربری عمومی روزمره',
                highlight: false,
              },
              {
                key: 'plus',
                title: 'نسخه پلاس (ChatGPT Plus)',
                subtitle: 'ارائه شده توسط آناهیکس',
                badge: 'پیشنهاد ما',
                highlight: true,
              },
              {
                key: 'team',
                title: 'نسخه تیمی (Team Plan)',
                subtitle: 'سازمان‌ها و گروه‌ها',
                highlight: false,
              },
            ],
            features: [
              {
                name: 'دسترسی به قدرتمندترین مدل‌ها (GPT-4o و o1)',
                category: 'مدل‌های پردازشی',
                values: {
                  free: 'بسیار محدود',
                  plus: 'نامحدود و کامل',
                  team: 'نامحدود و با سقف دوبرابر',
                },
              },
              {
                name: 'سقف ارسال پیام در هر ۳ ساعت',
                category: 'محدودیت استفاده',
                values: {
                  free: '۱۰ پیام در روز',
                  plus: '۸۰ پیام در هر ۳ ساعت',
                  team: '۱۰۰+ پیام در هر ۳ ساعت',
                },
              },
              {
                name: 'دستیار صوتی زنده (Advanced Voice Mode)',
                category: 'امکانات نسل جدید',
                values: {
                  free: 'غیرفعال',
                  plus: 'فعال با مکالمه آنی و طبیعی',
                  team: 'فعال با پهنای باند اختصاصی',
                },
              },
              {
                name: 'ساخت و شخصی‌سازی GPT اختصاصی (Custom GPTs)',
                category: 'ابزارهای سفارشی',
                values: {
                  free: 'فقط مشاهده',
                  plus: 'ساخت نامحدود + انتشار عمومی',
                  team: 'اشتراک‌گذاری درون‌سازمانی',
                },
              },
              {
                name: 'تحلیل پیشرفته داده‌ها، جداول و کد پایتون',
                category: 'تحلیل و پردازش',
                values: {
                  free: 'محدود به فایل‌های سبک',
                  plus: 'کاملاً نامحدود برای فایل‌های سنگین',
                  team: 'نامحدود با امنیت محرمانه',
                },
              },
              {
                name: 'ضمانت عدم قطعی و پشتیبانی مستقیم ریالی',
                category: 'گارانتی آناهیکس',
                values: {
                  free: 'ندارد',
                  plus: 'ضمانت ۳۰ روزه بازگشت وجه',
                  team: 'پشتیبانی قرارداد تجاری',
                },
              },
            ],
          },
          null,
          2,
        ),
      )
    } else if (brand.includes('gemini')) {
      setPComparisonJSON(
        JSON.stringify(
          {
            columns: [
              {
                key: 'free',
                title: 'گوگل جمینای استاندارد',
                subtitle: 'حساب رایگان گوگل',
                highlight: false,
              },
              {
                key: 'advanced',
                title: 'جمینای ادونس (Gemini Advanced)',
                subtitle: 'لایسنس ۱۸ ماهه آناهیکس',
                badge: 'ارزش خرید بالا',
                highlight: true,
              },
            ],
            features: [
              {
                name: 'مدل هوش مصنوعی',
                category: 'مدل و هوش',
                values: {
                  free: 'Gemini 1.5 Flash',
                  advanced: 'Gemini 1.5 Pro با عمیق‌ترین استدلال',
                },
              },
              {
                name: 'حجم کانتکست (پنجره متنی)',
                category: 'حافظه متنی',
                values: {
                  free: '۳۲ هزار توکن',
                  advanced: '۱ تا ۲ میلیون توکن (تحلیل کتاب و ویدیو)',
                },
              },
              {
                name: 'فضای ذخیره‌سازی ابری Google One',
                category: 'سرویس‌های ابری',
                values: {
                  free: '۱۵ گیگابایت اشتراکی',
                  advanced: '۲ ترابایت (۲,۰۰۰ گیگابایت) ابری گوگل',
                },
              },
              {
                name: 'یکپارچگی هوشمند با Google Docs و Gmail',
                category: 'بهره‌وری Workspace',
                values: {
                  free: 'غیرفعال',
                  advanced: 'دستیار نگارش و خلاصه‌سازی مستقیم در جیمیل',
                },
              },
              {
                name: 'شیوه تحویل و فعال‌سازی',
                category: 'نحوه دریافت',
                values: {
                  free: 'رایگان',
                  advanced: 'تحویل آنی لینک بدون نیاز به پسورد',
                },
              },
            ],
          },
          null,
          2,
        ),
      )
    } else {
      setPComparisonJSON(
        JSON.stringify(
          {
            columns: [
              {
                key: 'standard',
                title: 'پلن پایه / رایگان',
                subtitle: 'امکانات محدود',
                highlight: false,
              },
              {
                key: 'premium',
                title: pTitleFA || 'پلن پریمیوم آناهیکس',
                subtitle: 'ارائه اختصاصی',
                badge: 'بهترین انتخاب',
                highlight: true,
              },
            ],
            features: [
              {
                name: 'دسترسی نامحدود و بدون فیلتر',
                category: 'دسترسی',
                values: {
                  standard: 'با محدودیت و وقفه',
                  premium: 'دسترسی کامل بدون افت کیفیت',
                },
              },
              {
                name: 'سرعت پردازش و اولویت سرور',
                category: 'سرعت',
                values: {
                  standard: 'عادی',
                  premium: 'حداکثر سرعت و بدون صف انتظار',
                },
              },
              {
                name: 'امنیت پرداخت و حساب کاربری',
                category: 'امنیت',
                values: {
                  standard: 'نامشخص',
                  premium: '۱۰۰٪ قانونی با ضمانت عدم مسدودی',
                },
              },
              {
                name: 'پشتیبانی و گارانتی بازگشت وجه',
                category: 'پشتیبانی',
                values: {
                  standard: 'ندارد',
                  premium: 'گارانتی طلایی آناهیکس',
                },
              },
            ],
          },
          null,
          2,
        ),
      )
    }
  }

  const handleGenerateDefaultGuide = () => {
    if (pDeliveryType === 'instant') {
      setPGuideJSON(
        JSON.stringify(
          [
            {
              step_number: 1,
              title: 'انتخاب پلن و پرداخت ریالی',
              description:
                'مدت زمان مد نظر خود را انتخاب کرده و هزینه را از طریق درگاه‌های امن شتابی یا تتر پرداخت فرمایید.',
              icon: 'credit-card',
              tip: 'پس از پرداخت موفق، فوراً به صفحه پیگیری سفارش هدایت می‌شوید.',
            },
            {
              step_number: 2,
              title: 'دریافت آنی لینک یا اطلاعات حساب',
              description:
                'در کسری از ثانیه لینک فعال‌سازی اختصاصی یا مشخصات اکانت در پنل شما قرار می‌گیرد.',
              icon: 'key',
              tip: 'یک نسخه از اطلاعات سفارش نیز از طریق پیامک برای شما ارسال می‌گردد.',
            },
            {
              step_number: 3,
              title: 'تنظیم DNS یا رفع تحریم اولیه',
              description:
                'برای ورود بدون دردسر، اطمینان حاصل فرمایید از اینترنت پایدار و در صورت لزوم DNSهای رفع تحریم نظیر شکن یا الکترو استفاده می‌کنید.',
              icon: 'globe',
              tip: 'دی ان اس پیشنهادی شکن: 178.22.122.100 و 185.51.200.2',
            },
            {
              step_number: 4,
              title: 'ورود و استفاده نامحدود',
              description:
                'روی لینک کلیک کرده یا مشخصات را در وب‌سایت مرجع وارد کنید و بلافاصله از تمامی امکانات پریمیوم لذت ببرید.',
              icon: 'sparkles',
              tip: 'در صورت داشتن هرگونه سوال، تیم پشتیبانی فنی آماده راهنمایی شماست.',
            },
          ],
          null,
          2,
        ),
      )
    } else {
      setPGuideJSON(
        JSON.stringify(
          [
            {
              step_number: 1,
              title: 'ثبت مشخصات اکانت و پرداخت',
              description:
                'پلن مورد نظر را انتخاب و ایمیل و پسورد اکانت خود را در کادرهای امن ثبت سفارش وارد کنید.',
              icon: 'credit-card',
              tip: 'اطلاعات شما با الگوریتم AES-256 رمزنگاری شده و غیرقابل نفوذ است.',
            },
            {
              step_number: 2,
              title: 'آغاز فعال‌سازی توسط اپراتور',
              description:
                'سفارش شما وارد میز کار اپراتور شده و فرآیند پرداخت ارزی قانونی با کارت معتبر بین‌المللی شروع می‌شود.',
              icon: 'user-check',
              tip: 'زمان معمول انجام این مرحله بین ۱۵ الی ۳۰ دقیقه در ساعات کاری است.',
            },
            {
              step_number: 3,
              title: 'تبادل زنده کد دو مرحله‌ای (2FA)',
              description:
                'در صورت فعال بودن کد تایید دو مرحله‌ای، نوتیفیکیشن لایو در صفحه پیگیری به شما نمایش داده می‌شود تا کد پیامک شده را درج کنید.',
              icon: 'shield-check',
              tip: 'این تبادل بدون نیاز به تماس تلفنی و کاملاً اتوماتیک در مرورگر شما انجام می‌گیرد.',
            },
            {
              step_number: 4,
              title: 'اتمام کار و پاکسازی کامل رمزها (Zeroize)',
              description:
                'اشتراک شما ارتقا یافته و رمز عبور وارد شده بلافاصله برای همیشه از سیستم امحا می‌شود.',
              icon: 'sparkles',
              tip: 'اکانت شخصی شما اکنون آماده استفاده با دسترسی‌های حرفه‌ای است.',
            },
          ],
          null,
          2,
        ),
      )
    }
  }

  const handleGenerateDefaultFaqs = () => {
    setPFaqJSON(
      JSON.stringify(
        [
          {
            question: 'ضمانت این محصول به چه صورت است؟',
            answer:
              'تمامی محصولات ارائه شده در آناهیکس دارای ضمانت کامل اصالت و سلامت در طول کل مدت اشتراک هستند و در صورت بروز هرگونه اختلال، پشتیبانی سریعاً تعویض یا رفع اشکال می‌نماید.',
          },
          {
            question: 'تحویل سفارش چقدر زمان می‌برد؟',
            answer:
              'محصولات با برچسب تحویل آنی ظرف ۰ ثانیه تحویل می‌شوند. سفارشات نیازمند مداخله اپراتور معمولاً بین ۱۵ تا ۳۰ دقیقه در ساعات کاری فعال می‌گردند.',
          },
          {
            question: 'برای ورود به این سرویس چه DNS یا تنظیماتی نیاز است؟',
            answer:
              'به منظور عبور از تحریم‌های منطقه‌ای علیه کاربران ایرانی، پیشنهاد می‌کنیم از دی‌ان‌اس شکن (178.22.122.100) یا نرم‌افزار الکترو استفاده فرمایید.',
          },
          {
            question: 'آیا پس از اتمام دوره امکان تمدید مجدد وجود دارد؟',
            answer:
              'بله، شما می‌توانید پیش از اتمام مهلت اشتراک، سفارش تمدید خود را در سایت ثبت نمایید تا سرویس بدون قطعی ادامه یابد.',
          },
        ],
        null,
        2,
      ),
    )
  }

  const handleToggleProductActive = async (p: AdminProduct) => {
    try {
      const updated = await apiService.adminUpdateProduct(p.id, {
        is_active: !p.is_active,
      })
      setAdminProducts((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, is_active: updated.is_active } : item,
        ),
      )
    } catch (err: any) {
      console.error('Error toggling product active status:', err)
    }
  }

  const openDeleteModal = (p: AdminProduct) => {
    setProductToDelete(p)
    setIsDeleteModalOpen(true)
  }

  // Plans Drag & Drop Handlers
  const handlePlanDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedPlanIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  const handlePlanDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handlePlanDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggedPlanIdx === null || draggedPlanIdx === targetIdx) {
      setDraggedPlanIdx(null)
      return
    }

    const updated = [...pPlans]
    const [moved] = updated.splice(draggedPlanIdx, 1)
    updated.splice(targetIdx, 0, moved)

    setPPlans(updated)
    setPPlansJSON(JSON.stringify(updated, null, 2))
    setDraggedPlanIdx(null)
  }

  const movePlan = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= pPlans.length) return
    const updated = [...pPlans]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)
    setPPlans(updated)
    setPPlansJSON(JSON.stringify(updated, null, 2))
  }

  const handleDeleteProductSubmit = async () => {
    if (!productToDelete) return
    setDeleteLoading(true)
    try {
      await apiService.adminDeleteProduct(productToDelete.id)
      setIsDeleteModalOpen(false)
      setProductToDelete(null)
      loadData()
    } catch {
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    setIsExportOpen(true)
    try {
      const keys = await apiService.exportInventoryKeys(
        selectedProduct === 'all' ? undefined : selectedProduct,
        selectedStatus === 'all' ? undefined : selectedStatus,
      )
      setExportedKeys(keys)
    } catch {
      setExportedKeys([])
    } finally {
      setExportLoading(false)
    }
  }

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedKeys.join('\n'))
    setCopiedExport(true)
    setTimeout(() => setCopiedExport(false), 2000)
  }

  const handleReplaceKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReplaceLoading(true)
    setReplaceSuccessMsg('')
    setReplaceErrorMsg('')
    try {
      const res = await apiService.replaceInventoryKey(
        replaceOrderId,
        replaceOldItemId,
        replaceReason,
      )
      setReplaceSuccessMsg(
        `کلید جدید با شناسه #${res.new_inventory_item_id} با موفقیت جایگزین شد.`,
      )
      setTimeout(() => {
        setIsReplaceOpen(false)
        setReplaceSuccessMsg('')
        setReplaceOrderId('')
        setReplaceOldItemId('')
        loadData()
      }, 2000)
    } catch (err: any) {
      setReplaceErrorMsg(err.message || 'خطا در تعویض کلید')
    } finally {
      setReplaceLoading(false)
    }
  }

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkImportProductId || !bulkImportLines.trim()) return

    const lines = bulkImportLines
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length === 0) return

    setBulkImportLoading(true)
    try {
      const resp = await apiService.bulkImportInventory({
        product_id: bulkImportProductId,
        item_type: bulkImportItemType,
        items: lines,
        batch_tag: bulkImportBatchTag.trim() || undefined,
      })
      notifySuccess(
        'واردسازی موفق',
        `${resp.imported_count || lines.length} قلم کلید لایسنس جدید با موفقیت در انبار ثبت گردید.`,
      )
      setIsBulkImportOpen(false)
      setBulkImportLines('')
      setBulkImportBatchTag('')
      loadData()
    } catch (err: any) {
      notifyError('خطا در واردسازی', err.message)
    } finally {
      setBulkImportLoading(false)
    }
  }

  const handleCopyKey = (keyText: string, id: string | number) => {
    navigator.clipboard.writeText(keyText)
    setCopiedKeyId(id)
    notifySuccess('کپی شد', 'کلید لایسنس در کلیپ‌بورد کپی شد.')
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const filteredAdminProducts = adminProducts.filter((p) => {
    const q = catalogSearch.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.title_fa?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.group_tag?.toLowerCase().includes(q)

    const matchesGroup =
      catalogGroupFilter === 'all' || p.group_tag === catalogGroupFilter
    const matchesCategory =
      catalogCategoryFilter === 'all' || p.category === catalogCategoryFilter

    return matchesSearch && matchesGroup && matchesCategory
  })

  const filteredItems = items.filter((it) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      it.product_title?.toLowerCase().includes(q) ||
      it.payload_preview?.toLowerCase().includes(q) ||
      it.batch_tag?.toLowerCase().includes(q)
    )
  })

  const renderPlanContextBar = (tabName: string) => {
    if (pPlans.length === 0) return null
    return (
      <div className="p-3 rounded-surface bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-right mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-brand" />
          <span className="font-bold text-foreground">
            پیکربندی {tabName} برای دوره:{' '}
          </span>
          <span className="font-black text-brand">
            {activePlanContext === 'base'
              ? 'تمامی دوره‌ها (سراسری)'
              : pPlans.find((pl) => pl.id === activePlanContext)?.title ||
                activePlanContext}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActivePlanContext('base')}
            className={`px-2 py-0.5 rounded-control text-[10px] font-bold border transition-all cursor-pointer ${
              activePlanContext === 'base'
                ? 'bg-brand text-brand-foreground border-brand font-black shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border-border/40'
            }`}
          >
            تمامی دوره‌ها (سراسری)
          </button>
          {pPlans.map((pl, pIdx) => (
            <button
              key={pl.id || `pl-ctx-${pIdx}`}
              type="button"
              onClick={() => setActivePlanContext(pl.id || `plan-${pIdx}`)}
              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                activePlanContext === (pl.id || `plan-${pIdx}`)
                  ? 'bg-brand text-brand-foreground border-brand font-black shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border/40'
              }`}
            >
              <span>{pl.title}</span>
              {pl.badge && (
                <span className="text-[9px] px-1 rounded-control bg-brand/15 text-brand font-black">
                  {pl.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs (only shown when standalone, hidden in AdminOperationsCenterView) */}
      {!hideHeaderTabs && (
        <>
          <AdminHeaderBanner
            icon={Package}
            title="محصولات و انبار لایسنس‌ها"
            subtitle="کاتالوگ، موجودی انبار لایسنس‌ها و قیمت‌گذاری محصولات"
            badgeText="کاتالوگ و انبارداری"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-surface border border-border/60 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveSubtab('catalog')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                  activeSubtab === 'catalog'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>کاتالوگ محصولات ({adminProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubtab('inventory')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-control text-xs duration-motion ease-motion transition-all cursor-pointer ${
                  activeSubtab === 'inventory'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Key className="h-3.5 w-3.5" />
                <span>موجودی لایسنس و کلیدها</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Metrics Row for Catalog */}
      {activeSubtab === 'catalog' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-medium text-muted-foreground block">
              کل محصولات کاتالوگ
            </span>
            <span className="text-xl font-black text-foreground mt-1 block font-mono">
              {adminProducts.length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              فعال در ویترین فروشگاه
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.is_active)
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
              تحویل آنی کلید / وب‌هوک
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.delivery_type === 'instant')
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 block">
              ارتقای دستی / اپراتور (Mode C)
            </span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block font-mono">
              {adminProducts
                .filter((p) => p.delivery_type === 'manual_timed')
                .length.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      )}

      {/* SUBTAB 0: PRODUCT CATALOG MANAGEMENT */}
      {activeSubtab === 'catalog' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                aria-label="فیلتر دسته‌بندی"
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                <option value="ai_chat">هوش مصنوعی و چت‌بات</option>
                <option value="coding_ai">دستیار کدنویسی</option>
                <option value="ai_account">اکانت اختصاصی</option>
                <option value="personal_upgrade">ارتقای اکانت شخصی</option>
                <option value="vpn">فیلترشکن و شبکه</option>
                <option value="api_key">کلید API</option>
              </select>

              {/* Group Tag Filter */}
              <select
                aria-label="فیلتر برند و گروه"
                value={catalogGroupFilter}
                onChange={(e) => setCatalogGroupFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">همه گروه‌ها و برندها</option>
                <option value="chatgpt">ChatGPT / OpenAI</option>
                <option value="claude">Claude / Anthropic</option>
                <option value="gemini">Gemini / Google</option>
                <option value="cursor">Cursor AI</option>
                <option value="vpn">VPN / شبکه</option>
                <option value="general">عمومی (General)</option>
              </select>

              {/* Search Box with Debounce & Clear */}
              <div className="w-56">
                <SearchInput
                  value={catalogSearch}
                  onChange={setCatalogSearch}
                  placeholder="جستجو در عنوان، اسلاگ..."
                  debounceMs={250}
                />
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="تازه‌سازی لیست"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {/* Action Buttons: Fetch from Bots & Manual Creation */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 rounded-control bg-muted/40 border border-border/60">
                <button
                  type="button"
                  onClick={() => setCatalogSourceTab('store_products')}
                  className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                    catalogSourceTab === 'store_products'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 inline ml-1.5" />
                  <span>محصولات فروشگاه ({adminProducts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCatalogSourceTab('bot_catalog')}
                  className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                    catalogSourceTab === 'bot_catalog'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 inline ml-1.5 text-brand" />
                  <span>کاتالوگ زنده ۵ ربات و تامین‌کنندگان</span>
                </button>
              </div>

              <button
                type="button"
                onClick={openCreateProductModal}
                className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>ایجاد محصول دستی</span>
              </button>
            </div>
          </div>

          {/* Conditional View: Store Products vs Bot Live Catalog */}
          {catalogSourceTab === 'bot_catalog' ? (
            <AdminBotExplorerView onProductImported={() => loadData()} />
          ) : (
            /* Products Table */
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="text-xs">
                    در حال بارگذاری کاتالوگ محصولات...
                  </span>
                </div>
              ) : filteredAdminProducts.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-3">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/40 stroke-1" />
                  <div className="text-sm font-semibold">
                    محصولی در کاتالوگ یافت نشد
                  </div>
                  <p className="text-xs max-w-sm mx-auto text-muted-foreground/70">
                    محصولات پیش‌فرض هاردکد با موفقیت حذف شدند. اکنون می‌توانید
                    اولین محصول فروشگاه را با مشخصات دلخواه ایجاد کنید.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateProductModal}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ایجاد اولین محصول</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] font-bold select-none">
                      <tr>
                        <th className="p-3.5 text-center">
                          محصول، تصویر و عنوان
                        </th>
                        <th className="p-3.5 text-center">
                          دسته‌بندی و شیوه تحویل
                        </th>
                        <th className="p-3.5 text-center">
                          قیمت فروش و بهای خرید (تومان)
                        </th>
                        <th className="p-3.5 text-center">
                          موجودی انبار و زمان تحویل
                        </th>
                        <th className="p-3.5 text-center">وضعیت انتشار</th>
                        <th className="p-3.5 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredAdminProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30 transition">
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="relative w-12 h-12 rounded-control bg-secondary border border-border/60 overflow-hidden shrink-0 flex items-center justify-center">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.title_fa}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-muted-foreground/50" />
                                )}
                                {p.icon_url && (
                                  <img
                                    src={p.icon_url}
                                    alt="آیکون"
                                    className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-card p-0.5 border border-border/60 shadow-xs"
                                  />
                                )}
                              </div>
                              <div className="text-right min-w-0">
                                <div className="font-bold text-foreground flex items-center gap-2">
                                  <span>{p.title_fa}</span>
                                  {p.group_tag && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-control bg-brand/10 text-brand font-mono font-latin">
                                      {p.group_tag}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-latin">
                                  <span>{p.title}</span>
                                  <span className="text-[10px] text-muted-foreground/70">
                                    ({p.slug})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                                {p.category === 'ai_chat'
                                  ? 'هوش مصنوعی'
                                  : p.category === 'coding_ai'
                                    ? 'دستیار کد'
                                    : p.category === 'personal_upgrade'
                                      ? 'ارتقای اکانت'
                                      : p.category === 'vpn'
                                        ? 'شبکه و VPN'
                                        : p.category}
                              </span>
                              <span
                                className={`text-[10px] font-semibold flex items-center gap-1 ${
                                  p.delivery_type === 'instant'
                                    ? 'text-emerald-500'
                                    : 'text-amber-500'
                                }`}
                              >
                                {p.delivery_type === 'instant'
                                  ? '⚡ تحویل آنی خودکار'
                                  : '👤 دستی اپراتور (Mode C)'}
                              </span>
                            </div>
                          </td>

                          {/* Vertical Price Stacked Column */}
                          <td className="p-3.5 text-center font-latin">
                            <div className="font-black text-sm text-foreground">
                              {Number(p.price_toman).toLocaleString('fa-IR')}{' '}
                              <span className="text-[10px] font-normal text-muted-foreground font-sans">
                                تومان
                              </span>
                            </div>
                            {p.base_cost_usd > 0 ? (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                خرید:{' '}
                                {Math.round(
                                  p.base_cost_usd * pLiveUSDTRate,
                                ).toLocaleString('fa-IR')}{' '}
                                ت
                                {p.price_toman >
                                  Math.round(
                                    p.base_cost_usd * pLiveUSDTRate,
                                  ) && (
                                  <span className="text-emerald-500 font-bold mr-1">
                                    (+
                                    {(
                                      p.price_toman -
                                      Math.round(
                                        p.base_cost_usd * pLiveUSDTRate,
                                      )
                                    ).toLocaleString('fa-IR')}{' '}
                                    ت)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                بدون هزینه ارزی
                              </div>
                            )}
                          </td>

                          {/* Vertical Stock & Delivery Stacked Column */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-mono font-latin">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  p.stock_mode === 'out_of_stock'
                                    ? 'bg-rose-500'
                                    : p.stock_mode === 'always_in_stock'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : (p.available_stock ?? 0) > 0 ||
                                          p.delivery_type !== 'instant'
                                        ? 'bg-emerald-500'
                                        : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-mono font-bold text-xs">
                                {p.stock_mode === 'always_in_stock'
                                  ? 'همیشه موجود (سفارش‌پذیر)'
                                  : p.stock_mode === 'manual'
                                    ? `${(p.manual_stock || 0).toLocaleString('fa-IR')} عدد دستی`
                                    : p.stock_mode === 'out_of_stock'
                                      ? p.out_of_stock_text || 'ناموجود'
                                      : (p.available_stock ?? 0) > 0
                                        ? `${(p.available_stock ?? 0).toLocaleString('fa-IR')} کلید موجود در انبار`
                                        : p.out_of_stock_text ||
                                          'اتمام موجودی (۰)'}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {p.delivery_type === 'instant'
                                ? '⚡ تحویل آنی خودکار'
                                : p.sla_display_text ||
                                  `${p.sla_min_minutes} الی ${p.sla_max_minutes} دقیقه`}
                            </div>
                            <div className="text-[10px] font-medium text-muted-foreground/80 mt-0.5">
                              نمایش به مشتری:{' '}
                              {p.stock_display_mode === 'hide'
                                ? 'مخفی'
                                : p.stock_display_mode === 'show_status_only'
                                  ? 'فقط وضعیت'
                                  : p.stock_display_mode === 'custom_text'
                                    ? 'متن دلخواه'
                                    : 'عدد دقیق'}
                            </div>
                          </td>

                          {/* Active Status */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(p)}
                              className={`px-2.5 py-1 rounded-control text-[10px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer border ${
                                p.is_active
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground border-border/60 hover:bg-muted/80'
                              }`}
                              title="کلیک برای تغییر وضعیت"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                              />
                              <span>
                                {p.is_active ? 'فعال در فروشگاه' : 'غیرفعال'}
                              </span>
                            </button>
                          </td>

                          {/* Actions (Unified with Blog / Content style) */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <a
                                href={`/products/${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-blue-500 transition-colors cursor-pointer shadow-control"
                                title="مشاهده در فروشگاه"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                              </a>
                              <button
                                type="button"
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground hover:text-brand transition-colors cursor-pointer shadow-control"
                                title="ویرایش کامل محصول"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-brand" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(p)}
                                className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shadow-control"
                                title="حذف محصول"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 1: INVENTORY & KEYS */}
      {activeSubtab === 'inventory' && (
        <div className="space-y-4">
          {/* Top 4 KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-surface border border-emerald-500/30 bg-emerald-500/5 space-y-1 text-right">
              <div className="flex items-center justify-between text-emerald-500 text-xs font-bold">
                <span>کلیدهای موجود و آماده تحویل</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-foreground">
                {(stats?.available_count || 0).toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-4 rounded-surface border border-amber-500/30 bg-amber-500/5 space-y-1 text-right">
              <div className="flex items-center justify-between text-amber-500 text-xs font-bold">
                <span>رزروشده در صف پردازش</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-foreground">
                {(stats?.reserved_count || 0).toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-4 rounded-surface border border-primary/30 bg-primary/5 space-y-1 text-right">
              <div className="flex items-center justify-between text-primary text-xs font-bold">
                <span>تحویل‌شده به خریداران</span>
                <Package className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-foreground">
                {(stats?.sold_delivered_count || 0).toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-4 rounded-surface border border-rose-500/30 bg-rose-500/5 space-y-1 text-right">
              <div className="flex items-center justify-between text-rose-500 text-xs font-bold">
                <span>باطل یا سوخته</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-foreground">
                {(stats?.void_count || 0).toLocaleString('fa-IR')}
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="rounded-surface border border-border/80 bg-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-surface">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Product Select */}
              <select
                aria-label="فیلتر بر اساس محصول"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer"
              >
                <option value="all">همه محصولات فروشگاه</option>
                {adminProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title_fa}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                aria-label="فیلتر بر اساس وضعیت"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="available">موجود (Available)</option>
                <option value="reserved">رزرو شده (Reserved)</option>
                <option value="sold">فروخته شده (Sold)</option>
                <option value="void">سوخته/باطل (Void)</option>
              </select>

              {/* Search Box with Debounce & Clear */}
              <div className="w-56">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="جستجو در کلیدها، عنوان، برچسب..."
                  debounceMs={250}
                />
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control"
                title="تازه‌سازی لیست کلیدها"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
                />
              </button>
            </div>

            {/* Action Buttons: Add Bulk, Replace, Export */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setBulkImportProductId(adminProducts[0]?.id || '')
                  setBulkImportItemType('license_key')
                  setBulkImportBatchTag('')
                  setBulkImportLines('')
                  setIsBulkImportOpen(true)
                }}
                className="h-9 px-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن دسته‌ای کلیدها</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReplaceOpen(true)}
                className="h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand" />
                <span>تعویض کلید سفارش (گارانتی)</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>خروجی کلیدها (Export)</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <span className="text-xs">در حال بارگذاری لیست انبار...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Key className="h-10 w-10 mx-auto text-muted-foreground/50 stroke-1" />
                <div className="text-xs font-medium">
                  کلیدی با این مشخصات در انبار یافت نشد.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] font-bold select-none">
                    <tr>
                      <th className="p-3.5 text-center">شناسه</th>
                      <th className="p-3.5 text-center">محصول متصل</th>
                      <th className="p-3.5 text-center">
                        پیش‌نمایش کلید / محتوا
                      </th>
                      <th className="p-3.5 text-center">وضعیت</th>
                      <th className="p-3.5 text-center">برچسب پارت</th>
                      <th className="p-3.5 text-center">سفارش متصل</th>
                      <th className="p-3.5 text-center">تاریخ ثبت</th>
                      <th className="p-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredItems.map((it) => (
                      <tr
                        key={it.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3.5 font-mono text-muted-foreground text-center font-latin">
                          #{it.id}
                        </td>
                        <td className="p-3.5 font-bold text-foreground text-center">
                          {it.product_title || 'سرویس نامشخص'}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground max-w-[220px] truncate text-center font-latin mx-auto">
                          {it.payload_preview}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${
                              it.status === 'available'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : it.status === 'reserved'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : it.status === 'sold'
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                it.status === 'available'
                                  ? 'bg-emerald-400 animate-pulse'
                                  : it.status === 'reserved'
                                    ? 'bg-amber-400'
                                    : it.status === 'sold'
                                      ? 'bg-primary'
                                      : 'bg-rose-500'
                              }`}
                            />
                            <span>
                              {it.status === 'available'
                                ? 'موجود'
                                : it.status === 'reserved'
                                  ? 'رزرو شده'
                                  : it.status === 'sold'
                                    ? 'تحویل‌شده'
                                    : 'سوخته/باطل'}
                            </span>
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground text-center font-latin">
                          {it.batch_tag || '-'}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground text-center font-latin">
                          {it.reserved_order_id ? (
                            <span className="text-brand font-bold">
                              #{it.reserved_order_id.slice(0, 8)}...
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground text-[11px] text-center font-mono font-latin">
                          {it.created_at
                            ? new Date(it.created_at).toLocaleDateString(
                                'fa-IR',
                              )
                            : '-'}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyKey(it.payload_preview || '', it.id)
                            }
                            className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-xs"
                            title="کپی پیش‌نمایش کلید"
                          >
                            {copiedKeyId === it.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL (ENHANCED WITH PDP & SEO CAPABILITIES) */}
      {isProductModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="max-w-4xl w-full bg-card rounded-surface border border-border/80 shadow-overlay overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-foreground">
                {/* Modal Header */}
                <div className="p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-foreground">
                          {editingProduct
                            ? `ویرایش محصول: ${pTitleFA || editingProduct.title_fa}`
                            : 'ایجاد محصول جدید در کاتالوگ فروشگاه'}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          مدیریت کامل اطلاعات، سئو، پلن‌های زمانی، جدول مقایسه و
                          راهنمای فعال‌سازی
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingProduct && pSlug && (
                        <a
                          href={`/products/${pSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-border bg-background text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>مشاهده در فروشگاه</span>
                        </a>
                      )}
                      <ModalCloseButton
                        onClick={() => setIsProductModalOpen(false)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Navigation Tabs for PDP Configuration - 9 Comprehensive Standard Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 overflow-x-auto pt-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setProductModalTab('general')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'general'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>۱. مشخصات پایه و فروش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('delivery')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'delivery'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>۲. شیوه تحویل و اتصال به ربات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('plans')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'plans'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        ۳. پلن‌ها و دوره‌ها ({pPlans.length || 'پیش‌فرض'})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('notice')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'notice'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>۴. نکات مهم قبل از خرید</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('features')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'features'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>۵. ویژگی‌های فنی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('comparison')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'comparison'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Table className="h-3.5 w-3.5" />
                      <span>۶. جدول مقایسه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('guide')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'guide'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>۷. راهنمای فعال‌سازی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('faq')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'faq'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>۸. سوالات متداول (FAQ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('trust')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'trust'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>۹. ضمانت‌ها و اعتماد خریداران</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalTab('seo')}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                        productModalTab === 'seo'
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>۱۰. سئو و متادیتا</span>
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleProductSubmit}
                  className="p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs"
                >
                  {productFormError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{productFormError}</span>
                    </div>
                  )}

                  {/* TAB 1: GENERAL SETTINGS */}
                  {productModalTab === 'general' && (
                    <div className="space-y-4">
                      {/* Multi-Plan Active Switcher */}
                      {pPlans.length > 0 && (
                        <div className="p-3.5 rounded-surface bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-right">
                          <div>
                            <span className="font-black text-brand text-xs sm:text-sm flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              این محصول دارای {pPlans.length} دوره/پلن اختصاصی
                              است.
                            </span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              جهت بارگذاری سریع مشخصات هر دوره روی فرم، روی آن
                              کلیک فرمایید:
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setActivePlanContext('base')}
                              className={`px-2.5 py-1 rounded-control text-[11px] font-bold border transition-all cursor-pointer ${
                                activePlanContext === 'base'
                                  ? 'bg-brand text-brand-foreground border-brand shadow-xs font-black'
                                  : 'bg-card text-muted-foreground hover:text-foreground border-border/60'
                              }`}
                            >
                              مشخصات کلی
                            </button>
                            {pPlans.map((pl, pIdx) => (
                              <button
                                key={pl.id || `pl-btn-${pIdx}`}
                                type="button"
                                onClick={() => {
                                  setActivePlanContext(pl.id || `plan-${pIdx}`)
                                  setPPriceToman(pl.price_toman || pPriceToman)
                                  if (pl.original_price_toman)
                                    setPOriginalPriceToman(
                                      pl.original_price_toman,
                                    )
                                  if (pl.base_cost_usd)
                                    setPBaseCostUSD(pl.base_cost_usd)
                                  if (pl.external_provider)
                                    setPExternalProvider(pl.external_provider)
                                  if (pl.delivery_strategy)
                                    setPDeliveryStrategy(pl.delivery_strategy)
                                  if (pl.external_product_id_str)
                                    setPExternalProductIDStr(
                                      pl.external_product_id_str,
                                    )
                                  notifySuccess(
                                    'پلن انتخاب شد',
                                    `مشخصات و قیمت پلن «${pl.title}» روی فرم بارگذاری شد.`,
                                  )
                                }}
                                className={`px-2.5 py-1 rounded-control text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  activePlanContext ===
                                  (pl.id || `plan-${pIdx}`)
                                    ? 'bg-brand text-brand-foreground border-brand shadow-xs font-black'
                                    : 'bg-card hover:bg-muted text-foreground border-border/60'
                                }`}
                              >
                                <span>{pl.title}</span>
                                {pl.badge && (
                                  <span className="text-[9px] px-1 rounded-control bg-brand/15 text-brand font-black">
                                    {pl.badge}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Persian & English Titles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-title-fa"
                            className="font-bold text-foreground block mb-1"
                          >
                            عنوان فارسی محصول{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="p-title-fa"
                            type="text"
                            required
                            placeholder="مثال: اکانت چت‌جی‌پی‌تی پلاس ۱ ماهه"
                            value={pTitleFA}
                            onChange={(e) => setPTitleFA(e.target.value)}
                            className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="p-title-en"
                            className="font-bold text-foreground block mb-1"
                          >
                            عنوان انگلیسی محصول{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="p-title-en"
                            type="text"
                            required
                            placeholder="مثال: ChatGPT Plus 1 Month"
                            value={pTitleEN}
                            onChange={(e) => setPTitleEN(e.target.value)}
                            className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      {/* Slug & Category Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-slug"
                            className="font-bold text-foreground block mb-1"
                          >
                            اسلاگ یکتا URL (Slug)
                          </label>
                          <input
                            id="p-slug"
                            type="text"
                            placeholder="مثال: chatgpt-plus-personal (خالی = خودکار)"
                            value={pSlug}
                            onChange={(e) => setPSlug(e.target.value)}
                            className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                          />
                          <span className="text-[10px] text-muted-foreground mt-0.5 block font-mono">
                            آدرس روت اختصاصی: /products/{pSlug || '...'}
                          </span>
                        </div>
                        <div>
                          <label
                            htmlFor="p-category"
                            className="font-bold text-foreground block mb-1"
                          >
                            دسته‌بندی فروشگاه (دریافت زنده از پایگاه داده)
                          </label>
                          <select
                            id="p-category"
                            value={pCategory}
                            onChange={(e) => setPCategory(e.target.value)}
                            className="w-full h-9 px-3 rounded-control border border-border/60 bg-card text-foreground text-xs font-bold outline-none focus:border-brand cursor-pointer"
                          >
                            <option value="">-- انتخاب دسته‌بندی --</option>
                            {storeCategories.map((c) => (
                              <optgroup
                                key={c.id}
                                label={`📁 ${c.title_fa} (${c.slug})`}
                              >
                                <option value={c.slug}>
                                  {c.title_fa} (اصلی)
                                </option>
                                {c.children?.map((sub) => (
                                  <option key={sub.id} value={sub.slug}>
                                    &nbsp;&nbsp;↳ {sub.title_fa} ({sub.slug})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            {storeCategories.length === 0 && (
                              <>
                                <option value="ai_chat">
                                  هوش مصنوعی و چت‌بات (ai_chat)
                                </option>
                                <option value="coding_ai">
                                  دستیار کدنویسی (coding_ai)
                                </option>
                                <option value="personal_upgrade">
                                  ارتقای اکانت شخصی (personal_upgrade)
                                </option>
                                <option value="ai_account">
                                  اکانت اختصاصی آماده (ai_account)
                                </option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Group Tag & Group Title Row (Database-driven) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="p-group-tag"
                            className="font-bold text-foreground block mb-1"
                          >
                            شناسه گروه برند (Group Tag)
                          </label>
                          <input
                            id="p-group-tag"
                            list="group-tags-list"
                            type="text"
                            placeholder="مثال: gemini یا chatgpt یا vpn"
                            value={pGroupTag}
                            onChange={(e) => setPGroupTag(e.target.value)}
                            className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin text-xs outline-none focus:border-brand"
                          />
                          <datalist id="group-tags-list">
                            {uniqueGroupTags.map((g) => (
                              <option key={g.tag} value={g.tag}>
                                {g.title} ({g.tag})
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label
                            htmlFor="p-group-title"
                            className="font-bold text-foreground block mb-1"
                          >
                            عنوان نمایشی گروه (Group Title)
                          </label>
                          <input
                            id="p-group-title"
                            type="text"
                            placeholder="مثال: اکوسیستم گوگل و جمینای"
                            value={pGroupTitleFA}
                            onChange={(e) => setPGroupTitleFA(e.target.value)}
                            className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      {/* 5-Way SwapWallet Reactive Pricing Calculator */}
                      <div className="p-4 rounded-2xl border border-brand/30 bg-brand/5 space-y-3">
                        <div className="flex items-center justify-between border-b border-brand/20 pb-2">
                          <span className="text-xs font-black text-brand flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            ماشین‌حساب قیمت‌گذاری هوشمند متصل به SwapWallet
                          </span>
                          <span className="text-[11px] font-mono font-latin text-muted-foreground">
                            نرخ زنده تتر:{' '}
                            {pLiveUSDTRate.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground block">
                              خرید دلاری ($):
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={pBaseCostUSD}
                              onChange={(e) => {
                                const cost = parseFloat(e.target.value) || 0
                                setPBaseCostUSD(cost)
                                const m =
                                  parseFloat(String(pMarginPercent)) || 0
                                const sellUSD = cost * (1.0 + m / 100.0)
                                const sellToman =
                                  Math.ceil((sellUSD * pLiveUSDTRate) / 500) *
                                  500
                                setPPriceToman(sellToman)
                              }}
                              className="w-full h-9 px-2.5 text-xs rounded-xl border border-border/60 bg-background text-foreground font-mono font-latin outline-none focus:border-brand"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground block">
                              درصد سود (%):
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={pMarginPercent}
                              onChange={(e) => {
                                const valStr = e.target.value
                                setPMarginPercent(valStr)
                                const m = parseFloat(valStr)
                                if (
                                  !Number.isNaN(m) &&
                                  pBaseCostUSD > 0 &&
                                  pLiveUSDTRate > 0
                                ) {
                                  const sellUSD =
                                    pBaseCostUSD * (1.0 + m / 100.0)
                                  const sellToman =
                                    Math.ceil((sellUSD * pLiveUSDTRate) / 500) *
                                    500
                                  setPPriceToman(sellToman)
                                }
                              }}
                              placeholder="مثال: ۲.۲ یا ۰.۰۲"
                              className="w-full h-9 px-2.5 text-xs rounded-xl border border-border/60 bg-background text-foreground font-mono font-latin outline-none focus:border-brand"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground block">
                              فروش دلاری ($):
                            </label>
                            <div className="h-9 px-2.5 text-xs rounded-xl border border-border/40 bg-muted/40 text-muted-foreground flex items-center font-mono font-latin">
                              ${(pPriceToman / pLiveUSDTRate).toFixed(2)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-muted-foreground block">
                              تمام‌شده تومانی (خرید):
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={
                                Math.round(pBaseCostUSD * pLiveUSDTRate) ||
                                pCostToman ||
                                ''
                              }
                              onChange={(e) => {
                                const cToman = Number(e.target.value) || 0
                                setPCostToman(cToman)
                                if (pLiveUSDTRate > 0) {
                                  setPBaseCostUSD(
                                    Number((cToman / pLiveUSDTRate).toFixed(2)),
                                  )
                                }
                                const m =
                                  parseFloat(String(pMarginPercent)) || 0
                                const sellToman =
                                  Math.ceil(
                                    (cToman * (1.0 + m / 100.0)) / 500,
                                  ) * 500
                                setPPriceToman(sellToman)
                              }}
                              placeholder="مبلغ خرید تومانی"
                              className="w-full h-9 px-2.5 text-xs rounded-xl border border-border/60 bg-background text-foreground font-mono font-latin outline-none focus:border-brand"
                            />
                            <span className="text-[10px] text-muted-foreground block font-latin">
                              {Number(
                                Math.round(pBaseCostUSD * pLiveUSDTRate) ||
                                  pCostToman ||
                                  0,
                              ).toLocaleString('fa-IR')}{' '}
                              تومان
                            </span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-black text-brand block">
                              قیمت فروش تومانی *:
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={pPriceToman}
                              onChange={(e) => {
                                const sellToman = Number(e.target.value) || 0
                                setPPriceToman(sellToman)
                                const costToman =
                                  Math.round(pBaseCostUSD * pLiveUSDTRate) ||
                                  pCostToman ||
                                  0
                                if (costToman > 0) {
                                  const m =
                                    ((sellToman - costToman) / costToman) *
                                    100.0
                                  setPMarginPercent(parseFloat(m.toFixed(2)))
                                }
                              }}
                              className="w-full h-9 px-2.5 text-xs font-bold rounded-xl border-2 border-brand bg-background text-foreground font-mono font-latin outline-none focus:ring-2 focus:ring-brand/30"
                            />
                            <span className="text-[11px] text-brand font-black block font-latin">
                              {Number(pPriceToman).toLocaleString('fa-IR')}{' '}
                              تومان
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-0.5">
                          <span>سود تخمینی هر فروش:</span>
                          <span
                            className={`font-mono font-latin font-bold ${
                              pPriceToman >=
                              Math.round(pBaseCostUSD * pLiveUSDTRate)
                                ? 'text-emerald-400'
                                : 'text-rose-500'
                            }`}
                          >
                            {pPriceToman >=
                            Math.round(pBaseCostUSD * pLiveUSDTRate)
                              ? '+'
                              : ''}
                            {(
                              pPriceToman -
                              Math.round(pBaseCostUSD * pLiveUSDTRate)
                            ).toLocaleString('fa-IR')}{' '}
                            تومان ({Number(pMarginPercent).toFixed(2)}٪)
                          </span>
                        </div>
                      </div>

                      {/* Two-Way Strikethrough & Percentage Discount Configuration */}
                      <div className="p-4 rounded-surface border border-brand/20 bg-brand/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-brand flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            تنظیمات تخفیف و جشنواره فروشگاهی (دو طرفه: درصدی یا
                            خط‌خورده)
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            در صورت درج، قیمت قبلی خط‌خورده و بج تخفیف در ویترین
                            و کارت محصول فعال می‌گردد
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground block">
                              قیمت اصلی قبل از تخفیف (خط‌خورده به تومان):
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={pOriginalPriceToman || ''}
                              onChange={(e) => {
                                const orig = Number(e.target.value) || 0
                                setPOriginalPriceToman(orig)
                                if (orig > pPriceToman && pPriceToman > 0) {
                                  const d =
                                    ((orig - pPriceToman) / orig) * 100.0
                                  setPDiscountPercent(parseFloat(d.toFixed(1)))
                                } else {
                                  setPDiscountPercent(0)
                                }
                              }}
                              placeholder="مثلاً: ۵۰۰٬۰۰۰ تومان"
                              className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                            />
                            {pOriginalPriceToman > 0 && (
                              <span className="text-[10px] text-muted-foreground block font-latin">
                                {Number(pOriginalPriceToman).toLocaleString(
                                  'fa-IR',
                                )}{' '}
                                تومان
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground block">
                              درصد تخفیف پیشنهادی (%):
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max="99"
                              value={pDiscountPercent || ''}
                              onChange={(e) => {
                                const dStr = e.target.value
                                setPDiscountPercent(dStr)
                                const d = parseFloat(dStr) || 0
                                if (d > 0 && d < 100) {
                                  if (pOriginalPriceToman > 0) {
                                    const newPrice =
                                      Math.round(
                                        (pOriginalPriceToman *
                                          (1.0 - d / 100.0)) /
                                          500,
                                      ) * 500
                                    setPPriceToman(newPrice)
                                  } else if (pPriceToman > 0) {
                                    const newOrig =
                                      Math.round(
                                        pPriceToman / (1.0 - d / 100.0) / 500,
                                      ) * 500
                                    setPOriginalPriceToman(newOrig)
                                  }
                                }
                              }}
                              placeholder="مثلاً: ۲۰ یا ۱۵.۵"
                              className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                            />
                            {Number(pDiscountPercent) > 0 &&
                              pOriginalPriceToman > pPriceToman && (
                                <span className="text-[10px] text-emerald-500 font-bold block font-latin">
                                  سود خریدار:{' '}
                                  {(
                                    pOriginalPriceToman - pPriceToman
                                  ).toLocaleString('fa-IR')}{' '}
                                  تومان ({Number(pDiscountPercent)}٪ تخفیف)
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Comprehensive Stock & Inventory Management Panel */}
                      <div className="p-4 rounded-surface border border-border/80 bg-muted/20 space-y-4 text-right">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60 shrink-0">
                              <Package className="w-4 h-4 text-brand" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-foreground block">
                                مدیریت جامع موجودی و نحوه نمایش در فروشگاه
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                تعیین نوع مدیریت موجودی، تعداد در انبار و شیوه
                                نمایش برچسب به مشتریان
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {/* Stock Mode */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground block">
                              روش مدیریت موجودی کالا:
                            </label>
                            <select
                              value={pStockMode}
                              onChange={(e: any) =>
                                setPStockMode(e.target.value)
                              }
                              className="w-full h-9 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground font-bold outline-none focus:border-brand cursor-pointer"
                            >
                              <option value="auto">
                                ⚡ خودکار (انبار لایسنس یا بات متصل)
                              </option>
                              <option value="always_in_stock">
                                🟢 همیشه موجود (سفارش‌پذیر نامحدود)
                              </option>
                              <option value="manual">
                                🔢 تعیین تعداد دستی (کسر خودکار با هر خرید)
                              </option>
                              <option value="out_of_stock">
                                🔴 ناموجود دستی (توقف فروش)
                              </option>
                            </select>
                          </div>

                          {/* Manual Stock Count (shown when manual) */}
                          {pStockMode === 'manual' && (
                            <div className="space-y-1 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-foreground block">
                                تعداد موجودی دستی در انبار (عدد):
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  step="1"
                                  value={pManualStock}
                                  onChange={(e) =>
                                    setPManualStock(Number(e.target.value) || 0)
                                  }
                                  placeholder="مثلاً: ۵۰"
                                  className="w-full h-9 px-3 pl-12 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                                />
                                <span className="absolute left-3 top-2 text-[10px] text-muted-foreground font-bold">
                                  عدد
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Display Mode to Buyers */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground block">
                              نحوه نمایش موجودی این محصول به خریداران در
                              فروشگاه:
                            </label>
                            <select
                              value={pStockDisplayMode}
                              onChange={(e: any) =>
                                setPStockDisplayMode(e.target.value)
                              }
                              className="w-full h-9 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground font-bold outline-none focus:border-brand cursor-pointer"
                            >
                              <option value="show_exact">
                                🟢 نمایش عدد دقیق موجودی به خریدار
                              </option>
                              <option value="show_status_only">
                                🟡 فقط نمایش برچسب موجود / محدود
                              </option>
                              <option value="hide">
                                ⚪ عدم نمایش موجودی (مخفی)
                              </option>
                            </select>
                          </div>

                          {/* Out of stock text */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground block">
                              متن هنگام اتمام موجودی:
                            </label>
                            <input
                              type="text"
                              value={pOutOfStockText}
                              onChange={(e) =>
                                setPOutOfStockText(e.target.value)
                              }
                              placeholder="مثلاً: در حال تهیه و تامین مجدد"
                              className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground outline-none focus:border-brand"
                            />
                          </div>
                        </div>

                        {pStockMode === 'manual' && (
                          <div className="p-2.5 rounded-control bg-secondary/50 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                            <span className="text-brand font-black">
                              ℹ️ کسر خودکار پویا:
                            </span>
                            <span>
                              با هر خرید موفق در سایت، تعداد خریداری‌شده به صورت
                              خودکار از این موجودی کسر می‌گردد و در صورت رسیدن به
                              صفر، وضعیت به «ناموجود» تغییر می‌کند.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description & Overview */}
                      <div>
                        <label
                          htmlFor="p-desc"
                          className="font-bold text-foreground block mb-1"
                        >
                          توضیحات و معرفی محصول
                        </label>
                        <textarea
                          id="p-desc"
                          rows={3}
                          placeholder="توضیحات تکمیلی محصول که در صفحه فروشگاه نمایش داده می‌شود..."
                          value={pDescription}
                          onChange={(e) => setPDescription(e.target.value)}
                          className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand resize-none"
                        />
                      </div>

                      {/* Product Cover Image & Product Icon with Direct Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cover Image Upload */}
                        <div className="space-y-1.5 p-3 rounded-2xl border border-border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="p-image-url"
                              className="font-bold text-foreground text-xs block"
                            >
                              تصویر کاور محصول (کارت فروشگاه)
                            </label>
                            <label className="text-blue-500 hover:underline cursor-pointer flex items-center gap-1 text-xs font-bold">
                              <Upload className="h-3.5 w-3.5" />
                              <span>آپلود عکس</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleUploadProductImage}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="p-image-url"
                              type="text"
                              dir="ltr"
                              placeholder="https://... یا آپلود از دکمه بالا"
                              value={pImageURL}
                              onChange={(e) => setPImageURL(e.target.value)}
                              className="flex-1 h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                            />
                            {pImageURL && (
                              <div className="h-9 w-9 rounded-xl overflow-hidden border border-border shrink-0 bg-zinc-950">
                                <img
                                  src={pImageURL}
                                  alt="پیش‌نمایش عکس"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          {uploadingProductImage && (
                            <p className="text-[11px] text-blue-500 flex items-center gap-1 pt-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>در حال بارگذاری عکس روی سرور...</span>
                            </p>
                          )}
                        </div>

                        {/* Product Icon Upload */}
                        <div className="space-y-1.5 p-3 rounded-2xl border border-border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="p-icon-url"
                              className="font-bold text-foreground text-xs block"
                            >
                              آیکون اختصاصی محصول (لوگو یا SVG)
                            </label>
                            <label className="text-brand hover:underline cursor-pointer flex items-center gap-1 text-xs font-bold">
                              <Upload className="h-3.5 w-3.5" />
                              <span>آپلود آیکون</span>
                              <input
                                type="file"
                                accept="image/*,.svg"
                                onChange={handleUploadProductIcon}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="p-icon-url"
                              type="text"
                              dir="ltr"
                              placeholder="https://... یا نام آیکون / آپلود"
                              value={pIconURL}
                              onChange={(e) => setPIconURL(e.target.value)}
                              className="flex-1 h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                            />
                            {pIconURL && (
                              <div className="h-9 w-9 rounded-xl overflow-hidden border border-border shrink-0 bg-zinc-900 flex items-center justify-center p-1.5">
                                <img
                                  src={pIconURL}
                                  alt="پیش‌نمایش آیکون"
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    ;(e.target as HTMLElement).style.display =
                                      'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          {uploadingProductIcon && (
                            <p className="text-[11px] text-brand flex items-center gap-1 pt-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>در حال بارگذاری آیکون...</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Flash Sale & Promotions Settings Card */}
                      <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
                              <Flame className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">
                                تخفیف شگفت‌انگیز زمان‌دار (Flash Sale)
                              </h4>
                              <p className="text-[10px] text-muted-foreground">
                                نمایش در سکشن شگفت‌انگیز با تایمر معکوس و نشان
                                آتشین
                              </p>
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={pIsFlashSale}
                            onChange={setPIsFlashSale}
                            size="sm"
                          />
                        </div>

                        {pIsFlashSale && (
                          <div className="space-y-3 pt-3 border-t border-rose-500/20">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  قیمت قبل تخفیف (خط‌خورده به تومان):
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  value={pOriginalPriceToman || ''}
                                  onChange={(e) =>
                                    setPOriginalPriceToman(
                                      Number(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="مثال: ۴۵۰۰۰۰"
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                                {pOriginalPriceToman > pPriceToman && (
                                  <span className="text-[10px] text-emerald-500 font-bold block mt-0.5 font-latin">
                                    تخفیف:{' '}
                                    {(
                                      pOriginalPriceToman - pPriceToman
                                    ).toLocaleString('fa-IR')}{' '}
                                    ت (
                                    {Math.round(
                                      ((pOriginalPriceToman - pPriceToman) /
                                        pOriginalPriceToman) *
                                        100,
                                    )}
                                    ٪)
                                  </span>
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  قیمت جشنواره (تومان) *
                                </label>
                                <input
                                  type="number"
                                  min={1000}
                                  step={1000}
                                  value={pFlashSalePriceToman || ''}
                                  onChange={(e) =>
                                    setPFlashSalePriceToman(
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="مثال: ۱۲۰۰۰۰۰"
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  پایان مهلت تخفیف (تایمر معکوس)
                                </label>
                                <input
                                  type="datetime-local"
                                  value={pFlashSaleEndAt}
                                  onChange={(e) =>
                                    setPFlashSaleEndAt(e.target.value)
                                  }
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  سقف کل موجودی جشنواره
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={pFlashSaleStock || 50}
                                  onChange={(e) =>
                                    setPFlashSaleStock(Number(e.target.value))
                                  }
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-foreground block mb-1">
                                  تعداد فروخته شده (نمایش در نوار پیشرفت)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={pFlashSaleSold || 0}
                                  onChange={(e) =>
                                    setPFlashSaleSold(Number(e.target.value))
                                  }
                                  className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Custom Badges & Tags Input Area */}
                      <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 space-y-2 text-right">
                        <label className="text-xs font-bold text-foreground block">
                          نشان‌ها و بج‌های دلخواه محصول (در هر سطر یک برچسب
                          بنویسید)
                        </label>
                        <textarea
                          rows={2}
                          value={pBadgesText}
                          onChange={(e) => setPBadgesText(e.target.value)}
                          placeholder="مثال:&#10;تحویل ۱ ثانیه‌ای&#10;گارانتی عدم قطعی"
                          className="w-full p-2.5 rounded-control border border-border/60 bg-card text-xs text-foreground outline-none focus:border-brand resize-none leading-relaxed"
                        />
                      </div>

                      {/* Star Rating Badge Configuration (Screenshot 4 Request) */}
                      <div className="flex items-center justify-between p-3.5 rounded-surface border border-border/60 bg-muted/20">
                        <div className="space-y-0.5 text-right">
                          <span className="text-xs font-bold text-foreground block">
                            نمایش امتیاز ستاره‌ای در کارت محصول
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            در صورت خاموش بودن یا مقدار ۰، نشان ستاره در کارت
                            محصول مخفی می‌شود.
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={5}
                            step={0.1}
                            disabled={!pShowRating}
                            value={pRatingAverage || ''}
                            onChange={(e) =>
                              setPRatingAverage(Number(e.target.value))
                            }
                            className="w-20 h-8 px-2 rounded-control border border-border/60 bg-card text-xs font-mono font-latin text-center outline-none focus:border-brand disabled:opacity-40"
                            placeholder="5.0"
                          />
                          <ToggleSwitch
                            checked={pShowRating}
                            onChange={setPShowRating}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Badges & Merchandising Options */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-surface bg-muted/20 border border-border/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            محصول پرفروش‌ترین (Best Seller)
                          </span>
                          <ToggleSwitch
                            size="sm"
                            checked={pIsBestSeller}
                            onChange={setPIsBestSeller}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            محصول ویژه ویترین (Featured)
                          </span>
                          <ToggleSwitch
                            size="sm"
                            checked={pIsFeatured}
                            onChange={setPIsFeatured}
                          />
                        </div>
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center justify-between p-3.5 rounded-surface bg-muted/20 border border-border/60">
                        <div>
                          <span className="font-bold text-foreground block text-xs">
                            وضعیت انتشار: فعال در ویترین فروشگاه
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">
                            در صورت غیرفعال بودن، مشتریان این محصول را در
                            کاتالوگ اصلی نخواهند دید.
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${
                              pIsActive
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            }`}
                          >
                            {pIsActive ? 'فعال در فروشگاه' : 'غیرفعال'}
                          </span>
                          <ToggleSwitch
                            checked={pIsActive}
                            onChange={(checked) => setPIsActive(checked)}
                            ariaLabel="فعال در ویترین فروشگاه"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DELIVERY & UPSTREAM BOT ROUTING */}
                  {productModalTab === 'delivery' && (
                    <div className="space-y-4">
                      {pPlans.length > 0 && (
                        <div className="p-3.5 rounded-surface bg-brand/10 border border-brand/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-black text-brand text-xs sm:text-sm flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              این محصول دارای {pPlans.length} دوره/پلن زمانی
                              است.
                            </span>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                              تنظیمات زیر به عنوان پیش‌فرض پایه محصول عمل می‌کنند.
                              در تب «۳. پلن‌ها و دوره‌ها» می‌توانید برای هر دوره
                              (مثلاً ۶ ماهه، ۱۸ ماهه و ...) شیوه تحویل، ربات
                              تامین‌کننده و شناسه محصول را به صورت کاملاً مجزا و
                              اختصاصی تعیین نمایید.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProductModalTab('plans')}
                            className="px-3 py-1.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shrink-0 self-start sm:self-auto cursor-pointer shadow-control transition-all"
                          >
                            مدیریت اختصاصی دوره‌ها ({pPlans.length})
                          </button>
                        </div>
                      )}

                      <div className="p-3.5 rounded-surface bg-brand/5 border border-brand/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-brand" />
                          <span className="font-bold text-foreground">
                            تنظیمات هوشمند نحوه تحویل و اتصال به ربات‌های
                            تامین‌کننده
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          مشتری به هیچ عنوان نام یا منبع ربات را مشاهده نخواهد
                          کرد
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 text-right">
                          <label className="font-bold text-foreground block">
                            استراتژی کلان تحویل:
                          </label>
                          <select
                            value={pDeliveryStrategy}
                            onChange={(e) =>
                              setPDeliveryStrategy(e.target.value)
                            }
                            className="w-full h-10 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                          >
                            <option value="third_party_instant">
                              ⚡ تحویل آنی و خودکار از ربات (Instant via Bot)
                            </option>
                            <option value="local_inventory">
                              🔑 تحویل آنی از انبار لایسنس محلی (Local Vault)
                            </option>
                            <option value="manual_operator">
                              🔷 تحویل دستی در صف اپراتور (Mode C / Operator
                              Desk)
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="font-bold text-foreground block">
                            ربات تامین‌کننده بالادستی:
                          </label>
                          <select
                            value={pExternalProvider}
                            onChange={(e) =>
                              setPExternalProvider(e.target.value)
                            }
                            className="w-full h-10 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer font-mono font-latin"
                          >
                            <option value="manual_vault">
                              انبار محلی داخلی (بدون ربات)
                            </option>
                            <option value="insightx">
                              اینسایت استور (@insightXpro_bot)
                            </option>
                            <option value="stackvault">
                              استک‌ولت (@stackvault_bot)
                            </option>
                            <option value="paglu">
                              لوت پاگلو (@Paglu_Shopp_Bot)
                            </option>
                            <option value="jero">
                              جرو اکانتس (@JeroAccountsBot)
                            </option>
                            <option value="supreme">
                              سوپریم لیدر شاپ (@SupremeLeaderShopBot)
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="font-bold text-foreground block">
                            شناسه محصول در ربات (External Product ID):
                          </label>
                          <input
                            type="text"
                            value={pExternalProductIDStr}
                            onChange={(e) =>
                              setPExternalProductIDStr(e.target.value)
                            }
                            placeholder="مثال: 14 یا ps_1024 یا Paglu_1"
                            className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                          />
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="font-bold text-foreground block">
                            اطلاعات مورد نیاز از خریدار حین سفارش:
                          </label>
                          <select
                            value={pRequiredCustomerInput}
                            onChange={(e) =>
                              setPRequiredCustomerInput(e.target.value)
                            }
                            className="w-full h-10 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                          >
                            <option value="none">
                              بدون نیاز به ورودی (خرید مستقیم لایسنس/لینک)
                            </option>
                            <option value="account_creds">
                              ایمیل و رمز عبور کاربر (ارتقای Mode C با AES-256)
                            </option>
                            <option value="telegram_username">
                              آیدی تلگرام (@username جهت استارز و پرمیوم)
                            </option>
                            <option value="wordpress_admin">
                              مشخصات ادمین وردپرس (نصب خودکار المنتور/رنک‌مث)
                            </option>
                            <option value="custom_links">
                              لینک فایل‌های درخواستی (دانلود خودکار UI8)
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1 text-right">
                          <label className="font-bold text-foreground block">
                            نوع دیتای تحویل‌داده‌شده به خریدار:
                          </label>
                          <select
                            value={pDeliveredPayloadType}
                            onChange={(e) =>
                              setPDeliveredPayloadType(e.target.value)
                            }
                            className="w-full h-10 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                          >
                            <option value="license_code">
                              کد لایسنس یا ووچر متنی
                            </option>
                            <option value="activation_link">
                              لینک فعال‌سازی یا دعوت خانواده
                            </option>
                            <option value="credentials_pair">
                              اکانت آماده (ایمیل و کلمه عبور)
                            </option>
                            <option value="direct_service">
                              اعمال مستقیم روی حساب/آیدی کاربر
                            </option>
                            <option value="files_or_downloads">
                              لینک دانلود فایل‌ها
                            </option>
                          </select>
                        </div>

                        {/* Comprehensive Stock Management Panel */}
                        <div className="col-span-1 sm:col-span-2 p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-brand" />
                              مدیریت جامع موجودی و پیام‌های وضعیت فروشگاه (Stock
                              & Fallback)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              تنظیم نحوه شمارش و نمایش پیام‌های ناموجودی به مشتری
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-foreground block text-[11px]">
                                وضعیت پایه موجودی کالا:
                              </label>
                              <select
                                value={pStockMode}
                                onChange={(e: any) =>
                                  setPStockMode(e.target.value)
                                }
                                className="w-full h-9 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                              >
                                <option value="auto">
                                  ⚡ خودکار (انبار لایسنس یا ربات)
                                </option>
                                <option value="always_in_stock">
                                  🟢 همیشه موجود (سفارش‌پذیر نامحدود)
                                </option>
                                <option value="manual">
                                  🔢 تعداد موجودی دستی (تعیین عدد)
                                </option>
                                <option value="out_of_stock">
                                  🔴 ناموجود دستی (توقف فروش)
                                </option>
                              </select>
                            </div>

                            {pStockMode === 'manual' && (
                              <div className="space-y-1">
                                <label className="font-bold text-foreground block text-[11px]">
                                  تعداد موجودی دستی (عدد):
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={pManualStock}
                                  onChange={(e) =>
                                    setPManualStock(Number(e.target.value) || 0)
                                  }
                                  className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                                />
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="font-bold text-foreground block text-[11px]">
                                شیوه نمایش موجودی به خریدار:
                              </label>
                              <select
                                value={pStockDisplayMode}
                                onChange={(e: any) =>
                                  setPStockDisplayMode(e.target.value)
                                }
                                className="w-full h-9 px-3 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                              >
                                <option value="show_exact">
                                  نمایش عدد دقیق (مثلاً ۵ عدد در انبار)
                                </option>
                                <option value="show_status_only">
                                  فقط نمایش وضعیت (موجود در انبار)
                                </option>
                                <option value="custom_text">
                                  متن سفارشی (مانند تحویل فوری)
                                </option>
                                <option value="hide">
                                  مخفی کردن کامل برچسب
                                </option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-foreground block text-[11px]">
                                متن هنگام اتمام موجودی:
                              </label>
                              <input
                                type="text"
                                value={pOutOfStockText}
                                onChange={(e) =>
                                  setPOutOfStockText(e.target.value)
                                }
                                placeholder="مثلاً: در حال تهیه و تامین مجدد"
                                className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground outline-none focus:border-brand"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SLA Timings */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-right">
                        <div>
                          <label className="font-bold text-foreground block mb-1">
                            حداقل زمان SLA (دقیقه)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={pSLAMin}
                            onChange={(e) => setPSLAMin(Number(e.target.value))}
                            className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-foreground block mb-1">
                            حداکثر زمان SLA (دقیقه)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={pSLAMax}
                            onChange={(e) => setPSLAMax(Number(e.target.value))}
                            className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs font-mono font-latin outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-foreground block mb-1">
                            متن نمایشی زمان تحویل
                          </label>
                          <input
                            type="text"
                            value={pSLAText}
                            onChange={(e) => setPSLAText(e.target.value)}
                            placeholder="مثال: تحویل آنی ۰ ثانیه"
                            className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      {/* Operating Hours & Customer Delivery Instructions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 text-right">
                        <div>
                          <label className="font-bold text-foreground block mb-1">
                            ساعات کاری اپراتور
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: ۹:۰۰ تا ۲۴:۰۰"
                            value={pOperatingHours}
                            onChange={(e) => setPOperatingHours(e.target.value)}
                            className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-foreground block mb-1">
                            راهنمای تحویل برای خریدار
                          </label>
                          <input
                            type="text"
                            placeholder="پیام یا لینک راهنمای فعال‌سازی پس از خرید..."
                            value={pInstructions}
                            onChange={(e) => setPInstructions(e.target.value)}
                            className="w-full h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: PRE-PURCHASE NOTICE & RICH EDITOR */}
                  {productModalTab === 'notice' && (
                    <div className="space-y-4 text-right">
                      {renderPlanContextBar('نکات مهم قبل از خرید')}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-surface bg-muted/20 border border-border/60">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-brand" />
                            نکات مهم و شرایط فعال‌سازی قبل از خرید (Pre-Purchase
                            Notice)
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            اطلاعات یا هشدارهایی که خریدار باید قبل از پرداخت یا
                            افزودن به سبد مطالعه و تایید نماید
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-bold">
                              شیوه نمایش:
                            </span>
                            <select
                              value={pPrePurchaseNoticeMode}
                              onChange={(e: any) =>
                                setPPrePurchaseNoticeMode(e.target.value)
                              }
                              className="h-8 px-2.5 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none cursor-pointer"
                            >
                              <option value="none">بدون اعلان</option>
                              <option value="inline">
                                کادر متالیک درون‌صفحه‌ای
                              </option>
                              <option value="modal_confirm">
                                مدال پاپ‌آپ قبل از سبد خرید
                              </option>
                              <option value="both">هر دو حالت</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-bold">
                              عدم نمایش مجدد:
                            </span>
                            <select
                              value={pPrePurchaseSnoozeDays}
                              onChange={(e) =>
                                setPPrePurchaseSnoozeDays(
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 px-2.5 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none cursor-pointer"
                            >
                              <option value={0}>فقط همین سشن</option>
                              <option value={1}>تا ۲۴ ساعت</option>
                              <option value={7}>تا ۷ روز</option>
                              <option value={30}>تا ۳۰ روز</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="border border-border/60 rounded-surface overflow-hidden bg-card">
                        <RichContentEditor
                          value={pPrePurchaseNotice}
                          onChange={setPPrePurchaseNotice}
                          minHeight="240px"
                          placeholder="نکات مهم قبل از خرید، شرایط گارانتی و ضوابط فعال‌سازی را در این کادر بنویسید..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB: TECHNICAL FEATURES */}
                  {productModalTab === 'features' && (
                    <div className="space-y-4 text-right">
                      {renderPlanContextBar('ویژگی‌های فنی')}
                      <div>
                        <label className="font-bold text-foreground block mb-1">
                          ویژگی‌ها و مشخصات برجسته محصول (هر ویژگی در یک سطر)
                        </label>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          این ویژگی‌ها به صورت لیست گلوله‌ای همراه با تیک در صفحه
                          محصول نمایش داده می‌شوند
                        </p>
                        <textarea
                          rows={6}
                          placeholder="دسترسی نامحدود به GPT-4o و Claude 3.5 Sonnet&#10;ضمانت ۳۰ روزه عدم قطعی و تعویض رایگان&#10;فعال‌سازی قانونی بدون نیاز به تغییر آی‌پی"
                          value={pFeaturesText}
                          onChange={(e) => setPFeaturesText(e.target.value)}
                          className="w-full p-3 rounded-surface border border-border/60 bg-muted/20 text-xs text-foreground font-mono leading-relaxed outline-none focus:border-brand resize-none"
                        />
                      </div>
                    </div>
                  )}
                  {productModalTab === 'seo' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 shrink-0" />
                          <span className="text-xs">
                            تنظیمات متاتگ‌های سئو و اشتراک‌گذاری در شبکه‌های
                            اجتماعی (OpenGraph)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateDefaultSEO}
                          className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>تولید خودکار سئو</span>
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="p-meta-title"
                            className="font-bold text-foreground block"
                          >
                            عنوان سئو (Meta Title)
                          </label>
                          <span
                            className={`text-[10px] font-mono ${
                              pMetaTitle.length > 60
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {pMetaTitle.length}/60 کاراکتر
                          </span>
                        </div>
                        <input
                          id="p-meta-title"
                          type="text"
                          placeholder="مثال: خرید اکانت قانونی ChatGPT Plus | تحویل فوری"
                          value={pMetaTitle}
                          onChange={(e) => setPMetaTitle(e.target.value)}
                          className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="p-meta-desc"
                            className="font-bold text-foreground block"
                          >
                            توضیحات متا (Meta Description)
                          </label>
                          <span
                            className={`text-[10px] font-mono ${
                              pMetaDescription.length > 160
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {pMetaDescription.length}/160 کاراکتر
                          </span>
                        </div>
                        <textarea
                          id="p-meta-desc"
                          rows={3}
                          placeholder="توضیحات جذاب سئو که در نتایج جستجوی گوگل نمایش داده می‌شود..."
                          value={pMetaDescription}
                          onChange={(e) => setPMetaDescription(e.target.value)}
                          className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand resize-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="p-og-img"
                          className="font-bold text-foreground block mb-1"
                        >
                          تصویر اشتراک‌گذاری اجتماعی (OG Image URL)
                        </label>
                        <input
                          id="p-og-img"
                          type="text"
                          placeholder="/assets/hero.png یا آدرس کامل تصویر"
                          value={pOgImageURL}
                          onChange={(e) => setPOgImageURL(e.target.value)}
                          className="w-full h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand"
                        />
                      </div>

                      {/* Live Google Search Preview */}
                      <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5" />
                          پیش‌نمایش نمایش در نتایج گوگل (SERP Simulation):
                        </span>
                        <div
                          className="p-3.5 rounded-xl border border-border/80 bg-card text-right space-y-1 max-w-xl"
                          dir="rtl"
                        >
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">
                              S
                            </div>
                            <span className="font-medium text-foreground">
                              {getSiteBrandName()}
                            </span>
                            <span>›</span>
                            <span className="font-mono text-[10px]" dir="ltr">
                              /products/{pSlug || 'product-slug'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-blue-600 hover:underline cursor-pointer leading-tight pt-1">
                            {pMetaTitle ||
                              (pTitleFA
                                ? `خرید ${pTitleFA} | ${getSiteBrandName()}`
                                : 'عنوان صفحه محصول')}
                          </h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {pMetaDescription ||
                              pDescription ||
                              `خرید اشتراک و لایسنس قانونی با تحویل فوری، پرداخت امن شتابی و ضمانت کامل در ${getSiteBrandName()}.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PLANS & DURATIONS */}
                  {productModalTab === 'plans' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                        <div>
                          <h4 className="font-bold text-foreground">
                            پلن‌های چندگانه زمانی (مدت زمان و قیمت‌های مختلف)
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            مشتری روی صفحه محصول می‌تواند بین این پلن‌ها انتخاب
                            کند (مثلاً ۱ ماهه / ۳ ماهه / ۱ ساله).
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultPlans}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>تولید خودکار ۳ پلن زمانی</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Plans List with Drag & Drop */}
                      {pPlans.length > 0 ? (
                        <div className="space-y-3">
                          {pPlans.map((pl, idx) => (
                            <div
                              key={pl.id || `plan-${idx}`}
                              draggable
                              onDragStart={(e) => handlePlanDragStart(e, idx)}
                              onDragOver={handlePlanDragOver}
                              onDrop={(e) => handlePlanDrop(e, idx)}
                              className={`p-4 rounded-surface border bg-card space-y-3 relative group transition-all duration-200 ${
                                draggedPlanIdx === idx
                                  ? 'opacity-40 border-dashed border-brand'
                                  : 'border-border/80 shadow-surface hover:border-brand/40'
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                <div className="flex items-center gap-2">
                                  {/* Drag Grip Handle */}
                                  <div
                                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
                                    title="درگ و دراپ جهت جابجایی ردیف و اولویت پلن"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <span className="h-6 w-6 rounded-control bg-secondary text-brand font-black flex items-center justify-center text-xs font-latin border border-border/60">
                                    {idx + 1}
                                  </span>

                                  {/* Move Up / Down Buttons */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => movePlan(idx, idx - 1)}
                                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                      title="انتقال به بالا"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === pPlans.length - 1}
                                      onClick={() => movePlan(idx, idx + 1)}
                                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                      title="انتقال به پایین"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={pl.title}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].title = e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    placeholder="عنوان پلن"
                                    className="h-7 px-2 font-bold text-foreground bg-transparent border-b border-dashed border-border/80 focus:outline-none focus:border-brand text-xs w-60"
                                  />
                                  <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-latin">
                                    تامین:{' '}
                                    {pl.external_provider ||
                                      pExternalProvider ||
                                      'InsightX'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-secondary text-secondary-foreground border border-border/40">
                                    {pl.delivery_strategy === 'manual_operator'
                                      ? '🔷 دستی اپراتور'
                                      : '⚡ تحویل آنی'}
                                  </span>
                                  {pl.badge && (
                                    <span className="px-2 py-0.5 rounded-control text-[10px] bg-brand/10 text-brand border border-brand/20 font-bold">
                                      {pl.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                                    <input
                                      type="radio"
                                      name="default-plan"
                                      checked={pl.is_default}
                                      onChange={() => {
                                        const updated = pPlans.map(
                                          (pItem, i) => ({
                                            ...pItem,
                                            is_default: i === idx,
                                          }),
                                        )
                                        setPPlans(updated)
                                        setPPlansJSON(
                                          JSON.stringify(updated, null, 2),
                                        )
                                      }}
                                      className="text-brand"
                                    />
                                    <span>پلن پیش‌فرض انتخاب</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = pPlans.filter(
                                        (_, i) => i !== idx,
                                      )
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="h-7 w-7 rounded-control text-destructive hover:bg-destructive/10 border border-destructive/20 flex items-center justify-center transition cursor-pointer"
                                    title="حذف این پلن"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    شناسه یکتا
                                  </span>
                                  <input
                                    type="text"
                                    value={pl.id}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].id = e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    متن دوره (مانند ۱ ماهه)
                                  </span>
                                  <input
                                    type="text"
                                    value={pl.duration_text}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].duration_text =
                                        e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px]"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    قیمت فروش (تومان)
                                  </span>
                                  <input
                                    type="number"
                                    step={1000}
                                    value={pl.price_toman}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].price_toman = Number(
                                        e.target.value,
                                      )
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-mono"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    قیمت خط‌خورده قبل تخفیف
                                  </span>
                                  <input
                                    type="number"
                                    step={1000}
                                    value={pl.original_price_toman || 0}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].original_price_toman =
                                        Number(e.target.value)
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] font-mono"
                                  />
                                </div>
                              </div>

                              {/* Plan Badge Selection (محبوب‌ترین، بیشترین تخفیف، تخفیف ویژه) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/40 text-right">
                                <div>
                                  <span className="text-[10px] font-bold text-foreground block mb-0.5">
                                    برچسب نمایشی پلن (Badge):
                                  </span>
                                  <input
                                    type="text"
                                    value={pl.badge || ''}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].badge = e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    placeholder="مثلاً: محبوب‌ترین یا تخفیف ویژه"
                                    className="w-full h-8 px-2 rounded-control border border-border/60 bg-card text-[11px] outline-none focus:border-brand font-bold text-brand"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                                    انتخاب سریع برچسب:
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                    {[
                                      '🔥 محبوب‌ترین',
                                      '⚡ بیشترین تخفیف',
                                      '💎 تخفیف ویژه',
                                      '👑 پیشنهاد ویژه',
                                    ].map((preset) => (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...pPlans]
                                          updated[idx].badge =
                                            pl.badge === preset ? '' : preset
                                          setPPlans(updated)
                                          setPPlansJSON(
                                            JSON.stringify(updated, null, 2),
                                          )
                                        }}
                                        className={`px-2 py-0.5 rounded-control text-[10px] font-bold transition-all cursor-pointer ${
                                          pl.badge === preset
                                            ? 'bg-brand text-brand-foreground font-black shadow-xs'
                                            : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                                        }`}
                                      >
                                        {preset}
                                      </button>
                                    ))}
                                    {pl.badge && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...pPlans]
                                          updated[idx].badge = ''
                                          setPPlans(updated)
                                          setPPlansJSON(
                                            JSON.stringify(updated, null, 2),
                                          )
                                        }}
                                        className="text-[10px] text-rose-500 hover:underline px-1 cursor-pointer"
                                      >
                                        حذف بج
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Plan Delivery Strategy & Upstream Bot Routing (Per-Plan Override) */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-border/40 bg-muted/10 p-2.5 rounded-surface text-right">
                                <div>
                                  <span className="text-[10px] font-bold text-foreground block mb-0.5">
                                    شیوه تحویل این پلن
                                  </span>
                                  <select
                                    value={
                                      pl.delivery_strategy ||
                                      pDeliveryStrategy ||
                                      'third_party_instant'
                                    }
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].delivery_strategy = e.target
                                        .value as any
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-card text-[11px] outline-none cursor-pointer"
                                  >
                                    <option value="third_party_instant">
                                      ⚡ تحویل آنی از ربات
                                    </option>
                                    <option value="manual_operator">
                                      🔷 تحویل دستی اپراتور
                                    </option>
                                    <option value="local_inventory">
                                      🔑 انبار لایسنس محلی
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-foreground block mb-0.5">
                                    ربات تامین‌کننده این پلن
                                  </span>
                                  <select
                                    value={
                                      pl.external_provider ||
                                      pExternalProvider ||
                                      'insightx'
                                    }
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].external_provider =
                                        e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-card text-[11px] font-mono outline-none cursor-pointer"
                                  >
                                    <option value="insightx">
                                      اینسایت‌استور (@insightXpro_bot)
                                    </option>
                                    <option value="stackvault">
                                      استک‌ولت (@stackvault_bot)
                                    </option>
                                    <option value="paglu">
                                      لوت پاگلو (@Paglu_Shopp_Bot)
                                    </option>
                                    <option value="jero">
                                      جرو اکانتس (@JeroAccountsBot)
                                    </option>
                                    <option value="supreme">
                                      سوپریم لیدر (@SupremeLeaderShopBot)
                                    </option>
                                    <option value="manual_vault">
                                      انبار محلی (بدون ربات)
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-foreground block mb-0.5">
                                    شناسه محصول ربات (External ID)
                                  </span>
                                  <input
                                    type="text"
                                    value={
                                      pl.external_product_id_str ||
                                      (pl.external_product_id
                                        ? String(pl.external_product_id)
                                        : '')
                                    }
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].external_product_id_str =
                                        e.target.value
                                      const num = parseInt(e.target.value, 10)
                                      updated[idx].external_product_id =
                                        !Number.isNaN(num)
                                          ? num
                                          : e.target.value
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    placeholder="مثال: 14 یا ps_1024"
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-card text-[11px] font-mono outline-none focus:border-brand"
                                  />
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-foreground block mb-0.5">
                                    خرید دلاری پلن ($)
                                  </span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={pl.base_cost_usd || 0}
                                    onChange={(e) => {
                                      const updated = [...pPlans]
                                      updated[idx].base_cost_usd =
                                        parseFloat(e.target.value) || 0
                                      setPPlans(updated)
                                      setPPlansJSON(
                                        JSON.stringify(updated, null, 2),
                                      )
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-card text-[11px] font-mono outline-none focus:border-brand"
                                  />
                                </div>
                              </div>

                              {/* Sync Plan with Base Product Button */}
                              <div className="flex items-center justify-between pt-2 border-t border-border/40 flex-wrap gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPPriceToman(
                                      pl.price_toman || pPriceToman,
                                    )
                                    if (pl.original_price_toman)
                                      setPOriginalPriceToman(
                                        pl.original_price_toman,
                                      )
                                    if (pl.base_cost_usd)
                                      setPBaseCostUSD(pl.base_cost_usd)
                                    if (pl.external_provider)
                                      setPExternalProvider(pl.external_provider)
                                    if (pl.delivery_strategy)
                                      setPDeliveryStrategy(pl.delivery_strategy)
                                    if (pl.external_product_id_str)
                                      setPExternalProductIDStr(
                                        pl.external_product_id_str,
                                      )
                                    notifySuccess(
                                      'همگام‌سازی موفق',
                                      `قیمت و مشخصات پلن «${pl.title}» روی مشخصات پایه محصول بارگذاری گردید.`,
                                    )
                                  }}
                                  className="px-2.5 py-1 rounded-control bg-secondary hover:bg-muted text-foreground text-[10px] font-bold border border-border/60 shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3 text-brand" />
                                  <span>
                                    همگام‌سازی این پلن با مشخصات پایه و فروش
                                    محصول
                                  </span>
                                </button>
                                <span className="text-[10px] text-muted-foreground font-latin">
                                  اعتبار: {pl.duration_days || 30} روز (
                                  {pl.duration_text || '۱ ماهه'})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
                          <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
                          <div className="font-bold text-xs text-foreground">
                            هنوز پلن اختصاصی تعریف نشده است
                          </div>
                          <p className="text-[11px]">
                            در صورت عدم ثبت پلن اختصاصی، سیستم به صورت خودکار
                            پلن‌های ۱ ماهه، ۳ ماهه و ۱ ساله را بر مبنای قیمت پایه
                            ارائه می‌کند.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateDefaultPlans}
                            className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>ایجاد ۳ پلن استاندارد اکنون</span>
                          </button>
                        </div>
                      )}

                      {/* Add Plan & Raw JSON Toggle */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newPlan: ProductPlan = {
                              id: `plan-${Date.now()}`,
                              title: 'پلن اختصاصی جدید',
                              duration_days: 30,
                              duration_text: '۱ ماهه',
                              price_toman: pPriceToman,
                              original_price_toman: Math.round(
                                pPriceToman * 1.18,
                              ),
                              is_default: pPlans.length === 0,
                              delivery_type: pDeliveryType,
                            }
                            const updated = [...pPlans, newPlan]
                            setPPlans(updated)
                            setPPlansJSON(JSON.stringify(updated, null, 2))
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>افزودن پلن جدید</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: COMPARISON TABLE */}
                  {productModalTab === 'comparison' && (
                    <div className="space-y-4">
                      {renderPlanContextBar('جدول مقایسه')}
                      <div className="flex flex-wrap items-center justify-between p-3.5 rounded-surface bg-muted/20 border border-border/60 gap-2">
                        <div>
                          <h4 className="font-black text-foreground text-xs flex items-center gap-2">
                            <Table className="h-4 w-4 text-brand" />
                            <span>جدول مقایسه ویژگی‌ها (Comparison Matrix)</span>
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            مقایسه قابلیت‌های نسخه رایگان با پلاس و تیمی روی صفحه
                            محصول (پشتیبانی از فرمت‌های متنی، مارک‌داون و
                            ساختاریافته)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultComparison}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری قالب پیشنهادی</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-foreground block text-xs">
                          ویرایشگر متن و جدول مقایسه ویژگی‌های محصول:
                        </label>
                        <RichContentEditor
                          value={pComparisonJSON}
                          onChange={setPComparisonJSON}
                          placeholder="## جدول مقایسه ویژگی‌ها&#10;&#10;| ویژگی | پلن رایگان | پلن پلاس |&#10;| --- | --- | --- |&#10;| دسترسی نامحدود | ✕ | ✓ |"
                          minHeight="320px"
                          label="محتوای جدول مقایسه"
                        />
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          نکته: در صورت خالی بودن، سیستم بر مبنای نوع سرویس جدول
                          استاندارد را نمایش می‌دهد.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ACTIVATION GUIDE */}
                  {productModalTab === 'guide' && (
                    <div className="space-y-4">
                      {renderPlanContextBar('راهنمای فعال‌سازی')}
                      <div className="flex flex-wrap items-center justify-between p-3.5 rounded-surface bg-muted/20 border border-border/60 gap-2">
                        <div>
                          <h4 className="font-black text-foreground text-xs flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-brand" />
                            <span>راهنمای گام‌به‌گام فعال‌سازی و رفع تحریم</span>
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            مراحل مصور تحویل، لینک، لاگین و آموزش تنظیم DNS
                            ضدتحریم (شکن / الکترو)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultGuide}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری راهنمای پیشنهادی</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-foreground block text-xs">
                          ویرایشگر مراحل فعال‌سازی و آموزش استفاده:
                        </label>
                        <RichContentEditor
                          value={pGuideJSON}
                          onChange={setPGuideJSON}
                          placeholder="### مرحله اول: پرداخت و دریافت لایسنس&#10;پس از پرداخت، اطلاعات اشتراک صادر می‌شود...&#10;&#10;### تنظیمات DNS شکن:&#10;178.22.122.100"
                          minHeight="320px"
                          label="راهنمای فعال‌سازی"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 6: FAQS */}
                  {productModalTab === 'faq' && (
                    <div className="space-y-4">
                      {renderPlanContextBar('سوالات متداول')}
                      <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-muted/40 border border-border gap-2">
                        <div>
                          <h4 className="font-bold text-foreground">
                            سوالات متداول، رفع تحریم و نکات امنیتی (FAQ)
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            پاسخ به ابهامات متداول مشتریان در خصوص گارانتی،
                            قطعی، حفظ چت‌ها و پروتکل Zeroize
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDefaultFaqs}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری سوالات پیشنهادی</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="p-faq-json"
                          className="font-bold text-foreground block mb-1"
                        >
                          لیست سوال و جواب‌ها (JSON)
                        </label>
                        <textarea
                          id="p-faq-json"
                          rows={12}
                          placeholder='[\n  {\n    "question": "آیا اکانت قطعی دارد؟",\n    "answer": "خیر، پرداخت ۱۰۰٪ قانونی است..."\n  }\n]'
                          value={pFaqJSON}
                          onChange={(e) => setPFaqJSON(e.target.value)}
                          className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin text-xs outline-none focus:border-brand resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 9: TRUST & REASSURANCE GUARANTEES */}
                  {productModalTab === 'trust' && (
                    <div className="space-y-4 text-right">
                      {renderPlanContextBar('ضمانت‌ها و اعتماد خریداران')}
                      <div className="p-4 rounded-surface bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-brand" />
                            مدیریت و سفارشی‌سازی ضمانت‌های رسمی خرید (Trust Grid)
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            تنظیم و تغییر ۴ کادر ضمانت انتهای صفحه محصول (تحویل
                            آنی، عدم قطعی، Zeroize، پشتیبانی ۲۴ ساعته)
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPInstructions(
                                `### ضمانت‌های رسمی و تعهدات ما\n\n:::columns-2\n:::col\n#### ⚡ تحویل آنی و مطمئن\nصدور ۰ ثانیه‌ای لایسنس بلافاصله پس از پرداخت بدون کوچکترین معطلی.\n:::col\n#### 🛡️ ضمانت اصالت و سلامت کامل\nپرداخت با کارت‌های بین‌المللی اختصاصی و پوشش کامل در طول مدت اشتراک.\n:::\n\n:::columns-2\n:::col\n#### 🔒 حریم خصوصی و امنیت کامل\nعدم ذخیره‌سازی داده‌های حساس و رعایت استانداردهای امنیتی.\n:::col\n#### 🎧 پشتیبانی ۲۴ ساعته\nپاسخگویی سریع کارشناسان در ساعات اداری و پشتیبانی آنلاین.\n:::`,
                              )
                              notifySuccess(
                                'قالب ضمانت‌ها بارگذاری شد',
                                'متن ضمانت‌ها در ویرایشگر قرار گرفت؛ می‌توانید آن را مطابق نظر خود ویرایش فرمایید.',
                              )
                            }}
                            className="h-8 px-3 rounded-control bg-secondary text-brand hover:bg-muted text-xs font-bold flex items-center gap-1.5 border border-border/60 shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>بارگذاری قالب اختصاصی</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-surface border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-foreground block">
                            حالت نمایش ضمانت‌ها در صفحه این محصول:
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            می‌توانید کادر ضمانت‌ها را روی حالت پیش‌فرض هوشمند
                            بگذارید، متن دلخواه بنویسید یا کلاً مخفی کنید
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPInstructions('default')}
                            className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                              pInstructions === 'default' || !pInstructions
                                ? 'bg-primary text-primary-foreground font-black shadow-control'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                            }`}
                          >
                            پیش‌فرض هوشمند
                          </button>
                          <button
                            type="button"
                            onClick={() => setPInstructions('hide')}
                            className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all cursor-pointer ${
                              pInstructions === 'hide'
                                ? 'bg-rose-500 text-white font-black shadow-control'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                            }`}
                          >
                            عدم نمایش (مخفی)
                          </button>
                        </div>
                      </div>

                      {pInstructions !== 'hide' && (
                        <div className="space-y-1.5">
                          <label className="font-bold text-foreground block text-xs">
                            متن سفارشی ضمانت‌ها (در صورت خالی بودن یا انتخاب
                            پیش‌فرض، ۴ کارت استاندارد نمایش می‌یابد):
                          </label>
                          <RichContentEditor
                            value={
                              pInstructions === 'default' ? '' : pInstructions
                            }
                            onChange={(val) =>
                              setPInstructions(val || 'default')
                            }
                            placeholder="متن دلخواه یا کد مارک‌داون ضمانت‌ها..."
                            minHeight="280px"
                            label="ویرایشگر ضمانت‌ها"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Submit Button: Full-width Graphite primary button without cancel button per user instruction */}
                  <div className="pt-3 border-t border-border/60">
                    <button
                      type="submit"
                      disabled={productSubmitting}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {productSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span>
                        {editingProduct
                          ? 'ذخیره تمام تغییرات و انتشار'
                          : 'ثبت و انتشار محصول در فروشگاه'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* DELETE PRODUCT MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen && Boolean(productToDelete)}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setProductToDelete(null)
        }}
        onConfirm={handleDeleteProductSubmit}
        title="حذف محصول از کاتالوگ"
        description={`آیا از حذف محصول «${productToDelete?.title_fa || ''}» از کاتالوگ فروشگاه اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`}
        confirmText="بله، محصول حذف شود"
        cancelText="انصراف"
        loading={deleteLoading}
        variant="danger"
      />

      {/* EXPORT MODAL */}
      {isExportOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="max-w-md w-full my-auto bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95 text-foreground">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">
                      خروجی کلیدهای انبار
                    </h3>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsExportOpen(false)}
                    size="sm"
                  />
                </div>

                {exportLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-xs">در حال دریافت داده‌ها...</span>
                  </div>
                ) : exportedKeys.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    هیچ کلیدی برای خروجی یافت نشد.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      تعداد کلیدهای استخراج شده:{' '}
                      <span className="font-bold text-foreground">
                        {exportedKeys.length}
                      </span>
                    </p>
                    <textarea
                      readOnly
                      rows={8}
                      value={exportedKeys.join('\n')}
                      className="w-full p-3 rounded-xl border border-border bg-background font-mono text-[11px] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyExport}
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center justify-center gap-2 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      {copiedExport ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>در کلیپ‌بورد کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>کپی همه کلیدها</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* REPLACE KEY MODAL */}
      {isReplaceOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <form
                onSubmit={handleReplaceKeySubmit}
                className="max-w-md w-full my-auto bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95 text-foreground"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">
                      تعویض کلید سفارش (گارانتی)
                    </h3>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsReplaceOpen(false)}
                    size="sm"
                  />
                </div>

                {replaceSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{replaceSuccessMsg}</span>
                  </div>
                )}

                {replaceErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{replaceErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label
                      htmlFor="replace-order-id"
                      className="font-bold text-foreground block mb-1"
                    >
                      شناسه سفارش (Order UUID)
                    </label>
                    <input
                      id="replace-order-id"
                      type="text"
                      required
                      placeholder="مثال: a1b2c3d4-..."
                      value={replaceOrderId}
                      onChange={(e) => setReplaceOrderId(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="replace-old-item"
                      className="font-bold text-foreground block mb-1"
                    >
                      شناسه کلید قدیمی معیوب (اختیاری)
                    </label>
                    <input
                      id="replace-old-item"
                      type="text"
                      placeholder="در صورت خالی بودن، خودکار تشخیص داده می‌شود"
                      value={replaceOldItemId}
                      onChange={(e) => setReplaceOldItemId(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="replace-reason"
                      className="font-bold text-foreground block mb-1"
                    >
                      دلیل تعویض
                    </label>
                    <input
                      id="replace-reason"
                      type="text"
                      required
                      value={replaceReason}
                      onChange={(e) => setReplaceReason(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsReplaceOpen(false)}
                    className="h-10 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold transition shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={replaceLoading}
                    className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    {replaceLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>جایگزینی کلید جدید</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* BULK IMPORT KEYS MODAL */}
      {isBulkImportOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <form
                onSubmit={handleBulkImportSubmit}
                className="max-w-lg w-full my-auto bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95 text-foreground"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-control bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        افزودن دسته‌ای کلیدها و لایسنس‌ها (Bulk Import)
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        ثبت مستقیم کلیدها در انبار محلی جهت تحویل آنی
                      </p>
                    </div>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsBulkImportOpen(false)}
                    size="sm"
                  />
                </div>

                <div className="space-y-3.5 text-xs text-right">
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      انتخاب محصول متصل <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={bulkImportProductId}
                      onChange={(e) => setBulkImportProductId(e.target.value)}
                      className="w-full h-10 px-3 rounded-control border border-border/60 bg-secondary text-foreground text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- انتخاب محصول فروشگاه --</option>
                      {adminProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title_fa} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-foreground block mb-1">
                        نوع محتوای ارسالی
                      </label>
                      <select
                        value={bulkImportItemType}
                        onChange={(e) => setBulkImportItemType(e.target.value)}
                        className="w-full h-10 px-3 rounded-control border border-border/60 bg-secondary text-foreground text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="license_key">
                          کد لایسنس (License Code)
                        </option>
                        <option value="credentials_pair">
                          اکانت (یوزر/پسورد)
                        </option>
                        <option value="activation_url">
                          لینک فعال‌سازی (Invite Link)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-foreground block mb-1">
                        برچسب پارت / بچ (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={bulkImportBatchTag}
                        onChange={(e) => setBulkImportBatchTag(e.target.value)}
                        placeholder="مثلاً: Batch-2026-10"
                        className="w-full h-10 px-3 rounded-control border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-foreground block">
                        لیست کلیدها (هر سطر یک آیتم){' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground font-mono font-latin">
                        تعداد سطرها:{' '}
                        {
                          bulkImportLines.split('\n').filter((l) => l.trim())
                            .length
                        }
                      </span>
                    </div>
                    <textarea
                      required
                      rows={6}
                      value={bulkImportLines}
                      onChange={(e) => setBulkImportLines(e.target.value)}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY&#10;user:pass"
                      className="w-full p-3 rounded-control border border-border/60 bg-muted/20 text-foreground font-mono font-latin text-xs outline-none focus:border-brand resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsBulkImportOpen(false)}
                    className="h-10 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold transition shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={bulkImportLoading}
                    className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    {bulkImportLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>ثبت و واردسازی به انبار</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Fetch from Bot Modal (Direct from Catalog Toolbar) */}
      <FetchBotModal
        isOpen={localFetchBotOpen}
        onClose={() => setLocalFetchBotOpen(false)}
        onProductImported={() => loadData()}
      />
    </div>
  )
}
