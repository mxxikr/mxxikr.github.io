---
title: "MCP(Model Context Protocol)란?"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-10-31 09:00:00 +0900
category:
  - [AI, MCP]
tags:
  - [mcp, ai]
math: false
mermaid: true
---

## 개요

- MCP(Model Context Protocol)는 AI 모델이 다양한 데이터 소스나 도구, 외부 시스템과 실시간으로 연결되어 정보를 주고받을 수 있게 만드는 표준 연결 프로토콜임
- AI가 단순히 답변만 하는 것이 아니라 실제 데이터베이스 접근, 문서 변경, 이메일 전송 등 실제 행동까지 할 수 있는 진정한 AI 에이전트로 발전할 수 있게 함
- 컴퓨터 통신에서의 HTTP 역할을 AI 분야에서 표준화한 것으로 이해할 수 있음
- 기존의 개별 API 연동 방식보다 더 범용적이고 지속적인 연결과 작업을 가능하게 함

## MCP의 개념과 역할

### AI 에이전트의 진화

- 과거의 AI 챗봇은 사용자의 질문에 답변만 제공했음

    ```
    사용자: "내일 회의 일정 알려줘"
    기존 AI: "죄송하지만 캘린더 접근 권한이 없습니다"
    ```

- MCP가 적용된 AI는 실제 행동을 수행할 수 있음

    ```
    사용자: "내일 회의 일정 알려줘"
    MCP AI: "내일 오전 10시 팀 미팅, 오후 2시 고객 미팅이 있습니다"
    사용자: "팀 미팅 30분 앞당겨줘"
    MCP AI: "팀 미팅을 오전 9시 30분으로 변경했습니다"
    ```

### USB-C와 같은 표준 연결 프로토콜

- MCP는 USB-C처럼 다양한 외부 시스템, 도구, 데이터와 AI 모델을 표준화된 방식으로 연결시켜줌

![image](assets/img/ai/image.png)

- **표준화된 연결**
  - USB-C 하나로 모니터, 키보드, 저장장치를 연결하듯 MCP 하나로 다양한 시스템 연결
- **양방향 통신**
  - USB-C가 데이터와 전력을 양방향으로 전송하듯 MCP도 AI와 외부 시스템 간 양방향 정보 교환
- **확장성**
  - USB-C 호환 기기가 계속 늘어나듯 MCP 서버도 지속적으로 확장 가능

### 오픈 표준 기반

- MCP는 오픈 표준(open standard) 기반이므로 여러 AI 모델과 애플리케이션에서 자유롭게 사용할 수 있음
- 특정 회사나 플랫폼에 종속되지 않고 누구나 MCP 서버를 개발하고 배포할 수 있음
- GitHub에 공개된 수많은 MCP 서버 예제와 커뮤니티 기여를 활용할 수 있음

## MCP의 주요 구성요소

![image](assets/img/ai/image1.png)

### 호스트 (Host)

- AI 애플리케이션의 컨테이너 및 관리자 역할을 수행함
- 여러 MCP 클라이언트 인스턴스를 생성하고 관리함
- 보안 정책을 설정하고 권한을 제어함
- ex) Claude Desktop, Cursor IDE, Zed Editor

```
호스트 (Claude Desktop)
├── MCP 클라이언트 1: 파일 시스템 접근
├── MCP 클라이언트 2: 데이터베이스 연결
└── MCP 클라이언트 3: 외부 API 호출
```

- 보안 정책
  - 파일 읽기: 허용
  - 파일 쓰기: 승인 필요
  - 데이터베이스 쓰기: 제한
    
### MCP 클라이언트 (Client)

- 호스트 내에 생성되어 MCP 서버와 연결을 담당함
- 프로토콜 협상 및 메시지 라우팅을 수행함
- 서버로부터 받은 응답을 호스트(AI 모델)에게 전달함
- 통신 흐름
  - AI 모델이 "파일 목록 보여줘" 요청
  - MCP 클라이언트가 요청을 파싱
  - 적절한 MCP 서버에 요청 전달
  - 서버 응답을 받아 AI 모델에게 전달
  - AI 모델이 사용자에게 결과 제공


### MCP 서버 (Server)

- 실제 데이터와 도구 기능을 제공함
- 클라이언트 요청에 따라 정보를 반환하고 작업을 수행함
- 독립적으로 실행되며 여러 클라이언트가 동시에 연결 가능함
- 크게 세 가지 기능을 제공함
  - **Resources**
    - 데이터 조회 (파일 읽기, 데이터베이스 쿼리 등)
  - **Tools**
    - 작업 수행 (파일 쓰기, 이메일 전송 등)
  - **Prompts**
    - 템플릿 제공 (자주 사용하는 명령어 패턴 등)

```python
class FileSystemMCPServer:
    def list_resources(self):
        return ["file:///workspace/README.md", "file:///workspace/src/main.py"]
    
    def read_resource(self, uri):
        return open(uri.path).read()
    
    def list_tools(self):
        return ["write_file", "delete_file", "create_directory"]
    
    def execute_tool(self, tool_name, arguments):
        if tool_name == "write_file":
            return self.write_file(**arguments)
```

