---
title: '[스프링 핵심 원리 기본편] 스프링 컨테이너와 스프링 빈'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-10 23:30:00 +0900
category: [Framework, Spring]
tags: [spring, java, container, bean, applicationcontext, beanfactory]
math: false
mermaid: false
---
# 스프링 컨테이너와 스프링 빈

- 김영한님의 스프링 핵심 원리 강의에서 스프링 컨테이너의 생성 과정, 빈 등록 및 조회 방법, BeanFactory와 ApplicationContext의 차이, 다양한 설정 형식을 정리함

<br/><br/>

## 스프링 컨테이너 생성

### 컨테이너 생성 코드

```java
ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
```

- `ApplicationContext`
  - 스프링 컨테이너 (인터페이스)
- `AnnotationConfigApplicationContext`
  - 구현체
- 설정 정보로 자바 클래스 또는 XML 사용 가능

<br/><br/>

## 스프링 컨테이너 생성 과정

![스프링 컨테이너 생성 과정](/assets/img/spring/spring-container-and-bean/container-creation-process.png)

### 1단계 - 스프링 컨테이너 생성

```java
new AnnotationConfigApplicationContext(AppConfig.class)
```

- 구성 정보 (`AppConfig.class`)를 파라미터로 전달
- 스프링 컨테이너 내부에 스프링 빈 저장소 생성

### 2단계 - 스프링 빈 등록

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

**빈 등록 규칙**

- 빈 이름
  - 기본값은 메서드 이름
  - 직접 지정 가능
    - `@Bean(name="customName")`
- 주의사항
  - 빈 이름은 중복되지 않도록 설정
  - 중복 시 오류 발생 또는 이전 빈이 덮어씌워짐

### 3단계 - 스프링 빈 의존관계 설정

```java
public MemberService memberService() {
    return new MemberServiceImpl(memberRepository());
}

public OrderService orderService() {
    return new OrderServiceImpl(
        memberRepository(),
        discountPolicy()
    );
}
```

- 설정 정보를 참고하여 의존관계 주입 (DI)
- 스프링 컨테이너는 설정 정보를 활용해서 의존관계를 자동으로 주입

<br/><br/>

## 컨테이너에 등록된 빈 조회

### 모든 빈 출력하기

```java
String[] beanDefinitionNames = ac.getBeanDefinitionNames();
for (String beanDefinitionName : beanDefinitionNames) {
    Object bean = ac.getBean(beanDefinitionName);
}
```

- `getBeanDefinitionNames()`
  - 스프링에 등록된 모든 빈 이름 조회
- `getBean(빈이름)`

  - 빈 이름으로 객체 조회

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/beanfind/ApplicationContextInfoTest.java)

### 애플리케이션 빈만 출력하기

```java
BeanDefinition beanDefinition = ac.getBeanDefinition(beanDefinitionName);
if (beanDefinition.getRole() == BeanDefinition.ROLE_APPLICATION) {
    Object bean = ac.getBean(beanDefinitionName);
}
```

**빈의 Role 구분**

- `ROLE_APPLICATION`
  - 사용자가 정의한 빈
- `ROLE_INFRASTRUCTURE`

  - 스프링 내부에서 사용하는 빈

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/beanfind/ApplicationContextInfoTest.java)

<br/><br/>

## 스프링 빈 조회 - 기본

```java
// 빈 이름 + 타입으로 조회
ac.getBean(빈이름, 타입)

// 타입으로만 조회
ac.getBean(타입)
```

- 조회 실패 시 `NoSuchBeanDefinitionException` 예외 발생
- 구체 타입으로 조회하면 유연성이 떨어지므로 인터페이스로 조회 권장
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/beanfind/ApplicationContextBasicFindTest.java)

<br/><br/>

## 스프링 빈 조회 - 동일한 타입이 둘 이상

### 문제 상황

```java
@Configuration
static class SameBeanConfig {
    @Bean
    public MemberRepository memberRepository1() {
        return new MemoryMemberRepository();
    }

    @Bean
    public MemberRepository memberRepository2() {
        return new MemoryMemberRepository();
    }
}
```

```java
// 동일한 타입이 둘 이상이면 중복 오류
assertThrows(NoUniqueBeanDefinitionException.class, () -> ac.getBean(MemberRepository.class));

// 빈 이름을 지정하면 해결
ac.getBean("memberRepository1", MemberRepository.class);

// 특정 타입을 모두 조회
Map<String, MemberRepository> beansOfType = ac.getBeansOfType(MemberRepository.class);
```

