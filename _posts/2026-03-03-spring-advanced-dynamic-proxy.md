---
title: '[스프링 핵심 원리 - 고급편] 동적 프록시 기술'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-03 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, proxy-pattern, dynamic-proxy, jdk-dynamic-proxy, cglib]
math: false
mermaid: false
---

# 동적 프록시 기술

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 동적 프록시 기술의 개념과 JDK 동적 프록시, CGLIB의 차이를 이해하고 활용 방법을 정리함

<br/><br/>

## 리플렉션(Reflection)

### 개념
- 프록시 클래스를 대상 클래스마다 직접 만들면, 코드 흐름은 같고 **호출 메서드만 다른** 중복이 발생함
- 리플렉션은 클래스나 메서드의 **메타정보를 런타임에 동적으로 획득하고 호출**할 수 있게 해주는 자바 기본 기술임

### 문제 상황과 해결

- 문제 상황
  - `target.callA()`와 `target.callB()`처럼 호출 메서드가 다르면 공통 로직 하나로 묶기가 어려움
- 리플렉션 해결
  - 메서드 메타정보를 획득하여 동적으로 호출함

  ```java
  // 클래스 메타정보 획득
  Class classHello = Class.forName("hello.proxy.jdkdynamic.ReflectionTest$Hello");
  
  // 메서드 메타정보 획득
  Method methodCallA = classHello.getMethod("callA");
  Method methodCallB = classHello.getMethod("callB");
  
  // 동적 호출
  Object result1 = methodCallA.invoke(target);
  Object result2 = methodCallB.invoke(target);
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/jdkdynamic/ReflectionTest.java)

- 공통 로직으로 통합

  ```java
  private void dynamicCall(Method method, Object target) throws Exception {
      log.info("start");
      Object result = method.invoke(target); // 메서드를 동적으로 교체 가능
      log.info("result={}", result);
  }
  ```

### 흐름 요약

  ![동적 프록시 다이어그램 1](/assets/img/spring-advanced/13-dynamic-proxy-01.png)


### 주의사항
- 메서드를 동적으로 교체해 공통 로직을 통합할 수 있다는 장점이 있음
- 하지만 컴파일 시점에 오류를 잡지 못하고 **런타임 오류**가 발생할 수 있음
- 따라서 프레임워크나 공통 처리 목적으로만 **부분적이고 주의 깊게** 사용하는 것이 좋음

<br/><br/>

## JDK 동적 프록시

### 개념
- 대상 클래스가 N개일 때 프록시 클래스도 N개 만들어야 하는 문제를 해결하기 위해, 런타임에 프록시 객체를 동적으로 생성함
- **JDK 동적 프록시는 인터페이스가 필수임**

### 흐름 정리

  ![동적 프록시 다이어그램 2](/assets/img/spring-advanced/13-dynamic-proxy-02.png)


### 구현 코드

- `InvocationHandler` 필수 구현 (자바 제공)

  ```java
  public interface InvocationHandler {
      Object invoke(Object proxy, Method method, Object[] args) throws Throwable;
  }
  ```

- `TimeInvocationHandler` (기본 로직)

  ```java
  @Slf4j
  public class TimeInvocationHandler implements InvocationHandler {
      private final Object target;

      public TimeInvocationHandler(Object target) {
          this.target = target;
      }

      @Override
      public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
          log.info("TimeProxy 실행");
          long startTime = System.currentTimeMillis();
          Object result = method.invoke(target, args); // 실제 대상 객체 동적 호출
          long endTime = System.currentTimeMillis();
          log.info("TimeProxy 종료 resultTime={}", endTime - startTime);
          return result;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/jdkdynamic/code/TimeInvocationHandler.java)

