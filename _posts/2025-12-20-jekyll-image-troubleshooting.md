---
title: Jekyll 블로그 레이아웃 깨짐 및 이미지 미표시 트러블 슈팅
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-20 07:55:00 +0900
categories: [CS]
tags: [jekyll, troubleshooting, optimization]
---

## 문제 상황

- 블로그 글 확인 중 두 가지 문제 발견함
  - **레이아웃 깨짐**
    - 이미지가 포함된 포스트에서 사이드바가 밀리고 본문 폭이 좁아지는 등 HTML 구조가 깨짐
  - **이미지 미표시**
    - 이미지가 존재함에도 화면에 출력되지 않음
    - 개발자 도구 확인 결과 `src` 대신 `data-src` 속성만 존재함

<br/><br/>

## 원인 분석

- `git reset`과 로그 분석을 통해 원인을 파악함

### Lazy Loading의 잔해 (이미지 미표시)

- 과거 성능 최적화를 위해 도입 시도했던 **Lazy Loading(지연 로딩)** 기능이 원인임
- Lazy Loading 동작 방식
  - 초기 로딩 시 `data-src`에 경로를 저장
  - 스크립트가 화면 호출 시 `src`로 변환
- **문제점**
  - 스크립트 파일(`safe-lazy-loading.html`)은 제거되었으나, HTML 생성 시 `src`를 `data-src`로 변환하는 로직만 남아있었음
- 결과적으로 스크립트 부재로 인해 `data-src`가 `src`로 변환되지 못함

### HTML 태그 불균형 (레이아웃 깨짐)

- Jekyll의 Markdown 변환기(Kramdown)와 커스텀 파일(`refactor-content.html`) 간 충돌 발생
- Kramdown이 코드 블록을 감싸기 위해 `<div>` 생성
- 커스텀 로직 수행 중 **여는 태그(`<div>`)는 유지하고 닫는 태그(`</div>`)를 누락**시킴
- 닫히지 않은 `<div>`로 인해 전체 페이지 HTML 구조가 무너짐

<br/><br/>

## 해결 과정

- 복잡한 서버 사이드 템플릿 수정 대신 단순하고 확실한 방법을 선택함

### JavaScript로 데이터 복구

- 서버 빌드 단계 수정 대신 클라이언트 측 JavaScript로 해결
- `_javascript/utils/img-extra.js` 파일에 복구 로직 추가함

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // data-src를 가진 모든 이미지를 탐색
  document.querySelectorAll('img[data-src]').forEach(img => {
    // data-src 값을 src로 이동
    img.src = img.dataset.src;
    // data-src 속성 제거
    img.removeAttribute('data-src');
  });
});
```

- 해당 스크립트 적용으로 모든 이미지 정상 출력됨

### 코드 정리

- 문제 해결 후 재발 방지를 위한 리팩토링 진행
- **불필요한 파일 삭제**
  - `safe-lazy-loading.html`, `performance-optimization.html` 등 미사용 파일 제거
  - **도입 배경**
    - 초기 로딩 속도 개선 및 LCP(Largest Contentful Paint) 최적화
    - 다수의 이미지가 포함된 포스팅 렌더링 성능 향상 기대
  - **삭제 이유**
    - 스크립트 유실 시 이미지 미표시라는 오류 발생 확인
    - 복잡한 최적화 기능보다 시스템의 단순함과 **안정성**을 우선시
- **!important 제거**
  - 유지보수를 저해하는 160여 개의 `!important` 속성 제거 (Glassmorphism 디자인 유지 범위 내)
  - **도입 배경**
    - Glassmorphism 디자인의 핵심인 투명도 및 블러 효과 강제 적용
    - 기존 테마 스타일을 빠르게 덮어쓰기 위한 임시방편
  - **삭제 이유**
    - 테스트 결과 삭제 후에도 Glassmorphism 디자인 및 테마가 정상적으로 유지됨을 확인
    - CSS 우선순위 체계 붕괴로 인한 유지보수 난이도 상승
    - 표준 CSS 문법을 준수하여 장기적인 코드 품질 확보

<br/><br/>

## 결과

- 모든 포스팅에서 이미지 및 레이아웃 정상 출력됨
- 불필요한 파일 및 코드 제거로 프로젝트 경량화