---
title: '[모든 개발자를 위한 HTTP 웹 기본 지식] HTTP 상태코드'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-15 17:43:00 +0900
category: [Computer Science, Web]
tags: [http, status-code, 2xx, 3xx, 4xx, 5xx, redirect, prg-pattern]
math: false
mermaid: false
---
# HTTP 상태코드

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 HTTP 상태코드의 개념과 분류, 2xx(성공), 3xx(리다이렉션), 4xx(클라이언트 오류), 5xx(서버 오류) 각 분류별 주요 상태코드와 PRG 패턴을 정리함

<br/><br/>

## 상태코드 개요

### HTTP 상태코드란?

- **정의**
  - 클라이언트가 보낸 요청의 처리 상태를 응답에서 알려주는 기능

### 상태코드 분류

| 분류 | 범위 | 의미                             | 설명                        |
| ---- | ---- | -------------------------------- | --------------------------- |
| 1xx  | 100  | Informational (요청 수신 처리중) | 거의 사용하지 않음          |
| 2xx  | 200  | Successful (요청 정상 처리)      | 성공                        |
| 3xx  | 300  | Redirection (추가 행동 필요)     | 요청 완료를 위한 리다이렉트 |
| 4xx  | 400  | Client Error (클라이언트 오류)   | 클라이언트의 잘못된 요청    |
| 5xx  | 500  | Server Error (서버 오류)         | 서버 문제로 요청 처리 실패  |

### 미지의 상태코드 처리

- **원칙**

  - 클라이언트가 인식할 수 없는 상태코드를 받으면 상위 상태코드로 해석

- **처리 예시**

  | 수신 코드 | 해석 | 설명                   |
  | --------- | ---- | ---------------------- |
  | 299 ???   | 2xx  | 성공으로 처리          |
  | 451 ???   | 4xx  | 클라이언트 오류로 처리 |
  | 599 ???   | 5xx  | 서버 오류로 처리       |

### 상태코드 선택 가이드

![상태코드 선택 가이드](/assets/img/http/status-code-guide.png)

<br/><br/>

## 2xx - 성공

### 200 OK

- **의미**

  - 요청이 성공적으로 처리됨

- **예시**

  ```http
  GET /members/100 HTTP/1.1
  Host: localhost:8080
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json
  Content-Length: 34

  {
    "username": "young",
    "age": 20
  }
  ```

### 201 Created

- **의미**

  - 요청 성공으로 새로운 리소스가 생성됨

- **예시**

  ```http
  POST /members HTTP/1.1
  Content-Type: application/json

  {
    "username": "young",
    "age": 20
  }
  ```

  ```http
  HTTP/1.1 201 Created
  Content-Type: application/json
  Content-Length: 34
  Location: /members/100

  {
    "username": "young",
    "age": 20
  }
  ```

  - `Location` 헤더로 생성된 리소스 위치를 식별

### 202 Accepted

- **의미**

  - 요청이 접수되었으나 처리가 완료되지 않음

- **사용 사례**
  - 배치 처리
  - 요청 접수 후 1시간 뒤에 배치 프로세스가 요청을 처리하는 경우

### 204 No Content

- **의미**

  - 요청은 성공했지만 응답 본문에 보낼 데이터가 없음

- **사용 사례**
  - 웹 문서 편집기의 save 버튼
  - save 결과로 아무 내용이 없어도 됨
  - 같은 화면을 유지해야 함
  - 204 메시지만으로 성공을 인식 가능

<br/><br/>

## 3xx - 리다이렉션

### 리다이렉션 개념

- **정의**
  - 웹 브라우저는 3xx 응답에 `Location` 헤더가 있으면 해당 위치로 자동 이동

![리다이렉션 개념 시퀀스 다이어그램](/assets/img/http/redirect-concept.png)

### 영구 리다이렉션 (301, 308)

- **의미**

  - 특정 리소스의 `URI`가 영구적으로 이동

- 301 Moved Permanently

  ```http
  POST /event HTTP/1.1
  Host: localhost:8080
  name=hello&age=20
  ```

  ```http
  HTTP/1.1 301 Moved Permanently
  Location: /new-event
  ```

  ```http
  GET /new-event HTTP/1.1
  Host: localhost:8080
  ```

  - **특징**
    - 리다이렉트 시 요청 메서드가 `GET`으로 변하고 본문이 제거될 수 있음 (MAY)

- 308 Permanent Redirect

  ```http
  POST /event HTTP/1.1
  Host: localhost:8080
  name=hello&age=20
  ```

  ```http
  HTTP/1.1 308 Permanent Redirect
  Location: /new-event
  ```

  ```http
  POST /new-event HTTP/1.1
  Host: localhost:8080
  name=hello&age=20
  ```

  - **특징**
    - 리다이렉트 시 요청 메서드와 본문 유지 (`POST` -> `POST`)

### 일시적 리다이렉션 (302, 307, 303)

