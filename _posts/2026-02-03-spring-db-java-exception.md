---
title: '[스프링 DB 1편 데이터 접근 핵심 원리] 자바 예외 이해'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-03 14:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, exception, checked-exception, unchecked-exception, runtime-exception, error-handling]
math: false
mermaid: false
---

# 자바 예외 이해

- 김영한님의 스프링 DB 1편 강의를 통해 자바 예외의 계층 구조와 체크/언체크 예외의 차이를 이해하고, 실무에서 효과적인 예외 처리 전략을 정리함

<br/><br/>

## 예외 계층 구조

### 자바 예외 계층도

![자바 예외 계층](/assets/img/springdb/exception_hierarchy.png)

- **Object**
  - 자바의 모든 객체의 최상위 부모
  - 예외도 객체이므로 Object를 상속

- **Throwable**
  - 예외의 최상위 부모
  - Error와 Exception의 상위 클래스

- **Error**
  - 메모리 부족이나 시스템 레벨의 심각한 오류
  - 애플리케이션에서 잡으려고 시도하면 안 됨
  - 복구 불가능한 시스템 예외

- **Exception**
  - 애플리케이션 로직에서 사용할 수 있는 실질적인 최상위 예외
  - 컴파일러가 체크하는 체크 예외
  - RuntimeException을 제외한 모든 Exception은 체크 예외

- **RuntimeException**
  - 컴파일러가 체크하지 않는 언체크 예외
  - 런타임 예외와 그 하위 예외를 모두 언체크 예외라고 함

### 예외 상속 규칙
- `Exception`을 상속받으면 체크 예외

    ```java
    // 체크 예외 정의
    class MyCheckedException extends Exception {
        public MyCheckedException(String message) {
            super(message);
        }
    }
    ```
- `RuntimeException`을 상속받으면 언체크 예외

    ```java
    // 언체크 예외 정의
    class MyUncheckedException extends RuntimeException {
        public MyUncheckedException(String message) {
            super(message);
        }
    }
    ```


<br/><br/>

## 예외 기본 규칙

### 기본 규칙

1. **예외는 잡아서 처리하거나 던져야함**
   - 예외를 잡거나 던지지 않으면 컴파일 오류 발생
   - **처리**
     - `try-catch`로 예외 잡기
   - **던지기**
     - `throws`로 예외 던지기

2. **예외를 던질 때 지정한 예외와 그 하위 예외까지 함께 던져짐**
   - `Exception`을 catch → 하위 예외까지 모두 잡을 수 있음
   - `Exception`을 throws → 하위 예외까지 모두 던질 수 있음

### 예외 처리 흐름

![예외 처리 흐름](/assets/img/springdb/exception_flow.png)

### 예외를 처리하지 못하는 경우

![예외 전파](/assets/img/springdb/exception_propagation.png)

- 예외를 처리하지 못하고 계속 던지면 최종적으로 `main()` 밖으로 예외가 던져짐
- 예외 정보와 스택 트레이스를 출력하고 시스템 종료
- 웹 애플리케이션의 경우 오류 페이지 표시

<br/><br/>

## 체크 예외

### 체크 예외 특징

- `Exception`과 그 하위 예외는 모두 컴파일러가 체크하는 체크 예외
- 단, `RuntimeException`은 예외 (언체크 예외)
- 체크 예외는 잡아서 처리하거나, 던지거나 둘 중 하나를 필수로 선택해야 함

### 체크 예외 처리 방식

- [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/exception/basic/CheckedAppTest.java)

![체크 예외 처리](/assets/img/springdb/checked_exception_sequence.png)

- **예외 잡아서 처리**

  ```java
  public void callCatch() {
      try {
          repository.call();
      } catch (MyCheckedException e) {
          // 예외 처리 로직
          log.info("예외 처리, message={}", e.getMessage(), e);
      }
  }
  ```

- **예외 던지기**

  ```java
  public void callThrow() throws MyCheckedException {
      repository.call();
  }
  ```

### 체크 예외 장단점

