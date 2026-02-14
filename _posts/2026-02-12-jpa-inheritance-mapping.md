---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 고급 매핑'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-12 14:00:00 +0900
category: [Language, Java, JPA]
tags: [jpa, inheritance, mapped-superclass, join-strategy, single-table-strategy]
math: false
mermaid: true
---

# 상속관계 매핑

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 객체 상속과 DB 슈퍼타입 서브타입 관계를 매핑하는 3가지 주요 전략(조인, 단일 테이블, 구현 클래스마다 테이블)과 공통 매핑 정보 관리를 위한 `@MappedSuperclass` 기능을 정리함

<br/><br/>

## 상속관계 매핑 개요

### 개념

- **관계형 데이터베이스의 특성**
    - 관계형 데이터베이스는 상속 관계가 없음
    - **슈퍼타입 서브타입 관계**라는 모델링 기법이 객체 상속과 유사
- **상속관계 매핑의 정의**
    - 객체의 상속 구조와 DB의 슈퍼타입 서브타입 관계를 매핑하는 것

### 객체와 테이블 구조 비교

![객체 상속 구조 다이어그램](/assets/img/jpa/inheritance_1.png)

<br/><br/>

## 상속관계 매핑 전략

### 주요 어노테이션

- **@Inheritance(strategy=InheritanceType.XXX)**
    - **JOINED**
        - 조인 전략
    - **SINGLE_TABLE**
        - 단일 테이블 전략
    - **TABLE_PER_CLASS**
        - 구현 클래스마다 테이블 전략
- **@DiscriminatorColumn(name="DTYPE")**
    - 부모 클래스에 구분 컬럼 지정
- **@DiscriminatorValue("XXX")**
    - 엔티티를 구분하는 값 지정

### 조인 전략 (JOINED)

![조인 전략 ERD](/assets/img/jpa/inheritance_2.png)

- **개념**
    - 엔티티 각각을 모두 테이블로 만들고, 자식 테이블이 부모 테이블의 기본 키를 받아서 기본 키 + 외래 키로 사용하는 전략
    - 조회할 때 조인을 자주 사용함

    ```java
    @Entity
    @Inheritance(strategy = InheritanceType.JOINED) // 상속 구현 전략 선택 (JOINED: 조인 전략)
    @DiscriminatorColumn(name = "DTYPE") // 부모 클래스에 구분 컬럼 지정 (기본값: DTYPE)
    public abstract class Item {
        @Id @GeneratedValue
        private Long id;
        
        private String name;
        private int price;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Item.java)

    ```java
    @Entity
    @DiscriminatorValue("A") // 엔티티를 구분하는 값 지정 (기본값: 엔티티 이름)
    public class Album extends Item {
        private String artist;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Album.java)

- **장점**
    - 테이블 정규화
    - 외래 키 참조 무결성 제약조건 활용 가능
    - 저장공간 효율화
- **단점**
    - 조회 시 조인을 많이 사용하여 **성능 저하 가능**
    - 조회 쿼리가 복잡함
    - 데이터 저장 시 **`INSERT SQL` 2번 호출**

### 단일 테이블 전략 (SINGLE_TABLE)

![단일 테이블 전략 ERD](/assets/img/jpa/inheritance_3.png)

- **개념**
    - 논리 모델을 한 테이블로 합치는 전략
    - 구분 컬럼(`DTYPE`)으로 어떤 자식 데이터가 저장되었는지 구분

    ```java
    @Entity
    @Inheritance(strategy = InheritanceType.SINGLE_TABLE) // 상속 구현 전략 선택 (SINGLE_TABLE: 단일 테이블 전략)
    @DiscriminatorColumn(name = "DTYPE") // 구분 컬럼 (단일 테이블 전략에서는 필수)
    public abstract class Item {
        @Id @GeneratedValue
        private Long id;
        
        private String name;
        private int price;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Item.java)

    ```java
    @Entity
    @DiscriminatorValue("A") // 엔티티를 구분하는 값 지정
    public class Album extends Item {
        private String artist;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Album.java)

- **장점**
    - **조인이 필요 없어 일반적으로 조회 성능이 빠름**
    - **조회 쿼리가 단순함**
- **단점**
    - 자식 엔티티가 매핑한 컬럼은 **모두 `null` 허용**
    - 단일 테이블에 모든 것을 저장하므로 **테이블이 커질 수 있음**
    - 상황에 따라 조회 성능이 오히려 느려질 수 있음

### 구현 클래스마다 테이블 전략 (TABLE_PER_CLASS)

![구현 클래스마다 테이블 전략 ERD](/assets/img/jpa/inheritance_4.png)

