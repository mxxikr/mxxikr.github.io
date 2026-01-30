---
title: '[김영한의 스프링 MVC 2편 백엔드 웹 개발 활용 기술] API 예외 처리'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-29 10:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, exception, api, json, exception-handler, controller-advice]
math: false
mermaid: false
---

# API 예외 처리

- 김영한님의 스프링 MVC 2편 강의를 통해 HTML 페이지가 아닌 API 예외 처리의 필요성과 어려운 점을 이해하고, `HandlerExceptionResolver`, `@ExceptionHandler`, `@ControllerAdvice`를 활용하여 실무에서 유연하고 정교한 API 예외 처리를 구현하는 방법을 정리함

<br/><br/>

## API 예외 처리의 필요성

### HTML과 API 예외 처리 비교

- **HTML 오류 페이지**
  - 4xx, 5xx 오류 페이지만 제공하면 됨
  - 사용자에게 오류 화면 표시
  - `BasicErrorController`로 충분히 해결
- **API 오류 응답**
  - 각 오류 상황에 맞는 오류 응답 스펙 필요
  - JSON 형식으로 데이터 반환
  - 오류 상세 정보 포함
  - 시스템마다 응답 형식이 다름

### API 예외 처리의 어려운 점

- **문제점**
  - **오류 스펙의 다양성**
    - 각 시스템마다 응답 형식이 다름
    - 같은 예외라도 컨트롤러마다 다른 응답 필요
    - 세밀한 제어 필요
  - **BasicErrorController의 한계**
    - 단순한 오류 정보만 제공
    - 세밀한 제어 어려움
  - **HandlerExceptionResolver의 불편함**
    - `ModelAndView` 반환 (API에 불필요)
    - `HttpServletResponse`에 직접 데이터 작성 필요
    - 특정 컨트롤러 예외만 처리하기 어려움

<br/><br/>

## 서블릿 예외 처리 방식

### 기본 서블릿 오류 페이지 사용

- **WebServerCustomizer 설정**
  ```java
  @Component
  public class WebServerCustomizer implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {
      @Override
      public void customize(ConfigurableWebServerFactory factory) {
          ErrorPage errorPageEx = new ErrorPage(RuntimeException.class, "/error-page/500");
          factory.addErrorPages(errorPageEx);
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/WebServerCustomizer.java)

- **API 컨트롤러 예시**
  ```java
  @GetMapping("/api/members/{id}")
  public MemberDto getMember(@PathVariable("id") String id) {
      if (id.equals("ex")) {
          throw new RuntimeException("잘못된 사용자");
      }
      return new MemberDto(id, "hello " + id);
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/api/ApiExceptionController.java)

### 문제 상황

- **정상 요청**
  - JSON 응답 반환 (정상)
- **예외 발생 요청**
  - HTML 오류 페이지(`<!DOCTYPE HTML>...`) 반환
- **문제점**
  - 클라이언트는 JSON 응답을 기대하지만 서버는 HTML을 반환함
  - 웹 브라우저가 아닌 앱이나 타 서버는 HTML을 파싱하지 못해 문제 발생

### ErrorPageController에 JSON 응답 추가

