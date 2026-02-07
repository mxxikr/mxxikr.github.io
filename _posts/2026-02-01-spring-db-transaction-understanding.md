---
title: '[스프링 DB 1편 데이터 접근 핵심 원리] 트랜잭션 이해'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-01 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, transaction, acid, commit, rollback, lock]
math: false
mermaid: false
---

# 트랜잭션 이해

- 김영한님의 스프링 DB 1편 강의를 통해 트랜잭션의 개념과 ACID 원칙을 이해하고, 데이터베이스 세션과 락의 동작 원리를 정리함

<br/><br/>

## 트랜잭션 개념 이해

### 트랜잭션 기본 개념

- **트랜잭션이란?**
  - 데이터베이스에서 여러 작업을 하나의 단위로 묶어 안전하게 처리하는 메커니즘
  - 모든 작업이 성공하거나, 하나라도 실패하면 전체를 취소

  - ex) A 계좌에서 B 계좌로 5,000원 이체
    - A 계좌
      - 10,000원 → 5,000원 감소
    - B 계좌
      - 10,000원 → 15,000원 증가
    - 두 작업 모두 성공해야 완료

### Commit과 Rollback

| 용어 | 의미 | 시점 |
|------|------|------|
| **Commit** | 모든 작업 성공 시 데이터베이스에 반영 | 모든 작업 성공 시 |
| **Rollback** | 하나라도 실패 시 이전 상태로 복구 | 작업 중 하나라도 실패 시 |

<br/><br/>

## 트랜잭션 ACID

### ACID 원칙

- **Atomicity (원자성)**
  - 모두 성공하거나 모두 실패
  - 트랜잭션의 작업이 부분적으로 실행되지 않음을 보장
  - 모든 작업이 완료되지 않으면 전체 취소

- **Consistency (일관성)**
  - 일관된 데이터베이스 상태 유지
  - 무결성 제약 조건 항상 만족 (NOT NULL, UNIQUE, FOREIGN KEY 등)

- **Isolation (격리성)**
  - 동시 실행 트랜잭션 간 격리
  - 동시에 같은 데이터 수정 방지
  - 성능과 격리 수준 사이의 트레이드오프 존재

- **Durability (지속성)**
  - 성공한 트랜잭션은 영구 저장
  - 시스템 장애 발생 시에도 데이터 복구 가능
  - 데이터베이스 로그 활용

### 트랜잭션 격리 수준

- **ANSI 표준 4단계**

  | 격리 수준 | 설명 | 성능 |
  |----------|------|------|
  | **READ UNCOMMITTED** | 커밋되지 않은 읽기 | 높음 |
  | **READ COMMITTED** | 커밋된 읽기 | 중간 |
  | **REPEATABLE READ** | 반복 가능한 읽기 | 낮음 |
  | **SERIALIZABLE** | 직렬화 가능 | 가장 낮음 |

- **격리성과 성능의 트레이드오프**
  - **격리성 완벽 보장**
    - 순서대로 실행
    - 동시 처리 성능 저하
  - **격리 수준 낮춤**
    - 동시 처리 가능
    - 성능 향상

- 일반적으로 READ COMMITTED (커밋된 읽기) 많이 사용

<br/><br/>

## 데이터베이스 연결과 세션

### 연결 구조

![DB Connection Sequence](/assets/img/springdb/db_connection.png)

### 세션의 역할

- SQL 실행
- 트랜잭션 시작 및 종료 (Commit/Rollback)
- 커넥션당 1:1 매핑 (커넥션 풀 10개 = 세션 10개)

<br/><br/>

## 트랜잭션 동작 개념

### 트랜잭션 사용법

- **기본 명령어**
  - `COMMIT`
    - 데이터베이스에 결과 반영
  - `ROLLBACK`
    - 결과 반영하지 않음

- 커밋 전까지는 임시로 데이터 저장
  - 트랜잭션 시작한 세션만 변경 데이터 보임
  - 다른 세션에는 변경 데이터 안 보임

### 기본 데이터 상태

- **초기 상태**
  - 모든 세션이 같은 데이터 조회

### 신규 데이터 추가 (커밋 전)

- **세션1 동작**
  - 트랜잭션 시작
  - 신규 회원1, 신규 회원2 추가
  - 아직 커밋 안 함
  - 세션1은 신규 데이터 조회 가능

