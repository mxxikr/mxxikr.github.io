---
title: "김영한의 스프링 핵심 원리 기본편 - 컴포넌트 스캔"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-11 10:30:00 +0900
category:
  - [Framework, Spring]
tags: [spring, java, component-scan, autowired, dependency-injection]
math: false
mermaid: false
---

# 컴포넌트 스캔

- 김영한님의 스프링 핵심 원리 강의에서 컴포넌트 스캔을 이용한 자동 빈 등록과 @Autowired를 이용한 자동 의존관계 주입을 정리함

<br/><br/>

## 컴포넌트 스캔이 필요한 이유

### 기존 방식의 문제점

```java
@Configuration
public class AppConfig {
    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }

    @Bean
    public DiscountPolicy discountPolicy() {
        return new RateDiscountPolicy();
    }
}
```

- 등록할 빈이 수십, 수백 개면 일일이 등록하기 번거로움
- 설정 정보가 커짐
- 누락 문제 발생 가능

- **해결책**

  - `@ComponentScan`
    - 자동으로 스프링 빈 등록
  - `@Autowired`
    - 자동으로 의존관계 주입

<br/><br/>

## 컴포넌트 스캔 기본 사용법

### AutoAppConfig 설정

```java
@Configuration
@ComponentScan(
    excludeFilters = @Filter(type = FilterType.ANNOTATION,
                             classes = Configuration.class)
)
public class AutoAppConfig {
}
```

- `@ComponentScan`
  - 컴포넌트 스캔 활성화
- `@Bean` 설정이 없음
- `excludeFilters`
  - 기존 설정 정보 제외 (예제 코드 유지용)
- `@Configuration`도 스캔 대상 (내부에 `@Component` 포함)

### 각 클래스에 @Component 추가

```java
@Component
public class MemoryMemberRepository implements MemberRepository {
}
```

```java
@Component
public class RateDiscountPolicy implements DiscountPolicy {
}
```

```java
@Component
public class MemberServiceImpl implements MemberService {
    private final MemberRepository memberRepository;

    @Autowired
    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

```java
@Component
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    @Autowired
    public OrderServiceImpl(MemberRepository memberRepository,
                           DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

- `@Autowired`
  - 생성자에 붙이면 스프링 컨테이너가 자동으로 해당 빈을 찾아서 주입
  - 타입이 같은 빈을 찾아서 주입 (`getBean(MemberRepository.class)`와 동일)
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/AutoAppConfig.java)

### 테스트 코드

```java
ApplicationContext ac = new AnnotationConfigApplicationContext(AutoAppConfig.class);
MemberService memberService = ac.getBean(MemberService.class);
assertThat(memberService).isInstanceOf(MemberService.class);
```

```
ClassPathBeanDefinitionScanner - Identified candidate component class:
.. RateDiscountPolicy.class
.. MemberServiceImpl.class
.. MemoryMemberRepository.class
.. OrderServiceImpl.class
```

<br/><br/>

## 컴포넌트 스캔과 자동 의존관계 주입 동작 과정

### 1단계 - @ComponentScan - 빈 등록

- **빈 이름 규칙**

  - 기본값 - 클래스명의 맨 앞글자를 소문자로 변경
    - `MemberServiceImpl` → `memberServiceImpl`
  - 직접 지정
    - `@Component("memberService2")`

![컴포넌트 스캔 동작 과정](/assets/img/spring/spring-component-scan/component-scan-process.png)

### 2단계 - @Autowired - 의존관계 자동 주입

