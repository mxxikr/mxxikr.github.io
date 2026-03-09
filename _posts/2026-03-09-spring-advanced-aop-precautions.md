---
title: '[스프링 핵심 원리 - 고급편] 스프링 AOP 실무 주의사항'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-09 15:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, aop, proxy, internal-call, cglib, jdk-dynamic-proxy]
math: false
mermaid: false
---

# 스프링 AOP - 실무 주의사항

- 김영한님의 스프링 핵심 원리 - 고급편 강의를 바탕으로 스프링 AOP 적용 시 마주할 수 있는 프록시 내부 호출 한계점과 해결책, 그리고 프록시 적용 기술(JDK 동적 프록시, CGLIB)의 발전 과정 및 차이를 정리함

<br/><br/>

## 프록시와 내부 호출 - 문제

### 주요 원칙

- 스프링 AOP는 **프록시 방식**으로 동작함
- AOP가 적용되려면 반드시 **프록시를 통해** 대상 객체(Target)를 호출해야 함

  ```
  클라이언트 → 프록시(어드바이스 실행) → Target 호출
  ```

- 스프링은 AOP 적용 시 대상 객체 대신 **프록시를 스프링 빈으로 등록**하므로 의존관계 주입 시 항상 프록시가 주입됨

### 문제 발생 상황

- 대상 객체 **내부에서** 자신의 메서드를 호출할 때(`this.internal()`) 프록시를 거치지 않고 실제 객체를 직접 호출하게 되어 **AOP가 적용되지 않음**

  ![내부 호출 문제 시퀀스 다이어그램](/assets/img/spring-advanced/21-aop-precautions-01.png)