- **장점**
    - 개발자가 실수로 예외를 누락하지 않도록 컴파일러가 체크
    - 실수로 예외를 누락하면 컴파일 오류로 확인 가능

- **단점**
    - 개발자가 모든 체크 예외를 반드시 잡거나 던지도록 처리해야 함
    - 너무 번거롭고 실용적이지 않음

<br/><br/>

## 언체크 예외

### 언체크 예외 특징

- `RuntimeException`과 그 하위 예외는 언체크 예외로 분류
- 컴파일러가 예외를 체크하지 않음
- 체크 예외와 달리 `throws`를 선언하지 않아도 됨

### 언체크 예외 처리 방식

- [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/exception/basic/UncheckedAppTest.java)

![언체크 예외 전파](/assets/img/springdb/unchecked_exception_sequence.png)

- **예외 잡아서 처리**

  ```java
  public void callCatch() {
      try {
          repository.call();
      } catch (MyUncheckedException e) {
          log.info("예외 처리, message={}", e.getMessage(), e);
      }
  }
  ```

- **throws 생략 가능**

  ```java
  // throws 선언 없이도 자동으로 던짐
  public void callThrow() {
      repository.call();
  }

  // 명시적 선언도 가능 (IDE 힌트용)
  public void callThrow() throws MyUncheckedException {
      repository.call();
  }
  ```

### 언체크 예외 장단점

- **장점**
  - 신경쓰고 싶지 않은 예외를 무시할 수 있음
  - 체크 예외처럼 예외를 강제로 의존하지 않아도 됨

- **단점**
  - 개발자가 실수로 예외를 누락할 수 있음

<br/><br/>

## 체크 예외와 언체크 예외 비교

### 비교 표

| 구분 | 체크 예외 | 언체크 예외 |
|------|-----------|-------------|
| **상속** | Exception (RuntimeException 제외) | RuntimeException |
| **컴파일러 체크** | 체크함 | 체크 안함 |
| **처리 강제** | 필수 (catch 또는 throws) | 선택 (생략 가능) |
| **throws 선언** | 필수 | 선택 |
| **장점** | 예외 누락 방지 | 코드 간결, 의존성 감소 |
| **단점** | 번거로움, 의존성 증가 | 예외 누락 가능 |

<br/><br/>

## 체크 예외의 문제점

### 복구 불가능한 예외

- 대부분의 예외는 복구가 불가능함
- `SQLException`
  - DB 문제
  - 개발자가 SQL 수정 필요
- `ConnectException`
  - 네트워크 문제
  - 시스템 관리자 개입 필요

- 공통 예외 처리 방법
  - 오류 로그 남기기
  - 개발자에게 알림 (메일, 슬랙 등)
  - 사용자에게 일반적인 오류 메시지 표시

### 의존 관계 문제

![의존 관계 문제](/assets/img/springdb/dependency_problem.png)

- **문제점**
  - Service와 Controller가 JDBC 기술에 의존하게 됨
  - JDBC에서 JPA로 기술 변경 시 모든 코드 수정 필요
  - OCP, DI 원칙 위배

  ```java
  // 불필요한 의존성
  class Controller {
      // SQLException에 의존하게 됨
      public void request() throws SQLException, ConnectException {
          service.logic();
      }
  }

  class Service {
      // SQLException에 의존하게 됨
      public void logic() throws SQLException, ConnectException {
          repository.call();
          networkClient.call();
      }
  }
  ```

### throws Exception의 위험성

```java
void method() throws Exception {

}
```
- 모든 예외를 던짐 → 체크 예외 기능 무효화
- 중요한 예외를 놓칠 수 있음
<br/><br/>

## 언체크 예외 활용

### 기본 원칙

1. **기본적으로 언체크(런타임) 예외를 사용**
2. **체크 예외는 비즈니스 로직상 의도적으로 던지는 예외에만 사용**

### 해결 방안

![런타임 예외 활용](/assets/img/springdb/runtime_exception_solution.png)

### 예외 전환

- [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/exception/basic/UncheckedAppTest.java)

