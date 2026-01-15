---
title: PostgreSQL Query
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-08-31 11:27:00 +0900
category: [Database, PostgreSQL]
tags: [database, postgresql, query]
math: true
mermaid: true
---
## 스키마 생성

- 현재 연결된 데이터베이스에 스키마 생성
  ```sql
  CREATE SCHEMA {SCHEMA_NAME}
  ```
  - `pg_`로 시작하는 스키마명 사용 불가
  - CREATE 권한이거나 슈퍼 유저일 경우 스키마 생성 가능

<br/><br/>

## 테이블 생성

- `timestamp` 기준으로 partition 설정한 table 생성
  ```sql
  CREATE TABLE {TABLE_ID} (
    idx serial, 
    {COLUMN_NAME} {DATA_TYPE}, 
    timestamp TIMESTAMP
  ) partition by range(timestamp);
  ```

<br/><br/>

## 파티셔닝 설정

### pg_partman 확장 적용

```sql
CREATE EXTENSION pg_partman SCHEMA public;
```

- 생성되는 테이블
  - `original_table`
  - `orders`
  - `old_nonpartitioned_table`
  - `part_config`
  - `part_config_sub`
  - `spatial_ref_sys`
  - `template_public_original_table`

### 파티션 메인 테이블 생성

```sql
CREATE TABLE {TABLE_ID} (
  idx serial,
  {COLUMN_NAME} {DATA_TYPE},
  {COLUMN_NAME} {DATA_TYPE},
  timestamp TIMESTAMP
) partition by range(timestamp);
```

### 인덱스 생성

```sql
CREATE INDEX ON {SCHEMA_NAME}.{TABLE_ID} (idx, timestamp); 
```

- 추후 생성되는 partition에 자동 적용

### 파티션 적용

```sql
SELECT {SCHEMA_NAME}.create_parent(
  '{SCHEMA_NAME}.{TABLE_ID}', 
  'timestamp', 
  'native', 
  'daily', 
  p_template_table:= '{SCHEMA_NAME}.{TABLE_ID}', 
  p_premake := 15, 
  p_start_partition := (CURRENT_TIMESTAMP)::text
);

UPDATE {SCHEMA_NAME}.part_config 
SET retention_keep_table = false, retention = '6 month' 
WHERE parent_table = '{SCHEMA_NAME}.{TABLE_ID}';
```

- 파라미터 설명
  - `{SCHEMA_NAME}.{TABLE_ID}`
    - partition 기준 table
  - `timestamp`
    - partition 기준 column
  - partition 타입
    - `native` - 선언적 partition (파티셔닝 관리 용이, 속도 상승 및 partition pruning 자동)
    - `partman` - 상속 partition (구버전, table 따로 관리, index, vacuum 등 개별 table로 구분)
  - `daily`
    - partition 기준 시간
  - `retention`
    - table 유지 시간
  - `retention_keep_table`
    - true - 삭제된 table 유지
    - false - 삭제된 table 완전 삭제
  - `p_premake`
    - partition 생성 table 개수
  - `p_start_partition`
    - partition 시작지점

![mermaid-diagram](/assets/img/database/2022-09-01-postgre-query-diagram-1.png)

### 파티션 테이블 수동 생성

```sql
CREATE TABLE {SCHEMA_NAME}.{TABLE_ID}_p2022_09_01 
PARTITION OF {SCHEMA_NAME}.{TABLE_ID} 
FOR VALUES FROM ('2022-09-01 00:00:00') TO ('2022-09-02 00:00:00');
```

- 하루 단위로 partition 테이블 생성

### 파티션 자동 관리

- 전체 partition 자동 관리
  ```sql
  SELECT run_maintenance();
  ```
- 특정 table 지정 (PostgreSQL 직접 실행, GCP CloudSQL 적용 안됨)
  ```sql
  SELECT run_maintenance('{SCHEMA_NAME}.{TABLE_ID}');
  ```
- time 기준 table 자동 생성
  ```sql
  SELECT partition_data_time('{SCHEMA_NAME}.{TABLE_ID}');
  ```
  - 데이터 없으면 table 생성 불가
  - GCP CloudSQL 적용 가능
- time 기준 table 자동 삭제
  ```sql
  SELECT drop_partition_time('{SCHEMA_NAME}.{TABLE_ID}')
  ```
  - `retention` 옵션 값으로 table 삭제
  - GCP CloudSQL 적용 가능

<br/><br/>

## 인덱싱 설정

### btree 인덱싱

```sql
CREATE INDEX {INDEX_NAME} ON only {SCHEMA_NAME}.{TABLE_ID} USING btree({COLUMN_NAME});
```

### 인덱싱 삭제

```sql
DROP INDEX {INDEX_NAME};
```

<br/><br/>

## 테이블 수정

### 컬럼 명 변경

```sql
ALTER TABLE {TABLE_ID} RENAME COLUMN {SRC_COLUMN} TO {TGT_COLUMN};
```

### 테이블 명 변경

```sql
ALTER TABLE {SCHEMA_NAME}.{SRC_TABLE_ID} RENAME TO {TGT_TABLE_ID};
```

### 컬럼 데이터 타입 변경

```sql
ALTER TABLE {SCHEMA_NAME}.{TABLE_ID} ALTER COLUMN {COLUMN_NAME} TYPE {DATA_TYPE};
```