### 예제 코드

  ```java
  @Slf4j
  @Component
  public class CallServiceV0 {
  
      public void external() {
          log.info("call external");
          internal(); 
      }
  
      public void internal() {
          log.info("call internal");
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/internalcall/CallServiceV0.java)

  ```java
  @Slf4j
  @Aspect
  public class CallLogAspect {
  
      @Before("execution(* hello.aop.internalcall..*.*(..))")
      public void doLog(JoinPoint joinPoint) {
          log.info("aop={}", joinPoint.getSignature());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/internalcall/aop/CallLogAspect.java)

### 실행 결과 차이

- 외부에서 `external()` 호출
  - `external()`은 적용되지만 내부의 `internal()`은 미적용됨
- 외부에서 `internal()` 직접 호출
  - `internal()`이 적용됨

  ```
  CallLogAspect : aop=void ...CallServiceV0.external()  
  CallServiceV0 : call external
  CallServiceV0 : call internal                          
  ```

- AOP가 적용되지 않는 현상이 발생하면 가장 먼저 **내부 호출** 여부를 의심하는 것이 좋음

<br/><br/>

## 해결책 대안 1 - 자기 자신 주입

### 개념

- 자기 자신을 스프링 빈으로 **수정자(Setter) 주입** 받으면 주입된 객체는 프록시이므로 프록시를 통한 호출이 가능해짐

- 주의사항
  - **생성자 주입은 불가능함** (순환 참조가 발생하기 때문임)

  ![자기 자신 주입 시퀀스 다이어그램](/assets/img/spring-advanced/21-aop-precautions-02.png)

### 예제 코드

  ```java
  @Slf4j
  @Component
  public class CallServiceV1 {
  
      private CallServiceV1 callServiceV1;
  
      @Autowired
      public void setCallServiceV1(CallServiceV1 callServiceV1) {
          this.callServiceV1 = callServiceV1;
      }
  
      public void external() {
          log.info("call external");
          callServiceV1.internal(); 
      }
  
      public void internal() {
          log.info("call internal");
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/internalcall/CallServiceV1.java)

### 스프링 부트 설정 주의사항

- **스프링 부트 2.6 이상**부터 순환 참조가 기본 금지됨  
- `application.properties`에 아래 설정 추가가 필요함

  ```properties
  spring.main.allow-circular-references=true
  ```

<br/><br/>

## 해결책 대안 2 - 지연 조회

### 개념

- `ObjectProvider`를 사용해 스프링 빈 조회 시점을 **실제 사용 시점으로 지연**시킴
- 빈 생성 시점에 자기 자신을 주입받는 것이 아니므로 순환 참조가 발생하지 않음

  ![지연 조회 시퀀스 다이어그램](/assets/img/spring-advanced/21-aop-precautions-03.png)

### 예제 코드

  ```java
  @Slf4j
  @Component
  @RequiredArgsConstructor
  public class CallServiceV2 {
  
      private final ObjectProvider<CallServiceV2> callServiceProvider;
  
      public void external() {
          log.info("call external");
          CallServiceV2 callServiceV2 = callServiceProvider.getObject();
          callServiceV2.internal(); 
      }
  
      public void internal() {
          log.info("call internal");
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/internalcall/CallServiceV2.java)


<br/><br/>

## 해결책 대안 3 - 구조 변경 (권장)

### 개념

- 내부 호출이 발생하지 않도록 **클래스 자체를 분리**하는 것이 가장 근본적인 해결책임  
- `internal()` 로직을 별도 클래스(`InternalService`)로 분리하면 자연스럽게 프록시를 통한 호출이 됨

  ![구조 변경 다이어그램](/assets/img/spring-advanced/21-aop-precautions-04.png)

### 예제 코드

  ```java
  @Slf4j
  @Component
  @RequiredArgsConstructor
  public class CallServiceV3 {
  
      private final InternalService internalService;
  
      public void external() {
          log.info("call external");
          internalService.internal(); 
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/internalcall/CallServiceV3.java)

  ```java
  @Slf4j
  @Component
  public class InternalService {
  
      public void internal() {
          log.info("call internal");
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/main/java/hello/aop/internalcall/InternalService.java)

### 실행 결과

  ```
  CallLogAspect    : aop=void ...CallServiceV3.external()   
  CallServiceV3    : call external
  CallLogAspect    : aop=void ...InternalService.internal() 
  InternalService  : call internal
  ```

- 권장 이유
  - 설계 자체가 개선되며 AOP도 자연스럽게 적용되므로 **가장 권장**하는 방법임
- 참고 사항
  - AOP는 `public` 메서드 수준에 적용하는 것이 적합하며 `private` 메서드처럼 작은 단위에는 AOP를 적용하지 않음

<br/><br/>

## 프록시 기술과 한계 - 타입 캐스팅

### JDK 동적 프록시와 CGLIB 비교

- JDK 동적 프록시 방식
  - 인터페이스 기반으로 작동함
  - 인터페이스가 반드시 필수적임
  - 구체 클래스로의 캐스팅이 불가함
  - 인터페이스로의 캐스팅은 가능함
- CGLIB 방식
  - 구체 클래스 기반으로 작동함
  - 인터페이스가 불필요함
  - 구체 클래스로의 캐스팅이 가능함
  - 인터페이스로의 캐스팅도 가능함

### JDK 동적 프록시 구조와 캐스팅

  ![JDK 프록시 타입 캐스팅 한계](/assets/img/spring-advanced/21-aop-precautions-05.png)

### CGLIB 프록시 구조와 캐스팅

  ![CGLIB 프록시 타입 캐스팅 구조](/assets/img/spring-advanced/21-aop-precautions-06.png)

### 예제 코드

  ```java
  @Test
  void jdkProxy() {
      MemberServiceImpl target = new MemberServiceImpl();
      ProxyFactory proxyFactory = new ProxyFactory(target);
      proxyFactory.setProxyTargetClass(false); 
  
      MemberService memberServiceProxy = (MemberService) proxyFactory.getProxy();
  
      assertThrows(ClassCastException.class, () -> {
          MemberServiceImpl castingMemberService = (MemberServiceImpl) memberServiceProxy;
      });
  }
  
  @Test
  void cglibProxy() {
      MemberServiceImpl target = new MemberServiceImpl();
      ProxyFactory proxyFactory = new ProxyFactory(target);
      proxyFactory.setProxyTargetClass(true); 
  
      MemberService memberServiceProxy = (MemberService) proxyFactory.getProxy();
  
      MemberServiceImpl castingMemberService = (MemberServiceImpl) memberServiceProxy;
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/proxyvs/ProxyCastingTest.java)

<br/><br/>

## 프록시 기술과 한계 - 의존관계 주입

- 타입 캐스팅 한계가 실제로 문제가 되는 상황은 **의존관계 주입(DI) 시점**임

### JDK 동적 프록시 - DI 실패 케이스

  ![JDK 동적 프록시 DI 실패 상황](/assets/img/spring-advanced/21-aop-precautions-07.png)

  ```java
  @Autowired MemberService memberService;        
  @Autowired MemberServiceImpl memberServiceImpl; 
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/proxyvs/ProxyDITest.java)

- 오류 메시지
  ```
  BeanNotOfRequiredTypeException: Bean named 'memberServiceImpl' is expected to be of type
  'hello.aop.member.MemberServiceImpl' but was actually of type 'com.sun.proxy.$Proxy54'
  ```

### CGLIB 프록시 - DI 성공 케이스

  ![CGLIB 프록시 DI 성공 상황](/assets/img/spring-advanced/21-aop-precautions-08.png)

  ```java
  @Autowired MemberService memberService;        
  @Autowired MemberServiceImpl memberServiceImpl; 
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/proxyvs/ProxyDITest.java)

- 설계 원칙
  - 올바른 설계에서는 구체 클래스가 아닌 **인터페이스로 의존관계를 주입**받아야 함
  - 그러나 테스트 등 특수한 경우 구체 클래스 주입이 필요할 때는 CGLIB를 사용하면 됨

<br/><br/>

## 프록시 기술과 한계 - CGLIB 단점

- CGLIB는 구체 클래스를 **상속**받아 프록시를 생성하므로 여러 제약이 발생함

- 기본 생성자 필수 제약
  - 자식 객체 생성 시 부모 생성자가 호출되는 자바 상속 규약에 따라 자식 생성자에서 `super()`가 자동 호출되기 때문임
- 생성자 2번 호출 제약
  - 실제 대상(`target`) 객체 생성 시 1회, 프록시 생성 시 부모 생성자가 추가로 호출되어 총 2회 호출됨
- `final` 클래스와 메서드 사용 불가 제약
  - 상속 및 오버라이딩이 불가능하여 프록시 생성 자체가 안됨

<br/><br/>

## 스프링의 해결책

- 스프링은 버전을 지속적으로 올리며 CGLIB의 단점들을 점진적으로 해결해왔음

  ![스프링 프록시 기술 발전사 타임라인](/assets/img/spring-advanced/21-aop-precautions-10.png)

### 스프링 부트 2.0 이후 기본 동작

  ```properties
  spring.aop.proxy-target-class=true   
  ```

### objenesis 라이브러리가 해결한 문제들

- `objenesis` 라이브러리는 **생성자 호출 없이 객체를 생성**할 수 있게 지원하여 문제점들을 해결했음
  - **기본 생성자 필수 문제**
    - 기본 생성자 없이도 프록시 객체 생성이 가능해짐
  - **생성자 2번 호출 문제**
    - 프록시 생성 시 부모 생성자 호출 없이 구조를 생성함

### 확인 코드

  ```java
  @Slf4j
  @SpringBootTest 
  @Import(ProxyDIAspect.class)
  public class ProxyDITest {
  
      @Autowired MemberService memberService;
      @Autowired MemberServiceImpl memberServiceImpl;
  
      @Test
      void go() {
          log.info("memberService class={}", memberService.getClass());
          log.info("memberServiceImpl class={}", memberServiceImpl.getClass());
          memberServiceImpl.hello("hello");
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/aop/src/test/java/hello/aop/proxyvs/ProxyDITest.java)

- 실행 결과
  ```
  memberService class=class hello.aop.member.MemberServiceImpl$$EnhancerBySpringCGLIB$$83e257b3
  memberServiceImpl class=class hello.aop.member.MemberServiceImpl$$EnhancerBySpringCGLIB$$83e257b3
  ```

- 위 결과를 통해 두 빈 모두 정상적으로 CGLIB 프록시로 적용되었음을 확인할 수 있음


## 연습 문제

1. Spring AOP는 애플리케이션의 런타임 비즈니스 로직 외에 모듈 전체에 걸쳐 등장하는 여러 부가 기능을 처리하도록 돕습니다. 로깅이나 재시도 같은 기능은 주로 어떤 부류의 로직으로 정의될까요?

    a. 횡단 관심사
    - AOP는 핵심 기능과 섞이기 쉬운 로깅, 보안, 재시도 등 여러 곳에 반복되는 기능을 깔끔하게 분리하고 모듈화함
    - 이를 횡단 관심사라고 부름

2. 대상 메서드가 시작되기 전에 특정 동작(예: 파라미터 로깅 등)을 수행하려 할 때, 가장 가볍게 사용할 수 있는 어드바이스 유형은 무엇일까요?

    a. @Before
    - 메서드 실행 전 시점에만 동작해야 한다면 가장 안전한 옵션인 @Before 어드바이스를 사용하는 것이 권장됨

3. 예외가 발생했을 때 로직을 버리지 않고 다시 시도하는 '재시도 로직' 개발 시 어떤 종류의 어드바이스가 필수적으로 사용되어야 할까요?

    a. @Around
    - 재시도 로직은 실행 흐름 전체를 가로채 진행을 막고 반복문 등을 통해 여러 번 시도할 통제 권한이 필요함
    - 따라서 메서드 실행 자체를 제어할 수 있는 @Around만 사용 가능함

4. AOP를 활용하여 재시도 로직을 설계할 때 무한 루프 등 서비스 장애를 유발할 수 있어 코드 작성 시 반드시 고려되어야 하는 필수 구현 사항은 무엇일까요?

    a. 최대 재시도 횟수 지정
    - 재시도를 통제할 최대 횟수 상한선을 설정하지 않으면 네트워크나 시스템 통신 장애가 터졌을 때 트래픽이 폭주함
    - 이로 인해 시스템 전체가 다운될 위험이 존재함

5. 실무에서 `@Transactional`이나 `@Async` 등 스프링이 제공하는 편리한 선언적 기능들은 모두 어떤 핵심 기술 메커니즘을 기반으로 구현되어 있을까요?

    a. 스프링 동적 프록시와 AOP
    - 스프링 프로그래밍 모델의 거의 모든 공통 처리는 전부 프록시를 통한 AOP 기반으로 작동함
    - 이는 개발자가 비즈니스 로직에만 집중하게 만들어주는 핵심적인 원동력이 됨

<br/><br/>

## 요약 정리

- 프록시의 내부 호출 문제를 방지하려면 `this` 등을 통해 빈의 인터널 메서드를 직접 호출하는 대신 구조를 개편하여 별도 컴포넌트로 분리 주입받아 사용하는 방식이 절대적으로 유리함
- 객체 지향 원칙에 다가가기 위해서는 AOP 프록시 기술 구현체(JDK 동적 프록시, CGLIB)의 차이에 의존하기보다는 철저하게 인터페이스 기반 설계를 먼저 수행하는 것이 추천됨
- 스프링 프레임워크와 스프링 부트의 지속적인 발전을 통해, 과거 CGLIB 기술의 고질적인 단점이었던 디폴트 생성자 필수 문제와 중복 초기화 문제 등이 해결되었음
- 특별한 경우가 아닌 한 CGLIB 기반의 단일 프록시 생성을 믿고 편하게 의존성 주입과 AOP 로직을 개발해도 무방함

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
