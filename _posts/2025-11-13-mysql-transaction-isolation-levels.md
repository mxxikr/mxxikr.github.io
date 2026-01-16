---
title: MySQL 트랜잭션 격리 수준과 다른 DBMS와의 차이점
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-11-13 00:00:00 +0900
category: [Database, MySQL]
tags: [mysql, database, transaction, isolation-level, mvcc]
math: false
mermaid: false
---
## 개요

- 트랜잭션 격리 수준은 데이터베이스에서 여러 트랜잭션이 동시에 실행될 때 서로의 데이터 변경을 어느 정도까지 볼 수 있도록 허용할지를 결정하는 기준임
- MySQL은 다른 주요 데이터베이스와 달리 **REPEATABLE READ**를 기본 격리 수준으로 사용하며 이는 MySQL의 MVCC(Multi-Version Concurrency Control) 구현과 밀접한 관련이 있음
- 이 포스팅에서는 MySQL의 트랜잭션 격리 수준을 상세히 살펴보고 다른 주요 DBMS와의 차이점을 비교 분석함


<br/><br/>

## 트랜잭션이란?

- 트랜잭션은 데이터베이스에서 논리적으로 하나의 작업 단위로 처리되는 명령들의 모음임
- 트랜잭션은 반드시 다음과 같은 **ACID 속성**을 만족해야 함

- **원자성(Atomicity)**
  - 트랜잭션은 모든 작업이 전부 실행되거나 모두 취소되어야 함
- **일관성(Consistency)**
  - 트랜잭션 실행 전과 후에 데이터베이스는 항상 일관성 있는 상태를 유지해야 함
- **격리성(Isolation)**
  - 동시에 여러 트랜잭션이 실행될 경우 서로의 데이터에 영향을 미치지 않아야 함
- **지속성(Durability)**
  - 일단 커밋된 트랜잭션의 결과는 시스템에 영구히 반영되어야 함


<br/><br/>

## 트랜잭션 격리 수준이란?

- 격리 수준은 트랜잭션의 "격리성"을 어느 정도로 강하게 유지할지 설정하는 값임
- 여러 트랜잭션이 동시에 실행될 때 데이터의 일관성을 지키기 위해 얼마나 서로 간섭을 허용할지 결정함
- 격리 수준이 높을수록 데이터의 정합성이 높아지지만 동시 처리 성능은 떨어짐
- 반대로 격리 수준이 낮을수록 동시성은 높아지지만 데이터 일관성 문제가 발생할 수 있음


<br/><br/>

## MySQL의 트랜잭션 격리 수준

- MySQL(InnoDB)은 다음 4가지 격리 수준을 지원함

### READ UNCOMMITTED

- **특징**
  - 가장 낮은 격리 수준
- **동작**
  - 커밋되지 않은 데이터를 다른 트랜잭션에서 읽을 수 있음
- **문제점**
  - Dirty Read, Non-Repeatable Read, Phantom Read 모두 발생 가능함
- **사용 사례**
  - 거의 사용하지 않음

### READ COMMITTED

- **특징**
  - 대부분의 DBMS의 기본 격리 수준
- **동작**
  - 오직 커밋된 데이터만 읽을 수 있음
- **문제점**
  - Dirty Read는 없지만 Non-Repeatable Read와 Phantom Read는 발생 가능함
- **MySQL에서의 사용**
  - 명시적으로 설정해야 사용 가능함

### REPEATABLE READ (MySQL 기본 값)

- **특징**
  - MySQL(InnoDB)의 기본 격리 수준
- **동작**
  - 트랜잭션 시작 시점의 데이터를 계속 읽으며 다른 트랜잭션에서 커밋된 변경 사항이 조회 중에 보이지 않음
- **문제점**
  - Dirty Read와 Non-Repeatable Read는 방지함
  - Phantom Read는 이론적으로 발생 가능하지만 MySQL InnoDB는 Gap Lock과 Next-Key Lock으로 대부분 방지함
- **장점**
  - 트랜잭션 내에서 동일한 SELECT 결과를 보장함

### SERIALIZABLE

- **특징**
  - 가장 높은 격리 수준
- **동작**
  - 모든 트랜잭션을 순차적으로 실행하는 것처럼 동작함
- **문제점**
  - 성능 하락 우려가 크고 실제로는 잘 사용되지 않음
- **모든 문제 방지**
  - Dirty Read, Non-Repeatable Read, Phantom Read 모두 불가능함


<br/><br/>

## 격리 수준별 발생 가능한 현상

### 각 현상 설명

- **Dirty Read**
  - 다른 트랜잭션이 아직 커밋하지 않은 데이터를 읽는 현상
- **Non-Repeatable Read**
  - 한 트랜잭션 내에서 같은 데이터를 두 번 읽을 때 값이 바뀌는 현상
