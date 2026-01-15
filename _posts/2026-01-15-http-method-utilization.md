---
title: '[모든 개발자를 위한 HTTP 웹 기본 지식] HTTP 메서드 활용'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-15 17:23:00 +0900
category: [Computer Science, Web]
tags: [http, method, api, collection, store, form, rest-api, uri-design]
math: false
mermaid: true
---
# HTTP 메서드 활용

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 클라이언트에서 서버로 데이터를 전송하는 방식, 실무에서 자주 사용되는 4가지 데이터 전송 상황, HTTP API 설계 패턴(Collection, Store, Control URI)을 정리함

<br/><br/>

## 클라이언트에서 서버로 데이터 전송

### 데이터 전송 방식

![데이터 전송 방식 플로우차트](/assets/img/http/data-transmission.png)

- **쿼리 파라미터** (`GET`)
  - 정렬, 필터, 검색어
- **메시지 바디** (`POST`, `PUT`, `PATCH`)
  - 회원 가입, 상품 주문, 리소스 등록/변경

<br/><br/>

## 데이터 전송 상황

### 정적 데이터 조회

```http
GET /static/star.jpg HTTP/1.1
Host: localhost:8080
```

- **특징**

  - 이미지, 정적 텍스트 문서 조회
  - 쿼리 파라미터 없이 리소스 경로로 단순 조회
  - `GET` 메서드 사용

### 동적 데이터 조회

```http
GET /search?q=hello&hl=ko HTTP/1.1
Host: www.google.com
```

- **특징**

  - 검색, 게시판 목록의 정렬/필터링
  - 쿼리 파라미터로 조회 조건 전달
  - `GET` 메서드 사용

### HTML Form 데이터 전송

- POST 전송 (리소스 변경)

  ```html
  <form action="/save" method="post">
    <input type="text" name="username" />
    <input type="text" name="age" />
    <button type="submit">전송</button>
  </form>
  ```

  ```http
  POST /save HTTP/1.1
  Host: localhost:8080
  Content-Type: application/x-www-form-urlencoded

  username=kim&age=20
  ```

- GET 전송 (조회만)

  ```html
  <form action="/members" method="get">
    <input type="text" name="username" />
    <input type="text" name="age" />
    <button type="submit">전송</button>
  </form>
  ```

  ```http
  GET /members?username=kim&age=20 HTTP/1.1
  Host: localhost:8080
  ```

  - `GET`은 조회에만 사용
  - 리소스 변경 시 사용 금지

- Multipart Form 전송 (파일 업로드)

  ```html
  <form action="/save" method="post" enctype="multipart/form-data">
    <input type="text" name="username" />
    <input type="file" name="file1" />
    <button type="submit">전송</button>
  </form>
  ```

  ```http
  POST /save HTTP/1.1
  Host: localhost:8080
  Content-Type: multipart/form-data; boundary=-----XXX

  ------XXX
  Content-Disposition: form-data; name="username"

  kim
  ------XXX
  Content-Disposition: form-data; name="file1"; filename="intro.png"
  Content-Type: image/png

  [바이너리 데이터]
  ------XXX--
  ```

- HTML Form 특징

  | 항목               | 설명                              |
  | ------------------ | --------------------------------- |
  | **지원 메서드**    | `GET`, `POST`만 지원              |
  | **일반 폼 데이터** | application/x-www-form-urlencoded |
  | **파일 업로드**    | multipart/form-data               |

### HTTP API 데이터 전송

```http
POST /members HTTP/1.1
Content-Type: application/json

{
  "username": "young",
  "age": 20
}
```

- **사용 환경**

  - 서버 to 서버 (백엔드 시스템 통신)
  - 앱 클라이언트 (iOS, Android)
  - 웹 클라이언트 (AJAX, React, Vue.js)

- **특징**

  - `Content-Type: application/json` 주로 사용 (사실상 표준)
  - `POST`, `PUT`, `PATCH`
    - 메시지 바디로 데이터 전송
  - `GET`
    - 쿼리 파라미터로 데이터 전달

<br/><br/>

## URI 설계 개념

### 문서 (Document)

- **정의**

  - 단일 개념
  - 파일 하나, 객체 인스턴스, DB row

- **예시**
  - `/members/100`
  - `/files/star.jpg`

### 컬렉션 (Collection)

- **정의**

  - 서버가 관리하는 리소스 디렉토리
  - 서버가 리소스의 `URI`를 생성하고 관리

- **예시**
  - `/members`

### 스토어 (Store)

- **정의**

  - 클라이언트가 관리하는 리소스 저장소
  - 클라이언트가 리소스의 `URI`를 알고 관리

- **예시**
  - `/files`

### 컨트롤러 (Controller, Control URI)

- **정의**

  - 문서, 컬렉션, 스토어로 해결하기 어려운 추가 프로세스 실행
  - 동사를 직접 사용

- **예시**
  - `/members/{id}/delete`

<br/><br/>

## HTTP API 설계 패턴

![API 설계 패턴 플로우차트](/assets/img/http/api-design-pattern.png)

### POST 기반 등록 (Collection)

- **회원 관리 시스템 API**

  | 메서드   | URI           | 설명           |
  | -------- | ------------- | -------------- |
  | `GET`    | /members      | 회원 목록 조회 |
  | `POST`   | /members      | 회원 등록      |
  | `GET`    | /members/{id} | 회원 조회      |
  | `PATCH`  | /members/{id} | 회원 수정      |
  | `DELETE` | /members/{id} | 회원 삭제      |

- **응답 예시**

  ```http
  HTTP/1.1 201 Created
  Location: /members/100
  ```

