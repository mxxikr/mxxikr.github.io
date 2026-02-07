---
title: '[스프링 DB 1편 데이터 접근 핵심 원리] 스프링과 문제 해결 - 트랜잭션'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-02 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, transaction, jdbc, jpa, aop, proxy, datasource]
math: false
mermaid: false
---

# 스프링과 문제 해결 - 트랜잭션

- 김영한님의 스프링 DB 1편 강의를 통해 스프링 트랜잭션의 문제점을 분석하고, 트랜잭션 추상화, 동기화, 템플릿, AOP를 활용한 단계별 해결 방법을 정리함

<br/><br/>

## 애플리케이션 구조

### 계층별 역할

![Application Layer Structure](/assets/img/springdb/application_layer_structure.png)

- **프레젠테이션 계층**
  - UI와 관련된 처리 담당
  - 웹 요청과 응답, 사용자 요청 검증
  - 사용 기술
    - 서블릿, HTTP, 스프링 MVC

- **서비스 계층**
  - 비즈니스 로직 담당
  - 가급적 특정 기술에 의존하지 않고 순수 자바 코드로 작성
  - 핵심 비즈니스 로직 포함

- **데이터 접근 계층**
  - 실제 데이터베이스 접근 코드
  - 사용 기술
    - JDBC, JPA, File, Redis, Mongo 등

### 순수한 서비스 계층의 중요성

- **기술 변화에 대한 대응**
  - 시간이 흘러 UI가 변하고 데이터 저장 기술이 변경되어도 비즈니스 로직은 최대한 변경 없이 유지되어야 함

- **설계 원칙**
  - 서비스 계층을 특정 기술에 종속적이지 않게 개발
  - 기술 종속적인 부분은 프레젠테이션/데이터 접근 계층에서 처리
  - 인터페이스를 통한 의존성 관리

- **장점**
  - 비즈니스 로직 유지보수 용이
  - 테스트 용이성
  - 구현 기술 변경 시 영향 범위 최소화

<br/><br/>

## 문제점 분석

### MemberServiceV1 - 트랜잭션 미적용

```java
/**
 * 트랜잭션이 적용되지 않은 서비스
 */
@RequiredArgsConstructor
public class MemberServiceV1 {
    private final MemberRepositoryV1 memberRepository;
    
    public void accountTransfer(String fromId, String toId, int money) throws SQLException {
        Member fromMember = memberRepository.findById(fromId);
        Member toMember = memberRepository.findById(toId);
        
        memberRepository.update(fromId, fromMember.getMoney() - money);
        memberRepository.update(toId, toMember.getMoney() + money);
    }
}
```

- 장점
  - 순수한 비즈니스 로직만 존재
  - 코드가 깔끔하고 유지보수 용이
- 문제점
  - 트랜잭션 미적용으로 데이터 일관성 보장 불가
  - `SQLException`으로 JDBC 기술 누수
  - 구체 클래스 직접 의존

### MemberServiceV2 - JDBC 트랜잭션 직접 사용

