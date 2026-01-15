---
title: '[김영한의 스프링 핵심 원리 기본편] 싱글톤 컨테이너'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-11 08:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, singleton, container, configuration, cglib]
math: false
mermaid: false
---
# 싱글톤 컨테이너

- 김영한님의 스프링 핵심 원리 강의에서 싱글톤 패턴의 문제점과 스프링 컨테이너가 이를 해결하는 방법, @Configuration의 역할을 정리함

<br/><br/>

## 웹 애플리케이션과 싱글톤

### 웹 애플리케이션의 특징

- 스프링은 기업용 온라인 서비스 기술 지원을 위해 탄생
- 대부분의 스프링 애플리케이션은 웹 애플리케이션
- 웹 애플리케이션은 여러 고객이 동시에 요청

### 순수 DI 컨테이너의 문제점

```java
AppConfig appConfig = new AppConfig();

// 조회: 호출할 때마다 객체를 생성
MemberService memberService1 = appConfig.memberService();
MemberService memberService2 = appConfig.memberService();

// memberService1 != memberService2
assertThat(memberService1).isNotSameAs(memberService2);
```

- 요청할 때마다 새로운 객체 생성
  - 고객 트래픽이 초당 1000이면 초당 1000개 객체 생성 및 소멸
- 메모리 낭비 발생
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/singleton/SingletonTest.java)

- **해결책**

  - 객체가 딱 1개만 생성되고 공유되도록 설계
  - 싱글톤 패턴

  ![순수 DI 컨테이너 vs 싱글톤 컨테이너](/assets/img/spring/spring-singleton-container/pure-container-vs-singleton.png)

<br/><br/>

## 싱글톤 패턴

### 싱글톤 패턴이란

- 클래스의 인스턴스가 딱 1개만 생성되는 것을 보장하는 디자인 패턴

### 싱글톤 패턴 구현

```java
public class SingletonService {

    // static 영역에 객체를 딱 1개만 생성
    private static final SingletonService instance = new SingletonService();

    // public으로 열어서 객체 인스턴스가 필요하면 이 static 메서드를 통해서만 조회하도록 허용
    public static SingletonService getInstance() {
        return instance;
    }

    // 생성자를 private으로 선언해서 외부에서 new 키워드를 사용한 객체 생성을 막음
    private SingletonService() {
    }
}
```

- **구현 포인트**

  - static 영역에 객체를 미리 하나 생성
  - `getInstance()` 메서드를 통해서만 조회 가능 (항상 같은 인스턴스 반환)
  - private 생성자로 외부에서 `new` 사용 차단

![싱글톤 패턴 구조](/assets/img/spring/spring-singleton-container/singleton-pattern-structure.png)

### 싱글톤 패턴 사용

```java
// 조회: 호출할 때마다 같은 객체를 반환
SingletonService singletonService1 = SingletonService.getInstance();
SingletonService singletonService2 = SingletonService.getInstance();

// singletonService1 == singletonService2
assertThat(singletonService1).isSameAs(singletonService2);
```

- 호출할 때마다 같은 객체 인스턴스 반환
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/singleton/SingletonService.java)

### 싱글톤 패턴의 문제점

- 구현 코드가 많음
  - 싱글톤 패턴 구현 코드 자체가 복잡
- DIP 위반
  - 클라이언트가 구체 클래스에 의존 (`getInstance()`)
- OCP 위반 가능성
  - 구체 클래스 의존으로 OCP 위반 가능성 높음
- 테스트 어려움
  - 내부 속성 변경/초기화 어려움
- private 생성자
  - 자식 클래스 만들기 어려움
- 유연성 저하
  - 결론적으로 유연성이 떨어짐

<br/><br/>

## 싱글톤 컨테이너

### 스프링 컨테이너의 해결책

- 스프링 컨테이너는 싱글톤 패턴의 문제점을 해결하면서 객체 인스턴스를 싱글톤으로 관리
- 스프링 빈이 싱글톤으로 관리되는 빈

### 싱글톤 컨테이너의 특징

- 싱글톤 패턴을 적용하지 않아도 객체 인스턴스를 싱글톤으로 관리
- 스프링 컨테이너는 싱글톤 컨테이너 역할
- 싱글톤 객체를 생성하고 관리하는 기능을 싱글톤 레지스트리라 함

