---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 객체지향 쿼리 언어1 - 기본 문법'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-14 16:00:00 +0900
category: [Language, Java, JPA]
tags: [jpa, jpql, orm, query, object-oriented-query, projection, paging, join]
math: false
mermaid: true
---

# 객체지향 쿼리 언어1 - 기본 문법

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 JPQL의 기본 문법인 소개, 기본 기능, 프로젝션, 페이징, 조인, 서브쿼리 등을 정리함

<br/><br/>

## 객체지향 쿼리 언어 소개

### JPA가 지원하는 쿼리 방법

![jpa-query-methods](/assets/images/2026-02-14-jpa-jpql-basics/jpa-query-methods.png)

### JPQL이 필요한 이유

- **기본 조회 방법의 한계**
    - `EntityManager.find()`
        - 단순히 PK를 사용한 조회만 가능함
    - 객체 그래프 탐색
        - `a.getB().getC()`와 같이 탐색 범위가 제한적임
    - **문제**
        - "나이가 18살 이상인 회원을 모두 검색하고 싶다면?"과 같은 복잡한 검색 조건 처리가 어려움

- **해결책**
    - **JPQL**
    - 엔티티 객체를 대상으로 쿼리함
    - SQL을 추상화하여 특정 DB에 비의존적임
    - 검색 조건이 포함된 쿼리 작성이 가능함

### JPQL의 특징

```java
// JPQL 예시
String jpql = "select m from Member m where m.name like '%hello%'";
List<Member> result = em.createQuery(jpql, Member.class)
    .getResultList();
```

| 특징 | 설명 |
|------|------|
| **대상** | 엔티티 객체 (테이블 아님) |
| **추상화** | 특정 DB SQL에 의존하지 않음 |
| **변환** | JPQL -> SQL 자동 변환 |
| **정의** | 객체 지향 SQL |

- **실행 결과 비교**

    ```sql
    -- JPQL
    select m from Member m where m.age > 18

    -- 실행된 SQL
    SELECT 
        m.id as id,
        m.age as age,
        m.USERNAME as USERNAME,
        m.TEAM_ID as TEAM_ID
    FROM Member m
    WHERE m.age > 18
    ```

### 다른 쿼리 방법 비교

- **Criteria**

    ```java
    // Criteria 사용 예시
    CriteriaBuilder cb = em.getCriteriaBuilder();

    CriteriaQuery<Member> query = cb.createQuery(Member.class);
    Root<Member> m = query.from(Member.class);
    
    CriteriaQuery<Member> cq = query.select(m)
        .where(cb.equal(m.get("username"), "kim"));
    List<Member> resultList = em.createQuery(cq).getResultList();
    ```

    - **장점**
        - 자바 코드로 JPQL을 작성함
        - JPA 공식 기능임
    - **단점**
        - 너무 복잡하고 실용성이 낮음

- **QueryDSL (추천)**

    ```java
    JPAQueryFactory query = new JPAQueryFactory(em);
    QMember m = QMember.member;

    List<Member> list = query.selectFrom(m)
        .where(m.age.gt(18))
        .orderBy(m.name.desc())
        .fetch();
    ```

    - **장점**
        - 자바 코드로 JPQL을 작성함
        - 컴파일 시점에 문법 오류를 발견할 수 있음
        - 동적 쿼리 작성이 편리함
        - 단순하고 쉬움

- **Native SQL**

    ```java
    String sql = "SELECT ID, AGE, TEAM_ID, NAME FROM MEMBER WHERE NAME = 'kim'";
    List<Member> resultList = em.createNativeQuery(sql, Member.class)
        .getResultList();
    ```

    - **사용 시기**
        - JPQL로 해결 불가능한 DB 의존적 기능
        - ex) Oracle CONNECT BY, 특정 DB SQL 힌트

    - **JDBC 직접 사용**

    - **주의사항**
        - JPA와 함께 사용 가능함
        - **영속성 컨텍스트를 적절한 시점에 수동 플러시해야 함**
        - JPA 우회 SQL 실행 직전에 플러시를 호출해야 함

<br/><br/>

## JPQL 기본 문법과 기능

