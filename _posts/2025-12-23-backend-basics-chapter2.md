---
title: "주니어 백엔드 개발자가 반드시 알아야 할 실무 지식 - 2장"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-23 19:20:00 +0900
category:
  - [Book, Backend]
tags: [backend, performance, scaling, caching, cdn, book-review]
math: true
mermaid: true
---

**<center>💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부 목적으로 메모하였습니다. </center>**

<br/><br/>

## 2장에서 다루는 내용

- 서비스 성능 측정과 개선 방법
- TPS, 응답 시간 등 성능 지표의 이해
- 서버 확장 전략 (수직/수평 확장)
- DB 커넥션 풀 관리
- 캐싱과 CDN을 통한 성능 최적화

<br/><br/>

## 핵심 개념

### 응답 시간과 처리량

- 응답 시간이 사용자 경험과 비즈니스 성과에 직접적 영향을 끼침
- TPS (Transacon Per Second)
  - 초당 트랜잭션 수
- 최대 TPS를 초과하면 응답 시간이 증가하고 서비스 품질 저하
- **응답 시간 구성 요소**

  - 네트워크 지연 시간
  - 서버 처리 시간
  - DB 쿼리 실행 시간

  ![응답 시간의 구성](/assets/img/books/backend-basics-ch2/response_time.png)

- **TPS와 응답 시간의 관계**

  - 요청이 증가할수록 TPS 상승
  - 최대 TPS 도달 시 응답 시간 급격히 증가
  - 처리 한계 초과 시 시스템 안정성 저하

  ![TPS 개념](/assets/img/books/backend-basics-ch2/tps.png)

### 서버 확장 전략

![수직 확장과 수평 확장](/assets/img/books/backend-basics-ch2/scaling.png)

- **수직 확장 (Scale-up)**
  - 하드웨어 사양 업그레이드
    - CPU 코어 수 증가 (4코어 → 8코어)
    - 메모리 용량 확장 (RAM 증설)
    - 디스크 성능 향상 (HDD → SSD)
  - 장점
    - 구현이 간단함
    - 기존 코드 수정 불필요
  - 단점
    - 비용 비효율적
    - 물리적 한계 존재
    - 단일 장애점(SPOF)
- **수평 확장 (Scale-out)**
  - 서버 대수 증가 + 로드 밸런서
  - 장점
    - 확장성이 우수함
    - 장애 대응력 향상
    - 비용 효율적
  - 단점
    - 관리 복잡도 증가
    - 무상태(Stateless) 설계 필요
    - 데이터 일관성 관리 필요

### DB 커넥션 풀

- DB 커넥션을 미리 생성해 재사용
- 매번 커넥션 생성/삭제 오버헤드 제거

#### 커넥션 풀 크기 계산

- **기본 공식**

$$
\text{커넥션 풀 크기} = \frac{\text{동시 사용자 수}}{1\text{초} / \text{DB 서비스 시간}}
$$

- **HikariCP 권장 공식**

$$
\text{connections} = (\text{core_count} \times 2) + \text{effective_spindle_count}
$$

- **공식 설명**
  - `core_count`
    - CPU 코어 수
  - `effective_spindle_count`
    - 디스크 스핀들 수
    - HDD 환경에서는 물리적 헤드 개수 (보통 1~4)
    - **현대 SSD 환경에서는 1로 고정하거나 무시**
    - I/O 블로킹 (디스크 읽기/쓰기 대기)이 거의 없으므로 CPU 코어 수에 더 집중
    - SSD 성능은 Queue Depth (동시 처리 가능한 I/O 요청 수)와 병렬 처리 능력에 좌우됨
    - 스핀들 수 대신 동시 I/O 처리 능력이 핵심 지표
  - CPU 코어보다 약간 더 많은 커넥션이 필요한 이유
    - I/O 대기 시간 동안 다른 스레드가 CPU 활용
    - Context Switching (스레드 전환) 오버헤드 최소화
    - DB 서버의 동시 처리 능력 고려