- 동적 프록시 생성 로직

  ```java
  @Test
  void dynamicA() {
      AInterface target = new AImpl();
      TimeInvocationHandler handler = new TimeInvocationHandler(target);
      
      AInterface proxy = (AInterface) Proxy.newProxyInstance(
          AInterface.class.getClassLoader(), // 프록시가 로드될 클래스 로더
          new Class[]{AInterface.class},     // 프록시가 구현할 인터페이스들
          handler                            // 프록시 호출 시 실행될 핸들러
      );
      
      proxy.call();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/jdkdynamic/JdkDynamicProxyTest.java)

- `LogTraceBasicHandler` (적용 예제)

  ```java
  public class LogTraceBasicHandler implements InvocationHandler {
      private final Object target;
      private final LogTrace logTrace;

      public LogTraceBasicHandler(Object target, LogTrace logTrace) {
          this.target = target;
          this.logTrace = logTrace;
      }

      @Override
      public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
          TraceStatus status = null;
          try {
              String message = method.getDeclaringClass().getSimpleName() + "." + method.getName() + "()";
              status = logTrace.begin(message);

              Object result = method.invoke(target, args); // 실제 로직 호출

              logTrace.end(status);
              return result;
          } catch (Exception e) {
              logTrace.exception(status, e);
              throw e;
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v2_dynamicproxy/handler/LogTraceBasicHandler.java)

- `DynamicProxyBasicConfig` (빈 등록)

  ```java
  @Configuration
  public class DynamicProxyBasicConfig {
      @Bean
      public OrderControllerV1 orderControllerV1(LogTrace logTrace) {
          OrderControllerV1 orderController = new OrderControllerV1Impl(orderServiceV1(logTrace));
          return (OrderControllerV1) Proxy.newProxyInstance(
              OrderControllerV1.class.getClassLoader(),
              new Class[]{OrderControllerV1.class},
              new LogTraceBasicHandler(orderController, logTrace)
          );
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v2_dynamicproxy)

### 주요 이점
- 프록시 클래스를 직접 만들지 않아도 됨
- 부가 기능 로직(`InvocationHandler`)을 하나만 작성해 모든 대상에 공통 적용할 수 있어 단일 책임 원칙을 충족함

<br/><br/>

## JDK 동적 프록시 - 적용 2 (메서드 필터)

### 한계점
- `/v1/no-log` 호출 시에도 LogTrace가 실행됨
- 특정 메서드는 로그를 남기지 않아야 함에도 모든 요청에 대해 부가 기능이 동작함

### 구현 코드
- `LogTraceFilterHandler` (메서드 이름 필터 추가)

  ```java
  public class LogTraceFilterHandler implements InvocationHandler {
      private final Object target;
      private final LogTrace logTrace;
      private final String[] patterns;

      public LogTraceFilterHandler(Object target, LogTrace logTrace, String... patterns) {
          this.target = target;
          this.logTrace = logTrace;
          this.patterns = patterns;
      }

      @Override
      public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
          String methodName = method.getName();
          if (!PatternMatchUtils.simpleMatch(patterns, methodName)) {
              return method.invoke(target, args); // 필터 미매칭 시 실제 로직 바로 호출
          }

          TraceStatus status = null;
          try {
              String message = method.getDeclaringClass().getSimpleName() + "." + method.getName() + "()";
              status = logTrace.begin(message);
              Object result = method.invoke(target, args);
              logTrace.end(status);
              return result;
          } catch (Exception e) {
              logTrace.exception(status, e);
              throw e;
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v2_dynamicproxy/handler/LogTraceFilterHandler.java)

- `PatternMatchUtils` 패턴 규칙
  - `xxx`
    - 정확히 일치 (`request`)
  - `xxx*`
    - 시작하는 문자열 (`request*`)
  - `*xxx`
    - 끝나는 문자열 (`*Service`)
  - `*xxx*`
    - 포함하는 문자열 (`*order*`)

- `DynamicProxyFilterConfig`

  ```java
  @Configuration
  public class DynamicProxyFilterConfig {
      private static final String[] PATTERNS = {"request*", "order*", "save*"};

      @Bean
      public OrderControllerV1 orderControllerV1(LogTrace logTrace) {
          OrderControllerV1 orderController = new OrderControllerV1Impl(orderServiceV1(logTrace));
          return (OrderControllerV1) Proxy.newProxyInstance(
              OrderControllerV1.class.getClassLoader(),
              new Class[]{OrderControllerV1.class},
              new LogTraceFilterHandler(orderController, logTrace, PATTERNS)
          );
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v2_dynamicproxy/DynamicProxyFilterConfig.java)

<br/><br/>

## CGLIB (Code Generator Library)

### 개념
- JDK 동적 프록시는 인터페이스가 없으면 적용할 수 없음
- CGLIB는 **바이트코드를 조작해 구체 클래스를 상속**하는 방식으로 동적 프록시를 생성함
- 스프링 프레임워크에 내장되어 있어 별도 의존성 추가 없이 사용할 수 있음

### JDK와 CGLIB 비교

  | 구분 | JDK 동적 프록시 | CGLIB |
  |------|----------------|-------|
  | 생성 방식 | 인터페이스 구현(implements) | 구체 클래스 상속(extends) |
  | 필수 조건 | 인터페이스 필요 | 인터페이스 불필요 |
  | 구현 인터페이스 | `InvocationHandler` | `MethodInterceptor` |
  | 프록시 이름 예시 | `com.sun.proxy.$Proxy1` | `ConcreteService$$EnhancerByCGLIB$$25d6b0e3` |

### 구현 코드

- `MethodInterceptor` (CGLIB 제공)

  ```java
  public interface MethodInterceptor extends Callback {
      Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable;
  }
  ```

- `TimeMethodInterceptor` (적용 예제)

  ```java
  @Slf4j
  public class TimeMethodInterceptor implements MethodInterceptor {
      private final Object target;

      public TimeMethodInterceptor(Object target) {
          this.target = target;
      }

      @Override
      public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
          log.info("TimeProxy 실행");
          long startTime = System.currentTimeMillis();

          Object result = proxy.invoke(target, args); // method 대신 proxy 사용이 성능상 유리

          long endTime = System.currentTimeMillis();
          log.info("TimeProxy 종료 resultTime={}", endTime - startTime);
          return result;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/cglib/code/TimeMethodInterceptor.java)

- CGLIB 프록시 생성 방식

  ```java
  @Test
  void cglib() {
      ConcreteService target = new ConcreteService(); // 인터페이스 없는 구체 클래스
      Enhancer enhancer = new Enhancer();
      enhancer.setSuperclass(ConcreteService.class);           // 상속할 클래스 지정
      enhancer.setCallback(new TimeMethodInterceptor(target)); // 실행 로직 지정

      ConcreteService proxy = (ConcreteService) enhancer.create(); // 프록시 생성
      proxy.call();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/cglib/code)


### CGLIB 제약 사항
- 자식 클래스를 동적으로 생성하므로 부모 클래스에 **기본 생성자**가 필요함
- 클래스와 메서드에 `final` 키워드가 붙어 있으면 상속이나 오버라이딩이 불가능해 프록시 로직이 동작하지 않음

<br/><br/>

## 남은 문제

- 인터페이스 유무에 따라 JDK 동적 프록시와 CGLIB를 수동으로 나누어 써야 하는 불편함이 있음
- `InvocationHandler`와 `MethodInterceptor` 두 가지를 모두 각각 구현해야 함
- 특정 메서드 패턴에서만 프록시 로직을 적용하는 로직을 공통으로 빼기 어려함
- 이러한 문제들을 해결해 주는 것이 스프링의 `ProxyFactory`임

<br/><br/>

## 연습 문제

1. 수동 프록시 방식의 주된 문제점은 무엇일까요?

    a. 대상 클래스 수만큼 유사한 프록시 클래스 생성

    - 수동 프록시는 대상마다 유사한 코드를 가진 프록시 클래스를 계속 만들어야 했지만, 동적 프록시는 이 문제를 해결해 코드 중복을 줄임

2. JDK 동적 프록시와 CGLIB 동적 프록시의 가장 큰 차이점은 무엇일까요?

    a. 프록시 대상의 종류 (인터페이스와 구체 클래스 비교)

    - JDK는 인터페이스 기반, CGLIB는 구체 클래스 상속 기반으로 프록시를 만듦

3. JDK 동적 프록시 기술을 사용하기 위한 필수 조건은 무엇일까요?

    a. 인터페이스 구현

    - JDK 동적 프록시는 반드시 인터페이스를 구현한 객체에만 적용할 수 있으며, 인터페이스가 없으면 CGLIB를 사용해야 함

4. CGLIB 동적 프록시가 JDK 동적 프록시보다 유연하게 활용될 수 있는 대표적인 경우는 무엇일까요?

    a. 프록시할 대상이 인터페이스가 아닌 구체 클래스일 때

    - 인터페이스가 없는 구체 클래스는 JDK 동적 프록시로 프록시하기 어려우므로, 상속을 지원하는 CGLIB를 통해 구체 클래스에도 프록시를 적용할 수 있음

5. 동적 프록시(JDK InvocationHandler 또는 CGLIB MethodInterceptor)에서 별도 구현체로 분리되는 로직의 주된 역할은 무엇일까요?

    a. 주요 기능 앞뒤에 부가 기능 적용

    - `InvocationHandler`나 `MethodInterceptor`는 클라이언트 호출을 가로채서 실제 대상 객체 호출 전후에 부가적인 로직(예 로깅, 시간 측정)을 수행하는 역할을 함

<br/><br/>

## 요약 정리

- 프록시 클래스를 일일이 만들면 코드 중복과 유지보수 부담이 생기므로, 자바 기본 기술인 **리플렉션**이나 바이트코드 조작 기술을 활용해야 함
- 인터페이스가 있다면 **JDK 동적 프록시**(`InvocationHandler`)를 사용하고, 인터페이스 없이 구체 클래스만 있다면 **CGLIB**(`MethodInterceptor`)를 사용함
- 동적 프록시를 통해 적용할 대상 클래스 개수에 상관없이 **하나의 공통 프록시 로직만으로 확장이 가능함**
- 다만 상황에 따라 두 가지 기술로 나누어 적용해야 하는 불편함이 있으며, 스프링 프레임워크는 이를 `ProxyFactory` 단위로 한 번 더 추상화하여 통합 제공함

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
