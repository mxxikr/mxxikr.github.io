---
title: '[스프링 핵심 원리 - 고급편] 스프링 AOP 구현'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-06 15:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, aop, aspect]
math: false
mermaid: true
---

# 스프링 AOP 구현

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 스프링 AOP의 구현 방법과 단계별 진화 과정, 그리고 다양한 어드바이스 종류를 정리함

<br/><br/>

## 프로젝트 설정

### build.gradle

  ```groovy
      implementation 'org.springframework.boot:spring-boot-starter-aspectj'
  
      // 테스트에서 lombok 사용
      testCompileOnly 'org.projectlombok:lombok'
      testAnnotationProcessor 'org.projectlombok:lombok'
  ```

- 스프링 부트를 사용하면 `@EnableAspectJAutoProxy`는 자동으로 추가됨

<br/><br/>

## 예제 프로젝트 구조

  ![예제 프로젝트 구조](/assets/img/spring-advanced/18-aop-impl-01.png)

### OrderRepository

  ```java
  @Slf4j
  @Repository
  public class OrderRepository {
      public String save(String itemId) {
          log.info("[orderRepository] 실행");
          if (itemId.equals("ex")) {
              throw new IllegalStateException("예외 발생!");
          }
          return "ok";
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/OrderRepository.java)

### OrderService

  ```java
  @Slf4j
  @Service
  public class OrderService {
      private final OrderRepository orderRepository;
  
      public void orderItem(String itemId) {
          log.info("[orderService] 실행");
          orderRepository.save(itemId);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/OrderService.java)

### AopTest (기본)

  ```java
  @Slf4j
  @SpringBootTest
  public class AopTest {
      @Autowired OrderService orderService;
      @Autowired OrderRepository orderRepository;
  
      @Test
      void aopInfo() {
          // AOP 프록시 적용 여부 확인 (현재는 false)
          log.info("isAopProxy, orderService={}", AopUtils.isAopProxy(orderService));
          log.info("isAopProxy, orderRepository={}", AopUtils.isAopProxy(orderRepository));
      }
  
      @Test
      void success() {
          orderService.orderItem("itemA");
      }
  
      @Test
      void exception() {
          assertThatThrownBy(() -> orderService.orderItem("ex"))
              .isInstanceOf(IllegalStateException.class);
      }
  }
  ```
  
<br/><br/>

## 시작 (AspectV1)

- `@Aspect`와 `@Around`를 사용한 가장 기본적인 AOP 구현 방식임

  ```java
  @Slf4j
  @Aspect
  public class AspectV1 {
  
      // 포인트컷: hello.aop.order 패키지와 하위 패키지 전체
      @Around("execution(* hello.aop.order..*(..))")
      public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[log] {}", joinPoint.getSignature()); // 조인 포인트 시그니처 출력
          return joinPoint.proceed(); // 실제 타겟 호출
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/AspectV1.java)

### 테스트 등록

  ```java
  @Import(AspectV1.class) // @Aspect는 컴포넌트 스캔 대상이 아님 → 직접 빈 등록 필요
  @SpringBootTest
  public class AopTest { ... }
  ```

- `@Aspect`는 빈으로 등록되어야 동작하며 `@Bean`, `@Component`, `@Import` 중 선택하여 등록할 수 있음

### 실행 결과

  ```
  [log] void hello.aop.order.OrderService.orderItem(String)
  [orderService] 실행
  [log] String hello.aop.order.OrderRepository.save(String)
  [orderRepository] 실행
  ```

<br/><br/>

## 포인트컷 분리 (AspectV2)

- `@Pointcut`으로 포인트컷 표현식을 메서드로 분리하여 재사용할 수 있음

  ```java
  @Slf4j
  @Aspect
  public class AspectV2 {
  
      // 반환 타입은 반드시 void, 내용은 비워둠
      @Pointcut("execution(* hello.aop.order..*(..))") 
      private void allOrder() {} // 포인트컷 시그니처
  
      @Around("allOrder()") 
      public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[log] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/AspectV2.java)

### 구성 요소 설명

  | 구성 요소 | 설명 |
  |-----------|------|
  | `@Pointcut` 표현식 | `execution(* hello.aop.order..*(..))` |
  | 포인트컷 시그니처 | `allOrder()` (메서드 이름 + 파라미터) |
  | 접근 제어자 | `private` 내부에서만 참조, `public` 외부 애스펙트에서도 참조 가능 |

<br/><br/>

## 어드바이스 추가 (AspectV3)

- 포인트컷을 조합하고 어드바이스를 추가하여 트랜잭션 흉내를 내는 예제임

  ```java
  @Slf4j
  @Aspect
  public class AspectV3 {
  
      @Pointcut("execution(* hello.aop.order..*(..))")
      public void allOrder() {} // order 패키지 + 하위 패키지
  
      @Pointcut("execution(* *..*Service.*(..))")
      private void allService() {} // *Service 클래스
  
      @Around("allOrder()")
      public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[log] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  
      // order 패키지 && *Service 클래스 (OrderService에만 적용)
      @Around("allOrder() && allService()")
      public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
          try {
              log.info("[트랜잭션 시작] {}", joinPoint.getSignature());
              Object result = joinPoint.proceed();
              log.info("[트랜잭션 커밋] {}", joinPoint.getSignature());
              return result;
          } catch (Exception e) {
              log.info("[트랜잭션 롤백] {}", joinPoint.getSignature());
              throw e;
          } finally {
              log.info("[리소스 릴리즈] {}", joinPoint.getSignature());
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/AspectV3.java)

### 포인트컷 조합 연산자

  | 연산자 | 의미 | 예시 |
  |--------|------|------|
  | `&&` | AND | `allOrder() && allService()` |
  | `\|\|` | OR | `allOrder() \|\| allService()` |
  | `!` | NOT | `!allService()` |

### 어드바이스 적용 결과

  ![어드바이스 적용 결과](/assets/img/spring-advanced/18-aop-impl-03.png)

  ```
  [log] void hello.aop.order.OrderService.orderItem(String)
  [트랜잭션 시작] void hello.aop.order.OrderService.orderItem(String)
  [orderService] 실행
  [log] String hello.aop.order.OrderRepository.save(String)
  [orderRepository] 실행
  [트랜잭션 커밋] void hello.aop.order.OrderService.orderItem(String)
  [리소스 릴리즈] void hello.aop.order.OrderService.orderItem(String)
  ```

<br/><br/>

## 포인트컷 참조 (AspectV4)

- 포인트컷을 별도 클래스로 분리하여 여러 애스펙트에서 공유할 수 있음

### Pointcuts (공용 포인트컷 모음)

  ```java
  public class Pointcuts {
  
      @Pointcut("execution(* hello.aop.order..*(..))")
      public void allOrder() {}
  
      @Pointcut("execution(* *..*Service.*(..))")
      public void allService() {}
  
      @Pointcut("allOrder() && allService()")
      public void orderAndService() {}
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/Pointcuts.java)

### AspectV4Pointcut (외부 포인트컷 참조)

  ```java
  @Slf4j
  @Aspect
  public class AspectV4Pointcut {
  
      // 패키지명 포함 전체 경로로 참조
      @Around("hello.aop.order.aop.Pointcuts.allOrder()")
      public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[log] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  
      @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
      public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/AspectV4Pointcut.java)

<br/><br/>

## 어드바이스 순서 (AspectV5)

- 어드바이스는 기본적으로 순서를 보장하지 않음
- 순서를 지정하려면 `@Order`를 사용하되 클래스(애스펙트) 단위로만 적용이 가능함
- 하나의 `@Aspect` 안에 여러 어드바이스가 있으면 순서 보장이 불가능하므로 클래스로 분리해야 함

  ```java
  public class AspectV5Order {
  
      @Aspect
      @Order(2) // 숫자가 작을수록 먼저 실행
      public static class LogAspect {
          @Around("hello.aop.order.aop.Pointcuts.allOrder()")
          public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
          }
      }
  
      @Aspect
      @Order(1) // TxAspect가 먼저 실행됨
      public static class TxAspect {
          @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
          public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/AspectV5Order.java)

### 테스트 등록

  ```java
  @Import({AspectV5Order.LogAspect.class, AspectV5Order.TxAspect.class})
  @SpringBootTest
  public class AopTest { ... }
  ```

### @Order 적용 후 실행 흐름

  ![@Order 적용 후 실행 흐름](/assets/img/spring-advanced/18-aop-impl-04.png)

  ```
  [트랜잭션 시작] void hello.aop.order.OrderService.orderItem(String)
  [log] void hello.aop.order.OrderService.orderItem(String)
  [orderService] 실행
  [트랜잭션 커밋] void hello.aop.order.OrderService.orderItem(String)
  [리소스 릴리즈] void hello.aop.order.OrderService.orderItem(String)
  ```

<br/><br/>

## 어드바이스 종류 (AspectV6)

### 어드바이스 종류 한눈에 보기

  ![어드바이스 종류 한눈에 보기](/assets/img/spring-advanced/18-aop-impl-05.png)

### 실행 순서 (동일 Aspect 내)

- `@Around` → `@Before` → `@After` → `@AfterReturning` → `@AfterThrowing` 순으로 실행됨
- 호출 순서와 리턴 순서는 반대임에 유의해야 함

### AspectV6Advice 전체 코드

  ```java
  @Slf4j
  @Aspect
  public class AspectV6Advice {
  
      @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
      public Object doTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
          // proceed() 호출 필수
      }
  
      @Before("hello.aop.order.aop.Pointcuts.orderAndService()")
      public void doBefore(JoinPoint joinPoint) {
          log.info("[before] {}", joinPoint.getSignature());
      }
  
      @AfterReturning(value = "hello.aop.order.aop.Pointcuts.orderAndService()", returning = "result")
      public void doReturn(JoinPoint joinPoint, Object result) {
          log.info("[return] {} return={}", joinPoint.getSignature(), result);
      }
  
      @AfterThrowing(value = "hello.aop.order.aop.Pointcuts.orderAndService()", throwing = "ex")
      public void doThrowing(JoinPoint joinPoint, Exception ex) {
          log.info("[ex] {} message={}", joinPoint.getSignature(), ex.getMessage());
      }
  
      @After(value = "hello.aop.order.aop.Pointcuts.orderAndService()")
      public void doAfter(JoinPoint joinPoint) {
          log.info("[after] {}", joinPoint.getSignature());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/aop/src/main/java/hello/aop/order/aop/AspectV6Advice.java)

### 어드바이스 종류 비교

  | 어드바이스 | 실행 시점 | proceed() | 반환값 변경 | 예외 처리 |
  |-----------|-----------|-----------|------------|-----------|
  | `@Around` | 전후 모두 | 직접 호출 필요 | 가능 | 가능 |
  | `@Before` | 실행 전 | 불필요 (자동) | 불가 | 불가 |
  | `@AfterReturning` | 정상 반환 후 | 불필요 | 불가 (조작만 가능) | 불가 |
  | `@AfterThrowing` | 예외 발생 후 | 불필요 | 불가 | 예외 확인 가능 |
  | `@After` | 항상 (finally) | 불필요 | 불가 | 불가 |

### JoinPoint / ProceedingJoinPoint 주요 메서드

  ```java
  // JoinPoint - 모든 어드바이스에서 사용 가능함
  joinPoint.getArgs()       // 메서드 인수 반환
  joinPoint.getThis()       // 프록시 객체 반환
  joinPoint.getTarget()     // 실제 타겟 객체 반환
  joinPoint.getSignature()  // 메서드 시그니처 반환
  
  // ProceedingJoinPoint - @Around 전용 (JoinPoint의 하위 타입임)
  joinPoint.proceed()           // 다음 어드바이스 또는 타겟 호출
  joinPoint.proceed(args[])     // 변경된 인수로 호출
  ```

### 실행 결과

  ```
  [around][트랜잭션 시작] void hello.aop.order.OrderService.orderItem(String)
  [before] void hello.aop.order.OrderService.orderItem(String)
  [orderService] 실행
  [orderRepository] 실행
  [return] void hello.aop.order.OrderService.orderItem(String) return=null
  [after] void hello.aop.order.OrderService.orderItem(String)
  [around][트랜잭션 커밋] void hello.aop.order.OrderService.orderItem(String)
  [around][리소스 릴리즈] void hello.aop.order.OrderService.orderItem(String)
  ```

<br/><br/>

## @Around 외에 다른 어드바이스가 필요한 이유

### 잘못된 @Around 사용 

  ```java
  // 잘못된 @Around 사용 - proceed()를 호출하지 않아 타겟이 실행되지 않는 치명적 버그가 발생함
  @Around("hello.aop.order.aop.Pointcuts.orderAndService()")
  public void doBefore(ProceedingJoinPoint joinPoint) {
      log.info("[before] {}", joinPoint.getSignature());
      // joinPoint.proceed() 누락 시 타겟 호출이 되지 않음
  }
  ```

  ```java
  // 올바른 방법 - @Before 사용 시 proceed() 호출 고민 자체가 불필요함
  @Before("hello.aop.order.aop.Pointcuts.orderAndService()")
  public void doBefore(JoinPoint joinPoint) {
      log.info("[before] {}", joinPoint.getSignature());
  }
  ```

- **넓은 기능을 제공하는 `@Around`**
  - 가장 강력하지만, 개발자가 `proceed()` 호출을 누락하면 타겟 자체가 실행되지 않는 치명적인 버그가 발생할 위험이 있음
- **좁은 기능을 보장하는 `@Before`, `@After` 등**
  - 기능은 제한적이지만 어드바이스 흐름을 프레임워크가 제어하므로 위와 같은 치명적인 실수가 원천 차단됨
  - 코드를 읽는 순간 타겟 실행 전(또는 후)에만 동작한다는 의도를 즉시 파악할 수 있어 훨씬 안전함

<br/><br/>

## 연습 문제

1. AOP에서 어드바이스가 적용될 지점(Join Point)을 지정하는 규칙 또는 표현식을 무엇이라고 할까요?

    a. 포인트컷

    - 포인트컷은 어드바이스가 적용될 조인 포인트를 선택하는 기준임
    - 어드바이스는 실행될 부가 기능 코드이며, 애스펙트는 부가 기능을 모듈화한 것임

2. 스프링 AOP가 런타임에 핵심 로직(대상 객체)에 부가 기능(애스펙트)을 적용하는 주요 기술 방식은 무엇일까요?

    a. 프록시 기반

    - 스프링 AOP는 대상 빈 객체 대신 프록시 객체를 만들어 호출을 가로챔
    - 컴파일/로드 타임 위빙은 주로 AspectJ가 사용하는 방식임

3. @Pointcut 애노테이션을 사용하여 포인트컷 표현식을 별도의 메서드로 분리했을 때 가장 큰 장점은 무엇일까요?

    a. 포인트컷 재사용성 및 가독성 증가

    - 포인트컷을 분리하면 여러 어드바이스에서 동일한 포인트컷을 참조할 수 있어 코드 중복을 줄이고 가독성을 높일 수 있음
    - 이는 성능이나 어드바이스 유형과는 무관함

4. 조인 포인트 실행 전/후 처리를 모두 제어하고, 필요에 따라 대상 메서드 실행을 막거나 결과/예외를 조작할 수 있는 가장 강력한 어드바이스 유형은 무엇일까요?

    a. @Around

    - Around 어드바이스는 ProceedingJoinPoint를 사용하여 대상 호출 전후의 흐름을 완벽하게 제어할 수 있음
    - 다른 어드바이스 유형들은 특정 시점에만 실행된다는 차이가 있음

5. 동일한 조인 포인트에 여러 애스펙트가 적용될 때, 각 애스펙트의 실행 순서를 명시적으로 지정하기 위해 사용하는 스프링 애노테이션은 무엇일까요?

    a. @Order

    - @Order는 애스펙트 클래스 단위로 실행 순서를 제어하며, 설정된 숫자가 낮을수록 먼저 실행됨
    - @Aspect나 @Pointcut 등 다른 애노테이션은 역할이 다름

<br/><br/>

## 요약 정리

- 스프링 AOP 구현은 `@Aspect`를 사용하여 애노테이션 기반으로 편리하게 개발할 수 있음
- `@Pointcut`을 사용하면 포인트컷을 분리하고 모듈화하여 여러 곳에서 재사용할 수 있음
- 어드바이스의 실행 순서는 클래스 단위로 `@Order`를 적용하여 제어해야 함
- 상황에 맞춰 `@Around` 외에도 `@Before`, `@AfterReturning` 등의 어드바이스를 적절히 사용하면 제약을 통해 실수 가능성을 줄이고 의도를 명확하게 전달할 수 있음

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
