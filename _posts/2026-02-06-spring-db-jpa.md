---
title: '[김영한의 스프링 DB 2편 - 데이터 접근 활용 기술] 데이터 접근 기술 - JPA'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-06 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, jpa, orm, hibernate, jpql]
math: false
mermaid: false
---

# 데이터 접근 기술 - JPA

- 김영한님의 스프링 DB 2편 강의를 통해 JPA의 개념, 설정 방법, 엔티티 매핑, 그리고 JPQL을 활용한 쿼리 작성법을 정리함

<br/><br/>

## JPA 소개와 필요성

### JPA란?

- **JPA (Java Persistence API)**
    - 자바의 ORM (Object-Relational Mapping) 기술 표준
    - 객체와 관계형 데이터베이스를 매핑
    - 개발자가 SQL을 직접 작성하지 않고, JPA가 대신 SQL을 생성하고 실행

### 기술 스택 비교

- **JdbcTemplate / MyBatis**
    - SQL을 개발자가 직접 작성해야 함

    ```java
    String sql = "insert into item (item_name, price, quantity) values (?, ?, ?)";
    jdbcTemplate.update(sql, item.getItemName(), item.getPrice(), item.getQuantity());
    ```

- **JPA**
    - JPA가 적절한 SQL을 자동으로 생성하여 실행함
    - 개발 생산성이 대폭 향상됨

    ```java
    em.persist(item);
    // JPA가 insert sql을 생성해서 실행함
    ```

### 실무 기술 조합

- **JPA**
    - 핵심 기술
- **스프링 데이터 JPA**
    - JPA를 더욱 편리하게 사용할 수 있도록 도와주는 프레임워크
- **Querydsl**
    - 복잡한 쿼리나 동적 쿼리를 자바 코드로 안전하게 작성할 수 있게 도와줌

<br/><br/>

## JPA 설정

### 의존성 추가

- **build.gradle**
    - `spring-boot-starter-data-jpa`를 추가하면 `hibernate-core`, `jakarta.persistence-api` 등이 자동으로 포함됨
    - `JdbcTemplate` 관련 라이브러리도 포함되어 있어 별도 추가 불필요

    ```groovy
    dependencies {
        implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    }
    ```

### application.properties 설정

- **main/resources/application.properties**

    ```properties
    # JPA 로그 설정
    logging.level.org.hibernate.SQL=DEBUG
    org.hibernate.orm.jdbc.bind=TRACE
    ```

    - `org.hibernate.SQL=DEBUG`
        - 하이버네이트가 생성하고 실행하는 SQL을 로그로 출력
    - `org.hibernate.type.descriptor.sql.BasicBinder=TRACE`
        - SQL 파라미터에 바인딩되는 값을 로그로 출력

<br/><br/>

## 엔티티 매핑

### 엔티티 클래스 작성

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/domain/Item.java)

    ```java
    @Data
    @Entity  // JPA가 관리하는 엔티티임을 명시
    public class Item {
        
        @Id  // PK 매핑
        @GeneratedValue(strategy = GenerationType.IDENTITY)  // DB에서 자동 생성 (Auto Increment)
        private Long id;
        
        @Column(name = "item_name", length = 10)  // 컬럼 매핑
        private String itemName;
        
        private Integer price;      // @Column 생략 가능
        private Integer quantity;   // @Column 생략 가능
        
        // JPA는 기본 생성자가 필수 (public 또는 protected)
        public Item() {
        }
        
        public Item(String itemName, Integer price, Integer quantity) {
            this.itemName = itemName;
            this.price = price;
            this.quantity = quantity;
        }
    }
    ```

### 주요 애노테이션

- `@Entity`
    - `JPA`가 관리하는 객체임을 나타냄
    - 테이블과 매핑됨
- `@Id`
    - 테이블의 Primary Key와 매핑
- `@GeneratedValue`
    - PK 생성 전략을 지정
    - `IDENTITY`
        - 데이터베이스에 위임 (MySQL의 `AUTO_INCREMENT` 등)
- `@Column`
    - 객체 필드를 테이블 컬럼과 매핑
    - `name`
        - 매핑할 테이블의 컬럼 이름 지정
    - 생략 시 필드 이름을 테이블 컬럼 이름으로 사용 (카멜 케이스 -> 스네이크 케이스 자동 변환 지원)

<br/><br/>

## JPA Repository 구현

