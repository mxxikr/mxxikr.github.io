---
title: '[스프링 핵심 원리 - 고급편] 쓰레드 로컬 - ThreadLocal'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-28 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, thread-local, concurrency, field-sync, log-tracer]
math: false
mermaid: false
---

# 쓰레드 로컬 - ThreadLocal

- 김영한님의 스프링 핵심 원리 - 고급편 강의를 바탕으로 `TraceId`를 필드로 동기화하는 방식의 동시성 문제를 분석하고, `ThreadLocal`을 활용하여 해결하는 과정을 정리함

<br/><br/>

## 필드 동기화 - 개발

- V2에서는 `TraceId`를 파라미터로 넘기다 보니 모든 메서드에 불필요한 인자가 퍼져나가는 구조가 됐음
- 이를 개선하기 위해 `LogTrace` 인터페이스를 먼저 정의하고, 구현체를 분리하여 향후 유연하게 교체할 수 있도록 설계함

  ![LogTrace 클래스 다이어그램](/assets/img/spring-advanced/01-logtrace-classdiagram.png)

- `LogTrace` 인터페이스
  - 로그 추적의 시작, 종료, 예외 처리를 추상화한 인터페이스임

  ```java
  public interface LogTrace {
      TraceStatus begin(String message);
      void end(TraceStatus status);
      void exception(TraceStatus status, Exception e);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/logtrace/LogTrace.java)

- `FieldLogTrace`
  - `TraceId`를 파라미터로 넘기는 대신 인스턴스 필드 `traceIdHolder`에 저장하여 동기화함

  ```java
  @Slf4j
  public class FieldLogTrace implements LogTrace {

      private TraceId traceIdHolder; // traceId 동기화, 동시성 이슈 발생 지점

      @Override
      public TraceStatus begin(String message) {
          syncTraceId();
          TraceId traceId = traceIdHolder;
      }

      private void syncTraceId() {
          if (traceIdHolder == null) {
              traceIdHolder = new TraceId();
          } else {
              traceIdHolder = traceIdHolder.createNextId();
          }
      }

      private void releaseTraceId() {
          if (traceIdHolder.isFirstLevel()) {
              traceIdHolder = null; // 최초 레벨이면 제거
          } else {
              traceIdHolder = traceIdHolder.createPreviousId();
          }
      }

      // end(), exception(), complete(), addSpace() 생략
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/logtrace/FieldLogTrace.java)

- `syncTraceId` / `releaseTraceId` 동작 원리

  ![syncTraceId/releaseTraceId 동작 시퀀스](/assets/img/spring-advanced/02-sync-release-sequence.png)

  | 메서드 | 동작 |
  |---|---|
  | `syncTraceId()` | 최초 호출이면 새 `TraceId` 생성, 이후 호출이면 `createNextId()`로 level 증가 |
  | `releaseTraceId()` | 최초 레벨이면 `null`로 제거, 아니면 `createPreviousId()`로 level 감소 |

