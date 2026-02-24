---
title: '[실전! Querydsl] 기본 문법'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-24 18:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, jpql, syntax]
math: false
mermaid: false
---

# 기본 문법

- 김영한님의 실전! Querydsl 강의를 바탕으로 Querydsl의 기본 검색 및 결과 정렬 기법부터 집합, 페치 조인, 서브쿼리까지 실무에 밀접한 기초 데이터 조작 문법들을 정리함


<br/><br/>

## JPQL과 Querydsl 비교

- 쿼리 특성 비교 요약

  - JPQL
    - 기본 서식이 정적 문자열 기반이라 파라미터 바인딩을 직접 처리해야 하며, 컴파일 시점이 아닌 런타임 실행 시점에서야 문법 오류가 발견되는 한계가 있음
  - Querydsl
    - 코드로 쿼리를 짜기 때문에 모든 파라미터가 자동 바인딩되고 IDE의 도움을 받아 컴파일 시점에 즉각적인 문법 오류 탐지가 가능한 강점이 존재함

- 테스트 기본 세팅 예시

  ```java
  @SpringBootTest
  @Transactional
  public class QuerydslBasicTest {

      @PersistenceContext
      EntityManager em;

      JPAQueryFactory queryFactory;

      @BeforeEach
      public void before() {
          queryFactory = new JPAQueryFactory(em);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

- JPAQueryFactory 동시성 구조
  - `JPAQueryFactory`를 필드에 두고 싱글톤으로 선언해도 동시성 문제가 발생하지 않음
  - 스프링이 트랜잭션 단위로 각 스레드에 독립적인 영속성 컨텍스트를 바인딩해 주기 때문에 멀티 스레드 환경에서도 안전하게 동작함

<br/><br/>

## Q-Type 및 기본 검색 조건

- Q클래스 인스턴스 사용
  - 같은 테이블을 조인해야 하는 경우가 아니라면 별칭을 직접 지정하는 `QMember qMember = new QMember("m");` 방식 대신, 기본 인스턴스인 `QMember.member`를 사용하는 것을 권장함
  - 기본 인스턴스를 Static Import 하여 코드를 간결하게 유지하는 것이 좋음

  ```java
  // import static study.querydsl.entity.QMember.*;

  @Test
  public void startQuerydsl3() {
      Member findMember = queryFactory
          .select(member)
          .from(member)
          .where(member.username.eq("member1"))
          .fetchOne();

      assertThat(findMember.getUsername()).isEqualTo("member1");
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

- 동적 쿼리에 유용한 파라미터 기반 검색
  - 논리 연산 메서드인 `.and()`를 계속 호출할 수도 있지만, `where` 절 내부에 파라미터를 콤마(`,`)로 나열하면 자연스럽게 AND 연산이 결합됨
  - 이때 전달된 파라미터가 `null`인 경우 검색 조건에서 무시하기 때문에, 특히 동적 쿼리를 작성할 때 코드가 한결 깔끔해짐

  ```java
  @Test
  public void searchAndParam() {
      List<Member> result1 = queryFactory
          .selectFrom(member)
          .where(
              member.username.eq("member1"),
              member.age.eq(10)
          )
          .fetch();

      assertThat(result1.size()).isEqualTo(1);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

<br/><br/>

## 결과 조회 및 부가 기능

- 결과 조회 메서드 특징 분리
  - `fetch()`
    - 리스트를 조회하며, 데이터가 없으면 빈 리스트를 반환함
  - `fetchOne()`
    - 단건을 조회할 때 사용하며, 결과가 없으면 `null`, 결과가 둘 이상이면 `NonUniqueResultException`을 발생시킴
  - `fetchFirst()`
    - `limit(1).fetchOne()`과 동일하게 동작하여 첫 번째 결과를 반환함
  - `fetchResults()`/`fetchCount()`
    - 페이징 정보나 총 데이터 개수를 산출할 때 사용하며, 카운트 쿼리가 추가로 실행됨

- 페이징 처리
  - 인덱스가 0부터 시작하는 `offset(1)`과 가져올 데이터 개수를 나타내는 `limit(2)`를 조합하여 간편하게 페이징 쿼리를 구성할 수 있음

  ```java
  @Test
  public void paging2() {
      QueryResults<Member> queryResults = queryFactory
          .selectFrom(member)
          .orderBy(member.username.desc())
          .offset(1)
          .limit(2)
          .fetchResults();

      assertThat(queryResults.getTotal()).isEqualTo(4);
      assertThat(queryResults.getLimit()).isEqualTo(2);
      assertThat(queryResults.getOffset()).isEqualTo(1);
      assertThat(queryResults.getResults().size()).isEqualTo(2);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

  - 복잡한 조인이 들어간 쿼리에서 `fetchResults()`를 사용하면 카운트 쿼리 또한 무거운 조인을 똑같이 타게 되어 성능 저하가 발생할 우려가 있음
  - 따라서 실무에서는 데이터 조회용 메인 쿼리와 총 데이터 개수를 세는 카운트 전용 쿼리를 분리해서 작성하는 방식을 권장함

- GroupBy와 Having을 활용한 집계 연산
  - `member.age.sum()`, `avg()`, `max()` 등의 기본 집계 함수를 손쉽게 사용할 수 있음
  - 연관된 엔티티(예: 팀 객체)의 속성을 기준으로 그룹화(`groupBy()`)하거나 원하는 조건으로 필터링(`having()`)하는 작업을 원활하게 지원함

  ```java
  @Test
  public void group() throws Exception {
      List<Tuple> result = queryFactory
          .select(team.name, member.age.avg())
          .from(member)
          .join(member.team, team)
          .groupBy(team.name)
          .fetch();
  }

  // having 예시 - 가격이 1000 초과인 그룹만 필터링
  queryFactory
      .selectFrom(item)
      .groupBy(item.price)
      .having(item.price.gt(1000))
      .fetch();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

<br/><br/>

## 조인 활용 및 페치 조인


- 세타 조인(연관관계가 없는 외부 조인)
  - 엔티티 간 연관관계가 없는 필드로 조인해야 할 때, `from(member, team)`처럼 `from` 절에 여러 엔티티를 나열하고 `where` 절에서 조인 조건을 지정할 수 있음
  - 이전에는 이런 방식에서 외부 조인(Outer Join)이 불가능했지만, 최신 하이버네이트에서는 `from(member).leftJoin(team).on(member.username.eq(team.name))`과 같이 ON 조인을 활용하여 외부 조인도 처리할 수 있게 됨

- ON 절을 활용한 조인의 두 가지 주요 목적
  - 조인 대상을 미리 필터링할 수 있음
    - 하지만 내부 조인(Inner Join)의 경우 `where` 절에서 필터링하는 것과 결과가 동일하므로, 외부 조인이 꼭 필요한 상황에서만 ON 절로 필터링하는 것을 권장함
  - 연관관계가 없는 엔티티들을 강제로 외부 조인할 때 사용함
    - 일반적인 조인(`leftJoin(member.team, team)`)과 달리, 조인 대상 엔티티 하나만 파라미터로 명시(`leftJoin(team)`)하는 것이 특징임

- 페치 조인(Fetch Join)
  - JPA 지연 로딩 때문에 발생하는 N+1 문제를 근본적으로 해결하는 기능으로, 일반 조인과 달리 연관된 엔티티 데이터를 한 번의 쿼리로 함께 조회하여 성능을 최적화함

  ```java
  @Test
  public void fetchJoinUse() throws Exception {
      em.flush();
      em.clear();

      Member findMember = queryFactory
          .selectFrom(member)
          .join(member.team, team).fetchJoin()   // fetchJoin() 추가
          .where(member.username.eq("member1"))
          .fetchOne();

      boolean loaded = emf.getPersistenceUnitUtil().isLoaded(findMember.getTeam());
      assertThat(loaded).as("페치 조인 적용").isTrue();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

<br/><br/>

## 서브쿼리와 기타 기능

- 서브쿼리 사용법과 한계
  - `JPAExpressions`를 사용하며, 메인 쿼리와의 충돌을 피하기 위해 서브쿼리 전용 Q타입 인스턴스(예: `QMember memberSub = new QMember("memberSub");`)를 별도로 생성하여 작성함

  ```java
  @Test
  public void subQueryGoe() throws Exception {
      QMember memberSub = new QMember("memberSub");

      List<Member> result = queryFactory
          .selectFrom(member)
          .where(member.age.goe(
              JPAExpressions
                  .select(memberSub.age.avg())
                  .from(memberSub)
          ))
          .fetch();

      assertThat(result).extracting("age").containsExactly(30, 40);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

  ![from절 서브쿼리 한계 우회 방안](/assets/img/jpa/2026-02-24-spring-boot-querydsl-basic-syntax/syntax-subquery.png)

  - 하이버네이트의 지원으로 `SELECT`와 `WHERE` 절에서는 서브쿼리를 사용할 수 있으나, JPQL과 Querydsl 모두 `FROM` 절에서의 서브쿼리(인라인 뷰)는 원천적으로 지원하지 않음
  - 이를 해결하려면 서브쿼리를 조인(Join)으로 변경하거나, 쿼리를 두 단계로 분리해서 실행하거나, 네이티브 SQL을 사용하는 등의 우회 방안을 고려해야 함

- Case 로직과 문자열 결합
  - `CaseBuilder()`를 사용하여 `SELECT` 구문 및 정렬 조건 등에서 데이터베이스 수준의 복잡한 로직(Case) 처리를 할 수 있음
  - `.concat()`을 이용해 문자열을 결합할 수 있으며, 이 때 숫자나 열거형 값은 `.stringValue()`를 명시하여 문자로 형변환해야 함

  ```java
  // member1_10
  String result = queryFactory
      .select(member.username.concat("_").concat(member.age.stringValue()))
      .from(member)
      .where(member.username.eq("member1"))
      .fetchOne();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslBasicTest.java)

<br/><br/>

## 연습 문제

1. Querydsl의 가장 큰 장점 중 하나로, JPQL과 비교하여 개발자가 얻을 수 있는 이점은 무엇일까요?

    a. 컴파일 시점에 쿼리 문법 오류 감지

    - Querydsl은 자바 코드로 쿼리를 작성하기 때문에 오타나 잘못된 필드 사용 등 쿼리 문법 오류를 컴파일 단계에서 미리 발견하여 개발 생산성을 높일 수 있음

2. Querydsl에서 생성된 Q-Type 인스턴스(예: QMember)를 사용할 때, 코드 가독성을 높이고 간결하게 표현하기 위해 주로 사용하는 기법은 무엇인가요?

    a. 정적 임포트(Static Import) 활용

    - Q-Type의 기본 인스턴스(예: `QMember.member`)를 정적 임포트하면 `QMember.member` 대신 `member`와 같이 직접 접근하여 코드를 간결하게 작성할 수 있음

3. Querydsl에서 `where` 절에 여러 조건을 나열할 때 (예: `where(cond1, cond2, cond3)`), 기본적으로 이 조건들은 어떤 논리 연산자로 연결되나요?

    a. AND

    - Querydsl의 `where` 절에 콤마(,)로 구분하여 여러 조건을 나열하면 기본적으로 AND 연산자로 연결되어 모든 조건을 만족하는 결과를 검색함

4. 쿼리 결과가 최대 1개일 것으로 예상될 때 사용하며, 결과가 없으면 `null`을, 결과가 2개 이상이면 예외(NonUniqueResultException)를 반환하는 Querydsl 결과 조회 메서드는 무엇인가요?

    a. fetchOne()

    - `fetchOne()`은 단일 결과를 가져올 때 사용하며, 결과가 없으면 `null`, 두 개 이상이면 예외가 발생하여 단일 결과 조회를 안전하게 처리할 때 유용함

5. Querydsl에서 페이징(paging) 기능(offset, limit)을 적용하려면 필수적으로 함께 사용해야 하는 절은 무엇인가요?

    a. ORDER BY

    - 페이징은 데이터의 특정 '페이지'를 가져오는 기능으로, 어떤 순서로 데이터를 정렬해서 가져올지 정의하는 `ORDER BY` 절이 필수적으로 필요함

6. Querydsl에서 연관된 엔티티(예: Member와 Team)를 N+1 문제를 방지하고 한 번의 쿼리로 함께 즉시 로딩(Eager Loading)하기 위해 사용하는 조인 기법은 무엇인가요?

    a. 페치 조인 (Fetch Join)

    - 페치 조인은 연관 관계에 있는 엔티티나 컬렉션을 처음부터 함께 조회하여 N+1 문제를 해결하고 애플리케이션 성능을 최적화하는 데 사용됨

7. JPA/JPQL 표준에 따라 Querydsl에서도 직접적으로 서브쿼리를 사용할 수 없는 주요 절은 무엇인가요?

    a. FROM 절

    - JPA/JPQL 표준은 `FROM` 절에 서브쿼리(인라인 뷰)를 사용하는 것을 허용하지 않으며, Querydsl 또한 JPQL 빌더로서 이 제한을 따름

8. Querydsl에서 집계 함수를 사용하여 쿼리 결과로 멤버들의 평균 나이를 계산하려면 어떤 표현식을 사용해야 하나요?

    a. member.age.avg()

    - `member.age.avg()`는 해당 쿼리 조건에 해당하는 모든 멤버 나이의 평균값을 계산하는 집계 함수이며, `sum`, `count`, `max`, `min` 등 다양한 함수가 제공됨

9. Querydsl에서 `LEFT JOIN` 사용 시, `ON` 절에 조건을 주는 것과 `WHERE` 절에 조건을 주는 것의 결과 차이에 대한 설명 중 옳은 것은 무엇인가요?

    a. ON 절은 조인 대상을 먼저 필터링하고, WHERE 절은 조인 완료 후 결과를 필터링함

    - `LEFT JOIN`에서 `ON` 절은 조인 실행 전 조인 대상을 먼저 필터링하므로 결과 집합의 크기에 영향을 주지만, `WHERE` 절은 조인이 완료된 결과를 나중에 필터링함. `INNER JOIN` 시에는 결과적으로 동일함

10. Querydsl 쿼리 결과에 특정 고정 문자열(상수)을 포함시키고 싶을 때 사용하는 표현식은 무엇인가요?

    a. constant()

    - Querydsl에서 쿼리 결과에 특정 고정 값을 포함시키려면 `constant()` 표현식을 사용하여 상수를 삽입할 수 있으며, 이는 JPQL에는 나타나지 않고 결과에 바로 들어감

<br/><br/>

## 요약 정리

- JPQL과 달리 Querydsl은 자바 코드로 쿼리를 작성하여 컴파일 시점에 구문 오류를 즉각 파악하고 파라미터 자동 바인딩의 이점을 제공함
- `fetch()`, `fetchOne()` 등의 결과 반환 메서드와 함께 페이징, 집합 함수, GroupBy 연산 등을 간결하고 직관적인 체이닝 기법으로 전개할 수 있음
- 연관 엔티티를 한 번의 쿼리로 인출하는 페치 조인(`fetchJoin()`)을 통해 N+1 성능 지연 문제를 손쉽게 타개할 수 있음
- JPA 표준 한계로 인해 `FROM` 절의 서브쿼리는 지원되지 않으므로, 조인 승격이나 쿼리 분리 방식의 우회 처리 노력이 필요함

<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