- **개념**
    - 서브 타입 테이블들을 모두 분리하고 슈퍼 타입의 공통 컬럼들을 각각 다 넣는 전략

    ```java
    @Entity
    @Inheritance(strategy = InheritanceType.TABLE_PER_CLASS) // 상속 구현 전략 선택 (TABLE_PER_CLASS: 구현 클래스마다 테이블 전략)
    public abstract class Item { // 반드시 추상 클래스로 해야 함
        @Id @GeneratedValue
        private Long id;
        
        private String name;
        private int price;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Item.java)

    ```java
    @Entity
    public class Album extends Item {
        private String artist;
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Album.java)

- **장점**
    - 서브 타입을 명확하게 구분해서 처리할 때 효과적
    - `not null` 제약조건 사용 가능
- **단점**
    - 여러 자식 테이블을 함께 조회할 때 **성능이 느림** (`UNION SQL` 필요)
    - 자식 테이블을 **통합해서 쿼리하기 어려움**

### 상속관계 매핑 전략 비교

| 전략 | 정규화 | 조회 성능 | 쿼리 복잡도 | 저장공간 | 권장도 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **조인 전략**<br>(JOINED) | 우수 | 조인 필요 | 복잡 | 효율적 | 높음 |
| **단일 테이블 전략**<br>(SINGLE_TABLE) | 비정규화 | 빠름 | 단순 | 낭비 가능 | 보통<br>(단순할 때 추천) |
| **구현 클래스마다 테이블 전략**<br>(TABLE_PER_CLASS) | 보통 | `UNION` 필요<br>(느림) | 매우 복잡 | 효율적 | 낮음<br>(사용 금지) |

<br/><br/>

## @MappedSuperclass

### 개념

- **공통 매핑 정보가 필요할 때 사용**
    - 여러 엔티티에서 공통으로 사용하는 매핑 정보를 모으는 역할
    - 상속관계 매핑이 아님
    - 엔티티가 아니며, 테이블과 매핑되지 않음

### 구조 예시

![MappedSuperclass 구조 다이어그램](/assets/img/jpa/inheritance_5.png)

```java
@MappedSuperclass // 공통 매핑 정보가 필요할 때 사용 (엔티티 X, 매핑 정보만 상속)
public abstract class BaseEntity { // 직접 생성해서 사용할 일이 없으므로 추상 클래스 권장
    
    @Column(name = "INSERT_MEMBER")
    private String createdBy;
    
    private LocalDateTime createdDate;
    
    @Column(name = "UPDATE_MEMBER")
    private String lastModifiedBy;
    
    private LocalDateTime lastModifiedDate;
}
```
- [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/BaseEntity.java)

```java
@Entity // 상속받은 매핑 정보 사용
public class Member extends BaseEntity {
    // BaseEntity의 필드들을 상속받아 사용
    private String email;
}
```
- [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Member.java)

```java
@Entity // 상속받은 매핑 정보 사용
public class Seller extends BaseEntity {
    private String shopName;
}
```
- [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Seller.java)

### 특징

- **사용 목적**
    - **부모 클래스를 상속받는 자식 클래스에 매핑 정보만 제공**
    - 주로 등록일, 수정일, 등록자, 수정자 같은 **전체 엔티티에서 공통으로 적용하는 정보를 모을 때 사용**
- **제약사항**
    - 상속관계 매핑이 아님
    - 엔티티가 아니므로 테이블과 매핑되지 않음
    - 조회, 검색 불가 (`em.find(BaseEntity)` 불가)
    - 직접 생성해서 사용할 일이 없으므로 **추상 클래스 권장**
- **참고사항**
    - `@Entity` 클래스는 엔티티나 `@MappedSuperclass`로 지정한 클래스만 상속 가능

<br/><br/>



## 상속관계 매핑 예제

### 요구사항

1. **상품의 종류**는 음반, 도서, 영화가 있고 **이후 더 확장될 수 있다**
2. **모든 데이터**는 등록일과 수정일이 필수다

### 도메인 모델

![상속관계 매핑 예제 도메인 모델](/assets/img/jpa/inheritance_example_domain.png)

### 엔티티 상세 구조

![상속관계 매핑 예제 엔티티 상세](/assets/img/jpa/inheritance_example_class.png)

### 테이블 설계 (조인 전략)

![상속관계 매핑 예제 테이블 설계](/assets/img/jpa/inheritance_example_erd.png)

### 구현 코드

