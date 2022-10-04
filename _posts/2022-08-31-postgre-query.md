---
title:  "PostgreSQL Query"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2022-09-01 23:30:00 +0900
category:
  - [Database, SQL]
tags:
  - [postgre, query, sql]
math: true
mermaid: true
---
# Table 생성 및 파티셔닝 설정
---
### **table 생성**
* `timestamp` 기준으로 partition 설정한 table 생성
  ```sql
  CREATE TABLE {TABLE_ID} (
  idx serial, 
  {COLUMN_NAME} {DATA_TYPE}, 
  timestamp TIMESTAMP
  ) partition by range(timestamp);
  ```   

### **파티셔닝 설정**
1. partition 설정 위한 `pg_partman` 확장 사용 적용
    ```sql
    CREATE EXTENSION pg_partman SCHEMA public;
    ```
    - **table 생성 확인**
        - `original_table`
        - `orders`
        - `old_nonpartitioned_table`
        - `part_config`
        - `part_config_sub`
        - `spatial_ref_sys`
        - `template_public_original_table`
2. partition 적용 - partition 사용할 메인 table 생성
    ```sql
    CREATE TABLE {TABLE_ID} (
      idx serial,
      {COLUMN_NAME} {DATA_TYPE},
      {COLUMN_NAME} {DATA_TYPE},
      timestamp TIMESTAMP
    ) partition by range(timestamp);
    ```
3. partition 적용 - Index 생성
    ```sql
    CREATE INDEX ON public.{TABLE_ID} (idx, timestamp); 
    ```
    * 추후 생성되는 partition에 자동 적용
4. partition 적용 - table에 partition 적용
    ```sql
    SELECT public.create_parent('public.{TABLE_ID}', 'timestamp', 'native', 'daily', p_template_table:= 'public.{TABLE_ID}', p_premake := 15, p_start_partition := (CURRENT_TIMESTAMP)::text);

    UPDATE public.part_config SET retention_keep_table = false, retention = '6 month' WHERE parent_table = 'public.{TABLE_ID}';
    ```
    - `public.{TABLE_ID}`
        - partition 기준 table
    - `timestamp`
        - partition 기준 column
    - partition 타입
        - `native` 선언적 partition (파티셔닝 관리 용이. 속도 상승 및 partition pruning 자동)
        - `partman` 상속 partition (구버전, table 따로 관리, index, vaacuum 등 개별 table로 구분)
    - `daily`
        - partition 기준 시간
    - `retention`
        - table 유지 시간
    - `retention_keep_table`
        - true 삭제된 table 유지, false 삭제된 table 완전 삭제
    - `p_premake`
        - partition 생성 table 개수
    - `p_start_partition`
        - partition 시작지점
5. partition 적용 - partition table 생성
    ```sql
    CREATE TABLE public.{TABLE_ID}_p2022_09_01 PARTITION OF public.{TABLE_ID} FOR VALUES FROM ('2022-09-01 00:00:00') TO ('2022-09-02 00:00:00');
    ```
    * 하루 단위로 partition 테이블 생성  
6. partition 자동 관리 설정
    * partition 자동 관리, 특정 Table 지정 가능
      ```sql
      SELECT run_maintenance();
      SELECT run_maintenance('public.{TABLE_ID}');
      ```
      * 특정 table 지정 가능 (PostgreSQL 직접 실행, GCP CloudSQL 적용 안됨)
    * time 기준 table 자동 생성
      ```sql
      SELECT partition_data_time('public.{TABLE_ID}');
      ```
      * 데이터 없으면 table 생성 불가, GCP CloudSQL 적용 가능)
    * time 기준 table 자동 삭제
      ```sql
      SELECT drop_partition_time('public.{TABLE_ID}')
      ```
      * `retention` 옵션 값으로 table 삭제, GCP CloudSQL 적용 가능)

<br/><br/>

# Table 및 Coulmn 수정/삭제
---
### **table 및 coulmn 변경**
* coulmn 명 변경
    ```sql
    ALTER TABLE {TABLE_ID} RENAME COLUMN {SRC_COLUMN} TO {TGT_COLUMN};
    ```
* table 명 변경
    ```sql
    ALTER TABLE public.{SRC_TABLE_ID} RENAME TO {TGT_TABLE_ID};
    ```
* coulmn 데이터 타입 변경
    ```sql
    ALTER TABLE public.{TABLE_ID} ALTER COLUMN {COLUMN_NAME} TYPE {DATA_TYPE};
    ```
* coulmn 추가
    ```sql
    ALTER TABLE public.{TABLE_ID} ADD {COLUMN_NAME} {DATA_TYPE} NULL;
    ALTER TABLE public.{TABLE_ID} ADD {COLUMN_NAME} {DATA_TYPE} NULL, ADD {COLUMN_NAME} {DATA_TYPE} NULL;
    ```  

