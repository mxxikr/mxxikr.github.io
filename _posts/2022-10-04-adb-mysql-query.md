---
title:  "Alicloud AnalyticDB MySQL Query"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2022-10-04 23:55:00 +0900
category:
  - [Database, MySQL]
tags:
  - [alicloud, mysql]
math: true
mermaid: true
---
# 테이블 생성 및 정책 설정
---
### **테이블 생성**
* 기본 테이블 생성
    ```sql
    CREATE TABLE `{TABLE_ID}`( 
        `{INDEX_COLUMN_NAME}` BIGINT NOT NULL AUTO_INCREMENT, 
        `{COLUMN_NAME}` {DATA_TYPE},
        `{COLUMN_NAME}` {DATA_TYPE},
        PRIMARY KEY (`{INDEX_COLUMN_NAME}`) 
    ) DISTRIBUTE BY HASH(`{INDEX_COLUMN_NAME}`);
    ```
* 파티셔닝 설정한 테이블 생성
    ```sql
    CREATE TABLE `{TABLE_ID}` (
    `{INDEX_COLUMN_NAME}` BIGINT NOT NULL AUTO_INCREMENT, 
    `{COLUMN_NAME}` {DATA_TYPE},
    `{COLUMN_NAME}` {DATA_TYPE},
    `{COLUMN_NAME}` {DATA_TYPE},
    `datetime` DATETIME, -- YYYY-MM-DD hh:mm:ss
    `{PARTITION_COLUMN_NAME}` VARCHAR(255), -- 파티셔닝 설정할 날짜 칼럼
    PRIMARY KEY (`{INDEX_COLUMN_NAME}`, {PARTITION_COLUMN_NAME}) -- 파티셔닝 칼럼 primary key 지정
    ) DISTRIBUTE BY HASH(`{INDEX_COLUMN_NAME}`) PARTITION BY VALUE(DATE_FORMAT({PARTITION_COLUMN_NAME}, '%Y%m%d')) LIFECYCLE {LIFECYCLE}; 
    ```
    * `PARTITION BY VALUE(DATE_FORMAT({PARTITION_COLUMN_NAME}, '%Y%m%d'))`
        * 문자열 형식의 날짜 데이터를 `%Y%m%d` 형식으로 변환해 파티셔닝 설정
* lifecycle 적용 테이블 생성
    ```sql
    CREATE TABLE `{TABLE_ID}`( 
        `{INDEX_COLUMN_NAME}` BIGINT NOT NULL AUTO_INCREMENT, 
        `{COLUMN_NAME}` {DATA_TYPE},
        `{COLUMN_NAME}` {DATA_TYPE}, 
        PRIMARY KEY (`{INDEX_COLUMN_NAME}`) 
    ) DISTRIBUTE BY HASH(`{INDEX_COLUMN_NAME}`) 
    LIFECYCLE {LIFECYCLE} STORAGE_POLICY = 'MIXED' HOT_PARTITION_COUNT = 30;
    ```
* storage policy 설정한 테이블 생성
    ```sql
    CREATE TABLE `{TABLE_ID}`(
        `{INDEX_COLUMN_NAME}` BIGINT NOT NULL AUTO_INCREMENT, 
        `{COLUMN_NAME}` {DATA_TYPE},
        `{COLUMN_NAME}` {DATA_TYPE},
        `datetime` DATETIME,  -- YYYY-MM-DD hh:mm:ss
        `{PARTITION_COLUMN_NAME}` VARCHAR, -- 파티셔닝 설정할 날짜 칼럼 
        PRIMARY KEY (`{INDEX_COLUMN_NAME}`, {PARTITION_COLUMN_NAME}) 
    ) DISTRIBUTE BY HASH(`{INDEX_COLUMN_NAME}`) PARTITION BY VALUE(DATE_FORMAT({PARTITION_COLUMN_NAME}, '%Y%m%d')) LIFECYCLE {LIFECYCLE} STORAGE_POLICY = 'MIXED' HOT_PARTITION_COUNT = 30;
    ```
    * `STORAGE_POLICY`
        * 테이블의 데이터 스토리지 정책 설정
        * `HOT`
        * `COLD`
        * `MIXED`
    * `HOT_PARTITION_COUNT`
        * 테이블 데이터 스토리지 정책이 `MIXED` 일 경우 HOT 스토리지 수 지정