- **Collection 특징**

  - 클라이언트는 등록될 리소스의 `URI`를 모름
  - 서버가 새로 등록된 리소스 `URI`를 생성하고 관리
  - 서버가 관리하는 리소스 디렉토리
  - 예시
    - `/members`

### PUT 기반 등록 (Store)

- **파일 관리 시스템 API**

  | 메서드   | URI               | 설명           |
  | -------- | ----------------- | -------------- |
  | `GET`    | /files            | 파일 목록 조회 |
  | `GET`    | /files/{filename} | 파일 조회      |
  | `PUT`    | /files/{filename} | 파일 등록      |
  | `DELETE` | /files/{filename} | 파일 삭제      |
  | `POST`   | /files            | 파일 대량 등록 |

- **등록 예시**

  ```http
  PUT /files/star.jpg HTTP/1.1
  Content-Type: image/jpeg

  [파일 데이터]
  ```

- **Store 특징**

  - 클라이언트가 리소스 `URI`를 알고 있어야 함
  - 클라이언트가 직접 리소스의 `URI`를 지정
  - 클라이언트가 관리하는 리소스 저장소
  - 예시
    - `/files`

### HTML Form 사용 (Control URI)

- **회원 관리 웹 페이지**

  | 메서드 | URI                  | 설명           |
  | ------ | -------------------- | -------------- |
  | `GET`  | /members             | 회원 목록      |
  | `GET`  | /members/new         | 회원 등록 폼   |
  | `POST` | /members/new         | 회원 등록 처리 |
  | `GET`  | /members/{id}        | 회원 조회      |
  | `GET`  | /members/{id}/edit   | 회원 수정 폼   |
  | `POST` | /members/{id}/edit   | 회원 수정 처리 |
  | `POST` | /members/{id}/delete | 회원 삭제      |

- **Control URI 특징**

  - HTML Form은 `GET`, `POST`만 지원하는 제약
  - 동사로 된 리소스 경로 사용
    - `/new`, `/edit`, `/delete`
  - HTTP 메서드로 해결하기 애매한 경우 사용
  - 실용적 설계를 위한 타협안

<br/><br/>

## 설계 원칙

- **`GET`은 조회 전용**

  - 리소스 변경이 발생하는 곳에 사용 금지

- **`POST` 기반 설계가 일반적**

  - 대부분의 경우 Collection 패턴 사용

- **실용성 우선**

  - Control URI를 통해 실무적 문제 해결

- **JSON 표준**

  - HTTP API에서는 `application/json` 사용 권장

- **리소스 중심 설계**
  - `URI`는 리소스를 식별
  - 행위는 HTTP 메서드로 표현

<br/><br/>

## 연습 문제

1. 클라이언트에서 서버로 검색어나 정렬 조건을 전달할 때 주로 사용하는 데이터 전송 방식은 무엇일까요?

   a. 쿼리 파라미터를 통한 데이터 전송 (`GET` 메서드)

   - 검색어, 정렬, 필터링 등은 `URL`에 쿼리 파라미터 형태로 전달하며, `GET` 메서드를 사용하는 것이 일반적임

2. HTML Form에서 파일을 업로드할 때 사용해야 하는 `Content-Type`은 무엇일까요?

   a. `multipart/form-data`

   - 파일과 같은 바이너리 데이터를 전송할 때는 `multipart/form-data`를 사용해야 하고, 일반 텍스트 데이터만 전송할 때는 `application/x-www-form-urlencoded`를 사용함

3. POST 기반 등록 패턴(Collection)에서 새로운 리소스의 `URI`를 누가 생성하고 관리할까요?

   a. 서버

   - Collection 패턴에서는 클라이언트가 등록될 리소스의 `URI`를 모르고, 서버가 새로 등록된 리소스 `URI`를 생성하고 관리함

4. PUT 기반 등록 패턴(Store)과 POST 기반 등록 패턴(Collection)의 가장 큰 차이점은 무엇일까요?

   a. 리소스 `URI` 지정 주체

   - Store 패턴(PUT)은 클라이언트가 리소스 `URI`를 직접 지정하고, Collection 패턴(POST)은 서버가 리소스 `URI`를 생성하는 차이가 있음

5. HTML Form이 `GET`과 `POST`만 지원하는 제약 때문에 동사로 된 리소스 경로(`/new`, `/edit`, `/delete`)를 사용하는 방식을 무엇이라고 부를까요?

   a. Control URI (컨트롤 URI)

   - HTTP 메서드만으로 해결하기 어려운 경우 실용적 설계를 위해 동사를 직접 사용하는 Control URI 방식을 사용함

<br/><br/>

## 요약 정리

- 클라이언트에서 서버로 데이터 전송은 쿼리 파라미터(`GET`), 메시지 바디(`POST`, `PUT`, `PATCH`)로 구분됨
- HTML Form은 `GET`과 `POST`만 지원하며, 파일 업로드 시 `multipart/form-data` 사용이 필수임
- HTTP API는 `application/json` 형식을 사용하며 서버-서버, 앱-서버, 웹 클라이언트 통신에 활용됨
- Collection 패턴(POST 기반)은 서버가 URI를 생성/관리하며 가장 일반적이고, Store 패턴(PUT 기반)은 클라이언트가 URI를 지정함
- Control URI는 HTTP 메서드로 해결하기 어려운 경우 동사 기반 경로를 사용하는 실용적 타협안임
- URI는 리소스를 식별하고 행위는 HTTP 메서드로 표현하는 것이 RESTful API 설계의 핵심임

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
