---
title: Jekyll 블로그 CSS/JS 자동 최적화
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-12-20 08:35:00 +0900
category: [Blog]
tags: [jekyll, performance, automation]
math: true
mermaid: true
---
## 개요

- Jekyll 기반 블로그에서 CSS/JS 자동 최적화 시스템을 구축하여 웹 성능을 개선한 과정을 소개함

<br/><br/>

## 문제 상황 분석

### 초기 성능 문제

- 기술 블로그에서 측정된 현황
    - SCSS 원본
        - 332KB (19개 파일, 11,785 라인)
    - 빌드된 CSS
        - 454KB (13 라인으로 압축)
    - JavaScript
        - 7개 minified 파일 (각 3.2KB)

### CSS/JS 현황 파악

```bash
# SCSS 파일 용량 및 개수 확인
du -sh _sass && find _sass -name "*.scss" -type f | wc -l
# 결과: 332K    _sass
#       19

# SCSS 총 라인 수 확인
find _sass -name "*.scss" -type f -exec wc -l {} + | tail -1
# 결과: 11785 total

# 빌드된 CSS 확인
ls -lh _site/assets/css/style.css
# 결과: -rw-r--r--  1 user  staff   454K Dec 20 22:03 _site/assets/css/style.css

# 빌드된 CSS 라인 수 (압축 효과 확인)
wc -l _site/assets/css/style.css
# 결과: 13 _site/assets/css/style.css

# Minified JS 파일 확인
find assets/js/dist -name "*.min.js" -type f -exec ls -lh {} \;
# 결과: 7개 파일, 각 3.2KB
```

- 측정된 파일 특성
    - SCSS 원본
        - 19개 파일, 332KB, 11,785 라인
    - 빌드된 CSS
        - 1개 파일, 454KB, 13 라인 (압축)
    - JavaScript
        - 7개 minified 파일, 각 3.2KB
    - defer/async 스크립트
        - 5개 defer, 2개 async

<br/><br/>

## 적용된 기술

- CSS 최적화
    - Sass compressed 모드
    - 자동 minification
    
- JavaScript 최적화
    - Gulp + Uglify
    - defer/async 로딩
    
- 빌드 자동화
    - Jekyll 빌드 파이프라인
    - GitHub Actions
    
- 이미지 최적화
    - Git pre-commit 훅
    - pngquant, jpegoptim

<br/><br/>

## 자동화 시스템 구성

### Jekyll SCSS 압축 설정

- _config.yml 설정
    - `_config.yml` 파일에 아래 내용을 추가하여 Sass 자동 압축 활성화

    ```yaml
    # _config.yml
    sass:
      style: compressed  # CSS 자동 압축 활성화
    ```

- 압축 옵션

    | 옵션 | 설명 | 특징 |
    |------|------|------|
    | `nested` | 들여쓰기 유지 | 기본값, 디버깅 용이 |
    | `expanded` | 완전 확장 | 가독성 높음 |
    | `compact` | 한 줄로 압축 | 선택자별 한 줄 |
    | `compressed` | **최대 압축** | **공백 제거, 가장 작음** |

### 압축 효과

- 압축 전 (개발 중)

    ```scss
    /* _sass/layout/categories.scss */
    .card {
      background: transparent !important;
      background-color: transparent !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px) saturate(1.2) !important;
      -webkit-backdrop-filter: blur(10px) saturate(1.2) !important;
      box-shadow: none !important;
      border-radius: 20px !important;
    }
    ```

- 압축 후 (빌드된 CSS)

    ```css
    /* _site/assets/css/style.css */
    .card{background:transparent!important;background-color:transparent!important;border:1px solid rgba(255,255,255,.1)!important;backdrop-filter:blur(10px) saturate(1.2)!important;-webkit-backdrop-filter:blur(10px) saturate(1.2)!important;box-shadow:none!important;border-radius:20px!important}
    ```

- CSS 압축 효과
    - 라인 수
        - 11,785 라인 → 13 라인 (99.9% 감소)
    - 가독성
        - 개발 중 유지 → 배포 시 최적화
    - 파일 크기
        - 454KB (압축됨)

- 자동화의 이점
    - 개발 시
        - SCSS로 편하게 작성
    - 빌드 시
        - 자동으로 압축
    - 배포 시
        - 최적화된 파일 제공

### JavaScript 최적화 설정

- Gulp 기반 자동화 설정
    - 프로젝트 루트에 `gulpfile.js` 폴더 생성 및 `index.js` 작성
    
    ```javascript
    // gulpfile.js/index.js
    #!/usr/bin/env node
    
    "use strict";
    
    const js = require('./tasks/js');
    
    exports.default = js.build;
    
    /* keep-alive develop mode, without uglify */
    exports.dev = js.liveRebuild;
    ```