## MCP와 기존 API 방식의 차이

### 기존 API 연동 방식

```javascript
// 각 서비스마다 개별 API 연동 필요
const googleCalendar = new GoogleCalendarAPI(credentials);
const slack = new SlackAPI(token);
const notion = new NotionAPI(apiKey);

// AI가 각 API 사용법을 개별적으로 학습해야 함
function addCalendarEvent() {
  // Google Calendar 전용 로직
}

function sendSlackMessage() {
  // Slack 전용 로직
}
```

### MCP 방식

```javascript
// MCP 클라이언트 하나로 모든 서버 접근
const mcpClient = new MCPClient();

// 표준화된 인터페이스
await mcpClient.callTool("calendar_server", "add_event", {
  title: "팀 미팅",
  time: "2025-11-01 10:00"
});

await mcpClient.callTool("slack_server", "send_message", {
  channel: "general",
  text: "회의 시작합니다"
});
```

### 주요 차이점

| 구분 | 기존 API | MCP |
|------|---------|-----|
| **연결 방식** | 각 API마다 개별 연동 | 표준화된 단일 프로토콜 |
| **학습 비용** | 서비스마다 새로운 API 학습 | 한 번 배우면 모든 서버 사용 |
| **유지보수** | API 변경 시 코드 수정 | 서버만 업데이트하면 됨 |
| **확장성** | 새 서비스 추가 시 전체 재작업 | 새 MCP 서버만 추가 |
| **컨텍스트 유지** | 요청마다 컨텍스트 재전송 | 지속적인 연결로 컨텍스트 유지 |

## 실제 활용 사례

### 업무 자동화

```
사용자: "다음 주 월요일 오전 10시에 팀 회의 잡아줘"
AI: Google Calendar MCP 서버를 통해 일정 등록
     → "다음 주 월요일 오전 10시에 팀 회의가 등록되었습니다"

사용자: "그 시간에 회의실 예약도 해줘"
AI: 회의실 관리 MCP 서버 호출
     → "회의실 A가 예약되었습니다"
```

```
사용자: "오늘 회의 내용을 Notion에 정리해줘"
AI: 1. 회의 녹음 파일을 MCP 파일 서버에서 읽음
    2. 내용을 분석하고 요약
    3. Notion MCP 서버를 통해 페이지 생성
    4. Slack MCP 서버로 팀원들에게 공유
```

### 데이터 분석

```
사용자: "지난달 매출 TOP 10 제품 알려줘"
AI: PostgreSQL MCP 서버를 통해 쿼리 실행
    SELECT product_name, SUM(amount) as total
    FROM sales
    WHERE date >= '2025-10-01' AND date < '2025-11-01'
    GROUP BY product_name
    ORDER BY total DESC
    LIMIT 10
    
    → 결과를 자연어로 설명하고 시각화
```

```
사용자: "이번 분기 실적 리포트 만들어줘"
AI: 1. 데이터베이스에서 분기별 데이터 조회
    2. Excel 파일 생성 (MCP 파일 서버)
    3. 차트 이미지 생성
    4. Confluence 페이지로 리포트 작성
    5. 관계자들에게 이메일 발송
```

### 개발 워크플로우

```
사용자: "PROJ-123 티켓의 PR 리뷰해줘"
AI: 1. Jira MCP 서버에서 티켓 내용 조회
    2. GitHub MCP 서버에서 PR 코드 분석
    3. 코딩 컨벤션 체크
    4. 리뷰 코멘트 자동 작성
    5. Slack으로 개발자에게 알림
```

```
사용자: "이 에러 로그 분석해서 Jira 티켓 만들어줘"
AI: 1. 파일 시스템에서 에러 로그 읽기
    2. 스택 트레이스 분석
    3. 유사한 과거 이슈 검색
    4. Jira에 버그 티켓 자동 생성
    5. 담당자 자동 할당
```

## MCP 서버의 종류와 범위

### 서버 등록 범위

- MCP 서버는 세 가지 범위로 등록할 수 있음
  - **Local (로컬)**
    - 현재 프로젝트 디렉토리에만 적용됨
    - 프로젝트별로 다른 설정 사용 가능
    - `.mcp.json` 파일로 관리
  - **Project (프로젝트)**
    - 워크스페이스 전체에 적용됨
    - 팀원들과 설정 공유 가능
    - `.vscode/mcp.json` 또는 `.cursor/mcp.json`으로 관리
  - **User (사용자)**
    - 사용자의 모든 프로젝트에서 사용 가능
    - 개인 설정 및 인증 정보 포함
    - `~/.config/mcp/servers.json`으로 관리

```json
{
  "mcpServers": {
    "project-db": {
      "command": "node",
      "args": ["./mcp-servers/database.js"]
    }
  }
}
```

### 통신 방식

- **표준 입출력 (stdio)**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["--root", "/Users/username/workspace"]
    }
  }
}
```

- **HTTP/WebSocket**

```json
{
  "mcpServers": {
    "remote-api": {
      "url": "https://api.example.com/mcp",
      "auth": {
        "type": "bearer",
        "token": "your-token-here"
      }
    }
  }
}
```