- **의미**

  - 리소스의 `URI`가 일시적으로 변경
  - 검색 엔진은 `URL`을 변경하면 안됨

- **코드별 특징**

  | 코드 | 이름               | 메서드 변경                     |
  | ---- | ------------------ | ------------------------------- |
  | 302  | Found              | GET으로 변할 수 있음 (MAY)      |
  | 307  | Temporary Redirect | 메서드가 변하면 안됨 (MUST NOT) |
  | 303  | See Other          | 메서드가 GET으로 변경           |

### PRG 패턴 (Post/Redirect/Get)

- **목적**

  - `POST` 요청 후 새로고침으로 인한 중복 요청을 방지

- PRG 사용 전 문제 상황

  ![PRG 사용 전 문제 상황](/assets/img/http/prg-before.png)

- PRG 패턴 사용 후 해결 방법

  ![PRG 패턴 사용 후 해결 방법](/assets/img/http/prg-after.png)

- PRG 패턴 구현 예시

  ```http
  POST /order HTTP/1.1
  Host: localhost:8080
  Content-Type: application/x-www-form-urlencoded

  itemId=mouse&count=1
  ```

  ```http
  HTTP/1.1 302 Found
  Location: /order-result/19
  ```

  ```http
  GET /order-result/19 HTTP/1.1
  Host: localhost:8080
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html

  <html>주문완료</html>
  ```

  - `URL`이 `POST` -> `GET`으로 리다이렉트됨
  - 새로고침 시 `GET`으로 결과 화면만 조회
  - 중복 주문 방지

### 리다이렉션 코드 선택 가이드

| 코드 | 특징                  | 권장 사항                  |
| ---- | --------------------- | -------------------------- |
| 302  | GET으로 변할 수 있음  | 현실적으로 많이 사용       |
| 307  | 메서드 유지 보장      | 명확한 메서드 유지 필요 시 |
| 303  | 명확하게 GET으로 변경 | 명시적 GET 변경 필요 시    |

### 기타 리다이렉션

- 304 Not Modified

  ```http
  GET /resource HTTP/1.1
  If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
  ```

  ```http
  HTTP/1.1 304 Not Modified
  ```

  - **특징**
    - 캐시 목적으로 사용
    - 클라이언트에게 리소스가 수정되지 않았음을 알림
    - 클라이언트는 로컬 캐시를 재사용 (캐시로 리다이렉트)
    - 304 응답은 메시지 바디를 포함하면 안됨
    - 조건부 `GET`, `HEAD` 요청 시 사용

<br/><br/>

## 4xx - 클라이언트 오류

### 4xx 개념

- **의미**

  - 클라이언트의 잘못된 요청으로 서버가 요청을 수행할 수 없음

- **중요**
  - 클라이언트가 이미 잘못된 요청을 보내고 있으므로, 똑같은 재시도는 계속 실패함

### 400 Bad Request

- **의미**

  - 클라이언트가 잘못된 요청을 해서 서버가 처리할 수 없음

- **예시**

  ```http
  POST /members HTTP/1.1
  Content-Type: application/json

  {
    "username": "young",
    "age": "invalid"
  }
  ```

  ```http
  HTTP/1.1 400 Bad Request
  Content-Type: application/json

  {
    "error": "Invalid request parameter: age must be a number"
  }
  ```

- **발생 원인**
  - 요청 구문 오류
  - 잘못된 메시지 형식
  - 요청 파라미터 오류
  - API 스펙 불일치

### 401 Unauthorized

- **의미**

  - 해당 리소스에 대한 인증이 필요함

- **예시**

  ```http
  GET /admin/users HTTP/1.1
  Host: localhost:8080
  ```

  ```http
  HTTP/1.1 401 Unauthorized
  WWW-Authenticate: Bearer realm="example"

  {
    "error": "Authentication required"
  }
  ```

- **개념 구분**

  - 인증 (Authentication)
    - 본인이 누구인지 확인 (로그인)
  - 인가 (Authorization)
    - 권한 부여 (특정 리소스 접근 권한)

### 403 Forbidden

- **의미**

  - 서버가 요청을 이해했지만 승인을 거부함

- **예시**

  ```http
  GET /admin/settings HTTP/1.1
  Authorization: Bearer user_token
  ```

  ```http
  HTTP/1.1 403 Forbidden
  Content-Type: application/json

  {
    "error": "Access denied: Admin privileges required"
  }
  ```

- **발생 원인**
  - 인증 자격 증명은 있지만 접근 권한이 불충분
    - ex) 일반 사용자가 로그인은 했지만 관리자 리소스에 접근하는 경우

### 404 Not Found

- **의미**

  - 요청 리소스를 찾을 수 없음

- **예시**

  ```http
  GET /members/999 HTTP/1.1
  Host: localhost:8080
  ```

  ```http
  HTTP/1.1 404 Not Found
  Content-Type: application/json

  {
    "error": "Member not found"
  }
  ```

