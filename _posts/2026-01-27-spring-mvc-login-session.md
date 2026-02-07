---
title: '[스프링 MVC 2편 백엔드 웹 개발 활용 기술] 로그인 처리 - 쿠키와 세션'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-27 20:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, login, cookie, session, httpsession]
math: false
mermaid: false
---

# 로그인 처리 - 쿠키와 세션

- 김영한님의 스프링 MVC 2편 강의를 통해 로그인 처리의 기본 원리와 쿠키, 세션을 활용한 관리 방법, 그리고 서블릿이 제공하는 `HttpSession`의 기능과 보안 전략을 정리함

<br/><br/>

## 로그인 기본 구조

### 패키지 구조 설계

- 도메인이 가장 중요함
- 도메인 = 핵심 비즈니스 업무 영역 (화면, UI, 기술 인프라 제외)
- web은 domain을 의존하지만, domain은 web을 의존하지 않음
- web 패키지를 삭제해도 domain에는 영향이 없어야 함

![Package Structure](/assets/img/spring/login-session/package-structure.png)

### 기본 로그인 구현

- **Member 도메인**
  ```java
  @Data
  public class Member {
      private Long id;
      @NotEmpty
      private String loginId;
      @NotEmpty
      private String name;
      @NotEmpty
      private String password;
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/domain/member/Member.java)

- **LoginService**
  ```java
  public Member login(String loginId, String password) {
      return memberRepository.findByLoginId(loginId)
          .filter(m -> m.getPassword().equals(password))
          .orElse(null);
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/domain/login/LoginService.java)

<br/><br/>

## 쿠키를 이용한 로그인 처리

### 쿠키의 동작 방식

- **로그인 상태 유지의 필요성**
  - HTTP는 무상태(Stateless) 프로토콜임
  - 쿼리 파라미터로 상태를 유지하는 것은 번거롭고 보안상 취약함
  - 따라서 쿠키를 통해 상태를 유지해야 함

![Cookie Login Flow](/assets/img/spring/login-session/cookie-login-flow.png)

- **쿠키 종류**
  - **영속 쿠키**
    - 만료 날짜를 지정하여 해당 날짜까지 유지됨
  - **세션 쿠키**
    - 만료 날짜를 생략하여 브라우저 종료 시까지만 유지됨

### 쿠키 기반 로그인 구현

- **로그인**
  - **쿠키 생성**
    ```java
    // 로그인 성공 처리
    Cookie idCookie = new Cookie("memberId", String.valueOf(loginMember.getId()));
    response.addCookie(idCookie);
    ```

- **홈 화면**
  - **쿠키 조회**
    ```java
    @GetMapping("/")
    public String homeLogin(@CookieValue(name = "memberId", required = false) Long memberId, Model model) {
        if (memberId == null) {
            return "home";
        }
        // 회원 조회 로직
    }
    ```

- **로그아웃**
  - **쿠키 만료**
    ```java
    private void expireCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setMaxAge(0); // 즉시 만료
        response.addCookie(cookie);
    }
    ```

- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/domain/login/LoginController.java)

### 쿠키의 보안 문제 및 대안

- **보안 문제**
  - **변조 가능**
    - 클라이언트가 쿠키 값을 임의로 변경할 수 있음
  - **정보 탈취**
    - 쿠키에 보관된 정보(신용카드, 개인정보 등)가 탈취될 수 있음
  - **악의적 이용**
    - 한 번 탈취된 쿠키로 평생 악의적인 요청을 보낼 수 있음

- **대안**
  - 예측 불가능한 임의의 토큰(세션 ID)을 사용함
  - 서버에서 토큰과 사용자 정보를 매핑하여 관리함
  - 토큰의 만료 시간을 짧게 설정하고, 의심 시 서버에서 강제로 제거함

<br/><br/>

## 세션을 이용한 로그인 처리

### 세션 동작 방식

- **세션 생성 및 전달**
  1. 클라이언트가 로그인 정보를 전달함
  2. 서버는 회원 확인 후 세션 ID(`UUID`)를 생성함
  3. 세션 저장소에 `세션ID:회원정보`를 저장함
  4. 클라이언트에게 세션 ID를 쿠키(`mySessionId`)로 전달함

![Session Login Flow](/assets/img/spring/login-session/session-login-flow.png)

- **세션 조회 및 관리**
  - 클라이언트는 요청 시 쿠키(`mySessionId`)를 전달함
  - 서버는 쿠키의 세션 ID로 세션 저장소를 조회하여 회원 정보를 확인 

### 직접 만든 세션 관리자