- package.json 스크립트 설정
    - `package.json`에 다음 스크립트와 의존성 추가
    - 터미널에서 `npm install`을 실행하여 패키지 설치 필요

    ```json
    {
      "scripts": {
        "build": "gulp build",
        "dev": "gulp dev"
      },
      "devDependencies": {
        "gulp": "^4.0.2",
        "gulp-uglify": "^3.0.2",
        "uglify-js": "^3.14.3"
      }
    }
    ```

### JavaScript 지연 로딩 설정

- defer 속성 활용
    - `_includes` 폴더 내 스크립트 로드 부분에 `defer` 속성 추가
    - HTML 파싱 차단 없이 스크립트 로드 가능
    
    ```html
    <!-- _includes/js-selector.html -->
    <script defer src="{{ '/assets/js/dist/pvreport.min.js' | relative_url }}"></script>
    <script defer src="{{ '/assets/js/apple-liquid-glass.js' | relative_url }}"></script>
    <script defer src="{{ '/assets/js/code-header.js' | relative_url }}"></script>
    ```

- async 속성 활용
    - 독립적인 스크립트에 사용
    
    ```html
    <!-- _includes/js-selector.html -->
    <script async src="{{ site.data.assets[origin].countup.js }}"></script>
    <script id="MathJax-script" async src="{{ site.data.assets[origin].mathjax.js }}"></script>
    ```

### 전체 빌드 프로세스

![image](/assets/img/blog/image.png)

<br/><br/>

## 사용 방법

### 로컬 개발 모드

```bash
# Jekyll 서버 실행 (CSS 자동 압축)
bundle exec jekyll serve

# JS 개발 모드 (압축 안 함, 빠른 빌드)
npm run dev
```

### 프로덕션 빌드

```bash
# Jekyll 프로덕션 빌드
JEKYLL_ENV=production bundle exec jekyll build

# JavaScript 압축
npm run build
```

### 배포 워크플로우

```bash
# 1. SCSS 파일 수정
vim _sass/layout/categories.scss

# 2. 로컬에서 확인 (자동 CSS 압축)
bundle exec jekyll serve

# 3. JS 파일 수정 (필요시)
vim assets/js/custom-script.js

# 4. JS 빌드 (필요시)
npm run build

# 5. 변경사항 커밋
git add .
git commit -m "Update styles and scripts"

# 6. 배포
git push origin main
# → GitHub Pages 자동 빌드
# → CSS/JS 자동 압축
# → 사이트 배포 완료
```

<br/><br/>

## 최적화 결과

### 측정된 현황

| 구분 | 파일 크기 | 파일 개수 | 라인 수 | 비고 |
|------|-----------|-----------|---------|------|
| **SCSS 원본** | 332KB | 19개 | 11,785줄 | 개발용 소스 |
| **최종 CSS** | 454KB | 1개 | 13줄 | **99.9% 압축됨** |

- JavaScript 최적화
    - 7개 파일 모두 `.min.js` 형태로 제공 (각 3.2KB)
    - 5개 스크립트에 `defer` 적용
    - 2개 스크립트에 `async` 적용

- 자동화 시스템
    - Jekyll 빌드 시 CSS 자동 압축
    - Gulp를 통한 JS minification
    - defer/async 속성으로 비차단 로딩

### 최종 결과

| 항목 | 상태 | 측정 결과 |
|------|------|----------|
| CSS 압축 | 자동화 완료 | 11,785 → 13 라인 |
| JS Minification | 자동화 완료 | 7개 파일 (각 3.2KB) |
| 렌더링 최적화 | 적용 완료 | defer 5개, async 2개 |
| 이미지 최적화 | 자동화 완료 | 88MB → 52MB (41%) |
| 전체 파일 | 최적화 완료 | SCSS 332KB, CSS 454KB |

### 전체 동작 과정

![image](/assets/img/blog/image2.png)

<br/><br/>

## 측정 방법

- CSS 압축 측정
    ```bash
    # SCSS 원본 라인 수
    find _sass -name "*.scss" -exec wc -l {} + | tail -1
    
    # 빌드된 CSS 라인 수
    wc -l _site/assets/css/style.css
    ```

- JS Minification 측정
    ```bash
    # Minified JS 파일 확인
    find assets/js/dist -name "*.min.js" -type f -exec ls -lh {} \;
    ```

- JS 지연 로딩 측정
    ```bash
    # defer 속성 개수
    grep -c "defer" _includes/js-selector.html
    
    # async 속성 개수
    grep -c "async" _includes/js-selector.html
    ```

- 이미지 최적화 측정
    ```bash
    # 이미지 디렉토리 용량 확인
    du -sh assets/img
    ```


### CSS 압축 관련 문제

- 문제
    - CSS가 압축되지 않음
- 원인
    - `_config.yml` 설정 누락 또는 잘못된 값
- 해결 방법
    ```yaml
    # _config.yml 확인
    sass:
      style: compressed  # 이 값이 정확한지 확인
    ```

