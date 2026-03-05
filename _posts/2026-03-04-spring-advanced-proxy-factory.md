---
title: '[스프링 핵심 원리 - 고급편] 스프링이 지원하는 프록시'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-04 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, proxy-pattern, proxy-factory, pointcut, advice, advisor]
math: false
mermaid: false
---

# 스프링이 지원하는 프록시

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 스프링이 제공하는 `ProxyFactory`와 `Pointcut`, `Advice`, `Advisor`의 개념을 정리함

<br/><br/>

## 프록시 팩토리 (ProxyFactory)

### 기존 동적 프록시 기술의 한계
- 기술 선택의 분리 
  - 인터페이스 유무에 따라 JDK 동적 프록시와 CGLIB를 개발자가 직접 분기해서 사용해야 함
- 로직 작성의 중복
  - 목적이 같더라도 JDK용 `InvocationHandler`와 CGLIB용 `MethodInterceptor`를 각각 따로 구현해야 함
- 조건부 적용과 필터링의 부재
  - 특정 조건의 메서드에만 프록시 로직을 적용하려면 일일이 if-else 분기문을 넣어야 하는 불편함이 있음

### 프록시 팩토리를 통한 문제 해결
- 스프링은 `ProxyFactory`라는 단일 클래스를 통해 위 문제들을 추상화하여 해결함

  ![프록시 팩토리 기술 선택 흐름](/assets/img/spring-advanced/14-proxy-factory-01.png)

- `Advice` 도입을 통한 로직 작성 중복 해결
  - 스프링이 제공하는 단일 `Advice` 인터페이스만 구현하면 두 프록시 기술 모두에서 동작할 수 있음
  - ProxyFactory 내부에서 JDK와 CGLIB의 호출 방식을 변환하여 하나의 Advice를 동일하게 호출하도록 브릿지 역할을 수행함

  ![Advice 브릿지 역할 흐름](/assets/img/spring-advanced/14-proxy-factory-02.png)

- `Pointcut` 도입을 통한 조건부 적용 관리
  - 스프링은 필터 역할을 전담하는 `Pointcut` 개념을 분리하여 부가 기능을 언제 적용할지를 유연하게 설계함

### 프록시 팩토리의 기술 선택 기준
- 타겟 객체에 인터페이스가 존재하는 경우
  - JDK 동적 프록시 기반으로 생성됨
- 타겟 객체에 인터페이스가 없고 구체 클래스만 존재하는 경우
  - CGLIB 기반으로 생성됨
- `proxyTargetClass = true` 옵션이 적용된 경우
  - 인터페이스 유무를 무시하고 무조건 CGLIB 기반으로 생성됨
  - **스프링 부트는 기본적으로 이 옵션이 `true`로 설정되어 있으므로 주로 CGLIB를 사용하여 프록시를 생성함**

<br/><br/>

## 프록시 팩토리 예제 코드

### Advice 만들기
- 최상단의 `Advice`는 스프링 AOP용 인터페이스인 `org.aopalliance.intercept.MethodInterceptor`를 지정하여 구현함
- CGLIB가 제공하는 동일한 이름의 파일과 헷갈리지 않게 패키지 이름 소속에 주의해야 함

  ```java
  public interface MethodInterceptor extends Interceptor {
      Object invoke(MethodInvocation invocation) throws Throwable;
  }
  ```

- 실제 `TimeAdvice` 공통 시간 측정 예시 구현

  ```java
  @Slf4j
  public class TimeAdvice implements MethodInterceptor {
  
      @Override
      public Object invoke(MethodInvocation invocation) throws Throwable {
          log.info("TimeProxy 실행");
          long startTime = System.currentTimeMillis();
  
          // Target 정보를 포함하고 있는 invocation에서 proceed()를 호출하여 타겟의 메서드를 실행함
          Object result = invocation.proceed();
  
          long endTime = System.currentTimeMillis();
          log.info("TimeProxy 종료 resultTime={}ms", endTime - startTime);
          return result;
      }
  }
  ```
