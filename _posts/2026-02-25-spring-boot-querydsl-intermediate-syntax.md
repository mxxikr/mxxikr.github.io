---
title: '[실전! Querydsl] 중급 문법'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-25 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, jpql, syntax]
math: false
mermaid: false
---

# 중급 문법

- 김영한님의 실전! Querydsl 강의를 바탕으로 Querydsl의 프로젝션 반환 방식, 동적 쿼리 기법, 대규모 벌크 연산 처리 등 빈번히 활용되는 기능들을 정리함


<br/><br/>

## 프로젝션과 결과 반환

- 단일 및 다중 프로젝션
  - 대상이 하나일 때는 타입을 명확하게 지정할 수 있지만, 둘 이상일 때는 튜플이나 DTO로 결과를 반환받아야 함
  - 프로젝션 대상이 둘 이상일 때 `com.querydsl.core.Tuple`을 사용하여 각각의 필드에 접근할 수 있음

  ```java
  List<Tuple> result = queryFactory
      .select(member.username, member.age)
      .from(member)
      .fetch();

  for (Tuple tuple : result) {
      String username = tuple.get(member.username);
      Integer age = tuple.get(member.age);
      System.out.println("username=" + username);
      System.out.println("age=" + age);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

- 순수 JPA 방식의 한계
  - `new` 명령어를 통해 DTO 패키지명을 모두 적어야 하므로 코드가 지저분해지며, 생성자 방식만 지원하는 불편함이 있음

- 빈 생성(Bean Population) 3가지 방식
  - 프로퍼티 접근(`Projections.bean`)
    - Setter 메서드를 통해 객체 필드에 값을 차례대로 주입함

  ```java
  List<MemberDto> result = queryFactory
      .select(Projections.bean(MemberDto.class,
          member.username,
          member.age))
      .from(member)
      .fetch();
  ```

  - 필드 직접 접근(`Projections.fields`)
    - 필드에 값을 직접 주입하며, DTO와 엔티티의 필드명이 다를 경우 별칭(`as`)을 지정하여 매핑할 수 있음

  ```java
  List<UserDto> fetch = queryFactory
      .select(Projections.fields(UserDto.class,
          member.username.as("name"),
          ExpressionUtils.as(
              JPAExpressions
                  .select(memberSub.age.max())
                  .from(memberSub), "age")
      ))
      .from(member)
      .fetch();
  ```

  - 생성자 방식(`Projections.constructor`)
    - DTO 생성자에 파라미터를 전달하는 방식으로 동작하며, 지정한 파라미터의 타입과 순서가 일치해야 함

  ```java
  List<MemberDto> result = queryFactory
      .select(Projections.constructor(MemberDto.class,
          member.username,
          member.age))
      .from(member)
      .fetch();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

