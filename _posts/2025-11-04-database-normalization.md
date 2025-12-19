---
title: "데이터베이스 정규화"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-11-04 00:00:00 +0900
category:
  - [Database, Theory]
tags: [database, normalization]
math: false
mermaid: true
---

## 개요

- 데이터베이스 정규화는 데이터 중복을 최소화하고 무결성을 보장하기 위해 테이블을 체계적으로 구조화하는 과정임
- 정규화를 통해 데이터 이상 현상을 방지하고 데이터 일관성을 유지함

### 데이터 이상 현상

- 삽입 이상(Insertion Anomaly)
  - 불필요한 데이터를 함께 삽입해야 하는 경우
  - ex)
    - 새로운 제품을 등록하려면 주문 정보도 함께 삽입해야 함
      - 제품 테이블이 없고 주문 테이블에 제품 정보가 포함된 경우
- 갱신 이상(Update Anomaly)
  - 같은 데이터를 여러 곳에서 수정해야 하는 경우
  - ex)
    - 제품 가격을 변경할 때 해당 제품이 포함된 모든 주문 레코드를 수정해야 함
    - 일부만 수정되면 데이터 불일치 발생
- 삭제 이상(Deletion Anomaly)
  - 필요한 데이터까지 함께 삭제되는 경우
  - ex)
    - 마지막 주문을 삭제하면 제품 정보도 함께 삭제됨
    - 제품 정보는 유지되어야 하는데 함께 삭제되는 문제

### 데이터 무결성 보장

- 중복 데이터 제거로 일관성 유지
- 참조 무결성 보장
- 도메인 무결성 보장

### 저장 공간 최적화

- 중복 데이터 제거로 저장 공간 절약
- 데이터 구조 최적화

## 제1정규형

- 각 컬럼이 원자적(atomic) 값만 포함하고 각 행이 고유하게 식별 가능해야 함
- 반복 그룹과 다중 값 속성을 제거하여 데이터의 일관성을 확보함

### 규칙

- 각 컬럼은 단일 값만 포함
- 각 행은 고유하게 식별 가능
- 반복 그룹 제거

### 반복 그룹의 형태

- 다중 값 속성
  - 하나의 컬럼에 여러 값이 콤마(`,`)로 구분되어 저장되는 경우
- 반복 그룹 컬럼
  - `product1`, `product2`, `product3`처럼 유사한 속성을 여러 컬럼으로 나열하는 경우
  - 이 경우도 1NF 위반임

```sql
-- 1NF 위반 예시 1 - 다중 값 속성
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_name VARCHAR(100),
    products VARCHAR(500)  -- 여러 제품이 콤마로 구분됨
);

-- 1NF 위반 예시 2 - 반복 그룹 컬럼
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_name VARCHAR(100),
    product1 VARCHAR(100),
    product2 VARCHAR(100),
    product3 VARCHAR(100)  -- 유사한 속성을 여러 컬럼으로 나열
);

-- 1NF 만족
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_name VARCHAR(100)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);
```

## 제2정규형

- 1NF를 만족하면서 모든 비주요 속성이 기본 키 전체에 완전 함수 종속되어야 함
- 부분 함수 종속(partial dependency)을 제거함
- **중요**
  - 2NF는 **기본 키가 복합 키로 구성된 경우**에만 해당됨
  - 기본 키가 단일 컬럼인 테이블은 1NF를 만족하면 자동으로 2NF를 만족함
  - 부분 종속이 발생할 수 없기 때문임

### 함수 종속성

- 완전 함수 종속
  - 속성이 기본 키 전체에 종속됨
- 부분 함수 종속
  - 속성이 기본 키의 일부에만 종속됨

![image.png](/assets/img/database/theory/2025-11-04-database-normalization/image.png)

### 규칙

- 1NF 만족
- 모든 비주요 속성이 기본 키 전체에 완전 함수 종속
- 기본 키가 복합키인 경우에 주로 적용됨

  ```sql
  -- 2NF 위반 (order_id만으로 product_name 결정 가능)
  CREATE TABLE order_items (
      order_id INT,
      product_id INT,
      product_name VARCHAR(100),  -- product_id에만 종속
      quantity INT,
      PRIMARY KEY (order_id, product_id)
  );

  -- 2NF 만족
  CREATE TABLE order_items (
      order_id INT,
      product_id INT,
      quantity INT,
      PRIMARY KEY (order_id, product_id)
  );

  CREATE TABLE products (
      product_id INT PRIMARY KEY,
      product_name VARCHAR(100)
  );
  ```

## 제3정규형

- 2NF를 만족하면서, 이행적 종속(transitive dependency)을 제거함
- 비주요 속성이 다른 비주요 속성에 종속되지 않고 오직 기본 키에만 종속되어야 함

### 이행적 종속

