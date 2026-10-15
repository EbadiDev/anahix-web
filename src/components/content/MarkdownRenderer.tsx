import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Lightbulb,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null

  // Split content into blocks by double newlines or major structural elements
  const blocks = parseMarkdownBlocks(content)

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed text-right dir-rtl space-y-4 ${className}`}
    >
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  )
}

interface Block {
  id: string
  type:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'p'
    | 'ul'
    | 'ol'
    | 'blockquote'
    | 'callout'
    | 'code'
    | 'table'
    | 'hr'
    | 'image'
  content?: string
  items?: string[]
  lang?: string
  rows?: string[][]
  headers?: string[]
  calloutType?: 'info' | 'tip' | 'warning' | 'success'
  calloutTitle?: string
  src?: string
  alt?: string
}

function parseMarkdownBlocks(raw: string): Block[] {
  const blocks: Block[] = []
  const lines = raw.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      i++
      continue
    }

    // Code block ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'bash'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      blocks.push({
        id: `code-${blocks.length}-${lang}`,
        type: 'code',
        content: codeLines.join('\n'),
        lang,
      })
      continue
    }

    // Horizontal Rule --- or ***
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ id: `hr-${blocks.length}`, type: 'hr' })
      i++
      continue
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      blocks.push({
        id: `h4-${blocks.length}`,
        type: 'h4',
        content: trimmed.slice(5).trim(),
      })
      i++
      continue
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({
        id: `h3-${blocks.length}`,
        type: 'h3',
        content: trimmed.slice(4).trim(),
      })
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({
        id: `h2-${blocks.length}`,
        type: 'h2',
        content: trimmed.slice(3).trim(),
      })
      i++
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({
        id: `h1-${blocks.length}`,
        type: 'h1',
        content: trimmed.slice(2).trim(),
      })
      i++
      continue
    }

    // Markdown Table: starts with |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim().startsWith('|') &&
        lines[i].trim().endsWith('|')
      ) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())
        // Line 1 is usually separator |:---|:---|
        const rows: string[][] = []
        for (let r = 2; r < tableLines.length; r++) {
          const cols = tableLines[r]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim())
          rows.push(cols)
        }
        blocks.push({
          id: `table-${blocks.length}`,
          type: 'table',
          headers: rawHeaders,
          rows,
        })
      }
      continue
    }

    // Blockquote or Callout
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().slice(1).trim())
        i++
      }

      const fullQuote = quoteLines.join('\n')
      // Detect Callout like [!NOTE], [!TIP], [!WARNING], [!IMPORTANT]
      const calloutMatch = fullQuote.match(
        /^\[!(NOTE|INFO|TIP|WARNING|CAUTION|SUCCESS)\]\s*(.*)/i,
      )
      if (calloutMatch) {
        const typeStr = calloutMatch[1].toUpperCase()
        let calloutType: 'info' | 'tip' | 'warning' | 'success' = 'info'
        let title = 'نکته مهم'

        if (typeStr === 'TIP') {
          calloutType = 'tip'
          title = 'ترفند کاربردی'
        } else if (typeStr === 'WARNING' || typeStr === 'CAUTION') {
          calloutType = 'warning'
          title = 'هشدار مهم'
        } else if (typeStr === 'SUCCESS') {
          calloutType = 'success'
          title = 'توصیه و موفقیت'
        }

        const rest = quoteLines.slice(1).join('\n') || calloutMatch[2]
        blocks.push({
          id: `callout-${blocks.length}`,
          type: 'callout',
          calloutType,
          calloutTitle: title,
          content: rest,
        })
      } else {
        blocks.push({
          id: `quote-${blocks.length}`,
          type: 'blockquote',
          content: fullQuote,
        })
      }
      continue
    }

    // Unordered List - or *
    if (
      trimmed.startsWith('- ') ||
      trimmed.startsWith('* ') ||
      trimmed.startsWith('• ')
    ) {
      const items: string[] = []
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') ||
          lines[i].trim().startsWith('* ') ||
          lines[i].trim().startsWith('• '))
      ) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''))
        i++
      }
      blocks.push({ id: `ul-${blocks.length}`, type: 'ul', items })
      continue
    }

    // Ordered List 1. 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ id: `ol-${blocks.length}`, type: 'ol', items })
      continue
    }

    // Standalone Image ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      blocks.push({
        id: `img-${blocks.length}`,
        type: 'image',
        alt: imgMatch[1],
        src: imgMatch[2],
      })
      i++
      continue
    }

    // Regular Paragraph (can span multiple lines until empty)
    const pLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('|') &&
      lines[i].trim() !== '---'
    ) {
      pLines.push(lines[i].trim())
      i++
    }
    if (pLines.length > 0) {
      blocks.push({
        id: `p-${blocks.length}`,
        type: 'p',
        content: pLines.join(' '),
      })
    }
  }

  return blocks
}

// Block Renderer Component
const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  switch (block.type) {
    case 'h1': {
      const id = `heading-${block.id}`
      return (
        <h1
          id={id}
          className="scroll-mt-24 text-2xl md:text-3xl font-extrabold text-foreground border-b border-border pb-3 pt-4 group flex items-center justify-between"
        >
          <span>{renderInlineMarkdown(block.content || '')}</span>
          <a
            href={`#${id}`}
            className="text-muted-foreground/30 group-hover:text-primary transition-colors text-sm pr-2"
            title="لینک به این بخش"
          >
            #
          </a>
        </h1>
      )
    }
    case 'h2': {
      const id = `heading-${block.id}`
      return (
        <h2
          id={id}
          className="scroll-mt-24 text-xl md:text-2xl font-bold text-foreground border-b border-border/50 pb-2.5 pt-6 group flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-primary inline-block" />
            {renderInlineMarkdown(block.content || '')}
          </span>
          <a
            href={`#${id}`}
            className="text-muted-foreground/30 group-hover:text-primary transition-colors text-sm pr-2"
            title="لینک به این بخش"
          >
            #
          </a>
        </h2>
      )
    }
    case 'h3': {
      const id = `heading-${block.id}`
      return (
        <h3
          id={id}
          className="scroll-mt-24 text-lg md:text-xl font-semibold text-foreground pt-4 pb-1 group flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-3.5 rounded-full bg-blue-500/70 inline-block" />
            {renderInlineMarkdown(block.content || '')}
          </span>
          <a
            href={`#${id}`}
            className="text-muted-foreground/30 group-hover:text-primary transition-colors text-xs pr-2"
          >
            #
          </a>
        </h3>
      )
    }
    case 'h4':
      return (
        <h4 className="text-base font-semibold text-foreground pt-2">
          {renderInlineMarkdown(block.content || '')}
        </h4>
      )
    case 'p':
      return (
        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {renderInlineMarkdown(block.content || '')}
        </p>
      )
    case 'ul':
      return (
        <ul className="list-none space-y-2 pr-2 my-3">
          {block.items?.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="list-none space-y-2 pr-2 my-3">
          {block.items?.map((item, itemIdx) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span className="flex items-center justify-center h-5 w-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0 mt-0.5">
                {itemIdx + 1}
              </span>
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      )
    case 'blockquote':
      return (
        <blockquote className="border-r-4 border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-4 py-3 rounded-l-lg my-4 text-slate-700 dark:text-slate-300 italic text-sm md:text-base">
          {renderInlineMarkdown(block.content || '')}
        </blockquote>
      )
    case 'callout': {
      const isTip = block.calloutType === 'tip'
      const isWarn = block.calloutType === 'warning'
      const isSuccess = block.calloutType === 'success'

      const borderClass = isTip
        ? 'border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100'
        : isWarn
          ? 'border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100'
          : isSuccess
            ? 'border-blue-500/50 bg-blue-50/60 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100'
            : 'border-slate-400/50 bg-slate-50/60 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100'

      const Icon = isTip
        ? Lightbulb
        : isWarn
          ? AlertTriangle
          : isSuccess
            ? CheckCircle2
            : Info

      const iconColor = isTip
        ? 'text-emerald-600 dark:text-emerald-400'
        : isWarn
          ? 'text-amber-600 dark:text-amber-400'
          : isSuccess
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-600 dark:text-slate-400'

      return (
        <div className={`border rounded-xl p-4 my-4 ${borderClass}`}>
          <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
            <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
            <span>{block.calloutTitle}</span>
          </div>
          <div className="text-sm leading-relaxed opacity-90 pr-6">
            {renderInlineMarkdown(block.content || '')}
          </div>
        </div>
      )
    }
    case 'code':
      return (
        <div className="relative rounded-xl border border-border bg-slate-950 text-slate-50 overflow-hidden my-4 dir-ltr text-left font-mono text-xs md:text-sm shadow-md">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {block.lang || 'CODE'}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(block.content || '')}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-md"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>کپی</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed scrollbar-thin">
            <code>{block.content}</code>
          </pre>
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto my-5 rounded-xl border border-border shadow-sm">
          <table className="w-full border-collapse text-right text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-muted-foreground font-semibold">
                {block.headers?.map((h) => (
                  <th key={h} className="p-3 text-right">
                    {renderInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {block.rows?.map((row) => (
                <tr
                  key={row.join('|')}
                  className="hover:bg-muted/30 transition-colors odd:bg-card even:bg-muted/10"
                >
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className="p-3 text-slate-700 dark:text-slate-300"
                    >
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'image':
      return (
        <figure className="my-6">
          <img
            src={block.src}
            alt={block.alt || 'تصویر محتوا'}
            loading="lazy"
            className="w-full max-h-[500px] object-cover rounded-xl border border-border shadow-sm mx-auto"
          />
          {block.alt && (
            <figcaption className="text-center text-xs text-muted-foreground mt-2">
              {block.alt}
            </figcaption>
          )}
        </figure>
      )
    case 'hr':
      return <hr className="my-8 border-border" />
    default:
      return null
  }
}

// Inline Markdown Parser: bold, italic, inline code, links
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null

  // Fast path if plain text
  if (
    !text.includes('*') &&
    !text.includes('`') &&
    !text.includes('[') &&
    !text.includes('~')
  ) {
    return text
  }

  // Tokenize by inline markers
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // 1. Link [text](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/)
    if (linkMatch) {
      const linkText = linkMatch[1]
      const linkUrl = linkMatch[2]
      parts.push(
        <a
          key={`inline-${keyIdx++}`}
          href={linkUrl}
          target={linkUrl.startsWith('http') ? '_blank' : undefined}
          rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
        >
          <span>{linkText}</span>
          {linkUrl.startsWith('http') && (
            <ExternalLink className="h-3 w-3 inline-block shrink-0 opacity-70" />
          )}
        </a>,
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // 2. Bold **text**
    const boldMatch = remaining.match(/^\*\*(.*?)\*\*/)
    if (boldMatch) {
      parts.push(
        <strong
          key={`inline-${keyIdx++}`}
          className="font-bold text-foreground"
        >
          {boldMatch[1]}
        </strong>,
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // 3. Italic *text*
    const italicMatch = remaining.match(/^\*(.*?)\*/)
    if (italicMatch) {
      parts.push(
        <em key={`inline-${keyIdx++}`} className="italic">
          {italicMatch[1]}
        </em>,
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // 4. Inline code `text`
    const codeMatch = remaining.match(/^`(.*?)`/)
    if (codeMatch) {
      parts.push(
        <code
          key={`inline-${keyIdx++}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-muted text-blue-600 dark:text-blue-400 font-mono text-[13px] border border-border/60 dir-ltr inline-block"
        >
          {codeMatch[1]}
        </code>,
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // 5. Normal character accumulation until next token
    const nextSpecial = remaining.search(/(\*\*|\*|`|\[)/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return <>{parts}</>
}