* odps 연결 테이블 생성
    ```sql
    CREATE TABLE `{TABLE_ID}`( 
        `idx` BIGINT NOT NULL AUTO_INCREMENT, 
        `{COLUMN_NAME}` {DATA_TYPE},
        `{COLUMN_NAME}` {DATA_TYPE},
        `datetime` DATETIME, 
        `{PARTITION_COLUMN_NAME}` varchar(255), 
        PRIMARY KEY (`idx`, {PARTITION_COLUMN_NAME})  
    ) DISTRIBUTE BY HASH(`idx`) PARTITION BY VALUE(DATE_FORMAT({PARTITION_COLUMN_NAME}, '%Y%m%d')) LIFECYCLE {LIFECYCLE}
    ENGINE='ODPS'
    TABLE_PROPERTIES='{
    "endpoint":"http://service.cn-hangzhou.maxcompute.aliyun-inc.com/api",
    "accessid":"{ACCESS_ID}",
    "accesskey":"{ACCESS_KEY}",
    "project_name":"{PROJECT_ID}",
    "table_name":"{MAXCOMPUTE_TABLE_ID}",
    "partition_column":"{PARTITION_COLUMN_NAME}"
    }';
    ```
    * `endpoint`
        * 연결할 maxcompute가 존재하는 리전의 endpoint 주소
* 테이블 생성 확인
    ```sql
    SHOW CREATE TABLE {TABLE_ID};
    ```
<br/><br/>

# 파티셔닝, 정책 확인 및 변경
---
### **파티셔닝(lifecycle) 설정 확인 및 변경**
* 파티셔닝 설정 확인
    ```sql
    SELECT *
    FROM INFORMATION_SCHEMA.PARTITIONS p
    ORDER BY TABLE_NAME, PARTITION_NAME ASC
    ```
* 테이블 별 파티셔닝 수 확인
    ```sql
    SELECT TABLE_NAME, count(*) AS count_
    FROM INFORMATION_SCHEMA.PARTITIONS p
    GROUP BY TABLE_NAME
    ```
* 테이블 지정하여 파티셔닝 설정 확인
    ```sql
    SELECT * 
    FROM INFORMATION_SCHEMA.PARTITIONS p 
    WHERE TABLE_NAME = '{TABLE_ID}'
    ```
* 파티셔닝(lifecycle) 설정 변경 **(설정 변경 후 table 빌드 필수)**
    ```sql
    ALTER TABLE `{TABLE_ID}` partitions {LIFECYCLE};
    BUILD TABLE {DB_NAME}.{TABLE_ID}; -- 테이블 빌드 후 설정 반영됨
    ```

### **storage policy 확인 및 변경**
* 데이터 스토리지 배포 확인
    ```sql
    SELECT * 
    FROM information_schema.table_usage;
    ```
* DB별 스토리지 배포 확인
    ```sql
    SELECT * 
    FROM information_schema.table_usage 
    WHERE table_schema = '{DB_NAME}' AND storage_policy = 'HOT';
    ```
* 테이블 별 스토리지 배포 정책 확인
    ```sql
    SELECT * 
    FROM information_schema.table_usage 
    WHERE table_schema='{DB_NAME}' AND table_name ='{TABLE_ID}'
    ```
* storage policy 정책 변경 **(설정 변경 후 table 빌드 필수)**
    ```sql
    ALTER TABLE `{TABLE_ID}` storage_policy = 'MIXED' hot_partition_count = 30;
    BUILD TABLE {DB_NAME}.{TABLE_ID};
    ```
* 스토리지 변경 진행 상황 확인
    ```sql
    SELECT * 
    FROM information_schema.storage_policy_modify_progress;
    ```
<br/><br/>

# 테이블 및 데이터 복사
---
### **테이블 구조 복사**
* 테이블 구조 복사
    ```sql
    CREATE TABLE {DB_NAME}.{TGT_TABLE_ID} LIKE {DB_NAME}.{SRC_TABLE_ID};
    ```

