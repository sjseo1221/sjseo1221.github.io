// 하이라이트 `==강조==` → `<mark>` (속성 없음). 관리 웹앱 미리보기의 remark 플러그인(study-log-admin/src/lib/markdown/mark.ts)과 같은 규칙·같은 출력.
// 문법: 같은 줄 안, 내용은 비어 있지 않고 `=` 를 포함하지 않으며 양끝이 공백이 아니다. `===` 이상은 구분자 아님.
// 코드 스팬 · 코드 블록 · 링크 주소는 텍스트 노드가 아니라서 변환되지 않는다. raw HTML 은 만들지 않는다(safe-markdown 이 계속 제거).
// Sätteri mdast 플러그인 — 부모 노드의 children 을 한 번에 다시 쓴다.

const isSpace = (ch) => /\s/.test(ch);

function collect(children) {
  const out = [];
  children.forEach((n, i) => {
    if (n.type !== 'text' || typeof n.value !== 'string') return;
    const v = n.value;
    for (let o = 0; o < v.length; ) {
      if (v[o] !== '=') {
        o++;
        continue;
      }
      let end = o;
      while (end < v.length && v[end] === '=') end++;
      if (end - o === 2) {
        const prevOk = o > 0 ? !isSpace(v[o - 1]) : i > 0 && children[i - 1].type !== 'break';
        const nextOk = end < v.length ? !isSpace(v[end]) : i < children.length - 1 && children[i + 1].type !== 'break';
        out.push({ i, o, canOpen: nextOk, canClose: prevOk });
      }
      o = end;
    }
  });
  return out;
}

function spanValid(children, a, b) {
  for (let k = a.i; k <= b.i; k++) {
    const n = children[k];
    if (n.type === 'break') return false;
    if (n.type !== 'text') continue;
    const v = n.value ?? '';
    const piece = v.slice(k === a.i ? a.o + 2 : 0, k === b.i ? b.o : v.length);
    if (/[\n\r=]/.test(piece)) return false;
  }
  return true;
}

function pairUp(children, cands) {
  const pairs = [];
  let open = null;
  for (const c of cands) {
    if (!open) {
      if (c.canOpen) open = c;
      continue;
    }
    if (!spanValid(children, open, c)) {
      open = c.canOpen ? c : null;
      continue;
    }
    if (c.canClose) {
      pairs.push([open, c]);
      open = null;
    } else {
      open = c.canOpen ? c : null;
    }
  }
  return pairs;
}

const text = (value) => ({ type: 'text', value });

/** 형제 목록에서 `==…==` 를 mark 노드로 묶은 새 목록. 바뀐 게 없으면 null */
export function markChildren(children) {
  const pairs = pairUp(children, collect(children));
  if (pairs.length === 0) return null;

  const emit = (into, i0, off0, i1, off1) => {
    for (let k = i0; k <= i1 && k < children.length; k++) {
      const n = children[k];
      if (n.type !== 'text') {
        into.push(n);
        continue;
      }
      const v = n.value ?? '';
      const piece = v.slice(k === i0 ? off0 : 0, k === i1 ? off1 : v.length);
      if (piece) into.push(text(piece));
    }
  };

  const out = [];
  let ci = 0;
  let co = 0;
  for (const [a, b] of pairs) {
    emit(out, ci, co, a.i, a.o);
    const inner = [];
    emit(inner, a.i, a.o + 2, b.i, b.o);
    out.push({ type: 'mark', data: { hName: 'mark' }, children: inner });
    ci = b.i;
    co = b.o + 2;
  }
  emit(out, ci, co, children.length, 0);
  return out;
}

// 텍스트를 직접 자식으로 가질 수 있는 노드(코드 · html · 링크 주소 등은 제외)
const PARENTS = ['paragraph', 'heading', 'tableCell', 'emphasis', 'strong', 'delete', 'link'];

/** Sätteri mdast 플러그인 */
export function highlightMarkPlugin() {
  const visit = (node, ctx) => {
    const next = markChildren(node.children ?? []);
    if (next) ctx.setProperty(node, 'children', next);
  };
  const plugin = { name: 'highlight-mark' };
  for (const t of PARENTS) plugin[t] = visit;
  return plugin;
}

/** Astro 통합 — 기본 Markdown 처리기(Sätteri)의 mdastPlugins 에 등록한다. Sätteri 가 아니면 빌드를 멈춘다(미리보기와 출력이 달라지지 않게). */
export default function highlightMark() {
  return {
    name: 'highlight-mark',
    hooks: {
      'astro:config:setup'({ config }) {
        const processor = config.markdown?.processor;
        if (processor?.name !== 'satteri' || !Array.isArray(processor.options?.mdastPlugins)) {
          throw new Error('[highlight-mark] markdown.processor 가 satteri 가 아니어서 ==강조== 플러그인을 등록할 수 없습니다.');
        }
        processor.options.mdastPlugins.push(highlightMarkPlugin());
      },
    },
  };
}
