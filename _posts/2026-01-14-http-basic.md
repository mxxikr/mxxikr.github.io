---
title: "[모든 개발자를 위한 HTTP 웹 기본 지식] HTTP 기본"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-14 16:23:00 +0900
category:
  - [Computer Science, Web]
tags: [http, web, stateless, connectionless, request, response, api]
math: false
mermaid: true
---

# HTTP

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 HTTP 프로토콜의 특징과 구조, Stateless와 Connectionless 개념, HTTP 메시지 구조를 정리함

<br/><br/>

## HTTP 개념

### HTTP란?

- **HTTP (HyperText Transfer Protocol)**
  - 거의 모든 형태의 데이터 전송 가능

![Diagram 01](/assets/img/posts/http-basic/01_diagram.png)

- **HTTP 전송 가능 데이터**

  - HTML, TEXT
  - IMAGE, 음성, 영상, 파일
  - JSON, XML (API)
  - 거의 모든 형태의 데이터 전송 가능
  - 서버간 통신도 HTTP 사용

### HTTP 역사

![Diagram 02](/assets/img/posts/http-basic/02_diagram.png)

### 버전별 특징

| HTTP 버전    | 전송 계층  | 특징                           |
| ------------ | ---------- | ------------------------------ |
| **HTTP/1.1** | TCP        | 가장 많이 사용, 기본 기능 완성 |
| **HTTP/2**   | TCP        | 성능 개선, 대부분의 기능 호환  |
| **HTTP/3**   | UDP (QUIC) | 속도 향상, 연결 개선           |

<br/><br/>

## 클라이언트-서버 구조

### Request-Response 구조

![Diagram 03](/assets/img/posts/http-basic/03_diagram.png)

### 역할 분리

![Diagram 04](/assets/img/posts/http-basic/04_diagram.png)

- 각자 독립적으로 발전 가능
- 클라이언트는 UI/UX에 집중
- 서버는 비즈니스 로직과 데이터에 집중

<br/><br/>

## Stateful과 Stateless

### 기본 개념

- **Stateful (상태 유지)**
  - 서버가 클라이언트의 상태를 보관
- **Stateless (무상태)**
  - 서버가 클라이언트의 상태를 보관하지 않음

![Diagram 05](/assets/img/posts/http-basic/05_diagram.png)

### Stateful - 상태 유지

- 정상 동작

  ![Diagram 06](/assets/img/posts/http-basic/06_diagram.png)

- 서버 장애 발생 시 (중간에 서버 변경)

  ![Diagram 07](/assets/img/posts/http-basic/07_diagram.png)

### Stateless - 무상태

- 서버 변경에도 정상 동작

  ![Diagram 08](/assets/img/posts/http-basic/08_diagram.png)

### Stateful과 Stateless 비교

![Diagram 09](/assets/img/posts/http-basic/09_diagram.png)

|                   | Stateful       | Stateless             |
| ----------------- | -------------- | --------------------- |
| **상태 보관**     | 서버가 보관    | 서버가 보관하지 않음  |
| **서버 선택**     | 항상 같은 서버 | 아무 서버나 가능      |
| **서버 확장**     | 어려움         | 쉬움 (무한 확장)      |
| **장애 대응**     | 어려움         | 쉬움                  |
| **데이터 전송량** | 적음           | 많음 (추가 정보 전달) |

### Stateless - 무한 확장 가능 (스케일 아웃)

![Diagram 10](/assets/img/posts/http-basic/10_diagram.png)

- **Stateless 확장성**

  - 응답 서버를 쉽게 바꿀 수 있음
  - 서버를 무한히 증설할 수 있음
  - **스케일 아웃 가능** (수평 확장)

### Stateless 실무 설계

![Diagram 11](/assets/img/posts/http-basic/11_diagram.png)

- **Stateless 원칙**

  - 최대한 무상태로 설계
  - 불가피한 경우만 상태 유지

