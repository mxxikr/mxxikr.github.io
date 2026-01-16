---
title: "[모든 개발자를 위한 HTTP 웹 기본 지식] HTTP 헤더1 - 일반 헤더"
author: { name: mxxikr, link: "https://github.com/mxxikr" }
date: 2026-01-15 17:50:00 +0900
category: [Computer Science, Web]
tags: [http, header, content-type, content-negotiation, cookie, authentication]
math: false
mermaid: false
---

# HTTP 헤더1 - 일반 헤더

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 HTTP 헤더의 기본 구조와 용도, 표현 헤더(`Content-Type`, `Content-Encoding` 등), 협상(Content Negotiation), 전송 방식, 일반 정보 헤더, 인증 헤더, 쿠키의 동작 방식과 보안 속성을 정리함

<br/><br/>

## HTTP 헤더 개요

### HTTP 헤더 기본 구조

```http
GET /search?q=hello&hl=ko HTTP/1.1
Host: www.google.com
```

```http
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
Content-Length: 3423

<html>
  <body>...</body>
</html>
```

### 헤더 형식

```
header-field = field-name ":" OWS field-value OWS
```

- **OWS**
  - 띄어쓰기 허용
- **field-name**
  - 대소문자 구분 없음

### HTTP 헤더 용도

- **HTTP 전송에 필요한 모든 부가정보 포함**

  - 메시지 바디의 내용, 크기, 압축 방식
  - 인증, 클라이언트/서버 정보
  - 캐시 관리 정보

- **표준 헤더**

  - 매우 많음

- **커스텀 헤더**
  - 필요시 임의의 헤더 추가 가능

### RFC 표준의 변화

- **RFC2616 (1999년 - 폐기됨)**

  - 엔티티(Entity) 개념 사용
  - 메시지 본문 → 엔티티 본문

    ![RFC2616 엔티티 개념](/assets/img/http/rfc2616-entity.png)

- **RFC7230 (2014년 - 최신)**

  - 표현(Representation) 개념으로 변경
  - 메시지 본문 = 페이로드(payload)
  - 표현 = 표현 메타데이터 + 표현 데이터

    ![RFC7230 표현 개념](/assets/img/http/rfc7230-representation.png)

<br/><br/>

## 표현 헤더 (Representation Headers)

- **사용 위치**
  - 전송과 응답 모두에서 사용

### Content-Type

- **의미**

  - 표현 데이터의 형식 (미디어 타입, 문자 인코딩)

- **HTML 응답 예시**

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html;charset=UTF-8
  Content-Length: 3423

  <html>
    <body>...</body>
  </html>
  ```

- **JSON 응답 예시**

  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json
  Content-Length: 16

  {"data":"hello"}
  ```

- **주요 타입**
  - `text/html; charset=utf-8`
  - `application/json`
  - `image/png`

### Content-Encoding

- **의미**

  - 표현 데이터의 압축 방식

- **예시**

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html;charset=UTF-8
  Content-Encoding: gzip
  Content-Length: 521

  lkj123kljoiasudlkjaweioluywlnfdo912u34ljko98udjkl
  ```

- **동작 방식**

  1. 데이터 전달하는 곳에서 압축 후 인코딩 헤더 추가
  2. 데이터 읽는 쪽에서 인코딩 헤더 정보로 압축 해제

- **주요 압축 방식**
  - `gzip`
  - `deflate`
  - `identity` (압축 없음)

### Content-Language

- **의미**

  - 표현 데이터의 자연 언어

- **한국어 예시**

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html;charset=UTF-8
  Content-Language: ko
  Content-Length: 521

  <html>
  안녕하세요.
  </html>
  ```

- **영어 예시**

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html;charset=UTF-8
  Content-Language: en
  Content-Length: 521

  <html>
  hello
  </html>
  ```

- **주요 언어 코드**
  - `ko`
    - 한국어
  - `en`
    - 영어
  - `en-US`
    - 미국 영어

### Content-Length

- **의미**

  - 표현 데이터의 길이 (바이트 단위)

- **예시**

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html;charset=UTF-8
  Content-Length: 5

  hello
  ```

