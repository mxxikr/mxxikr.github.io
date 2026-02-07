---
title: '[스프링 DB 1편 데이터 접근 핵심 원리] 커넥션풀과 데이터소스 이해'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-31 13:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, jdbc, connection-pool, datasource, hikaricp]
math: false
mermaid: false
---

# 커넥션풀과 DataSource

- 김영한님의 스프링 DB 1편 강의를 통해 커넥션 풀의 개념과 동작 원리를 이해하고, `DataSource` 인터페이스를 활용하여 커넥션 획득 방법을 추상화하는 방법을 정리함

<br/><br/>

## 커넥션 풀 이해

### 데이터베이스 커넥션 획득 과정

![Connection Acquisition Process](/assets/img/springdb/connection_acquisition.png)

1. DB 드라이버를 통해 커넥션 조회
2. DB와 TCP/IP 커넥션 연결 (3-way handshake)
3. ID, PW와 기타 부가정보를 DB에 전달
4. DB가 내부 인증 완료 후 DB 세션 생성
5. DB가 커넥션 생성 완료 응답 전송
6. DB 드라이버가 커넥션 객체를 생성해서 반환

### 커넥션 매번 생성의 문제점

- 과정이 복잡하고 시간이 많이 소모됨
- DB와 애플리케이션 서버 모두 리소스 사용
- **응답 속도에 영향**
  - SQL 실행 시간 + 커넥션 생성 시간
- 사용자 경험 저하

### 커넥션 풀 개념

> **커넥션 풀 (Connection Pool)**
> - 커넥션을 미리 생성해두고 사용하는 방법

- 커넥션을 미리 생성하여 풀에 보관
- 필요 시 가져다 사용
- 사용 후 풀에 반환 (종료 X)

### 커넥션 풀 동작 방식

![Connection Pool Structure](/assets/img/springdb/connection_pool_structure.png)

- **초기화**
  - 애플리케이션 시작 시점에 필요한 만큼 커넥션 미리 확보 (기본 10개)
  - TCP/IP로 DB와 연결된 상태 유지
- **사용**
  - 커넥션 풀에서 이미 생성된 커넥션을 참조로 가져옴
  - 빠른 속도로 SQL 전달 가능
- **반환**
  - 커넥션을 종료하지 않고 살아있는 상태로 반환
  - 다음에 다시 사용 가능

> - 커넥션 반환 시 `close()`를 호출하지만 실제 종료가 아닌 풀에 반환됨

### 커넥션 풀의 장점

- **빠른 응답 속도**
  - 커넥션 생성 시간 제거
- **리소스 절약**
  - 매번 TCP/IP 연결 불필요
- **DB 보호**
  - 최대 커넥션 수 제한 가능
  - 무한정 연결 방지

### 커넥션 풀 오픈소스

| 오픈소스 | 특징 |
|---------|------|
| **commons-dbcp2** | 아파치 커먼즈 |
| **tomcat-jdbc pool** | 톰캣 JDBC |
| **HikariCP** | 고성능, 스프링 부트 기본 |


<br/><br/>

## DataSource 이해

### 커넥션 획득 방법의 변화

- 애플리케이션에서 커넥션을 획득하는 방법은 다양함
  - JDBC `DriverManager` 직접 사용
  - 커넥션 풀 사용 (`HikariCP` 등)

### DriverManager 사용의 문제점

- `DriverManager`를 사용하다가 `HikariCP` 같은 커넥션 풀로 변경하려면?
  - 애플리케이션 코드 변경 필요
  - 의존 관계 변경 필요
  - 사용법이 서로 다름

### DataSource 추상화

> **javax.sql.DataSource 인터페이스**
> - 커넥션을 획득하는 방법을 추상화한 인터페이스

![DataSource Abstraction](/assets/img/springdb/datasource_abstraction.png)

**핵심 기능**

```java
public interface DataSource {
    Connection getConnection() throws SQLException;
}
```

- 커넥션을 조회하는 하나의 메서드만 제공
- 구현체만 변경하면 애플리케이션 코드는 수정 불필요
- 애플리케이션은 `DataSource` 인터페이스에만 의존

### DataSource 구현체

- **커넥션 풀**
  - 대부분의 커넥션 풀이 `DataSource` 인터페이스를 구현
  - `HikariCP`, `DBCP2` 등
  
- **DriverManager**
  - `DataSource` 인터페이스를 사용하지 않음
  - 스프링이 제공하는 `DriverManagerDataSource` 사용
    - `DriverManager`를 `DataSource`로 사용 가능하도록 어댑터 역할

<br/><br/>

## DataSource 예제1 - DriverManager

### DriverManager 직접 사용

