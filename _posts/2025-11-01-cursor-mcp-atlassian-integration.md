---
title: "Cursor에서 MCP로 Jira/Confluence 연동하기"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-11-01 09:00:00 +0900
category:
  - [AI, MCP]
tags:
  - [cursor, mcp, jira, confluence]
math: false
mermaid: false
---

## 개요

- Cursor IDE에서 MCP(Model Context Protocol) 서버를 통해 Jira와 Confluence를 직접 연동하는 방법을 소개함
- Docker 기반 MCP 서버를 활용해 AI 어시스턴트가 Atlassian 도구에 접근할 수 있도록 설정함
- 프로젝트별 설정과 전역 설정 두 가지 방법을 모두 다룸
- 이 연동을 통해 Cursor에서 자연어로 Jira 티켓을 조회하고, Confluence 페이지를 검색하며 댓글을 추가하는 등의 작업을 수행할 수 있음

## MCP(Model Context Protocol)란

- MCP는 AI 모델이 외부 데이터 소스와 도구에 접근할 수 있도록 표준화된 프로토콜을 제공함
- Cursor와 같은 AI 기반 IDE에서 MCP 서버를 통해 Jira, Confluence, GitHub 등 다양한 외부 서비스와 통신할 수 있음
- Docker 컨테이너로 실행되는 MCP 서버는 API 인증을 처리하고 AI 모델이 이해할 수 있는 형식으로 데이터를 변환함

## 사전 준비사항

### Docker 설치 확인

```bash
docker --version
```

- Docker가 설치되어 있지 않다면 [Docker 공식 사이트](https://www.docker.com/)에서 설치함

### Jira/Confluence 계정 정보 준비

- Jira URL (예: `https://yourcompany.atlassian.net`)
- 사용자 이메일
- API 토큰 또는 개인 액세스 토큰

## API 토큰 생성 방법

### Jira Cloud API 토큰 생성

1. [Atlassian 계정 관리 페이지](https://id.atlassian.com/manage-profile/security/api-tokens) 접속
2. "Create API token" 버튼 클릭
3. 토큰 이름 입력 ex) "Cursor MCP"
4. 생성 버튼 클릭
5. 생성된 토큰을 안전한 곳에 복사해 보관

### Confluence API 토큰

- Jira와 동일한 Atlassian 계정을 사용하는 경우 같은 API 토큰을 사용할 수 있음
- 별도 계정인 경우 동일한 방법으로 토큰을 생성함

## Cursor 설정 방법

### 프로젝트별 설정 (.cursor-workspace)

- 프로젝트 루트 디렉토리에 `.cursor-workspace` 파일을 생성함

```json
{
  "languageServer": {
    "command": "serena",
    "args": ["start-mcp-server"]
  },
  "mcpServers": {
    "atlassian-mcp": {
      "name": "Atlassian",
      "type": "command",
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "JIRA_URL=https://yourcompany.atlassian.net",
        "-e",
        "JIRA_USERNAME=your.email@company.com",
        "-e",
        "JIRA_API_TOKEN=your_api_token_here",
        "-e",
        "CONFLUENCE_URL=https://yourcompany.atlassian.net",
        "-e",
        "CONFLUENCE_USERNAME=your.email@company.com",
        "-e",
        "CONFLUENCE_API_TOKEN=your_api_token_here",
        "ghcr.io/sooperset/mcp-atlassian:latest"
      ]
    }
  }
}
```

- 장점
  - 프로젝트마다 다른 Jira 프로젝트나 Confluence 스페이스를 사용하는 경우 유용함
  - 팀원들과 설정을 공유할 수 있음 (API 토큰은 환경변수로 분리 권장)
  - 버전 관리에 포함할 수 있음 (단, `.gitignore`에 추가해 토큰 노출 방지 필수)

### 전역 설정 (~/.cursor/mcp.json)

- 홈 디렉토리의 `.cursor/mcp.json` 파일에 설정을 추가함

```json
{
  "mcpServers": {
    "atlassian-mcp": {
      "name": "Atlassian",
      "type": "command",
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "JIRA_URL=https://yourcompany.atlassian.net",
        "-e",
        "JIRA_USERNAME=your.email@company.com",
        "-e",
        "JIRA_API_TOKEN=your_api_token_here",
        "-e",
        "CONFLUENCE_URL=https://yourcompany.atlassian.net",
        "-e",
        "CONFLUENCE_USERNAME=your.email@company.com",
        "-e",
        "CONFLUENCE_API_TOKEN=your_api_token_here",
        "ghcr.io/sooperset/mcp-atlassian:latest"
      ]
    }
  }
}
```

- 장점
  - 모든 Cursor 프로젝트에서 동일한 Jira/Confluence 설정을 사용할 수 있음
  - 프로젝트별로 설정 파일을 생성할 필요가 없음
  - 개인 계정 정보를 프로젝트 파일과 분리해 관리할 수 있음

### 환경 변수 설정

- 실제 값으로 다음 항목들을 교체해야 함

    - `JIRA_URL`
    - Jira 인스턴스 URL
    - ex) `https://yourcompany.atlassian.net`
    - `JIRA_USERNAME`
    - Jira 로그인에 사용하는 이메일 주소
    - ex) `mxxikr@example.com`
    - `JIRA_API_TOKEN`
    - 앞서 생성한 API 토큰
    - `CONFLUENCE_URL`
    - Confluence 인스턴스 URL
    - 보통 Jira URL과 동일함
    - `CONFLUENCE_USERNAME`
    - Confluence 로그인에 사용하는 이메일 주소
    - `CONFLUENCE_API_TOKEN`
    - Confluence API 토큰 (Jira와 동일한 토큰 사용 가능)