### **table 및 coulmn 삭제**
* coulmn 삭제 
    ```sql
    ALTER TABLE public.{TABLE_ID} DROP COLUMN {COLUMN_NAME};
    ALTER TABLE public.{TABLE_ID} DROP COLUMN {COLUMN_NAME}, DROP COLUMN {COLUMN_NAME};
    ```
* table 데이터 삭제
    ```sql
    TRUNCATE TABLE public.{TABLE_ID};
    ```  
<br/><br/>

# 데이터 조회
---
### **조회**
  * 테이블 전체 데이터 조회
    ```sql
    SELECT * FROM {TABLE_ID} LIMIT 100; -- 해당 테이블 데이터 100개 조회
    SELECT * FROM {TABLE_ID} ORDER BY {COLUMN_NAME} DESC -- 정렬 기준 칼럼에 대해 내림차순 조회
    SELECT * FROM {TABLE_ID} ORDER BY {COLUMN_NAME} ASC -- 정렬 기준 칼럼에 대해 오름차순 조회
    ```  

<br/><br/>

# 계정 설정
---
### **계정 생성**
* 현재 사용자 정보 확인
    ```sql
    SELECT * FROM PG_USER;
    ```
* 계정 생성
    ```sql
    CREATE USER {USER_ID} PASSWORD '{USER_PASSWORD}';
    ```
* 유저 생성 확인
    ```sql
    SELECT * FROM pg_user WHERE {USER_ID} IN ('{USER_ID}');
    ```  

### **계정 및 비밀번호 수정**
* 계정명 수정
    ```sql
    ALTER USER {USER_ID} WITH PASSWORD '{USER_PASSWORD}';
    ```
* 비밀번호 수정
    ```sql
    ALTER USER {USER_ID} WITH PASSWORD '{USER_PASSWORD}';
    ```

<br/><br/>

# 권한 설정
---
### **DB 권한** 
* `Grantor`
  * 권한을 부여한 role
* `Grantee`
  * 권한을 부여받은 role
* `Table_schema`
  * schema명
* `Table_name`
  * table명
* `Privilege_type`
  * 권한의 유형
* `Is_grantable` 
  * 권한을 줄 수 있을 경우 YES, 아닐 경우 NO  
* 권한 확인
    ```sql
    SELECT * FROM information_schema.role_table_grants WHERE grantee ='{USER_ID}'
    ```
* DB 접근 권한 할당
    ```sql
    GRANT CONNECT ON DATABASE {DB_NAME} TO {USER_ID};
    ```

### **schema 권한 설정**
* schema 모든 권한 할당
    ```sql
    GRANT ALL ON SCHEMA {SCHEMA_NAME} to {USER_ID};
    ```
* schema SELECT 권한 할당
    ```sql
    GRANT SELECT ON ALL TABLES IN SCHEMA {SCHEMA_NAME} TO {USER_ID}; -- Single Schema

    GRANT SELECT ON ALL TABLES IN SCHEMA {SCHEMA_NAME_1}, {SCHEMA_NAME_2} TO {USER_ID}; -- Multi Schema
    ```

### **table 권한 설정**
* 앞으로 생길 table에 all 권한
    ```sql
    ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME} GRANT ALL PRIVILEGES ON TABLES TO {USER_ID}; -- Single Schema

    ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME_1}, {SCHEMA_NAME_2} GRANT ALL PRIVILEGES ON TABLES TO {USER_ID}; -- Multi Schema
    ```
* table SELECT 권한 할당
    ```sql
    GRANT SELECT ON TABLE public.{TABLE_ID} TO {USER_ID};
    ```
* 앞으로 생길 table에 SELECT 권한
    ```sql
    ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME} GRANT SELECT ON TABLES TO {USER_ID}; -- Single Schema

    ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME_1}, {SCHEMA_NAME_2} GRANT SELECT ON TABLES TO {USER_ID}; -- Multi Schema
    ```
* 특정 table 권한
    ```sql
    GRANT ALL ON TABLE public.{TABLE_NAME} TO {USER_ID};
    ```

### **전체 권한 설정**
* all 권한
    ```sql
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA {SCHEMA_NAME} TO {USER_ID}; 

    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {SCHEMA_NAME} TO {USER_ID};
    
    ALTER DEFAULT PRIVILEGES GRANT USAGE ON SEQUENCES TO {USER_ID};
    ```

<br/><br/>

# 프로세스 확인
---
### **프로세스 kill**
* 특정 프로세스 kill
    ```sql
    SELECT * FROM pg_stat_activity WHERE state = 'active';
    SELECT pg_cancel_backend({PROCESS_ID});
    ```

<br/><br/>

## **Reference**
* [pg_partman/pg_partman.md at master · pgpartman/pg_partman](https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman.md)
* [pg_partman/pg_partman_howto_native.md at master · pgpartman/pg_partman](https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman_howto_native.md)