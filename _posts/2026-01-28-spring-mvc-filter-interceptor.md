---
title: '[김영한의 스프링 MVC 2편 백엔드 웹 개발 활용 기술] 로그인 처리 - 필터와 인터셉터'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-28 10:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, filter, interceptor, argument-resolver, aop]
math: false
mermaid: false
---

# 로그인 처리 - 필터와 인터셉터

- 김영한님의 스프링 MVC 2편 강의를 통해 서블릿 필터와 스프링 인터셉터의 개념과 차이점을 이해하고, 이를 활용하여 로그인 인증 체크, 로깅 등 웹 공통 관심사를 효율적으로 처리하는 방법을 정리함

<br/><br/>

## 공통 관심 사항의 문제

### 문제 상황

- **요구사항**
  - 로그인한 사용자만 상품 관리 페이지 접근 가능
  - 버튼은 숨겨져 있지만 URL 직접 호출 시 접근 가능

- **문제점**
  - 모든 컨트롤러에 로그인 체크 로직 중복 작성 필요
  - 등록, 수정, 삭제, 조회 등 모든 메서드에 동일 로직 반복
  - 로그인 로직 변경 시 모든 코드 수정 필요

### 공통 관심사

- **정의**
  - 애플리케이션 여러 로직에서 공통으로 관심 있는 사항
  - 예: 인증, 로깅, 보안, 트랜잭션 등

- **해결 방법**
  1. AOP (Aspect Oriented Programming)
  2. 서블릿 필터 (권장 - 웹 관련)
  3. 스프링 인터셉터 (권장 - 웹 관련)

- **웹 공통 관심사에 필터/인터셉터를 사용하는 이유**
  - HTTP 헤더, URL 정보 필요
  - `HttpServletRequest` 제공
  - 웹 요청/응답 처리에 특화

<br/><br/>

## 서블릿 필터

### 필터의 개념

- **정의**
  - 서블릿이 제공하는 문지기 역할
  - 서블릿 호출 전에 실행

- **필터 흐름**

  ![filter_flow](/assets/img/spring/filter-interceptor/filter_flow.png)

- **필터 제한**
  - **로그인 사용자**
    - HTTP 요청 -> WAS -> 필터 -> 서블릿 -> 컨트롤러
  - **비로그인 사용자**
    - HTTP 요청 -> WAS -> 필터 (차단, 서블릿 호출 X)

- **필터 체인**
  - HTTP 요청 -> WAS -> 필터1 -> 필터2 -> 필터3 -> 서블릿 -> 컨트롤러
  - 여러 필터를 체인 형태로 구성 가능하며 순서대로 실행됨

### 필터 인터페이스

```java
public interface Filter {
    // 필터 초기화 (서블릿 컨테이너 생성 시 호출)
    public default void init(FilterConfig filterConfig) throws ServletException {}
    
    // 필터 로직 (요청마다 호출)
    public void doFilter(ServletRequest request, ServletResponse response,
                        FilterChain chain) throws IOException, ServletException;
    
    // 필터 종료 (서블릿 컨테이너 종료 시 호출)
    public default void destroy() {}
}
```

- **서블릿 컨테이너가 필터를 싱글톤 객체로 생성 및 관리**
- **`init()`**
  - 초기화 메서드
- **`doFilter()`**
  - 핵심 로직 구현
- **`destroy()`**
  - 종료 메서드

### 요청 로그 필터 구현

- **LogFilter 구현**
  ```java
  @Slf4j
  public class LogFilter implements Filter {
      
      @Override
      public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
          HttpServletRequest httpRequest = (HttpServletRequest) request;
          String requestURI = httpRequest.getRequestURI();
          String uuid = UUID.randomUUID().toString();
          
          try {
              log.info("REQUEST [{}][{}]", uuid, requestURI);
              chain.doFilter(request, response);  // 다음 필터 또는 서블릿 호출
          } catch (Exception e) {
              throw e;
          } finally {
              log.info("RESPONSE [{}][{}]", uuid, requestURI);
          }
      }
      // init, destroy 생략...
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/filter/LogFilter.java)

- **다운캐스팅**
  - `ServletRequest`는 HTTP 외 요청도 고려한 인터페이스이므로 `HttpServletRequest`로 다운캐스팅 필요
- **UUID 생성**
  - HTTP 요청 구분용 임의의 식별자로 같은 요청의 로그를 추적 가능함
- **`chain.doFilter()`**
  - 다음 필터가 있으면 필터를 호출하고, 없으면 서블릿을 호출함
  - 이 로직을 호출하지 않으면 다음 단계로 진행되지 않음

### 필터 등록

```java
@Configuration
public class WebConfig {
    
