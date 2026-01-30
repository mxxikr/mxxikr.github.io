---
title: '[김영한의 스프링 MVC 2편 백엔드 웹 개발 활용 기술] 예외 처리와 오류 페이지'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-28 16:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, exception, error-page, filter, interceptor, dispatcher-type]
math: false
mermaid: false
---

# 예외 처리와 오류 페이지

- 김영한님의 스프링 MVC 2편 강의를 통해 서블릿과 스프링 부트가 제공하는 예외 처리 방식과 오류 페이지 등록 방법을 이해하고, 필터와 인터셉터에서 오류 요청을 효율적으로 처리하는 방법(DispatcherType)을 정리함

<br/><br/>

## 서블릿 예외 처리 기본

### 서블릿의 예외 처리 방식

- Exception (예외)
- `response.sendError(HTTP 상태 코드, 오류 메시지)`

### Exception (예외) 방식

- **자바 직접 실행**
  - `main` 메서드에서 예외 발생 시
  - `main` 메서드를 넘어서면 예외 정보 남기고 쓰레드 종료됨

- **웹 애플리케이션**
  - 요청별로 별도의 쓰레드 할당
  - 서블릿 컨테이너 안에서 실행됨
  - `try-catch`로 예외 처리하면 문제 없음
  - 예외를 잡지 못하면 서블릿 밖으로 전달됨

- **예외 전파 흐름**
  ![exception_flow](/assets/img/spring/exception-handling/exception_flow.png)

- **WAS의 처리**
  - Exception 발생 시 HTTP 상태 코드 500 반환
  - 톰캣 기본 오류 화면 표시됨

- **예시 코드**
  ```java
  @GetMapping("/error-ex")
  public void errorEx() {
      throw new RuntimeException("예외 발생!");
  }
  ```
  - `HTTP Status 500 – Internal Server Error`

### response.sendError() 방식

- **개념**
  - 예외가 즉시 발생하는 것이 아니라, 서블릿 컨테이너에게 오류 발생을 알리는 방법임

- **메서드**
  ```java
  response.sendError(HTTP 상태 코드)
  response.sendError(HTTP 상태 코드, 오류 메시지)
  ```

- **sendError 흐름**
  ![send_error_flow](/assets/img/spring/exception-handling/send_error_flow.png)

- **동작 방식**
  - `response.sendError()` 호출 시 response 내부에 오류 상태 저장
  - 서블릿 컨테이너가 응답 전에 `sendError()` 호출 여부 확인
  - 호출되었다면 설정한 오류 코드에 맞는 기본 오류 페이지 표시함

<br/><br/>

## 서블릿 오류 페이지 등록

### 오류 페이지 등록 방법

- **과거 방식 (web.xml)**
  - `web.xml`에 `<error-page>` 태그로 등록하는 번거로움이 있었음

- **스프링 부트 방식**
  ```java
  @Component
  public class WebServerCustomizer implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {
      @Override
      public void customize(ConfigurableWebServerFactory factory) {
          ErrorPage errorPage404 = new ErrorPage(HttpStatus.NOT_FOUND, "/error-page/404");
          ErrorPage errorPage500 = new ErrorPage(HttpStatus.INTERNAL_SERVER_ERROR, "/error-page/500");
          ErrorPage errorPageEx = new ErrorPage(RuntimeException.class, "/error-page/500");
          factory.addErrorPages(errorPage404, errorPage500, errorPageEx);
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/WebServerCustomizer.java)

- **오류 페이지 매핑**
  - `response.sendError(404)` -> `errorPage404` 호출
  - `response.sendError(500)` -> `errorPage500` 호출
  - `RuntimeException` 또는 자식 타입 예외 -> `errorPageEx` 호출

### 오류 페이지 컨트롤러

```java
@Controller
public class ErrorPageController {
    @RequestMapping("/error-page/404")
    public String errorPage404(HttpServletRequest request, HttpServletResponse response) {
        return "error-page/404";
    }
    
    @RequestMapping("/error-page/500")
    public String errorPage500(HttpServletRequest request, HttpServletResponse response) {
        return "error-page/500";
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/servlet/ErrorPageController.java)

<br/><br/>

## 오류 페이지 작동 원리

### 오류 페이지 요청 흐름

- **전체 흐름 (예외 발생 시)**

  ![error_page_sequence](/assets/img/spring/exception-handling/error_page_sequence.png)