- **상태 유지가 필요한 경우**

  - 로그인
  - 장바구니
  - 사용자별 개인화 데이터

- **상태 관리 방법**

  - 브라우저 쿠키
  - 서버 세션
  - 토큰 방식 (JWT 등)

- 상태 유지는 최소한만 사용

<br/><br/>

## 비연결성 (Connectionless)

### 연결 유지 방식

![Diagram 12](/assets/img/posts/http-basic/12_diagram.png)

- **연결 유지의 문제점**

  - 서버는 연결을 계속 유지
  - 서버 자원 (메모리, CPU) 낭비
  - 동시 접속자 수가 많으면 문제 발생

### 비연결성 모델

![Diagram 13](/assets/img/posts/http-basic/13_diagram.png)

- **비연결성의 장점**

  - 응답 후 연결 종료
  - 서버 자원을 효율적으로 사용
  - 동시 접속자 수 증가에 유리

### 장단점

- **장점**

  - HTTP는 기본적으로 연결을 유지하지 않음
  - 서버 자원을 효율적으로 사용
  - 1시간에 수천명이 서비스를 사용해도 실제 서버에서 동시에 처리하는 요청은 소량
    - ex) 웹 브라우저에서 검색 버튼을 누르는 시간

- **단점**

  1. TCP/IP 연결을 새로 맺어야 함
  2. 3 way handshake 시간 추가
  3. 웹 브라우저로 사이트를 요청하면 HTML 외 JavaScript, CSS, 이미지 등 수많은 자원이 함께 다운로드

### HTTP 지속 연결 (Persistent Connections)

![Diagram 14](/assets/img/posts/http-basic/14_diagram.png)

**HTTP 지속 연결 장점**

- 한 번 맺은 연결 재사용 (연결 시간 절약)
- 여러 리소스를 효율적으로 다운로드
- HTTP/2, HTTP/3에서 더 많은 최적화

<br/><br/>

## HTTP 메시지

### HTTP 메시지 구조

![Diagram 15](/assets/img/posts/http-basic/15_diagram.png)

- **공식 스펙 (RFC 7230)**

  ```
  HTTP-message = start-line
              *( header-field CRLF )
              CRLF
              [ message-body ]
  ```

### HTTP 요청 메시지

```
GET /search?q=hello&hl=ko HTTP/1.1
Host: www.google.com
```

![Diagram 16](/assets/img/posts/http-basic/16_diagram.png)

### HTTP 응답 메시지

```
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
Content-Length: 3423

<html>
  <body>...</body>
</html>
```

![Diagram 17](/assets/img/posts/http-basic/17_diagram.png)

<br/><br/>

## 시작 라인 (Start Line)

### HTTP 메서드

|             | 용도             | 설명                                   |
| ----------- | ---------------- | -------------------------------------- |
| **GET**     | 리소스 조회      | 서버에 전달할 데이터는 쿼리 파라미터로 |
| **POST**    | 요청 데이터 처리 | 메시지 바디를 통해 서버로 데이터 전송, |
| **PUT**     | 리소스 대체      | 해당 리소스가 없으면 생성              |
| **PATCH**   | 리소스 부분 변경 | 리소스의 일부만 변경                   |
| **DELETE**  | 리소스 삭제      | 리소스를 제거                          |
| **HEAD**    | 메타데이터 조회  | GET과 동일하지만 body 없이 헤더만 조회 |
| **OPTIONS** | 통신 옵션 조회   | 대상 리소스의 통신 옵션 확인           |

![Diagram 18](/assets/img/posts/http-basic/18_diagram.png)

### HTTP 상태 코드

![Diagram 19](/assets/img/posts/http-basic/19_diagram.png)

