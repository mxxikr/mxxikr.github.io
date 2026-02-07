---
title: '[김영한의 스프링 DB 2편 - 데이터 접근 활용 기술] 데이터 접근 기술 - Querydsl'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-07 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, querydsl, jpa, dynamic-query]
math: false
mermaid: false
---

# 데이터 접근 기술 - Querydsl

- 김영한님의 스프링 DB 2편 강의를 통해 Querydsl의 개념, 설정 방법, 기본 문법, 동적 쿼리 작성법을 정리함

<br/><br/>

## Querydsl 소개와 문제 해결

### 등장 배경

- **동적 쿼리의 어려움**
    - 순수 JPA(JPQL)나 스프링 데이터 JPA만으로는 동적 쿼리를 작성하기 까다로움
    - 문자열 조합으로 쿼리를 만들면 오타가 발생하기 쉽고, 컴파일 시점에 오류를 잡을 수 없음
- **Querydsl의 해결책**
    - 쿼리를 자바 코드로 작성하여 컴파일 시점에 문법 오류를 잡아줌
    - IDE의 자동 완성 기능을 활용할 수 있어 개발 생산성이 높아짐

### 기존 방식과 Querydsl 비교

- **순수 JPA (문자열 조합)**
    - 조건이 늘어날수록 `if`문과 문자열 더하기 연산이 복잡해짐
    - 띄어쓰기 등 사소한 실수로 런타임 오류가 발생할 수 있음

    ```java
    // 순수 JPA의 동적 쿼리 문제점
    public List<Item> findAll(ItemSearchCond cond) {
        String jpql = "select i from Item i";
        // 복잡한 문자열 조합
        if (StringUtils.hasText(itemName)) {
            jpql += " i.itemName like concat('%',:itemName,'%')";
        }
        return em.createQuery(jpql, Item.class).getResultList();
    }
    ```

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/JpaItemRepositoryV1.java)