    @Bean
    public FilterRegistrationBean logFilter() {
        FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new LogFilter());
        filterRegistrationBean.setOrder(1);
        filterRegistrationBean.addUrlPatterns("/*");
        return filterRegistrationBean;
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/WebConfig.java)

- **설정 메서드**
  - **`setFilter()`**
    - 등록할 필터 지정
  - **`setOrder()`**
    - 필터 체인 순서 (낮을수록 먼저 실행)
  - **`addUrlPatterns()`**
    - 적용할 URL 패턴 (`/*` = 모든 요청)

### 인증 체크 필터 구현

- **LoginCheckFilter 구현**
  ```java
  @Slf4j
  public class LoginCheckFilter implements Filter {
      
      private static final String[] whitelist = {"/", "/members/add", "/login", "/logout", "/css/*"};
      
      @Override
      public void doFilter(ServletRequest request, ServletResponse response, 
                          FilterChain chain) throws IOException, ServletException {
          
          HttpServletRequest httpRequest = (HttpServletRequest) request;
          String requestURI = httpRequest.getRequestURI();
          HttpServletResponse httpResponse = (HttpServletResponse) response;
          
          try {
              if (isLoginCheckPath(requestURI)) {
                  HttpSession session = httpRequest.getSession(false);
                  if (session == null || session.getAttribute(SessionConst.LOGIN_MEMBER) == null) {
                      // 로그인 페이지로 리다이렉트
                      httpResponse.sendRedirect("/login?redirectURL=" + requestURI);
                      return;  // 여기서 종료 (필터 체인 진행 X)
                  }
              }
              chain.doFilter(request, response);
          } catch (Exception e) {
              throw e;
          }
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/filter/LoginCheckFilter.java)

  - **화이트 리스트**
    - 인증 없이 접근 가능한 경로 (홈, 회원가입, 로그인, 로그아웃, 정적 리소스)
  - **redirectURL 파라미터**
    - 로그인 후 원래 요청 페이지로 돌아가기 위해 현재 URI를 파라미터로 전달함
  - **return 문**
    - 미인증 시 `return`으로 필터 체인을 중단시켜 서블릿/컨트롤러 호출을 막아야 함

### RedirectURL 처리

- **LoginController 수정**
  ```java
  @PostMapping("/login")
  public String loginV4(@Valid @ModelAttribute LoginForm form, 
                        @RequestParam(defaultValue = "/") String redirectURL,
                        HttpServletRequest request) {
      // 로그인 로직
      return "redirect:" + redirectURL;
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/login/LoginController.java)

<br/><br/>

## 스프링 인터셉터

### 인터셉터의 개념

- **정의**
  - 스프링 MVC가 제공하는 웹 공통 관심사 처리 기술
  - 서블릿 필터보다 편리하고 정교한 기능 제공

- **인터셉터 흐름**

  ![interceptor_flow](/assets/img/spring/filter-interceptor/interceptor_flow.png)

- **특징**
  - 디스패처 서블릿과 컨트롤러 사이에서 동작
  - 컨트롤러 호출 직전에 호출됨
  - 스프링 MVC 구조에 특화되어 있음

### 인터셉터 인터페이스

```java
public interface HandlerInterceptor {
    // 컨트롤러 호출 전 (핸들러 어댑터 호출 전)
    default boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {}
    
    // 컨트롤러 호출 후 (핸들러 어댑터 호출 후)
    default void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {}
    
    // 뷰 렌더링 후
    default void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {}
}
```

- **필터와의 차이점**
  - **메서드 수**
    - 필터는 `doFilter` 1개이나, 인터셉터는 단계별로 3개로 세분화됨 (`preHandle`, `postHandle`, `afterCompletion`)
  - **제공 정보**
    - `request`, `response` 외에 `handler`, `modelAndView` 정보도 제공함