### JpaItemRepositoryV1

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/JpaItemRepositoryV1.java)

    ```java
    @Slf4j
    @Repository
    @Transactional  // JPA의 모든 데이터 변경은 트랜잭션 안에서 이루어져야 함
    public class JpaItemRepositoryV1 implements ItemRepository {
        
        private final EntityManager em;
        
        public JpaItemRepositoryV1(EntityManager em) {
            this.em = em;
        }
        
        @Override
        public Item save(Item item) {
            em.persist(item); // 저장
            return item;
        }
        
        @Override
        public void update(Long itemId, ItemUpdateDto updateParam) {
            Item findItem = em.find(Item.class, itemId);
            // setter로 값만 변경하면 트랜잭션 커밋 시점에 UPDATE SQL 자동 실행
            findItem.setItemName(updateParam.getItemName());
            findItem.setPrice(updateParam.getPrice());
            findItem.setQuantity(updateParam.getQuantity());
        }
        
        @Override
        public Optional<Item> findById(Long id) {
            Item item = em.find(Item.class, id); // 조회
            return Optional.ofNullable(item);
        }
        
        @Override
        public List<Item> findAll(ItemSearchCond cond) {
            String jpql = "select i from Item i";
            // 동적 쿼리 로직 (JPQL 사용)
            
            TypedQuery<Item> query = em.createQuery(jpql, Item.class);
            // 파라미터 바인딩 및 실행
            return query.getResultList();
        }
    }
    ```


    - **EntityManager**
        - JPA의 핵심 객체로, 엔티티의 저장, 조회, 수정, 삭제 등 모든 생명주기를 관리함
        - 스프링 부트가 자동으로 생성하여 빈으로 등록해 줌
    - **@Transactional**
        - JPA에서 데이터를 변경(등록, 수정, 삭제)할 때는 반드시 트랜잭션 안에서 실행되어야 함
        - 조회는 트랜잭션이 없어도 가능

<br/><br/>

## JPA 동작 원리 분석

### 저장 (save)

- `em.persist(item)` 호출 시 `JPA`가 엔티티의 매핑 정보를 분석하여 `INSERT SQL`을 생성하고 실행함
- `IDENTITY` 전략을 사용하는 경우, `persist()` 시점에 즉시 `INSERT SQL`을 실행하여 DB에서 식별자를 조회하고 엔티티에 채워넣음

### 수정 (update)

- **변경 감지 (Dirty Checking)**
    - `JPA`는 트랜잭션 내에서 조회한 엔티티의 변경을 감지함
    - 별도의 `update` 메서드를 호출할 필요 없이, 엔티티의 데이터만 변경하고 트랜잭션을 커밋하면 `JPA`가 자동으로 `UPDATE SQL`을 생성하여 실행함

### 단건 조회 (findById)

- `em.find(Item.class, id)` 호출 시 PK를 기준으로 `SELECT SQL`을 생성하여 실행하고, 결과를 엔티티 객체로 변환하여 반환함

### 목록 조회 (findAll)

- `JPQL` (Java Persistence Query Language)**
    - 테이블이 아닌 **엔티티 객체**를 대상으로 검색하는 객체지향 쿼리 언어
    - `select i from Item i`와 같이 사용하며, 실행 시 `SQL`로 변환되어 데이터베이스에 전달됨

<br/><br/>

## JPQL과 동적 쿼리

### JPQL 특징