  - 웹 브라우저(클라이언트)는 서버 내부 동작을 전혀 모름 (한 번의 요청과 응답으로 보임)
  - 서버 내부에서만 WAS가 오류 페이지를 위해 다시 요청을 시도함
  - 이 과정에서 필터, 서블릿, 인터셉터, 컨트롤러가 모두 다시 호출됨

### WAS가 제공하는 오류 정보

- **request.attribute에 담기는 정보**
  - `javax.servlet.error.exception`
    - 예외 객체
  - `javax.servlet.error.exception_type`
    - 예외 타입
  - `javax.servlet.error.message`
    - 오류 메시지
  - `javax.servlet.error.request_uri`
    - 클라이언트 요청 URI
  - `javax.servlet.error.status_code`
    - HTTP 상태 코드
  - `javax.servlet.error.servlet_name`
    - 오류 발생 서블릿 이름

<br/><br/>

## 필터와 DispatcherType

### 문제 상황

- **중복 호출 문제**
  - 오류 페이지를 출력하기 위해 WAS가 다시 요청을 보낼 때, 필터와 인터셉터가 다시 호출되는 비효율 발생
  - 이미 로그인 인증 체크를 완료했음에도 오류 페이지 요청 시 다시 체크하게 됨

### DispatcherType

- **개념**
  - 서블릿 스펙에서 제공하며 요청이 정상 요청인지, 오류 페이지 요청인지 등을 구분함
  
- **DispatcherType 종류**
  - `REQUEST`
    - 클라이언트의 직접 요청 (기본값)
  - `ERROR`
    - 오류 페이지 요청
  - `FORWARD`
    - MVC에서 다른 서블릿/JSP 호출
  - `INCLUDE`
    - 다른 서블릿/JSP 결과 포함
  - `ASYNC`
    - 서블릿 비동기 호출

### 필터에 DispatcherType 적용

- **필터 등록 시 설정**
  ```java
  @Bean
  public FilterRegistrationBean logFilter() {
      FilterRegistrationBean<Filter> filterRegistrationBean = new FilterRegistrationBean<>();
      filterRegistrationBean.setFilter(new LogFilter());
      filterRegistrationBean.setOrder(1);
      filterRegistrationBean.addUrlPatterns("/*");
      
      // DispatcherType 설정 (REQUEST, ERROR 모두 적용)
      filterRegistrationBean.setDispatcherTypes(DispatcherType.REQUEST, DispatcherType.ERROR);
      
      return filterRegistrationBean;
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/WebConfig.java)

- **설정 옵션**
  - `setDispatcherTypes`를 설정하지 않으면 기본값은 `DispatcherType.REQUEST`임
  - 클라이언트의 직접 요청에만 필터가 적용되고 오류 페이지 요청(`ERROR`)에는 적용되지 않아 중복 호출을 막을 수 있음

<br/><br/>

## 인터셉터와 중복 호출 제거

### 인터셉터의 특징

- **필터와의 차이**
  - 필터는 `DispatcherType`으로 제어 가능하지만, 인터셉터는 `DispatcherType`과 무관하게 항상 호출됨

- **해결 방법**
  - 인터셉터는 요청 경로(`URL`)로 제어해야 함
  - `excludePathPatterns`를 사용하여 오류 페이지 경로를 제외시킴

### 인터셉터 등록

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LogInterceptor())
            .order(1)
            .addPathPatterns("/**")
            .excludePathPatterns("/css/**", "/*.ico", "/error", "/error-page/**"); // 오류 페이지 제외
    }
}
```

- **필터**
  - `setDispatcherTypes(DispatcherType.REQUEST)` 설정 (기본값)
- **인터셉터**
  - `excludePathPatterns("/error-page/**")` 경로 제외

<br/><br/>

## 스프링 부트의 오류 페이지

### 스프링 부트의 자동 설정

- **자동 등록**
  - `ErrorPage`를 `/error` 경로로 자동 등록함
  - `BasicErrorController`를 자동으로 등록하여 `/error` 매핑을 처리함

- **개발자 작업**
  - `WebServerCustomizer`나 `ErrorPageController`를 만들 필요 없음
  - 정해진 경로에 오류 페이지 화면(`html`)만 등록하면 됨

### 뷰 선택 우선순위

- **BasicErrorController의 처리 순서**
  1. **뷰 템플릿** (`resources/templates/error/`)
     - `500.html`, `5xx.html`
  2. **정적 리소스** (`resources/static/error/`)
     - `404.html`, `4xx.html`
  3. **기본 뷰** (`resources/templates/error.html`)

- **우선순위 규칙**
  - `구체적(500)` > `덜 구체적(5xx)`
  - `뷰 템플릿` > `정적 리소스`

### 오류 정보 표시 및 보안

- **오류 정보 노출**
  - `BasicErrorController`는 model에 `timestamp`, `status`, `error`, `exception`, `message`, `errors`, `trace`, `path` 정보를 담아 뷰에 전달함
  - 이 정보를 고객에게 노출하는 것은 보안상 위험하고 사용자 경험에도 좋지 않음

- **application.properties 설정**
  ```properties
  # exception 포함 여부 (true, false)
  server.error.include-exception=false
  # message 포함 여부 (never, always, on_param)
  server.error.include-message=never
  # trace 포함 여부
  server.error.include-stacktrace=never
  # errors 포함 여부
  server.error.include-binding-errors=never
  ```
  - 실무에서는 오류 정보를 사용자에게 절대 노출하지 말고, 서버 로그로 확인해야 함

<br/><br/>

## 연습 문제

1. 웹 애플리케이션에서 예외 처리와 사용자 정의 오류 페이지를 구현하는 주된 이유는 무엇일까요?