```java
@Test
void driverManager() throws SQLException {
    Connection con1 = DriverManager.getConnection(URL, USERNAME, PASSWORD);
    Connection con2 = DriverManager.getConnection(URL, USERNAME, PASSWORD);
}
```

- 커넥션을 획득할 때마다 URL, USERNAME, PASSWORD를 계속 전달해야 함

### DriverManagerDataSource 사용

```java
/**
 * 스프링이 제공하는 DriverManagerDataSource 사용
 */
@Test
void dataSourceDriverManager() throws SQLException {
    // DataSource 생성 시 한 번만 파라미터 설정
    DriverManagerDataSource dataSource = new DriverManagerDataSource(URL, USERNAME, PASSWORD);
    useDataSource(dataSource);
}

private void useDataSource(DataSource dataSource) throws SQLException {
    // 이후에는 getConnection()만 호출
    Connection con1 = dataSource.getConnection();
    Connection con2 = dataSource.getConnection();
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/connection/ConnectionTest.java)

- `DataSource` 객체 생성 시 한 번만 접속 정보 설정
- 이후에는 `getConnection()`만 호출하면 됨

### 설정과 사용의 분리

- `DataSource`를 사용하면 설정과 사용을 분리할 수 있음

- **설정**
  - `DataSource` 객체를 생성하면서 필요한 속성 입력
  - URL, USERNAME, PASSWORD를 한 곳에서 관리
  
- **사용**  
  - `getConnection()`만 호출
  - 접속 정보를 몰라도 됨

- **장점**
  - Repository는 `DataSource`만 의존하면 됨
  - 접속 정보가 변경되어도 사용하는 코드는 변경 불필요
  - 설정 부분과 사용 부분이 명확히 분리됨

<br/><br/>

## DataSource 예제2 - 커넥션 풀

### HikariCP 사용

```java
/**
 * HikariCP 커넥션 풀 사용
 */
@Test
void dataSourceConnectionPool() throws SQLException, InterruptedException {
    // HikariCP 설정
    HikariDataSource dataSource = new HikariDataSource();
    dataSource.setJdbcUrl(URL);
    dataSource.setUsername(USERNAME);
    dataSource.setPassword(PASSWORD);
    dataSource.setMaximumPoolSize(10); // 최대 커넥션 수: 10개
    dataSource.setPoolName("MyPool");
    
    useDataSource(dataSource);
    Thread.sleep(1000); // 커넥션 풀 생성 대기
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/connection/ConnectionTest.java)

- `HikariDataSource`도 `DataSource` 인터페이스를 구현
- 최대 풀 사이즈는 10개로 설정
- 커넥션 풀 생성은 별도 쓰레드에서 진행됨
  - 커넥션을 미리 만드는 작업은 시간이 걸림
  - 애플리케이션 실행 시간에 영향을 주지 않도록 별도로 처리

### 커넥션 풀 상태 확인

```
MyPool - After adding stats (total=10, active=2, idle=8, waiting=0)
```

| 항목 | 설명 |
|------|------|
| **total** | 전체 커넥션 수 |
| **active** | 사용 중인 커넥션 |
| **idle** | 대기 중인 커넥션 |
| **waiting** | 대기 중인 요청 |

<br/><br/>

## DataSource 적용

### MemberRepositoryV1 구현

```java
/**
 * DataSource를 활용한 MemberRepository
 */
@Slf4j
public class MemberRepositoryV1 {
    
    private final DataSource dataSource;
    
    public MemberRepositoryV1(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    private void close(Connection con, Statement stmt, ResultSet rs) {
        JdbcUtils.closeResultSet(rs);
        JdbcUtils.closeStatement(stmt);
        JdbcUtils.closeConnection(con);
    }
    
    private Connection getConnection() throws SQLException {
        Connection con = dataSource.getConnection();
        log.info("get connection={}, class={}", con, con.getClass());
        return con;
    }
}
```
- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV1.java)

**이전 코드와 달라진 점**
- `DataSource`를 외부에서 주입 받음(의존성 주입)
- 리소스 정리 시 스프링의 `JdbcUtils` 사용

### 실행 결과 비교

- **DriverManagerDataSource 사용 시**
  ```
  get connection=conn0
  get connection=conn1  
  get connection=conn2
  ```
  - 매번 새로운 커넥션 생성함

- **HikariDataSource 사용 시**
  ```
  get connection=HikariProxyConnection@xxx wrapping conn0
  get connection=HikariProxyConnection@xxx wrapping conn0
  get connection=HikariProxyConnection@xxx wrapping conn0
  ```
  - 같은 커넥션(conn0)을 재사용함
  - `HikariProxyConnection`은 실제 커넥션을 감싸는 프록시 객체

### DI의 장점

