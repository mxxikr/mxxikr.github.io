---
title: '[실전! Querydsl] 예제 도메인 모델'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-24 17:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, domain-model, entity]
math: false
mermaid: false
---

# 예제 도메인 모델

- 김영한님의 실전! Querydsl 강의를 바탕으로 스프링 데이터 JPA와 동일한 환경을 가진 예제 도메인 모델을 구축하고 데이터를 검증하는 테스트 과정을 정리함

<br/><br/>

## 도메인 모델 구조 요약

- Member와 Team 엔티티 간의 다대일(N:1) 양방향 연관관계 구조

  ![엔티티 클래스 다이어그램](/assets/img/jpa/2026-02-24-spring-boot-querydsl-domain-model/domain-class.png)

- 데이터베이스 관점의 테이블명 및 조인 식별자 구조 명시

  ![엔티티 ERD 구조](/assets/img/jpa/2026-02-24-spring-boot-querydsl-domain-model/domain-erd.png)

  - 연관관계의 주인은 물리 테이블에 외래키를 보유한 `Member.team`으로 지정
  - DB 외래키 값 변경 제어권은 `Member.team`이 가지며, 역방향인 `Team.members`는 읽기 전용 상태로 데이터 관리 역할을 수행함

<br/><br/>

## 엔티티 코드 구성

- Member 엔티티 코드
  - 연관관계 편의성을 지원하는 메서드를 함께 정의하여 단일 호출로 양측 데이터 수록을  보장함

  ```java
  package study.querydsl.entity;

  import lombok.*;
  import jakarta.persistence.*;

  @Entity
  @Getter @Setter
  @NoArgsConstructor(access = AccessLevel.PROTECTED)
  @ToString(of = {"id", "username", "age"})
  public class Member {

      @Id @GeneratedValue
      @Column(name = "member_id")
      private Long id;

      private String username;
      private int age;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "team_id")
      private Team team;

      public void changeTeam(Team team) {
          this.team = team;
          team.getMembers().add(this);
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/entity/Member.java)

  - JPA 스펙상 요구되는 기본 생성자는 유효성 검사 누락 방지를 위해 `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 수준으로 통제함
  - 객체 로깅 시 발생할 수 있는 무한 루프를 막으려 `@ToString`에서 양방향 참조 필드(`team`)는 필히 명세에서 제외함

  ![연관관계 편의 메서드 동작 흐름](/assets/img/jpa/2026-02-24-spring-boot-querydsl-domain-model/domain-method.png)

- Team 엔티티 코드

  ```java
  package study.querydsl.entity;

  import lombok.*;
  import jakarta.persistence.*;
  import java.util.ArrayList;
  import java.util.List;

  @Entity
  @Getter @Setter
  @NoArgsConstructor(access = AccessLevel.PROTECTED)
  @ToString(of = {"id", "name"})
  public class Team {

      @Id @GeneratedValue
      @Column(name = "team_id")
      private Long id;

      private String name;

      @OneToMany(mappedBy = "team")
      private List<Member> members = new ArrayList<>();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/entity/Team.java)

<br/><br/>

## 데이터 초기화 및 조회 확인 테스트

- 초기 데이터 등록 및 지연 로딩 관측용 테스트 코드

  ```java
  @SpringBootTest
  @Transactional
  @Commit
  public class MemberTest {

      @PersistenceContext
      EntityManager em;

      @Test
      public void testEntity() {
          Team teamA = new Team("teamA");
          Team teamB = new Team("teamB");
          em.persist(teamA);
          em.persist(teamB);

          Member member1 = new Member("member1", 10, teamA);
          Member member2 = new Member("member2", 20, teamA);
          em.persist(member1);
          em.persist(member2);

          // 영속성 컨텍스트 초기화
          em.flush();
          em.clear();

          // 조회 및 확인
          List<Member> members = em.createQuery("select m from Member m", Member.class)
                  .getResultList();

          for (Member member : members) {
              System.out.println("member=" + member);
              System.out.println("-> member.team=" + member.getTeam());
          }
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/entity/MemberTest.java)

  - 1차 캐시를 비워주는 영속성 초기화 과정(`em.flush()`, `em.clear()`)을 누락할 시, 조회가 메모리 상에서만 이루어져 실제 데이터베이스 I/O 쿼리를 관찰할 수 없으므로 필수로 명시해야 함

<br/><br/>

## 요약 정리

- Member와 Team 엔티티는 다대일 양방향 연관관계를 맺으며, 외래키가 위치한 `Member.team`을 연관관계의 주인으로 설정해 DB 외래키 변경 제어권을 부여함
- 연관관계 편의 메서드를 `Member` 쪽에 두어 객체 상태 변환 시 양방향 데이터가 한 번에 매핑되도록 보장하고 불일치 문제를 예방함
- 순환 참조를 막고자 `@ToString` 대상에서 연관 필드를 배제하고 무분별한 객체 생성을 막기 위해 최소 제어 수준인 Protected로 기본 생성자를 열어둠
- 초기 데이터 세팅 후 영속성 컨텍스트(1차 캐시)를 완전히 플러시 및 초기화해야 DB로 전달되는 실제 쿼리와 지연 로딩(`LAZY`)의 작동 여부를 테스트 콘솔에서 명확히 확인할 수 있음

<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
