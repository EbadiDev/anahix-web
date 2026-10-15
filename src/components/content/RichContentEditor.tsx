import {
  AlertTriangle,
  Bold,
  Clock,
  Code,
  Eye,
  FileCode,
  FileText,
  Heading2,
  Heading3,
  Image,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Sparkles,
  Split,
  Table,
  Wand2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api'
import type { ContentTemplate } from '../../types'
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
  const [viewMode, setViewMode] = useState<EditorViewMode>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageAlt, setImageAlt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [dbTemplates, setDbTemplates] = useState<ContentTemplate[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  useEffect(() => {
    if (onReadingTimeChange) {
      onReadingTimeChange(readingTime)
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
    if (
      value.trim().length > 50 &&
      !window.confirm(`محتوای فعلی با «${tmpl.title}» جایگزین شود؟`)
    ) {
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
          {/* Templates Menu */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5 text-blue-600" />
              <span>قالب‌های آماده</span>
            </button>
            <div className="absolute left-0 mt-1 hidden group-hover:flex flex-col w-56 bg-popover border border-border rounded-xl shadow-lg p-1.5 z-30 text-right dir-rtl space-y-1">
              {dbTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="w-full px-3 py-2 text-xs text-right hover:bg-muted rounded-lg transition-colors flex items-center justify-between gap-2 group/btn"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-foreground group-hover/btn:text-primary transition-colors">
                      {tmpl.title}
                    </span>
                    {tmpl.description && (
                      <span className="text-[10px] text-muted-foreground block line-clamp-1">
                        {tmpl.description}
                      </span>
                    )}
                  </div>
                  <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                </button>
              ))}

              {dbTemplates.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  در حال بارگذاری قالب‌ها...
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
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
          </div>

          {/* Formats */}
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
              onClick={() => insertText('`', '`', 'کد یا کلمه کلیدی')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors font-mono"
              title="کد درون خطی"
            >
              <Code className="h-4 w-4" />
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
              onClick={() => insertBlock('> نقل قول مهم یا نکته راهنما')}
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="نقل قول"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Advanced Blocks: Table, Code Block, Callouts */}
          <div className="flex items-center gap-0.5 px-2 border-l border-border/80">
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '| نام ویژگی | نسخه رایگان | نسخه اشتراکی |\n| :--- | :--- | :--- |\n| سقف استفاده | ۱۰ پرسش | نامحدود |\n| سرعت پاسخ | متوسط | آنی |',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              title="درج جدول"
            >
              <Table className="h-4 w-4" />
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
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '> [!TIP]\n> ترفند کاربردی برای افزایش سرعت و پایداری سرویس',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-emerald-600 rounded-lg transition-colors"
              title="باکس نکته (Tip Box)"
            >
              <Lightbulb className="h-4 w-4 text-emerald-600" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertBlock(
                  '> [!WARNING]\n> توجه فرمایید هنگام ورود لوکیشن واقعی لو نرود.',
                )
              }
              className="p-1.5 hover:bg-muted hover:text-amber-600 rounded-lg transition-colors"
              title="باکس هشدار (Warning Box)"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </button>
          </div>

          {/* Links & Images */}
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
              title="درج تصویر"
            >
              <Image className="h-4 w-4" />
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
        className={`flex-1 flex overflow-hidden ${
          viewMode === 'split' ? 'divide-x divide-x-reverse divide-border' : ''
        }`}
        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
      >
        {/* Write Pane */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div
            className={`flex-1 flex flex-col h-full bg-background ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              dir="rtl"
              className="w-full flex-1 p-4 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-hidden font-mono text-sm leading-relaxed"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 bg-card/40 ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
                <Sparkles className="h-8 w-8 mb-2 opacity-40 text-primary" />
                <p className="text-sm">پیش‌نمایش زنده در اینجا ظاهر خواهد شد</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  شروع به نوشتن متن در کادر ویرایشگر کنید
                </p>
              </div>
            )}
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
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-xl text-right dir-rtl space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              درج لینک در متن
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  عنوان نمایشی لینک
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="مثلاً: خرید اکانت جمینای ادونسد"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  آدرس اینترنتی (URL)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... یا /products/gemini"
                  dir="ltr"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-left font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                انصراف
              </button>
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
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
              >
                افزودن لینک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Insertion Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-xl text-right dir-rtl space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              درج تصویر در محتوا
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  توضیح تصویر (Alt Text برای سئو)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="مثلاً: اسکرین‌شات محیط کاربری جمینای ادونسد"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  آدرس تصویر (Image URL)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://.../photo.jpg"
                  dir="ltr"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-left font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  if (imageUrl) {
                    insertBlock(`![${imageAlt || 'تصویر محتوا'}](${imageUrl})`)
                    setImageAlt('')
                    setImageUrl('')
                    setShowImageModal(false)
                  }
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
              >
                درج تصویر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
