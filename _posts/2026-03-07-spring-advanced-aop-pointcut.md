---
title: '[스프링 핵심 원리 - 고급편] 스프링 AOP 포인트컷'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-07 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, aop, pointcut, execution, within, args, annotation]
math: false
mermaid: false
---

# 스프링 AOP 포인트컷의 이해

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 스프링 AOP의 포인트컷 지시자의 종류와 사용법을 정리함

<br/><br/>

## 포인트컷 지시자

- 포인트컷 표현식은 `execution` 같은 포인트컷 지시자(Pointcut Designator)로 시작함

  - `execution`
    - 메서드 실행 조인 포인트 매칭
  - `within`
    - 특정 타입 내 조인 포인트 매칭
    - 부모 타입 지정 불가
  - `args`
    - 인자 타입으로 매칭 (런타임 판단)
    - 단독 사용 금지
  - `this` / `target`
    - `this`는 프록시 객체, `target`은 실제 타겟 객체 대상
    - 주로 파라미터 바인딩용으로 사용됨
  - `@target` / `@within`
    - 클래스에 애노테이션 있는 경우 (`@target`은 부모 포함, `@within`은 해당 클래스만)
    - 단독 사용 금지
  - `@annotation`
    - 메서드에 애노테이션 있는 경우 매칭
  - `@args`
    - 인수 런타임 타입에 애노테이션
    - 단독 사용 금지
  - `bean`
    - 빈 이름으로 지정 (스프링 전용)

- `@target`, `@args`, `args` 등은 스프링이 애플리케이션을 초기화할 때 모든 빈(스프링 내부 빈 포함)에 프록시를 적용하려 시도할 위험이 있음
- 따라서 항상 `execution` 같은 지시자와 조합해서 프록시 적용 범위를  제한한 후 사용해야 함

  ```java
  // 잘못된 예: 모든 스프링 빈에 프록시 적용을 시도하여 빈 생성 오류 가능성 발생
  @Around("@target(hello.aop.member.annotation.ClassAop)")
  
  // 올바른 예: execution으로 범위를 먼저 축소함
  @Around("execution(* hello.aop..*(..)) && @target(hello.aop.member.annotation.ClassAop)")
  ```

<br/><br/>

## 예제 코드 세팅

### 커스텀 애노테이션
- 포인트컷 매칭을 테스트하기 위한 애노테이션을 정의함

  ```java
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.RUNTIME)
  public @interface ClassAop {}
  
  @Target(ElementType.METHOD)
  @Retention(RetentionPolicy.RUNTIME)
  public @interface MethodAop {
      String value();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/member/annotation/ClassAop.java)

### 대상 클래스
- 인터페이스와 구현체를 준비함

  ```java
  public interface MemberService {
      String hello(String param);
  }
  
  @ClassAop
  @Component
  public class MemberServiceImpl implements MemberService {
  
      @Override
      @MethodAop("test value")
      public String hello(String param) {
          return "ok";
      }
  
      public String internal(String param) { 
          return "ok";
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/member/MemberServiceImpl.java)

### 테스트 기본 설정
- 리플렉션을 사용해 `helloMethod` 정보를 추출해둠

  ```java
  @Slf4j
  public class ExecutionTest {
      AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
      Method helloMethod;
  
      @BeforeEach
      public void init() throws NoSuchMethodException {
          helloMethod = MemberServiceImpl.class.getMethod("hello", String.class);
      }
  
      @Test
      void printMethod() {
          log.info("helloMethod={}", helloMethod);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/ExecutionTest.java)

<br/><br/>

## execution 지시자

### 문법 구조
- 메서드 실행 조인 포인트를 매칭하며 스프링 AOP에서 가장 많이 사용됨

  ```
  execution(접근제어자? 반환타입 선언타입?메서드이름(파라미터) 예외?)
  ```

  ![execution 문법 구조](/assets/img/spring-advanced/19-aop-pointcut-02.png)

- `?`가 붙은 속성은 생략 가능하며 타입과 파라미터는 필수임
- `*` 같은 패턴이나 `..`을 통해 매개변수와 패키지를 유연하게 지정할 수 있음

  ```java
  pointcut.setExpression("execution(public String hello.aop.member.MemberServiceImpl.hello(String))");
  
  pointcut.setExpression("execution(* *(..))");
  ```

### 메서드 이름 매칭
| 표현식 | 설명 | 매칭 예 |
|--------|------|---------|
| `execution(* hello(..))` | 정확히 `hello` | `hello(String)` 일치 |
| `execution(* hel*(..))` | `hel`로 시작 | `hello`, `help` 일치 |
| `execution(* *el*(..))` | `el` 포함 | `hello`, `select` 일치 |
| `execution(* nono(..))` | 정확히 `nono` | `hello` 불일치 |

### 패키지 매칭
| 표현식 | 설명 | 결과 |
|--------|------|------|
| `execution(* hello.aop.member.MemberServiceImpl.hello(..))` | 정확한 경로 | 일치 |
| `execution(* hello.aop.member.*.*(..))` | member 패키지의 모든 클래스 | 일치 |
| `execution(* hello.aop.*.*(..))` | aop 바로 아래만 (member 제외) | 불일치 |
| `execution(* hello.aop.member..*.*(..))` | member 패키지 + 하위 패키지 | 일치 |
| `execution(* hello.aop..*.*(..))` | aop 패키지 + 하위 패키지 전체 | 일치 |

- `.`은 정확히 해당 위치의 패키지를 의미함
- `..`은 해당 위치의 패키지 및 그 하위 패키지 전체를 의미함

### 타입 매칭 (부모 타입 허용)
- `execution`은 부모 타입을 선언해도 그 자식 타입까지 매칭됨

  ```java
  pointcut.setExpression("execution(* hello.aop.member.MemberServiceImpl.*(..))");
  
  pointcut.setExpression("execution(* hello.aop.member.MemberService.*(..))");
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/ExecutionTest.java)

