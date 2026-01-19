---
title: Kotlin 상속 제한과 Spring과의 통합
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-19 10:20:00 +0900
category: [Language, Kotlin]
tags: [kotlin, inheritance, spring, open, final, sealed-class, jpa, cglib]
math: false
mermaid: false
---
# 개요

- Kotlin은 기본적으로 모든 클래스와 메서드를 `final`로 설정하여 상속을 제한함
- 이는 Joshua Bloch의 "Effective Java" 원칙을 언어 수준에서 강제한 설계 철학임
- Spring Framework는 CGLIB 프록시를 사용하므로 Kotlin의 `final` 클래스와 충돌이 발생함
- all-open 플러그인과 Interface 기반 설계로 이 문제를 해결할 수 있음

<br/><br/>

## Kotlin의 상속 제한 철학

### Effective Java 원칙 채택

- Kotlin은 Joshua Bloch의 "Design and document for inheritance or else prohibit it" 원칙을 기반으로 설계됨
- 이 원칙은 상속이 다음 두 경우 중 하나여야 함을 강조함

- **명시적으로 설계된 상속**
  - 클래스 작성자가 상속을 고려하여 문서화
  - 모든 부작용을 검토하고 테스트
- **상속 금지**
  - 상속을 고려하지 않은 클래스는 기본적으로 차단
  - 의도하지 않은 오버라이드 방지

### 컴파일러 수준 안전성 보장

- 기본 `final` 설정으로 컴파일러는 다음을 보장함
  - 특정 메서드 호출이 예상된 구현만 실행됨
  - Reflection을 통한 런타임 변경이 차단됨
  - 다형성 계약 위반을 사전에 방지함

### 상속 오용 방지

| 문제점 | 설명 |
|--------|------|
| **취약한 기반 클래스** | 기본 클래스 변경이 모든 자식 클래스에 영향을 미침 |
| **깊은 계층 구조** | 3단계 이상 상속은 유지보수가 어려움 |
| **리스코프 치환 원칙 위반** | 자식 클래스가 부모 계약을 위반할 가능성 |
| **의도하지 않은 오버라이드** | 내부 메서드를 실수로 재정의하는 문제 |

<br/><br/>

## Java와의 차이

### 기본 동작 비교

| 항목 | Java | Kotlin |
|------|------|--------|
| **클래스 기본** | open (상속 가능) | final (상속 불가) |
| **메서드 기본** | open | final |
| **상속 허용** | (기본값) | `open` 키워드 필요 |
| **오버라이드** | (기본값) | `open` + `override` |

### 코드 비교

- **Java 방식**

  ```java
  class Animal {
      public void sound() {
          System.out.println("Generic sound");
      }
  }

  class Dog extends Animal {
      @Override
      public void sound() {
          System.out.println("Bark");
      }
  }
  ```

- **Kotlin 방식 (잘못된 예)**

  ```kotlin
  // 컴파일 에러 발생
  class Animal {
      fun sound() {
          println("Generic sound")
      }
  }

  class Dog : Animal() {  // Error
      override fun sound() {
          println("Bark")
      }
  }
  ```

- **Kotlin 방식 (올바른 예)**

  ```kotlin
  open class Animal {
      open fun sound() {
          println("Generic sound")
      }
  }

  class Dog : Animal() {
      override fun sound() {
          println("Bark")
      }
  }
  ```

### 메서드 오버라이드 제어

- **Java**
  - 오버라이드된 메서드는 자동으로 재오버라이드 가능

  ```java
  class Parent {
      public void method() { }
  }

  class Child extends Parent {
      @Override
      public void method() { }
  }

  class GrandChild extends Child {
      @Override
      public void method() { }  // 가능
  }
  ```

- **Kotlin**
  - 명시적 제어 가능

  ```kotlin
  open class Parent {
      open fun method() { }
  }

  open class Child : Parent() {
      override fun method() { }  // 기본적으로 open
  }

  // 추가 오버라이드 차단
  open class SecureChild : Parent() {
      final override fun method() { }  // 더 이상 재정의 불가
  }
  ```

<br/><br/>

## Kotlin 상속 규칙 체계

### 기본 규칙

| 대상 | 기본 상태 | 상속/오버라이드 | 명시 필요 |
|------|----------|-----------------|-----------|
| 일반 클래스 | final | 불가 | `open` |
| 추상 클래스 | abstract | 필수 | - |
| 인터페이스 | abstract | 필수 | - |
| 메서드 | final | 불가 | `open` |
| 프로퍼티 | final | 불가 | `open` |
| Sealed 클래스 | abstract + 제한 | 같은 파일/패키지만 | - |

### Sealed Classes 활용

