---
title: '[스프링 핵심 원리 기본편] 빈 생명주기 콜백'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-12 15:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, bean-lifecycle, callback, postconstruct, predestroy, initializingbean]
math: false
mermaid: false
---
# 빈 생명주기 콜백

- 김영한님의 스프링 핵심 원리 강의에서 스프링 빈의 생명주기와 콜백 메서드, 초기화와 소멸 작업을 처리하는 3가지 방법을 정리함

<br/><br/>

## 빈 생명주기 콜백이 필요한 이유

### 사용 사례

- 데이터베이스 커넥션 풀
- 네트워크 소켓

### 애플리케이션 실행 흐름

![애플리케이션 생명주기 흐름](/assets/img/spring/spring-bean-lifecycle-callback/application-lifecycle-flow.png)

### 필요한 작업

- 객체의 **초기화** 작업
- 객체의 **종료** 작업

<br/><br/>

## 문제 상황 - 초기화 시점 파악

### 문제 상황 설명

- 생성자에서 `url`이 `null`인 상태로 `connect()` 호출
- 이후 `setUrl()`로 의존관계 주입되지만 이미 연결 시도는 종료됨

- [전체 코드 보기](https://github.com/mxxikr/spring-core-basic/blob/master/src/test/java/hello/core/lifecycle)

### 실행 결과 (문제 발생)

```text
생성자 호출, url = null
connect: null
call: null message = 초기화 연결 메시지
```

### 문제 분석

![문제 분석 흐름](/assets/img/spring/spring-bean-lifecycle-callback/problem-analysis-flow.png)

<br/><br/>

## 스프링 빈의 라이프사이클

### 기본 라이프사이클

```
객체 생성 → 의존관계 주입
```

- 스프링 빈은 객체를 생성하고, **의존관계 주입이 다 끝난 다음**에야 필요한 데이터를 사용할 수 있는 준비가 완료됨

### 스프링 빈의 이벤트 라이프사이클

![스프링 빈 이벤트 라이프사이클](/assets/img/spring/spring-bean-lifecycle-callback/bean-event-lifecycle.png)

### 콜백 시점

- **초기화 콜백**
  - 빈이 생성되고, 빈의 의존관계 주입이 완료된 후 호출
- **소멸전 콜백**
  - 빈이 소멸되기 직전에 호출

<br/><br/>

## 객체 생성과 초기화 분리 원칙

### 생성자의 역할

- 필수 정보(파라미터)를 받음
- 메모리를 할당해서 객체를 생성

### 초기화의 역할

- 생성된 값들을 활용
- 외부 커넥션 연결 등 **무거운 동작** 수행

### 권장 - 생성자와 초기화를 명확하게 분리

- 생성자는 객체 생성만 수행
- 초기화 메서드는 무거운 동작 수행 (외부 커넥션 연결 등)
- 단순한 초기화는 생성자에서 처리 가능

<br/><br/>

## 빈 생명주기 콜백 3가지 방법

### 방법 비교표

| 방법                            | 장점                                       | 단점                                                   | 권장도            |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------ | ----------------- |
| **인터페이스**                  | 초기 스프링 지원                           | 스프링 의존, 이름 변경 불가, 외부 라이브러리 적용 불가 | 거의 사용 안 함   |
| **설정 정보**                   | 스프링 독립, 외부 라이브러리 적용 가능     | 설정 코드 필요                                         | 외부 라이브러리용 |
| **@PostConstruct, @PreDestroy** | 편리, 자바 표준, 컴포넌트 스캔과 잘 어울림 | 외부 라이브러리 적용 불가                              | 권장              |

<br/><br/>

## 인터페이스 (`InitializingBean`, `DisposableBean`)

### 예제 코드

```java
public class NetworkClient implements InitializingBean, DisposableBean {

    // 초기화 콜백
    @Override
    public void afterPropertiesSet() throws Exception {
        connect();
        call("초기화 연결 메시지");
    }

    // 소멸 콜백
    @Override
    public void destroy() throws Exception {
        disConnect();
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-core-basic/blob/master/src/test/java/hello/core/lifecycle)

### 결과

- 초기화 메서드가 **의존관계 주입 완료 후** 호출됨
- 컨테이너 종료 시 소멸 메서드 호출됨

### 단점

| 단점                     | 설명                                            |
| ------------------------ | ----------------------------------------------- |
| **스프링 의존**          | 스프링 전용 인터페이스에 의존                   |
| **이름 변경 불가**       | 메서드 이름을 변경할 수 없음                    |
| **외부 라이브러리 불가** | 코드를 고칠 수 없는 외부 라이브러리에 적용 불가 |

- 스프링 초창기 방법으로 현재는 **거의 사용하지 않음**

<br/><br/>

## 설정 정보에 초기화, 소멸 메서드 지정

### 예제 코드

```java
public class NetworkClient {

    // 초기화 메서드 (이름 자유롭게 지정)
    public void init() {
        connect();
        call("초기화 연결 메시지");
    }

    // 종료 메서드 (이름 자유롭게 지정)
    public void close() {
        disConnect();
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-core-basic/blob/master/src/test/java/hello/core/lifecycle)

### 설정 정보에서 메서드 지정

```java
@Configuration
static class LifeCycleConfig {

    @Bean(initMethod = "init", destroyMethod = "close")
    public NetworkClient networkClient() {
        NetworkClient networkClient = new NetworkClient();
        networkClient.setUrl("http://hello-spring.dev");
        return networkClient;
    }
}
```

- 메서드 이름을 **자유롭게** 지정 가능
- 스프링 코드에 **의존하지 않음**
- **외부 라이브러리**에도 적용 가능

### 추론 기능

- `destroyMethod`의 기본값 = `"(inferred)"` (추론)
- `close`, `shutdown` 이름의 메서드를 **자동으로 호출**
- 대부분의 라이브러리는 `close`, `shutdown` 사용
- 종료 메서드를 따로 지정하지 않아도 자동으로 동작

<br/><br/>

## `@PostConstruct`, `@PreDestroy` 애노테이션 (권장)

### 예제 코드

```java
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

public class NetworkClient {

    @PostConstruct  // 초기화 콜백
    public void init() {
        connect();
        call("초기화 연결 메시지");
    }

    @PreDestroy  // 소멸 콜백
    public void close() {
        disConnect();
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-core-basic/blob/master/src/test/java/hello/core/lifecycle)

### 설정 코드

```java
@Configuration
static class LifeCycleConfig {

    @Bean
    public NetworkClient networkClient() {
        NetworkClient networkClient = new NetworkClient();
        networkClient.setUrl("http://hello-spring.dev");
        return networkClient;
    }
}
```

### 실행 결과

```text
생성자 호출, url = null
NetworkClient.init
connect: http://hello-spring.dev
call: http://hello-spring.dev message = 초기화 연결 메시지
Closing ...
NetworkClient.close
close: http://hello-spring.dev
```

### 특징

| 특징                   | 설명                                   |
| ---------------------- | -------------------------------------- |
| **최신 스프링 권장**   | 가장 권장하는 방법                     |
| **매우 편리**          | 애노테이션 하나만 붙이면 됨            |
| **자바 표준**          | `javax.annotation` 패키지 (`JSR-250`)  |
| **다른 컨테이너 지원** | 스프링이 아닌 다른 컨테이너에서도 동작 |
| **컴포넌트 스캔**      | 컴포넌트 스캔과 잘 어울림              |

### 패키지 정보

```java
import javax.annotation.PostConstruct;  // 자바 표준
import javax.annotation.PreDestroy;     // 자바 표준
```

### 단점

- 외부 라이브러리에는 적용 불가
- 외부 라이브러리는 코드를 수정할 수 없음
- 외부 라이브러리 초기화/종료 → `@Bean`의 `initMethod`, `destroyMethod` 사용

<br/><br/>

## 전체 비교 및 정리

### 3가지 방법 상세 비교

| 항목                | 인터페이스  | 설정 정보   | 애노테이션 |
| ------------------- | ----------- | ----------- | ---------- |
| **코드 침투성**     | 스프링 의존 | 스프링 독립 | 자바 표준  |
| **메서드명 자유도** | 고정        | 자유        | 자유       |
| **외부 라이브러리** | 불가        | 가능        | 불가       |
| **편리성**          | 보통        | 설정 필요   | 매우 편리  |
| **컴포넌트 스캔**   | 보통        | 보통        | 잘 어울림  |
| **추론 기능**       | 없음        | 있음        | 필요 없음  |

### 생명주기 콜백 흐름도

![생명주기 콜백 흐름](/assets/img/spring/spring-bean-lifecycle-callback/lifecycle-callback-flow.png)

<br/><br/>

## 실무 사용 가이드

### 일반적인 경우 (기본)

```java
@Component
public class MyService {

    @PostConstruct
    public void init() {
        // 초기화 로직
    }

    @PreDestroy
    public void close() {
        // 종료 로직
    }
}
```

- 직접 작성한 클래스
- 컴포넌트 스캔 사용
- 대부분의 경우

### 외부 라이브러리 사용 시

```java
@Configuration
public class AppConfig {

    @Bean(initMethod = "connect", destroyMethod = "disconnect")
    public ExternalLibrary externalLibrary() {
        return new ExternalLibrary();
    }
}
```

- 외부 라이브러리 (코드 수정 불가)
- 레거시 코드
- 특정 메서드명 사용 필요

### `destroyMethod` 추론 활용

```java
@Bean  // destroyMethod 생략
public DataSource dataSource() {
    HikariDataSource dataSource = new HikariDataSource();
    // HikariDataSource는 close() 메서드 있음
    // 자동으로 호출됨
    return dataSource;
}
```

- 대부분의 라이브러리가 `close()`, `shutdown()` 제공
- `destroyMethod` 생략 가능
- 자동으로 추론해서 호출

- [전체 코드 보기](https://github.com/mxxikr/spring-core-basic/blob/master/src/test/java/hello/core/lifecycle)

<br/><br/>

## 연습 문제

1. 스프링 빈 생명주기에서 객체 생성과 초기화 단계를 분리하는 주된 이유는 무엇일까요?

   a. 의존성 주입 완료 시점 문제 해결

   - 빈 생성과 의존성 주입이 이루어지는 주기가 다르므로, 초기화를 따로 했을 때 의존성이 모두 주입된 후에만 초기화 로직을 실행할 수 있음
   - 생성자는 주입된 값을 활용하고, 초기화는 주입 전후에 맞춰 분리함

2. `InitializingBean` 인터페이스의 `afterPropertiesSet()` 메서드는 빈 생명주기 중 언제 호출될까요?

   a. 의존성 주입이 완료된 후

   - `InitializingBean`의 `afterPropertiesSet`은 스프링이 해당 빈의 모든 의존성 주입(주로 `setter`/`field` 주입)을 마친 후에 호출함

3. `InitializingBean`, `DisposableBean` 인터페이스를 사용한 빈 생명주기 콜백 방식의 단점은 무엇일까요?

   a. 스프링 전용 인터페이스에 의존해야 함

   - `InitializingBean`/`DisposableBean`은 스프링 프레임워크 고유의 인터페이스라, 특정 프레임워크에 코드가 종속되어 유연성이 떨어짐
   - 매서드 이름도 고정되어 있어서 자유도가 낮음

4. `@PostConstruct`, `@PreDestroy` 어노테이션 방식이 권장되는 주된 이유는 무엇일까요?

   a. Java 표준(`JSR250`)으로 다른 컨테이너와 호환

   - `@PostConstruct`/`@PreDestroy`는 Java 표준 애노테이션이라 스프링뿐만 아니라 다양한 JavaEE 컨테이너에서도 사용할 수 있어 이식성이 좋음

5. 코드를 직접 수정할 수 없는 외부 라이브러리 객체 초기화/소멸에 적합한 스프링 빈 설정 방식은 무엇일까요?

   a. `@Bean` 등록 시 `initMethod`/`destroyMethod` 지정

   - 외부 라이브러리는 코드를 수정할 인터페이스를 구현하거나 애노테이션을 붙일 수 없어서, `@Bean` 등록 시 설정으로 초기화/소멸 메서드를 지정하는 방식을 써야 함

<br/><br/>

## 요약 정리

- **빈 생명주기 콜백이 필요한 이유**
  - 데이터베이스 커넥션 풀, 네트워크 소켓 등 애플리케이션 시작/종료 시점에 연결을 맺고 끊어야 함
- **스프링 빈의 라이프사이클**
  - 스프링 컨테이너 생성 → 스프링 빈 생성 → 의존관계 주입 → 초기화 콜백 → 사용 → 소멸전 콜백 → 스프링 종료
- **객체 생성과 초기화 분리**
  - 생성자
    - 객체 생성, 메모리 할당
  - 초기화 메서드
    - 무거운 동작 (외부 커넥션 연결 등)
- **빈 생명주기 콜백 3가지 방법**
  - 인터페이스 (`InitializingBean`, `DisposableBean`)
    - 거의 사용 안 함
  - 설정 정보 (`@Bean`의 `initMethod`, `destroyMethod`)
    - 외부 라이브러리용
  - `@PostConstruct`, `@PreDestroy` 애노테이션
    - 권장 (자바 표준)
- **종료 메서드 추론 기능**
  - `destroyMethod`의 기본값은 `(inferred)`
  - `close`, `shutdown` 메서드를 자동으로 호출
- **실무 권장 방법**
  - 일반적인 경우
    - `@PostConstruct`, `@PreDestroy` 사용
  - 외부 라이브러리
    - `@Bean`(`initMethod`, `destroyMethod`) 사용

<br/><br/>

## Reference

- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
