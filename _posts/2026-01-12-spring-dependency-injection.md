---
title: '[김영한의 스프링 핵심 원리 기본편] 의존관계 자동 주입'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-12 14:30:00 +0900
category: [Framework, Spring]
tags: [spring, java, dependency-injection, autowired, qualifier, primary, lombok]
math: false
mermaid: false
---
# 의존관계 자동 주입

- 김영한님의 스프링 핵심 원리 강의에서 다양한 의존관계 주입 방법, 생성자 주입을 권장하는 이유, `@Autowired`의 옵션 처리 방법, 조회 빈이 여러 개일 때 해결 방법, 롬복을 활용한 최신 트렌드를 정리함

<br/><br/>

## 다양한 의존관계 주입 방법

### 의존 관계 주입 방법

- 생성자 주입
- 수정자 주입(`setter` 주입)
- 필드 주입
- 일반 메서드 주입

<br/><br/>

## 생성자 주입

### 특징

- 생성자 호출 시점에 **딱 1번만** 호출
- **불변, 필수** 의존관계에 사용
- **생성자가 1개만** 있으면 `@Autowired` 생략 가능

### 생성자 주입 예시

```java
@Component
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    @Autowired  // 생성자가 1개면 생략 가능
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

### @Autowired 생략

```java
@Component
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    // @Autowired 생략 가능 (생성자가 1개만 있을 때)
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/order/OrderServiceImpl.java)

<br/><br/>

## 수정자 주입

### 특징

- **선택, 변경 가능성**이 있는 의존관계에 사용
- 자바빈 프로퍼티 규약의 수정자 메서드 방식

### 수정자 주입 예시

```java
@Component
public class OrderServiceImpl implements OrderService {
    private MemberRepository memberRepository;
    private DiscountPolicy discountPolicy;

    @Autowired
    public void setMemberRepository(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Autowired
    public void setDiscountPolicy(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }
}
```

- `@Autowired`의 기본 동작은 주입할 대상이 없으면 오류 발생
- 선택적으로 하려면 `@Autowired(required=false)` 사용

### 자바빈 프로퍼티 규약

```java
class Data {
    private int age;

    public void setAge(int age) {  // setter
        this.age = age;
    }

    public int getAge() {  // getter
        return age;
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

<br/><br/>

## 필드 주입

### 특징

- 코드가 간결하지만 **외부에서 변경 불가능**
- **테스트하기 힘듦** (치명적 단점)
- `DI` 프레임워크 없으면 아무것도 할 수 없음
- **사용하지 말 것**

### 필드 주입 예시

```java
@Component
public class OrderServiceImpl implements OrderService {
    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private DiscountPolicy discountPolicy;
}
```

### 사용 가능한 예외적 상황

- 테스트 코드
- `@Configuration` 같은 스프링 설정 목적

### @Bean의 파라미터 주입

```java
@Bean
OrderService orderService(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
    return new OrderServiceImpl(memberRepository, discountPolicy);
}
```

- `@Bean`의 파라미터에는 자동 주입됨

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

<br/><br/>

## 일반 메서드 주입

### 특징

- 한번에 여러 필드를 주입 받을 수 있음
- 일반적으로 **잘 사용하지 않음**

### 일반 메서드 주입 예시

```java
@Component
public class OrderServiceImpl implements OrderService {
    private MemberRepository memberRepository;
    private DiscountPolicy discountPolicy;

