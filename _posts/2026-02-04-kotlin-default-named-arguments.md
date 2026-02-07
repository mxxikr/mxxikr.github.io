---
title: 'Kotlin Default Arguments와 Named Arguments'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-04 19:00:00 +0900
category: [Language, Kotlin]
tags: [kotlin, default-arguments, named-arguments, builder-pattern, lombok, java, spring]
math: false
mermaid: false
---
# 개요

- Java는 파라미터가 많은 생성자를 처리하기 위해 **생성자 오버로딩(Constructor Overloading)**이 필요하지만 보일러플레이트 코드가 증가하는 문제 발생함
- Lombok `@Builder`로 보일러플레이트를 줄일 수 있지만 외부 의존성, IDE 설정, 코드 가시성 등 고려해야 할 점이 있음
- Kotlin은 `Default Arguments`와 `Named Arguments`를 언어 차원에서 제공하여 이러한 문제를 깔끔하게 해결함
- Spring Boot 프로젝트에서 DTO와 설정 클래스 작성 시 생산성과 가독성을 크게 향상시킴

<br/><br/>

## 자바의 고충

### Constructor Overloading

- 자바는 인자가 하나씩 늘어날 때마다 계단식으로 쌓이는 **점층적 생성자 패턴(Telescoping Constructor Pattern)** 구조를 가짐
  ```java
  public class User {
      private final String name;
      private final String email;
      private final int age;
      private final String department;
      
      // 생성자 1: 필수 정보만
      public User(String name, String email) {
          this(name, email, 0, "General");
      }
            
      // 생성자 N: 모든 필드
      public User(String name, String email, int age, String department) {
          this.name = name;
          this.email = email;
          this.age = age;
          this.department = department;
      }
  }
  ```

- **문제점**
  - 보일러플레이트 코드 증가
    - 필드 수에 비례하여 생성자 수가 늘어남 (**점층적 생성자 패턴**)
    - 필드가 많아질수록 생성자 관리가 어려워짐
  - 중복 코드
    - 모든 생성자가 유사한 초기화 로직을 반복
    - 로직 변경 시 모든 생성자를 수정해야 함
  - 순서 혼동과 타입 안전성 문제
    ```java
    // 동일한 타입(String)의 파라미터가 연속될 때 문제 발생
    new User("John", "john@example.com", 30, "Engineering")  // 정상
    
    // name과 email 순서 바뀜 - 컴파일 성공 (논리적 오류 발생)
    new User("john@example.com", "John", 30, "Engineering")  
    ```
    - 특히 `String` 타입 파라미터가 연속될 때 발생하는 순서 실수는 컴파일 타임에 잡을 수 없는 치명적인 휴먼 에러임

  - 가독성 저하
    - `new User("John", "john@example.com", 30, "Engineering")` // 각 값이 무엇을 의미하는지 알 수 없음

### Lombok @Builder 도입

- Java 커뮤니티는 Lombok `@Builder`로 문제를 해결함

  ```java
  @Data
  @Builder
  public class User {
      private String name;
      private String email;
      private int age;
      private String department;
  }
  
  // 사용
  User user = User.builder()
      .name("John")
      .email("john@example.com")
      .age(30)
      .department("Engineering")
      .build();
  ```

- **장점**
  - 가독성 향상
  - 선택적 파라미터 설정 가능
  - 메서드 체이닝으로 직관적

- **비용**
  - Lombok 의존성 추가 필요
  - IDE 플러그인 및 빌드 도구 설정 필요

<br/><br/>

## 롬복의 한계

- **설계의 불투명성**
  - 롬복은 코드를 줄여주지만 실제 소스 코드에는 존재하지 않는 **가상 메서드**에 의존하게 함
  - 빌드 환경 의존성 및 다른 라이브러리와 충돌 가능 (`MapStruct`, `QueryDSL` 등)
  - 코드가 IDE에서 보이지 않음 (블랙박스)

    ```java
    @Data
    @Builder
    public class User {
        private String name;
        private String email;
        private int age;
        private String department;
    }
    
    // IDE에서는 builder() 메서드가 보이지 않음
    // 실제로는 컴파일 후에 생성됨
    User user = User.builder()  // 플러그인 없이는 에러처럼 보일 수 있음
        .name("John")
        .build();
    ```

<br/><br/>

## 코틀린의 해결책

- 코틀린은 이를 외부 도구가 아닌 '언어의 문법'으로 내재화함
- `Default Arguments`는 불필요한 오버로딩을 제거하고, `Named Arguments`는 빌더 패턴의 가독성을 생성자 호출 시점으로 가져옴

### 생성자 오버로딩을 제거하는 Default Arguments

- Kotlin은 함수와 생성자의 파라미터에 기본값을 직접 지정할 수 있음

  ```kotlin
  // 함수에서의 기본값
  fun greet(name: String = "Guest"): String {
      return "Hello, $name!"
  }
  
  // 생성자에서의 기본값
  data class User(
      val name: String,
      val email: String,
      val age: Int = 0,
      val department: String = "General"
  )
  ```

