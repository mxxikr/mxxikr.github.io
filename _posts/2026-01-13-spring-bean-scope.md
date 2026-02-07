---
title: '[스프링 핵심 원리 기본편] 빈 스코프'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-13 17:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, bean-scope, prototype, request, provider, proxy]
math: false
mermaid: false
---
# 빈 스코프

- 김영한님의 스프링 핵심 원리 강의에서 빈 스코프의 종류와 특징, 프로토타입 스코프와 싱글톤 스코프의 차이, 웹 스코프의 활용 방법, `Provider`와 프록시를 이용한 문제 해결 방법을 정리함

<br/><br/>

## 빈 스코프 개념

### 스코프(Scope)

- 빈이 존재할 수 있는 범위

### 스코프 종류

- **기본 스코프**
  - **싱글톤(`Singleton`)**
    - 스프링 컨테이너의 시작부터 종료까지 유지되는 가장 넓은 범위
  - **프로토타입(`Prototype`)**
    - 생성과 의존관계 주입까지만 관여하는 짧은 범위
- **웹 스코프**
  - **`Request`**
    - 웹 요청이 들어오고 나갈 때까지 유지
  - **`Session`**
    - 웹 세션 생성부터 종료까지 유지
  - **`Application`**
    - 서블릿 컨텍스트와 같은 범위로 유지
  - **`WebSocket`**
    - 웹 소켓과 동일한 생명주기

### 스코프별 사용 시기

| 스코프         | 사용 시기                                    |
| -------------- | -------------------------------------------- |
| **싱글톤**     | 대부분의 경우 (기본값)                       |
| **프로토타입** | 매번 새로운 객체가 필요할 때 (실무에서 드묾) |
| **`Request`**  | HTTP 요청별로 다른 인스턴스가 필요할 때      |
| **`Session`**  | 사용자 세션별로 다른 인스턴스가 필요할 때    |

<br/><br/>

## 스코프 지정 방법

### 컴포넌트 스캔 자동 등록

```java
@Scope("prototype")
@Component
public class HelloBean {}
```

### 수동 등록

```java
@Scope("prototype")
@Bean
PrototypeBean HelloBean() {
    return new HelloBean();
}
```

<br/><br/>

## 프로토타입 스코프

### 싱글톤과 프로토타입 동작 비교

- **싱글톤 빈**
  - 스프링 컨테이너에 요청 시 항상 **같은 인스턴스** 반환
  - 컨테이너 생성 시점에 초기화
  - 컨테이너 종료 시 `@PreDestroy` 호출됨
- **프로토타입 빈**
  - 스프링 컨테이너에 요청 시 항상 **새로운 인스턴스** 생성 및 반환
  - 빈 조회 시점에 생성 및 초기화
  - 컨테이너가 생성, 의존관계 주입, 초기화까지만 관여
  - `@PreDestroy` 같은 종료 메서드 **호출되지 않음**
  - 클라이언트가 직접 관리 책임

<br/><br/>

## 싱글톤 스코프 예제

### 코드

```java
@Scope("singleton")
static class SingletonBean {
    @PostConstruct
    public void init() {
        System.out.println("SingletonBean.init");
    }

    @PreDestroy
    public void destroy() {
        System.out.println("SingletonBean.destroy");
    }
}
```

### 실행 결과

```text
SingletonBean.init
singletonBean1 = hello.core.scope.SingletonBean@54504ecd
singletonBean2 = hello.core.scope.SingletonBean@54504ecd
SingletonBean.destroy
```

- 같은 인스턴스 반환
- 종료 메서드 호출됨

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/scope/SingletonTest.java)

<br/><br/>

## 프로토타입 스코프 예제

### 코드

```java
@Scope("prototype")
static class PrototypeBean {
    @PostConstruct
    public void init() {
        System.out.println("PrototypeBean.init");
    }

    @PreDestroy
    public void destroy() {
        System.out.println("PrototypeBean.destroy");
    }
}
```

