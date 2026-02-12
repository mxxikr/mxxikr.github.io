---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 다양한 연관관계 매핑'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-12 10:00:00 +0900
category: [Framework, JPA]
tags: [jpa, association-mapping, many-to-one, one-to-many, one-to-one, many-to-many]
math: false
mermaid: true
---

# 다양한 연관관계 매핑

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 객체와 테이블의 다양한 연관관계 매핑 방법(다대일, 일대다, 일대일, 다대다), 각 매핑의 특징과 주의사항, 그리고 권장되는 매핑 전략을 정리함

<br/><br/>

## 연관관계 매핑의 3가지 핵심 고려사항

### 다중성

- **다대일 (N:1)**
    - `@ManyToOne`
- **일대다 (1:N)**
    - `@OneToMany`
- **일대일 (1:1)**
    - `@OneToOne`
- **다대다 (N:M)**
    - `@ManyToMany`

### 방향성

- **테이블의 특성**
    - 외래 키 하나로 양방향 조인 가능
    - 방향이라는 개념이 없음
- **객체의 특성**
    - 참조용 필드가 있는 쪽으로만 참조 가능
    - **단방향**
        - 한쪽만 참조
    - **양방향**
        - 양쪽이 서로 참조

### 연관관계의 주인 (Owner)

- **원칙**
    - 테이블은 외래 키 하나로 두 테이블의 연관관계를 맺음
    - 객체 양방향 관계는 참조가 2군데 존재 (A→B, B→A)
    - **외래 키를 관리할 곳을 지정해야 함**
- **역할 구분**
    - **연관관계의 주인**
        - 외래 키를 관리하는 참조
    - **주인의 반대편**
        - 외래 키에 영향을 주지 않음, 단순 조회만 가능

<br/><br/>

## 다대일 관계 [N:1]

### 다대일 단방향

![다대일 단방향 다이어그램](/assets/img/jpa/association_1.png)

- **특징**
    - 가장 많이 사용하는 연관관계
    - 다대일의 반대는 일대다

    ```java
    @Entity
    public class Member {
        @Id @GeneratedValue
        @Column(name = "MEMBER_ID")
        private Long id;

        @ManyToOne // 다대일 관계 설정 (Member:Team = N:1)
        @JoinColumn(name = "TEAM_ID") // 외래 키 매핑 (TEAM_ID)
        private Team team;
        
        private String username;
    }
    ```

    ```java
    @Entity
    public class Team {
        @Id @GeneratedValue
        @Column(name = "TEAM_ID")
        private Long id;
        
        private String name;
    }
    ```

### 다대일 양방향

![다대일 양방향 다이어그램](/assets/img/jpa/association_2.png)

- **규칙**
    - **외래 키가 있는 쪽이 연관관계의 주인**
    - 양쪽을 서로 참조하도록 개발

    ```java
    @Entity
    public class Member { // 연관관계 주인
        @ManyToOne // 다대일 관계
        @JoinColumn(name = "TEAM_ID") // 연관관계 주인 (외래 키 관리)
        private Team team;
        // ...
    }
    ```

    ```java
    @Entity
    public class Team { // 주인이 아님
        @OneToMany(mappedBy = "team") // 연관관계의 주인이 아님 (매핑된 필드 이름)
        private List<Member> members = new ArrayList<>();
    }
    ```

<br/><br/>

## 일대다 관계 [1:N]

### 일대다 단방향

![일대다 단방향 다이어그램](/assets/img/jpa/association_3.png)

- **특징**
    - 일대다 단방향은 일(1)이 연관관계의 주인
    - 테이블 일대다 관계는 항상 다(N) 쪽에 외래 키가 있음
    - **객체와 테이블의 차이** 때문에 반대편 테이블의 외래 키를 관리하는 특이한 구조
- **주의사항**
    - `@JoinColumn`을 꼭 사용해야 함 (없으면 조인 테이블 방식 사용)
- **단점**
    - 엔티티가 관리하는 외래 키가 다른 테이블에 있음
    - 연관관계 관리를 위해 **추가 UPDATE SQL 실행**
- **권장사항**
    - 일대다 단방향 매핑 대신 **다대일 양방향 매핑 사용 권장**

    ```java
    @Entity
    public class Team {
        @OneToMany // 일대다 단방향 매핑
        @JoinColumn(name = "TEAM_ID") // MEMBER 테이블의 TEAM_ID (FK)
        private List<Member> members = new ArrayList<>();
    }
    ```

### 일대다 양방향

![일대다 양방향 다이어그램](/assets/img/jpa/association_4.png)

- **특징**
    - 공식적으로 존재하지 않는 매핑
    - `@JoinColumn(insertable=false, updatable=false)` 사용
    - 읽기 전용 필드로 양방향처럼 사용
