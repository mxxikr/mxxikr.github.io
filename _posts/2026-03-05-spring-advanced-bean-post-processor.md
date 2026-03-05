---
title: '[스프링 핵심 원리 - 고급편] 빈 후처리기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-05 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, proxy-pattern, bean-post-processor, aop]
math: false
mermaid: false
---

# 빈 후처리기

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 스프링 빈 생명주기를 가로채어 객체를 조작하거나 프록시로 교체하는 빈 후처리기 개념과 자동 프록시 생성기의 동작 방식을 이해하고 정리함

<br/><br/>

## 빈 후처리기 - 소개

### 일반적인 스프링 빈 등록 흐름

  ![일반적인 스프링 빈 등록 흐름](/assets/img/spring-advanced/15-bean-post-processor-01.png)

### 빈 후처리기란?

- 스프링이 생성한 객체를 빈 저장소에 정식으로 등록하기 직전 단계에 개입함
- 이 시점에 원본 빈을 자유롭게 조작하거나 아예 다른 프록시 객체로 바꿔치기 할 수 있는 확장 기능을 제공함

  ![빈 후처리기 흐름](/assets/img/spring-advanced/15-bean-post-processor-02.png)

### BeanPostProcessor 인터페이스

  ```java
  public interface BeanPostProcessor {
      // @PostConstruct 같은 초기화 발생 직전 호출
      Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException;
  
      // @PostConstruct 같은 초기화 발생 직후 호출
      Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException;
  }
  ```

  | 메서드 | 호출 시점 | 주로 사용하는 경우 |
  |--------|----------|------------------|
  | `postProcessBeforeInitialization` | 초기화(@PostConstruct) **전** | 빈 프로퍼티 검증, 사전 조작 |
  | `postProcessAfterInitialization` | 초기화(@PostConstruct) **후** | **프록시 교체** (주로 이것을 사용함) |

> **@PostConstruct**  
> - 스프링은 `CommonAnnotationBeanPostProcessor`라는 빈 후처리기를 자동 등록함  
> - 이 후처리기가 빈 생성 후 `@PostConstruct`가 붙은 메서드를 찾아 대신 호출해 줌  
> - 즉, 스프링 스스로도 내부 기능 확장에 빈 후처리기를 매우 적극적으로 활용함

<br/><br/>

## 빈 후처리기 - 예제 코드

### 일반 빈 등록 (기준선)

  ```java
  public class BasicTest {
  
      @Test
      void basicConfig() {
          ApplicationContext ctx = new AnnotationConfigApplicationContext(BasicConfig.class);
  
          // beanA → A 객체로 정상 조회됨
          A a = ctx.getBean("beanA", A.class);
          a.helloA();
  
          // B는 등록된 적 없으므로 예외 발생
          Assertions.assertThrows(NoSuchBeanDefinitionException.class,
              () -> ctx.getBean(B.class));
      }
  
      @Configuration
      static class BasicConfig {
          @Bean(name = "beanA")
          public A a() { return new A(); }
      }
  
      @Slf4j
      static class A {
          public void helloA() {
              log.info("hello A");
          }
      }

      @Slf4j
      static class B {
          public void helloB() {
              log.info("hello B");
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/postprocessor/BasicTest.java)

### 빈 후처리기로 A를 B로 바꿔치기

  ```java
  public class BeanPostProcessorTest {
  
      @Test
      void postProcessor() {
          ApplicationContext ctx = new AnnotationConfigApplicationContext(BeanPostProcessorConfig.class);
  
          // beanA 이름으로 조회했지만 후처리기를 통해 바뀐 B 객체가 반환됨
          B b = ctx.getBean("beanA", B.class);
          b.helloB();
  
          // A는 스프링 빈으로 등록조차 되지 못함
          Assertions.assertThrows(NoSuchBeanDefinitionException.class,
              () -> ctx.getBean(A.class));
      }
  
      @Configuration
      static class BeanPostProcessorConfig {
          @Bean(name = "beanA")
          public A a() { return new A(); }
  
          @Bean
          public AToBPostProcessor helloPostProcessor() {
              return new AToBPostProcessor();
          }
      }
  
      // A가 들어오면 B로 바꿔서 반환하는 빈 후처리기
      @Slf4j
      static class AToBPostProcessor implements BeanPostProcessor {
          @Override
          public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
              log.info("beanName={} bean={}", beanName, bean);
              if (bean instanceof A) {
                  return new B(); // 원본 객체 대신 B 객체로 교체함
              }
              return bean; // 그 외는 조작 없이 원본을 그대로 반환함
          }
      }
  }
  ```
  - **실행 결과**
    ```
    AToBPostProcessor - beanName=beanA bean=...A@21362712
    B - hello B
    ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/postprocessor/BeanPostProcessorTest.java)