```java
// 런타임 예외 정의
class RuntimeSQLException extends RuntimeException {
    public RuntimeSQLException(Throwable cause) {
        super(cause);  // 기존 예외 포함
    }
}

class RuntimeConnectException extends RuntimeException {
    public RuntimeConnectException(String message) {
        super(message);
    }
}
```
```java
// Repository: 체크 예외 -> 런타임 예외 전환
class Repository {
    public void call() {
        try {
            runSQL();
        } catch (SQLException e) {
            throw new RuntimeSQLException(e);  // 전환
        }
    }
}
```
```java
// Service: throws 선언 불필요
class Service {
    Repository repository = new Repository();
    NetworkClient networkClient = new NetworkClient();
    
    public void logic() {
        repository.call();
        networkClient.call();
    }
}
```
```java
// Controller: throws 선언 불필요
class Controller {
    Service service = new Service();
    
    public void request() {
        service.logic();
    }
}
```

### 런타임 예외 장점

- **의존성 제거**
  - Service/Controller가 예외 타입을 몰라도 됨
- **코드 간결**
  - throws 선언 불필요
- **기술 변경 유연**
  - 공통 처리만 수정하면 됨

<br/><br/>

## 예외 포함과 스택 트레이스

### 예외 포함의 중요성

![예외 포함의 중요성](/assets/img/springdb/exception_cause.png)

### 올바른 예외 전환

```java
public void call() {
    try {
        runSQL();
    } catch (SQLException e) {
        throw new RuntimeSQLException(e);  // 기존 예외(e) 포함
    }
}
```


```
hello.jdbc.exception.basic.UncheckedAppTest$RuntimeSQLException: 
java.sql.SQLException: ex
    at UncheckedAppTest$Repository.call(UncheckedAppTest.java:61)
    at UncheckedAppTest$Service.logic(UncheckedAppTest.java:45)
    at UncheckedAppTest$Controller.request(UncheckedAppTest.java:35)
Caused by: java.sql.SQLException: ex          // 원본 예외 확인 가능
    at UncheckedAppTest$Repository.runSQL(UncheckedAppTest.java:66)
    at UncheckedAppTest$Repository.call(UncheckedAppTest.java:59)
```

### 잘못된 예외 전환

```java
public void call() {
    try {
        runSQL();
    } catch (SQLException e) {
        throw new RuntimeSQLException();  // 기존 예외(e) 제외
    }
}
```


```
hello.jdbc.exception.basic.UncheckedAppTest$RuntimeSQLException: null
    at UncheckedAppTest$Repository.call(UncheckedAppTest.java:61)
    at UncheckedAppTest$Service.logic(UncheckedAppTest.java:45)
```
- 원본 SQLException 정보 손실
- DB 오류 원인 파악 불가능

### 올바른 로그 출력

```java
@Test
void printEx() {
    Controller controller = new Controller();
    try {
        controller.request();
    } catch (Exception e) {
        // 마지막 파라미터로 예외 전달
        log.info("예외 발생, message={}", e.getMessage(), e);
        
        // 예외만 전달
        log.info("ex", e);
        
        // System.out 사용 지양
        // e.printStackTrace();
    }
}
```

<br/><br/>

## 런타임 예외 문서화

### 문서화의 필요성

- 런타임 예외는 컴파일러가 체크하지 않으므로 문서화가 중요함

### JavaDoc 주석

```java
/**
 * Make an instance managed and persistent.
 * @param entity entity instance
 * @throws EntityExistsException if the entity already exists.
 * @throws IllegalArgumentException if the instance is not an entity
 * @throws TransactionRequiredException if there is no transaction
 */
public void persist(Object entity);
```

### 코드에 명시

```java
/**
 * Issue a single SQL execute, typically a DDL statement.
 * @param sql static SQL to execute
 * @throws DataAccessException if there is any problem
 */
void execute(String sql) throws DataAccessException;
```

- **효과**
    - IDE에서 예외 확인 가능
    - 개발자가 중요한 예외 인지
    - 처리 필요 시 catch 가능

<br/><br/>

## 예외 선택 가이드