```java
@Component
public class MemberServiceImpl implements MemberService {
    private final MemberRepository memberRepository;

    @Autowired
    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

- **동작 흐름**

  1. MemberServiceImpl 생성 시도
  2. 생성자에 @Autowired 발견
  3. MemberRepository 타입의 빈을 스프링 컨테이너에서 찾음
  4. 찾은 빈(memoryMemberRepository)을 생성자에 주입
  5. MemberServiceImpl 생성 완료

![@Autowired 의존관계 주입](/assets/img/spring/spring-component-scan/autowired-injection.png)

<br/><br/>

## 탐색 위치와 기본 스캔 대상

### 탐색 위치 지정

```java
@ComponentScan(
    basePackages = "hello.core"
)
```

- `basePackages`
  - 탐색할 패키지의 시작 위치 지정
- `basePackages` (여러 개)
  - 여러 시작 위치 지정
  - `{"hello.core", "hello.service"}`
- `basePackageClasses`
  - 지정한 클래스의 패키지를 시작 위치로
- 미지정
  - `@ComponentScan`이 붙은 클래스의 패키지가 시작

### 권장 방법

```java
package com.hello;

@Configuration
@ComponentScan
public class AppConfig {
}
```

- 설정 정보를 프로젝트 최상단에 위치
- `com.hello` 하위 패키지가 모두 스캔 대상
- 스프링 부트도 이 방식을 기본으로 사용

- **스프링 부트의 기본 방식**

  ```java
  @SpringBootApplication  // 내부에 @ComponentScan 포함
  public class CoreApplication {
      public static void main(String[] args) {
          SpringApplication.run(CoreApplication.class, args);
      }
  }
  ```

<br/><br/>

## 컴포넌트 스캔 기본 대상

### 스캔 대상 애노테이션

`@ComponentScan`은 `@Component`뿐만 아니라 다음 애노테이션도 스캔

- `@Component`
  - 컴포넌트 스캔 대상
- `@Controller`
  - 스프링 MVC 컨트롤러 (MVC 컨트롤러로 인식)
- `@Service`
  - 비즈니스 로직 계층 (특별한 처리 없음, 개발자 인식용)
- `@Repository`
  - 데이터 접근 계층 (데이터 계층 예외를 스프링 예외로 변환)
- `@Configuration`
  - 스프링 설정 정보 (싱글톤 유지를 위한 추가 처리)

![스캔 대상 애노테이션 계층](/assets/img/spring/spring-component-scan/scan-target-hierarchy.png)

### 애노테이션 내부 구조

```java
@Component
public @interface Controller {
}

@Component
public @interface Service {
}

@Component
public @interface Repository {
}

@Component
public @interface Configuration {
}
```

- 애노테이션에는 상속 관계가 없음
- 특정 애노테이션이 다른 애노테이션을 포함하는 것을 인식하는 것은 스프링이 지원하는 기능

<br/><br/>

## 필터

### 필터 옵션

```java
@ComponentScan(
    includeFilters = @Filter(...),  // 스캔 대상 추가
    excludeFilters = @Filter(...)   // 스캔 대상 제외
)
```

### FilterType 옵션

- `ANNOTATION`
  - 애노테이션 인식 (기본값)
- `ASSIGNABLE_TYPE`
  - 지정한 타입과 자식 타입 인식
- `ASPECTJ`
  - AspectJ 패턴 사용
- `REGEX`
  - 정규 표현식
- `CUSTOM`
  - `TypeFilter` 인터페이스 구현

### 필터 적용 예제

```java
@Configuration
@ComponentScan(
    includeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyIncludeComponent.class),
    excludeFilters = @Filter(type = FilterType.ANNOTATION, classes = MyExcludeComponent.class)
)
static class ComponentFilterAppConfig {
}
```

- `includeFilters` 에 `MyIncludeComponent` 애노테이션을 추가해서 `BeanA`가 스프링 빈에 등록됨
- `excludeFilters` 에 `MyExcludeComponent` 애노테이션을 추가해서 `BeanB`가 스프링 빈에 등록됨
- 스프링 부트의 기본 설정에 맞추어 사용하는 것을 권장
  - `@Component`면 충분하므로 `includeFilters`는 거의 사용 안 함
  - `excludeFilters`는 간혹 사용하지만 많지 않음
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/scan/filter/ComponentFilterAppConfigTest.java)

<br/><br/>

## 중복 등록과 충돌

### 자동 빈 등록 vs 자동 빈 등록

- 두 클래스의 빈 이름이 같으면 `ConflictingBeanDefinitionException` 발생

### 수동 빈 등록 vs 자동 빈 등록

```java
@Component
public class MemoryMemberRepository implements MemberRepository {
}
```

```java
@Configuration
@ComponentScan
public class AutoAppConfig {

