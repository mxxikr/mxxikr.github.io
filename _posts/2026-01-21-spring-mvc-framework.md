---
title: '[스프링 MVC 1편 백엔드 웹 개발 핵심 기술] MVC 프레임워크 만들기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-21 13:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, front-controller, view-resolver, model-view, adapter-pattern]
math: false
mermaid: false
---
# MVC 프레임워크 만들기

- 김영한님의 스프링 MVC 1편 강의를 통해 프론트 컨트롤러 패턴을 도입하고, 단계별로 발전시켜 나가며 스프링 MVC의 내부 구조를 이해하는 과정을 정리함

<br/><br/>

## 프론트 컨트롤러 패턴 개요

### 도입 배경

- 기존에는 각 서블릿이 개별적으로 클라이언트 요청을 처리
- 공통 처리 로직의 중복이 발생

### 특징

- **프론트 컨트롤러 서블릿 하나**가 모든 클라이언트 요청을 받음
- 요청에 맞는 컨트롤러를 찾아서 호출
- **입구를 하나로 통일**하여 공통 처리가 가능
- 나머지 컨트롤러는 서블릿을 사용하지 않아도 됨

![프론트 컨트롤러 패턴](/assets/img/spring/mvc-frontcontroller-pattern.png)

### 스프링 MVC와의 관계

- 스프링 MVC의 `DispatcherServlet`이 프론트 컨트롤러 패턴으로 구현됨

<br/><br/>

## V1: 프론트 컨트롤러 도입

### 설계 원칙

- 기존 코드를 최대한 유지하면서 프론트 컨트롤러를 도입

### 구조

![V1 구조](/assets/img/spring/mvc-v1-structure.png)

### 주요 구성요소

- **`ControllerV1` 인터페이스**

  ```java
  public interface ControllerV1 {
      void process(HttpServletRequest request, HttpServletResponse response) 
          throws ServletException, IOException;
  }
  ```

  - 서블릿과 유사한 형태로 설계하여 일관성을 유지

- **`FrontControllerServletV1`**
  - `urlPatterns = "/front-controller/v1/*"`
    - v1 하위 모든 요청 처리
  - `controllerMap`
    - URL과 컨트롤러 매핑 정보 저장
  - `service()`
    - `requestURI`로 컨트롤러를 찾아서 실행

- [V1 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/servlet/src/main/java/hello/servlet/web/frontcontroller/v1)

<br/><br/>

## V2: View 분리

### 문제점

- 모든 컨트롤러에서 뷰 이동 코드가 중복됨

  ```java
  String viewPath = "/WEB-INF/views/new-form.jsp";
  RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
  dispatcher.forward(request, response);
  ```

### 해결 방안

- `MyView` 객체를 도입하여 뷰 렌더링 로직을 분리

![V2 뷰 처리 흐름](/assets/img/spring/mvc-v2-view-flow.png)

### 변경사항

- **`MyView` 클래스**
  - 뷰 렌더링 로직을 캡슐화
  - `render()` 메서드로 JSP forward 처리

- **`ControllerV2` 인터페이스**

  ```java
  public interface ControllerV2 {
      MyView process(HttpServletRequest request, HttpServletResponse response) 
          throws ServletException, IOException;
  }
  ```

### 개선 효과

- 컨트롤러는 `MyView` 객체만 생성하여 반환하면 되므로 중복 코드가 제거됨
- 뷰 로직의 재사용성이 향상됨
- 뷰 렌더링 방식 변경 시 `MyView`만 수정하면 되므로 유지보수가 용이함

- [MyView 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/frontcontroller/MyView.java)
- [V2 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/servlet/src/main/java/hello/servlet/web/frontcontroller/v2)

<br/><br/>

## V3: Model 추가

### 개선 목표

- **서블릿 종속성 제거**
- **뷰 이름 중복 제거**

### 구조

![V3 구조](/assets/img/spring/mvc-v3-structure.png)

### 주요 변경사항

- **서블릿 종속성 제거**
  - `HttpServletRequest` 대신 `Map<String, String> paramMap` 사용
  - `request.setAttribute` 대신 별도 `Model` 객체 사용
- **뷰 이름 중복 제거**
  - 논리 이름
    - `new-form`
  - 물리 경로
    - `/WEB-INF/views/new-form.jsp`
  - `ViewResolver`가 논리 이름을 물리 경로로 변환

### 주요 클래스

- **`ModelView` 클래스**

  ```java
  public class ModelView {
      private String viewName;
      private Map<String, Object> model = new HashMap<>();
  }
  ```

  - 뷰 이름과 모델 데이터를 함께 전달

