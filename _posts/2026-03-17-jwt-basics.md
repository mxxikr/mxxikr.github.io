---
title: 'JWT(JSON Web Token)의 구조와 동작 원리'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-17 10:00:00 +0900
category: [Security]
tags: [jwt, authentication, spring-security, token, json-web-token]
math: false
mermaid: false
---
# 개요

- JWT(JSON Web Token)는 당사자 간에 정보를 안전하게 JSON 객체로 전송하기 위한 간결한 자가 수용적 웹 표준 방식임
- 백엔드 서버가 클라이언트의 상태를 유지하지 않는 무상태(Stateless) 기반 인증에 주로 사용됨
- 토큰 자체가 필요한 모든 정보를 담고 있으므로 데이터베이스나 세션 조회를 최소화하고 수평 확장에 유리함

<br/><br/>

## 세션 기반 인증과의 비교

### 세션(Session) 기반 인증의 한계

- 서버의 메모리나 Redis 같은 별도 저장소에 사용자의 로그인 세션을 저장함
- 동시 접속자가 많아질수록 서버 측 저장소에 과부하가 발생할(Stateful) 가능성이 높음
- 분산된 여러 서버(Scale-Out 환경)로 요청이 수신될 때 세션 불일치 문제가 발생하기 쉬움

### JWT(토큰) 기반 인증의 강점

- 클라이언트가 토큰을 직접 보관하고 요청마다 제시하므로 서버는 상태 유지를 위한 저장소가 필요 없음(Stateless)
- 서버 측의 비밀키로 암호학적 서명이 되어 있어 토큰이 위변조되지 않았는지 빠르고 독립적으로 검증 가능함
- 서버 확장에 매우 유리하며, MSA(Microservices Architecture) 환경에서 여러 시스템 간 정보를 안전하게 넘길 때 적합함

<br/><br/>

## JWT의 3단 구조

- JWT는 **`Header`**.**`Payload`**.**`Signature`** 세 부분으로 나뉘며, 각 부분은 `.` (점)으로 구분됨

### Header (헤더)

- 토큰의 타입(`typ`)과 사용된 해싱 알고리즘(`alg`)의 정보를 담음
- Base64Url로 인코딩 됨

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (페이로드)

- 토큰에 담고자 하는 정보의 조각들인 **클레임(Claim)**을 보관함
- 클레임에는 등록된(Registered), 공개(Public), 비공개(Private) 클레임이 존재함
  - `iss`: 토큰 발급자
  - `exp`: 만료 시간
  - `sub`: 주제(주로 유저 ID)
  - `roles`: 사용자 권한
- Base64Url로 인코딩되며 **누구나 디코딩하여 볼 수 있음**

```json
{
  "sub": "user123",
  "name": "John Doe",
  "roles": ["ROLE_USER"],
  "iat": 1610000000,
  "exp": 1610003600
}
```

### Signature (서명)

- 토큰의 무결성(위변조 여부)을 검증하는 가장 핵심적인 보안 장치임
- `(Base64Url(Header) + "." + Base64Url(Payload))` 값을 서버만 알고 있는 비밀 키(Secret Key)를 이용해 헤더에서 지정한 알고리즘(ex. HMAC SHA256)으로 암호화하여 생성함

<br/><br/>

## 동작 원리 (진행 흐름)

![JWT 동작 원리](/assets/img/spring/2026-03-17-jwt-basics/jwt-flow.png)

1. **인증 요청**
   - 클라이언트가 아이디와 비밀번호를 서버에 전송 
2. **토큰 발급**
   - 서버가 자격 검증 후, 사용자 정보와 시그니처가 담긴 JWT를 발급해 클라이언트에 반환
3. **요청에 토큰 포함**
   - 이후 클라이언트는 보호된 API(리소스)를 요청할 때, HTTP 헤더의 `Authorization` 필드에 토큰을 담아 보냄
   - `Authorization: Bearer <token>`
4. **서버 검증 및 인가**
   - 서버측 필터(Spring Security 등)가 해당 토큰의 `Signature`를 비밀키로 복호화/검증하여 위조 및 만료 여부를 판별함
5. **응답**
   - 유효한 토큰일 경우, 페이로드 정보를 바탕으로 접근을 인가하고 리소스를 제공함

<br/><br/>

## 보안상 주의사항

### Payload에는 민감 정보 절대 포함 금지

- 누구나 디코딩 웹사이트(`jwt.io` 등)에 토큰을 붙여 넣기만 하면 내부 페이로드 값을 열람할 수 있음
- 따라서 비밀번호, 개인 식별 번호 같은 중요 데이터는 절대 Payload에 넣으면 안 됨

### Access Token과 Refresh Token 패턴

- 토큰이 클라이언트에게 탈취당할 경우, 서버에서 토큰을 강제로 만료시키기 어려움(Stateless하기 때문)
- 이를 보완하기 위해 **만료 기간이 짧은 Access Token(예: 30분)**과 **만료 기간이 길면서 서버 DB/Redis 등에서 검증하는 Refresh Token(예: 1주)**을 병행 사용함
- Access Token이 만료되면 클라이언트가 Refresh Token을 통해 새 Access Token을 안전하게 재발급 받도록 함