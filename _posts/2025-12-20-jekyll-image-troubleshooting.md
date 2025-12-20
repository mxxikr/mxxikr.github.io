---
title: "Jekyll 블로그 레이아웃 깨짐 및 이미지 미표시 트러블 슈팅"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-20 08:25:00 +0900
category:
  - [Blog]
tags: [jekyll, troubleshooting, liquid]
math: false
mermaid: false
---

## 문제 상황

- 블로그 글 확인 중 세 가지 문제 발견함
  - **이미지 미표시**
    - 이미지가 존재함에도 화면에 출력되지 않음
    - 개발자 도구 확인 결과 `src` 대신 `data-src` 속성만 존재함
  - **레이아웃 깨짐**
    - 이미지가 포함된 포스트에서 사이드바가 밀리고 본문 폭이 좁아지는 등 HTML 구조가 깨짐
  - **배포 환경에서만 발생하는 레이아웃 깨짐**
    - 로컬 서버에서는 정상이나, GitHub Pages 배포 시 모든 포스트의 레이아웃이 우측으로 치우침
    - 태그와 본문 컨테이너가 사라지는 현상 발생

<br/><br/>

## 원인 분석

- `git reset`과 로그 분석, 그리고 배포 환경 차이를 비교하여 원인을 파악함

### 이미지 미표시 - Lazy Loading의 잔해

- **원인**
  - 과거 성능 최적화를 위해 도입 시도했던 **Lazy Loading(지연 로딩)** 기능 잔재
- **Lazy Loading 동작 방식**
  - 초기 로딩 시 `data-src`에 경로를 저장
  - 스크립트가 화면 호출 시 `src`로 변환
- **문제점**
  - 스크립트 파일(`safe-lazy-loading.html`)은 제거되었으나, HTML 생성 시 `src`를 `data-src`로 변환하는 로직만 남아있었음
- **결과**
  - 스크립트 부재로 인해 `data-src`가 `src`로 변환되지 못함

### 레이아웃 깨짐 1 - HTML 태그 불균형

- **원인**
  - Jekyll의 Markdown 변환기(Kramdown)와 커스텀 파일(`refactor-content.html`) 간 충돌 발생
- **상세 내용**
  - Kramdown이 코드 블록을 감싸기 위해 `<div>` 생성
  - 커스텀 로직 수행 중 **여는 태그(`<div>`)는 유지하고 닫는 태그(`</div>`)를 누락**시킴
- **결과**
  - 닫히지 않은 `<div>`로 인해 전체 페이지 HTML 구조가 무너짐

### 레이아웃 깨짐 2 - 배포 환경의 HTML 압축(Minification)과 속성 주입

- **원인**
  - `_includes/refactor-content.html`의 코드 블록 언어 라벨 추출 로직 취약점
- **상세 내용**
  - 코드 블록 상단에 언어 이름(Python, Shell 등)을 표시하기 위해 `data-label-text` 속성을 동적으로 생성함
  - 이때 추출된 텍스트(`_label_text`)에 **HTML 태그나 따옴표(`"`)가 포함**된 채로 속성에 주입됨
- **환경별 차이**
  - **로컬(Development)**
    - HTML에 줄바꿈이 있어 브라우저가 어느 정도 오류를 보정해 줌
  - **배포(Production)**
    - HTML이 한 줄로 압축(Minification)되면서, 닫히지 않은 따옴표가 뒤따라오는 **거대한 HTML 덩어리를 모두 속성 값으로 인식**해버림
- **결과**
  - 주요 `</div>` 태그들이 무시되어 전체 레이아웃이 붕괴됨

<br/><br/>

## 해결 과정

### 이미지 미표시 해결 - Liquid 코드 정리

- `_includes/refactor-content.html` 파일 내 잘못된 주석 처리로 인해 실행되던 코드 발견
- HTML 주석(`<!-- -->`) 내에서도 Liquid 템플릿 코드가 서버 사이드에서 실행되는 문제 확인
- **해결**
  - 문제를 유발하는 Lazy Loading 관련 변환 코드를 **완전 삭제**하여 스크립트 의존성 제거

### 레이아웃 깨짐 1 해결 - HTML 태그 구조 복구

- 코드 블록 파싱 과정에서 `<pre>` 태그를 강제로 제거하거나 잘못된 `<div>` 구조를 만들던 `replace` 필터 로직 식별
- **해결**
  - 복잡한 문자열 치환 로직을 제거하고, 순수하게 코드 블록을 분리/재조립하는 방식으로 로직 단순화
  - 닫는 태그(`</div>`)가 누락되지 않도록 반복문 구조 개선

### 레이아웃 깨짐 2 해결 - Escape 필터 적용 (배포 이슈)

- 언어 라벨 텍스트에 포함된 따옴표나 특수문자가 HTML 속성을 깨뜨리는 현상 방지
- **해결**
  - `data-label-text` 속성 주입 시 **`escape` 필터** 적용

    ```liquid
    <span data-label-text="{{ _label_text | strip | escape }}">
    ```
  
  - 언어 라벨을 확실히 찾은 경우에만 헤더를 생성하도록 안전 장치(Null Check) 추가

### 코드 정리 및 최적화

- **불필요한 파일 삭제**
  - `safe-lazy-loading.html`, `performance-optimization.html` 등 미사용 파일 제거
  - 복잡성 제거를 통한 시스템 안정성 확보
- **!important 제거**
  - CSS 유지보수를 저해하는 160여 개의 `!important` 속성 제거
  - 표준 CSS 우선순위 체계 복구

<br/><br/>

## 결과

- 모든 포스팅에서 이미지가 즉시 로딩됨
- 로컬 및 배포 환경 모두에서 사이드바와 본문 구조가 정상적으로 표시됨
- 불필요한 스크립트와 취약한 로직을 제거하여 재발 방지