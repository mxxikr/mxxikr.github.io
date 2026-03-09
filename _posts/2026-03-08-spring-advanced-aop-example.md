---
title: '[스프링 핵심 원리 - 고급편] 스프링 AOP 실전 예제'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-08 15:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, aop, example, trace, retry, aspect]
math: false
mermaid: false
---

# 스프링 AOP - 실전 예제

- 김영한님의 스프링 핵심 원리 - 고급편 강의를 바탕으로 유용하게 쓰일 수 있는 로그 출력 AOP(@Trace)와 재시도 AOP(@Retry)를 직접 구현해보고 전체적인 코드 구조와 흐름을 정리함

<br/><br/>

## 예제 구조

### 전체 패키지 아키텍처

- 애노테이션, 애스펙트, 그리고 실제 비즈니스 로직 클래스들로 분리하여 구성함

  ```
  hello.aop.exam
  ├── annotation
  │   ├── Trace.java
  │   └── Retry.java
  ├── aop
  │   ├── TraceAspect.java
  │   └── RetryAspect.java
  ├── ExamRepository.java
  ├── ExamService.java
  └── ExamTest.java
  ```

### 클래스 관계도

  ![예제 클래스 관계도](/assets/img/spring-advanced/20-aop-example-01.png)

<br/><br/>

## 기본 비즈니스 로직

### ExamRepository

