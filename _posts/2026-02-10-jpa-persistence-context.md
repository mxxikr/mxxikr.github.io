---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 영속성 관리 - 내부 동작 방식'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-10 18:00:00 +0900
category: [Language, Java, JPA]
tags: [jpa, persistence-context, entity-lifecycle, dirty-checking, flush, orm]
math: false
mermaid: false
---

# 영속성 관리 - 내부 동작 방식

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 JPA의 핵심인 영속성 컨텍스트, 엔티티 생명주기, 그리고 영속성 컨텍스트가 제공하는 주요 기능들을 정리함

<br/><br/>

## 영속성 컨텍스트

### 영속성 컨텍스트란?

- **정의**
    - "엔티티를 영구 저장하는 환경"이라는 뜻의 논리적 개념
    - `EntityManager.persist(entity)`를 호출하면 엔티티를 영속성 컨텍스트에 저장함
- **특징**
    - 눈에 보이지 않는 논리적인 공간
    - `EntityManager`를 통해 접근하고 관리함
    - J2SE 환경에서는 EntityManager와 1:1 관계
    - J2EE, Spring 환경에서는 여러 EntityManager가 하나의 영속성 컨텍스트를 공유할 수 있음

### EntityManager와 EntityManagerFactory

- **EntityManagerFactory**
    - 애플리케이션 전체에서 단 하나만 생성하여 공유함
    - 생성 비용이 크므로 애플리케이션 로딩 시점에 딱 한 번만 생성함
- **EntityManager**
    - 요청마다 생성하고 사용 후 반드시 종료해야 함
    - 쓰레드 간 공유를 절대 금지함 (동시성 문제 발생)

<br/><br/>

## 엔티티 생명주기

### 4가지 상태

- **비영속 (New/Transient)**
    - 영속성 컨텍스트와 전혀 관계가 없는 새로운 상태
    - 순수한 Java 객체로 JPA가 전혀 관리하지 않음

    ```java
    // 객체를 생성한 상태 (비영속)
    Member member = new Member();
    member.setId("member1");
    member.setUsername("회원1");
    ```

- **영속 (Managed)**
    - 영속성 컨텍스트에 관리되는 상태
    - 1차 캐시에 저장되며 JPA가 관리함

    ```java
    // 객체를 저장한 상태 (영속)
    em.persist(member);
    ```

- **준영속 (Detached)**
    - 영속성 컨텍스트에 저장되었다가 분리된 상태
    - 영속성 컨텍스트가 제공하는 기능을 사용할 수 없음

    ```java
    // 회원 엔티티를 영속성 컨텍스트에서 분리
    em.detach(member);
    ```

- **삭제 (Removed)**
    - 삭제된 상태
    - 영속성 컨텍스트와 데이터베이스에서 제거됨

    ```java
    // 객체를 삭제한 상태
    em.remove(member);
    ```

<br/><br/>

## 영속성 컨텍스트의 이점

### 1차 캐시

- **동작 방식**
    - 영속 상태의 엔티티를 1차 캐시에 저장함
    - 조회 시 1차 캐시를 먼저 확인하고, 없으면 데이터베이스 조회 후 1차 캐시에 저장

    ```java
    // 엔티티를 생성한 상태 (비영속)
    Member member = new Member();
    member.setId("member1");
    member.setUsername("회원1");
    
    // 1차 캐시에 저장됨
    em.persist(member);
    
    // 1차 캐시에서 조회 (DB 조회 X)
    Member findMember = em.find(Member.class, "member1");
    ```

- **장점**
    - 같은 트랜잭션 내에서 반복 조회 시 데이터베이스 접근을 최소화함
    - 성능 향상 효과가 있음

### 동일성 보장

- **REPEATABLE READ 등급의 트랜잭션 격리 수준 제공**
    - 1차 캐시 덕분에 같은 엔티티를 반복 조회하면 동일한 인스턴스를 반환함
    - 데이터베이스가 아닌 애플리케이션 차원에서 보장함

    ```java
    Member a = em.find(Member.class, "member1");
    Member b = em.find(Member.class, "member1");
    
    System.out.println(a == b);  // true
    ```

### 트랜잭션을 지원하는 쓰기 지연

- **엔티티 등록**

    ```java
    EntityTransaction tx = em.getTransaction();
    tx.begin();
    
    em.persist(memberA);
    em.persist(memberB);
    // 여기까지 INSERT SQL을 DB에 보내지 않음
    
    // 커밋하는 순간 DB에 INSERT SQL을 보냄
    tx.commit();
    ```

- **동작 원리**
    - `persist()` 호출 시 1차 캐시에 엔티티를 저장하고 INSERT SQL을 쓰기 지연 SQL 저장소에 보관함
    - 트랜잭션 커밋 시점에 쓰기 지연 SQL 저장소의 쿼리를 데이터베이스로 전송함