### **데이터 복사**
* 특정 날짜 data 복사
    ```sql
    INSERT INTO {TGT_TABLE_ID} 
    SELECT * FROM {SRC_TABLE_ID} 
    WHERE {PARTITION_COLUMN_NAME} = '2022-10-04';
    ```
* 비동기식 import 작업 (실행 후 job id 반환)
    ```sql
    /*+async_job_priority=1*/ submit job 
    INSERT INTO {TGT_TABLE_ID} 
    SELECT * FROM {SRC_TABLE_ID};
    ```
* 날짜 지정한 비동기식 import 작업
    ```sql
    /*+async_job_priority=1*/ submit job
    INSERT INTO {TGT_TABLE_ID}
    SELECT * FROM {SRC_TABLE_ID} 
    WHERE DATE_FORMAT({PARTITION_COLUMN_NAME}, "%Y-%m-%d") BETWEEN '2022-10-01' AND '2022-10-04';
    ```
    ```sql
    /*+async_job_priority=1*/ submit job
    INSERT INTO {TGT_TABLE_ID}
    SELECT * FROM {SRC_TABLE_ID} 
    WHERE {PARTITION_COLUMN_NAME} BETWEEN '2022-10-01' AND '2022-10-04';
    ```
* 시간 지정한 비동기식 import 작업
    ```sql
    /*+async_job_priority=1*/ submit job
    INSERT INTO {TGT_TABLE_ID}
    SELECT * FROM {SRC_TABLE_ID} 
    WHERE {PARTITION_COLUMN_NAME} = '2022-10-04' AND datetime < '2021-10-04 05:00:00';
    ```

### **복사 작업 상태 확인**
* 비동기식 작업 상태 확인
    ```sql
    SHOW job STATUS
    ```
* 특정 비동기식 job 상태 확인
    ```sql
    SHOW job STATUS WHERE job='{JOB_ID}';
    ```
<br/><br/>

# 데이터 조회
---
### **조회**
* 날짜 지정해 데이터 조회
    ```sql
    SELECT * 
    FROM {TABLE_ID} 
    WHERE {PARTITION_COLUMN_NAME} = '2022-10-04';
    ```
* 날짜별 데이터량 오름차순 조회
    ```sql
    SELECT {PARTITION_COLUMN_NAME}, count(*) AS count_ 
    FROM {TABLE_ID} 
    WHERE {PARTITION_COLUMN_NAME} >= '2022-10-01' 
    GROUP BY {PARTITION_COLUMN_NAME} 
    ORDER BY {PARTITION_COLUMN_NAME} DESC;
    ```
    ```sql
    SELECT {PARTITION_COLUMN_NAME}, count(*) AS count_ 
    FROM {TABLE_ID} 
    WHERE DATE_FORMAT({PARTITION_COLUMN_NAME}, '%Y%m%d') >= '2022-10-01' 
    GROUP BY {PARTITION_COLUMN_NAME} 
    ORDER BY {PARTITION_COLUMN_NAME} DESC;
    ```
* 특정 날짜 이후 데이터 오름차순 조회
    ```sql
    SELECT *
    FROM {DB_NAME}.{TABLE_ID}
    WHERE datetime >= '2022-10-01'
    ORDER BY datetime DESC
    LIMIT 100;
    ```
* 특정 시간 이후 데이터 오름차순 조회
    ```sql
    SELECT *
    FROM {DB_NAME}.{TABLE_ID} 
    WHERE datetime >= CONCAT(CURRENT_DATE(), ' 07:55')
    ORDER BY datetime DESC
    ```
* DB별 테이블 조회
    ```sql
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = '{DB_NAME}'
    ```
<br/><br/>

# 테이블 및 칼럼 수정/삭제
---
### **테이블 및 데이터 삭제**
* 테이블 삭제
    ```sql
    DROP TABLE `{TABLE_ID}`;
    ```
* 테이블 데이터 삭제
    ```sql
    DELETE FROM `{TABLE_ID}`;
    ```
* 특정 날짜 지정해 테이블 데이터 삭제
    ```sql
    DELETE FROM `{TABLE_ID}` WHERE datetime >= '2021-10-13';
    ```

