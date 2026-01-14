---
title: "[모든 개발자를 위한 HTTP 웹 기본 지식] HTTP 메서드"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-14 16:27:00 +0900
category:
  - [Computer Science, Web]
tags: [http, method, get, post, put, patch, delete, rest-api]
math: false
mermaid: true
---

# HTTP 메서드

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 HTTP 메서드의 종류와 특징, API URI 설계 원칙, 각 메서드의 속성(안전성, 멱등성, 캐시 가능성)을 정리함

<br/><br/>

## API URI 설계 원칙

### 올바른 설계 원칙

- 리소스 중심 사고

  - 리소스란
    - 회원을 등록, 수정, 조회하는 행위가 아니라 회원(member) 자체

- 리소스와 행위의 분리
  - URI
    - 리소스만 식별 (명사 사용)
  - HTTP 메서드
    - 행위를 표현 (동사)

### 올바른 URI 설계

- `GET /members`
  - 회원 목록 조회
- `GET /members/{id}`
  - 회원 조회
- `POST /members`
  - 회원 등록
- `PUT /members/{id}`
  - 회원 수정 (전체)
- `PATCH /members/{id}`
  - 회원 수정 (부분)
- `DELETE /members/{id}`
  - 회원 삭제

### 참고

- 계층 구조상 상위를 컬렉션으로 보고 복수형 사용 권장
  - member → members

<br/><br/>

## HTTP 메서드 종류

### 주요 메서드

| HTTP 메서드 | 용도                                              |
| ----------- | ------------------------------------------------- |
| **GET**     | 리소스 조회                                       |
| **POST**    | 데이터 처리/등록                                  |
| **PUT**     | 리소스 대체                                       |
| **PATCH**   | 리소스 부분 변경                                  |
| **DELETE**  | 리소스 삭제                                       |
| **HEAD**    | GET과 동일하지만 헤더만 반환                      |
| **OPTIONS** | 통신 가능한 옵션(메서드) 확인, 주로 CORS에서 사용 |
| **CONNECT** | 서버 터널 설정                                    |
| **TRACE**   | 메시지 루프백 테스트                              |

### GET 메서드

- 특징

  - 리소스 조회
  - 데이터 전달
    - 쿼리 파라미터 사용 (쿼리 스트링)
  - 메시지 바디
    - 사용 가능하지만 권장하지 않음

  ```http
  GET /search?q=hello&hl=ko HTTP/1.1
  Host: www.google.com
  ```

![Diagram 02](/assets/img/posts/http-methods/02_diagram.png)

### POST 메서드

- 특징

  - 요청 데이터 처리
  - 메시지 바디를 통해 데이터 전달
  - 주로 신규 리소스 등록, 프로세스 처리에 사용

- POST의 3가지 용도

  - 새 리소스 생성(등록)

    - 서버가 아직 식별하지 않은 새 리소스 생성

  - 요청 데이터 처리

    - 프로세스 상태 변경 - 예시 - 결제완료 → 배달시작 → 배달완료 - 새로운 리소스가 생성되지 않을 수도 있음
    - ex) `POST /orders/{orderId}/start-delivery` (컨트롤 URI)

  - 다른 메서드로 애매한 경우
    - JSON으로 조회 데이터를 넘겨야 하는데 GET 사용이 어려운 경우
    - 애매하면 POST 사용

  ![Diagram 03](/assets/img/posts/http-methods/03_diagram.png)

### PUT 메서드

- 특징

  - 리소스를 완전히 대체
  - 리소스가 있으면 대체, 없으면 생성
  - 클라이언트가 리소스 위치를 알고 URI 지정

- POST와의 차이점

  - POST
    - `POST /members`
    - 서버가 리소스 URI 생성
  - PUT
    - `PUT /members/100`
    - 클라이언트가 리소스 URI 지정

- 주의사항

  - 완전 대체
    - 기존
      - username: young, age: 20
    - `PUT /members/100` 요청
      - age: 50
    - 결과
      - age: 50 (username 필드 삭제됨)

![Diagram 04](/assets/img/posts/http-methods/04_diagram.png)

```http
PUT /members/100 HTTP/1.1
Content-Type: application/json
{
  "age": 50
}
```

- 결과
  - `{"age": 50}`
  - username 필드 삭제됨

### PATCH 메서드

- 특징

  - 리소스 부분 변경

- PUT과 PATCH 비교

  - PUT
    - 기존
      - username: young, age: 20
    - `PUT /members/100` 요청
      - age: 50
    - 결과
      - age: 50 (username 삭제)
  - PATCH
    - 기존
      - username: young, age: 20
    - `PATCH /members/100` 요청
      - age: 50
    - 결과
      - username: young, age: 50 (username 유지)

![Diagram 05](/assets/img/posts/http-methods/05_diagram.png)

```http
PATCH /members/100 HTTP/1.1
Content-Type: application/json
{
  "age": 50
}
```

