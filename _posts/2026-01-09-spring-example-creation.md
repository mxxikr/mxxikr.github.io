---
title: '[스프링 핵심 원리 기본편] 예제 만들기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-09 23:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, oop, domain, member, order, discount]
math: false
mermaid: false
---
# 예제 만들기

- 김영한님의 스프링 핵심 원리 강의 중 순수 자바로 비즈니스 로직을 구현하고 객체지향 설계 원칙을 적용하며 설계의 문제점을 파악하는 과정을 정리함

<br/><br/>

## 프로젝트 정보

- Java 21
- Spring Boot 3.5.3
  - Dependencies 선택하지 않음
- Gradle
- IntelliJ

<br/><br/>

## 비즈니스 요구사항

- 프로젝트 초기에 모든 요구사항이 확정되지 않는 경우가 많음
- 이번 예제는 그러한 상황을 가정함

### 회원 요구사항

- **기능**
  - 회원 가입 및 조회
- **등급**
  - 일반 (BASIC)
  - VIP
- **저장소**
  - 미확정 (자체 DB 또는 외부 시스템 연동)
  - **문제 상황**
    - 데이터 저장 기술이 아직 결정되지 않음
  - 개발은 진행해야 하지만 저장소 구현체는 나중에 결정될 예정

### 주문과 할인 요구사항

- **기능**
  - 회원은 상품 주문 가능
  - VIP는 1000원 고정 할인
- **할인 정책**
  - 미확정 (변경 가능성 높음)
  - 서비스 오픈 직전까지 할인 정책이 결정되지 않을 수 있음
  - 최악의 경우 할인 없을 수도 있음
  - 마케팅 팀에서 정액 할인과 정률 할인 중 고민 중이라고 가정

### 미확정 요구사항 대응 전략

- **전략**
  - 인터페이스를 만들고 구현체를 언제든지 갈아끼울 수 있도록 설계
  - 역할(인터페이스)과 구현을 분리
  - **객체 지향의 다형성**을 활용하여 유연한 설계
- **기대 효과**
  - 저장소나 할인 정책이 변경되어도 비즈니스 로직은 수정하지 않아도 됨
  - 새로운 요구사항에 빠르게 대응 가능
- **주의점**
  - 정말로 변경에 닫혀있는 설계인지는 실제로 코드를 작성해봐야 알 수 있음

<br/><br/>

## 회원 도메인 개발

### 회원 도메인 설계

- 역할과 구현을 분리하여 설계
- 저장소 구현 기술이 변경되어도 서비스 로직은 변경되지 않도록 인터페이스 활용

![회원 도메인 클래스 다이어그램](/assets/img/spring/2026-01-10-spring-example-creation/member-domain.png)

### 회원 등급 및 엔티티

- 회원 등급
  - `BASIC` (일반 회원)
  - `VIP` (VIP 회원)
- 회원 엔티티
  - 회원 ID, 이름, 등급을 가진 간단한 도메인 객체
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/tree/master/core/src/main/java/hello/core/member)

### 회원 저장소 인터페이스

```java
package hello.core.member;

public interface MemberRepository {
    void save(Member member);
    Member findById(Long memberId);
}
```

- **설계 포인트**
  - 인터페이스로 역할을 먼저 정의
  - 구현 기술(메모리, DB, 외부 API)은 나중에 결정

### 메모리 회원 저장소 구현체

- `HashMap`을 사용한 간단한 인메모리 저장소 구현
- **주의사항**

  - 동시성 문제를 고려하여 `ConcurrentHashMap` 사용 권장
  - 현재는 학습 목적으로 단순하게 `HashMap` 사용

    > **ConcurrentHashMap과 HashMap의 차이**
    >
    > - **HashMap**
    >   - 동시성 제어 없음
    >   - 멀티스레드 환경에서 데이터 손실이나 무한 루프 발생 가능
    > - **ConcurrentHashMap**
    >   - 버킷 단위 잠금으로 동시성 제어
    >   - 읽기 작업은 잠금 없이 수행
    >   - 멀티스레드 환경에서 HashMap과 유사한 성능 유지
    >   - `null` 키와 값을 허용하지 않음

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/member/MemoryMemberRepository.java)

### 회원 서비스 인터페이스

```java
package hello.core.member;

public interface MemberService {
    void join(Member member);
    Member findMember(Long memberId);
}
```

### 회원 서비스 구현체

```java
package hello.core.member;

public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository = new MemoryMemberRepository();

    @Override
    public void join(Member member) {
        memberRepository.save(member);
    }

    @Override
    public Member findMember(Long memberId) {
        return memberRepository.findById(memberId);
    }
}
```

- **현재 문제점**
  - `MemberServiceImpl`이 `MemberRepository` 인터페이스뿐만 아니라 `MemoryMemberRepository` 구체 클래스에도 직접 의존
  - 저장소를 변경하려면 `MemberServiceImpl` 코드를 직접 수정해야 함
  - **DIP 위반**
    - 추상화(인터페이스)에만 의존해야 하는데 구체화(구현 클래스)에도 의존
