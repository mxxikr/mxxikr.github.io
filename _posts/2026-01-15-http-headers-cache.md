---
title: "[모든 개발자를 위한 HTTP 웹 기본 지식] HTTP 헤더2 - 캐시와 조건부 요청"
author: { name: mxxikr, link: "https://github.com/mxxikr" }
date: 2026-01-15 17:54:00 +0900
category: [Computer Science, Web]
tags: [http, cache, conditional-request, etag, last-modified, cache-control]
math: false
mermaid: false
---

# HTTP 헤더2 - 캐시와 조건부 요청

- 김영한님의 모든 개발자를 위한 HTTP 웹 기본 지식 강의를 통해 HTTP 캐시의 기본 동작 원리, 검증 헤더(`Last-Modified`, `ETag`)와 조건부 요청(`If-Modified-Since`, `If-None-Match`), 캐시 제어 헤더(`Cache-Control`), 프록시 캐시, 캐시 무효화 방법을 정리함

<br/><br/>

## 캐시 기본 동작

### 캐시가 없을 때의 문제점

![캐시가 없을 때의 문제점](/assets/img/http/cache-no-cache.png)

- **문제점**
  - 데이터가 변경되지 않아도 계속 네트워크를 통해 다운로드
  - 인터넷 네트워크는 매우 느리고 비쌈
  - 브라우저 로딩 속도가 느림
  - 느린 사용자 경험

### 캐시 적용

![캐시 적용](/assets/img/http/cache-with-cache.png)

- **캐시 적용 효과**
  - 캐시 가능 시간 동안 네트워크를 사용하지 않아도 됨
  - 비싼 네트워크 사용량 절감
  - 브라우저 로딩 속도가 매우 빠름
  - 빠른 사용자 경험

### 캐시 시간 초과

![캐시 시간 초과](/assets/img/http/cache-timeout.png)

- **문제**
  - 캐시 유효 시간이 초과하면 데이터가 변경되지 않았어도 다시 전체 데이터를 다운로드해야 함

<br/><br/>

## 검증 헤더와 조건부 요청 헤더

- 검증 헤더 (Validator)
  - `Last-Modified: Thu, 04 Jun 2020 07:19:24 GMT`
  - `ETag: "v1.0"`
- 조건부 요청 헤더
  - `If-Modified-Since` (Last-Modified 사용)
  - `If-None-Match` (ETag 사용)
  - 조건 만족 시 200 OK, 불만족 시 304 Not Modified

### Last-Modified

- Last-Modified와 If-Modified-Since

  - 캐시 만료 후에도 서버의 데이터가 변경되지 않았다면, 저장해둔 캐시를 재사용할 수 있음

  ![Last-Modified 검증](/assets/img/http/last-modified-validation.png)

- 캐시 유효 시간이 초과해도 서버 데이터가 갱신되지 않으면
- 304 Not Modified + 헤더 메타 정보만 응답 (바디 X)
- 클라이언트는 응답 헤더 정보로 캐시의 메타 정보를 갱신
- 클라이언트는 캐시에 저장되어 있는 데이터 재활용
- 네트워크 다운로드가 발생하지만 용량이 적은 헤더 정보만 다운로드

- 단점
  - 날짜 기반의 로직 사용하기 때문에 1초 미만 단위로 캐시 조정 불가능
  - 데이터를 수정해서 날짜는 갱신되었지만, 실질적인 데이터 내용(결과)은 똑같은 경우에도 불필요하게 다시 다운로드를 받아야 함
  - 스페이스나 주석처럼 크게 영향이 없는 변경이라도 날짜가 바뀌면 무조건 캐시를 다시 받아야 하므로, 서버에서 정교한 캐시 제어가 어려움

### ETag

- **ETag (Entity Tag)**

  - 캐시용 데이터에 임의의 고유한 버전 이름을 부여
  - 데이터가 변경되면 이름을 변경 (Hash를 다시 생성)
  - 단순하게 ETag만 비교해서 같으면 유지, 다르면 다시 받기

  ![ETag 검증](/assets/img/http/etag-validation.png)

- 장점

  - 캐시 제어 로직을 서버에서 완전히 관리
  - 1초 미만 단위 변경 감지 가능
  - 서버는 배타 오픈 기간 동안 파일이 변경되어도 ETag를 동일하게 유지 가능
  - 애플리케이션 배포 주기에 맞추어 ETag 모두 갱신 가능

<br/><br/>

## 캐시 제어 헤더

### Cache-Control

- **캐시 유효 시간 (max-age)**

  ```http
  Cache-Control: max-age=60
  ```

  - 캐시 유효 시간 (초 단위)

- **캐시 검증 강제 (no-cache)**

  ```http
  Cache-Control: no-cache
  ```

  - 데이터는 캐시해도 되지만, 항상 원(origin) 서버에 검증하고 사용
  - 캐시를 사용하지 않는 것이 아님

  ![no-cache 정상 동작](/assets/img/http/no-cache-normal.png)

- **캐시 저장 금지 (no-store)**

  ```http
  Cache-Control: no-store
  ```

  - 데이터에 민감한 정보가 있으므로 저장하면 안됨
  - 메모리에서 사용하고 최대한 빨리 삭제

- **캐시 검증 필수 (must-revalidate)**

  ```http
  Cache-Control: must-revalidate
  ```

  - 캐시 만료 후 최초 조회 시 원 서버에 검증 필수
  - 원 서버 접근 실패 시 반드시 오류 발생 (504 Gateway Timeout)
  - 캐시 유효 시간 이내라면 캐시 사용

- **프록시 캐시 전용 (s-maxage)**

  ```http
  Cache-Control: s-maxage=3600
  ```

  - 프록시 캐시에만 적용되는 max-age

