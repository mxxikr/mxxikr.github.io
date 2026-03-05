---
title: '[스프링 핵심 원리 - 고급편] @Aspect AOP'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-05 15:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, aop, aspect]
math: false
mermaid: false
---

# @Aspect AOP

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 `@Aspect` 애노테이션을 활용한 편리한 프록시 적용 방법과 스프링 자동 프록시 생성기의 동작 원리, 그리고 횡단 관심사 개념을 정리함

<br/><br/>

## @Aspect 프록시 - 적용

### 개요

- 지금까지는 `Advisor`(포인트컷 + 어드바이스)를 직접 빈으로 등록하는 방식을 사용했음
- 스프링은 관점 지향 프로그래밍(AOP)을 지원하기 위해 `@Aspect` 애노테이션을 제공하며, 이를 사용하면 **포인트컷과 어드바이스를 하나의 클래스에 선언적으로 편리하게 작성**할 수 있음

> **참고**  
> - `@Aspect`는 원래 AspectJ 프로젝트에서 제공하는 애노테이션임
> - 스프링은 이 애노테이션을 차용해서 프록시 기반의 AOP를 자체적으로 지원하고 있음

### @Aspect 구조 매핑

  ![@Aspect 구조 매핑 다이어그램](/assets/img/spring-advanced/16-aspect-aop-01.png)

### LogTraceAspect 예제 코드

  ```java
  @Slf4j
  @Aspect
  public class LogTraceAspect {
  
      private final LogTrace logTrace;
  
      public LogTraceAspect(LogTrace logTrace) {
          this.logTrace = logTrace;
      }
  
      // @Around 값 = 포인트컷 표현식 (AspectJ 표현식)
      // @Around 메서드 = 어드바이스 로직 본문
      @Around("execution(* hello.proxy.app..*(..))")
      public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
          TraceStatus status = null;
  
          /*
          joinPoint.getTarget()    → 실제 호출 대상
          joinPoint.getArgs()      → 전달 인자
          joinPoint.getSignature() → 메서드 시그니처 정보
          */
  
          try {
              String message = joinPoint.getSignature().toShortString();
              status = logTrace.begin(message);
  
              Object result = joinPoint.proceed(); // 실제 target 메서드 호출
  
              logTrace.end(status);
              return result;
          } catch (Exception e) {
              logTrace.exception(status, e);
              throw e;
          }
      }
  }
  ```

### 구성 요소 비교

  | 요소 | 역할 | 기존 방식과 대응 |
  |------|------|----------------|
  | `@Aspect` | 이 클래스가 Advisor 역할임을 선언함 | - |
  | `@Around("expression")` | 포인트컷 표현식을 지정함 | `AspectJExpressionPointcut` |
  | `@Around` 메서드 본문 | 실제 동작할 어드바이스 로직 | `MethodInterceptor.invoke()` |
  | `ProceedingJoinPoint` | 실제 호출 대상과 인수 정보를 가지고 있음 | `MethodInvocation invocation` |
  | `joinPoint.proceed()` | 진짜 타겟의 메서드를 실행함 | `invocation.proceed()` |

