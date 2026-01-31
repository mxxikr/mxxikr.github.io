---
title: '[김영한의 스프링 DB 1편 데이터 접근 핵심 원리] JDBC 이해'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-31 12:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, jdbc, database, sql, connection, datasource]
math: false
mermaid: false
---

# JDBC 이해

- 김영한님의 스프링 DB 1편 강의를 통해 JDBC의 탄생 배경과 핵심 원리를 이해하고, JDBC를 활용한 데이터베이스 CRUD 개발 방법을 정리함

<br/><br/>


## H2 데이터베이스 설정

### H2 소개

- 개발/테스트 용도로 적합한 가볍고 편리한 DB
- SQL 실행 가능한 웹 화면 제공
- 다운로드
  - `https://www.h2database.com`

### 설정 방법

- **실행**
  - MAC/리눅스
    - `cd bin`, `chmod 755 h2.sh`, `./h2.sh`
  - 윈도우
    - `h2.bat`

- **데이터베이스 파일 생성 (최초 한번)**
  - 사용자명
    - `sa`
  - JDBC URL
    - `jdbc:h2:~/test`
    - "연결" 버튼 직접 클릭 ("연결 시험"은 오류 발생)
  - `~/test.mv.db` 파일 생성 확인

- **이후 접속**
  - JDBC URL
    - `jdbc:h2:tcp://localhost/~/test`

- **테이블 생성**
  ```sql
  drop table member if exists cascade;
  
  create table member (
      member_id varchar(10),
      money integer not null default 0,
      primary key (member_id)
  );
  ```

<br/><br/>

## JDBC 표준 인터페이스

### JDBC 등장 배경

- 애플리케이션 개발 시 데이터베이스에 데이터 보관 필요
- 각 DB마다 커넥션 연결, SQL 전달, 결과 응답 방식이 다름
- **문제점**
  - DB 변경 시 애플리케이션 코드도 전부 변경 필요
  - 각 DB마다 사용법을 새로 학습해야 함

![JDBC Interface Structure](/assets/img/springdb/jdbc_interface_structure.png)

### JDBC 표준 인터페이스

> **JDBC (Java Database Connectivity)**
> - 자바에서 데이터베이스에 접속할 수 있도록 하는 자바 API

- **3가지 표준 인터페이스**
  - `java.sql.Connection`
    - 연결
  - `java.sql.Statement`
    - SQL을 담은 내용
  - `java.sql.ResultSet`
    - SQL 요청 응답

- **JDBC 드라이버**
  - 각 DB 벤더가 JDBC 인터페이스를 자신의 DB에 맞게 구현한 라이브러리
  - MySQL Driver, Oracle Driver, H2 Driver 등

### JDBC의 장점

- **DB 변경 시 코드 변경 불필요**
  - 애플리케이션은 JDBC 표준 인터페이스에만 의존
  - JDBC 구현 라이브러리만 변경
- **학습 비용 감소**
  - JDBC 표준 인터페이스 사용법만 학습
  - 한 번 배우면 수십 개 DB에 적용 가능

> **표준화의 한계**
> - 각 DB마다 SQL 문법과 기능이 조금씩 다름 (예: 페이징 SQL)
> - JPA 사용 시 이 문제도 많은 부분 해결 가능

<br/><br/>

## JDBC와 최신 데이터 접근 기술

### JDBC 직접 사용

- 1997년 출시된 오래된 기술
- 사용 방법이 복잡함
- 현재는 JDBC를 편리하게 사용하는 기술 등장

### SQL Mapper

![SQL Mapper](/assets/img/springdb/sql_mapper.png)

- **장점**
  - JDBC 반복 코드 제거
  - SQL 응답 결과를 객체로 편리하게 변환
- **단점**
  - 개발자가 SQL을 직접 작성해야 함
- **대표 기술**
  - 스프링 `JdbcTemplate`, `MyBatis`

### ORM 기술

![ORM Technology](/assets/img/springdb/orm_technology.png)

- **ORM (Object-Relational Mapping)**
  - 객체를 관계형 데이터베이스 테이블과 매핑
  - 개발자 대신 SQL을 동적으로 생성 및 실행
  - 각 DB마다 다른 SQL 문제도 해결
- **대표 기술**
  - `JPA`, `Hibernate`, `EclipseLink`


<br/><br/>

## 데이터베이스 연결

### 커넥션 정보

```java
/**
 * 데이터베이스 연결 정보를 상수로 관리
 */
public abstract class ConnectionConst {
    public static final String URL = "jdbc:h2:tcp://localhost/~/test"; // H2 DB 접속 URL
    public static final String USERNAME = "sa"; // 사용자명
    public static final String PASSWORD = ""; // 비밀번호
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/connection/ConnectionConst.java)

### DB 커넥션 획득

```java
/**
 * JDBC DriverManager를 사용하여 데이터베이스 커넥션을 획득하는 유틸리티 클래스
 */