- **세션2 동작**
  - 신규 회원 조회 안 됨
  - 세션1이 커밋 안 했기 때문

> **데이터 정합성 보호**
> - 커밋 전 데이터가 다른 세션에 보이면 세션2가 신규 데이터 기반으로 로직 수행 가능
> - 세션1이 롤백하면 신규 데이터 사라짐
> - **정합성 문제 발생**

### 신규 데이터 추가 후 COMMIT

- **COMMIT 후**
  - 새로운 데이터가 실제 DB에 반영
  - 데이터 상태
    - 임시 → 완료
  - 모든 세션에서 조회 가능

### 신규 데이터 추가 후 ROLLBACK

- **ROLLBACK 후**
  - 모든 데이터가 처음 상태로 복구
  - 수정/삭제 데이터도 복구
  - 트랜잭션 시작 전 상태로 돌아감

<br/><br/>

## 자동 커밋과 수동 커밋

### 테이블 스키마

```sql
drop table member if exists;
create table member (
    member_id varchar(10),
    money integer not null default 0,
    primary key (member_id)
);
```

### 자동 커밋

```sql
set autocommit true;  -- 자동 커밋 모드 설정
insert into member(member_id, money) values ('data1', 10000);  -- 자동 커밋
insert into member(member_id, money) values ('data2', 10000);  -- 자동 커밋
```

- **문제점**
  - 각 쿼리마다 자동 커밋되어 트랜잭션 기능 사용 불가

### 수동 커밋

```sql
set autocommit false;  -- 수동 커밋 모드 설정 (트랜잭션 시작)
insert into member(member_id, money) values ('data3', 10000);
insert into member(member_id, money) values ('data4', 10000);
commit;  -- 수동 커밋
```

- **특징**
  - 직접 `COMMIT`, `ROLLBACK` 호출하여 트랜잭션 제어
  - 수동 커밋 설정 후 반드시 `COMMIT` 또는 `ROLLBACK` 호출 필요

<br/><br/>

## 트랜잭션 실습

### 데이터 준비

```sql
-- 두 개의 다른 세션 필요 (H2 웹 콘솔 2개 열기)
set autocommit true;
delete from member;
insert into member(member_id, money) values ('oldId', 10000);
```

### 커밋 전 데이터 추가

```sql
-- 세션1: 트랜잭션 시작 및 데이터 추가
set autocommit false;
insert into member(member_id, money) values ('newId1', 10000);
insert into member(member_id, money) values ('newId2', 10000);
```

```sql
-- 양쪽 세션에서 확인
select * from member;
```

- 세션1
  - oldId, newId1, newId2 보임
- 세션2
  - oldId만 보임 (커밋 전이라 신규 데이터 안 보임)

### 커밋 후

```sql
-- 세션1: 커밋
commit;

-- 양쪽 세션에서 확인
select * from member;
```

- 모든 세션에서 oldId, newId1, newId2 보임 (커밋 후 데이터 공유)

### 롤백 후

```sql
-- 데이터 초기화
delete from member;
insert into member(member_id, money) values ('oldId', 10000);

-- 세션1: 트랜잭션 시작 및 데이터 추가
set autocommit false;
insert into member(member_id, money) values ('newId1', 10000);
insert into member(member_id, money) values ('newId2', 10000);

-- 세션1: 롤백
rollback;

-- 양쪽 세션에서 확인
select * from member;
```

- 모든 세션에서 oldId만 보임 (롤백으로 신규 데이터 사라짐)

<br/><br/>

## 계좌이체 예제

### 정상 케이스

```sql
-- 기본 데이터
set autocommit true;
delete from member;
insert into member(member_id, money) values ('memberA', 10000);
insert into member(member_id, money) values ('memberB', 10000);

-- 계좌이체 실행
set autocommit false;
update member set money=10000 - 2000 where member_id = 'memberA';
update member set money=10000 + 2000 where member_id = 'memberB';
commit;

-- 확인: memberA=8000, memberB=12000
select * from member;
```

### 오류 발생 케이스 - 커밋

```sql
set autocommit false;
update member set money=10000 - 2000 where member_id = 'memberA';  -- 성공
update member set money=10000 + 2000 where member_iddd = 'memberB';  -- 오류
commit;  -- 문제 발생
```