- **Phantom Read**
  - 동일 조건 SELECT 결과가 트랜잭션 내에서 다르게 나타나는 현상 (새로운 행 삽입/삭제로 인해)

### 격리 수준별 현상 발생 여부

| 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
| :-- | :-- | :-- | :-- |
| READ UNCOMMITTED | 가능 | 가능 | 가능 |
| READ COMMITTED | 불가능 | 가능 | 가능 |
| REPEATABLE READ | 불가능 | 불가능 | 가능 (MySQL InnoDB는 Gap Lock으로 대부분 방지) |
| SERIALIZABLE | 불가능 | 불가능 | 불가능 |


<br/><br/>

## 주요 DBMS와의 차이점

### 기본 격리 수준 비교

| DBMS | 기본 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read | 구현 특징 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| MySQL (InnoDB) | REPEATABLE READ | 불가능 | 불가능 | 대부분 방지 | MVCC, Gap Lock, Next-Key Lock |
| Oracle | READ COMMITTED | 불가능 | 가능 | 가능 | MVCC, Undo Segment |
| PostgreSQL | READ COMMITTED | 불가능 | 가능 | 가능 | MVCC |
| SQL Server | READ COMMITTED | 불가능 | 가능 | 가능 | Read Lock, Snapshot 옵션 |
| MongoDB | READ UNCOMMITTED | 가능 | 가능 | 가능 | 동시성 극대화, 낮은 일관성 |

### 구현 방식의 차이

### MySQL (InnoDB)

- **REPEATABLE READ (기본값)**
  - MVCC를 이용해 트랜잭션의 시작 시점에 스냅샷을 만들어 커밋된 변경만 반영함
  - Phantom Read는 Gap Lock과 Next-Key Lock으로 대부분 방지함
  - 높은 일관성, Dirty Read/Non-Repeatable Read 완전 방지, Phantom Read도 실질적으로 방지함

### Oracle

- **READ COMMITTED (기본값)**
  - 커밋된 데이터만 읽을 수 있게 함
  - MVCC와 Undo Segments로 구현되어 Dirty Read는 막지만 Non-Repeatable Read와 Phantom Read는 발생할 수 있음
  - SELECT 시마다 새로운 스냅샷을 가져오므로 같은 쿼리라도 값이 바뀔 수 있음

### PostgreSQL

- **READ COMMITTED (기본값)**
  - 트랜잭션 내 쿼리마다 커밋된 최신 값을 읽음
  - MVCC 기반으로 Dirty Read는 없지만 Non-Repeatable Read와 Phantom Read는 발생 가능함

### MS SQL Server

- **READ COMMITTED (기본값)**
  - 기본적으로 레코드별 읽기 Lock(read lock)을 사용하여 커밋된 데이터만 읽도록 함
  - 스냅샷 격리처럼 인덱스 버전 기반 동작 옵션도 제공함(설정 필요)
  - Dirty Read는 막으면서 동시성은 Standard 환경보다 높음


<br/><br/>

## MySQL이 REPEATABLE READ를 기본 값으로 사용하는 이유

- MySQL(InnoDB)가 다른 DBMS와 달리 REPEATABLE READ를 기본 격리 수준으로 채택한 이유는 다음과 같음

### MVCC 활용

- MySQL의 InnoDB 엔진은 MVCC 메커니즘으로 트랜잭션이 시작된 시점의 스냅샷 데이터를 읽기 때문에 트랜잭션 내에서 반복적으로 SELECT하더라도 항상 일관된 결과를 반환할 수 있음

### 동시성과 일관성 균형

- READ COMMITTED보다 더 높은 일관성을 제공하면서도 SERIALIZABLE처럼 성능 저하가 크지 않음

### Phantom Read 방지

- MySQL InnoDB는 Gap Lock과 Next-Key Lock 등의 추가 기능을 통해 Phantom Read까지 실질적으로 방지 가능하게 설계되어 있음

### MySQL 사용자의 통계적 패턴

- 웹 중심 환경에서 데이터 정합성을 좀 더 중요시하는 경우가 많아서 REPEATABLE READ가 적합함


<br/><br/>

## REPEATABLE READ 사용 시 생기는 차이점

### 장점

- **동일 트랜잭션 내 반복 조회 결과 일관**
  - 트랜잭션이 시작된 순간을 기준으로 SELECT 결과가 고정되므로 Non-Repeatable Read 현상이 발생하지 않음
- **Phantom Read 방지**
  - Gap Lock과 Next-Key Lock이 활성화되어 트랜잭션 내에서 SELECT 조건과 일치하는 새로운 행의 생성을 차단하여 Phantom Read도 대부분 방지함

### 단점

- **Lock 오버헤드**
  - 일부 상황에서는 더 많은 Lock이 걸려 Lock Wait Timeout이 발생하거나 성능이 READ COMMITTED보다 떨어질 수 있음


