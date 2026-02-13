---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 프록시와 연관관계 관리'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-13 18:00:00 +0900
category: [Framework, JPA]
tags: [jpa, proxy, lazy-loading, eager-loading, cascade, orphan-removal, orm]
math: false
mermaid: false
---

# 프록시와 연관관계 관리

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 프록시, 즉시 로딩과 지연 로딩, 영속성 전이(CASCADE), 그리고 고아 객체(Orphan Removal) 등 연관관계 관리의 주요 개념을 정리함

<br/><br/>

## 프록시 (Proxy)


### 프록시 기초

- **em.find()와 em.getReference() 차이**

    | 메서드 | 설명 | 조회 시점 |
    |--------|------|-----------|
    | `em.find()` | 데이터베이스를 통해 실제 엔티티 객체 조회 | 즉시 |
    | `em.getReference()` | 데이터베이스 조회를 미루는 가짜(프록시) 엔티티 객체 조회 | 실제 사용 시점 |

    ![jpa-proxy-diagram-1](/assets/img/jpa/jpa-proxy-diagram-1.png)

### 프록시 특징

- **프록시 구조**

    ![jpa-proxy-diagram-2](/assets/img/jpa/jpa-proxy-diagram-2.png)

- **상속 관계**
    - 프록시 객체는 실제 클래스를 상속받아 만들어짐
    - 실제 클래스와 겉 모양이 같음
    - 사용자 입장에서는 진짜 객체인지 프록시 객체인지 구분 불필요 (이론상)

- **위임 패턴**
    - 프록시 객체는 실제 객체의 참조(target)를 보관함
    - 프록시 객체 호출 시 실제 객체의 메서드 호출

    ![jpa-proxy-diagram-3](/assets/img/jpa/jpa-proxy-diagram-3.png)

### 프록시 객체의 초기화 과정

```java
Member member = em.getReference(Member.class, "id1");
member.getName();
```

![diagram-2](/assets/img/jpa/diagram-2.png)

### 프록시의 특징

- **기본 동작**

    - **초기화는 한 번만**
       - 프록시 객체는 처음 사용할 때 한 번만 초기화됨

    - **프록시는 실제 엔티티로 바뀌지 않음**
       - 초기화되면 프록시 객체를 통해서 실제 엔티티에 접근 가능함
       - 프록시 객체 자체가 실제 엔티티로 바뀌는 것은 아님

- **주의사항**

    - **타입 체크**
       - 프록시 객체는 원본 엔티티를 상속받음
       - `==` 비교 실패하므로 `instanceof` 사용 필요

        ```java
        // 잘못된 비교
        Member member1 = em.find(Member.class, 1L);
        Member member2 = em.getReference(Member.class, 1L);
        System.out.println(member1.getClass() == member2.getClass()); // false
        
        // 올바른 비교
        System.out.println(member2 instanceof Member); // true
        ```

    - **영속성 컨텍스트에 이미 엔티티가 있는 경우**
       - `em.getReference()`를 호출해도 실제 엔티티를 반환함

    - **준영속 상태에서 프록시 초기화 시 예외 발생**
       - 영속성 컨텍스트의 도움을 받을 수 없는 준영속 상태에서 프록시를 초기화하면 문제 발생함
       - Hibernate의 경우 `org.hibernate.LazyInitializationException` 발생

### 프록시 확인 유틸리티

```java
// 프록시 인스턴스의 초기화 여부 확인
PersistenceUnitUtil util = emf.getPersistenceUnitUtil();
boolean isLoaded = util.isLoaded(entity);

// 프록시 클래스 확인
System.out.println(entity.getClass().getName());
// ..javassist.. or HibernateProxy...

// 프록시 강제 초기화 (Hibernate 전용)
org.hibernate.Hibernate.initialize(entity);

// 강제 호출로 초기화
// member.getName();
```

<br/><br/>

## 즉시 로딩과 지연 로딩

### 문제 상황

![diagram-3](/assets/img/jpa/diagram-3.png)

- **단순히 member 정보만 사용하는 비즈니스 로직**

    ```java
    System.out.println(member.getName());
    ```

- **문제점**
    - 이 경우 Team까지 조회하는 것은 비효율적임

### 지연 로딩 (LAZY)

