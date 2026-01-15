---
title: Kotlin의 Null Safety
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-03 00:00:00 +0900
category: [Language, Kotlin]
tags: [kotlin, null-safety, nullable, npe, safe-call, elvis-operator, type-system]
math: false
mermaid: false
---
# 개요

- Kotlin의 타입 시스템에 내장된 Null Safety 메커니즘을 통해 NullPointerException을 컴파일 타임에 방지함
- Safe Call(`?.`)과 Elvis Operator(`?:`)의 동작 원리 및 다른 언어들과의 비교를 학습함
- Java 상호운용 시 주의사항과 Zero-Cost Abstraction의 의미를 이해함

<br/><br/>

## Null Safety의 개념

### Java의 문제점

- Java에서는 모든 참조 타입이 기본적으로 null이 될 수 있음
- 컴파일러가 null 가능성을 검증하지 않음
- 개발자가 `if (name != null)` 체크를 잊으면 런타임 에러 발생
- NPE는 프로그램이 실행 중일 때만 발견됨

  ```java
  // Java
  String name = getUsername();
  System.out.println(name.toUpperCase());
  // 컴파일은 통과하지만, 런타임에 NullPointerException 발생
  ```

### Kotlin의 해결책

- Kotlin은 null 가능성을 타입 시스템에 통합하여 컴파일 타임에 강제함
- `String`은 null이 될 수 없음 (non-nullable 타입)
- `String?`은 null이 될 수 있음 (nullable 타입)
- null 가능성은 컴파일 타임에 강제되므로 NPE가 런타임에 발생할 가능성이 사라짐

  ```kotlin
  // Kotlin
  var name: String = getUsername()
  // Type mismatch: inferred type is String? but String was expected

  var name: String? = getUsername()
  println(name.toUpperCase())
  // Only safe (?.) or non-null asserted (!!.) calls are allowed

  println(name?.toUpperCase())
  ```

- Null Safety 의사결정 흐름

![Null Safety 의사결정 흐름](/assets/img/kotlin/null_safety_decision_flow.png)

<br/><br/>

## Null 처리 연산자

### Safe Call Operator (`?.`)

- null이면 null을 반환하고, 아니면 실행함
- 체이닝 가능함

  ```kotlin
  val name: String? = null
  val length = name?.length
  println(length)
  ```

  ```kotlin
  val city = user?.address?.city
  ```

- 동작 원리

  - `name?.length`는 `if (name != null) name.length else null`과 동일하게 컴파일됨

    ```kotlin
    val length = if (name != null) name.length else null
    ```

### Elvis Operator (`?:`)

- null이면 기본값을 사용함

  ```kotlin
  val name: String? = null
  val displayName = name ?: "Guest"
  println(displayName)
  ```

- Java와 비교 시 더 간결함

  ```java
  // Java
  String displayName = (name != null) ? name : "Guest";
  ```

  ```kotlin
  // Kotlin
  val displayName = name ?: "Guest"
  ```

- 예외 던지기도 가능함

  ```kotlin
  val age = input ?: throw IllegalArgumentException("Age required")
  ```

### Not-Null Assertion (`!!`)

- null 체크를 생략하며, null이면 NPE 발생함
- Kotlin의 Null Safety 철학에 반함
- 프로덕션 코드에서는 사용을 피해야 함
- 정말 null이 아님을 확신할 때만 제한적으로 사용함

  ```kotlin
  val name: String? = getName()
  println(name!!.toUpperCase())
  ```

### Smart Cast

- null 체크 후 자동으로 non-nullable 타입으로 변환됨
- 명시적 캐스팅이 불필요함

  ```kotlin
  fun processUser(user: User?) {
      if (user != null) {
          println(user.name)
      }
  }
  ```

  ```kotlin
  fun getUserType(user: User?): String {
      return when (user) {
          null -> "No user"
          else -> user.name
      }
  }
  ```

- Smart Cast가 작동하지 않는 경우

  - var 프로퍼티는 다른 스레드에서 변경 가능하므로 작동하지 않음

    ```kotlin
    class Container {
        var user: User? = null
    }

    fun process(container: Container) {
        if (container.user != null) {
            println(container.user.name)
        }
    }
    ```

  - 해결 방법

    - 지역 변수에 할당

    ```kotlin
    fun process(container: Container) {
        val user = container.user
        if (user != null) {
            println(user.name)
        }
    }
    ```

<br/><br/>

## Kotlin에서 NPE가 발생하는 경우

- Kotlin은 NPE 제로를 보장하지 않으며 다음 경우에만 발생함

### 명시적으로 던질 때

