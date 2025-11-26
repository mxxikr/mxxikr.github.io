---
title: 데이터베이스 트랜잭션과 ACID 속성
date: 2025-11-02 00:00:00 +0900
category:
  - [Database, Theory]
tags: [database, transaction, acid]
math: false
mermaid: true
---

## 개요

- 트랜잭션은 데이터베이스에서 하나의 논리적 작업 단위로 실행되는 일련의 연산들임
- 원자성을 보장하여 전체가 성공하거나 전체가 실패함
- 여러 사용자가 동시에 데이터에 접근할 때 데이터 일관성을 보장하는 핵심 메커니즘임

## 트랜잭션의 생명 주기

- 트랜잭션은 시작부터 종료까지 여러 상태를 거침
- 아래 다이어그램은 **논리적인 트랜잭션 상태 모델**임
- 실무에서는 커밋 요청 시 로그 기록이 성공하면 바로 Committed로 간주함

  ![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image.png)

### 트랜잭션 상태

- Active
  - 트랜잭션이 실행 중인 상태
- Partially Committed
  - 모든 연산이 완료되었지만 커밋 전 상태
- Committed
  - 커밋이 완료되어 변경사항이 영구 저장된 상태
- Failed
  - 오류가 발생하여 중단된 상태
- Aborted
  - 롤백이 완료되어 변경사항이 취소된 상태

## ACID 속성

### 원자성(Atomicity)

- 트랜잭션이 분리 불가능한 단일 작업 단위로 처리되도록 보장함
- 일부가 실패하면 전체가 롤백되어 이전 상태로 복원됨
- 작업이 모두 반영되거나 아예 반영되지 않아야 함(All or Nothing)

### 원자성 구현 원리

![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image1.png)

### 구현 방법

- `Undo Log`를 통한 롤백 메커니즘
- 트랜잭션 로그 기반 복구
- Shadow Paging 기법

### 일관성(Consistency)

- 트랜잭션이 실행을 성공적으로 완료하면 언제나 일관성 있는 데이터베이스 상태로 유지해야 함
- 미리 정의된 규칙과 제약 조건을 위반할 수 없음
- 여기서의 일관성은 **비즈니스 룰과 데이터 무결성 제약 조건을 위반하지 않는 것**을 의미함
  - ex)
    - 잔액은 마이너스가 될 수 없다
    - 외래키 제약조건을 위반할 수 없다
    - `NOT NULL` 제약조건을 위반할 수 없다
- 분산 시스템의 CAP 이론의 Consistency(모든 노드가 같은 데이터를 봄)와는 다른 개념임
- 보장 방법
  - 제약 조건(`Constraint`) 검사
  - 트리거(`Trigger`) 실행
  - 애플리케이션 레벨 검증

### 격리성(Isolation)

- 동시에 실행되는 트랜잭션들이 서로 간섭하지 않도록 보장함
- 수행 중인 트랜잭션은 완전히 완료될 때까지 다른 트랜잭션의 결과를 참조할 수 없음
- 한 트랜잭션의 중간 결과가 다른 트랜잭션에게 보이는 정도를 격리 수준으로 제어함
- 현대 RDBMS의 구현 방식
  - 과거에는 락(`Lock`)으로만 격리 수준을 제어했지만 현대의 RDBMS(`Oracle`, `PostgreSQL`, `MySQL InnoDB`)는 **MVCC**(Multi-Version Concurrency Control)를 통해 읽기 작업이 쓰기 작업을 차단하지 않도록 함
  - MVCC는 데이터의 여러 버전을 유지하여 각 트랜잭션이 일관된 스냅샷을 보도록 함

- MVCC 동작 원리

  ![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image2.png)

  - `Read View` 생성 시점
    - `REPEATABLE READ`
      - 트랜잭션 시작 시점(`BEGIN`)에 `Read View` 생성
      - 트랜잭션 내 모든 읽기 작업에서 동일한 `Read View` 사용
      - 트랜잭션 중간에 다른 트랜잭션이 커밋해도 변경사항을 보지 않음
    - `READ COMMITTED`
      - 각 쿼리 실행 시점마다 새로운 `Read View` 생성
      - 트랜잭션 중간에 다른 트랜잭션이 커밋하면 다음 쿼리에서 변경사항을 볼 수 있음
      - Non-Repeatable Read가 발생할 수 있음

