---
title: "IntelliJ MaxCompute Plugin 설치 및 사용"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-20 04:30:00 +0900
category:
  - [Cloud, Alicloud]
tags:
  - [alicloud, maxcompute, intellij, plugin]
math: true
mermaid: true
---

<br/><br/>

## MaxCompute Studio 개요
- Alibaba Cloud의 빅데이터 처리 플랫폼인 MaxCompute를 IntelliJ IDEA에서 사용하기 위한 공식 플러그인
- SQL 편집기, 프로젝트 관리, 데이터 미리보기 등 통합 개발 환경 제공
- Java/Python UDF(사용자 정의 함수) 개발 및 로컬 디버깅 지원 (강력한 기능)
- 로컬 개발 환경에서 클라우드 데이터 웨어하우스 직접 조작 가능

<br/><br/>

## 설치 및 초기 설정

### IntelliJ 및 MaxCompute Studio 플러그인 설치
- [IntelliJ IDEA 다운로드 및 설치](https://www.jetbrains.com/idea/)
- IntelliJ 실행 후 플러그인 설치
  - File → Settings → Plugins 이동
  - 검색창에 MaxCompute Studio 입력
  - Install 클릭 후 IDE 재시작
    ![image](/assets/img/cloud/alicloud/mx_plugin_1.jpg)
    ![image](/assets/img/cloud/alicloud/mx_plugin_2.jpg)

<br/><br/>

### MaxCompute 프로젝트 생성 및 연동
- 새 프로젝트 생성
  - File → New → Project 선택
    ![image](/assets/img/cloud/alicloud/mx_plugin_3.jpg)
  - 왼쪽 메뉴에서 MaxCompute Studio 선택 → Next
  - 프로젝트명 입력(임의 지정 가능) → Finish
    ![image](/assets/img/cloud/alicloud/mx_plugin_4.jpg)

- Project Explorer 활성화
  - View → Tool Windows → Project Explorer
    ![image](/assets/img/cloud/alicloud/mx_plugin_5.jpg)

- MaxCompute 프로젝트 연결
  - Project Explorer 상단 + 아이콘 클릭
  - Add project from MaxCompute 선택
    ![image](/assets/img/cloud/alicloud/mx_plugin_6.jpg)
  - Connection 탭에서 인증 정보 입력 후 OK
    ![image](/assets/img/cloud/alicloud/mx_plugin_7.jpg)
    - Access ID
      - Alibaba Cloud AccessKey ID
    - Access Key
      - Alibaba Cloud AccessKey Secret
    - Project Name
      - 연동할 MaxCompute 프로젝트명
    - **Endpoint** (필수)
      - 해당 리전의 접속 주소 입력
      - 예: `http://service.ap-northeast-2.maxcompute.aliyun.com/api` (한국 리전)
    - **Tunnel Endpoint** (선택 - 미리보기용)
      - 데이터 미리보기(Preview)나 다운로드 문제 발생 시 설정 필요
      - 예: `http://dt.ap-northeast-2.maxcompute.aliyun.com` (한국 리전)

<br/><br/>

## 주요 기능 사용법

### 프로젝트 데이터 관리
![image](/assets/img/database/image25.png)

- 테이블 탐색
  - **Project Explorer** → **프로젝트명** → **Tables & Views** 확장
  - 테이블 목록 및 프로젝트 정보 확인

- 테이블 상세 정보 조회
  - 테이블명 더블클릭
  - 컬럼 구조, 데이터 타입, 파티션 정보 등 확인

- 데이터 미리보기
  - 하단 **Table Details** 패널 → **Partitions** 탭 이동
  - 조회할 파티션(날짜) 선택
  - **Preview rows** 행 수 설정
  - **Data Preview** 클릭하여 샘플 데이터 확인


<br/><br/>

### SQL 쿼리 작성 및 실행

| 작업 | 방법 | 비고 |
|------|------|------|
| **SQL 편집기 열기** | Project Explorer에서 프로젝트 우클릭 → **New sql editor** | ![image](/assets/img/cloud/alicloud/mx_plugin_8.jpg) |
| **쿼리 실행** | `Ctrl + Shift + S` 또는 ▶ 버튼 클릭 | **주의**: 일반적인 DB 툴(`Ctrl+Enter`)과 단축키 다름 |
| **파티션 필터링** | WHERE 절에 파티션 컬럼 필수 포함 | 비용 절감 및 성능 최적화 |
| **결과 확인** | 하단 Result 패널에서 쿼리 결과 및 로그 확인 | 실행 시간, 스캔 데이터량 표시 |

- 쿼리 작성 주의사항
  - 파티션 컬럼(예: `ds`) 필터링 필수
    - MaxCompute는 과금이 스캔 데이터량 기준
    - 파티션 없이 전체 테이블 스캔 시 비용 급증 위험
  - 쿼리 예시
    ```sql
    -- Good: 파티션 필터링 적용
    SELECT *
    FROM user_logs
    WHERE ds >= '2022-10-01'
      AND ds < '2022-10-08'
    LIMIT 100;
    
    -- Bad: 파티션 필터링 미적용 (전체 스캔)
    SELECT *
    FROM user_logs
    LIMIT 100;
    ```

<br/><br/>

## 개발 워크플로우

![image](/assets/img/database/image26.png)

<br/><br/>

## 주요 기능 요약

| 기능 | 설명 | 사용 시나리오 |
|------|------|---------------|
| **프로젝트 연동** | AccessKey 기반 클라우드 프로젝트 연결 | 최초 설정 시 1회 |
| **메타데이터 탐색** | 테이블, 컬럼, 파티션 구조 조회 | 데이터 구조 파악 |
| **데이터 미리보기** | 파티션별 샘플 데이터 확인 | 쿼리 작성 전 데이터 검증 |
| **SQL 편집/실행** | 구문 강조, 자동완성, 실행 기능 | 일상적인 쿼리 작업 |
| **쿼리 히스토리** | 실행된 쿼리 이력 관리 | 이전 작업 재사용 |


<br/><br/>

## Reference
- [Alibaba Cloud MaxCompute 공식 문서](https://www.alibabacloud.com/help/en/maxcompute)
- [MaxCompute Studio 플러그인 가이드](https://www.alibabacloud.com/help/en/maxcompute/user-guide/intellij-idea-installation-procedure)
