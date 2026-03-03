---
title: '[스프링 핵심 원리 - 고급편] 프록시 패턴과 데코레이터 패턴'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-02 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, spring-advanced, proxy-pattern, decorator-pattern, design-pattern]
math: false
mermaid: false
---

# 프록시 패턴과 데코레이터 패턴

- 김영한님의 스프링 원리 - 고급편 강의를 바탕으로 프록시 패턴과 데코레이터 패턴의 개념을 이해하고, 원본 코드를 수정하지 않고 다양한 부가 기능을 동적으로 추가하는 방법을 정리함

<br/><br/>

## 프록시(Proxy)란?

### 클라이언트-서버 구조에서의 프록시

- 클라이언트가 서버를 **직접** 호출하지 않고, **대리자(Proxy)** 를 통해 간접적으로 호출하는 방식임

  ![프록시 데코레이터 패턴 다이어그램 1](/assets/img/spring-advanced/12-proxy-pattern-01.png)

  ![프록시 데코레이터 패턴 다이어그램 2](/assets/img/spring-advanced/12-proxy-pattern-02.png)

### 프록시가 중간에서 할 수 있는 일

  | 기능 | 설명 |
  |------|------|
  | **접근 제어** | 캐싱, 권한 차단, 지연 로딩 |
  | **부가 기능 추가** | 응답 변형, 실행 시간 측정 |
  | **프록시 체인** | 여러 프록시를 연결 |

  ![프록시 데코레이터 패턴 다이어그램 3](/assets/img/spring-advanced/12-proxy-pattern-03.png)

### 대체 가능성

- 클라이언트는 프록시에게 요청하는지, 실제 서버에게 요청하는지 **몰라야 함**  
  - 서버와 프록시가 **동일한 인터페이스**를 구현해야 함

  ![프록시 데코레이터 패턴 다이어그램 4](/assets/img/spring-advanced/12-proxy-pattern-04.png)


<br/><br/>

## 프록시 패턴과 데코레이터 패턴 비교

- 둘 다 프록시를 사용하지만 **의도(Intent)** 가 다름

  | 패턴 | 의도 | 기능 |
  |------|------|-----------|
  | **프록시 패턴** | 다른 객체에 대한 **접근을 제어** | 캐싱, 권한 차단, 지연 로딩 |
  | **데코레이터 패턴** | 객체에 **새로운 기능을 동적으로 추가** | 응답 변형, 실행 시간 측정 |

- > 겉모양이 거의 동일하므로, 패턴을 구분하는 기준은 **의도**임


<br/><br/>

## 프록시 패턴 - 캐시 예제

### 구조 (적용 전)

  ![프록시 데코레이터 패턴 다이어그램 5](/assets/img/spring-advanced/12-proxy-pattern-05.png)

### 구조 (적용 후 - CacheProxy 도입)

  ![프록시 데코레이터 패턴 다이어그램 6](/assets/img/spring-advanced/12-proxy-pattern-06.png)

### 런타임 흐름

  ![프록시 데코레이터 패턴 다이어그램 7](/assets/img/spring-advanced/12-proxy-pattern-07.png)

### 구현 코드

- `Subject` 인터페이스

  ```java
  public interface Subject {
      String operation();
  }
  ```

- `RealSubject`
  - 1초 대기로 무거운 작업을 시뮬레이션함

  ```java
  @Slf4j
  public class RealSubject implements Subject {
      @Override
      public String operation() {
          log.info("실제 객체 호출");
          sleep(1000); // DB 조회 시뮬레이션
          return "data";
      }
  }
  ```

