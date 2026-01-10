---
title: "김영한의 스프링 핵심 원리 기본편 - 객체 지향 원리 적용"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-10 20:00:00 +0900
category:
  - [Framework, Spring]
tags: [spring, java, oop, solid, di, ioc, appconfig]
math: false
mermaid: false
---

# 객체 지향 원리 적용

- 김영한님의 스프링 핵심 원리 강의에서 순수 자바로 구현한 코드의 문제점을 발견하고, AppConfig를 통해 DI를 적용하여 SOLID 원칙을 준수하는 과정을 정리함

<br/><br/>

## 새로운 할인 정책 개발

### 요구사항 변경

- **기존**
  - 고정 금액 할인 (VIP는 무조건 1000원 할인)
- **변경**
  - 정률% 할인 (주문 금액의 10% 할인)

### 구현

- VIP 회원에게 주문 금액의 10%를 할인해주는 `RateDiscountPolicy` 구현
- [구현 코드](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/discount/RateDiscountPolicy.java)
- [테스트 코드](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/discount/RateDiscountPolicyTest.java)

<br/><br/>

## 문제점 발견

### 할인 정책 변경 시도

```java
public class OrderServiceImpl implements OrderService {
    // private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
    private final DiscountPolicy discountPolicy = new RateDiscountPolicy();
}
```

- 할인 정책을 변경하려면 `OrderServiceImpl` 코드를 직접 수정해야 함
- **문제**
  - 인터페이스만 의존하는 것처럼 보이지만 실제로는 구체 클래스에도 의존

### DIP 위반 (의존관계 역전 원칙)

```java
public class OrderServiceImpl implements OrderService {
    // OrderServiceImpl은 두 가지에 모두 의존
    // DiscountPolicy 인터페이스 (추상화)
    // FixDiscountPolicy 구체 클래스 (구체화) - DIP 위반
    private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
}
```

- **DIP 원칙**
  - 추상화에 의존해야지, 구체화에 의존하면 안 됨
- **현재 문제**
  - `OrderServiceImpl`이 인터페이스뿐만 아니라 구체 클래스에도 의존
  - 구체 클래스가 변경되면 `OrderServiceImpl`도 함께 변경되어야 함

![DIP 위반 구조](/assets/img/posts/spring-oop-principles/dip-violation.png)

### OCP 위반 (개방-폐쇄 원칙)

- **확장은 가능**
  - `RateDiscountPolicy`라는 새로운 클래스 추가 가능
- **변경에 닫혀있지 않음**
  - `OrderServiceImpl` 코드를 직접 수정해야 함
- **OCP 위반**
  - 기능을 확장하면 클라이언트 코드가 변경됨

### 해결 시도와 한계

```java
public class OrderServiceImpl implements OrderService {
    private DiscountPolicy discountPolicy; // 구현체 없음
}
```

- 인터페이스에만 의존하도록 코드 변경
- **문제 발생**
  - 구현체가 없어서 `NullPointerException` 발생
- **결론**
  - 누군가가 클라이언트인 `OrderServiceImpl`에 `DiscountPolicy` 구현 객체를 대신 생성하고 주입해야 함

<br/><br/>

## 관심사의 분리

> **관심사의 분리**
>
> - 배우는 연기에만 집중하고, 공연 기획자가 캐스팅 담당
> - 객체는 자신의 역할만 수행하고, 외부에서 의존관계 설정

### AppConfig 등장

```java
public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(new MemoryMemberRepository());
    }

    public OrderService orderService() {
        return new OrderServiceImpl(new MemoryMemberRepository(), new FixDiscountPolicy());
    }
}
```

- **AppConfig의 역할**
  - 구현 객체를 생성
  - 생성자를 통해 의존관계를 주입(DI)
  - 공연 기획자 역할 담당
- **장점**
  - 애플리케이션의 실제 동작에 필요한 구현 객체를 생성
  - 생성한 객체 인스턴스의 참조(레퍼런스)를 생성자를 통해 주입

<br/><br/>

## 생성자 주입

### MemberServiceImpl 변경

```java
public class MemberServiceImpl implements MemberService {
    private final MemberRepository memberRepository;

    // 생성자를 통해 구현체를 주입받음
    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

- 인터페이스에만 의존하고 구현체는 외부에서 주입받음 (DIP 준수)
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/member/MemberServiceImpl.java)

### OrderServiceImpl 변경

```java
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

- 인터페이스에만 의존하고 구현체는 외부에서 주입받음 (DIP 준수)
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/order/OrderServiceImpl.java)

### DI (의존관계 주입)

- 의존관계는 **정적인 클래스 의존 관계**와 **동적인 객체 인스턴스 의존관계**를 분리해서 생각해야 함
- **정적인 클래스 의존관계**
  - `import` 코드만 보고 판단 가능
  - 애플리케이션을 실행하지 않아도 분석 가능
- **동적인 객체 인스턴스 의존관계**
  - 애플리케이션 실행 시점(런타임)에 실제 생성된 객체 인스턴스의 참조가 연결된 의존관계
