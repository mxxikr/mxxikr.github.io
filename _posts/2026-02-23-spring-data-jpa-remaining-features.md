---
title: '[실전! 스프링 정규 데이터 JPA] 나머지 기능들'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-23 13:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, spring-data-jpa, specifications, qbe, projections, native-query]
math: false
mermaid: false
---

# 나머지 기능들

- 김영한님의 실전! 스프링 데이터 JPA 강의를 기반으로 Specifications, Query By Example, Projections, Native Query 등 스프링 데이터 JPA가 제공하는 기타 부가 기능들의 특징과 활용 권장도를 정리함

<br/><br/>

## Specifications (명세)

- 도메인 주도 설계(DDD)의 Specification 개념을 JPA Criteria를 이용해 구현한 기능으로, 각 검색 조건을 술어(predicate) 단위로 정의하여 `and`, `or`, `not` 등으로 엮어내는 컴포지트 패턴을 띔

  ![Specifications 상속과 조합 흐름](/assets/img/jpa/2026-02-24-spring-data-jpa-remaining-features/remaining-spec.png)

- 설정 및 사용
  - 리포지토리에 `JpaSpecificationExecutor` 인터페이스를 추가로 상속받고, 구체적 조건들을 명시하는 별도의 Spec 클래스를 선언하여 사용함

  ```java
  public class MemberSpec {

      public static Specification<Member> teamName(final String teamName) {
          return (root, query, builder) -> {
              if (StringUtils.isEmpty(teamName)) {
                  return null;
              }
              Join<Member, Team> t = root.join("team", JoinType.INNER);
              return builder.equal(t.get("name"), teamName);
          };
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberSpec.java)

- 한계점
  - 기반 기술인 JPA Criteria 자체가 코드 작성과 해석이 까다로워 가독성이 현저히 떨어지므로 유지보수가 어려움

<br/><br/>

## Query By Example

- 특정 검색 템플릿(Probe)이 될 도메인 객체를 생성하고 여기에 원하는 값을 채워 넣은 뒤 이를 통해 데이터베이스를 릴레이 조회하는 기술 구조임

  ![Query By Example 조합 흐름](/assets/img/jpa/2026-02-24-spring-data-jpa-remaining-features/remaining-qbe.png)

- 설정 및 사용
  - 실제 엔티티에 검색할 값을 대입(Probe)하고 `ExampleMatcher`를 적용해 무시할 필드를 제외시킨 후 `Example` 템플릿으로 감싸서 리포지토리에 전달함

  ```java
  Member member = new Member("m1");
  Team team = new Team("teamA");
  member.setTeam(team);

  // ExampleMatcher를 통해 age 필드는 검사에서 배제
  ExampleMatcher matcher = ExampleMatcher.matching()
          .withIgnorePaths("age");

  Example<Member> example = Example.of(member, matcher);

  List<Member> result = memberRepository.findAll(example);
  ```

- 장점과 단점
  - 도메인 객체를 기반으로 동적 쿼리를 쉽고 직관적으로 풀어낼 수 있고 RDBMS 및 NoSQL 간의 추상화가 용이함
  - 하지만 OUTER JOIN과 같은 복잡한 조인이 불가하며 `=`와 문자열 포함(starts/contains 등) 위주의 단순한 조건부 판별만 지원함

<br/><br/>

## Projections

- 테이블의 모든 필드를 한꺼번에 조회하지 않고 단일 컴포넌트나 화면 구성에 딱 필요한 특정 필드들로만 추려서 맵핑해 오는 기술임

  ![Projections 반환 객체 종류](/assets/img/jpa/2026-02-24-spring-data-jpa-remaining-features/remaining-projections-types.png)

- 인터페이스 기반 (Closed Projections)
  - 원하는 반환 속성을 getter 명세로 선언해 두면 스프링 데이터 JPA가 실행 시점에 동적 프록시 구현체를 만들어 줌
  - SELECT 절에서 정확히 요청한 컬럼만 조회하도록 최적화가 정상적으로 일어남

  ```java
  public interface UsernameOnly {
      String getUsername();
  }
  ```

- 인터페이스 기반 (Open Projections)
  - 스프링 임의 문법인 SpEL(Spring Expression Language)을 적용하여 복수의 필드를 엮어 조합 결과를 얻어냄
  - 다만 계산을 위해 일단 데이터베이스에서 엔티티의 모든 데이터를 전부 꺼낸 다음 가공을 시작하므로, 필요한 컬럼만 조달하는 쿼리 최적화는 제공되지 않음

  ```java
  public interface UsernameOnly {
      @Value("#{target.username + ' ' + target.age + ' ' + target.team.name}")
      String getUsername();
  }
  ```

- 클래스 기반 Projections (DTO)
  - 인터페이스 대신 정확한 구체 클래스(DTO)를 선언해두면, 생성자의 매개변수 이름과 매칭하여 값을 넣어주는 형태로 동작함

  ```java
  public class UsernameOnlyDto {
      private final String username;

      public UsernameOnlyDto(String username) {
          this.username = username;
      }

      public String getUsername() {
          return username;
      }
  }
  ```

- 중첩 구조와 최적화 한계선

  ![Projections 조인 시 최적화 한계](/assets/img/jpa/2026-02-24-spring-data-jpa-remaining-features/remaining-projections-opt.png)

  - 단순하게 `Member` 같이 기준이 되는 Root 엔티티에서 데이터를 발췌할 때는 최적화가 완벽하게 발동함
  - 하지만 연관 엔티티(`Team` 등) 너머 깊이 탐색하는 구조가 될 경우, 연관 관계 탐색은 항상 `LEFT OUTER JOIN`을 유발하며 지연 없이 모든 연관 데이터를 조기 추출해버려 SELECT 최적화가 붕괴됨

<br/><br/>

## 네이티브 쿼리 (Native Query)

- ORM 구조적 사고로 풀기 아주 어려운 복잡하고 독창적인 특정 DBMS 쿼리문을 소스코드에 그대로 기재할 때 사용하나, 될 수 있으면 안 쓰는 것을 목표로 해야 함

  ![네이티브 쿼리 변환 방식](/assets/img/jpa/2026-02-24-spring-data-jpa-remaining-features/remaining-native.png)

- 제약 사항
  - Spring Data의 페이징 `Sort` 파라미터가 쿼리 구조에 따라 정상 작동을 보장하지 못함
  - JPQL과 달리 시동 시점(로딩)에서 애플리케이션의 문법 오류 파악이 원천적으로 불가하며, 오직 정적 문자열로만 짜야 해서 동적 쿼리를 꾸밀 수가 없음

- 기본 사용
  - 쿼리에 `nativeQuery = true`를 세팅하여 호출함

  ```java
  public interface MemberRepository extends JpaRepository<Member, Long> {

      @Query(value = "select * from member where username = ?", nativeQuery = true)
      Member findByNativeQuery(String username);
  }
  ```

- Projections 활용에 의한 결과 반환 방안
  - 네이티브 반환 형식을 어정쩡하게 맞추지 않고 Spring Data의 인터페이스 기반 Projections와 버무리면 DTO화가 손쉬워짐
  - 다만 동적 네이티브 쿼리가 정말로 급박하다면 JdbcTemplate이나 MyBatis 등 기존에 친숙한 JDBC 계층 라이브러리를 직접 끌어쓰는 편이 안전함

  ```java
  @Query(
      value = "SELECT m.member_id as id, m.username, t.name as teamName " +
              "FROM member m left join team t ON m.team_id = t.team_id",
      countQuery = "SELECT count(*) from member",
      nativeQuery = true
  )
  Page<MemberProjection> findByNativeProjection(Pageable pageable);
  ```

<br/><br/>

## 연습 문제

1. JPA에서 Projections를 사용하는 주된 목적은 무엇인가요?

    a. 엔티티의 특정 필드만 선택하여 조회

    - Projections는 데이터베이스에서 엔티티의 모든 필드 대신 필요한 일부 필드만 선택하여 가져와 조회 성능을 최적화하는 데 사용됨. DTO나 인터페이스 형태로 결과를 받을 수 있음

2. 도메인 객체 인스턴스를 검색 조건의 템플릿으로 활용하여 쿼리하는 Spring Data JPA의 기능은 무엇인가요?

    a. Query By Example

    - Query By Example은 특정 필드에 값이 설정된 도메인 객체를 예제로 제공하여 해당 값과 일치하는 객체를 쉽게 검색할 수 있도록 돕는 기능임

3. JPA Criteria 기반의 Specifications 사용 시 강의에서 주로 제기된 단점으로 언급된 것은 무엇일까요?

    a. 복잡성과 가독성 저하

    - Specifications는 복잡한 동적 쿼리를 구성할 수 있지만, 기반 기술인 JPA Criteria가 사용하기 어렵고 코드가 복잡해져 가독성과 유지보수성이 떨어진다는 단점이 있음

4. Spring Data JPA에서 Native Query(`@Query(nativeQuery=true)`) 사용 시, 페이징 기능을 활용하려면 보통 어떻게 해야 하나요?

    a. 별도의 count 쿼리를 함께 작성해야 함

    - Native Query로 Pageable을 사용하려면, Spring Data JPA가 총 데이터 수를 알 수 있도록 실제 결과를 가져오는 쿼리와 별개로 count 쿼리를 명시적으로 작성해줘야 함

5. 복잡하고 동적인 쿼리 조건 구성 및 프로젝션 처리에 있어, 강의에서 Specifications, Query By Example, Native Query의 대안으로 가장 많이 추천된 기술은 무엇일까요?

    a. Querydsl

    - 강의 전반에 걸쳐 Specifications, QBE, Projections, Native Query의 한계가 계속 언급되었고, 복잡하거나 동적인 쿼리 및 프로젝션 실무에 Querydsl이 가장 유연하고 강력한 대안으로 추천됨

<br/><br/>

## 요약 정리

- Specifications는 JPA Criteria를 기틀로 다양한 조건을 블록 조립하듯 맞추어 내지만 구조가 모호해 실무에서 잘 쓰이지 않으며 Querydsl 채택이 대체로 선호됨
- 도메인 껍데기 자체로 원하는 값을 끼워 찾는 Query By Example 역시 편리성을 띄지만 연관 데이터의 OUTER JOIN을 할 수 없는 단점이 너무 뚜렷해 한계가 명확함
- 엔티티의 일부 컬럼만 추출하는 Projections는 단일 테이블 기반의 최적화에 탁월한 효과를 보이나 연관 엔티티와의 조인 발생 시점부터는 최적화가 엉켜버리므로 조심스러운 활용이 요구됨
- 네이티브 쿼리는 복잡계의 마지노선으로만 여기며 동적 쿼리는 절대 지원하지 않기 때문에 어쩔 수 없이 직관적인 처리가 급할 땐 JdbcTemplate 등 우회망을 쓰는 것이 차라리 안전함

<br/><br/>

## Reference

- [실전! 스프링 데이터 JPA](https://www.inflearn.com/course/스프링-데이터-JPA-실전)