- **장점**

  - 싱글톤 패턴의 지저분한 코드 불필요
  - DIP, OCP, 테스트, private 생성자로부터 자유로움
  - 싱글톤 패턴의 모든 단점을 해결하면서 싱글톤 유지

### 스프링 컨테이너 사용

```java
ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);

// 조회: 호출할 때마다 같은 객체를 반환
MemberService memberService1 = ac.getBean("memberService", MemberService.class);
MemberService memberService2 = ac.getBean("memberService", MemberService.class);

// memberService1 == memberService2
assertThat(memberService1).isSameAs(memberService2);
```

- 요청마다 객체 생성하지 않음
- 이미 만들어진 객체를 공유해서 효율적으로 재사용
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/singleton/SingletonTest.java)

<br/><br/>

## 싱글톤 방식의 주의점

### 무상태(Stateless) 설계 규칙

- 특정 클라이언트에 의존적인 필드가 있으면 안 됨
- 특정 클라이언트가 값을 변경할 수 있는 필드가 있으면 안 됨
- 가급적 읽기만 가능해야 함
- 필드 대신 지역변수, 파라미터, ThreadLocal 사용

### 상태 유지 문제 예시

```java
public class StatefulService {
    private int price;  // 상태를 유지하는 필드

    public void order(String name, int price) {
        this.price = price;  // 여기가 문제
    }

    public int getPrice() {
        return price;
    }
}
```

```java
// ThreadA: A사용자 10000원 주문
statefulService1.order("userA", 10000);

// ThreadB: B사용자 20000원 주문
statefulService2.order("userB", 20000);

// ThreadA: 사용자A 주문 금액 조회
int price = statefulService1.getPrice();  // 20000원 출력
```

- `statefulService1`과 `statefulService2`는 같은 인스턴스
- `price` 필드는 공유되는 필드
- 특정 클라이언트가 값을 변경하면 다른 클라이언트에 영향
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/singleton/StatefulServiceTest.java)

![상태 유지 문제 시나리오](/assets/img/spring/spring-singleton-container/stateful-service-problem.png)

### 올바른 무상태 설계

```java
public class StatelessService {

    public int order(String name, int price) {
        return price;  // 필드 대신 반환값으로
    }
}
```

- 스프링 빈은 항상 무상태(stateless)로 설계

<br/><br/>

## @Configuration과 싱글톤

### 의문점

```java
@Configuration
public class AppConfig {

    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```

- **예상 호출**

  - memberService() 에서 memberRepository() 호출 → new MemoryMemberRepository() 생성
  - orderService() 에서 memberRepository() 호출 → new MemoryMemberRepository() 생성
  - @Bean memberRepository() 직접 호출 → new MemoryMemberRepository() 생성

- 총 3번 호출 → 3개의 다른 인스턴스 생성?

### 싱글톤 검증

```java
MemberServiceImpl memberService = ac.getBean("memberService", MemberServiceImpl.class);
OrderServiceImpl orderService = ac.getBean("orderService", OrderServiceImpl.class);
MemberRepository memberRepository = ac.getBean("memberRepository", MemberRepository.class);

// 모두 같은 인스턴스를 참조
assertThat(memberService.getMemberRepository()).isSameAs(memberRepository);
assertThat(orderService.getMemberRepository()).isSameAs(memberRepository);
```

- 모두 같은 인스턴스 사용
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/singleton/ConfigurationSingletonTest.java)

### 호출 로그 확인

```
call AppConfig.memberService
call AppConfig.memberRepository
call AppConfig.orderService
```

- `memberRepository()` 단 1번만 호출

<br/><br/>

## @Configuration과 바이트코드 조작

### CGLIB 확인

```java
AppConfig bean = ac.getBean(AppConfig.class);
System.out.println("bean = " + bean.getClass());
```

```
bean = class hello.core.AppConfig$$EnhancerBySpringCGLIB$$bd479d70
```

### CGLIB란

- 바이트코드 조작 라이브러리
- 스프링이 `AppConfig`를 상속받은 임의의 클래스를 생성
- 그 다른 클래스를 스프링 빈으로 등록
- 그 클래스가 싱글톤을 보장

### CGLIB 예상 동작 방식

```java
@Bean
public MemberRepository memberRepository() {

    if (memoryMemberRepository가 이미 스프링 컨테이너에 등록되어 있으면?) {
        return 스프링 컨테이너에서 찾아서 반환;
    } else {
        기존 로직을 호출해서 MemoryMemberRepository를 생성하고 스프링 컨테이너에 등록
        return 반환;
    }
}
```