- **의존관계 주입**
  - 애플리케이션 실행 시점에 외부에서 실제 구현 객체를 생성하고 클라이언트에 전달해서 클라이언트와 서버의 실제 의존관계가 연결되는 것
  - 객체 인스턴스를 생성하고 그 참조값을 전달해서 연결
- **DI 장점**
  - 클라이언트 코드를 변경하지 않고 클라이언트가 호출하는 대상의 타입 인스턴스를 변경할 수 있음
  - 정적인 클래스 의존관계를 변경하지 않고 동적인 객체 인스턴스 의존관계를 쉽게 변경할 수 있음

![AppConfig를 통한 의존관계 주입](/assets/img/posts/spring-oop-principles/di-structure.png)

<br/><br/>

## AppConfig 리팩터링

### 리팩터링 전 문제점

- `new MemoryMemberRepository()` 중복 호출
- 역할과 구현이 한눈에 보이지 않음
- 구성 정보를 보면 역할이 명확히 드러나야 함

### 리팩터링 후

```java
public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }

    public DiscountPolicy discountPolicy() {
        return new FixDiscountPolicy();
    }
}
```

- 중복 제거
- 메서드 이름만 보고 역할이 드러남
- `memberRepository()`, `discountPolicy()`처럼 역할에 따른 구현이 한눈에 보임
- 구현체 변경 시 한 곳만 수정하면 됨

<br/><br/>

## 새로운 할인 정책 적용

### 구성 영역과 사용 영역 분리

- **AppConfig의 등장으로 애플리케이션이 크게 사용 영역과 구성 영역으로 분리**
- **구성 영역 (`AppConfig`)**
  - 구현 객체 생성
  - 의존관계 주입
- **사용 영역 (`ServiceImpl`)**
  - 실행에만 집중

![구성 영역과 사용 영역 분리](/assets/img/posts/spring-oop-principles/area-separation.png)

### 할인 정책 변경

```java
public class AppConfig {

    public DiscountPolicy discountPolicy() {
        // return new FixDiscountPolicy();
        return new RateDiscountPolicy(); // 이 부분만 변경
    }
}
```

- 사용 영역 코드는 변경 없이 구성 영역만 변경 (OCP 준수)

<br/><br/>

## SOLID 적용

### SRP (단일 책임 원칙)

- **한 클래스는 하나의 책임만 가져야 함**
- **변경 전**
  - 클라이언트 객체가 직접 구현 객체를 생성하고, 연결하고, 실행하는 다양한 책임을 가짐
- **변경 후**
  - `AppConfig`
    - 객체를 생성하고 연결하는 책임
  - 클라이언트 객체
    - 실행하는 책임
- **결과**
  - 관심사를 분리함

### DIP (의존관계 역전 원칙)

- **추상화에 의존해야지, 구체화에 의존하면 안 됨**
- **문제**
  - `OrderServiceImpl`이 `DiscountPolicy` 인터페이스뿐만 아니라 `FixDiscountPolicy` 구체 클래스에도 함께 의존
- **해결**
  - `AppConfig`가 `FixDiscountPolicy` 객체 인스턴스를 클라이언트 코드 대신 생성해서 주입
  - 클라이언트 코드는 인터페이스만 의존
  - DIP 원칙을 따르면서 문제 해결

### OCP (개방-폐쇄 원칙)

- **소프트웨어 요소는 확장에는 열려 있으나 변경에는 닫혀 있어야 함**
- **다형성 활용**
  - 인터페이스를 구현한 새로운 클래스를 만들어서 새로운 기능 구현 (확장)
- **AppConfig로 의존관계 주입**
  - 사용 영역과 구성 영역 분리
  - `AppConfig`가 의존관계를 `FixDiscountPolicy` → `RateDiscountPolicy`로 변경해서 클라이언트 코드에 주입
  - **클라이언트 코드는 변경하지 않아도 됨**
- **결과**
  - 소프트웨어 요소를 새롭게 확장해도 사용 영역의 변경은 닫혀 있음

<br/><br/>

## IoC와 DI 컨테이너

### IoC (제어의 역전)

- 프로그램의 제어 흐름을 외부에서 관리
- `AppConfig`가 제어 흐름을 담당하고, 구현 객체는 실행만 담당
- **프레임워크와 라이브러리 차이**
  - 프레임워크
    - 내가 작성한 코드를 제어하고 대신 실행 (JUnit)
  - 라이브러리
    - 내가 작성한 코드가 직접 제어의 흐름을 담당

### DI (의존관계 주입)

- **정적인 클래스 의존관계**
  - 클래스가 사용하는 import 코드만 보고 의존관계를 쉽게 판단 가능
  - 애플리케이션을 실행하지 않아도 분석 가능
- **동적인 객체 인스턴스 의존관계**
  - 애플리케이션 실행 시점에 실제 생성된 객체 인스턴스의 참조가 연결된 의존관계
