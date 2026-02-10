---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] JPA 시작하기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-10 16:59:00 +0900
category: [Framework, JPA]
tags: [jpa, orm, hibernate, java, persistence, jpql, h2]
math: false
mermaid: false
---

# JPA 시작하기

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 JPA의 기본 개념, 프로젝트 환경 설정, 엔티티 매핑, 그리고 JPQL을 활용한 데이터 조회 방법을 정리함

<br/><br/>

## 프로젝트 환경 설정

### 의존성 설정

- **pom.xml 핵심 의존성**

    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/ex1-hello-jpa/pom.xml)

    ```xml
    <dependencies>
        <!-- JPA 하이버네이트 -->
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-entitymanager</artifactId>
            <version>5.3.10.Final</version>
        </dependency>
        
        <!-- H2 데이터베이스 -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <version>1.4.199</version>
        </dependency>
    </dependencies>
    ```

- **의존성 설명**
    - `hibernate-entitymanager`
        - JPA 구현체인 Hibernate를 포함함
    - `h2`
        - 경량 데이터베이스로 학습 및 테스트 환경에 적합함

<br/><br/>

## H2 데이터베이스

### H2 데이터베이스 소개

- **주요 특징**
    - 매우 가볍고 빠름 (용량 약 1.5MB)
    - 웹용 쿼리 도구를 제공함
    - MySQL, Oracle 데이터베이스 시뮬레이션 기능 지원
    - 시퀀스, `AUTO_INCREMENT` 기능 지원
- **다운로드**
    - http://www.h2database.com/

### H2 데이터베이스 실행

- **실행 방법**

    ```bash
    # Windows
    h2.bat
    
    # Mac/Linux
    chmod 755 h2.sh
    ./h2.sh
    ```

- **접속 정보**
    - JDBC URL
        - `jdbc:h2:tcp://localhost/~/test`
    - 사용자명
        - `sa`
    - 비밀번호
        - (없음)

### 테이블 생성

- **Member 테이블 DDL**

    ```sql
    CREATE TABLE Member (
        id BIGINT NOT NULL,
        name VARCHAR(255),
        PRIMARY KEY (id)
    );
    ```

<br/><br/>

## JPA 설정

### persistence.xml 파일 위치

- **파일 경로 (필수)**

    ```
    src/
      └── main/
          └── resources/
              └── META-INF/
                  └── persistence.xml  ← 반드시 이 경로에 위치
    ```

- `JPA`는 `META-INF/persistence.xml` 경로에서 설정 파일을 자동으로 인식함

### persistence.xml 설정