- `@Bean`이 붙은 메서드마다 이미 빈이 존재하면 기존 빈 반환
- 싱글톤 보장

![CGLIB 동작 방식](/assets/img/spring/spring-singleton-container/cglib-mechanism.png)

### @Configuration 없이 @Bean만 사용하면

```java
// @Configuration 삭제
public class AppConfig {

    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }
}
```

- CGLIB 기술 없이 순수한 `AppConfig`로 등록
- `memberRepository()` 3번 호출됨
- 각각 다른 인스턴스 (싱글톤 깨짐)

<br/><br/>

## 연습 문제

1. 웹 애플리케이션 환경에서 요청마다 새로운 객체를 계속 생성할 때 주로 발생하는 문제는 무엇일까요?

   a. 메모리 사용량 증가 및 성능 저하

   - 요청마다 객체를 생성하면 JVM 메모리에 계속 쌓여 메모리 오버헤드가 발생하고, 객체 생성 및 가비지 컬렉션 비용으로 인해 성능이 저하될 수 있음

2. 싱글톤 디자인 패턴의 가장 근본적인 목적은 무엇일까요?

   a. 클래스의 인스턴스를 하나만 생성하고 공유

   - 싱글톤 패턴은 특정 클래스의 객체 인스턴스가 JVM 내에서 단 하나만 존재하도록 설계하여 불필요한 객체 생성을 막고 자원을 효율적으로 사용하기 위한 목적임

3. 순수 싱글톤 패턴 구현 방식과 비교할 때, 스프링 컨테이너를 통해 빈을 싱글톤으로 관리하는 방식의 장점은 무엇일까요?

   a. 구현이 간편하고 유연하며 원칙 준수에 유리함

   - 스프링은 순수 싱글톤 패턴의 문제점인 복잡한 구현, 구체 클래스 의존성, 테스트 어려움 등을 해결하며 객체를 싱글톤으로 관리하여 유연성과 개발 편의성을 높여줌

4. 스프링 빈과 같이 싱글톤으로 관리되는 객체를 설계할 때, 멀티스레드 환경에서 발생할 수 있는 심각한 문제를 방지하기 위해 지켜야 할 중요한 원칙은 무엇일까요?

   a. 기급적 무상태(Stateless)로 설계한다

   - 여러 스레드가 하나의 싱글톤 객체를 공유할 때, 객체가 상태를 가지면 공유되는 상태 값이 예상치 못하게 변경되어 오류가 발생할 수 있음
   - 따라서 무상태 설계가 중요함

5. @Configuration 어노테이션이 붙은 설정 클래스에서 @Bean 메서드가 정의될 때, 스프링이 해당 빈을 싱글톤으로 보장하기 위해 사용하는 핵심 메커니즘은 무엇일까요?

   a. CGLIB 등을 사용한 프록시 객체 생성

   - `@Configuration`은 CGLIB 라이브러리를 이용해 설정 클래스를 상속받는 프록시 객체를 만들고, 이 프록시를 통해 @Bean 메서드 호출을 가로채서 싱글톤을 보장함

<br/><br/>

## 요약 정리

- **웹 애플리케이션과 싱글톤**
  - 웹 애플리케이션은 여러 고객이 동시에 요청
  - 순수 DI 컨테이너는 요청마다 객체 생성으로 메모리 낭비
- **싱글톤 패턴**
  - 클래스의 인스턴스가 딱 1개만 생성되는 것을 보장
  - `static`, `private` 생성자, `getInstance()` 사용
  - 구현 복잡, DIP/OCP 위반, 테스트 어려움 등 단점 존재
- **싱글톤 컨테이너**
  - 스프링 컨테이너는 싱글톤 패턴의 단점을 해결하면서 싱글톤 관리
  - 싱글톤 레지스트리 기능 제공
- **싱글톤 사용 시 주의사항**
  - 무상태(stateless)로 설계
  - 공유 필드 사용 금지
  - 지역변수, 파라미터, ThreadLocal 사용
- **`@Configuration`의 역할**
  - CGLIB로 바이트코드 조작하여 싱글톤 보장
  - `@Configuration` 없이 `@Bean`만 사용하면 싱글톤 깨짐
  - 스프링 설정 정보는 항상 `@Configuration` 사용

<br/><br/>

## Reference

- [김영한의 스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
