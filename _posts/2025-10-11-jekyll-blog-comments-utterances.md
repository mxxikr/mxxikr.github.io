---
title: Jekyll 블로그 Utterances 댓글 시스템 추가
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-10-11 19:00:00 +0900
category: [Blog]
tags: [jekyll, utterances]
math: true
mermaid: false
---
## 개요

- Jekyll 블로그에 Utterances 댓글 시스템을 추가하는 방법을 설명함


<br/><br/>

## Utterances란

### 특징

- GitHub Issues 기반 댓글 시스템
- 무료 오픈소스
- 광고 없음
- 가벼운 용량
- 마크다운 지원
- GitHub 로그인 필요

### 장점

- 설정이 간단함
- GitHub Issues로 댓글 관리 용이
- 개발자 친화적
- 스팸 방지
- 다크 모드 지원

### 단점

- GitHub 계정이 필요함
- 일반 사용자에게는 진입장벽 존재
- GitHub Issues를 댓글용으로 사용


<br/><br/>

## 사전 준비사항

### 필수 요소

- GitHub 계정
- Jekyll 블로그
  - GitHub Pages 배포 완료
  - Public Repository

### Repository 설정 확인

- Repository가 Public인지 확인
  - Private Repository는 Utterances 사용 불가
- GitHub Issues 활성화 확인
  - Repository > Settings > Features
  - Issues 체크박스 확인


<br/><br/>

## 설정 방법

### 1단계: _config.yml 파일 수정

- 블로그 루트 디렉토리에서 _config.yml 파일 열기

- comments 섹션 찾기
  - 90번째 줄 근처에 위치

- Utterances 설정 입력
  ```yaml
  comments:
    active: utterances
    utterances:
      repo: username/repository-name
      issue_term: pathname
  ```

- username/repository-name을 본인의 Repository 정보로 변경
  - 예시: `mxxikr/mxxikr.github.io`

- 파일 저장

### 2단계: Utterances App 설치

- [Utterances GitHub App](https://github.com/apps/utterances) 접속

- Install 또는 Configure 버튼 클릭

- Repository 선택
  - Only select repositories 선택
  - 본인의 블로그 Repository 선택

- Install 또는 Save 버튼 클릭

- 설치 완료
  - Utterances가 Repository에 접근 권한 획득
  - Issues 읽기/쓰기 권한 부여됨

### 3단계: 변경사항 배포

- 변경사항 추가
  ```bash
  git add _config.yml
  ```

- 커밋
  ```bash
  git commit -m "Add Utterances comments"
  ```

- GitHub에 푸시
  ```bash
  git push origin master
  ```

- GitHub Actions에서 빌드 확인
  - Repository > Actions 탭에서 빌드 진행 상태 확인
  - 빌드 완료 대기

### 4단계: 댓글 기능 확인

- 블로그에 접속하여 아무 포스트 열기

- 포스트 하단에 댓글 영역 확인
  - "Sign in with GitHub" 버튼이 보이면 성공

- 테스트 댓글 작성
  - GitHub 로그인
  - 댓글 작성
  - Submit 버튼 클릭

- Repository의 Issues 탭 확인
  - 새로운 Issue가 자동 생성됨
  - Issue 제목이 포스트 경로로 표시됨


<br/><br/>

## 댓글 관리

- Repository > Issues 탭에서 댓글 관리
  - 댓글별로 Issue 생성됨
  - Issue에서 직접 댓글 확인 및 답글 가능

- 댓글 삭제 방법
  - GitHub Issues에서 해당 댓글 삭제
  - 또는 Issue 전체 닫기

- 스팸 차단
  - GitHub 계정이 필요하므로 스팸이 적음
  - 필요시 Issue를 Lock하여 댓글 차단


<br/><br/>

## 트러블슈팅

### 댓글 영역이 표시되지 않음

- _config.yml의 `active: utterances` 확인
- Repository가 Public인지 확인
- GitHub Actions 빌드 성공 확인
- 브라우저 캐시 삭제 후 재확인

### Utterances App 권한 오류

- Error: utterances is not installed on username/repository 메시지가 나타나는 경우
- [Utterances GitHub App](https://github.com/apps/utterances) 재설치
- Repository 선택 확인

### Repository 이름 오류

- _config.yml의 repo 값이 정확한지 확인
  - 대소문자 구분
  - 오타 확인
- 형식: `username/repository-name`

### Private Repository 문제

- Utterances는 Public Repository만 지원
- Settings > General > Danger Zone > Change visibility > Make public


<br/><br/>

## Utterances vs 다른 댓글 시스템

### Utterances vs Giscus

- Utterances
  - GitHub Issues 사용
  - 간단한 설정
  - 기본 기능

- Giscus
  - GitHub Discussions 사용
  - 더 많은 기능 (반응, 답글 트리)
  - 설정이 조금 복잡

### Utterances vs Disqus

- Utterances
  - 무료 오픈소스
  - 광고 없음
  - GitHub 계정 필요

- Disqus
  - 광고 있음 (무료 플랜)
  - 소셜 로그인 지원
  - 더 많은 사용자 접근 가능


<br/><br/>

## 댓글 알림 설정

- GitHub 알림 설정 방법
  - Settings > Notifications
  - Issues 알림 활성화
  - 새 댓글 작성 시 이메일로 알림 수신


<br/><br/>

## Reference

- [Utterances 공식 사이트](https://utteranc.es/)
- [Utterances GitHub Repository](https://github.com/utterance/utterances)
- [Jekyll 공식 문서](https://jekyllrb.com/docs/)
- [GitHub Issues API](https://docs.github.com/en/rest/issues)

