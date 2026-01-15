---
title: 코틀린의 탄생 배경과 특징
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-12-21 20:30:00 +0900
category: [Language, Kotlin]
tags: [kotlin, language, jetbrains]
math: true
mermaid: true
---
# 개요

- 코틀린은 JetBrains가 자신들의 IDE 제품 개발을 위해 Java와 Scala의 문제점을 해결하기 위해 개발한 프로그래밍 언어
- 2011년 7월 19일 JVM Language Summit에서 Dmitry Jemerov가 처음 공개
- 2012년 2월에 Apache 2 License 하에 오픈소스로 전환
- 2017년 Google I/O에서 Android 공식 개발 언어로 채택되면서 폭발적으로 성장

<br/><br/>

## 코틀린의 탄생 배경

- JetBrains는 IntelliJ IDEA와 같은 IDE를 개발하는 과정에서 기존 프로그래밍 언어들의 한계 확인
- 당시 JetBrains는 IntelliJ 기반의 모든 IDE를 거의 전적으로 Java로 작성하고 있었고, 더 생산적인 언어로 전환 희망

### Scala 도입 검토와 실패

- 초기에 JetBrains는 Scala 언어를 검토했으나 치명적인 문제 발견
- 당시 Dmitry Jemerov는 다음과 같이 상황을 설명
    > "대부분의 JVM 언어들이 우리가 찾던 기능을 갖추지 못했으며 Scala가 유일한 예외였다. 하지만 Scala는 컴파일 속도 등의 이슈가 있었다"
- 특히 Scala의 암묵성(Implicit) 개념은 컴파일러의 성능을 저하시킬 뿐만 아니라, IDE의 분석 도구 개발을 어렵게 만듦
- 이미 거대한 코드베이스를 가진 JetBrains 입장에서, Scala의 느린 컴파일 속도는 도저히 수용할 수 없는 결함

### Java의 한계

- Java는 안정적이고 검증된 언어지만 여러 제약 존재
- Java의 과도한 보일러플레이트 코드는 생산성을 저해했고, Null 안전성의 부재로 인한 NullPointerException은 런타임 오류의 주요 원인
    - *Getter/Setter, 반복되는 try-catch 등은 실제 중요한 비즈니스 로직을 가려 코드의 독해력을 떨어뜨림*
- 또한 Java의 느린 진화 속도(당시 Java 7에는 람다가 없었음)와 Oracle의 Java 통제라는 불확실성도 고려

<br/><br/>

## 개발 목적

- JetBrains가 코틀린을 만든 이유는 구체적인 기술적 필요성과 비즈니스적 목표의 결합

### 기술적 목표

- **완벽한 Java 상호운용성**
    - 기존 Java 코드베이스와 100% 상호운용이 가능하도록 설계
        - *Kotlin은 별도의 런타임 없이 표준 Java 바이트코드를 생성하여 JVM에서 직접 실행되므로 Java 클래스와 메서드를 오버헤드 없이 즉시 호출 가능*
    - 이를 통해 점진적으로 Java에서 Kotlin으로 마이그레이션할 수 있으며 Java의 방대한 생태계(Spring, Hibernate 등)를 그대로 활용 가능
- **빠른 컴파일 속도와 명시성**
    - Scala의 실패를 반면교사 삼아, 컴파일러 성능을 떨어뜨리는 암묵적(Implicit) 요소들을 제거하고 명시적인 설계를 채택
        - *Scala의 `Implicit` 기능은 컴파일러의 빌드 속도 저하뿐만 아니라, IDE가 코드를 파악하여 자동완성/리팩토링 기능을 제공하는 것을 매우 어렵게 만들었음*
    - 초기 목표는 Java만큼 빠른 컴파일 속도였으며 증분 컴파일(Incremental Compilation) 등을 통해 간극을 지속적으로 축소
- **서버 사이드 및 엔터프라이즈 지원 강화**
    - 단순 모바일용 언어가 아닌 범용 엔터프라이즈 언어로 설계
    - Spring Boot의 전폭적인 지원과 Ktor 같은 코틀린 전용 프레임워크를 통해 서버 사이드 개발에서도 강력한 입지 구축