- `A → B`이고 `B → C`이면 `A → C` (이행적 종속)
- 비주요 속성이 다른 비주요 속성을 통해 기본 키에 간접적으로 종속되는 경우

![image.png](/assets/img/database/theory/2025-11-04-database-normalization/image1.png)

### 규칙

- 2NF 만족
- 이행적 종속 제거

```sql
-- 3NF 위반 (order_id -> customer_id -> customer_address)
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    customer_address VARCHAR(200)  -- customer_id에 종속
);

-- 3NF 만족
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT
);

CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_address VARCHAR(200)
);
```

## 보이스-코드 정규형

- 3NF보다 엄격한 형태로 모든 결정자가 후보 키여야 함
- 3NF의 변형으로 Strong 3NF라고도 불림
- 일반적인 3NF 구조에서는 발견되지 않으며 **후보 키가 여러 개이고 서로 겹치는 경우**에 주로 발생함
- BCNF가 필요한 이유
  - 3NF를 만족하더라도 **결정자가 후보 키가 아닌 경우**를 해결하기 위함
  - 예를 들어, `A -> B`인데 `A`가 후보 키가 아닌 경우를 처리함

### 규칙

- 3NF 만족
- 모든 결정자가 후보 키여야 함

```sql
-- BCNF 위반
-- 규칙 1: 학생+과목 -> 교수 (한 학생은 한 과목에 대해 한 교수에게만 수강)
-- 규칙 2: 교수 -> 과목 (교수는 한 과목만 담당)
-- 기본 키: (student_id, subject)
-- 문제: professor가 subject를 결정하지만 professor는 후보 키가 아님
CREATE TABLE class_assignments (
    student_id INT,
    subject VARCHAR(100),
    professor VARCHAR(100),
    PRIMARY KEY (student_id, subject)
);

-- BCNF 만족
-- 교수가 과목을 결정하므로 별도 테이블로 분리
CREATE TABLE professors (
    professor VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(100)
);

CREATE TABLE class_records (
    student_id INT,
    professor VARCHAR(100),
    PRIMARY KEY (student_id, professor)
);
```

## 정규화 과정 요약

- 정규화는 단계적으로 진행되며 각 단계마다 특정 이상 현상을 제거함

  ![image.png](/assets/img/database/theory/2025-11-04-database-normalization/image2.png)

## 정규화 vs 비정규화

### 정규화의 장점

- 데이터 무결성과 일관성 보장
- 저장 공간 최적화
- 데이터 중복 제거
- 갱신 이상(Update Anomaly) 방지

### 정규화의 단점

- 조인 연산 증가로 복잡한 쿼리 성능 저하 가능
- 쿼리 작성 복잡도 증가

### 비정규화의 장점

- 조인 감소로 읽기 성능 향상
- 쿼리 단순화

### 비정규화의 단점

- 데이터 중복 증가
- 저장 공간 증가
- 갱신 비용 증가
- 데이터 불일치 위험
- 애플리케이션 코드 레벨에서의 데이터 관리 복잡도 증가
  - 데이터 정합성을 DB가 아닌 애플리케이션 코드에서 관리해야 함
  - 중복 저장된 데이터를 수정하려면 여러 곳에서 `UPDATE`를 보장해야 함
  - 트랜잭션 관리 복잡도 증가
    - ex) 3곳에 중복 저장된 데이터를 수정하려면 3번의 `UPDATE`를 트랜잭션으로 묶어야 함

### NoSQL과의 관계

- RDBMS는 정규화를 지향하지만 `MongoDB` 같은 Document DB는 읽기 성능을 위해 내장(Embedding) 방식의 비정규화 설계를 기본으로 함
- Document DB의 경우 관련 데이터를 하나의 문서에 포함시켜 조인 없이 빠르게 조회할 수 있도록 설계함

### 정규화 수준 선택 가이드

  ![image.png](/assets/img/database/theory/2025-11-04-database-normalization/image3.png)

1. 요구사항 분석

    - 비즈니스 요구사항 파악
    - 데이터 관계 분석
    - 쿼리 패턴 분석

2. 초기 설계

    - 엔티티 식별
    - 속성 정의
    - 관계 설정

3. 정규화 적용

    - 1NF부터 단계적으로 적용
    - 함수 종속성 분석
    - 이상 현상 확인

4. 성능 검토

    - 조인 비용 분석
    - 쿼리 성능 테스트
    - 필요시 선택적 비정규화

5. 최종 검증

    - 데이터 무결성 확인
    - 성능 목표 달성 여부 확인
    - 유지보수성 검토

## 결론

- 정규화는 데이터 무결성을 보장하지만 성능을 위해 선택적 비정규화가 필요할 수 있음
- 시스템 특성과 워크로드에 따라 적절한 정규화 수준을 선택해야 함