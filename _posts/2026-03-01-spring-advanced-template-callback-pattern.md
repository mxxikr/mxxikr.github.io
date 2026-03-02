---
title: '[스프링 핵심 원리 - 고급편] 템플릿 메서드 패턴과 콜백 패턴'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-01 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, template-method, strategy-pattern, callback-pattern, design-pattern]
math: false
mermaid: false
---

# 템플릿 메서드 패턴과 콜백 패턴

- 김영한님의 스프링 핵심 원리 - 고급편 강의를 바탕으로, 핵심 기능과 부가 기능이 섞이는 문제를 템플릿 메서드 패턴 → 전략 패턴 → 템플릿 콜백 패턴으로 단계적으로 개선하는 과정을 정리함

<br/><br/>

## 문제 상황 - 핵심 기능과 부가 기능

- 로그 추적기를 도입하면 원래 깔끔하던 비즈니스 로직에 부가 기능 코드가 뒤섞이게 됨

- 도입 전 (V0)

  ```java
  // OrderServiceV0
  public void orderItem(String itemId) {
      orderRepository.save(itemId); // 핵심 기능만 존재
  }
  ```

- 도입 후 (V3)

  ```java
  // OrderServiceV3
  public void orderItem(String itemId) {
      TraceStatus status = null;
      try {
          status = trace.begin("OrderService.orderItem()");
          orderRepository.save(itemId); // 핵심 기능
          trace.end(status);
      } catch (Exception e) {
          trace.exception(status, e);
          throw e;
      }
  }
  ```

- 핵심 기능과 부가 기능 구분

  | 구분 | 설명 | 예시 |
  |---|---|---|
  | 핵심 기능 | 해당 객체가 제공하는 고유의 기능 | 주문 저장, 간식 조회 |
  | 부가 기능 | 핵심 기능을 보조하기 위한 기능 | 로그 추적, 트랜잭션 |

- 문제
  - try-catch 블록 안에 핵심 로직이 들어 있어 단순 메서드 추출이 불가능하며, **변하는 것(비즈니스 로직)과 변하지 않는 것(로그 추적 구조)을 분리**해야 함


<br/><br/>

## 템플릿 메서드 패턴 - 개념

- 부모 클래스에 변하지 않는 **템플릿**(알고리즘 골격)을 정의하고, 변하는 부분은 자식 클래스에서 **상속과 오버라이딩**으로 처리하는 패턴임

  ![템플릿 메서드 패턴 클래스 다이어그램](/assets/img/spring-advanced/08-template-method-classdiagram.png)

- GOF 정의
  > "작업에서 알고리즘의 골격을 정의하고 일부 단계를 하위 클래스로 연기합니다. 템플릿 메서드를 사용하면 하위 클래스가 알고리즘의 구조를 변경하지 않고도 알고리즘의 특정 단계를 재정의할 수 있습니다."


<br/><br/>

## 템플릿 메서드 패턴 - 예제 코드

