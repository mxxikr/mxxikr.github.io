---
title: build.gradle.kts와 Kotlin Script, DSL의 이해
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-11 12:00:00 +0900
category: [Language, Kotlin]
tags: [kotlin, gradle, build-script, dsl, groovy, type-safety, kotlin-dsl, kotlin-script]
math: false
mermaid: false
---
# 개요

- 빌드 도구는 Maven의 XML, Groovy DSL을 거쳐 Kotlin DSL로 발전해옴
- Java와 Kotlin의 빌드 파일 차이와 각각의 선택 배경을 이해함
- `.kts` 확장자의 의미와 Kotlin Script의 실행 방식을 학습함
- DSL의 개념과 Lambda with Receiver를 활용한 Gradle Kotlin DSL의 동작 원리를 파악함

<br/><br/>

## 빌드 도구의 발전 과정

### 빌드 도구란

- 개발자가 작성한 소스 코드를 실행 가능한 애플리케이션으로 변환하는 과정을 자동화함
- 의존성 관리, 컴파일, 테스트, 패키징 등의 작업을 정의하고 실행함
- 프로젝트가 커질수록 수동으로 관리하기 어려운 작업들을 일관되게 처리함

### Maven과 XML 방식

- Maven은 XML 기반의 `pom.xml` 파일로 빌드를 정의함
- 데이터 구조 표현에는 적합하지만 프로그래밍 로직 구현에는 부적합함

  ```xml
  <!-- pom.xml -->
  <dependency>
      <groupId>org.example</groupId>
      <artifactId>my-lib</artifactId>
      <version>1.0</version>
  </dependency>
  ```

- 조건문이나 반복문 같은 로직이 필요하면 XML이 매우 복잡해짐

### Gradle과 Groovy DSL

- Groovy는 동적 타입 언어로 간결한 스크립트 작성이 가능함
- XML보다 훨씬 읽기 쉽고 프로그래밍 언어처럼 보임

  ```groovy
  // build.gradle
  dependencies {
      implementation 'org.example:my-lib:1.0'  // 의존성 추가
  }
  ```

- 동적 타입이라서 IDE가 자동완성을 제대로 제공하지 못하는 한계가 있음
- 런타임에야 오류를 발견할 수 있어 타입 안전성이 부족함

<br/><br/>

## Java가 build.java를 사용하지 않는 이유

### 선언과 코드의 분리 철학

- Java는 빌드 설정을 프로그래밍이 아닌 선언적 방식으로 접근함
- 빌드 파일은 "무엇을 하고 싶은가"를 명시하고 "어떻게 하는가"는 도구에 맡김
- 빌드 로직과 애플리케이션 코드를 서로 다른 관심사로 분리함

  ```java
  // 이런 식으로 작성하지 않음
  public class BuildConfig {
      public static void main(String[] args) {
          addDependency("org.example:lib:1.0");
          setTargetVersion("11");
      }
  }
  ```

### 영속성과 버전 관리

- 빌드 파일은 버전 관리 시스템에 포함되어 여러 개발자가 공유함
- 복잡한 프로그래밍 로직이 들어가면 유지보수가 어려워짐
- 선언적 스타일로 작성하면 누가 보더라도 이해하기 쉬움

### 도구의 역할 명확화

- 빌드 도구가 빌드 파일을 읽고 해석하는 책임을 가짐
- 개발자는 설정만 제공하고 실제 빌드 과정은 도구가 처리함
- 이러한 분리가 Java 의 오랜 전통임

### 기술적 한계

1. 스크립팅 미지원

   - Java는 전통적으로 스크립팅을 기본 지원하지 않음
   - 모든 Java 코드는 컴파일이 필요함 (Gradle 등장 당시 기준)
   - Java 11(2018)부터 제한적인 스크립트 기능 추가, 하지만 Gradle은 2007년 등장함

2. 빌드 설정용으로 부적합

   - 빌드 설정을 Java로 작성하려면 별도 컴파일 과정 필요함
   - 설정 파일 수정 시마다 컴파일이 필요하여 비효율적임
   - 빌드 도구가 또 다른 빌드 과정을 요구하는 모순이 발생함

<br/><br/>

## Kotlin이 build.kts를 채택한 이유

### 좋은 언어면 무엇이든 표현할 수 있어야 한다

- Kotlin의 철학은 언어 자체로 모든 것을 표현하는 것임
- 빌드 설정도 코드의 일부로 보고 타입 안전성을 제공함

  ```kotlin
  // build.gradle.kts (Kotlin DSL)
  dependencies {
      implementation("org.example:my-lib:1.0")  // 의존성 추가
  }
  ```

