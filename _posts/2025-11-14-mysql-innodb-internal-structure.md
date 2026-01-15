---
title: MySQL InnoDB 내부 구조와 동작 원리
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-11-14 00:00:00 +0900
category: [Database, MySQL]
tags: [mysql, innodb, database, storage-engine]
math: false
mermaid: true
---
## 개요

- MySQL은 여러 스토리지 엔진을 지원하는 DBMS이며 InnoDB는 그 중 가장 널리 사용되는 스토리지 엔진임
- MySQL 5.5 이후부터 InnoDB가 기본 스토리지 엔진으로 사용되며 MySQL 8.0에서는 스토리지 엔진을 지정하지 않으면 자동으로 InnoDB로 생성됨
- 이 포스팅에서는 MySQL과 InnoDB의 관계, 그리고 InnoDB의 내부 구조와 동작 원리를 상세히 살펴봄
- 이전 포스팅([MySQL 트랜잭션 격리 수준과 다른 DBMS와의 차이점](/(https://mxxikr.github.io/posts/2025-11-13-mysql-transaction-isolation-levels/))에서 다룬 MVCC와 트랜잭션 격리 수준이 InnoDB 내부에서 어떻게 구현되는지 설명함


<br/><br/>

## MySQL과 스토리지 엔진

### MySQL의 구조

- MySQL은 하나의 **데이터베이스 관리 시스템**(DBMS)임
- MySQL은 데이터를 어떻게 저장하고 처리할지 결정하는 "스토리지 엔진"을 내부적으로 사용함
- 스토리지 엔진은 테이블 단위로 지정 가능하며 대표적으로 **InnoDB**와 MyISAM 등이 있었음
- 최근 MySQL에서는 InnoDB 스토리지 엔진이 거의 표준처럼 사용되고 있음

### 스토리지 엔진의 역할

- 스토리지 엔진은 실제 데이터 저장, 인덱스 관리, 트랜잭션 처리 등을 담당함
- MySQL 서버는 SQL 파싱, 쿼리 최적화 등을 수행하고 실제 데이터 접근은 스토리지 엔진에 위임함
- 이로 인해 MySQL은 다양한 스토리지 엔진을 지원할 수 있으며 각 엔진의 특성에 맞는 최적화가 가능함
- 스토리지 엔진은 플러그인 방식으로 동작하여 필요에 따라 교체하거나 추가할 수 있음


<br/><br/>

## InnoDB란?

### InnoDB 개요

- **InnoDB**는 MySQL에서 가장 널리 쓰이는 스토리지 엔진임
- MySQL 5.5 이후부터는 기본 스토리지 엔진으로 선정되었고 MySQL 8.0에서는 스토리지 엔진을 따로 지정하지 않으면 무조건 InnoDB로 테이블이 만들어짐

### InnoDB의 주요 특징

- **트랜잭션 지원(ACID)**
  - 원자성, 일관성, 격리성, 지속성을 모두 보장함
- **레코드 단위 Lock(Row-level Lock)**
  - 행 단위로 Lock을 걸어 동시성 향상
  - 자동 교착상태(데드락) 감지 및 해결
- **MVCC(Multi-Version Concurrency Control) 지원**
  - 여러 버전의 데이터를 관리하여 읽기와 쓰기의 동시성 향상
- **외래키(FOREIGN KEY) 및 제약 조건 지원**
  - 참조 무결성 보장
- **클러스터 인덱스(Clustered Index)**
  - 데이터를 프라이머리 키 기준으로 군집 저장하여 검색 성능 향상
- **버퍼 풀(Buffer Pool)**
  - 데이터와 인덱스를 메모리에 캐싱하여 디스크 I/O 감소


<br/><br/>

## MySQL과 InnoDB의 관계

### 역할과 책임

- **MySQL** 자체는 여러 스토리지 엔진을 지원할 수 있도록 설계되어 있고 실제로 예전에는 MyISAM, MEMORY, CSV 등 다양한 엔진이 사용됨
- **InnoDB**는 그 중에서 가장 널리 쓰이며 현재는 사실상 MySQL = InnoDB라고 할 정도로 표준이 됨
- 즉, MySQL이 실제로 데이터를 물리적으로 저장하고 트랜잭션/동시접근/데이터 무결성 등을 처리하는 실질적 핵심 담당자가 바로 InnoDB임
- 테이블 생성 시 `ENGINE=INNODB`로 지정하거나 아무 옵션 없이 만들면 InnoDB 테이블이 생성됨

### 요약

- InnoDB는 MySQL에서 데이터를 "어떻게" 저장/관리할지 정하는 모듈임
- MySQL은 데이터베이스 시스템 전체이고 InnoDB는 테이블 레벨의 저장소/처리 담당자라고 할 수 있음
- InnoDB 덕분에 MySQL이 신뢰성 높은 트랜잭션 및 동시성 제어, 외래키 등 다양한 고급 기능을 제공할 수 있음


<br/><br/>

## MySQL 내부 처리 흐름

### 전체 처리 흐름

1. 사용자 연결(Connection)

    - 클라이언트가 TCP/IP 등으로 MySQL 서버에 연결 요청
    - 서버는 OS 스레드(thread)를 할당해 User Session을 생성하고 각각의 스레드는 클라이언트 요청을 처리함

2. SQL 구문 분석 및 실행 계획 구성

    - SQL 파서(Parser)와 옵티마이저(Optimizer)가 쿼리를 분석하고 실행 계획을 세움
    - 이 실행 계획에 따라 데이터 접근 방식이 결정됨

3. 스토리지 엔진 동작

    - MySQL은 InnoDB 등 스토리지 엔진을 통해 실제 데이터 저장/수정/검색을 수행함
    - 쿼리 실행 엔진이 스토리지 엔진에 데이터에 접근하라고 명령함


<br/><br/>

## InnoDB 엔진 내부 동작

- InnoDB 엔진의 내부 동작은 크게 버퍼 풀을 통한 메모리 관리, 쿼리 처리, 로그 관리, 그리고 백그라운드 작업으로 구분됨

### 버퍼 풀(Buffer Pool)

- **역할**
  - 모든 데이터와 인덱스는 먼저 메모리의 버퍼 풀에 로드됨
  - 반복적인 디스크 I/O를 대폭 줄이고 여러 쿼리에서 빠르게 데이터를 재사용함
- **동작 방식**
  - 데이터 페이지를 디스크에서 읽을 때 버퍼 풀에 캐싱
  - 이후 같은 데이터에 접근할 때는 버퍼 풀에서 직접 읽음
  - 버퍼 풀 크기는 `innodb_buffer_pool_size`로 설정 가능하며 일반적으로 물리 메모리의 70-80%를 할당함

### SELECT 쿼리 처리

- **버퍼 풀에 데이터가 있는 경우**
  - 버퍼 풀에서 즉시 조회하여 반환함
- **버퍼 풀에 데이터가 없는 경우**
  - 인덱스/테이블 스페이스 파일에서 디스크 I/O로 데이터 페이지를 읽어옴
  - 읽은 데이터는 버퍼 풀에 캐싱하여 이후 접근 시 성능 향상
- **MVCC를 통한 읽기**
  - 읽기 작업은 Lock 없이 MVCC와 Undo Log로 일관성 있게 동작함
  - 각 트랜잭션은 자신의 시작 시점에 맞는 데이터 버전을 읽음

### INSERT/UPDATE/DELETE 쿼리 처리

- **버퍼 풀 내 데이터 페이지 수정**
  - 버퍼 풀 내 데이터 페이지를 수정 후, 해당 페이지가 'Dirty Page'가 됨
- **Undo Log 기록**
  - 변경 전의 데이터는 Undo Log로 백업함
  - MVCC를 위한 버전 관리 및 롤백 대비
- **Redo Log 기록**
  - 변경 기록을 Redo Log에 순차적으로 기록함
  - 시스템 설정에 따라 바이너리 로그(Binary Log)에도 기록함
- **트랜잭션 커밋**
  - 커밋 시 Redo Log를 디스크에 강제로 기록(flush)하여 지속성 보장

### 체크포인트(Checkpoint) 및 디스크 기록

- **체크포인트 발생 조건**
  - 일정 조건(메모리 한계, 시간, 트랜잭션 등)에 따라 Dirty Page를 일괄적으로 디스크에 기록
- **Doublewrite Buffer**
  - 먼저 'doublewrite buffer'에 안전하게 기록 후 실제 테이블스페이스에 저장
  - 이를 통해 시스템 장애에도 데이터 복구가 가능함
- **백그라운드 쓰기**
  - 체크포인트는 백그라운드 스레드에 의해 비동기적으로 수행됨
  - 사용자 쿼리 처리에 영향을 최소화함

### Redo Log(리두 로그)

- **역할**
  - 변경 내용을 순차적으로 저장해 장애 발생 시 복구 지원
  - 트랜잭션의 지속성(Durability)을 보장함
- **특징**
  - 순차 쓰기(Sequential Write)로 빠른 성능
  - 크기가 제한되어 순환 구조로 동작함
  - InnoDB 엔진 레벨의 로그임

### Undo Log(언두 로그)

- **역할**
  - 롤백 및 MVCC 읽기를 위해 변경 전 데이터 저장
  - 트랜잭션의 원자성(Atomicity)을 보장함
- **특징**
  - 여러 버전의 데이터를 관리하여 MVCC 구현
  - 트랜잭션이 커밋되면 해당 Undo Log는 정리됨
  - InnoDB 엔진 레벨의 로그임

### 백그라운드 스레드

- **역할**
  - 쓰기, 캐싱, 인서트 버퍼 병합, Lock 관리 등 여러 작업을 비동기적으로 수행
- **주요 스레드**
  - Master Thread: 체크포인트, 버퍼 풀 플러시 등 전체적인 관리
  - IO Thread: 디스크 I/O 작업 처리
  - Purge Thread: Undo Log 정리
  - Page Cleaner Thread: Dirty Page를 디스크에 기록

### 데드락 검출

- **역할**
  - 여러 트랜잭션이 서로 Lock을 기다릴 때, 교착상태를 감지하고 자동 트랜잭션 중단
- **동작 방식**
  - 주기적으로 Lock 대기 그래프를 검사하여 사이클을 감지
  - 데드락이 감지되면 한 트랜잭션을 롤백하여 해결

### 외래키 및 데이터 무결성

- **역할**
  - InnoDB는 외래키, 트랜잭션, 동시성 제어 등 고급 기능을 지원
- **특징**
  - 참조 무결성 보장
  - CASCADE, SET NULL 등의 옵션 지원


<br/><br/>

## MySQL 서버 레벨 기능

### Binary Log(바이너리 로그)

- **역할**
  - 복제(Replication) 및 포인트 인 타임 복구(Point-in-Time Recovery)를 위해 사용
  - 모든 변경 사항을 기록함
- **특징**
  - InnoDB가 아닌 MySQL 서버 레벨의 기능임
  - Two-Phase Commit을 통해 바이너리 로그와 Redo Log의 동기화를 보장하여 장애복구 및 복제에 필수적임
- **InnoDB와의 관계**
  - InnoDB의 Redo Log와 함께 Two-Phase Commit으로 동작하여 데이터 일관성 보장


<br/><br/>

## 동작 순서 요약

1. **클라이언트 연결**
   - 클라이언트가 연결하고 스레드를 할당받음

2. **SQL 분석 및 실행 계획 수립**
   - SQL 문을 분석하고 실행 계획 수립

3. **데이터 조회**
   - 데이터를 버퍼 풀에서 조회하거나 디스크에서 로드

4. **데이터 변경**
   - 데이터 변경 시 Undo Log와 Redo Log 기록, 버퍼 풀에서 Dirty Page 관리

5. **체크포인트 발생**
   - 체크포인트 발생 시 Dirty Page를 디스크에 동기화


<br/><br/>

## Reference

- [MySQL 8.0 Reference Manual - InnoDB Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html)
- [MySQL 8.0 Reference Manual - InnoDB Buffer Pool](https://dev.mysql.com/doc/refman/8.0/en/innodb-buffer-pool.html)
- [MySQL 8.0 Reference Manual - InnoDB Redo Log](https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html)
- [MySQL 8.0 Reference Manual - InnoDB Undo Logs](https://dev.mysql.com/doc/refman/8.0/en/innodb-undo-logs.html)

