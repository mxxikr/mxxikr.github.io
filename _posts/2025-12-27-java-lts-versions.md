---
title: Java LTS 버전별 차이
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-12-27 17:55:00 +0900
category: [Language, Java]
tags: [java, spring-boot, lts, backend]
math: true
---
## 현재 Java 생태계

- 현재 Java 생태계의 표준은 Java 17로 이동함
- Java 8
  - 여전히 많이 쓰이나 Legacy임
  - 모던 인프라와 프레임워크의 혜택을 받을 수 없음
- Java 17
  - 현재 Java 생태계의 주요 표준 버전임
  - Spring Boot 3.0의 최소 요구사항임
  - 성능과 안정성의 균형이 갖춰진 버전임
- Java 21
  - 주요 기능이 업데이트된 최신 LTS 버전임
  - Virtual Threads의 도입으로 비동기 프로그래밍 방식에 변화를 줌
  - 신규 프로젝트라면 도입을 추천하는 버전임

<br/><br/>

## 주요 LTS 버전별 분석

### Java 8 (LTS, 2014)

- 출시된 지 오래된 LTS 버전임
- 아직도 많은 국내 금융 및 공공 레거시 시스템이 머물러 있는 버전임
- 주요 특징
  - Lambda, Stream API, Optional, java.time (Joda-Time 대체)
- 장점
  - 풍부한 레퍼런스, 안정성, 기존 라이브러리와의 완벽한 호환성
- 단점
  - 컨테이너 환경 효율 저하
    - 8u131 이전
      - cgroups 미지원 → 컨테이너 메모리 제한 무시
    - 8u131-8u190
      - `-XX:+UnlockExperimentalVMOptions -XX:+UseCGroupMemoryLimitForHeap` 플래그 필요
    - 8u191+
      - 기본적으로 컨테이너 메모리 인식
      - 단, Java 11+ 대비 힙 크기 자동 조정 정확도가 낮음
      - `-m 2g` 설정 시 `-XX:MaxRAMPercentage` 수동 조정 권장
  - 모던 프레임워크 지원 중단
    - Spring Boot 3.x 이상 사용 불가능
  - GC 성능
    - 기본 GC가 Parallel GC로, 대용량 힙에서 STW 시간이 김
    - G1GC 사용 가능하나 Java 9+ 대비 최적화가 부족함
  - 문법적 한계
    - var 키워드, record 등 모던 문법 부재로 코드가 장황함
- 지원 일정
  - Oracle JDK 8: 공개 업데이트 2019년 종료 (상용 라이센스는 별도)
  - Eclipse Temurin 8: 2026년까지 지원 예정

### Java 11 (LTS, 2018)

- 컨테이너 환경 지원이 강화된 LTS 버전임
- Java 8 이후의 첫 번째 모던 LTS이자 컨테이너 환경을 제대로 지원하기 시작한 버전임
- 주요 특징
  - Java 9의 Module System (Jigsaw)이 안정화됨
    - rt.jar가 쪼개지며 JRE가 가벼워졌으나 마이그레이션의 주된 고통 원인임
  - HTTP Client API
    - HttpUrlConnection을 대체하는 비동기 HTTP 클라이언트 내장
  - Lambda 파라미터 var 사용 가능
  - Java EE 모듈 제거 (JAXB, JAX-WS 등)
- 장점
  - Docker 및 K8s 환경에서 리소스 인식이 정확해짐
  - G1GC가 기본 GC로 채택되어 성능 개선됨
- 단점
  - 과도기적 위치임
  - 현재 시점에서 8에서 넘어간다면 11을 거치지 않고 17로 직행하는 추세임
- 지원 일정
  - Eclipse Temurin 11: 2027년까지 지원 예정

### Java 17 (LTS, 2021)

