---
title: '[실전! 스프링 데이터 JPA] 공통 인터페이스 기능'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-21 13:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, spring-data-jpa, repository, interface, proxy]
math: false
mermaid: false
---

# 공통 인터페이스 기능

- 김영한님의 실전! 스프링 데이터 JPA 강의를 기반으로 순수 JPA 구현 시 발생하는 반복적인 CRUD 코드를 스프링 데이터 JPA의 `JpaRepository` 공통 인터페이스를 통해 어떻게 자동화하고 재사용할 수 있는지, 그 내부 원리와 계층 구조를 정리함

<br/><br/>

## 순수 JPA 기반 리포지토리

### 회원 리포지토리

```java
@Repository
public class MemberJpaRepository {

    @PersistenceContext
    private EntityManager em;

    public Member save(Member member) {
        em.persist(member);
        return member;
    }

    public List<Member> findAll() {
        return em.createQuery("select m from Member m", Member.class)
                .getResultList();
    }

}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberJpaRepository.java)

### 팀 리포지토리

```java
@Repository
public class TeamJpaRepository {

    @PersistenceContext
    private EntityManager em;

    public Team save(Team team) {
        em.persist(team);
        return team;
    }

}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/TeamJpaRepository.java)

- 회원과 팀 리포지토리의 구조가 엔티티 타입만 다를 뿐 거의 동일함
- 스프링 데이터 JPA는 이러한 반복적인 코드를 공통 인터페이스를 통해 획기적으로 제거해 줌

### 순수 JPA 리포지토리 기본 동작 테스트

```java
@SpringBootTest
@Transactional
public class MemberJpaRepositoryTest {

    @Autowired MemberJpaRepository memberJpaRepository;

    @Test
    public void testMember() {
        Member member = new Member("memberA");
        Member savedMember = memberJpaRepository.save(member);
        Member findMember = memberJpaRepository.find(savedMember.getId());

        assertThat(findMember).isEqualTo(member); // JPA 엔티티 동일성 보장
    }

}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/test/java/study/datajpa/MemberJpaRepositoryTest.java)

<br/><br/>

## 공통 인터페이스 설정

- 스프링 부트를 사용하면 `@SpringBootApplication`이 위치한 패키지와 그 하위 패키지를 자동으로 스캔하여 인터페이스를 인식하므로, 대부분 별도 설정이 불필요함
- 패키지 위치가 기준과 다를 경우에만 아래와 같은 설정을 명시적으로 추가함

    ```java
    // 스프링 부트 미사용 시 또는 패키지 위치가 다를 때만 필요
    @Configuration
    @EnableJpaRepositories(basePackages = "jpabook.jpashop.repository")
    public class AppConfig {}
    ```

- 스프링 데이터 JPA 동작 원리

  ![스프링 데이터 JPA 동작 원리](/assets/img/jpa/2026-02-21-spring-data-jpa-common-interface/ci-proxy.png)

<br/><br/>

## 공통 인터페이스 적용

### 스프링 데이터 JPA 기반 MemberRepository

```java
// 인터페이스 선언만으로 CRUD 메서드가 완성됨
public interface MemberRepository extends JpaRepository<Member, Long> {
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberRepository.java)

### 스프링 데이터 JPA 기반 TeamRepository

```java
public interface TeamRepository extends JpaRepository<Team, Long> {
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/TeamRepository.java)

### 스프링 데이터 JPA 테스트

- 순수 JPA 테스트와 코드는 완벽하게 동일하게 유지되면서 리포지토리 의존성만 변경됨

```java
@SpringBootTest
@Transactional
public class MemberRepositoryTest {

    @Autowired MemberRepository memberRepository; // 주입되는 의존성만 다름

