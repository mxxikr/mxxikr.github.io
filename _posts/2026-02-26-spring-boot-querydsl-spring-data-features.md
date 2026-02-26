---
title: '[실전! Querydsl] 스프링 데이터 JPA가 제공하는 Querydsl 기능'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-26 18:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, spring-data-jpa, querydsl-support, custom-repository]
math: false
mermaid: false
---

# 스프링 데이터 JPA가 제공하는 Querydsl 기능

- 김영한님의 실전! Querydsl 강의를 바탕으로 스프링 데이터 JPA가 제공하는 Querydsl 지원 기능들의 특징과 한계를 파악하고, 활용 가능한 커스텀 지원 클래스를 직접 구현하는 방법을 정리함


<br/><br/>

## 인터페이스 지원 - QuerydslPredicateExecutor

- QuerydslPredicateExecutor 인터페이스
  - 스프링 데이터 JPA가 제공하는 인터페이스로, 리포지토리에 추가하면 `Predicate`를 이용한 조회 기능을 바로 사용할 수 있음

  ```java
  public interface QuerydslPredicateExecutor<T> {
      Optional<T> findById(Predicate predicate);
      Iterable<T> findAll(Predicate predicate);
      long count(Predicate predicate);
      boolean exists(Predicate predicate);
  }
  ```

- 리포지토리 적용

  ```java
  interface MemberRepository extends JpaRepository<User, Long>, QuerydslPredicateExecutor<User> {
  }
  ```

- 사용 예시

  ```java
  Iterable result = memberRepository.findAll(member.age.between(10, 40).and(member.username.eq("member1")));
  ```

- 한계
  - 조인이 불가능하며 묵시적 조인은 가능하나 left join은 사용할 수 없음
  - 서비스 클래스가 Querydsl 구현 기술에 의존하게 됨
  - `Pageable`과 `Sort`는 지원하지만 복잡한 환경에서 사용하기에 한계가 명확함


<br/><br/>

## Querydsl Web 지원

- 동작 방식
  - 컨트롤러에서 HTTP 요청 파라미터를 자동으로 `Predicate`로 바인딩해주는 기능임

- 한계
  - 단순한 조건만 가능하며 조건 커스텀 기능이 복잡하고 명시적이지 않음
  - 컨트롤러가 Querydsl에 의존하게 되며 복잡한 환경에서 사용하기에 한계가 명확함


<br/><br/>

## 리포지토리 지원 - QuerydslRepositorySupport

- `QuerydslRepositorySupport`를 상속하여 사용자 정의 리포지토리를 구현할 수 있음

  ```java
  public class MemberRepositoryImpl extends QuerydslRepositorySupport {

      public MemberRepositoryImpl() {
          super(Member.class);
      }

      // from()으로 시작하는 쿼리
      public List<Member> findAllMembers() {
          return from(member)
                  .fetch();
      }

      // applyPagination()을 이용한 페이징 처리
      public Page<Member> applyPagination(MemberSearchCondition condition, Pageable pageable) {
          JPQLQuery<Member> query = from(member)
                  .leftJoin(member.team, team)
                  .where(
                      usernameEq(condition.getUsername()),
                      teamNameEq(condition.getTeamName()),
                      ageGoe(condition.getAgeGoe()),
                      ageLoe(condition.getAgeLoe()));

          JPQLQuery<Member> paginatedQuery = getQuerydsl().applyPagination(pageable, query);
          QueryResults<Member> results = paginatedQuery.fetchResults();

          return new PageImpl<>(results.getResults(), pageable, results.getTotal());
      }

      // EntityManager를 직접 사용하는 경우
      public List<Member> findByNativeQuery(String username) {
          EntityManager em = getEntityManager();
          return em.createQuery(
                  "select m from Member m where m.username = :username", Member.class)
                  .setParameter("username", username)
                  .getResultList();
      }
  }
  ```

- 장점
  - `applyPagination()`으로 페이징을 편리하게 변환할 수 있음
  - `EntityManager`를 제공하며 `from()`으로 쿼리를 시작할 수 있음

- 한계
  - Querydsl 3.x 버전을 기준으로 설계되어 있어 Querydsl 4.x의 `JPAQueryFactory`를 활용하는 최신 방식과 맞지 않음
  - `select()`로 시작할 수 없고 `from()`으로만 시작할 수 있음
  - `QueryFactory`를 제공하지 않으며 스프링 데이터 `Sort`가 정상 동작하지 않음


<br/><br/>

## Querydsl 지원 클래스 직접 만들기