    @Autowired
    public void init(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

<br/><br/>

## 주입 방법 비교

| 방법            | 불변성 | `final` 사용 | 테스트 | 권장도          |
| --------------- | ------ | ------------ | ------ | --------------- |
| **생성자 주입** | 불변   | 가능         | 쉬움   | 권장            |
| **수정자 주입** | 가변   | 불가         | 보통   | 선택적 사용     |
| **필드 주입**   | 가변   | 불가         | 어려움 | 사용 금지       |
| **메서드 주입** | 가변   | 불가         | 보통   | 거의 사용 안 함 |

<br/><br/>

## 옵션 처리

### 주입할 스프링 빈이 없을 때

- 스프링 빈이 없어도 동작해야 할 때가 있음
  - `@Autowired`만 사용하면 주입할 대상이 없으면 오류 발생

### 옵션 처리 방법

```java
// @Autowired(required=false): 메서드 자체가 호출 안 됨
@Autowired(required = false)
public void setNoBean1(Member member) {
    System.out.println("setNoBean1 = " + member);
}

// @Nullable: null이 입력됨
@Autowired
public void setNoBean2(@Nullable Member member) {
    System.out.println("setNoBean2 = " + member);
}

// Optional<>: Optional.empty가 입력됨
@Autowired
public void setNoBean3(Optional<Member> member) {
    System.out.println("setNoBean3 = " + member);
}
```

### 실행 결과

```text
setNoBean2 = null
setNoBean3 = Optional.empty
```

- `Member`는 스프링 빈이 아님
- `setNoBean1()`은 호출조차 안 됨

### 옵션 처리 방법 비교

| 방법                         | 동작                  | 사용 가능 위치 |
| ---------------------------- | --------------------- | -------------- |
| `@Autowired(required=false)` | 메서드 호출 안 됨     | 메서드 레벨    |
| `@Nullable`                  | null 입력             | 파라미터, 필드 |
| `Optional<>`                 | `Optional.empty` 입력 | 파라미터, 필드 |

- `@Nullable`, `Optional`은 스프링 전반에서 지원 (생성자 주입의 특정 필드에도 사용 가능)

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired/AutowiredTest.java)

<br/><br/>

## 생성자 주입을 권장하는 이유

### 불변 (Immutable)

- 대부분의 의존관계 주입은 한번 일어나면 애플리케이션 종료 시점까지 변경할 일이 없음
- 오히려 변하면 안 됨 (불변해야 함)

### 수정자 주입의 문제

```java
@Component
public class OrderServiceImpl implements OrderService {
    private MemberRepository memberRepository;

    @Autowired
    public void setMemberRepository(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

- `setXxx` 메서드를 **`public`으로 열어둠**
- 누군가 실수로 변경할 수 있음
- 변경하면 안 되는 메서드를 열어두는 것은 **좋은 설계가 아님**

### 생성자 주입의 장점

```java
@Component
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;

    public OrderServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```

- 생성자는 객체 생성 시 **딱 1번만** 호출
- 이후 호출되는 일 없음 → **불변하게 설계**

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/order/OrderServiceImpl.java)

<br/><br/>

## 누락 방지

### 수정자 주입 문제

- 실행은 되지만 **`NullPointerException`(`NPE`)** 발생 가능
- 의존관계 주입이 **누락**될 수 있음

### 생성자 주입 장점

- **컴파일 시점**에 오류 발견
- `IDE`가 어떤 값을 필수로 주입해야 하는지 알려줌

- [테스트 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/order/OrderServiceTest.java)

<br/><br/>

## `final` 키워드 사용

### `final` 키워드의 장점

```java
@Component
public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;

