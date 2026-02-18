---
title: '[실전! 스프링 부트와 JPA 활용2] API 개발 고급 - 준비'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-18 17:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, api, sample-data, postconstruct, init]
math: false
mermaid: false
---

# API 개발 고급 - 준비

- 김영한님의 실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 강의를 기반으로 조회 API 성능 최적화 실습을 위한 샘플 데이터 초기화 구조와 설계 포인트를 정리함

<br/><br/>

## 전체 구조 개요

- API 개발 고급 단계에서는 실제 조회 API의 성능 문제(N+1 문제 등)를 다루기 위해, 먼저 테스트에 사용할 샘플 데이터를 애플리케이션 시작 시 자동으로 삽입함

![초기 데이터 삽입 흐름](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-advanced-preparation/init-data-flow.png)

- `@PostConstruct`로 애플리케이션 시작 시 `InitDb.init()` 호출
    - `dbInit1()`로 userA 데이터 생성
    - `dbInit2()`로 userB 데이터 생성

```java
@Component
@RequiredArgsConstructor
public class InitDb {

    private final InitService initService;

    @PostConstruct
    public void init() {
        initService.dbInit1();
        initService.dbInit2();
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/InitDb.java)

<br/><br/>

## 샘플 데이터 구성

### 엔티티 관계 구조

![샘플 데이터 ER 다이어그램](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-advanced-preparation/sample-data-er.png)

### userA 데이터

| 항목 | 값 |
|------|------|
| 이름 | userA |
| 주소 | 서울, 1, 1111 |
| 주문 도서 1 | JPA1 BOOK / 10,000원 / 1권 |
| 주문 도서 2 | JPA2 BOOK / 20,000원 / 2권 |

### userB 데이터

| 항목 | 값 |
|------|------|
| 이름 | userB |
| 주소 | 진주, 2, 2222 |
| 주문 도서 1 | SPRING1 BOOK / 20,000원 / 3권 |
| 주문 도서 2 | SPRING2 BOOK / 40,000원 / 4권 |

<br/><br/>

## 초기 데이터 삽입 구조

![InitDb 클래스 다이어그램](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-advanced-preparation/init-class-diagram.png)

- **InitDb**
    - `@PostConstruct`가 적용된 `init()` 메서드를 통해 초기화 수행
    - 실제 로직은 `InitService`에 위임함
- **InitService**
    - `EntityManager`를 주입받아 엔티티를 직접 영속화함
    - `dbInit1()`, `dbInit2()`로 각각 userA, userB 데이터를 생성함
    - `createMember()`, `createBook()`, `createDelivery()` 헬퍼 메서드를 사용함

    ```java
    public void dbInit1() {
        Member member = createMember("userA", "서울", "1", "1111");
        em.persist(member);

        Book book1 = createBook("JPA1 BOOK", 10000, 100);
        em.persist(book1);
        Book book2 = createBook("JPA2 BOOK", 20000, 100);
        em.persist(book2);

        OrderItem orderItem1 = OrderItem.createOrderItem(book1, 10000, 1);
        OrderItem orderItem2 = OrderItem.createOrderItem(book2, 20000, 2);

        Order order = Order.createOrder(member, createDelivery(member), orderItem1, orderItem2);
        em.persist(order);
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/InitDb.java)

<br/><br/>

## 초기화 흐름 상세

![초기화 시퀀스 다이어그램](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-advanced-preparation/init-sequence.png)

- **dbInit1() 실행**
    - userA 회원 생성 → JPA1 BOOK, JPA2 BOOK 생성 → 주문 생성
- **dbInit2() 실행**
    - userB 회원 생성 → SPRING1 BOOK, SPRING2 BOOK 생성 → 주문 생성

<br/><br/>

## 설계 포인트

### @PostConstruct 활용

- `InitDb` 클래스는 `@PostConstruct`를 사용하여 스프링 빈이 생성된 직후 자동으로 초기 데이터를 삽입함
- 트랜잭션 처리를 위해 실제 로직은 별도의 `InitService` 내부 컴포넌트에 위임하는 구조를 취함
- `@PostConstruct`가 붙은 메서드에서 직접 트랜잭션을 처리하면 문제가 발생할 수 있음

### InitService 분리

- `@Transactional`이 적용된 `InitService`를 별도 컴포넌트로 분리함으로써, 트랜잭션 프록시가 정상적으로 동작하도록 보장함

> - 주문 내역 화면에서는 회원당 주문 내역을 하나만 노출하도록 설계되어 있으므로, 각 회원에 대해 주문 하나씩만 생성함

<br/><br/>

## 요약 정리

- **초기 데이터 삽입**은 `@PostConstruct`를 활용하여 애플리케이션 시작 시 자동으로 수행되며, 트랜잭션 처리를 위해 `InitService`에 위임하는 구조를 사용함
- **샘플 데이터**는 userA와 userB 두 명의 회원에 대해 각각 2권의 도서를 주문하는 형태로, 이후 조회 API 성능 최적화 실습에 활용됨
- `@PostConstruct`에서 직접 트랜잭션을 처리하지 않고, `@Transactional`이 적용된 별도 서비스 컴포넌트로 분리하여 프록시가 정상 동작하도록 보장하는 것이 설계 포인트임

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화](https://www.inflearn.com/course/스프링부트-JPA-API개발-성능최적화)