- **전체 설정 파일**

    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/ex1-hello-jpa/src/main/resources/META-INF/persistence.xml)

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <persistence version="2.2"
                 xmlns="http://xmlns.jcp.org/xml/ns/persistence"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/persistence 
                 http://xmlns.jcp.org/xml/ns/persistence/persistence_2_2.xsd">
        
        <persistence-unit name="hello">
            <properties>
                <!-- 필수 속성 -->
                <property name="javax.persistence.jdbc.driver" value="org.h2.Driver"/>
                <property name="javax.persistence.jdbc.user" value="sa"/>
                <property name="javax.persistence.jdbc.password" value=""/>
                <property name="javax.persistence.jdbc.url" value="jdbc:h2:tcp://localhost/~/test"/>
                <property name="hibernate.dialect" value="org.hibernate.dialect.H2Dialect"/>
                
                <!-- 옵션 -->
                <property name="hibernate.show_sql" value="true"/>
                <property name="hibernate.format_sql" value="true"/>
                <property name="hibernate.use_sql_comments" value="true"/>
            </properties>
        </persistence-unit>
    </persistence>
    ```

### 필수 속성 설명

- **JDBC 드라이버 설정**
    - `javax.persistence.jdbc.driver`
        - 데이터베이스 드라이버 클래스 지정 (H2는 `org.h2.Driver`)
- **데이터베이스 접속 정보**
    - `javax.persistence.jdbc.user`
        - DB 사용자명
    - `javax.persistence.jdbc.password`
        - DB 비밀번호
    - `javax.persistence.jdbc.url`
        - JDBC URL
- **데이터베이스 방언**
    - `hibernate.dialect`
        - 특정 데이터베이스에 맞는 SQL을 생성하도록 지정함

### 옵션 속성 설명

- **SQL 로깅 옵션**
    - `hibernate.show_sql`
        - 실행되는 SQL을 콘솔에 출력함
    - `hibernate.format_sql`
        - SQL을 보기 좋게 포맷팅하여 출력함
    - `hibernate.use_sql_comments`
        - 쿼리에 주석을 추가하여 어떤 작업인지 표시함

### 데이터베이스 방언 (Dialect)

- **방언이란?**
    - JPA는 특정 데이터베이스에 종속되지 않는 표준 기술임
    - 각 데이터베이스마다 SQL 문법과 함수가 조금씩 다름
    - 방언(Dialect)은 JPA가 사용하는 SQL을 특정 데이터베이스에 맞게 변환해주는 역할을 함

- **데이터베이스별 차이점 예시**

    | 기능 | MySQL | Oracle | H2 |
    |------|-------|--------|-----|
    | 가변 문자 타입 | `VARCHAR` | `VARCHAR2` | `VARCHAR` |
    | 문자열 자르기 | `SUBSTRING()` | `SUBSTR()` | `SUBSTRING()` |
    | 페이징 | `LIMIT` | `ROWNUM` | `LIMIT` |

- **주요 방언 클래스**
    - H2
        - `org.hibernate.dialect.H2Dialect`
    - Oracle 10g
        - `org.hibernate.dialect.Oracle10gDialect`
    - MySQL 5 InnoDB
        - `org.hibernate.dialect.MySQL5InnoDBDialect`
    - PostgreSQL
        - `org.hibernate.dialect.PostgreSQL95Dialect`

- Hibernate는 40가지 이상의 데이터베이스 방언을 지원함

<br/><br/>

## 애플리케이션 개발

### JPA 구동 방식

1. **설정 정보 조회**
    - `Persistence` 클래스가 `META-INF/persistence.xml` 파일을 읽음
2. **EntityManagerFactory 생성**
    - 애플리케이션 전체에서 하나만 생성하여 공유함
3. **EntityManager 생성**
    - 요청마다 생성하며 쓰레드 간 공유하지 않음
4. **트랜잭션 시작 및 비즈니스 로직 실행**
    - 모든 데이터 변경은 트랜잭션 내에서 수행됨
5. **트랜잭션 커밋 또는 롤백**
6. **EntityManager 종료**
7. **EntityManagerFactory 종료**

### 엔티티 클래스 생성

- **Member 엔티티**

    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/ex1-hello-jpa/src/main/java/hellojpa/Member.java)

    ```java
    @Entity  // JPA가 관리하는 엔티티
    public class Member {
        
        @Id  // 기본 키 매핑
        private Long id;
        private String name;
        
        // 기본 생성자 필수 (JPA 스펙)
        public Member() {
        }
        
        // Getter, Setter
    }
    ```

- **주요 애노테이션**
    - `@Entity`
        - JPA가 관리하는 객체임을 나타내며 테이블과 매핑됨
    - `@Id`
        - 테이블의 Primary Key와 매핑됨

### 애플리케이션 기본 구조

- **JpaMain 클래스**

    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/ex1-hello-jpa/src/main/java/hellojpa/JpaMain.java)

    ```java
    public class JpaMain {
        public static void main(String[] args) {
            // EntityManagerFactory 생성 (애플리케이션 로딩 시점에 딱 한 번)
            EntityManagerFactory emf = 
                Persistence.createEntityManagerFactory("hello");
            
            // EntityManager 생성
            EntityManager em = emf.createEntityManager();
            
            // 트랜잭션 시작
            EntityTransaction tx = em.getTransaction();
            tx.begin();
            
            try {
                // 비즈니스 로직 (CRUD)
                
                tx.commit();
            } catch (Exception e) {
                tx.rollback();
            } finally {
                em.close();
            }
            
            emf.close();
        }
    }
    ```

### 회원 등록 (INSERT)

- **등록 코드**

    ```java
    // 회원 등록
    Member member = new Member();
    member.setId(1L);
    member.setName("HelloA");
    
    em.persist(member);  // 영속화
    ```

    - 반드시 트랜잭션 안에서 실행되어야 함

- **실행되는 SQL**

    ```sql
    Hibernate: 
        /* insert hellojpa.Member */
        insert into Member (name, id) 
        values (?, ?)
    ```

### 회원 조회 (SELECT)

- **조회 코드**

    ```java
    // 회원 조회
    Member findMember = em.find(Member.class, 1L);
    System.out.println("findMember.id = " + findMember.getId());
    System.out.println("findMember.name = " + findMember.getName());
    ```

- **실행되는 SQL**

    ```sql
    Hibernate: 
        select
            member0_.id as id1_0_0_,
            member0_.name as name2_0_0_ 
        from
            Member member0_ 
        where
            member0_.id=?
    ```

### 회원 수정 (UPDATE)

- **수정 코드**

    ```java
    // 회원 조회
    Member findMember = em.find(Member.class, 1L);
    
    // 회원 수정 (변경 감지)
    findMember.setName("HelloJPA");
    
    // em.persist(findMember) 불필요
    // 트랜잭션 커밋 시점에 자동으로 UPDATE SQL 실행
    ```

    - JPA는 트랜잭션 커밋 시점에 엔티티의 변경을 감지하여 `UPDATE SQL`을 자동 생성함
    - 변경 감지가 동작하려면 반드시 트랜잭션 안에서 실행되어야 함

- **실행되는 SQL**

    ```sql
    Hibernate: 
        /* update hellojpa.Member */ 
        update Member 
        set name=? 
        where id=?
    ```

### 회원 삭제 (DELETE)

- **삭제 코드**

    ```java
    // 회원 조회
    Member findMember = em.find(Member.class, 1L);
    
    // 회원 삭제
    em.remove(findMember);
    ```

    - 반드시 트랜잭션 안에서 실행되어야 함

- **실행되는 SQL**

    ```sql
    Hibernate: 
        /* delete hellojpa.Member */ 
        delete from Member 
        where id=?
    ```

### JPA 주의사항

- **EntityManagerFactory**
    - 애플리케이션 전체에서 하나만 생성하여 공유해야 함
    - 생성 비용이 크므로 애플리케이션 로딩 시점에 딱 한 번만 생성함

- **EntityManager**
    - 쓰레드 간 공유를 절대 금지함 (동시성 문제 발생)
    - 요청마다 생성하고 사용 후 반드시 종료해야 함

- **트랜잭션**
    - JPA의 모든 데이터 변경은 트랜잭션 안에서만 실행해야 함
    - 조회는 트랜잭션 없이도 가능함

<br/><br/>

## JPQL

### JPQL이 필요한 이유

- **기본 조회 방법의 한계**
    - `em.find()` 메서드는 PK 기반 단건 조회만 가능함
    - 복잡한 검색 조건 (예: "나이가 18살 이상인 회원을 모두 검색")이 필요한 경우 해결 불가능함

### JPQL 소개

- **JPQL (Java Persistence Query Language)**
    - 엔티티 객체를 대상으로 검색하는 객체지향 쿼리 언어
    - SQL과 문법이 유사하지만 테이블이 아닌 엔티티 객체를 대상으로 쿼리를 작성함
    - 실행 시 SQL로 변환되어 데이터베이스에 전달됨

### JPQL과 SQL 비교

| 특징 | JPQL | SQL |
|------|------|-----|
| 대상 | 엔티티 객체 | 테이블 |
| 문법 | 객체 지향 | 관계형 |
| DB 독립성 | 독립적 | 종속적 |
| 추상화 수준 | 추상화된 쿼리 | 구체적 쿼리 |

### JPQL 기본 예제

- **전체 회원 조회**

    ```java
    // JPQL로 전체 회원 조회
    List<Member> result = em.createQuery(
        "select m from Member m",  // 엔티티 객체 대상
        Member.class
    ).getResultList();
    
    for (Member member : result) {
        System.out.println("member.name = " + member.getName());
    }
    ```

- **실행되는 SQL**

    ```sql
    Hibernate: 
        /* select m from Member m */ 
        select
            member0_.id as id1_0_,
            member0_.name as name2_0_ 
        from
            Member member0_
    ```

### 조건 검색

- **WHERE 절 사용**

    ```java
    // ID가 2 이상인 회원만 검색
    List<Member> result = em.createQuery(
        "select m from Member m where m.id > 2",
        Member.class
    ).getResultList();
    ```

### 파라미터 바인딩

- **이름 기준 파라미터 바인딩**

    ```java
    // 이름이 일치하는 회원 검색
    List<Member> result = em.createQuery(
        "select m from Member m where m.name = :name",
        Member.class
    )
    .setParameter("name", "HelloA")
    .getResultList();
    ```

    - 파라미터 바인딩을 사용하면 SQL 인젝션 공격을 방지하고 쿼리 재사용이 가능함

### 페이징

- **페이징 처리**

    ```java
    // 페이징: 1번부터 10개 조회
    List<Member> result = em.createQuery(
        "select m from Member m order by m.id desc",
        Member.class
    )
    .setFirstResult(1)    // 시작 위치 (0부터 시작)
    .setMaxResults(10)    // 조회할 데이터 수
    .getResultList();
    ```

- **실행되는 SQL (H2)**

    ```sql
    select
        member0_.id as id1_0_,
        member0_.name as name2_0_ 
    from
        Member member0_ 
    order by
        member0_.id desc 
    limit ? offset ?
    ```

### JPQL 문법

- **기본 문법**

    ```sql
    -- SELECT 문
    SELECT m FROM Member m WHERE m.age > 18
    
    -- UPDATE 문
    UPDATE Member m SET m.age = 20 WHERE m.age < 18
    
    -- DELETE 문
    DELETE FROM Member m WHERE m.age < 18
    ```

- **주요 특징**
    - 엔티티와 속성은 대소문자를 구분함 (`Member`, `name`)
    - JPQL 키워드는 대소문자를 구분하지 않음 (`SELECT`, `FROM`, `WHERE`)
    - 엔티티 이름을 사용하며, 테이블 이름이 아님
    - 별칭(alias) 사용이 필수임
        - ex) `select m from Member m`

<br/><br/>

## 요약 정리

- **JPA**는 자바 ORM 표준으로, 객체와 관계형 데이터베이스 간의 매핑을 처리하고 SQL을 자동 생성하여 개발 생산성을 크게 향상시킴
- **EntityManagerFactory**는 애플리케이션 전체에서 하나만 생성하여 공유하며, **EntityManager**는 요청마다 생성하고 쓰레드 간 공유를 금지해야 함
- **persistence.xml** 파일을 통해 데이터베이스 연결 정보와 JPA 설정을 관리하며, 반드시 `META-INF` 디렉토리에 위치해야 함
- 데이터베이스 방언(Dialect)을 사용하면 특정 데이터베이스에 종속되지 않고 다양한 데이터베이스를 지원할 수 있음
- JPA의 모든 데이터 변경 작업은 반드시 **트랜잭션** 안에서 실행되어야 하며, 변경 감지(Dirty Checking) 기능을 통해 별도의 `update` 메서드 호출 없이 데이터 수정이 가능함
- **JPQL**은 엔티티 객체를 대상으로 하는 객체지향 쿼리 언어로, 복잡한 검색 조건이 필요한 경우 SQL을 직접 작성하지 않고도 데이터를 조회할 수 있음
- `em.persist()`로 저장, `em.find()`로 조회, setter로 수정(변경 감지), `em.remove()`로 삭제하는 기본 CRUD 패턴을 숙지하는 것이 중요함

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