- **권장사항**
    - **다대일 양방향을 사용**

<br/><br/>

## 일대일 관계 [1:1]

### 기본 특성

- **특징**
    - 일대일 관계는 그 반대도 일대일
    - 주 테이블이나 대상 테이블 중 **외래 키 선택 가능**
    - 외래 키에 **데이터베이스 유니크(UNI) 제약조건 추가**

### 주 테이블에 외래 키 - 단방향

![주 테이블 외래 키 단방향 다이어그램](/assets/img/jpa/association_5.png)

- **특징**
    - 다대일(`@ManyToOne`) 단방향 매핑과 유사

    ```java
    @Entity
    public class Member {
        @OneToOne // 일대일 관계 설정
        @JoinColumn(name = "LOCKER_ID") 
        private Locker locker;
    }
    ```

### 주 테이블에 외래 키 - 양방향

![주 테이블 외래 키 양방향 다이어그램](/assets/img/jpa/association_6.png)

- **특징**
    - 다대일 양방향 매핑처럼 **외래 키가 있는 곳이 연관관계의 주인**
    - 반대편은 `mappedBy` 적용

    ```java
    @Entity
    public class Member { // 주인
        @OneToOne
        @JoinColumn(name = "LOCKER_ID")
        private Locker locker;
    }
    ```

    ```java
    @Entity
    public class Locker { // 주인이 아님
        @OneToOne(mappedBy = "locker") // 읽기 전용
        private Member member;
    }
    ```

### 대상 테이블에 외래 키 - 단방향

![대상 테이블 외래 키 단방향 다이어그램](/assets/img/jpa/association_7.png)

- **특징**
    - **단방향 관계는 JPA 지원하지 않음**
    - 양방향 관계는 지원

### 대상 테이블에 외래 키 - 양방향

![대상 테이블 외래 키 양방향 다이어그램](/assets/img/jpa/association_8.png)

- **특징**
    - 주 테이블에 외래 키 양방향과 매핑 방법 동일

### 일대일 관계 전략 비교

- **주 테이블에 외래 키**
    - **장점**
        - 주 테이블만 조회해도 대상 테이블에 데이터가 있는지 확인 가능
        - JPA 매핑 편리
    - **단점**
        - 값이 없으면 외래 키에 null 허용
- **대상 테이블에 외래 키**
    - **장점**
        - 주 테이블과 대상 테이블을 일대일에서 일대다 관계로 변경할 때 테이블 구조 유지
    - **단점**
        - 프록시 기능의 한계로 지연 로딩으로 설정해도 **항상 즉시 로딩됨**

<br/><br/>

## 다대다 관계 [N:M]

### 관계형 데이터베이스의 제약

![관계형 DB 제약 다이어그램](/assets/img/jpa/association_9.png)

- **문제점**
    - 관계형 데이터베이스는 정규화된 테이블 2개로 다대다 관계를 표현할 수 없음
    - **연결 테이블을 추가**하여 일대다, 다대일 관계로 풀어내야 함

### 연결 테이블 사용

![연결 테이블 사용 다이어그램](/assets/img/jpa/association_10.png)

### 객체의 다대다 관계

![객체 다대다 관계 다이어그램](/assets/img/jpa/association_11.png)

- **특징**
    - 객체는 컬렉션을 사용하여 **객체 2개로 다대다 관계 가능**
    - `@ManyToMany` 사용
    - `@JoinTable`로 연결 테이블 지정

    ```java
    @Entity
    public class Member {
        @ManyToMany
        @JoinTable(name = "MEMBER_PRODUCT", // 연결 테이블 이름 지정
            joinColumns = @JoinColumn(name = "MEMBER_ID"), // 현재 엔티티 매핑
            inverseJoinColumns = @JoinColumn(name = "PRODUCT_ID")) // 반대 엔티티 매핑
        private List<Product> products = new ArrayList<>();
    }
    ```

### 다대다 매핑의 한계

![다대다 매핑 한계 다이어그램](/assets/img/jpa/association_12.png)

- **한계점**
    - 실무에서는 연결 테이블이 단순히 연결만 하고 끝나지 않고 추가 데이터가 필요한 경우가 많음
    - 하지만 `@ManyToMany`는 중간 테이블에 컬럼을 추가할 수 없어 한계가 명확함
    - 또한 중간 테이블이 숨겨져 있어 예상치 못한 복잡한 조인 쿼리가 발생할 수 있음

### 다대다 한계 극복

![다대다 한계 극복 다이어그램](/assets/img/jpa/association_13.png)