- memberA
  - 8000원 (2000원 손실이 발생)
- memberB
  - 10000원 (변경 없음)

### 오류 발생 케이스 - 롤백 (올바른 처리)

```sql
set autocommit false;
update member set money=10000 - 2000 where member_id = 'memberA';  -- 성공
update member set money=10000 + 2000 where member_iddd = 'memberB';  -- 오류
rollback;  -- 올바른 방법

-- 확인: memberA=10000, memberB=10000 (원래 상태로 복구)
select * from member;
```

- 트랜잭션의 원자성 보장으로 데이터 정합성 유지

<br/><br/>

## DB 락 (Lock)

### 락이 필요한 이유

- 동시에 같은 데이터를 수정하려면 트랜잭션 원자성이 깨짐
- 세션1이 트랜잭션 시작 후 커밋/롤백 전까지 다른 세션의 수정을 차단해야 함

![Lock Mechanism](/assets/img/springdb/lock_mechanism.png)

<br/><br/>

### 락 - 데이터 변경

```sql
-- 데이터 준비
delete from member;
insert into member(member_id, money) values ('memberA', 10000);

-- 세션1: 데이터 수정 (락 획듍)
set autocommit false;
update member set money=500 where member_id = 'memberA';

-- 세션2: 데이터 수정 시도
SET LOCK_TIMEOUT 60000;  -- 락 타임아웃 60초
set autocommit false;
update member set money=1000 where member_id = 'memberA';  -- 대기...

-- 세션1: 커밋 (락 반납)
commit;  -- 이 순간 세션2의 UPDATE 실행됨

-- 세션2: 커밋
commit;
```

- **락 타임아웃**
  - 60초 내 락을 못 획득하면 예외 발생 (`Timeout trying to lock table`)

<br/><br/>

### 락 - 데이터 조회

- **일반 조회**
  - 락 획득 없이 조회 가능
  - 세션1이 락을 획득하고도 세션2에서 조회 가능
  - 변경만 락 필요

- **SELECT FOR UPDATE**
  - 조회 시 락 획득
  ```sql
  select * from member where member_id='memberA' for update;
  ```
  - 조회하면서 동시에 락 획득
  - 트랜잭션 종료까지 다른 세션의 변경 차단
  - 중요한 계산 진행 중 데이터 보호

  ```sql
  -- 세션1
  --   조회 + 락 획득
  set autocommit false;
  select * from member where member_id='memberA' for update;

  -- 세션2
  --   데이터 수정 시도 (락 획득까지 대기)
  set autocommit false;
  update member set money=500 where member_id = 'memberA';

  -- 세션1, 세션2 커밋
  commit;
  ```

<br/><br/>

## 트랜잭션 적용

### MemberServiceV1 (트랜잭션 없음)


```java
public void accountTransfer(String fromId, String toId, int money) throws SQLException {
    Member fromMember = memberRepository.findById(fromId);  // 자동 커밋
    Member toMember = memberRepository.findById(toId);      // 자동 커밋
    
    memberRepository.update(fromId, fromMember.getMoney() - money);  // 자동 커밋
    validation(toMember);  // 예외 발생 가능
    memberRepository.update(toId, toMember.getMoney() + money);      // 자동 커밋
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV1.java)


- 각 DB 작업이 개별적으로 자동 커밋됨
- `fromMember` 금액 감소 후 예외 발생 시 롤백 불가
- 계좌이체의 원자성이 보장되지 않음

### MemberServiceV2 (트랜잭션 적용)

```java
public void accountTransfer(String fromId, String toId, int money) throws SQLException {
    Connection con = dataSource.getConnection();  // 커넥션 획득
    
    try {
        con.setAutoCommit(false);  // 트랜잭션 시작
        
        bizLogic(con, fromId, toId, money);  // 비즈니스 로직 (같은 커넥션 사용)
        
        con.commit();  // 성공 시 커밋
    } catch (Exception e) {
        con.rollback();  // 실패 시 롤백
        throw new IllegalStateException(e);
    } finally {
        release(con);  // 커넥션 정리
    }
}