- 격리 수준
  - `READ UNCOMMITTED`
  - `READ COMMITTED`
  - `REPEATABLE READ`
  - `SERIALIZABLE`

### 지속성(Durability)

- 커밋된 트랜잭션의 결과가 영구적으로 반영되도록 보장함
- 시스템 장애 후에도 데이터가 복구되어야 함
- Once Committed, Always Committed 원칙

- 지속성 구현 원리

  ![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image3.png)

- 구현 방법

  - `Redo Log`를 통한 복구 메커니즘
  - 커밋 시 로그 강제 기록(Force Log)
  - Write-Ahead Logging (`WAL`) 프로토콜
- 참고
  - 로그는 커밋 시 강제 기록되지만, 실제 데이터 파일(`Data File`)의 쓰기는 비동기로 일어남
  - `fsync` 시스템 콜을 통해 OS 커널의 버퍼 캐시에서 디스크로 강제 플러시함
  - `CheckPoint` 시점에 데이터 파일에 변경 사항이 반영됨
  - 시스템 장애 시 `Redo Log`를 통해 커밋 된 트랜잭션을 재실행하여 데이터를 복구함

## 격리 수준

### READ UNCOMMITTED

- 가장 낮은 격리 수준으로, 커밋되지 않은 데이터도 읽을 수 있어 Dirty Read가 발생함
- 동시성은 가장 높지만 데이터 정합성이 보장되지 않음
- 발생 가능한 이상 현상
  - Dirty Read
  - Non-Repeatable Read
  - Phantom Read
- 사용 사례
  - 거의 사용하지 않음
  - 데이터 정합성이 중요하지 않은 통계 수집 등

### READ COMMITTED

- 대부분의 RDBMS에서 기본 격리 수준으로 커밋 된 데이터만 읽을 수 있어 Dirty Read를 방지함
- 그러나 Non-Repeatable Read는 발생할 수 있음
- 발생 가능한 이상 현상
  - Non-Repeatable Read
  - Phantom Read
- 특징
  - `Oracle`, `PostgreSQL`, `SQL Server`의 기본 값
  - 각 쿼리마다 새로운 `Read View` 생성하여 스냅샷 사용
  - `REPEATABLE READ`와 달리 트랜잭션 중간에 다른 트랜잭션의 커밋된 변경사항을 볼 수 있음
  - MVCC를 통해 구현됨

### REPEATABLE READ

- 트랜잭션 내에서 동일한 데이터를 여러 번 읽어도 같은 값을 보장함
- `MySQL InnoDB`의 기본 격리 수준이며 트랜잭션 ID를 활용하여 스냅샷을 유지함
- 발생 가능한 이상 현상
  - Phantom Read (이론적으로 가능, `MySQL InnoDB`는 Gap Lock으로 대부분 방지)
  - 참고
    - Locking Read(`SELECT ... FOR UPDATE`) 상황이나 트랜잭션 중간에 `INSERT`를 시도할 때 등 특정 상황에서는 여전히 Phantom Read가 발생할 수 있음
- 특징
  - `MySQL InnoDB`의 기본값
  - 트랜잭션 시작 시점에 `Read View` 생성하여 스냅샷 유지
  - `Gap Lock`과 `Next-Key Lock`으로 Phantom Read 방지
  - MVCC를 통해 구현됨

### SERIALIZABLE

- 가장 높은 격리 수준으로, 트랜잭션을 완전히 직렬화하여 실행함
- 모든 이상 현상을 방지하지만 동시성이 크게 저하됨
- 발생 가능한 이상 현상
  - 없음
- 특징
  - 가장 강한 격리 보장
  - 성능 저하로 인해 실무에서 거의 사용하지 않음
  - 읽기 작업에도 공유 락(`Shared Lock`) 필요

## 이상 현상

### Dirty Read