- **설정 방법**

    ```java
    @Entity
    public class Member {
        @Id
        @GeneratedValue
        private Long id;
        
        @Column(name = "USERNAME")
        private String name;
        
        @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩 설정
        @JoinColumn(name = "TEAM_ID")
        private Team team;
    }
    ```

- **동작 방식**

    ![jpa-proxy-diagram-4](/assets/img/jpa/jpa-proxy-diagram-4.png)

- **실행 순서**

    - `Member member = em.find(Member.class, 1L);`
        - Member만 조회 (Team은 프록시 객체)

    - `Team team = member.getTeam();`
        - 프록시 객체 반환 (아직 DB 조회 안함)

    - `team.getName();`
        - **실제 team 사용 시점에 초기화** (DB 조회)

### 즉시 로딩 (EAGER)

- Member와 Team을 자주 함께 사용한다면

- **설정 방법**

    ```java
    @Entity
    public class Member {
        @Id
        @GeneratedValue
        private Long id;
        
        @Column(name = "USERNAME")
        private String name;
        
        @ManyToOne(fetch = FetchType.EAGER) // 즉시 로딩 설정
        @JoinColumn(name = "TEAM_ID")
        private Team team;
    }
    ```

- **동작 방식**

    ![jpa-proxy-diagram-5](/assets/img/jpa/jpa-proxy-diagram-5.png)

    - **실행**

        ```java
        Member member = em.find(Member.class, 1L);
        ```

        - JPA 구현체는 가능하면 **조인**(JOIN)을 사용해서 SQL 한 번에 함께 조회함

        ```sql
        SELECT M.*, T.*
        FROM MEMBER M
        JOIN TEAM T ON M.TEAM_ID = T.ID
        WHERE M.ID = 1
        ```

### 프록시와 즉시로딩 주의사항

- **가급적 지연 로딩만 사용**
    - 특히 실무에서

- **즉시 로딩의 문제점**
    - 예상하지 못한 SQL 발생
    - JPQL에서 N+1 문제 발생

- **기본 FetchType 확인 필요**
    - `@ManyToOne`, `@OneToOne`
        - 기본이 **즉시 로딩**이므로 `LAZY`로 변경 필수
    - `@OneToMany`, `@ManyToMany`
        - 기본이 **지연 로딩**

- **N+1 문제**

    ```java
    // JPQL 실행
    List<Member> members = em.createQuery("select m from Member m", Member.class).getResultList();
    
    // 실행되는 SQL
    // SELECT * FROM MEMBER (1번)
    // SELECT * FROM TEAM WHERE ID = ? (N번 - 각 Member마다)
    ```

    - **해결 방법**
        - Fetch Join 사용
        - 엔티티 그래프 기능 사용
        - BatchSize 설정

<br/><br/>

## 지연 로딩 활용 전략

![jpa-proxy-diagram-6](/assets/img/jpa/jpa-proxy-diagram-6.png)

### 잘못된 설정 전략

- **Member와 Team**
    - 자주 함께 사용하므로 ~~즉시 로딩~~
- **Member와 Order**
    - 가끔 사용하므로 지연 로딩
- **Order와 Product**
    - 자주 함께 사용하므로 ~~즉시 로딩~~

    ![jpa-proxy-diagram-7](/assets/img/jpa/jpa-proxy-diagram-7.png)
    ![jpa-proxy-diagram-8](/assets/img/jpa/jpa-proxy-diagram-8.png)

### 올바른 전략

- **원칙**

    - **모든 연관관계에 지연 로딩 사용**
    - **JPQL fetch 조인 또는 엔티티 그래프 기능 사용**
    - **즉시 로딩은 상상하지 못한 쿼리 발생**

- **Fetch Join**

    ```java
    // 일반 JPQL - N+1 문제 발생
    String jpql = "select m from Member m";
    
    // Fetch Join - 한 번에 조회
    String jpql = "select m from Member m join fetch m.team";
    ```
    
    ```sql
    -- 실행되는 SQL
    SELECT M.*, T.*
    FROM MEMBER M
    INNER JOIN TEAM T ON M.TEAM_ID = T.ID
    ```

<br/><br/>

## 영속성 전이 (CASCADE)

### 개념

- **영속성 전이**(CASCADE)란 특정 엔티티를 영속 상태로 만들 때 연관된 엔티티도 함께 영속 상태로 만드는 기능임

