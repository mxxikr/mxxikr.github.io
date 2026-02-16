---
title: '[실전! 스프링 부트와 JPA 활용1] 도메인 분석 및 설계'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-15 15:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, domain-design, entity-mapping, erd, inheritance-mapping]
math: false
mermaid: true
---

# 도메인 분석 및 설계

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 기반으로 요구사항 분석부터 도메인 모델 설계, 테이블 설계, 그리고 엔티티 클래스 개발까지의 과정을 정리함

<br/><br/>

## 요구사항 분석

### 기능 목록

- **회원 기능**
    - 회원 등록
        - 새로운 회원 가입
    - 회원 조회
        - 등록된 회원 목록 조회
- **상품 기능**
    - 상품 등록
        - 새로운 상품 등록
    - 상품 수정
        - 기존 상품 정보 수정
    - 상품 조회
        - 등록된 상품 목록 조회
- **주문 기능**
    - 상품 주문
        - 상품 선택 및 주문
    - 주문 내역 조회
        - 주문한 내역 확인
    - 주문 취소
        - 주문 취소 처리

### 기타 요구사항

| 요구사항 | 설명 |
|---------|------|
| **재고 관리** | 상품은 재고 관리가 필요 |
| **상품 종류** | 도서, 음반, 영화 3가지 타입 |
| **카테고리** | 상품을 카테고리로 구분 가능 |
| **배송 정보** | 주문 시 배송 정보 입력 가능 |

<br/><br/>

## 도메인 모델 설계

### 도메인 모델 다이어그램

![도메인 모델 다이어그램](/assets/img/jpa/2026-02-15-spring-boot-jpa-domain-analysis/domain-model.png)

### 상품 상속 구조

![상품 상속 구조](/assets/img/jpa/2026-02-15-spring-boot-jpa-domain-analysis/item-inheritance.png)

### 엔티티 관계 설명

- **회원(Member)과 주문(Order)**
    - 일대다 (1:N)
    - 회원은 여러 상품을 주문할 수 있음

- **주문(Order)과 주문상품(OrderItem)**
    - 일대다 (1:N)
    - 한 번 주문 시 여러 상품 선택 가능함
    - **연관관계 주인**
        - OrderItem (외래 키 보유)

- **주문상품(OrderItem)과 상품(Item)**
    - 다대일 (N:1)
    - 주문상품은 하나의 상품을 참조함
    - 단방향

- **주문(Order)과 배송(Delivery)**
    - 일대일 (1:1)
    - 주문 시 하나의 배송 정보 생성됨
    - 양방향

- **카테고리(Category)와 상품(Item)**
    - 다대다 (N:M)

### 연관관계 매핑 전략

![연관관계 매핑 전략](/assets/img/jpa/2026-02-15-spring-boot-jpa-domain-analysis/mapping-strategy.png)

- **연관관계 주인 선택 원칙**
    - **외래 키가 있는 곳을 연관관계의 주인이라 정하기**

    | 예시 | 연관관계 주인 | 이유 |
    |-----|-------------|------|
    | 자동차 ↔ 바퀴 | 바퀴 | 외래 키가 바퀴 테이블에 존재 |
    | 주문 ↔ 회원 | 주문 | 외래 키(member_id)가 주문 테이블에 존재 |
    | 주문 ↔ 배송 | 주문 | 외래 키(delivery_id)가 주문 테이블에 존재 |

<br/><br/>

## 테이블 설계

### 테이블 ERD

![테이블 ERD](/assets/img/jpa/2026-02-15-spring-boot-jpa-domain-analysis/table-erd.png)

### 테이블 설계 특징

- **MEMBER 테이블**
    - 임베디드 타입인 주소 정보(CITY, STREET, ZIPCODE)가 테이블에 직접 포함됨
- **ITEM 테이블 (단일 테이블 전략)**
    - 상속 전략으로 `SINGLE_TABLE`을 사용함
    - `DTYPE` 컬럼으로 타입을 구분함 (B: Book, A: Album, M: Movie)
    - 자식 엔티티의 모든 컬럼이 한 테이블에 있으므로 NULL 허용됨
- **ORDERS 테이블**
    - 테이블명은 SQL 예약어인 `ORDER` 대신 `ORDERS`를 사용함
- **DELIVERY 테이블**
    - ORDERS와 일대일 관계이며 주소 정보를 포함함

### 네이밍 컨벤션

| 구분 | 엔티티 | 테이블 |
|-----|--------|--------|
| **케이스** | 카멜 케이스 | 소문자 + 언더스코어 |
| **예시 1** | memberPoint | member_point |
| **예시 2** | OrderItem | order_item |
| **점(.) 처리** | member.name | member_name |

