---
title: '[김영한의 스프링 MVC 1편 백엔드 웹 개발 핵심 기술] 스프링 MVC 구조 이해'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-21 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, dispatcher-servlet, handler-mapping, handler-adapter, view-resolver, request-mapping]
math: false
mermaid: false
---
# 스프링 MVC 구조 이해

- 김영한님의 스프링 MVC 1편 강의를 통해 직접 만든 MVC 프레임워크와 스프링 MVC를 비교하고, `DispatcherServlet`의 구조와 동작 원리, 핸들러 매핑과 어댑터, 뷰 리졸버, `@RequestMapping` 기반 컨트롤러의 발전 과정을 정리함

<br/><br/>

## 직접 만든 MVC 프레임워크와 스프링 MVC 비교

### 용어 대응 관계

| 직접 만든 프레임워크 | 스프링 MVC |
|---|---|
| `FrontController` | `DispatcherServlet` |
| `handlerMappingMap` | `HandlerMapping` |
| `MyHandlerAdapter` | `HandlerAdapter` |
| `ModelView` | `ModelAndView` |
| `viewResolver` | `ViewResolver` |
| `MyView` | `View` |

### 개념

- 스프링 MVC도 프론트 컨트롤러 패턴으로 구현되어 있음
- `DispatcherServlet`이 프론트 컨트롤러 역할을 담당

<br/><br/>

## DispatcherServlet 구조

### 상속 계층

![DispatcherServlet 상속 계층](/assets/img/spring/dispatcher-servlet-hierarchy.png)

### 서블릿 등록

- 스프링 부트가 `DispatcherServlet`을 서블릿으로 자동 등록
- `urlPatterns="/"`
  - 모든 경로에 대해 매핑됨
- **우선순위**
  - 더 자세한 경로가 우선순위가 높음
  - 기존 서블릿도 함께 동작 가능

### 요청 처리 흐름

1. `HttpServlet`의 `service()` 호출
2. `FrameworkServlet`에서 `service()` 오버라이드
3. 여러 메서드 호출을 거쳐 `DispatcherServlet.doDispatch()` 호출

<br/><br/>

## DispatcherServlet 로직