- 빈 이름을 지정해서 조회
- `getBeansOfType(타입)`으로 해당 타입의 모든 빈 조회
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/beanfind/ApplicationContextSameBeanFindTest.java)

<br/><br/>

## 스프링 빈 조회 - 상속 관계

### 원칙

- 부모 타입으로 조회하면 자식 타입도 함께 조회됨
- `Object` 타입으로 조회하면 모든 스프링 빈 조회

### 예제 코드

```java
@Configuration
static class TestConfig {
    @Bean
    public DiscountPolicy rateDiscountPolicy() {
        return new RateDiscountPolicy();
    }

    @Bean
    public DiscountPolicy fixDiscountPolicy() {
        return new FixDiscountPolicy();
    }
}
```

```java
// 부모 타입으로 조회시 자식이 둘 이상이면 중복 오류
assertThrows(NoUniqueBeanDefinitionException.class, () -> ac.getBean(DiscountPolicy.class));

// 빈 이름을 지정하면 해결
ac.getBean("rateDiscountPolicy", DiscountPolicy.class);

// 특정 하위 타입으로 조회
RateDiscountPolicy bean = ac.getBean(RateDiscountPolicy.class);

// 부모 타입으로 모두 조회
Map<String, DiscountPolicy> beansOfType = ac.getBeansOfType(DiscountPolicy.class);
```

- `Object`는 모든 자바 객체의 부모이므로 모든 스프링 빈이 조회됨
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/beanfind/ApplicationContextExtendsFindTest.java)

![상속 관계 빈 조회](/assets/img/spring/spring-container-and-bean/inheritance-query.png)

<br/><br/>

## BeanFactory와 ApplicationContext

### BeanFactory

- 스프링 컨테이너의 최상위 인터페이스
- 스프링 빈을 관리하고 조회하는 역할
- `getBean()` 제공

### ApplicationContext

- `BeanFactory`의 모든 기능 상속
- 빈 관리 기능 + 편리한 부가 기능 제공

**부가 기능**

- `MessageSource`
  - 국제화 기능 (한국어/영어 등)
- `EnvironmentCapable`
  - 로컬/개발/운영 환경 구분
- `ApplicationEventPublisher`
  - 이벤트 발행/구독 모델
- `ResourceLoader`
  - 파일/클래스패스/외부 리소스 조회

### 정리

- `ApplicationContext`는 `BeanFactory`의 기능 + 부가 기능 제공
- BeanFactory나 ApplicationContext를 스프링 컨테이너라 부름

![BeanFactory와 ApplicationContext 계층 구조](/assets/img/spring/spring-container-and-bean/beanfactory-applicationcontext.png)

<br/><br/>

## 다양한 설정 형식 지원

### 애노테이션 기반 자바 코드 설정

```java
ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);
```

**AppConfig.java**

```java
@Configuration
public class AppConfig {
    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```

### XML 설정

```java
ApplicationContext ac = new GenericXmlApplicationContext("appConfig.xml");
```

**appConfig.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="memberService" class="hello.core.member.MemberServiceImpl">
        <constructor-arg name="memberRepository" ref="memberRepository" />
    </bean>

    <bean id="memberRepository"
          class="hello.core.member.MemoryMemberRepository" />
