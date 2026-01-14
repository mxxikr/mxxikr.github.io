---
title: "[모든 개발자를 위한 HTTP 웹 기본 지식] URI와 웹 브라우저 요청 흐름"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-14 16:19:00 +0900
category:
  - [Computer Science, Web]
tags: [http, uri, url, urn, web, browser, request, dns]
math: false
mermaid: true
---

# URI와 웹 브라우저 요청 흐름

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 웹 브라우저에 URL을 입력했을 때 일어나는 전체 과정을 이해하기 위해 URI 구조와 HTTP 요청 흐름을 정리함

<br/><br/>

## URI, URL, URN 개념

### URI란?

- **URI (Uniform Resource Identifier)**
  - 리소스를 식별하는 통일된 방식

![URI 구조](/assets/img/posts/http-uri-web-request-flow/01_uri_structure.png)

### 용어 정의

| 용어           | 의미        | 설명                                     |
| -------------- | ----------- | ---------------------------------------- |
| **Uniform**    | 통일된      | 리소스를 식별하는 통일된 방식            |
| **Resource**   | 자원        | URI로 식별할 수 있는 모든 것 (제한 없음) |
| **Identifier** | 식별자      | 다른 항목과 구분하는데 필요한 정보       |
| **Locator**    | 위치 지정자 | 리소스가 있는 위치를 지정                |
| **Name**       | 이름        | 리소스에 이름을 부여                     |

### URL과 URN 비교

| 구분          | URL                           | URN                     |
| ------------- | ----------------------------- | ----------------------- |
| **식별 방법** | 위치로 식별                   | 이름으로 식별           |
| **예시**      | https://www.google.com/search | urn:isbn:8960777331     |
| **특징**      | 위치가 변하면 찾을 수 없음    | 이름은 변하지 않음      |
| **실용성**    | 보편적으로 사용               | 실제 리소스 찾기 어려움 |

### URI 구조 예시

```
foo://example.com:8042/over/there?name=ferret#nose
\_/   \______________/\_________/ \_________/ \__/
 |           |            |            |        |
scheme   authority      path        query   fragment
```

- scheme
  - foo
- authority
  - example.com:8042
- path
  - /over/there
- query
  - name=ferret
- fragment
  - nose

<br/><br/>

## URL 문법 상세 분석

### URL 전체 문법

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
```

- **예시 URL 분석**

  ```
  https://www.google.com:443/search?q=hello&hl=ko
  ```

  ![URL 구조](/assets/img/posts/http-uri-web-request-flow/02_url_structure.png)

### Scheme (프로토콜)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://www.google.com:443/search?q=hello&hl=ko
^^^^^
```

- **역할**
  - 어떤 방식으로 자원에 접근할 것인가 하는 약속 규칙

| 프로토콜   | 기본 PORT | 설명                        |
| ---------- | --------- | --------------------------- |
| **http**   | 80        | HyperText Transfer Protocol |
| **https**  | 443       | HTTP Secure (보안 강화)     |
| **ftp**    | 21        | File Transfer Protocol      |
| **mailto** | -         | 이메일                      |
| **file**   | -         | 로컬 파일                   |

- **특징**
  - 프로토콜을 반드시 명시해야 함
  - http는 80 포트, https는 443 포트를 주로 사용
  - 기본 포트는 생략 가능
  - https = http + 보안(암호화)

### Userinfo (사용자 정보)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://username:password@www.google.com
        ^^^^^^^^^^^^^^^^^^
```

- **역할**
  - URL에 사용자 정보를 포함해서 인증
- **사용 현황**
  - 거의 사용하지 않음 (보안상 위험)

### Host (호스트명)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://www.google.com:443/search?q=hello&hl=ko
        ^^^^^^^^^^^^^^
```

- **역할**
  - 서버의 위치를 나타냄
- **형식**
  - 도메인명 - www.google.com, naver.com
  - IP 주소 - 200.200.200.2, 192.168.0.1

### Port (포트 번호)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://www.google.com:443/search?q=hello&hl=ko
                       ^^^^
```

- **역할**
  - 접속 포트 (어떤 애플리케이션으로 접근할지)
- **생략 규칙**
  - http → 80 포트 (생략 가능)
  - https → 443 포트 (생략 가능)
  - 그 외 포트는 명시 필요

![포트 생략 규칙](/assets/img/posts/http-uri-web-request-flow/03_port_rules.png)

### Path (경로)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://www.google.com:443/search?q=hello&hl=ko
                           ^^^^^^^
```

- **역할**
  - 리소스 경로, 계층적 구조
- **예시**
  - `/home/file1.jpg` (파일)
  - `/members` (컬렉션)
  - `/members/100` (특정 회원)
  - `/items/iphone12` (특정 상품)
  - `/api/v1/users/123` (REST API)

![Path 계층 구조](/assets/img/posts/http-uri-web-request-flow/04_path_hierarchy.png)

### Query (쿼리 파라미터)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://www.google.com:443/search?q=hello&hl=ko
                                  ^^^^^^^^^^^^^
```

- **역할**
  - 웹 서버에 제공하는 파라미터
- **형식**
  - `key=value` 형태
  - `?`로 시작
  - `&`로 추가
  - ex) `?keyA=valueA&keyB=valueB&keyC=valueC`
- **별칭**
  - Query Parameter
  - Query String
- **특징**
  - 문자 형태로 전송
  - 웹 서버에 데이터 전달
  - 검색, 필터링, 정렬 등에 사용

**실제 예시**

```
https://www.google.com/search?q=hello&hl=ko
→ q=hello (검색어)
→ hl=ko (언어: 한국어)