- **해결 방법**
    - **연결 테이블용 엔티티 추가** (연결 테이블을 엔티티로 승격)
    - `@ManyToMany` → `@OneToMany`, `@ManyToOne` 변환
    - 독립적인 기본 키(ORDER_ID) 사용 권장

    ```java
    @Entity
    public class MemberProduct {
        @Id @GeneratedValue
        private Long id;
        
        @ManyToOne // 다대일 관계
        @JoinColumn(name = "MEMBER_ID") // 외래 키 매핑
        private Member member;
        
        @ManyToOne // 다대일 관계
        @JoinColumn(name = "PRODUCT_ID") // 외래 키 매핑
        private Product product;
        
        private int orderAmount;
        private LocalDateTime orderDate;
    }
    ```

<br/><br/>

## 어노테이션 정리

### @JoinColumn

| 속성 | 설명 | 기본값 |
|------|------|--------|
| `name` | 매핑할 외래 키 이름 | 필드명 + "_" + 참조 테이블의 기본 키 컬럼명 |
| `referencedColumnName` | 외래 키가 참조하는 대상 테이블의 컬럼명 | 참조 테이블의 기본 키 컬럼명 |
| `foreignKey(DDL)` | 외래 키 제약조건 직접 지정 (테이블 생성 시만 사용) | |
| `unique, nullable...` | @Column의 속성과 동일 | |

### @ManyToOne

| 속성 | 설명 | 기본값 |
|------|------|--------|
| `optional` | false로 설정하면 연관된 엔티티가 항상 있어야 함 | TRUE |
| `fetch` | 글로벌 페치 전략 설정 | `FetchType.EAGER` |
| `cascade` | 영속성 전이 기능 사용 | |
| `targetEntity` | 연관된 엔티티의 타입 정보 (거의 사용 안 함) | |

### @OneToMany

| 속성 | 설명 | 기본값 |
|------|------|--------|
| `mappedBy` | 연관관계의 주인 필드 선택 | |
| `fetch` | 글로벌 페치 전략 설정 | `FetchType.LAZY` |
| `cascade` | 영속성 전이 기능 사용 | |
| `targetEntity` | 연관된 엔티티의 타입 정보 (거의 사용 안 함) | |

<br/><br/>

## 연습 문제

1. 양방향 연관관계 매핑 시, 데이터베이스 외래 키를 주로 관리하는 쪽은 어느 쪽일까요?

   a. 연관관계의 주인

   - 연관관계의 주인만이 외래 키를 등록하고 수정할 수 있음
   - 주인이 아닌 쪽은 읽기 기능만 가능함

2. JPA 실무 개발에서 일반적으로 가장 추천되는 연관관계 매핑 방식은 무엇인가요?

   a. 다대일 단방향 (Many-to-One)

   - 다대일 매핑은 데이터베이스의 외래 키 위치와 객체의 참조 방향이 자연스럽게 일치하여 권장됨
   - 필요 시 양방향 다대일을 추가함

3. '1' 쪽이 연관관계 주인이 되어 'N' 쪽 컬렉션을 매핑하는 단방향 일대다(1:N) 관계에서 주로 발생하는 데이터베이스 관련 이슈는 무엇인가요?

   a. 추가적인 UPDATE 쿼리 발생

   - 외래 키가 'N' 쪽에 있어 '1' 쪽 엔티티를 저장/수정할 때 'N' 테이블의 외래 키를 업데이트하는 추가 쿼리가 발생함

4. 데이터베이스에서 일대일(1:1) 관계를 정확히 나타내기 위해 외래 키 컬럼에 필수적으로 추가해야 하는 제약 조건은 무엇일까요?

   a. Unique 제약조건

   - 일대일 관계는 각 엔티티가 서로에게 하나만 연결됨을 의미하며, 이는 외래 키에 Unique 제약 조건을 설정하여 구현함

5. JPA에서 @ManyToMany를 직접 사용하는 것이 실무에서 권장되지 않는 주된 이유와 대안은 무엇인가요?

   a. 조인 테이블에 추가 정보 저장 불가 / 중간 엔티티 승격

   - @ManyToMany는 조인 테이블에 단순히 연결 정보 외 다른 데이터를 추가하기 어려움
   - 중간 테이블을 별도 엔티티로 만들어 해결함

<br/><br/>

## 요약 정리

- **다대일 단방향** 매핑을 기본으로 하고, 필요할 때 **양방향**을 추가하는 것이 좋음
- **연관관계의 주인**은 외래 키가 있는 곳으로 설정해야 함
- **일대다 단방향** 매핑은 추가 UPDATE 쿼리가 발생하므로 **다대일 양방향** 매핑을 권장함
- **일대일 관계**는 주 테이블에 외래 키를 두는 것이 JPA 매핑과 객체지향적 관점에서 유리함
- **다대다 매핑**(@ManyToMany)은 한계가 명확하므로, **중간 엔티티**(연결 테이블 엔티티)를 만들어서 `@OneToMany`, `@ManyToOne`으로 풀어내는 것이 필수적임

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