    @Bean(name = "memoryMemberRepository")
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```

- **스프링 기본 동작 (과거)**

  - 수동 빈이 자동 빈을 오버라이딩 (수동 우선)
  - 설정이 꼬여서 발생하는 경우가 대부분
  - 잡기 어려운 애매한 버그 발생

- **스프링 부트의 동작 (현재)**

  - 오류 발생
  - 애매한 버그를 방지하기 위해 명확하게 오류 발생

```
Consider renaming one of the beans or enabling overriding by setting
spring.main.allow-bean-definition-overriding=true
```

<br/><br/>

## 연습 문제

1. 컴포넌트 스캔은 왜 사용할까요?

   a. 빈 등록 자동화

   - 컴포넌트 스캔은 수많은 스프링 빈을 일일이 설정 파일에 등록하는 번거로움을 줄이고 자동으로 작업을 자동화하여 개발 생산성을 높여줌
   - 수동 등록의 tedium을 줄이기 위함임

2. 컴포넌트 스캔 빈의 의존관계는 어떻게 주입받을까요?

   a. @Autowired 사용

   - `@Autowired`를 사용하면 스프링 컨테이너가 해당 타입에 맞는 빈을 찾아서 자동으로 의존관계를 연결해줌
   - 수동 설정 없이 자동 주입이 가능해짐

3. 설정 기본값에서 컴포넌트 스캔을 시작하는 위치는 어디일까요?

   a. 설정 클래스 패키지

   - `@ComponentScan` 어노테이션에 basePackages를 지정하지 않으면, `@ComponentScan`이 붙은 설정 클래스의 패키지가 기본 탐색 시작 위치가 됨

4. `@Component` 외 기본 스캔 대상 어노테이션은?

   a. @Service

   - `@Component` 외에도 `@Controller`, `@Service`, `@Repository` 같은 스테레오타입 어노테이션들은 스캔 대상에 포함됨
   - 이것들은 `@Component`를 메타 어노테이션으로 가지고 있기 때문임

5. 스프링 부트에서 자동/수동 빈 이름 충돌 시 기본 동작은 무엇일까요?

   a. 오류 발생

   - 스프링 부트는 기본적으로 수동 빈과 자동 빈의 이름 충돌 시 예기치 못한 덮어쓰기를 방지하기 위해 오류를 발생시키고 애플리케이션 시작을 중단하도록 설정되어 있음

<br/><br/>

## 요약 정리

- **컴포넌트 스캔이 필요한 이유**
  - 빈 등록이 수십, 수백 개면 일일이 등록하기 번거로움
  - `@ComponentScan`과 `@Autowired`로 자동화
- **기본 사용법**
  - `@Configuration` + `@ComponentScan`
  - 각 클래스에 `@Component` 추가
  - 생성자에 `@Autowired` 추가
- **동작 과정**
  1. `@Component` 붙은 클래스를 스프링 빈으로 등록
  2. `@Autowired`로 의존관계 자동 주입
- **탐색 위치**
  - 설정 클래스를 프로젝트 최상단에 위치 권장
  - 스프링 부트는 `@SpringBootApplication` 사용
- **스캔 대상**
  - `@Component`, `@Controller`, `@Service`, `@Repository`, `@Configuration`
- **필터**
  - `includeFilters`, `excludeFilters` 사용 가능
  - 기본 설정 사용 권장
- **중복 충돌**
  - 자동 vs 자동
    - 오류 발생
  - 수동 vs 자동
    - 스프링 부트는 오류 발생 (과거는 수동 우선)

<br/><br/>

## Reference

- [김영한의 스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