    @Autowired
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
        this.memberRepository = memberRepository;
        // discountPolicy 누락
    }
}
```

### 컴파일 오류 발생

```text
java: variable discountPolicy might not have been initialized
```

- `final` 키워드로 값이 설정되지 않는 오류를 **컴파일 시점**에 차단
- **컴파일 오류는 세상에서 가장 빠르고 좋은 오류**

- 수정자 주입 등 나머지 방식은 생성자 이후에 호출되므로 `final` 키워드 사용 불가

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/order/OrderServiceImpl.java)

<br/><br/>

## 생성자 주입 정리

### 생성자 주입 방식 선택 이유

- 프레임워크에 의존하지 않음
- 순수한 자바 언어의 특징을 잘 살림
- 불변성, 누락 방지, `final` 키워드 사용 가능

### 권장 사항

- 기본
  - **생성자 주입** 사용
- 선택적
  - 필수 값이 아니면 **수정자 주입** 옵션으로 사용
- 금지
  - 필드 주입은 사용하지 않기

<br/><br/>

## 롬복과 최신 트렌드

### 기본 코드의 불편함

- 생성자 만들어야 함
- 주입받은 값을 대입하는 코드 필요
- 번거롭고 반복적임

### 롬복 적용

```java
@Component
@RequiredArgsConstructor  // final 필드 생성자 자동 생성
public class OrderServiceImpl implements OrderService {
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;
}
```

- `@RequiredArgsConstructor`
  - **final이 붙은 필드**를 모아서 생성자를 자동 생성
- 컴파일 시점에 생성자 코드가 자동으로 생성됨

### 실제 생성되는 코드 (보이지 않지만 존재)

```java
public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {
    this.memberRepository = memberRepository;
    this.discountPolicy = discountPolicy;
}
```

### 최신 트렌드

- 생성자 1개 + `@Autowired` 생략 + `@RequiredArgsConstructor` = 깔끔하고 간결한 코드

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/main/java/hello/core/order/OrderServiceImpl.java)

<br/><br/>

## 조회 빈이 2개 이상 - 문제

### 문제 상황

```java
@Autowired
private DiscountPolicy discountPolicy;
```

- `@Autowired`는 **타입**(`Type`)으로 조회
- `ac.getBean(DiscountPolicy.class)`와 유사하게 동작

### 같은 타입의 빈이 2개 이상일 때

```java
@Component
public class FixDiscountPolicy implements DiscountPolicy {}

@Component
public class RateDiscountPolicy implements DiscountPolicy {}
```

### 오류 발생

```text
NoUniqueBeanDefinitionException: No qualifying bean of type
'hello.core.discount.DiscountPolicy' available:
expected single matching bean but found 2:
fixDiscountPolicy, rateDiscountPolicy
```

### 하위 타입 지정의 문제

```java
@Autowired
private RateDiscountPolicy discountPolicy;  // 구체 타입 지정
```

- `DIP` 위반
- 유연성 저하
- 이름만 다른 똑같은 타입의 빈이 2개 있을 때 해결 안 됨
- 해결 방법 3가지

  1. `@Autowired` 필드 명 매칭
  2. `@Qualifier` 사용
  3. `@Primary` 사용

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

<br/><br/>

## @Autowired 필드 명 매칭

### 동작 순서

1. 타입 매칭 시도
2. 타입 매칭 결과가 2개 이상 → **필드명/파라미터명**으로 빈 이름 매칭

### 기존 코드

```java
@Autowired
private DiscountPolicy discountPolicy;  // 타입만으로 조회 → 2개 발견 → 오류
```

### 필드명을 빈 이름으로 변경

```java
@Autowired
private DiscountPolicy rateDiscountPolicy;  // 필드명으로 매칭
```

### 정리

1. 타입 매칭
2. 타입 매칭 결과가 2개 이상 → 필드명, 파라미터명으로 빈 이름 매칭

<br/><br/>

## @Qualifier 사용

### 개념

- 추가 구분자를 붙이는 방법 (빈 이름 변경이 아님)

### 빈 등록 시

```java
@Component
@Qualifier("mainDiscountPolicy")
public class RateDiscountPolicy implements DiscountPolicy {}