</beans>
```

- Java 설정과 XML 설정은 구조가 유사함
- 최근에는 XML을 거의 사용하지 않음 (레거시 프로젝트에서만)
- XML 장점은 컴파일 없이 빈 설정 정보 변경 가능
- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/resources/appConfig.xml)

<br/><br/>

## 스프링 빈 설정 메타 정보 - BeanDefinition

### BeanDefinition 추상화

- 스프링이 다양한 설정 형식을 지원하는 이유
- 역할과 구현을 개념적으로 분리

**동작 방식**

1. Java 설정 → `AnnotatedBeanDefinitionReader` → `BeanDefinition` 생성
2. XML 설정 → `XmlBeanDefinitionReader` → `BeanDefinition` 생성
3. 스프링 컨테이너는 `BeanDefinition`만 인식

### BeanDefinition 정보

- `BeanClassName`
  - 생성할 빈의 클래스명
- `factoryBeanName`
  - 팩토리 역할의 빈 이름
    - ex) appConfig
- `factoryMethodName`
  - 빈을 생성할 팩토리 메서드
    - ex) memberService
- `Scope`
  - 싱글톤 (기본값)
- `lazyInit`
  - 지연 로딩 여부
- `InitMethodName`
  - 초기화 메서드명
- `DestroyMethodName`
  - 소멸 메서드명
- `Constructor arguments`
  - 생성자 주입 정보
- `Properties`
  - setter 주입 정보

### 정리

- `BeanDefinition`을 직접 생성하거나 사용할 일은 거의 없음
- 스프링이 다양한 설정 정보를 `BeanDefinition`으로 추상화해서 사용

![BeanDefinition 추상화 구조](/assets/img/spring/spring-container-and-bean/beandefinition-abstraction.png)

<br/><br/>

## 연습 문제

1. 스프링 컨테이너 (ApplicationContext)의 가장 중요한 역할은 무엇인가요?

   a. 빈 객체 관리와 의존관계 설정

   - 스프링 컨테이너는 빈 객체를 생성하고, 빈들 간의 의존관계를 자동으로 연결해주는 핵심 역할을 담당함
   - 애플리케이션이 구성 정보 대신 사용할 수 있도록 함

2. 다음 중 스프링에서 일반적으로 더 자주 사용되고 더 많은 추가 기능을 제공하는 IoC 컨테이너는 무엇일까요?

   a. ApplicationContext

   - ApplicationContext는 BeanFactory의 기능을 상속받고 메시지 소스, 환경 변수 등 개발에 필요한 다양한 부가 기능을 제공함
   - 따라서 대부분의 애플리케이션에서 ApplicationContext를 사용함

3. 스프링 컨테이너에서 동록된 빈을 조회하는 기본 방법은 무엇인가요?

   a. getBean()

   - applicationContext.getBean() 메서드는 빈 이름, 타입 또는 이름과 타입을 함께 사용하여 컨테이너에서 원하는 빈 객체를 가져오는 기본 기능임

4. 스프링 컨테이너에 같은 타입의 빈이 여러 개 있을 때, 타입으로만 빈을 조회하려 발생하는 예외는 무엇일까요?

   a. NoUniqueBeanDefinitionException

   - 타입으로만 빈을 조회했는데 동일한 타입의 빈이 두 개 이상이라면, 스프링은 어떤 빈을 선택해야 할지 알 수 없어 NoUniqueBeanDefinitionException 예외를 발생시킴

5. 스프링이 자바 코드, XML 등 다양한 설정 형식을 지원할 수 있도록 빈 설정 정보를 추상화해둔 내부 메타 정보는 무엇일까요?

   a. BeanDefinition

   - BeanDefinition은 스프링이 다양한 설정 형식을 읽어들여 빈 생성, 의존 관계 등 설정 메타 정보를 추상화해둔 것임
   - 컨테이너는 이 BeanDefinition 정보를 바탕으로 빈을 관리함

<br/><br/>

## 요약 정리

- **스프링 컨테이너 생성**
  - `AnnotationConfigApplicationContext`로 자바 설정 클래스 기반 컨테이너 생성
  - 스프링 빈 저장소를 관리
- **스프링 빈 등록**
  - `@Bean` 메서드를 호출해서 스프링 빈 저장소에 등록
  - 빈 이름은 메서드 이름 또는 직접 지정
- **스프링 빈 조회**
  - `getBean(빈이름, 타입)` 또는 `getBean(타입)`으로 조회
  - 동일한 타입이 여러 개면 빈 이름 지정 또는 `getBeansOfType()`
  - 부모 타입으로 조회하면 자식 타입도 함께 조회
- **BeanFactory vs ApplicationContext**
  - BeanFactory는 빈 관리 기본 기능
  - ApplicationContext는 빈 관리 + 부가 기능 (국제화, 환경변수, 이벤트, 리소스)
- **다양한 설정 형식**
  - Java Config (권장)
    - `@Configuration` + `@Bean`
  - XML
    - `<bean>` 태그
  - 모두 `BeanDefinition`으로 추상화되어 처리됨
- **BeanDefinition**
  - 스프링이 다양한 설정 형식을 지원하기 위한 추상화 메커니즘
  - 직접 사용할 일은 거의 없지만 내부 동작 이해에 도움

<br/><br/>

## Reference

- [스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
