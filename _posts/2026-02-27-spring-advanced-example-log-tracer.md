---
title: '[스프링 핵심 원리 - 고급편] 예제 만들기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-27 13:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, log-tracer, trace-id, thread-local, aop]
math: false
mermaid: false
---

# 예제 만들기

- 김영한님의 스프링 핵심 원리 - 고급편 강의를 바탕으로 프로젝트를 생성하고, 상품 주문 예제를 구현한 뒤, 로그 추적기 V1~V2를 단계적으로 개발하고 적용하는 과정을 정리함

<br/><br/>

## 예제 프로젝트 V0

- 상품 주문 프로세스를 기반으로 Controller - Service - Repository 흐름을 단순하게 구현함

  ![v0-flowchart](/assets/img/spring-advanced/v0-flowchart.png)

- OrderRepositoryV0
  - `itemId`가 `"ex"`인 경우 예외를 발생시키고 정상인 경우 1초간 대기하여 저장 지연함

  ```java
  @Repository
  @RequiredArgsConstructor
  public class OrderRepositoryV0 {

      public void save(String itemId) {
          if (itemId.equals("ex")) {
              throw new IllegalStateException("예외 발생!");
          }
          sleep(1000);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v0/OrderRepositoryV0.java)

- OrderServiceV0
  - 리포지토리를 호출하여 상품을 저장하는 단순한 서비스 계층임

  ```java
  @Service
  @RequiredArgsConstructor
  public class OrderServiceV0 {

      private final OrderRepositoryV0 orderRepository;

      public void orderItem(String itemId) {
          orderRepository.save(itemId);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v0/OrderServiceV0.java)

- OrderControllerV0
  - HTTP 요청을 받아 서비스 계층에 위임하는 컨트롤러임

  ```java
  @RestController
  @RequiredArgsConstructor
  public class OrderControllerV0 {

      private final OrderServiceV0 orderService;

      @GetMapping("/v0/request")
      public String request(String itemId) {
          orderService.orderItem(itemId);
          return "ok";
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v0/OrderControllerV0.java)

- 실행 결과
  - `http://localhost:8080/v0/request?itemId=hello` → 결과 `ok`


<br/><br/>

## 로그 추적기 요구사항 분석

- 배경
  - V0 예제를 기반으로, 운영 중인 대규모 프로젝트에서 병목 지점과 예외 발생 위치를 빠르게 식별할 수 있는 로그 추적기를 개발함

- 요구사항

  | 항목 | 설명 |
  |---|---|
  | 메서드 호출/응답 로그 | 모든 PUBLIC 메서드의 호출과 응답 정보 출력 |
  | 비즈니스 로직 무영향 | 로그가 애플리케이션 흐름에 영향을 주면 안 됨 |
  | 실행 시간 측정 | 메서드 호출에 걸린 시간 출력 |
  | 정상/예외 흐름 구분 | 예외 발생 시 예외 정보 포함 |
  | 호출 깊이 표현 | 메서드 호출의 중첩 깊이 시각화 |
  | 트랜잭션 ID | HTTP 요청 단위로 동일한 ID 부여 |

- 출력 예시

  ```
  정상 요청
  [796bccd9] OrderController.request()
  [796bccd9] |-->OrderService.orderItem()
  [796bccd9] |   |-->OrderRepository.save()
  [796bccd9] |   |<--OrderRepository.save() time=1004ms
  [796bccd9] |<--OrderService.orderItem() time=1014ms
  [796bccd9] OrderController.request() time=1016ms

  예외 발생
  [b7119f27] OrderController.request()
  [b7119f27] |-->OrderService.orderItem()
  [b7119f27] |   |-->OrderRepository.save()
  [b7119f27] |   |<X-OrderRepository.save() time=0ms ex=java.lang.IllegalStateException: 예외 발생!
  [b7119f27] |<X-OrderService.orderItem() time=10ms ex=java.lang.IllegalStateException: 예외 발생!
  [b7119f27] OrderController.request() time=11ms ex=java.lang.IllegalStateException: 예외 발생!
  ```


<br/><br/>

## 로그 추적기 V1 - 프로토타입 개발

- 요구사항을 만족하기 위해 `TraceId`, `TraceStatus`, `HelloTraceV1` 세 가지 클래스를 구현함

- 클래스 구조

  ![v1-classdiagram](/assets/img/spring-advanced/v1-classdiagram.png)

- `TraceId`
  - 트랜잭션 ID와 호출 깊이(level)를 함께 관리함
  - UUID의 앞 8자리만 트랜잭션 ID로 사용하며 `createNextId()`는 같은 트랜잭션 ID를 유지하면서 level을 1 증가시킴

  ```java
  public class TraceId {

      private String id;
      private int level;

      public TraceId() {
          this.id = createId();
          this.level = 0;
      }

      private String createId() {
          return UUID.randomUUID().toString().substring(0, 8);
      }

      public TraceId createNextId() {
          return new TraceId(id, level + 1);
      }

      public TraceId createPreviousId() {
          return new TraceId(id, level - 1);
      }

      public boolean isFirstLevel() {
          return level == 0;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/TraceId.java)

- `TraceStatus`
  - 로그 시작 시점의 상태 정보를 보관하며 로그 종료 시 실행 시간 계산에 활용됨

  ```java
  public class TraceStatus {

      private TraceId traceId;
      private Long startTimeMs;
      private String message;

      public TraceStatus(TraceId traceId, Long startTimeMs, String message) {
          this.traceId = traceId;
          this.startTimeMs = startTimeMs;
          this.message = message;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/TraceStatus.java)

- `HelloTraceV1`
  - `begin()`에서 새로운 `TraceId`를 생성하고 시작 로그를 출력하며 `end()`와 `exception()`에서 종료 로그를 출력함

  ```java
  @Slf4j
  @Component
  public class HelloTraceV1 {

      private static final String START_PREFIX = "-->";
      private static final String COMPLETE_PREFIX = "<--";
      private static final String EX_PREFIX = "<X-";

      public TraceStatus begin(String message) {
          TraceId traceId = new TraceId();
          Long startTimeMs = System.currentTimeMillis();
          log.info("[{}] {}{}", traceId.getId(), addSpace(START_PREFIX, traceId.getLevel()), message);
          return new TraceStatus(traceId, startTimeMs, message);
      }

      public void end(TraceStatus status) {
          complete(status, null);
      }

      public void exception(TraceStatus status, Exception e) {
          complete(status, e);
      }

      private void complete(TraceStatus status, Exception e) {
          long stopTimeMs = System.currentTimeMillis();
          long resultTimeMs = stopTimeMs - status.getStartTimeMs();
          TraceId traceId = status.getTraceId();
          if (e == null) {
              log.info("[{}] {}{} time={}ms", traceId.getId(),
                      addSpace(COMPLETE_PREFIX, traceId.getLevel()), status.getMessage(), resultTimeMs);
          } else {
              log.info("[{}] {}{} time={}ms ex={}", traceId.getId(),
                      addSpace(EX_PREFIX, traceId.getLevel()), status.getMessage(), resultTimeMs, e.toString());
          }
      }

      private String addSpace(String prefix, int level) {
          StringBuilder sb = new StringBuilder();
          for (int i = 0; i < level; i++) {
              sb.append((i == level - 1) ? "|" + prefix : "|  ");
          }
          return sb.toString();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/hellotrace/HelloTraceV1.java)

- `addSpace` 동작 원리

  | prefix | level 0 | level 1 | level 2 |
  |---|---|---|---|
  | `-->` | (없음) | `\|-->` | `\|  \|-->` |
  | `<--` | (없음) | `\|<--` | `\|  \|<--` |
  | `<X-` | (없음) | `\|<X-` | `\|  \|<X-` |

- V1 테스트 코드

  ```java
  class HelloTraceV1Test {

      @Test
      void begin_end() {
          HelloTraceV1 trace = new HelloTraceV1();
          TraceStatus status = trace.begin("hello");
          trace.end(status);
      }

      @Test
      void begin_exception() {
          HelloTraceV1 trace = new HelloTraceV1();
          TraceStatus status = trace.begin("hello");
          trace.exception(status, new IllegalStateException());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/hellotrace/HelloTraceV1Test.java)

- 테스트 실행 결과

  ```
  // begin_end()
  [41bbb3b7] hello
  [41bbb3b7] hello time=5ms

  // begin_exception()
  [898a3def] hello
  [898a3def] hello time=13ms ex=java.lang.IllegalStateException
  ```


<br/><br/>

## 로그 추적기 V1 - 적용

- 프로토타입으로 개발한 `HelloTraceV1`을 실제 애플리케이션에 적용함
- V0 코드를 V1 패키지로 복사한 뒤 각 레이어에 `try-catch` 구조로 로그 추적 코드를 추가함

- 적용 패턴 (`try-catch` 구조)

  ![v1-trycatch](/assets/img/spring-advanced/v1-trycatch.png)

- `OrderControllerV1`
  - `HelloTraceV1`을 주입받아 `try-catch` 패턴으로 로그를 기록하며 예외 발생 시 반드시 다시 던짐

  ```java
  @RestController
  @RequiredArgsConstructor
  public class OrderControllerV1 {

      private final OrderServiceV1 orderService;
      private final HelloTraceV1 trace;

      @GetMapping("/v1/request")
      public String request(String itemId) {
          TraceStatus status = null;
          try {
              status = trace.begin("OrderController.request()");
              orderService.orderItem(itemId);
              trace.end(status);
              return "ok";
          } catch (Exception e) {
              trace.exception(status, e);
              throw e; // 예외를 반드시 다시 던져야함
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v1/OrderControllerV1.java)

- `OrderServiceV1`, `OrderRepositoryV1`
  - 동일한 `try-catch` 패턴으로 `HelloTraceV1`을 적용하여 로그를 기록함
  - [OrderServiceV1 전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v1/OrderServiceV1.java)
  - [OrderRepositoryV1 전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v1/OrderRepositoryV1.java)

- V1 실행 결과

  ```
  // 정상 실행
  [11111111] OrderController.request()
  [22222222] OrderService.orderItem()
  [33333333] OrderRepository.save()
  [33333333] OrderRepository.save() time=1000ms
  [22222222] OrderService.orderItem() time=1001ms
  [11111111] OrderController.request() time=1001ms
  ```

- V1의 한계
  - 각 레이어가 독립된 트랜잭션 ID를 생성하므로 같은 HTTP 요청임에도 ID가 제각각이며 level도 항상 0임


<br/><br/>

## 로그 추적기 V2 - 파라미터 동기화

- V1에서는 각 레이어가 독립된 `TraceId`를 생성하여 트랜잭션 ID와 level이 연결되지 않는 문제가 있었음

- 문제 인식

  ![v1v2-compare](/assets/img/spring-advanced/v1v2-compare.png)

- 해결 방법
  - 첫 번째 레이어에서 생성된 `TraceId`를 이후 레이어로 파라미터로 전달하여 동기화함

- HelloTraceV2 (beginSync 추가)
  - V1과의 차이점은 기존 `TraceId`를 이어받아 level만 증가시키는 `beginSync()` 메서드를 추가한 것임

  ```java
  // V2에서 추가: 기존 TraceId를 이어받아 level만 증가
  public TraceStatus beginSync(TraceId beforeTraceId, String message) {
      TraceId nextId = beforeTraceId.createNextId();
      Long startTimeMs = System.currentTimeMillis();
      log.info("[" + nextId.getId() + "] " + addSpace(START_PREFIX, nextId.getLevel()) + message);
      return new TraceStatus(nextId, startTimeMs, message);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/hellotrace/HelloTraceV2.java)

- V2 테스트 코드

  ```java
  class HelloTraceV2Test {

      @Test
      void begin_end_level2() {
          HelloTraceV2 trace = new HelloTraceV2();
          TraceStatus status1 = trace.begin("hello1");
          TraceStatus status2 = trace.beginSync(status1.getTraceId(), "hello2");
          trace.end(status2);
          trace.end(status1);
      }

      @Test
      void begin_exception_level2() {
          HelloTraceV2 trace = new HelloTraceV2();
          TraceStatus status1 = trace.begin("hello");
          TraceStatus status2 = trace.beginSync(status1.getTraceId(), "hello2");
          trace.exception(status2, new IllegalStateException());
          trace.exception(status1, new IllegalStateException());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/hellotrace/HelloTraceV2Test.java)

- 테스트 실행 결과

  ```
  // begin_end_level2()
  [0314baf6] hello1
  [0314baf6] |-->hello2
  [0314baf6] |<--hello2 time=2ms
  [0314baf6] hello1 time=25ms

  // begin_exception_level2()
  [37ccb357] hello
  [37ccb357] |-->hello2
  [37ccb357] |<X-hello2 time=2ms ex=java.lang.IllegalStateException
  [37ccb357] hello time=25ms ex=java.lang.IllegalStateException
  ```


<br/><br/>

## 로그 추적기 V2 - 적용

- `HelloTraceV2`를 실제 애플리케이션에 적용하여 `TraceId`를 파라미터로 전달함으로써 Controller → Service → Repository 전 계층에서 동일한 트랜잭션 ID와 depth를 유지함

- TraceId 전달 흐름

  ![v2-sequence](/assets/img/spring-advanced/v2-sequence.png)

- OrderControllerV2
  - `begin()`으로 트레이스를 시작하고 `status.getTraceId()`로 얻은 `TraceId`를 서비스 계층에 전달함

  ```java
  @GetMapping("/v2/request")
  public String request(String itemId) {
      TraceStatus status = null;
      try {
          status = trace.begin("OrderController.request()");
          orderService.orderItem(status.getTraceId(), itemId); // TraceId 전달
          trace.end(status);
          return "ok";
      } catch (Exception e) {
          trace.exception(status, e);
          throw e;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v2/OrderControllerV2.java)

- OrderServiceV2, OrderRepositoryV2
  - `beginSync()`를 사용하여 전달받은 `TraceId`를 이어받아 동일한 트랜잭션 ID로 로그를 기록하며 다음 계층에도 `TraceId`를 전달함
  - [OrderServiceV2 전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v2/OrderServiceV2.java)
  - [OrderRepositoryV2 전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v2/OrderRepositoryV2.java)

- V2 실행 결과

  ```
  // 정상 실행
  [c80f5dbb] OrderController.request()
  [c80f5dbb] |-->OrderService.orderItem()
  [c80f5dbb] |   |-->OrderRepository.save()
  [c80f5dbb] |   |<--OrderRepository.save() time=1005ms
  [c80f5dbb] |<--OrderService.orderItem() time=1014ms
  [c80f5dbb] OrderController.request() time=1017ms

  // 예외 실행
  [ca867d59] OrderController.request()
  [ca867d59] |-->OrderService.orderItem()
  [ca867d59] |   |-->OrderRepository.save()
  [ca867d59] |   |<X-OrderRepository.save() time=0ms ex=java.lang.IllegalStateException: 예외 발생!
  [ca867d59] |<X-OrderService.orderItem() time=7ms ex=java.lang.IllegalStateException: 예외 발생!
  [ca867d59] OrderController.request() time=7ms ex=java.lang.IllegalStateException: 예외 발생!
  ```


<br/><br/>

## 정리

- V2의 구조적 한계
  - V2에서 모든 요구사항을 만족했지만 `TraceId`를 파라미터로 전달하는 방식에 근본적인 문제가 있음
    - 관련 메서드 시그니처 전체 변경이 필요함
    - 인터페이스가 있으면 인터페이스도 수정해야 함
    - 컨트롤러 외부에서 서비스를 직접 호출하면 `TraceId`가 없음
    - `begin`과 `beginSync`를 호출 위치에 따라 구분해야 함
  - 결과적으로 비즈니스 로직과 로그 로직이 혼재되어 코드가 오염되므로 이후 `ThreadLocal`과 같은 기법을 사용하여 파라미터 없이 컨텍스트 정보를 전달하는 방법으로 개선이 필요함


<br/><br/>

## 연습 문제

1. Spring Initializr는 주로 어떤 목적으로 사용할까요?

    a. 새 Spring 프로젝트 생성

    - start.spring.io는 Spring Boot 프로젝트의 기반 설정을 웹에서 쉽게 할 수 있게 도와주는 도구임. 빌드 도구, 언어, 의존성 등을 선택하여 프로젝트를 생성함

2. 일반적인 웹 애플리케이션 구조에서 컨트롤러, 서비스, 리포지토리 간의 요청 처리 흐름은 어떻게 되나요?

    a. 컨트롤러 -> 서비스 -> 리포지토리

    - 사용자 요청은 컨트롤러가 먼저 받고, 비즈니스 로직 처리는 서비스에 위임하며, 데이터 접근은 리포지토리가 담당하는 일반적인 계층 구조임

3. 로그 추적기가 애플리케이션 로직의 정상적인 흐름을 방해하면 안 되는 중요한 이유는 무엇일까요?

    a. 비즈니스 기능의 오작동 방지

    - 로깅은 애플리케이션 기능 자체를 변경하면 안 됨. 로그 때문에 원래 비즈니스 로직이 실패하거나 다르게 동작하면 안 되기 때문임

4. 동시에 여러 HTTP 요청이 들어올 때, 로그에서 각 요청의 흐름을 구분하기 위해 가장 유용한 정보는 무엇일까요?

    a. Transaction ID

    - 여러 요청이 섞여 로그가 출력될 때, 동일 Transaction ID로 필터링하면 특정 요청의 전체 흐름을 쉽게 파악할 수 있어 디버깅에 매우 유용함

5. 로그 추적을 위해 Transaction ID나 깊이 정보를 메서드 파라미터로 넘기는 방식(V2)의 주요 문제점은 무엇일까요?

    a. 코드 수정 범위 확대

    - 로깅 정보를 메서드 파라미터로 넘기면 해당 메서드를 호출하는 모든 곳의 코드와 메서드 시그니처를 수정해야 하는 광범위한 변경이 발생함


<br/><br/>

## 요약 정리

- 예제 프로젝트 V0은 로그 추적기를 적용할 대상으로 Controller → Service → Repository의 기본 계층 구조를 단순하게 구현함
- 로그 추적기 V1은 `TraceId`, `TraceStatus`, `HelloTraceV1` 클래스를 구현하여 메서드 호출/응답 시간을 기록하지만 각 레이어가 독립된 트랜잭션 ID를 생성하여 요청 흐름을 하나로 연결하지 못하는 한계가 있음
- 로그 추적기 V2는 `beginSync()` 메서드를 추가하여 `TraceId`를 파라미터로 전달함으로써 동일한 트랜잭션 ID와 호출 깊이를 유지할 수 있게 되었지만, 메서드 시그니처가 오염되는 구조적 문제가 남아 있음
- V2의 한계를 극복하기 위해 이후 `ThreadLocal` 등의 기법으로 파라미터 없이 컨텍스트를 전달하는 방식으로 개선이 필요함


<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