- SQL과 문법이 유사함 (`SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `JOIN` 지원)
- 엔티티와 속성은 대소문자를 구분함
    - ex) `Item`, `itemName`
- 별칭(alias) 사용이 필수임
    - ex) `select i from Item i`

### 파라미터 바인딩

- **이름 기준 파라미터 바인딩 (권장)**
    - `:parameterName` 형식을 사용
    - 순서가 바뀌어도 안전하여 유지보수에 유리함

    ```java
    String jpql = "select i from Item i where i.price <= :maxPrice";
    query.setParameter("maxPrice", 10000);
    ```

### 동적 쿼리의 어려움

- 순수 JPA에서 JPQL을 문자로 더하며 동적 쿼리를 작성하는 것은 번거롭고 실수하기 쉬움
- **Querydsl**을 사용하면 자바 코드로 동적 쿼리를 안전하고 깔끔하게 작성할 수 있음 (해결책)

<br/><br/>

## 예외 변환

### JPA 예외와 스프링 예외 추상화

- `EntityManager`는 순수 JPA 기술이므로 JPA 관련 예외(`PersistenceException` 등)를 발생시킴
- 서비스 계층이 특정 데이터 접근 기술(JPA)에 종속되는 것을 방지하기 위해 스프링 예외(`DataAccessException`)로 변환이 필요함

### @Repository의 기능

1. **컴포넌트 스캔**
    - 클래스를 스프링 빈으로 자동 등록
2. **예외 변환**
    - JPA 예외를 스프링의 데이터 접근 예외 계층(`DataAccessException`)으로 변환하는 AOP 프록시 적용
    - 이를 통해 서비스 계층은 데이터 접근 기술이 변경되어도 영향을 받지 않음

<br/><br/>

## 기술 비교

### 코드 비교

- **JdbcTemplate**
    - SQL 직접 작성, 코드량이 많음
- **MyBatis**
    - SQL을 XML로 분리, 동적 쿼리에 강점
- **JPA**
    - SQL 자동 생성, 코드가 가장 간결함, 객체 중심 개발 가능

### 장단점 비교

| 기능 | JdbcTemplate | MyBatis | JPA |
|---|---|---|---|
| SQL 작성 | 직접 작성 (Java) | 직접 작성 (XML) | 자동 생성 |
| 동적 쿼리 | 복잡 | 편리 | 복잡 (Querydsl 필요) |
| 생산성 | 낮음 | 중간 | 높음 |
| 유지보수 | 낮음 | 중간 | 높음 (변경 감지 등) |

<br/><br/>

## 연습 문제

1. ORM 기술(JPA)이 해결하려는 주요 문제점은 무엇일까요?

   a. 객체와 관계형 데이터베이스 간의 패러다임 불일치
   
   - 객체지향 언어와 관계형 DB는 데이터를 다루는 방식이 다름
   - JPA는 이 패러다임 불일치를 해소하여 개발자가 객체에 집중하게 도움

2. 기존 SQL 중심 개발(JDBC/MyBatis) 대비 JPA의 가장 큰 장점은 무엇인가요?

   a. 수동 SQL 작성 최소화 및 생산성 향상
   
   - JPA는 기본적인 SQL(CRUD)을 자동으로 처리해줌
   - 개발자가 SQL 반복 작성 부담 없이 객체 비즈니스 로직에 집중하게 해 생산성을 높임

3. JPA에서 엔티티 객체를 조회한 후 수정하는 방식은 무엇인가요?

   a. 객체의 필드 값을 변경하고 트랜잭션 커밋을 기다린다
   
   - JPA는 트랜잭션 내에서 엔티티 변경을 추적함
   - 객체의 필드만 변경하면, 트랜잭션 커밋 시점에 변경을 감지해 `Update SQL`을 자동 실행함

4. Spring 애플리케이션에서 JPA 사용 시 `@Repository` 어노테이션의 주요 역할은 무엇인가요?

   a. JPA 관련 예외를 Spring의 DataAccessException 계층으로 변환한다
   
   - `@Repository`는 Spring AOP를 통해 JPA 고유 예외를 Spring의 `DataAccessException`으로 자동 변환함
   - 이를 통해 기술 종속성을 낮춤

5. JPA에서 JPQL(Java Persistence Query Language)에 대한 설명으로 올바른 것은 무엇인가요?

   a. 데이터베이스 테이블이 아닌 엔티티 객체를 대상으로 하는 객체지향 쿼리 언어이다
   
   - JPQL은 데이터베이스 테이블 대신 JPA가 관리하는 엔티티 객체를 대상으로 하는 객체지향 쿼리 언어임
   - 복잡한 조건 검색에 주로 사용됨


<br/><br/>

## 요약 정리

- **JPA**는 자바 진영의 ORM 표준으로, 객체와 관계형 데이터베이스 간의 매핑을 처리하고 SQL을 자동 생성하여 개발 생산성을 높임
- **엔티티 매핑**을 위해 `@Entity`, `@Id`, `@Column` 등의 애노테이션을 사용하며, 기본 생성자가 필수임
- **EntityManager**를 통해 엔티티를 저장(`persist`), 조회(`find`), 수정(변경 감지), 삭제(`remove`)할 수 있음
- 데이터를 변경할 때는 반드시 **트랜잭션** 안에서 실행해야 하며, 변경 감지 기능을 통해 별도의 `update` 쿼리 호출 없이 데이터 수정이 가능함
- **JPQL**은 엔티티 객체를 대상으로 하는 객체지향 쿼리 언어로, 복잡한 검색 쿼리를 작성할 때 사용됨
- **@Repository**는 컴포넌트 스캔뿐만 아니라 JPA 예외를 스프링의 공통 예외로 변환하는 역할을 수행하여 기술 종속성을 낮춤
- JPA는 반복적인 SQL 작성 작업을 줄여주지만, 복잡한 **동적 쿼리** 처리를 위해서는 **Querydsl**과 같은 추가 기술과의 조합이 권장됨

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
