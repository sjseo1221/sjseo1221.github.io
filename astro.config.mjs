// @ts-check
import { defineConfig } from 'astro/config';
import { SITE_URL } from './site.config.mjs';
import safeMarkdown from './plugins/safe-markdown.mjs';
import highlightMark from './plugins/highlight-mark.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // 본문 raw HTML·위험 URL 제거 (관리 웹앱 미리보기와 같은 출력)
  integrations: [safeMarkdown(), highlightMark()],
  markdown: {
    // mermaid 블록은 하이라이트하지 않고 날것으로 남긴다 → 글 페이지에서 클라이언트 렌더
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
