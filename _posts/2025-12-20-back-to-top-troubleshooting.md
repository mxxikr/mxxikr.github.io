---
title: "Jekyll 블로그 플로팅 버튼 고정 실패(position: fixed 속성) 트러블 슈팅"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-20 08:20:00 +0900
category:
  - [Blog]
tags: [jekyll, troubleshooting, css]
math: false
mermaid: false
---

## 문제 상황

- **Top / Bottom 이동을 위한 플로팅 버튼(Floating Button)**을 구현했으나 의도대로 작동하지 않음
  - `position: fixed` 속성을 주었음에도 불구하고 화면에 고정되지 않음
  - 스크롤을 해도 화면을 따라오지 않고 페이지 최하단(Footer 영역)에만 머물러 있음
  - 좌측 하단에 항상 떠 있어야 할 버튼이 문서의 특정 위치에 고정됨

<br/><br/>

## 원인 분석

- 부모 요소에 적용된 `transform` 속성이 `position: fixed`의 기준점을 뷰포트에서 부모 요소로 변경시켜 발생한 문제임

- 모든 요소에 `transform`을 강제하여 부작용 발생

    ```css
    * {
    /* 모든 요소가 Containing Block이 되어버림 */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    }
    ```

### `transform`과 `position: fixed`의 충돌

- **동작 원리**
  - `transform` 속성이 적용된 요소는 하위 `position: fixed` 요소의 **새로운 기준점(Containing Block)**이 됨
  - 기존에는 뷰포트(전체 화면)가 기준이었으나, `transform`이 적용된 부모 요소가 기준이 됨
- **결과**
  - 상단 이동 버튼의 고정 범위가 뷰포트 전체가 아닌 **상위 컨테이너 내부로 제한됨**
  - 따라서 화면을 따라오지 못하고 컨테이너의 끝(페이지 최하단)에 머무르게 됨

<br/><br/>

## 해결 과정

- 문제를 일으킨 전체 선택자 코드를 제거하고 필요한 요소에만 최적화를 적용함
    - 모든 요소에 적용되던 `transform: translateZ(0)` 코드 삭제
    - 애니메이션이 실제로 필요한 요소(버튼, 카드, 태그 등)만 선별
    - 애니메이션이 필요한 요소만 선별하여 `will-change` 적용
        ```css
        .card,
        .btn,
        .nav-link,
        .topbar-nav-item,
        .pagination a {
        /* 브라우저에게 최적화 힌트만 제공 */
        will-change: transform;
        }

<br/><br/>

## 결과

- 플로팅 버튼이 뷰포트 기준 **좌측 하단**에 정상적으로 고정됨
- 스크롤 위치와 관계없이 항상 접근 가능해짐