    @Test
    public void testMember() {
        Member member = new Member("memberA");
        Member savedMember = memberRepository.save(member);
        Member findMember = memberRepository.findById(savedMember.getId()).get();

        Assertions.assertThat(findMember).isEqualTo(member); // JPA 엔티티 동일성 보장
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/test/java/study/datajpa/MemberRepositoryTest.java)

<br/><br/>

## 공통 인터페이스 계층 구조

![공통 인터페이스 계층 구조](/assets/img/jpa/2026-02-21-spring-data-jpa-common-interface/ci-hierarchy.png)

<br/><br/>

## 주요 메서드 정리

| 메서드 | 내부 동작 | 설명 |
|--------|---------|------|
| `save(S)` | `em.persist()` 또는 `em.merge()` | 새 엔티티는 저장, 이미 존재하는 엔티티는 병합 |
| `delete(T)` | `em.remove()` | 엔티티 삭제 |
| `findById(ID)` | `em.find()` | 엔티티 단건 조회, `Optional` 반환 |
| `getReferenceById(ID)` | `em.getReference()` | 프록시로 조회 (구 `getOne()` 대체) |
| `findAll(...)` | JPQL | 전체 조회, `Sort`/`Pageable` 파라미터 가능 |
| `count()` | JPQL count | 전체 카운트 |
| `existsById(ID)` | - | 존재 여부 확인 (구 `exists(ID)` 대체) |


- 제네릭 타입 매핑
  - `T`
    - 엔티티 타입
  - `ID`
    - 엔티티 식별자 타입 (Primary Key)
  - `S`
    - 엔티티와 그 자식 타입

<br/><br/>

## 순수 JPA와 스프링 데이터 JPA 비교

![순수 JPA와 스프링 데이터 JPA 비교](/assets/img/jpa/2026-02-21-spring-data-jpa-common-interface/ci-compare.png)

<br/><br/>

## 연습 문제

1. 순수 JPA 리포지토리 구현과 비교했을 때, Spring Data JPA 사용의 주요 장점은 무엇일까요?

    a. 기본적인 CRUD 작업을 위한 구현 코드를 직접 작성할 필요가 없음

    - Spring Data JPA는 `JpaRepository`와 같은 공통 인터페이스를 상속받는 것만으로도 저장, 조회 등 기본 CRUD 메서드 구현체를 자동으로 제공해 개발자의 코드 작성 부담을 줄여줌

2. Spring Data JPA는 `JpaRepository`를 상속받은 인터페이스만으로 리포지토리 기능을 사용할 수 있게 하는 내부 메커니즘은 무엇인가요?

    a. Spring Data JPA가 애플리케이션 로딩 시점에 프록시 기반의 구현체를 동적으로 만들어 주입함

    - Spring Data JPA는 개발자가 정의한 리포지토리 인터페이스를 인식하고, 런타임에 해당 인터페이스의 실제 동작을 수행하는 프록시(Proxy) 객체를 생성하여 Spring 빈으로 등록함

3. Spring Data 인터페이스 계층 구조(`Repository` -> `CrudRepository` -> `PagingAndSortingRepository` -> `JpaRepository`)에서 기본적인 CRUD 작업을 위한 메서드들을 정의하고 있는 인터페이스는 무엇인가요?

    a. CrudRepository

    - `CrudRepository`는 엔티티의 저장(`save`), 단건 조회(`findById`), 전체 조회(`findAll`), 삭제(`delete`) 등 가장 기본적인 데이터 조작 기능을 추상화한 인터페이스임

4. Spring Data JPA에서 `JpaRepository<Entity, ID>` 인터페이스를 상속받는 리포지토리를 사용할 때, 개발자가 직접 해야 하는 작업은 무엇인가요?

    a. 엔티티 클래스와 ID 타입을 지정하여 인터페이스만 정의하면 됨

    - Spring Data JPA의 가장 큰 장점은 개발자가 `JpaRepository<T, ID>`를 상속받는 인터페이스만 정의하면, Spring Data JPA가 엔티티 T와 ID 타입 ID를 바탕으로 필요한 기본 구현체를 자동으로 제공한다는 것임

5. 페이징(`Pageable`) 및 정렬(`Sort`) 기능과 같이 특정 데이터 접근 기술(JPA, MongoDB 등)에 종속되지 않고 여러 기술에서 공통적으로 사용되는 기능은 Spring Data 프로젝트의 어느 모듈에서 제공될까요?

    a. Spring Data Commons

    - Spring Data 프로젝트는 여러 모듈을 지원하며, 기술 간에 공통적으로 사용되는 인터페이스나 기능은 `Spring Data Commons` 모듈에서 관리됨
    - Spring Data JPA는 이를 상속받아 JPA 특화 기능만을 추가함

<br/><br/>

## 요약 정리

- 순수 JPA에서는 엔티티마다 `EntityManager`를 주입받아 CRUD 로직을 반복 작성해야 하지만, 스프링 데이터 JPA는 `JpaRepository`를 상속하는 인터페이스 선언만으로 프록시 기반의 CRUD 구현체를 자동으로 주입해 줌
- 데이터 저장 기술에 구애받지 않는 핵심 공통 기능(페이징, 정렬 등)은 `Spring Data Commons`의 `CrudRepository`와 `PagingAndSortingRepository`에서 제공하며, `JpaRepository`는 이를 상속받아 JPA에 특화된 메서드(`flush()`, `getReferenceById()` 등)를 별도로 추가 제공함

<br/><br/>

## Reference

- [실전! 스프링 데이터 JPA](https://www.inflearn.com/course/스프링-데이터-JPA-실전)