- **`ControllerV3` 인터페이스**

  ```java
  public interface ControllerV3 {
      ModelView process(Map<String, String> paramMap);
  }
  ```

  - 서블릿 기술을 전혀 사용하지 않아 테스트가 용이

### FrontController 처리 흐름

1. `createParamMap()`
   - 요청 파라미터를 `Map`으로 변환
2. `controller.process(paramMap)`
   - 컨트롤러 호출
3. `viewResolver()`
   - 논리 이름을 물리 경로로 변환
4. `view.render()`
   - 모델 데이터를 `request`에 담고 JSP 실행

- [V3 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/servlet/src/main/java/hello/servlet/web/frontcontroller/v3)

<br/><br/>

## V4: 단순하고 실용적인 컨트롤러

### 개선 배경

- V3는 잘 설계되었지만, `ModelView` 객체를 항상 생성해야 하는 번거로움이 있음
- 개발자 입장에서 더 간결하고 실용적인 방식이 필요함

### 주요 아이디어

- 컨트롤러가 `ModelView` 대신 **뷰 이름만 반환**
- `Model` 객체를 파라미터로 전달받아 사용

![V4 Model 처리 흐름](/assets/img/spring/mvc-v4-model-flow.png)

### `ControllerV4` 인터페이스

```java
public interface ControllerV4 {
    String process(Map<String, String> paramMap, Map<String, Object> model);
}
```

- `Model`을 파라미터로 받아서 데이터를 담음
- 뷰 논리 이름(String)만 반환

### 개선 효과

- 프레임워크가 `Model` 객체 생성을 담당하므로 개발자는 비즈니스 로직에만 집중할 수 있음

- [V4 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/servlet/src/main/java/hello/servlet/web/frontcontroller/v4)

<br/><br/>

## V5: 유연한 컨트롤러 (어댑터 패턴)

### 도입 배경

- **V4의 한계**
  - V4는 실용적이지만 한 가지 방식의 컨트롤러만 지원
  - 개발자마다 선호하는 컨트롤러 방식이 다를 수 있음
- **해결 과제**
  - `ControllerV3`와 `ControllerV4`를 모두 지원해야 함
  - 기존 구조를 유지하면서 다양한 컨트롤러를 수용할 수 있어야 함

### 어댑터 패턴 개념

- 서로 다른 인터페이스를 가진 컨트롤러들을 하나의 프론트 컨트롤러에서 처리할 수 있게 함

![V5 어댑터 패턴](/assets/img/spring/mvc-v5-adapter-pattern.png)

### 주요 구성요소

- **핸들러 (Handler)**
  - 기존의 컨트롤러 개념을 확장한 용어
  - 어댑터가 지원하면 어떤 것이든 처리 가능
- **`MyHandlerAdapter` 인터페이스**

  ```java
  public interface MyHandlerAdapter {
      boolean supports(Object handler);
      ModelView handle(HttpServletRequest request, HttpServletResponse response, 
          Object handler) throws ServletException, IOException;
  }
  ```

  - `supports()`
    - 어댑터가 해당 핸들러를 처리할 수 있는지 판단
  - `handle()`
    - 실제 핸들러를 호출하고 `ModelView`를 반환

- **`ControllerV3HandlerAdapter`**
  - `ControllerV3`를 호출하고 `ModelView`를 그대로 반환

- **`ControllerV4HandlerAdapter`**
  - `ControllerV4`는 뷰 이름만 반환하므로 어댑터가 `ModelView`를 생성하여 반환

### FrontController 처리 흐름

1. `getHandler()`
   - URL로 핸들러 조회
2. `getHandlerAdapter()`
   - 핸들러를 처리할 수 있는 어댑터 조회
3. `adapter.handle()`
   - 어댑터를 통해 핸들러 실행
4. `viewResolver()`
   - 뷰 이름을 물리 경로로 변환
5. `view.render()`
   - 뷰 렌더링

- [V5 전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/tree/master/servlet/src/main/java/hello/servlet/web/frontcontroller/v5)

<br/><br/>

## 진화 과정 요약

### V1 → V2

- 중복되는 뷰 로직을 `MyView` 객체로 분리

### V2 → V3

- 서블릿 종속성 제거 (`paramMap`, `Model` 도입)
- 뷰 이름 중복 제거 (`ViewResolver` 도입)

### V3 → V4

- 실용성 개선 (`Model`을 파라미터로 전달, 뷰 이름만 반환)

### V4 → V5

- 유연성 확보 (어댑터 패턴 도입으로 다양한 컨트롤러 지원)

![MVC 프레임워크 진화 과정](/assets/img/spring/mvc-evolution.png)



<br/><br/>