- `DriverManagerDataSource`에서 `HikariDataSource`로 변경해도 `DataSource` 인터페이스에만 의존하기 때문에 `MemberRepositoryV1` 코드는 전혀 수정할 필요 없음
- 구현체만 갈아끼우면 됨 (의존성 주입 + 개방-폐쇄 원칙)

<br/><br/>

## 연습 문제

1. 데이터베이스 연결을 매 요청마다 새로 맺는 방식의 비효율적인 측면은 무엇일까요?

   a. 연결 설정 과정이 시간과 자원을 많이 소모해서

   - 데이터베이스 연결 설정은 TCP/IP 통신, 인증, 세션 생성 등 복잡하며 매번 새 연결을 만들면 시간과 자원이 많이 낭비됨
   - 이는 응답 속도 저하로 이어짐

2. 데이터베이스 커넥션 풀의 주된 역할은 무엇일까요?

   a. 데이터베이스 연결을 미리 만들고 재사용하는 역할

   - 커넥션 풀은 애플리케이션 시작 시 미리 일정 개수의 연결을 만들어 관리하고, 필요할 때 빌려주고 사용 후 반납받아 재사용하는 역할을 함
   - 연결 생성 오버헤드를 줄임

3. 자바에서 `javax.sql.DataSource` 인터페이스를 사용하는 주된 목적은 무엇일까요?

   a. 커넥션 획득 방식을 추상화하여 유연성을 확보하기 위해

   - `DataSource` 인터페이스는 `getConnection()` 메서드를 통해 커넥션 획득 방법을 추상화함
   - 덕분에 `DriverManager`든 커넥션 풀이든 구현체 변경 시 애플리케이션 코드를 건드리지 않아도 됨

4. `DataSource` 인터페이스를 사용할 때, `DriverManagerDataSource`에서 HikariCP와 같은 커넥션 풀로 변경해도 애플리케이션 비즈니스 로직 코드를 거의 수정하지 않아도 되는 이유는 무엇일까요?

   a. 애플리케이션 코드가 구체적인 구현체 대신 `DataSource` 인터페이스에 의존하기 때문에

   - 애플리케이션 코드는 `DataSource` 인터페이스에만 의존하도록 작성되기 때문
   - 인터페이스의 구현체가 `DriverManagerDataSource`에서 HikariCP로 바뀌어도 `getConnection()` 호출 방식은 똑같음

5. `DriverManagerDataSource`의 `getConnection()` 호출과 HikariCP `DataSource`의 `getConnection()` 호출 시, 커넥션 객체를 다루는 방식에서 가장 큰 차이점은 무엇일까요?

   a. `DriverManagerDataSource`는 항상 새로운 연결을 생성하지만, HikariCP는 풀에서 기존 연결을 재사용함

   - `DriverManagerDataSource`는 `getConnection()` 호출 시마다 `DriverManager`를 이용해 실제 데이터베이스에 새 연결을 맺음
   - HikariCP는 미리 만들어 둔 풀에서 사용 가능한 연결을 가져와 재사용함




<br/><br/>

## 요약 정리

- **커넥션 풀이란?**
  - 애플리케이션 시작 시 커넥션을 미리 생성하여 풀에 보관하고, 필요 시 재사용하는 방식

- **커넥션 풀 장점**
  - 빠른 응답 속도
  - 리소스 절약
  - DB 보호
  - 최대 커넥션 수 제한

- **HikariCP**
  - 스프링 부트 2.0부터 기본 커넥션 풀
  - 고성능과 안정성으로 실무 표준

- **DataSource**
  - 커넥션 획득 방법을 추상화하는 표준 인터페이스 (`javax.sql.DataSource`)
  - 핵심 메서드
    - `Connection getConnection()`

- **설정과 사용 분리**
  - 객체 생성 시 한 번만 설정
  - 이후 `getConnection()`만 호출

- **DriverManagerDataSource**
  - 스프링이 제공하는 `DriverManager` 래퍼
  - `DataSource` 인터페이스 구현

- **HikariDataSource**
  - HikariCP 커넥션 풀의 `DataSource` 구현체

- **커넥션 풀 상태**
  - total (전체)
  - active (사용 중)
  - idle (대기)
  - waiting (대기 요청)

- **별도 쓰레드**
  - 커넥션 풀 생성 시 애플리케이션 실행 속도에 영향 안 주기 위함

- **커넥션 반환**
  - `close()` 호출 시 종료가 아닌 풀에 반환
  - 살아있는 상태로 재사용

- **JdbcUtils**
  - 스프링이 제공하는 JDBC 편의 메서드
  - 리소스 정리 간편화

- **실무 권장**
  - 항상 커넥션 풀 사용
  - `HikariCP` 권장
  - `DataSource` 인터페이스 의존

<br/><br/>

## Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/스프링-db-1)
