---
title: "Kotlin 프로퍼티와 접근 제어자"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-28 13:10:00 +0900
category:
  - [Language, Kotlin]
tags:
  [kotlin, property, access-modifier, visibility, backing-field, getter, setter]
math: false
mermaid: false
---

# 개요

- Kotlin의 프로퍼티(Property)는 Java의 필드(Field)와 getter/setter를 통합한 개념임
- 접근 제어자는 Java와 유사하지만 몇 가지 중요한 차이가 있음
- 프로퍼티 위임을 통해 강력한 기능 확장이 가능함

<br/><br/>

## 프로퍼티와 필드

### Java의 접근 방식

- Java는 필드를 선언한 후 접근 제어를 위해 getter/setter 메서드로 감싸는 방식을 사용함
- 3줄짜리 필드가 getter/setter 메서드를 포함하면 7줄 이상의 코드로 변함
- 필드에 접근할 때 메서드를 사용해야 한다는 약속만 있으며 강제되지 않음

  ```java
  class Person {
      private int age;

      public int getAge() {
          return age;
      }

      public void setAge(int value) {
          if (value < 0) throw new IllegalArgumentException();
          this.age = value;
      }
  }

  // 사용
  person.setAge(25);
  int x = person.getAge();
  ```

### Kotlin의 접근 방식

- 프로퍼티 선언 시 자동으로 getter/setter가 생성됨
- 선언은 간단하지만 나중에 검증 로직을 추가해도 클라이언트 코드를 수정할 필요가 없음
- 프로퍼티의 공개 API(public interface)가 그대로 유지되므로 유연성이 높음

  ```kotlin
  class Person {
      var age: Int = 0
          set(value) {
              require(value >= 0) { "나이는 0 이상이어야 함" }
              field = value
          }
  }

  // 사용
  person.age = 25  // setter 호출
  val x = person.age  // getter 호출
  ```

![프로퍼티와 필드 비교](/assets/img/kotlin/property_comparison.png)

<br/><br/>

## Backing Field

### 개념

- `field`라는 특수한 키워드로 실제 데이터를 저장함
- getter/setter 안에서만 사용 가능함
- Backing field 생성 조건

  - 프로퍼티에 초기값이 있으면 backing field가 자동 생성됨
  - 또는 커스텀 접근자(getter/setter)에서 `field` 키워드를 사용하면 생성됨
  - 둘 다 없으면 backing field가 생성되지 않음 (계산된 프로퍼티)

    ```kotlin
    // backing field가 생성되는 경우
    var age: Int = 0  // 초기값 → backing field 생성

    var name: String = ""
        get() = field.uppercase()  // field 사용 → backing field 생성

    // backing field가 생성되지 않는 경우
    val age: Int
        get() = 2025 - birthYear  // field 미사용 → 생성 안 됨
    ```

### Backing Field 실무 패턴

- 값 검증

  ```kotlin
  class User {
      var email: String = ""
          set(value) {
              require(value.contains("@")) { "유효하지 않은 이메일" }
              field = value
          }
  }
  ```

- 로깅/추적

  ```kotlin
  class Counter {
      var count: Int = 0
          set(value) {
              logger.info("Count changed: $field → $value")
              field = value
          }
  }
  ```

- 변경 이벤트 발생

  ```kotlin
  class Observable {
      var value: String = ""
          set(newValue) {
              val oldValue = field
              field = newValue
              notifyObservers(oldValue, newValue)
          }
  }
  ```

### Backing Field가 없는 프로퍼티

- 값을 저장하지 않고 매번 요청할 때마다 계산하는 프로퍼티를 만들 수 있음
- `field` 키워드를 사용하지 않으면 backing field가 생성되지 않음

  ```kotlin
  class Person(val birthYear: Int) {
      val age: Int
          get() = 2025 - birthYear  // 매번 계산됨, backing field 없음
  }
  ```

### 프로퍼티 초기화 정책

- Kotlin은 기본적으로 프로퍼티 선언 시 즉시 초기화를 요구함
- 예외적으로 `lateinit`이나 `by lazy`를 사용하면 지연 초기화가 가능함

  ```kotlin
  class UserService {
      lateinit var database: Database  // var에 사용, 나중에 수동 초기화

      val config: Config by lazy {     // val에 사용, 첫 접근 시 자동 초기화
          loadConfig()
      }
  }
  ```

### lateinit과 by lazy 비교