- 5번에 1번 꼴로 예외를 발생시키도록 하여 간헐적인 네트워크 오류나 데이터베이스 락 등의 상황을 시뮬레이션함

  ```java
  @Repository
  public class ExamRepository {
      private static int seq = 0;
  
      public String save(String itemId) {
          seq++;
          if (seq % 5 == 0) {
              throw new IllegalStateException("예외 발생");
          }
          return "ok";
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/exam/ExamRepository.java)

### ExamService

- 단순히 `ExamRepository`를 호출하는 서비스 계층임

  ```java
  @Service
  @RequiredArgsConstructor
  public class ExamService {
      private final ExamRepository examRepository;
  
      public void request(String itemId) {
          examRepository.save(itemId);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/exam/ExamService.java)

### ExamTest

- 아무런 AOP가 적용되지 않은 상태에서 테스트 실행 시 5번째 호출에서 `IllegalStateException` 예외가 발생하여 테스트가 실패함

  ```java
  @SpringBootTest
  public class ExamTest {
      @Autowired
      ExamService examService;
  
      @Test
      void test() {
          for (int i = 0; i < 5; i++) {
              examService.request("data" + i);
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/exam/ExamTest.java)

<br/><br/>

## 로그 출력 AOP - @Trace

- 지정한 메서드가 호출될 때 해당 메서드의 시그니처와 인자 정보를 자동으로 로그에 남기기 위한 AOP를 구현함

### 동작 흐름

  ![Trace 동작 시퀀스](/assets/img/spring-advanced/20-aop-example-02.png)

### @Trace 애노테이션 정의

  ```java
  @Target(ElementType.METHOD)
  @Retention(RetentionPolicy.RUNTIME)
  public @interface Trace {
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/exam/annotation/Trace.java)

### TraceAspect 구현

- `@Before` 어드바이스를 사용하여 실제 메서드가 수행되기 전 로그를 기록함
- 포인트컷 지시자로 `@annotation`을 사용하여 `@Trace`가 부여된 모든 메서드를 타겟팅함

  ```java
  @Slf4j
  @Aspect
  public class TraceAspect {
  
      @Before("@annotation(hello.aop.exam.annotation.Trace)")
      public void doTrace(JoinPoint joinPoint) {
          Object[] args = joinPoint.getArgs();
          log.info("[trace] {} args={}", joinPoint.getSignature(), args);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/exam/aop/TraceAspect.java)

### @Trace 적용 및 실행

- `ExamService`의 `request`와 `ExamRepository`의 `save` 메서드에 각각 `@Trace`를 추가함
- `ExamTest`에 `@Import(TraceAspect.class)`를 선언하여 애스펙트를 스프링 빈으로 등록해 줌

  ```
  [trace] void hello.aop.exam.ExamService.request(String) args=[data0]
  [trace] String hello.aop.exam.ExamRepository.save(String) args=[data0]
  [trace] void hello.aop.exam.ExamService.request(String) args=[data1]
  [trace] String hello.aop.exam.ExamRepository.save(String) args=[data1]
  ...
  ```

<br/><br/>

## 재시도 AOP - @Retry

- 시스템에서 예기치 않은 간헐적 타임아웃 오류 발생 시 로직을 바로 실패 처리하지 않고, 지정된 횟수만큼 재시도하도록 돕는 AOP임

### 동작 흐름

  ![Retry 플로우차트](/assets/img/spring-advanced/20-aop-example-03.png)

### @Retry 애노테이션 정의

- 재시도 횟수를 동적으로 설정하기 위해 `value` 속성을 추가하고 기본값을 3으로 지정함

  ```java
  @Target(ElementType.METHOD)
  @Retention(RetentionPolicy.RUNTIME)
  public @interface Retry {
      int value() default 3;
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/exam/annotation/Retry.java)

### RetryAspect 구현

- 재시도를 위해선 정상 실행과 예외 상황에 대한 완벽한 통제가 필요하므로 `@Around` 어드바이스를 사용함
- 매개변수에 `Retry` 객체를 직접 바인딩하여 애노테이션 내부의 `value`값을 동적으로 읽어옴

  ```java
  @Slf4j
  @Aspect
  public class RetryAspect {
  
      @Around("@annotation(retry)")
      public Object doRetry(ProceedingJoinPoint joinPoint, Retry retry) throws Throwable {
          log.info("[retry] {} retry={}", joinPoint.getSignature(), retry);
  
          int maxRetry = retry.value();
          Exception exceptionHolder = null;
  
          for (int retryCount = 1; retryCount <= maxRetry; retryCount++) {
              try {
                  log.info("[retry] try count={}/{}", retryCount, maxRetry);
                  return joinPoint.proceed();
              } catch (Exception e) {
                  exceptionHolder = e;
              }
          }
  
          throw exceptionHolder;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/exam/aop/RetryAspect.java)

### @Retry 적용 및 실행

- 예외가 간헐적으로 터지는 `ExamRepository`의 `save` 메서드에 `@Retry(value = 4)`를 추가하여 4번까지 재시도하도록 설정함
- `ExamTest`에 `@Import({TraceAspect.class, RetryAspect.class})`를 선언해 두 애스펙트를 모두 적용해 줌

  ```
  [retry] try count=1/4   // 1~4번째 실행까지는 정상 성공
  ...
  [retry] try count=1/4   // 5번째 호출에서 save의 첫 실행 실패
  [retry] try count=2/4   // 예외를 catch하여 for 루프를 타고 2번째 재시도 -> 성공, 정상 진행됨
  ```
- 재시도 기능 덕분에 5번째 로직에서 에러가 났음에도 애플리케이션의 테스트 코드는 정상적으로 통과됨을 볼 수 있음


<br/><br/>

## 연습 문제

1. Spring AOP는 애플리케이션의 런타임 비즈니스 로직 외에 모듈 전체에 걸쳐 등장하는 여러 부가 기능을 처리하도록 돕습니다. 로깅이나 재시도 같은 기능은 주로 어떤 부류의 로직으로 정의될까요?

    a. 횡단 관심사
    - AOP는 핵심 기능과 섞이기 쉬운 로깅, 보안, 재시도 등 여러 곳에 반복되는 기능을 깔끔하게 분리하고 모듈화합니다. 이를 횡단 관심사라고 부릅니다.

2. 대상 메서드가 시작되기 전에 특정 동작(예: 파라미터 로깅 등)을 수행하려 할 때, 가장 가볍게 사용할 수 있는 어드바이스 유형은 무엇일까요?

    a. @Before
    - 메서드 실행 전 시점에만 동작해야 한다면 가장 안전한 옵션인 @Before 어드바이스를 사용하는 것이 좋습니다.

3. 예외가 발생했을 때 로직을 버리지 않고 다시 시도하는 '재시도 로직' 개발 시 어떤 종류의 어드바이스가 필수적으로 사용되어야 할까요?

    a. @Around
    - 재시도 로직은 실행 흐름 전체를 가로채 진행을 막고 반복문 등을 통해 여러 번 시도할 통제 권한이 필요하므로 메서드 실행 자체를 제어할 수 있는 @Around만 사용 가능합니다.

4. AOP를 활용하여 재시도 로직을 설계할 때 무한 루프 등 서비스 장애를 유발할 수 있어 코드 작성 시 반드시 고려되어야 하는 필수 구현 사항은 무엇일까요?

    a. 최대 재시도 횟수 지정
    - 재시도를 통제할 최대 횟수 상한선을 설정하지 않으면 지속적으로 네트워크나 시스템 통신 장애가 터졌을 때 트래픽이 폭주하여 시스템 전체가 다운될 위험이 있습니다.

5. 실무에서 `@Transactional`이나 `@Async` 등 스프링이 제공하는 편리한 선언적 기능들은 모두 어떤 핵심 기술 메커니즘을 기반으로 구현되어 있을까요?

    a. 스프링 동적 프록시와 AOP
    - 스프링 프로그래밍 모델의 거의 모든 공통 처리는 전부 프록시를 통한 AOP 기반으로 작동하며 이는 개발자가 비즈니스 로직에만 집중하게 만들어주는 원동력이 됩니다.

<br/><br/>

## 요약 정리

- 복잡한 비즈니스 파편화 문제는 직접 객체 지향 설계를 훼손하는 대신 **AOP를 활용하여 횡단 관심사를 분리함으로써 코드의 응집도와 유지보수성**을 향상시킬 수 있음
- 어드바이스의 목적에 따라 `@Before`처럼 간결하게 선언하거나 `@Around`처럼 실행을 완전히 통제하는 등 전략적인 선택을 할 수 있음
- **애노테이션 객체 바인딩**을 사용하면 Aspect가 대상의 속성값을 유연하게 참조하여 재시도 횟수 지정 같이 다이나믹한 로직 처리가 가능함

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