- **주의**
  - `Transfer-Encoding`(분할 전송)을 사용하면 `Content-Length`를 사용하면 안됨

<br/><br/>

## 협상 (Content Negotiation)

### 협상 개념

- **정의**

  - 클라이언트가 선호하는 표현 요청

- **사용 위치**
  - **요청 시에만 사용**

### 협상 헤더 종류

| 헤더              | 설명                              |
| ----------------- | --------------------------------- |
| `Accept`          | 클라이언트가 선호하는 미디어 타입 |
| `Accept-Charset`  | 클라이언트가 선호하는 문자 인코딩 |
| `Accept-Encoding` | 클라이언트가 선호하는 압축 인코딩 |
| `Accept-Language` | 클라이언트가 선호하는 자연 언어   |

### Accept-Language 기본 예시

![Accept-Language 기본 예시](/assets/img/http/accept-language-basic.png)

### Quality Values (q) 사용

```http
GET /event
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
```

- **우선순위 규칙**

  - Quality Values(q) 값 사용
  - 0~1 사이 값, 클수록 높은 우선순위
  - 생략하면 1

- **우선순위 순서**
  1. `ko-KR;q=1` (q 생략)
  2. `ko;q=0.9`
  3. `en-US;q=0.8`
  4. `en;q=0.7`

![Accept-Language Quality Values](/assets/img/http/accept-language-quality.png)

### 구체성 우선

- 구체적인 것이 우선

- **예시**

  ```http
  GET /event
  Accept: text/*, text/plain, text/plain;format=flowed, */*
  ```

- **우선순위**

  1. `text/plain;format=flowed`
  2. `text/plain`
  3. `text/*`
  4. `*/*`

- **구체적 기준 적용**

  ```http
  Accept: text/*;q=0.3, text/html;q=0.7, text/html;level=1,
          text/html;level=2;q=0.4, */*;q=0.5
  ```

  - **미디어 타입별 우선순위**

    | Media Type        | Quality Value |
    | ----------------- | ------------- |
    | text/html;level=1 | 1             |
    | text/html         | 0.7           |
    | text/plain        | 0.3           |
    | image/jpeg        | 0.5           |
    | text/html;level=2 | 0.4           |
    | text/html;level=3 | 0.7           |

<br/><br/>

## 전송 방식

### 단순 전송 (Content-Length)

```http
GET /event
```

```http
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
Content-Length: 3423

<html>
  <body>...</body>
</html>
```

### 압축 전송 (Content-Encoding)

```http
GET /event
```

```http
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
Content-Encoding: gzip
Content-Length: 521

lkj123kljoiasudlkjaweioluywlnfdo912u34ljko98udjkl
```

### 분할 전송 (Transfer-Encoding)

```http
GET /event
```

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Transfer-Encoding: chunked

5
Hello
5
World
0
\r\n
```

- **특징**
  - 청크 단위로 쪼개서 전송
  - `Content-Length`를 사용하면 안됨
  - 각 청크의 크기를 16진수로 표시

### 범위 전송 (Range, Content-Range)

```http
GET /event
Range: bytes=1001-2000
```

```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Range: bytes 1001-2000 / 2000

