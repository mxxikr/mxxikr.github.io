---
title: "GCP BigQuery 프로세스 관리"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-19 12:40:00 +0900
category:
  - [Cloud, GCP]
tags:
  - [bigquery, gcp]
math: true
mermaid: true
---
# 프로세스 확인 및 중지
---
### **프로젝트 프로세스 확인**
* 완료되지 않은 모든 프로세스 job 확인
    ```sql
    SELECT *
    FROM `{PROJECT_ID}`.`{REGION_NAME}`.`INFORMATION_SCHEMA`.`JOBS_BY_PROJECT`
    WHERE STATE != "DONE"
    ```
* 완료되지 않은 모든 프로세스 job id 확인
    ```sql
    SELECT job_id
    FROM `{PROJECT_ID}`.`{REGION_NAME}`.`INFORMATION_SCHEMA`.`JOBS_BY_PROJECT`
    WHERE STATE != "DONE"
    ```
* USER별 완료되지 않은 프로세스 job 수 확인
    ```sql
    SELECT user_email, count(*)
    FROM `{PROJECT_ID}`.`{REGION_NAME}`.`INFORMATION_SCHEMA`.`JOBS_BY_PROJECT`
    WHERE STATE != "DONE" GROUP BY user_email
    ```

### **프로세스 중지**
* 프로세스 중지
    ```sql
    CALL BQ.JOBS.CANCEL('{PROJECT_ID}.{JOB_ID}');
    ```

<br/><br/>

## **Reference**
* [Google Cloud BigQuery Docs](https://cloud.google.com/bigquery/docs)