- **장점**
    - 버퍼링을 통한 배치 처리가 가능함
    - 성능 최적화 효과가 있음

### 변경 감지 (Dirty Checking)

- **엔티티 수정**

    ```java
    // 영속 엔티티 조회
    Member memberA = em.find(Member.class, "memberA");
    
    // 영속 엔티티 데이터 수정
    memberA.setUsername("hi");
    memberA.setAge(10);
    
    // em.update(member) 같은 코드 필요 없음
    
    tx.commit();  // 트랜잭션 커밋 시 자동으로 UPDATE SQL 실행
    ```

    - 별도의 `update` 메서드 호출 없이 엔티티 수정만으로 자동으로 데이터베이스에 반영됨
    - 반드시 트랜잭션 안에서 실행되어야 함

- **동작 원리**
    1. 트랜잭션 커밋 시점에 `flush()` 호출
    2. 엔티티와 스냅샷 비교하여 변경 사항 감지
    3. 변경된 엔티티에 대해 UPDATE SQL 생성
    4. 쓰기 지연 SQL 저장소에 보관 후 데이터베이스로 전송
    5. 트랜잭션 커밋

- **스냅샷**
    - 엔티티를 최초로 영속성 컨텍스트에 저장할 때의 상태를 보관함
    - `flush()` 시점에 현재 엔티티와 스냅샷을 비교하여 변경 사항을 감지함

### 지연 로딩 (Lazy Loading)

- **특징**
    - 연관된 엔티티를 실제 사용하는 시점에 조회함
    - 프록시 객체를 사용하여 성능을 최적화함

    ```java
    // 회원만 조회 (팀은 조회 안 함)
    Member member = em.find(Member.class, "member1");
    
    // 실제 팀을 사용하는 시점에 조회
    Team team = member.getTeam();
    String teamName = team.getName();  // 이 시점에 SELECT TEAM
    ```

<br/><br/>

## 플러시

### 플러시란?

- **정의**
    - 영속성 컨텍스트의 변경 내용을 데이터베이스에 반영하는 작업
- **주의사항**
    - 플러시는 영속성 컨텍스트를 비우는 것이 아님
    - 1차 캐시는 그대로 유지되고, 쓰기 지연 SQL 저장소의 쿼리만 데이터베이스로 전송됨

### 플러시 발생 과정

1. **변경 감지 (Dirty Checking)** 실행
2. 수정된 엔티티를 쓰기 지연 SQL 저장소에 등록
3. 쓰기 지연 SQL 저장소의 쿼리를 데이터베이스에 전송 (등록, 수정, 삭제 쿼리)

### 플러시 호출 방법

- **직접 호출**

    ```java
    em.flush();  // 강제 플러시
    ```

    - 커밋 전에 강제로 데이터베이스에 반영함

- **트랜잭션 커밋 시 자동 호출**

    ```java
    tx.commit();  // 자동 플러시
    ```

    - 가장 일반적인 방법

- **JPQL 쿼리 실행 시 자동 호출**

    ```java
    em.persist(memberA);
    em.persist(memberB);
    em.persist(memberC);
    
    // JPQL 실행 시 자동 플러시
    TypedQuery<Member> query = 
        em.createQuery("select m from Member m", Member.class);
    List<Member> members = query.getResultList();
    ```

    - JPQL은 SQL로 변환되어 데이터베이스에서 실행되므로, 1차 캐시에만 있고 데이터베이스에는 없는 경우 조회 불가
    - 자동 플러시로 이러한 문제를 방지함

### 플러시 모드 옵션

- **FlushModeType.AUTO (기본값)**
    - 커밋이나 쿼리 실행 시 플러시
    - 권장하는 설정
- **FlushModeType.COMMIT**
    - 커밋할 때만 플러시

<br/><br/>

## 준영속 상태

### 준영속 상태란?

- **정의**
    - 영속 상태의 엔티티가 영속성 컨텍스트에서 분리된 상태
- **특징**
    - 영속성 컨텍스트가 제공하는 기능 사용 불가
    - 1차 캐시, 쓰기 지연, 변경 감지, 지연 로딩 모두 동작하지 않음

### 준영속 상태로 만드는 방법

- **em.detach(entity)**
    - 특정 엔티티만 준영속 상태로 전환

    ```java
    Member member = em.find(Member.class, 150L);
    member.setName("AAAA");
    
    em.detach(member);  // 특정 엔티티만 준영속 상태로
    
    tx.commit();  // UPDATE SQL 실행 안 됨
    ```