```java
/**
 * JDBC 트랜잭션을 직접 사용하는 서비스
 */
@Slf4j
@RequiredArgsConstructor
public class MemberServiceV2 {
    private final DataSource dataSource;
    private final MemberRepositoryV2 memberRepository;
    
    public void accountTransfer(String fromId, String toId, int money) throws SQLException {
        Connection con = dataSource.getConnection();
        try {
            con.setAutoCommit(false); // 트랜잭션 시작
            
            // 비즈니스 로직
            bizLogic(con, fromId, toId, money);
            
            con.commit(); // 성공시 커밋
        } catch (Exception e) {
            con.rollback(); // 실패시 롤백
            throw new IllegalStateException(e);
        } finally {
            release(con);
        }
    }
    
    private void bizLogic(Connection con, String fromId, String toId, int money) 
        throws SQLException {
        Member fromMember = memberRepository.findById(con, fromId);
        Member toMember = memberRepository.findById(con, toId);
        
        memberRepository.update(con, fromId, fromMember.getMoney() - money);
        memberRepository.update(con, toId, toMember.getMoney() + money);
    }
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV2.java)
- [테스트 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/service/MemberServiceV2Test.java)

- 문제점
  - 트랜잭션 기술 누수
    - JDBC 기술(`DataSource`, `Connection`, `SQLException`)이 서비스 계층에 침투
    - 비즈니스 로직보다 트랜잭션 코드가 더 많음
  - 트랜잭션 동기화 문제
    - 같은 트랜잭션 유지를 위해 커넥션을 파라미터로 전달
    - 트랜잭션용/일반용 메서드 중복 생성 필요
    - 코드 복잡도 증가
  - 반복 코드 문제
    - `try-catch-finally` 구조 반복
    - 트랜잭션 시작/커밋/롤백 패턴 중복
  - 예외 누수
    - `SQLException`이 서비스 계층으로 전파
    - 체크 예외로 인한 명시적 처리 강제
  - 기술 변경의 어려움
    - JDBC → JPA 전환 시 서비스 계층 전체 수정 필요
    - OCP(개방-폐쇄 원칙) 위반



<br/><br/>

## 트랜잭션 추상화

### 구현 기술에 따른 트랜잭션 사용법

- **JDBC 트랜잭션**
  ```java
  Connection con = dataSource.getConnection();
  try {
      con.setAutoCommit(false); // 트랜잭션 시작
      // 비즈니스 로직
      bizLogic(con, fromId, toId, money);
      con.commit(); // 성공시 커밋
  } catch (Exception e) {
      con.rollback(); // 실패시 롤백
      throw new IllegalStateException(e);
  } finally {
      release(con);
  }
  ```

- **JPA 트랜잭션**
  ```java
  EntityManagerFactory emf = Persistence.createEntityManagerFactory("jpabook");
  EntityManager em = emf.createEntityManager();
  EntityTransaction tx = em.getTransaction();
  
  try {
      tx.begin(); // 트랜잭션 시작
      logic(em); // 비즈니스 로직
      tx.commit(); // 트랜잭션 커밋
  } catch (Exception e) {
      tx.rollback(); // 트랜잭션 롤백
  } finally {
      em.close();
  }
  emf.close();
  ```

- **문제점**
  - 데이터 접근 기술마다 트랜잭션 사용 방법이 다름
  - JDBC에서 JPA로 변경 시 서비스 계층 코드 전체 수정 필요

### 스프링의 트랜잭션 추상화

![Transaction Abstraction](/assets/img/springdb/transaction_abstraction.png)

- **PlatformTransactionManager 인터페이스**

  ```java
  package org.springframework.transaction;

  public interface PlatformTransactionManager extends TransactionManager {
      // 트랜잭션 시작
      TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
      
      // 트랜잭션 커밋
      void commit(TransactionStatus status) throws TransactionException;
      
      // 트랜잭션 롤백
      void rollback(TransactionStatus status) throws TransactionException;
  }
  ```

  - **주요 메서드**
    - `getTransaction()`
      - 트랜잭션 시작
      - 이미 진행중인 트랜잭션이 있으면 참여 가능
      - `TransactionStatus` 반환
        - 현재 트랜잭션 상태 정보 포함
    - `commit()`
      - 트랜잭션 커밋
    - `rollback()`
      - 트랜잭션 롤백

- **주요 구현체**

  | 구현체 | 사용 기술 | 설명 |
  |--------|----------|------|
  | `DataSourceTransactionManager` | JDBC | JDBC 기술 사용 시 |
  | `JdbcTransactionManager` | JDBC | Spring 5.3+, `DataSourceTransactionManager` 확장 |
  | `JpaTransactionManager` | JPA | JPA 기술 사용 시 |
  | `HibernateTransactionManager` | Hibernate | Hibernate 직접 사용 시 |

  - **추상화의 이점**
    - 서비스는 `PlatformTransactionManager` 인터페이스에만 의존
    - DI를 통해 구현체 주입
    - OCP(Open-Closed Principle) 준수
    - 서비스 코드 변경 없이 기술 교체 가능

<br/><br/>

## 트랜잭션 동기화

### 트랜잭션 매니저의 역할

1. **트랜잭션 추상화**
   - 기술 독립성 제공
2. **리소스 동기화**
   - 커넥션 관리 및 동기화

### 리소스 동기화 필요성

- **기존 방식의 문제**
  - 트랜잭션 유지를 위해 같은 커넥션 사용 필요
  - 파라미터로 커넥션 전달 방식
    - 코드 복잡도 증가
    - 메서드 중복 (트랜잭션용/일반용)
    - 가독성 저하

### 트랜잭션 동기화 매니저

![Transaction Synchronization](/assets/img/springdb/transaction_synchronization.png)

- **동작 원리**
  - `ThreadLocal` 사용
  - 멀티스레드 환경에서 안전하게 커넥션 동기화
  - 각 스레드마다 별도 저장소 부여
  - 해당 스레드만 데이터 접근 가능

- **구현 클래스**
  - `org.springframework.transaction.support.TransactionSynchronizationManager`

### 트랜잭션 동기화 흐름

![Transaction Sync Flow](/assets/img/springdb/transaction_sync_flow.png)

1. **트랜잭션 시작**
   - 트랜잭션 매니저가 데이터소스를 통해 커넥션 생성
   - 트랜잭션 시작 (`setAutoCommit(false)`)
   - 트랜잭션 동기화 매니저에 커넥션 보관

2. **비즈니스 로직 수행**
   - 리포지토리는 트랜잭션 동기화 매니저에서 커넥션 획득
   - 파라미터로 커넥션 전달 불필요
   - 같은 커넥션 사용으로 트랜잭션 유지

3. **트랜잭션 종료**
   - 트랜잭션 동기화 매니저에서 커넥션 획득
   - 커밋 또는 롤백
   - 리소스 정리
     - 트랜잭션 동기화 매니저 정리
     - `setAutoCommit(true)` 복원
     - 커넥션 종료 (또는 커넥션 풀 반환)

<br/><br/>

## 트랜잭션 매니저 적용

### MemberRepositoryV3

```java
/**
 * 트랜잭션 동기화 매니저를 사용하는 리포지토리
 */