qweqwe1l2iu3019u2oehj1987askjh3q98y
```

- **사용 사례**
  - 큰 파일을 부분적으로 요청할 때

<br/><br/>

## 일반 정보 헤더

### From

- **의미**

  - 유저 에이전트의 이메일 정보

- **특징**
  - 일반적으로 잘 사용되지 않음
  - 검색 엔진에서 주로 사용
  - 요청에서 사용

### Referer

- **의미**

  - 이전 웹 페이지 주소

- **예시**

  ```http
  GET /search?q=hello
  Referer: https://www.google.com
  ```

- **특징**

  - 현재 요청된 페이지의 이전 웹 페이지 주소
  - A → B로 이동하는 경우 B 요청 시 `Referer: A` 포함
  - 유입 경로 분석 가능
  - 요청에서 사용

### User-Agent

- **의미**

  - 유저 에이전트 애플리케이션 정보

- **예시**

  ```http
  GET /search
  User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
              AppleWebKit/537.36 (KHTML, like Gecko)
              Chrome/86.0.4240.183 Safari/537.36
  ```

- **용도**
  - 클라이언트의 애플리케이션 정보 (웹 브라우저 정보 등)
  - 통계 정보 수집
  - 어떤 종류의 브라우저에서 장애가 발생하는지 파악
  - 요청에서 사용

### Server

- **의미**

  - 요청을 처리하는 ORIGIN 서버의 소프트웨어 정보

- **예시**

  ```http
  HTTP/1.1 200 OK
  Server: Apache/2.2.22 (Debian)
  ```

  ```http
  HTTP/1.1 200 OK
  Server: nginx
  ```

- **사용 위치**
  - 응답에서 사용

### Date

- **의미**

  - 메시지가 발생한 날짜와 시간

- **예시**

  ```http
  HTTP/1.1 200 OK
  Date: Tue, 15 Nov 1994 08:12:31 GMT
  ```

- **사용 위치**
  - 응답에서 사용

<br/><br/>

## 특별한 정보 헤더

### Host (필수)

- **의미**

  - 요청한 호스트 정보 (도메인)

- **예시**

  ```http
  GET /search?q=hello&hl=ko HTTP/1.1
  Host: www.google.com
  ```

#### Host 헤더가 필수인 이유

![가상 호스트](/assets/img/http/virtual-host.png)

- **가상 호스트**

  - 하나의 서버가 여러 도메인을 처리해야 할 때
  - 하나의 IP 주소에 여러 도메인이 적용되어 있을 때
  - 가상 호스트를 통해 여러 도메인을 한번에 처리
  - Host 헤더가 없으면 서버는 어느 도메인으로 처리해야 할지 알 수 없음

- **사용 예시**

  ```http
  GET /hello HTTP/1.1
  Host: aaa.com
  ```

### Location

- **의미**

  - 페이지 리다이렉션

- **예시**

  ```http
  HTTP/1.1 301 Moved Permanently
  Location: /new-event
  ```

- **용도**
  - **201 Created**
    - `Location` 값은 요청에 의해 생성된 리소스 `URI`
  - **3xx Redirection**
    - `Location` 값은 요청을 자동으로 리다이렉션하기 위한 대상 리소스

### Allow

- **의미**

  - 허용 가능한 HTTP 메서드

- **예시**

  ```http
  HTTP/1.1 405 Method Not Allowed
  Allow: GET, HEAD, PUT
  ```

- **특징**
  - 405 (Method Not Allowed) 응답에 포함해야 함

### Retry-After

- **의미**

  - 유저 에이전트가 다음 요청을 하기까지 기다려야 하는 시간

- **날짜 표기 예시**

  ```http
  HTTP/1.1 503 Service Unavailable
  Retry-After: Fri, 31 Dec 1999 23:59:59 GMT
  ```

- **초 단위 표기 예시**

  ```http
  HTTP/1.1 503 Service Unavailable
  Retry-After: 120
  ```

- **특징**
  - 503 (Service Unavailable) 응답에서 주로 사용
  - 날짜 표기 또는 초 단위 표기

<br/><br/>

## 인증 헤더

### Authorization

- **의미**

  - 클라이언트 인증 정보를 서버에 전달

- **Basic 인증 예시**

  ```http
  GET /admin/users HTTP/1.1
  Authorization: Basic xxxxxxxxxxxxxxxx
  ```

- **Bearer 인증 예시**

  ```http
  GET /api/data HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### WWW-Authenticate