- **Querydsl (자바 코드)**
    - 직관적이고 가독성이 뛰어남
    - 메서드 추출을 통해 조건을 재사용할 수 있음

    ```java
    return query
        .select(item)
        .from(item)
        .where(
            likeItemName(itemName),
            maxPrice(maxPrice)
        )
        .fetch();
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/JpaItemRepositoryV3.java)

<br/><br/>

## Querydsl 설정

### build.gradle 설정 (Spring Boot 3.x 이상)

- Querydsl은 설정이 다소 복잡하지만, 한 번 설정해두면 매우 편리하게 사용 가능함

    ```groovy
    // build.gradle
    dependencies {
        // Querydsl 추가
        implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
        annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jakarta"
        annotationProcessor "jakarta.annotation:jakarta.annotation-api"
        annotationProcessor "jakarta.persistence:jakarta.persistence-api"
    }
    
    // QClass 생성 위치 및 Clean 설정
    def querydslDir = "$buildDir/generated/querydsl"
    clean {
        delete file(querydslDir)
    }
    ```

<br/><br/>

## Q 타입 생성

### Q 타입이란?

- Querydsl은 컴파일 시점에 엔티티(`@Entity`)를 기반으로 **Q 클래스**를 생성함
    - ex) `Item` 엔티티가 있다면 `QItem`이라는 클래스가 생성됨
    - `QItem`을 사용하여 쿼리를 타입 세이프(Type-Safe)하게 작성할 수 있음

        ```java
        public class QItem extends EntityPathBase<Item> {
            public static final QItem item = new QItem("item");
            public final StringPath itemName = createString("itemName");
            //
        }
        ```

### 생성 방법

- **Gradle - IntelliJ 사용 시**
    1. Gradle `tasks` -> `build` -> `clean`
    2. Gradle `tasks` -> `other` -> `compileJava`
    3. `build/generated/querydsl` 경로에 Q 파일이 생성되었는지 확인

    ![QueryDSL Q-Type Generation](/assets/img/springdb/querydsl_q_type.png)


<br/><br/>

## Querydsl 기본 사용법

### JPAQueryFactory 설정

- Querydsl을 사용하려면 `JPAQueryFactory`가 필요하며 `EntityManager`를 주입받아 생성함
- 스프링 빈으로 등록하여 공용으로 사용하거나 리포지토리에서 직접 생성하여 사용함

    ```java
    @Repository
    @Transactional
    public class JpaItemRepositoryV3 implements ItemRepository {
        
        private final EntityManager em;
        private final JPAQueryFactory query;
        
        public JpaItemRepositoryV3(EntityManager em) {
            this.em = em;
            this.query = new JPAQueryFactory(em); // QueryFactory 생성
        }
    }
    ```
    
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/JpaItemRepositoryV3.java)


    ![QueryDSL Execution Flow](/assets/img/springdb/querydsl_execution.png)



### 기본 쿼리 작성

- Q 타입을 `static import`하면 코드가 더 간결해짐

    ```java
    import static hello.itemservice.domain.QItem.item;
    
    List<Item> result = query
        .select(item)
        .from(item)
        .where(item.itemName.eq("itemA").and(item.price.gt(10000)))
        .fetch();
    ```
    
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/JpaItemRepositoryV3.java)


- **주요 메서드**
    - `fetch()`
        - 리스트 조회, 데이터 없으면 빈 리스트 반환
    - `fetchOne()`
        - 단건 조회, 결과 없으면 null, 둘 이상이면 예외 발생
    - `fetchFirst()`
        - `limit(1).fetchOne()`과 동일

<br/><br/>

## 동적 쿼리 구현

### BooleanBuilder 사용

- 초기값 없이 생성하거나 초기 조건을 넣어 생성 가능
- 조건에 따라 `and()`, `or()` 메서드를 체이닝하여 사용

    ```java
    // BooleanBuilder 사용
    BooleanBuilder builder = new BooleanBuilder();
    if (StringUtils.hasText(itemName)) {
        builder.and(item.itemName.like("%" + itemName + "%"));
    }
    if (maxPrice != null) {
        builder.and(item.price.loe(maxPrice));
    }
    
    List<Item> result = query
        .select(item)
        .from(item)
        .where(builder)
        .fetch();
    ```
    


### BooleanExpression 사용 (권장)

- `where` 절에 `null`이 들어오면 해당 조건은 무시되는 특성을 이용함
- 메서드를 분리하여 코드 가독성을 높이고 조건을 재사용할 수 있음

    ```java
    // BooleanExpression 사용 (권장)
    List<Item> result = query
        .select(item)
        .from(item)
        .where(likeItemName(itemName), maxPrice(maxPrice))
        .fetch();
    
    private BooleanExpression likeItemName(String itemName) {
        if (StringUtils.hasText(itemName)) {
            return item.itemName.like("%" + itemName + "%");
        }
        return null; // null은 조건 무시
    }
    ```
    
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/JpaItemRepositoryV3.java)


<br/><br/>

## 연습 문제


1. String 기반 쿼리(JPQL 문자열 직접 작성 등)의 가장 큰 문제점은 무엇일까요?

   a. 컴파일 시 오류 발견이 어렵다 (런타임 오류 발생)
   
   - String 기반 쿼리는 단순 문자열이므로 오타가 있어도 컴파일 시점에는 알 수 없음
   - 실제 쿼리가 실행되는 런타임에 에러가 발생하여 디버깅이 어렵고 위험함

2. Querydsl에서 타입 안전성(Type Safety)을 제공하는 핵심 요소는 무엇일까요?

   a. Q 타입(Q 파일) 코드 자동 생성
   
   - Querydsl은 엔티티를 분석하여 `Q 타입` 클래스를 자동으로 생성함
   - 이를 통해 필드명 오타나 타입 불일치를 컴파일 시점에 바로 잡아낼 수 있음

3. Querydsl로 동적 쿼리 작성을 쉽게 하는 기능은 무엇일까요?

   a. BooleanBuilder 활용
   
   - 상황에 따라 조건이 달라지는 동적 쿼리를 `BooleanBuilder`를 사용해 쉽게 조립할 수 있음
   - 또는 `BooleanExpression`을 반환하는 메서드 방식을 사용하여 `Where` 절에서 `null`을 무시하는 방식으로도 구현 가능함

4. JPA 환경에서 Querydsl 실행 시 JPQL 생성에 필요한 주요 객체는 무엇일까요?

   a. JPAQueryFactory
   
   - `JPAQueryFactory`는 `EntityManager`를 기반으로 동작하며, Querydsl 문법으로 작성된 코드를 JPQL로 변환하여 실행함

5. Querydsl의 가장 큰 장점 중 하나는 무엇일까요?

   a. 컴파일 시점에 오류 발견 가능
   
   - 자바 코드로 쿼리를 작성하므로 컴파일러가 문법 오류를 체크해 줌
   - 이는 개발 생산성을 높이고 애플리케이션의 안정성을 크게 향상시킴

<br/><br/>

## 요약 정리

- **Querydsl**은 자바 코드로 쿼리를 작성하게 해주어 컴파일 시점에 문법 오류를 잡을 수 있는 강력한 도구임
- **Q 타입**을 통해 엔티티를 객체처럼 다루며 타입 세이프하게 쿼리를 작성할 수 있음
- **동적 쿼리** 처리에 매우 탁월하며, `BooleanBuilder`보다는 **BooleanExpression**을 활용한 `Where` 다중 파라미터 방식을 권장함 (가독성 및 재사용성 우수)
- JPA를 보완하는 기술이므로 **스프링 데이터 JPA**와 함께 사용하면 단순 조회와 복잡한 쿼리 모두를 효율적으로 처리할 수 있음

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
