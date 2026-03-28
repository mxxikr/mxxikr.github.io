---
title: OAuth 2.0의 개념과 동작 원리
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-18 11:00:00 +0900
category: [Web, Security]
tags: [oauth, authentication, authorization, social-login, security]
math: false
mermaid: false
---
# 개요

- OAuth 2.0(Open Authorization)은 사용자가 비밀번호를 제공하지 않고도, 다른 웹사이트상에 있는 자신의 데이터에 대한 접근 권한을 제3자 애플리케이션에게 부여할 수 있게 하는 표준 프로토콜임
- 구글, 깃허브, 카카오 등을 활용하는 소셜 로그인이 바로 이 프로토콜을 기반으로 구현됨

<br/><br/>

## 참여자 (Roles)

- **Resource Owner**
  - 자원(개인 정보 등)의 소유자, 즉 우리의 서비스를 이용하는 일반 사용자
- **Client**
  - Resource Server에 접속하여 자원을 가져오려는 제3자 애플리케이션 (우리가 개발하는 서비스)
- **Authorization Server**
  - 사용자를 인증한 후, 해당 Client에게 권한을 위임받았다는 증서(Access Token)를 발급해 주는 서버
- **Resource Server**
  - 사용자의 실제 자원을 보호하고 있으며, Access Token을 검증한 뒤 요청한 데이터를 제공해 주는 서버

<br/><br/>

## 주요 권한 부여 방식 (Grant Types)

### Authorization Code Grant

- 가장 보편적으로 사용되며 보안성이 가장 높은 방식임
- 프론트엔드와 백엔드가 분리된 웹 애플리케이션이나 모바일 앱에 적합함
- Client가 바로 토큰을 받는 대신 임시 암호인 `Authorization Code`를 먼저 받은 뒤, 백엔드 서버가 이를 `Access Token`과 교환함
- Client Secret(비밀키)이 브라우저에 노출되지 않고 백엔드 간 통신에서만 사용되므로 안전함

### Implicit Grant

- 백엔드 서버 없이 브라우저 환경에서만 동작하는 SPA(Single Page Application)를 위해 만들어진 방식
- `Authorization Code` 과정 없이 Authorization Server로부터 즉시 `Access Token`을 전달받음
- 토큰이 URL이나 브라우저에 노출되므로 보안에 취약하며, 최근에는 이 방식 대신 PKCE를 결합한 Authorization Code 방식을 권장함

### Client Credentials Grant

- 사용자(Resource Owner)의 개입 없이, Client 애플리케이션 자체가 자신의 권한으로 자원을 요청할 때 사용됨
- 마이크로서비스 간의 통신이나 서버 대 서버(Server-to-Server) API 호출 시 주로 사용됨

<br/><br/>

## Authorization Code 방식 동작 원리

![OAuth 2.0 인가 코드 흐름](/assets/img/spring/2026-03-18-oauth-basics/oauth-flow.png)

1. **권한 요청 (로그인 버튼 클릭)**
   - 사용자가 '구글로 로그인' 버튼을 클릭하면, Client는 사용자를 구글(Authorization Server)의 로그인 및 동의 페이지로 리다이렉트함
2. **인증 및 동의 (사용자 조작)**
   - 사용자는 구글에 로그인하고, 해당 Client가 자신의 이메일/프로필 정보 등을 읽어가는 것에 동의함
3. **Authorization Code 발급**
   - 구글(Authorization Server)은 사전에 등록된 Client의 Redirect URI로 사용자를 다시 돌려보내며, URL 파라미터로 `Authorization Code`를 담아 전달함
4. **Access Token 요청 (백엔드 통신)**
   - Client(우리의 백엔드 서버)는 전달받은 `Authorization Code`와 본인만이 알고 있는 `Client Secret`을 취합하여 구글 서버로 Access Token을 요청함
5. **Access Token 발급**
   - 구글 서버는 전달받은 정보가 일치하는지 확인한 후, 권한의 증표인 `Access Token`을 발급함
6. **리소스 접근 및 제공**
   - Client는 해당 `Access Token`을 HTTP 헤더에 담아 구글의 Resource Server(API)에 사용자 정보를 요청하고 성공적으로 받아옴