@Slf4j
public class DBConnectionUtil {
    
    public static Connection getConnection() {
        try {
            // DriverManager를 통해 커넥션 획득
            Connection connection = DriverManager.getConnection(
                URL, USERNAME, PASSWORD
            );
            log.info("get connection={}, class={}", 
                connection, connection.getClass());
            return connection;
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/connection/DBConnectionUtil.java)


### DriverManager 동작 원리

![DriverManager Flow](/assets/img/springdb/drivermanager_flow.png)

- `DriverManager`가 라이브러리에 등록된 드라이버 목록을 자동으로 인식
- URL 정보를 기반으로 처리 가능한 드라이버를 찾아서 실제 DB 연결

<br/><br/>

## JDBC 개발 - 등록

### Member 도메인

```java
/**
 * 회원 정보를 담는 도메인 객체
 */
@Data
public class Member {
    private String memberId; // 회원 ID
    private int money; // 보유 금액
    
    public Member() {
    }
    
    public Member(String memberId, int money) {
        this.memberId = memberId;
        this.money = money;
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/domain/Member.java)

### MemberRepository - save()

```java
/**
 * 회원 데이터를 데이터베이스에 저장
 */
public Member save(Member member) throws SQLException {
    String sql = "insert into member(member_id, money) values(?, ?)"; // SQL 쿼리 준비
    
    Connection con = null;
    PreparedStatement pstmt = null;
    
    try {
        con = getConnection(); // 커넥션 획득
        pstmt = con.prepareStatement(sql); // SQL 및 파라미터 준비
        pstmt.setString(1, member.getMemberId()); // 파라미터 바인딩 - member_id
        pstmt.setInt(2, member.getMoney()); // 파라미터 바인딩 - money
        pstmt.executeUpdate(); // 쿼리 실행 (INSERT)
        return member;
    } catch (SQLException e) {
        log.error("db error", e);
        throw e;
    } finally {
        close(con, pstmt, null); // 리소스 정리
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV0.java)

- **`prepareStatement(sql)`**
  - SQL과 파라미터를 전달할 데이터 준비
- **파라미터 바인딩**
  - `setString(1, memberId)`, `setInt(2, money)`
  - `?`에 값 지정 (인덱스는 1부터 시작)
- **`executeUpdate()`**
  - 데이터 변경 쿼리 실행
  - 반환값은 영향받은 row 수

### 리소스 정리

```java
/**
 * JDBC 리소스 정리 - 역순으로 close 호출
 */
private void close(Connection con, Statement stmt, ResultSet rs) {
    if (rs != null) {
        try { rs.close(); } 
        catch (SQLException e) { log.info("error", e); }
    }
    if (stmt != null) {
        try { stmt.close(); } 
        catch (SQLException e) { log.info("error", e); }
    }
    if (con != null) {
        try { con.close(); } 
        catch (SQLException e) { log.info("error", e); }
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV0.java)

> - 리소스 정리를 안 하면 커넥션이 계속 유지되어 리소스 누수 발생
> - **커넥션 부족으로 장애 발생**

- 예외 발생 여부와 무관하게 항상 정리 필요
  - `finally` 블록 사용
- 정리 순서
  - `ResultSet` → `PreparedStatement` → `Connection` (역순)

> **PreparedStatement**
> - `Statement`의 자식 타입으로 `?`를 통한 파라미터 바인딩 가능
> - **SQL Injection 공격 예방** 위해 필수 사용

<br/><br/>

## JDBC 개발 - 조회

### findById() 메서드

```java
/**
 * 회원 ID로 회원 조회
 */
public Member findById(String memberId) throws SQLException {
    String sql = "select * from member where member_id = ?";
    
    Connection con = null;
    PreparedStatement pstmt = null;
    ResultSet rs = null;
    
    try {
        con = getConnection(); // 커넥션 획득
        pstmt = con.prepareStatement(sql);
        pstmt.setString(1, memberId); // 파라미터 바인딩
        
        rs = pstmt.executeQuery(); // SELECT 쿼리 실행, ResultSet 반환
        
        if (rs.next()) { // 커서를 다음으로 이동
            Member member = new Member();
            member.setMemberId(rs.getString("member_id")); // 값 추출
            member.setMoney(rs.getInt("money"));
            return member;
        } else {
            throw new NoSuchElementException(
                "member not found memberId=" + memberId
            );
        }
    } catch (SQLException e) {
        log.error("db error", e);
        throw e;
    } finally {
        close(con, pstmt, rs); // 리소스 정리
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV0.java)

- **`executeQuery()`**
  - 데이터 조회 (`SELECT`)
  - `ResultSet` 반환
- **`ResultSet`**
  - 조회 결과를 담고 있는 객체
  - `next()`로 커서를 다음으로 이동하며 데이터 순회
  - 최초 커서는 데이터를 가리키지 않으므로 `next()` 먼저 호출 필요

<br/><br/>

## JDBC 개발 - 수정, 삭제

### update() 메서드

```java
/**
 * 회원 금액 수정
 */
public void update(String memberId, int money) throws SQLException {
    String sql = "update member set money=? where member_id=?";
    
    Connection con = null;
    PreparedStatement pstmt = null;
    
    try {
        con = getConnection();
        pstmt = con.prepareStatement(sql);
        pstmt.setInt(1, money); // 수정할 금액
        pstmt.setString(2, memberId); // 수정 대상 회원 ID
        pstmt.executeUpdate(); // UPDATE 쿼리 실행
    } catch (SQLException e) {
        log.error("db error", e);
        throw e;
    } finally {
        close(con, pstmt, null);
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV0.java)

### delete() 메서드

```java
/**
 * 회원 삭제
 */
public void delete(String memberId) throws SQLException {
    String sql = "delete from member where member_id=?";
    
    Connection con = null;
    PreparedStatement pstmt = null;
    
    try {
        con = getConnection();
        pstmt = con.prepareStatement(sql);
        pstmt.setString(1, memberId); // 삭제 대상 회원 ID
        pstmt.executeUpdate(); // DELETE 쿼리 실행
    } catch (SQLException e) {
        log.error("db error", e);
        throw e;
    } finally {
        close(con, pstmt, null);
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV0.java)

<br/><br/>

## 연습 문제

1. JDBC가 데이터베이스 연결에서 문제를 해결한 방법은 무엇인가요?

   a. 데이터베이스 연결 표준 제공

   - 각각의 데이터베이스가 연결하는 방법이 모두 달랐기 때문에 DB 교체 시 프로젝트 전체에 영향이 컸음
   - JDBC는 표준 인터페이스를 만들어 제공함

2. JDBC 드라이버가 역할을 무엇인가요?

   a. 여러 DB에서 JDBC를 표준 구현한 구현체

   - JDBC는 표준 인터페이스이기 때문에 이를 각 DB 벤더사가 자신의 DB에 맞도록 구현해 제공하는 기능을 제공함

3. SQL 매퍼(MyBatis 등)와 ORM(JPA 등)이 기본으로 사이에서는 무엇인가요?

   a. SQL 매퍼는 SQL을 직접 작성, ORM은 객체를 모델로 만듦

   - SQL 매퍼는 SQL을 직접 작성하지만 ORM은 객체를 데이터베이스에 맞춰서 변환함
   - 또한 DBMS에 종속적인 SQL을 자동 생성해 줌

4. JDBC에서 타입 Statement보다 타입 PreparedStatement를 사용하는 큰 이유는 무엇인가요?

   a. SQL Injection 공격 방지

   - PreparedStatement는 파라미터 바인딩 방식으로 SQL Injection 공격을 차단함. 객체를 파라미터로 안전하게 실행하도록 제공함

5. JPA나 Spring Data JPA와 같은 JDBC에 기반 기술은 JDBC와의 어떤 관계인가요?

   a. 내부적으로 JDBC를 이용해 기능을 사용함다

   - JPA, ORM 등 최신 기술들도 결국 DB에 접근할 때 내부에서는 JDBC를 사용함
   - JDBC는 표준 인터페이스로 자바에서는 사용해 DB에 접근함함

<br/><br/>

## 요약 정리

- **JDBC란?**
  - 자바 표준 데이터베이스 접속 API
  - DB 종류와 관계없이 동일한 방식으로 접속 가능
  
- **주요 인터페이스**
  - `Connection` - 연결
  - `Statement` - SQL 실행
  - `ResultSet` - 조회 결과

- **JDBC 드라이버**
  - 각 DB 벤더가 JDBC 인터페이스를 구현한 라이브러리

- **PreparedStatement**
  - SQL Injection 방지를 위해 파라미터 바인딩(`?`)을 지원하는 `Statement`의 하위 타입

- **executeUpdate()**
  - `INSERT`, `UPDATE`, `DELETE` 같은 데이터 변경 쿼리 실행

- **executeQuery()**
  - `SELECT` 쿼리 실행
  - `ResultSet` 객체 반환

- **ResultSet**
  - 조회 결과를 담는 객체
  - `next()`로 커서를 이동하며 데이터 순회

- **리소스 정리**
  - `finally` 블록에서 역순(`ResultSet` → `Statement` → `Connection`)으로 `close()` 호출 필수

- **SQL Mapper**
  - `JdbcTemplate`, `MyBatis` 등 JDBC 반복 코드를 줄여주는 기술

- **ORM**
  - `JPA`, `Hibernate` 등 객체와 테이블을 매핑하여 SQL을 자동 생성하는 기술

- **JDBC의 중요성**
  - 모든 데이터 접근 기술의 기반이므로 이해 필수

<br/><br/>

## Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/스프링-db-1)