### AopConfig (설정 파일)

  ```java
  @Configuration
  @Import({AppV1Config.class, AppV2Config.class})
  public class AopConfig {
  
      // @Aspect가 있어도 반드시 스프링 빈으로 등록해야 인식하고 동작함
      // @Component를 클래스 위에 붙여 컴포넌트 스캔 방식을 사용해도 동일함
      @Bean
      public LogTraceAspect logTraceAspect(LogTrace logTrace) {
          return new LogTraceAspect(logTrace);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v5_autoproxy)

### 이전 방식과 @Aspect 방식 비교

  - **이전 방식 (`Advisor` 직접 등록)**
    - `Pointcut`(`AspectJExpressionPointcut` 등) 객체를 직접 생성하고 표현식을 설정함
    - `Advice`(`MethodInterceptor` 등) 객체를 생성하여 부가 기능 로직을 작성함
    - 만들어진 포인트컷과 어드바이스를 `DefaultPointcutAdvisor`로 조립하여 스프링 빈으로 등록함
    - 어드바이저 생성 코드가 흩어질 수 있어 관련 로직을 한눈에 파악하기 번거로움

    ```java
    @Configuration
    public class AopConfig {
        @Bean
        public Advisor advisor(LogTrace logTrace) {
            AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
            pointcut.setExpression("execution(* hello.proxy.app..*(..))");
            LogTraceAdvice advice = new LogTraceAdvice(logTrace);
            return new DefaultPointcutAdvisor(pointcut, advice);
        }
    }
    ```

  - **`@Aspect` 방식**
    - 클래스에 `@Aspect` 애노테이션을 적용하고 자동 프록시 생성기를 통해 어드바이저로 변환함
    - `@Around("포인트컷 표현식")` 애노테이션을 메서드에 붙여 포인트컷을 유연하게 지정함
    - 해당 애노테이션이 붙은 메서드의 내부 로직이 어드바이스 역할을 수행함
    - 포인트컷과 어드바이스를 하나의 클래스 안에 모아서 선언적으로 설계할 수 있어 관리가 편리함

    ```java
    @Aspect
    public class LogTraceAspect {
        @Around("execution(* hello.proxy.app..*(..))")
        public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
            // 부가 기능 로직 (Advice)
            return joinPoint.proceed();
        }
    }
    ```

<br/><br/>

## @Aspect 프록시 - 동작 원리

### 자동 프록시 생성기(AnnotationAwareAspectJAutoProxyCreator)의 두 가지 역할

  ![자동 프록시 생성기의 두 가지 역할 다이어그램](/assets/img/spring-advanced/16-aspect-aop-03.png)

- 빈 후처리기인 자동 프록시 생성기(`AnnotationAwareAspectJAutoProxyCreator`)는 이름 그대로 `@Aspect` 애노테이션을 인지하고 자동으로 처리하는 추가 기능을 가지고 있음

### @Aspect → Advisor 변환 및 저장 과정

  ![Aspect를 Advisor로 변환하는 과정](/assets/img/spring-advanced/16-aspect-aop-04.png)

1. 애플리케이션 로딩 시
    - 스프링 애플리케이션이 구동될 때 자동 프록시 생성기가 호출됨
2. 조회
    - 컨테이너에서 `@Aspect`가 붙은 빈 객체들을 모두 찾아냄
3. 생성 요청
    - 알아낸 `@Aspect` 클래스의 정보를 바탕으로 어드바이저 빌더에게 `Advisor` 생성을 위임함
4. 캐시 저장
    - 생성된 `Advisor` 객체들을 내부에 캐싱해 두고 빠르게 재사용함

> **@Aspect 어드바이저 빌더 (BeanFactoryAspectJAdvisorsBuilder)**  
> - 파싱된 정보로 실제 `Advisor` 인스턴스를 만들고 내부 캐시 저장소에 보관하는 핵심 역할을 수행함
> - 이미 생성된 `Advisor`에 대한 요청이 오면 새로 만들지 않고 캐싱된 객체를 반환하여 성능을 최적화함

### Advisor 기반 프록시 생성 로직

  ![Advisor 기반으로 프록시를 생성하고 빈으로 등록하는 과정](/assets/img/spring-advanced/16-aspect-aop-05.png)

1. 객체 생성 및 전달
    - 빈이 생성되면 스프링이 이를 자동 프록시 생성기에게 우선 넘김
2. Advisor 조회
    - 자동 프록시 생성기는 1번(직접 빈으로 등록한 Advisor)과 2번(빌더 캐시에 저장된 @Aspect 기반 Advisor) 목록을 모두 조회함
3. 포인트컷 스캔
    - 확보한 목록을 토대로 전달받은 빈 객체의 클래스와 모든 메서드를 확인하며 포인트컷 통과 여부를 검사함
4. 프록시 생성 및 등록
    - 조건에 통과한 내역이 하나라도 있다면 원본 객체 대신 프록시를 생성하고, 이 프록시 객체를 스프링 컨테이너에 빈으로 등록함

<br/><br/>

## 자동 프록시 생성기의 전체 흐름 요약

  ![로딩부터 프록시 등록까지 전체 동작 흐름도](/assets/img/spring-advanced/16-aspect-aop-06.png)

- 이처럼 스프링 초기 로딩 시점에 어드바이저 등록 작업을 1회 완료하고, 이후 각 빈이 생성될 때마다 매칭 여부를 검사하여 자동 프록시를 씌우게 됨

<br/><br/>

## 횡단 관심사

### 횡단 관심사 (Cross-cutting Concerns)란?

  ![횡단 관심사 도식화](/assets/img/spring-advanced/16-aspect-aop-07.png)

- 핵심 비즈니스 로직(주문, 결제 등)이 아닌 영역 단위(보안, 로그 추적 등)로 **여러 모듈에 공통적으로 적용되는 부가 기능**을 지칭함

### 최종 사용법

  ```java
  @Slf4j
  @Aspect
  @Component
  public class LogTraceAspect {
  
      private final LogTrace logTrace;
  
      public LogTraceAspect(LogTrace logTrace) {
          this.logTrace = logTrace;
      }
  
      @Around("execution(* hello.proxy.app..*(..)) && !execution(* hello.proxy.app..noLog(..))")
      public Object execute(ProceedingJoinPoint joinPoint) throws Throwable {
          TraceStatus status = null;
          try {
              String message = joinPoint.getSignature().toShortString();
              status = logTrace.begin(message);
  
              Object result = joinPoint.proceed();
  
              logTrace.end(status);
              return result;
          } catch (Exception e) {
              logTrace.exception(status, e);
              throw e;
          }
      }
  }
  ```

- 개발자가 `@Aspect`와 `@Around`만 사용하여 코드를 작성하면, 스프링이 다음과 같은 복잡한 과정을 내부적으로 모두 자동화해 줌
  - `@Aspect` → `Advisor` 변환
    - `AnnotationAwareAspectJAutoProxyCreator`가 처리함
  - 동적 프록시 기술(JDK, CGLIB) 선택
    - `ProxyFactory`가 상황에 맞게 최적의 방식을 자동 선택함
  - 포인트컷 적용 대상 검증
    - 자동 프록시 생성기가 빈 생성 단계를 가로채어 검증을 처리함
  - 컴포넌트 스캔 자동 등록
    - 일반 컴포넌트들도 스프링 빈 로딩 시점에 자동으로 프록시가 적용됨
  - 한 대상에 중복 프록시 적용 방지
    - 대상마다 생성된 단일 프록시 내에 어드바이저를 리스트로 담아 최적화함



<br/><br/>

## 연습 문제

1. 스프링에서 @Aspect를 사용하여 AOP 프록시를 적용할 때 가장 큰 장점은 무엇일까요?

    a. 복잡한 AOP 설정 간소화

    - 복잡한 설정 없이 편리하게 어드바이저를 정의하고 적용할 수 있다는 점임
    - `@Aspect`는 포인트컷과 어드바이스 조합인 어드바이저 생성을 하나의 클래스 내에서 선언적으로 매우 간편하게 구성해 줌

2. 스프링의 자동 프록시 생성기는 @Aspect 어노테이션이 붙은 빈에 대해 어떤 역할을 수행할까요?

    a. 빈을 어드바이저로 변환

    - 자동 프록시 생성기 빌더가 `@Aspect` 빈을 찾아내어 그 내부의 정보(`@Around` 등)를 어드바이저(포인트컷 + 어드바이스) 객체로 변환하여 캐시에 보관하는 역할을 수행함

3. 스프링의 자동 프록시 생성기는 어떤 기준으로 특정 빈에 프록시를 적용할지 결정할까요?

    a. 해당 빈에 어드바이저의 포인트컷 일치

    - 등록되거나 캐시된 어드바이저 중 단 하나라도 해당 빈의 어떠한 메서드든 포인트컷 조건에 부합하여 들어맞는 결과가 나오면 즉시 프록시 적용 대상으로 간주함

4. 애플리케이션의 여러 계층(컨트롤러, 서비스 등)에 걸쳐 반복적으로 나타나는 로깅과 같은 기능은 어떤 유형의 관심사로 분류될까요?

    a. 횡단 관심사

    - 핵심 기능 로직이 아니라 여러 모듈이나 계층에 횡단면처럼 걸쳐 공통적으로 반복 적용되는 부가 성격의 기능들을 횡단 관심사(Cross-Cutting Concern)라고 통칭함

5. 프록시가 횡단 관심사를 다루는 데 유용하게 사용되는 주된 이유는 무엇일까요?

    a. 핵심 로직 수정 없이 기능 추가/변경 용이

    - 원본 도메인의 비즈니스 로직 코드를 단 한 줄도 변경하지 않고, 외부에서 프록시를 통해 침투적으로 횡단 관심사 기능(로깅, 트랜잭션 등)을 깔끔하게 주입하고 분리할 수 있기 때문임
<br/><br/>

## 요약 정리

- `@Aspect` 애노테이션을 사용하면 하나의 클래스 안에 포인트컷과 어드바이스를 모아서 편리하게 어드바이저를 정의할 수 있음
- 자동 프록시 생성기는 `@Aspect`를 찾아 어드바이저로 변환하고 캐시하며, 빈 생성 시점에 이를 활용하여 자동으로 프록시를 매핑하고 적용해 줌

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