- `AbstractTemplate` (부모 클래스 - 변하지 않는 부분)

  ```java
  @Slf4j
  public abstract class AbstractTemplate {
      public void execute() {
          long startTime = System.currentTimeMillis();
          call(); // 변하는 부분 호출 (상속)
          long endTime = System.currentTimeMillis();
          long resultTime = endTime - startTime;
          log.info("resultTime={}", resultTime);
      }

      protected abstract void call(); // 변하는 부분 - 자식이 구현
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/template/code/AbstractTemplate.java)

- `SubClassLogic1` / `SubClassLogic2` (자식 클래스 - 변하는 부분)

  ```java
  @Slf4j
  public class SubClassLogic1 extends AbstractTemplate {
      @Override
      protected void call() {
          log.info("비즈니스 로직1 실행");
      }
  }

  @Slf4j
  public class SubClassLogic2 extends AbstractTemplate {
      @Override
      protected void call() {
          log.info("비즈니스 로직2 실행");
      }
  }
  ```

- 테스트 코드 - 구체 클래스 사용

  ```java
  @Test
  void templateMethodV1() {
      AbstractTemplate template1 = new SubClassLogic1();
      template1.execute();

      AbstractTemplate template2 = new SubClassLogic2();
      template2.execute();
  }
  ```

- 테스트 코드 - 익명 내부 클래스 활용 (별도 클래스 생성 불필요)

  ```java
  @Test
  void templateMethodV2() {
      AbstractTemplate template1 = new AbstractTemplate() {
          @Override
          protected void call() {
              log.info("비즈니스 로직1 실행");
          }
      };
      template1.execute();
  }
  ```
  - [전체 테스트 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/template/TemplateMethodTest.java)

- 실행 흐름

  ![템플릿 메서드 패턴 실행 흐름](/assets/img/spring-advanced/09-template-method-sequence.png)


<br/><br/>

## 템플릿 메서드 패턴 - 적용

- 로그 추적기에 실제로 적용하기 위해 제네릭을 사용한 `AbstractTemplate<T>`을 구현함

- `AbstractTemplate<T>`

  ```java
  public abstract class AbstractTemplate<T> {
      private final LogTrace trace;

      public AbstractTemplate(LogTrace trace) {
          this.trace = trace;
      }

      public T execute(String message) {
          TraceStatus status = null;
          try {
              status = trace.begin(message);
              T result = call(); // 변하는 부분
              trace.end(status);
              return result;
          } catch (Exception e) {
              trace.exception(status, e);
              throw e;
          }
      }

      protected abstract T call();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/template/AbstractTemplate.java)

- `OrderControllerV4`
  - 익명 내부 클래스로 `call()`을 구현하여 핵심 비즈니스 로직만 작성함

  ```java
  @GetMapping("/v4/request")
  public String request(String itemId) {
      AbstractTemplate<String> template = new AbstractTemplate<>(trace) {
          @Override
          protected String call() {
              orderService.orderItem(itemId);
              return "ok";
          }
      };
      return template.execute("OrderController.request()");
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v4/OrderControllerV4.java)

- `OrderServiceV4`

  ```java
  public void orderItem(String itemId) {
      AbstractTemplate<Void> template = new AbstractTemplate<>(trace) {
          @Override
          protected Void call() {
              orderRepository.save(itemId);
              return null; // 반환값 없으면 Void + null
          }
      };
      template.execute("OrderService.orderItem()");
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v4/OrderServiceV4.java)

- `OrderRepositoryV4`
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v4/OrderRepositoryV4.java)

- 템플릿 메서드 패턴의 단점
  - **상속**을 사용하므로 자식 클래스가 부모 클래스에 강하게 결합됨
  - 부모 클래스 변경 시 자식 클래스에 영향을 줌
  - 별도의 클래스나 익명 내부 클래스를 계속 만들어야 함


<br/><br/>

## 전략 패턴 - 개념

- 상속 대신 **위임**(인터페이스)을 사용하여 변하지 않는 부분을 `Context`에 두고, 변하는 알고리즘을 `Strategy` 인터페이스로 분리하는 패턴임

  ![전략 패턴 클래스 다이어그램](/assets/img/spring-advanced/10-strategy-pattern-classdiagram.png)

- GOF 정의
  > "알고리즘 제품군을 정의하고 각각을 캡슐화하여 상호 교환 가능하게 만들자. 전략을 사용하면 알고리즘을 사용하는 클라이언트와 독립적으로 알고리즘을 변경할 수 있다."


<br/><br/>

## 전략 패턴 - 필드 주입 (ContextV1)

- Strategy를 Context 필드에 저장하는 방식으로 **선 조립, 후 실행**에 적합함

- `ContextV1`

  ```java
  @Slf4j
  public class ContextV1 {
      private Strategy strategy;

      public ContextV1(Strategy strategy) {
          this.strategy = strategy;
      }

      public void execute() {
          long startTime = System.currentTimeMillis();
          strategy.call(); // 위임
          long endTime = System.currentTimeMillis();
          long resultTime = endTime - startTime;
          log.info("resultTime={}", resultTime);
      }
  }
  ```

