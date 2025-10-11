---
title: "Jekyll 블로그 Google Analytics 연동"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-10-11 19:00:00 +0900
category:
  - [Blog]
tags:
  - [google analytics, jekyll]
math: true
mermaid: true
---

## 개요

- Jekyll 블로그에 Google Analytics를 연동하여 방문자 통계를 추적하는 방법을 설명합니다.

## Google Analytics란

- Google Analytics 기능
  - 웹사이트 방문자 수 추적
  - 방문자 행동 분석
  - 트래픽 소스 파악
  - 실시간 방문자 모니터링

## 사전 준비사항

### 필수 요소

- Google 계정
  - Gmail 계정 또는 Google Workspace 계정
  - 무료로 사용 가능

- Jekyll 블로그
  - GitHub Pages 또는 다른 호스팅에 배포된 블로그
  - 블로그 URL 필요

## Google Analytics 계정 생성

### Google Analytics 접속

- [Google Analytics](https://analytics.google.com/) 접속
- Google 계정으로 로그인

### 계정 만들기

- 측정 시작 버튼 클릭
- 계정 이름 입력
  - 예: My Blog Analytics
- 계정 데이터 공유 설정
  - 필요에 따라 선택
  - 기본 설정 유지 가능

### 속성 만들기

- 속성 이름 입력
  - 예: mxxikr.github.io
- 보고 시간대 선택
  - 한국: (GMT+09:00) 서울
- 통화 선택
  - KRW - 대한민국 원

### 비즈니스 정보 입력

- 업종 카테고리 선택
  - 기술 또는 적절한 카테고리
- 비즈니스 규모 선택
  - 소규모 또는 해당 규모
- 사용 목적 선택
  - 필요에 따라 선택

### 데이터 스트림 설정

- 플랫폼 선택
  - 웹 선택
- 웹사이트 URL 입력
  - https://username.github.io
- 스트림 이름 입력
  - 블로그 이름
- 향상된 측정 설정
  - 기본 설정 유지 가능
- 스트림 만들기 클릭

### 측정 ID 확인

- 데이터 스트림 세부정보에서 측정 ID 확인
  - 형식: G-XXXXXXXXXX
  - 이 ID를 블로그에 설정할 예정

## Jekyll 블로그에 Google Analytics 연동

### Chirpy 테마 사용 시

- _config.yml 파일 열기

- Google Analytics 설정 찾기
  ```yaml
  google_analytics:
    id: G-XXXXXXXXXX
  ```

- 측정 ID 입력
  ```yaml
  google_analytics:
    id: G-ABC1234567
  ```

- 파일 저장

### 다른 테마 사용 시

- _config.yml 파일 확인
  - Google Analytics 설정 섹션 찾기
  - 테마마다 설정 방법이 다를 수 있음

- 설정이 없는 경우
  - _config.yml에 추가
    ```yaml
    google_analytics: G-XXXXXXXXXX
    ```

- HTML에 직접 추가하는 경우
  - _includes/head.html 또는 _layouts/default.html 파일 열기
  - `</head>` 태그 바로 위에 추가
    ```html
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
    ```

### 로컬에서 테스트 제외

- _config.yml 설정
  ```yaml
  google_analytics:
    id: G-XXXXXXXXXX
    pv:
      proxy_endpoint: 
      cache_path: 
  ```

- 개발 환경에서 추적 비활성화
  - Jekyll 4.0 이상
    ```yaml
    google_analytics:
      id: G-XXXXXXXXXX
  
    # 개발 환경
    environment: development
    ```

## 변경사항 배포

### Git 커밋 및 푸시

- 변경사항 추가
  ```bash
  git add _config.yml
  ```

- 커밋
  ```bash
  git commit -m "Add Google Analytics"
  ```

- GitHub에 푸시
  ```bash
  git push origin main
  ```

### 배포 대기

- GitHub Actions에서 빌드 확인
- 배포 완료 대기
- 블로그 접속하여 확인

## Google Analytics 동작 확인

### 실시간 보고서 확인

- Google Analytics 콘솔 접속
- 왼쪽 메뉴에서 보고서 클릭
- 실시간 선택
- 현재 활성 사용자 확인

### 테스트 방법

- 블로그 접속
  - 본인의 블로그 URL 접속
- Google Analytics 콘솔 확인
  - 실시간 보고서에서 방문자 1명 표시 확인
- 다른 페이지 이동
  - 페이지뷰 증가 확인

### 데이터 수집 확인

- 데이터 수집까지 시간 소요
  - 실시간 보고서: 즉시
  - 일반 보고서: 24-48시간
- 처음 설치 시 데이터 누적 필요

## 주요 보고서 활용

### 실시간 보고서

- 현재 방문자 수
  - 실시간 접속자 확인
- 페이지뷰
  - 현재 조회 중인 페이지
- 트래픽 소스
  - 방문 경로 확인

### 사용자 보고서

- 사용자 속성
  - 국가, 도시
  - 브라우저, OS
  - 기기 카테고리
- 신규 방문자 vs 재방문자

### 트래픽 획득 보고서

- 트래픽 소스
  - Organic Search (검색엔진)
  - Direct (직접 방문)
  - Referral (다른 사이트)
  - Social (소셜 미디어)

### 참여도 보고서

- 페이지뷰
  - 가장 많이 조회된 페이지
- 평균 참여 시간
- 이벤트 수

## 트러블슈팅

### 데이터가 수집되지 않음

- 문제 상황
  - 실시간 보고서에 데이터 없음
  - 방문했지만 카운트 안 됨

- 확인 사항
  - 측정 ID 정확한지 확인
    - G-XXXXXXXXXX 형식
  - _config.yml 저장 확인
  - GitHub에 푸시 확인
  - 배포 완료 확인
  - 브라우저 캐시 삭제 후 재접속

- 개발자 도구로 확인
  - 브라우저 F12 키
  - Network 탭
  - google-analytics.com 또는 googletagmanager.com 요청 확인

### 로컬에서도 추적됨

- 문제 상황
  - localhost:4000 접속 시에도 카운트됨

- 해결 방법
  - _config.yml에 환경 변수 추가
    ```yaml
    # 프로덕션에서만 활성화
    google_analytics:
      id: G-XXXXXXXXXX
    ```
  - Jekyll serve 시 추적 비활성화
    ```bash
    JEKYLL_ENV=development bundle exec jekyll serve
    ```

### 측정 ID를 찾을 수 없음

- 문제 상황
  - Google Analytics에서 측정 ID가 보이지 않음

- 해결 방법
  - Google Analytics 콘솔 접속
  - 관리 클릭
  - 속성 선택
  - 데이터 스트림 클릭
  - 해당 웹 스트림 클릭
  - 측정 ID 확인

### 이전 UA 코드 사용 중

- 문제 상황
  - UA-XXXXXXXXX 형식의 ID 사용 중
  - Universal Analytics 중단됨

- 해결 방법
  - Google Analytics 4 (GA4)로 전환 필요
  - 새로운 GA4 속성 만들기
  - 측정 ID (G-XXXXXXXXXX) 사용

## 개인정보 보호 고려사항

### Cookie 동의

- 쿠키 사용 안내
  - 개인정보 처리방침에 명시
  - 쿠키 사용 동의 배너 고려

### IP 익명화

- Google Analytics 설정
  - 기본적으로 IP 익명화 적용
  - GA4는 자동으로 처리

### 데이터 보관

- Google Analytics 설정
  - 관리 > 데이터 설정 > 데이터 보관
  - 기본: 14개월
  - 필요시 조정 가능

## 추가 설정

### 이벤트 추적

- 커스텀 이벤트 설정
  - 버튼 클릭
  - 다운로드
  - 외부 링크 클릭

- 이벤트 코드 추가 예시
  ```html
  <button onclick="gtag('event', 'button_click', {
    'event_category': 'engagement',
    'event_label': 'download_button'
  });">
    다운로드
  </button>
  ```

### 전환 설정

- 목표 설정
  - 특정 페이지 방문
  - 특정 이벤트 발생
- Google Analytics에서 설정
  - 관리 > 전환
  - 새 전환 이벤트 만들기

### Search Console 연결

- Google Search Console 연동
  - Search Console 설정
  - 속성 추가 및 소유권 확인
  - Google Analytics와 연결
- 검색 성능 데이터 확인 가능

## 유용한 기능

### 맞춤 보고서

- 맞춤 보고서 만들기
  - 탐색 > 맞춤 탐색
  - 원하는 측정기준, 측정항목 선택
  - 보고서 저장

### 알림 설정

- 맞춤 알림
  - 방문자 급증 시 알림
  - 특정 조건 충족 시 알림
- 관리 > 맞춤 알림에서 설정

### 대시보드 공유

- 보고서 공유
  - 보고서 스냅샷 공유
  - 이메일로 정기 보고서 전송
- 사용자 추가
  - 관리 > 속성 액세스 관리
  - 다른 사용자 초대 가능

## 명령어 정리

### Jekyll 로컬 테스트

```bash
# 개발 환경으로 실행 (GA 비활성화)
JEKYLL_ENV=development bundle exec jekyll serve

# 프로덕션 환경으로 테스트
JEKYLL_ENV=production bundle exec jekyll serve
```

### Git 배포

```bash
# 변경사항 확인
git status

# 파일 추가
git add _config.yml

# 커밋
git commit -m "Add Google Analytics"

# 푸시
git push origin main
```

## Reference

- [Google Analytics 공식 문서](https://support.google.com/analytics/)
- [Google Analytics 4 시작하기](https://support.google.com/analytics/answer/9304153)
- [Jekyll 공식 문서](https://jekyllrb.com/docs/)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
- [Google Tag Manager](https://tagmanager.google.com/)