- **동작 방식**

  ```kotlin
  // 하나의 생성자로 모든 조합 대응
  val user1 = User(name = "John", email = "john@example.com") 
  val user2 = User(name = "Alice", email = "alice@example.com", age = 28) // department는 "General" 자동 할당
  
  // 위치 인자(Positional)와 명명 인자(Named) 혼용 가능
  val user3 = User("John", email = "john@example.com")
  ```

### 빌더 패턴을 대체하는 Named Arguments

- **Named Arguments**를 사용하면 빌더 없이도 직관적으로 객체를 생성할 수 있음

```kotlin
data class Product(
    val id: Long,
    val name: String,
    val description: String = "",
    val price: BigDecimal = BigDecimal.ZERO,
    val quantity: Int = 0,
    val category: String = "General",
    val isActive: Boolean = true
)

// 최소한의 정보만 제공
val p1 = Product(id = 1L, name = "Laptop")

// 필요한 정보만 선택해서 재정의
val p2 = Product(id = 2L, name = "Phone", price = BigDecimal("999.99"))

// 순서와 관계없이 명확하게
val p3 = Product(id = 3L, name = "Tablet", isActive = false, quantity = 10, category = "Electronics")
```

- **장점**
  - 필수 정보만 전달하면 됨
  - 각 값이 무엇을 의미하는지 즉시 알 수 있음
  - 필요한 파라미터만 변경 가능
  - 코드가 간결해지며 **실수를 할 수 없는 구조**를 언어 차원에서 강제함

### 불변 객체를 쉽게 다루는 copy() 메서드

- 불변 객체(Immutable Object)를 다룰 때, 기존 객체의 데이터 중 일부만 변경하여 새로운 객체를 만들어야 하는 경우가 많음
  - 자바는 이를 위해 빌더 패턴을 다시 사용하거나, 복잡한 생성자 호출을 반복해야 하므로 코드가 장황해짐
  - 코틀린의 `data class`는 `copy()` 메서드를 자동으로 생성하여 이 문제를 해결함

  ```kotlin
  data class User(
      val name: String,
      val email: String,
      val age: Int
  )
  
  // 원본 객체 생성
  val user1 = User("John", "john@example.com", 30)
  
  // email만 변경한 새로운 객체 생성 (나머지 필드는 그대로 유지)
  val user2 = user1.copy(email = "john.new@example.com")
  
  // 원본은 불변으로 유지됨
  println(user1.email)  // john@example.com
  println(user2.email)  // john.new@example.com
  ```

### 테스트 의도를 명확히 하는 Fixture 패턴

- 테스트 코드에서는 **검증하려는 필드**가 무엇인지 한눈에 들어와야 함
  - 자바의 빌더는 테스트와 무관한 필수 필드까지 모두 채워야 해서 핵심 의도가 흐려짐
  - 코틀린은 `Named Arguments`와 기본값을 활용해 **Test Fixture**를 매우 간단하게 구현할 수 있음

  ```kotlin
  // Kotlin: 필요한 필드만 지정
  @Test
  fun testEmailValidation() {
      // SignupRequest의 다른 필드(name, age 등)는 기본값으로 채워짐
      val request = SignupRequest(
          email = "invalid-email"  // 검증하려는 필드만 명시적으로 지정
      )
  }
  ```
  - `SignupRequest`가 10개의 필드를 가지고 있더라도, 테스트에서 관심 있는 `email` 필드 하나만 작성하면 됨
    - "이 테스트는 이메일 유효성을 검증하는구나"라고 의도가 즉시 파악됨

<br/><br/>

## 결론

- Kotlin의 **Default Arguments**와 **Named Arguments**는 자바의 점층적 생성자나 빌더 패턴을 효과적으로 대체할 수 있음
- 롬복(@Builder)과 같은 외부 라이브러리 의존성을 줄이고, 복잡한 오버로딩 없이도 **간결하고 안전한 코드**를 작성하는 데 도움이 됨
- 불필요한 보일러플레이트 코드를 줄이고 가독성을 높이는 Kotlin의 특징을 잘 활용하면 유지보수하기 좋은 코드를 만들 수 있음

<br/><br/>

## 정리

- **자바의 한계**
  - 생성자 오버로딩으로 인한 코드 중복과 복잡성 증가
  - 롬복 사용 시 설계 불투명성 및 불변 객체 관리의 어려움
- **코틀린의 해결책**
  - `Default Arguments`로 불필요한 생성자 오버로딩 제거
  - `Named Arguments`로 가독성 및 타입 안전성 확보
  - `copy()` 메서드와 간결한 문법으로 생산성 극대화
- **결론**
  - 언어 차원의 지원으로 외부 의존성 없이 안전하고 간결한 코드 작성 가능

<br/><br/>

## Reference

- [Kotlin Official Documentation - Functions](https://kotlinlang.org/docs/functions.html)
- [Kotlin Official Documentation - Classes](https://kotlinlang.org/docs/classes.html)
- [Baeldung - Kotlin Default Arguments](https://www.baeldung.com/kotlin/default-arguments)
- [Effective Java (Joshua Bloch)](https://www.oreilly.com/library/view/effective-java/9780134686097/)