```kotlin
throw NullPointerException()
```

### `!!` 연산자 사용

```kotlin
val name: String? = null
println(name!!.length)
```

### 초기화 실패

```kotlin
open class Parent {
    open val name: String = "Parent"

    init {
        println(printName())
    }

    open fun printName() = name
}

class Child : Parent() {
    override val name: String = "Child"
}

val child = Child()
```

- Parent의 init 블록이 먼저 실행됨
- 이 시점에 Child의 name은 아직 초기화되지 않음
- printName() 호출 시 초기화되지 않은 name에 접근하여 NPE 발생 가능

### Java 상호운용

- Platform Types (`타입!`)

  - Kotlin에서 Java 코드를 호출하면 Platform Types가 등장함
  - `!`는 nullable인지 non-nullable인지 모름을 의미함

    ```kotlin
    val user = javaApi.getUser()
    ```

- 위험한 방법과 안전한 방법

  ```kotlin
  // 위험한 방법
  val name: String = user.getName()

  // 안전한 방법
  val name: String? = user.getName()
  ```

- Java API를 래핑하는 Kotlin 레이어 생성 권장

  ```kotlin
  class UserRepository(private val javaApi: JavaUserApi) {
      fun getUser(id: Long): User? {
          return javaApi.getUser(id)
      }
  }
  ```

<br/><br/>

## Java와 JVM 호환성

### JVM 바이트코드 레벨에서의 null safety

- Kotlin의 null safety는 컴파일 타임에만 존재하며 런타임에는 일반 null 체크로 변환됨
- JVM 바이트코드에는 nullable과 non-nullable 타입의 구분이 없음
- 모든 참조 타입은 바이트코드 레벨에서 동일하게 표현됨

  ```kotlin
  // Kotlin 코드
  val name: String = "John"
  val nullableName: String? = null
  ```

  ```java
  // 컴파일된 바이트코드 (의사 코드)
  String name = "John";
  String nullableName = null;
  ```

- Kotlin 컴파일러는 바이트코드 생성 시 null 체크 코드를 삽입함

  ```kotlin
  // Kotlin
  fun greet(name: String) {
      println("Hello, $name")
  }
  ```

  ```java
  // 바이트코드 (의사 코드)
  public static void greet(String name) {
      if (name == null) {
          throw new IllegalArgumentException("Parameter specified as non-null is null");
      }
      System.out.println("Hello, " + name);
  }
  ```

### Java에서 Kotlin 코드 호출

- Java에서는 Kotlin의 nullable/non-nullable 구분을 인지하지 못함
- Non-nullable 파라미터에 null을 전달하면 런타임에 `IllegalArgumentException` 발생

  ```kotlin
  // Kotlin 코드
  class KotlinClass {
      fun process(data: String) {
          println(data.length)
      }
  }
  ```

  ```java
  // Java에서 호출
  KotlinClass kotlin = new KotlinClass();
  kotlin.process(null);  // IllegalArgumentException 발생
  ```

- Nullable 파라미터는 Java에서 자유롭게 null 전달 가능

  ```kotlin
  // Kotlin
  fun process(data: String?) {
      println(data?.length)
  }
  ```

  ```java
  // Java
  KotlinClassKt.process(null);  // 정상 동작
  ```

### Kotlin에서 Java 코드 호출 시 Platform Types

- Java 메서드의 반환 타입은 Platform Type(`타입!`)으로 추론됨
- Platform Type은 nullable로도 non-nullable로도 사용 가능하지만 위험함

  ```java
  // Java API
  public class JavaApi {
      public String getName() {
          return null;  // null 반환 가능
      }
  }
  ```

  ```kotlin
  // Kotlin에서 호출
  val api = JavaApi()
  val name = api.getName()  // Platform Type: String!

  // 위험: non-nullable로 선언
  val str: String = api.getName()  // NPE 발생 가능!

  // 안전: nullable로 선언
  val str: String? = api.getName()  // 안전
  ```

### @NotNull과 @Nullable 애노테이션 활용

- Java 코드에 JSR-305 애노테이션을 추가하면 Kotlin이 인식함
- Kotlin 컴파일러가 정확한 nullable 여부를 판단 가능

  ```java
  // Java
  import org.jetbrains.annotations.NotNull;
  import org.jetbrains.annotations.Nullable;

  public class JavaApi {
      @NotNull
      public String getUsername() {
          return "John";
      }

      @Nullable
      public String getEmail() {
          return null;
      }
  }
  ```

  ```kotlin
  // Kotlin
  val api = JavaApi()
  val username: String = api.getUsername()  // OK, @NotNull이므로
  val email: String? = api.getEmail()       // OK, @Nullable이므로

  // 컴파일 에러
  val email2: String = api.getEmail()  // Type mismatch
  ```