- 단 부모 타입에 선언되지 않은 자식 고유의 메서드는 매칭되지 않으므로 주의가 필요함


### 파라미터 매칭
| 표현식 | 의미 |
|--------|------|
| `(String)` | 정확히 String 타입 파라미터 1개 |
| `()` | 파라미터 없음 |
| `(*)` | 정확히 1개, 타입 무관 |
| `(*, *)` | 정확히 2개, 타입 무관 |
| `(..)` | 개수와 타입 모두 무관 (0개 이상) |
| `(String, ..)` | 첫 번째는 String, 이후 개수와 타입 무관 |

  ```java
  assertThat(pointcut("execution(* *(String))").matches(helloMethod, MemberServiceImpl.class)).isTrue();
  assertThat(pointcut("execution(* *())").matches(helloMethod, MemberServiceImpl.class)).isFalse();   
  assertThat(pointcut("execution(* *(*))").matches(helloMethod, MemberServiceImpl.class)).isTrue();   
  assertThat(pointcut("execution(* *(..))").matches(helloMethod, MemberServiceImpl.class)).isTrue();  
  assertThat(pointcut("execution(* *(String, ..))").matches(helloMethod, MemberServiceImpl.class)).isTrue();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/ExecutionTest.java)

<br/><br/>

## within 지시자

- 특정 타입 내의 모든 메서드를 조인 포인트로 지정함
- `execution`에서 타입 부분만 사용하는 형태와 유사함

  ```java
  pointcut.setExpression("within(hello.aop.member.MemberServiceImpl)");  
  
  pointcut.setExpression("within(hello.aop.member.*Service*)");  
  
  pointcut.setExpression("within(hello.aop..*)");  
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/WithinTest.java)

### execution과 within의 차이
- `within`은 부모 타입이나 인터페이스를 지정할 수 없고 정확한 구체 클래스 타입만 지정해야 함
- 부모 타입으로 지정하면 매칭에 실패함

  ```java
  pointcut.setExpression("within(hello.aop.member.MemberService)");
  
  pointcut.setExpression("execution(* hello.aop.member.MemberService.*(..))");
  ```

    | 지시자 | 부모 타입 지정 | 특징 |
    |--------|--------------|------|
    | `execution` | 허용 | 메서드 시그니처 기반 정밀 매칭 |
    | `within` | 불가 | 타입만 지정, 정확히 일치해야 함 |

<br/><br/>

## args 지시자

- 메서드의 인자가 주어진 타입의 인스턴스인 조인 포인트를 매칭함
- 문법은 `execution`의 파라미터 부분과 동일함

