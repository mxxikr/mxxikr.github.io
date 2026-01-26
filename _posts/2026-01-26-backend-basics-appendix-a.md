---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 부록 A 성능 테스트'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-26 10:00:00 +0900
category: [Book, Backend]
tags: [backend, performance, testing, ngrinder, k6, book-review]
math: false
mermaid: false
---

- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 부록 A에서 다루는 내용

- 성능 테스트의 기초 개념
- 성능 평가의 핵심 지표
- 테스트 설계 시 고려사항
- 테스트 실행 전략
- 테스트 도구 및 환경
- 실행 시 주의사항

<br/><br/>

## 성능 테스트의 기초 개념

### 성능 테스트의 정의와 목적

- 시스템이 특정 상황에서 처리할 수 있는 부하 수준을 측정
- 응답 시간, 처리량, 자원 사용량(CPU, 메모리 등) 확인
- 병목 지점 식별 및 최적화 방향 제시

### 전체 프로세스 개요

![성능 테스트 프로세스](/assets/img/books/backend-basics-appendix-a/performance-test-process.png)

### 성능 테스트의 종류

- **부하(`load`) 테스트**
  - 특정 예상 부하에서의 시스템 동작 확인
- **스트레스(`stress`) 테스트**
  - 시스템 한계점 파악을 위한 고부하 테스트
- **지속 부하(`soak`) 테스트**
  - 장시간 부하 지속 시 시스템 안정성 확인
- **스파이크(`spike`) 테스트**
  - 급격한 트래픽 변화에 대한 시스템 반응 테스트

<br/><br/>

## 성능 평가의 핵심 지표

### 표화점과 버클존

![표화점과 버클존](/assets/img/books/backend-basics-appendix-a/saturation-point.png)

- **표화점(`saturation point`)**
  - 시스템이 최대 처리량을 달성하는 지점
- **버클존(`buckle zone`)**
  - 표화점 이후 급격한 성능 저하가 발생하는 구간
- `TPS`(Transactions Per Second) 그래프로 시각화 가능

### 응답 시간 분포

![응답 시간 분포](/assets/img/books/backend-basics-appendix-a/response-time-distribution.png)

- **평균, 최대, 최소, 중앙값, 99%/95% 백분위** 등 다양한 통계치 활용
- 응답 시간 분포의 형태가 성능 판단에 중요
- 중앙값과 평균의 차이가 클 경우 일부 극단값이 존재함을 의미

<br/><br/>

## 테스트 설계 시 고려사항

### 주요 측정 지표

![성능 측정 지표](/assets/img/books/backend-basics-appendix-a/performance-metrics.png)

### 처리량 및 에러율 설정

- **처리량(`Throughput`) 설정**
    - `TPS` 기준으로 목표치 설정
    - 테스트를 점진적으로 실행하며 시스템 한계 파악

- **에러율 관리**
    - 정상적인 응답과 에러를 구분하여 측정
    - 에러 발생 시점의 시스템 상태 분석 중요

### CPU 사용률 모니터링

- 부하 증가에 따른 `CPU` 사용률 변화 모니터링
- `DB` 및 `WAS`의 `CPU` 사용 패턴 분석

<br/><br/>

## 테스트 실행 전략

### 점진적 부하 증가 전략

![점진적 부하 증가 전략](/assets/img/books/backend-basics-appendix-a/load-increase-strategy.png)

- **점진적 부하 증가**
  - 100명씩 단계적으로 사용자 수 증가
- **충분한 실행 시간**
  - 각 단계별 20분 이상 유지하여 안정화 확인
- **트래픽 규모 조정**
  - 50명 사용자 = 내부 시스템
  - 1천만명 = 온라인 서비스

### 트래픽 패턴 설계


- **시스템 트래픽 패턴 반영**
  - 특정 시간대의 집중 부하 고려
- **동시 요청 시뮬레이션**
  - 실제 사용자 행동 패턴 모방
- **기능별 요청 비율**
  - 다양한 트랜잭션 타입의 비율 설정

### 부하 분산 및 환경 설정

![부하 분산 전략](/assets/img/books/backend-basics-appendix-a/load-balancing-strategy.png)

<br/><br/>

## 테스트 도구 및 환경

### 성능 테스트 도구 비교

- **nGrinder**
  - 네이버 오픈소스, Groovy/Jython 기반 스크립트 작성
- **k6**
  - Grafana 기반 도구, 고루틴 활용으로 효율적, CI/CD 통합 가능
- **Locust**
  - Python 기반, 간편한 테스트 작성
- **Gatling**
  - Scala 기반, GUI 환경 제공
- **JMeter**
  - Apache 기반, 다양한 프로토콜 지원

### 테스트 도구 구조 (nGrinder)

![테스트 도구 구조](/assets/img/books/backend-basics-appendix-a/test-tool-structure.png)

<br/><br/>

## 실행 시 주의사항

### 데이터베이스 관리

- 부하 테스트 전 `DB` 상태 정리 필요
- 워밍업 시간 확보로 캐시 사전 적재

### 네트워크 및 시스템 설정

- `Nginx`의 `limit_req_zone` 등 설정 확인
- 외부 서비스 및 스트레스 테스트 환경의 요청률 제한 고려

### 서버 및 환경 분리 전략

![서버 및 환경 분리](/assets/img/books/backend-basics-appendix-a/server-environment-separation.png)

- **원칙**
    - 부하기와 테스트 대상 시스템은 별도 구성
    - 외부 서비스 연동 시 네트워크 트래픽 최소화
    - 실제 운영 시스템과 테스트 환경 분리

### 성능 테스트 실행 흐름도

**단일 시스템 테스트**
![단일 시스템 테스트 흐름](/assets/img/books/backend-basics-appendix-a/single-system-test-flow.png)

**다중 서비스 테스트**
![다중 서비스 테스트 흐름](/assets/img/books/backend-basics-appendix-a/multi-service-test-flow.png)

<br/><br/>

## 배운 점

- **명확한 목표 설정의 중요성**
  - `TPS`, 응답 시간, 에러율 등 구체적인 목표치를 설정하고 진행해야 의미 있는 결과를 얻을 수 있음
- **점진적인 접근 필요**
  - 한번에 부하를 주는 것이 아니라 단계적으로 증가시키며 병목 지점을 파악해야 함
- **종합적인 분석 능력**
  - 단순히 성공/실패만 보는 것이 아니라 다양한 지표를 종합적으로 분석하여 최적화 방향을 찾아야 함
- **체계적인 준비 과정**
  - 환경 구축, 도구 선택, 시나리오 설계 등 실행 전 준비가 테스트의 성패를 좌우함

<br/><br/>

## 적용 방안

- **성능 테스트 프로세스 정립**
  - 계획 → 설계 → 실행 → 분석의 단계를 준수하며 테스트 진행
- **점검 시간 확보**
  - 안정성 확보를 위해 1시간 이상의 충분한 점검 시간 계획
- **점진적 부하**
  - 5분 단위로 사용자를 증가시키며 시스템 추이 모니터링
- **선 최적화**
  - 성능 테스트 전 코드 레벨에서의 기본적인 최적화 선행
- **환경 분리 철저**
  - 부하기와 테스트 대상 시스템을 물리적/논리적으로 분리하여 정확한 결과 도출
  - 운영 환경에 영향을 주지 않도록 독립적인 테스트 환경 구축

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