- **해결 방법**
  - 외부에서 구현체를 주입받아야 함

<br/><br/>

## 회원 도메인 테스트

- JUnit을 사용한 회원 가입 및 조회 기능 테스트
- [전체 테스트 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/member/MemberServiceTest.java)

<br/><br/>

## 주문과 할인 도메인 개발

### 주문과 할인 도메인 설계

- 할인 정책을 인터페이스로 분리하여 변경에 유연하게 대응
- 주문 서비스는 할인 정책의 구체적인 로직을 알 필요 없이 할인 금액만 받아서 사용

![주문 도메인 클래스 다이어그램](/assets/img/spring/2026-01-10-spring-example-creation/order-domain.png)

### 할인 정책 인터페이스

```java
package hello.core.discount;

import hello.core.member.Member;

public interface DiscountPolicy {
    /**
     * @return 할인 대상 금액
     */
    int discount(Member member, int price);
}
```

- **설계 포인트**
  - 할인 정책을 인터페이스로 추상화
  - 향후 정률 할인, 계절별 할인 등 다양한 정책 추가 가능

### 정액 할인 정책 구현체

- VIP 회원에게 1000원 고정 할인을 제공하는 간단한 정책
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/discount/FixDiscountPolicy.java)

### 주문 엔티티

- 회원 ID, 상품명, 가격, 할인 금액을 포함한 주문 정보
- `calculatePrice()` 메서드로 최종 금액 계산
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/order/Order.java)

### 주문 서비스 구현체

```java
package hello.core.order;

import hello.core.discount.DiscountPolicy;
import hello.core.discount.FixDiscountPolicy;
import hello.core.member.Member;
import hello.core.member.MemberRepository;
import hello.core.member.MemoryMemberRepository;

public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository = new MemoryMemberRepository();
    private final DiscountPolicy discountPolicy = new FixDiscountPolicy();

    @Override
    public Order createOrder(Long memberId, String itemName, int itemPrice) {
        Member member = memberRepository.findById(memberId);
        int discountPrice = discountPolicy.discount(member, itemPrice);
        return new Order(memberId, itemName, itemPrice, discountPrice);
    }
}
```

- **장점**
  - **SRP (Single Responsibility Principle)**
    - 주문 서비스는 주문 생성만 담당
    - 할인 계산은 할인 정책이 담당
  - 할인 로직이 변경되어도 주문 서비스 코드는 수정하지 않아도 됨
- **문제점**
  - `OrderServiceImpl`이 `MemberRepository`, `DiscountPolicy` 인터페이스뿐만 아니라 각각의 구체 클래스에도 직접 의존
  - 할인 정책을 변경하려면 (ex: `FixDiscountPolicy` → `RateDiscountPolicy`) 이 코드를 직접 수정해야 함
  - **DIP 위반**
    - 추상화와 구체화 모두에 의존
  - **OCP 위반**
    - 확장(새로운 할인 정책 추가)은 가능하지만, 기존 코드를 수정(변경)해야 함

<br/><br/>

## 주문과 할인 도메인 테스트

- VIP 회원의 주문 시 할인이 정상 적용되는지 테스트
- [전체 테스트 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/order/OrderServiceTest.java)

<br/><br/>

## 인터페이스 설계의 문제점

- 인터페이스를 만들어서 역할과 구현을 분리했지만, 실제로는 **OCP와 DIP를 모두 위반**하고 있음

### 할인 정책이 "정액 → 정률"로 변경된다면?

1. 새로운 정률 할인 정책 구현

   ```java
   package hello.core.discount;

   import hello.core.member.Grade;
   import hello.core.member.Member;

     // 새로운 할인 정책 클래스 작성 (확장은 가능)
     public class RateDiscountPolicy implements DiscountPolicy {

         private int discountPercent = 10;  // 10% 할인

         @Override
         public int discount(Member member, int price) {
             if (member.getGrade() == Grade.VIP) {
                 return price * discountPercent / 100;
             } else {
                 return 0;
             }
         }
     }
   ```

2. OrderServiceImpl 코드 수정 필요

   ```java
   public class OrderServiceImpl implements OrderService {

       private final MemberRepository memberRepository = new MemoryMemberRepository();

       // 변경 전
       // private final DiscountPolicy discountPolicy = new FixDiscountPolicy();

       // 변경 후 OrderServiceImpl 클래스를 열어서 코드 수정 필요
       private final DiscountPolicy discountPolicy = new RateDiscountPolicy();  // 이 부분을 직접 수정해야 함
   }
   ```

   - **문제점 분석**
     - **확장은 가능**
       - `RateDiscountPolicy`라는 새로운 클래스를 추가할 수 있음
     - **변경에 닫혀있지 않음**
       - `OrderServiceImpl` 코드를 직접 수정해야 함
     - **OCP (Open-Closed Principle) 위반**

### DIP (Dependency Inversion Principle) 위반