<br/><br/>

## 빈 후처리기 - 프록시 적용
객체 대신 **프록시를 생성해서 반환**하면, 스프링 컨테이너에는 원본 객체 대신 프록시 객체가 빈으로 등록됨

  ![빈 후처리기 프록시 생성 과정](/assets/img/spring-advanced/15-bean-post-processor-03.png)

### PackageLogTraceProxyPostProcessor

  ```java
  @Slf4j
  public class PackageLogTraceProxyPostProcessor implements BeanPostProcessor {
  
      private final String basePackage; // 프록시 적용 대상 패키지
      private final Advisor advisor;    // 적용할 어드바이저
  
      public PackageLogTraceProxyPostProcessor(String basePackage, Advisor advisor) {
          this.basePackage = basePackage;
          this.advisor = advisor;
      }
  
      @Override
      public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
          log.info("param beanName={} bean={}", beanName, bean.getClass());
  
          // 설정한 패키지 기준으로 프록시 적용 대상 여부 확인
          String packageName = bean.getClass().getPackageName();
          if (!packageName.startsWith(basePackage)) {
              return bean; // 대상이 아니면 원본 반환
          }
  
          // 프록시 생성 후 반환 (원래 객체 대신 등록됨)
          ProxyFactory proxyFactory = new ProxyFactory(bean);
          proxyFactory.addAdvisor(advisor);
          Object proxy = proxyFactory.getProxy();
          log.info("create proxy: target={} proxy={}", bean.getClass(), proxy.getClass());
          return proxy;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v4_postprocessor/postprocessor/PackageLogTraceProxyPostProcessor.java)

### BeanPostProcessorConfig (설정 파일)

  ```java
  @Slf4j
  @Configuration
  @Import({AppV1Config.class, AppV2Config.class}) // V3는 컴포넌트 스캔이라 Import 제외
  public class BeanPostProcessorConfig {
  
      @Bean
      public PackageLogTraceProxyPostProcessor logTraceProxyPostProcessor(LogTrace logTrace) {
          // hello.proxy.app 하위 빈들에게만 프록시를 씌우는 후처리기 등록
          return new PackageLogTraceProxyPostProcessor("hello.proxy.app", getAdvisor(logTrace));
      }
  
      private Advisor getAdvisor(LogTrace logTrace) {
          NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
          pointcut.setMappedNames("request*", "order*", "save*");
  
          LogTraceAdvice advice = new LogTraceAdvice(logTrace);
          return new DefaultPointcutAdvisor(pointcut, advice);
      }
  }
  ```
  - **결과**
    - 설정 파일에 **프록시 생성 코드를 빈마다 작성할 필요가 사라짐**
    - 빈 후처리기가 해당 패키지의 대상을 자동으로 감지하여 프록시로 교체함
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v4_postprocessor/BeanPostProcessorConfig.java)

<br/><br/>

## 다수 빈에 프록시 일괄 적용

### 기존 프록시 방식의 문제점과 해결

1. **설정의 중복**
   - 빈마다 `ProxyFactory`를 생성하는 코드를 작성해야 하므로 설정이 과도해짐
   - **해결 방안**
     - 빈 후처리기를 활용하여 여러 빈에 프록시를 일괄 적용함
2. **컴포넌트 스캔 대상 적용 불가**
   - `@Component` 등으로 스프링이 직접 생성하는 빈들은 설정 코드로 개입할 수 없어 프록시 적용이 어려움
   - **해결 방안**
     - 빈 후처리기가 스프링의 빈 등록 과정을 가로채어 원본 대신 프록시를 등록함

### Pointcut의 두 가지 용도

- Pointcut은 주로 메서드 호출 시 부가 기능 적용 여부를 판단하는 데 사용하지만, 빈 후처리기와 결합할 때는 **프록시 생성 여부를 판단할 때도 사용됨**

1. **프록시 생성 여부 판단 (빈 후처리기 관점)**
   - 전달받은 객체의 클래스나 메서드 중 하나라도 Pointcut 조건에 매칭되면 프록시 객체를 생성함
2. **어드바이스 적용 여부 판단 (프록시 관점)**
   - 프록시 내부에서 실제 메서드가 호출될 때, 해당 메서드가 Pointcut 조건에 매칭되는 경우에만 어드바이스(부가 기능)를 실행함

<br/><br/>

## 자동 프록시 생성기 (AnnotationAwareAspectJAutoProxyCreator)

- 직접 빈 후처리기를 만들어 적용하는 과정이 번거로울 수 있는데, **스프링 부트는 이를 대신하여 빈 후처리기를 자동으로 등록해 줌**

### 의존성 추가

  ```groovy
  implementation 'org.springframework.boot:spring-boot-starter-aspectj'
  ```
  - 이 라이브러리를 추가하면 스프링 부트가 `AopAutoConfiguration`을 통해 자동 프록시 생성기(`AnnotationAwareAspectJAutoProxyCreator`)를 스프링 빈 후처리기로 자동 등록해 줌

### 자동 프록시 생성기 작동 과정

  ![자동 프록시 생성기 등록 과정 다이어그램](/assets/img/spring-advanced/15-bean-post-processor-06.png)
  
1. **초기 객체 생성**
    - 스프링 컨테이너가 자신이 관리해야 할 등록 대상 객체들을 생성한 뒤 일차적으로 빈 후처리기로 양도함
2. **Advisor 전수 수집**
    - 후처리기가 컨테이너 영역 내부에 존재하는 `Advisor` 타입의 빈들을 전부 캐치해 냄
3. **포인트컷 조건 스캐닝**
    - 수집된 Advisor별 `Pointcut`을 꺼내어, 넘어온 객체의 원본 타입 및 선언된 메서드 단위까지 매칭 로직을 대조함
4. **프록시 동적 조립**
    - 단 하나의 매칭이라도 나오면 프록시를 생성하고, 전혀 충족하지 못하면 원본 객체 그대로를 반환함
5. **최종 스프링 빈 등록**
    - 프록시 포장이 완성된 반환체(또는 반환된 원본)가 스프링 컨테이너에 정식 빈으로 등록됨

### AutoProxyConfig - 자동 프록시 생성기
  ```java
  @Configuration
  @Import({AppV1Config.class, AppV2Config.class})
  public class AutoProxyConfig {
  
      @Bean
      public Advisor advisor1(LogTrace logTrace) {
          NameMatchMethodPointcut pointcut = new NameMatchMethodPointcut();
          pointcut.setMappedNames("request*", "order*", "save*");
  
          LogTraceAdvice advice = new LogTraceAdvice(logTrace);
          return new DefaultPointcutAdvisor(pointcut, advice);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v5_autoproxy/AutoProxyConfig.java)
  - 후처리기 등록을 스프링이 자동으로 처리하므로, 개발자는 **적용할 Advisor만 스프링 빈으로 등록하면 됨**

<br/><br/>

## AspectJExpressionPointcut - 포인트컷

### advisor1의 한계점

- `NameMatchMethodPointcut`은 메서드 이름만으로 매칭하기 때문에, 스프링 내부 빈 중 `request` 이름이 포함된 메서드도 포인트컷 조건에 일치하여 의도치 않게 프록시가 적용될 수 있음
- 이를 해결하려면 메서드 이름뿐만 아니라 **적용할 패키지와 클래스까지 지정할 수 있는 정밀한 포인트컷이 필요함**

### advisor3 - AspectJ 표현식 도입 (가장 많이 사용됨)

  ```java
  @Bean
  public Advisor advisor3(LogTrace logTrace) {
      AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
      // hello.proxy.app 패키지 하위 전부 + 그 중 noLog() 메서드는 제외
      pointcut.setExpression(
          "execution(* hello.proxy.app..*(..)) && !execution(* hello.proxy.app..noLog(..))"
      );
  
      LogTraceAdvice advice = new LogTraceAdvice(logTrace);
      return new DefaultPointcutAdvisor(pointcut, advice);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v5_autoproxy/AutoProxyConfig.java)

### 포인트컷 필터 비교

  ![포인트컷 매커니즘 정밀화 과정](/assets/img/spring-advanced/15-bean-post-processor-07.png)

<br/><br/>

## 하나의 대상 프록시, 여러 Advisor가 겹친다면?

### 동일 객체당 생성되는 동적 프록시는 단 1개

- 여러 Advisor의 포인트컷 조건을 모두 만족하는 대상 객체라 하더라도, 프록시를 여러 개 생성하지 않음
- 자동 프록시 생성기는 타겟당 **단 하나의 프록시만 생성**하며, 이 프록시 내부에 조건에 일치하는 여러 Advisor를 포함함

  ![단일 프록시 구조 다이어그램](/assets/img/spring-advanced/15-bean-post-processor-08.png)

### 여러 어드바이저가 적용되는 원리

  ![단일 프록시 조건부 묶음 다이어그램](/assets/img/spring-advanced/15-bean-post-processor-09.png)


<br/><br/>

## 연습 문제

1. 빈 후처리기는 스프링 빈 생명주기 중 주로 언제 동작하며, 어떤 처리를 할 수 있나요?

    a. 객체 생성 후, 컨테이너 등록 전 - 객체 조작/교체

    - 빈 후처리기는 스프링이 객체를 생성한 후, 이를 빈 컨테이너에 등록하기 직전에 동작함
    - 이때 객체 내용을 변경하거나 전혀 다른 객체로 완전히 바꿔치기 할 수 있음

2. 빈 후처리기가 스프링이 생성한 원본 빈 객체에 대해 할 수 있는 강력한 능력은 무엇일까요?

    a. 원본 객체를 완전히 다른 객체로 교체하는 것

    - 빈 후처리기는 단순히 객체의 내부 속성을 바꾸거나 메서드를 한 번 호출해 주는 것을 넘어, 스프링이 컨테이너에 등록하려는 객체 그 자체를 프록시와 같은 다른 객체로 통째로 바꿔치기 할 수 있음

3. AOP 등에서 프록시 적용 시, 빈 후처리기를 활용하는 방식의 가장 큰 장점은 무엇인가요?

    a. 프록시 생성 로직을 자동화하고 중앙 집중화할 수 있음

    - 빈 수백 개마다 일일이 프록시 적용 설정을 복사 붙여넣기하는 대신, 하나의 빈 후처리기를 통해 프록시 적용 대상을 스스로 판단하고 생성을 낚아채어 설정 코드를 압도적으로 줄일 수 있음

4. 스프링의 자동 프록시 생성기(빈 후처리기)가 특정 빈에 대해 프록시를 만들지 말지 판단하는 주요 기준은 무엇일까요?

    a. 등록된 Advisor들의 Pointcut 조건에 해당 빈이 매칭되는지 확인

    - 자동 프록시 생성기는 컨테이너에 등록해둔 모든 Advisor를 찾고, 각 Advisor 안의 Pointcut 조건을 이용해 현재 빈이 프록시 로직을 붙일 대상이 맞는지를 스캔 단계에서 미리 색인함

5. 하나의 스프링 빈이 여러 개의 등록된 Advisor의 Pointcut 조건에 모두 매칭될 경우, 스프링은 해당 빈에 대해 몇 개의 프록시를 생성할까요?

    a. 1개

    - 여러 Advisor의 Pointcut에 중복으로 매칭되어 걸리더라도 스프링은 프록시 객체를 하나만 생성함
    - 해당 단일 프록시 내부에 매칭된 모든 Advisor 리스트를 줄줄이 포함하도록 최적화되어 동작함

<br/><br/>

## 요약 정리

- 프록시 팩토리만으로는 해결하기 어려웠던 설정 파일 중복 문제와 컴포넌트 스캔 빈 등록 문제를 **빈 후처리기** 하나로 해결함
- 스프링 부트가 기본으로 제공하는 **자동 프록시 생성기** 덕분에 개발자는 프록시 적용 로직조차 신경 쓸 필요가 사라짐

<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
