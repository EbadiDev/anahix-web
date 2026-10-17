import type React from 'react'
import { useState } from 'react'

// Numberland CDN icon repository mapping
const NUMBERLAND_ICONS: Record<string, string> = {
  telegram: 'https://numberland.ir/images/sv/telegram.svg',
  whatsapp: 'https://numberland.ir/images/sv/whatsapp.svg',
  openai: 'https://numberland.ir/images/sv/openai.svg',
  chatgpt: 'https://numberland.ir/images/sv/openai.svg',
  google: 'https://numberland.ir/images/sv/google.svg',
  gmail: 'https://numberland.ir/images/sv/google.svg',
  youtube: 'https://numberland.ir/images/sv/google.svg',
  instagram: 'https://numberland.ir/images/sv/instagram.svg',
  facebook: 'https://numberland.ir/images/sv/facebook.svg',
  twitter: 'https://numberland.ir/images/sv/twitter.svg',
  x: 'https://numberland.ir/images/sv/twitter.svg',
  paypal: 'https://numberland.ir/images/sv/paypal.svg',
  webmoney: 'https://numberland.ir/images/sv/webmoney.svg',
  amazon: 'https://numberland.ir/images/sv/amazon.svg',
  microsoft: 'https://numberland.ir/images/sv/microsoft.svg',
  tinder: 'https://numberland.ir/images/sv/tinder.svg',
  fiverr: 'https://numberland.ir/images/sv/fiverr.svg',
  yahoo: 'https://numberland.ir/images/sv/yahoo.svg',
  viber: 'https://numberland.ir/images/sv/viber.svg',
  binance: 'https://numberland.ir/images/sv/binance.svg',
  coinbase: 'https://numberland.ir/images/sv/coinbase.svg',
  aol: 'https://numberland.ir/images/sv/aol.svg',
  airbnb: 'https://numberland.ir/images/sv/airbnb.svg',
  bluevine: 'https://numberland.ir/images/sv/bluevine.svg',
  linkedin: 'https://numberland.ir/images/sv/linkedin.svg',
  gameflip: 'https://numberland.ir/images/sv/gameflip.svg',
  kakaotalk: 'https://numberland.ir/images/sv/kakaotalk.svg',
  localbitcoins: 'https://numberland.ir/images/sv/localbitcoins.svg',
  payoneer: 'https://numberland.ir/images/sv/payoneer.svg',
  qiwi: 'https://numberland.ir/images/sv/qiwi.svg',
  skrill: 'https://numberland.ir/images/sv/skrill.svg',
  steam: 'https://numberland.ir/images/sv/steam.svg',
  taobao: 'https://numberland.ir/images/sv/taobao.svg',
  wechat: 'https://numberland.ir/images/sv/wechat.svg',
  apple: 'https://numberland.ir/images/sv/apple.svg',
  claude: 'https://numberland.ir/images/sv/claude-ai.svg',
  anthropic: 'https://numberland.ir/images/sv/claude-ai.svg',
  cursor: 'https://numberland.ir/images/sv/Cursor.png',
  badoo: 'https://numberland.ir/images/sv/BADOO.png',
  vk: 'https://numberland.ir/images/sv/vk.svg',
  kimi: 'https://numberland.ir/images/sv/KIMI.png',
  warpcast: 'https://numberland.ir/images/sv/warpcast.png',
  discord: 'https://numberland.ir/images/sv/discord.svg',
  blizzard: 'https://numberland.ir/images/sv/blizzard.svg',
  huawei: 'https://numberland.ir/images/sv/huawei.svg',
  clubhouse: 'https://numberland.ir/images/sv/clubhouse.svg',
  tiktok: 'https://numberland.ir/images/sv/tiktok.svg',
  imo: 'https://numberland.ir/images/sv/imo.svg',
  line: 'https://numberland.ir/images/sv/line.svg',
  kaggle: 'https://numberland.ir/images/sv/kaggle.svg',
  signal: 'https://numberland.ir/images/sv/signal.svg',
  likee: 'https://numberland.ir/images/sv/likee.svg',
  netflix: 'https://numberland.ir/images/sv/netflix.svg',
  suno: 'https://numberland.ir/images/sv/Suno.png',
  freelancer: 'https://numberland.ir/images/sv/Freelancer.png',
  roblox: 'https://numberland.ir/images/sv/Roblox.png',
  twitch: 'https://numberland.ir/images/sv/Twitch.png',
  xbox: 'https://numberland.ir/images/sv/Xbox.png',
  okcupid: 'https://numberland.ir/images/sv/Okcupid.png',
  abbott: 'https://numberland.ir/images/sv/Abbott.png',
  reddit: 'https://numberland.ir/images/sv/REDDIT.png',
  xiaomi: 'https://numberland.ir/images/sv/XIAMI.png',
  pubg: 'https://numberland.ir/images/sv/PUBG.png',
  tantan: 'https://numberland.ir/images/sv/TANTAN.png',
  craigslist: 'https://numberland.ir/images/sv/craigslist.png',
  doordash: 'https://numberland.ir/images/sv/DoorDash.png',
  avito: 'https://numberland.ir/images/sv/Avito.png',
  tosla: 'https://numberland.ir/images/sv/Tosla.png',
  yandex: 'https://numberland.ir/images/sv/YANDEX.png',
  samsung: 'https://numberland.ir/images/sv/SAMSUNG.png',
  okx: 'https://numberland.ir/images/sv/OKX.png',
  ticketmaster: 'https://numberland.ir/images/sv/ticketmaster.png',
  weibo: 'https://numberland.ir/images/sv/Weibo.png',
  wish: 'https://numberland.ir/images/sv/wish.png',
  wallethub: 'https://numberland.ir/images/sv/Wallethub.png',
  sugarwallet: 'https://numberland.ir/images/sv/sugrwallet3.png',
  xworldwallet: 'https://numberland.ir/images/sv/Xworldwallet.png',
  match: 'https://numberland.ir/images/sv/Match.png',
  jaco: 'https://numberland.ir/images/sv/Jaco.png',
  temu: 'https://numberland.ir/images/sv/temu.png',
  uber: 'https://numberland.ir/images/sv/uber.png',
  fivesurveys: 'https://numberland.ir/images/sv/fivesurveys.png',
  freeup: 'https://numberland.ir/images/sv/freeup.png',
  happn: 'https://numberland.ir/images/sv/Happn.png',
  hellotalk: 'https://numberland.ir/images/sv/hellotalk.png',
  hezzl: 'https://numberland.ir/images/sv/Hezzl.png',
  hily: 'https://numberland.ir/images/sv/hily.png',
  wise: 'https://numberland.ir/images/sv/WISE.png',
  mailru: 'https://numberland.ir/images/sv/mailru.svg',
  garena: 'https://numberland.ir/images/sv/Garena.png',
  dubizzle: 'https://numberland.ir/images/sv/Dubizzle.png',
  lovoo: 'https://numberland.ir/images/sv/lovoo.png',
  '1688': 'https://numberland.ir/images/sv/1688.svg',
  deepseek: 'https://numberland.ir/images/sv/DeepSeek.png',
  noon: 'https://numberland.ir/images/sv/Noon.png',
  shopee: 'https://numberland.ir/images/sv/Shopee.png',
  qq: 'https://numberland.ir/images/sv/qq.svg',
  snapchat: 'https://numberland.ir/images/sv/snapchat.svg',
  trendyol: 'https://numberland.ir/images/sv/Trendyol.png',
  skout: 'https://numberland.ir/images/sv/SkoutInc.png',
  bigolive: 'https://numberland.ir/images/sv/Bigo-Live.svg',
  cryptocom: 'https://numberland.ir/images/sv/cryptocom.svg',
  blockchain: 'https://numberland.ir/images/sv/blockchain.svg',
  tradingview: 'https://numberland.ir/images/sv/tradingview.svg',
  protonmail: 'https://numberland.ir/images/sv/protonmail.svg',
  g2a: 'https://numberland.ir/images/sv/g2a.svg',
  beetalk: 'https://numberland.ir/images/sv/beetalk.svg',
  ebay: 'https://numberland.ir/images/sv/ebay.svg',
  alipay: 'https://numberland.ir/images/sv/alipay.svg',
  aliexpress: 'https://numberland.ir/images/sv/aliexpress.svg',
  alibaba: 'https://numberland.ir/images/sv/alibaba.svg',
  upwork: 'https://numberland.ir/images/sv/upwork.svg',
  tango: 'https://numberland.ir/images/sv/tango.svg',
  zoho: 'https://numberland.ir/images/sv/zoho.svg',
  fastmail: 'https://numberland.ir/images/sv/fastmail.svg',
  odnoklassniki: 'https://numberland.ir/images/sv/odnoklassniki.svg',
  mamba: 'https://numberland.ir/images/sv/mamba.svg',
  adidas: 'https://numberland.ir/images/sv/adidas.svg',
  nike: 'https://numberland.ir/images/sv/nike.svg',
  mega: 'https://numberland.ir/images/sv/mega.svg',
  vercel: 'https://numberland.ir/images/sv/vercel.png',
  hinge: 'https://numberland.ir/images/sv/hinge.png',
  opensooq: 'https://numberland.ir/images/sv/opensooq.png',
}