```java
public class OrderServiceImpl implements OrderService {

    // OrderServiceImpl은 두 가지에 모두 의존하고 있음
    // 1. DiscountPolicy 인터페이스 (추상화)
    // 2. FixDiscountPolicy 구체 클래스 (구체화)
    private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
}
```

- **DIP 원칙**
  - 추상화에 의존해야지, 구체화에 의존하면 안 됨
- **현재 상황**
  - `OrderServiceImpl`이 인터페이스(`DiscountPolicy`)뿐만 아니라 구체 클래스(`FixDiscountPolicy`)에도 의존
- **문제점**
  - 구체 클래스가 변경되면 `OrderServiceImpl`도 함께 변경되어야 함

### 의존관계 다이어그램으로 보는 문제점

![의존관계 문제점 다이어그램](/assets/img/spring/2026-01-10-spring-example-creation/dependency-problem.png)

- `OrderServiceImpl`이 **추상화와 구체화 모두에 의존**하는 것이 문제
- DIP를 지키려면 `OrderServiceImpl`은 `DiscountPolicy` 인터페이스에만 의존해야 함

### 결론

- "결제 방식"이 미확정인 경우가 많음
  - 처음에는 카드 결제만 지원
  - 나중에 계좌이체, 페이팔, 네이버페이 등이 추가됨
- 이럴 때 `PaymentPolicy` 인터페이스를 만들어두면 새로운 결제 수단을 쉽게 추가할 수 있음
- **하지만** 서비스 코드에서 `new CardPayment()`처럼 직접 생성하면 이 예제와 똑같은 문제에 직면함
- 인터페이스를 만드는 것만으로는 부족하고, 의존관계 주입(DI)이 필요함

<br/><br/>

## 연습 문제

1. 객체 지향 설계에서 역할(인터페이스)을 구현한(클래스)로부터 분리하여 설계하는 이유는 무엇인가요?

   a. 향후 요구사항 변경에 유연하게 대처하기 위해서

   - 인터페이스를 통해 역할과 구현을 나누면, 실제 구현체가 바뀌더라도 사용하는 쪽 코드(역할 변경 없이 유연하게 대처할 수 있음
   - 이는 객체 지향 설계의 중요한 원칙임

2. 회원 리포지터리를 설계할 때, 인터페이스 기반으로 설계한 이유는 무엇인가요?

   a. 당장한 데이터 저장 기술을 쉽게 교체하고 확장할 수 있도록 하기 위해서

   - 데이터 저장 방식은 프로젝트 진행 중 바뀔 수 있음
   - 인터페이스 기반으로 설계하면 외부 시스템으로의 DB로, 또는 외부 시스템으로 쉽게 교체하며 적용할 수 있음

3. JUnit과 같은 테스트 프레임워크를 사용하여 코드를 테스트할 때의 장점은 무엇인가요?

   a. 테스트 결과를 자동으로 검증하고 오류를 빠르게 발견할 수 있다

   - JUnit은 테스트 케이스를 자동화하여 실행하고 결과를 검증해 줌
   - 사람이 일일이 확인하지 않아도 되므로 오류를 빠르게 찾을 수 있음

4. 서비스 구현체(ex: `OrderServiceImpl`)가 인터페이스가 아닌 구체적인 리포지터리 구현체(ex: `MemoryMemberRepository`)에 직접 의존한다면 어떤 객체 지향 원칙이 위배되나요?

   a. 의존관계 역전 원칙 (DIP)

   - DIP는 "추상화에 의존하고 구체화에 의존하지 말라"는 원칙임
   - 구현체에 직접 의존하면 추상화가 아닌 구체화에 의존하게 되어 이 원칙을 위배하고 변경에 취약해짐

5. 주문 서비스(`OrderService`)가 할인 정책의 구체적인 계산 로직을 모르고, 할인 정책 인터페이스를 통해서만 결과를 받아오는 설계는 어떤 객체 지향 원칙의 사례일까요?

   a. 단일 책임 원칙 (SRP)

   - 주문 서비스는 주문 생성이라는 자신의 책임만 다루고, 할인 계산은 할인 정책에게 위임하고 있음
   - 여러 책임을 한 곳에 모으지 않아 단일 책임 원칙을 잘 따르고 있음

<br/><br/>

## 요약 정리

- **인터페이스 기반 설계**
  - 역할(인터페이스)과 구현(클래스)을 분리
  - 미확정 요구사항에 대비한 유연한 구조
- **단일 책임 원칙 (SRP)**
  - 회원 서비스는 회원 관리만 담당
  - 할인 정책은 할인 계산만 담당
  - 주문 서비스는 주문 생성만 담당
- **다형성 활용**

  - 인터페이스를 통해 구현체를 교체할 수 있는 구조

- **인터페이스를 만드는 것만으로는 부족함**
  - 역할과 구현을 분리했지만, 구체 클래스에 직접 의존하는 순간 유연성을 잃음
- **진짜 문제는 의존관계** 임
  - `new MemoryMemberRepository()`, `new FixDiscountPolicy()`처럼 직접 생성하는 것이 문제
  - 구현체를 외부에서 주입받아야 함

<br/><br/>

## Reference

- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
