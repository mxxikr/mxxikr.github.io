---
title: "데이터베이스 동시성 제어"
author:
  name: mxxikr
  link: https://github.com/mxxikrㄴ
date: 2025-11-03 00:00:00 +0900
category:
  - [Database, Theory]
tags: [database, concurrency-control, mvcc, deadlock]
math: false
mermaid: true
---

## 개요

- 여러 트랜잭션이 동시에 데이터에 접근할 때 충돌을 방지하고 일관성을 보장하는 기법임

## 락 기반 동시성 제어

### 비관적 락(Pessimistic Locking)

- 충돌이 발생할 것으로 가정하고 데이터를 미리 잠금
- 트랜잭션이 데이터를 읽거나 수정하기 전에 락을 획득하여 다른 트랜잭션의 접근을 차단함
- 특징
  - 데이터 무결성을 강력하게 보장
  - 동시성 저하
  - 데드락 위험 존재
- 사용 사례
  - 충돌이 빈번한 환경
  - 데이터 정합성이 매우 중요한 경우
  - 재고 관리, 금융 거래 등
- 구현
  ```sql
  -- SELECT FOR UPDATE
  BEGIN;
  SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  COMMIT;
  ```
  - `FOR UPDATE`
    - 이 구문이 실행되는 순간 조회된 행(Row)들에 대해 **배타적 락**(Exclusive Lock, X-Lock)을 획득함

### 낙관적 락(Optimistic Locking)

- 충돌이 드물 것으로 가정하고 락 없이 작업함
- 트랜잭션 커밋 시점에 충돌을 검증하며 충돌 발생 시 롤백하고 재시도함
- **중요**
  - 낙관적 락은 DBMS가 제공하는 물리적인 락 기능이라기보다 **애플리케이션 레벨의 패턴**(CAS, Compare And Swap)에 가까움
  - DB 자체 기능(Locking Read)을 쓰지 않고 `UPDATE ... WHERE version = ?` 처럼 처리함
  - 애플리케이션 코드에서 버전 검증을 통해 충돌을 감지하고 처리함
- 특징
  - 높은 처리량과 동시성 제공
  - 충돌이 빈번하면 재시도 비용 증가
- 사용 사례
  - 읽기 중심 워크로드
  - 충돌이 드문 환경
  - 웹 애플리케이션 등

- 구현
  ```sql
  -- 버전 컬럼 사용
  CREATE TABLE accounts (
      id INT PRIMARY KEY,
      balance DECIMAL(10,2),
      version INT  -- 버전 컬럼
  );

  -- 업데이트 시 버전 검증 (CAS 패턴)
  UPDATE accounts 
  SET balance = balance - 100, version = version + 1
  WHERE id = 1 AND version = @old_version;
  -- 영향받은 행이 0개면 충돌 발생, 재시도 필요
  ```
  - 버전 관리 (`Versioning`)
    - `version` 컬럼을 사용하여 데이터의 변경 횟수를 추적함
    - 타임스탬프(`updated_at`)를 사용하는 경우도 있지만 정수형 버전이 더 안전하고 일반적임
  - 충돌 감지 (`Conflict Detection`)
    - `WHERE version = @old_version` 조건
    - 데이터를 읽었을 때의 버전(`@old_version`)과 현재 DB의 버전이 일치하는지 검사함
  - 원자적 갱신
    - 데이터베이스의 `UPDATE` 문은 원자적(Atomic)으로 실행되므로 동시성 문제가 발생하지 않음
    - 조건이 맞지 않으면 수정된 행의 개수(`Affected Rows`)가 0이 반환됨

- 구현 시 주의 사항
  - 재시도 로직 (`Retry Logic`) 필요
    - 낙관적 락은 충돌이 발생하면(`Affected Rows == 0`) 쿼리가 실패함
    - 따라서 애플리케이션 레벨에서 이를 감지하고 데이터를 다시 읽어서(`SELECT`) 재시도하는 로직을 반드시 구현해야 함
  - 롤백 처리
    - 트랜잭션 내에서 여러 테이블을 수정하다가 낙관적 락 충돌이 발생하면 이미 수정된 앞의 데이터들도 롤백해야 함

### 비관적 락(Pessimistic Locking) vs 낙관적 락(Optimistic Locking)

![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image.png)

## 2PL

- 트랜잭션의 락 연산을 두 단계로 나누는 프로토콜

- 2PL 단계

  ![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image1.png)

