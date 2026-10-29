import {
  AlertOctagon,
  AlertTriangle,
  Bold,
  CheckCircle2,
  CheckSquare,
  Clock,
  Code,
  Columns3,
  Eye,
  FileCode,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  HelpCircle,
  Highlighter,
  Image,
  Info,
  Italic,
  Keyboard,
  LayoutGrid,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Sparkles,
  Split,
  Strikethrough,
  Table,
  Underline,
  Upload,
  Video,
  Wand2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../services/api'
import type { ContentTemplate } from '../../types'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { MarkdownRenderer } from './MarkdownRenderer'

interface RichContentEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  label?: string
  onReadingTimeChange?: (minutes: number) => void
  contentType?: 'blog' | 'help'
}

type EditorViewMode = 'write' | 'split' | 'preview'

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  value,
  onChange,
  placeholder = 'محتوای مقاله یا راهنما را اینجا بنویسید (پشتیبانی کامل از مارک‌داون، تیترها، جداول، کد و فرمت‌های پیشرفته)...',
  minHeight = '420px',
  label = 'متن و محتوای اصلی',
  onReadingTimeChange,
  contentType = 'blog',
}) => {
  const { error: notifyError } = useNotification()
  const [viewMode, setViewMode] = useState<EditorViewMode>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageAlt, setImageAlt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false)
  const [dbTemplates, setDbTemplates] = useState<ContentTemplate[]>([])
  const [pendingTemplate, setPendingTemplate] =
    useState<ContentTemplate | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateTypeFilter, setTemplateTypeFilter] = useState<
    'all' | 'blog' | 'help'
  >('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleUploadImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    setImageUploadSuccess(false)
    try {
      const resp = await api.uploadMedia(file)
      if (resp?.file_url) {
        setImageUrl(resp.file_url)
        setImageUploadSuccess(true)
        if (!imageAlt) {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
          setImageAlt(cleanName)
        }
      }
    } catch (err: any) {
      notifyError('خطا در آپلود تصویر', err.message || 'مشکل در ارتباط با سرور')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleUploadVideoFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingVideo(true)
    setVideoUploadSuccess(false)
    try {
      const resp = await api.uploadMedia(file)
      if (resp?.file_url) {
        setVideoUrl(resp.file_url)
        setVideoUploadSuccess(true)
        if (!videoTitle) {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
          setVideoTitle(cleanName)
        }
      }
    } catch (err: any) {
      notifyError('خطا در آپلود ویدیو', err.message || 'مشکل در ارتباط با سرور')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.clipboardData.files?.[0]
    if (
      file &&
      (file.type.startsWith('image/') || file.type.startsWith('video/'))
    ) {
      e.preventDefault()
      try {
        const resp = await api.uploadMedia(file)
        if (resp?.file_url) {
          if (file.type.startsWith('video/')) {
            insertBlock(
              `@[video:${file.name.replace(/\.[^/.]+$/, '')}](${resp.file_url})`,
            )
          } else {
            insertBlock(
              `![${file.name.replace(/\.[^/.]+$/, '')}](${resp.file_url})`,
            )
          }
        }
      } catch (err: any) {
        notifyError('خطا در بارگذاری رسانه از کلیپ‌بورد', err.message || '')
      }
    }
  }

  // Fetch dynamic templates from database
  useEffect(() => {
    api
      .getContentTemplates(contentType)
      .then((data) => setDbTemplates(data))
      .catch((err) => console.error('Error fetching templates:', err))
  }, [contentType])

  // Calculate stats
  const wordsCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const charCount = value.length
  // ~180 words per minute
  const readingTime = Math.max(1, Math.ceil(wordsCount / 180))

  const lastReportedRt = useRef(readingTime)
  useEffect(() => {
    if (lastReportedRt.current !== readingTime) {
      lastReportedRt.current = readingTime
      onReadingTimeChange?.(readingTime)
    }
  }, [readingTime, onReadingTimeChange])

  // Count headings
  const headingsCount = (value.match(/^#{1,3}\s+/gm) || []).length

  // Helper to insert or wrap text
  const insertText = (
    prefix: string,
    suffix = '',
    defaultSelected = 'متن دلخواه',
  ) => {
    const el = textareaRef.current
    if (!el) {
      onChange(value + prefix + suffix)
      return
    }

    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.substring(start, end) || defaultSelected
    const replacement = prefix + selected + suffix
    const newValue =
      value.substring(0, start) + replacement + value.substring(end)

    onChange(newValue)

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      )
    }, 10)
  }

  // Insert block at current line
  const insertBlock = (blockText: string) => {
    const el = textareaRef.current
    if (!el) {
      onChange(`${value}\n\n${blockText}`)
      return
    }

    const start = el.selectionStart
    const before = value.substring(0, start)
    const after = value.substring(start)

    // Ensure leading and trailing newlines
    const leading = before.endsWith('\n\n')
      ? ''
      : before.endsWith('\n')
        ? '\n'
        : '\n\n'
    const trailing = after.startsWith('\n\n')
      ? ''
      : after.startsWith('\n')
        ? '\n'
        : '\n\n'

    const newValue = before + leading + blockText + trailing + after
    onChange(newValue)

    setTimeout(() => {
      el.focus()
      const newCursor = (before + leading + blockText).length
      el.setSelectionRange(newCursor, newCursor)
    }, 10)
  }

  // Keyboard Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        insertText('**', '**', 'متن ضخیم')
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        insertText('*', '*', 'متن مورب')
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        setShowLinkModal(true)
      }
    }
  }

  // Pre-built Database-driven Templates
  const applyTemplate = (tmpl: ContentTemplate) => {
    if (value.trim().length > 50) {
      setPendingTemplate(tmpl)
      return
    }
    onChange(tmpl.template_content)
  }

  return (
    <div
      className={`flex flex-col border border-border rounded-2xl bg-card overflow-hidden shadow-sm transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none bg-background p-4 sm:p-6'
          : ''
      }`}
    >
      {/* Top Header & Editor Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileCode className="h-4 w-4 text-primary" />
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
            {contentType === 'blog'
              ? 'ویرایشگر وبلاگ سئو'
              : 'ویرایشگر پایگاه دانش'}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-xl border border-border/80">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'write'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>نوشتن</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>پیش‌نمایش همزمان</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>پیش‌نمایش کامل</span>
          </button>
        </div>

        {/* Fullscreen & Templates */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-all cursor-pointer active:scale-[0.98] shadow-xs"
            title="انتخاب از میان قالب‌های آماده دیتابیس"
          >
            <Wand2 className="h-3.5 w-3.5 text-brand" />
            <span>قالب‌های آماده ({dbTemplates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
            title={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Toolbar Buttons (visible in write & split modes) */}
      {viewMode !== 'preview' && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-card/60 text-muted-foreground text-xs">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pl-2 border-l border-border/80">
            <button
              type="button"
              onClick={() => insertBlock('# عنوان اصلی بخش (H1)')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors font-bold text-xs"
              title="تیتر سطح یک (H1)"
            >
              <Heading1 className="h-4 w-4 text-primary" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('## عنوان اصلی بخش (H2)')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="تیتر بخش اصلی (H2)"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('### زیرعنوان فرعی (H3)')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="زیرعنوان فرعی (H3)"
            >
              <Heading3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('#### عنوان فرعی سطح ۴ (H4)')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="عنوان فرعی (H4)"
            >
              <Heading4 className="h-4 w-4" />
            </button>
          </div>

          {/* Formats: Bold, Italic, Strikethrough, Underline, Highlight, Code, Keyboard */}
          <div className="flex items-center gap-0.5 px-2 border-l border-border/80">
            <button
              type="button"
              onClick={() => insertText('**', '**', 'متن ضخیم')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="بولد / ضخیم (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*', 'متن مورب')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="ایتالیک / مورب (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('~~', '~~', 'متن خط‌خورده')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="خط‌خورده (Strikethrough)"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('<u>', '</u>', 'متن زیرخط‌دار')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="زیرخط (Underline)"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('==', '==', 'متن هایلایت')}
              className="p-1.5 hover:bg-muted hover:text-amber-500 rounded-lg transition-colors"
              title="هایلایت متنی"
            >
              <Highlighter className="h-4 w-4 text-amber-500" />
            </button>
            <button
              type="button"
              onClick={() => insertText('`', '`', 'کد یا کلمه کلیدی')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors font-mono"
              title="کد درون خطی"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('<kbd>', '</kbd>', 'Ctrl+C')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="کلید کیبورد (KBD)"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5 px-2 border-l border-border/80">
            <button
              type="button"
              onClick={() => insertBlock('- آیتم اول\n- آیتم دوم\n- آیتم سوم')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="لیست بالت‌دار"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock('1. مرحله اول\n2. مرحله دوم\n3. مرحله سوم')
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="لیست شماره‌دار"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '- [x] مرحله اول: انتخاب سرویس و خرید اشتراک\n- [ ] مرحله دوم: تنظیم اطلاعات ورود\n- [ ] مرحله سوم: فعال‌سازی بدون خطا',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="چک‌لیست مراحل (Checklist)"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('> نقل قول مهم یا نکته راهنما')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="نقل قول"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Callout Alert Boxes */}
          <div className="flex items-center gap-0.5 px-2 border-l border-border/80">
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '> [!TIP]\n> ترفند کاربردی برای افزایش سرعت و پایداری سرویس',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-emerald-500 rounded-lg transition-colors"
              title="باکس ترفند و راهکار (Tip Box)"
            >
              <Lightbulb className="h-4 w-4 text-emerald-500" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '> [!WARNING]\n> توجه فرمایید هنگام ورود لوکیشن واقعی لو نرود.',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-amber-500 rounded-lg transition-colors"
              title="باکس هشدار (Warning Box)"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '> [!INFO]\n> اطلاعات تکمیلی و راهنمای مورد نیاز برای استفاده بهینه.',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-blue-500 rounded-lg transition-colors"
              title="باکس اطلاعات (Info Box)"
            >
              <Info className="h-4 w-4 text-blue-500" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '> [!CAUTION]\n> اخطار جدی: از اشتراک‌گذاری عمومی مشخصات اکانت خودداری کنید.',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-rose-500 rounded-lg transition-colors"
              title="باکس خطر و ریسک مسدودی (Danger Box)"
            >
              <AlertOctagon className="h-4 w-4 text-rose-500" />
            </button>
          </div>

          {/* Advanced Blocks: Table, Grids, Accordion, Code */}
          <div className="flex items-center gap-0.5 px-2 border-l border-border/80">
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '| نام ویژگی | نسخه رایگان | نسخه اشتراکی |\n| :---: | :---: | :---: |\n| سقف استفاده | ۱۰ پرسش | نامحدود |\n| سرعت پاسخ | متوسط | آنی |',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="درج جدول مقایسه وسط‌چین"
            >
              <Table className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  ':::columns-2\n:::col\n### مزایای گزینه اول\n- سرعت پاسخگویی فوق‌العاده بالا\n- پایداری و بدون قطعی\n:::col\n### مزایای گزینه دوم\n- مدل‌های اختصاصی پیشرفته\n- سازگاری با تمامی پلتفرم‌ها\n:::',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="چیدمان ستونی مقایسه (۲ ستونه)"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  ':::columns-3\n:::col\n### ویژگی اول\n- توضیحات ویژگی نخست\n:::col\n### ویژگی دوم\n- توضیحات ویژگی دوم\n:::col\n### ویژگی سوم\n- توضیحات ویژگی سوم\n:::',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="چیدمان ۳ ستونه (ویژگی‌ها)"
            >
              <Columns3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '<details>\n<summary>عنوان سوال متداول یا آکاردئون بازشونده</summary>\nپاسخ یا توضیحات تکمیلی و تفصیلی در این بخش قرار می‌گیرد...\n</details>',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="آکاردئون سوال و جواب (FAQ Accordion)"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '```bash\n# نمونه دستور یا تنظیمات ترمینال\ncurl -X GET https://api.example.com\n```',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="بلوک کد چندخطی"
            >
              <FileCode className="h-4 w-4" />
            </button>
          </div>

          {/* Links, Images & Video */}
          <div className="flex items-center gap-0.5 px-2">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="درج لینک (Ctrl+K)"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="درج و آپلود تصویر"
            >
              <Image className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="درج و آپلود ویدیو (MP4/WebM)"
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertBlock('---')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="خط جداکننده افقی"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div
        className={`flex-1 flex flex-col md:flex-row overflow-hidden ${
          viewMode === 'split'
            ? 'divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border'
            : ''
        }`}
        style={{
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight,
          height: isFullscreen ? 'calc(100vh - 120px)' : 'auto',
        }}
      >
        {/* Write Pane */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div
            onClick={() => textareaRef.current?.focus()}
            className={`flex flex-col flex-1 h-full bg-background cursor-text min-h-[500px] ${
              viewMode === 'split' ? 'w-full md:w-1/2' : 'w-full'
            }`}
            style={{
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight,
            }}
          >
            {viewMode === 'split' && (
              <div className="px-4 py-2 bg-muted/30 border-b border-border/60 text-[11px] font-bold text-muted-foreground flex items-center justify-between select-none shrink-0">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>متن و ساختار مارک‌داون (جهت نوشتن کلیک کنید)</span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70 dir-ltr font-latin">
                  Markdown Source
                </span>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              dir="rtl"
              className="w-full flex-1 p-4 sm:p-6 bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none border-0 border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 font-sans text-xs sm:text-sm leading-loose overflow-y-auto"
              style={{
                minHeight: isFullscreen ? 'calc(100vh - 180px)' : '450px',
              }}
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col flex-1 h-full bg-card/40 min-h-[500px] ${
              viewMode === 'split' ? 'w-full md:w-1/2' : 'w-full'
            }`}
            style={{
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight,
            }}
          >
            {viewMode === 'split' && (
              <div className="px-4 py-2 bg-muted/30 border-b border-border/60 text-[11px] font-bold text-muted-foreground flex items-center justify-between select-none shrink-0">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-500" />
                  <span>پیش‌نمایش زنده نهایی</span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70 dir-ltr font-latin">
                  Live Preview
                </span>
              </div>
            )}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              style={{
                minHeight: isFullscreen ? 'calc(100vh - 180px)' : '450px',
              }}
            >
              {value.trim() ? (
                <MarkdownRenderer content={value} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                  <Sparkles className="h-8 w-8 mb-2 opacity-40 text-primary" />
                  <p className="text-sm font-bold text-foreground">
                    پیش‌نمایش زنده در اینجا ظاهر خواهد شد
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    شروع به نوشتن متن یا اعمال قالب آماده کنید
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar with Reading Time & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 border-t border-border bg-muted/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>زمان تقریبی مطالعه:</span>
            <span className="text-blue-600 font-bold">{readingTime} دقیقه</span>
          </span>
          <span>{wordsCount} کلمه</span>
          <span>{charCount} کاراکتر</span>
          <span>{headingsCount} بخش و سرفصل</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground/80 hidden sm:inline">
            فرمت: Markdown استاندارد + HTML
          </span>
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>آماده ذخیره و انتشار</span>
        </div>
      </div>

      {/* Link Insertion Modal */}
      {showLinkModal &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483647,
            }}
            dir="rtl"
          >
            <div className="w-full max-w-md bg-card border border-border/80 rounded-surface p-5 shadow-overlay text-right space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-brand" />
                  درج لینک در متن
                </h3>
                <ModalCloseButton
                  onClick={() => setShowLinkModal(false)}
                  size="sm"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    عنوان نمایشی لینک
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="مثلاً: خرید اکانت جمینای ادونسد"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    آدرس اینترنتی (URL)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://... یا /products/gemini"
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-left font-mono font-latin outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    if (linkUrl) {
                      insertText(
                        `[${linkText || 'لینک دلخواه'}](${linkUrl})`,
                        '',
                        '',
                      )
                      setLinkText('')
                      setLinkUrl('')
                      setShowLinkModal(false)
                    }
                  }}
                  className="h-11 w-full rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                >
                  افزودن لینک به متن
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Image Insertion & Direct File Upload Modal */}
      {showImageModal &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483647,
            }}
            dir="rtl"
          >
            <div className="w-full max-w-lg bg-card border border-border/80 rounded-surface p-5 sm:p-6 shadow-overlay space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                  <Image className="h-4 w-4 text-brand" />
                  درج و آپلود مستقیم تصویر سئو
                </h3>
                <ModalCloseButton
                  onClick={() => setShowImageModal(false)}
                  size="sm"
                />
              </div>

              {/* Direct File Uploader Box */}
              <div className="p-4 rounded-control border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors text-center space-y-2">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center mx-auto shadow-control">
                  {isUploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editor-image-file-upload"
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    {isUploadingImage
                      ? 'در حال آپلود فایل روی سرور...'
                      : 'انتخاب تصویر از کامپیوتر یا دستگاه'}
                  </label>
                  <input
                    id="editor-image-file-upload"
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    onChange={handleUploadImageFile}
                    className="hidden"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    فرمت‌های JPG، PNG، WEBP و GIF تا حداکثر ۱۰ مگابایت
                  </p>
                </div>
                {imageUploadSuccess && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-control">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>فایل با موفقیت روی سرور بارگذاری شد</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    آدرس تصویر (URL)
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... یا پس از آپلود خودکار پر می‌شود"
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    متن جایگزین و کلیدواژه سئو (Alt Text)
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="مثال: آموزش فعال‌سازی اشتراک ChatGPT Plus قانونی"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    متن کوتاه و دقیقی که موتورهای جستجوی گوگل برای سئو ایندکس
                    می‌کنند.
                  </p>
                </div>
              </div>

              {/* Preview if image URL exists */}
              {imageUrl && (
                <div className="p-2 rounded-control bg-muted/30 border border-border/60 flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt={imageAlt || 'پیش‌نمایش'}
                    className="w-12 h-12 rounded-control object-cover border border-border shrink-0"
                  />
                  <div
                    className="min-w-0 flex-1 text-[11px] font-mono text-muted-foreground truncate"
                    dir="ltr"
                  >
                    {imageUrl}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border/60">
                <button
                  type="button"
                  disabled={!imageUrl.trim()}
                  onClick={() => {
                    if (imageUrl) {
                      insertBlock(`![${imageAlt || 'تصویر سئو'}](${imageUrl})`)
                      setImageAlt('')
                      setImageUrl('')
                      setShowImageModal(false)
                    }
                  }}
                  className="h-11 w-full rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  درج تصویر در محتوا
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Video Insertion & Direct File Upload Modal */}
      {showVideoModal &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483647,
            }}
            dir="rtl"
          >
            <div className="w-full max-w-lg bg-card border border-border/80 rounded-surface p-5 sm:p-6 shadow-overlay space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                  <Video className="h-4 w-4 text-brand" />
                  درج و آپلود ویدیو آموزشی
                </h3>
                <ModalCloseButton
                  onClick={() => setShowVideoModal(false)}
                  size="sm"
                />
              </div>

              {/* Direct Video File Uploader Box */}
              <div className="p-4 rounded-control border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors text-center space-y-2">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center mx-auto shadow-control">
                  {isUploadingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="editor-video-file-upload"
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    {isUploadingVideo
                      ? 'در حال آپلود ویدیوی آموزشی روی سرور...'
                      : 'انتخاب ویدیو از دستگاه (MP4, WebM, MOV)'}
                  </label>
                  <input
                    id="editor-video-file-upload"
                    type="file"
                    accept="video/*"
                    disabled={isUploadingVideo}
                    onChange={handleUploadVideoFile}
                    className="hidden"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    فرمت‌های MP4، WEBM، MOV و OGG تا حداکثر ۱۰۰ مگابایت
                  </p>
                </div>
                {videoUploadSuccess && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-control">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ویدیو با موفقیت روی سرور بارگذاری شد</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    آدرس ویدیو (URL)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://... یا پس از آپلود خودکار درج می‌شود"
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    عنوان و زیرنویس ویدیو (Caption)
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="مثال: ویدیو آموزش نحوه فعال‌سازی DNS در اندروید و ویندوز"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Live Video Preview if URL exists */}
              {videoUrl && (
                <div className="p-2 rounded-control bg-muted/30 border border-border/60 space-y-2">
                  <video
                    controls
                    preload="metadata"
                    src={videoUrl}
                    className="w-full max-h-40 rounded-control bg-black"
                  >
                    <track kind="captions" />
                  </video>
                  <div
                    className="text-[11px] font-mono text-muted-foreground truncate"
                    dir="ltr"
                  >
                    {videoUrl}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border/60">
                <button
                  type="button"
                  disabled={!videoUrl.trim()}
                  onClick={() => {
                    if (videoUrl) {
                      insertBlock(
                        `@[video:${videoTitle || 'ویدیوی آموزشی'}](${videoUrl})`,
                      )
                      setVideoTitle('')
                      setVideoUrl('')
                      setShowVideoModal(false)
                    }
                  }}
                  className="h-11 w-full rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  درج ویدیو در محتوا
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Dynamic Templates Selection Modal */}
      {showTemplateModal &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483647,
            }}
            dir="rtl"
          >
            <div className="w-full max-w-3xl max-h-[85vh] bg-card border border-border/80 rounded-surface p-5 sm:p-6 shadow-overlay space-y-4 animate-in zoom-in-95 flex flex-col text-right">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-foreground">
                      قالب‌های آماده نگارش (دیتابیس)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      انتخاب قالب‌های آماده ساختاریافته برای افزایش سرعت تولید
                      محتوا
                    </p>
                  </div>
                </div>
                <ModalCloseButton
                  onClick={() => setShowTemplateModal(false)}
                  size="sm"
                />
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-control border border-border/60">
                  <button
                    type="button"
                    onClick={() => setTemplateTypeFilter('all')}
                    className={`px-3 py-1 rounded-control text-xs font-bold transition-all cursor-pointer ${
                      templateTypeFilter === 'all'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    همه قالب‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateTypeFilter('blog')}
                    className={`px-3 py-1 rounded-control text-xs font-bold transition-all cursor-pointer ${
                      templateTypeFilter === 'blog'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    مخصوص وبلاگ
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateTypeFilter('help')}
                    className={`px-3 py-1 rounded-control text-xs font-bold transition-all cursor-pointer ${
                      templateTypeFilter === 'help'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    مخصوص پایگاه دانش
                  </button>
                </div>

                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="جستجو در نام قالب‌ها..."
                  className="h-9 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand w-52"
                />
              </div>

              {/* Templates Cards Grid */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {dbTemplates
                  .filter((t) => {
                    if (
                      templateTypeFilter !== 'all' &&
                      t.type !== 'all' &&
                      t.type !== templateTypeFilter
                    ) {
                      return false
                    }
                    if (templateSearch.trim()) {
                      return (
                        t.title.includes(templateSearch.trim()) ||
                        Boolean(t.description?.includes(templateSearch.trim()))
                      )
                    }
                    return true
                  })
                  .map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="p-4 rounded-surface border border-border/60 bg-muted/15 hover:border-brand/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {tmpl.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground border border-border/60">
                            {tmpl.type === 'help'
                              ? 'پایگاه دانش'
                              : tmpl.type === 'blog'
                                ? 'وبلاگ'
                                : 'عمومی'}
                          </span>
                        </div>
                        {tmpl.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {tmpl.description}
                          </p>
                        )}
                        <p className="text-[11px] font-mono text-muted-foreground/80 line-clamp-1 dir-ltr text-left">
                          {tmpl.template_content.slice(0, 90)}...
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          applyTemplate(tmpl)
                          setShowTemplateModal(false)
                        }}
                        className="h-8 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>اعمال قالب</span>
                      </button>
                    </div>
                  ))}

                {dbTemplates.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    قالب آماده‌ای در دیتابیس یافت نشد.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Template Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingTemplate)}
        title="جایگزینی قالب آماده"
        message={`آیا از جایگزینی محتوای فعلی با قالب «${pendingTemplate?.title || ''}» اطمینان دارید؟ محتوای متنی فعلی ویرایشگر پاکسازی خواهد شد.`}
        confirmText="بله، قالب اعمال شود"
        cancelText="انصراف"
        onConfirm={() => {
          if (pendingTemplate) {
            onChange(pendingTemplate.template_content)
            setPendingTemplate(null)
          }
        }}
        onClose={() => setPendingTemplate(null)}
      />
    </div>
  )
}