interface ServiceBrandIconProps {
  slug: string
  iconUrl?: string
  className?: string
  size?: number
}

export const ServiceBrandIcon: React.FC<ServiceBrandIconProps> = ({
  slug,
  iconUrl,
  className = 'w-6 h-6',
  size = 24,
}) => {
  const [imgFailed, setImgFailed] = useState(false)
  const s = slug.toLowerCase()

  // Priority 1: API-provided icon URL (if exists)
  // Priority 2: Numberland icon CDN URL
  const resolvedUrl = !imgFailed ? iconUrl || NUMBERLAND_ICONS[s] : null

  if (resolvedUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-control bg-card/60 border border-border/40 p-1 shrink-0 overflow-hidden shadow-xs ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={slug}
          width={size}
          height={size}
          loading="lazy"
          className="w-full h-full object-contain filter drop-shadow-xs"
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  // Priority 3: Built-in crisp vector SVGs
  switch (s) {
    case 'telegram':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#229ED9]/15 text-[#229ED9] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Telegram"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .26z" />
          </svg>
        </div>
      )

    case 'openai':
    case 'chatgpt':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#10A37F]/15 text-[#10A37F] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="OpenAI"
          >
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.784a4.472 4.472 0 0 1 2.36-1.996V12.4a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.784zm16.597 3.855l-5.833-3.387L15.119 8.1a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 10.12V7.785a.075.075 0 0 1 .032-.061l4.855-2.812a4.5 4.5 0 0 1 6.654 4.965zM8.306 13.44l2.583-1.49 2.58 1.49v2.982l-2.58 1.49-2.583-1.49z" />
          </svg>
        </div>
      )

    case 'whatsapp':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#25D366]/15 text-[#25D366] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="WhatsApp"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.22-.19-.47-.32z" />
          </svg>
        </div>
      )

    case 'google':
    case 'gmail':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#4285F4]/15 text-[#4285F4] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Google"
          >
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        </div>
      )

    case 'instagram':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#E1306C]/15 text-[#E1306C] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Instagram"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      )

    case 'twitter':
    case 'x':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-zinc-800 text-zinc-100 shrink-0 ${className}`}
        >
          <svg
            width={size - 2}
            height={size - 2}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="X"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      )

    case 'discord':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#5865F2]/15 text-[#5865F2] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Discord"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </div>
      )

    case 'apple':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-zinc-800 text-zinc-100 shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Apple"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.61 1.33-.55.63-1.03 1.68-.9 2.71 1 .08 2.02-.48 2.59-1.19z" />
          </svg>
        </div>
      )

    case 'tiktok':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-zinc-900 text-cyan-400 shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="TikTok"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
          </svg>
        </div>
      )

    case 'steam':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#171A21]/40 text-[#66C0F4] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Steam"
          >
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.704L.45 15.042C1.724 20.254 6.406 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
          </svg>
        </div>
      )

    case 'binance':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#F0B90B]/15 text-[#F0B90B] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Binance"
          >
            <path d="M16.624 13.92L12 18.543l-4.624-4.623 2.01-2.01 2.614 2.614 2.614-2.614 2.01 2.01zm-4.624-8.086l4.624 4.624-2.01 2.01-2.614-2.614-2.614 2.614-2.01-2.01 4.624-4.624zm8.625 4.076l2.01 2.01-2.01 2.01-2.01-2.01 2.01-2.01zM3.375 9.91l2.01 2.01-2.01 2.01-2.01-2.01 2.01-2.01zm8.625.599l1.411 1.411-1.411 1.411-1.411-1.411 1.411-1.411z" />
          </svg>
        </div>
      )

    case 'paypal':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-[#003087]/20 text-[#0079C1] shrink-0 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="PayPal"
          >
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.292-.596 3.826-3.144 5.976-6.907 5.976h-2.3l-1.378 8.78c-.066.422-.43.738-.857.738l-1.642-.26z" />
          </svg>
        </div>
      )

    default:
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-brand/15 text-brand shrink-0 font-bold font-latin text-xs ${className}`}
        >
          {s.slice(0, 2).toUpperCase()}
        </div>
      )
  }
}