```kotlin
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val exception: Exception) : Result()
    object Loading : Result()
}

// when 표현식에서 모든 경우 처리 강제
fun handleResult(result: Result) = when (result) {
    is Result.Success -> println(result.data)
    is Result.Error -> println(result.exception.message)
    is Result.Loading -> println("Loading...")
    // else 불필요 - 모든 케이스를 컴파일러가 확인
}
```

<br/><br/>

## Spring과의 통합

### 문제점

- Spring Boot 2.x 이후 기본 프록시 방식은 CGLIB임
- CGLIB는 클래스를 상속하여 프록시를 생성하므로 `final` 클래스에서는 작동하지 않음

- **Spring Bean 생성 프로세스**

  ![Spring Bean 생성 프로세스](/assets/img/kotlin/spring-bean-process.png)

### 실패 시나리오

  ```kotlin
  @Service
  @Transactional
  class UserService(val repository: UserRepository) {
      fun saveUser(user: User) = repository.save(user)
  }
  ```

  - **에러 발생**
    - Cannot proxy final class com.example.UserService

- **JPA Lazy Loading 실패**

  ```kotlin
  @Entity
  class Order(
      val id: Long,
      @OneToMany(fetch = FetchType.LAZY)
      val items: List<OrderItem>
  )
  ```

  - **결과**
    - Lazy loading 무시
    - Eager loading 강제 실행
    - N+1 쿼리 문제 발생



### all-open 플러그인

- **build.gradle.kts**

  ```kotlin
  plugins {
      kotlin("plugin.spring") version "1.9.x"
      kotlin("plugin.jpa") version "1.9.x"
  }
  ```

- **동작 원리**

  ```kotlin
  // 작성 코드
  @Service
  @Transactional
  class UserService {
      fun saveUser(user: User) { }
  }

  // 컴파일 후 자동 변환
  @Service
  @Transactional
  open class UserService {
      open fun saveUser(user: User) { }
  }
  ```

- **장점**
  - 코드 변경 불필요
  - Spring Initializr 기본 설정
  - JPA와 자동 통합

- **단점**
  - 암시적 동작
  - 모든 메서드가 `open`
  - 의도하지 않은 오버라이드 가능

### Interface 기반 설계

```kotlin
// 서비스 인터페이스 정의
interface UserService {
    fun getUser(id: Long): UserDTO
    fun createUser(req: CreateUserRequest): UserDTO
    fun updateUser(id: Long, req: UpdateUserRequest): UserDTO
    fun deleteUser(id: Long)
}

// 구현체
@Service
class UserServiceImpl(
    val repository: UserRepository,
    val mapper: UserMapper
) : UserService {
    override fun getUser(id: Long): UserDTO =
        repository.findById(id)
            ?.let { mapper.toDTO(it) }
            ?: throw NotFoundException("User not found: $id")

    override fun createUser(req: CreateUserRequest): UserDTO {
        val user = User(name = req.name, email = req.email)
        return repository.save(user).let { mapper.toDTO(it) }
    }

    override fun updateUser(id: Long, req: UpdateUserRequest): UserDTO {
        val user = repository.findById(id)
            ?: throw NotFoundException("User not found: $id")
        user.apply {
            name = req.name
            email = req.email
        }
        return repository.save(user).let { mapper.toDTO(it) }
    }

    override fun deleteUser(id: Long) {
        repository.deleteById(id)
    }
}

// Controller
@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService  // 인터페이스 의존
) {
    @GetMapping("/{id}")
    fun getUser(@PathVariable id: Long) = userService.getUser(id)
}
```

- **비교 분석**

  | 측면 | all-open | Interface |
  |------|---------|-----------|
  | **암시성** | 높음 | 명확함 |
  | **확장성** | 제한적 | 우수 |
  | **테스트** | 클래스 mock | 인터페이스 mock |
  | **문서성** | 낮음 | 높음 |
  | **결합도** | 강함 | 약함 |
  | **성능** | CGLIB | JDK 프록시 |

### JPA 최적 설정

- **build.gradle.kts**

  ```kotlin
  plugins {
      kotlin("plugin.spring") version "1.9.x"
      kotlin("plugin.jpa") version "1.9.x"
  }

  allOpen {
      annotation("org.springframework.stereotype.Service")
      annotation("org.springframework.stereotype.Component")
  }

  noArg {
      annotation("jakarta.persistence.Entity")
  }
  ```

- **Entity 작성**

  ```kotlin
  // 권장: nullable 필드
  @Entity
  @Table(name = "users")
  data class User(
      @Id @GeneratedValue
      val id: Long? = null,
      val name: String,
      val email: String,
      
      @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
      val orders: List<Order> = emptyList()
  ) {
      // Lazy loading 필드는 toString에서 제외
      override fun toString() = "User(id=$id, name='$name', email='$email')"
  }

  // 대안: non-data class
  @Entity
  @Table(name = "users")
  class User(
      @Id @GeneratedValue
      val id: Long? = null,
      val name: String,
      val email: String,
      
      @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
      var orders: List<Order> = emptyList()
  )
  ```

