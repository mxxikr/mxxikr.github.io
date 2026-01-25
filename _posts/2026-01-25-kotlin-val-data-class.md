---
title: Kotlin val과 Data Class
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-25 14:30:00 +0900
category: [Language, Kotlin]
tags: [kotlin, val, var, data-class, immutable, spring, jpa]
math: false
mermaid: true
---
# 개요

- Kotlin의 `val`은 참조 불변성만 보장하며 객체 불변성을 보장하지 않음
- Data Class는 보일러플레이트 코드를 제거하지만 순환 참조와 상속 제한 등의 주의점이 있음
- Java의 `final`, `record`와 비교하여 Kotlin만의 특징과 장점을 이해함
- Spring/JPA 환경에서 발생할 수 있는 실무적인 문제와 해결책을 제시함

<br/><br/>

## val의 참조 불변성

### 기본 정의와 오해

- **val의 특성**
  - 단순히 "읽기 전용"이며, **절대로 "불변(immutable)"이 아님**
    ```kotlin
    // val + primitive type = 진짜 불변
    val age: Int = 25
    // age = 30  // 컴파일 에러

    // val + 가변 객체 = 참조는 불변, 객체는 가변
    val mutableList = mutableListOf(1, 2, 3)
    mutableList.add(4)  // OK - 객체 자체는 변함
    // mutableList = listOf(5, 6)  // 컴파일 에러 - 참조 재할당 불가

    // val + 불변 객체 = 완전히 불변
    val immutableList = listOf(1, 2, 3)
    // immutableList.add(4)  // 컴파일 에러 - 불변 인터페이스
    // immutableList = listOf(5, 6)  // 컴파일 에러 - 참조 재할당 불가
    ```

- **구분**
  - `val`은 **참조 불변성**(reference immutability)만 보장
  - **객체 가변성**(object mutability)은 보장하지 않음

### 참조 불변성 시각화

![val 참조 불변성 시각화](/assets/img/kotlin/val-reference-immutability.png)

### Java final과 비교

| 항목 | Kotlin (`val`) | Java (`final variable`) |
|------|----------------|-------------------------|
| **기본 동작** | `val x: Int = 10` | `final int x = 10;` |
| **재할당** | 불가능 | 불가능 |
| **참조 불변** | 보장함 | 보장함 |
| **객체 내부 상태** | **변경 가능** (`var` 프로퍼티 있는 경우) | **변경 가능** (Setter 있는 경우) |
| **예시** | `var` 프로퍼티 수정 가능 | `List.add()` 호출 가능 |

- **Java final 특징**
  - 객체 내부는 변경 가능

  ```java
  final List<Integer> list = new ArrayList<>();
  list.add(1); // OK - 참조는 불변이지만 list는 가변
  ```

### Property의 Getter와 Setter 자동 생성

- **Kotlin Property 특징**
  - 모든 클래스 property는 Java의 필드(field)가 아니라 **property**
  - 자동으로 getter/setter 메서드 생성

    ```kotlin
    // 개발자가 쓴 코드
    class Account {
        var balance: Int = 0
    }

    // 컴파일러가 생성하는 코드 (개념적)
    class Account {
        private var _balance: Int = 0  // backing field
        
        fun getBalance(): Int = _balance
        fun setBalance(value: Int) { _balance = value }
    }

    // Kotlin에서는 property 문법으로 접근
    val account = Account()
    account.balance = 100  // setBalance(100) 호출
    val current = account.balance  // getBalance() 호출
    ```

    - **캡슐화**
        - Java의 getter/setter 패턴을 언어 수준에서 강제
        - 캡슐화가 기본값

### Backing Field를 통한 메모리 최적화

- **Backing field**
  - property의 값을 실제로 저장하는 메모리 위치
  - **Kotlin이 자동으로 최적화**

    ```kotlin
    // Backing field 생성됨
    class Score {
        var points: Int = 0
        // backing field 자동 생성 (default accessor 사용)
    }

    // Backing field 생성 (custom accessor에서 field 참조)
    class ValidatedScore {
        var score: Int = 0
            set(value) {
                if (value >= 0) {
                    field = value  // field 키워드 사용
                }
            }
    }

    // Backing field 생성 안 됨 (계산된 property)
    class IsValid {
        val score: Int = 0
        val isValid: Boolean
            get() = score > 0  // field 미사용 -> backing field 불필요
    }

    // Backing field 없을 때 자기참조 = StackOverflowError
    class BadDesign {
        var age: Int = 0
            // get() = age  // 무한 재귀 -> StackOverflow
            get() = field  // 올바른 방식, backing field 참조
    }
    ```