| 구분            | lateinit                             | by lazy           |
| :-------------- | :----------------------------------- | :---------------- |
| **사용 가능**   | var만 가능                           | val만 가능        |
| **초기화 시점** | 수동 (언제든지)                      | 자동 (첫 접근 시) |
| **Null 허용**   | Non-null 타입만                      | 모든 타입         |
| **Thread-safe** | 아니오 (수동 동기화 필요)            | 예 (기본값)       |
| **초기화 여부** | `::property.isInitialized` 확인 가능 | 확인 불가         |

    ```kotlin
    // lateinit 사용 예시
    class Service {
        lateinit var dependency: Dependency

        fun init(dep: Dependency) {
            this.dependency = dep
        }

        fun use() {
            if (::dependency.isInitialized) {
                dependency.doSomething()
            }
        }
    }

    // by lazy 사용 예시
    class Service {
        val config: Config by lazy {
            loadConfigFromFile()
        }

        fun use() {
            // 첫 접근 시 자동 초기화
            println(config.value)
        }
    }
    ```

- Java와의 차이
  - Java 멤버 변수는 자동으로 기본값 초기화됨 (null, 0 등)
  - Kotlin은 명시적 초기화 없이는 컴파일 오류 발생
  - 이는 null 안전성을 보장하기 위한 언어 설계 철학의 차이임

<br/><br/>

## 접근 제어자

### 접근 제어자 비교

| 접근 제어자          | Java                                    | Kotlin                           |
| :------------------- | :-------------------------------------- | :------------------------------- |
| **public**           | 어디서나 접근 가능                      | 어디서나 접근 가능 (기본값)      |
| **protected**        | 같은 패키지 + 서브클래스 접근 가능      | 서브클래스에서만 접근 가능       |
| **default/internal** | package-private (같은 패키지만, 기본값) | internal (같은 모듈만)           |
| **private**          | 같은 클래스에서만 접근 가능             | 같은 클래스/파일에서만 접근 가능 |

```java
// Java
public int x;
protected int y;
(default) int z;  // package-private
private int w;
```

```kotlin
// Kotlin
public val x: Int  // 명시 가능하지만 기본값
val y: Int         // public (기본값)
protected val z: Int
internal val w: Int
private val v: Int
```

<br/><br/>

## Java와 Kotlin 접근 제어자 차이

### 기본값 차이

- Java의 기본값은 package-private (명시하지 않으면 같은 패키지에서 접근 가능)
- Kotlin의 기본값은 public (명시하지 않으면 어디서나 접근 가능)

  ```java
  // Java
  class Foo {
      int x;  // 같은 패키지에서 접근 가능
  }
  ```

  ```kotlin
  // Kotlin
  class Foo {
      val x: Int // 어디서나 접근 가능
      private val y: Int // 숨기려면 명시해야 함
  }
  ```

### Protected의 범위 차이

- Java의 protected는 같은 패키지의 비-서브클래스도 접근 가능함
  - 이로 인해 의도치 않은 패키지 내부 접근이 가능하여 캡슐화가 약해짐
- Kotlin의 protected는 서브클래스에서만 접근 가능함

  - Kotlin은 더 엄격한 캡슐화를 선택함

    ```java
    // Java
    package foo;
    public class Parent {
        protected int x;
    }
    public class Unrelated {
        void test(Parent p) {
            p.x = 5;  // 같은 패키지이므로 가능
        }
    }
    ```

    ```kotlin
    // Kotlin
    open class Parent {
        protected var x: Int = 0  // var로 선언
    }
    class Child : Parent() {
        fun test() {
            x = 5  // 서브클래스이므로 가능
        }
    }
    class Unrelated {
        fun test(p: Parent) {
            // p.x = 5  // 컴파일 에러: protected 멤버 접근 불가
            // println(p.x)도 불가능
        }
    }
    ```

### Internal Modifier (Kotlin 전용)

- 같은 모듈(Gradle/Maven 빌드 단위, 또는 IntelliJ IDEA 모듈)에서만 접근 가능함
- 라이브러리에서 내부 API를 숨기고 싶을 때 유용함
- JVM 바이트코드 레벨에서는 `public`으로 컴파일되지만 이름이 인코딩(Mangling)됨
- Kotlin 컴파일러에 의해서만 접근이 제한되며, Java에서 의도적으로 접근하는 것은 기술적으로 가능하지만 권장되지 않음

#### Internal vs Package-Private 비교

- **Java의 package-private**
  - 같은 패키지 내에서만 접근 가능
  - 문제: 패키지 단위로만 제어 가능하여, 대규모 프로젝트에서 세밀한 제어 어려움
