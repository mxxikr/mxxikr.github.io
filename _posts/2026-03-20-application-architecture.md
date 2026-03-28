---
title: '애플리케이션 아키텍처란?'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-03-20 10:00:00 +0900
category: [Software Engineering, Architecture]
tags: [architecture, mvc, layered, hexagonal, clean-architecture, onion, ddd]
math: false
mermaid: true
---
# 개요

- **애플리케이션 아키텍처**(Application Architecture)란 하나의 서비스 또는 단일 서버 내부에 존재하는 코드, 모듈, 계층(Layer)들을 어떻게 설계하고 조직화할 것인지 정의하는 내부적인 구조 패턴임
- 시스템 아키텍처가 거시적인 서버와 인프라의 배치 문제라면, 애플리케이션 아키텍처는 코드의 유지보수성, 테스트 확장성, 핵심 도메인 보호를 위한 미시적인 설계 영역임

<br/><br/>

## MVC (Model-View-Controller)

![MVC 패턴 다이어그램](/assets/img/architecture/2026-03-20-application-architecture/mvc.png)

- 사용자 인터페이스(UI)를 구성하는 가장 기본적인 디자인 패턴임
- **특징**
  - Model(데이터와 비즈니스 로직), View(화면), Controller(입력 및 흐름 제어)로 역할을 분리함
- 백엔드에서는 View를 제외하고 JSON 포맷의 데이터를 반환하는 REST API 컨트롤러 형태로 변형되어 주로 사용됨
- 비즈니스 로직이 복잡해지면 Controller나 Model이 거대해지는(Fat Controller) 단점이 존재함

<br/><br/>

## 계층형 아키텍처 (Layered Architecture)

- 애플리케이션을 여러 개의 수평적 계층(Layer)으로 나누어, 상위 계층이 하위 계층에 의존하도록 설계한 구조

- **일반적인 3계층 구조**
  - `Presentation Layer` (Controller)
    - 사용자 요청(HTTP) 처리
  - `Business Layer` (Service)
    - 핵심 비즈니스 로직 처리
  - `Data Access Layer` (Repository)
    - 데이터베이스 통신

### 장단점

- **장점**
  - 직관적이고 구현이 쉬워 대부분의 웹 프레임워크 초기 튜토리얼에서 표준처럼 사용됨
- **단점 (데이터베이스 주도 설계)**
  - 가장 하위 계층에 DB가 존재하므로, 영속성 계층(JPA 등 인프라 기술)에 가장 중요한 도메인 로직(Service)이 종속됨
  - 도메인 룰을 변경하려 할 때 DB 테이블 설계부터 먼저 고민하게 되는 한계가 있음


<br/><br/>

## Onion / Clean / Hexagonal 비교

* 세 아키텍처 모두 "핵심 비즈니스 규칙(도메인)을 가장 내부에 두고, 모든 의존성은 외부에서 내부(도메인)로 향한다"는 본질적인 철학을 완벽히 공유함
- 용어와 경계의 차이만 있을 뿐 목표는 동일함

### 어니언 아키텍처 (Onion Architecture)

![어니언 아키텍처 다이어그램](/assets/img/architecture/2026-03-20-application-architecture/onion.png)

- 애플리케이션을 양파 껍질처럼 파악하며, 중심부로 갈수록 기술과 무관한 순수 비즈니스 로직에 집중함
- `Infrastructure -> UI -> Application Service -> Domain Model` 구조로 향함

### 클린 아키텍처 (Clean Architecture)

![클린 아키텍처 다이어그램](/assets/img/architecture/2026-03-20-application-architecture/clean.png)

- 로버트 C. 마틴(Uncle Bob)이 제안한 아키텍처로, 기존 구조들을 통합하고 정립함
- 의존성 규칙(Dependency Rule)을 강제하며, 내부 계층은 외부 계층의 코드에 대해 전혀 알지 못해야 함
- `Frameworks & Drivers -> Interface Adapters -> Application Business Rules (Use Cases) -> Enterprise Business Rules (Entities)` 순으로 구성됨

### 헥사고날 아키텍처 (Hexagonal / Ports and Adapters)

![헥사고날 포트와 어댑터 패턴](/assets/img/architecture/2026-03-20-application-architecture/hexagonal.png)

- 알리스테어 코오번이 제안하였으며 "포트와 어댑터(Ports and Adapters)" 패턴이라고도 불림
- 핵심 도메인을 육각형 중앙에 두고, 외부와의 모든 통신은 `포트(인터페이스)`를 통과해야 함
- **Inbound (Driving) Adapter**
  - 도메인을 호출하는 외부 요청 (ex. REST Controller, 브라우저)
- **Outbound (Driven) Adapter**
  - 도메인이 호출하는 외부 시스템 (ex. 외부 API 클라이언트, DB Repository)
- 구현 기술이 변경되더라도(ex. MySQL -> MongoDB) 어댑터만 갈아끼우면 되므로 도메인 코드는 1줄도 수정할 필요가 없음

<br/><br/>

## 도메인 주도 설계 (DDD, Domain-Driven Design)

![DDD 애그리거트 매핑 다이어그램](/assets/img/architecture/2026-03-20-application-architecture/ddd.png)

- DDD는 구체적인 아키텍처(구조)라기보다는, 복잡한 비즈니스 로직을 효과적으로 소프트웨어로 구현하기 위한 **설계 방법론 및 철학**임
- **보편적 언어(Ubiquitous Language)**
  - 비즈니스 전문가(기획자)와 개발자가 일상적으로 사용하는 동일한 언어로 코드를 작성하여 의사소통 비용을 줄임
- **전술적/전략적 설계**
  - 바운디드 컨텍스트(Bounded Context), 애그리거트(Aggregate), 엔티티(Entity), 값 객체(Value Object) 등의 개념을 통해 도메인을 모델링함
- **아키텍처와의 결합**
  - DDD의 도메인 모델은 순수해야 하므로, 인프라에 오염되지 않는 `헥사고날 아키텍처`나 `클린 아키텍처`와 결합될 때 가장 이상적인 시너지를 발휘함