### 데이터 모델

![jpql-data-model](/assets/images/2026-02-14-jpa-jpql-basics/jpql-data-model.png)

### JPQL 문법 구조

```
select_문 ::= 
    select_절
    from_절
    [where_절]
    [groupby_절]
    [having_절]
    [orderby_절]

update_문 ::= update_절 [where_절]
delete_문 ::= delete_절 [where_절]
```

### JPQL 문법 규칙

```sql
select m from Member as m where m.age > 18
```

| 항목 | 규칙 |
|------|------|
| **엔티티/속성** | 대소문자 구분 O (`Member`, `age`) |
| **JPQL 키워드** | 대소문자 구분 X (`SELECT`, `from`, `WHERE`) |
| **엔티티 이름** | 테이블명 아닌 엔티티명 사용 (`@Entity(name="...")`) |
| **별칭** | 필수 (`as` 생략 가능) |

### 집합 함수와 정렬

```sql
SELECT
    COUNT(m),      -- 회원수
    SUM(m.age),    -- 나이 합
    AVG(m.age),    -- 평균 나이
    MAX(m.age),    -- 최대 나이
    MIN(m.age)     -- 최소 나이
FROM Member m
GROUP BY m.team
HAVING AVG(m.age) >= 20
ORDER BY m.age DESC
```

### 반환 타입

- 작성한 JPQL을 실행하려면 쿼리 객체를 만들어야 하는데, 반환 타입이 명확한지 여부에 따라 사용하는 객체가 다름

- **TypedQuery**
    ```java
    // 반환 타입이 명확할 때 사용
    TypedQuery<Member> query = 
        em.createQuery("SELECT m FROM Member m", Member.class);
    ```

- **Query**
    ```java
    // 반환 타입 불명확할 때 사용
    Query query = 
        em.createQuery("SELECT m.username, m.age FROM Member m");
    ```

- **결과 조회 API**

    - 쿼리 객체를 생성한 후에는 결과 조회 API를 호출하여 실제 데이터를 조회함
    - `getResultList()`
        - 결과가 하나 이상일 때 리스트 반환
        - 결과가 없으면 빈 리스트 반환
        ```java
        List<Member> members = query.getResultList();
        ```
    - `getSingleResult()`
        - 결과가 정확히 하나일 때 단일 객체 반환
        - 결과 없으면 `NoResultException` 발생
        - 결과 둘 이상이면 `NonUniqueResultException` 발생
        ```java
        Member member = query.getSingleResult();
        ```

### 파라미터 바인딩

```java
// 이름 기준 (권장)
String jpql = "SELECT m FROM Member m WHERE m.username = :username";
query.setParameter("username", usernameParam);

// 위치 기준 (비권장)
String jpql = "SELECT m FROM Member m WHERE m.username = ?1";
query.setParameter(1, usernameParam);
```

### 프로젝션 (Projection)

- **프로젝션(Projection)**
    - `SELECT` 절에 조회할 대상을 지정하는 것을 말함

![jpql-projection](/assets/images/2026-02-14-jpa-jpql-basics/jpql-projection.png)

- **여러 값 조회 방법**

    ```java
    // Query 타입
    Query query = em.createQuery("SELECT m.username, m.age FROM Member m");

    // Object[] 타입
    List<Object[]> resultList = em.createQuery("SELECT m.username, m.age FROM Member m")
        .getResultList();

    // new 명령어 (권장)
    List<UserDTO> resultList = em.createQuery(
        "SELECT new jpabook.jpql.UserDTO(m.username, m.age) FROM Member m",
        UserDTO.class)
        .getResultList();
    ```

    - **`new` 명령어 사용 시 주의사항**
        - 패키지명을 포함한 전체 클래스명을 입력해야 함
        - 순서와 타입이 일치하는 생성자가 필요함

### 페이징 (Paging)

```java
// 페이징 쿼리
String jpql = "SELECT m FROM Member m ORDER BY m.name DESC";
List<Member> resultList = em.createQuery(jpql, Member.class)
    .setFirstResult(10)    // 조회 시작 위치 (0부터 시작)
    .setMaxResults(20)     // 조회할 데이터 수
    .getResultList();
```

