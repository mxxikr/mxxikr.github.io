---
title:  "Alicloud MaxCompute Query"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2022-10-19 12:25:00 +0900
category:
  - [Database, SQL]
tags:
  - [alicloud, query, sql, maxcompute]
math: true
mermaid: true
---
# 테이블 생성 및 변경
---
### **테이블 생성**
* 파티셔닝 설정한 테이블 생성
    ```sql
    CREATE TABLE {TABLE_ID} ( 
    `{COLUMN_NAME}` {DATA_TYPE},
    `{COLUMN_NAME}` {DATA_TYPE},
    `{COLUMN_NAME}` {DATA_TYPE},
	`datetime` datetime
    ) partitioned by (ds STRING);
    ```
* 기존 테이블 구조 복사해 새로운 테이블 생성
    ```sql
   CREATE TABLE `{TGT_PROJECT_ID}.{TGT_TABLE_ID}` like `{SRC_PROJECT_ID}.{SRC_TABLE_ID}`; 
    ```
    * 원본 테이블 구조와 동일한 테이블 생성

### **테이블 수정**
* 테이블명 변경
    ```sql
    ALTER TABLE {SRC_TABLE_ID} RENAME TO {TGT_TABLE_ID};
    ```
* lifecycle 변경
    ```sql
    ALTER TABLE {TABLE_ID} SET LIFECYCLE {INT};
    ```

### **테이블 삭제**
* 테이블 삭제
    ```sql
    DROP TABLE IF EXISTS `{PROJECT_ID}.{TABLE_ID}`;
    ```

### **칼럼 추가**
* 칼럼 추가
    ```sql
    ALTER TABLE {TABLE_ID} add {COLUMN_NAME} (`type` {DATA_TYPE});
    ```

<br/><br/>

# 데이터 복사 및 삭제
---
### **데이터 복사**
* 특정 날짜 데이터 복사
    ```sql
    INSERT INTO `{TGT_PROJECT_ID}.{TGT_TABLE_ID}` partition (ds) SELECT * FROM `{SRC_PROJECT_ID}.{SRC_TABLE_ID}` WHERE ds >= '2022-10-01';
    ```
* 중복 제거 후 특정 날짜 데이터 복사
    ```sql
    INSERT INTO `{TGT_PROJECT_ID}.{TGT_TABLE_ID}` partition (ds) SELECT DISTINCT * FROM `{SRC_PROJECT_ID}.{SRC_TABLE_ID}` WHERE ds >= '2022-10-01';

    INSERT INTO `{TGT_TABLE_ID}` partition(ds) SELECT DISTINCT * FROM `{SRC_TABLE_ID}` WHERE ds >= '2022-10-01';
    ```

### **데이터 삭제**
* 특정 날짜 데이터 삭제
    ```sql
    DELETE TABLE `{TABLE_ID}` WHERE ds >= '2022-10-01';
    ```
<br/><br/>

# 데이터 조회
---
### **데이터량 조회**
* 날짜별 내림차순으로 데이터 수 조회
    ```sql
    SELECT ds, count(*) AS count_ FROM {TABLE_ID} WHERE ds >= '2022-10-01' GROUP BY ds ORDER BY ASC;
    ```
* 날짜별 오름차순으로 데이터 수 조회
    ```sql
    SELECT ds, count(*) AS count_ FROM {TABLE_ID} WHERE ds >= '2022-10-01' GROUP BY ds ORDER BY DESC;
    ```

<br/><br/>

## **Reference**
* [Alibaba Cloud Docs](https://www.alibabacloud.com/help/en/analyticdb-for-mysql)