@Slf4j
public class MemberRepositoryV3 {
    private final DataSource dataSource;
    
    public MemberRepositoryV3(DataSource dataSource) {
        this.dataSource = dataSource;
    }
    
    private Connection getConnection() throws SQLException {
        // 트랜잭션 동기화 매니저가 관리하는 커넥션 획득
        Connection con = DataSourceUtils.getConnection(dataSource);
        log.info("get connection={} class={}", con, con.getClass());
        return con;
    }
    
    private void close(Connection con, Statement stmt, ResultSet rs) {
        JdbcUtils.closeResultSet(rs);
        JdbcUtils.closeStatement(stmt);
        // 트랜잭션 동기화를 사용하려면 DataSourceUtils 사용
        DataSourceUtils.releaseConnection(con, dataSource);
    }
    
    // save(), findById(), update(), delete() 메서드들...
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV3.java)

- **주요 변경사항**
  - `DataSourceUtils.getConnection()`
    - 트랜잭션 동기화 매니저가 관리하는 커넥션이 있으면 반환
    - 없으면 새로운 커넥션 생성하여 반환
  - `DataSourceUtils.releaseConnection()`
    - 트랜잭션 동기화된 커넥션은 닫지 않고 유지
    - 동기화되지 않은 커넥션은 닫음

> **주의사항**
> - `con.close()` 직접 호출 시 커넥션이 유지되지 않는 문제 발생
> - 트랜잭션 종료까지 커넥션 유지 필요

### MemberServiceV3_1