<br/><br/>

## MVCC(Multi-Version Concurrency Control)

### MySQL과 InnoDB의 관계

- MySQL은 여러 스토리지 엔진을 지원하는 DBMS이며 InnoDB는 그 중 하나임
- MySQL 5.5 이후부터 InnoDB가 기본 스토리지 엔진으로 사용됨
- 트랜잭션 격리 수준과 MVCC는 InnoDB 스토리지 엔진에서 구현됨

### MVCC란 무엇인가?

- MVCC(다중 버전 동시성 제어)는 데이터베이스에서 하나의 데이터 레코드에 여러 버전을 관리함으로써 여러 트랜잭션이 동시에 데이터에 접근해도 **일관된 읽기**와 높은 **동시성**을 보장하는 기술임
- 핵심 목표는 **Lock 없이 동시성**을 관리하면서 읽기와 쓰기 작업이 서로 간섭하지 않도록 하는 것임

### MVCC의 핵심 동작 원리

- **복수 버전 관리**
  - 데이터가 수정될 때마다 이전 버전은 Undo Log에 보관되고 최신 버전은 테이블에 저장됨
  - 트랜잭션마다 다르게 보일 수 있도록 여러 버전을 동시에 유지함
- **트랜잭션 스냅샷**
  - 각 트랜잭션은 자신만의 스냅샷을 갖고 그 시작 시점에 커밋된 데이터만 읽음
  - 트랜잭션이 시작한 뒤에 다른 트랜잭션이 커밋한 데이터는 보이지 않음
- **읽기와 쓰기 분리**
  - 읽기 작업은 Undo Log 등에서 스냅샷에 맞는 버전을 골라 읽고 쓰기 작업은 최신 버전을 만든 뒤 트랜잭션 종료 시 커밋함
  - 덕분에 읽기는 Lock을 거의 필요로 하지 않아서 동시성이 매우 높아짐

### MVCC 예시

1. 트랜잭션 A가 "T-shirt" 상품을 조회하면 해당 시점의 버전(Version1)을 읽음
2. 트랜잭션 B가 "T-shirt" 상품 정보를 "Shoes"로 수정해서 Version2를 만듦
3. 트랜잭션 A는 Version1의 데이터를 계속 읽고 B가 커밋하더라도 A의 트랜잭션이 종료되기 전에는 Version2를 볼 수 없음

### MVCC의 장점

- **Lock 없이 높은 동시성**
  - 읽기 쿼리에서 행 Lock/테이블 Lock을 걸지 않아도 됨
- **읽기 일관성**
  - 트랜잭션 내부에서는 항상 안정된 데이터를 읽게 되어 Non-Repeatable/Dirty Read를 막을 수 있음
- **트랜잭션 격리 보장**
  - 각 트랜잭션은 독립적으로 자신만의 스냅샷에 따라 데이터 보기에 일관성이 있음

### MVCC 구현 요소

- **Undo 영역/Undo Log**
  - 이전 버전의 데이터를 보관하여 특정 시점 스냅샷에 맞게 데이터 재구성 가능
- **타임스탬프 or 트랜잭션 ID**
  - 데이터 버전별로 트랜잭션 수행시점을 표시하여 적절한 버전을 식별함
- **Rollback Segment**
  - 갱신이나 로직 실패 시 데이터 복구에 필요함

### 격리 수준과 MVCC

- MySQL InnoDB의 REPEATABLE READ 등에서는 MVCC를 활용해, 트랜잭션 내에서 동일한 SELECT 결과를 계속 제공함
- 다른 DBMS도 MVCC와 격리 수준에 따라 구현이 다름
    - ex) 읽기 커밋 기준 스냅샷 관리


<br/><br/>

## 버전별 차이

- **MySQL 5.5 이상(InnoDB 엔진)**
  - REPEATABLE READ가 기본값으로 확정되었고 Phantom Read 방지를 위한 Gap Lock과 Next-Key Lock이 명확히 적용되고 있음
- **이전 버전**
  - MVCC 및 Lock 관리가 다소 제한적이었으나 현재는 거의 모든 환경에서 위 특성이 동일하게 적용됨
- **다른 DBMS**
  - Oracle이나 PostgreSQL 등도 MVCC는 비슷하게 도입했지만 기본 격리 수준 정책은 그대로 READ COMMITTED임


<br/><br/>

## 다음 포스팅

- [MySQL InnoDB 내부 구조와 동작 원리](https://mxxikr.github.io/posts/2025-11-14-mysql-innodb-internal-structure/) - 트랜잭션 격리 수준과 MVCC가 InnoDB 엔진 내부에서 어떻게 구현되는지 상세히 살펴봄


<br/><br/>

## Reference

- [MySQL 8.0 Reference Manual - Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html)
- [InnoDB Locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)
- [MVCC in InnoDB](https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html)