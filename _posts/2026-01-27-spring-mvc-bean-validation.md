---
title: '[김영한의 스프링 MVC 2편 백엔드 웹 개발 활용 기술] 검증2 - Bean Validation'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-27 19:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, validation, bean-validation, groups]
math: false
mermaid: false
---

# 검증2 - Bean Validation

- 김영한님의 스프링 MVC 2편 강의를 통해 Bean Validation을 활용한 검증 방법과 스프링 통합, 그리고 등록/수정 시 검증 분리 방법을 정리함


<br/><br/>


## Bean Validation 소개

### Bean Validation이란?

![Bean Validation 구조](/assets/img/spring/bean-validation/bean-validation-structure.png)

- **Bean Validation 2.0 (JSR-380)**
    - 검증 로직을 표준화한 기술 표준임
    - JPA와 마찬가지로 인터페이스의 모음임
- **Hibernate Validator**
    - Bean Validation의 가장 일반적인 구현체임
    - 이름에 Hibernate가 붙어있지만 ORM과는 관련이 없음
- **애노테이션 기반 검증**
    - `@NotBlank`, `@Range` 등의 애노테이션 하나로 검증 로직을 매우 간편하게 적용할 수 있음

### 기존 방식과 Bean Validation 비교

![기존 방식과 Bean Validation 비교](/assets/img/spring/bean-validation/validation-comparison.png)

- **Bean Validation의 장점**
  - 검증 로직을 공통화하고 표준화할 수 있음
  - 애노테이션 하나로 검증 로직을 적용할 수 있어 코드가 간결해짐
  - 코드 중복을 제거하고 유지보수성을 크게 향상시킴

<br/><br/>

## Bean Validation 시작하기

### 의존성 추가

- **build.gradle 의존성 추가**
  ```gradle
  implementation 'org.springframework.boot:spring-boot-starter-validation'
  ```

- **추가되는 주요 라이브러리**
  - `jakarta.validation-api`
    - Bean Validation 인터페이스
  - `hibernate-validator`
    - 구현체

### 주요 검증 애노테이션
- 표준 애노테이션
    - `@NotNull`
    - `@NotBlank`
    - `@Max`
    - `@Min`
    - `@Size`
- Hibernate 전용
    - `@Range`
    - `@Email`
    - `@URL`

- **주요 애노테이션 설명**
  - `@NotBlank`
    - 빈값(`""`) + 공백(`" "`)만 있는 경우를 허용하지 않음
  - `@NotNull`
    - `null`을 허용하지 않음
  - `@Range(min, max)`
    - 값이 특정 범위 안인지 검증함 (Hibernate Validator 전용)
  - `@Max(value)`
    - 값이 지정된 숫자 이하인지 검증함

### 검증 애노테이션 적용 

- **Item 도메인 객체 적용**
  ```java
  @Data
  public class Item {
      
      private Long id;
      
      @NotBlank
      private String itemName;
      
      @NotNull
      @Range(min = 1000, max = 1000000)
      private Integer price;
      
      @NotNull
      @Max(9999)
      private Integer quantity;
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/domain/item/Item.java)

### 검증 실행 구조

![검증 실행 구조 Sequence](/assets/img/spring/bean-validation/validation-execution.png)

<br/><br/>

## 스프링과의 통합

### 스프링 부트 자동 설정

![스프링 부트 자동 설정](/assets/img/spring/bean-validation/springboot-integration.png)

- **자동 설정 동작 원리**
  - `spring-boot-starter-validation` 라이브러리가 있으면 스프링 부트가 자동으로 Bean Validator를 인지함
  - `LocalValidatorFactoryBean`을 글로벌 Validator로 등록함
  - 컨트롤러 파라미터에 `@Validated`만 적용하면, 글로벌 Validator가 자동으로 실행됨

### 컨트롤러 적용

![컨트롤러 적용 흐름](/assets/img/spring/bean-validation/controller-flow.png)

- **적용 코드**
  ```java
  @PostMapping("/add")
  public String addItem(@Validated @ModelAttribute Item item, 
                        BindingResult bindingResult) {
      if (bindingResult.hasErrors()) {
          return "validation/v3/addForm";
      }
      return "redirect:/validation/v3/items/{itemId}";
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV3.java)

### 검증 순서

![검증 순서](/assets/img/spring/bean-validation/validation-sequence.png)

- **중요한 검증 원칙**
  - **바인딩에 성공한 필드만 Bean Validation이 적용됨**
  - 타입 변환에 실패하면 `BindingResult`에 타입 오류(`typeMismatch`)가 추가되고, Bean Validation은 실행되지 않음

