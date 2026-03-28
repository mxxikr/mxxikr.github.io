---
title: 'Spring Security 아키텍처와 인증/인가 구조'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-16 00:00:00 +0900
category: [Framework, Spring]
tags: [spring, spring-security, authentication, authorization, filter, security-filter-chain]
math: false
mermaid: false
---
# 개요

- Spring Security는 Spring 기반 애플리케이션의 인증(Authentication), 인가(Authorization) 및 일반적인 보안 보호 기능을 제공하는 프레임워크임
- Servlet Filter 기반으로 동작하며, 클라이언트의 요청이 `DispatcherServlet`에 도달하기 전에 보안 처리를 선제적으로 수행함

<br/><br/>

## Spring Security 아키텍처

![Spring Security 아키텍처](/assets/img/spring/2026-03-16-spring-security-architecture/architecture.png)

### 서블릿 필터와 DelegatingFilterProxy

- 서블릿 컨테이너(Tomcat 등)는 자체적인 필터(Filter) 생명주기를 가짐
- 스프링 객체(Bean)를 서블릿 필터로 사용하기 위해 `DelegatingFilterProxy`라는 특수한 필터가 브릿지 역할을 수행함
- 서블릿 컨테이너의 요청을 가로채어 스프링의 ApplicationContext에 등록된 특정 Bean(Spring Security의 필터)에게 처리를 위임함

### FilterChainProxy

- `DelegatingFilterProxy`가 요청을 위임하는 실제 스프링 Bean이 바로 `FilterChainProxy`임
- Spring Security의 진입점 역할을 하며, 모든 보안 관련 요청은 이 클래스를 거치게 됨
- 요청 URL에 따라 적합한 `SecurityFilterChain`을 선택하여 실행함

### SecurityFilterChain

- 실제 보안 로직이 순서대로 구현된 여러 Spring Security Filter들의 묶음임
- 인증 및 권한 확인, CSRF 방어, CORS 설정 등의 작업이 각각의 특화된 필터에서 연쇄적으로 처리됨
- 프로젝트 요구사항에 따라 하나의 애플리케이션 내에 여러 개의 `SecurityFilterChain`을 구성할 수도 있음

<br/><br/>

## 인증(Authentication) 흐름

### 컴포넌트

- **Authentication**
  - 인증 주체(Principal), 자격 증명(Credentials), 그리고 부여된 권한 목록(Authorities)을 담고 있는 객체임
- **SecurityContext**
  - 현재 실행 중인 스레드의 보안 컨텍스트로, `Authentication` 객체를 보관함
  - 일반적으로 `ThreadLocal`을 사용하는 `SecurityContextHolder`를 통해 전역적으로 접근 가능함
- **AuthenticationManager**
  - 인증 처리의 전반적인 관리를 담당하는 인터페이스임
  - 주로 `ProviderManager` 구현체를 사용하며, 내부적으로 여러 등록된 `AuthenticationProvider`를 순회하며 인증을 시도함
- **AuthenticationProvider**
  - 실제 인증 로직(DB 검증 등)을 수행함
  - 폼 로그인 방식의 경우 `UserDetailsService`를 호출하여 사용자 정보를 데이터베이스에서 조회하고, `PasswordEncoder`로 비밀번호 일치 여부를 검증함

### 동작 순서

![Spring Security 인증 흐름](/assets/img/spring/2026-03-16-spring-security-architecture/auth-flow.png)

1. 클라이언트가 자격 증명(예: 아이디/비밀번호)을 포함하여 요청을 보냄
2. `UsernamePasswordAuthenticationFilter` 등의 인증 필터가 요청을 가로채어 미인증 상태의 `Authentication` 객체 생성
3. 생성된 객체를 `AuthenticationManager`에 전달하여 인증을 위임함
4. `AuthenticationManager`는 적절한 `AuthenticationProvider`를 찾아 처리함
5. 내부적으로 `UserDetailsService`를 통해 데이터베이스 값과 대조 및 검증 수행
6. 인증에 성공하면 권한(Authorities) 정보가 포함된 안전한(fully authenticated) `Authentication` 객체를 반환함
7. 반환된 객체를 `SecurityContextHolder`에 저장하여 이후 요청부터는 별도 인증 없이 사용자를 식별함

<br/><br/>

## 인가(Authorization) 흐름

### 동작 방식

- 성공적으로 인증(Authentication)이 완료된 후, 클라이언트가 요청한 자원(URL, 메서드 등)에 접근할 '권한'이 있는지 검사하는 과정임
- Spring Security Filter Chain의 마지막 부근에 위치한 `AuthorizationFilter`가 이 역할을 담당함

### 권한 결정 기구

- 요청 객체(Request)와 현재 사용자의 권한 정보(`Authentication`)를 바탕으로 접근을 허용할지 평가함
- 여러 방식의 설정(엔드포인트별 Role 기반 매칭, 표현식 등)을 바탕으로 보안 관리자가 정의한 정책과 일치하는지 대조함
- 접근이 거부될 경우 `AccessDeniedException`을 발생시켜 요청을 차단함

<br/><br/>

## 간단한 설정 예제 (Spring Security 6.x)


```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF 보호 비활성화 (API 서버의 경우)
            .csrf(csrf -> csrf.disable())
            
            // 세션 관리: STATELESS 설정 (JWT 토큰 기반 일 경우)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // HTTP 요청 인가 규칙 설정
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**", "/login").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );

        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```