```java
/**
 * 트랜잭션 매니저를 사용하는 서비스
 */
@Slf4j
@RequiredArgsConstructor
public class MemberServiceV3_1 {
    private final PlatformTransactionManager transactionManager;
    private final MemberRepositoryV3 memberRepository;
    
    public void accountTransfer(String fromId, String toId, int money) 
        throws SQLException {
        // 트랜잭션 시작
        TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
        
        try {
            // 비즈니스 로직
            bizLogic(fromId, toId, money);
            transactionManager.commit(status); // 성공시 커밋
        } catch (Exception e) {
            transactionManager.rollback(status); // 실패시 롤백
            throw new IllegalStateException(e);
        }
    }
    
    private void bizLogic(String fromId, String toId, int money) 
        throws SQLException {
        Member fromMember = memberRepository.findById(fromId);
        Member toMember = memberRepository.findById(toId);
        
        memberRepository.update(fromId, fromMember.getMoney() - money);
        validation(toMember);
        memberRepository.update(toId, toMember.getMoney() + money);
    }
    
    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV3_1.java)
- [테스트 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/service/MemberServiceV3_1Test.java)

- **주요 특징**
  - `PlatformTransactionManager` 주입
    - 인터페이스에 의존
    - JDBC
      - `DataSourceTransactionManager` 구현체 주입
    - JPA
      - `JpaTransactionManager` 구현체 주입
  - `transactionManager.getTransaction()`
    - 트랜잭션 시작
    - `TransactionStatus` 반환 (트랜잭션 상태 정보)
    - `DefaultTransactionDefinition`
      - 트랜잭션 옵션 지정
  - `commit()` / `rollback()`
    - `TransactionStatus`를 파라미터로 전달
    - 해당 트랜잭션에 대한 커밋/롤백 수행


<br/><br/>

## 트랜잭션 템플릿

### 반복 패턴 분석

```java
// 트랜잭션 시작
TransactionStatus status = transactionManager.getTransaction(
    new DefaultTransactionDefinition());

try {
    // 비즈니스 로직
    bizLogic(fromId, toId, money);
    transactionManager.commit(status); // 성공시 커밋
} catch (Exception e) {
    transactionManager.rollback(status); // 실패시 롤백
    throw new IllegalStateException(e);
}
```

- **반복되는 부분**
  - 트랜잭션 시작
  - `try-catch-finally` 구조
  - 성공 시 커밋
  - 실패 시 롤백

- **변하는 부분**
  - 비즈니스 로직만 다름

### TransactionTemplate 사용

```java
/**
 * TransactionTemplate을 사용하는 서비스
 */
@Slf4j
public class MemberServiceV3_2 {
    private final TransactionTemplate txTemplate;
    private final MemberRepositoryV3 memberRepository;
    
    public MemberServiceV3_2(PlatformTransactionManager transactionManager, MemberRepositoryV3 memberRepository) {
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.memberRepository = memberRepository;
    }
    
    public void accountTransfer(String fromId, String toId, int money) 
        throws SQLException {
        txTemplate.executeWithoutResult((status) -> {
            try {
                // 비즈니스 로직
                bizLogic(fromId, toId, money);
            } catch (SQLException e) {
                throw new IllegalStateException(e);
            }
        });
    }
    
    private void bizLogic(String fromId, String toId, int money) 
        throws SQLException {
        Member fromMember = memberRepository.findById(fromId);
        Member toMember = memberRepository.findById(toId);
        
        memberRepository.update(fromId, fromMember.getMoney() - money);
        validation(toMember);
        memberRepository.update(toId, toMember.getMoney() + money);
    }
    
    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV3_2.java)
- [테스트 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/service/MemberServiceV3_2Test.java)

- **주요 특징**
  - 생성자에서 `transactionManager`를 주입받아 `TransactionTemplate` 생성
  - `executeWithoutResult()` 사용
    - 응답 값이 없을 때 사용
    - 비즈니스 로직 정상 수행 → 커밋
    - 언체크 예외 발생 → 롤백
    - 체크 예외 발생 → 커밋

- **예외 처리**
  - `bizLogic()`이 `SQLException`(체크 예외) 발생
  - 람다에서 체크 예외를 밖으로 던질 수 없음
  - 언체크 예외(`IllegalStateException`)로 전환하여 던짐


<br/><br/>

## 트랜잭션 AOP

### 프록시를 통한 문제 해결

![Proxy Pattern Comparison](/assets/img/springdb/proxy_pattern_comparison.png)

- **프록시 도입 전**
  - 서비스 계층에서 트랜잭션을 직접 시작
  - 비즈니스 로직과 트랜잭션 코드 혼재

- **프록시 도입 후**
  - 트랜잭션 프록시가 트랜잭션 처리 전담
  - 서비스는 순수한 비즈니스 로직만 유지
  - 트랜잭션 처리 로직과 비즈니스 로직 완전 분리

### @Transactional 애노테이션