- ex) 부모 엔티티를 저장할 때 자식 엔티티도 함께 저장

![jpa-proxy-diagram-9](/assets/img/jpa/jpa-proxy-diagram-9.png)

### CASCADE 없이 저장

```java
// 부모 저장
Parent parent = new Parent();
em.persist(parent);

// 자식 1 저장
Child child1 = new Child();
child1.setParent(parent);
em.persist(child1);

// 자식 2 저장
Child child2 = new Child();
child2.setParent(parent);
em.persist(child2);

// persist를 3번 호출해야 함
```

### CASCADE로 저장

- **설정**

    ```java
    @Entity
    public class Parent {
        @Id
        @GeneratedValue
        private Long id;
        
        @OneToMany(mappedBy = "parent", cascade = CascadeType.PERSIST)
        private List<Child> children = new ArrayList<>();
        
        public void addChild(Child child) {
            children.add(child);
            child.setParent(this);
        }
    }
    ```

- **사용**

    ```java
    Parent parent = new Parent();
    
    Child child1 = new Child();
    Child child2 = new Child();
    
    parent.addChild(child1);
    parent.addChild(child2);
    
    em.persist(parent); // 부모만 persist하면 자식도 함께 저장
    ```
    
    ![jpa-proxy-diagram-10](/assets/img/jpa/jpa-proxy-diagram-10.png)

### CASCADE 주의사항


- **영속성 전이는 연관관계 매핑과 무관함**
    - 엔티티를 영속화할 때 연관된 엔티티도 함께 영속화하는 편리함만 제공

- **CASCADE 사용 가능 조건**

    - **라이프사이클이 동일**할 때
    - **단일 소유자**일 때
       - 하나의 부모만 자식을 관리할 때
    
    - ex)
      - `Order`가 `OrderItem`을 관리할 때
          - 주문이 주문 아이템의 생명주기 관리하므로 사용 가능
      - `Post`가 `Comment`를 관리할 때
          - 게시글이 댓글의 생명주기 관리하므로 사용 가능
      - `Member`가 `Team`을 관리할 때
          - 여러 Member가 하나의 Team 참조하므로 사용 불가

### CASCADE 종류

```java
public enum CascadeType {
    ALL,      // 모두 적용
    PERSIST,  // 영속
    REMOVE,   // 삭제
    MERGE,    // 병합
    REFRESH,  // REFRESH
    DETACH    // DETACH
}
```

| 옵션 | 설명 | 사용 시점 |
|------|------|-----------|
| `PERSIST` | 영속 상태 전이 | 저장 시 |
| `REMOVE` | 삭제 상태 전이 | 삭제 시 |
| `MERGE` | 병합 상태 전이 | 병합 시 |
| `REFRESH` | 갱신 상태 전이 | 갱신 시 |
| `DETACH` | 준영속 상태 전이 | 준영속 전환 시 |
| `ALL` | 위 모든 것 | 모든 생명주기 |

- **실무 사용 예**

    ```java
    // 일반적으로 PERSIST, REMOVE를 함께 사용
    @OneToMany(mappedBy = "parent", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    
    // 또는 ALL 사용 (생명주기를 완전히 같이 가져갈 때)
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    ```

<br/><br/>

## 고아 객체 (Orphan Removal)

### 개념

- **고아 객체**란 부모 엔티티와 연관관계가 끊어진 자식 엔티티를 의미함

- **고아 객체 제거**는 이러한 고아 객체를 자동으로 삭제하는 기능임

### 사용 방법

```java
@Entity
public class Parent {
    @Id
    @GeneratedValue
    private Long id;
    
    @OneToMany(mappedBy = "parent", orphanRemoval = true)
    private List<Child> children = new ArrayList<>();
}
```


```java
Parent parent = em.find(Parent.class, id);
parent.getChildren().remove(0); // 컬렉션에서 제거

// 실행되는 SQL
// DELETE FROM CHILD WHERE ID = ?
```
    
![diagram-7](/assets/img/jpa/diagram-7.png)

### 고아 객체 제거 주의사항

- **참조하는 곳이 하나일 때만 사용**
    - 특정 엔티티가 개인 소유할 때 사용
    - 다른 곳에서도 참조한다면 사용 불가

