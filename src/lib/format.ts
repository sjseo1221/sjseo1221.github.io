const TZ = 'Asia/Seoul';

/** "2026년 11월 3일 (화)" */
export function formatDate(date: Date): string {
  // ICU 버전마다 요일 괄호 유무가 달라 parts 로 직접 조립한다
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}년 ${get('month')}월 ${get('day')}일 (${get('weekday')})`;
}

/** `<time datetime>` 용 "2026-11-03" */
export function isoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

/** <pre>·<code> 블록 | 태그 | 태그 밖 텍스트 */
const TOKEN = /<(pre|code)(?=[\s>])[\s\S]*?<\/\1>|<[^>]*>|[^<]+/g;
const UNCERTAIN = '<mark class="uncertain" title="필기 인식이 불확실한 부분">[?]</mark>';
const SUPPLEMENT = /<blockquote>(\s*<p>💡\s*보충\s*[:：])/g;

/**
 * 빌드 시점 본문 꾸미기. <pre>·<code> 블록과 태그(속성)는 건드리지 않는다.
 * - 태그 밖 텍스트의 [?] → 불확실 표시
 * - > 💡 보충: 인용 → .supplement
 */
export function decorateBody(html: string): string {
  return html
    .replace(TOKEN, (token, codeTag?: string) =>
      codeTag || token.startsWith('<') ? token : token.replaceAll('[?]', UNCERTAIN),
    )
    .replace(SUPPLEMENT, '<blockquote class="supplement">$1');
}