### 실행 결과

```text
find prototypeBean1
PrototypeBean.init
find prototypeBean2
PrototypeBean.init
prototypeBean1 = hello.core.scope.PrototypeBean@13d4992d
prototypeBean2 = hello.core.scope.PrototypeBean@302f7971
```

- 다른 인스턴스 반환
- `destroy` 호출 안됨

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/scope/PrototypeTest.java)

<br/><br/>

## 프로토타입과 싱글톤 함께 사용 시 문제점

### 문제 상황

- 싱글톤 빈이 프로토타입 빈을 의존관계 주입으로 사용하면
  - 싱글톤 빈 생성 시점에 프로토타입 빈이 주입됨
  - 이후 같은 프로토타입 빈 인스턴스를 계속 사용
  - **매번 새로운 인스턴스를 사용하려는 의도와 다름**

### 문제 예제

```java
static class ClientBean {
    private final PrototypeBean prototypeBean;

    @Autowired
    public ClientBean(PrototypeBean prototypeBean) {
        this.prototypeBean = prototypeBean;
    }

    public int logic() {
        prototypeBean.addCount();
        return prototypeBean.getCount();
    }
}
```

- `ClientBean`은 싱글톤이므로 생성 시점에 한 번만 주입받음
- 이후 `logic()` 호출 시 같은 `prototypeBean` 사용
- `count`가 계속 증가하는 문제 발생

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/scope/SingletonWithPrototypeTest1.java)

<br/><br/>

## Provider 패턴으로 해결

### ObjectProvider 사용

```java
static class ClientBean {
    @Autowired
    private ObjectProvider<PrototypeBean> prototypeBeanProvider;

    public int logic() {
        PrototypeBean prototypeBean = prototypeBeanProvider.getObject();
        prototypeBean.addCount();
        return prototypeBean.getCount();
    }
}
```

- **특징**
  - `getObject()` 호출 시점에 스프링 컨테이너에서 빈 조회 (DL: Dependency Lookup)
  - 매번 새로운 프로토타입 빈 생성
  - 스프링에 의존적이지만 기능이 단순하고 편리

### JSR-330 Provider 사용

- 의존성 추가 필요

  ```gradle
  implementation 'javax.inject:javax.inject:1'
  ```

  ```java
  static class ClientBean {
      @Autowired
      private Provider<PrototypeBean> provider;

      public int logic() {
          PrototypeBean prototypeBean = provider.get();
          prototypeBean.addCount();
          return prototypeBean.getCount();
      }
  }
  ```

- **특징**

  - 자바 표준 (JSR-330)
  - `get()` 메서드 하나로 단순
  - 스프링이 아닌 다른 컨테이너에서도 사용 가능
  - 별도 라이브러리 필요

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/scope/SingletonWithPrototypeTest1.java)

<br/><br/>

## 웹 스코프

### `Request` 스코프 특징

- HTTP 요청 당 하나씩 생성
- HTTP 요청이 끝나는 시점에 소멸
- 각 요청마다 별도의 빈 인스턴스 생성 및 관리
- 종료 메서드 호출됨

### `Request` 스코프 예제

```java
@Component
@Scope(value = "request")
public class MyLogger {
    private String uuid;
    private String requestURL;

    public void setRequestURL(String requestURL) {
        this.requestURL = requestURL;
    }

    public void log(String message) {
        System.out.println("[" + uuid + "][" + requestURL + "] " + message);
    }

    @PostConstruct
    public void init() {
        uuid = UUID.randomUUID().toString();
        System.out.println("[" + uuid + "] request scope bean create:" + this);
    }

    @PreDestroy
    public void close() {
        System.out.println("[" + uuid + "] request scope bean close:" + this);
    }
}
```

### 문제점

```text
Error creating bean with name 'myLogger': Scope 'request' is not active
```

- `Request` 스코프 빈은 실제 HTTP 요청이 와야 생성 가능
- 애플리케이션 실행 시점에 오류 발생

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/common/MyLogger.java)