- 주요 애노테이션 라이브러리

  | 라이브러리 | @NotNull   | @Nullable   |
  | ---------- | ---------- | ----------- |
  | JetBrains  | `@NotNull` | `@Nullable` |
  | JSR-305    | `@Nonnull` | `@Nullable` |
  | Android    | `@NonNull` | `@Nullable` |
  | Eclipse    | `@NonNull` | `@Nullable` |

### Kotlin의 null safety 검증 방식

- 컴파일 타임
  - Kotlin 코드 내부에서는 타입 시스템으로 완벽히 검증
  - Java 코드는 애노테이션이 있으면 검증, 없으면 Platform Type
- 런타임

  - Non-nullable 파라미터에 대한 null 체크 코드 자동 삽입
  - Java에서 Kotlin 호출 시 보호 장치 역할

    ```kotlin
    fun process(data: String) {
        // 컴파일러가 자동으로 삽입하는 체크
        // if (data == null) throw IllegalArgumentException(...)
        println(data.length)
    }
    ```

### 바이트코드 최적화

- Kotlin 컴파일러는 불필요한 null 체크를 제거하여 성능 최적화
- 함수 가시성에 따라 null 체크 전략이 다름

  ```kotlin
  // Private/Internal 함수: null 체크 생략 가능
  private fun callee(data: String) {
      println(data.length)
  }

  fun caller() {
      callee("test")
  }
  ```

  ```kotlin
  // Public 함수: Java 상호운용을 위해 null 체크 유지
  public fun publicCallee(data: String) {
      // Intrinsics.checkNotNullParameter(data, "data")가 삽입됨
      println(data.length)
  }
  ```

- Kotlin 컴파일러의 null 체크 생략 전략
  - Internal/Private 함수는 Kotlin 내부에서만 호출되므로 생략 가능
  - Public 함수는 Java에서 호출될 수 있으므로 null 체크 유지
  - Inline 함수는 호출 지점에 코드가 삽입되므로 중복 체크 제거

### 상호운용 시 권장사항

- Java API 사용 시

  - 항상 nullable 타입으로 받기
  - 즉시 null 체크 후 non-nullable 타입으로 변환

    ```kotlin
    val javaResult: String? = javaApi.getData()
    val result: String = javaResult ?: throw IllegalStateException("Data is null")
    ```

- Kotlin API를 Java에 노출 시

  - 명시적으로 `@JvmName`, `@JvmOverloads`, `@JvmStatic` 사용
  - 파라미터가 nullable이면 JavaDoc에 명시

    ```kotlin
    /**
     * @param data nullable parameter, can be null
     */
    @JvmStatic
    fun process(data: String?) {
        // ...
    }
    ```

- 래퍼 레이어 생성

  - Java API를 Kotlin으로 래핑하여 안전한 인터페이스 제공

    ```kotlin
    class SafeJavaApi(private val javaApi: UnsafeJavaApi) {
        fun getData(): String {
            return javaApi.getData()
                ?: throw IllegalStateException("Java API returned null")
        }

        fun getOptionalData(): String? {
            return javaApi.getData()
        }
    }
    ```

<br/><br/>

## 다른 언어와의 비교

### Java vs Kotlin

| 측면                | Java                                 | Kotlin                     |
| ------------------- | ------------------------------------ | -------------------------- |
| **기본 Null 허용**  | 모든 참조 타입 nullable              | 명시적으로 `?` 표시 필요   |
| **Null 체크 시점**  | 런타임 (NPE 발생 시)                 | 컴파일 타임 (코드 작성 시) |
| **안전한 접근**     | `if (x != null)` 또는 `Optional<T>`  | `?.` (safe call)           |
| **기본값 제공**     | 삼항 연산자 또는 `Optional.orElse()` | `?:` (elvis)               |
| **런타임 오버헤드** | `Optional`은 wrapper 객체 생성       | 0 (컴파일 타임만)          |

- Java Optional의 문제점

  - `Optional`은 wrapper 객체를 생성하여 힙 객체 생성 발생
  - GC 압력 증가
  - 접근 시 indirection 비용 발생

    ```java
    // Java
    Optional<String> name = Optional.of("John");
    String result = name.map(String::toUpperCase).orElse("GUEST");
    ```

### Scala의 Option[T]

- 함수형 프로그래밍 접근 방식 사용

  ```scala
  val name: Option[String] = Some("John")
  val length = name.map(_.length).getOrElse(0)
  ```