- **Kotlin의 internal**
  - 같은 모듈(빌드 단위) 내 모든 패키지에서 접근 가능
  - 장점: 모듈 간 경계를 명확히 하여 라이브러리 내부 API 숨김에 효과적

#### Internal 활용 시나리오

```kotlin
// 라이브러리 코드 (my-library 모듈)
// 공개 API
class UserService {
    fun getUser(id: String): User {
        return database.query(id)  // internal 사용
    }
}

// 내부 구현 (숨기고 싶음)
internal class DatabaseConnection {
    internal fun query(id: String): User {
        // DB 접근 로직
    }
}

internal val database = DatabaseConnection()

// 다른 모듈 (app 모듈)
fun main() {
    val service = UserService()  // 가능
    val user = service.getUser("123")  // 가능

    // val db = database  // 컴파일 에러: internal 접근 불가
}
```

<br/><br/>

## Setter의 별도 접근 제어

### Getter와 Setter 분리

- Kotlin은 getter와 setter의 접근 제어를 분리할 수 있음
- 읽기는 공개하고 쓰기는 비공개로 설정 가능함

```kotlin
class Person(initialAge: Int = 0) {
    var age: Int = initialAge
        private set
}

val p = Person()
println(p.age)     // 읽기 가능
p.age = 25         // 쓰기 불가능
```

### Java와의 비교

- Java에서는 getter와 setter를 별도 메서드로 만들어야 하므로 이런 패턴을 구현하려면 setter를 아예 제공하지 않아야 함

```java
class Person {
    private int age;
    public int getAge() { return age; }
    // setter 없음
}
```

<br/><br/>

## Property 위임

### Lazy Property (지연 초기화)

- 첫 접근 시에만 계산하고 그 이후로는 캐시된 값을 사용함
- 비용이 많이 드는 작업을 필요한 시점까지 미룰 수 있음

  ```kotlin
  class Report {
      val data: List<String> by lazy {
          loadExpensiveData()  // 메서드 호출
      }

      private fun loadExpensiveData(): List<String> {
          // 비용이 많이 드는 계산
          return (1..1000).map { "Item $it" }
      }
  }

  val report = Report()
  println(report.data)  // 첫 접근 시 loadExpensiveData() 호출
  println(report.data)  // 캐시된 값 사용
  ```

- 의존성 주입이 필요한 경우

```kotlin
class User(
    val userId: String,
    private val userRepository: UserRepository  // DI 명시
) {
    val name: String by lazy {
        userRepository.findById(userId)?.name ?: ""
    }
}
```

### Observable Property (변경 감지)

- 프로퍼티 값이 변경될 때마다 콜백을 실행할 수 있음
- Java에서는 Observer 패턴을 직접 구현해야 하지만 Kotlin은 내장 기능으로 제공함

  ```kotlin
  import kotlin.properties.Delegates

  class Config {
      var maxConnections: Int by Delegates.observable(10) { _, old, new ->
          println("연결 수 변경: $old → $new")
      }
  }

  val config = Config()
  config.maxConnections = 20
  ```

<br/><br/>

## 비교

### Plain Java

- 모든 보일러플레이트를 수동으로 작성해야 함
- equals, hashCode, toString, getter/setter를 직접 구현함

```java
class Email {
    private String value;

    public Email(String value) {
        if (!isValidEmail(value)) throw new IllegalArgumentException();
        this.value = value;
    }

    public String getValue() { return value; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Email email = (Email) o;
        return Objects.equals(value, email.value);
    }

    @Override
    public int hashCode() { return Objects.hash(value); }

    @Override
    public String toString() { return "Email{value='" + value + "'}"; }
}
```

### Java + Spring (Lombok)

- Lombok 어노테이션으로 보일러플레이트 감소
- 여전히 외부 라이브러리 의존성 필요함
- JPA Entity에서 `@Data` 사용 시 주의 필요 (연관 관계 순환 참조 위험)

```java
// Value Object
@Value
class Email {
    String value;

    public Email(String value) {
        if (!isValidEmail(value)) throw new IllegalArgumentException();
        this.value = value;
    }
}

// JPA Entity
@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
}
```

### Plain Kotlin

- data class로 보일러플레이트 자동 생성
- 언어 기본 기능으로 간결한 코드 작성 가능

```kotlin
// Value Object
data class Email(val value: String) {
    init {
        require(isValidEmail(value)) { "유효하지 않은 이메일" }
    }
}

// 일반 Class
class Person(
    var name: String,
    var email: String
)
```

### Kotlin + Spring

- kotlin-jpa 플러그인으로 JPA 요구사항 자동 충족
- data class 대신 일반 class 사용으로 안전한 Entity 작성