- `FieldLogTraceTest`

  ```java
  class FieldLogTraceTest {

      FieldLogTrace trace = new FieldLogTrace();

      @Test
      void begin_end_level2() {
          TraceStatus status1 = trace.begin("hello1");
          TraceStatus status2 = trace.begin("hello2");
          trace.end(status2);
          trace.end(status1);
      }

      @Test
      void begin_exception_level2() {
          TraceStatus status1 = trace.begin("hello");
          TraceStatus status2 = trace.begin("hello2");
          trace.exception(status2, new IllegalStateException());
          trace.exception(status1, new IllegalStateException());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/logtrace/FieldLogTraceTest.java)

- 테스트 실행 결과

  ```
  // begin_end_level2()
  [ed72b67d] hello1
  [ed72b67d] |-->hello2
  [ed72b67d] |<--hello2 time=2ms
  [ed72b67d] hello1 time=6ms

  // begin_exception_level2()
  [59770788] hello
  [59770788] |-->hello2
  [59770788] |<X-hello2 time=3ms ex=java.lang.IllegalStateException
  [59770788] hello time=8ms ex=java.lang.IllegalStateException
  ```


<br/><br/>

## 필드 동기화 - 적용

- `FieldLogTrace`를 수동으로 스프링 빈에 등록해두면, 나중에 구현체를 교체할 때 설정 파일 하나만 바꾸면 됨

- `LogTraceConfig` (스프링 빈 수동 등록)

  ```java
  @Configuration
  public class LogTraceConfig {

      @Bean
      public LogTrace logTrace() {
          return new FieldLogTrace();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/logtrace/LogTraceConfig.java)

- V3 애플리케이션 코드
  - V2에서 `TraceId` 파라미터 전달 코드를 모두 제거하고 `LogTrace` 인터페이스를 주입받아 사용함

- `OrderControllerV3`
  - `LogTrace`를 주입받아 `try-catch` 패턴으로 로그를 기록하며 `TraceId`를 파라미터로 전달하지 않음

  ```java
  @RestController
  @RequiredArgsConstructor
  public class OrderControllerV3 {

      private final OrderServiceV3 orderService;
      private final LogTrace trace;

      @GetMapping("/v3/request")
      public String request(String itemId) {
          TraceStatus status = null;
          try {
              status = trace.begin("OrderController.request()");
              orderService.orderItem(itemId);
              trace.end(status);
              return "ok";
          } catch (Exception e) {
              trace.exception(status, e);
              throw e;
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v3/OrderControllerV3.java)

- `OrderServiceV3`, `OrderRepositoryV3`
  - 컨트롤러와 동일한 `try-catch` 패턴으로 `LogTrace`를 적용해 로그를 남김
  - [OrderServiceV3 전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v3/OrderServiceV3.java)
  - [OrderRepositoryV3 전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/v3/OrderRepositoryV3.java)

- V3 정상 실행 로그

  ```
  [f8477cfc] OrderController.request()
  [f8477cfc] |-->OrderService.orderItem()
  [f8477cfc] |   |-->OrderRepository.save()
  [f8477cfc] |   |<--OrderRepository.save() time=1004ms
  [f8477cfc] |<--OrderService.orderItem() time=1006ms
  [f8477cfc] OrderController.request() time=1007ms
  ```


<br/><br/>

## 필드 동기화 - 동시성 문제

- `FieldLogTrace`는 스프링 싱글톤 빈이므로 인스턴스가 하나뿐인데, 여러 쓰레드가 동시에 `traceIdHolder` 필드를 읽고 쓰면서 데이터가 뒤섞이는 문제가 발생함

  ![동시성 문제 발생 구조](/assets/img/spring-advanced/03-concurrency-issue-flowchart.png)

- 실제 동시 요청 시 로그 (비정상)

  ```
  [nio-8080-exec-3] [aaaaaaaa] OrderController.request()
  [nio-8080-exec-3] [aaaaaaaa] |-->OrderService.orderItem()
  [nio-8080-exec-3] [aaaaaaaa] |   |-->OrderRepository.save()
  [nio-8080-exec-4] [aaaaaaaa] |   |   |-->OrderController.request()
  [nio-8080-exec-4] [aaaaaaaa] |   |   |   |-->OrderService.orderItem()
  [nio-8080-exec-4] [aaaaaaaa] |   |   |   |   |-->OrderRepository.save()
  [nio-8080-exec-3] [aaaaaaaa] |   |<--OrderRepository.save() time=1005ms
  [nio-8080-exec-3] [aaaaaaaa] |<--OrderService.orderItem() time=1005ms
  [nio-8080-exec-3] [aaaaaaaa] OrderController.request() time=1005ms
  [nio-8080-exec-4] [aaaaaaaa] |   |   |   |   |<--OrderRepository.save() time=1005ms
  [nio-8080-exec-4] [aaaaaaaa] |   |   |   |<--OrderService.orderItem() time=1005ms
  [nio-8080-exec-4] [aaaaaaaa] |   |   |<--OrderController.request() time=1005ms
  ```

- 두 요청이 같은 트랜잭션 ID를 공유하고 있으며, exec-4의 level이 0이 아닌 3에서 시작되는 것을 확인할 수 있음

- 동시성 문제 원인

  | 구분 | 설명 |
  |---|---|
  | 발생 조건 | 싱글톤 객체의 필드 값을 여러 쓰레드가 동시에 변경할 때 |
  | 발생하지 않는 경우 | 지역 변수 (쓰레드마다 별도 메모리 영역 할당) |
  | 발생하지 않는 경우 | 필드를 읽기만 하고 변경하지 않을 때 |
  | 대표 발생 위치 | 스프링 빈(싱글톤), static 공용 필드 |


<br/><br/>

## 동시성 문제 - 예제 코드

- 공유 필드 `nameStore`를 이용한 간단한 예제로 동시성 문제가 어떻게 발생하는지 재현해 봄

- `build.gradle` - 테스트 Lombok 설정 추가

  ```groovy
  dependencies {
      testCompileOnly 'org.projectlombok:lombok'
      testAnnotationProcessor 'org.projectlombok:lombok'
  }
  ```

- `FieldService` (테스트 코드 위치)

  ```java
  @Slf4j
  public class FieldService {

      private String nameStore; // 공유 필드

      public String logic(String name) {
          log.info("저장 name={} -> nameStore={}", name, nameStore);
          nameStore = name;
          sleep(1000);
          log.info("조회 nameStore={}", nameStore);
          return nameStore;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/threadlocal/code/FieldService.java)

- `FieldServiceTest`

  ```java
  @Slf4j
  public class FieldServiceTest {

      private FieldService fieldService = new FieldService();

      @Test
      void field() {
          Runnable userA = () -> fieldService.logic("userA");
          Runnable userB = () -> fieldService.logic("userB");

          Thread threadA = new Thread(userA, "thread-A");
          Thread threadB = new Thread(userB, "thread-B");

          threadA.start();
          sleep(2000); // 동시성 문제 발생 X
          // sleep(100); // 동시성 문제 발생 O
          threadB.start();
          sleep(3000);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/threadlocal/FieldServiceTest.java)

- 순서대로 실행 (`sleep(2000)`) - 정상

  ![순서대로 실행 시퀀스](/assets/img/spring-advanced/04-sequential-execution-sequence.png)

  ```
  [Thread-A] 저장 name=userA -> nameStore=null
  [Thread-A] 조회 nameStore=userA
  [Thread-B] 저장 name=userB -> nameStore=userA
  [Thread-B] 조회 nameStore=userB
  ```

- 동시 실행 (`sleep(100)`) - 동시성 문제 발생

  ![동시 실행 시퀀스 - 동시성 문제 발생](/assets/img/spring-advanced/05-concurrent-execution-sequence.png)

  ```
  [Thread-A] 저장 name=userA -> nameStore=null
  [Thread-B] 저장 name=userB -> nameStore=userA
  [Thread-A] 조회 nameStore=userB   ← userA가 아닌 userB 반환 (오염)
  [Thread-B] 조회 nameStore=userB
  ```

- Thread-A가 `userA`를 저장한 뒤 1초간 대기하는 사이에 Thread-B가 `userB`로 덮어써버려서, Thread-A가 조회할 때 `userB`가 반환됨


<br/><br/>

## ThreadLocal - 소개

- ThreadLocal은 각 쓰레드에게 독립된 전용 저장소를 제공함
- 같은 인스턴스의 ThreadLocal 필드에 여러 쓰레드가 접근해도 각 쓰레드는 자신만의 저장소에서 데이터를 읽고 씀

- 일반 필드와 ThreadLocal 비교

  ![일반 필드와 ThreadLocal 비교](/assets/img/spring-advanced/06-threadlocal-comparison-flowchart.png)

- ThreadLocal 주요 메서드

  | 메서드 | 설명 |
  |---|---|
  | `ThreadLocal.set(value)` | 현재 쓰레드의 저장소에 값 저장 |
  | `ThreadLocal.get()` | 현재 쓰레드의 저장소에서 값 조회 |
  | `ThreadLocal.remove()` | 현재 쓰레드의 저장소에서 값 제거 |

- 자바에서는 `java.lang.ThreadLocal` 클래스를 표준 라이브러리로 기본 제공하고 있음


<br/><br/>

## ThreadLocal - 예제 코드

- `nameStore` 필드를 일반 `String`에서 `ThreadLocal<String>`으로 변경하는 것만으로 동시성 문제가 해결됨

- `ThreadLocalService` (테스트 코드 위치)

  ```java
  @Slf4j
  public class ThreadLocalService {

      private ThreadLocal<String> nameStore = new ThreadLocal<>();

      public String logic(String name) {
          log.info("저장 name={} -> nameStore={}", name, nameStore.get());
          nameStore.set(name);
          sleep(1000);
          log.info("조회 nameStore={}", nameStore.get());
          return nameStore.get();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/threadlocal/code/ThreadLocalService.java)

- `ThreadLocalServiceTest`

  ```java
  @Slf4j
  public class ThreadLocalServiceTest {

      private ThreadLocalService service = new ThreadLocalService();

      @Test
      void threadLocal() {
          Runnable userA = () -> service.logic("userA");
          Runnable userB = () -> service.logic("userB");

          Thread threadA = new Thread(userA, "thread-A");
          Thread threadB = new Thread(userB, "thread-B");

          threadA.start();
          sleep(100); // 동시 실행
          threadB.start();
          sleep(2000);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/threadlocal/ThreadLocalServiceTest.java)

- 실행 결과 - 동시 실행임에도 정상

  ```
  [Thread-A] 저장 name=userA -> nameStore=null
  [Thread-B] 저장 name=userB -> nameStore=null
  [Thread-A] 조회 nameStore=userA   ← 정확히 userA 반환
  [Thread-B] 조회 nameStore=userB   ← 정확히 userB 반환
  ```


<br/><br/>

## 쓰레드 로컬 동기화 - 개발

- `FieldLogTrace`에서 `TraceId traceIdHolder` 필드를 `ThreadLocal<TraceId> traceIdHolder`로 교체함
- 로직 자체는 동일하고 값을 읽고 쓰는 방식만 ThreadLocal 메서드로 변경됨

- `ThreadLocalLogTrace`

  ```java
  @Slf4j
  public class ThreadLocalLogTrace implements LogTrace {

      private ThreadLocal<TraceId> traceIdHolder = new ThreadLocal<>();

      @Override
      public TraceStatus begin(String message) {
          syncTraceId();
          TraceId traceId = traceIdHolder.get();
      }

      private void syncTraceId() {
          TraceId traceId = traceIdHolder.get();
          if (traceId == null) {
              traceIdHolder.set(new TraceId());
          } else {
              traceIdHolder.set(traceId.createNextId());
          }
      }

      private void releaseTraceId() {
          TraceId traceId = traceIdHolder.get();
          if (traceId.isFirstLevel()) {
              traceIdHolder.remove(); // 쓰레드 로컬 값 제거 (중요)
          } else {
              traceIdHolder.set(traceId.createPreviousId());
          }
      }

      // end(), exception(), complete(), addSpace()는 FieldLogTrace와 동일
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/logtrace/ThreadLocalLogTrace.java)

- `FieldLogTrace`와 `ThreadLocalLogTrace` 사용법 비교

  | 항목 | FieldLogTrace | ThreadLocalLogTrace |
  |---|---|---|
  | 저장소 타입 | `TraceId traceIdHolder` | `ThreadLocal<TraceId> traceIdHolder` |
  | 값 저장 | `traceIdHolder = value` | `traceIdHolder.set(value)` |
  | 값 조회 | `traceIdHolder` | `traceIdHolder.get()` |
  | 값 제거 | `traceIdHolder = null` | `traceIdHolder.remove()` |
  | 동시성 안전 여부 | 안전하지 않음 | 안전함 |

- `ThreadLocalLogTraceTest`

  ```java
  @Slf4j
  class ThreadLocalLogTraceTest {

      ThreadLocalLogTrace trace = new ThreadLocalLogTrace();

      @Test
      void begin_end_level2() {
          TraceStatus status1 = trace.begin("hello1");
          TraceStatus status2 = trace.begin("hello2");
          trace.end(status2);
          trace.end(status1);
      }

      @Test
      void begin_exception_level2() {
          TraceStatus status1 = trace.begin("hello");
          TraceStatus status2 = trace.begin("hello2");
          trace.exception(status2, new IllegalStateException());
          trace.exception(status1, new IllegalStateException());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/test/java/hello/advanced/trace/logtrace/ThreadLocalLogTraceTest.java)

- 테스트 실행 결과

  ```
  // begin_end_level2()
  [3f902f0b] hello1
  [3f902f0b] |-->hello2
  [3f902f0b] |<--hello2 time=2ms
  [3f902f0b] hello1 time=6ms

  // begin_exception_level2()
  [3dd9e4f1] hello
  [3dd9e4f1] |-->hello2
  [3dd9e4f1] |<X-hello2 time=3ms ex=java.lang.IllegalStateException
  [3dd9e4f1] hello time=8ms ex=java.lang.IllegalStateException
  ```


<br/><br/>

## 쓰레드 로컬 동기화 - 적용

- `FieldLogTrace`를 `ThreadLocalLogTrace`로 교체하며 설정 파일 한 곳만 변경하면 되고 애플리케이션 코드(V3)는 수정이 필요 없음

- `LogTraceConfig` 수정

  ```java
  @Configuration
  public class LogTraceConfig {

      @Bean
      public LogTrace logTrace() {
          // return new FieldLogTrace(); // 동시성 문제 있음
          return new ThreadLocalLogTrace(); // 동시성 문제 해결
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/advanced/src/main/java/hello/advanced/trace/logtrace/LogTraceConfig.java)

- 동시 요청 시 로그 (정상)

  ```
  [nio-8080-exec-3] [52808e46] OrderController.request()
  [nio-8080-exec-3] [52808e46] |-->OrderService.orderItem()
  [nio-8080-exec-3] [52808e46] |   |-->OrderRepository.save()
  [nio-8080-exec-4] [4568423c] OrderController.request()
  [nio-8080-exec-4] [4568423c] |-->OrderService.orderItem()
  [nio-8080-exec-4] [4568423c] |   |-->OrderRepository.save()
  [nio-8080-exec-3] [52808e46] |   |<--OrderRepository.save() time=1001ms
  [nio-8080-exec-3] [52808e46] |<--OrderService.orderItem() time=1001ms
  [nio-8080-exec-3] [52808e46] OrderController.request() time=1003ms
  [nio-8080-exec-4] [4568423c] |   |<--OrderRepository.save() time=1000ms
  [nio-8080-exec-4] [4568423c] |<--OrderService.orderItem() time=1001ms
  [nio-8080-exec-4] [4568423c] OrderController.request() time=1001ms
  ```

- exec-3과 exec-4 각각 독립된 트랜잭션 ID를 가지며 level도 올바르게 동작함


<br/><br/>

## 쓰레드 로컬 - 주의사항

- WAS(톰캣)는 성능을 위해 쓰레드 풀을 사용하며 쓰레드는 요청이 끝나도 제거되지 않고 풀로 반환되어 재사용됨
- 이때 ThreadLocal 값을 제거하지 않으면 이전 요청의 데이터가 다음 요청에서 그대로 노출됨

  ![ThreadLocal 쓰레드 풀 주의사항](/assets/img/spring-advanced/07-threadlocal-warning-sequence.png)

- 해결책
  - 요청 처리가 완전히 끝나는 시점에 `ThreadLocal.remove()`를 반드시 호출해 주어야 함
  - `ThreadLocalLogTrace`에서는 `releaseTraceId()` 내부에서 `level == 0`인 경우 자동으로 `remove()`를 호출하므로, 최상위 호출이 끝나는 시점에 정리가 이루어짐

  ```java
  private void releaseTraceId() {
      TraceId traceId = traceIdHolder.get();
      if (traceId.isFirstLevel()) {
          traceIdHolder.remove(); // 쓰레드 풀 환경에서 데이터 누수 방지
      } else {
          traceIdHolder.set(traceId.createPreviousId());
      }
  }
  ```

<br/><br/>

## 연습 문제

1. 로깅 추적 시 Trace ID를 파라미터로 전달하는 방식의 주요 문제점은 무엇일까요?

    a. 여러 메소드의 시그니처를 변경해야 하는 것

    - Trace ID를 동기화하기 위해 컨트롤러부터 리포지토리까지 모든 메소드에 파라미터를 추가해야 해서 메소드 시그니처가 계속 변경되는 문제점이 있음

2. 필드(멤버 변수)를 사용하여 Trace ID를 동기화할 때 동시성 문제가 발생하는 근본적인 이유는 무엇일까요?

    a. 여러 스레드가 동일한 객체의 필드를 동시에 변경하기 때문

    - `FieldLogTrace`는 싱글톤 객체의 필드에 Trace ID를 저장하는데 여러 스레드가 동시에 이 필드를 수정하려 할 때 데이터가 꼬이는 동시성 문제가 발생함

3. 동시성 문제를 해결하기 위해 소개된 ThreadLocal의 주요 특징은 무엇일까요?

    a. 각 스레드에게 독립적인 데이터 저장 공간을 제공

    - ThreadLocal을 사용하면 동일한 ThreadLocal 객체에 접근하더라도 각 스레드는 자신만의 독립된 공간에 데이터를 저장하고 조회할 수 있어 동시성 문제를 해결함

4. WAS처럼 스레드 풀 환경에서 ThreadLocal 사용 시 반드시 지켜야 할 가장 중요한 주의사항은 무엇일까요?

    a. 사용 후 해당 스레드의 값을 꼭 `remove()` 해야 한다

    - 스레드 풀에서 스레드가 재사용될 때 이전 요청의 데이터가 남아 데이터 누수나 보안 문제가 발생할 수 있으므로 반드시 `remove()`를 호출하여 데이터를 제거해야 함

5. 로깅 추적을 위해 Trace ID를 관리할 때, ThreadLocal 방식이 기존 파라미터 전달 방식보다 가지는 주요 장점은 무엇일까요?

    a. 애플리케이션의 메소드 시그니처 변경 없이 추적 정보를 관리할 수 있다

    - 파라미터 전달 방식은 모든 메소드에 Trace ID 인자를 추가해야 했지만 ThreadLocal 방식은 전용 저장소를 이용해 비즈니스 로직에 영향을 주지 않고 정보를 전달함


<br/><br/>

## 요약 정리

- 필드 동기화(`FieldLogTrace`)는 `TraceId`를 인스턴스 필드에 저장해 파라미터 전달 없이 로그를 동기화할 수 있지만, 싱글톤 빈 환경에서는 여러 쓰레드가 동시에 필드를 변경하면서 동시성 문제가 발생함
- `ThreadLocal`은 쓰레드마다 독립된 전용 저장소를 제공하며, `FieldLogTrace`의 필드를 `ThreadLocal`로 교체한 `ThreadLocalLogTrace`를 적용하면 동시성 문제를 해결할 수 있음
- 쓰레드 풀 환경에서는 쓰레드가 재사용되기 때문에, 요청 처리가 끝난 뒤 반드시 `ThreadLocal.remove()`를 호출해 데이터 누수와 보안 문제를 방지해야 함
- 로그 추적기는 V1(독립 TraceId) → V2(파라미터 전달) → V3/FieldLogTrace(필드 동기화) → V3/ThreadLocalLogTrace(ThreadLocal 동기화) 순서로 점진적으로 개선되었음


<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
