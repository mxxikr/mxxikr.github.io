---
title: '[실전! Querydsl] 실무 활용 - 순수 JPA와 Querydsl'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-25 18:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, dynamic-query, repository]
math: false
mermaid: false
---

# 실무 활용 - 순수 JPA와 Querydsl

- 김영한님의 실전! Querydsl 강의를 바탕으로 순수 JPA 리포지토리 구성 방식과 Querydsl을 활용한 동적 쿼리, 성능 최적화, 그리고 API 컨트롤러 개발에 이르는 실무 적용 방법을 정리함

<br/><br/>

## 순수 JPA 리포지토리와 Querydsl


- 순수 JPA 리포지토리
  - `EntityManager`와 `JPAQueryFactory`를 함께 사용하여 순수 JPA와 Querydsl 방식을 병행할 수 있음

  ```java
  @Repository
  public class MemberJpaRepository {

      private final EntityManager em;
      private final JPAQueryFactory queryFactory;

      public MemberJpaRepository(EntityManager em) {
          this.em = em;
          this.queryFactory = new JPAQueryFactory(em);
      }

      public void save(Member member) {
          em.persist(member);
      }

      public Optional<Member> findById(Long id) {
          Member findMember = em.find(Member.class, id);
          return Optional.ofNullable(findMember);
      }

      public List<Member> findAll_Querydsl() {
          return queryFactory
                  .selectFrom(member)
                  .fetch();
      }

      public List<Member> findByUsername_Querydsl(String username) {
          return queryFactory
                  .selectFrom(member)
                  .where(member.username.eq(username))
                  .fetch();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberJpaRepository.java)

- JPAQueryFactory 스프링 빈 등록
  - `JPAQueryFactory`를 생성자에서 직접 만드는 대신 스프링 빈으로 등록하여 주입받아 사용할 수 있음

  ```java
  @Bean
  JPAQueryFactory jpaQueryFactory(EntityManager em) {
      return new JPAQueryFactory(em);
  }
  ```

  - 스프링이 주입해 주는 `EntityManager`는 실제 동작 시점에 트랜잭션 단위로 바인딩된 실제 영속성 컨텍스트를 찾아주는 프록시용 가짜 엔티티 매니저이기 때문에 동시성 문제는 발생하지 않음

<br/><br/>

## 동적 쿼리와 성능 최적화 조회

- 조회 최적화용 DTO 설계

  - 성능 최적화를 위해 필요한 필드만 선택하여 조회하는 전용 DTO를 활용함
  - `@QueryProjection`을 생성자에 사용하고 `compileQuerydsl`을 실행하면 Q타입 DTO가 생성되며, 컴파일 타임에 타입을 검증할 수 있어 안정적임

  ```java
  @Data
  public class MemberTeamDto {
      private Long memberId;
      private String username;
      private int age;
      private Long teamId;
      private String teamName;

      @QueryProjection
      public MemberTeamDto(Long memberId, String username, int age,
                           Long teamId, String teamName) {
          this.memberId = memberId;
          this.username = username;
          this.age = age;
          this.teamId = teamId;
          this.teamName = teamName;
      }
  }
  ```

- 검색 조건 DTO

  ```java
  @Data
  public class MemberSearchCondition {
      private String username;
      private String teamName;
      private Integer ageGoe;
      private Integer ageLoe;
  }
  ```

- BooleanBuilder를 사용한 동적 쿼리

  - `BooleanBuilder` 객체를 생성하고, 각 파라미터가 유효한지(null 또는 빈 문자열이 아닌지) 검사하여 조건을 `and()` 연산으로 누적하는 방식임

  ```java
  public List<MemberTeamDto> searchByBuilder(MemberSearchCondition condition) {
      BooleanBuilder builder = new BooleanBuilder();
      
      return queryFactory
              .select(new QMemberTeamDto(member.id, member.username, member.age, team.id, team.name))
              .from(member)
              .leftJoin(member.team, team)
              .where(builder)
              .fetch();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberJpaRepository.java)