- **JSON 응답 컨트롤러 메서드**
  ```java
  @RequestMapping(value = "/error-page/500", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> errorPage500Api(HttpServletRequest request, HttpServletResponse response) {
      Map<String, Object> result = new HashMap<>();
      Exception ex = (Exception) request.getAttribute(ERROR_EXCEPTION);
      result.put("status", request.getAttribute(ERROR_STATUS_CODE));
      result.put("message", ex.getMessage());
      
      Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
      return new ResponseEntity<>(result, HttpStatus.valueOf(statusCode));
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/servlet/ErrorPageController.java)
  - **`produces = MediaType.APPLICATION_JSON_VALUE`**
    - 클라이언트가 `Accept: application/json`으로 요청할 때만 이 메서드가 호출됨
  - **`ResponseEntity` 사용**
    - 메시지 컨버터가 동작하여 Map 데이터를 JSON으로 자동 변환해줌

<br/><br/>

## 스프링 부트 기본 오류 처리

### BasicErrorController

- **자동 설정**
  - 스프링 부트는 `/error` 경로에 기본 오류 컨트롤러(`BasicErrorController`)를 등록함
- **동작 방식**
  - **`errorHtml()`**
    - `Accept: text/html` 요청 시 호출 -> 뷰(HTML) 제공
  - **`error()`**
    - 그 외 요청 시 호출 -> JSON 데이터 제공

### 스프링 부트의 JSON 응답

- **기본 응답 구조**
  ```json
  {
      "timestamp": "2021-04-28T00:00:00.000+00:00",
      "status": 500,
      "error": "Internal Server Error",
      "exception": "java.lang.RuntimeException",
      "path": "/api/members/ex"
  }
  ```
- **설정 옵션 (`application.properties`)**
  - `server.error.include-message=always`
  - `server.error.include-exception=true`
  - 보안상 상세 정보 노출은 지양해야 함

### BasicErrorController의 한계

- **HTML 페이지**
  - 4xx, 5xx 오류 처리에 적합하고 편리함
- **API 오류 처리**
  - API마다, 예외마다 다른 응답 스펙(`code`, `message` 등 커스텀 필드)이 필요함
  - `BasicErrorController`는 일관된 포맷만 제공하여 유연성이 부족함
  - 따라서 API 예외 처리는 `@ExceptionHandler`를 권장함

<br/><br/>

## HandlerExceptionResolver

### 개념과 필요성

- **문제 상황**
  - 예외가 WAS까지 전파되면 무조건 500 상태 코드가 됨
  - 예외에 따라 400(Bad Request), 404(Not Found) 등으로 상태 코드를 변경하고 싶음
- **HandlerExceptionResolver**
  - 컨트롤러(핸들러) 밖으로 던져진 예외를 해결하고, 동작 방식을 새로 정의할 수 있는 스프링 인터페이스
  - 줄여서 `ExceptionResolver`라고 부름

### ExceptionResolver 적용 전후

- **적용 전**
  - 컨트롤러(예외) -> 인터셉터 -> DispatcherServlet -> WAS(예외 전파, 500 에러)
  
    ![resolver_before_flow](/assets/img/spring/api-exception/resolver_before_flow.png)
- **적용 후**
  - 컨트롤러(예외) -> 인터셉터 -> DispatcherServlet -> **ExceptionResolver(예외 해결)** -> 정상 응답(WAS에 예외 전달 안 됨)
  
    ![resolver_flow](/assets/img/spring/api-exception/resolver_flow.png)

### HandlerExceptionResolver 인터페이스

```java
public interface HandlerExceptionResolver {
    ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex);
}
```
- 예외를 해결하고 `ModelAndView`를 반환하면 정상 흐름으로 동작함

### UserHandlerExceptionResolver 구현

- **목표**
  - `UserException` 발생 시 400 상태 코드와 JSON 오류 메시지 반환
- **구현**
  ```java
  public class UserHandlerExceptionResolver implements HandlerExceptionResolver {
      private final ObjectMapper objectMapper = new ObjectMapper();
      
      @Override
      public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
          try {
              if (ex instanceof UserException) {
                  // HTTP 헤더가 JSON인 경우 처리
                  String acceptHeader = request.getHeader("accept");
                  response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                  
                  if ("application/json".equals(acceptHeader)) {
                      Map<String, Object> errorResult = new HashMap<>();
                      errorResult.put("ex", ex.getClass());
                      errorResult.put("message", ex.getMessage());
                      
                      String result = objectMapper.writeValueAsString(errorResult);
                      response.setContentType("application/json");
                      response.setCharacterEncoding("utf-8");
                      response.getWriter().write(result);
                      
                      return new ModelAndView(); // 빈 ModelAndView 반환 -> 뷰 렌더링 X, 정상 리턴
                  } else {
                      return new ModelAndView("error/500"); // HTML 요청은 500 페이지로
                  }
              }
          } catch (IOException e) {
              log.error("resolver ex", e);
          }
          return null;
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/resolver/UserHandlerExceptionResolver.java)
- **WebConfig 등록**
  - `extendHandlerExceptionResolvers`를 통해 등록해야 스프링 기본 설정을 유지하면서 추가 가능함
    ```java
    @Override
    public void extendHandlerExceptionResolvers(List<HandlerExceptionResolver> resolvers) {
        resolvers.add(new UserHandlerExceptionResolver());
    }
    ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/WebConfig.java)

### ExceptionResolver의 장단점

- **장점**
  - 예외를 서블릿 컨테이너까지 전파하지 않고 MVC 내부에서 깔끔하게 처리 가능
- **단점**
  - 직접 인터페이스를 구현하기가 번거롭고 복잡함
  - `response`에 데이터를 직접 써야 하는 불편함 (`response.getWriter()...`)

<br/><br/>

## 스프링이 제공하는 ExceptionResolver

- 스프링 부트는 다음 우선순위로 `ExceptionResolver`를 기본 등록함

  1. **ExceptionHandlerExceptionResolver** (가장 중요)
      - `@ExceptionHandler` 처리
  2. **ResponseStatusExceptionResolver**
      - `@ResponseStatus` 또는 `ResponseStatusException` 처리
  3. **DefaultHandlerExceptionResolver**
      - 스프링 내부 기본 예외 처리

### ResponseStatusExceptionResolver

- **기능**
  - 예외에 따라 HTTP 상태 코드를 지정함
- **@ResponseStatus 애노테이션**
  ```java
  @ResponseStatus(code = HttpStatus.BAD_REQUEST, reason = "잘못된 요청 오류")
  public class BadRequestException extends RuntimeException {}
  ```
  - 해당 예외 발생 시 `response.sendError(400)`이 호출됨
- **ResponseStatusException**
  ```java
  throw new ResponseStatusException(HttpStatus.NOT_FOUND, "error.bad", new IllegalArgumentException());
  ```
  - 라이브러리 예외 등 코드를 수정할 수 없을 때 사용

### DefaultHandlerExceptionResolver

- **기능**
  - 스프링 내부에서 발생하는 예외를 처리함
- **예시**
  - 파라미터 바인딩 오류(`TypeMismatchException`) 발생 시, 그냥 두면 500 에러가 나지만 이 리졸버가 400 에러로 바꿔줌 (클라이언트 잘못이므로)

<br/><br/>

## @ExceptionHandler

### @ExceptionHandler의 필요성

- `BasicErrorController`는 HTML 오류 페이지에는 좋지만, 세밀한 API 오류 제어에는 한계가 있음
- `HandlerExceptionResolver`를 직접 구현하는 것은 너무 복잡함
- 이에 대한 해결책으로 스프링은 **`@ExceptionHandler`** 라는 편리하고 유연한 기능을 제공함

### 사용법

- 컨트롤러 내부에 `@ExceptionHandler` 어노테이션이 붙은 메서드를 선언하여 예외를 처리함
  ```java
  @RestController
  public class ApiExceptionController {
      
      @ResponseStatus(HttpStatus.BAD_REQUEST)
      @ExceptionHandler(IllegalArgumentException.class)
      public ErrorResult illegalExHandle(IllegalArgumentException e) {
          return new ErrorResult("BAD", e.getMessage());
      }
      
      @ExceptionHandler
      public ResponseEntity<ErrorResult> userExHandle(UserException e) {
          ErrorResult errorResult = new ErrorResult("USER-EX", e.getMessage());
          return new ResponseEntity<>(errorResult, HttpStatus.BAD_REQUEST);
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/api/ApiExceptionV2Controller.java)

### 특징

- **우선순위**
  - 자세한 예외(자식 클래스)가 우선권을 가짐
- **다양한 예외 처리**
  - `@ExceptionHandler({AException.class, BException.class})` 처럼 여러 예외를 한 번에 처리 가능
- **실행 흐름**
  1. 컨트롤러에서 예외 발생 (`IllegalArgumentException`)
  2. `ExceptionHandlerExceptionResolver`가 동작
  3. 컨트롤러에 `@ExceptionHandler`가 있는지 확인
  4. 있으면 해당 메서드 실행 및 리턴 (정상 흐름으로 JSON 응답)

  ![handler_flow](/assets/img/spring/api-exception/handler_flow.png)

<br/><br/>

## @ControllerAdvice

### @ControllerAdvice의 필요성

- `@ExceptionHandler`를 사용하면 정상 코드와 예외 처리 코드가 하나의 컨트롤러에 섞이게 됨
- 이를 분리하기 위해 `@ControllerAdvice` 또는 `@RestControllerAdvice`를 사용함

### 사용법

- 별도의 클래스에 예외 처리 로직을 모아두고 `@RestControllerAdvice` 붙이기
  ```java
  @Slf4j
  @RestControllerAdvice
  public class ExControllerAdvice {
      
      @ResponseStatus(HttpStatus.BAD_REQUEST)
      @ExceptionHandler(IllegalArgumentException.class)
      public ErrorResult illegalExHandle(IllegalArgumentException e) {
          return new ErrorResult("BAD", e.getMessage());
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/exception/src/main/java/hello/exception/exhandler/advice/ExControllerAdvice.java)

### 특징 및 대상 지정

- **대상 지정**
  - `@ControllerAdvice(annotations = RestController.class)`
  - `@ControllerAdvice("org.example.controllers")` (패키지 지정)
  - 대상을 지정하지 않으면 모든 컨트롤러에 글로벌하게 적용됨
- **관례**
  - API 예외 처리는 `@RestControllerAdvice`
  - 뷰 예외 처리는 `@ControllerAdvice`

<br/><br/>

## 연습 문제

1. API 호출 시 HTML 오류 페이지가 클라이언트에게 문제가 되는 주된 이유는 무엇일까요?

   a. API 클라이언트는 보통 구조화된 데이터(JSON 등)를 예상해서

   - API는 시스템 간 통신에 사용되며, 구조화된 데이터(JSON)를 예상함
   - HTML은 파싱이 어려워 자동 처리가 곤란함
   - 클라이언트는 예상치 못한 HTML 대신 JSON 오류 응답을 원함

2. 스프링에서 HandlerExceptionResolver의 주된 역할은 무엇일까요?

   a. 컨트롤러 외부에서 발생한 예외를 처리하고 응답을 재정의하는 것

   - 이 리졸버는 컨트롤러 실행 중 발생한 예외를 스프링 MVC 단에서 가로채 처리함
   - WAS로 넘어가기 전에 응답 형태나 상태 코드를 변경할 수 있게 도움
   - 이를 통해 유연한 오류 응답 생성이 가능함

3. 스프링의 DefaultHandlerExceptionResolver가 주로 처리하는 역할은 무엇일까요?

   a. Spring 내부 예외(타입 미스매치 등)의 HTTP 상태 코드 변경

   - Spring 내부 예외(예: 잘못된 파라미터 타입)가 발생하면, 이 리졸버는 기본 500 오류 대신 400 Bad Request처럼 HTTP 표준에 맞는 상태 코드로 바꿔줌
   - 클라이언트 오류를 서버 오류와 구분함

4. API 예외 처리를 위해 HandlerExceptionResolver 직접 구현 대신 @ExceptionHandler를 사용하는 주요 이점은 무엇일까요?

   a. ModelAndView 없이 다양한 응답 타입(JSON 등) 반환 용이성

   - @ExceptionHandler는 API 응답에 적합한 ResponseEntity나 객체를 직접 반환할 수 있어 편리함
   - HandlerExceptionResolver처럼 ModelAndView에 얽매이지 않고 JSON 응답을 쉽게 만들 수 있음

5. 여러 컨트롤러에 걸쳐 발생하는 공통 예외 처리를 한 곳에 모아 관리하기 위해 사용하는 스프링 기능은 무엇일까요?

   a. @ControllerAdvice 또는 @RestControllerAdvice

   - @ControllerAdvice 또는 @RestControllerAdvice를 사용하면 여러 컨트롤러에서 발생하는 동일하거나 유사한 예외 처리 코드를 한 클래스에 모을 수 있음
   - 코드 중복을 줄이고 관리하기 쉽게 만들어 줌

<br/><br/>

## 요약 정리

- **API 예외 처리의 필요성**
  - **HTML**
    - `BasicErrorController`가 제공하는 오류 페이지로 충분함
  - **API**
    - 시스템마다 응답 스펙이 달라 세밀한 제어가 필요하며, JSON 형식으로 명확한 오류 정보를 제공해야 함
- **HandlerExceptionResolver**
  - **역할**
    - 컨트롤러 예외가 WAS까지 전파되지 않도록 MVC 내부에서 해결하고 정상 응답으로 변환함
  - **단점**
    - 직접 구현 시 `ModelAndView` 반환, `response` 직접 작성 등 사용이 번거로움
- **@ExceptionHandler**
  - **장점**
    - 해당 컨트롤러에서 발생한 예외를 메서드로 처리하여 매우 유연하고 직관적임
  - **기능**
    - `ResponseEntity`를 통해 상태 코드, 헤더, 바디(JSON)를 자유롭게 설정 가능
- **@ControllerAdvice**
  - **역할**
    - 여러 컨트롤러에 흩어진 예외 처리 코드를 별도 클래스로 분리하여 관리
  - **적용**
    - 특정 패키지나 애노테이션을 지정하여 글로벌하게 예외 처리 로직을 적용할 수 있음
    
<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