- **SessionManager**
  ```java
  @Component
  public class SessionManager {
      public static final String SESSION_COOKIE_NAME = "mySessionId";
      private Map<String, Object> sessionStore = new ConcurrentHashMap<>();
  
      public void createSession(Object value, HttpServletResponse response) {
          String sessionId = UUID.randomUUID().toString();
          sessionStore.put(sessionId, value);
          Cookie mySessionCookie = new Cookie(SESSION_COOKIE_NAME, sessionId);
          response.addCookie(mySessionCookie);
      }
      
      public Object getSession(HttpServletRequest request) {
          // 쿠키 조회 및 세션 반환
      }
      
      public void expire(HttpServletRequest request) {
          // 세션 제거
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/session/SessionManager.java)

<br/><br/>

## 서블릿 HTTP 세션

### HttpSession 소개

- **특징**
  - 서블릿이 제공하는 표준 세션 관리 기능임
  - 쿠키 이름은 `JSESSIONID`, 값은 추정 불가능한 랜덤 값임

### HttpSession 사용법

- **세션 상수 정의**
  ```java
  public class SessionConst {
      public static final String LOGIN_MEMBER = "loginMember";
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/SessionConst.java)

- **로그인**
  - **세션 생성**
    ```java
    HttpSession session = request.getSession(); // 세션 생성 (기본값 true)
    session.setAttribute(SessionConst.LOGIN_MEMBER, loginMember);
    ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/login/LoginControllerV3.java)

- **세션 생성 옵션**
  - `request.getSession(true)` (기본값)
    - 세션이 있으면 반환, 없으면 신규 생성
  - `request.getSession(false)`
    - 세션이 있으면 반환, 없으면 `null` 반환

- **로그아웃**
  - **세션 제거**
    ```java
    HttpSession session = request.getSession(false);
    if (session != null) {
        session.invalidate();
    }
    ```

### @SessionAttribute

- **특징**
  - 스프링이 제공하는 기능으로, 이미 로그인된 사용자를 찾을 때 편리함
  - 세션을 새로 생성하지 않음

- **사용 예시**
  ```java
  @GetMapping("/")
  public String homeLogin(
      @SessionAttribute(name = SessionConst.LOGIN_MEMBER, required = false) Member loginMember, Model model) {
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/login/LoginControllerV4.java)

### URL 세션 ID 노출 방지

- **TrackingModes 설정**
  - URL에 `jsessionid`가 노출되는 것을 방지하기 위해 `application.properties` 설정이 필요함
  ```properties
  server.servlet.session.tracking-modes=cookie
  ```
  - 이 설정을 통해 세션 유지를 쿠키 방식으로만 제한할 수 있음

<br/><br/>

## 세션 정보와 타임아웃

### 세션 타임아웃 설정

- **필요성**
  - HTTP는 비연결성이므로 서버는 사용자가 언제 웹 브라우저를 종료했는지 알 수 없음
  - 세션을 무한정 보관하면 메모리 부족 및 보안 위험이 발생함

- **설정 방법 (application.properties)**
  ```properties
  server.servlet.session.timeout=60
  ```
  - 기본값은 1800초(30분)이며, 60초(1분) 단위로 설정 가능함

### 타임아웃 동작 원리

- **LastAccessedTime 기준**
  - 사용자가 서버에 요청을 보낼 때마다 `LastAccessedTime`이 갱신됨
  - 이 시간을 기준으로 타임아웃 시간(30분) 동안 세션이 유지됨
  - 사용자가 서비스를 계속 이용하는 동안에는 세션이 만료되지 않음

![Session Timeout Logic](/assets/img/spring/login-session/session-timeout.png)


<br/><br/>

## 연습 문제

1. 로그인하지 않은 사용자가 로그인한 사용자만 접근할 수 있는 페이지에 접근하려고 할 때, 일반적인 웹 애플리케이션의 동작 방식은 무엇일까요?

   a. 로그인 페이지로 리다이렉션

   - 로그인하지 않은 사용자는 보호된 리소스에 접근할 수 없음
   - 보안을 위해 자동으로 로그인 페이지로 보내서 인증을 요구하는 것이 일반적인 방식임

2. 웹 애플리케이션에서 '도메인'과 '웹' 레이어를 분리하는 주된 목적은 무엇일까요?

   a. 웹 기술 변경 시 도메인 영향 최소화

   - 도메인 레이어는 핵심 비즈니스 로직을 담당함
   - 웹 기술(MVC 프레임워크 등)이 바뀌더라도 도메인 로직은 최대한 그대로 유지하기 위해 분리함