### 인터셉터 호출 흐름

- **정상 흐름**
  
  ![interceptor_sequence](/assets/img/spring/filter-interceptor/interceptor_sequence.png)

- **예외 발생 시 흐름**
  - **`preHandle`**
    - 정상 호출
  - **`postHandle`**
    - 호출되지 않음
  - **`afterCompletion`**
    - 항상 호출됨 (예외 정보 포함)

### 요청 로그 인터셉터 구현

- **LogInterceptor 구현**
  ```java
  @Slf4j
  public class LogInterceptor implements HandlerInterceptor {
      public static final String LOG_ID = "logId";
      
      @Override
      public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
          String uuid = UUID.randomUUID().toString();
          request.setAttribute(LOG_ID, uuid); // afterCompletion에서 사용하기 위해 저장
          
          if (handler instanceof HandlerMethod) {
              HandlerMethod hm = (HandlerMethod) handler; // 호출할 컨트롤러 메서드 정보
          }
          log.info("REQUEST [{}][{}][{}]", uuid, request.getRequestURI(), handler);
          return true;
      }
      
      @Override
      public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
          log.info("postHandle [{}]", modelAndView);
      }
      
      @Override
      public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
          String logId = (String) request.getAttribute(LOG_ID);
          log.info("RESPONSE [{}][{}]", logId, request.getRequestURI());
          if (ex != null) {
              log.error("afterCompletion error!!", ex);
          }
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/interceptor/LogInterceptor.java)

### 인터셉터 등록

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LogInterceptor())
            .order(1)
            .addPathPatterns("/**")
            .excludePathPatterns("/css/**", "/*.ico", "/error");
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/WebConfig.java)

- **설정 메서드**
  - **`addPathPatterns()`**
    - 인터셉터 적용 URL 패턴
  - **`excludePathPatterns()`**
    - 제외할 URL 패턴
  - 서블릿 필터의 화이트 리스트 방식보다 훨씬 정밀하고 편리하게 설정 가능함

### 인증 체크 인터셉터 구현

- **LoginCheckInterceptor 구현**
  ```java
  @Slf4j
  public class LoginCheckInterceptor implements HandlerInterceptor {
      @Override
      public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
          String requestURI = request.getRequestURI();
          HttpSession session = request.getSession(false);
          
          if (session == null || session.getAttribute(SessionConst.LOGIN_MEMBER) == null) {
              // 로그인으로 리다이렉트
              response.sendRedirect("/login?redirectURL=" + requestURI);
              return false;
          }
          return true;
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/interceptor/LoginCheckInterceptor.java)

- **장점**
  - `excludePathPatterns`로 제외 경로를 설정 파일에서 관리하므로 인터셉터 코드 내부에는 체크 로직만 집중할 수 있어 간결함

<br/><br/>

## ArgumentResolver 활용

### 개념

- **HandlerMethodArgumentResolver**
  - 컨트롤러 메서드의 파라미터를 자동으로 생성해주는 스프링 기능
  - 반복적인 세션 조회 로직을 제거할 수 있음

### @Login 애노테이션 생성

```java
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface Login {
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/argumentresolver/Login.java)

### ArgumentResolver 구현

```java
public class LoginMemberArgumentResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        boolean hasLoginAnnotation = parameter.hasParameterAnnotation(Login.class);
        boolean hasMemberType = Member.class.isAssignableFrom(parameter.getParameterType());
        return hasLoginAnnotation && hasMemberType;
    }
    
    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                 NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return session.getAttribute(SessionConst.LOGIN_MEMBER);
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/argumentresolver/LoginMemberArgumentResolver.java)

### 컨트롤러 적용