- 장점
  - 더 일반적이고 composable함 (`flatMap`, `for-comprehension` 등)
- 단점
  - `Some`/`None` 래퍼 객체가 힙에 할당되어 메모리 오버헤드 발생
- Scala 3의 개선
  - Union Types (`String | Null`)를 도입해 Kotlin과 유사한 제로-코스트 달성

### Swift

- Kotlin과 유사한 접근 방식 사용

  ```swift
  var name: String? = nil
  print(name?.uppercased() ?? "Guest")
  ```

- 차이점
  - Swift의 Optional은 enum으로 구현되어 힙 할당 없이 효율적임

### C# 8+ (Nullable Reference Types)

- C# 8부터 Kotlin과 유사한 null safety 도입

  ```csharp
  string? name = null;
  string name2 = "Hi";
  ```

- 차이점
  - 기존 코드와의 호환성 때문에 선택적(opt-in)임
  - 컴파일 에러가 아닌 경고만 발생함

<br/><br/>

## Zero-Cost Abstraction

### 개념

- Kotlin의 nullable 타입은 런타임 오버헤드가 전혀 없음
- JVM 바이트코드에서 일반 `String`과 완전히 동일함

  ```kotlin
  var name: String? = "John"
  ```

- 컴파일 결과

  ```kotlin
  // Kotlin 코드
  val length = name?.length

  // 컴파일된 바이트코드
  val length = if (name != null) name.length else null
  ```

### 성능 비교

| 특징                | Java Optional    | Kotlin Nullable       |
| ------------------- | ---------------- | --------------------- |
| **Wrapper 객체**    | 생성함 (힙 할당) | 생성 안 함            |
| **메모리 오버헤드** | 있음             | 없음                  |
| **GC 압력**         | 증가             | 변화 없음             |
| **접근 비용**       | Indirection 비용 | 직접 접근             |
| **성능**            | 느림             | 일반 null 체크와 동일 |

- Kotlin의 nullable 타입은 컴파일러 매직으로 구현됨
- 실제로는 일반 null 체크 코드로 변환됨
- 타입 안전성을 얻으면서도 성능 손실이 전혀 없음

<br/><br/>

## Nullable Receiver

- nullable 타입에도 확장 함수를 정의할 수 있음
- null에 대해서도 확장 함수 호출 가능

  ```kotlin
  fun String?.isNullOrEmpty(): Boolean {
      return this == null || this.isEmpty()
  }

  val x: String? = null
  println(x.isNullOrEmpty())
  ```

- Nullable Receiver의 특징

  - null에 대해서도 확장 함수 호출 가능
  - 함수 내부에서 this는 nullable 타입임
  - this에 대한 null 체크는 개발자가 직접 수행해야 함
  - 일반 확장 함수는 non-null receiver만 허용

    ```kotlin
    fun String.nonNullLength(): Int = this.length

    fun String?.nullableLength(): Int = this?.length ?: 0
    ```

- 활용 예시

  ```kotlin
  fun String?.orDefault(default: String): String {
      return this ?: default
  }

  val name: String? = null
  println(name.orDefault("Guest"))
  ```

- 표준 라이브러리 함수들은 모두 nullable receiver를 가짐

  ```kotlin
  fun String?.isNullOrBlank(): Boolean
  fun <T> List<T>?.isNullOrEmpty(): Boolean
  fun CharSequence?.ifEmpty(defaultValue: () -> CharSequence): CharSequence
  ```

<br/><br/>

## let 함수와 Safe Call

- null이 아닐 때만 실행함

  ```kotlin
  val name: String? = getName()

  // 전통적인 방법
  if (name != null) {
      println(name.length)
      saveToDatabase(name)
  }

  // Kotlin 스타일
  name?.let {
      println(it.length)
      saveToDatabase(it)
  }
  ```

- 반환값 활용

  ```kotlin
  val result = name?.let {
      println(it.length)
      saveToDatabase(it)
      "Success"
  } ?: "Failed"
  ```

- 체이닝 예시

  ```kotlin
  user?.address?.city?.let { city ->
      println("User lives in $city")
  }
  ```

- also, apply와의 비교

  - let은 마지막 표현식을 반환
  - also는 원본 객체를 반환하여 체이닝에 유용
  - apply는 this를 사용하며 원본 객체를 반환

    ```kotlin
    name?.also {
        println(it.length)
    }

    name?.apply {
        println(length)
    }
    ```

<br/><br/>

## 검증 함수

### require와 check

- require는 파라미터 검증에 사용하며 IllegalArgumentException을 던짐

  ```kotlin
  fun process(name: String?) {
      require(name != null) { "Name must not be null" }
      println(name.length)
  }
  ```