- **크기 설정의 중요성**
  - 너무 작으면 대기 발생 및 응답 시간 증가
  - 너무 크면 DB 부하 증가 및 메모리 낭비
  - TPS와 응답 시간을 고려한 최적화 필요
  - 실제 트래픽 패턴 모니터링 후 조정 권장

![커넥션 풀 동작 방식](/assets/img/books/backend-basics-ch2/connection-pool.png)

#### 커넥션 대기 시간

- 모든 커넥션이 사용 중일 때 새로운 요청은 대기 큐(Wait Queue)에 진입
- **대기 시간 계산 공식**

$$
\text{대기 시간} = \left( \frac{\text{풀에 있는 요청 수}}{\text{풀 크기}} + 1 \right) \times \text{평균 서비스 시간}
$$

- **타임아웃 설정**
  - HikariCP 기본 대기 시간은 30초
  - 예상 대기 시간을 고려한 타임아웃 설정 필요
  - 대기 시간 관리로 응답 시간 예측 가능하게 설정
- **주의사항**
  - 장시간 대기는 스레드 고갈 유발 가능
  - 타임아웃 발생 시 리소스 해제 및 에러 처리 필수

### 트래픽 제어 전략

- **Backpressure (백프레셔)**
  - 시스템의 처리 한계를 초과하는 요청을 제어하는 메커니즘
  - 수용 가능한 사용자 수를 제한하고 나머지는 대기 큐에서 관리
  - Java 생태계 구현
    - Spring WebFlux의 Reactive Streams
      - 비동기 데이터 스트림 처리
      - 생산자가 소비자의 처리 속도를 고려하여 데이터 전송
    - Project Reactor의 backpressure 연산자
      - onBackpressureBuffer (버퍼에 임시 저장)
      - onBackpressureDrop (초과 데이터 버림)
- **Rate Limiting (속도 제한)**
  - 단위 시간당 처리 가능한 요청 수를 제한
  - Token Bucket 알고리즘
    - 일정 속도로 토큰 생성
    - 요청마다 토큰 소비
    - 토큰이 있어야 요청 처리 가능
  - Leaky Bucket 알고리즘
    - 요청을 버킷에 담고 일정 속도로 처리
    - 버킷이 가득 차면 요청 거부
- **장점**
  - 서버 증설 없이 서비스 안정성 확보
  - 비용 효율적인 트래픽 관리
  - 연쇄 장애 방지
  - 사용자의 불필요한 새로고침 방지
- **구현 고려 사항**
  - 대기 시간을 명확히 안내하여 사용자 경험 개선
  - 서비스 완전 중단보다는 순차적 처리가 더 나은 사용자 경험 제공
  - 타임아웃 설정으로 무한 대기 방지
- **주의 사항**
  - 장시간 대기는 Thread Pool 고갈 위험
  - 대기 큐 크기 제한 필요 (메모리 부족 방지)

### 캐싱 전략

![캐시 아키텍처](/assets/img/books/backend-basics-ch2/cache.png)

- **로컬 캐시**
  - 서버 프로세스 메모리 내 저장
  - 빠르지만 서버 간 공유 불가
- **리모트 캐시**
  - 별도 캐시 서버 (Redis 등)
  - 여러 서버가 공유 가능
- **캐시 전략**
  - LRU (Least Recently Used)
    - 가장 오래 사용하지 않은 데이터 제거
    - 최근 사용 시간 기준
  - LFU (Least Frequently Used)
    - 사용 빈도가 가장 낮은 데이터 제거
    - 전체 사용 횟수 기준
  - FIFO (First In First Out)
    - 가장 먼저 저장된 데이터부터 제거
    - 저장 순서 기준
- **캐시 접근 패턴**
  - **Cache-Aside (Lazy Loading)**
    - 애플리케이션이 캐시를 직접 관리
    - 캐시 미스 시 DB에서 조회 후 캐시에 저장
  - **Write-Through**
    - 데이터 쓰기 시 캐시와 DB에 동시 저장
    - 데이터 일관성 보장
  - **Write-Behind (Write-Back)**
    - 캐시에만 먼저 쓰고 비동기로 DB에 반영
    - 쓰기 성능 최적화, 장애 시 데이터 손실 위험