- 사용 예시 - 람다

  ```java
  @Test
  void strategyV4() {
      ContextV1 context1 = new ContextV1(() -> log.info("비즈니스 로직1 실행"));
      context1.execute();

      ContextV1 context2 = new ContextV1(() -> log.info("비즈니스 로직2 실행"));
      context2.execute();
  }
  ```
  - [전체 테스트 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/strategy/ContextV1Test.java)


<br/><br/>

## 전략 패턴 - 파라미터 전달 (ContextV2)

- Strategy를 실행 시점마다 파라미터로 전달하는 방식으로 **유연한 전략 변경**이 가능함

- `ContextV2`

  ```java
  @Slf4j
  public class ContextV2 {
      public void execute(Strategy strategy) {
          long startTime = System.currentTimeMillis();
          strategy.call(); // 위임
          long endTime = System.currentTimeMillis();
          long resultTime = endTime - startTime;
          log.info("resultTime={}", resultTime);
      }
  }
  ```

- 사용 예시 - 람다

  ```java
  @Test
  void strategyV3() {
      ContextV2 context = new ContextV2();
      context.execute(() -> log.info("비즈니스 로직1 실행"));
      context.execute(() -> log.info("비즈니스 로직2 실행"));
  }
  ```
  - [전체 테스트 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/strategy/ContextV2Test.java)

- ContextV1과 ContextV2 비교

  | 구분 | ContextV1 (필드) | ContextV2 (파라미터) |
  |---|---|---|
  | 조립 시점 | 실행 전 (선 조립) | 실행 시마다 |
  | 전략 변경 | 번거로움 | 유연함 |
  | 적합한 상황 | 스프링 DI처럼 한번 조립 후 재사용 | 실행마다 다른 전략이 필요할 때 |


<br/><br/>

## 템플릿 콜백 패턴 - 개념

- 콜백(Callback)이란 다른 코드의 인수로서 넘겨주는 실행 가능한 코드를 말함
  - `ContextV2.execute(strategy)`에서 `strategy`가 콜백에 해당됨
  - 클라이언트가 직접 실행하는 것이 아니라 Context 내부에서 **뒤(back)에서 호출(call)됨**

- 스프링에서는 ContextV2 방식의 전략 패턴을 **템플릿 콜백 패턴**이라 부름

  | 전략 패턴 용어 | 템플릿 콜백 패턴 용어 |
  |---|---|
  | Context | Template |
  | Strategy | Callback |

- 스프링에서 `XxxTemplate`이 있으면 템플릿 콜백 패턴이 적용된 것임 (`JdbcTemplate`, `RestTemplate`, `TransactionTemplate`, `RedisTemplate` 등)

- 실행 흐름

  ![템플릿 콜백 패턴 실행 흐름](/assets/img/spring-advanced/11-template-callback-sequence.png)


<br/><br/>

## 템플릿 콜백 패턴 - 예제 코드

- `Callback` 인터페이스

  ```java
  public interface Callback {
      void call();
  }
  ```

- `TimeLogTemplate`

  ```java
  @Slf4j
  public class TimeLogTemplate {
      public void execute(Callback callback) {
          long startTime = System.currentTimeMillis();
          callback.call(); // 위임
          long endTime = System.currentTimeMillis();
          long resultTime = endTime - startTime;
          log.info("resultTime={}", resultTime);
      }
  }
  ```

- 테스트 코드 - 람다

  ```java
  @Test
  void callbackV2() {
      TimeLogTemplate template = new TimeLogTemplate();
      template.execute(() -> log.info("비즈니스 로직1 실행"));
      template.execute(() -> log.info("비즈니스 로직2 실행"));
  }
  ```


<br/><br/>