- **메모리 효율**
  - backing field를 생성할 필요가 없으면 생성하지 않음
  - 불필요한 메모리 오버헤드 방지

<br/><br/>

## Data Class
### Data Class의 구조

![Data Class 구조](/assets/img/kotlin/data-class-structure.png)

### Data Class의 자동 생성 메서드

```kotlin
data class User(
    val id: Long,
    val name: String,
    val email: String
)
```

- **자동 생성 메서드 목록**

  | 메서드 | 동작 | 구체적 구현 예시 |
  |--------|------|-----------|
  | `equals()` | 모든 property 값 비교 | `id == other.id && name == other.name` |
  | `hashCode()` | property 기반 해시값 | `Objects.hash(id, name, email)` |
  | `toString()` | 읽기 쉬운 문자열 | `User(id=1, name='John', ...)` |
  | `copy()` | 일부만 변경 복사 | `copy(name = "Jane")` |
  | `componentN()` | 구조 분해용 함수 | 각 property를 순서대로 반환 |

### Component Functions 활용한 구조 분해

- **기능**
  - Data class가 자동으로 생성하는 `componentN()` 함수를 통해 구조 분해 가능

```kotlin
data class Employee(
    val id: Long,
    val name: String,
    val department: String,
    val salary: Double
)

fun main() {
    val emp = Employee(101, "Alice", "Engineering", 120000.0)
    
    // 기본 구조 분해
    val (id, name, dept, sal) = emp
    println("$name works in $dept earning $sal")
    
    // 일부만 추출 (underscore로 건너뛰기)
    val (empId, empName, _, _) = emp
    println("ID: $empId, Name: $empName")
    
    // Loop에서 구조 분해
    val employees = listOf(emp)
    for ((eId, eName, eDept, _) in employees) {
        println("$eName in $eDept")
    }
}
```

### 불변성을 유지하면서 변경하는 Copy 메서드

```kotlin
data class Config(
    val host: String,
    val port: Int,
    val timeout: Int
)

fun main() {
    val devConfig = Config("localhost", 8080, 5000)
    
    // copy로 일부만 변경
    val prodConfig = devConfig.copy(
        host = "api.example.com",
        port = 443,
        timeout = 10000
    )
    
    // 원본은 그대로 유지됨
    println(devConfig)  // Config(localhost, 8080, 5000)
    println(prodConfig)  // Config(api.example.com, 443, 10000)
}
```

- **얕은 복사(shallow copy)**

  ```kotlin
  data class Team(val name: String, val members: MutableList<String>)
  
  val team1 = Team("A", mutableListOf("Alice", "Bob"))
  val team2 = team1.copy()  // shallow copy
  
  team2.members.add("Charlie")
  // team1.members도 변함 (members는 같은 객체 참조)
  ```

<br/><br/>

## Java와의 비교

### Java Record와 Kotlin Data Class (Java 14+)

- **Java Record**
  - Java 14에서 도입되어 data class와 유사해졌지만 차이 존재

    | 특징 | Kotlin Data Class | Java Record (Java 14+) |
    |------|-------------------|------------------------|
    | **기본 목적** | 데이터 저장 | 데이터 저장 |
    | **equals/hashCode** | 자동 생성 | 자동 생성 |
    | **toString** | 자동 생성 | 자동 생성 |
    | **copy() 메서드** | **있음** | 없음 |
    | **가변성** | `var`/`val` 둘 다 가능 | `final`(불변)만 가능 |
    | **상속** | 가능 (Open class 상속은 불가) | 상속 불가 (`extends` 불가) |
    | **구조 분해** | 지원 (`componentN`) | 지원 (Pattern matching) |

- **Java 코드 예시**

  ```java
  // Java 14+ Record
  public record User(long id, String name, String email) {}
  
  User user2 = new User(user1.id(), "Jane", user1.email());
  ```
  - 제약
    - 모든 필드가 final
    - `copy()` 메서드가 없으므로 새 인스턴스를 직접 생성해야 함
- **결론**
  - Kotlin이 더 유연하며 `copy()` 메서드의 존재가 큰 장점

### Regular Class와의 구분