@Component
@Qualifier("fixDiscountPolicy")
public class FixDiscountPolicy implements DiscountPolicy {}
```

### 주입 시

```java
@Autowired
public OrderServiceImpl(MemberRepository memberRepository, @Qualifier("mainDiscountPolicy") DiscountPolicy discountPolicy) {
    this.memberRepository = memberRepository;
    this.discountPolicy = discountPolicy;
}
```

### @Qualifier 동작 방식

1. `@Qualifier("mainDiscountPolicy")`끼리 매칭
2. 빈 이름 매칭 (`mainDiscountPolicy` 이름의 스프링 빈 찾기)
3. `NoSuchBeanDefinitionException` 예외 발생

### 수동 빈 등록 시에도 사용 가능

```java
@Bean
@Qualifier("mainDiscountPolicy")
public DiscountPolicy discountPolicy() {
    return new RateDiscountPolicy();
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

<br/><br/>

## @Primary 사용

### 개념

우선순위를 정하는 방법

### 빈 등록 시

```java
@Component
@Primary  // 우선권을 가짐
public class RateDiscountPolicy implements DiscountPolicy {}

@Component
public class FixDiscountPolicy implements DiscountPolicy {}
```

### 사용 코드

```java
@Autowired
public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {  // @Primary가 주입됨
    this.memberRepository = memberRepository;
    this.discountPolicy = discountPolicy;
}
```

<br/><br/>

## @Primary와 @Qualifier

| 항목            | @Primary                        | @Qualifier                         |
| --------------- | ------------------------------- | ---------------------------------- |
| **코드 간결성** | 간결 (주입 시 별도 코드 불필요) | 모든 주입 지점에 `@Qualifier` 필요 |
| **우선순위**    | 낮음 (기본값)                   | 높음 (명시적)                      |
| **사용 시점**   | 메인 DB 같은 기본 빈            | 서브 DB 같은 특수 빈               |

### 메인 DB (자주 사용)

```java
@Component
@Primary
public class MainDBConnection implements DBConnection {
}
```

### 서브 DB (가끔 사용)

```java
@Component
@Qualifier("subDB")
public class SubDBConnection implements DBConnection {
}
```

### 사용

```java
// 메인 DB: @Primary로 자동 주입
@Autowired
private DBConnection dbConnection;

// 서브 DB: @Qualifier로 명시적 주입
@Autowired
public void setSubDB(@Qualifier("subDB") DBConnection subDB) {
    this.subDB = subDB;
}
```

### 우선순위

- `@Qualifier` (명시적, 좁은 범위) > `@Primary` (기본값, 넓은 범위)

### 스프링 우선순위 원칙

- 자동 < 수동
- 넓은 범위 < 좁은 범위

<br/><br/>

## 애노테이션 직접 만들기

### 문제점

```java
@Qualifier("mainDiscountPolicy")  // 문자열 → 컴파일 타임 체크 안 됨
```

### 해결 - 커스텀 애노테이션

```java
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.TYPE, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Qualifier("mainDiscountPolicy")
public @interface MainDiscountPolicy {
}
```

### 사용

```java
// 빈 등록
@Component
@MainDiscountPolicy
public class RateDiscountPolicy implements DiscountPolicy {}

// 생성자 주입
@Autowired
public OrderServiceImpl(MemberRepository memberRepository, @MainDiscountPolicy DiscountPolicy discountPolicy) {
    this.memberRepository = memberRepository;
    this.discountPolicy = discountPolicy;
}

// 수정자 주입
@Autowired
public void setDiscountPolicy(@MainDiscountPolicy DiscountPolicy discountPolicy) {
    this.discountPolicy = discountPolicy;
}
```

### 장점

- 컴파일 타임 체크 가능
- `IDE`의 자동완성 지원

- 애노테이션에는 상속 개념이 없음
- 여러 애노테이션을 모아서 사용하는 것은 스프링이 지원하는 기능
- `@Autowired`도 재정의 가능하지만, 무분별한 재정의는 혼란만 가중

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

<br/><br/>

## 조회한 빈이 모두 필요할 때

### 사용 사례

- 클라이언트가 할인 종류(`rate`, `fix`)를 선택할 수 있는 경우

### List, Map 활용 예시

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired/AllBeanTest.java)

### 주입 분석

```java
Map<String, DiscountPolicy> policyMap
```

- **Key**
  - 스프링 빈 이름
- **Value**
  - `DiscountPolicy` 타입의 모든 스프링 빈

```java
List<DiscountPolicy> policies
```