```java
/**
 * @Transactional을 사용하는 서비스
 */
@Slf4j
@RequiredArgsConstructor
public class MemberServiceV3_3 {
    private final MemberRepositoryV3 memberRepository;
    
    @Transactional
    public void accountTransfer(String fromId, String toId, int money) 
        throws SQLException {
        bizLogic(fromId, toId, money);
    }
    
    private void bizLogic(String fromId, String toId, int money) 
        throws SQLException {
        Member fromMember = memberRepository.findById(fromId);
        Member toMember = memberRepository.findById(toId);
        
        memberRepository.update(fromId, fromMember.getMoney() - money);
        validation(toMember);
        memberRepository.update(toId, toMember.getMoney() + money);
    }
    
    private void validation(Member toMember) {
        if (toMember.getMemberId().equals("ex")) {
            throw new IllegalStateException("이체중 예외 발생");
        }
    }
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV3_3.java)
- [테스트 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/service/MemberServiceV3_3Test.java)

- **주요 특징**
  - 트랜잭션 관련 코드 완전 제거
  - 순수한 비즈니스 로직만 남음
  - `@Transactional` 애노테이션만 추가
    - 메서드에 적용 가능
    - 클래스에 적용 가능 (모든 public 메서드에 AOP 적용)

### 스프링 AOP 구성요소

![Spring AOP Components](/assets/img/springdb/spring_aop_components.png)

- 스프링 부트 사용 시 자동 등록
  - 어드바이저: `BeanFactoryTransactionAttributeSourceAdvisor`
  - 포인트컷: `TransactionAttributeSourcePointcut`
  - 어드바이스: `TransactionInterceptor`

### 트랜잭션 AOP 전체 흐름

![Transaction AOP Flow](/assets/img/springdb/transaction_aop_flow.png)

1. 클라이언트가 프록시의 `accountTransfer()` 호출
2. 프록시가 트랜잭션 시작
3. 프록시가 실제 서비스 객체의 비즈니스 로직 호출
4. 정상 실행 시 프록시가 커밋
5. 예외 발생 시 프록시가 롤백

### 트랜잭션 관리 방식 비교

| 방식 | 설명 | 장점 | 단점 | 사용 |
|------|------|------|------|------|
| **선언적 트랜잭션 관리** | `@Transactional` 애노테이션 사용 | 매우 편리함 | - | 실무 대부분 |
| **프로그래밍 방식 트랜잭션 관리** | `TransactionManager` 또는 `TransactionTemplate` 직접 사용 | 유연함 | 복잡함 | 테스트에서 가끔 |

<br/><br/>

## 스프링 부트 자동 설정

### 데이터소스 자동 등록

- **자동 등록 메커니즘**
  - 스프링 부트가 `DataSource`를 스프링 빈에 자동 등록
  - 자동 등록되는 빈 이름
    - `dataSource`
  - 개발자가 직접 빈 등록 시 자동 등록 안 함

- **설정 파일 기반 생성**
  ```properties
  spring.datasource.url=jdbc:h2:tcp://localhost/~/test
  spring.datasource.username=sa
  spring.datasource.password=
  ```

- **자동 생성되는 DataSource**
  - `HikariDataSource` (커넥션풀 제공)
  - 커넥션풀 관련 설정도 `application.properties`로 지정 가능

> **특수 케이스**
> - `spring.datasource.url` 속성이 없으면 내장 데이터베이스(메모리 DB) 생성 시도

### 트랜잭션 매니저 자동 등록

![Spring Boot Auto Configuration](/assets/img/springdb/spring_boot_auto_config.png)

- **자동 등록 메커니즘**
  - 적절한 `PlatformTransactionManager`를 스프링 빈에 자동 등록
  - 자동 등록되는 빈 이름
    - `transactionManager`
  - 개발자가 직접 빈 등록 시 자동 등록 안 함
    ```java
    @Bean
    PlatformTransactionManager transactionManager() {
        return new DataSourceTransactionManager(dataSource());
    }
    ```


- **트랜잭션 매니저 선택 로직**
  - 현재 등록된 라이브러리를 보고 판단
  - JDBC 기술 사용
    - `DataSourceTransactionManager` 등록
  - JPA 사용
    - `JpaTransactionManager` 등록
  - JDBC + JPA 둘 다 사용
    - `JpaTransactionManager` 등록
    - `JpaTransactionManager`가 `DataSourceTransactionManager` 기능 대부분 지원

- **수동 등록 방식**
  ```java
  @TestConfiguration
  static class TestConfig {
      @Bean
      DataSource dataSource() {
          return new DriverManagerDataSource(URL, USERNAME, PASSWORD);
      }
      
      @Bean
      PlatformTransactionManager transactionManager() {
          return new DataSourceTransactionManager(dataSource());
      }
      
      @Bean
      MemberRepositoryV3 memberRepositoryV3() {
          return new MemberRepositoryV3(dataSource());
      }
      
      @Bean
      MemberServiceV3_3 memberServiceV3_3() {
          return new MemberServiceV3_3(memberRepositoryV3());
      }
  }
  ```

- **자동 등록 활용 방식**
  ```java
  @TestConfiguration
  static class TestConfig {
      private final DataSource dataSource;
      
      public TestConfig(DataSource dataSource) {
          this.dataSource = dataSource;
      }
      
      @Bean
      MemberRepositoryV3 memberRepositoryV3() {
          return new MemberRepositoryV3(dataSource);
      }
      
      @Bean
      MemberServiceV3_3 memberServiceV3_3() {
          return new MemberServiceV3_3(memberRepositoryV3());
      }
  }
  ```

<br/><br/>

## 서비스 계층 개선 과정

![Service Layer Evolution](/assets/img/springdb/service_layer_evolution.png)

| 버전 | 특징 | 문제점 | 개선점 |
|------|------|--------|--------|
| **V1** | 순수 비즈니스 로직 | 트랜잭션 없음 | 코드 깔끔 |
| **V2** | JDBC 트랜잭션 추가 | JDBC 기술 누수 | 트랜잭션 적용 |
| **V3_1** | 트랜잭션 매니저 사용 | 반복 코드 존재 | 추상화 적용 |
| **V3_2** | 트랜잭션 템플릿 사용 | 기술 코드 혼재 | 반복 코드 제거 |
| **V3_3** | @Transactional AOP | - | 완전한 분리 달성 |

<br/><br/>

## 연습 문제

1. 애플리케이션 계층 구조에서 서비스 계층을 순수하게 유지하려는 가장 중요한 이유는 무엇일까요?

   a. 핵심 비즈니스 로직을 기술 종속 없이 관리하려고

   - 서비스 계층은 핵심 비즈니스 로직을 담고 있어 UI나 데이터 접근 기술 변화에 영향을 받지 않고 순수한 자바 코드로 유지하는 것이 중요함
   - 기술 종속을 줄여 유지보수를 쉽게 만듦

2. JDBC 기술로 직접 트랜잭션을 처리할 때 발생하는 주요 문제점 세 가지는 무엇이었나요?

   a. 트랜잭션 문제, 예외 누수, JDBC 코드 반복

   - 직접 JDBC 트랜잭션을 다룰 때 트랜잭션 동기화 문제, `SQLException` 같은 기술 예외 누수, 반복적인 `try-catch-finally` 코드가 문제였음
   - 스프링은 이 문제들을 해결해줌

3. 트랜잭션 처리 시 발생하는 기술(JDBC vs JPA 등) 종속성 문제를 해결하기 위한 근본적인 접근 방식은 무엇일까요?

   a. 트랜잭션 처리 로직을 추상화하기

   - JDBC에서 JPA 등으로 트랜잭션 기술이 바뀌면 서비스 코드 전체를 수정해야 하는 문제를 해결하기 위해 트랜잭션 로직을 인터페이스로 추상화하는 방법을 사용함
   - 이로써 기술 종속성을 낮출 수 있음

4. 스프링에서 트랜잭션 추상화를 위해 제공하는 핵심 인터페이스는 무엇일까요?

   a. `PlatformTransactionManager`

   - 스프링은 `PlatformTransactionManager` 인터페이스를 통해 다양한 데이터 접근 기술(JDBC, JPA 등)의 트랜잭션 처리를 추상화하여 제공하고 있음
   - 서비스 계층은 이 인터페이스에만 의존하게 됨

5. 트랜잭션 동기화가 필요한 주된 이유는 무엇일까요?

   a. 트랜잭션 범위 내 모든 작업이 동일한 커넥션을 사용해야 하기 때문에

   - 트랜잭션이 시작되면 해당 트랜잭션 동안 실행되는 모든 데이터 접근 로직(여러 리포지토리 호출 포함)은 반드시 같은 DB 커넥션을 사용해야 일관성이 유지됨
   - 이를 위해 커넥션 동기화가 필요함

6. 스프링에서 트랜잭션 동기화를 위해 주로 사용하는 메커니즘은 무엇인가요?

   a. `ThreadLocal`과 `TransactionSynchronizationManager`

   - 스프링의 트랜잭션 매니저는 `ThreadLocal`을 사용하여 각 스레드별로 트랜잭션 정보를 안전하게 보관하고, `TransactionSynchronizationManager`를 통해 이를 동기화함
   - 덕분에 커넥션을 파라미터로 넘기지 않아도 됨

7. 반복적인 트랜잭션 시작/커밋/롤백 코드를 제거하여 서비스 계층 코드를 간결하게 만들기 위해 스프링에서 제공하는 것은 무엇일까요?

   a. `TransactionTemplate`

   - 트랜잭션 시작, 비즈니스 로직 실행, 성공 시 커밋, 실패 시 롤백의 반복적인 구조를 템플릿 콜백 패턴으로 추상화한 것이 `TransactionTemplate`임
   - 트랜잭션 코드를 줄여줌

8. `@Transactional` 어노테이션을 사용하여 트랜잭션 AOP를 적용하는 주된 목표는 무엇인가요?

   a. 서비스 계층에 순수한 비즈니스 로직만 남기기

   - `@Transactional`을 통해 트랜잭션 처리를 프록시에게 위임함으로써, 서비스 계층은 핵심 비즈니스 로직에만 집중하고 기술적인 코드를 분리할 수 있음
   - 관심사의 분리를 달성함

9. `@Transactional` 어노테이션이 적용된 메소드가 호출될 때 스프링이 기본적으로 어떻게 동작하며 트랜잭션을 관리하나요?

   a. 스프링이 런타임에 해당 객체의 프록시를 생성하여 트랜잭션 처리 로직을 추가함

   - `@Transactional` 어노테이션이 붙으면 스프링은 해당 객체의 프록시를 만들고, 이 프록시가 트랜잭션 시작, 대상 메소드 호출, 커밋/롤백 등 트랜잭션 로직을 대신 처리함
   - 개발자는 어노테이션만 붙이면 됨

10. 스프링 애플리케이션 개발 시 트랜잭션 관리 방식으로 일반적으로 가장 많이 사용되고 권장되는 방식은 무엇인가요?

    a. 선언적(Declarative) 트랜잭션 관리

    - `@Transactional` 어노테이션과 같이 코드가 아닌 설정이나 어노테이션으로 트랜잭션을 적용하는 선언적 방식이 코드의 가독성과 유지보수 측면에서 훨씬 간편하고 실용적이라 권장됨
    - 프로그래밍적 방식은 특별한 경우에만 사용함

<br/><br/>

## 요약 정리

- JDBC 트랜잭션 직접 사용 시 문제점
  - JDBC 기술이 서비스 계층에 누수
  - 트랜잭션 동기화를 위해 커넥션을 파라미터로 전달
  - `try-catch-finally` 구조와 커밋/롤백 패턴 반복
- 스프링의 단계적 해결 방법
  - 트랜잭션 추상화
    - `PlatformTransactionManager` 인터페이스로 JDBC, JPA 등 추상화
    - 서비스 계층의 기술 독립성 보장
  - 트랜잭션 동기화
    - `TransactionSynchronizationManager`와 `ThreadLocal` 활용
    - 커넥션 파라미터 전달 불필요
  - 트랜잭션 템플릿
    - `TransactionTemplate`으로 반복 코드 제거
  - 트랜잭션 AOP
    - `@Transactional` 애노테이션으로 프록시 패턴 적용
    - 트랜잭션 처리 로직 완전 분리
    - 서비스 계층에 순수 비즈니스 로직만 남음
- 스프링 부트 자동 설정
  - `application.properties` 설정만으로 `DataSource`와 `PlatformTransactionManager` 자동 등록
  - 라이브러리 확인 후 적절한 트랜잭션 매니저 선택
  - 개발자는 비즈니스 로직에만 집중 가능

<br/><br/>

## Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/스프링-db-1)