### 비즈니스적 목표

- **IDE 시장 점유율 확대**
    - JetBrains의 핵심 사업은 IDE 판매이며 새로운 언어는 IDE의 자연스러운 보완물
        - *언어를 만든 회사가 제공하는 IDE가 가장 완벽한 도구 지원을 제공할 것이라는 신뢰가 IntelliJ IDEA의 판매 증가로 이어짐*
    - 코틀린 채택 기업들이 IntelliJ IDEA 같은 JetBrains IDE를 선택할 확률 증가
- **고객 이탈 방지**
    - Lock-in 전략
    - 새로운 언어나 프레임워크가 등장하면 개발자들은 해당 생태계로 이동하는 경향 존재
    - JetBrains 생태계 안에 개발자들을 머무르게 하는 '접착제'로서 자체 언어를 개발하여, 경쟁 IDE로의 이탈 위협에 선제적으로 대응

<br/><br/>

## 코틀린의 해결책과 특징

- 코틀린은 Java의 단점을 해결하기 위해 생산성, 안전성, 편의성을 갖춘 기능 제공

### 생산성과 가독성

- **보일러플레이트 제거**
    - 간결함보다는 가독성을 최우선 목표로 설계하여 Java 대비 코드 양을 획기적으로 감소
    - Getter/Setter, equals/hashCode/toString, 생성자 등을 data class 하나로 해결
- **데이터 홀더 비교 (POJO vs data class)**
    - **Java**
        ```java
        public class User {
            private final String name;
            private final int age;

            public User(String name, int age) {
                this.name = name;
                this.age = age;
            }

            public String getName() { return name; }
            public int getAge() { return age; }
            // equals, hashCode, toString 생략...
        }
        ```
    - **Kotlin**
        ```kotlin
        data class User(
            val name: String,
            val age: Int,
        )
        ```

### 안전성

- **Null Safety System**
    - 변수를 nullable(String?)과 non-nullable(String)로 명시적으로 구분하여 컴파일 시점에 NullPointerException 방지
- **Smart Cast**
    - 타입 체크(if) 후에는 자동으로 해당 타입으로 캐스팅되어, 불필요한 명시적 캐스팅 코드 제거
- **Null 처리 및 스마트 캐스트**
    - **Null 처리**
        ```kotlin
        val name = user?.department?.managerName
        ```
    - **스마트 캐스트**
        ```kotlin
        if (obj is String) {
            // obj가 자동으로 String으로 캐스팅되어 length 사용 가능
            print(obj.length)
        }
        ```

### 편의성과 상호운용성

- **확장 함수 (Extension Functions)**
    - 기존 클래스(Java SDK 포함)를 수정하지 않고도 새로운 기능을 추가하는 것처럼 사용 가능
    - JetBrains가 Java의 방대한 라이브러리를 그대로 쓰면서도 코틀린 스타일로 편리하게 사용할 수 있었던 핵심 비결
    - **예시: Java String에 `lastChar` 기능 추가**
        ```kotlin
        // String 클래스를 수정하지 않고도 함수 추가 가능
        fun String.lastChar(): Char = this.get(this.length - 1)

        val c = "Kotlin".lastChar() // 마치 String의 메소드인 것처럼 호출
        ```


### 최신성

- **비동기 프로그래밍 (Coroutines)**
    - 콜백 지옥 없이 비동기 코드를 동기 코드처럼 직관적으로 작성 (`suspend` 키워드 활용)
        - *OS 스레드를 차단(Blocking)하지 않고 작업만 일시 중단(Suspend)하므로 적은 수의 스레드로 대규모 동시성 처리가 가능*

<br/><br/>

## Spring 백엔드 관점에서의 효용