- `DiscountPolicy` 타입의 모든 스프링 빈을 리스트로 주입

### 동작

```java
discount(member, 10000, "fixDiscountPolicy")
```

1. `policyMap.get("fixDiscountPolicy")` → `FixDiscountPolicy` 빈 조회
2. 해당 빈의 `discount()` 메서드 실행

- 해당 타입의 스프링 빈이 없으면 빈 컬렉션이나 빈 `Map` 주입

- [전체 코드 보기](https://github.com/mxxikr/spring-basic/blob/master/core/src/test/java/hello/core/autowired)

### 스프링 컨테이너 생성과 동시에 빈 등록

```java
new AnnotationConfigApplicationContext(AutoAppConfig.class, DiscountService.class);
```

1. 스프링 컨테이너 생성
2. `AutoAppConfig.class`, `DiscountService.class`를 스프링 빈으로 자동 등록

<br/><br/>

## 자동, 수동의 올바른 실무 운영 기준

### 기본 원칙

- 편리한 자동 기능을 기본으로 사용

### 자동을 선호하는 이유

- 스프링 부트는 컴포넌트 스캔을 기본으로 사용
- `@Controller`, `@Service`, `@Repository`로 계층별 자동 스캔 지원
- 스프링 부트의 다양한 빈들도 조건에 맞으면 자동 등록

### 설정 정보의 부담

```java
// 수동 등록 - 번거로움
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
    // ... 빈이 수십, 수백 개라면?
}
```

```java
// 자동 등록 - 간편함
@Component
public class MemberServiceImpl implements MemberService {
    // ...
}
```

- 자동 빈 등록도 `OCP`, `DIP` 준수 가능

<br/><br/>

## 수동 빈 등록을 사용하는 경우

### 업무 로직 빈

- 웹을 지원하는 **컨트롤러**
- 핵심 비즈니스 로직이 있는 **서비스**
- 데이터 계층의 로직을 처리하는 **리포지토리**
- 비즈니스 요구사항에 따라 추가/변경됨

- 특징

  - 숫자가 매우 많음
  - 유사한 패턴 존재 (컨트롤러 → 서비스 → 리포지토리)
  - 문제 발생 시 위치 파악이 명확함

- **권장**
  - **자동 등록 사용**

### 기술 지원 로직 빈

- **데이터베이스 연결**
- **공통 로그 처리** (`AOP`)
- 업무 로직을 지원하는 하부 기술

- 특징

  - 수가 매우 적음
  - 애플리케이션 전반에 걸쳐 광범위하게 영향
  - 적용이 잘 되는지 파악하기 어려움

- **권장**
  - **수동 등록 사용** (명확하게 드러내기)

```java
@Configuration
public class TechConfig {
    @Bean
    public DataSource dataSource() {
        // 기술 지원 빈은 수동으로 등록
        return new HikariDataSource();
    }
}
```

<br/><br/>

## 다형성을 적극 활용하는 비즈니스 로직

### 문제 상황

```java
@Component
public class DiscountService {
    private final Map<String, DiscountPolicy> policyMap;

    public DiscountService(Map<String, DiscountPolicy> policyMap) {
        this.policyMap = policyMap;
    }
}
```

- 어떤 빈들이 주입될까?
- 각 빈의 이름은?

### 자동 등록

- 여러 코드를 찾아봐야 함
- 한눈에 파악 불가

### 수동 등록

```java
@Configuration
public class DiscountPolicyConfig {

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

- 설정 정보만 봐도 한눈에 파악 가능
- 유지보수 편리

### 자동 등록 + 패키지 구조

```
discount
  ├── DiscountService.java
  ├── policy
  │   ├── RateDiscountPolicy.java
  │   └── FixDiscountPolicy.java
```

- 특정 패키지에 묶어두면 파악 가능
- 하지만 수동 등록이 더 명확

<br/><br/>

## 연습 문제

1. 필드 주입(Field Injection) 방식이 권장되지 않는 이유는 무엇일까요?

   a. 순수 Java 코드로 테스트하기 어려워서

   - 필드 주입은 외부에서 의존성을 주입할 수 없어서 순수 Java 테스트가 힘듦
   - 또한 `final` 키워드를 사용할 수 없어 불변성을 보장하기 어려움
   - 단점이 많아서 권장되지 않음

2. `@Autowired`로 의존성을 주입받을 때, `Bean`이 없는 경우를 처리하는 방법과 거기 맞 정답은?

   a. `@Primary` 애노테이션 사용

   - `@Primary`는 동일 타입 `Bean`이 여러 개 있을 때 특정 `Bean`을 자동으로 선택함
   - `Bean`이 없는 경우 대응 방법은 `required=false`, `@Nullable`, `Optional` 수입됨

3. `@Autowired` 사용 시 같은 타입의 `Bean`이 여러 개 있을 때, Spring이 의존성을 해결하는 방법 중 우선순위가 가장 높은 것은?

   a. `@Qualifier` 사용

   - Spring은 동일 타입 `Bean`이 여러 개일 때 `@Qualifier`를 통해 `Bean`을 가장 먼저 찾음
   - 그 다음 `@Primary`, 마지막으로 필드/파라미터 이름으로 매칭함

4. `final` 필드를 매개변수로 하는 생성자를 자동 생성하여 생성자 주입 코드를 간소화해주는 Lombok 애노테이션은 무엇일까요?

   a. `@RequiredArgsConstructor`

   - 이 애노테이션은 클래스의 `final` 필드를 모아 자동으로 생성자를 만들어줌
   - 반복적인 생성자 코드를 간결하게 만들 수 있음

5. `@Autowired`를 사용하여 특정 타입의 모든 Spring `Bean`들을 한번에 주입받고자 할 때, 주로 사용되는 컬렉션 타입은 무엇일까요?

   a. `List` 또는 `Map`

   - Spring 컨테이너는 특정 타입의 모든 `Bean`을 `List`나 `Map` 형태로 주입하는 기능을 지원함
   - 이를 통해 여러 구현체 중 하나를 동적으로 선택하는 전략 패턴 등을 쉽게 구현할 수 있음

<br/><br/>

## 요약 정리

- **다양한 의존관계 주입 방법**
  - 생성자 주입 (권장)
  - 수정자 주입
  - 필드 주입 (사용 금지)
  - 일반 메서드 주입
- **생성자 주입을 권장하는 이유**
  - 불변성 보장
  - 누락 방지 (컴파일 시점 체크)
  - `final` 키워드 사용 가능
- **옵션 처리**
  - `@Autowired(required=false)`
    - 메서드 호출 안 됨
  - `@Nullable`
    - `null` 입력
  - `Optional<>`
    - `Optional.empty` 입력
- **롬복과 최신 트렌드**
  - `@RequiredArgsConstructor`
    - `final` 필드 생성자 자동 생성
  - 생성자 1개면 `@Autowired` 생략 가능
- **조회 빈이 2개 이상일 때 해결 방법**
  - `@Autowired` 필드 명 매칭
  - `@Qualifier`
    - 추가 구분자
  - `@Primary`
    - 우선순위 지정
- **커스텀 애노테이션**
  - `@Qualifier` 대신 컴파일 타임 체크 가능한 커스텀 애노테이션 생성
- **조회한 빈이 모두 필요할 때**
  - `Map<String, 타입>`
    - 빈 이름과 객체를 Map으로 주입
  - `List<타입>` - 해당 타입의 모든 빈을 List로 주입
- **자동 빈 등록과 수동 빈 등록**
  - 업무 로직
    - 자동 등록 사용 (권장)
  - 기술 지원 로직
    - 수동 등록 사용
  - 다형성을 적극 활용하는 비즈니스 로직
    - 수동 등록 또는 패키지 구조화

<br/><br/>

## Reference

- [김영한의 스프링 핵심 원리 - 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)
