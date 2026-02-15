---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 객체지향 쿼리 언어2 - 중급 문법'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-14 17:00:00 +0900
category: [Language, Java, JPA]
tags: [jpa, jpql, orm, query, object-oriented-query, fetch-join, bulk-operation]
math: false
mermaid: true
---

# 객체지향 쿼리 언어2 - 중급 문법

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 JPQL의 중급 문법인 경로 표현식, 페치 조인, 다형성 쿼리, 엔티티 직접 사용, Named 쿼리, 그리고 벌크 연산 등을 정리함

<br/><br/>

## 경로 표현식

### 경로 표현식이란?

- **정의**
    - `.`(점)을 찍어 객체 그래프를 탐색하는 방법을 말함

    ```sql
    SELECT m.username        -- 상태 필드
    FROM Member m
    JOIN m.team t           -- 단일 값 연관 필드
    JOIN m.orders o         -- 컬렉션 값 연관 필드
    WHERE t.name = '팀A'
    ```

### 경로 표현식 용어

![path-expression-terms](/assets/img/jpa/2026-02-14-jpa-jpql-intermediate/path-expression-terms.png)

### 경로 표현식 특징

| 필드 타입 | 특징 | 묵시적 조인 | 추가 탐색 |
|-----------|------|------------|----------|
| **상태 필드** | 경로 탐색의 끝 | 불가 | 불가 |
| **단일 값 연관** | 묵시적 내부 조인 발생 | 발생 | 가능 |
| **컬렉션 값 연관** | 묵시적 내부 조인 발생 | 발생 | 불가 |

### 컬렉션 탐색 방법

- **실패 케이스**
    - `SELECT t.members.username FROM Team t`
- **성공 케이스**
    - 명시적 조인으로 별칭 획득 후 탐색
    - `SELECT m.username FROM Team t JOIN t.members m`


### 상태 필드 경로 탐색

```sql
-- JPQL
SELECT m.username, m.age FROM Member m
-- SQL
SELECT m.username, m.age FROM Member m
```

### 단일 값 연관 경로 탐색

```sql
-- JPQL
SELECT o.member FROM Order o
-- SQL (묵시적 조인 발생)
SELECT m.*
FROM Orders o
INNER JOIN Member m ON o.member_id = m.id
```

### 조인 유형

- **명시적 조인 (Explicit Join)**
    - `join` 키워드 직접 사용
    ```sql
    SELECT m FROM Member m JOIN m.team t
    ```
- **묵시적 조인 (Implicit Join)**
    - 경로 표현식에 의해 발생
    - 내부 조인만 가능
    ```sql
    SELECT m.team FROM Member m
    ```

- 조인은 SQL 튜닝의 중요 포인트임
- 묵시적 조인은 조인이 일어나는 상황을 한눈에 파악하기 어려움 (`join` 키워드 없이 조인 발생)
- 따라서 **가급적 명시적 조인을 사용하는 것을 권장함**

<br/><br/>

## 페치 조인 (Fetch Join)

### 페치 조인 기본

- SQL 조인 종류 아님
- JPQL 성능 최적화 기능
- 연관 엔티티/컬렉션을 SQL 한 번에 조회
    - 즉시 로딩
    - N+1 문제 해결

- **문법**
    - `페치 조인 ::= [LEFT [OUTER] | INNER] JOIN FETCH 조인경로`

### 엔티티 페치 조인

```sql
-- JPQL
SELECT m FROM Member m JOIN FETCH m.team

-- 실행된 SQL
SELECT M.*, T.* 
FROM MEMBER M
INNER JOIN TEAM T ON M.TEAM_ID = T.ID
```

- **데이터 흐름**

    ![fetch-join-data-flow](/assets/img/jpa/2026-02-14-jpa-jpql-intermediate/fetch-join-data-flow.png)

```java
String jpql = "SELECT m FROM Member m JOIN FETCH m.team";
List<Member> members = em.createQuery(jpql, Member.class)
    .getResultList();

for (Member member : members) {
    // 페치 조인으로 회원과 팀을 함께 조회 -> 지연 로딩 X
    System.out.println("username = " + member.getUsername() + 
                       ", teamName = " + member.getTeam().getName());
}
```

### 컬렉션 페치 조인

```sql
-- JPQL
SELECT t 
FROM Team t JOIN FETCH t.members
WHERE t.name = '팀A'

-- 실행된 SQL
SELECT T.*, M.*
FROM TEAM T
INNER JOIN MEMBER M ON T.ID = M.TEAM_ID
WHERE T.NAME = '팀A'
```

- **일대다 조인 시 데이터 중복 발생**

    ![collection-fetch-join-deduplication](/assets/img/jpa/2026-02-14-jpa-jpql-intermediate/collection-fetch-join-deduplication.png)

### DISTINCT로 중복 제거

