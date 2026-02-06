---
title: '[김영한의 스프링 DB 2편 - 데이터 접근 활용 기술] 데이터 접근 기술 - 스프링 데이터 JPA'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-06 15:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, spring-data-jpa, query-method, jpa-repository]
math: false
mermaid: false
---

# 데이터 접근 기술 - 스프링 데이터 JPA

- 김영한님의 스프링 DB 2편 강의를 통해 스프링 데이터 JPA의 주요 기능, 쿼리 메서드, 그리고 실무 적용 방법을 정리함

<br/><br/>

## 스프링 데이터 JPA 소개

### 등장 배경

- **순수 JPA의 반복 코드 문제**
    - 기본 CRUD 기능(저장, 조회, 수정, 삭제)은 대부분의 엔티티에서 비슷하게 반복됨
    - `EntityManager`를 사용하는 동일한 패턴의 코드를 계속 작성해야 하는 번거로움이 있음
- **스프링 데이터 JPA의 해결책**
    - 인터페이스만 정의하면 구현체를 자동으로 생성해 줌
    - 기본 CRUD 기능을 공통으로 제공하여 개발 생산성을 높임

### 스프링 데이터 JPA란?

- JPA를 편리하게 사용할 수 있도록 도와주는 라이브러리
- `JpaRepository` 인터페이스를 통해 지루한 반복 작업을 없애고 핵심 비즈니스 로직에 집중할 수 있게 함
> - JPA를 대체하는 것이 아니라 JPA 위에서 동작하는 도구이므로 JPA에 대한 이해가 선행되어야 함

<br/><br/>

## 주요 기능

### 공통 인터페이스 기능

- **JpaRepository 인터페이스**
    - `JpaRepository<T, ID>`를 상속받으면 기본적인 CRUD 기능을 즉시 사용할 수 있음
    - `save`, `findById`, `findAll`, `delete` 등의 메서드가 이미 구현되어 있음

### 쿼리 메서드 기능

- **메서드 이름으로 쿼리 생성**
    - 메서드 이름만 규칙에 맞게 지으면 스프링 데이터 JPA가 적절한 JPQL 쿼리를 자동으로 생성하여 실행함
    - ex) `findByUsernameAndAgeGreaterThan(String username, int age)`

<br/><br/>

## JpaRepository 인터페이스

### 기본 사용법

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jpa/SpringDataJpaItemRepository.java)

    ```java
    public interface ItemRepository extends JpaRepository<Item, Long> {
        // 인터페이스 정의만으로 CRUD 사용 가능
    }
    ```

### 동작 원리 (프록시)

1. 애플리케이션 로딩 시점에 스프링 데이터 JPA가 `JpaRepository`를 상속받은 인터페이스를 확인함
2. 동적 프록시 기술을 사용하여 해당 인터페이스의 구현 클래스를 자동으로 생성함
3. 생성된 구현체 인스턴스를 스프링 빈으로 등록하여 의존성을 주입함
4. 개발자는 구현 코드 없이 인터페이스만 주입받아 사용하면 됨

<br/><br/>

## 쿼리 메서드

### 쿼리 메서드 생성 규칙

- **조회**
    - `find...By`, `read...By`, `query...By`, `get...By`
- **Count**
    - `count...By` (반환타입: long)
- **Exists**
    - `exists...By` (반환타입: boolean)
- **삭제**
    - `delete...By`, `remove...By` (반환타입: long, void)
- **Distinct**
    - `findDistinct`, `findMemberDistinctBy`
- **Limit**
    - `findFirst3`, `findTop`, `findTop3`

### 주요 필터 조건

- **비교**
    - `FindByPriceLessThan`, `FindByPriceGreaterThan`, `FindByPriceBetween`
- **문자열**
    - `FindByItemNameLike`, `FindByItemNameContaining` (Like 검색, % 자동 추가)
- **논리 연산**
    - `FindByItemNameAndPrice`, `FindByItemNameOrPrice`
- **정렬**
    - `FindByItemNameOrderByPriceDesc`

### @Query 직접 작성

- 메서드 이름으로 해결하기 어렵거나 쿼리가 너무 복잡해질 때 사용
- JPQL을 직접 작성하여 메서드에 매핑할 수 있음

    ```java
    @Query("select i from Item i where i.itemName like :itemName and i.price <= :price")
    List<Item> findItems(@Param("itemName") String itemName, @Param("price") Integer price);
    ```

<br/><br/>

## 실전 적용

### 동적 쿼리 문제

- 스프링 데이터 JPA는 동적 쿼리 처리가 약함
- 쿼리 메서드로 모든 경우의 수를 커버하려면 메서드가 너무 많이 필요함
- `Example`, `Specification` 기능이 있지만 실무에서 사용하기에는 복잡하고 한계가 있음 
- Querydsl과 함께 사용하는 것이 가장 권장됨

<br/><br/>

## 어댑터 패턴

### 문제 상황

- 기존 `ItemRepository` 인터페이스가 있고, 서비스 계층인 `ItemService`는 이를 의존하고 있음
- `SpringDataJpaItemRepository`는 `JpaRepository`를 상속받아야 하므로 기존 인터페이스 구조와 맞지 않음

### 어댑터 클래스 도입

