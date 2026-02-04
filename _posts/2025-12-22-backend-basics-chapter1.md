---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 1장 들어가며'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-12-22 12:40:00 +0900
category: [Book, Backend]
tags: [backend, database, connection-pool, book-review]
math: true
mermaid: false
---
**<center>💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부 목적으로 메모하였습니다. </center>**

<br/><br/>

## 1장에서 다루는 내용

- 코딩 능력만으로는 부족하며 시스템 동작 원리에 대한 기초 지식이 필요함을 강조
- DB 커넥션 관리를 통해 리소스 관리의 중요성을 설명

<br/><br/>

## 핵심 개념

### DB 커넥션 누수 문제

- DB 커넥션을 사용 후 반환하지 않으면 커넥션 풀이 고갈되어 서비스 장애 발생

  ```java
  // 잘못된 예
  Connection conn = ds.getConnection();
  try {
      // DB 작업
  } catch(Exception e) {
      // 에러 처리
  }
  // close() 누락!
  ```

  ![커넥션 누수 발생 과정](/assets/img/books/backend-basics-ch1/connection_leak_flow.png)

### 커넥션 풀 동작 원리

- DB 커넥션을 미리 생성해 풀에 보관
- 필요할 때 꺼내 쓰고 반환하여 재사용

![커넥션 풀 동작 방식](/assets/img/books/backend-basics-ch1/connection_pool_sequence.png)

- 모든 커넥션이 사용 중이면 대기 또는 타임아웃

![커넥션 부족 시나리오](/assets/img/books/backend-basics-ch1/connection_shortage2.png)

### 올바른 구현 방법

```java
// try-with-resources 사용
try (Connection conn = ds.getConnection()) {
    // DB 작업
} catch(Exception e) {
    // 에러 처리
}
```

- Java 7 이상에서 지원하는 try-with-resources를 사용하면 자동으로 리소스 반환

<br/><br/>

## 배운 점

- 프레임워크 사용법만이 아닌 시스템 리소스 관리의 중요성을 깨달음
- 개발 환경에서는 문제없다가 운영 환경에서 발생하는 문제의 원인을 이해하게 됨
- 시스템 안정성을 위해 확인해야 할 핵심 모니터링 지표를 알게 됨
  - 활성 커넥션 수
  - 커넥션 풀 사용률
  - 대기 시간

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](https://product.kyobobook.co.kr/detail/S000216376461?utm_source=google&utm_medium=cpc&utm_campaign=googleSearch&gt_network=g&gt_keyword=&gt_target_id=dsa-435935280379&gt_campaign_id=9979905549&gt_adgroup_id=132556570510&gad_source=1)