- **Hibernate 6 이전**
    - `DISTINCT`가 SQL에 추가되고, 애플리케이션 레벨에서 엔티티 중복도 제거함

- **Hibernate 6 이후**
    - `DISTINCT` 명령어 없이도 애플리케이션에서 중복 제거가 자동으로 적용됨

    ```java
    String jpql = "SELECT t FROM Team t JOIN FETCH t.members WHERE t.name = '팀A'";
    ```

### 페치 조인과 일반 조인의 차이

- **일반 조인**
    - 연관된 엔티티를 함께 조회하지 않음
    - JPQL은 결과를 반환할 때 연관관계까지 고려하지 않고, 단지 SELECT 절에 지정한 엔티티만 조회함

- **페치 조인**
    - 연관된 엔티티를 함께 조회함 (즉시 로딩)
    - **N+1 문제 해결**

### 페치 조인의 특징과 한계

- **특징**
    - 연관된 엔티티를 SQL 한 번으로 조회하여 성능을 최적화함
    - 글로벌 로딩 전략보다 우선함
    - 실무에서 N+1 문제를 해결하는 주요 기술임

- **한계**

![fetch-join-limits](/assets/img/jpa/2026-02-14-jpa-jpql-intermediate/fetch-join-limits.png)

- **페이징 문제 해결 방법**
    1. 일대다를 다대일로 뒤집어서 쿼리함
    2. `@BatchSize`를 사용하여 해결함
    3. DTO로 직접 조회함

### 페치 조인 정리

- **언제 사용하는가?**
    - 객체 그래프를 유지할 필요가 있을 때
    - 엔티티를 그대로 사용해야 할 때

- **원칙**
    - 모든 것을 페치 조인으로 해결할 수는 없음
    - 전혀 다른 결과가 필요하면 일반 조인을 사용하고 필요한 데이터만 조회해서 DTO로 반환하는 것이 효과적임


<br/><br/>

## 다형성 쿼리

### 상속 관계 모델

![inheritance-model](/assets/img/jpa/2026-02-14-jpa-jpql-intermediate/inheritance-model.png)

### TYPE

- JPQL은 상속 관계에 있는 엔티티를 조회할 때 특정 자식 타입으로 대상을 한정하거나 자식 타입을 다룰 수 있는 기능을 제공함

- **특정 자식 타입으로 조회 대상 한정**

    ```sql
    -- JPQL: Item 중에 Book, Movie만 조회
    SELECT i FROM Item i
    WHERE TYPE(i) IN (Book, Movie)

    -- SQL
    SELECT i FROM i
    WHERE i.DTYPE IN ('B', 'M')
    ```

### TREAT

- **자바의 타입 캐스팅과 유사**

    ```sql
    -- JPQL: 부모를 특정 자식 타입으로 다룸
    SELECT i FROM Item i
    WHERE TREAT(i AS Book).author = 'kim'

    -- SQL
    SELECT i.* FROM Item i
    WHERE i.DTYPE = 'B' AND i.author = 'kim'
    ```

- **사용 가능 위치**
    - FROM 절, WHERE 절, SELECT 절 (Hibernate 지원)

<br/><br/>

## 엔티티 직접 사용

### 기본 키 값 사용

- JPQL에서 엔티티 객체를 직접 식별자로 사용하면, 자동으로 해당 엔티티의 **기본 키(PK) 값**이 SQL에 반영됨

- **원칙**
    - JPQL에서 엔티티를 직접 사용하면 SQL에서 해당 엔티티의 기본 키 값을 사용함

    ```java
    // JPQL 두 가지 방법
    SELECT COUNT(m.id) FROM Member m  // 엔티티 ID 사용
    SELECT COUNT(m) FROM Member m     // 엔티티 직접 사용

    // 둘 다 같은 SQL 실행
    SELECT COUNT(m.id) AS cnt FROM Member m
    ```

### 외래 키 값 사용

```java
Team team = em.find(Team.class, 1L);

// 엔티티 직접 사용
String jpql = "SELECT m FROM Member m WHERE m.team = :team";
List resultList = em.createQuery(jpql)
    .setParameter("team", team)
    .getResultList();

// 외래 키 직접 사용
String jpql = "SELECT m FROM Member m WHERE m.team.id = :teamId";
List resultList = em.createQuery(jpql)
    .setParameter("teamId", teamId)
    .getResultList();

// 둘 다 같은 SQL 실행
SELECT m.* FROM Member m WHERE m.team_id = ?
```

<br/><br/>

## Named 쿼리

### Named 쿼리란?

- 애플리케이션 개발 시 쿼리를 문자로 작성하면 실행 시점에 오류를 발견하는 경우가 많으나, **Named 쿼리**를 사용하면 쿼리에 이름을 부여하여 미리 정의해두고 재사용할 수 있으며 컴파일 시점에 검증이 가능함

### 정의 방법

