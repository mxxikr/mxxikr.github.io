---
title: '[실전! 스프링 데이터 JPA] 예제 도메인 모델'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-21 12:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, spring-data-jpa, entity, domain-model, mapping]
math: false
mermaid: false
---

# 예제 도메인 모델

- 김영한님의 실전! 스프링 데이터 JPA 강의를 기반으로 실습에 사용될 핵심 예제인 `Member`와 `Team` 엔티티의 양방향 연관관계와 동작 로직, 그리고 지연 로딩을 통한 쿼리 실행 흐름을 정리함

<br/><br/>

## 도메인 모델 구조

![도메인 모델 구조](/assets/img/jpa/2026-02-21-spring-data-jpa-domain-model/domain-erd.png)

![연관관계 매핑 방식](/assets/img/jpa/2026-02-21-spring-data-jpa-domain-model/domain-graph.png)

- 연관관계 규칙
  - `Member.team`이 연관관계의 주인으로, DB 외래키(`team_id`) 값을 관리(변경)함
  - `Team.members`는 `mappedBy`로 선언된 읽기 전용으로 외래키에 영향을 주지 않음
  - 양방향 관계 변경은 편의상 `Member.changeTeam()` 메서드 하나로 원천적으로 처리함

<br/><br/>

## Member 엔티티

```java
@Entity
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(of = {"id", "username", "age"}) // 연관관계 필드 제외 - 무한루프 방지
public class Member {

    @Id @GeneratedValue
    @Column(name = "member_id")
    private Long id;

    private String username;
    private int age;

    @ManyToOne(fetch = FetchType.LAZY) // 지연 로딩 필수
    @JoinColumn(name = "team_id")
    private Team team;

    // 양방향 연관관계 편의 메서드 - 양쪽을 동시에 처리
    public void changeTeam(Team team) {
        this.team = team;
        team.getMembers().add(this);
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/entity/Member.java)


- `@Setter`
  - 데이터 변경 추적이 어려우므로 실무에서는 가급적 사용을 자제해야 함
- `@NoArgsConstructor(AccessLevel.PROTECTED)`
  - JPA 스펙상 기본 생성자가 필요하지만, 외부에서 빈 객체를 직접 생성하는 것을 막기 위해 `PROTECTED`로 접근을 제한함
- `@ToString(of = {...})`
  - 연관관계 필드(`team`)를 제외한 내부 필드만 포함하여 무한루프 호출을 방지함

<br/><br/>

## Team 엔티티

```java
@Entity
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(of = {"id", "name"}) // 연관관계 필드 제외
public class Team {

    @Id @GeneratedValue
    @Column(name = "team_id")
    private Long id;

    private String name;

    @OneToMany(mappedBy = "team") // 연관관계의 주인이 아님 - 읽기 전용
    List<Member> members = new ArrayList<>();
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/entity/Team.java)

<br/><br/>

## 연관관계 동작 흐름

![연관관계 설정 흐름](/assets/img/jpa/2026-02-21-spring-data-jpa-domain-model/domain-seq.png)

<br/><br/>

## 데이터 확인 테스트

```java
@SpringBootTest
public class MemberTest {

    @PersistenceContext
    EntityManager em;

    @Test
    @Transactional
    @Rollback(false)
    public void testEntity() {

        // 영속성 컨텍스트 초기화 - DB에서 다시 조회하도록 강제
        em.flush();
        em.clear();

        // 조회 및 지연 로딩 동작 확인
        List<Member> members = em.createQuery("select m from Member m", Member.class)
                .getResultList();

        for (Member member : members) {
            System.out.println("member=" + member);
            System.out.println("-> member.team=" + member.getTeam()); // 지연 로딩 시점
        }
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/test/java/study/datajpa/entity/MemberTest.java)

- 테스트 포인트

  ![데이터 조회 동작 흐름](/assets/img/jpa/2026-02-21-spring-data-jpa-domain-model/domain-test-flow.png)

  - `em.flush()` 후 `em.clear()`를 호출하는 이유는 1차 캐시를 강제로 비워 실제 DB에서 데이터를 다시 읽어오도록 만들기 위함임
  - 이를 통해 프록시 객체의 지연 로딩이 쿼리가 나가는 시점에 정상적으로 동작하는지 확인할 수 있음


<br/><br/>

## 요약 정리

- `Member`와 `Team`의 일대다 양방향 연관관계에서는 다(Many)쪽인 `Member`가 연관관계의 주인이 되어 외래키(`team_id`)를 관리함
- 연관관계를 맺을 때 값 세팅 누락을 방지하기 위해 `Member.changeTeam()`과 같은 연관관계 편의 메서드를 만들어 한쪽에서 두 객체를 강제로 함께 세팅함
- JPA 스펙 준유와 오작동 방지를 위해 하위 클래스에서 기본 생성자 접근을 제한(`access = AccessLevel.PROTECTED`), `ToString`에서는 연관관계 필드 제외, 그리고 모든 연관관계에는 성능 문제를 피하기 위해 지연 로딩(`LAZY`)을 필수적으로 설정함
- 엔티티의 지연 로딩 및 프록시 초기화를 확인하는 테스트 작성 시, 삽입 작업 이후에 반드시 `em.flush()`와 `em.clear()`를 명시적으로 호출해 주어야만 순수한 DB 액세스와 연동 과정을 검증할 수 있음

<br/><br/>

## Reference

- [실전! 스프링 데이터 JPA](https://www.inflearn.com/course/스프링-데이터-JPA-실전)