- 결과
  - `{"username": "young", "age": 50}`
  - username 유지

### DELETE 메서드

- 특징

  - 리소스 제거

![Diagram 06](/assets/img/posts/http-methods/06_diagram.png)

<br/><br/>

## HTTP 메서드 속성

### 속성 요약표

| 메서드 | 안전(Safe) | 멱등(Idempotent) | 캐시가능(Cacheable)     |
| ------ | ---------- | ---------------- | ----------------------- |
| GET    | O          | O                | O                       |
| POST   | X          | X                | O (실제로는 거의 사용X) |
| PUT    | X          | O                | X                       |
| PATCH  | X          | X                | O (실제로는 거의 사용X) |
| DELETE | X          | O                | X                       |

### 안전(Safe)

- 정의
  - 호출해도 리소스를 변경하지 않음
- 문제
  - 계속 호출해서 로그가 쌓여 장애가 발생하면?
- 답변
  - 안전은 해당 리소스만 고려
  - 부수 효과는 고려하지 않음

### 멱등(Idempotent)

- 정의
  - `f(f(x)) = f(x)`
  - 한 번 호출하든 100번 호출하든 결과가 동일

### 메서드별 멱등성

- GET
  - 같은 결과 조회
- PUT
  - 같은 결과로 대체
- DELETE
  - 삭제된 상태 유지
- POST
  - 중복 발생 가능
- 멱등은 외부 요인으로 인한 변경은 고려하지 않음

![Diagram 07](/assets/img/posts/http-methods/07_diagram.png)

### 캐시 가능(Cacheable)

- 정의
  - 응답 결과를 캐시해서 사용 가능한지 여부
- 이론
  - GET, HEAD, POST, PATCH 캐시 가능
- 실무
  - GET, HEAD만 주로 사용
  - POST, PATCH는 본문 내용까지 캐시 키로 고려해야 해서 구현 복잡

<br/><br/>

## 연습 문제

1. HTTP API 설계 시, URI는 주로 무엇을 나타내나요? 행위(Action)는 무엇으로 구분하까요?

   a. URI - 리소스, 행위 구분 - HTTP 메서드

   - 좋은 URI 설계는 리소스를 식별하는 데 집중하고, 해당 리소스에 대한 행위는 GET, POST 같은 HTTP 메서드를 사용해 구분해야 함

2. 리소스 데이터를 '가져오는' 용도로 주로 사용되는 HTTP 메서드는 무엇일까요?

   a. GET

   - GET 메서드는 서버의 특정 리소스를 클라이언트로 가져오는 데 사용하고, 데이터 조회 시 널리 사용

3. 기존 리소스를 '완전히 대체'하는 메서드와 리소스의 '일부만' 수정하는 메서드는 각각 무엇일까요?

   a. 대체 - PUT, 일부 수정 - PATCH

   - PUT은 리소스를 통째로 바꾸고, PATCH는 데이터의 특정 부분만 골라 수정할 때 사용함. 둘의 목적이 다름

4. 서버의 리소스 상태를 변경하지 않아 '안전(Safe)'하다고 간주되는 HTTP 메서드는 무엇일까요?

   a. GET, HEAD

   - GET과 HEAD 메서드는 단순히 데이터를 조회할 뿐 서버의 데이터를 바꾸지 않아 안전하다고 분류됨. 나머지 메서드는 서버 상태를 변경

5. 같은 요청을 여러 번 수행해도 결과가 '동일한(Idempotent)' HTTP 메서드는 무엇일까요? (단, 외부 요인 제외)

   a. GET, PUT, DELETE

   - GET, PUT, DELETE는 여러 번 요청해도 서버 상태가 동일하게 유지되어 멱등성을 가짐. POST는 중복할 때마다 다른 결과를 만들 수 있음

<br/><br/>

## 요약 정리

### URI 설계 시

- URI에 동사(행위) 포함하지 않기
- 리소스는 명사로 표현
- 복수형 사용
  - members, orders
- 계층 구조 활용

### 메서드 선택 시

- 조회
  - GET
  - 쿼리 파라미터 사용
- 생성
  - POST
  - 서버가 URI 생성
- 전체 대체
  - PUT
  - 클라이언트가 URI 지정
- 부분 수정
  - PATCH
- 삭제
  - DELETE
- 애매한 경우
  - POST

![Diagram 08](/assets/img/posts/http-methods/08_diagram.png)

### 설계 검증 시

- 안전성
  - GET만 리소스 변경 없음
- 멱등성
  - GET, PUT, DELETE는 멱등
- 캐시
  - GET, HEAD만 실무에서 캐시 사용

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9E%90%EB%AC%B4%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84%EC%9A%A9%ED%88%AC%EB%B9%84)
- [RFC 7231 - HTTP/1.1 Semantics](https://tools.ietf.org/html/rfc7231#section-4.3.3)