https://www.youtube.com/results?search_query=music&sp=CAI%253D
→ search_query=music (검색어: music)
→ sp=CAI%253D (필터 옵션)
```

### Fragment (프래그먼트)

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://docs.spring.io/spring-boot/docs/current/reference/html/
getting-started.html#getting-started-introducing-spring-boot
                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

- **역할**
  - HTML 내부 북마크 (앵커)
- **특징**
  - HTML 문서 내 특정 위치로 이동
  - **서버에 전송되지 않음** (클라이언트에서만 사용)
  - 페이지 내 네비게이션에 사용

<br/><br/>

## 웹 브라우저 요청 흐름

### 전체 흐름 개요

![웹 브라우저 요청 흐름](/assets/img/posts/http-uri-web-request-flow/05_complete_flow.png)

### DNS 조회 및 포트 확인

![DNS 조회 및 포트 확인](/assets/img/posts/http-uri-web-request-flow/06_dns_port.png)

- **정보 추출**

  - 도메인명
    - www.google.com → DNS 조회 필요
  - IP 주소
    - 200.200.200.2 (DNS 조회 결과)
  - 프로토콜
    - https
  - 포트
    - 443 (https 기본 포트, 생략됨)

### HTTP 요청 메시지 생성

```
GET /search?q=hello&hl=ko HTTP/1.1
Host: www.google.com
```

![HTTP 요청 메시지 구조](/assets/img/posts/http-uri-web-request-flow/07_http_request.png)

| 요소             | 내용                               |
| ---------------- | ---------------------------------- |
| **Request Line** | GET /search?q=hello&hl=ko HTTP/1.1 |
| **메서드**       | GET (데이터 조회)                  |
| **경로**         | /search?q=hello&hl=ko              |
| **HTTP 버전**    | HTTP/1.1                           |
| **헤더**         | Host: www.google.com               |

### SOCKET 라이브러리를 통한 전달

![SOCKET 라이브러리를 통한 전달](/assets/img/posts/http-uri-web-request-flow/08_socket_transmission.png)

- **전송 과정**

  1. 웹 브라우저가 HTTP 메시지 생성
  2. SOCKET 라이브러리를 통해 OS에 전달
  3. TCP/IP 연결 (IP, PORT)
  4. 데이터 전달
  5. TCP/IP 패킷 생성, HTTP 메시지 포함
  6. LAN 카드를 통해 네트워크로 전송

### TCP/IP 패킷 생성

![TCP/IP 패킷 구조](/assets/img/posts/http-uri-web-request-flow/09_tcpip_packet.png)

### 요청 패킷 전달

![요청 패킷 전달](/assets/img/posts/http-uri-web-request-flow/10_packet_delivery.png)

- **패킷 이동 과정**

  1. 클라이언트 → 인터넷 노드들 → 서버
  2. 각 노드는 목적지 IP를 보고 라우팅
  3. 최종적으로 구글 서버(200.200.200.2)에 도착

### 서버에서 HTTP 메시지 해석

![서버에서 HTTP 메시지 해석](/assets/img/posts/http-uri-web-request-flow/11_message_interpretation.png)

### HTTP 응답 메시지 생성

```
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
Content-Length: 3423

<html>
  <body>...</body>
</html>
```

![HTTP 응답 메시지 구조](/assets/img/posts/http-uri-web-request-flow/12_http_response.png)

| 요소            | 내용                            |
| --------------- | ------------------------------- |
| **Status Line** | HTTP/1.1 200 OK                 |
| **HTTP 버전**   | HTTP/1.1                        |
| **상태 코드**   | 200 (성공)                      |
| **상태 메시지** | OK                              |
| **헤더**        | Content-Type, Content-Length 등 |
| **바디**        | HTML 문서                       |

### 응답 패킷 전달

![응답 패킷 전달](/assets/img/posts/http-uri-web-request-flow/13_response_delivery.png)

### HTML 렌더링

![HTML 렌더링 과정](/assets/img/posts/http-uri-web-request-flow/14_html_rendering.png)

- **렌더링 과정**

  1. HTML 파싱 → DOM 트리 생성
  2. CSS 파싱 → CSSOM 트리 생성
  3. DOM + CSSOM → 렌더링 트리 생성
  4. 레이아웃 계산 (위치, 크기)
  5. 페인트 (실제 픽셀 그리기)
  6. 화면에 표시

<br/><br/>

## 요약 정리

### URI, URL, URN

![URI, URL, URN 개념 마인드맵](/assets/img/posts/http-uri-web-request-flow/15_uri_mindmap.png)

### URL 구성 요소

| 순서 | 요소     | 필수 | 예시           | 설명                          |
| ---- | -------- | ---- | -------------- | ----------------------------- |
| 1    | scheme   | 필수 | https          | 프로토콜                      |
| 2    | userinfo | 선택 | user:pass@     | 사용자 정보 (거의 사용 안 함) |
| 3    | host     | 필수 | www.google.com | 호스트명 또는 IP              |
| 4    | port     | 조건 | :443           | 포트 (기본값 생략 가능)       |
| 5    | path     | 조건 | /search        | 리소스 경로                   |
| 6    | query    | 선택 | ?q=hello&hl=ko | 쿼리 파라미터                 |
| 7    | fragment | 선택 | #section1      | HTML 내부 북마크              |

### 웹 브라우저 요청 흐름

![웹 브라우저 요청 흐름 요약](/assets/img/posts/http-uri-web-request-flow/16_flow_summary.png)

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