- 기존 유지보수성을 위해 `ItemService` 코드를 변경하지 않고 구조를 맞추는 방법
- `JpaItemRepositoryV2`라는 어댑터 클래스를 생성하여 `ItemRepository`를 구현하고, 내부에서는 `SpringDataJpaItemRepository`를 사용하도록 구성함

    ```java
    @Repository
    @Transactional
    @RequiredArgsConstructor
    public class JpaItemRepositoryV2 implements ItemRepository {
        
        private final SpringDataJpaItemRepository repository;
        
        @Override
        public Item save(Item item) {
            return repository.save(item);
        }
        // ... 기타 메서드 위임
    }
    ```

### 장점

- **기존 코드 변경 없음**
    - 서비스 계층(`ItemService`)은 여전히 `ItemRepository` 인터페이스에만 의존하므로 코드 수정이 필요 없음
- **유연한 구조**
    - 구현 기술을 변경하더라도 어댑터만 교체하면 됨

<br/><br/>

## 설정 클래스

### SpringDataJpaConfig

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/config/SpringDataJpaConfig.java)

    ```java
    @Configuration
    @RequiredArgsConstructor
    public class SpringDataJpaConfig {
        
        private final SpringDataJpaItemRepository springDataJpaItemRepository;
        
        @Bean
        public ItemService itemService() {
            return new ItemServiceV1(itemRepository());
        }
        
        @Bean
        public ItemRepository itemRepository() {
            return new JpaItemRepositoryV2(springDataJpaItemRepository);
        }
    }
    ```

- `SpringDataJpaItemRepository`는 스프링 데이터 JPA가 자동으로 빈으로 등록하므로 주입받아서 사용 가능함

<br/><br/>

## 예외 변환

### 자동 예외 변환

- `Spring Data JPA`가 생성한 프록시 객체에는 이미 예외 변환 기능이 포함되어 있음
- 따라서 `@Repository` 애노테이션을 붙이지 않아도 JPA 예외가 Spring의 `DataAccessException`으로 자동 변환됨


<br/><br/>

## 연습 문제

1. 과거 EJB Entity Bean 기술이 개발자에게 복잡하고 사용하기 어렵다고 여겨져 POJO 기반 개발의 필요성이 대두된 주된 이유는 무엇일까요?

   a. 테스트하기 어렵고 코드 작성이 복잡했기 때문입니다.
   
   - EJB Entity Bean은 무거운 구조와 복잡성 때문에 테스트가 어렵고 개발 효율이 낮았음
   - 이 문제 때문에 순수 자바 객체(POJO) 기반 개발이 주목받게 되었음

2. Spring Data JPA가 개발자가 기본적인 CRUD(생성, 조회, 수정, 삭제) 작업을 위한 반복적인 코드를 작성하지 않도록 도와주는 주요 방식은 무엇인가요?

   a. Repository 인터페이스만 정의하면 구현체를 자동으로 생성해주기 때문입니다.
   
   - `Spring Data JPA`는 개발자가 `Repository` 인터페이스만 정의하고 `JpaRepository` 등을 상속받으면 됨
   - 동적 프록시 기술을 이용해 기본적인 CRUD 및 페이징, 정렬 기능의 구현체를 자동으로 만들어줌

3. Spring Data JPA에서 'findByNameAndPrice'처럼 메서드 이름을 기반으로 JPQL(Java Persistence Query Language) 쿼리를 자동으로 생성하고 실행하는 기능을 무엇이라고 부를까요?

   a. Query Method
   
   - `findBy`, `readBy`, `getBy` 등으로 시작하는 메서드 이름을 분석함
   - Spring Data JPA가 해당하는 JPQL 쿼리를 생성하고 실행하는 기능을 쿼리 메서드라고 함

4. Spring Data JPA를 사용하면서도 기반 기술인 JPA(Java Persistence API)를 깊이 이해하는 것이 왜 중요할까요?

   a. 대부분의 성능 문제는 JPA의 동작 방식과 관련 있기 때문입니다.
   
   - Spring Data JPA는 JPA를 편리하게 사용하기 위한 도구임
   - 복잡한 문제나 성능 이슈는 대부분 JPA의 동작 원리, 영속성 컨텍스트 등을 이해해야 해결할 수 있음

5. Spring Data JPA를 실제 프로젝트에 적용하기 위해 최소한으로 의존성에 추가해야 하는 Spring Boot Starter는 무엇일까요?

   a. spring-boot-starter-data-jpa
   
   - `spring-boot-starter-data-jpa` 의존성 하나만 추가하면 됨
   - JPA, Hibernate, Spring Data JPA, Spring JDBC 등 필요한 모든 데이터 접근 관련 라이브러리가 포함됨

<br/><br/>

## 요약 정리

- **스프링 데이터 JPA**는 JPA를 기반으로 하여 반복적인 CRUD 코드를 획기적으로 줄여주는 라이브러리임
- **JpaRepository** 인터페이스를 상속받으면 구현 클래스 없이도 바로 기본적인 데이터 접근 기능을 사용할 수 있음
- **쿼리 메서드** 기능을 통해 메서드 이름만으로도 JPQL 쿼리를 자동으로 생성할 수 있어 간단한 조회 로직 구현에 매우 효율적임
- 복잡한 쿼리는 **@Query** 애노테이션을 사용하여 직접 JPQL을 작성할 수 있음
- 기존 코드를 변경하지 않고 새로운 기술을 적용하기 위해 **어댑터 패턴**을 활용할 수 있음
- 스프링 데이터 JPA는 강력하지만 **동적 쿼리** 처리에는 한계가 있으므로, 실무에서는 **Querydsl**과 함께 사용하는 것이 일반적임
- **JPA에 대한 이해**가 바탕이 되어야 성능 최적화와 트러블슈팅이 가능하므로 기본 원리 학습이 필수적임

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