- **Null-safe 타입 시스템 (NPE 방어 코드 제거)**
    - Java Controller
        ```java
        @GetMapping("/users/{id}")
        public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
            User user = userService.findById(id); // null 가능성
            if (user == null) return ResponseEntity.notFound().build();
            // ...방어 로직 반복...
        }
        ```
    - Kotlin Controller
        ```kotlin
        @GetMapping("/users/{id}")
        fun getUser(@PathVariable id: Long): ResponseEntity<UserDto> {
            // ?: 연산자로 404 처리를 강제하고 우아하게 표현
            val user = userService.findById(id) ?: return ResponseEntity.notFound().build()
            return ResponseEntity.ok(UserDto(user.name))
        }
        ```
- **Data Class (DTO 보일러플레이트 삭제)**
    - Java DTO의 수십 줄 코드를 `data class` 한 줄로 대체하여, 수백 개의 DTO/VO가 필요한 엔터프라이즈 환경에서 압도적인 생산성 제공
    - *단, JPA Entity로 사용 시에는 `toString()`, `hashCode()`가 연관 관계 매핑에서 순환 참조나 성능 이슈를 일으킬 수 있으므로 주의 필요 (일반 클래스 사용 권장)*
- **코루틴 (블로킹 없는 대규모 동시성)**
    - WebFlux나 Ktor에서 복잡한 리액티브 체이닝(Map/FlatMap) 없이, 비즈니스 로직을 순차적인 명령형 코드처럼 작성하면서도 논블로킹으로 동작

<br/><br/>

## 장단점과 주의사항

### 장점

- **간결하고 가독성 좋은 문법**
    - 코드가 Java 대비 20–40% 감소
- **Null 안전·타입 안전**
    - 런타임 오류 발생 빈도 현저히 낮음
- **강력한 서버 사이드 생태계**
    - Spring Boot의 공식 지원 및 Ktor 활용
- **Java 생태계 재사용**
    - 기존 Java 라이브러리 및 JVM 인프라 100% 활용

### 단점 및 주의사항

- **빌드 속도**
    - 증분 컴파일로 많이 개선되었으나 Clean Build 시에는 여전히 Java보다 느림ㄴ
- **기본 final 클래스 정책**
    - 코틀린의 클래스는 기본적으로 상속 불가(final)이므로 Spring AOP/JPA 프록시 사용 시 주의 필요 (kotlin-spring 플러그인(all-open)으로 자동 해결)
- **과도한 DSL 남용 주의**
    - 확장 함수나 연산자 오버로딩을 남용하면 '마법 같은 코드'가 되어 가독성과 유지보수성을 해칠 수 있음
- **러닝 커브와 Gradle 구성**
    - 코루틴, KMP 등 고급 기능의 학습 곡선이 있으며 Gradle Script를 Groovy로 할지 Kotlin DSL로 할지 선택 필요

<br/><br/>


## JVM 및 JetBrains 생태계와의 관계

![JVM Interoperability](/assets/img/kt/jvm_interop.png)

- **JVM 타겟과 런타임**
    - Kotlin/JVM은 Java와 동일한 바이트코드를 생성하므로 GC, JIT 컴파일러, 스레드 모델 등 JVM의 런타임 특성을 그대로 따름
- **생태계 재사용**
    - JVM 위에서 동작하므로 Spring, Netty 등 기존 실무 프레임워크를 100% 재사용
- **JetBrains 언어 생태계**
    - JetBrains MPS(메타 언어)나 IDE 스크립트 언어와 달리, Kotlin은 범용 애플리케이션 개발을 위한 핵심 주력 언어

<br/><br/>

## 결론

- 코틀린은 단순히 "더 나은 언어를 만들겠다"는 엔지니어의 이상보다는 **"당장 내일의 업무를 편하게 만들겠다"는 JetBrains의 필요에 의해 탄생한 언어**
- 학문적인 완벽함보다는 기존 Java 생태계를 100% 활용하면서 생산성을 높이는 **'실용주의(Pragmatism)'**를 선택
- 이러한 철학 덕분에 코틀린은 구글 안드로이드 공식 언어이자, 서버 사이드 개발의 강력한 대안으로 자리 잡음

<br/><br/>

## Reference

- [Kotlin Official Website](https://kotlinlang.org/)
- [JetBrains Blog - Why Kotlin?](https://blog.jetbrains.com/kotlin/2011/08/why-kotlin/)