- **적용 가능한 관계**
    - `@OneToOne`
    - `@OneToMany`
        - 단일 소유 관계만 가능

- **부모 제거 시 자식도 제거**
    - 개념적으로 부모를 제거하면 자식은 고아가 됨
    - `orphanRemoval = true` 활성화 시 부모 제거시 자식도 제거됨 (CascadeType.REMOVE처럼 동작)

- **사용 예시**

    ```java
    // 올바른 사용
    @OneToMany(mappedBy = "post", orphanRemoval = true)
    private List<Comment> comments; // Post가 Comment를 단독 소유
    
    // 잘못된 사용
    @ManyToOne(orphanRemoval = true)
    private Team team; // 여러 Member가 같은 Team 참조
    ```

<br/><br/>

## 영속성 전이와 고아 객체

### 조합 사용

```java
@Entity
public class Parent {
    @OneToMany(mappedBy = "parent", 
               cascade = CascadeType.ALL, 
               orphanRemoval = true)
    private List<Child> children = new ArrayList<>();
}
```

### 효과

- **부모 엔티티를 통해 자식의 생명주기를 완전히 관리**
   - `em.persist(parent)` → 자식도 함께 영속화
   - `em.remove(parent)` → 자식도 함께 제거
   - `parent.getChildren().remove(0)` → 자식 개별 제거

- **자식 엔티티는 스스로 생명주기를 관리하지 않음**
   - 자식을 직접 `em.persist()`, `em.remove()` 하지 않음
   - 부모를 통해서만 관리

### DDD의 Aggregate Root

![diagram-8](/assets/img/jpa/diagram-8.png)

- **도메인 주도 설계(DDD)의 Aggregate Root 개념 구현 시 유용**

    - Aggregate Root만 Repository를 통해 관리
    - 나머지 엔티티는 Aggregate Root를 통해서만 관리
    - 일관성 있는 생명주기 관리

- **예시**

    ```java
    @Entity
    public class Order { // Aggregate Root
        @Id
        @GeneratedValue
        private Long id;
        
        @OneToMany(mappedBy = "order", 
                   cascade = CascadeType.ALL, 
                   orphanRemoval = true)
        private List<OrderItem> orderItems = new ArrayList<>();
        
        @OneToOne(cascade = CascadeType.ALL, 
                  orphanRemoval = true)
        private Delivery delivery;
    }
    
    // 사용
    Order order = new Order();
    order.addOrderItem(new OrderItem());
    order.setDelivery(new Delivery());
    
    orderRepository.save(order); // Order만 저장해도 모두 저장됨
    orderRepository.delete(order); // Order 삭제하면 모두 삭제됨
    ```

<br/><br/>

## 글로벌 페치 전략 설정 예제


- **원칙**
    - **모든 연관관계를 지연 로딩으로**

    ```java
    @Entity
    public class Member {
        @ManyToOne(fetch = FetchType.LAZY) // 기본이 EAGER → LAZY로 변경
        @JoinColumn(name = "TEAM_ID")
        private Team team;
    }
    
    @Entity
    public class OrderItem {
        @ManyToOne(fetch = FetchType.LAZY) // 기본이 EAGER → LAZY로 변경
        @JoinColumn(name = "ORDER_ID")
        private Order order;
        
        @ManyToOne(fetch = FetchType.LAZY) // 기본이 EAGER → LAZY로 변경
        @JoinColumn(name = "ITEM_ID")
        private Item item;
    }
    ```

### 영속성 전이 설정

![diagram-9](/assets/img/jpa/diagram-9.png)

- **Order와 Delivery**

    ```java
    @Entity
    public class Order {
        @OneToOne(fetch = FetchType.LAZY, 
                  cascade = CascadeType.ALL, 
                  orphanRemoval = true)
        @JoinColumn(name = "DELIVERY_ID")
        private Delivery delivery;
    }
    ```

    - Order가 Delivery의 생명주기를 완전히 관리함

- **Order와 OrderItem**

    ```java
    @Entity
    public class Order {
        @OneToMany(mappedBy = "order", 
                   cascade = CascadeType.ALL, 
                   orphanRemoval = true)
        private List<OrderItem> orderItems = new ArrayList<>();
    }
    ```

    - Order가 OrderItem의 생명주기를 완전히 관리함

