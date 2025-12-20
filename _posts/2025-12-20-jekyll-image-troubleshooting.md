---
title: "Jekyll 블로그 레이아웃 깨짐 및 이미지 로드 실패 트러블 슈팅"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-20 19:25:00 +0900
categories:
  - Blog
tags: [jekyll, troubleshooting, liquid, html-compression]
math: false
mermaid: false
---

## 개요

- Jekyll 블로그 운영 중 이미지 로드 실패, 레이아웃 깨짐, 배포 환경의 문자열 아티팩트(`class="highlight">`) 유출 문제 해결 과정을 기록함

<br/><br/>

## 이미지 미표시 이슈

- 포스트 내 이미지가 로드되지 않고 개발자 도구에서 `data-src` 속성만 확인되는 현상

### 원인 분석
- **비활성화 한 Lazy Loading 기능 잔존**
  - 과거 성능 최적화를 위해 도입했던 지연 로딩 기능의 파편이 잔존함
  - 이미지 로드 JavaScript는 제거되었으나 Jekyll 빌드 시 `src`를 `data-src`로 변환하는 Liquid 로직(`refactor-content.html`)이 잔존함
- **Liquid의 특징**
  - HTML 주석(`<!-- -->`) 내부에 Liquid 코드가 감싸져 있어도, Jekyll은 서버 사이드에서 이를 실행하여 속성을 변환함
  - 사용자는 코드가 비활성화된 것으로 착각하기 쉬움

### 해결 과정
- **조치**
  - `_includes/refactor-content.html` 파일 내 `src` 속성 강제 조작 구문을 삭제함
    
    ```liquid
    <!-- _includes/refactor-content.html (삭제된 코드) -->
    {% if _src %}
      {% unless _src contains '://' %}
        ...
      {% endunless %}

      <!-- lazy-load images <https://github.com/ApoorvSaxena/lozad.js#usage> -->
      {% assign _left = _left | replace: 'src=', 'data-src=' %}
    {% endif %}
    ```

- **팁**
  - 이미지 태그 깨짐 시 빌드된 `_site` 폴더의 HTML 파일을 직접 열어 `src` 값 변조 여부를 우선 확인해야 함

<br/><br/>

## 레이아웃 깨짐 및 배포 환경에 따른 결과 차이

- 로컬에서는 정상이나 배포(GitHub Pages) 시에만 사이드바가 밀리고 우측으로 치우치는 대규모 레이아웃 변형 현상

### 원인 분석
- **HTML 압축(Minification) 문제**
  - 배포 환경은 트래픽 최적화를 위해 HTML을 압축하지만 로컬은 압축하지 않아 환경 차이가 발생함
- **따옴표와 태그 불균형**
  - Liquid 로직에서 코드 블록 언어 라벨 삽입 시 이스케이프(`escape`) 필터 생략으로 텍스트 내 따옴표(`"`)가 닫히지 않은 채 압축됨
  - 브라우저는 닫히지 않은 따옴표 이후의 거대한 HTML 덩어리를 모두 속성 값으로 잘못 인식하여 페이지의 컨테이너 구조가 완전히 파괴됨

### 해결 과정
- **재현 방법**
  - 로컬 `_config.yml`에서 `compress_html.ignore.envs`를 비워 로컬에서도 압축을 강제 활성화하여 문제를 재현함
- **조치**
  - `_includes/refactor-content.html`의 파싱 로직을 전면 수정함
  - `<div class="highlight">` 전체 매칭 대신 `<div class="highlight"` 접두사 매칭 사용 및 이스케이프 필터를 적용함

    ```liquid
    <!-- _includes/refactor-content.html (삭제된 코드) -->
    <!-- Add header for code snippets -->
    {% if _content contains '<div class="highlight"><code>' %}
      {% assign _code_spippets = _content | split: '<div class="highlight"><code>' %}
      {% assign _new_content = '' %}
    
      {% for _snippet in _code_spippets %}
        ...
        <!-- 이 부분에서 따옴표가 닫히지 않거나 태그 구조가 깨지는 문제 발생 -->
        {% capture _label %}
          <span data-label-text="{{ _label_text | strip }}"><i class="{{ _label_icon }}"></i></span>
        {% endcapture %}
        ...
      {% endfor %}
      {% assign _content = _new_content %}
    {% endif %}
    ```
  - 속성 삽입 시 `{{ value | escape }}` 필터를 적용하여 DOM 트리 깨짐을 원천 차단함

