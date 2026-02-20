---
title: '[실전! 스프링 부트와 JPA 활용2] 다음으로 - 스프링 데이터 JPA와 QueryDSL'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-20 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, spring-data-jpa, querydsl, dynamic-query, repository]
math: false
mermaid: false
---

# 다음으로 - 스프링 데이터 JPA와 QueryDSL

- 김영한님의 실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 강의를 기반으로 순수 JPA 리포지토리의 반복 코드를 자동화하는 스프링 데이터 JPA와, 동적 쿼리를 자바 코드로 안전하게 작성할 수 있는 QueryDSL의 개념과 적용 방법을 정리함

<br/><br/>

## 전체 개요

- 순수 JPA 리포지토리의 반복 코드를 자동화하는 **스프링 데이터 JPA**와, 동적 쿼리의 한계를 해결하는 **QueryDSL**을 함께 사용하여 생산성을 향상시킴

<br/><br/>

## 스프링 데이터 JPA

### 기존 순수 JPA 리포지토리

```java
@Repository
@RequiredArgsConstructor
public class MemberRepository {

    private final EntityManager em;

    public void save(Member member) {
        em.persist(member);
    }

    public Member findOne(Long id) {
        return em.find(Member.class, id);
    }

    public List<Member> findAll() {
        return em.createQuery("select m from Member m", Member.class)
                .getResultList();
    }

    public List<Member> findByName(String name) {
        return em.createQuery("select m from Member m where m.name = :name", Member.class)
                .setParameter("name", name)
                .getResultList();
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/MemberRepositoryOld.java)

### 스프링 데이터 JPA 적용 후

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    // 메서드 이름만으로 JPQL 자동 생성
    // select m from Member m where m.name = :name
    List<Member> findByName(String name);
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/MemberRepository.java)

- `findOne()`은 스프링 데이터 JPA에서 `findById()`로 변경해야 함

### 변경 전후 비교

![변경 전후 비교](/assets/img/jpa/2026-02-20-spring-boot-jpa-spring-data-jpa-querydsl/comparison.png)

- **주요 특징**
    - `JpaRepository` 인터페이스를 상속하면 기본 CRUD가 모두 제공됨
    - `findByName`처럼 메서드 이름으로 JPQL 쿼리를 자동 생성함
    - 개발자는 인터페이스만 작성하면 되고, 구현체는 애플리케이션 실행 시점에 스프링 데이터 JPA가 주입함
    - 스프링 데이터 JPA는 JPA를 기반으로 동작하므로 JPA 자체를 잘 이해하는 것이 가장 중요함

<br/><br/>

## QueryDSL

### 동적 쿼리 문제

![동적 쿼리 문제](/assets/img/jpa/2026-02-20-spring-boot-jpa-spring-data-jpa-querydsl/dynamic-query.png)

- 실무에서는 조건에 따라 실행되는 쿼리가 달라지는 동적 쿼리를 많이 사용함
- 순수 JPQL로는 동적 쿼리를 작성하기 어렵고 오류가 런타임에서야 발견됨

### QueryDSL 적용 코드

```java
public List<Order> findAll(OrderSearch orderSearch) {
    QOrder order = QOrder.order;
    QMember member = QMember.member;

    return query
            .select(order)
            .from(order)
            .join(order.member, member)
            .where(
                statusEq(orderSearch.getOrderStatus()),
                nameLike(orderSearch.getMemberName())
            )
            .limit(1000)
            .fetch();
}

// null 반환 시 where 조건에서 자동 제외
private BooleanExpression statusEq(OrderStatus statusCond) {
    if (statusCond == null) {
        return null;
    }
    return order.status.eq(statusCond);
}

private BooleanExpression nameLike(String nameCond) {
    if (!StringUtils.hasText(nameCond)) {
        return null;
    }
    return member.name.like(nameCond);
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/OrderRepository.java)

### build.gradle 설정

```groovy
plugins {
}

dependencies {

    // Querydsl 추가
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jakarta"
    annotationProcessor "jakarta.annotation:jakarta.annotation-api"
    annotationProcessor "jakarta.persistence:jakarta.persistence-api"
}

// 빌드 시 Q클래스 생성 위치를 지정하는 설정
clean {
    delete file('src/main/generated')
}
```


### QueryDSL 장점

| 항목 | JPQL (문자열) | QueryDSL (자바 코드) |
|------|-------------|---------------------|
| 문법 오류 발견 | 런타임 | 컴파일 시점 |
| 동적 쿼리 | 문자열 조합으로 복잡 | `BooleanExpression`으로 간결 |
| 코드 자동완성 | 불가 | IDE 지원 |
| 코드 재사용 | 어려움 | 메서드로 재사용 가능 |
| DTO 조회 | `new` 명령어로 복잡 | `Projections`으로 깔끔 |

- QueryDSL은 JPQL을 코드로 만드는 빌더 역할을 함

<br/><br/>

## 요약 정리

- **스프링 데이터 JPA**는 `JpaRepository` 인터페이스를 상속하면 기본 CRUD가 자동 제공되고, 메서드 이름만으로 JPQL 쿼리를 자동 생성하여 반복 코드를 제거함
- **QueryDSL**은 동적 쿼리를 자바 코드로 작성하여 컴파일 시점에 오류를 발견할 수 있고, `BooleanExpression`을 활용해 조건을 조합하며 코드 재사용이 가능함
- QueryDSL에서 `null`을 반환하면 해당 `where` 조건이 자동으로 제외되어 동적 쿼리를 간결하게 구현할 수 있음
- 두 기술 모두 JPA 위에서 동작하므로 JPA에 대한 깊은 이해가 전제되어야 함

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화](https://www.inflearn.com/course/스프링부트-JPA-API개발-성능최적화)