- `CacheProxy`
  - `Subject`를 구현하고, 첫 호출 결과를 캐시함

  ```java
  @Slf4j
  public class CacheProxy implements Subject {
      private Subject target;       // 실제 객체 참조
      private String cacheValue;    // 캐시 저장소

      public CacheProxy(Subject target) {
          this.target = target;
      }

      @Override
      public String operation() {
          log.info("프록시 호출");
          if (cacheValue == null) {
              cacheValue = target.operation(); // 최초 1회만 실제 호출
          }
          return cacheValue; // 이후에는 캐시 반환
      }
- `ProxyPatternClient`
  - `Subject` 인터페이스에만 의존함

  ```java
  public class ProxyPatternClient {
      private Subject subject;

      public ProxyPatternClient(Subject subject) {
          this.subject = subject;
      }

      public void execute() {
          subject.operation();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/blob/master/proxy/src/test/java/hello/proxy/pureproxy/proxy/code/CacheProxy.java)

### 정리

- `RealSubject` 코드와 `Client` 코드를 **전혀 수정하지 않고** 프록시 도입
- 3초 → **1초**로 성능 개선
- 클라이언트 입장에서 프록시 주입 여부를 알 수 없음


<br/><br/>

## 데코레이터 패턴 - 부가 기능 추가 예제

### 단계별 데코레이터 조합

- `Component` 인터페이스 & `RealComponent`

  ```java
  public interface Component {
      String operation();
  }

  @Slf4j
  public class RealComponent implements Component {
      @Override
      public String operation() {
          log.info("RealComponent 실행");
          return "data";
      }
  }
  ```

- `DecoratorPatternClient`

  ```java
  @Slf4j
  public class DecoratorPatternClient {
      private Component component;

      public DecoratorPatternClient(Component component) {
          this.component = component;
      }

      public void execute() {
          String result = component.operation();
          log.info("result={}", result);
      }
  }
  ```

- `MessageDecorator` (응답값 꾸미기)

  ![프록시 데코레이터 패턴 다이어그램 8](/assets/img/spring-advanced/12-proxy-pattern-08.png)

- `MessageDecorator`

  ```java
  @Slf4j
  public class MessageDecorator implements Component {
      private Component component;

      public MessageDecorator(Component component) {
          this.component = component;
      }

      @Override
      public String operation() {
          log.info("MessageDecorator 실행");
          String result     = component.operation();
          String decoResult = "*****" + result + "*****";
          log.info("꾸미기 적용 전={}, 적용 후={}", result, decoResult);
          return decoResult;
      }
  }
  ```

- 실행 결과: `data` → `*****data*****`

- `TimeDecorator` + `MessageDecorator` (체인 구성)

  ![프록시 데코레이터 패턴 다이어그램 9](/assets/img/spring-advanced/12-proxy-pattern-09.png)

- `TimeDecorator`

  ```java
  @Slf4j
  public class TimeDecorator implements Component {
      private Component component;

      public TimeDecorator(Component component) {
          this.component = component;
      }

      @Override
      public String operation() {
          log.info("TimeDecorator 실행");
          long startTime  = System.currentTimeMillis();
          String result   = component.operation();
          long resultTime = System.currentTimeMillis() - startTime;
          log.info("TimeDecorator 종료 resultTime={}ms", resultTime);
          return result;
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/test/java/hello/proxy/pureproxy/decorator/code)

- 실행 순서:
  1. `TimeDecorator` 시작 시간 기록
  2. `MessageDecorator` 호출
  3. `RealComponent` 실행 → `"data"` 반환
  4. `MessageDecorator` 꾸미기 → `"*****data*****"` 반환
  5. `TimeDecorator` 종료 시간 기록 → `resultTime=7ms` 로그 출력

### GOF 데코레이터 패턴 클래스 구조

  ![프록시 데코레이터 패턴 다이어그램 10](/assets/img/spring-advanced/12-proxy-pattern-10.png)

- > `Decorator` 추상 클래스로 `component` 속성을 공통화하면 중복이 제거되고, 클래스 다이어그램에서 실제 컴포넌트와 데코레이터를 명확하게 구분할 수 있음


<br/><br/>

## 프록시 적용 - 예제 프로젝트 3가지 케이스

### 예제 구조 개요

  | 버전 | 구조 | 빈 등록 방식 |
  |------|------|-------------|
  | **v1** | 인터페이스 + 구현 클래스 | 수동 등록 |
  | **v2** | 인터페이스 없는 구체 클래스 | 수동 등록 |
  | **v3** | 구체 클래스 | 컴포넌트 스캔 자동 등록 |

### 요구사항: 원본 코드를 수정하지 않고 로그 추적기 적용

  ```
  [796bccd9] OrderController.request()
  [796bccd9] |-->OrderService.orderItem()
  [796bccd9] | |-->OrderRepository.save()
  [796bccd9] | |<--OrderRepository.save() time=1004ms
  [796bccd9] |<--OrderService.orderItem() time=1014ms
  [796bccd9] OrderController.request() time=1016ms
  ```


<br/><br/>

## 인터페이스 기반 프록시 (v1 적용)

### 클래스 의존 관계

  ![프록시 데코레이터 패턴 다이어그램 11](/assets/img/spring-advanced/12-proxy-pattern-11.png)

### 런타임 객체 의존 관계

  ![프록시 데코레이터 패턴 다이어그램 12](/assets/img/spring-advanced/12-proxy-pattern-12.png)

### 프록시 구현 코드

- `OrderRepositoryInterfaceProxy`

  ```java
  @RequiredArgsConstructor
  public class OrderRepositoryInterfaceProxy implements OrderRepositoryV1 {
      private final OrderRepositoryV1 target;
      private final LogTrace logTrace;

      @Override
      public void save(String itemId) {
          TraceStatus status = null;
          try {
              status = logTrace.begin("OrderRepository.save()");
              target.save(itemId); // 실제 객체 호출
              logTrace.end(status);
          } catch (Exception e) {
              logTrace.exception(status, e);
              throw e;
          }
      }
  }
  ```

- `InterfaceProxyConfig` (스프링 빈 등록)

  ```java
  @Configuration
  public class InterfaceProxyConfig {
      @Bean
      public OrderControllerV1 orderController(LogTrace logTrace) {
          OrderControllerV1Impl impl = new OrderControllerV1Impl(orderService(logTrace));
          return new OrderControllerInterfaceProxy(impl, logTrace);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v1_proxy)

### 스프링 컨테이너 변화

- **프록시 적용 전**

  | 빈 이름 | 빈 객체 |
  |---------|---------|
  | orderController | OrderControllerV1Impl@x01 |
  | orderService | OrderServiceV1Impl@x02 |
  | orderRepository | OrderRepositoryV1Impl@x03 |

- **프록시 적용 후**

  | 빈 이름 | 빈 객체 | → 실제 객체 |
  |---------|---------|------------|
  | orderController | OrderControllerInterfaceProxy@x04 | → @x01 |
  | orderService | OrderServiceInterfaceProxy@x05 | → @x02 |
  | orderRepository | OrderRepositoryInterfaceProxy@x06 | → @x03 |

- > 실제 객체는 스프링 빈으로 등록되지 않지만, 프록시가 참조하므로 힙 메모리에는 존재함


<br/><br/>

## 구체 클래스 기반 프록시 (v2 적용)

- 인터페이스가 없어도 **클래스 상속**을 통해 프록시를 만들 수 있음

### 개념 예제

  ![프록시 데코레이터 패턴 다이어그램 13](/assets/img/spring-advanced/12-proxy-pattern-13.png)

- `TimeProxy`
  - `ConcreteLogic`을 상속받아 프록시 역할 수행

  ```java
  @Slf4j
  public class TimeProxy extends ConcreteLogic {
      private ConcreteLogic realLogic;

      public TimeProxy(ConcreteLogic realLogic) {
          this.realLogic = realLogic;
      }

      @Override
      public String operation() {
          log.info("TimeDecorator 실행");
          long startTime  = System.currentTimeMillis();
          String result   = realLogic.operation();
          long resultTime = System.currentTimeMillis() - startTime;
          log.info("TimeDecorator 종료 resultTime={}", resultTime);
          return result;
      }
  }
  ```

### v2 실제 적용 코드

- `OrderServiceConcreteProxy`
  - 부모 생성자에 필수 파라미터가 있어 `super(null)`이 필요함

  ```java
  public class OrderServiceConcreteProxy extends OrderServiceV2 {
      private final OrderServiceV2 target;
      private final LogTrace logTrace;

      public OrderServiceConcreteProxy(OrderServiceV2 target, LogTrace logTrace) {
          super(null); // 프록시는 부모 기능을 사용하지 않으므로 null 전달
          this.target = target;
          this.logTrace = logTrace;
      }

      @Override
      public void orderItem(String itemId) {
          TraceStatus status = null;
          try {
              status = logTrace.begin("OrderService.orderItem()");
              target.orderItem(itemId);
              logTrace.end(status);
          } catch (Exception e) {
              logTrace.exception(status, e);
              throw e;
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-advanced/tree/master/proxy/src/main/java/hello/proxy/config/v2_proxy)

### 클래스 기반 프록시의 제약사항

- **부모 클래스 생성자 호출 필요**
  - 자식 클래스를 생성할 때는 항상 부모 클래스의 생성자가 함께 호출되므로, 프록시 쪽에서 `super(...)` 호출을 신경 써야 함
- **`final` 클래스는 상속 불가**
  - 원본 클래스에 `final`이 붙어 있으면 프록시를 생성할 수 없음
- **`final` 메서드는 오버라이딩 불가**
  - 프록시가 가로채야 할 메서드가 `final`이면 동작을 변경할 수 없음


<br/><br/>

## 인터페이스 기반 및 클래스 기반 프록시 비교

  | 항목 | 인터페이스 기반 | 클래스 기반 |
  |------|----------------|-------------|
  | **인터페이스 필요 여부** | 필요 | 불필요 |
  | **적용 범위** | 같은 인터페이스 어디든 적용 | 해당 클래스에만 적용 |
  | **상속 제약** | 없음 | final 키워드 제약 있음 |
  | **생성자 처리** | 불필요 | `super(null)` 호출 필요 |
  | **설계 관점** | 역할/구현 분리 명확 | 구현 변경이 없는 클래스에 실용적 |


<br/><br/>

## 한계와 다음 단계

### 프록시 도입 결과
  - 원본 코드(Target) 수정 없이 로그 추적 등 부가 기능을 적용할 수 있음
  - 하지만 적용 대상 클래스마다 **프록시 클래스를 하나씩 모두 만들어야 함**
  - 만약 프록시를 적용할 클래스가 100개라면 프록시 클래스도 100개를 작성해야 하는 문제가 발생함

### 해결책
  - 모든 프록시 클래스의 로직은 **`LogTrace` 기능을 사용하는 것으로 동일**하고, **대상 클래스 참조만 다를 뿐**임
  - 개발자가 직접 프록시 클래스를 만들지 않고 코드로 동적 생성해 주는 **동적 프록시(JDK Dynamic Proxy, CGLIB)** 기술로 이 문제를 보완할 수 있음


<br/><br/>

## 연습 문제

1. 이번 강의 섹션에서 프록시와 데코레이터 패턴을 통해 궁극적으로 해결하고자 했던 주요 문제 상황은 무엇일까요?

    a. 기존 코드를 수정하지 않고 부가 기능 추가

    - 기존 비즈니스 로직 코드에 로깅 같은 부가 기능을 넣으려면 모든 관련 코드를 수정해야 했음
    - 이를 기존 코드 수정 없이 해결하는 것이 주요 목표였음

2. 클라이언트의 요청을 직접 처리하는 '서버' 객체와 '클라이언트' 객체 사이에 놓여 요청을 대신 받거나 전달하는 '프록시(Proxy)'의 일반적인 역할은 무엇일까요?

    a. 요청자와 처리자의 중개자

    - 프록시는 클라이언트와 서버 사이에 위치하여 클라이언트의 요청을 가로채거나 제어하고 필요한 처리를 한 후 서버로 전달하는 중개자 역할을 함

3. 프록시(Proxy)라는 구조를 사용한다는 공통점이 있지만, 프록시 패턴(Proxy Pattern)과 데코레이터 패턴(Decorator Pattern)을 구분하는 가장 중요한 기준은 무엇인가요?

    a. 패턴을 사용하는 주된 의도 또는 목적

    - 두 패턴의 구조는 매우 유사하지만, 프록시를 사용하는 '의도'에 따라 구분됨
    - 접근 제어가 목적이면 프록시 패턴, 기능 추가가 목적이면 데코레이터 패턴임

4. 어떤 프록시가 실제 객체에 대한 접근을 제한하거나 특정 시점(예: 첫 호출 시)에만 객체를 생성하는 등 '접근 제어'를 주 목적으로 사용된다면, 주로 어떤 디자인 패턴으로 분류될까요?

    a. 프록시 패턴

    - 프록시 패턴의 주요 목적은 실제 객체에 대한 접근을 제어하는 것임
    - 캐싱, 지연 로딩 등이 접근 제어의 대표적인 예시임

5. 기존 객체의 구조를 변경하지 않으면서 객체에 새로운 기능이나 책임을 '추가'하여 기능을 확장하는 데 프록시가 사용된다면, 주로 어떤 디자인 패턴으로 볼 수 있나요?

    a. 데코레이터 패턴

    - 데코레이터 패턴은 객체에 동적으로 새로운 기능을 덧붙이는 것을 목적으로 함
    - 로깅, 실행 시간 측정 등이 데코레이터로 구현될 수 있는 기능들임

6. 클라이언트 코드를 수정하지 않고, 클라이언트가 사용하는 객체에 프록시를 투명하게 적용하기 위한 핵심 메커니즘은 무엇일까요?

    a. 클라이언트가 의존하는 객체로 프록시 객체를 주입

    - 클라이언트가 특정 인터페이스에 의존하게 만들고, 런타임에 해당 인터페이스를 구현한 프록시 객체를 주입하면 클라이언트 코드 변경 없이 프록시를 적용할 수 있음

7. 특정 '인터페이스'를 기반으로 프록시 객체를 생성할 때, 프록시 대상이 되는 실제 객체와 프록시 객체가 반드시 공유해야 하는 구조적인 특징은 무엇일까요?

    a. 동일한 인터페이스를 구현

    - 인터페이스 기반 프록시는 프록시 대상과 프록시 모두 동일 인터페이스를 구현해야 함
    - 그래야 클라이언트 입장에서 실제 객체와 프록시를 구분 없이 사용할 수 있음

8. 인터페이스를 구현하지 않은 '구체 클래스'에 대해서도 프록시를 적용하는 것이 가능한가요? 가능하다면 주로 어떤 자바 문법적 특징을 활용할까요?

    a. 가능하며, 다형성(Polymorphism)과 상속을 활용합니다.

    - 자바에서는 자식 타입이 부모 타입 자리에 올 수 있는 다형성 특징이 있음
    - 구체 클래스를 상속받아 프록시 클래스를 만들고, 부모 타입 자리에 프록시를 넣어 적용할 수 있음

9. Spring Framework 환경에서 프록시를 적용할 때, 의존성 주입(DI)를 통해 클라이언트에게 전달되고 Spring Container에 'Bean'으로 등록되는 대상은 주로 무엇일까요?

    a. 프록시 기능을 수행하는 객체

    - 스프링은 클라이언트에게 실제 객체 대신 프록시 객체를 주입하고, 이 프록시 객체를 Spring Bean으로 관리함. 실제 객체는 프록시 내부의 참조로 존재함

10. 로깅 등 동일한 부가 기능을 여러 클래스에 적용하기 위해 해당 클래스 수만큼 개별적인 프록시 클래스를 '수동으로' 하나씩 생성하는 방식의 주요 비효율성은 무엇일까요?

    a. 프록시 클래스가 너무 많이 코드 관리 부담 증가

    - 기능 로직은 거의 같고 대상만 다른 수많은 프록시 클래스를 일일이 작성해야 하므로 코드 중복이 심하고 관리하기 어려워짐
    - 이는 동적 프록시의 필요성으로 이어짐


<br/><br/>

## 요약 정리

- 프록시는 클라이언트와 서버 사이에서 대리자 역할을 수행하며, 대상 객체와 동일한 인터페이스 구현 원칙을 사용하여 투명하게 교체될 수 있음
- 프록시 패턴은 객체에 대한 `접근 제어`(캐싱, 권한 차단 등)가 주 목적이고, 데코레이터 패턴은 기존 기능에 `부가 기능 추가`(응답 변형, 실행 시간 측정 등)가 주 목적임
- 인터페이스 기반 프록시(V1)는 역할과 구현을 분리할 수 있어 좋은 설계이나 인터페이스가 반드시 필요하며, 구체 클래스 기반 프록시(V2)는 상속을 이용해 적용할 수 있지만 final 제약과 생성자 호출의 단점이 있음
- 프록시를 적용하면 원본 코드를 수정하지 않고 로그 추적기 등 기능을 확장할 수 있으나, 적용해야 할 클래스 수만큼 프록시 클래스를 만들어야 하므로 동적 프록시 기술로 이를 보완할 필요가 있음


<br/><br/>

## Reference

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