3. 웹 애플리케이션의 '웹' 레이어는 '도메인' 레이어에 의존할 수 있지만, '도메인' 레이어가 '웹' 레이어에 의존해서는 안 되는 주된 이유는 무엇일까요?

   a. 도메인 로직의 재사용성 저하

   - 도메인이 웹에 의존하면, 웹 기술 없이는 도메인 로직만 분리하여 재사용하거나 테스트하기 어려워짐
   - 의존성 방향은 한쪽으로 유지하는 것이 좋음

4. 웹 브라우저와 서버 간 여러 HTTP 요청/응답 과정에서 사용자의 로그인 상태를 유지하기 위해 주로 사용되는 기술은 무엇일까요?


   a. 쿠키

   - HTTP는 기본적으로 상태를 유지하지 않음
   - 웹 브라우저에 저장되고 요청 시마다 자동으로 서버에 전송되는 쿠키를 통해 상태를 유지하는 것이 기본적인 방법임

5. 사용자의 로그인 상태 유지를 위해 쿠키에 사용자 ID와 같은 추측 가능한 정보를 직접 저장할 때 발생하는 주요 보안 문제는 무엇일까요?

   a. 쿠키 값 변조를 통한 사용자 가장

   - 쿠키는 클라이언트 측에서 쉽게 접근하고 변경할 수 있음
   - 사용자 ID 같은 정보를 그대로 저장하면, 악의적인 사용자가 쿠키 값을 바꿔 다른 사용자 행세를 할 수 있음

6. 세션을 사용하여 사용자의 로그인 상태를 관리할 때, 사용자 관련 중요한 정보는 주로 어디에 저장될까요?

   a. 서버 메모리 또는 저장소

   - 세션의 핵심은 중요한 정보를 클라이언트(브라우저)가 아닌 서버에 안전하게 보관하는 것임
   - 서버는 각 세션에 대한 정보를 메모리 등에 저장하고 관리함

7. 세션 기반 로그인 시, 웹 브라우저가 서버의 특정 세션 데이터를 찾도록 연결해주는 역할은 주로 무엇이 할까요?

   a. 임의의 세션 ID

   - 서버는 세션 ID라는 예측 불가능한 임의의 값을 생성하고, 이 ID를 쿠키에 담아 클라이언트에게 전달함
   - 클라이언트는 이 세션 ID로 서버의 세션 데이터를 찾음

8. 자바 서블릿에서 표준적으로 제공하며, 서버 측에 데이터를 저장하고 클라이언트와 임의의 ID로 연결하여 세션 기능을 관리하는 메커니즘은 무엇일까요?

   a. HTTP 세션

   - 자바 서블릿은 HTTP 세션이라는 표준 기능을 제공하여 세션 관리를 편리하게 할 수 있도록 지원함
   - 개발자가 직접 세션 관리 로직을 복잡하게 구현할 필요가 줄어듦

9. 서버 측에서 세션 타임아웃을 설정하는 주된 이유는 무엇일까요?

   a. 유휴 세션으로 인한 서버 메모리 낭비 및 보안 문제 방지

   - 세션은 서버 메모리를 사용하므로, 사용되지 않는 세션을 정리하지 않으면 메모리가 부족해짐
   - 또한, 탈취된 세션이 영원히 유효하면 보안에 취약해짐

10. 일반적인 웹 서버의 세션 타임아웃은 어떤 시간을 기준으로 만료 시간을 계산하며 연장할까요?

    a. 가장 최근 세션 접근 시간

    - 사용자가 세션을 이용해 서버에 요청을 보낼 때마다 세션의 만료 시간이 재설정됨
    - 마지막으로 사용된 시점을 기준으로 일정 시간 동안 활동이 없으면 세션이 만료됨

<br/><br/>

## 요약 정리

- **로그인 처리 방식**
  - **쿠키**
    - 클라이언트에 저장되므로 조작과 탈취 위험이 있어 보안에 취약함
  - **세션**
    - 서버에 중요 정보를 저장하고 클라이언트에는 식별자(`ID`)만 쿠키로 전달하여 보안성이 높음
- **HttpSession**
  - 서블릿이 제공하는 표준 세션 기술로, `JSESSIONID` 쿠키를 사용하여 세션을 관리함
  - `HttpSession`을 직접 사용하거나 스프링의 `@SessionAttribute`를 사용하여 편리하게 로그인 정보를 조회할 수 있음
- **세션 관리**
  - **메모리**
    - 세션은 서버 메모리를 사용하므로 최소한의 데이터만 저장해야 함 (`user` 객체 전체보다는 `id` 등 필수 정보만)
  - **타임아웃**
    - 보안과 자원 효율성을 위해 적절한 세션 만료 시간(보통 30분) 설정이 필수적임
  - **TrackingMode**
    - URL에 세션 ID가 노출되지 않도록 `cookie` 모드로 설정하는 것이 좋음
<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