- `@QueryProjection` 활용
  - DTO 생성자에 어노테이션을 부착하여 Q파일을 생성하며, 파라미터 타입 및 순서 불일치 등의 오류를 컴파일 시점에 즉시 발견할 수 있음
  - 쿼리가 명료해지고 컴파일 시점에 타입 안정성을 확보할 수 있지만, 계층과 무관해야 할 DTO가 Querydsl에 의존하게 되는 단점이 있음

  ```java
  @Data
  public class MemberDto {
      private String username;
      private int age;

      public MemberDto() {}

      @QueryProjection
      public MemberDto(String username, int age) {
          this.username = username;
          this.age = age;
      }
  }

  // 사용
  List<MemberDto> result = queryFactory
      .select(new QMemberDto(member.username, member.age))
      .from(member)
      .fetch();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

<br/><br/>

## 동적 쿼리

- BooleanBuilder
  - 조건식을 누적할 수 있는 빌더 객체로, 다수의 조건을 분기 조합하여 동적으로 쿼리를 생성할 때 유용함
  - 파라미터 값이 유효할 때만 `BooleanBuilder`에 조건을 누적하는 방식으로 작성함

  ```java
  private List<Member> searchMember1(String usernameCond, Integer ageCond) {
      BooleanBuilder builder = new BooleanBuilder();

      if (usernameCond != null) {
          builder.and(member.username.eq(usernameCond));
      }
      if (ageCond != null) {
          builder.and(member.age.eq(ageCond));
      }

      return queryFactory
          .selectFrom(member)
          .where(builder)
          .fetch();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

- Where 다중 파라미터
  - `where()`의 파라미터로 `null`이 입력되면 해당 조건은 무시되므로 코드가 훨씬 간결해짐
  - 조건을 별도의 메서드로 분리하므로 쿼리의 가독성이 높아지고, 여러 조건 메서드를 조합하거나 재사용하기 쉬운 특징이 있음

  ```java
  private List<Member> searchMember2(String usernameCond, Integer ageCond) {
      return queryFactory
          .selectFrom(member)
          .where(usernameEq(usernameCond), ageEq(ageCond))
          .fetch();
  }

  private BooleanExpression usernameEq(String usernameCond) {
      return usernameCond != null ? member.username.eq(usernameCond) : null;
  }

  private BooleanExpression ageEq(Integer ageCond) {
      return ageCond != null ? member.age.eq(ageCond) : null;
  }

  private BooleanExpression allEq(String usernameCond, Integer ageCond) {
      return usernameEq(usernameCond).and(ageEq(ageCond));
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

<br/><br/>

## 수정 및 삭제 벌크 연산

- 대량 데이터 변경
  - 특정 조건에 일치하는 다수의 엔티티를 한 번에 수정하거나 삭제할 때 사용하며, 쿼리 한 번으로 대량의 데이터를 효율적으로 처리할 수 있음

  ```java
  // 수정
  long count = queryFactory
      .update(member)
      .set(member.username, "비회원")
      .where(member.age.lt(28))
      .execute();

  // 더하기 연산
  long count2 = queryFactory
      .update(member)
      .set(member.age, member.age.add(1))
      .execute();

  // 삭제
  long count3 = queryFactory
      .delete(member)
      .where(member.age.gt(18))
      .execute();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

- 영속성 컨텍스트 불일치 이슈
  - 벌크 연산은 영속성 컨텍스트를 무시하고 DB에 직접 쿼리를 실행하므로, 영속성 컨텍스트와 물리적 DB 간의 데이터 상태가 불일치할 수 있음
  - 해당 문제를 방지하기 위해 벌크 연산 실행 직후 영속성 컨텍스트를 비워(`em.flush()`, `em.clear()`) 데이터의 일관성을 유지해야 함

<br/><br/>

## SQL 함수 호출

- 공통 내장 함수 및 Dialect 함수 사용
  - 문자열 치환이나 대소문자 변환 같은 ANSI 표준 내장 함수들은 대부분 제공되므로 메서드 체이닝을 통해 간단하게 사용할 수 있음
  - 특정 데이터베이스 방언(Dialect)에만 존재하는 커스텀 함수의 경우에는 템플릿식을 사용하여 파라미터를 바인딩한 후 호출함

  ```java
  // function 직접 호출 (replace)
  String result = queryFactory
      .select(Expressions.stringTemplate(
          "function('replace', {0}, {1}, {2})",
          member.username, "member", "M"))
      .from(member)
      .fetchFirst();

  // QueryDSL 내장 메서드 사용 (lower)
  queryFactory
      .select(member.username)
      .from(member)
      .where(member.username.eq(member.username.lower()))
      .fetch();
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslIntermediateTest.java)

<br/><br/>

## 연습 문제

1. QueryDSL에서 여러 필드를 조회할 때, 도메인 엔티티 대신 결과 데이터를 담을 수 있는 두 가지 일반적인 방식은 무엇일까요?

    a. 튜플(Tuple)과 DTO(Data Transfer Object)

    - 여러 필드를 조회할 때 결과를 구조화하여 받기 위해 튜플이나 DTO를 주로 사용함
    - 튜플은 리포지토리 내부에서만 쓰고 DTO로 변환하여 전달하는 것이 권장됨

2. QueryDSL의 `@QueryProjection` 어노테이션을 사용한 DTO 프로젝션 방식이 `Projections.constructor` 방식에 비해 가지는 주요 장점은 무엇일까요?

    a. 쿼리와 DTO 필드 타입 불일치를 컴파일 시점에 확인 가능

    - `@QueryProjection`은 DTO 생성자 호출 코드를 Q-파일로 생성하며, 쿼리 인자와 DTO 생성자 파라미터의 타입 불일치 오류를 컴파일 단계에서 잡아줌

3. QueryDSL에서 동적 쿼리를 생성할 때, `BooleanBuilder` 방식 대신 `WHERE` 절에 다중 파라미터를 사용하는 방식의 장점은 무엇일까요?

    a. 파라미터가 `null`일 경우 해당 조건을 쿼리에서 자동으로 제외하여 코드가 간결함

    - Where 다중 파라미터 방식은 조건 파라미터가 null이면 해당 조건을 무시하여 코드가 깔끔해짐
    - BooleanBuilder는 null 체크 후 builder에 명시적으로 조건을 추가해야 함

4. JPA/QueryDSL에서 벌크 업데이트나 삭제 연산을 수행한 후, 영속성 컨텍스트의 상태와 데이터베이스 상태를 일치시키기 위해 보통 어떤 처리가 필요할까요?

    a. `em.flush()`와 `em.clear()` 호출

    - 벌크 연산은 영속성 컨텍스트를 우회하므로 DB와 컨텍스트의 데이터가 불일치할 수 있음. `em.flush()`로 DB 변경사항을 반영하고 `em.clear()`로 컨텍스트를 초기화해야 일관성이 유지됨

5. QueryDSL에서 `LOWER`나 `REPLACE`와 같은 SQL 함수를 쿼리 내에서 호출하려면 일반적으로 어떤 방법을 사용해야 할까요?

    a. QueryDSL에서 제공하는 함수 템플릿 또는 표현식 사용

    - QueryDSL은 `Expressions.stringTemplate`과 같은 템플릿이나 내장된 표현식을 통해 SQL 함수 호출을 지원함
    - 필요시 데이터베이스 Dialect에 함수를 등록할 수도 있음

<br/><br/>

## 요약 정리

- 다수의 필드를 쿼리할 때는 `Tuple`이나 DTO를 활용하며, `Projections` 객체를 통한 주입이나 `@QueryProjection` 어노테이션 활용을 통해 원하는 DTO 형태로 안전하게 결과를 반환받을 수 있음
- 파라미터 값에 따라 조건식을 생성하는 동적 쿼리를 위해 `BooleanBuilder`나 `where` 다중 파라미터를 활용하며, 다중 파라미터 환경에서는 조건 메서드를 선언하여 재사용성을 극대화할 수 있음
- 대량의 데이터를 일괄 변경하는 벌크 연산을 수행할 때는 수정 후 발생할 수 있는 데이터 불일치 이슈를 사전에 방지하기 위해 반드시 영속성 컨텍스트를 강제로 비워주어야 함
- 쿼리 내부에 대중적인 표준 로직을 적용할 때는 제공되는 내장 체인 함수를 사용하고, 각 데이터베이스의 특화된 전용 방언 SQL 함수는 조립형 문자열 템플릿 빌더에 파라미터를 넘겨주어 호출함

<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