### execution 파라미터와 args의 차이
- `execution`은 파라미터의 정적 선언 타입을 기준으로 판단하지만 `args`는 동적으로 넘어오는 인자의 런타임 타입을 기준으로 판단함

  ```java
  pointcut("args(String)").matches(helloMethod, MemberServiceImpl.class)          
  pointcut("args(Object)").matches(helloMethod, MemberServiceImpl.class)          
  pointcut("args(java.io.Serializable)").matches(helloMethod, MemberServiceImpl.class) 
  
  pointcut("execution(* *(String))").matches(helloMethod, MemberServiceImpl.class)         
  pointcut("execution(* *(Object))").matches(helloMethod, MemberServiceImpl.class)         
  pointcut("execution(* *(java.io.Serializable))").matches(helloMethod, MemberServiceImpl.class) 
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/ArgsTest.java)


- `args`는 단독으로 쓰이기보다는 주로 파라미터 바인딩 용도로 사용됨

<br/><br/>

## @target과 @within 지시자

- 특정 애노테이션이 타입에 선언되어 있을 때 대상을 매칭함

  ![@target과 @within의 범위 차이](/assets/img/spring-advanced/19-aop-pointcut-04.png)

- `@target`은 인스턴스의 모든 메서드(부모 메서드 포함)를 어드바이스 적용 대상으로 함
- `@within`은 해당 애노테이션이 선언된 클래스의 메서드만 어드바이스 적용 대상으로 함

  ```java
  @Slf4j
  @Aspect
  static class AtTargetAtWithinAspect {
  
      @Around("execution(* hello.aop..*(..)) && @target(hello.aop.member.annotation.ClassAop)")
      public Object atTarget(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[@target] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  
      @Around("execution(* hello.aop..*(..)) && @within(hello.aop.member.annotation.ClassAop)")
      public Object atWithin(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[@within] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/AtTargetAtWithinTest.java)

### 실행 결과
  ```
  [@target] void ...Child.childMethod()   
  [@within] void ...Child.childMethod()   
  [@target] void ...Parent.parentMethod() 
  ```

| 지시자 | 적용 범위 | 부모 메서드 포함 |
|--------|-----------|----------------|
| `@target` | 인스턴스의 모든 메서드 | 포함 |
| `@within` | 해당 타입에 선언된 메서드만 | 미포함 |

<br/><br/>

## @annotation과 bean 지시자

### @annotation
- 메서드에 특정 애노테이션이 선언되어 있을 때 매칭함

  ```java
  @MethodAop("test value")
  public String hello(String param) { ... }
  ```

  ```java
  @Slf4j
  @Aspect
  static class AtAnnotationAspect {
  
      @Around("@annotation(hello.aop.member.annotation.MethodAop)")
      public Object doAtAnnotation(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[@annotation] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/AtAnnotationTest.java)

### bean 매칭
- 스프링 컨테이너의 빈 이름으로 대상을 지정하는 스프링 AOP 전용 지시자임
- `*` 패턴을 사용할 수 있음

  ```java
  @Aspect
  static class BeanAspect {
  
      @Around("bean(orderService) || bean(*Repository)")
      public Object doLog(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[bean] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/BeanTest.java)

<br/><br/>

## 파라미터 바인딩

- 포인트컷 표현식을 사용해 어드바이스 메서드로 다양한 종류의 데이터를 직접 받을 수 있음

  ```java
  @Slf4j
  @Aspect
  static class ParameterAspect {
  
      @Pointcut("execution(* hello.aop.member..*.*(..))")
      private void allMember() {}
  
      @Around("allMember()")
      public Object logArgs1(ProceedingJoinPoint joinPoint) throws Throwable {
          Object arg1 = joinPoint.getArgs()[0];
          log.info("[logArgs1] {}, arg={}", joinPoint.getSignature(), arg1);
          return joinPoint.proceed();
      }
  
      @Around("allMember() && args(arg,..)")
      public Object logArgs2(ProceedingJoinPoint joinPoint, Object arg) throws Throwable {
          log.info("[logArgs2] {}, arg={}", joinPoint.getSignature(), arg);
          return joinPoint.proceed();
      }
  
      @Before("allMember() && args(arg,..)")
      public void logArgs3(String arg) {
          log.info("[logArgs3] arg={}", arg);
      }
  
      @Before("allMember() && this(obj)")
      public void thisArgs(JoinPoint joinPoint, MemberService obj) {
          log.info("[this] {}, obj={}", joinPoint.getSignature(), obj.getClass());
      }
  
      @Before("allMember() && target(obj)")
      public void targetArgs(JoinPoint joinPoint, MemberService obj) {
          log.info("[target] {}, obj={}", joinPoint.getSignature(), obj.getClass());
      }
  
      @Before("allMember() && @target(annotation)")
      public void atTarget(JoinPoint joinPoint, ClassAop annotation) {
          log.info("[@target] {}, annotation={}", joinPoint.getSignature(), annotation);
      }
  
      @Before("allMember() && @within(annotation)")
      public void atWithin(JoinPoint joinPoint, ClassAop annotation) {
          log.info("[@within] {}, annotation={}", joinPoint.getSignature(), annotation);
      }
  
      @Before("allMember() && @annotation(annotation)")
      public void atAnnotation(JoinPoint joinPoint, MethodAop annotation) {
          log.info("[@annotation] {}, value={}", joinPoint.getSignature(), annotation.value());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/ParameterTest.java)

| 표현식 | 전달 내용 |
|--------|-----------|
| `args(arg,..)` | 메서드 인수 |
| `this(obj)` | 프록시 객체 |
| `target(obj)` | 실제 타겟 객체 |
| `@target(annotation)` | 클래스 레벨 애노테이션 인스턴스 |
| `@within(annotation)` | 클래스 레벨 애노테이션 인스턴스 |
| `@annotation(annotation)` | 메서드 레벨 애노테이션 인스턴스 |

- 포인트컷의 이름과 어드바이스 메서드의 매개변수 이름은 정확히 일치해야 함

<br/><br/>

## this와 target 지시자의 차이

  ![this와 target의 차이](/assets/img/spring-advanced/19-aop-pointcut-05.png)

- `this`는 스프링 컨테이너에 등록되어 있는 프록시 객체를 매칭함
- `target`은 프록시가 가리키는 실제 대상 객체를 매칭함

### 프록시 생성 방식에 따른 차이점

  ![프록시 기술 차이에 의한 this 흐름도](/assets/img/spring-advanced/19-aop-pointcut-06.png)

- JDK 동적 프록시는 인터페이스를 구현해서 프록시를 생성하므로 구현 클래스(`MemberServiceImpl`) 정보를 알 수 없음
- CGLIB는 구체 클래스를 상속해서 프록시를 생성하므로 부모인 구체 클래스(`MemberServiceImpl`) 타입까지 매칭될 수 있음

  ```java
  /**
   * application.properties
   * spring.aop.proxy-target-class=true CGLIB
   * spring.aop.proxy-target-class=false JDK 동적 프록시
   */
  @Slf4j
  @Aspect
  static class ThisTargetAspect {
  
      // 부모 타입 허용
      @Around("this(hello.aop.member.MemberService)")
      public Object doThisInterface(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[this-interface] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  
      // 부모 타입 허용
      @Around("target(hello.aop.member.MemberService)")
      public Object doTargetInterface(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[target-interface] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  
      //this: 스프링 AOP 프록시 객체 대상
      //JDK 동적 프록시는 인터페이스를 기반으로 생성되므로 구현 클래스를 알 수 없음
      //CGLIB 프록시는 구현 클래스를 기반으로 생성되므로 구현 클래스를 알 수 있음
      @Around("this(hello.aop.member.MemberServiceImpl)")
      public Object doThis(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[this-impl] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  
      //target: 실제 target 객체 대상
      @Around("target(hello.aop.member.MemberServiceImpl)")
      public Object doTarget(ProceedingJoinPoint joinPoint) throws Throwable {
          log.info("[target-impl] {}", joinPoint.getSignature());
          return joinPoint.proceed();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/pointcut/ThisTargetTest.java)

| 매칭 표현 지정 타입 | JDK 동적 프록시 | CGLIB |
|-----------|----------------|-------|
| `this(MemberService)` | 매칭 성공 (인터페이스) | 매칭 성공 (상속 트리) |
| `this(MemberServiceImpl)` | 매칭 방해 (Impl 정보 부재) | 매칭 성공 (Impl 상속) |
| `target(MemberService)` | 매칭 성공 | 매칭 성공 |
| `target(MemberServiceImpl)` | 매칭 성공 | 매칭 성공 |

<br/><br/>


## 연습 문제

1. 스프링 AOP에서 포인트컷 지시자는 주로 무엇을 정의할까요?

    a. 조인 포인트 대상 범위
    - 포인트컷 지시자는 어디에 어드바이스를 적용할지 대상을 필터링하여 범위를 정하는 역할을 함

2. execution 포인트컷 지시자는 어떤 시점을 조인 포인트로 매칭할까요?

    a. 메서드 실행
    - execution은 이름 그대로 메서드가 실행되는 시점을 포착하는 가장 기본적인 포인트컷 지시자임

3. execution 포인트컷 표현식에서 매개변수 패턴 (...)는 무엇을 의미할까요?

    a. 0개 이상의 임의 매개변수
    - execution에서 '...'은 매개변수의 타입과 개수에 상관없이 0개 이상 어떤 매개변수든 허용한다는 와일드카드임

4. Spring AOP에서 this와 target 포인트컷 지시자의 가장 큰 차이점은 무엇일까요?

    a. this는 프록시, target은 실제 객체
    - Spring AOP는 프록시 기반이라 this는 스프링 컨테이너에 등록된 프록시 객체를 가리키며 target은 프록시가 호출하는 원본 객체를 뜻함

5. execution 지시자를 사용할 때 지정한 선언 타입으로 인터페이스를 명시하면 어떻게 될까요?

    a. 부모 타입에 선언된 메서드를 구현한 자식 타입의 메서드까지 매칭됨
    - execution은 선언 타입으로 부모 타입을 지정해도 다형성이 적용되어 해당 부모에 정의된 메서드를 구현한 모든 자식의 메서드까지 매칭함

6. within 포인트컷 지시자의 주요 제약사항은 무엇일까요?

    a. 부모 타입이나 인터페이스를 지정할 수 없음
    - within은 특정 타입 내부에 있는 조인 포인트를 매칭하지만 부모 타입으로는 매칭할 수 없고 정확한 구체 타입만 지정해야 함

7. args 포인트컷 지시자와 execution 파라미터 매칭 방식의 주요 차이점은 무엇일까요?

    a. args는 런타임 객체 기반, execution은 시그니처 기반
    - args는 메서드 호출 시 전달되는 실제 객체의 런타임 타입을 보고 매칭하며 반면 execution은 메서드 시그니처의 선언된 타입만 보고 매칭함

8. @annotation 포인트컷 지시자는 무엇을 대상으로 조인 포인트를 매칭할까요?

    a. 메서드 애노테이션
    - @annotation 지시자는 조인 포인트가 되는 메서드 자체에 특정 애노테이션이 붙어있는 대상을 매칭할 때 사용됨

9. 클래스에 특정 어노테이션이 적용되었을 때 @target과 @within의 범위 차이는 무엇일까요?

    a. @target은 부모 포함 모든 메서드, @within은 해당 클래스 메서드만
    - @target은 애노테이션이 붙은 객체 인스턴스의 상속을 포함한 모든 메서드를 매칭하지만 @within은 해당 애노테이션이 붙은 타입 정의 내부의 메서드만 매칭함

10. bean 포인트컷 지시자는 어떤 환경을 대상으로 사용될까요?

    a. 스프링 빈 이름 단위로 적용 시 사용됨
    - bean 지시자는 AspectJ 표준에는 없고 스프링 컨테이너에 등록된 빈의 이름을 기준으로 조인 포인트를 지정하기 위한 Spring AOP 전용 기술임

<br/><br/>

## 요약 정리

- **execution**은 스프링 AOP에서 가장 많이 쓰이는 포인트컷 지시자로 메서드 시그니처를 정교하게 묘사하여 조인 포인트를 찾기 위해 사용됨
- **within, args, @annotation** 등은 execution의 특정 부분을 대체하거나 보완하는 용도로 조인 포인트를 매칭함
- **매개변수 전달과 파라미터 바인딩**을 통해 args, this, target 및 특정 애노테이션 객체 등을 어드바이스 메서드 안으로 가져와서 값을 자유롭게 쓸 수 있음
- `@target`이나 `args` 등 단독으로 사용하면 스프링의 모든 컨테이너 빈에 프록시가 적용되어 심각한 오류가 날 수 있는 지시자들은 반드시 `execution` 등을 통해 대상의 범위를 좁힌 뒤 함께 사용해야 함

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