### CDN (Content Delivery Network)

![ CDN 구조](/assets/img/books/backend-basics-ch2/cdn.png)

- **기본 개념**

  - 정적 자원을 전 세계에 분산 배치
  - 사용자와 가까운 곳에서 콘텐츠 제공하여 응답 시간 단축
  - 원본 서버 부하 감소

- **네트워크 계층 관점의 최적화**

  - **RTT (Round Trip Time) 감소**
    - 물리적 거리 단축으로 왕복 지연 시간 최소화
    - TCP 3-way handshake 오버헤드 감소
    - TLS handshake 시간 단축
      - 암호화 통신 설정 과정 (HTTPS 연결 필수)
      - 인증서 교환 및 암호화 키 협상 시간 감소
  - **네트워크 홉(Hop) 수 최소화**
    - 라우터 경유 횟수 감소로 패킷 손실률 저하
    - Jitter (지터) 최소화로 안정적인 전송 보장
      - 패킷 도착 시간의 변동성 (디레이 차이)
      - 실시간 스트리밍에서 특히 중요
  - **BDP (Bandwidth-Delay Product) 최적화**
    - 대역폭과 지연 시간의 곱
    - 네트워크에서 동시에 전송 가능한 데이터 양
    - 지연 시간 감소 시 TCP 윈도우 사이즈 효율 증가
      - 윈도우 사이즈는 확인 응답 없이 보낼 수 있는 데이터 양
      - 지연이 적으면 빠르게 데이터 전송 가능
    - 한 번에 전송 가능한 데이터 양 증대
    - 대역폭 활용률 극대화

- **L4/L7 로드 밸런싱**

  - L4 (Transport Layer)
    - IP 주소 및 포트 기반 분산
    - 빠른 처리 속도
  - L7 (Application Layer)
    - HTTP 헤더, URL 경로 기반 라우팅
    - 콘텐츠 유형별 최적 서버 분배

- **Cache-Control 헤더**
  - `max-age` 설정으로 캐시 유효 기간 지정
  - 브라우저와 CDN에서 모두 사용
  - 정적 리소스(CSS, JS, 이미지)는 긴 시간 설정 권장

<br/><br/>

## 배운 점

- 성능 개선은 측정부터 시작
  - 어디가 병목인지 파악해야 효과적 개선 가능
- 확장 방법 선택은 상황에 따라 달라짐
  - 트래픽 유형, 비용, 관리 복잡도 고려
- DB 커넥션 풀은 적절한 크기와 대기 시간 설정이 핵심
  - 너무 많거나 적으면 오히려 성능 저하
- 캐시는 읽기가 많고 자주 변경되지 않는 데이터에 효과적
  - 무효화 전략이 중요
- 정적 자원은 CDN 활용으로 응답 시간 개선 가능

<br/><br/>

## 적용 방안

- 현재 서비스의 성능 지표 모니터링 체계 구축 필요
  - TPS, 응답 시간, 리소스 사용률 추적
- 수평 확장을 위한 무상태(Stateless) 아키텍처 설계
  - 세션을 서버 메모리가 아닌 별도 저장소에 관리
- DB 커넥션 풀 설정 최적화
  - 현재 트래픽 패턴 분석 후 적절한 크기 결정
- 자주 조회되는 데이터 캐싱 적용
  - 상품 정보, 사용자 프로필 등
- 이미지, CSS, JS 등 정적 자원은 CDN 활용
  - CloudFlare, AWS CloudFront 등 검토

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식 - 한빛미디어](https://product.kyobobook.co.kr/detail/S000216376461?utm_source=google&utm_medium=cpc&utm_campaign=googleSearch&gt_network=g&gt_keyword=&gt_target_id=dsa-435935280379&gt_campaign_id=9979905549&gt_adgroup_id=132556570510&gad_source=1)