- 특징

  - 직렬화 가능성(serializability) 보장
  - 데드락 발생 가능
    - 2PL은 직렬성(Serializability)을 보장하기 위해 락을 길게 유지하므로 오히려 데드락 발생 확률은 일반적인 락킹보다 높을 수 있음
  - Cascading rollback 가능성 존재
    - Shrinking Phase에서 락을 해제하면 다른 트랜잭션이 그 데이터를 읽을 수 있음
    - 원래 트랜잭션이 나중에 롤백되면 그 트랜잭션이 쓴 커밋되지 않은 데이터를 읽은 다른 트랜잭션들도 연쇄적으로 롤백되어야 함
    - ex)
      - 트랜잭션 T1이 데이터 A를 수정하고 락을 해제함
      - 트랜잭션 T2가 T1이 수정한 A를 읽음
      - T1이 롤백되면 T2도 무효한 데이터를 읽었으므로 롤백되어야 함
      - T2를 읽은 T3가 있다면 T3도 롤백되어야 하는 연쇄 반응 발생

### Growing Phase

- 락을 획득만 하고 해제하지 않음
- 모든 필요한 락을 획득
- 이 단계에서는 락을 해제할 수 없음

### Shrinking Phase

- 락을 해제만 하고 획득하지 않음
- 트랜잭션 종료 시점에 락 해제
- 이 단계에서는 새로운 락을 획득할 수 없음

### Strict 2PL

- 쓰기 락을 트랜잭션 종료 시점까지 유지
- Cascading rollback 방지

### Strong Strict 2PL

- 모든 락을 트랜잭션 종료까지 유지
- 더 강력한 격리 제공

## MVCC

- 데이터의 여러 버전을 유지하여 읽기와 쓰기 작업을 분리하는 비잠금 동시성 제어 방식임
- 각 트랜잭션은 시작 시점의 스냅샷을 보며, 읽기는 락 없이 이전 버전을 참조하고 쓰기는 새 버전을 생성함
- 읽기 작업은 락 없이 일관된 스냅샷을 보는 **Consistent Non-locking Read**를 제공함

### MVCC 동작 원리

- 아래 다이어그램은 `MySQL InnoDB` 기준임

  ![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image2.png)

  - 데이터 수정 시 이전 버전을 `Undo Log`에 보관
  - 각 트랜잭션은 시작 시점의 스냅샷을 가짐
  - 읽기 작업은 스냅샷에 맞는 버전을 읽음 (Consistent Non-locking Read)
  - 쓰기 작업은 새 버전을 생성

### 구현 요소

- 트랜잭션 ID
  - 각 트랜잭션에 고유 ID 부여
- 타임스탬프
  - 트랜잭션 시작 시점 기록
- Undo Log
  - 이전 버전 데이터 저장
- Visibility Map
  - 각 트랜잭션이 볼 수 있는 버전 결정

### 장점

- 읽기가 쓰기를 차단하지 않음
- 쓰기가 읽기를 차단하지 않음
- 높은 동시성과 읽기 성능

### 단점

- 여러 버전 저장으로 인한 저장 공간 비용
- 가비지 컬렉션 오버헤드
- 장기 실행 트랜잭션이 오래된 버전 유지로 성능 저하

### 주요 DBMS 구현

- MySQL InnoDB
  - `Undo Log`에 이전 버전을 저장하는 방식
  - MVCC 기반 `REPEATABLE READ` 구현
- PostgreSQL
  - 데이터 페이지(Heap) 자체에 새로운 튜플을 추가(Append-only)하고 포인터로 연결하는 방식
  - `Undo Log`를 사용하지 않음
  - 오래된 버전 정리를 위해 `VACUUM` 작업이 필요함
- Oracle
  - `Undo Segment`를 통한 MVCC 구현

### MySQL InnoDB vs PostgreSQL MVCC 구조 비교

![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image3.png)

- **MySQL InnoDB 방식의 특징**
  - 데이터 페이지는 최신 버전만 저장하여 공간 효율적
  - 이전 버전은 `Undo Log`에서 조회
  - `Undo Log`는 트랜잭션 종료 후 정리 가능
- **PostgreSQL 방식의 특징**
  - 모든 버전이 데이터 페이지(Heap)에 저장되어 공간 사용량 증가
  - Append-only 방식으로 쓰기 성능이 우수함
  - `VACUUM` 작업으로 오래된 버전을 정리해야 함
  - 장기 실행 트랜잭션이 있으면 `VACUUM`이 지연될 수 있음

### 락 호환성 매트릭스