- 새로운 표준으로 자리 잡은 LTS 버전임
- Spring Boot 3.x의 베이스라인이자 가장 추천되는 안정적인 버전임
- 주요 특징
  - Record
    - 불변 데이터 객체(DTO)를 위한 보일러플레이트 코드(getter, equals 등) 제거
    - DDD의 Value Object 구현에 최적
  - Pattern Matching (instanceof)
    - 형변환 코드를 획기적으로 줄여줌
  - Sealed Classes
    - 상속 가능한 클래스를 명시적으로 제한하여 도메인 모델 설계 시 명확한 의도 전달 가능
  - Text Blocks
    - SQL, JSON 문자열을 큰따옴표 3개로 깔끔하게 작성 가능
- 성능
  - Java 8 대비 G1GC 처리량(Throughput) 및 지연시간(Latency) 상당히 개선됨
  - 벤치마크 기준 ([Renaissance Suite v0.14.2](https://renaissance.dev), SPECjbb2015 등)
    - G1GC Throughput: 평균 15-25% 개선
    - 지연시간(Latency): 워크로드에 따라 10-40% 개선
    - 주의: 애플리케이션 특성에 따라 편차 큼
- 지원 일정
  - Eclipse Temurin 17: 2029년까지 지원 예정
- Record와 DDD (불변성 확보)
  - 기존 Class 방식의 한계
    - 불변성을 보장하기 위해 final 필드 선언이나 생성자 로직 작성이 번거로움
    - 실수로 Setter를 허용할 경우 도메인 객체의 상태가 오염될 위험이 있음
  - Record 패턴
    - Compact Constructor
      - 생성자 파라미터를 생략하고 검증 로직만 작성 가능함
      - 객체 생성 시점에 무결성을 완전히 보장하며 생성 후 변경이 불가능함
  - 효과
    - 비즈니스 로직에서 불필요한 방어 코드를 제거하고 객체의 존재 자체로 검증을 증명함

### Java 21 (LTS, 2023)

- 동시성 처리 성능이 강화된 버전임
- 동기 방식 코드로 비동기 수준의 성능을 제공하여 개발 생산성을 크게 개선함
- 주요 기능

  - Virtual Threads (Project Loom, JEP 444)
    - 기존 Java 스레드(OS 스레드 1:1 매핑)의 한계를 극복함
    - JEP 444 벤치마크
      - 100만 스레드 생성 시 약 200MB 메모리 사용
    - 실무 권장
      - I/O bound 작업
        - 수만~수십만 개도 문제없음 (대부분이 대기 상태)
      - CPU bound 작업
        - Platform Thread 수와 유사한 수준으로 제한 필요
        - 16코어 → 약 16-32개의 CPU 집약 작업이 최적
      - 제약은 Virtual Thread 개수가 아니라 **동시에 실행 중인(Running) 작업의 수**
  - Sequenced Collections
    - `list.getFirst()`, `list.getLast()` 등 순서가 있는 커렉션 처리가 일관성 있게 통합됨
  - Generational ZGC (JEP 439)

    - TB(테라바이트) 단위 힙에서도 10ms 미만의 GC 중단 시간을 목표로 함
    - `-XX:+UseZGC` 사용 시 Generational 모드가 기본 활성화됨
    - 비활성화하려면 `-XX:-ZGenerational` 옵션 필요
    - ZGC vs G1GC 비교 (힙 크기별)

      | 힙 크기 | G1GC STW (Mixed GC)   | ZGC STW      | 권장             |
      | ------- | --------------------- | ------------ | ---------------- |
      | ~16GB   | 10-50ms (일반적)      | 5-10ms       | G1GC (오버헤드↓) |
      | 32-64GB | 50-200ms              | 5-15ms       | 워크로드 따라    |
      | 100GB+  | 200-500ms (최악 1초+) | <10ms (목표) | ZGC 권장         |

    - 주의
      - 실제 STW는 힙 크기뿐 아니라 라이브 객체 수, 할당 속도에 크게 영향받음

- 장점
  - Reactive Programming(WebFlux, Mono/Flux)의 학습 곡선 없이도 동기 코드 스타일로 비동기급 처리량을 달성 가능함
- 지원 일정
  - Eclipse Temurin 21: 2031년까지 지원 예정 (예상)

### Virtual Threads 심층 분석

- Blocking is Cheap의 의미
  - 기존 Platform Thread
    - I/O 대기 시 비싼 OS 스레드가 블로킹됨
    - 스레드 풀 고갈 위험
  - Virtual Thread
    - I/O 대기 시 가상 스레드만 주차(unmount)됨
    - OS 스레드는 다른 가상 스레드 실행
    - 코루틴처럼 동작하지만 코드는 동기 스타일
- Virtual Threads vs Reactive
  - Reactive (WebFlux)
    - 학습 곡선이 있으나 CPU 효율이 높음
    - 콜백 기반 코드로 디버깅이 상대적으로 어려움
  - Virtual Threads
    - 메모리 효율
      - 스레드당 수 KB 수준
    - 개발 생산성
      - 기존 동기 코드 그대로 사용 가능
- 코드 예시

  ```java
  // Before: Platform Threads (Java 8-17)
  ExecutorService executor = Executors.newFixedThreadPool(100);
  executor.submit(() -> {
      String data = callExternalAPI();  // 100개 스레드 제한
      processData(data);
  });

  // After: Virtual Threads (Java 21)
  try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
      executor.submit(() -> {
          String data = callExternalAPI();  // 수만 개도 OK
          processData(data);
      });
  }
  ```

- 주의사항
  - CPU 집중 작업 (CPU-bound) 시 성능 저하가 발생할 수 있음
  - Thread Pinning 현상
    - `synchronized` 블록 내부에서 I/O 수행 시 가상 스레드가 OS 스레드를 점유하여 성능 저하 유발
    - Java 21 초기 버전의 File I/O pinning 이슈는 패치로 해결됨 (21.0.1+)
    - 현재는 주로 `synchronized` 블록만 주의하며 `ReentrantLock` 사용 권장
- GC 튜닝과 인프라 비용
  - Java 8의 한계
    - 대용량 힙 사용 시 GC 중단 시간(STW) 증가로 인스턴스를 잘게 나누어야 했음
  - Java 21의 개선점
    - Generational ZGC로 대용량 힙에서도 짧은 중단 시간 유지 가능
    - TB 단위 힙에서 ZGC는 G1GC 대비 STW 시간을 수십 배 줄일 수 있음
    - 16GB 이하 힙에서는 G1GC가 오버헤드가 적어 효율적
    - Vertical Scaling이 가능해져 관리 포인트(Pod 수) 감소 및 CPU 절감 효과 기대
- 결론
  - 동기 방식(Spring MVC)으로 개발하면서 비동기 수준의 처리량을 확보 가능함

<br/><br/>

## 비교 및 장단점 요약

| 구분                | Java 8             | Java 11            | Java 17 (Recommended)         | Java 21 (Advanced)             |
| :------------------ | :----------------- | :----------------- | :---------------------------- | :----------------------------- |
| Spring Boot         | 2.x (EOL 2023.11)  | 2.x (EOL 2023.11)  | 3.x 필수 (최소 요구사항)      | 3.2+ 권장                      |
| LTS 종료            | 2030 (Temurin)     | 2027               | 2029                          | 2031 (예상)                    |
| GC 성능             | 보통 (Parallel GC) | 좋음 (G1GC 기본)   | 매우 좋음 (G1GC 최적화)       | 최상 (Gen-ZGC)                 |
| 컨테이너            | 8u191+ 지원        | 완전 지원          | Native 지원                   | Native 지원                    |
| 주요 문법           | Lambda, Stream     | var, HTTP Client   | record, switch 식, Text Block | Virtual Threads, Sequenced Col |
| 학습 곡선           | 낮음               | 중간               | 중간                          | 중상 (VT 이해 필요)            |
| 마이그레이션 난이도 | -                  | 높음 (모듈 시스템) | 중간 (Javax → Jakarta 주의)   | 낮음 (17 대비)                 |

<br/><br/>

## 선택 가이드

### Scenario A - 신규 프로젝트 (Greenfield)

- 추천
  - Java 21
- 이유
  - Virtual Threads를 활용해 고성능 I/O 처리가 가능함
  - 복잡한 WebFlux(Reactive)를 배우지 않아도 높은 동시성을 처리할 수 있어 시스템 복잡도가 낮아짐
  - SequencedCollection 등 편리한 API를 바로 사용할 수 있음

### Scenario B - Spring Boot 3.x 학습 및 실무 도입

- 추천
  - Java 17 이상
- 이유
  - Spring Boot 3.0부터는 Java 17이 강제됨
  - Java 8이나 11로는 Spring Boot 3를 구동할 수 없음

### Scenario C - 레거시 마이그레이션 (Java 8 → ?)

- 전략
  - Java 17로 직행 권장 (Skip Java 11)
- 이유
  - Java 11로 가는 비용이나 17로 가는 비용이나 비슷함
  - 누적된 기술 부채 해결 관점에서 성능 이점과 언어적 기능이 더 강력한 17로 한 번에 가는 것이 비용 효율적임
- Java 11을 거쳐야 하는 경우
  - Spring Boot 2.7 마이그레이션 후 3.x로 단계적 전환이 필요한 대규모 레거시
  - 의존성 라이브러리가 17을 아직 지원하지 않는 경우
  - 리스크 최소화가 중요한 보수적 조직
- 주의사항
  - javax → jakarta 패키지 변경
    - Java 11에서 Java EE 모듈 제거 (JAXB, JAX-WS 등)
    - Jakarta EE 9+에서 패키지명 변경 (javax.servlet → jakarta.servlet)
    - Spring Boot 3가 Jakarta EE 9를 채택하면서 영향
    - 의존성 라이브러리(Hibernate, Tomcat 등) 버전을 대거 올려야 함

### Scenario D - Java 21 도입 시 고려사항

- 도입 권장 상황
  - 고동시성 I/O 처리가 필요한 신규 프로젝트
  - Virtual Threads를 적극 활용하고자 하는 팀
  - Spring Boot 3.2+ 사용 계획이 있는 경우
- 신중해야 하는 상황
  - 팀의 Virtual Threads 이해도가 낮은 경우
  - 프로덕션 안정성 요구사항이 높은 경우 (21은 아직 신규)
  - 의존 라이브러리의 21 지원 여부가 불확실한 경우
  - 보수적 조직이라면 17도 충분히 좋은 선택임

<br/><br/>

## JVM 배포판 비교

| 배포판          | 라이센스    | LTS 지원 | 추천 용도           |
| :-------------- | :---------- | :------- | :------------------ |
| Oracle JDK      | 상용 (유료) | 8년      | 엔터프라이즈 상용   |
| Eclipse Temurin | GPLv2+CE    | 무료     | 가장 추천 (범용)    |
| Amazon Corretto | GPLv2+CE    | 무료     | AWS 환경            |
| Azul Zulu       | GPLv2+CE    | 무료     | Azure 환경          |
| GraalVM         | 여러 버전   | 다양     | Native Image 필요시 |

<br/><br/>

## Java 8 → 17 마이그레이션 체크리스트

### 1단계 - 호환성 확인

- 의존 라이브러리의 17 지원 버전 확인
- JUnit 4 → 5 전환 계획
- Mockito, AssertJ 등 테스트 도구 업데이트

### 2단계 - Spring Boot 업그레이드

- 2.x → 3.x 마이그레이션 가이드 검토
- javax → jakarta 패키지 일괄 변경
- application.yml 호환성 확인

### 3단계 - 빌드 도구

- Maven/Gradle 플러그인 업데이트
- Docker 베이스 이미지 변경 (openjdk:8 → eclipse-temurin:17)

### 4단계 - 성능 검증

- 로컬/스테이징 환경 테스트
- GC 로그 분석 및 튜닝
- 프로덕션 카나리 배포

<br/><br/>

## Reference

- [Oracle JDK 17 Release Notes](https://www.oracle.com/java/technologies/javase/17all-relnotes.html)
- [Oracle JDK 21 Release Notes](https://www.oracle.com/java/technologies/javase/21all-relnotes.html)
- [Spring Boot 3.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes)