## 템플릿 콜백 패턴 - 적용

- 로그 추적기에 적용하기 위해 `TraceCallback<T>` 인터페이스와 `TraceTemplate`을 구현함

- `TraceCallback<T>` 인터페이스

  ```java
  public interface TraceCallback<T> {
      T call();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/callback/TraceCallback.java)

- `TraceTemplate`

  ```java
  public class TraceTemplate {
      private final LogTrace trace;

      public TraceTemplate(LogTrace trace) {
          this.trace = trace;
      }

      public <T> T execute(String message, TraceCallback<T> callback) {
          TraceStatus status = null;
          try {
              status = trace.begin(message);
              T result = callback.call();
              trace.end(status);
              return result;
          } catch (Exception e) {
              trace.exception(status, e);
              throw e;
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/callback/TraceTemplate.java)

- `OrderControllerV5`

  ```java
  @RestController
  public class OrderControllerV5 {
      private final OrderServiceV5 orderService;
      private final TraceTemplate template;

      public OrderControllerV5(OrderServiceV5 orderService, LogTrace trace) {
          this.orderService = orderService;
          this.template = new TraceTemplate(trace);
      }

      @GetMapping("/v5/request")
      public String request(String itemId) {
          return template.execute("OrderController.request()", () -> {
              orderService.orderItem(itemId);
              return "ok";
          });
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v5/OrderControllerV5.java)

- `OrderServiceV5` (람다 사용)

  ```java
  @Service
  public class OrderServiceV5 {
      private final OrderRepositoryV5 orderRepository;
      private final TraceTemplate template;

      public OrderServiceV5(OrderRepositoryV5 orderRepository, LogTrace trace) {
          this.orderRepository = orderRepository;
          this.template = new TraceTemplate(trace);
      }

      public void orderItem(String itemId) {
          template.execute("OrderService.orderItem()", () -> {
              orderRepository.save(itemId);
              return null;
          });
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v5/OrderServiceV5.java)

- `OrderRepositoryV5`
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v5/OrderRepositoryV5.java)

- 정상 실행 로그

  ```
  [aaaaaaaa] OrderController.request()
  [aaaaaaaa] |-->OrderService.orderItem()
  [aaaaaaaa] |   |-->OrderRepository.save()
  [aaaaaaaa] |   |<--OrderRepository.save() time=1001ms
  [aaaaaaaa] |<--OrderService.orderItem() time=1003ms
  [aaaaaaaa] OrderController.request() time=1004ms
  ```


<br/><br/>

## 연습 문제

1. 핵심 비즈니스 로직에 로깅 같은 부가 기능 코드가 섞일 때 발생하는 주요 문제점은 무엇일까요?

    a. 부가 기능 추가/변경 어려움

    - 핵심 로직과 부가 기능 혼합 시, 부가 기능 변경/추가가 핵심 로직까지 건드려야 해 어렵고 비효율적임
    - 수백 개의 클래스에 적용하기 어려움

2. 템플릿 메서드 패턴의 주된 역할은 무엇을 분리하는 것인가요?

    a. 변하는 코드와 변하지 않는 코드

    - 템플릿 메서드 패턴은 알고리즘의 뼈대(변하지 않는 부분)는 부모 클래스에 두고, 알고리즘 단계 중 변하는 특정 부분만 서브클래스가 구현하도록 분리함

3. 템플릿 메서드 패턴이 변하지 않는 부분과 변하는 부분을 분리하기 위해 사용하는 주요 객체지향 방식은 무엇인가요?

    a. 상속

    - 템플릿 메서드 패턴은 부모 클래스(템플릿)와 자식 클래스 간의 상속 관계를 통해 변하지 않는 로직과 변하는 로직을 분리하고 오버라이딩으로 구현함

4. 템플릿 메서드 패턴이 상속을 사용하는 것과 관련하여 발생하는 주요 단점은 무엇일까요?

    a. 부모-자식 클래스 간 강한 결합

    - 템플릿 메서드 패턴은 상속 때문에 부모 클래스에 변경이 생기면 이를 상속받는 자식 클래스들이 영향을 받을 수 있는 강한 컴파일 타임 결합이 발생함

5. 전략 패턴이 템플릿 메서드 패턴과 달리 변하는 부분을 분리하기 위해 주로 사용하는 방식은 무엇인가요?

    a. 위임(델리게이션) 또는 컴포지션

    - 전략 패턴은 상속 대신 Context 객체가 Strategy 인터페이스에 의존하여 Strategy 구현체에 작업을 위임하는 방식을 사용함

6. 전략 패턴에서 Context와 Strategy는 각각 어떤 역할을 수행하나요?

    a. 변하지 않는 부분 / 변하는 부분

    - Context는 변하지 않는 전체적인 흐름(템플릿 역할)을 가지고 있으며, Strategy는 Context가 실행할 구체적이고 변하는 알고리즘(전략) 부분을 담당함

7. 전략 패턴의 주요 장점 중 하나로, 템플릿 메서드 패턴보다 더 유연한 이유는 무엇일까요?

    a. 알고리즘 교체 용이성

    - 전략 패턴은 Context가 Strategy 인터페이스에만 의존하므로, Context 코드를 변경하지 않고도 다양한 Strategy 구현체로 쉽게 교체하며 알고리즘을 변경할 수 있음

8. 전략 패턴에서 Context가 실행할 Strategy를 주입받는 방식 중, 실행 시점에 매번 다른 Strategy를 전달하는 방법은 무엇일까요?

    a. 메서드 파라미터 주입

    - ContextV2 예제처럼 Context 객체 생성 시 주입하는 대신, Context의 특정 메서드(예: execute)를 호출할 때 파라미터로 Strategy 구현체를 전달하는 방식임

9. 스프링에서 XXXTemplate(예: JdbcTemplate, RestTemplate)과 같이 사용되는 템플릿 콜백 패턴은 기본적으로 어떤 디자인 패턴의 한 형태인가요?

    a. 전략 패턴

    - 스프링의 템플릿 콜백 패턴은 전략 패턴 중 ContextV2처럼 실행할 코드(콜백)를 파라미터로 넘겨 템플릿 안에서 실행하는 방식을 강조하여 부르는 이름임

10. 고정된 알고리즘 구조 안에서 특정 단계만 실행 시점에 유연하게 바꿔 실행해야 할 때, 익명 내부 클래스나 람다와 함께 활용하기 가장 편리한 패턴은 무엇일까요?

    a. 전략 패턴 (파라미터 전달) 또는 템플릿 콜백

    - 전략 패턴에서 실행 메서드에 Strategy를 파라미터로 전달(템플릿 콜백)하면 매 실행마다 다른 코드를 넘길 수 있고, 람다는 이를 간결하게 만듦


<br/><br/>

## 요약 정리

- 로그 추적기를 도입하면 핵심 기능과 부가 기능이 섞이는 문제가 발생하며, 변하는 것(비즈니스 로직)과 변하지 않는 것(로그 추적 구조)을 분리해야 함
- 템플릿 메서드 패턴은 부모 클래스에 변하지 않는 템플릿을 정의하고 자식 클래스에서 상속으로 변하는 부분을 구현하지만, 상속에 의한 강한 결합이 단점임
- 전략 패턴은 상속 대신 위임(인터페이스)을 사용하여 결합도를 낮추며, 필드 주입(ContextV1)과 파라미터 전달(ContextV2) 두 가지 방식이 있음
- 스프링의 템플릿 콜백 패턴은 ContextV2 방식의 전략 패턴에 이름을 붙인 것으로, `JdbcTemplate`, `RestTemplate` 등에서 활용됨
- 세 패턴 모두 원본 코드를 직접 수정해야 하는 한계가 있으며, 이를 극복하기 위해 프록시(Proxy) 패턴으로 발전함


<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