- **em.clear()**
    - 영속성 컨텍스트를 완전히 초기화

    ```java
    em.clear();  // 영속성 컨텍스트를 완전히 초기화
    
    // 다시 조회 시 1차 캐시에 없어서 SELECT SQL 실행
    Member member2 = em.find(Member.class, 150L);
    ```

    - 테스트 케이스 작성 시 유용함

- **em.close()**
    - 영속성 컨텍스트를 종료

    ```java
    em.close();  // 영속성 컨텍스트 종료
    ```

    - 관리되던 모든 엔티티가 준영속 상태가 됨

### 준영속 → 영속 (병합)

- **merge() 사용**

    ```java
    // 준영속 상태의 엔티티
    Member detachedMember = new Member();
    detachedMember.setId(100L);
    detachedMember.setName("준영속");
    
    // 준영속 → 영속
    Member mergedMember = em.merge(detachedMember);
    ```

    - 준영속 엔티티를 영속 상태로 변경할 수 있음
    - 새로운 영속 엔티티를 반환하며, 원본은 여전히 준영속 상태임

<br/><br/>

## 연습 문제

1. JPA에서 영속성 컨텍스트는 어떤 역할을 하는 핵심 개념일까요?

   a. 엔티티를 관리하고 DB와 동기화하는 환경 제공

   - 영속성 컨텍스트는 JPA가 엔티티의 생명주기를 관리하고 데이터 변경사항을 추적하여 DB에 동기화하는 중요한 공간임

2. 엔티티 객체를 새로 생성한 후 `em.persist()`를 호출하면, 이 엔티티는 어떤 상태가 될까요?

   a. 영속(Persistent)

   - `em.persist()`는 엔티티를 영속성 컨텍스트의 관리 대상으로 만들며, 이 상태를 영속 상태라고 부름
   - 아직 DB에 저장된 것은 아님

3. 영속성 컨텍스트의 1차 캐시가 제공하는 주요 장점은 무엇인가요?

   a. 동일 엔티티 반복 조회 시 DB 접근 최소화

   - 1차 캐시는 동일한 트랜잭션 내에서 같은 엔티티를 여러 번 조회할 때 DB에 다시 접근하지 않고 캐시된 객체를 반환해 성능을 높여줌

4. 영속 상태의 엔티티에 대한 변경사항(INSERT, UPDATE, DELETE)이 데이터베이스에 실제로 반영되는 시점은 주로 언제일까요?

   a. 트랜잭션 커밋 시점 또는 명시적 플러시 호출 시

   - JPA는 엔티티 변경사항을 내부 버퍼에 모아두었다가 트랜잭션이 커밋되거나 명시적으로 플러시를 호출할 때 DB로 전송하여 반영함

5. 영속성 컨텍스트가 관리하는 엔티티의 내용이 변경되었을 때, 개발자가 별도의 `update` 호출 없이도 데이터베이스에 자동으로 반영되는 기능은 무엇인가요?

   a. 변경 감지(Dirty Checking)

   - 영속 상태 엔티티의 속성 변화를 JPA가 추적하여 트랜잭션 커밋 시점에 변경된 내용을 자동으로 UPDATE 쿼리로 만들어 DB에 반영하는 기능임

<br/><br/>

## 요약 정리

- **영속성 컨텍스트**는 엔티티를 영구 저장하는 환경으로, EntityManager를 통해 접근하며 엔티티의 생명주기를 관리함
- 엔티티는 비영속, 영속, 준영속, 삭제의 **4가지 생명주기** 상태를 거치며, 영속 상태일 때만 JPA가 관리하고 영속성 컨텍스트의 기능을 사용할 수 있음
- **1차 캐시**는 같은 트랜잭션 내에서 반복 조회 시 데이터베이스 접근을 최소화하고, 동일성(==)을 보장하여 REPEATABLE READ 수준의 트랜잭션 격리를 제공함
- **쓰기 지연**은 `persist()` 호출 시 즉시 SQL을 실행하지 않고 쓰기 지연 SQL 저장소에 모아두었다가 트랜잭션 커밋 시점에 한 번에 전송하여 성능을 최적화함
- **변경 감지**(Dirty Checking)는 영속 엔티티의 변경을 자동으로 감지하여 별도의 `update` 메서드 호출 없이 트랜잭션 커밋 시점에 UPDATE SQL을 자동 실행함
- **플러시**는 영속성 컨텍스트의 변경 내용을 데이터베이스에 동기화하는 작업으로, 영속성 컨텍스트를 비우지 않고 1차 캐시는 그대로 유지함
- **준영속 상태**는 영속 상태였던 엔티티가 영속성 컨텍스트에서 분리된 상태로, 1차 캐시, 쓰기 지연, 변경 감지 등 영속성 컨텍스트의 모든 기능을 사용할 수 없음

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
