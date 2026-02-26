---
title: '[실전! Querydsl] 실무 활용 - 스프링 데이터 JPA와 Querydsl'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-26 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, spring-data-jpa, paging, custom-repository]
math: false
mermaid: false
---

# 실무 활용 - 스프링 데이터 JPA와 Querydsl

- 김영한님의 실전! Querydsl 강의를 바탕으로 스프링 데이터 JPA 환경에서 Querydsl을 결합한 사용자 정의 리포지토리 구성, 페이징 최적화, API 컨트롤러 연동 및 동적 정렬 처리 방법을 정리함


<br/><br/>

## 스프링 데이터 JPA 리포지토리로 변경

- 스프링 데이터 JPA 인터페이스 전환
  - 순수 JPA 리포지토리(`MemberJpaRepository`)를 스프링 데이터 JPA 인터페이스 방식으로 전환하여 기본 CRUD와 쿼리 메서드를 활용할 수 있음

  ```java
  public interface MemberRepository extends JpaRepository<Member, Long> {
      List<Member> findByUsername(String username);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberRepository.java)

- 기본 테스트

  ```java
  @SpringBootTest
  @Transactional
  class MemberRepositoryTest {

      @Autowired EntityManager em;
      @Autowired MemberRepository memberRepository;

      @Test
      public void basicTest() {
          Member member = new Member("member1", 10);
          memberRepository.save(member);

          Member findMember = memberRepository.findById(member.getId()).get();
          assertThat(findMember).isEqualTo(member);

          List<Member> result1 = memberRepository.findAll();
          assertThat(result1).containsExactly(member);

          List<Member> result2 = memberRepository.findByUsername("member1");
          assertThat(result2).containsExactly(member);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/repository/MemberRepositoryTest.java)

- 인터페이스 방식의 한계
  - 스프링 데이터 JPA 인터페이스만으로는 Querydsl을 이용한 복잡한 동적 쿼리를 작성할 수 없으므로 사용자 정의 리포지토리가 필요함


<br/><br/>

## 사용자 정의 리포지토리

- 사용자 정의 인터페이스(`MemberRepositoryCustom`)를 작성하고, 이를 구현하는 클래스(`MemberRepositoryImpl`)를 생성한 뒤, 스프링 데이터 리포지토리(`MemberRepository`)에 사용자 정의 인터페이스를 상속시키는 3단계 절차로 구성함

1. 사용자 정의 인터페이스 작성

    ```java
    public interface MemberRepositoryCustom {
        List<MemberTeamDto> search(MemberSearchCondition condition);
        Page<MemberTeamDto> searchPageSimple(MemberSearchCondition condition, Pageable pageable);
        Page<MemberTeamDto> searchPageComplex(MemberSearchCondition condition, Pageable pageable);
    }
    ```

2. 사용자 정의 인터페이스 구현
    - `JPAQueryFactory`를 활용하여 Querydsl 쿼리를 작성하며, 검색 조건을 `BooleanExpression` 메서드로 분리하여 재사용성을 높임

    ```java
    public class MemberRepositoryImpl implements MemberRepositoryCustom {

        private final JPAQueryFactory queryFactory;

        public MemberRepositoryImpl(EntityManager em) {
            this.queryFactory = new JPAQueryFactory(em);
        }

        @Override
        public List<MemberTeamDto> search(MemberSearchCondition condition) {
            return queryFactory
                    .select(new QMemberTeamDto(
                            member.id, member.username, member.age, team.id, team.name))
                    .from(member)
                    .leftJoin(member.team, team)
                    .where(
                        usernameEq(condition.getUsername()),
                        teamNameEq(condition.getTeamName()),
                        ageGoe(condition.getAgeGoe()),
                        ageLoe(condition.getAgeLoe()))
                    .fetch();
        }

        private BooleanExpression usernameEq(String username) {
            return isEmpty(username) ? null : member.username.eq(username);
        }

        private BooleanExpression teamNameEq(String teamName) {
            return isEmpty(teamName) ? null : team.name.eq(teamName);
        }

        private BooleanExpression ageGoe(Integer ageGoe) {
            return ageGoe == null ? null : member.age.goe(ageGoe);
        }

        private BooleanExpression ageLoe(Integer ageLoe) {
            return ageLoe == null ? null : member.age.loe(ageLoe);
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberRepositoryImpl.java)

3. 스프링 데이터 리포지토리에 상속 추가

    ```java
    public interface MemberRepository extends JpaRepository<Member, Long>, MemberRepositoryCustom {
        List<Member> findByUsername(String username);
    }
    ```

- 커스텀 리포지토리 테스트

  ```java
  @Test
  public void searchTest() {
      Team teamA = new Team("teamA");
      Team teamB = new Team("teamB");
      em.persist(teamA);
      em.persist(teamB);

      em.persist(new Member("member1", 10, teamA));
      em.persist(new Member("member2", 20, teamA));
      em.persist(new Member("member3", 30, teamB));
      em.persist(new Member("member4", 40, teamB));

      MemberSearchCondition condition = new MemberSearchCondition();
      condition.setAgeGoe(35);
      condition.setAgeLoe(40);
      condition.setTeamName("teamB");

      List<MemberTeamDto> result = memberRepository.search(condition);
      assertThat(result).extracting("username").containsExactly("member4");
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/repository/MemberRepositoryTest.java)


<br/><br/>

## 스프링 데이터 페이징 활용 - Querydsl 페이징 연동

- 페이징 방식 개요
  - 페이징 방식은 `searchPageSimple`(전체 카운트를 한 번에 조회하는 `fetchResults` 사용 방식)과 `searchPageComplex`(데이터 조회와 카운트 쿼리를 별도로 분리하는 방식) 두 가지로 나뉨

- fetchResults를 사용한 단순 페이징
  - `fetchResults()`는 내용 쿼리와 카운트 쿼리를 실제로 2번 실행하며, 카운트 쿼리 실행 시 불필요한 `ORDER BY`는 자동으로 제거됨

  ```java
  @Override
  public Page<MemberTeamDto> searchPageSimple(MemberSearchCondition condition,
                                               Pageable pageable) {
      QueryResults<MemberTeamDto> results = queryFactory
              .select(new QMemberTeamDto(
                      member.id, member.username, member.age, team.id, team.name))
              .from(member)
              .leftJoin(member.team, team)
              .where(
                  usernameEq(condition.getUsername()),
                  teamNameEq(condition.getTeamName()),
                  ageGoe(condition.getAgeGoe()),
                  ageLoe(condition.getAgeLoe()))
              .offset(pageable.getOffset())
              .limit(pageable.getPageSize())
              .fetchResults();

      List<MemberTeamDto> content = results.getResults();
      long total = results.getTotal();

      return new PageImpl<>(content, pageable, total);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberRepositoryImpl.java)

- 데이터 조회와 카운트 쿼리를 분리한 페이징
  - 카운트 쿼리에서 조인을 줄이거나 단순화할 수 있는 경우, 이 방식으로 분리하면 성능을 크게 개선할 수 있음

  ```java
  @Override
  public Page<MemberTeamDto> searchPageComplex(MemberSearchCondition condition, Pageable pageable) {
      List<MemberTeamDto> content = queryFactory
              .select(new QMemberTeamDto(
                      member.id, member.username, member.age, team.id, team.name))
              .from(member)
              .leftJoin(member.team, team)
              .where(
                  usernameEq(condition.getUsername()),
                  teamNameEq(condition.getTeamName()),
                  ageGoe(condition.getAgeGoe()),
                  ageLoe(condition.getAgeLoe()))
              .offset(pageable.getOffset())
              .limit(pageable.getPageSize())
              .fetch();

      long total = queryFactory
              .select(member)
              .from(member)
              .leftJoin(member.team, team)
              .where(
                  usernameEq(condition.getUsername()),
                  teamNameEq(condition.getTeamName()),
                  ageGoe(condition.getAgeGoe()),
                  ageLoe(condition.getAgeLoe()))
              .fetchCount();

      return new PageImpl<>(content, pageable, total);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberRepositoryImpl.java)

- 두 방식 비교
  - `searchPageSimple`은 `fetchResults`를 호출하여 내용 쿼리와 카운트 쿼리를 자동 실행하며, 카운트 쿼리에서 ORDER BY를 자동 제거하여 편리함
  - `searchPageComplex`는 내용 쿼리와 카운트 쿼리를 직접 작성하여 카운트 쿼리에서 불필요한 JOIN을 제거할 수 있어 성능 최적화에 유리함


<br/><br/>

## CountQuery 최적화

- `PageableExecutionUtils.getPage()` 활용
  - `PageableExecutionUtils.getPage()`를 사용하면 카운트 쿼리가 불필요한 경우 실행을 생략할 수 있음
  - `new PageImpl<>(content, pageable, total)` 방식은 항상 카운트 쿼리를 실행하지만, `PageableExecutionUtils.getPage()`는 스프링 데이터 라이브러리가 카운트 생략 가능 여부를 판단하여 불필요한 쿼리를 줄여줌

  ```java
  JPAQuery<Member> countQuery = queryFactory
          .select(member)
          .from(member)
          .leftJoin(member.team, team)
          .where(
              usernameEq(condition.getUsername()),
              teamNameEq(condition.getTeamName()),
              ageGoe(condition.getAgeGoe()),
              ageLoe(condition.getAgeLoe()));

  return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchCount);
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/repository/MemberRepositoryImpl.java)

- 카운트 쿼리 생략 조건
  - 첫 페이지이면서 컨텐츠 크기가 페이지 크기보다 작은 경우 카운트 쿼리를 생략함
  - 마지막 페이지이면서 offset과 컨텐츠 크기로 전체 크기를 계산할 수 있는 경우 카운트 쿼리를 생략함
  - 위 조건에 해당하지 않으면 카운트 쿼리를 실행함


<br/><br/>

## 컨트롤러 개발

- 컨트롤러 전체 구조
  - `/v1/members`는 비페이징 검색(`MemberJpaRepository`), `/v2/members`는 `searchPageSimple`(`fetchResults` 방식), `/v3/members`는 `searchPageComplex`(쿼리 분리 방식)으로 각각 구성됨

  ```java
  @RestController
  @RequiredArgsConstructor
  public class MemberController {

      private final MemberJpaRepository memberJpaRepository;
      private final MemberRepository memberRepository;

      @GetMapping("/v1/members")
      public List<MemberTeamDto> searchMemberV1(MemberSearchCondition condition) {
          return memberJpaRepository.search(condition);
      }

      @GetMapping("/v2/members")
      public Page<MemberTeamDto> searchMemberV2(MemberSearchCondition condition,
                                                 Pageable pageable) {
          return memberRepository.searchPageSimple(condition, pageable);
      }

      @GetMapping("/v3/members")
      public Page<MemberTeamDto> searchMemberV3(MemberSearchCondition condition,
                                                 Pageable pageable) {
          return memberRepository.searchPageComplex(condition, pageable);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/controller/MemberController.java)

- 예제 요청

  ```
  GET http://localhost:8080/v2/members?size=5&page=2
  ```


<br/><br/>

## 스프링 데이터 Sort를 Querydsl OrderSpecifier로 변환

- Sort 변환 방식
  - 스프링 데이터 JPA의 `Sort`를 Querydsl의 `OrderSpecifier`로 변환하여 동적 정렬을 처리할 수 있음

  ```java
  JPAQuery<Member> query = queryFactory.selectFrom(member);

  for (Sort.Order o : pageable.getSort()) {
      PathBuilder pathBuilder = new PathBuilder(member.getType(), member.getMetadata());
      query.orderBy(new OrderSpecifier(
              o.isAscending() ? Order.ASC : Order.DESC,
              pathBuilder.get(o.getProperty())));
  }

  List<Member> result = query.fetch();
  ```

- 주의사항
  - `Sort`는 조건이 조금만 복잡해져도 `Pageable`의 Sort 기능을 사용하기 어려움
  - 단순한 루트 엔티티 정렬에는 `Pageable`의 Sort를 사용할 수 있지만, 조인이 포함된 복잡한 정렬이나 루트 엔티티 범위를 넘어가는 동적 정렬이 필요하면 파라미터를 직접 받아서 `OrderSpecifier`를 수동으로 처리하는 것을 권장함


<br/><br/>

## 연습 문제

1. 스프링 데이터 JPA 사용 시 순수 JPA와 비교하여 개발 생산성 측면에서 얻는 주요 이점은 무엇일까요?

    a. 기본 CRUD(저장, 조회 등) 메서드를 인터페이스만으로 자동으로 제공받음

    - Spring Data JPA의 가장 큰 장점은 기본적인 데이터 조작 메서드를 자동으로 제공하여 개발자가 직접 구현할 필요 없이 인터페이스 정의만으로 사용할 수 있다는 점임

2. Spring Data JPA의 기본 기능만으로 복잡하거나 동적인 검색 조건을 가진 쿼리를 처리하기 어려울 때 활용할 수 있는 주요 방법은 무엇일까요?

    a. 사용자 정의 리포지토리(Custom Repository)를 구현하여 동적 쿼리 프레임워크(예: Querydsl)와 함께 사용함

    - 기본 기능으로 커버되지 않는 복잡한 쿼리는 사용자 정의 리포지토리 인터페이스와 구현체를 만들고 Querydsl 같은 도구를 활용하여 구현함

3. Spring Data JPA에서 클라이언트의 페이징 요청 정보(페이지 번호, 크기, 정렬 등)를 받기 위한 표준 인터페이스는 무엇일까요?

    a. `Pageable`

    - Spring Data는 `Pageable` 인터페이스를 통해 페이징과 정렬 관련 파라미터를 표준화하여 제공하며, 컨트롤러에서 이를 받아 리포지토리로 바로 넘길 수 있음

4. 페이징 처리 시, 상황에 따라 불필요한 전체 건수(Total Count) 쿼리 실행을 생략하여 성능을 최적화해 주는 유틸리티 클래스는 무엇일까요?

    a. `PageableExecutionUtils`

    - 데이터 개수가 페이지 사이즈보다 작거나 마지막 페이지인 경우 등 전체 카운트 쿼리가 필요 없는 상황을 판단하여 쿼리 실행을 생략함으로써 성능을 최적화함

5. 공통 비즈니스 쿼리와 특정 API 전용 복잡 쿼리가 섞여 있을 때, 유지보수성을 높이기 위한 권장 설계 방안은 무엇일까요?

    a. 복잡하거나 특화된 쿼리는 별도의 쿼리 리포지토리나 모듈로 분리하여 관리함

    - 공통 쿼리는 리포지토리에 두고, 특정 화면에 의존적인 복잡한 쿼리는 전담 리포지토리를 별도로 만들어 분리하는 것이 코드 구조화와 유지보수에 유리함


<br/><br/>

## 요약 정리

- 스프링 데이터 JPA 인터페이스만으로는 Querydsl 전용 기능을 작성할 수 없으므로 사용자 정의 인터페이스를 작성하고 구현 클래스를 생성한 뒤 리포지토리에 상속시키는 방식으로 확장함
- 페이징 구현 시 `fetchResults`를 사용한 단순 방식과 데이터 조회·카운트 쿼리를 분리한 최적화 방식을 선택할 수 있으며, `PageableExecutionUtils.getPage()`를 활용하면 불필요한 카운트 쿼리 실행을 자동으로 생략할 수 있음
- 컨트롤러에서 `Pageable`을 인자로 받아 페이징 API를 구성하며, 조건 검색과 페이징을 자연스럽게 연동할 수 있음
- 스프링 데이터의 `Sort`를 Querydsl `OrderSpecifier`로 변환하여 동적 정렬을 처리할 수 있지만, 복잡한 정렬 조건에서는 파라미터를 직접 받아 수동으로 처리하는 것을 권장함


<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