### 기준

![예외 선택 기준](/assets/img/springdb/exception_selection.png)

### 안티 패턴

```java
// throws Exception 사용
void method() throws Exception { }
```

```java
// 예외 무시
try {
} catch (Exception e) {
    // 아무것도 하지 않음
}
```

```java
// 예외 전환 시 원본 예외 미포함
throw new CustomException();  // e를 포함하지 않음
```

```java
// System.out으로 예외 출력
e.printStackTrace();  // 로그 사용할 것
```

<br/><br/>

## 요약 정리

- 자바 예외는 `Object` → `Throwable` → `Error/Exception` → `RuntimeException` 계층 구조를 가짐
- **체크 예외**는 `Exception`을 상속하며 컴파일러가 처리를 강제하고, **언체크 예외**는 `RuntimeException`을 상속하며 처리가 선택적임
- 체크 예외의 문제점은 복구 불가능한 예외가 많고 불필요한 의존성을 만든다는 것임
- 실무에서는 **런타임 예외를 기본으로 사용**하고 비즈니스 예외만 선택적으로 체크 예외를 사용함
- 예외 전환 시 반드시 **기존 예외를 포함**하여 스택 트레이스를 유지해야 함
- 런타임 예외는 컴파일러가 체크하지 않으므로 JavaDoc과 `throws`로 **문서화**가 필수임
- 최종적으로 시스템 예외는 런타임 예외로 전환하고, 원본 예외를 항상 포함하며, 공통 예외 처리(ControllerAdvice)를 활용해야 함

<br/><br/>

## 연습 문제

1. 자바 예외 계층 구조에서 애플리케이션 로직이 일반적으로 처리하지 않아야 하는 가장 심각한 오류 유형은 무엇일까요?

   a. Error

   - Error는 복구 불가능한 심각한 시스템 문제
   - 애플리케이션 로직에서 잡는 것은 일반적으로 권장되지 않음
   - Exception 하위의 예외들만 주로 처리

2. 자바의 체크 예외(Checked Exception)와 언체크 예외(Unchecked Exception)의 가장 근본적인 차이점은 무엇일까요?

   a. 컴파일러가 처리/선언 의무를 검사하는지 여부

   - 컴파일러가 예외 처리 의무를 검사하는지가 핵심 기준
   - 체크 예외는 컴파일러가 강제, 언체크 예외는 선택적

3. 메서드에서 체크 예외를 발생시킬 수 있는 경우, 해당 메서드를 호출하는 쪽에서 컴파일 오류 없이 진행하기 위한 필수적인 처리 방법은 무엇일까요?

   a. try-catch 블록으로 예외를 잡거나 throws 키워드로 선언하여 던진다.

   - 체크 예외는 컴파일러가 처리를 강제
   - 호출하는 곳에서는 반드시 예외를 직접 잡거나 던진다고 선언해야 함

4. 일반적인 애플리케이션 개발에서 데이터베이스 접근 오류(SQLException)나 네트워크 연결 오류(ConnectException)와 같이 시스템 레벨의, 대부분 복구 불가능한 예외를 처리할 때 더 선호되는 예외 유형과 그 이유는 무엇일까요?

   a. 언체크 예외 - 호출 체인에 불필요한 의존성을 만들지 않기 때문

   - 시스템 레벨의 복구 불가능한 오류는 언체크 예외로 전환
   - 호출 체인에 기술 의존성을 만들지 않고 공통으로 처리하는 것이 유연함

5. 한 예외를 잡아서 새로운 예외로 변환하여 다시 던질 때, 디버깅 시 원인(Root Cause)을 쉽게 파악하기 위해 가장 중요한 실천 방법은 무엇일까요?

   a. 새로운 예외 생성 시 이전 예외를 'cause' 인자로 전달한다.

   - 새로운 예외를 만들 때 이전 예외를 'cause'로 전달
   - 스택 트레이스에서 'Caused by'를 통해 원인 예외 확인 가능
   - 근본 원인 추적에 필수적

<br/><br/>

## Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/스프링-db-1)