## Docker 이미지 준비

- MCP 서버 Docker 이미지를 미리 다운로드함

    ```bash
    docker pull ghcr.io/sooperset/mcp-atlassian:latest
    ```

- 다운로드가 완료되면 이미지 목록에서 확인할 수 있음

    ```bash
    docker images | grep mcp-atlassian
    ```

## 연결 테스트

### MCP 서버 수동 테스트

- Cursor 설정 전에 Docker 컨테이너가 정상적으로 실행되는지 확인함

    ```bash
    docker run --rm -i \
    -e JIRA_URL=https://yourcompany.atlassian.net \
    -e JIRA_USERNAME=your.email@company.com \
    -e JIRA_API_TOKEN=your_api_token_here \
    ghcr.io/sooperset/mcp-atlassian:latest
    ```

### Jira API 직접 테스트

- curl을 사용해 Jira API가 정상적으로 응답하는지 확인함

    ```bash
    curl -u "your.email@company.com:your_api_token_here" \
    -X GET \
    -H "Content-Type: application/json" \
    "https://yourcompany.atlassian.net/rest/api/3/search?jql=assignee%20%3D%20currentUser()&maxResults=5"
    ```

- 정상적으로 연결되면 JSON 형식의 응답이 반환됨

## Cursor 재시작 및 활성화 확인

- 설정 완료 후 Cursor를 완전히 재시작해야 MCP 서버가 활성화됨

    1. Cursor 완전 종료
    2. Cursor 재시작
    3. 우측 하단 상태바에서 MCP 서버 연결 상태 확인
    4. Cursor의 AI 채팅에서 "내가 할당된 Jira 티켓 5개만 보여줘"와 같은 명령어로 테스트

## 사용 가능한 기능

### Jira 기능

- **티켓 검색 및 조회**
  - JQL 쿼리를 사용한 티켓 검색
  - 특정 티켓의 상세 정보 조회
  - 할당된 티켓, 보고한 티켓 등 조회
- **티켓 생성 및 수정**
  - 새로운 이슈 생성
  - 기존 티켓의 제목, 설명, 상태 등 수정
  - 담당자 할당 및 변경
- **댓글 추가**
  - 티켓에 댓글 작성
  - 멘션을 포함한 댓글 작성
- **첨부파일 관리**
  - 티켓에 파일 첨부
  - 첨부파일 다운로드
- **보드 및 스프린트 관리**
  - 스프린트 목록 조회
  - 보드 내 티켓 이동
  - 스프린트 생성 및 관리

### Confluence 기능

- **페이지 검색 및 조회**
  - 키워드 기반 페이지 검색
  - CQL 쿼리를 사용한 고급 검색
  - 페이지 내용 전문 조회
- **페이지 생성 및 수정**
  - 새로운 Confluence 페이지 생성
  - 기존 페이지 내용 수정
  - Markdown 형식으로 페이지 작성