<br/><br/>

## 코드 블록 아티팩트 이슈

- 코드 블록 상단에 정체불명의 `class="highlight">` 텍스트가 노출되는 현상

### 원인 분석
- **_layouts/compress.html 레이아웃의 버그**
  - 테마 하위의 `_layouts/compress.html` 파일 존재 시 Jekyll은 설정 유무와 관계없이 이를 사용하여 HTML을 처리함
  - 파일 내부 Liquid 로직이 `<pre>` 태그 기준 콘텐츠 분할 시 코드 블록 `<div>` 구조를 무시하고 텍스트로 인식하여 출력하는 파싱 버그가 존재함

### 해결 과정
- **시도와 실패**
  - JavaScript(`TreeWalker`)를 사용해 유출된 텍스트를 사후 삭제하려 했으나 손상된 HTML 구조로 인해 레이아웃 밀림은 해결할 수 없었음
- **최종 해결**
  - 원인이 된 `_layouts/compress.html` 파일을 삭제함
  - 최신 브라우저와 배포 서버(Gzip/Brotli) 환경에서 Liquid 기반의 불안정한 HTML 압축은 실익보다 위험이 크다고 판단함

<br/><br/>

## 코드 블록 언어 라벨 및 복사 버튼 이슈

- 코드 블록 상단에 언어 정보(Java, Python 등)가 표시되지 않거나 복사 버튼이 작동하지 않는 현상

### 원인 분석
- **서버 사이드 처리의 한계**
  - Liquid로 언어 이름 추출 및 삽입 방식은 배포 시 HTML 압축 과정에서 태그 손상 시 무력화됨
  - CSS 가상 요소(`::after`) 방식은 특정 모드나 렌더링 시점에 따라 글자 실종 등 불안정성이 내재됨

### 해결 과정
- **조치**
  - `assets/js/code-header.js` 파일 생성 및 아래 코드 작성

    ```javascript
    /**
     * Code Block Header Injection
     */
    document.addEventListener('DOMContentLoaded', function () {
        const codeBlocks = document.querySelectorAll('div.highlighter-rouge');
        if (codeBlocks.length === 0) return;
    
        const languageMap = {
            'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python',
            'rb': 'Ruby', 'java': 'Java', 'cpp': 'C++',
            'html': 'HTML', 'css': 'CSS', 'sh': 'Shell'
            // 필요한 언어 추가
        };
    
        codeBlocks.forEach(block => {
            if (block.querySelector('.code-header')) return;
            
            // 언어 클래스 추출 (language-*)
            let lang = '';
            block.classList.forEach(cls => {
                if (cls.startsWith('language-')) lang = cls.replace('language-', '');
            });
            if (!lang) return;
    
            // 헤더 생성 및 삽입
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `<span><i class="fas fa-code"></i> ${languageMap[lang] || lang.toUpperCase()}</span>`;
            
            block.insertBefore(header, block.firstChild);
        });
    });
    ```

- **특징**
  - HTML 완성 후 실행되므로 배포 환경의 압축 오류에 영향이 없음
  - 가상 요소 대신 실제 텍스트 노드를 삽입하여 가독성을 확보함
  - 클릭 시 시각적 피드백(체크 아이콘)을 제공하는 복사 버튼 기능을 통합함

<br/><br/>

## 비슷한 문제를 겪고 있다면

- **이미지가 안 나온다면?**
  - `_includes/refactor-content.html`에서 `src` 속성을 가공하는 로직이 주석 안에 숨어있는지 확인
- **배포 후에만 레이아웃이 깨진다면?**
  - 로컬 설정에서 HTML 압축을 켜서 재현해보고, 속성에 이스케이프 필터가 누락되었는지 확인
- **알 수 없는 텍스트(`class="highlight">`)가 보인다면?**
  - `_layouts/compress.html` 파일의 존재 여부를 확인하고 가급적 삭제할 것
- **DOM 조작이 불안정하다면?**
  - 복잡한 정규식이나 Liquid 치환 대신 JavaScript를 이용해 DOM 로드 후 처리하는 것이 훨씬 안전함

<br/><br/>

## 최종 결과
- 레이아웃 정상화
- 언어 라벨 및 복사 키트의 안정적 작동
- 불필요한 시스템 부하 및 잠재적 버그 요인 완전 제거