- **데이터베이스별 방언 자동 변환**

    ```sql
    -- MySQL
    SELECT M.* FROM MEMBER M 
    ORDER BY M.NAME DESC 
    LIMIT ?, ?

    -- Oracle
    SELECT * FROM (
        SELECT ROW_.*, ROWNUM ROWNUM_
        FROM (
            SELECT M.* FROM MEMBER M ORDER BY M.NAME
        ) ROW_
        WHERE ROWNUM <= ?
    ) WHERE ROWNUM_ > ?
    ```

### 조인 (JOIN)

```java
// 내부 조인
SELECT m FROM Member m [INNER] JOIN m.team t

// 외부 조인
SELECT m FROM Member m LEFT [OUTER] JOIN m.team t

// 세타 조인
SELECT COUNT(m) FROM Member m, Team t 
WHERE m.username = t.name
```

- **ON 절 활용**

    - JPA 2.1부터는 `ON` 절을 지원하여 조인 대상을 필터링하거나 연관관계가 없는 엔티티를 조인할 수 있게 됨

    - **조인 대상 필터링**
        ```sql
        -- JPQL
        SELECT m, t FROM Member m 
        LEFT JOIN m.team t ON t.name = 'A'

        -- SQL
        SELECT m.*, t.* FROM Member m 
        LEFT JOIN Team t ON m.TEAM_ID = t.id AND t.name = 'A'
        ```

    - **연관관계 없는 엔티티 외부 조인** 
        ```sql
        -- JPQL
        SELECT m, t FROM Member m 
        LEFT JOIN Team t ON m.username = t.name

        -- SQL
        SELECT m.*, t.* FROM Member m 
        LEFT JOIN Team t ON m.username = t.name
        ```

### 서브 쿼리

```sql
-- 나이가 평균보다 많은 회원
SELECT m FROM Member m
WHERE m.age > (SELECT AVG(m2.age) FROM Member m2)

-- 한 건이라도 주문한 고객
SELECT m FROM Member m
WHERE (SELECT COUNT(o) FROM Order o WHERE m = o.member) > 0
```

- **서브 쿼리 지원 함수**

    | 함수 | 설명 |
    |------|------|
    | `EXISTS` | 서브쿼리에 결과가 존재하면 참 |
    | `ALL` | 모두 만족하면 참 |
    | `ANY/SOME` | 하나라도 만족하면 참 |
    | `IN` | 서브쿼리 결과 중 하나라도 같으면 참 |


    ```sql
    -- 팀A 소속인 회원
    SELECT m FROM Member m
    WHERE EXISTS (SELECT t FROM m.team t WHERE t.name = '팀A')

    -- 전체 상품 각각의 재고보다 주문량이 많은 주문들
    SELECT o FROM Order o
    WHERE o.orderAmount > ALL (SELECT p.stockAmount FROM Product p)

    -- 어떤 팀이든 팀에 소속된 회원
    SELECT m FROM Member m
    WHERE m.team = ANY (SELECT t FROM Team t)
    ```

- **서브 쿼리 한계**

![jpql-subquery-limits](/assets/images/2026-02-14-jpa-jpql-basics/jpql-subquery-limits.png)

- **Hibernate 6 변경사항**
    - `FROM` 절에서도 서브쿼리 사용을 지원하기 시작함

### 타입 표현

```sql
-- 문자
'HELLO', 'She''s'

-- 숫자
10L (Long), 10D (Double), 10F (Float)

-- Boolean
TRUE, FALSE

-- ENUM (패키지명 포함)
jpabook.MemberType.Admin

-- 엔티티 타입 (상속 관계)
TYPE(m) = Member
```

### 조건식

- **CASE 식**

    ```sql
    -- 기본 CASE 식
    SELECT
        CASE WHEN m.age <= 10 THEN '학생요금'
            WHEN m.age >= 60 THEN '경로요금'
            ELSE '일반요금'
        END
    FROM Member m

    -- 단순 CASE 식
    SELECT
        CASE t.name
            WHEN '팀A' THEN '인센티브110%'
            WHEN '팀B' THEN '인센티브120%'
            ELSE '인센티브105%'
        END
    FROM Team t
    ```