```kotlin
// JPA Entity (안전한 방식)
@Entity
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    var name: String,
    var email: String
) {
    // JPA가 리플렉션으로 사용하는 기본 생성자
    // kotlin-jpa 플러그인이 없으면 수동으로 필요
    protected constructor() : this(0, "", "")
}

// kotlin-jpa 플러그인 사용 시 기본 생성자 자동 생성
@Entity
class UserWithPlugin(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    var name: String,
    var email: String
)
```

**kotlin-jpa 플러그인 설정**:

```gradle
plugins {
    kotlin("plugin.jpa") version "1.9.0"
}
```

**data class를 Entity에 사용하면 안 되는 구체적 이유**

- data class의 `equals()`와 `hashCode()`는 모든 필드를 사용함
- 연관 관계가 있을 때 문제 발생

```kotlin
// 위험한 예시
@Entity
data class User(
    @Id val id: Long,
    var name: String,
    @OneToMany val orders: List<Order> = emptyList()
)

@Entity
data class Order(
    @Id val id: Long,
    @ManyToOne val user: User
)

// 문제 상황
val user1 = User(1, "Alice")
val user2 = User(1, "Alice")
user1 == user2  // equals() 호출
// → orders 리스트 비교
// → Order의 equals() 호출
// → User 비교 (무한 재귀)
// → StackOverflowError 발생
```

- Lazy Loading 문제

  - `equals()` 호출 시 연관 엔티티를 강제로 로드함
  - N+1 쿼리 문제 발생 가능

- 해결책
  - 일반 class 사용
  - 필요한 경우 ID 기반으로 `equals()`/`hashCode()` 직접 구현

```kotlin
@Entity
class User(
    @Id val id: Long,
    var name: String
) {
    @OneToMany
    val orders: MutableList<Order> = mutableListOf()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is User) return false
        return id == other.id
    }

    override fun hashCode() = id.hashCode()
}

### 비교 요약

| 구분                | 보일러플레이트    | 외부 의존성 | JPA 안전성        | 디버깅           |
| :------------------ | :---------------- | :---------- | :---------------- | :--------------- |
| **Plain Java**      | 매우 많음 (15줄+) | 없음        | 안전              | 쉬움             |
| **Java + Lombok**   | 적음 (어노테이션) | Lombok 필요 | 주의 필요         | 생성 코드 안보임 |
| **Plain Kotlin**    | 매우 적음 (1-5줄) | 없음        | data class는 위험 | 쉬움             |
| **Kotlin + Spring** | 적음              | kotlin-jpa  | 안전 (일반 class) | 쉬움             |

<br/><br/>

## 정리

### Java와 Kotlin 비교표

| 측면                    | Java                           | Kotlin                                     |
| :---------------------- | :----------------------------- | :----------------------------------------- |
| **기본 단위**           | Field + Getter/Setter (메서드) | Property (통합 개념)                       |
| **보일러플레이트**      | 높음 (7~15줄)                  | 최소화됨 (1줄)                          |
| **접근 제어 기본값**    | package-private (숨겨짐)       | public (명시)                              |
| **접근 제어 종류**      | 4가지                          | 4가지 (protected 범위 다름, internal 추가) |
| **Protected 범위**      | 같은 패키지 + 서브클래스       | 서브클래스만                               |
| **Getter/Setter 분리**  | 불가 (각각 메서드)             | 가능 (setter만 private 등)                 |
| **계산된 프로퍼티**     | getter 메서드 사용             | val로 선언, backing field 없음             |
| **Property Delegation** | 없음 (Observer 패턴 직접 구현) | 내장됨 (lazy, observable 등)               |

### 주요 장점

- **필드의 단순성**
  - 프로퍼티로 필드처럼 간단하게 선언하고 사용함
- **Getter/Setter의 유연성**
  - 나중에 검증 로직을 추가해도 클라이언트 코드 수정 불필요함
- **모듈 단위 접근 제어**
  - internal modifier로 라이브러리 내부 API를 효과적으로 숨김
- **강력한 위임 기능**
  - lazy, observable 등으로 반복 코드를 획기적으로 줄임

<br/><br/>

## Reference

- [Kotlin Official Documentation - Properties](https://kotlinlang.org/docs/properties.html)
- [Kotlin Official Documentation - Visibility Modifiers](https://kotlinlang.org/docs/visibility-modifiers.html)
- [Kotlin Official Documentation - Delegated Properties](https://kotlinlang.org/docs/delegated-properties.html)
```