- Where절 파라미터를 사용한 동적 쿼리
  - 조건을 별도의 메서드로 분리하여 `where` 절에 파라미터로 직접 전달하며, 콤마(`,`)는 AND 연산으로 치환됨
  - 메서드가 `null`을 반환하면 Querydsl이 해당 조건을 자동으로 무시하므로 편리함

  ```java
  public List<MemberTeamDto> search(MemberSearchCondition condition) {
      return queryFactory
              .select(new QMemberTeamDto(member.id, member.username, member.age, team.id, team.name))
              .from(member)
              .leftJoin(member.team, team)
              .where(
                  usernameEq(condition.getUsername()),
                  teamNameEq(condition.getTeamName()),
                  ageGoe(condition.getAgeGoe()),
                  ageLoe(condition.getAgeLoe())
              )
              .fetch();
  }

  private BooleanExpression usernameEq(String username) {
      return isEmpty(username) ? null : member.username.eq(username);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberJpaRepository.java)

- 동적 쿼리 방식 비교


  - Where 절 파라미터 방식은 쿼리 자체의 가독성이 뛰어나고, 분리된 조건 메서드를 다른 쿼리에서도 재사용할 수 있어  권장됨

<br/><br/>

## 조회 API 컨트롤러 개발

- 프로파일 분리 및 데이터 초기화

  - `application.yml` 설정으로 로컬(`local`)과 테스트(`test`) 프로파일을 분리하여 각 환경에 맞는 데이터를 활용함
  - `@Profile("local")`을 적용한 초기화 컴포넌트(`InitMember`)를 구성하여, 서버 기동 시 샘플 데이터를 자동으로 삽입하도록 구현함

  ```java
  @Profile("local")
  @Component
  @RequiredArgsConstructor
  public class InitMember {

      private final InitMemberService initMemberService;

      @PostConstruct
      public void init() {
          initMemberService.init();
      }

      @Component
      static class InitMemberService {
          @PersistenceContext
          EntityManager em;

          @Transactional
          public void init() {
              Team teamA = new Team("teamA");
              Team teamB = new Team("teamB");
              em.persist(teamA);
              em.persist(teamB);

              for (int i = 0; i < 100; i++) {
                  Team selectedTeam = i % 2 == 0 ? teamA : teamB;
                  em.persist(new Member("member" + i, i, selectedTeam));
              }
          }
      }
  }
  ```

- 조회 API 연동 흐름

  ```java
  @RestController
  @RequiredArgsConstructor
  public class MemberController {

      private final MemberJpaRepository memberJpaRepository;

      @GetMapping("/v1/members")
      public List<MemberTeamDto> searchMemberV1(MemberSearchCondition condition) {
          return memberJpaRepository.search(condition);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/controller/MemberController.java)

<br/><br/>

## 연습 문제

1. 순수 JPQL 대비 Querydsl 사용 시 얻을 수 있는 주요 장점은 무엇일까요?

    a. 컴파일 시점에 타입 안전성을 확보할 수 있다

    - Querydsl은 자바 코드로 쿼리를 작성하기 때문에 컴파일 시점에 타입 오류를 잡아내어 런타임 오류 가능성을 줄여줌

2. JPA 환경에서 Querydsl 쿼리를 생성하고 실행하기 위해 가장 주요한 객체는 무엇인가요?

    a. JPAQueryFactory

    - Querydsl을 사용하여 JPA 쿼리를 작성하려면 EntityManager를 인자로 받아 JPAQueryFactory 객체를 생성해야 하며, 이 객체를 통해 실제 쿼리를 구성하고 실행함

3. Querydsl로 동적 쿼리(선택적 검색 조건)를 구현할 때, 강의에서 권장하는 WHERE 절 구성 방식은 무엇인가요?

    a. WHERE 절에 Boolean Expression 파라미터를 사용한다

    - WHERE 절에 Boolean Expression 형태의 파라미터를 받아 동적으로 조건을 조합하는 방식이 코드 가독성, 재사용성, 그리고 SQL 유사성 면에서 더 뛰어나 권장됨

4. 복잡한 조회 쿼리의 결과로 엔티티 대신 DTO를 사용하는 것이 성능 최적화에 도움이 되는 이유는 무엇일까요?

    a. 필요한 데이터 필드만 선택적으로 조회하기 때문

    - DTO는 엔티티의 모든 필드 대신 조회에 필요한 특정 필드만 담도록 설계되므로 데이터 전송량을 줄여 성능을 개선할 수 있음

5. Spring 애플리케이션에서 개발, 테스트 등 환경별로 다른 설정이나 데이터 초기화 로직을 적용하기 위해 사용되는 기능은 무엇인가요?

    a. @Profile

    - @Profile 어노테이션을 사용하면 특정 프로파일(예: 'local', 'test')이 활성화되었을 때만 해당 빈(Bean)이 등록되거나 설정이 적용되도록 하여 환경별 구분을 쉽게 할 수 있음

<br/><br/>

## 요약 정리


- `JPAQueryFactory`를 스프링 빈으로 등록하여 사용하면 코드가 간결해지며 동시성 문제 없이 영속성 컨텍스트에 접근할 수 있음
- `@QueryProjection`을 활용한 최적화 DTO 및 검색 조건 객체(`MemberSearchCondition`)를 기반으로 타입 안정성이 높은 동적 쿼리를 작성함
- 동적 쿼리 구현 시, `BooleanBuilder` 방식보다 `where` 다중 파라터를 활용하는 방식이 가독성과 메서드 재사용성 측면에서 더 적합함
- 프로파일(`@Profile`) 설정을 분리하여 로컬 개발 환경에서만 작동하는 자동 데이터 초기화 컴포넌트를 구성함으로써 API 테스트 편의성을 개선함

<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