|         |                       |                               |
| ------- | --------------------- | ----------------------------- |
| **200** | OK                    | 요청 성공                     |
| **201** | Created               | 요청 성공, 새로운 리소스 생성 |
| **400** | Bad Request           | 잘못된 요청                   |
| **401** | Unauthorized          | 인증 필요                     |
| **403** | Forbidden             | 권한 없음                     |
| **404** | Not Found             | 리소스를 찾을 수 없음         |
| **500** | Internal Server Error | 서버 내부 오류                |
| **503** | Service Unavailable   | 서비스 이용 불가              |

<br/><br/>

## HTTP 헤더 (Header)

### 분류

**HTTP 헤더 주요 유형**

![Diagram 20](/assets/img/posts/http-basic/20_diagram.png)

- **주요 헤더**

  |                    |                  |                             |
  | ------------------ | ---------------- | --------------------------- |
  | **Host**           | 요청 대상 호스트 | Host: www.google.com        |
  | **Content-Type**   | 표현 데이터 형식 | Content-Type: text/html     |
  | **Content-Length** | 표현 데이터 길이 | Content-Length: 3423        |
  | **User-Agent**     | 클라이언트 정보  | User-Agent: Mozilla/5.0     |
  | **Server**         | 서버 정보        | Server: Apache/2.4          |
  | **Authorization**  | 인증 정보        | Authorization: Bearer token |
  | **Cache-Control**  | 캐시 제어        | Cache-Control: no-cache     |

<br/><br/>

## 연습 문제

1. HTTP/1.1과 HTTP/2, HTTP/3의 주요 차이점을 가장 잘 설명한 것은 무엇일까요?

   a. 기본 기능 완성과 성능 개선

   - HTTP/1.1에서 대부분의 기본 기능이 확립되었고, HTTP/2와 HTTP/3는 주로 통신 성능을 향상시키는 데 중점을 둠

2. HTTP 클라이언트-서버 구조에서, 클라이언트와 서버의 역할을 분리함으로써 얻는 가장 큰 이점은 무엇일까요?

   a. 각자의 독립적 확장 및 진화 용이

   - 클라이언트는 UI/UX에, 서버는 비즈니스 로직과 데이터에만 집중하여 각자 독립적으로 발전시킬 수 있음

3. HTTP '무상태(Stateless)' 프로토콜이라는 것은 무엇을 의미하나요?

   a. 서버가 클라이언트의 상태를 별도로 유지하지 않음

   - Stateless는 서버가 클라이언트의 이전 요청 정보를 별도로 관리하거나 기억하지 않는다는 특성을 의미

4. HTTP의 무상태(Stateless) 방식이 서버 시스템 구조 설계에 주는 가장 큰 장점은 무엇일까요?

   a. 서버 확장 용이

   - 서버가 클라이언트 상태를 몰라도 되므로, 서버를 무한히 증설하고 유연하게 운영할 수 있음

5. HTTP 통신이 기본적으로 비연결성일 때 발생할 수 있는 성능상 단점을 보완하기 위해 주로 사용되는 방식은 무엇인가요?

   a. 지속 연결(Persistent Connections) 사용

   - 매 요청마다 연결을 새로 맺는 오버헤드를 줄이기 위해, 한 번 맺은 연결로 여러 요청과 응답을 처리하는 지속 연결을 사용

<br/><br/>

## 요약 정리

![Diagram 21](/assets/img/posts/http-basic/21_diagram.png)

1. **HTTP Stateless 프로토콜**

   - 서버가 클라이언트 상태를 보관하지 않음
   - 서버 확장성 높음
   - 데이터 전송량 증가

2. **HTTP 버전**

   - HTTP/1.1이 가장 많이 사용
   - HTTP/2는 성능 개선
   - HTTP/3는 UDP 기반

3. **HTTP 메시지 구조**

   - start-line (요청 라인 또는 상태 라인)
   - header (헤더)
   - empty line (공백 라인)
   - message body (메시지 바디)

4. **클라이언트-서버 구조**

   - Request-Response 패턴
   - 역할 분리로 독립적 발전

5. **비연결성**
   - 연결 유지 안 함
   - 서버 자원 효율적 사용

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