### 컬럼 추가

```sql
ALTER TABLE {SCHEMA_NAME}.{TABLE_ID} ADD {COLUMN_NAME} {DATA_TYPE} NULL;

ALTER TABLE {SCHEMA_NAME}.{TABLE_ID} 
ADD {COLUMN_NAME} {DATA_TYPE} NULL, 
ADD {COLUMN_NAME2} {DATA_TYPE} NULL;
```

<br/><br/>

## 테이블 삭제

### 컬럼 삭제

```sql
ALTER TABLE {SCHEMA_NAME}.{TABLE_ID} DROP COLUMN {COLUMN_NAME};

ALTER TABLE {SCHEMA_NAME}.{TABLE_ID} 
DROP COLUMN {COLUMN_NAME}, 
DROP COLUMN {COLUMN_NAME2};
```

### 테이블 데이터 삭제

```sql
TRUNCATE TABLE {SCHEMA_NAME}.{TABLE_ID};
```

<br/><br/>

## 데이터 조회

### 테이블 전체 데이터 조회

```sql
SELECT * FROM {TABLE_ID} LIMIT 100;

SELECT * FROM {TABLE_ID} ORDER BY {COLUMN_NAME} DESC;

SELECT * FROM {TABLE_ID} ORDER BY {COLUMN_NAME} ASC;
```

### 테이블 인덱스 정보 조회

```sql
SELECT * FROM pg_catalog.pg_indexes WHERE tablename = '{TABLE_ID}';
```

<br/><br/>

## 계정 설정

### 현재 사용자 정보 확인

```sql
SELECT * FROM PG_USER;
```

### 계정 생성

```sql
CREATE USER {USER_ID} PASSWORD '{USER_PASSWORD}';
```

### 유저 생성 확인

```sql
SELECT * FROM pg_user WHERE usename IN ('{USER_ID}');
```

### 계정명 수정

```sql
ALTER USER {USER_ID} RENAME TO {NEW_USER_ID};
```

### 비밀번호 수정

```sql
ALTER USER {USER_ID} WITH PASSWORD '{USER_PASSWORD}';
```

<br/><br/>

## 권한 설정

### 권한 구조

| 항목 | 설명 |
|:---|:---|
| **Grantor** | 권한을 부여한 role |
| **Grantee** | 권한을 부여받은 role |
| **Table_schema** | schema명 |
| **Table_name** | table명 |
| **Privilege_type** | 권한의 유형 |
| **Is_grantable** | 권한을 줄 수 있을 경우 YES, 아닐 경우 NO |

![postgres_permission_structure](/assets/img/database/postgres_permission_structure.png)

### 권한 확인

```sql
SELECT * FROM information_schema.role_table_grants WHERE grantee ='{USER_ID}';
```

### DB 접근 권한 할당

```sql
GRANT CONNECT ON DATABASE {DB_NAME} TO {USER_ID};
```

### 스키마 권한

- 스키마 모든 권한 할당
  ```sql
  GRANT ALL ON SCHEMA {SCHEMA_NAME} TO {USER_ID};
  ```
- 스키마 엑세스 권한 할당
  ```sql
  GRANT USAGE ON SCHEMA {SCHEMA_NAME} TO {USER_ID};
  ```
- 스키마 SELECT 권한 할당
  ```sql
  GRANT SELECT ON ALL TABLES IN SCHEMA {SCHEMA_NAME} TO {USER_ID};
  
  GRANT SELECT ON ALL TABLES IN SCHEMA {SCHEMA_NAME_1}, {SCHEMA_NAME_2} TO {USER_ID};
  ```

### 테이블 권한

- 앞으로 생길 table에 all 권한
  ```sql
  ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME} 
  GRANT ALL PRIVILEGES ON TABLES TO {USER_ID};
  
  ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME_1}, {SCHEMA_NAME_2} 
  GRANT ALL PRIVILEGES ON TABLES TO {USER_ID};
  ```
- table SELECT 권한 할당
  ```sql
  GRANT SELECT ON TABLE {SCHEMA_NAME}.{TABLE_ID} TO {USER_ID};
  ```
- 앞으로 생길 table에 SELECT 권한
  ```sql
  ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME} 
  GRANT SELECT ON TABLES TO {USER_ID};
  
  ALTER DEFAULT PRIVILEGES IN SCHEMA {SCHEMA_NAME_1}, {SCHEMA_NAME_2} 
  GRANT SELECT ON TABLES TO {USER_ID};
  ```
- 특정 table 권한
  ```sql
  GRANT ALL ON TABLE {SCHEMA_NAME}.{TABLE_NAME} TO {USER_ID};
  ```

### 전체 권한 설정

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA {SCHEMA_NAME} TO {USER_ID}; 

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {SCHEMA_NAME} TO {USER_ID};

ALTER DEFAULT PRIVILEGES GRANT USAGE ON SEQUENCES TO {USER_ID};
```

<br/><br/>

## 프로세스 관리

### 활성 프로세스 확인

```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### 특정 프로세스 종료

```sql
SELECT pg_cancel_backend({PROCESS_ID});
```

<br/><br/>

## Reference

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg_partman Documentation](https://github.com/pgpartman/pg_partman)
- [pg_partman Native Partitioning](https://github.com/pgpartman/pg_partman/blob/master/doc/pg_partman_howto_native.md)