<br/><br/>

## 에러 코드와 메시지

### 에러 코드 생성 구조

- Bean Validation이 오류를 잡으면 `MessageCodesResolver`가 에러 코드를 생성합니다.

![에러 코드 생성 구조](/assets/img/spring/bean-validation/error-code-structure.png)

- **에러 코드 우선순위**
  1. **구체적**
        - `애노테이션명.객체명.필드명`
        - ex)`NotBlank.item.itemName`
  2. **필드명**
        - `애노테이션명.필드명`
        - ex)`NotBlank.itemName`
  3. **타입**
        - `애노테이션명.타입`
        - ex)`NotBlank.java.lang.String`
  4. **일반**
        - `애노테이션명`
        - ex)`NotBlank`

### 메시지 커스터마이징

![메시지 커스터마이징 우선순위](/assets/img/spring/bean-validation/message-customization.png)

- **메시지 적용 우선순위**
  1. `errors.properties` 등에 정의된 메시지 코드
  2. 애노테이션의 `message` 속성
    - ex) `@NotBlank(message="공백 안됨")`
  3. 라이브러리가 제공하는 기본 메시지

- **errors.properties 설정**
  ```properties
  NotBlank={0} 공백X
  Range={0}, {2} ~ {1} 허용
  Max={0}, 최대 {1}
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/resources/errors.properties)

<br/><br/>

## 오브젝트 오류 처리

### 필드 오류와 오브젝트 오류 비교

![오브젝트 오류와 필드 오류](/assets/img/spring/bean-validation/object-error-types.png)

### 글로벌 오류 처리 방법

- 특정 필드를 넘어서는 복합 룰 검증 처리 방법
  1. **@ScriptAssert 사용 (비권장)**
     - 기능이 약하고 제약이 많아 실무에서 잘 사용하지 않음
  2. **자바 코드로 직접 검증 (권장)**
     - 컨트롤러에서 직접 로직을 작성하여 `BindingResult`에 `reject()`로 담는 것이 가장 확실하고 유연함

- **권장 코드**
  ```java
  if (item.getPrice() != null && item.getQuantity() != null) {
      int resultPrice = item.getPrice() * item.getQuantity();
      if (resultPrice < 10000) {
          bindingResult.reject("totalPriceMin", new Object[]{10000, resultPrice}, null);
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV3.java)

<br/><br/>

## 등록/수정 검증 분리 문제

### 문제 상황
- 등록할 때는 `id`에 값이 없어도 되지만, 수정할 때는 `id`가 필수임
- 등록할 때는 `quantity` 제한이 있지만, 수정할 때는 제한이 없음
- 하나의 `Item` 객체에 `@NotNull`이나 `@Max`를 적용하면 두 상황을 모두 만족시킬 수 없음

### 해결 방법 비교

- **Groups 사용**
  - 복잡도가 증가함
  - 실무에서 잘 사용하지 않음
- **Form 객체 분리**
  - 명확하게 분리됨
  - 실무에서 권장함

<br/><br/>

## Groups 사용 방법

### Groups 구조

![Groups 사용 구조](/assets/img/spring/bean-validation/groups-structure.png)

### Groups 적용 

- **인터페이스 정의**
  ```java
  public interface SaveCheck {}
  public interface UpdateCheck {}
  ```
  - [SaveCheck 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/domain/item/SaveCheck.java)
  - [UpdateCheck 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/domain/item/UpdateCheck.java)

- **Item 도메인에 groups 적용**
  ```java
  @NotNull(groups = UpdateCheck.class) // 수정 시에만 적용
  private Long id;
  
  @Max(value = 9999, groups = SaveCheck.class) // 등록 시에만 적용
  private Integer quantity;
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/domain/item/Item.java)

- **컨트롤러 적용**
  ```java
  @PostMapping("/add")
  public String addItem(@Validated(SaveCheck.class) @ModelAttribute Item item, BindingResult bindingResult) {
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV3.java)

### Groups의 한계

- 코드가 복잡해짐
- 도메인 객체에 검증 로직이 덕지덕지 붙어 지저분해짐

<br/><br/>

## Form 객체 분리 (권장)

### Form 객체 분리 구조

- 실무에서는 **폼 데이터 전달을 위한 별도의 객체**(DTO)를 사용함

    ```mermaid
    graph LR
        A[HTML Form] --> B[ItemSaveForm]
        B --> C[Controller]
        C --> D[Item 생성]
        D --> E[Repository]
        
        F[HTML Form] --> G[ItemUpdateForm]
        G --> H[Controller]
        H --> I[Item 수정]
        I --> J[Repository]
        
        style B fill:#90EE90
        style G fill:#90EE90
    ```

### 도메인 객체와 Form 객체 비교

- **도메인 객체 직접 사용**
  - 장점
    - 초기 개발이 간단함
  - 단점
    - 검증 중복, 충돌 해결이 어려움
- **Form 객체 분리**
  - 장점
    - 명확한 분리, 유연성이 높음
  - 단점
    - 별도 객체 생성 및 변환 과정이 필요함

### Form 객체 설계

- **ItemSaveForm**
  ```java
  @Data
  public class ItemSaveForm {
      @NotBlank
      private String itemName;
      
      @NotNull
      @Range(min = 1000, max = 1000000)
      private Integer price;
      
      @NotNull
      @Max(9999)
      private Integer quantity;
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/form/ItemSaveForm.java)

- **ItemUpdateForm**
  ```java
  @Data
  public class ItemUpdateForm {
      @NotNull
      private Long id;
      
      @NotBlank
      private String itemName;
      
      @NotNull
      @Range(min = 1000, max = 1000000)
      private Integer price;
      
      private Integer quantity; // 제한 없음
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/form/ItemUpdateForm.java)

### 컨트롤러 적용

```java
@PostMapping("/add")
public String addItem(@Validated @ModelAttribute("item") ItemSaveForm form,
                      BindingResult bindingResult,
                      RedirectAttributes redirectAttributes) {
    if (bindingResult.hasErrors()) {
        return "validation/v4/addForm";
    }
    
    // 성공 로직
    Item item = new Item();
    item.setItemName(form.getItemName());
    item.setPrice(form.getPrice());
    item.setQuantity(form.getQuantity());
    
    itemRepository.save(item);
    return "redirect:/validation/v4/items/{itemId}";
}
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV4.java)

> **주의**
> - `@ModelAttribute("item")`과 같이 이름을 명시하지 않으면 `itemSaveForm`이라는 이름으로 모델에 담기게 되어, 뷰 템플릿 수정이 필요할 수 있음

<br/><br/>

## HTTP 메시지 컨버터와 Bean Validation

### @ModelAttribute와 @RequestBody 비교

![메시지 컨버터와 Bean Validation](/assets/img/spring/bean-validation/message-converter-validation.png)

### API 검증 3가지 경우

![API 검증 3가지 경우](/assets/img/spring/bean-validation/api-validation-flow.png)

- **성공 요청**
  - JSON을 객체로 생성 성공 -> 검증도 성공
- **실패 요청**
  - JSON을 객체로 생성 실패 (타입 오류 등) -> **컨트롤러 호출 안됨**
- **검증 오류 요청**
  - JSON을 객체로 생성 성공 -> 검증 실패 -> `BindingResult`에 오류 담겨 컨트롤러 호출됨

### API 컨트롤러 

- **ValidationItemApiController**
  ```java
  @RestController
  @RequestMapping("/validation/api/items")
  public class ValidationItemApiController {
  
      @PostMapping("/add")
      public Object addItem(@RequestBody @Validated ItemSaveForm form,
                            BindingResult bindingResult) {
          if (bindingResult.hasErrors()) {
              return bindingResult.getAllErrors();
          }
          return form;
      }
  }
  ```
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemApiController.java)

<br/><br/>

## 정리

- **Bean Validation**
  - 애노테이션 기반의 표준 검증 기술로, 반복적인 검증 로직을 표준화함 (`JSR-380`)
  - `Hibernate Validator`가 대표적인 구현체임
- **스프링 부트 통합**
  - `spring-boot-starter-validation` 추가 시 자동으로 `LocalValidatorFactoryBean`을 글로벌 검증기로 등록함
  - `@Validated` 애노테이션으로 편리하게 검증을 적용할 수 있음
- **에러 코드 및 메시지**
  - `MessageCodesResolver`가 다양한 레벨의 에러 코드를 생성하여 메시지를 체계적으로 관리할 수 있음
- **검증 분리**
  - `Groups` 기능을 사용할 수 있으나 복잡도가 높음
  - 실무에서는 **Form 전송 객체(`DTO`)를 분리**하여 등록/수정 요청을 독립적으로 처리하는 방식을 권장함
- **API 검증**
  - `@RequestBody`는 `HttpMessageConverter` 단계에서 `JSON` 파싱 실패 시 컨트롤러가 호출되지 않고 예외가 발생함
  - 성공적으로 객체로 변환된 후에만 `Bean Validation`이 동작함

<br/><br/>

## 연습 문제

1. `Bean Validation`의 가장 큰 목표는 무엇일까요?

   a. 수동 검증 코드 제거 및 표준화

   - `Bean Validation`은 반복적인 수동 검증 로직을 애노테이션으로 대체하여 개발 효율성을 높이고 검증 코드를 표준화하는 역할을 함

2. `Jakarta Bean Validation API`와 `Hibernate Validator`의 관계는 무엇인가요?

   a. API는 사양, Validator는 구현체

   - `Bean Validation` 사양은 유효성 검증 규칙과 인터페이스를 정의하고, `Hibernate Validator` 같은 구현체가 이를 실제로 작동하게 만듦
   - `JPA`와 `Hibernate` 관계와 유사함

3. `Spring Boot` 환경에서 `Bean Validation` 라이브러리를 추가하면 어떤 자동 설정이 이루어지나요?

   a. 전역 유효성 검사기(Global Validator) 등록

   - `Spring Boot`는 `Bean Validation` 라이브러리를 감지하여 애플리케이션 전체에서 유효성 검증을 사용할 수 있도록 `Global Validator`를 자동으로 빈으로 등록해 줌

4. `Spring MVC` 컨트롤러에서 메서드 파라미터에 대한 `Bean Validation`을 활성화하는 애노테이션은 무엇일까요?

   a. `@Validated` 또는 `@Valid`

   - `@Validated` 또는 `@Valid` 애노테이션을 모델 객체 파라미터 앞에 붙이면 `Spring`이 해당 객체에 대한 `Bean Validation`을 자동으로 실행하게 트리거함

5. `Bean Validation` 실행 후 발생한 유효성 검증 오류는 어디에 저장되어 확인될까요?

   a. `BindingResult` 객체

   - 컨트롤러 메서드의 유효성 검증 대상 객체 파라미터 바로 뒤에 `BindingResult` 객체를 선언하면, `Bean Validation` 결과 발생한 모든 오류가 여기에 수집됨

6. `Bean Validation` 애노테이션의 기본 메시지를 바꾸고 싶을 때 사용하는 방법은 무엇인가요?

   a. `.properties` 파일을 이용한 메시지 정의

   - `errors.properties`와 같은 메시지 소스 파일에 유효성 검증 오류 코드(예: `NotBlank`)에 해당하는 메시지를 정의하여 기본 메시지를 원하는 대로 변경할 수 있음

7. 하나의 객체를 등록과 수정에 모두 사용하고 `Bean Validation` 애노테이션을 적용할 때 생기는 주요 어려움은 무엇인가요?

   a. 서로 다른 검증 요구사항 충돌

   - 등록과 수정은 같은 객체라도 요구되는 필드(ID 유무)나 제약 조건(수량 범위)이 다를 수 있어, 하나의 객체에 동일하게 애노테이션을 적용하면 충돌이 발생함

8. 등록/수정 등 상황별로 다른 유효성 검증이 필요할 때, 실무에서 '그룹' 기능보다 흔히 사용되는 객체 설계 방식은 무엇인가요?

   a. 폼 전송 객체(`DTO`) 분리

   - 등록용과 수정용 폼 전송 객체(`DTO`)를 분리하면 각 객체에 맞는 유효성 검증 애노테이션을 독립적으로 적용할 수 있어 코드가 명확해지고 관리가 쉬워짐

9. 웹 폼 입력 값이나 API 요청 본문 데이터(`JSON` 등)를 받기 위해 도메인 모델과 분리하여 사용하는 목적의 객체를 무엇이라고 부를까요?

   a. 폼 객체 또는 `DTO` (데이터 전송 객체)

   - 폼 객체 또는 `DTO`는 웹 폼이나 API의 특정 데이터 구조에 맞춰 데이터를 받기 위한 전용 객체로, 도메인 모델의 순수성을 유지하고 다양한 검증 요구사항에 대응하기 위해 사용됨

10. `Spring`에서 `@ModelAttribute`로 데이터를 받을 때와 `@RequestBody`로 받을 때 `Bean Validation` 적용 시 가장 큰 차이는 무엇인가요?

    a. `@ModelAttribute`는 변환 실패 시 `BindingResult`에 오류 저장, `@RequestBody`는 변환 실패 시 예외 발생 및 검증 미실행

    - `@ModelAttribute`는 바인딩 실패 시 `BindingResult`에 오류를 담지만 검증은 계속 시도함
    - `@RequestBody`는 메시지 컨버터 변환 실패 시 예외 발생으로 검증 로직 자체가 실행되지 않는 차이가 있음

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