- 문제
    - 로컬과 배포된 CSS가 다름
- 원인
    - 로컬에서는 개발 모드로 빌드됨
- 해결 방법
    ```bash
    # 프로덕션 모드로 로컬 빌드
    JEKYLL_ENV=production bundle exec jekyll build
    
    # 생성된 파일 확인
    cat _site/assets/css/style.css | head -10
    ```

### JavaScript 최적화 문제

- 문제
    - JS 파일이 minify되지 않음
- 원인
    - Gulp 빌드를 실행하지 않음
- 해결 방법
    ```bash
    # Node.js 패키지 설치
    npm install
    
    # Gulp 빌드 실행
    npm run build
    
    # 결과 확인
    ls -lh assets/js/dist/*.min.js
    ```

- 문제
    - defer/async 스크립트 오류
- 원인
    - 스크립트 간 의존성 문제
- 해결 방법
    ```html
    <!-- 의존성이 있는 스크립트는 defer 순서 지정 -->
    <script defer src="jquery.js"></script>
    <script defer src="custom.js"></script>  <!-- jQuery 이후 로드 -->
    
    <!-- 독립적인 스크립트는 async -->
    <script async src="analytics.js"></script>
    ```

### 빌드 성능 문제

- 문제
    - Jekyll 빌드가 너무 느림
- 원인
    - incremental build 비활성화
- 해결 방법
    ```yaml
    # _config.yml (개발 환경)
    incremental: true  # 증분 빌드 활성화
    
    # 또는 명령어 옵션
    bundle exec jekyll serve --incremental
    ```

- 문제
    - 불필요한 파일 빌드
- 원인
    - exclude 설정 누락
- 해결 방법
    ```yaml
    # _config.yml
    exclude:
      - node_modules
      - gulpfile.js
      - package*.json
      - '*.gem'
      - '*.gemspec'
    ```

### 캐싱 문제

- 문제
    - CSS/JS 변경이 반영되지 않음
- 원인
    - 브라우저 캐시 또는 CDN 캐시
- 해결 방법
    ```bash
    # 브라우저 캐시 강제 새로고침
    # Chrome/Firefox: Ctrl + Shift + R (Mac: Cmd + Shift + R)
    
    # 파일명에 버전 추가 (cache busting)
    # _includes/head.html
    <link rel="stylesheet" href="{{ '/assets/css/style.css?v=1.0.1' | relative_url }}">
    ```

<br/><br/>

## 성능 모니터링

### Lighthouse 점수 확인

```bash
# Lighthouse CLI 설치
npm install -g lighthouse

# 로컬 사이트 테스트
lighthouse http://localhost:4000 --output=json --output-path=./lighthouse-report.json

# 배포된 사이트 테스트
lighthouse https://mxxikr.github.io --output=html --output-path=./lighthouse-report.html
```

### 주요 지표 모니터링

| 지표 | 목표 점수 | 설명 |
|------|-----------|------|
| **Performance** | **85점 이상** | 전체 성능 점수 |
| **FCP** (First Contentful Paint) | 1.8초 이하 | 첫 콘텐츠 렌더링 시간 |
| **LCP** (Largest Contentful Paint) | 2.5초 이하 | 최대 콘텐츠 렌더링 시간 |
| **TBT** (Total Blocking Time) | 200ms 이하 | 총 차단 시간 |

<br/><br/>

## 운영 및 관리 팁

### 개발 워크플로우

1. 개발 시
    - 로컬에서 `bundle exec jekyll serve` 사용
    - CSS는 자동 압축 확인
    - JS는 `npm run dev`로 빠른 빌드

2. 테스트 시
    - 프로덕션 모드로 로컬 빌드
    - `JEKYLL_ENV=production bundle exec jekyll build`
    - Lighthouse로 성능 측정

3. 배포 시
    - JS 최종 빌드 `npm run build`
    - 커밋 및 푸시
    - GitHub Pages 자동 배포 확인

### 최적화 유지 팁

1. SCSS 작성 규칙
    - 개발 시 가독성 우선
    - 빌드가 자동 압축 처리
    - 주석 자유롭게 사용

2. JavaScript 관리
    - 의존성 있는 스크립트 `defer` 사용
    - 독립적인 스크립트 `async` 사용
    - Gulp 빌드로 minify

3. 자동화 검증
    - 빌드 후 파일 크기 확인
    - 라인 수 감소 확인
    - defer/async 적용 확인

<br/><br/>

## Reference

- [Jekyll Sass/SCSS 공식 문서](https://jekyllrb.com/docs/assets/)
- [Gulp 공식 문서](https://gulpjs.com/)
- [웹 성능 최적화 - Google Developers](https://developers.google.com/web/fundamentals/performance)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse 공식 문서](https://developers.google.com/web/tools/lighthouse)