### 정적 타입 검사를 통한 타입 안전성

- Groovy는 동적 타입이라 런타임 에러가 발생함
- Kotlin은 정적 타입이라 컴파일 타임에 오류를 잡아냄

  ```groovy
  // Groovy (동적 타입)
  dependencies {
      implementation 'org.example:my-lib:1.0'  // 정상 동작
      implementatio 'org.example:other:1.0'  // 오타 -> 런타임 에러
  }
  ```

  ```kotlin
  // Kotlin (정적 타입)
  dependencies {
      implementation("org.example:my-lib:1.0")  // 정상 동작
      implementatio("org.example:other:1.0")  // 컴파일 에러 -> 즉시 발견
  }
  ```

### IDE 자동완성 지원

- Groovy는 동적 타입이라 IDE가 메서드를 정확히 추론하지 못함
- Kotlin은 정적 타입이라 IntelliJ IDEA가 자동완성을 제공함

  ```kotlin
  dependencies {
      implement  // IDE가 implementation(...)을 자동완성
  }
  ```

### 안전한 리팩토링

- Groovy 빌드 파일을 리팩토링하면 IDE가 모든 참조를 찾지 못할 수 있음
- Kotlin은 정적 타입이라 IDE가 모든 참조를 추적하여 안전하게 리팩토링 가능함

<br/><br/>

## `.kts` 파일 확장자의 의미

### Kotlin Script의 약자

```
build.gradle.kts
```

- `.kts`
  - Kotlin Script
- `.kt`
  - 일반 Kotlin 소스 파일
- `.gradle.kts`
  - Gradle 빌드 파일

### Gradle과 확장자의 관계

- `build.gradle`은 Groovy DSL을 사용함
- `build.gradle.kts`는 Kotlin DSL을 사용함
- Gradle은 파일 확장자를 보고 어떤 DSL을 사용할지 판단함

<br/><br/>

## Kotlin Script

### .kt와 .kts 차이

- `.kt`는 일반 Kotlin 파일로 컴파일 후 실행하는 프로그램임
- `.kts`는 Kotlin Script로 컴파일과 실행이 한 번에 자동 처리됨
- 스크립트는 Python이나 Bash처럼 위에서 아래로 순차 실행됨

### .kt 파일의 실행 방식

- `main()` 함수가 필수임
- 컴파일과 실행이 분리됨
- Java처럼 바이트코드로 변환 후 JVM에서 실행됨

```kotlin
// hello.kt
fun main() {
    println("Hello, World!")
    greet("John")
}

fun greet(name: String) {
    println("Hi, $name!")
}
```

- 실행 방법

  ```bash
  # 컴파일
  kotlinc hello.kt -include-runtime -d hello.jar

  # 실행
  java -jar hello.jar
  ```

### .kts 파일의 실행 방식

- `main()` 함수가 불필요함
- 최상위 레벨 코드가 직접 실행됨
- 컴파일과 실행이 한 번에 처리됨

  ```kotlin
  // hello.kts
  fun greet(name: String) {
      println("Hi, $name!")
  }

  println("Hello, World!")  // 최상위 코드, main 없이 실행
  greet("John")
  ```

- 실행 방법

  ```bash
  # 컴파일과 실행이 한 번에
  kotlinc -script hello.kts
  ```

### main 함수가 필요 없는 이유

- 스크립트는 위에서 아래로 순차 실행되는 방식임
- 진입점을 명시할 필요가 없음
- Python, Bash와 동일한 실행 패턴임

  ```python
  # Python 스크립트
  print("Hello")
  for i in range(5):
      print(i)
  ```

  ```kotlin
  // Kotlin 스크립트
  println("Hello")
  for (i in 1..5) {
      println(i)
  }
  ```

- 일반 프로그램은 여러 함수와 클래스가 섞여 있어 시작점을 지정해야 하지만 스크립트는 파일 전체가 순차 실행됨

### 스크립트 실행 방법

- kotlinc -script 사용

  ```bash
  kotlinc -script my-script.kts
  ```

- Shebang으로 직접 실행

  ```kotlin
  #!/usr/bin/env kotlin
  // hello.kts

  println("Hello, World!")
  ```

  ```bash
  chmod +x hello.kts
  ./hello.kts  # bash 스크립트처럼 실행
  ```

### build.gradle.kts 실행 과정

- 파일 감지
  - Gradle이 프로젝트 루트에서 `build.gradle.kts` 파일을 찾음
- 컴파일
  - Kotlin 컴파일러로 스크립트를 컴파일함 (결과는 캐시됨)