### 명시적 open

```kotlin
// 특수한 경우만 사용
@Service
@Transactional
open class LegacyUserService(
    val repository: UserRepository
) {
    open fun getUser(id: Long): User? =
        repository.findById(id).orElse(null)

    open fun saveUser(user: User) {
        repository.save(user)
    }

    // private 메서드는 open 불필요
    private fun validateUser(user: User) {
        require(user.email.isNotEmpty()) { "Email is required" }
    }
}
```

<br/><br/>

## 권장 설계 패턴

### 우선순위 기반 선택

- **Interface 기반 설계 (최우선)**
  - 계약 명확
  - 테스트 용이
  - 확장 유연

- **all-open 플러그인 (표준)**
  - Java 마이그레이션
  - 소규모 서비스
  - 간단한 설정

- **Interface + all-open 조합**
  - Entity/DTO는 all-open
  - 서비스는 Interface
  - 각 영역의 장점 결합

- **Sealed classes (선택적)**
  - 제한된 상속 계층
  - 도메인 타입 모델링

- **명시적 open (마지막 수단)**
  - Legacy 호환성
  - 특수한 경우만

### 계층별 권장 방식

| 계층 | 권장 방식 | 이유 |
|------|----------|------|
| **Controller** | Interface | 엔드포인트 계약 명확 |
| **Service** | Interface | DI 유연성, 테스트 용이 |
| **Repository** | Interface | Spring Data 자동 구현 |
| **Entity** | all-open + no-arg | JPA/Hibernate 요구 |
| **DTO/Request** | 일반 클래스 | 프록시 불필요 |
| **도메인 타입** | Sealed class | Sum type 표현 |

### 위임을 통한 조합

```kotlin
// 상속 대신 위임 사용
interface Logger {
    fun log(msg: String)
}

class ConsoleLogger : Logger {
    override fun log(msg: String) = println(msg)
}

// Kotlin의 by 키워드 활용
class Application(
    logger: Logger = ConsoleLogger()
) : Logger by logger
```

- **위임의 장점**
    - 런타임 구현체 변경 가능
    - 다중 행동 조합 가능
    - 상속으로 인한 결합도 문제 해소
    - 테스트 시 mock 주입 용이

### 프로젝트 설정 가이드

- **build.gradle.kts**

    ```kotlin
    plugins {
        kotlin("plugin.spring")  // 필수
        kotlin("plugin.jpa")     // JPA 사용 시
    }
    ```

- **서비스 계층**
  - 모든 서비스는 interface 정의
  - 구현체는 `@Service` (명시적 `open` 금지)
  - `@Transactional`은 구현체에만

- **Entity 계층**
  - nullable 필드 활용
  - data class는 신중하게 사용
  - `toString()` exclude Lazy fields

- **테스트**
  - Mock은 interface 기반
  - `@WebMvcTest` 선호
  - `@SpringBootTest`는 필요시만

<br/><br/>

## 정리

- Kotlin은 Joshua Bloch의 Effective Java 원칙을 언어 차원에서 구현하여, 모든 클래스와 메서드를 기본적으로 `final`로 설정함
- 이는 상속을 금지하는 것이 아니라, **명시적으로 설계된 상속만 허용**하여 코드의 안전성을 높이기 위한 선택임

- **기본 설계 철학**
  - Java는 기본 `open` (상속 가능)
  - Kotlin은 기본 `final` (상속 불가)
  - `open` 키워드로 명시적 허용 필요

- **Spring과의 충돌**
  - Spring은 CGLIB 프록시를 사용하여 클래스를 상속
  - Kotlin의 `final` 클래스는 프록시 생성 불가
  - `@Transactional`, `@Async` 등의 기능이 작동하지 않음

### 해결 방법 우선순위

1. **Interface 기반 설계** (가장 권장)
   - 계약이 명확하고 테스트가 용이
   - DI 유연성과 확장성이 뛰어남

2. **all-open 플러그인** (표준)
   - `kotlin("plugin.spring")`으로 자동 처리
   - 코드 변경 없이 Spring 통합 가능

3. **계층별 조합 전략**
   - Controller/Service → Interface
   - Entity → all-open + no-arg
   - 도메인 타입 → Sealed class

4. **상속보다 조합**
   - Kotlin의 `by` 키워드로 위임 구현
   - 결합도를 낮추고 유연성 향상

<br/><br/>

## Reference

- [Kotlin Official Documentation - Classes and Inheritance](https://kotlinlang.org/docs/classes.html)
- [Kotlin Official Documentation - Sealed Classes](https://kotlinlang.org/docs/sealed-classes.html)
- [Spring Boot Kotlin Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.kotlin)
- [Effective Java (Joshua Bloch)](https://www.oreilly.com/library/view/effective-java/9780134686097/)