- 다른 트랜잭션에서 변경했지만 아직 커밋되지 않은 데이터를 읽는 현상임
- 해당 트랜잭션이 롤백되면 무효한 데이터를 읽게 됨

  ![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image4.png)

  ```sql
  -- 트랜잭션 A
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  -- 트랜잭션 B
  SELECT balance FROM accounts WHERE id = 1; -- 커밋 전 데이터 읽음
  -- 트랜잭션 A
  ROLLBACK;
  -- 트랜잭션 B는 무효한 데이터를 읽게 됨
  ```

### Non-Repeatable Read

- 한 트랜잭션 내에서 같은 데이터를 두 번 읽을 때 값이 달라지는 현상임
- 다른 트랜잭션이 데이터를 수정하고 커밋하여 발생함

  ![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image5.png)

### Phantom Read

- 한 트랜잭션 내에서 같은 쿼리를 두 번 실행할 때 결과 행의 개수가 달라지는 현상임
- 다른 트랜잭션이 행을 삽입하거나 삭제하여 발생하며, Non-Repeatable Read와 달리 기존 행의 값은 변하지 않고 행의 개수가 변함
- 표준 SQL 스펙 상 동작
    - 표준 SQL 스펙 상 `REPEATABLE READ` 격리 수준에서도 Phantom Read가 발생할 수 있음
    - 아래 다이어그램은 표준 SQL 스펙 기준으로 작성됨
- MySQL InnoDB의 특징
    - 일반적인 `SELECT` (Snapshot Read)
        - MVCC 기술 덕분에 `REPEATABLE READ`에서도 Phantom Read가 발생하지 않음
        - 트랜잭션 시작 시점에 `Read View`가 생성되어 동일한 스냅샷을 유지하기 때문임
        - 두 번째 조회에서도 트랜잭션 시작 시점의 스냅샷을 보므로 결과는 여전히 동일함
    - 잠금 읽기 (`SELECT ... FOR UPDATE` 등)
        - 스냅샷이 아닌 현재의 최신 데이터를 읽어야 하므로 Phantom Read가 발생할 수 있음
        - 단, 이 경우에도 `Gap Lock`을 통해 대부분 방지됨

  ![image.png](/assets/img/database/theory/2025-11-02-database-transaction-acid/image6.png)


  ```sql
  -- 트랜잭션 A
  SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- 결과: 10

  -- 트랜잭션 B
  INSERT INTO orders (status) VALUES ('pending');
  COMMIT;

  -- 트랜잭션 A
  SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- 결과: 11 (행 개수 변경됨)
  ```

## 격리 수준 비교

- 각 격리 수준별로 허용되는 이상 현상을 비교

  | 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
  |---------|------------|---------------------|--------------|
  | READ UNCOMMITTED | 가능 | 가능 | 가능 |
  | READ COMMITTED | 불가능 | 가능 | 가능 |
  | REPEATABLE READ | 불가능 | 불가능 | 가능* |
  | SERIALIZABLE | 불가능 | 불가능 | 불가능 |

  - *표준 SQL 스펙상 가능하지만, MySQL InnoDB는 일반 `SELECT` 시 MVCC로 방지하고, `SELECT ... FOR UPDATE` 시 `Gap Lock`으로 대부분 방지함

## 트랜잭션 격리 수준 선택 가이드

### READ COMMITTED 선택 시

- 대부분의 일반적인 애플리케이션에 적합
- 높은 동시성과 적절한 일관성의 균형
- 통계 수집, 리포트 생성 등에 적합

### REPEATABLE READ 선택 시

- 금융 거래, 재고 관리 등 정확성이 중요한 경우
- 트랜잭션 내에서 동일한 데이터를 여러 번 읽어야 하는 경우
- `MySQL InnoDB`의 기본 값

### SERIALIZABLE 선택 시

- 매우 높은 일관성이 필요한 경우
- 동시성이 낮아도 되는 경우
- 실무에서는 거의 사용하지 않음

## 결론

- 트랜잭션 격리 수준은 동시성과 일관성 사이의 트레이드오프를 고려해야 함
- 애플리케이션 요구사항에 맞는 적절한 격리 수준을 선택하는 것이 중요함