private void bizLogic(Connection con, String fromId, String toId, int money) 
        throws SQLException {
    Member fromMember = memberRepository.findById(con, fromId);
    Member toMember = memberRepository.findById(con, toId);
    
    memberRepository.update(con, fromId, fromMember.getMoney() - money);
    validation(toMember);
    memberRepository.update(con, toId, toMember.getMoney() + money);
}
```

- [전체 코드](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV2.java)

1. 트랜잭션 시작 (`setAutoCommit(false)`)
2. 같은 커넥션 유지
3. 성공 시 COMMIT
4. 실패 시 ROLLBACK
5. 커넥션 풀 고려한 정리



<br/><br/>

## 연습 문제

1. 데이터베이스에서 트랜잭션을 사용하는 주된 목적은 무엇일까요?

   a. 여러 데이터베이스 작업을 하나의 논리적 단위로 묶어 안전하게 처리합니다.

   - 트랜잭션은 여러 데이터베이스 작업이 모두 성공하거나 모두 실패하도록 묶어 데이터 정합성을 보장함
   - 이를 통해 안전한 데이터 처리가 가능함

2. ACID 속성 중 '원자성(Atomicity)'이 의미하는 바는 무엇일까요?

   a. 트랜잭션 내의 모든 작업은 전부 성공하거나 전부 실패해야 합니다.

   - 원자성은 트랜잭션의 핵심으로, 쪼갤 수 없는 하나의 단위처럼 동작함을 의미함
   - 여러 작업이 있더라도 마치 하나처럼 움직여야 안전함

3. 데이터베이스 트랜잭션에서 데이터 변경 작업 후 'Commit'과 'Rollback'의 역할이 올바르게 설명된 것은 무엇일까요?

   a. Commit은 변경 사항 적용, Rollback은 변경 사항 취소

   - Commit은 트랜잭션 동안의 모든 변경사항을 DB에 영구 반영함
   - Rollback은 모든 변경을 취소하고 이전 상태로 되돌림
   - 데이터 정합성의 기본 동작임

4. 수동 커밋(Manual Commit) 모드에서 트랜잭션 시작 후 'Commit'되지 않은 데이터 변경은 다른 세션에서 어떻게 보일까요?

   a. 다른 세션에서는 커밋되지 않은 변경을 볼 수 없습니다.

   - 트랜잭션으로 묶인 변경 사항은 Commit 전까지는 해당 트랜잭션이 속한 세션에서만 보임
   - 다른 세션은 Commit된 데이터만 볼 수 있음

5. 여러 SQL 문을 하나의 논리적 단위로 실행해야 하는 작업(예: 계좌 이체)에서 자동 커밋(Auto-commit) 모드를 사용하면 발생할 수 있는 주된 문제는 무엇일까요?

   a. 작업 중간에 오류 발생 시 일부 작업만 적용되어 데이터 불일치가 발생할 수 있습니다.

   - 자동 커밋은 각 SQL마다 즉시 커밋하므로, 계좌 이체처럼 두 작업 중 하나만 성공하고 오류나면 롤백이 안 됨
   - 원자성이 깨져 데이터 불일치가 발생함

6. 수동 커밋(Manual Commit) 모드에서 데이터베이스 트랜잭션은 보통 언제 시작된다고 간주하나요?

   a. 자동 커밋을 false로 설정하는 순간

   - 수동 커밋 모드로 전환하는 setAutoCommit(false) 호출 시점부터 해당 연결을 통한 일련의 DB 작업들이 하나의 트랜잭션으로 묶임
   - 이때부터 시작이라 볼 수 있음

7. DB 세션이 데이터베이스 트랜잭션 관리에 있어 중요한 이유는 무엇일까요?

   a. 트랜잭션의 상태 및 그로 인한 임시 데이터 변경 사항을 유지하고 관리하는 주체이기 때문입니다.

   - DB 세션은 각 연결별로 생성되며 그 연결을 통한 모든 SQL 실행 상태와 트랜잭션 상태를 관리함
   - 커밋/롤백 여부, 임시 변경 데이터 등을 세션이 관리함
   - 같은 세션에서만 같은 트랜잭션으로 묶임

8. 여러 트랜잭션이 동시에 같은 데이터를 변경하려고 할 때 발생할 수 있는 데이터 불일치 문제를 방지하기 위해 데이터베이스에서 사용하는 주요 메커니즘은 무엇일까요?

   a. DB 락(Lock)

   - 여러 트랜잭션이 동시에 같은 데이터에 접근하면 예상치 못한 결과가 발생함
   - 락은 특정 데이터에 대한 접근을 제어해서, 한 트랜잭션이 끝날 때까지 다른 트랜잭션이 변경하지 못하게 막음
   - 이를 통해 데이터 일관성을 지킴

9. 'SELECT FOR UPDATE' 구문을 사용하여 데이터를 조회할 때 발생하는 특징은 무엇일까요?

   a. 조회한 데이터에 대해 다른 트랜잭션의 변경을 막는 락을 획득합니다.

   - 보통 SELECT는 락을 걸지 않지만, 'SELECT FOR UPDATE'는 데이터를 읽는 시점에 해당 데이터에 락을 걸음
   - 다른 트랜잭션이 읽은 데이터를 변경하지 못하도록 보장할 때 사용함

10. 애플리케이션 서비스 계층에서 JDBC를 이용해 수동으로 트랜잭션을 관리할 때 가장 까다로운 부분 중 하나는 무엇일까요?

    a. 트랜잭션 시작/커밋/롤백 처리 로직이 핵심 비즈니스 로직과 복잡하게 섞이는 것

    - 비즈니스 로직 실행 전후로 연결 가져오기, 자동 커밋 설정 변경, try-catch-finally로 커밋/롤백/연결 반환 처리 코드가 붙음
    - 서비스 로직이 지저분해짐

<br/><br/>

## 요약 정리

- **트랜잭션**
  - 데이터베이스에서 여러 작업을 하나의 단위로 묶어 안전하게 처리하는 메커니즘
  - 모든 작업이 성공하면 Commit, 하나라도 실패하면 Rollback으로 이전 상태 복구
  - 계좌이체처럼 여러 작업이 함께 성공하거나 실패해야 하는 경우 필수

- **ACID 원칙**
  - **원자성 (Atomicity)**
    - 트랜잭션 내 모든 작업이 성공하거나 모두 실패
  - **일관성 (Consistency)**
    - 트랜잭션 전후로 무결성 제약 조건 만족
  - **격리성 (Isolation)**
    - 동시 실행되는 트랜잭션들이 서로 간섭하지 않음
    - READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE 4단계 존재
    - READ COMMITTED가 가장 일반적
  - **지속성 (Durability)**
    - 성공한 트랜잭션은 시스템 장애 발생 시에도 영구 저장

- **데이터베이스 세션**
  - 클라이언트와 데이터베이스 서버 간 연결 시 생성
  - 커넥션당 1개의 세션이 매핑됨
  - SQL 실행과 트랜잭션 관리를 담당

- **커밋 모드**
  - **자동 커밋**
    - 각 쿼리마다 자동으로 커밋되어 트랜잭션 기능 사용 불가
  - **수동 커밋**
    - `set autocommit false`로 설정
    - 명시적으로 COMMIT 또는 ROLLBACK 호출 필요
    - 여러 작업을 하나의 트랜잭션으로 묶을 수 있음

- **데이터 격리**
  - 커밋 전 데이터는 해당 세션에서만 조회 가능
  - 다른 세션에서는 커밋된 데이터만 보임
  - 롤백 시 다른 세션에 영향을 주지 않음

- **락 (Lock)**
  - **필요성**
    - 동시에 같은 데이터를 수정하면 트랜잭션 원자성이 깨짐
  - **동작 원리**
    - 트랜잭션 시작 후 데이터 수정 시 자동으로 락 획득
    - 다른 세션은 락을 획득할 때까지 대기
    - 커밋 또는 롤백 시 락 반납
  - **조회 시 락**
    - 일반 조회는 락 없이 가능
    - `SELECT FOR UPDATE`로 조회 시 락 획득 가능
    - 중요한 계산 중 데이터 변경 방지용

- **트랜잭션 적용**
  - 같은 커넥션을 유지하며 작업 수행
  - `setAutoCommit(false)`로 트랜잭션 시작
  - 성공 시 `commit()`, 실패 시 `rollback()` 호출
  - 커넥션 풀 사용 시 커넥션 정리 시 자동 커밋 모드로 복구 필수

- **권장사항**
  - 항상 수동 커밋 모드 사용
  - READ COMMITTED 격리 수준 사용
  - 트랜잭션 범위를 명확히 설정하여 불필요한 락 시간 최소화

<br/><br/>

## Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/스프링-db-1)
