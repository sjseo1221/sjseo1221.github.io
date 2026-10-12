// 빌드 산출물 검사 (npm run build 마지막 단계). 하나라도 걸리면 exit 1.
// 1) 비공개 흔적: source_ref, private/YYYY-MM-DD
// 2) 글 본문(<article> 안, <pre>·<code> 밖) 태그의 위험 패턴: <script>·<iframe>·<object>·<embed>, on*= 핸들러, javascript: URL, 외부 src
// 3) 이미지·PDF 파일: 루트 favicon.* 외 금지 (강의안·필기 이미지 게시 금지)
// 4) 글 원본(src/content/posts/*.md) 수와 글 페이지(dist/posts/*/index.html) 수가 다르면 실패
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const distPath = fileURLToPath(new URL('../dist/', import.meta.url));
const TEXT_EXTS = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.map', '.svg', '.webmanifest', '.md']);
const MEDIA_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.tif', '.tiff', '.heic', '.heif', '.ico', '.svg', '.pdf']);
const ALLOWED_MEDIA = new Set(['favicon.ico', 'favicon.svg']);
const FORBIDDEN_TEXT = [/source_ref/, /private\/\d{4}-\d{2}-\d{2}/];
const DANGEROUS_TAG = [
  { re: /^<\s*(script|iframe|object|embed)\b/i, kind: '금지 태그' },
  { re: /\son[a-z]+\s*=/i, kind: 'on* 이벤트 속성' },
  { re: /=\s*["']?\s*javascript:/i, kind: 'javascript: URL' },
  { re: /\ssrc\s*=\s*["']?\s*(https?:)?\/\//i, kind: '외부 src' },
];

const problems = [];

if (!existsSync(distPath)) {
  console.error('[check-dist] dist 가 없습니다');
  process.exit(1);
}

const files = readdirSync(distPath, { recursive: true })
  .map(String)
  .filter((rel) => statSync(join(distPath, rel)).isFile());

for (const rel of files) {
  const ext = extname(rel).toLowerCase();
  const posix = rel.split(sep).join('/');

  if (MEDIA_EXTS.has(ext) && !ALLOWED_MEDIA.has(posix)) problems.push(`${posix}: 이미지·PDF 파일 게시 금지`);
  if (!TEXT_EXTS.has(ext)) continue;

  const text = readFileSync(join(distPath, rel), 'utf8');
  for (const re of FORBIDDEN_TEXT) if (re.test(text)) problems.push(`${posix}: ${re}`);

  if (ext !== '.html') continue;
  for (const [, article] of text.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)) {
    const outsideCode = article.replace(/<(pre|code)(?=[\s>])[\s\S]*?<\/\1>/gi, '');
    for (const [tag] of outsideCode.matchAll(/<[^>]+>/g)) {
      for (const { re, kind } of DANGEROUS_TAG) {
        if (re.test(tag)) problems.push(`${posix}: ${kind} — ${tag.slice(0, 80)}`);
      }
    }
  }
}

// 글 원본 수와 생성된 글 페이지 수가 같아야 한다 — 렌더 실패로 조용히 빠진 글을 잡고, 글이 0편인 첫 배포는 허용
const postsSrc = fileURLToPath(new URL('../src/content/posts/', import.meta.url));
const sourceCount = existsSync(postsSrc) ? readdirSync(postsSrc).filter((f) => f.endsWith('.md')).length : 0;
const postPages = files.filter((rel) => /^posts\/[^/]+\/index\.html$/.test(rel.split(sep).join('/')));
if (!files.includes('index.html')) problems.push('dist/index.html 이 없습니다');
if (postPages.length !== sourceCount) {
  problems.push(`글 원본 ${sourceCount}편인데 글 페이지는 ${postPages.length}개입니다`);
}

if (problems.length) {
  console.error('[check-dist] 실패:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`[check-dist] OK — 글 ${postPages.length}편, 비공개 흔적·위험 패턴·이미지 없음`);
