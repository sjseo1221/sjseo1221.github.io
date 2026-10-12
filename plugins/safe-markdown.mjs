// 본문 안전화 — 관리 웹앱 미리보기(react-markdown, raw HTML 미렌더)와 같은 출력을 공개 블로그에 낸다.
// - raw HTML 노드(블록·인라인) 제거
// - a[href]: http(s) · mailto · 상대경로 · # 만 허용, 그 외(javascript:, data: 등)는 href 제거
// - img: 상대경로 src 만 허용, 외부·data: 등은 이미지 노드 제거
// 제거가 일어나면 빌드 로그에 경고(글 id · 종류)를 남긴다.
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const SAFE_LINK_SCHEMES = new Set(['http', 'https', 'mailto']);

/** 브라우저처럼 제어문자·공백을 걷어낸 뒤 scheme 을 본다 (`java\tscript:` 우회 방지) */
function normalize(url) {
  return String(url).replace(/[\u0000-\u0020\u007f]/g, '');
}

export function isSafeHref(url) {
  const u = normalize(url);
  const m = u.match(SCHEME);
  return m ? SAFE_LINK_SCHEMES.has(m[1].toLowerCase()) : true;
}

export function isRelativeSrc(url) {
  const u = normalize(url);
  return u !== '' && !SCHEME.test(u) && !u.startsWith('//') && !u.startsWith('\\');
}

function postId(ctx) {
  try {
    return ctx.fileURL ? basename(fileURLToPath(ctx.fileURL)).replace(/\.mdx?$/, '') : '(unknown)';
  } catch {
    return '(unknown)';
  }
}

function warn(ctx, kind, detail) {
  const snippet = String(detail ?? '').replace(/\s+/g, ' ').slice(0, 80);
  console.warn(`[safe-markdown] ${postId(ctx)}: ${kind} 제거 — ${snippet}`);
}

/** Sätteri HAST 플러그인 */
export function safeMarkdownPlugin() {
  return {
    name: 'safe-markdown',
    raw(node, ctx) {
      warn(ctx, 'raw HTML', node.value);
      ctx.removeNode(node);
    },
    element: {
      filter: ['a', 'img'],
      visit(node, ctx) {
        const props = node.properties ?? {};
        if (node.tagName === 'a') {
          if (props.href != null && !isSafeHref(props.href)) {
            warn(ctx, '링크 href', props.href);
            ctx.setProperty(node, 'href', null);
          }
          return;
        }
        if (typeof props.src !== 'string' || !isRelativeSrc(props.src)) {
          warn(ctx, '이미지(상대경로 아님)', props.src);
          ctx.removeNode(node);
        }
      },
    },
  };
}

/**
 * Astro 통합 — 기본 Markdown 처리기(Sätteri)에 플러그인을 등록한다.
 * Sätteri 가 아니면 안전화가 빠진 채 발행되지 않도록 빌드를 멈춘다(fail-closed).
 */
export default function safeMarkdown() {
  return {
    name: 'safe-markdown',
    hooks: {
      'astro:config:setup'({ config }) {
        const processor = config.markdown?.processor;
        if (processor?.name !== 'satteri' || !Array.isArray(processor.options?.hastPlugins)) {
          throw new Error('[safe-markdown] markdown.processor 가 satteri 가 아니어서 본문 안전화 플러그인을 등록할 수 없습니다.');
        }
        processor.options.hastPlugins.push(safeMarkdownPlugin());
      },
    },
  };
}