- **댓글 관리**
  - 페이지에 댓글 추가
  - 댓글 조회 및 수정
- **첨부파일 관리**
  - 페이지에 파일 첨부
  - 첨부파일 목록 조회


## Cursor에서 활용 예시

### 티켓 조회하기


```
내가 할당된 Jira 티켓 중 우선순위가 High인 것만 보여줘
```

```
PROJ 프로젝트에서 지난주에 생성된 티켓 목록 보여줘
```

### 티켓 생성하기

```
PROJ 프로젝트에 "로그인 기능 버그 수정" 제목으로 버그 티켓 생성해줘
```

### Confluence 페이지 검색

```
"API 문서"라는 키워드로 Confluence 페이지 검색해줘
```

```
DEV 스페이스에서 최근 일주일간 수정된 페이지 목록 보여줘
```

## Trouble Shooting

### MCP 서버가 활성화되지 않는 경우

- Cursor 완전 재시작
  - Cmd + Q (macOS) 또는 Ctrl + Q (Windows/Linux)로 완전 종료 후 재시작
- Docker 이미지 다운로드 확인
  - `docker images | grep mcp-atlassian` 실행
- JSON 형식 검증
  - [JSONLint](https://jsonlint.com/)에서 설정 파일 검증
- 전역 설정 파일 경로 확인
  - macOS/Linux: `~/.cursor/mcp.json`
  - Windows: `%USERPROFILE%\.cursor\mcp.json`

### 인증 오류

- API 토큰 유효성 확인
  - Atlassian 계정 관리 페이지에서 토큰 상태 확인
  - 필요시 토큰 재생성
- 사용자 이메일 주소 정확성 확인
  - Jira/Confluence 로그인 이메일과 일치해야 함
- URL 형식 확인
  - `https://` 포함 여부 확인
  - 끝에 `/` 제거

### 권한 오류

- Jira/Confluence 계정 권한 확인
  - 프로젝트 접근 권한 확인
  - 스페이스 읽기/쓰기 권한 확인
- 조직 정책 확인
  - API 접근이 제한되어 있지 않은지 확인

### 네트워크 오류

- 방화벽 설정 확인
  - Docker가 외부 네트워크에 접근할 수 있는지 확인
- 프록시 설정 확인
  - 회사 네트워크에서 프록시를 사용하는 경우 Docker 프록시 설정 필요
- VPN 연결 확인
  - 회사 VPN에 연결되어 있는지 확인

### JSON 형식 오류

- 따옴표 누락 또는 잘못된 형식 확인
  - 모든 문자열 값은 큰따옴표(`"`)로 감싸야 함
- 쉼표 누락 또는 불필요한 쉼표 확인
  - 배열의 마지막 항목 뒤에는 쉼표를 붙이지 않음
- JSON 유효성 검사 실행
  - 온라인 JSON 검증 도구 활용
- 백업 파일에서 복원
  - 설정 파일 수정 전 백업 생성 권장

## 보안 고려사항

### API 토큰 보안

- API 토큰을 안전하게 보관
  - 토큰을 코드나 문서에 직접 포함하지 않음
  - 비밀번호 관리자 사용 권장
- `.cursor-workspace` 파일을 버전 관리에서 제외
  - `.gitignore`에 `.cursor-workspace` 추가
  - 환경변수나 별도 설정 파일로 토큰 관리
- 정기적인 토큰 갱신
  - 3-6개월마다 토큰 재생성 권장
  - 퇴사하는 팀원의 토큰 즉시 폐기
- 전역 설정 파일 권한 설정
  - macOS/Linux: `chmod 600 ~/.cursor/mcp.json`
  - 다른 사용자가 파일을 읽을 수 없도록 설정

### 최소 권한 원칙

- 필요한 프로젝트와 스페이스에 대한 권한만 부여
- 읽기 전용 작업이 많다면 읽기 전용 권한 사용 고려
- 정기적으로 권한 검토 및 최소화

## Reference

- [Atlassian API 문서](https://developer.atlassian.com/)
- [MCP 프로토콜 문서](https://modelcontextprotocol.io/)
- [Cursor MCP 가이드](https://docs.cursor.com/mcp)
- [mcp-atlassian GitHub](https://github.com/sooperset/mcp-atlassian)