- **의미**

  - 리소스 접근 시 필요한 인증 방법 정의

- **예시**

  ```http
  HTTP/1.1 401 Unauthorized
  WWW-Authenticate: Newauth realm="apps", type=1,
                    title="Login to \"apps\"",
                    Basic realm="simple"
  ```

- **특징**
  - 401 Unauthorized 응답과 함께 사용
  - 클라이언트에게 인증 방법을 알려줌

<br/><br/>

## 쿠키

### 쿠키의 필요성

- **HTTP는 Stateless 프로토콜**

  - 클라이언트와 서버가 요청과 응답을 주고 받으면 연결이 끊어짐
  - 서버는 이전 요청을 기억하지 못함
  - 상태를 유지하지 않음

- **쿠키 미사용 시 문제점**
  - 로그인 정보를 기억하지 못함
  - 모든 요청에 사용자 정보를 포함해야 함 (보안에 취약)
  - 브라우저 종료 후 정보 소실

### 쿠키 동작 방식

![쿠키 동작 방식](/assets/img/http/cookie-mechanism.png)

- **모든 요청에 자동 포함**
  - `Cookie` 헤더가 모든 HTTP 요청에 자동으로 포함됨

### 쿠키 기본 사용법

```http
HTTP/1.1 200 OK
Set-Cookie: sessionId=abcde1234; expires=Sat, 26-Dec-2020 00:00:00 GMT;
            path=/; domain=.google.com; Secure
```

- **사용처**

  - 사용자 로그인 세션 관리
  - 광고 정보 트래킹

- **특징**

  - 쿠키 정보는 항상 서버에 전송됨
  - 네트워크 트래픽 추가 유발
  - 최소한의 정보만 사용 (세션 ID, 인증 토큰)
  - 서버에 전송하지 않고 브라우저 내부에 저장하려면 웹 스토리지 사용
    - `localStorage`, `sessionStorage`

- **주의사항**
  - 보안에 민감한 데이터는 저장하면 안됨 (주민번호, 신용카드 번호 등)

### 쿠키 생명주기 (Expires, max-age)

- **만료일 지정 (expires)**

  ```http
  Set-Cookie: expires=Sat, 26-Dec-2020 04:39:21 GMT
  ```

  - 만료일이 되면 쿠키 삭제

- **초 단위 지정 (max-age)**

  ```http
  Set-Cookie: max-age=3600
  ```

  - 3600초 후 쿠키 삭제
  - 0이나 음수를 지정하면 즉시 쿠키 삭제

- **쿠키 종류**
  - 세션 쿠키
    - 만료 날짜를 생략하면 브라우저 종료 시까지만 유지
  - 영속 쿠키
    - 만료 날짜를 입력하면 해당 날짜까지 유지

### 쿠키 도메인 (Domain)

- **명시적 지정**

  ```http
  Set-Cookie: user=홍길동; domain=example.org
  ```

  - 명시한 문서 기준 도메인 + 서브 도메인 포함
  - `example.org`와 `dev.example.org` 모두 쿠키 접근 가능

- **생략**

  ```http
  Set-Cookie: user=홍길동
  ```

  - 현재 문서 기준 도메인만 적용
  - `example.org`에서만 쿠키 접근 가능

### 쿠키 경로 (Path)

```http
Set-Cookie: user=홍길동; path=/home
```

- **규칙**

  - 해당 경로를 포함한 하위 경로 페이지만 쿠키 접근
  - 일반적으로 `path=/` 루트로 지정

- **예시 (path=/home 지정)**
  - `/home` → 가능
  - `/home/level1` → 가능
  - `/home/level1/level2` → 가능
  - `/hello` → 불가능

### 쿠키 보안 (Secure, HttpOnly, SameSite)

- **Secure**

  ```http
  Set-Cookie: sessionId=abc123; Secure
  ```

  - 쿠키는 기본적으로 http, https를 구분하지 않고 전송
  - Secure 적용 시 https인 경우에만 전송