- **조건식 함수**
  - `COALESCE`
    - null이 아니면 반환
    ```sql
    SELECT COALESCE(m.username, '이름 없는 회원') FROM Member m
    ```
  - `NULLIF`
    - 두 값이 같으면 null, 다르면 첫번째 값
    ```sql
    SELECT NULLIF(m.username, '관리자') FROM Member m
    ```

### JPQL 기본 함수

| 함수 | 설명 |
|------|------|
| `CONCAT` | 문자열 연결 |
| `SUBSTRING` | 부분 문자열 |
| `TRIM` | 공백 제거 |
| `LOWER/UPPER` | 대소문자 변환 |
| `LENGTH` | 문자열 길이 |
| `LOCATE` | 문자열 위치 |
| `ABS/SQRT/MOD` | 수학 함수 |
| `SIZE/INDEX` | JPA 전용 |

- **사용자 정의 함수**

    ```sql
    -- 사용법
    SELECT FUNCTION('group_concat', i.name) FROM Item i
    ```

- **등록 방법**
    1. DB 방언 클래스 상속
    2. 사용자 정의 함수 등록

<br/><br/>

## 연습 문제

1. JPQL이 데이터베이스의 SQL과 가장 근본적으로 다른 점은 무엇일까요?

   a. 질의 대상

   - JPQL은 데이터베이스 테이블이 아닌 엔티티 객체를 대상으로 쿼리하는 객체지향 언어임
   - 이는 테이블을 대상으로 하는 SQL과의 가장 큰 차이점임

2. 자바 코드로 작성하며 타입 안정성이 높고 동적 쿼리 구현이 편리하여 JPA 쿼리 방식으로 권장되는 것은 무엇인가요?

   a. QueryDSL

   - QueryDSL은 자바 코드로 JPQL을 타입 안전하게 작성하게 해주고 동적 쿼리 생성을 매우 편리하게 지원하여 권장됨

3. JPA에서 페이지네이션(Paging)을 구현할 때 사용하는 Query API의 핵심 메서드 두 가지는 무엇인가요?

   a. setFirstResult, setMaxResults

   - JPA 표준 API인 `setFirstResult`와 `setMaxResults`를 통해 페이지네이션 시작 위치와 조회할 최대 개수를 지정함

4. JPA 표준 JPQL 명세에서 서브쿼리 사용이 허용되는 절(Clause)은 어디인가요?

   a. WHERE 절 또는 HAVING 절

   - JPA 표준 JPQL에서는 서브쿼리를 WHERE 절과 HAVING 절에서만 사용할 수 있음
   - FROM 절 사용은 제한됨

5. JPQL에서 여러 스칼라 값을 조회한 결과를 DTO 객체로 바로 매핑받고 싶을 때 사용하는 문법은 무엇인가요?

   a. SELECT NEW

   - JPQL의 `NEW` 명령어를 사용하면 조회 결과를 지정된 DTO 생성자에 전달하여 바로 DTO 객체로 받아올 수 있음

<br/><br/>

## 요약 정리

- **JPQL**은 엔티티 객체를 대상으로 하는 객체지향 쿼리 언어로, SQL을 추상화하여 특정 DB에 의존하지 않음
- **기본 문법**에서 엔티티와 속성은 대소문자를 구분하며, 별칭은 필수로 사용해야 함
- **프로젝션**을 통해 엔티티, 임베디드 타입, 스칼라 타입 등 다양한 대상을 조회할 수 있으며, DTO 조회 시에는 `new` 명령어를 사용함
- **페이징**은 `setFirstResult`, `setMaxResults` API로 추상화되어 있어 DB 방언에 맞게 SQL이 자동 생성됨
- **조인**은 내부 조인, 외부 조인, 세타 조인을 지원하며 `ON` 절을 활용한 필터링도 가능함
- **서브쿼리**는 `WHERE`, `HAVING` 절에서 주로 사용하며, Hibernate 6부터는 `FROM` 절에서도 지원함

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