<br/><br/>

## 엔티티 클래스 개발

### 엔티티 클래스 구조

![엔티티 클래스 구조](/assets/img/jpa/2026-02-15-spring-boot-jpa-domain-analysis/entity-structure.png)

### 회원 엔티티 (Member)

```java
package jpabook.jpashop.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
public class Member {
    
    @Id @GeneratedValue
    @Column(name = "member_id")
    private Long id;
    
    private String name;
    
    @Embedded
    private Address address;
    
    @OneToMany(mappedBy = "member")
    private List<Order> orders = new ArrayList<>();
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Member.java)

- `@Entity`
    - JPA 엔티티임을 선언
- `@Id`
    - 기본 키 매핑
- `@GeneratedValue`
    - 기본 키 자동 생성
- `@Embedded`
    - 임베디드 타입 사용
- `@OneToMany(mappedBy = "member")`
    - 양방향 관계에서 연관관계 주인이 아님을 명시

### 주문 엔티티 (Order)

```java
package jpabook.jpashop.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter
public class Order {
    
    @Id @GeneratedValue
    @Column(name = "order_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id")
    private Delivery delivery;
        
    //==연관관계 편의 메서드==//
    public void setMember(Member member) {
        this.member = member;
        member.getOrders().add(this); // Member의 orders에도 Order 추가
    }
    
    public void addOrderItem(OrderItem orderItem) {
        orderItems.add(orderItem);
        orderItem.setOrder(this); // OrderItem에도 Order 세팅
    }
    
    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
        delivery.setOrder(this); // Delivery에도 Order 세팅
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Order.java)

- `@Table(name = "orders")`
    - `ORDER`는 SQL 예약어이므로 `ORDERS` 사용
- `fetch = FetchType.LAZY`
    - 지연 로딩 설정 (필수)
- `cascade = CascadeType.ALL`
    - 영속성 전이
- `@Enumerated(EnumType.STRING)`
    - Enum을 문자열로 저장
- `연관관계 편의 메서드`
    - 양방향 연관관계 세팅 시 양쪽 모두 값을 설정해야 함
    - 원자적으로 처리하기 위해 별도의 메서드를 제공함

### 주문상품 엔티티 (OrderItem)

```java
package jpabook.jpashop.domain;

import jakarta.persistence.*;
import jpabook.jpashop.domain.item.Item;

@Entity
@Getter @Setter
public class OrderItem {
    
    @Id @GeneratedValue
    @Column(name = "order_item_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/OrderItem.java)

### 상품 엔티티 (Item)

```java
package jpabook.jpashop.domain.item;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype")
@Getter @Setter
public abstract class Item {
    
    @Id @GeneratedValue
    @Column(name = "item_id")
    private Long id;
    
    private String name;
    
    @ManyToMany(mappedBy = "items")
    private List<Category> categories = new ArrayList<>();
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/item/Item.java)

- `@Inheritance(strategy = InheritanceType.SINGLE_TABLE)`
    - 상속 관계 매핑 전략을 지정함
    - `SINGLE_TABLE`
        - 서비스 규모가 크지 않고, 단순한 구조일 때 유리함
- `@DiscriminatorColumn(name = "dtype")`
    - 하위 클래스를 구분하는 컬럼을 지정함
    - 기본값은 `DTYPE`임


### 상품 하위 클래스

- **도서 (Book)**

    ```java
    @Entity
    @DiscriminatorValue("B")
    @Getter @Setter
    public class Book extends Item {
        private String author;
        private String isbn;
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/item/Book.java)

- **음반 (Album)**

    ```java
    @Entity
    @DiscriminatorValue("A")
    @Getter @Setter
    public class Album extends Item {
        private String artist;
        private String etc;
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/item/Album.java)

- **영화 (Movie)**

    ```java
    @Entity
    @DiscriminatorValue("M")
    @Getter @Setter
    public class Movie extends Item {
        private String director;
        private String actor;
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/item/Movie.java)

### 카테고리 엔티티 (Category)

```java
package jpabook.jpashop.domain;

import jakarta.persistence.*;
import jpabook.jpashop.domain.item.Item;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
public class Category {
    
    @Id @GeneratedValue
    @Column(name = "category_id")
    private Long id;
    
    private String name;
    
    @ManyToMany
    @JoinTable(name = "category_item",
        joinColumns = @JoinColumn(name = "category_id"),
        inverseJoinColumns = @JoinColumn(name = "item_id"))
    private List<Item> items = new ArrayList<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;
    