### `doDispatch()` 메서드 구조

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) {
    // 핸들러 조회
    mappedHandler = getHandler(processedRequest);
    
    // 핸들러 어댑터 조회
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
    
    // 핸들러 어댑터 실행 -> 핸들러 실행 -> ModelAndView 반환
    mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
    
    // 뷰 렌더링
    processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
}
```

### 동작 순서

![DispatcherServlet 동작 순서](/assets/img/spring/dispatcher-servlet-sequence.png)

### 단계별 설명

- **1. 핸들러 조회**
  - 핸들러 매핑을 통해 요청 URL에 매핑된 핸들러(컨트롤러)를 조회
- **2. 핸들러 어댑터 조회**
  - 핸들러를 실행할 수 있는 핸들러 어댑터를 조회
- **3. 핸들러 어댑터 실행**
  - 조회한 핸들러 어댑터를 실행
- **4. 핸들러 실행**
  - 핸들러 어댑터가 실제 핸들러를 실행
- **5. `ModelAndView` 반환**
  - 핸들러 어댑터는 핸들러가 반환하는 정보를 `ModelAndView`로 변환하여 반환
- **6. `ViewResolver` 호출**
  - 뷰 리졸버를 찾아서 실행
  - JSP의 경우 `InternalResourceViewResolver`가 자동 등록됨
- **7. `View` 반환**
  - 뷰 리졸버는 뷰의 논리 이름을 물리 이름으로 변환
  - 렌더링 역할을 담당하는 뷰 객체를 반환
  - JSP의 경우 내부에 `forward()` 로직이 있는 `InternalResourceView`(`JstlView`)를 반환
- **8. 뷰 렌더링**
  - 뷰를 통해서 뷰를 렌더링

<br/><br/>

## 주요 인터페이스

### 확장 가능한 설계

- `DispatcherServlet` 코드 변경 없이 원하는 기능을 변경하거나 확장할 수 있음

### 인터페이스 목록

- **`HandlerMapping`**
  - `org.springframework.web.servlet.HandlerMapping`
- **`HandlerAdapter`**
  - `org.springframework.web.servlet.HandlerAdapter`
- **`ViewResolver`**
  - `org.springframework.web.servlet.ViewResolver`
- **`View`**
  - `org.springframework.web.servlet.View`

<br/><br/>

## 핸들러 매핑과 핸들러 어댑터

### 스프링 부트 자동 등록 목록

- **`HandlerMapping` (우선순위 순)**

  ```
  0 = RequestMappingHandlerMapping
  ```
  - @RequestMapping 애노테이션 기반 컨트롤러    

  ```
  1 = BeanNameUrlHandlerMapping
  ```
  - 스프링 빈의 이름으로 핸들러 찾기

- **`HandlerAdapter` (우선순위 순)**

  ```
  0 = RequestMappingHandlerAdapter
  ```
    - @RequestMapping 애노테이션 기반 컨트롤러
  ``` 
  1 = HttpRequestHandlerAdapter
  ```
    - HttpRequestHandler 인터페이스 처리
  ```    
  2 = SimpleControllerHandlerAdapter
  ```
    - Controller 인터페이스 처리 (과거 방식)
  

### 동작 방식

- 핸들러 매핑과 핸들러 어댑터 모두 순서대로 찾음
- 없으면 다음 순서로 넘어감

<br/><br/>

## 과거 방식 컨트롤러 예제

### `Controller` 인터페이스 방식

```java
@Component("/springmvc/old-controller")
public class OldController implements Controller {
    @Override
    public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) {
        System.out.println("OldController.handleRequest");
        return null;
    }
}
```
- [과거 방식 예제 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/springmvc/old/OldController.java)

- **처리 과정**

  ![OldController 처리 과정](/assets/img/spring/old-controller-flow.png)

  1. **핸들러 매핑으로 핸들러 조회**
     - `BeanNameUrlHandlerMapping`이 빈 이름으로 핸들러를 찾아 `OldController` 반환
  2. **핸들러 어댑터 조회**
     - `SimpleControllerHandlerAdapter`가 `Controller` 인터페이스를 지원
  3. **핸들러 어댑터 실행**
     - `SimpleControllerHandlerAdapter`가 `OldController`를 실행하고 결과 반환

### `HttpRequestHandler` 방식

```java
@Component("/springmvc/request-handler")
public class MyHttpRequestHandler implements HttpRequestHandler {
    @Override
    public void handleRequest(HttpServletRequest request, HttpServletResponse response) {
        System.out.println("MyHttpRequestHandler.handleRequest");
    }
}
```
- [과거 방식 예제 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/springmvc/old/MyHttpRequestHandler.java)

- **처리 과정**
  1. **핸들러 매핑**
     - `BeanNameUrlHandlerMapping`이 `MyHttpRequestHandler` 반환
  2. **핸들러 어댑터 조회**
     - `HttpRequestHandlerAdapter`가 `HttpRequestHandler` 인터페이스 지원
  3. **핸들러 어댑터 실행**
     - `HttpRequestHandlerAdapter`가 핸들러 실행

### 현대적 방식

- 실무에서는 99.9% `@RequestMapping` 기반 컨트롤러를 사용
- `RequestMappingHandlerMapping`과 `RequestMappingHandlerAdapter`가 처리



<br/><br/>

## 뷰 리졸버

### 설정 방법

```properties
spring.mvc.view.prefix=/WEB-INF/views/
spring.mvc.view.suffix=.jsp
```

- 스프링 부트는 이 설정으로 `InternalResourceViewResolver`를 자동 등록

### 스프링 부트가 자동 등록하는 뷰 리졸버
```
1 = BeanNameViewResolver
```
  - 빈 이름으로 뷰 찾기 (예: 엑셀 파일 생성)
```    
2 = InternalResourceViewResolver
```
   - JSP 처리 가능한 뷰 반환


### 동작 과정

![ViewResolver 동작 과정](/assets/img/spring/view-resolver-flow.png)

1. **핸들러 어댑터 호출**
   - 논리 뷰 이름 `new-form` 획득
2. **`ViewResolver` 호출**
   - `BeanNameViewResolver`
     - `new-form` 이름의 스프링 빈 찾기 실패
   - `InternalResourceViewResolver` 호출
3. **`InternalResourceViewResolver`**
   - `InternalResourceView` 반환
4. **뷰 `InternalResourceView`**
   - JSP처럼 `forward()`를 호출해서 처리할 수 있는 경우에 사용
5. **`view.render()`**
   - `InternalResourceView`가 `forward()`를 사용하여 JSP 실행

### 참고사항

- JSTL 라이브러리가 있으면 `JstlView`를 반환
- JSP는 `forward()`를 통해 이동해야 렌더링됨
- 다른 뷰 템플릿은 `forward()` 없이 바로 렌더링됨
- Thymeleaf는 라이브러리만 추가하면 스프링 부트가 자동 설정

<br/><br/>

## @RequestMapping 기반 컨트롤러

### 도입 배경

- 과거 스프링은 MVC 부분이 약해 스트럿츠 같은 프레임워크를 사용
- `@RequestMapping` 기반 컨트롤러 등장 이후 스프링의 완승으로 끝남

### 구성요소

- **`RequestMappingHandlerMapping`**
  - 핸들러 매핑
- **`RequestMappingHandlerAdapter`**
  - 핸들러 어댑터
- **실무에서 99.9% 이 방식 사용**

<br/><br/>

## V1: 기본 @RequestMapping 방식

### 회원 등록 폼

- [회원 등록 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/springmvc/v1/SpringMemberFormControllerV1.java)

- 기본 구조

  - `@Controller` + `@RequestMapping`을 사용한 가장 기본적인 형태
  - 각 기능마다 별도의 컨트롤러 클래스를 생성
  - `ModelAndView` 객체를 생성하여 반환

### 주요 애노테이션

- **`@Controller`**
  - 스프링이 자동으로 스프링 빈으로 등록 (내부에 `@Component` 포함)
  - 스프링 MVC에서 애노테이션 기반 컨트롤러로 인식
- **`@RequestMapping`**
  - 요청 정보를 매핑하여 해당 URL 호출 시 메서드 실행
  - 애노테이션 기반이므로 메서드 이름은 임의로 지정 가능
- **`ModelAndView`**
  - 모델과 뷰 정보를 담아서 반환

### 컨트롤러 인식 조건

- `RequestMappingHandlerMapping`은 다음 조건의 스프링 빈을 매핑 정보로 인식
  - `@RequestMapping` 또는 `@Controller`가 클래스 레벨에 있는 경우

### 대체 방식

- **컴포넌트 스캔 사용**

  ```java
  @Component
  @RequestMapping
  public class SpringMemberFormControllerV1 { }
  ```

- **직접 빈 등록**

  ```java
  @Bean
  SpringMemberFormControllerV1 springMemberFormControllerV1() {
      return new SpringMemberFormControllerV1();
  }
  ```

>  **스프링 3.0 이상 주의사항**
> 
> - 스프링 부트 3.0부터는 클래스 레벨에 `@Controller`가 반드시 필요함
> - `@RequestMapping`만으로는 인식되지 않음

### 회원 저장

- [회원 저장 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/springmvc/v1/SpringMemberSaveControllerV1.java)

- **`mv.addObject()`**
  - 모델 데이터 추가 시 사용하며, 뷰 렌더링 시 활용됨

### 회원 목록

- [회원 목록 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/springmvc/v1/SpringMemberListControllerV1.java)

- 특징
  - `HttpServletRequest`, `HttpServletResponse`를 직접 사용
  - `ModelAndView`에 모델 데이터와 뷰 이름을 담아서 반환
  - 각 URL마다 별도의 컨트롤러 클래스 필요 (회원 등록 폼, 회원 저장, 회원 목록)

- [V1 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/servlet/src/main/java/hello/servlet/web/springmvc/v1)

<br/><br/>

## V2: 컨트롤러 통합

### 아이디어

- `@RequestMapping`은 메서드 단위로 적용됨
- 컨트롤러 클래스를 하나로 통합할 수 있음

### 주요 개선점

- 클래스 레벨에 `@RequestMapping("/springmvc/v2/members")` 추가
- 관련 기능들을 하나의 컨트롤러 클래스로 통합
- 메서드 레벨의 `@RequestMapping`과 조합되어 최종 URL 결정

- **구조 예시**

  ```java
  @Controller
  @RequestMapping("/springmvc/v2/members")  // 클래스 레벨
  public class SpringMemberControllerV2 {
      @RequestMapping("/new-form")           // → /springmvc/v2/members/new-form
      public ModelAndView newForm() {  }
      
      @RequestMapping("/save")               // → /springmvc/v2/members/save
      public ModelAndView save() {  }
      
      @RequestMapping                        // → /springmvc/v2/members
      public ModelAndView members() {  }
  }
  ```

- [V2 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/springmvc/src/main/java/hello/springmvc/basic/requestmapping)

### 조합 방식

- 클래스 레벨과 메서드 레벨의 `@RequestMapping`이 조합됨

![V2 URL 매핑 조합](/assets/img/spring/v2-url-mapping.png)

<br/><br/>

## V3: 실용적인 방식 (실무 표준)

### 개선 사항

- `Model` 도입
- `ViewName` 직접 반환
- `@RequestParam` 사용
- `@GetMapping`, `@PostMapping` 도입

### 주요 개선점

- **구조 예시**

  ```java
  @Controller
  @RequestMapping("/springmvc/v3/members")
  public class SpringMemberControllerV3 {
      @GetMapping("/new-form")
      public String newForm() {
          return "new-form";  // ViewName 직접 반환
      }
      
      @PostMapping("/save")
      public String save(
              @RequestParam("username") String username,  // @RequestParam 사용
              @RequestParam("age") int age,
              Model model) {  // Model 파라미터로 받음
          
          Member member = new Member(username, age);
          memberRepository.save(member);
          model.addAttribute("member", member);
          return "save-result";
      }
      
      @GetMapping
      public String members(Model model) {
          List<Member> members = memberRepository.findAll();
          model.addAttribute("members", members);
          return "members";
      }
  }
  ```

- [V3 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/springmvc/src/main/java/hello/springmvc/basic/requestmapping)

### 주요 개선 내용

- **`Model` 파라미터**
  - 스프링이 `Model` 객체를 파라미터로 제공하여 편리하게 사용할 수 있음
- **`ViewName` 직접 반환**
  - `ModelAndView` 대신 뷰의 논리 이름을 `String`으로 직접 반환
- **`@RequestParam`**
  - HTTP 요청 파라미터를 받을 수 있음
  - `@RequestParam("username")`은 `request.getParameter("username")`과 동일
  - GET 쿼리 파라미터, POST Form 모두 지원

### HTTP Method 구분

- **기본 방식**

  ```java
  @RequestMapping(value = "/new-form", method = RequestMethod.GET)
  ```

- **편리한 방식**
  - `@GetMapping`
  - `@PostMapping`
  - `@PutMapping`
  - `@DeleteMapping`
  - `@PatchMapping`
  - 이들은 내부적으로 `@RequestMapping` 애노테이션을 포함하고 있음


<br/><br/>

## 연습 문제

1. 스프링 MVC에서 HTTP 요청을 가장 먼저 받아 처리하는 핵심 컴포넌트는 무엇일까요?

   a. `DispatcherServlet`

   - 스프링 MVC에서 모든 HTTP 요청은 이 컴포넌트를 통해 들어옴
   - 여기서 요청을 하나의 진입점에서 전달받은 후, `HandlerMapping`이나 `HandlerAdapter` 등에 차례로 위임함

2. `DispatcherServlet` 이후, 요청 처리를 위해 일반적으로 `Handler`를 찾고 실행한 뒤 `View`를 찾는 과정에서 핵심적인 순서는 무엇일까요?

   a. `HandlerMapping` → `HandlerAdapter` → `ViewResolver`

   - `DispatcherServlet`은 요청을 받으면 `HandlerMapping`으로 `Handler`를 찾고, `HandlerAdapter`로 실행함
   - 실행 결과로 `ViewResolver`가 실제 `View`를 찾음

3. Spring MVC에서 요청 URL을 처리할 `Handler`(`Controller`)를 찾는 역할을 분리하여 담당하는 두 컴포넌트는 각각 무엇일까요?

   a. `HandlerMapping`, `HandlerAdapter`

   - 요청 URL에 맞는 `Handler`를 찾는 것은 `HandlerMapping`이, 이 `Handler`의 타입에 상관없이 실행하는 것은 `HandlerAdapter`의 역할임
   - 이 둘이 함께 동작함

4. `Handler` 실행 후 반환된 논리적인 `View` 이름을 실제 `View`(예: JSP 파일)로 변환하여 찾아내는 역할을 하는 컴포넌트는 무엇일까요?

   a. `ViewResolver`

   - `Controller`가 반환한 `View` 이름(논리적 이름)을 가지고 실제 `View` 템플릿 객체(예: JSP)를 찾아주는 역할을 `ViewResolver`가 담당함

5. 현대적인 Spring MVC 개발에서 `@Controller`, `@GetMapping`, `@PostMapping`과 같은 애노테이션은 주로 어떤 역할을 가능하게 할까요?

   a. HTTP 요청과 `Handler`/`Method` 매핑 및 처리 방식 정의

   - 이 애노테이션들은 특정 URL 패턴의 HTTP 요청(GET/POST 등)을 어떤 `Controller` 클래스의 어떤 `Method`가 처리할지 편리하게 연결(매핑)하고 그 방식을 정의해줌

<br/><br/>

## 요약 정리

- **프론트 컨트롤러 패턴과 스프링 MVC**
  - 직접 만든 프레임워크의 `FrontController`가 스프링 MVC의 `DispatcherServlet`에 대응
  - `HandlerMapping`, `HandlerAdapter`, `ViewResolver` 등의 인터페이스로 확장 가능한 구조
- **`DispatcherServlet` 동작 순서**
  1. 핸들러 조회 (`HandlerMapping`)
  2. 핸들러 어댑터 조회 (`HandlerAdapter`)
  3. 핸들러 어댑터 실행 → 핸들러 실행
  4. `ModelAndView` 반환
  5. `ViewResolver` 호출
  6. `View` 반환
  7. 뷰 렌더링
- **핸들러 매핑과 어댑터**
  - `RequestMappingHandlerMapping`/`RequestMappingHandlerAdapter`
    - `@RequestMapping` 기반 (실무 99.9%)
  - `BeanNameUrlHandlerMapping`/`SimpleControllerHandlerAdapter`
    - 과거 방식
- **뷰 리졸버**
  - `BeanNameViewResolver`
    - 빈 이름으로 뷰 찾기
  - `InternalResourceViewResolver`
    - JSP 처리
  - `spring.mvc.view.prefix`/`suffix` 설정으로 자동 등록
- **`@RequestMapping` 발전 과정**
  - V1: 기본 방식
    - `@Controller` + `@RequestMapping`
    - `ModelAndView` 반환
  - V2: 컨트롤러 통합
    - 클래스 레벨 `@RequestMapping`으로 경로 조합
  - V3: 실용적 방식 (실무 표준)
    - `Model` 파라미터
    - `String` 반환 (뷰 이름)
    - `@RequestParam`
    - `@GetMapping`, `@PostMapping`
- **원칙**
  - 인터페이스 기반 설계
    - 코드 변경 없이 기능 확장 가능
  - 점진적 발전
    - V1 → V2 → V3로 실용성 향상
  - 프레임워크의 역할
    - 복잡한 처리는 프레임워크가 담당
    - 개발자는 비즈니스 로직에 집중

<br/><br/>

## Reference

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