<br/><br/>

## Provider

```java
@Controller
@RequiredArgsConstructor
public class LogDemoController {
    private final LogDemoService logDemoService;
    private final ObjectProvider<MyLogger> myLoggerProvider;

    @RequestMapping("log-demo")
    @ResponseBody
    public String logDemo(HttpServletRequest request) {
        String requestURL = request.getRequestURL().toString();
        MyLogger myLogger = myLoggerProvider.getObject();
        myLogger.setRequestURL(requestURL);
        myLogger.log("controller test");
        logDemoService.logic("testId");
        return "OK";
    }
}
```

```text
[d06b992f...] request scope bean create
[d06b992f...][http://localhost:8080/log-demo] controller test
[d06b992f...][http://localhost:8080/log-demo] service id = testId
[d06b992f...] request scope bean close
```

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/web)

### 프록시 모드

- 프록시 설정

  ```java
  @Component
  @Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
  public class MyLogger {
      // 코드 동일
  }
  ```

- **프록시 모드 옵션**

  - **`TARGET_CLASS`**
    - 적용 대상이 클래스인 경우
  - **`INTERFACES`**
    - 적용 대상이 인터페이스인 경우

- 프록시 사용 시 `Controller`와 `Service`

  ```java
  @Controller
  @RequiredArgsConstructor
  public class LogDemoController {
      private final LogDemoService logDemoService;
      private final MyLogger myLogger; // Provider 없이 직접 주입

      @RequestMapping("log-demo")
      @ResponseBody
      public String logDemo(HttpServletRequest request) {
          String requestURL = request.getRequestURL().toString();
          myLogger.setRequestURL(requestURL);
          myLogger.log("controller test");
          logDemoService.logic("testId");
          return "OK";
      }
  }
  ```

  ```java
  @Service
  @RequiredArgsConstructor
  public class LogDemoService {
      private final MyLogger myLogger; // Provider 없이 직접 주입

      public void logic(String id) {
          myLogger.log("service id = " + id);
      }
  }
  ```

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/web)

<br/><br/>

## 프록시 동작 원리

### 프록시 객체 확인

```java
System.out.println("myLogger = " + myLogger.getClass());
```

```text
myLogger = class hello.core.common.MyLogger$$EnhancerBySpringCGLIB$$b68b726d
```

### 동작 메커니즘

1. `CGLIB` 라이브러리가 `MyLogger`를 상속받은 **가짜 프록시 객체** 생성
2. 스프링 컨테이너에 가짜 프록시 객체 등록
3. 의존관계 주입 시 가짜 프록시 객체 주입
4. 클라이언트가 `myLogger.log()` 호출 시
   - 가짜 프록시 객체의 메서드 호출
   - 프록시 객체가 실제 `Request` 스코프 빈의 `log()` 호출 (위임)
5. 가짜 프록시 객체는 싱글톤처럼 동작하지만, 실제 빈은 요청마다 새로 생성

### 특징

- 클라이언트는 싱글톤 빈처럼 편리하게 사용
- 진짜 객체 조회를 필요한 시점까지 **지연 처리**
- 다형성과 `DI` 컨테이너의 강점 활용
- 애노테이션 설정만으로 프록시 객체로 대체 가능

### Provider와 프록시

| 구분          | ObjectProvider / JSR-330 Provider | 프록시 모드           |
| ------------- | --------------------------------- | --------------------- |
| **코드 수정** | Provider 주입 필요                | 기존 코드 그대로 사용 |
| **편의성**    | `getObject()`/`get()` 호출 필요   | 직접 사용 가능        |
| **설정**      | 코드 수정                         | 애노테이션만 추가     |
| **권장**      | `DL`이 명시적으로 필요할 때       | 일반적인 경우         |

<br/><br/>

## DI와 DL

### `DI` (Dependency Injection)

- 의존관계를 외부에서 주입

### `DL` (Dependency Lookup)