- **의존관계 주입**
  - 애플리케이션 실행 시점(런타임)에 외부에서 실제 구현 객체를 생성하고 클라이언트에 전달해서 클라이언트와 서버의 실제 의존관계가 연결되는 것
  - 객체 인스턴스를 생성하고 그 참조값을 전달해서 연결
- **DI 장점**
  - 클라이언트 코드를 변경하지 않고 클라이언트가 호출하는 대상의 타입 인스턴스를 변경할 수 있음
  - 정적인 클래스 의존관계를 변경하지 않고 동적인 객체 인스턴스 의존관계를 쉽게 변경할 수 있음

### IoC 컨테이너, DI 컨테이너

- `AppConfig`처럼 객체를 생성하고 관리하면서 의존관계를 연결해주는 것
- 주로 DI 컨테이너라 부름
- 어셈블러, 오브젝트 팩토리 등으로 불리기도 함

<br/><br/>

## 스프링으로 전환

### AppConfig 스프링 기반으로 변경

```java
@Configuration  // 설정 정보임을 명시
public class AppConfig {

    @Bean  // 스프링 빈으로 등록
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

    @Bean
    public DiscountPolicy discountPolicy() {
        return new RateDiscountPolicy();
    }
}
```

- `@Configuration`
  - 애플리케이션의 설정 정보를 담당
- `@Bean`
  - 스프링 컨테이너에 스프링 빈으로 등록

### 스프링 컨테이너 사용

```java
// 스프링 컨테이너 생성
ApplicationContext applicationContext =
    new AnnotationConfigApplicationContext(AppConfig.class);

// 스프링 빈 조회
MemberService memberService =
    applicationContext.getBean("memberService", MemberService.class);
```

- `ApplicationContext`가 `@Bean` 메서드를 호출하여 스프링 빈을 생성하고 관리
- `getBean()`으로 스프링 빈 조회
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/MemberApp.java)

<br/><br/>

## 연습 문제

1. 객체를 직접 생성(new)하여 의존성을 관리하면 때 발생하기 쉬운 설계상의 문제는 무엇인가요?

   a. 요구사항 변경 시 클라이언트 코드 수정이 필요함

   - 요구사항이 바뀌어 다른 정책을 사용하려면 클라이언트 코드의 `new` 부분을 직접 고쳐야 함
   - 변경에 닫혀있지 않은 문제점을 만듦

2. 애플리케이션에서 '설정사항 분리'를 통해 객체 생성 및 연결 책임을 분리(ex: AppConfig)으로 분리하는 이유는 무엇인가요?

   a. 클라이언트 코드가 자신의 실행 역할에만 집중하도록 하기 위해서

   - 설정 영역은 구성 역할을 담당하고, 클라이언트는 실행 역할만 담당
   - SRP를 지키는 데도 도움이 됨

3. 구체 클래스가 아닌 추상화에 의존하는 방법으로 가장 적절한 것은 무엇인가요?

   a. 인터페이스나 추상 클래스에 의존함

   - 인터페이스 같은 추상화에 의존해야 유연하게 구현체를 변경할 수 있음
   - 구체 클래스에 의존하면 변경에 매우 취약함

4. 애플리케이션 실행 시점에 외부에서 실제 구현 객체를 생성하고, 이 객체의 참조값을 클라이언트에게 전달하여 의존 관계를 연결하는 기법을 무엇이라고 하나요?

   a. 의존관계 주입 (Dependency Injection - DI)

   - DI를 통해 클라이언트 코드를 변경하지 않고도 사용하는 객체를 바꿀 수 있음
   - 코드의 유연성과 재사용성을 크게 높여줌

5. 스프링에서 객체 생성 및 의존관계 주입 등을 관리해주면서 애플리케이션의 전체 실행 흐름을 제어하는 역할을 담당하는 요소를 무엇이라 부를까요?

   a. 컨테이너 (Container)

   - 컨테이너는 객체를 담아두고 관리하면서, 필요한 의존 관계를 연결해주고 실행 흐름의 일부를 가져감
   - 스프링은 IoC(Inversion of Control) 컨테이너를 내장하고 있음

<br/><br/>

## 요약 정리

- **문제 인식**
  - 다형성만으로는 OCP, DIP를 지킬 수 없음
  - 구체 클래스를 직접 선택하면 DIP 위반
  - 기능을 확장하면 클라이언트 코드를 변경해야 함 (OCP 위반)
- **해결 방안**

  - 관심사를 분리
  - `AppConfig`를 통해 구성 영역과 사용 영역 분리
  - 생성자 주입 방식으로 DI 적용

- **IoC**
  - 제어의 역전, 프로그램 제어 흐름을 외부에서 관리
- **DI**
  - 의존관계 주입, 외부에서 구현 객체를 생성하고 주입
- **DI 컨테이너**
  - 객체 생성·관리·의존관계 주입 담당
- **순수 자바 코드에서 스프링으로 전환**
  - `@Configuration`과 `@Bean`으로 스프링 빈 등록
  - `ApplicationContext`를 통해 스프링 컨테이너 사용
  - 스프링 컨테이너가 객체 생명주기를 관리

<br/><br/>

## Reference

- [김영한의 스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