- 기존처럼 대상 객체를 직접 주입받지 않아도 ProxyFactory에 등록 시 전달된 정보가 함께 유지되므로 `invocation.proceed()`로 대상의 메서드를 호출할 수 있음

### ProxyFactory 적용 (인터페이스 존재 유무 실험)

  ```java
  @Test
  void interfaceProxy() {
      ServiceInterface target = new ServiceImpl();
      ProxyFactory proxyFactory = new ProxyFactory(target);
      proxyFactory.addAdvice(new TimeAdvice()); // 부가 기능 등록
  
      ServiceInterface proxy = (ServiceInterface) proxyFactory.getProxy();
      proxy.save();
  }
  
  @Test
  void concreteProxy() {
      ConcreteService target = new ConcreteService();
      ProxyFactory proxyFactory = new ProxyFactory(target);
      proxyFactory.addAdvice(new TimeAdvice());
  
      ConcreteService proxy = (ConcreteService) proxyFactory.getProxy();
      proxy.save();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/proxyfactory)
- 인터페이스가 있는 `ServiceImpl`에는 `AopUtils.isJdkDynamicProxy(proxy)`가 참으로 반환되며 `com.sun.proxy.$ProxyXX` 형태의 클래스가 생성됨
- 구체 클래스만 존재하는 `ConcreteService`에는 `AopUtils.isCglibProxy(proxy)`가 참으로 반환되며 `$$EnhancerByCGLIB$$` 형태의 클래스가 생성됨

<br/><br/>

## 포인트컷, 어드바이스, 어드바이저

### 주요 개념 정리

  ![어드바이저 적용 흐름](/assets/img/spring-advanced/14-proxy-factory-03.png)

- **Pointcut**
  - 어디에 부가 기능을 적용할지 필터링하는 기준 (주로 클래스나 메서드 이름 기반으로 적용 대상을 구분함)
- **Advice**
  - `Pointcut` 조건을 만족할 때 프록시가 수행하는 실제 부가 기능 로직
- **Advisor**
  - `Pointcut` 1개와 `Advice` 1개로 구성되어 적용 대상과 부가 기능을 함께 정의함

### 역할 분리
- 적용 대상을 판별하는 `Pointcut`과 부가 기능을 실행하는 `Advice`가 분리되어 유지보수성이 향상됨
- 따라서 스프링의 `Advisor`는 항상 1개의 `Pointcut`과 1개의 `Advice` 쌍으로 구성됨

<br/><br/>

## 직접 구현한 포인트컷과 스프링 기본 제공 포인트컷

### Pointcut 인터페이스 명세

  ```java
  public interface Pointcut {
      ClassFilter getClassFilter();
      MethodMatcher getMethodMatcher();
  }
  ```
- 클래스와 메서드 매처가 모두 조건을 충족하여 `true`를 반환해야 부가 기능이 적용됨
- `isRuntime()`이 `false`인 경우 스프링은 런타임에 동적으로 매칭하지 않고 정적 정보를 미리 캐싱하여 성능을 최적화함

### 스프링이 기본적으로 내장하는 Pointcut 종류들
- 개발자가 직접 조건을 구현할 필요 없이 일반적으로 자주 사용하는 패턴 매칭 기술들을 기본으로 제공함
- 주요 지원 구현체
  - `NameMatchMethodPointcut`
    - 보편적인 메서드 이름 명시 패턴 기반 (내부적으로 스프링의 편의 유틸인 `PatternMatchUtils`를 결합해 동작함)
  - `JdkRegexpMethodPointcut`
    - JDK가 지원하는 정규 표현식으로 더 섬세한 정규 매칭이 필요할 때 적용
  - `AnnotationMatchingPointcut`
    - 특정 타입의 애노테이션 유무에 따라 필터 검증을 선언형으로 조작
  - `AspectJExpressionPointcut`
    - AspectJ 표현식을 기반으로 가장 세밀하고 복잡한 규칙까지 설정 가능하며 가장 많이 사용됨

- `NameMatchMethodPointcut` 적용 예제 코드

  ```java
  @Test
  void advisorTest() {
      ServiceImpl target = new ServiceImpl();
      ProxyFactory proxyFactory = new ProxyFactory(target);
  
      NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
      pointcut.setMappedNames("save"); // save 메서드가 호출될 때만 부가 기능이 적용되도록 제한
  
      DefaultPointcutAdvisor advisor = new DefaultPointcutAdvisor(pointcut, new TimeAdvice());
      proxyFactory.addAdvisor(advisor); // 생성된 어드바이저를 프록시 팩토리에 등록
  
      ServiceInterface proxy = (ServiceInterface) proxyFactory.getProxy();
      proxy.save(); // 매칭되는 save 메서드이므로 부가 기능 적용 
      proxy.find(); // 매칭되지 않는 find 메서드이므로 부가 기능 미적용
  }
  ```

<br/><br/>

## 복수 어드바이저 적용 (권장되는 프록시 구조)

### 여러 프록시 체인 생성의 문제점
- 타겟에 여러 개의 프록시를 중첩해서 생성하면 호출 흐름이 복잡해지고 프록시 객체를 중복 생성해야 하는 문제가 발생함

### 스프링의 단일 프록시 최적화 지향 구조
- 스프링은 항상 **단 1개의 프록시 객체**를 생성하고 그 내부에 여러 어드바이저를 순서대로 적용하도록 지원함

  ```java
  DefaultPointcutAdvisor advisor1 = new DefaultPointcutAdvisor(Pointcut.TRUE, new Advice1());
  DefaultPointcutAdvisor advisor2 = new DefaultPointcutAdvisor(Pointcut.TRUE, new Advice2());
  
  ProxyFactory proxyFactory = new ProxyFactory(target);
  
  // 프록시는 1개지만 순차적인 리스트 순서 체계 지시를 내림
  proxyFactory.addAdvisor(advisor2);
  proxyFactory.addAdvisor(advisor1);
  
  ServiceInterface proxy = (ServiceInterface) proxyFactory.getProxy();
  ```

- 최적화된 내부 구동 환경

  ![단건 프록시 다중 어드바이저 체인 흐름](/assets/img/spring-advanced/14-proxy-factory-04.png)

<br/><br/>

## 정리 및 남은 문제

### 프록시 팩토리의 장점
- `ProxyFactory` 하나로 인터페이스 유무에 관계없이 동적 프록시를 일관되게 생성할 수 있음
- `Advice`를 통해 JDK 동적 프록시(`InvocationHandler`)와 CGLIB(`MethodInterceptor`)로 나뉘던 부가 기능 로직의 중복을 제거함
- `Pointcut`을 도입하여 부가 기능을 언제 적용할지에 대한 필터링 역할을 완벽하게 분리함

### 남아있는 문제
- 프록시 적용의 설정 부담
  - 적용 대상 스프링 빈이 100개, 200개라면 프록시 적용 코드를 일일이 스프링 빈 설정에 등록해야 하는 큰 부담이 있음
- 컴포넌트 스캔 한계
  - `@Controller`, `@Service`, `@Repository` 등 컴포넌트 스캔으로 자동 등록되는 빈들은 프록시 팩토리가 개입할 틈이 없어 순수한 원본 객체로 등록됨
- 해결 방향
  - 빈이 스프링 컨테이너에 등록되기 직전에 대상을 가로채서 프록시로 변환해 주는 **빈 후처리기(BeanPostProcessor)** 가 이 두 가지 문제를 모두 해결할 수 있음

<br/><br/>

## 연습 문제

1. 스프링의 프록시 팩토리를 사용하면 어떤 문제를 해결하며 프록시를 편리하게 생성할 수 있을까요?

    a. 핵심 비즈니스 로직 변경 없이 부가 기능 추가
    - 프록시 팩토리는 원본 코드 수정 없이 프록시를 통해 부가 기능을 넣는 문제를 추상화하여 해결함
    - 원본 코드의 변경 없이 기능 확장이 가능함

2. 스프링 AOP에서 Advice의 주된 역할은 무엇일까요?

    a. 부가 기능 로직 구현
    - Advice는 프록시가 호출할 부가 기능 자체의 로직을 담고 있음
    - 실제 어떤 일을 할지를 정의하는 부분임
    - 필터링은 Pointcut의 역할임

3. 스프링 AOP에서 Pointcut의 주된 역할은 무엇일까요?

    a. 부가 기능 적용 대상 필터링
    - Pointcut은 이름 그대로 어느 시점에 부가 기능을 적용할지 결정하는 필터링 역할을 담당함
    - 주로 클래스나 메소드 이름, 애노테이션 등으로 대상을 지정함

4. 스프링 AOP에서 Advisor는 무엇으로 구성될까요?

    a. 하나의 Pointcut과 하나의 Advice
    - Advisor는 부가 기능을 어디에 적용할지에 대한 정보를 한데 묶어 놓은 구조체임
    - Pointcut 1개와 Advice 1개 쌍으로 구성됨

5. 클라이언트가 프록시를 호출했을 때, Advice 로직을 적용하기 전에 Pointcut이 어떤 역할을 할까요?

    a. 해당 메소드에 Advice 적용 가능 여부 판단
    - 클라이언트가 프록시를 호출하면 프록시는 Advisor에게 해당 메소드에 Advice를 적용할지 먼저 확인함
    - 이때 Advisor 내부의 Pointcut이 메소드의 적용 대상 여부를 판단함

6. ProxyFactory가 대상 객체에 인터페이스가 있는 경우 기본적으로 어떤 프록시 기술을 사용하여 프록시를 생성할까요?

    a. JDK Dynamic Proxy
    - ProxyFactory는 대상 객체의 정보를 보고 프록시 기술을 자동으로 선택함
    - 인터페이스가 있다면 JDK 동적 프록시를 우선하여 사용함

7. ProxyFactory에 setProxyTargetClass(true) 옵션을 설정하면 어떤 효과가 있을까요?

    a. 인터페이스 유무와 관계없이 CGLIB 사용
    - 해당 옵션을 true로 명시하면 인터페이스 존재 여부를 무시함
    - 늘 대상 클래스 기반으로 CGLIB 프록시를 강제 생성함

8. org.aopalliance.intercept.MethodInterceptor를 구현한 Advice에서 다음 Advice 또는 실제 대상 객체의 메소드를 호출하여 실행 흐름을 이어가는 코드는 무엇일까요?

    a. invocation.proceed()
    - Advice 내부 로직에서 invocation.proceed()를 강제 호출해야만 다음 단계의 연결 고리가 실행됨
    - 이 코드를 기점으로 전후 부가 기능 로직을 나눌 수 있음

9. 하나의 대상 객체에 여러 개의 Advisor를 적용해야 할 때, 스프링 AOP는 성능 최적화를 위해 일반적으로 몇 개의 프록시를 생성할까요?

    a. 대상 객체당 1개
    - 스프링 AOP는 겹겹이 포장 프록시를 만들지 않음
    - 단 하나의 프록시가 내부적으로 여러 Advisor 리스트를 소화하여 최적화를 이룸

10. ProxyFactory를 이용한 수동 프록시 설정 방식이 컴포넌트 스캔 환경에서 바로 적용하기 어려운 주된 이유는 무엇일까요?

    a. 스프링 컨테이너에 프록시가 아닌 실제 객체가 빈으로 등록되어서
    - 컴포넌트 스캔 과정에서 스프링 컨테이너는 프록시가 아닌 순수 원본 객체 인스턴스를 찾아서 등록해 버림
    - 이미 대상이 올라가 버려서 가로채어 묶을 시간적인 여유가 없음

<br/><br/>

## 요약 정리

- **ProxyFactory**를 활용하면 JDK 동적 프록시와 CGLIB의 구분 없이 일관된 방식으로 부가 기능을 적용할 수 있음
- 적용 대상을 판별하는 **Pointcut**과 실제 부가 기능을 구현하는 **Advice**, 이를 결합하는 **Advisor**를 통해 역할을 명확히 분리함
- 컴포넌트 스캔 환경에서는 대상 객체가 먼저 빈으로 등록되므로, 빈 생성 시점에 이를 가로채서 프록시로 변환할 수 있는 빈 후처리기(BeanPostProcessor)가 필요함

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