- Querydsl4RepositorySupport
  - `QuerydslRepositorySupport`의 한계를 극복하기 위해 Querydsl 4.x에 맞는 지원 클래스를 직접 구현함
  - `select()`/`selectFrom()`으로 시작할 수 있고 스프링 데이터 페이징을 편리하게 변환하며 페이징과 카운트 쿼리를 분리할 수 있음
  - 스프링 데이터 `Sort`를 정상 지원하고 `EntityManager` 및 `QueryFactory`를 모두 제공함

  ```java
  @Repository
  public abstract class Querydsl4RepositorySupport {

      private final Class domainClass; // 대상 엔티티 클래스 타입
      private Querydsl querydsl; // 스프링 데이터 Sort 및 페이징 적용을 위한 헬퍼
      private EntityManager entityManager;
      private JPAQueryFactory queryFactory; // Querydsl 4.x 쿼리 생성 팩토리

      // 생성자에서 도메인 클래스를 필수로 전달받음
      public Querydsl4RepositorySupport(Class<?> domainClass) {
          Assert.notNull(domainClass, "Domain class must not be null!");
          this.domainClass = domainClass;
      }

      // 스프링 컨테이너가 EntityManager를 주입할 때 관련 객체를 함께 초기화함
      @Autowired
      public void setEntityManager(EntityManager entityManager) {
          Assert.notNull(entityManager, "EntityManager must not be null!");

          // 도메인 클래스의 엔티티 메타 정보를 조회함
          JpaEntityInformation entityInformation = JpaEntityInformationSupport.getEntityInformation(domainClass, entityManager);
          // Q타입 엔티티 경로를 생성함
          SimpleEntityPathResolver resolver = SimpleEntityPathResolver.INSTANCE;
          EntityPath path = resolver.createPath(entityInformation.getJavaType());

          this.entityManager = entityManager;
          // PathBuilder를 이용해 Querydsl 헬퍼를 생성함 (Sort 변환에 사용됨)
          this.querydsl = new Querydsl(entityManager, new PathBuilder<>(path.getType(), path.getMetadata()));
          // JPAQueryFactory를 직접 생성하여 select()로 시작할 수 있게 함
          this.queryFactory = new JPAQueryFactory(entityManager);
      }

      // select()로 쿼리를 시작할 수 있음 (QuerydslRepositorySupport에는 없는 기능)
      protected <T> JPAQuery<T> select(Expression<T> expr) {
          return getQueryFactory().select(expr);
      }

      // selectFrom()으로 엔티티 조회 쿼리를 시작할 수 있음
      protected <T> JPAQuery<T> selectFrom(EntityPath<T> from) {
          return getQueryFactory().selectFrom(from);
      }

      // content 쿼리만 전달하면 카운트 쿼리를 자동으로 실행함
      protected <T> Page<T> applyPagination(Pageable pageable,
              Function<JPAQueryFactory, JPAQuery> contentQuery) {
          JPAQuery jpaQuery = contentQuery.apply(getQueryFactory());
          List<T> content = getQuerydsl().applyPagination(pageable, jpaQuery).fetch();
          return PageableExecutionUtils.getPage(content, pageable, jpaQuery::fetchCount);
      }

      // content 쿼리와 count 쿼리를 분리하여 전달할 수 있음 (카운트 쿼리 최적화 시 사용함)
      protected <T> Page<T> applyPagination(Pageable pageable,
              Function<JPAQueryFactory, JPAQuery> contentQuery,
              Function<JPAQueryFactory, JPAQuery> countQuery) {
          JPAQuery jpaContentQuery = contentQuery.apply(getQueryFactory());
          List<T> content = getQuerydsl().applyPagination(pageable, jpaContentQuery).fetch();
          JPAQuery countResult = countQuery.apply(getQueryFactory());
          return PageableExecutionUtils.getPage(content, pageable, countResult::fetchCount);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/support/Querydsl4RepositorySupport.java)

- MemberTestRepository 사용
  - `Querydsl4RepositorySupport`를 상속하여 `select()`, `selectFrom()`, `applyPagination()` 등의 메서드를 활용한 실제 리포지토리를 구현함

  ```java
  @Repository
  public class MemberTestRepository extends Querydsl4RepositorySupport {

      public MemberTestRepository() {
          super(Member.class);
      }

      public List<Member> basicSelect() {
          return select(member)
                  .from(member)
                  .fetch();
      }

      public List<Member> basicSelectFrom() {
          return selectFrom(member)
                  .fetch();
      }

      // applyPagination 헬퍼 메서드 사용 (카운트 쿼리 자동)
      public Page<Member> applyPagination(MemberSearchCondition condition,
                                           Pageable pageable) {
          return applyPagination(pageable, contentQuery -> contentQuery
                  .selectFrom(member)
                  .leftJoin(member.team, team)
                  .where(
                      usernameEq(condition.getUsername()),
                      teamNameEq(condition.getTeamName()),
                      ageGoe(condition.getAgeGoe()),
                      ageLoe(condition.getAgeLoe())));
      }

      // applyPagination 헬퍼 메서드 사용 (카운트 쿼리 분리)
      public Page<Member> applyPagination2(MemberSearchCondition condition,
                                            Pageable pageable) {
          return applyPagination(pageable,
                  contentQuery -> contentQuery
                          .selectFrom(member)
                          .leftJoin(member.team, team)
                          .where(
                              usernameEq(condition.getUsername()),
                              teamNameEq(condition.getTeamName()),
                              ageGoe(condition.getAgeGoe()),
                              ageLoe(condition.getAgeLoe())),
                  countQuery -> countQuery
                          .selectFrom(member)
                          .leftJoin(member.team, team)
                          .where(
                              usernameEq(condition.getUsername()),
                              teamNameEq(condition.getTeamName()),
                              ageGoe(condition.getAgeGoe()),
                              ageLoe(condition.getAgeLoe())));
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/support/MemberTestRepository.java)

- applyPagination 두 가지 방식 비교
  - 파라미터 2개 방식은 content 쿼리만 전달하며 `PageableExecutionUtils.getPage()`가 카운트 쿼리 자동 생략 여부를 판단함
  - 파라미터 3개 방식은 content 쿼리와 count 쿼리를 분리하여 전달하며, 카운트 쿼리에서 조인을 최소화하는 등의 최적화가 필요한 경우에 사용함


<br/><br/>

## 연습 문제

1. `QuerydslPredicateExecutor` 인터페이스의 주요 한계는 무엇일까요?

    a. 조인 및 복잡한 조건 처리 어려움

    - 복잡한 조건이나 조인이 필요한 실제 환경에 적용하기 어려우며, 기능이 단순한 테이블에만 적합함

2. `@QuerydslPredicate`를 이용한 웹 지원 방식이 권장되지 않는 이유는 무엇일까요?

    a. 컨트롤러가 QueryDSL에 의존하게 됨

    - 서비스 계층이나 컨트롤러 등 클라이언트 코드가 특정 기술(QueryDSL)에 의존하게 만들어 유지보수가 어려워짐

3. `QuerydslRepositorySupport`의 주된 역할은 무엇일까요?

    a. 사용자 정의 리포지토리 베이스 클래스

    - 사용자 정의 리포지토리 기능을 QueryDSL로 편리하게 구현할 수 있도록 돕는 추상 클래스임

4. `QuerydslRepositorySupport`에서 정렬(Sort) 기능이 문제되는 이유는 무엇일까요?

    a. QueryDSL v3 설계 및 `select` 시작 불가

    - QueryDSL v3 방식(`from` 시작)에 맞춰져 있어 v4의 `select` 시작 및 스프링 데이터 정렬 통합이 어려움

5. 사용자 정의 QueryDSL 클래스 제작 시 이점은 무엇일까요?

    a. 정렬 지원 및 `select`/`selectFrom` 유연 사용

    - `QuerydslRepositorySupport`의 정렬 문제를 해결하고 QueryDSL v4처럼 `select`/`selectFrom`을 자유롭게 사용하여 유연한 쿼리가 가능함


<br/><br/>

## 요약 정리

- `QuerydslPredicateExecutor`는 `Predicate`를 통한 간편 조회를 제공하지만 조인이 불가능하고 서비스 계층이 Querydsl에 의존하게 되어 복잡한 환경에서 사용하기에 한계가 있음
- Querydsl Web 지원은 HTTP 파라미터를 자동으로 `Predicate`로 바인딩하지만 단순 조건만 가능하고 컨트롤러가 Querydsl에 의존하므로 거의 사용하지 않음
- `QuerydslRepositorySupport`는 Querydsl 3.x 기준으로 설계되어 `select()`로 시작할 수 없고 `Sort`를 정상 지원하지 않으므로 Querydsl 4.x 환경에서 직접 지원 클래스를 구현하여 사용하는 것을 권장함
- `Querydsl4RepositorySupport`는 `select()`/`selectFrom()` 시작, `Sort` 정상 지원, 페이징과 카운트 쿼리 분리 등을 모두 지원하며 `applyPagination()` 헬퍼 메서드를 통해 페이징 처리를 간결하게 구현할 수 있음


<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
