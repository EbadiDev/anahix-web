import type React from 'react'
import { useState } from 'react'

// Comprehensive dictionary mapping country identifiers to ISO 3166-1 alpha-2 codes
const ISO_COUNTRY_CODES: Record<string, string> = {
  // Common 5SIM identifiers
  england: 'gb',
  greatbritain: 'gb',
  uk: 'gb',
  usa: 'us',
  unitedstates: 'us',
  germany: 'de',
  netherlands: 'nl',
  france: 'fr',
  sweden: 'se',
  canada: 'ca',
  spain: 'es',
  indonesia: 'id',
  malaysia: 'my',
  thailand: 'th',
  brazil: 'br',
  india: 'in',
  turkey: 'tr',
  uae: 'ae',
  unitedarabemirates: 'ae',
  poland: 'pl',
  georgia: 'ge',
  romania: 'ro',
  russia: 'ru',
  ukraine: 'ua',
  philippines: 'ph',
  vietnam: 'vn',
  singapore: 'sg',
  australia: 'au',
  argentina: 'ar',
  colombia: 'co',
  southafrica: 'za',
  egypt: 'eg',
  pakistan: 'pk',
  bangladesh: 'bd',
  mexico: 'mx',
  italy: 'it',
  portugal: 'pt',
  czech: 'cz',
  czechrepublic: 'cz',
  austria: 'at',
  belgium: 'be',
  denmark: 'dk',
  finland: 'fi',
  norway: 'no',
  greece: 'gr',
  switzerland: 'ch',
  ireland: 'ie',
  newzealand: 'nz',
  japan: 'jp',
  korea: 'kr',
  southkorea: 'kr',
  china: 'cn',
  hongkong: 'hk',
  taiwan: 'tw',
  israel: 'il',
  saudiarabia: 'sa',
  qatar: 'qa',
  kuwait: 'kw',
  oman: 'om',
  morocco: 'ma',
  algeria: 'dz',
  tunisia: 'tn',
  nigeria: 'ng',
  kenya: 'ke',
  ghana: 'gh',
  kazakhstan: 'kz',
  uzbekistan: 'uz',
  kyrgyzstan: 'kg',
  tajikistan: 'tj',
  armenia: 'am',
  azerbaijan: 'az',
  moldova: 'md',
  lithuania: 'lt',
  latvia: 'lv',
  estonia: 'ee',
  hungary: 'hu',
  slovakia: 'sk',
  slovenia: 'si',
  croatia: 'hr',
  serbia: 'rs',
  bulgaria: 'bg',
  cyprus: 'cy',
  chile: 'cl',
  peru: 'pe',
  ecuador: 'ec',
  venezuela: 've',
  cambodia: 'kh',
  myanmar: 'mm',
  laos: 'la',
  nepal: 'np',
  srilanka: 'lk',
  ivorycoast: 'ci',
  senegal: 'sn',
  cameroon: 'cm',
  bolivia: 'bo',
  uruguay: 'uy',
  paraguay: 'py',
  panama: 'pa',
  costarica: 'cr',
  guatemala: 'gt',
  honduras: 'hn',
  nicaragua: 'ni',
  elsalvador: 'sv',
  dominican: 'do',
  jamaica: 'jm',
  trinidad: 'tt',
  bahamas: 'bs',
  luxembourg: 'lu',
  iceland: 'is',
  malta: 'mt',
  albania: 'al',
  bosnia: 'ba',
  macedonia: 'mk',
  montenegro: 'me',
  kosovo: 'xk',
  belarus: 'by',
  jordan: 'jo',
  lebanon: 'lb',
  iraq: 'iq',
  yemen: 'ye',
  bahrain: 'bh',
  palestine: 'ps',
  afghanistan: 'af',
  mongolia: 'mn',
  fiji: 'fj',
  papuanewguinea: 'pg',
  ethiopia: 'et',
  tanzania: 'tz',
  uganda: 'ug',
  zambia: 'zm',
  zimbabwe: 'zw',
}

interface CountryFlagProps {
  country: string
  countryCode?: string
  flagUrl?: string
  countryFlag?: string
  className?: string
  width?: number
  height?: number
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  countryCode,
  flagUrl,
  countryFlag = '🌐',
  className = 'w-7 h-5 object-cover rounded-xs border border-border/50 shrink-0 shadow-xs',
  width = 28,
  height = 20,
}) => {
  const [loadFailed, setLoadFailed] = useState(false)

  // Resolve ISO code
  const rawKey = country.toLowerCase().replace(/[\s\-_]/g, '')
  const resolvedCode = (
    countryCode ||
    ISO_COUNTRY_CODES[rawKey] ||
    rawKey.slice(0, 2)
  ).toLowerCase()

  // Primary URL -> Fallback flagcdn.com URL -> SVG emoji
  const primaryUrl = flagUrl && !loadFailed ? flagUrl : null
  const cdnUrl =
    !primaryUrl && !loadFailed && resolvedCode && resolvedCode.length === 2
      ? `https://flagcdn.com/w40/${resolvedCode}.png`
      : null

  const activeSrc = primaryUrl || cdnUrl

  if (activeSrc) {
    return (
      <img
        src={activeSrc}
        alt={country}
        width={width}
        height={height}
        loading="lazy"
        className={className}
        onError={() => setLoadFailed(true)}
      />
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center text-lg shrink-0 leading-none"
      role="img"
      aria-label={country}
    >
      {countryFlag || '🌐'}
    </span>
  )
}