- 필요한 의존관계를 직접 찾아서 사용

<br/><br/>

## 연습 문제

1. 프로토타입 스코프 빈의 파괴(destruction)는 누가 담당할까요?

   a. 해당 빈을 요청한 클라이언트

   - 프로토타입 빈은 컨테이너가 생성, `DI`, 초기화까지만 담당하고 이후 관리를 클라이언트에게 넘기므로 `@PreDestroy` 같은 컨테이너의 파괴 메서드는 호출되지 않음

2. 여러 HTTP 요청이 동시에 들어올 때, `Request` 스코프 빈은 어떻게 동작할까요?

   a. 각 요청마다 별도의 인스턴스가 만들어짐

   - `Request` 스코프는 HTTP 요청 사이클마다 완전히 별개의 인스턴스를 생성하고 관리하며, 요청 데이터를 분리할 수 있음

3. 싱글톤 빈에서 프로토타입 빈을 의존성 주입(`DI`)하면 어떤 문제가 발생할 수 있나요?

   a. 싱글톤 빈 안에서 항상 같은 프로토타입 인스턴스가 사용됨

   - 싱글톤 빈은 컨테이너 시작 시점에 계속되므로 `DI` 단 한 번만 이뤄지고, 이때 주입받은 프로토타입 빈 인스턴스를 싱글톤 빈이 계속 재사용하여 문제 발생

4. 싱글톤 빈에서 스코프가 짧은 빈(프로토타입, `Request` 등)을 새롭게 사용하기 위한 `Provider`나 `Proxy` 방식의 핵심 원리는 무엇인가요?

   a. 필요한 시점까지 빈 조회/생성 지연

   - `Provider`나 `Proxy`는 싱글톤 빈 생성 시 실제 스코프 빈 주입 대신 조회를 지연시켜 스코프 활성화 시점에 새로운 인스턴스를 얻거나 프록시를 통해 위임받아 사용할 수 있음

5. 싱글톤 빈에서 `Request` 스코프 빈을 사용할 때, `Proxy` 방식을 통해 얻는 중요한 이점은 무엇인가요?

   a. 해당 빈을 사용하는 클라이언트 코드가 간결해짐

   - `Proxy` 방식을 사용하면 싱글톤 빈은 마치 일반 빈을 사용하는 것처럼 편리하게 `Request` 스코프 빈의 메서드를 호출할 수 있고, `Provider`처럼 `getObject()`를 명시적으로 호출할 필요가 없어 코드가 간결해짐

<br/><br/>

## 요약 정리

- **빈 스코프**
  - 빈이 존재할 수 있는 범위
  - 싱글톤, 프로토타입, `Request`, `Session`, `Application`, `WebSocket`
- 싱글톤
  - 항상 같은 인스턴스, 컨테이너 종료 시까지 관리
- 프로토타입
  - 매번 새로운 인스턴스, 생성/`DI`/초기화까지만 관여
- **프로토타입 + 싱글톤 문제**
  - 싱글톤 빈이 프로토타입 빈 주입받으면 같은 인스턴스 계속 사용
  - `Provider` 또는 프록시로 해결
- **`Provider` 패턴**
  - `ObjectProvider`
    - 스프링 의존, 간편
  - `JSR-330 Provider`
    - 자바 표준, 라이브러리 필요
- **웹 스코프**
  - `Request`
    - HTTP 요청마다 생성
  - `Session`
    - 웹 세션마다 생성
- **프록시 모드**
  - `@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)`
  - `CGLIB`로 가짜 프록시 객체 생성
  - 싱글톤처럼 편리하게 사용 가능
  - 실제 빈은 필요한 시점에 생성 (지연 처리)
- **주의사항**
  - 특별한 스코프는 꼭 필요한 곳에만 최소화해서 사용
  - 프록시 모드는 싱글톤처럼 보이지만 실제로는 다르게 동작
  - 무분별한 사용은 유지보수를 어렵게 만듦

<br/><br/>

## Reference

- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