- **어노테이션 정의**

    ```java
    @Entity
    @NamedQuery(
        name = "Member.findByUsername",
        query = "SELECT m FROM Member m WHERE m.username = :username"
    )
    public class Member {
        // ...
    }
    ```

- **XML 정의**
    - `META-INF/ormMember.xml` 등에 정의하여 사용함
    - XML 설정이 항상 우선권을 가짐

<br/><br/>

## 벌크 연산

### 벌크 연산이 필요한 이유

- **문제 상황**
    - 재고가 10개 미만인 모든 상품 가격을 10% 인상해야 하는 경우
    - **변경 감지(Dirty Checking)** 기능을 사용하면 조회 후 객체마다 수정 쿼리가 나가므로 너무 많은 SQL이 실행됨 (N번)

- **벌크 연산 방식**
    - 쿼리 한 번으로 여러 테이블의 로우를 변경할 수 있음

### 벌크 연산

```java
// UPDATE 벌크 연산
String qlString = "UPDATE Product p " +
                  "SET p.price = p.price * 1.1 " +
                  "WHERE p.stockAmount < :stockAmount";

int resultCount = em.createQuery(qlString)
    .setParameter("stockAmount", 10)
    .executeUpdate();  // 영향받은 엔티티 수 반환
```

### 벌크 연산 주의사항

- **벌크 연산 문제점**
    - 영속성 컨텍스트를 무시하고 DB에 직접 쿼리를 실행함
    - 이로 인해 영속성 컨텍스트와 DB 간에 데이터 불일치가 발생할 수 있음

- **해결 방법**
    - **벌크 연산을 먼저 실행함**
    - **벌크 연산 수행 후 영속성 컨텍스트 초기화 (`em.clear()`)**

<br/><br/>

## 연습 문제

1. 컬렉션 값 연관 경로 표현식 사용 시 특징은 무엇일까요?

   a. 별칭 없이 추가 탐색 제약

   - 컬렉션 값 연관 경로는 그 자체로 탐색이 끝남
   - 추가로 더 탐색하려면 명시적으로 `JOIN`해서 별칭을 얻어야 가능함

2. JPQL 페치 조인(Fetch Join)의 주된 목적은 무엇일까요?

   a. N+1 문제 해결

   - 페치 조인은 연관된 엔티티나 컬렉션을 한 번에 가져와서 지연 로딩 시 발생하는 N+1 문제를 효과적으로 해결하는 데 사용됨

3. 컬렉션 페치 조인 사용 시 주의사항은 무엇일까요?

   a. 페이징 API 제약

   - 컬렉션을 페치 조인하면 데이터 뻥튀기가 발생해서, 데이터베이스 레벨에서 결과를 줄이는 페이징 API 사용이 어려움
   - 인메모리 페이징 경고가 뜰 수 있음

4. JPA 벌크 연산(UPDATE, DELETE) 실행 후 권장되는 조치는 무엇일까요?

   a. 영속성 컨텍스트 초기화

   - 벌크 연산은 영속성 컨텍스트를 통과하고 DB에 직접 반영됨
   - 컨텍스트와 DB 간의 데이터 불일치를 막으려면 벌크 연산 후 영속성 컨텍스트를 초기화해야 함

5. JPQL에서 상속 관계에 있는 부모 엔티티를 특정 자식 타입으로 다루기 위해 사용하는 키워드는 무엇일까요?

   a. TREAT

   - JPQL의 TREAT 키워드는 상속 구조에서 부모 타입 엔티티를 지정된 자식 타입으로 취급하여 자식 타입에만 있는 속성에 접근할 수 있게 해줌

<br/><br/>

## 요약 정리

- **경로 표현식**은 `.`(점)을 찍어 객체 그래프를 탐색하며, 묵시적 조인을 피하기 위해 명시적 조인을 사용하는 것이 좋음
- **페치 조인**은 SQL 한 번으로 연관된 엔티티를 함께 조회하여 N+1 문제를 해결하는 주요 기술이나, 컬렉션 페치 조인 시에는 페이징 API를 사용할 수 없으므로 주의해야 함
- **다형성 쿼리**는 `TYPE`, `TREAT` 등을 사용하여 상속 관계에 있는 엔티티를 특정 타입으로 조회하거나 다룰 수 있음
- **엔티티 직접 사용** 시 JPQL에서 엔티티를 파라미터나 검색 조건으로 사용하면 SQL에서는 해당 엔티티의 기본 키 값을 사용함
- **Named 쿼리**는 미리 정의해서 이름을 부여하고 사용하는 쿼리로, 정적 쿼리이며 애플리케이션 로딩 시점에 컴파일 오류를 확인할 수 있음
- **벌크 연산**은 한 번의 쿼리로 대량의 데이터를 수정하거나 삭제할 때 사용하며, 사용 후에는 반드시 영속성 컨텍스트를 초기화해야 함

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