### **테이블명 변경 및 이동**
* 테이블명 변경
    ```sql
    RENAME TABLE {SRC_TABLE_ID} TO {TGT_TABLE_ID}; 
    ```
    ```sql
    ALTER TABLE {SRC_TABLE_ID} RENAME {TGT_TABLE_ID};
    ```
    ```sql
    RENAME TABLE {SRC_TABLE_ID} TO {TGT_TABLE_ID}, {SRC_TABLE_ID} TO {TGT_TABLE_ID};
    ```
* 다른 DB로 테이블 이동
    ```sql
    RENAME TABLE {SRC_DB_NAME}.{SRC_TABLE_ID} TO {TGT_DB_NAME}.{TGT_TABLE_ID}; 
    ```

### **칼럼 추가, 변경, 삭제**
* 칼럼 추가 
    ```sql
    ALTER TABLE {DB_NAME}.{TABLE_ID} ADD {COLUMN_NAME} {DATA_TYPE} NULL; 
    ```
* 칼럼명 변경
    ```sql
    ALTER TABLE {DB_NAME}.{TABLE_ID} CHANGE {SRC_COLUMN_NAME} {TGT_COLUMN_NAME} {DATA_TYPE} NULL;
    ```
* 칼럼 타입 변경
    ```sql
    ALTER TABLE {DB_NAME}.{TABLE_ID} MODIFY {COLUMN_NAME} {DATA_TYPE};
    ```
* 칼럼 삭제
    ```sql
    ALTER TABLE {DB_NAME}.{TABLE_ID} DROP {COLUMN_NAME};
    ```
<br/><br/>

# 계정 설정
---
### **계정 생성 및 삭제**
* 계정 생성
    ```sql
    CREATE USER IF NOT EXISTS '{USER_ID}' IDENTIFIED BY '{USER_PASSWORD}';
    ```
* 계정 삭제
    ```sql
    DROP USER '{USER_ID}';
    ```
<br/><br/>

# 권한 설정
---
### **권한 조회**
* 부여된 권한 확인
    ```sql
    SHOW GRANTS;
    ```
* 계정 권한 확인
    ```sql
    SHOW GRANTS FOR '{USER_ID}';
    ```

### **계정 권한 설정 및 삭제** 
* 계정에 모든 권한 추가
    ```sql
    GRANT ALL ON *.* TO '{USER_ID}';
    ```
    ```sql
    GRANT ALL ON {DB_NAME}.* TO '{USER_ID}';
    ```
* 패스워드 변경과 동시에 권한 설정
    ```sql
    GRANT SELECT ON *.* TO '{USER_ID}' identified BY '{USER_PASSWORD}';
    ```
* 계정 모든 권한 삭제
    ```sql
    REVOKE ALL ON *.* FROM '{USER_ID}';
    ```
* 특정 테이블에 SELECT 권한 할당
    ```sql
    GRANT SELECT ON {DB_NAME}.{TABLE_ID} TO '{USER_ID}';
    ```
<br/><br/>

# 프로세스 및 용량 확인
---
### **프로세스 확인**
* 실행 중인 프로세스 리스트 확인
    ```sql
    SHOW FULL processlist;
    ```

### **용량 확인**
* 테이블 별 용량 확인
    ```sql
    SELECT table_name AS 'TableName',
    ROUND(SUM(data_length+index_length)/(1024*1024), 2) AS 'All(MB)',
    ROUND(data_length/(1024*1024), 2) AS 'Data(MB)',
    ROUND(index_length/(1024*1024), 2) AS 'Index(MB)'
    FROM information_schema.tables
    GROUP BY table_name
    ORDER BY data_length DESC;
    ```
* DB별 용량 확인
    ```sql
    SELECT table_schema "Database", 
    ROUND(SUM(data_length+index_length)/1024/1024,1) "MB" 
    FROM information_schema.TABLES 
    GROUP BY 1 WHERE ds;
    ```

### **TIME OUT 설정**
* 쿼리 time out 시간 설정
    ```sql
    SET query_timeout = 1800000
    SET insert_SELECT_timeout = 3600000
    ```
<br/><br/>

## **Reference**
* [Alibaba Cloud Docs](https://www.alibabacloud.com/help/en/analyticdb-for-mysql)