- check는 상태 검증에 사용하며 IllegalStateException을 던짐

  ```kotlin
  fun internalProcess(data: String?) {
      check(data != null) { "Data must be initialized" }
      println(data.length)
  }
  ```

### requireNotNull과 checkNotNull

- 직접 non-null 값을 반환함

  ```kotlin
  fun ensureNotNull(value: String?) {
      val nonNull: String = requireNotNull(value) { "Value is null" }
      println(nonNull.length)
  }
  ```

  ```kotlin
  fun ensureState(data: String?) {
      val nonNull: String = checkNotNull(data) { "Data must be initialized" }
      println(nonNull.length)
  }
  ```

<br/><br/>

## 권장 사용 패턴

### nullable보다 non-nullable을 선호

```kotlin
// 나쁜 예
class User {
    var name: String? = null
}

// 좋은 예
class User(
    val name: String
)
```

### Elvis Operator로 기본값 제공

```kotlin
// 나쁜 예
val displayName = if (user.name != null) user.name else "Guest"

// 좋은 예
val displayName = user.name ?: "Guest"
```

### 검증 함수 활용

```kotlin
// 나쁜 예
fun process(name: String?) {
    if (name == null) {
        throw IllegalArgumentException("Name required")
    }
    println(name.length)
}

// 좋은 예
fun process(name: String?) {
    require(name != null) { "Name required" }
    println(name.length)
}
```

### `!!` 사용 금지

```kotlin
// 절대 금지
val length = name!!.length

// 안전한 방법
val length = name?.length ?: 0
```

- `!!`를 사용해도 되는 유일한 경우

  ```kotlin
  private lateinit var repository: UserRepository

  fun init() {
      repository = UserRepository()
      repository.findAll()
  }
  ```

### Java API 래핑

```kotlin
// Java API
public class JavaApi {
    public User getUser(Long id) { ... }
}

// Kotlin 래퍼
class KotlinApi(private val javaApi: JavaApi) {
    fun getUser(id: Long): User? {
        return javaApi.getUser(id)
    }

    fun getUserOrThrow(id: Long): User {
        return javaApi.getUser(id)
            ?: throw NoSuchElementException("User not found: $id")
    }
}
```

### Nullable Collection 처리

```kotlin
val names: List<String>? = getNames()

// 복잡함
if (names != null && names.isNotEmpty()) {
    names.forEach { println(it) }
}

// 간결함
names?.forEach { println(it) }

// 또는 빈 리스트 반환하는 것을 선호
fun getNames(): List<String> = fetchNames() ?: emptyList()
```

<br/><br/>

## 정리

### 주요 원칙

- 타입 시스템에 null 가능성 내장
  - `String` vs `String?`로 명확히 구분
  - 컴파일 타임에 강제되어 런타임 NPE 방지
- 세 가지 연산자
  - `?.` (Safe Call)
    - null-safe 접근
  - `?:` (Elvis)
    - 기본값 제공
  - `!!` (Not-Null Assertion)
    - 사용 금지 권장
- Smart Cast
  - null 체크 후 자동으로 non-nullable 타입으로 변환
  - var 프로퍼티는 지역 변수에 할당 후 사용
- 검증 함수
  - `require`
    - 파라미터 검증 (`IllegalArgumentException`)
  - `check`
    - 상태 검증 (`IllegalStateException`)
  - `requireNotNull`/`checkNotNull`
    - non-null 값 반환
  - 검증 후 자동으로 non-nullable 타입으로 스마트 캐스트됨
- Zero-Cost Abstraction
  - 런타임 오버헤드 없음
  - Java Optional보다 성능 우수
  - 일반 null 체크와 동일한 바이트코드 생성
- Java 상호운용 주의
  - Platform Types (`타입!`) 조심
  - Java API는 Kotlin 레이어로 래핑
  - nullable 여부를 명시적으로 선언
  - Public 함수는 null 체크 유지, Private/Internal 함수는 최적화 가능

### 다른 언어와의 비교

- Java
  - 런타임 체크만 가능
  - Optional은 오버헤드 있음
- Scala
  - 함수형이지만 Some/None 할당 비용 발생
- Swift
  - enum 기반 Optional로 효율적
- C#
  - 선택적(opt-in)이며 경고만 발생

<br/><br/>

## Reference

- [Kotlin Official Documentation - Null Safety](https://kotlinlang.org/docs/null-safety.html)
- [Java to Kotlin Nullability Guide](https://kotlinlang.org/docs/java-to-kotlin-nullability-guide.html)
