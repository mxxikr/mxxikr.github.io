---
title: '[스프링 DB 2편 - 데이터 접근 활용 기술] 스프링 트랜잭션 전파1 - 기본'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-09 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, transaction, propagation, jdbc, jpa]
math: false
mermaid: false
---

# 스프링 트랜잭션 전파1 - 기본

- 김영한님의 스프링 DB 2편 강의를 통해 스프링 트랜잭션 전파의 기본 개념, 물리/논리 트랜잭션의 구분, 그리고 다양한 전파 옵션에 대해 정리함

<br/><br/>

## 트랜잭션 전파 기본

### 트랜잭션 전파란?

- **상황**
    - 트랜잭션이 진행 중인데, 추가로 트랜잭션을 수행하면?

- **트랜잭션 전파 (Propagation)**
    - 이러한 상황에서 어떻게 동작할지 결정하는 옵션

<br/>

### 기본 테스트 코드

- **환경 설정**

    ```java
    @Slf4j
    @SpringBootTest
    public class BasicTxTest {
        
        @Autowired
        PlatformTransactionManager txManager;
        
        @TestConfiguration
        static class Config {
            @Bean
            public PlatformTransactionManager transactionManager(DataSource dataSource) {
                return new DataSourceTransactionManager(dataSource);
            }
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

    - `DataSourceTransactionManager`
        - JDBC 기술(DataSource)을 사용하는 트랜잭션 매니저를 빈으로 등록
    - `PlatformTransactionManager`
        - 스프링의 트랜잭션 추상화 인터페이스 타입으로 주입받아 사용 (다형성 활용)

- **application.properties**

    ```properties
    # 트랜잭션 로그
    logging.level.org.springframework.transaction.interceptor=TRACE
    logging.level.org.springframework.jdbc.datasource.DataSourceTransactionManager=DEBUG

    # JPA 로그
    logging.level.org.springframework.orm.jpa.JpaTransactionManager=DEBUG
    logging.level.org.hibernate.resource.transaction=DEBUG
    logging.level.org.hibernate.SQL=DEBUG
    ```

    - `org.springframework.transaction.interceptor`
        - 트랜잭션 AOP의 시작과 종료 로그 (TRACE 레벨 권장)
    - `DataSourceTransactionManager`
        - JDBC 트랜잭션 매니저의 동작 로그 (커밋, 롤백 등 확인)
    - `JpaTransactionManager`
        - JPA 트랜잭션 매니저 로그
    - `org.hibernate.resource.transaction`
        - 하이버네이트 트랜잭션 로그
    - `org.hibernate.SQL`
        - 실행되는 SQL 로그 확인

<br/>

### 단일 트랜잭션 커밋

```java
@Test
void commit() {
    log.info("트랜잭션 시작");
    TransactionStatus status = txManager.getTransaction(new DefaultTransactionAttribute());
    
    log.info("트랜잭션 커밋 시작");
    txManager.commit(status);
    log.info("트랜잭션 커밋 완료");
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    트랜잭션 시작
    Creating new transaction with name [null]
    Acquired Connection [conn0] for JDBC transaction
    Switching JDBC Connection [conn0] to manual commit

    트랜잭션 커밋 시작
    Initiating transaction commit
    Committing JDBC transaction on Connection [conn0]
    Releasing JDBC Connection [conn0] after transaction

    트랜잭션 커밋 완료
    ```

<br/>

### 단일 트랜잭션 롤백

```java
@Test
void rollback() {
    log.info("트랜잭션 시작");
    TransactionStatus status = txManager.getTransaction(new DefaultTransactionAttribute());
    
    log.info("트랜잭션 롤백 시작");
    txManager.rollback(status);
    log.info("트랜잭션 롤백 완료");
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    트랜잭션 시작
    Creating new transaction with name [null]
    Acquired Connection [conn0] for JDBC transaction
    Switching JDBC Connection [conn0] to manual commit

    트랜잭션 롤백 시작
    Initiating transaction rollback
    Rolling back JDBC transaction on Connection [conn0]
    Releasing JDBC Connection [conn0] after transaction

    트랜잭션 롤백 완료
    ```

<br/>

### 트랜잭션 두 번 사용 (독립 실행)

```java
@Test
void double_commit() {
    log.info("트랜잭션1 시작");
    TransactionStatus tx1 = txManager.getTransaction(new DefaultTransactionAttribute());
    log.info("트랜잭션1 커밋");
    txManager.commit(tx1);
    
    log.info("트랜잭션2 시작");
    TransactionStatus tx2 = txManager.getTransaction(new DefaultTransactionAttribute());
    log.info("트랜잭션2 커밋");
    txManager.commit(tx2);
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    트랜잭션1 시작
    Acquired Connection [HikariProxyConnection@1064414847 wrapping conn0]
    Switching JDBC Connection to manual commit

    트랜잭션1 커밋
    Committing JDBC transaction on Connection [conn0]
    Releasing JDBC Connection [conn0] after transaction

    트랜잭션2 시작
    Acquired Connection [HikariProxyConnection@778350106 wrapping conn0]
    Switching JDBC Connection to manual commit

    트랜잭션2 커밋
    Committing JDBC transaction on Connection [conn0]
    Releasing JDBC Connection [conn0] after transaction
    ```

<br/>

- **커넥션 재사용 이해**

    ![커넥션 재사용 이해](/assets/img/springdb/prop_01_connection_reuse.png)

    - 물리 커넥션 `conn0`는 재사용됨
    - 프록시 객체 주소는 다름 (HikariProxyConnection@1064414847 vs @778350106)
    - 완전히 독립적인 트랜잭션

<br/>

### 트랜잭션 커밋과 롤백 조합

```java
@Test
void double_commit_rollback() {
    log.info("트랜잭션1 시작");
    TransactionStatus tx1 = txManager.getTransaction(new DefaultTransactionAttribute());
    log.info("트랜잭션1 커밋");
    txManager.commit(tx1);
    
    log.info("트랜잭션2 시작");
    TransactionStatus tx2 = txManager.getTransaction(new DefaultTransactionAttribute());
    log.info("트랜잭션2 롤백");
    txManager.rollback(tx2);
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- 트랜잭션1 데이터
    - 커밋됨
- 트랜잭션2 데이터
    - 롤백됨
- 각각 독립적으로 관리됨

<br/><br/>

## 물리 트랜잭션과 논리 트랜잭션 비교

### 개념 정의

![개념 정의](/assets/img/springdb/prop_02_concept.png)

- **물리 트랜잭션**

    ```java
    // 실제 데이터베이스 트랜잭션
    Connection con = dataSource.getConnection();
    con.setAutoCommit(false);  // 트랜잭션 시작
    // 작업 수행
    con.commit();  // 또는 con.rollback()
    ```

    - 실제 DB 커넥션을 통해 수행
    - `setAutoCommit(false)`로 시작
    - 실제 커밋/롤백 수행
    - DB에 실제 반영되는 단위

<br/>

- **논리 트랜잭션**

    ```java
    // 트랜잭션 매니저를 통한 트랜잭션
    TransactionStatus status = txManager.getTransaction(...);
    // 작업 수행
    txManager.commit(status);
    ```

    - 트랜잭션 매니저를 통해 관리
    - 트랜잭션 사용의 논리적 단위
    - 여러 논리 트랜잭션이 하나의 물리 트랜잭션에 묶일 수 있음

<br/>

### 전파 시나리오

![전파 시나리오](/assets/img/springdb/prop_03_propagation_scenario.png)

<br/>

### 전파 원칙

- **원칙 1**
    - 모든 논리 트랜잭션이 커밋되어야 물리 트랜잭션이 커밋됨
    - 외부 트랜잭션 커밋 AND 내부 트랜잭션 커밋 → 물리 트랜잭션 커밋

- **원칙 2**
    - 하나의 논리 트랜잭션이라도 롤백되면 물리 트랜잭션은 롤백됨
    - 외부 트랜잭션 커밋 AND 내부 트랜잭션 롤백 → 물리 트랜잭션 롤백
    - 외부 트랜잭션 롤백 AND 내부 트랜잭션 커밋 → 물리 트랜잭션 롤백

<br/>

### 전파 시각화

- **모든 논리 트랜잭션 커밋**

    ![모든 논리 트랜잭션 커밋](/assets/img/springdb/prop_04_all_commit.png)

- **외부 롤백**

    ![외부 롤백](/assets/img/springdb/prop_05_outer_rollback.png)

- **내부 롤백**

    ![내부 롤백](/assets/img/springdb/prop_06_inner_rollback.png)

<br/><br/>

## 전파 동작 원리

### 내부 트랜잭션 커밋

```java
@Test
void inner_commit() {
    log.info("외부 트랜잭션 시작");
    TransactionStatus outer = txManager.getTransaction(
        new DefaultTransactionAttribute());
    log.info("outer.isNewTransaction()={}", outer.isNewTransaction());
    
    log.info("내부 트랜잭션 시작");
    TransactionStatus inner = txManager.getTransaction(
        new DefaultTransactionAttribute());
    log.info("inner.isNewTransaction()={}", inner.isNewTransaction());
    
    log.info("내부 트랜잭션 커밋");
    txManager.commit(inner);
    
    log.info("외부 트랜잭션 커밋");
    txManager.commit(outer);
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    외부 트랜잭션 시작
    Creating new transaction with name [null]
    Acquired Connection [HikariProxyConnection@1943867171 wrapping conn0]
    Switching JDBC Connection to manual commit
    outer.isNewTransaction()=true

    내부 트랜잭션 시작
    Participating in existing transaction  ← 기존 트랜잭션 참여
    inner.isNewTransaction()=false

    내부 트랜잭션 커밋
    (물리 커밋 없음)

    외부 트랜잭션 커밋
    Initiating transaction commit
    Committing JDBC transaction on Connection [conn0]
    Releasing JDBC Connection after transaction
    ```

<br/>

### 요청 흐름

![요청 흐름](/assets/img/springdb/prop_07_request_flow.png)

<br/>

### 주요 포인트

- **isNewTransaction의 역할**

    ```java
    // 외부 트랜잭션
    TransactionStatus outer = txManager.getTransaction(...);
    outer.isNewTransaction()  // true ← 물리 트랜잭션 생성

    // 내부 트랜잭션
    TransactionStatus inner = txManager.getTransaction(...);
    inner.isNewTransaction()  // false ← 기존 트랜잭션 참여
    ```

- **커밋 처리 로직**

    ```java
    // 트랜잭션 매니저 내부 의사 코드
    public void commit(TransactionStatus status) {
        if (status.isNewTransaction()) {
            // 신규 트랜잭션인 경우만 물리 커밋
            connection.commit();
        } else {
            // 참여한 트랜잭션은 아무것도 안 함
            // 외부 트랜잭션이 커밋/롤백 결정
        }
    }
    ```

<br/>

### 전파 흐름 다이어그램

![전파 흐름 다이어그램](/assets/img/springdb/prop_08_propagation_flow.png)

<br/><br/>

## 외부 롤백

### 외부 롤백 시나리오

```java
@Test
void outer_rollback() {
    log.info("외부 트랜잭션 시작");
    TransactionStatus outer = txManager.getTransaction(new DefaultTransactionAttribute());
    
    log.info("내부 트랜잭션 시작");
    TransactionStatus inner = txManager.getTransaction(new DefaultTransactionAttribute());
    
    log.info("내부 트랜잭션 커밋");
    txManager.commit(inner);
    
    log.info("외부 트랜잭션 롤백");
    txManager.rollback(outer);  // 외부 롤백
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    외부 트랜잭션 시작
    Creating new transaction
    Acquired Connection [conn0]
    Switching to manual commit

    내부 트랜잭션 시작
    Participating in existing transaction

    내부 트랜잭션 커밋
    (물리 커밋 없음)

    외부 트랜잭션 롤백
    Initiating transaction rollback
    Rolling back JDBC transaction on Connection [conn0]
    Releasing JDBC Connection [conn0]
    ```

<br/>

### 외부 롤백 흐름

![외부 롤백 흐름](/assets/img/springdb/prop_09_outer_rollback_flow.png)

<br/>

### 결과

- 내부 트랜잭션 커밋했지만 무시됨
- 외부 트랜잭션 롤백으로 전체 롤백
- 내부 트랜잭션 데이터도 모두 롤백됨
- 논리 트랜잭션이 하나라도 롤백되면 물리 트랜잭션은 롤백됨

<br/><br/>

## 내부 롤백

### 내부 롤백 시나리오

```java
@Test
void inner_rollback() {
    log.info("외부 트랜잭션 시작");
    TransactionStatus outer = txManager.getTransaction(new DefaultTransactionAttribute());
    
    log.info("내부 트랜잭션 시작");
    TransactionStatus inner = txManager.getTransaction(new DefaultTransactionAttribute());
    
    log.info("내부 트랜잭션 롤백");
    txManager.rollback(inner);  // 내부 롤백
    
    log.info("외부 트랜잭션 커밋");
    assertThatThrownBy(() -> txManager.commit(outer))
        .isInstanceOf(UnexpectedRollbackException.class);
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    외부 트랜잭션 시작
    Creating new transaction
    Acquired Connection [conn0]
    Switching to manual commit

    내부 트랜잭션 시작
    Participating in existing transaction

    내부 트랜잭션 롤백
    Participating transaction failed - marking existing transaction as rollback-only
    Setting JDBC transaction [conn0] rollback-only  ← 롤백 전용 마크

    외부 트랜잭션 커밋
    Global transaction is marked as rollback-only but transactional code requested commit
    Initiating transaction rollback
    Rolling back JDBC transaction on Connection [conn0]
    ```

<br/>

### Rollback-Only 메커니즘

![Rollback-Only 메커니즘](/assets/img/springdb/prop_10_rollbackonly_mechanism.png)

<br/>

### 내부 롤백 상세 흐름

![내부 롤백 상세 흐름](/assets/img/springdb/prop_11_inner_rollback_detail.png)

<br/>

### UnexpectedRollbackException

- **왜 예외를 던지는가?**

    ```java
    // 개발자의 기대
    txManager.commit(outer);  // 커밋할 것으로 기대하지만 실제 동작 롤백됨
    // 고객은 주문이 성공했다고 생각
    // 실제로는 롤백되어 주문이 생성되지 않음
    ```

- 모호함 제거
    - 커밋 요청했는데 롤백되는 것은 심각한 문제
    - 명확하게 예외를 던져서 알림
    - 개발자가 문제를 인지하고 처리하도록 함

<br/>

### 처리 방법

```java
// 나쁜 예 - 예외를 무시
try {
    txManager.commit(outer);
} catch (UnexpectedRollbackException e) {
    // 무시 - 절대 안 됨
}

// 좋은 예 - 명확하게 처리
try {
    txManager.commit(outer);
} catch (UnexpectedRollbackException e) {
    log.error("트랜잭션이 예상치 않게 롤백되었습니다", e);
    // 적절한 보상 로직 수행
    // 사용자에게 명확하게 알림
}
```

<br/><br/>

## REQUIRES_NEW

### REQUIRES_NEW 전파 옵션

- **목적**
    - 외부 트랜잭션과 완전히 독립적인 새로운 트랜잭션 생성

    ![REQUIRES_NEW 목적](/assets/img/springdb/prop_12_requires_new_purpose.png)

<br/>

### REQUIRES_NEW 사용

```java
@Test
void inner_rollback_requires_new() {
    log.info("외부 트랜잭션 시작");
    TransactionStatus outer = txManager.getTransaction(
        new DefaultTransactionAttribute());
    log.info("outer.isNewTransaction()={}", outer.isNewTransaction());
    
    log.info("내부 트랜잭션 시작");
    DefaultTransactionAttribute definition = 
        new DefaultTransactionAttribute();
    definition.setPropagationBehavior(
        TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    TransactionStatus inner = txManager.getTransaction(definition);
    log.info("inner.isNewTransaction()={}", inner.isNewTransaction());
    
    log.info("내부 트랜잭션 롤백");
    txManager.rollback(inner);
    
    log.info("외부 트랜잭션 커밋");
    txManager.commit(outer);
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/BasicTxTest.java)

- **실행 로그**

    ```
    외부 트랜잭션 시작
    Creating new transaction
    Acquired Connection [HikariProxyConnection@1064414847 wrapping conn0]
    Switching to manual commit
    outer.isNewTransaction()=true

    내부 트랜잭션 시작
    Suspending current transaction, creating new transaction  ← 새 트랜잭션 생성
    Acquired Connection [HikariProxyConnection@778350106 wrapping conn1]
    Switching to manual commit
    inner.isNewTransaction()=true

    내부 트랜잭션 롤백
    Initiating transaction rollback
    Rolling back JDBC transaction on Connection [conn1]
    Releasing JDBC Connection [conn1]
    Resuming suspended transaction after completion of inner transaction

    외부 트랜잭션 커밋
    Initiating transaction commit
    Committing JDBC transaction on Connection [conn0]
    Releasing JDBC Connection [conn0]
    ```

<br/>

### REQUIRES_NEW 요청 흐름

![REQUIRES_NEW 요청 흐름](/assets/img/springdb/prop_13_requires_new_flow.png)

<br/>

### 다양한 전파 옵션

- **REQUIRED**
    - 기본값
    - 기존 트랜잭션 참여, 없으면 생성
- **REQUIRES_NEW**
    - 항상 새로운 트랜잭션 생성
- **SUPPORT**
    - 기존 트랜잭션 있으면 참여, 없으면 트랜잭션 없이 진행
- **NOT_SUPPORTED**
    - 기존 트랜잭션 있어도 보류하고 트랜잭션 없이 진행
- **MANDATORY**
    - 기존 트랜잭션 반드시 있어야 함. 없으면 예외 발생
- **NEVER**
    - 기존 트랜잭션 있으면 예외 발생

<br/><br/>

## 연습 문제

1. 스프링 트랜잭션의 기본 전파(Propagation) 옵션은 무엇일까요?

   a. REQUIRED (기본값)
   
   - `REQUIRED`는 기존 트랜잭션이 있으면 참여하고, 없으면 새로 시작하는 가장 많이 사용되는 기본 옵션임
   
2. REQUIRED 전파 옵션 사용 시, 외부와 내부 논리 트랜잭션은 물리적 데이터베이스 트랜잭션과 어떻게 관계맺나요?

   a. 외부 트랜잭션이 시작한 하나의 물리 트랜잭션을 함께 사용(참여)합니다.
   
   - `REQUIRED`에서 내부 트랜잭션은 외부가 시작한 물리 트랜잭션에 참여만 하며, 실제 물리 트랜잭션의 커밋과 롤백은 외부 트랜잭션이 관리함

3. REQUIRED 전파 옵션에서 외부 트랜잭션 진행 중 내부 논리 트랜잭션에서 롤백이 발생하면, 전체 물리 트랜잭션의 최종 결과는 무엇일까요?

   a. 전체 물리 트랜잭션이 롤백됩니다.
   
   - 논리 트랜잭션 중 하나라도 롤백되면 `rollbackOnly`가 마크되어, 외부 트랜잭션이 커밋을 시도해도 `UnexpectedRollbackException`이 발생하며 전체가 롤백됨

4. REQUIRES_NEW 전파 옵션이 REQUIRED와 가장 크게 다른 점은 무엇인가요?

   a. 기존 트랜잭션 참여 여부를 무시하고 항상 새로운 물리 트랜잭션을 시작합니다.
   
   - `REQUIRED`는 하나의 물리 트랜잭션으로 묶이지만, `REQUIRES_NEW`는 기존 트랜잭션을 잠시 중단시키고 항상 새로운 물리 트랜잭션을 시작하여 독립적으로 운영됨

5. REQUIRES_NEW 전파 옵션에서 내부 트랜잭션이 롤백될 경우, 이전에 시작된 외부 트랜잭션은 어떻게 될까요?

   a. 외부 트랜잭션은 내부 롤백의 영향을 받지 않고 독립적으로 커밋 또는 롤백될 수 있습니다.
   
   - `REQUIRES_NEW`는 외부와 독립된 물리 트랜잭션을 사용함
   - 따라서 내부에서 롤백이 발생해도 외부 트랜잭션의 성공 여부에는 영향을 주지 않음

<br/><br/>

## 요약 정리

- 스프링은 트랜잭션 매니저를 통해 여러 논리 트랜잭션을 하나의 물리 트랜잭션으로 묶거나 분리하여 관리함
- 모든 논리 트랜잭션이 커밋되어야 물리 트랜잭션이 커밋되며, 하나라도 롤백되면 물리 트랜잭션은 롤백됨
- 내부 트랜잭션이 롤백되면 `rollbackOnly` 마크를 남겨 외부 트랜잭션 커밋 시 `UnexpectedRollbackException`이 발생함
- `REQUIRES_NEW`는 외부 트랜잭션과 독립적인 새로운 물리 트랜잭션을 생성하며, 로그 저장 등 실패해도 독립적으로 저장되어야 하는 작업에 유용함

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