- **발생 원인**
  - 요청 리소스가 서버에 없음
  - 권한이 부족한 리소스를 숨기고 싶을 때도 사용

<br/><br/>

## 5xx - 서버 오류

### 5xx 개념

- **의미**

  - 서버 문제로 오류 발생

- **중요**
  - 서버에 문제가 있기 때문에 재시도하면 성공할 수도 있음 (서버 복구 후)

### 500 Internal Server Error

- **의미**

  - 서버 내부 문제로 오류 발생

- **예시**

  ```http
  POST /members HTTP/1.1
  Content-Type: application/json

  {
    "username": "young",
    "age": 20
  }
  ```

  ```http
  HTTP/1.1 500 Internal Server Error
  Content-Type: application/json

  {
    "error": "Internal server error"
  }
  ```

- **특징**
  - 애매한 서버 오류는 모두 500으로 처리
  - 서버 내부 예외, 데이터베이스 오류 등

### 503 Service Unavailable

- **의미**

  - 서비스 이용 불가

- **예시**

  ```http
  GET /members HTTP/1.1
  Host: localhost:8080
  ```

  ```http
  HTTP/1.1 503 Service Unavailable
  Retry-After: 3600
  Content-Type: application/json

  {
    "error": "Service temporarily unavailable"
  }
  ```

- **발생 원인**

  - 서버가 일시적인 과부하 상태
  - 예정된 작업으로 잠시 요청을 처리할 수 없음

- **Retry-After 헤더**
  - 얼마 후에 복구되는지 초 단위로 알려줌

<br/><br/>

## 연습 문제

1. HTTP 상태 코드 중 4xx와 5xx 계열의 가장 근본적인 차이는 무엇일까요?

   a. 클라이언트 문제 vs 서버 문제

   - 4xx는 클라이언트의 잘못된 요청으로 5xx는 서버 자체의 문제로 인해 발생함
   - 클라이언트 오류는 요청을 수정해야 성공하고, 서버 오류는 서버 문제 해결 후 재시도하면 성공할 수 있음

2. HTTP 상태 코드 2xx 계열이 일반적으로 나타내는 것은 무엇일까요?

   a. 클라이언트 요청 성공

   - 2xx 상태 코드는 클라이언트의 요청이 서버에서 성공적으로 처리되었음을 나타내고, 서버가 요청을 이해하고 정상적으로 응답한다는 의미임

3. 3xx 계열의 리다이렉션 응답을 받은 웹 브라우저는 `Location` 헤더를 어떻게 활용할까요?

   a. 헤더에 명시된 주소로 새 요청을 보냄

   - 3xx 응답 시 서버는 `Location` 헤더에 새 주소를 담아 보내고, 웹 브라우저는 이 주소로 자동으로 이동하여 요청을 다시 보냄

4. HTTP 상태 코드 304 Not Modified는 주로 어떤 목적으로 사용될까요?

   a. 클라이언트가 가지고 있는 캐시를 사용해도 좋다고 알려줌

   - 304 코드는 클라이언트의 캐시된 리소스가 서버의 것과 동일하며, 다시 다운로드할 필요가 없음을 알려줌. 응답 본문 없이 헤더만 전송됨

5. HTTP 응답에서 401 Unauthorized와 403 Forbidden 상태 코드가 의미하는 근본적인 차이는 무엇일까요?

   a. 인증(Authentication) 문제 vs 권한(Authorization) 문제

   - 401은 인증(로그인)이 필요하거나 실패했을 때, 403은 인증은 성공했지만 해당 리소스에 접근할 권한이 없을 때 사용함
   - '누구인지'와 '무엇을 할 수 있는지'의 차이임

<br/><br/>

## 요약 정리

- HTTP 상태 코드는 2xx(성공), 3xx(리다이렉션), 4xx(클라이언트 오류), 5xx(서버 오류)로 분류됨
- 3xx 리다이렉션은 `Location` 헤더로 이동할 주소를 제공하며, 301/308은 영구 리다이렉션, 302/307/303은 일시적 리다이렉션임
- 304 Not Modified는 캐시된 리소스를 사용하라는 의미로 응답 본문 없이 헤더만 전송하여 네트워크 비용을 절감함
- PRG(Post-Redirect-Get) 패턴은 POST 요청 후 302 리다이렉트로 GET 요청을 유도하여 중복 등록을 방지함
- 4xx는 클라이언트 오류로 요청을 수정하지 않으면 재시도해도 계속 실패하며, 401은 인증 필요, 403은 권한 없음을 의미함
- 5xx는 서버 오류로 서버 복구 후 재시도하면 성공할 수 있으며, 500은 서버 내부 오류, 503은 일시적 서비스 불가를 의미함
- `Location` 헤더는 리다이렉션뿐만 아니라 201 Created 응답 시 새로 생성된 리소스의 위치를 제공하는 데도 사용됨

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