- **Public과 Private 캐시**

  - `public`
    - 응답이 public 캐시(프록시 캐시)에 저장되어도 됨
  - `private`
    - 응답이 해당 사용자만을 위한 것
    - private 캐시(브라우저 캐시)에 저장 (기본값)

### Pragma (하위 호환)

```http
Pragma: no-cache
```

- HTTP 1.0 하위 호환
- `Cache-Control: no-cache`와 동일

### Expires (하위 호환)

```http
Expires: Mon, 01 Jan 1990 00:00:00 GMT
```

- 캐시 만료일을 정확한 날짜로 지정
- HTTP 1.0부터 사용
- 지금은 더 유연한 `Cache-Control: max-age` 권장
- `Cache-Control: max-age`와 함께 사용하면 `Expires`는 무시됨

<br/><br/>

## 프록시 캐시

### 프록시 캐시 개념

![프록시 캐시 개념](/assets/img/http/proxy-cache.png)

- **응답 시간 단축**

  - 원 서버 직접 접근
    - 500ms
  - 프록시 캐시 사용
    - 100ms (5배 개선)

### 프록시 캐시 관련 헤더

```http
Age: 60
```

- 오리진 서버에서 응답 후 프록시 캐시 내에 머문 시간 (초)

<br/><br/>

## 캐시 무효화

### 확실한 캐시 무효화

- **문제**

  - 캐시를 적용하지 않아도 브라우저가 임의로 캐시할 수 있음

- **해결**
  - 확실하게 캐시를 무효화하려면 아래 과정을 모두 적용해야 함

```http
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
```

### no-cache와 must-revalidate 비교

- **공통점**

  - 둘 다 원 서버 접근 가능 시 항상 검증

- **차이점 (네트워크 단절 시)**

  - `no-cache`

    - 프록시 설정에 따라 오래된 캐시 반환 가능

    ![no-cache 네트워크 단절](/assets/img/http/no-cache-disconnect.png)

  - `must-revalidate`

    - 반드시 504 오류 발생

    ![must-revalidate 네트워크 단절](/assets/img/http/must-revalidate-disconnect.png)

- **사용 사례**
  - `no-cache`: 일반적인 웹 페이지, 이미지
  - `must-revalidate`: 금융 데이터, 민감 정보 (정확성 중요)

<br/><br/>

## 연습 문제

1. 웹 브라우저에서 캐시를 사용하는 주된 이유는 무엇일까요?

   a. 네트워크 데이터 사용량 감소 및 속도 향상

   - 캐시는 같은 데이터를 다시 다운로드는 것을 막고 재사용하여 네트워크 사용을 줄이고 웹 페이지를 빠르게 표시하는 데 도움을 줌

2. 조건부 요청 시 서버로부터 304 Not Modified 응답을 받는 것은 무엇을 의미할까요?

   a. 클라이언트의 캐시 데이터가 서버와 동일하여 재사용 가능함

   - 304 응답은 서버의 데이터가 클라이언트가 가진 캐시와 동일하며, 다시 다운로드할 필요 없이 캐시를 사용하라는 뜻으로 캐시 재사용을 장려하고 응답 시간을 크게 단축시킴

3. 캐시 유효성 검사 시, Last-Modified 대신 ETag를 사용하면 어떤 장점이 있을까요?

   a. 시간 단위보다 더 정밀하게 검사 가능함

   - Last-Modified는 1초 미만 변경을 구분하지 못하고 날짜 변경은 없지만 내용 변경은 구분하기 어려지만, ETag는 데이터 자체의 고유한 버전 이름을 나타내므로 더 정확하게 유효성을 검사할 수 있음

4. 민감한 정보가 포함된 응답에 대해 브라우저나 프록시 캐시가 데이터를 저장하지 않도록 지시하는 `Cache-Control` 값은 무엇일까요?

   a. no-store

   - `Cache-Control: no-store`는 캐시 자체를 완전히 금지하여 민감한 정보가 디스크 등에 저장되지 않도록 함. `no-cache`는 캐시는 허용하지만 항상 원 서버 검증이 필요함

5. 프록시 캐시(CDN 등)를 사용하는 주된 목적은 무엇일까요?

   a. 사용자와 가까운 위치에서 응답하여 지연 시간 단축

   - 원 서버가 멀리 있을 때 프록시 캐시는 사용자와 가까운 곳에 데이터를 저장해두고 제공함으로써 데이터 이동 거리를 줄여 응답 시간을 크게 단축시킴

<br/><br/>

## 요약 정리

- 캐시는 같은 데이터를 반복 다운로드하지 않아 네트워크 비용을 절감하고 브라우저 로딩 속도를 향상시킴
- `Last-Modified`/`If-Modified-Since`는 날짜 기반(1초 단위), `ETag`/`If-None-Match`는 해시값 기반으로 더 정밀한 검증을 지원하며 서버에서 캐시 로직을 완전히 제어할 수 있음
- 304 Not Modified 응답은 헤더만 전송하여 캐시를 재사용하도록 하므로 네트워크 비용을 크게 절감함
- `no-cache`는 항상 원 서버 검증, `no-store`는 캐시 저장 금지, `must-revalidate`는 원 서버 접근 실패 시 504 오류 발생
- 프록시 캐시는 사용자와 가까운 위치에 데이터를 저장하여 응답 시간을 대폭 단축함
- 확실한 캐시 무효화를 위해 `Cache-Control: no-cache, no-store, must-revalidate`와 `Pragma: no-cache`를 함께 사용해야 함(HTTP 1.0/1.1 모두에서 확실히 캐시 무효화)

<br/><br/>

## Reference

- [모든 개발자를 위한 HTTP 웹 기본 지식](https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC)