- 실행 및 설정 등록
  - 컴파일된 코드를 실행하면서 플러그인, 의존성 등이 등록됨
- 태스크 그래프 구성
  - 등록된 설정으로 태스크 의존성 그래프를 생성함
- 태스크 실행

  - 요청된 태스크를 실행함

  ```kotlin
  // build.gradle.kts
  plugins {
      kotlin("jvm") version "1.9.0"  // 플러그인 등록
  }

  dependencies {
      implementation("org.example:lib:1.0")  // 의존성 등록
  }
  // 이후 Gradle이 이 정보로 태스크 그래프 생성
  ```

### 실제 사용 사례

- Gradle 빌드 파일

  ```kotlin
  // build.gradle.kts
  plugins {
      kotlin("jvm") version "1.9.0"  // Kotlin JVM 플러그인
      application  // Application 플러그인
  }

  dependencies {
      implementation("org.example:lib:1.0")  // 런타임 의존성
      testImplementation("org.junit.jupiter:junit-jupiter:5.9.0")  // 테스트 의존성
  }

  application {
      mainClass.set("com.example.AppKt")
  }
  ```

- 자동화 스크립트

  ```kotlin
  // deploy.kts
  import java.io.File

  val version = "1.0.0"
  val buildDir = File("build")

  println("Starting deployment of version $version...")

  buildDir.deleteRecursively()
  println("Cleaned build directory")

  println("Building application...")
  println("Deployment complete!")
  ```

  ```bash
  kotlinc -script deploy.kts
  ```

- 명령줄 도구

  ```kotlin
  // cli-tool.kts
  // args는 스크립트에서 암묵적으로 제공됨
  when {
      args.contains("--help") -> println("Usage: ./cli-tool.kts [options]")
      args.contains("--version") -> println("1.0.0")
      else -> println("Running tool...")
  }
  ```

  ```bash
  kotlinc -script cli-tool.kts --help
  ```

### 스크립트에서 함수 정의와 호출

```kotlin
// script.kts
fun calculateSum(a: Int, b: Int): Int {
    return a + b
}

fun greet(name: String) {
    println("Hello, $name!")
}

// 최상위 코드로 직접 실행
println("Welcome to Kotlin Script!")
greet("Alice")

val result = calculateSum(5, 3)
println("5 + 3 = $result")

for (i in 1..3) {
    println("Iteration $i")
}
```

### 성능 비교

- Kotlin Script는 첫 실행 시 컴파일이 필요하지만, 이후 캐시를 활용하여 빠르게 실행됨

  | 측면             | .kt 파일             | .kts 파일                      |
  | ---------------- | -------------------- | ------------------------------ |
  | **첫 실행**      | 빠름 (미리 컴파일됨) | 약간 느림 (컴파일 + 캐시 생성) |
  | **두 번째 실행** | 동일 (jar 실행)      | 매우 빠름 (컴파일 캐시 재사용) |
  | **수정 후 실행** | 느림 (재컴파일 필요) | 빠름 (변경 부분만 재컴파일)    |
  | **배포**         | 안정적 (jar 파일)    | 의존성 필요 (Kotlin 런타임)    |

<br/><br/>

## Groovy와 Kotlin DSL 비교

### Groovy DSL 예시

```groovy
// build.gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.0'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

repositories {
    mavenCentral()
}

java {
    sourceCompatibility = '17'
}
```

### Kotlin DSL 예시

```kotlin
// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "3.0.0"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

repositories {
    mavenCentral()
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
}
```

### 주요 차이점

- Kotlin은 문자열을 큰따옴표로 감싸야 함
- Kotlin은 메서드 호출 시 괄호 필수임
- IDE에서 `sourceCompatibility`를 입력하면 자동완성이 정확함
- 오타가 있으면 컴파일 시점에 에러를 감지함

<br/><br/>

## DSL의 개념

### Domain-Specific Language의 정의

- 특정 문제 해결을 위해 설계된 작은 언어임
- 일반적인 프로그래밍 언어와 달리 특정 도메인에 특화됨

### 일반 프로그래밍 언어와의 차이

| 구분          | 일반 프로그래밍 언어 (Java, Kotlin) | 도메인 특화 언어 (DSL)         |
| ------------- | ----------------------------------- | ------------------------------ |
| **용도**      | 모든 종류의 소프트웨어 개발         | 특정 문제 (빌드 설정, 쿼리 등) |
| **문법**      | 일반적이고 복잡함                   | 간결하고 특화됨                |
| **학습 곡선** | 가파름                              | 낮음                           |
| **적용 범위** | 광범위함                            | 제한적임                       |