   a. 예기치 않은 오류 발생 시 사용자 경험 개선 및 서비스 안정성 유지

   - 예외 처리는 서비스 안정성을 높이고, 사용자 친화적인 오류 페이지는 시스템 문제 발생 시에도 좋은 사용자 경험을 제공하기 때문임
   - 고객이 불편함을 느끼지 않도록 잘 준비하는 것이 중요함

2. 서블릿 환경에서 처리되지 않은 예외가 WAS까지 전파될 때, 일반적으로 클라이언트는 어떤 HTTP 상태 코드를 받게 될까요?

   a. 500 Internal Server Error

   - 서블릿 애플리케이션에서 처리되지 않은 서버 측 예외는 WAS로 전파되며, WAS는 이를 인지하고 기본적으로 500 Internal Server Error 상태로 응답하게 됨

3. 서블릿 컨테이너가 제공하는 `DispatcherType`의 주요 목적은 무엇인가요?

   a. 요청이 클라이언트로부터 시작되었는지 또는 서버 내부 처리인지 구분하기 위해

   - `DispatcherType`은 현재 요청이 클라이언트의 직접 요청인지, 아니면 서버 내부에서 오류 처리나 포워딩 등에 의해 발생한 내부 요청인지를 구분하는 중요한 정보임

4. 스프링 인터셉터는 서블릿 필터와 달리 DispatcherType 직접 설정 기능이 없습니다. 대신 오류 페이지 요청 시 중복 호출을 방지하기 위해 주로 어떤 방법을 사용하나요?

   a. 요청 URL 패턴에서 오류 페이지 경로 제외

   - 스프링 인터셉터는 주로 `addInterceptors` 설정 시 `excludePathPatterns`를 사용하여 오류 페이지 경로를 제외함으로써 중복 실행을 방지하는 방식을 사용함

5. 스프링 부트에서 사용자 정의 오류 페이지 템플릿(예: HTML 파일)을 찾을 때, 어떤 우선순위로 경로를 탐색할까요? (높은 순)

   a. View Templates -> Static Resources -> BasicErrorController

   - 스프링 부트는 뷰 템플릿(`templates/error/...`)에서 먼저 찾고, 없으면 정적 리소스(`static/error/...`)를 확인해요. 그래도 없으면 `BasicErrorController`의 기본 응답을 사용함

<br/><br/>

## 요약 정리

- **서블릿 예외 처리 방식**
  - **Exception**
    - WAS까지 예외가 전달되면 500 오류 발생
  - **response.sendError()**
    - HTTP 상태 코드 지정 및 오류 처리 가능
- **오류 페이지 작동 원리**
  - 예외 발생 시 WAS가 오류 페이지 경로로 다시 요청을 보냄
  - 필터, 서블릿, 인터셉터, 컨트롤러가 모두 다시 호출됨
- **중복 호출 방지**
  - **필터**
    - `DispatcherType`을 `REQUEST`로 설정하여 클라이언트 요청에만 적용
  - **인터셉터**
    - `excludePathPatterns`로 오류 페이지 경로 제외
- **스프링 부트 오류 페이지**
  - `BasicErrorController`가 `/error` 경로를 자동 처리
  - `resources/templates/error/` 경로에 상태 코드별(4xx, 5xx) HTML 파일만 등록하면 됨
  - `server.error.include-exception` 등의 옵션으로 오류 정보 노출 제어 가능

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