    @OneToMany(mappedBy = "parent")
    private List<Category> child = new ArrayList<>();
    }
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Category.java)
- `@ManyToMany`는 실무에서 사용을 금지하며, 중간 엔티티를 만들어 `@OneToMany`, `@ManyToOne`으로 풀어내야 함

### 주소 값 타입 (Address)

```java
package jpabook.jpashop.domain;

import jakarta.persistence.Embeddable;
import lombok.Getter;

@Embeddable
@Getter
public class Address {
    
    private String city;
    private String street;
    private String zipcode;
    
    protected Address() {
    }
    
    public Address(String city, String street, String zipcode) {
        this.city = city;
        this.street = street;
        this.zipcode = zipcode;
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Address.java)

- **값 타입 설계 원칙**
    - **불변 객체**
        - 값의 변경으로 인한 부작용을 원천 차단함
    - **Setter 제거**
        - 생성 후 값 변경을 막음
    - **protected 생성자**
        - JPA 스펙 준수 및 무분별한 생성 방지

<br/><br/>

## 연습 문제

1. 일대다(One-to-Many) 관계에서 외래 키(Foreign Key)는 일반적으로 어느 쪽에 위치해야 할까요?

   a. '다(Many)' 쪽에 위치합니다.

   - 일대다 관계에서 '다'에 해당하는 엔티티가 '일'에 해당하는 엔티티의 식별자를 외래 키로 가짐
   - JPA 매핑 시 소유자도 외래 키가 있는 쪽이 됨

2. 관계형 데이터베이스에서 다대다(Many-to-Many) 관계를 직접 표현하기 어려운 경우, 일반적으로 어떻게 해결해야 할까요?

   a. 중개(Intermediate) 테이블을 사용하여 One-to-Many 또는 Many-to-One 관계로 분해합니다.

   - 관계형 DB는 다대다 관계를 직접 표현할 수 없으므로, 중간에 연결 테이블을 두어 각각 일대다/다대일 관계로 풀어냄
   - 이를 통해 연결 속성 추가 등 유연성이 확보됨

3. JPA에서 엔티티 연관 관계를 페치(Fetch)할 때, 실무에서 기본적으로 추천하는 로딩 전략은 무엇이며 그 이유는 무엇인가요?

   a. LAZY 로딩; 필요할 때 데이터를 지연 로딩하여 성능 최적화에 유리합니다.

   - LAZY 로딩은 연관된 엔티티를 실제 사용하는 시점에 로딩하므로 불필요한 데이터 조회를 막아 성능상 이점을 가짐
   - EAGER는 예측 어렵고 N+1 문제를 유발할 수 있음

4. JPA에서 N+1 문제는 어떤 상황에서 발생하며, 주로 어떤 로딩 전략과 관련이 있을까요?

   a. EAGER 로딩 사용 시; 부모 엔티티 조회 후 자식 엔티티를 각각 추가 조회할 때.

   - N+1 문제는 주로 EAGER 로딩 설정된 연관 객체나 지연 로딩된 컬렉션을 반복 접근할 때 발생함
   - 부모 N개를 조회한 후, 각 부모에 대해 자식 1개씩 추가 조회하여 N+1번의 쿼리가 나감

5. 엔티티 클래스를 설계할 때, 무분별한 Setter 사용을 지양하고 비즈니스 메서드를 선호하는 주된 이유는 무엇일까요?

   a. Setter는 데이터의 무결성을 쉽게 훼손할 수 있기 때문입니다.

   - Setter를 사용하면 객체의 상태가 언제 어디서든 변경될 수 있어 데이터 변경 지점을 파악하기 어렵고, 의미 없는 값으로 상태가 변하여 데이터 무결성이 깨지기 쉬움
   - 비즈니스 메서드는 의미 있는 상태 변화만 허용함

<br/><br/>

## 요약 정리

- **도메인 모델**은 회원, 상품, 주문/배송 등 핵심 비즈니스 로직을 포함하는 구조로 설계함
- **엔티티 설계** 시 `@Getter`는 열어두되 `@Setter`는 꼭 필요한 경우에만 사용하며, 값 타입은 불변 객체로 설계함
- **테이블 설계**는 엔티티와 비슷하지만 일대다 관계의 외래 키는 항상 '다' 쪽에 있으며, 주문과 배송 같은 일대일 관계는 주 테이블에 외래 키를 두는 것을 권장함
- **연관관계 매핑**에서 '외래 키가 있는 곳'을 연관관계의 주인으로 정해야 혼란을 줄일 수 있음
- **상속 관계**는 `SINGLE_TABLE` 전략이 성능상 유리하고 관리가 편하지만, 데이터 무결성 측면에서는 `JOINED` 전략도 고려 대상임

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
