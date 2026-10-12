# study-log-blog

교육과정 학습기록 공개 블로그 (Astro). 글은 관리 웹앱(study-log-admin)의 [발행]이 `src/content/posts/day-NNN.md` 로 커밋한다.

## 빌드

```sh
npm ci
npm run build   # astro build → scripts/check-dist.mjs
npm run dev     # 로컬 미리보기
```

`scripts/check-dist.mjs` 는 빌드 산출물에 `source_ref`·`private/YYYY-MM-DD` 흔적, 글 본문의 위험 HTML(script·on*·javascript:·외부 src), favicon 외 이미지·PDF 가 있거나 글 페이지가 0개면 빌드를 실패시킨다.

## 설정

GitHub 사용자명·사이트 제목은 `site.config.mjs` 한 곳에서만 고친다.

## 배포

`.github/workflows/deploy.yml` — main push 시 빌드 후 GitHub Pages 배포, PR 은 빌드만. 이 폴더가 `<username>.github.io` 저장소 루트로 분리된 뒤에 동작한다. 저장소 Settings → Pages → Source 를 GitHub Actions 로 둔다.

## 규칙

- 원본 자료(메모·필기·강의안)와 `source_ref` 는 이 저장소에 넣지 않는다. frontmatter 에 `source_ref` 가 있으면 스키마가 빌드를 거부한다.
- 강의안·필기 이미지는 게시하지 않는다.
- 본문의 raw HTML 은 제거되고, 링크는 http(s)·mailto·상대경로·# 만, 이미지는 상대경로만 남는다(관리 웹앱 미리보기와 같은 출력).
- 글은 관리 웹앱의 [발행] 이 `src/content/posts/day-NNN.md` 로 커밋한다. 샘플 글은 첫 배포 전에 지웠다(원본은 관리 웹앱 mock `drafts/day-012`).