- 공유 락(`S Lock`)
  - 읽기 락, 여러 트랜잭션이 동시에 획득 가능
- 배타 락(`X Lock`)
  - 쓰기 락, 한 트랜잭션만 획득 가능

| 현재 락 \ 요청 락 | S Lock | X Lock |
| :--- | :---: | :---: |
| S Lock | 허용 | 거부 |
| X Lock | 거부 | 거부 |

## 데드락

- 두 개 이상의 트랜잭션이 서로가 점유한 자원을 기다리며 무한 대기 상태에 빠지는 현상

### 발생 조건

- 상호 배제(Mutual Exclusion)
- 점유 대기(Hold and Wait)
- 비선점(No Preemption)
- 순환 대기(Circular Wait)

![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image4.png)

1.  트랜잭션 A가 락1 획득 → 락2 대기
2.  트랜잭션 B가 락2 획득 → 락1 대기
3.  데드락 발생

    ![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image5.png)


### 데드락 예방

- **자원 순서 지정**
  - 모든 트랜잭션이 동일한 순서로 자원 획득
  - ex)
    - 항상 `id` 순서대로 락 걸기 (`id=1` → `id=2` → `id=3`)
  - 순환 대기 조건 제거로 데드락 근본 원인 해결
  - 애플리케이션 개발자 입장에서 가장 현실적이고 효과적인 예방책임
- Wait-Die 스키마 (비선점 방식)
  - DBMS 내부 스케줄링 알고리즘
  - 오래된 트랜잭션이 새 트랜잭션의 락을 기다리면 대기(Wait)
  - 새 트랜잭션이 오래된 트랜잭션의 락을 기다리면 포기(Die)
  - 비선점 방식
    - 오래된 트랜잭션이 새 트랜잭션의 락을 강제로 빼앗지 않음
- Wound-Wait 스키마 (선점 방식)
  - DBMS 내부 스케줄링 알고리즘
  - 오래된 트랜잭션이 새 트랜잭션의 락을 기다리면 새 트랜잭션 강제 중단(Wound)
  - 새 트랜잭션이 오래된 트랜잭션의 락을 기다리면 대기(Wait)
  - 선점 방식
    - 오래된 트랜잭션이 새 트랜잭션의 락을 강제로 빼앗을 수 있음
- 타임 image.png아웃
  - 일정 시간 대기 후 트랜잭션 중단
  - 간단하지만 불필요한 중단 가능

### 데드락 탐지

- Wait-for 그래프
  - 트랜잭션과 락 대기 관계를 그래프로 표현
  - 주기적으로 사이클 검사
  - 사이클이 발견되면 데드락으로 판단

- 데드락 탐지 프로세스

  ![image.png](/assets/img/database/theory/2025-11-03-database-concurrency-control/image6.png)


- 탐지 주기
  - 대부분의 DBMS는 5초마다 검사
  - 데드락 발견 시 빈도에 따라 100ms까지 간격 감소
- 해결 방법
  - 데드락 발견 시 하나의 트랜잭션을 희생(victim)으로 선택
  - 희생 트랜잭션 롤백
  - 희생 선택 기준
    - 최소 비용, 최소 락 수, 최단 실행 시간 등

### 데드락 예방 전략

- 자원 순서 지정
  - **모든 트랜잭션이 동일한 순서로 자원 획득** (가장 중요)
  - ex)
    - 항상 `id` 순서대로 락 걸기
- 타임 아웃 설정
  - 일정 시간 대기 후 트랜잭션 중단
- 락 타임 아웃
  - 락 대기 시간 제한
- 트랜잭션 크기 최소화
  - 트랜잭션 실행 시간 단축

## 동시성 제어 방식 선택 가이드

### MVCC 선택 시

- 읽기 중심 워크로드
- 높은 동시성이 필요한 경우
- 롱 트랜잭션이 많은 경우
- `PostgreSQL`, `MySQL InnoDB` 환경

### 락 기반 선택 시

- 쓰기 중심 워크로드
- 강한 일관성이 필요한 경우
- 충돌이 빈번한 경우
- 재고 관리, 금융 거래 등

### 하이브리드 접근

- 읽기는 MVCC, 쓰기는 락 사용
- 워크로드 특성에 따라 조합
- 대부분의 현대 DBMS가 채택

## 결론

- 동시성 제어 방식(MVCC, 락)은 워크로드 특성에 따라 선택해야 함
- 읽기 중심 워크로드는 MVCC, 쓰기 중심 워크로드는 락 기반 방식이 적합함