- **BaseEntity (공통 매핑 정보)**

    ```java
    @MappedSuperclass
    @Getter
    public abstract class BaseEntity {
        
        @Column(name = "CREATED_DATE", updatable = false)
        private LocalDateTime createdDate;
        
        @Column(name = "LAST_MODIFIED_DATE")
        private LocalDateTime lastModifiedDate;
        
        private String createdBy;
        private String lastModifiedBy;
        
        @PrePersist
        public void prePersist() {
            LocalDateTime now = LocalDateTime.now();
            this.createdDate = now;
            this.lastModifiedDate = now;
        }
        
        @PreUpdate
        public void preUpdate() {
            this.lastModifiedDate = LocalDateTime.now();
        }
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/BaseEntity.java)

- **Item (부모 엔티티 - 조인 전략)**

    ```java
    @Entity
    @Inheritance(strategy = InheritanceType.JOINED)
    @DiscriminatorColumn(name = "DTYPE")
    @Getter @Setter
    public abstract class Item extends BaseEntity {
        
        @Id @GeneratedValue
        @Column(name = "ITEM_ID")
        private Long id;
        
        private String name;
        private int price;
        private int stockQuantity;
        
        @ManyToMany(mappedBy = "items")
        private List<Category> categories = new ArrayList<>();
    }
    ```
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Item.java)

- **Album, Book, Movie (자식 엔티티)**

    ```java
    @Entity
    @DiscriminatorValue("A")
    @Getter @Setter
    public class Album extends Item {
        private String artist;
        private String etc;
    }

    @Entity
    @DiscriminatorValue("B")
    @Getter @Setter
    public class Book extends Item {
        private String author;
        private String isbn;
    }

    @Entity
    @DiscriminatorValue("M")
    @Getter @Setter
    public class Movie extends Item {
        private String director;
        private String actor;
    }
    ```
    - [Album 전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Album.java)
    - [Book 전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Book.java)
    - [Movie 전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Movie.java)

<br/><br/>

## 연습 문제


1. 객체 상속 구조를 관계형 데이터베이스에 매핑할 때 마주하게 되는 주요 도전 과제는 무엇일까요?

   a. 객체 상속과 DB `Supertype-Subtype` 모델 간의 구조적 차이

   - 객체는 상속이라는 개념이 명확하지만 관계형 DB에는 동일한 구조가 없어서 `Supertype-Subtype` 모델을 활용해야 함
   - 이 둘 사이의 구조적 차이 때문에 이를 연결해 줄 매핑 전략이 필요함

2. JPA 상속 매핑 전략 중 '싱글 테이블 전략'의 가장 큰 장점은 무엇인가요?

   a. 조인이 필요 없어 조회 성능이 빠르다

   - 싱글 테이블 전략은 모든 데이터를 하나의 테이블에 저장함
   - 데이터를 읽을 때 여러 테이블을 조인할 필요 없이 한 번에 빠르게 조회할 수 있음

3. JPA 상속 매핑 전략 중 '구현 클래스마다 테이블 전략(Table Per Class)'이 일반적으로 권장되지 않는 주된 이유는 무엇일까요?

   a. 자식 타입 데이터를 조회할 때 `UNION` 쿼리가 사용되어 비효율적이다

   - 이 전략은 부모 타입으로 조회 시 여러 자식 테이블을 `UNION`으로 합쳐야 해서 매우 비효율적임
   - 성능과 쿼리 복잡성 측면에서 불리함

4. `@MappedSuperclass` 어노테이션이 적용된 클래스의 핵심 특징은 무엇인가요?

   a. 엔티티가 아니며, 매핑 정보 상속 목적으로 사용된다

   - `MappedSuperclass`는 엔티티가 아니라서 실제 테이블이 만들어지지 않음
   - 여러 엔티티들이 공통으로 사용하는 필드(매핑 정보)를 재사용하기 위해 활용됨

5. 여러 엔티티 클래스에서 공통적으로 사용되는 '등록일', '수정일', '등록자', '수정자'와 같은 매핑 정보를 관리하기에 가장 적합한 JPA 기능은 무엇일까요?

   a. 매핑 슈퍼클래스 (Mapped Superclass)

   - `Mapped Superclass`는 엔티티들이 공통으로 갖는 속성들의 매핑 정보를 모아서 상속해줄 때 유용함
   - 각 엔티티마다 중복 정의할 필요 없이 효율적으로 관리할 수 있음

<br/><br/>

## 요약 정리

- **상속관계 매핑**은 객체의 상속 구조와 DB의 슈퍼타입 서브타입 관계를 매핑하는 것임
- **조인 전략**은 가장 정규화된 방식이며, 외래 키 제약 조건을 활용하고 저장 공간을 효율적으로 사용할 수 있어 기본으로 권장됨
- **단일 테이블 전략**은 조인이 없어 조회 성능이 빠르고 쿼리가 단순하지만, `null`을 허용해야 하고 테이블이 커질 수 있는 단점이 있음 (단순한 구조일 때 사용)
- **구현 클래스마다 테이블 전략**은 `UNION` 쿼리를 사용해야 하므로 조회 성능이 매우 느려 사용하지 않는 것이 좋음
- `@MappedSuperclass`는 테이블과 관계없이 단순히 엔티티들이 공통으로 사용하는 매핑 정보(속성)를 모아서 상속해주기 위해 사용함 (등록일, 수정일 등)

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
