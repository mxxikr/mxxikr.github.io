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
  - 이는 신규 팀원의 온보딩 비용을 높이고 빌드 환경의 복잡성을 가중시킴
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

- **불변성 관리의 어려움**
  - 가장 큰 문제는 불변성(Immutability)을 지키며 데이터를 가공할 때 발생함
  - 자바 빌더는 기존 객체에서 하나만 바꾼 새 객체를 만드는 `copy()` 기능을 기본 제공하지 않아 코드를 작성해야 함

<br/><br/>

## 코틀린의 해결책

- 코틀린은 이를 외부 도구가 아닌 '언어의 문법'으로 내재화함
- `Default Arguments`는 불필요한 오버로딩을 제거하고, `Named Arguments`는 빌더 패턴의 가독성을 생성자 호출 시점으로 가져옴

### Default Arguments

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

### Default + Named Arguments 결합

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
  - 이는 단순히 코드가 간결해지는 것을 넘어, **실수를 할 수 없는 구조**를 언어 차원에서 강제함

<br/><br/>

## 롬복과 코틀린의 비교

### 테스트 작성 시 차이점

```java
// Java: 테스트할 때마다 모든 필드를 지정해야 함
@Test
public void testEmailValidation() {
    SignupRequest request = SignupRequest.builder()
        .name("Test User")
        .email("invalid-email")  // 이 부분만 테스트하고 싶은데
        .password("SecurePass123!")
        .age(25)
        .department("Engineering")  // 불필요한 필드도 모두 지정
        .phoneNumber("01012345678")
        .build();
}
```

```kotlin
// Kotlin: 필요한 필드만 지정
@Test
fun testEmailValidation() {
    val request = SignupRequest(
        name = "Test User",
        email = "invalid-email",  // 이 부분만 변경
        password = "SecurePass123!"
        // 나머지는 기본값 사용 - 테스트 의도가 명확
    )
}
```

- Java는 테스트 의도와 무관한 필드도 모두 설정 필요
- Kotlin은 변경하려는 필드만 명시하여 테스트 의도가 명확함

### 검증 통합

- **Kotlin의 간단함**
  - 생성 시점에 `init` 블록과 `require`로 간결한 검증 가능
  ```kotlin
  init { require(age >= 18) { "age must be 18+" } }
  ```

### copy() 메서드로 불변 객체 다루기

- **불변 객체의 특정 필드만 바꿀 새 객체 만들기**

  - **Java의 번거로움**
    - 모든 필드를 다시 지정하는 메서드를 직접 하나하나 구현해야 함

  - **Kotlin의 간결함**

    ```kotlin
    data class User(  // data class 한 줄 선언
        val name: String,
        val email: String,
        val age: Int
    )
    // copy(), equals(), hashCode(), toString() 모두 자동 생성!
    
    // copy() 메서드가 자동 생성됨
    val user1 = User("John", "john@example.com", 30)
    val user2 = user1.copy(email = "john.new@example.com")  // 한 줄로 해결!
    
    // 원본은 불변으로 유지
    println(user1.email)  // john@example.com
    println(user2.email)  // john.new@example.com
    ```

    - Java는 필드가 많을수록 복사 코드가 길어짐
    - Kotlin은 바꿀 필드만 명시하면 나머지는 자동 복사

<br/><br/>


## Test Fixture 패턴

- 테스트 코드는 비즈니스 로직만큼이나 가독성이 중요함
- 자바의 빌더 방식은 테스트의 핵심 의도와 상관없는 더미 데이터까지 다 채워야 해서 의도가 흐려짐
- 코틀린의 Fixture 패턴을 사용하면, **이번 테스트에서 무엇을 검증하려 하는가**가 코드 한 줄에 명확히 드러남

### **Java 방식**
  - 장황한 빌더 체이닝

  ```java
  // UserTestFixture.createUser() 호출
  User user = User.builder()  // 모든 필드를 다시 지정해야 함
      .name("Test User")
      .email("test@example.com")
      .age(35)  // 이 필드만 바꾸고 싶음
      .department("Engineering")
      .phoneNumber("01012345678")
      .build();
  ```

### **Kotlin 방식**
  - 간결한 Fixture

  ```kotlin
  // UserFixture.createUser() 호출
  val user = UserFixture.createUser(
      age = 35  // 이 필드만 변경하고 나머지는 기본값 사용
  )
  ```

- **주요 차이**
  - Java는 테스트할 때마다 모든 필드를 지정해야 함 (테스트 의도 불명확)
  - Kotlin은 변경할 필드만 보여서 테스트 의도가 명확함

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