## 연습 문제

1. 프론트 컨트롤러 패턴에서 클라이언트의 모든 요청을 가장 먼저 받아 처리하는 역할을 하는 것은 무엇일까요?

   a. 프론트 컨트롤러 서블릿

   - 클라이언트 요청을 중앙 집중식 게이트웨이 역할을 하는 프론트 컨트롤러는 먼저 전달받은 요청에 맞는 적합한 컨트롤러를 찾아 위임함
   - 여기서 요청의 맨 처음 진입점으로 클라이언트에게 직접적으로 노출되는 역할은 프론트 컨트롤러가 담당함

2. V3 버전에서 컨트롤러가 `HttpServletRequest`에 직접 의존하지 않도록 설계한 가장 큰 이유(장점)는 무엇인가요?

   a. 컨트롤러 테스트 용이성 및 단순화

   - `HttpServletRequest` 의존성을 제거하면 컨트롤러를 순수하게 테스트하기 쉬워지고, 코드 또한 단순해짐
   - 이는 V3 설계의 주요 목표 중 하나였음

3. V3에서 컨트롤러가 실제 물리적인 뷰 경로 대신 '논리적인' 뷰 이름을 반환하게 변경한 이유는 무엇이었을까요?

   a. 프론트 컨트롤러에서 뷰 경로 일괄 관리

   - 뷰의 물리적인 경로는 컨트롤러마다 중복되는 것 방지하고, 프론트 컨트롤러(`또는 ViewResolver`)에서 뷰 경로/접미사를 일괄적으로 관리하기 위함임

4. 다양한 형태의 컨트롤러(예: V3, V4)를 하나의 프론트 컨트롤러에서 유연하게 처리하기 위해 V5에서 도입된 '핸들러 어댑터(Handler Adapter)'의 주된 역할은 무엇일까요?

   a. 컨트롤러 실행 및 결과를 FC에 맞게 변환

   - 핸들러 어댑터는 다양한 인터페이스를 가진 컨트롤러를 프론트 컨트롤러가 호출할 수 있도록 중간에서 연결하고, 컨트롤러 실행 후 결과를 프론트 컨트롤러가 처리할 수 있는 형태(`ModelAndView` 등)로 변환함

5. 우리가 V1부터 V5까지 단계적으로 발전시킨 프레임워크 구조와 유사하게, 스프링 MVC의 중심 역할을 하는 `DispatcherServlet`은 어떤 디자인 패턴을 기반으로 구현되었을까요?

   a. 프론트 컨트롤러 패턴

   - 스프링 MVC의 `DispatcherServlet`은 모든 클라이언트 요청을 하나의 진입점에서 중앙 집중식으로 받아 처리하고 적절한 핸들러(컨트롤러)에 위임하는 프론트 컨트롤러 패턴을 구현한 것임

<br/><br/>

## 요약 정리

- **프론트 컨트롤러 패턴**
  - 모든 요청을 하나의 서블릿에서 받아 처리
  - 공통 처리 로직을 한 곳에서 관리
  - 스프링 MVC의 `DispatcherServlet`이 이 패턴으로 구현됨
- **V1: 프론트 컨트롤러 도입**
  - 기존 코드를 유지하면서 입구를 하나로 통일
  - `ControllerV1` 인터페이스로 일관성 확보
- **V2: View 분리**
  - `MyView` 객체로 뷰 렌더링 로직 분리
  - 중복 코드 제거
- **V3: Model 추가**
  - 서블릿 종속성 제거 (`paramMap`, `Model` 도입)
  - 뷰 이름 중복 제거 (`ViewResolver` 도입)
  - `ModelView`로 뷰 이름과 모델 데이터 전달
- **V4: 실용성 개선**
  - `Model`을 파라미터로 전달
  - 뷰 이름만 반환하여 코드 간결화
  - 프레임워크가 복잡성 처리
- **V5: 어댑터 패턴**
  - 다양한 컨트롤러 인터페이스 지원
  - `HandlerAdapter`로 유연성 확보
  - 핸들러 개념 도입
- **진화 과정**
  - 점진적 개선
    - 한 번에 완성하지 않고 단계별로 발전
  - 프레임워크의 역할
    - 복잡한 처리를 프레임워크가 담당
  - 개발자 집중
    - 비즈니스 로직에만 집중 가능
- **주요 개념**
  - `FrontController`
    - 요청의 진입점
  - `ViewResolver`
    - 논리 이름을 물리 경로로 변환
  - `HandlerAdapter`
    - 다양한 컨트롤러를 처리
  - `ModelView`
    - 뷰 이름과 데이터 전달

<br/><br/>

## Reference

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