- **Regular Class 직접 구현 시 필요 내용**
  - `equals`, `hashCode`, `toString` 직접 구현
  - `copy` 메서드 직접 구현
  - `componentN` 직접 구현

- **Data Class**
  - `data class User(...)` 한 줄로 해결

- **Regular class 사용 권장 사례**
  - 복잡한 비즈니스 로직이 필요한 경우
  - 일부 필드만 `equals`/`hashCode`에 포함하려는 경우
  - 순환 참조가 있는 경우 (별도 구현 필요)

<br/><br/>

## 주의사항과 해결책

### val ≠ Immutable의 위험성

- **흔한 오류**
  - `val`을 "불변"으로 착각하는 것

    ```kotlin
    // 잘못된 이해
    data class User(val name: String, val profile: Profile)
    // val이므로 "불변"? NO!

    // 실제로는
    val user = User("John", profile)
    user.profile.updatePhoto(newPhoto)  // profile 객체는 가변일 수 있음
    ```
    - 진정한 불변성을 원하면 Profile 객체도 불변으로 설계해야 함

- **Spring/JPA 환경 주의**

  ```kotlin
  @Entity
  data class Order(
      @Id val id: Long,
      val status: String,
      @OneToMany val items: List<OrderItem>  // LAZY loading
  )
  
  fun processOrder(order: Order) {
      val items = order.items  // 트랜잭션 범위 밖에서 접근 시 예외 발생 가능
  }
  ```

### Data Class의 순환 참조 문제

- **문제점**
  - 순환 참조로 인한 `StackOverflowError` 발생 가능

    ![Data Class 순환 참조 문제](/assets/img/kotlin/data-class-circular-reference.png)

    ```kotlin
    // 위험한 구조
    @Entity
    data class Team(
        val id: Long,
        @OneToMany val members: List<Member>  // Member가 Team을 참조
    )

    @Entity
    data class Member(
        val id: Long,
        @ManyToOne val team: Team  // Team을 참조 -> 순환
    )

    // hashCode 호출 시 무한 반복
    ```

- **해결책**

  1. **명시적 구현 (Override)**
     
     ```kotlin
     data class Team(...) {
         override fun hashCode() = Objects.hash(id)  // id만 사용
         override fun toString() = "Team(id=$id)"
     }
     ```
  
  2. **JPA Annotations (Jakarta Persistence)**
     
     ```kotlin
     @Entity
     @ToString(exclude = ["members"])
     @EqualsAndHashCode(onlyExplicitlyIncluded = true)
     data class Team(...)
     ```
  
  3. **DTO 패턴 사용 (권장)**
     - Entity 대신 순환 참조가 없는 DTO를 사용하여 통신

### Data Class에서 var 사용의 위험성

```kotlin
// 위험: data class에서 var 사용
data class UserState(
    var name: String,
    var email: String
)

// 문제: HashMap/HashSet에서 버그
val userSet = setOf(UserState("John", "john@ex.com"))
val user = userSet.first()
user.email = "john.new@ex.com"
// hashCode()가 달라져서 Set에서 객체를 찾을 수 없거나 중복 저장될 수 있음
```

- **권장**
  - `var` 대신 `val`을 사용
  - 변경이 필요하면 `copy()`를 사용

<br/><br/>

## 정리

- `val`은 참조 불변성만 보장하며, 객체의 내부 상태 변경은 막지 못함
- 완전한 불변성을 원한다면 불변 객체나 방어적 복사를 고려해야 함

- **Data Class의 장단점**
  - `equals`, `hashCode`, `toString` 등을 자동 생성하여 생산성을 높임
  - 상속 불가능, 순환 참조 이슈(StackOverflowError) 등 구조적 제약 사항 숙지 필요
  - 데이터 전달 목적의 DTO에는 적극 권장
  - JPA Entity 사용 시에는 순환 참조 방지를 위해 `hashCode` 오버라이드 등 주의 필요

<br/><br/>

## Reference

- [Kotlin Official Documentation - Properties](https://kotlinlang.org/docs/properties.html)
- [Kotlin Official Documentation - Data Classes](https://kotlinlang.org/docs/data-classes.html)
- [Droidcon - The val property is not immutable](https://www.droidcon.com/2024/09/20/the-val-property-immutable-in-kotlin/)
- [Kt. Academy - Data Classes](https://kt.academy/article/kfde-data)