### Gradle Kotlin DSL의 특징

- Kotlin이라는 일반 프로그래밍 언어를 기반으로 함
- Gradle 빌드 설정에 특화된 DSL을 만듦
- Lambda with receiver 문법을 활용하여 간결한 구문을 제공함

  ```kotlin
  dependencies {  // DSL 블록
      implementation(...)  // DSL 함수
  }
  ```

### Lambda with Receiver 설명

- Kotlin의 Lambda with receiver는 블록 안에서 특정 객체를 암묵적으로 사용할 수 있게 함
- Gradle DSL에서 `dependencies` 블록 안은 `DependencyHandler` 객체가 receiver임
- 블록 안에서 `this`를 생략하고 메서드를 바로 호출 가능함

  ```kotlin
  // Lambda with receiver 동작 방식
  dependencies {  // 이 블록 안에서 DependencyHandler가 암묵적 수신 객체(this)
      implementation("...")  // = this.implementation("...")
      testImplementation("...")  // = this.testImplementation("...")
  }

  // 일반 함수 호출과 비교
  val handler = DependencyHandler()
  handler.implementation("...")  // 명시적 호출

  // vs Lambda with receiver
  dependencies {  // handler가 this로 자동 바인딩
      implementation("...")  // this 생략 가능
  }
  ```

<br/><br/>

## 성능 비교

### 빌드 시간 차이

| 측면                   | Groovy DSL | Kotlin DSL         |
| ---------------------- | ---------- | ------------------ |
| **첫 빌드 (클린빌드)** | 빠름       | 느림 (컴파일 필요) |
| **캐시된 빌드**        | 보통       | 보통 (캐시 재사용) |
| **개발 중 빌드**       | 보통       | 보통 (캐시됨)      |
| **문제 감지 시점**     | 런타임     | 컴파일 타임        |

### 전체 개발 생산성

- 첫 빌드가 조금 느리지만 버그 감지 시간을 줄임
- 컴파일 타임에 오류를 잡아서 런타임 에러를 방지함
- 전체적으로 개발 생산성이 높아짐

<br/><br/>

## 정리

### Java와 Kotlin의 차이

| 관점               | Java                    | Kotlin                 |
| ------------------ | ----------------------- | ---------------------- |
| **빌드 파일 본질** | 선언이지 코드가 아님    | 코드도 선언의 일부     |
| **확장자**         | `build.gradle` (Groovy) | `build.gradle.kts`     |
| **원칙**           | 빌드와 코드 분리        | 빌드도 코드의 일부     |
| **강점**           | 간결함과 단순함         | 안전성과 IDE 지원      |
| **트렌드**         | 과거 (Groovy 시대)      | 미래 (Kotlin DSL 시대) |

### Kotlin Script의 특징

- **.kt vs .kts**
  - `.kt`는 일반 프로그램으로 컴파일 후 실행됨
  - `.kts`는 스크립트로 컴파일과 실행이 한 번에 처리됨
- **실행 방식**
  - `.kt`는 `main()` 함수가 필수이며 진입점을 명시해야 함
  - `.kts`는 최상위 코드가 순차 실행되어 `main()` 불필요함
- **사용 목적**
  - `.kt`는 애플리케이션과 라이브러리 개발에 적합함
  - `.kts`는 빌드 설정, 자동화 스크립트, 명령줄 도구에 적합함

### 주요 장점

- **타입 안전성**
  - 컴파일 타임에 오류를 잡아 런타임 에러를 방지함
- **IDE 지원**
  - 완벽한 자동완성과 리팩토링 기능을 제공함
- **유지보수성**
  - 정적 타입으로 인해 코드 변경 시 영향 범위를 정확히 파악 가능함
- **Kotlin 생태계**
  - Kotlin 프로젝트에서 빌드 스크립트도 Kotlin으로 통일 가능함
- **스크립팅 편의성**
  - Python이나 Bash처럼 간편하게 작성하면서도 타입 안전성을 보장함

<br/><br/>

## Reference

- [Gradle Official Documentation - Kotlin DSL](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
- [Gradle Official Documentation - Migrating to Kotlin DSL](https://docs.gradle.org/current/userguide/migrating_from_groovy_to_kotlin_dsl.html)
- [Kotlin Official Documentation - Kotlin Scripting](https://kotlinlang.org/docs/custom-script-deps-tutorial.html)
- [JetBrains Blog - Kotlin DSL](https://blog.jetbrains.com/kotlin/category/gradle/)
- [Android Developers - Gradle Kotlin DSL](https://developer.android.com/build/migrate-to-kotlin-dsl)