### 정리된 엔티티 구조

```java
@Entity
@Table(name = "ORDERS")
public class Order {
    @Id
    @GeneratedValue
    @Column(name = "ORDER_ID")
    private Long id;
    
    // 지연 로딩
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_ID")
    private Member member;
    
    // 영속성 전이 + 고아 객체
    @OneToOne(fetch = FetchType.LAZY, 
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    @JoinColumn(name = "DELIVERY_ID")
    private Delivery delivery;
    
    // 영속성 전이 + 고아 객체
    @OneToMany(mappedBy = "order", 
               cascade = CascadeType.ALL, 
               orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    private LocalDateTime orderDate;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    // === 연관관계 편의 메서드 ===
    public void setMember(Member member) {
        this.member = member;
        member.getOrders().add(this);
    }
    
    public void addOrderItem(OrderItem orderItem) {
        orderItems.add(orderItem);
        orderItem.setOrder(this);
    }
    
    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
        delivery.setOrder(this);
    }
}
```

<br/><br/>

## 연습 문제

1. JPA에서 `em.getReference()`를 사용했을 때 처음 반환되는 객체의 특징은 무엇일까요?

   b. 실제 엔티티를 대신하는 프록시 객체

   - `em.getReference()`는 데이터베이스 조회를 미루는 프록시 객체를 반환함
   - 실제 데이터는 ID가 아닌 비-ID 필드를 사용할 때 로드됨

2. JPA 프록시 객체가 데이터베이스에서 실제 데이터를 로드하는 시점은 언제일까요?

   b. 객체의 비(Non)-ID 필드나 메서드를 사용할 때

   - 프록시는 ID가 아닌 실제 데이터(비-ID 필드 등)에 접근할 때 초기화됨
   - 이때 데이터베이스 쿼리가 발생함

3. JPA에서 연관관계를 로딩하는 가장 실용적인 권장 방식은 무엇일까요?

   b. 모든 연관관계를 지연 로딩(LAZY)으로 설정하고 필요시 페치 조인 활용

   - 성능 문제 방지를 위해 기본 LAZY 설정 후 필요시에만 페치 조인을 사용함
   - EAGER(즉시 로딩)는 예상치 못한 쿼리를 유발할 수 있음

4. JPA의 영속성 전이(Cascade) 기능은 주로 어떤 목적으로 사용될까요?

   b. 부모 엔티티의 영속성 작업(저장, 삭제 등)을 자식 엔티티에게 전파

   - Cascade는 부모 엔티티의 영속성 작업(persist, remove)을 자식에게 자동으로 전파함
   - 이는 로딩 방식(즉시/지연 로딩)과는 다른 기능임

5. JPA에서 OrphanRemoval 기능을 사용하는 가장 적절한 상황은 무엇일까요?

   b. 자식 엔티티의 생명주기가 부모 엔티티에 완전히 종속될 때 (단일 소유)

   - OrphanRemoval은 자식의 생명주기가 부모에게 완전히 종속될 때 사용됨
   - 부모와 관계가 끊어지면 자식을 고아로 보고 자동 삭제함

<br/><br/>

## 요약 정리

- **프록시**는 데이터베이스 조회를 지연시키는 가짜 객체로, 실제 사용 시점에 초기화되며 타입 체크 시 `instanceof`를 사용해야 함
- **지연 로딩**(LAZY)은 연관된 엔티티를 프록시로 조회하고 실제 사용할 때 초기화하는 방식이며, **즉시 로딩**(EAGER)은 조인을 사용해 한 번에 조회하는 방식임
- 예상치 못한 쿼리와 N+1 문제를 방지하기 위해 **모든 연관관계에 지연 로딩을 사용**하는 것을 권장함
- **영속성 전이**(CASCADE)는 부모 엔티티의 영속성 상태를 자식에게 전파하는 기능으로, 단일 소유자일 때만 사용해야 함
- **고아 객체**(orphanRemoval) 기능은 부모와 연관관계가 끊어진 자식 엔티티를 자동으로 삭제해줌
- **CASCADE와 orphanRemoval**을 함께 사용하면 부모 엔티티를 통해 자식의 생명주기를 완전히 관리할 수 있어 DDD의 Aggregate Root 개념 구현에 유용함

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
