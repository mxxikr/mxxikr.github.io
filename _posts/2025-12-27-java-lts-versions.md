---
title: "Java LTS 버전별 차이"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-27 17:55:00 +0900
category:
  - [Language, Java]
tags: [Java, Spring Boot, LTS, Backend]
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
  - 압도적인 레퍼런스, 안정성, 기존 라이브러리와의 완벽한 호환성
- 단점
  - 컨테이너 환경 효율 저하
    - 초기 버전은 cgroups 제한을 인식하지 못해 Heap Size 계산 오류가 빈번했음
    - 8u191 이후 백포팅되었으나 최신 JVM 대비 리소스 사용 최적화가 부족함
  - 모던 프레임워크 지원 중단
    - Spring Boot 3.x 이상 사용 불가능
  - GC 성능
    - 구형 G1GC 사용으로 인해 대용량 힙 메모리 관리 시 STW(Stop-The-World) 시간이 김
  - 문법적 한계
    - var 키워드, record 등 모던 문법 부재로 코드가 장황함

### Java 11 (LTS, 2018)

- 컨테이너 환경 지원이 강화된 LTS 버전임
- Java 8 이후의 첫 번째 모던 LTS이자 컨테이너 환경을 제대로 지원하기 시작한 버전임
- 주요 특징
  - Module System (Jigsaw)
    - rt.jar가 쪼개지며 JRE가 가벼워졌으나 마이그레이션의 주된 고통 원인임
  - HTTP Client API
    - HttpUrlConnection을 대체하는 비동기 HTTP 클라이언트 내장
  - Lambda 파라미터 var 사용 가능
- 장점
  - Docker 및 K8s 환경에서 리소스 인식이 정확해짐
  - G1GC 성능 개선
- 단점
  - 과도기적 위치임
  - 현재 시점에서 8에서 넘어간다면 11을 거치지 않고 17로 직행하는 추세임

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
  - Java 8 대비 G1GC 처리량(Throughput) 및 지연시간(Latency) 약 20~30% 개선됨
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
- 비동기 및 논블로킹 처리의 패러다임을 바꿀 잠재력을 가진 버전임
- 주요 기능
  - Virtual Threads (Project Loom)
    - 기존 Java 스레드(OS 스레드 1:1 매핑)의 한계를 극복함
    - OS 스레드를 차단하지 않고 논리적인 경량 스레드를 수백만 개 생성 가능함
- 장점
  - 복잡한 Reactive Programming(WebFlux, Mono/Flux) 없이도 동기 코드 스타일로 비동기급 처리량을 달성 가능함
- 기타 특징

  - Sequenced Collections
    - `list.getFirst()`, `list.getLast()` 등 순서가 있는 컬렉션 처리가 일관성 있게 통합됨
  - Generational ZGC
    - TB(테라바이트) 단위 힙에서도 1ms 미만의 GC 중단 시간을 목표로 함
    - 작동 원리
      - 약한 세대 가설(Weak Generational Hypothesis)을 적용함
      - 대부분의 객체는 금방 소멸한다는 특성을 이용하여 Young Generation과 Old Generation을 분리하여 관리함
      - 수집 효율을 극대화하여 STW 시간을 최소화함
    - 활성화 방법
      - Java 21에서 기본값은 아니며 `-XX:+UseZGC -XX:+ZGenerational` 옵션 설정이 필요함
    - 선택 기준
      - 힙 크기가 16GB 이하인 경우 G1GC가 여전히 효율적일 수 있음
      - 수백 GB에서 TB(테라바이트) 단위의 대용량 힙 환경에서는 ZGC가 압도적으로 유리함
  - Virtual Threads vs Reactive

    - Reactive (WebFlux)
      - Context Switching 비용이 낮아 CPU 효율이 높으나 코드가 복잡하고 디버깅이 어려움
    - Virtual Threads

      - Blocking is Cheap
        - I/O 대기 시 JVM 내부의 가벼운 가상 스레드만 멈춤
      - 메모리 효율
        - 스레드당 수 KB 수준으로 OOM 위험 없이 수백만 개 생성 가능
      - 주의사항
        - CPU 집중 작업 (CPU-bound) 시 성능 저하가 발생할 수 있음
        - Thread Pinning 현상
          - `synchronized` 블록 내부에서 I/O 수행 시 가상 스레드가 OS 스레드를 점유하여 성능 저하를 유발함
          - 일부 OS 환경에서는 File I/O 작업 시에도 캐리어 스레드(OS 스레드)가 블로킹될 수 있음
          - 가급적 `ReentrantLock` 사용을 권장함

    - GC 튜닝과 인프라 비용
    - Java 8의 한계
      - 대용량 힙 사용 시 GC 중단 시간(STW) 증가로 인스턴스를 잘게 나누어야 했음
    - Java 21의 개선점
    - Generational ZGC로 대용량 힙에서도 짧은 중단 시간 유지 가능
    - Vertical Scaling이 가능해져 관리 포인트(Pod 수) 감소 및 CPU 절감 효과 기대
    - 결론
      - 동기 방식(Spring MVC)으로 개발하면서 비동기 수준의 처리량을 확보 가능함

<br/><br/>

## 비교 및 장단점 요약

| 구분                | Java 8            | Java 11            | Java 17 (Recommended)         | Java 21 (Advanced)             |
| :------------------ | :---------------- | :----------------- | :---------------------------- | :----------------------------- |
| Spring Boot         | 2.x 지원 (종료됨) | 2.x 지원 (종료됨)  | 3.x 필수 (최소 요구사항)      | 3.2+ 권장                      |
| GC 성능             | 보통 (STW 김)     | 좋음               | 매우 좋음 (G1GC 최적화)       | 최상 (Gen-ZGC)                 |
| 컨테이너            | 지원 미흡 (초기)  | 지원               | Native 지원                   | Native 지원                    |
| 주요 문법           | Lambda, Stream    | var, HTTP Client   | record, switch 식, Text Block | Virtual Threads, Sequenced Col |
| 마이그레이션 난이도 | -                 | 높음 (모듈 시스템) | 중간 (Javax -> Jakarta 주의)  | 낮음 (17 대비)                 |

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

### Scenario C - 레거시 마이그레이션 (Java 8 -> ?)

- 전략
  - Java 17로 직행 (Skip Java 11)
- 이유
  - Java 11로 가는 비용이나 17로 가는 비용이나 비슷함
  - 누적된 기술 부채 해결 관점에서 성능 이점과 언어적 기능이 훨씬 강력한 17로 한 번에 가는 것이 비용 효율적임
- 주의사항
  - javax 패키지 삭제
    - Java 언어 자체의 변화가 아닌 Spring Boot 3가 의존하는 Jakarta EE 9 스펙 변경에 기인함
    - Java EE 모듈이 제거되고 Jakarta EE로 이름이 바뀜 (javax.servlet -> jakarta.servlet 등)
    - 의존성 라이브러리(Hibernate, Tomcat 등) 버전을 대거 올려야 함

<br/><br/>

<br/><br/>

## Reference

- [Oracle JDK 17 Release Notes](https://www.oracle.com/java/technologies/javase/17all-relnotes.html)
- [Oracle JDK 21 Release Notes](https://www.oracle.com/java/technologies/javase/21all-relnotes.html)
- [Spring Boot 3.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes)