- **HttpOnly**

  ```http
  Set-Cookie: sessionId=abc123; HttpOnly
  ```

  - XSS 공격 방지
  - 자바스크립트에서 접근 불가 (`document.cookie`)
  - HTTP 전송에만 사용

- **SameSite**

  ```http
  Set-Cookie: sessionId=abc123; SameSite=Strict
  ```

  - XSRF(CSRF) 공격 방지
  - 요청 도메인과 쿠키에 설정된 도메인이 같은 경우만 쿠키 전송

<br/><br/>

## 연습 문제

1. 표현 헤더(`Content-Type`, `Content-Encoding` 등)의 주된 역할은 무엇일까요?

   a. 메시지 바디에 담긴 데이터 정보를 설명함

   - 메시지 바디의 데이터 타입, 압축 방식, 언어, 길이 등 데이터를 해석하는 데 필요한 정보를 담는 헤더가 표현 헤더임

2. HTTP 콘텐츠 협상(Content Negotiation)의 목적은 무엇일까요?

   a. 클라이언트가 원하는 콘텐츠 형식을 서버에 요청함

   - 클라이언트가 선호하는 미디어 타입, 문자열, 인코딩, 언어 등을 `Accept` 계열 헤더에 담아 보내면, 서버가 이를 참고해 최적의 응답을 제공하는 방식임

3. HTTP 메시지 바디의 길이를 알 수 없을 때 사용하며, `Content-Length` 헤더와 함께 사용하면 안 되는 전송 방식은 무엇일까요?

   a. Chunked Transfer Encoding

   - 청크 전송은 메시지 바디를 여러 덩어리(chunk)로 나눠 보내고, 각 덩어리의 길이만 표현하므로 전체 길이를 표현하는 `Content-Length`와 함께 사용할 수 없음

4. 하나의 IP 주소로 여러 도메인을 서비스하는 가상 호스트 환경에서, 클라이언트가 특정 도메인의 애플리케이션을 요청하기 위해 반드시 포함해야 하는 헤더는 무엇일까요?

   a. Host

   - 가상 호스트 환경에서는 여러 도메인이 같은 IP를 사용하기 때문에, 클라이언트가 요청하는 특정 도메인을 구분하기 위해 `Host` 헤더가 필수적으로 사용됨

5. HTTP 프로토콜이 '상태 비저장(Stateless)'이라는 특성을 보완하여 클라이언트와 서버 간의 상태를 유지하기 위해 주로 사용되는 기술은 무엇일까요?

   a. Cookies

   - HTTP는 이전 요청/응답의 정보를 기억하지 못하는 상태 비저장 프로토콜임
   - 쿠키는 클라이언트 측에 상태 정보를 저장하고 요청 시 자동으로 포함하여 상태를 유지할 수 있게 돕는 기술임

<br/><br/>

## 요약 정리

- HTTP 헤더는 HTTP 전송에 필요한 모든 부가정보(내용, 크기, 압축, 인증, 캐시)를 포함함
- 표현 헤더(`Content-Type`, `Content-Encoding`, `Content-Language`, `Content-Length`)는 메시지 바디를 설명하는 메타데이터를 제공함
- 협상(Content Negotiation)은 클라이언트가 선호하는 표현을 `Accept` 계열 헤더로 요청하며, Quality Values(q)로 우선순위를 지정할 수 있음
- `Transfer-Encoding`(분할 전송)은 `Content-Length`와 함께 사용하면 안됨
- `Host` 헤더는 필수로 가상 호스트 환경에서 도메인을 구분하며, `Referer`로 유입 경로를 분석할 수 있음
- HTTP는 Stateless 프로토콜이지만 쿠키를 통해 상태를 보관하고 세션을 관리할 수 있음
- 쿠키 보안을 위해 `Secure`(HTTPS), `HttpOnly`(XSS 방지), `SameSite`(CSRF 방지) 속성을 사용해야 함

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