```java
@GetMapping("/")
public String homeLoginV3ArgumentResolver(@Login Member loginMember, Model model) {
    if (loginMember == null) {
        return "home";
    }
    model.addAttribute("member", loginMember);
    return "loginHome";
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/login/src/main/java/hello/login/web/HomeController.java)

- **효과**
  - 세션 조회 로직이 제거되어 코드가 매우 간결해짐
  - `@Login` 애노테이션만으로 로그인 회원 정보를 편리하게 사용할 수 있음

<br/><br/>

## 필터와 인터셉터 비교

### 기능 비교

| 구분 | 필터 (Filter) | 인터셉터 (Interceptor) |
| --- | --- | --- |
| **제공 주체** | 서블릿 | 스프링 MVC |
| **적용 위치** | 서블릿 호출 전 | 디스패처 서블릿과 컨트롤러 사이 |
| **URL 패턴** | 서블릿 URL 패턴 | 스프링 PathPattern (더 정밀) |
| **메서드 수** | 1개 (`doFilter`) | 3개 (`preHandle`, `postHandle`, `afterCompletion`) |
| **예외 처리** | `try-catch` 필요 | `afterCompletion`에서 예외 정보 제공 |

### 권장 사항

  - 특별한 이유가 없으면 **인터셉터** 사용 권장
  - 필터는 정말 필요한 경우(서블릿 기술 의존, 전역 보안 처리 등)에만 사용

<br/><br/>

<br/><br/>

## 연습 문제

1. 웹 요청이 들어왔을 때, 서블릿 필터와 스프링 인터셉터는 처리 흐름 중 어디에 위치하나요?

   a. WAS -> 필터 -> DispatcherServlet -> 인터셉터 -> 컨트롤러

   - 웹 요청은 WAS를 거쳐 서블릿 필터를 먼저 만나고, DispatcherServlet 이후 스프링 인터셉터와 컨트롤러가 호출되는 흐름으로 진행됨

2. 로그인 인증, 요청 로깅처럼 웹 애플리케이션 전반에 걸쳐 공통으로 필요한 기능을 한 곳에서 처리하고 싶을 때, 서블릿 필터나 스프링 인터셉터를 사용하는 가장 큰 장점은 무엇인가요?

   a. 컨트롤러 코드의 순수성 유지 및 중복 제거

   - 여러 컨트롤러에 반복되는 공통 기능을 필터/인터셉터에서 처리하여 컨트롤러의 역할을 명확히 하고 코드 중복을 줄일 수 있음

3. 서블릿 필터의 `doFilter` 메소드 안에서 `chain.doFilter(request, response)` 호출이 중요한 이유는 무엇일까요?

   a. 다음 필터나 서블릿(컨트롤러)으로 요청 처리를 넘기기 위해

   - `chain.doFilter()`는 현재 필터 체인의 다음 단계로 요청과 응답을 전달함
   - 이 호출이 없으면 요청 처리가 중단됨

4. 스프링 인터셉터에서 요청 처리 중 예외 발생 여부와 상관없이 항상 호출되며, 예외 정보까지 받을 수 있는 메소드는 무엇일까요?

   a. `afterCompletion`

   - `afterCompletion`은 뷰 렌더링 후 요청 처리가 완전히 종료될 때 호출되며, 중간에 예외가 발생했더라도 항상 실행되고 예외 정보를 받을 수 있음

5. Spring MVC 컨트롤러 메소드의 파라미터로 로그인한 사용자 객체를 직접 받을 수 있게 해주는 Argument Resolver의 주요 역할은 무엇인가요?

   a. HTTP 세션 등에서 정보를 조회하여 메소드 파라미터에 주입

   - Argument Resolver는 특정 조건(예: @Login 어노테이션)의 파라미터를 보고, 개발자가 정의한 로직으로 값을 찾아 해당 파라미터에 자동으로 넣어주는 역할을 함

## 요약 정리

- **공통 관심사 해결**
  - 인증, 로깅 등 웹 애플리케이션의 공통 관심사를 서블릿 필터와 스프링 인터셉터를 통해 효율적으로 처리하는 방법을 학습함
- **서블릿 필터와 스프링 인터셉터**
  - 필터는 서블릿 호출 전에 동작하여 가장 앞단에서 요청을 처리하며, 인터셉터는 디스패처 서블릿과 컨트롤러 사이에서 동작하여 더 정교한 제어가 가능함
  - 스프링 MVC를 사용한다면 `excludePathPatterns` 등 편의 기능이 강력한 인터셉터 사용을 권장함
- **ArgumentResolver 활용**
  - 반복적인 로그인 세션 조회 로직을 `ArgumentResolver`를 통해 간소화하고, 컨트롤러가 비즈니스 로직에만 집중할 수 있도록 개선함

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)