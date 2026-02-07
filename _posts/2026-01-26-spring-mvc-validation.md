---
title: '[스프링 MVC 2편 백엔드 웹 개발 활용 기술] 검증1 - Validation'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-26 21:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, validation, binding-result, field-error, object-error, message-codes-resolver]
math: false
mermaid: false
---
# 검증1 - Validation

- 김영한님의 스프링 MVC 2편 강의를 통해 데이터 검증의 필요성과 스프링이 제공하는 `BindingResult`, `FieldError`, `ObjectError` 등을 활용한 다양한 검증 처리 방법을 정리함

<br/><br/>

## 검증 요구사항

### 새로운 요구사항

![검증 요구사항](/assets/img/spring/validation/validation-requirements.png)

### 검증의 중요성

- **문제 상황**
  - 검증 오류 발생 시 오류 화면으로 바로 이동하면 사용자는 처음부터 다시 입력해야 하므로 이탈률이 높아짐

- **필요한 기능**
  - 오류 발생 시 입력한 데이터를 유지해야 함
  - 어떤 오류가 발생했는지 친절하게 안내해야 함
  - 사용자가 쉽게 수정할 수 있도록 지원해야 함

### 컨트롤러의 역할

![컨트롤러 역할](/assets/img/spring/validation/validation-controller-role.png)

- 검증 로직을 잘 개발하는 것이 정상 로직보다 더 복잡하고 어려울 수 있음

### 클라이언트 검증과 서버 검증 비교

| 구분 | 클라이언트 검증 | 서버 검증 |
|------|----------------|-----------|
| **장점** | 즉각적인 사용자 피드백 | 보안 안전성 |
| **단점** | 조작 가능, 보안 취약 | 즉각적 피드백 부족 |
| **결론** | 사용자 경험 향상용 | **필수** |

- 둘을 적절히 섞어 사용하되, 서버 검증은 필수
- API 스펙을 잘 정의해서 검증 오류를 API 응답 결과에 명확히 표현해야 함

<br/><br/>

## 검증 직접 처리 - 개발

### 상품 등록 검증 흐름

![상품 등록 검증 흐름](/assets/img/spring/validation/validation-flow.png)

### Map을 이용한 검증 오류 처리

- **ValidationItemControllerV1**
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV1.java)

    ```java
    @PostMapping("/add")
    public String addItem(@ModelAttribute Item item, 
                        RedirectAttributes redirectAttributes, 
                        Model model) {
        
        // 검증 오류 결과를 보관
        Map<String, String> errors = new HashMap<>();

        // 검증 로직
        if (!StringUtils.hasText(item.getItemName())) {
            errors.put("itemName", "상품 이름은 필수입니다.");
        }
        
        if (item.getPrice() == null || item.getPrice() < 1000 || 
            item.getPrice() > 1000000) {
            errors.put("price", "가격은 1,000 ~ 1,000,000 까지 허용합니다.");
        }
        
        if (item.getQuantity() == null || item.getQuantity() > 9999) {
            errors.put("quantity", "수량은 최대 9,999 까지 허용합니다.");
        }
        
        // 특정 필드가 아닌 복합 룰 검증
        if (item.getPrice() != null && item.getQuantity() != null) {
            int resultPrice = item.getPrice() * item.getQuantity();
            if (resultPrice < 10000) {
                errors.put("globalError", 
                    "가격 * 수량의 합은 10,000원 이상이어야 합니다. 현재 값 = " + resultPrice);
            }
        }

        // 검증에 실패하면 다시 입력 폼으로
        if (!errors.isEmpty()) {
            model.addAttribute("errors", errors);
            return "validation/v1/addForm";
        }
        
        // 성공 로직
        Item savedItem = itemRepository.save(item);
        redirectAttributes.addAttribute("itemId", savedItem.getId());
        redirectAttributes.addAttribute("status", true);
        return "redirect:/validation/v1/items/{itemId}";
    }
    ```

### 남은 문제점

![남은 문제점](/assets/img/spring/validation/validation-limitations.png)
- 고객이 입력한 값을 별도로 관리해서 오류 발생 시에도 유지할 필요가 있음

<br/><br/>

## BindingResult

### BindingResult 소개

![BindingResult 구조](/assets/img/spring/validation/binding-result-structure.png)

### BindingResult 적용 코드

- **ValidationItemControllerV2**
  - `BindingResult`를 사용하여 검증 오류 처리
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV2.java)

    ```java
    @PostMapping("/add")
    public String addItemV1(@ModelAttribute Item item, 
                        BindingResult bindingResult, 
                        RedirectAttributes redirectAttributes) {
        
        // 필드 오류
        if (!StringUtils.hasText(item.getItemName())) {
            bindingResult.addError(new FieldError("item", "itemName", 
                "상품 이름은 필수입니다."));
        }
        
        if (item.getPrice() == null || item.getPrice() < 1000 || 
            item.getPrice() > 1000000) {
            bindingResult.addError(new FieldError("item", "price", 
                "가격은 1,000 ~ 1,000,000 까지 허용합니다."));
        }
        
        if (item.getQuantity() == null || item.getQuantity() >= 10000) {
            bindingResult.addError(new FieldError("item", "quantity", 
                "수량은 최대 9,999 까지 허용합니다."));
        }
        
        // 글로벌 오류
        if (item.getPrice() != null && item.getQuantity() != null) {
            int resultPrice = item.getPrice() * item.getQuantity();
            if (resultPrice < 10000) {
                bindingResult.addError(new ObjectError("item", 
                    "가격 * 수량의 합은 10,000원 이상이어야 합니다. 현재 값 = " + resultPrice));
            }
        }
        
        if (bindingResult.hasErrors()) {
            return "validation/v2/addForm";
        }
        
        // 성공 로직
        Item savedItem = itemRepository.save(item);
        redirectAttributes.addAttribute("itemId", savedItem.getId());
        redirectAttributes.addAttribute("status", true);
        return "redirect:/validation/v2/items/{itemId}";
    }
    ```

### BindingResult의 특징

- **주의사항**
  - `BindingResult`는 검증할 대상 바로 다음에 위치해야 함
  - `@ModelAttribute Item item, BindingResult bindingResult` 순서
- **자동 포함**
  - `BindingResult`는 Model에 자동으로 포함됨
- **BindingResult와 Errors**
  - `BindingResult`는 `Errors` 인터페이스를 상속받음
  - 실제 구현체는 `BeanPropertyBindingResult`
  - 관례적으로 `BindingResult`를 주로 사용

<br/><br/>

## FieldError, ObjectError 상세

### 사용자 입력 값 유지

- 오류 발생 시 사용자가 입력한 값을 유지하기 위해서는 `FieldError`의 확장 생성자를 사용해야 함

```java
public FieldError(String objectName, 
                 String field, 
                 @Nullable Object rejectedValue,
                 boolean bindingFailure, 
                 @Nullable String[] codes,
                 @Nullable Object[] arguments, 
                 @Nullable String defaultMessage)
```

- `rejectedValue`
  - **사용자가 입력한 값(거절된 값)** 저장
- `bindingFailure`
  - 타입 오류 같은 바인딩 실패인지, 검증 실패인지 구분

### 사용자 입력 값 유지 원리

- **ValidationItemControllerV2**
  - `FieldError` 생성자 활용하여 입력 값 유지
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV2.java)

    ```java
    @PostMapping("/add")
    public String addItemV2(@ModelAttribute Item item, 
                        BindingResult bindingResult,
                        RedirectAttributes redirectAttributes) {
        
        // 실패 시 입력 값 유지를 위해 FieldError 생성자 활용
        if (!StringUtils.hasText(item.getItemName())) {
            bindingResult.addError(new FieldError("item", "itemName", 
                item.getItemName(), false, null, null, 
                "상품 이름은 필수입니다."));
        }
        
        // ... (price, quantity 등 다른 필드 검증 로직 생략) ...
        
        // 글로벌 오류
        if (item.getPrice() != null && item.getQuantity() != null) {
            int resultPrice = item.getPrice() * item.getQuantity();
            if (resultPrice < 10000) {
                bindingResult.addError(new ObjectError("item", null, null,
                    "가격 * 수량의 합은 10,000원 이상이어야 합니다. 현재 값 = " + resultPrice));
            }
        }
        
        if (bindingResult.hasErrors()) {
            log.info("errors={}", bindingResult);
            return "validation/v2/addForm";
        }
        
        // 성공 로직
        Item savedItem = itemRepository.save(item);
        redirectAttributes.addAttribute("itemId", savedItem.getId());
        redirectAttributes.addAttribute("status", true);
        return "redirect:/validation/v2/items/{itemId}";
    }
    ```

![FieldError 처리 흐름](/assets/img/spring/validation/field-error-flow.png)

- **타임리프의 동작**
  - `th:field`는 정상 상황에서는 모델 객체의 값을 사용
  - 오류 발생 시에는 `FieldError`에 보관된 `rejectedValue`를 사용

<br/><br/>

## 오류 코드와 메시지 처리

### errors.properties 설정

- `application.properties`
    ```properties
    spring.messages.basename=messages,errors
    ```

- `errors.properties`
    ```properties
    required.item.itemName=상품 이름은 필수입니다.
    range.item.price=가격은 {0} ~ {1} 까지 허용합니다.
    max.item.quantity=수량은 최대 {0} 까지 허용합니다.
    totalPriceMin=가격 * 수량의 합은 {0}원 이상이어야 합니다. 현재 값 = {1}
    ```

### 오류 코드 적용 코드

- **ValidationItemControllerV2**
  -  오류 코드를 사용하여 메시지 처리
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV2.java)

    ```java
    bindingResult.addError(new FieldError("item", "price", item.getPrice(), false, 
        new String[]{"range.item.price"}, 
        new Object[]{1000, 1000000}, null));
    ```

- `codes`
  - 메시지 코드를 배열로 전달 (순서대로 매칭)
- `arguments`
  - 코드의 `{0}`, `{1}`로 치환할 값 전달

<br/><br/>

## rejectValue(), reject()

### 개요
- `BindingResult`는 이미 검증 대상 객체(`target`)를 알고 있음
- 따라서 `FieldError`, `ObjectError`를 직접 생성하지 않고, `rejectValue()`, `reject()`를 사용하여 간단하게 검증 오류를 다룰 수 있음

### 사용 예시

- **ValidationItemControllerV2**
  - `rejectValue`, `reject` 사용
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV2.java)

    ```java
    // FieldError 축약
    bindingResult.rejectValue("itemName", "required");

    // range 오류 (값 범위)
    bindingResult.rejectValue("price", "range", new Object[]{1000, 1000000}, null);

    // 글로벌 오류
    bindingResult.reject("totalPriceMin", new Object[]{10000, resultPrice}, null);
    ```

<br/><br/>

## MessageCodesResolver

### 오류 코드 생성 전략

- `MessageCodesResolver`는 `rejectValue()` 호출 시 오류 코드를 기반으로 메시지 코드들을 생성함
- **전략**
  - 구체적인 것에서 덜 구체적인 순서로 생성

### 생성 규칙 (FieldError)

1. `code` + "." + `object name` + "." + `field`
2. `code` + "." + `field`
3. `code` + "." + `field type`
4. `code`

- `rejectValue("itemName", "required")`
    1. `required.item.itemName`
    2. `required.itemName`
    3. `required.java.lang.String`
    4. `required`

### 생성 규칙 (ObjectError)

1. `code` + "." + `object name`
2. `code`

<br/><br/>

## Validator 분리

### Validator 인터페이스

```java
public interface Validator {
    boolean supports(Class<?> clazz);
    void validate(Object target, Errors errors);
}
```

- **장점**
  - 복잡한 검증 로직을 컨트롤러에서 분리하여 재사용 가능

### @Validated 적용

- **ValidationItemControllerV4**
  - `@Validated` 애노테이션 적용
    ```java

    private final ItemValidator itemValidator;

    @InitBinder
    public void init(WebDataBinder dataBinder) {
        log.info("init binder {}", dataBinder);
        dataBinder.addValidators(itemValidator);
    }

    @PostMapping("/add")
    public String addItem(@Validated @ModelAttribute Item item, 
                        BindingResult bindingResult, 
                        RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            return "validation/v2/addForm";
        }
    }
    ```

  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ValidationItemControllerV2.java)
  - [Validator 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/validation/src/main/java/hello/itemservice/web/validation/ItemValidator.java)


- **동작 원리**
  - `@Validated`가 있으면 `WebDataBinder`에 등록된 검증기를 찾아서 실행
  - 여러 검증기가 등록된 경우 `supports()`로 구분

<br/><br/>

## 연습 문제

1. 애플리케이션에서 검증(Validation)이 중요한 주된 이유가 무엇일까요?

   a. 시스템 오남용 방지 및 데이터 무결성 보장

   - 검증은 입력 데이터가 요구사항을 충족하는지 확인하여 시스템의 오남용을 막고 데이터의 정확성과 일관성을 유지하는 데 필수적임

2. 사용자가 임의로 요청 파라미터를 조작하여 보내는 등 악의적인 입력으로부터 시스템을 보호하는 데 가장 중요한 검증 방식은 무엇일까요?

   a. 서버 측 검증

   - 클라이언트 측 검증은 우회될 수 있으므로, 서버 측 검증은 데이터를 최종적으로 신뢰하기 전 항상 수행되어야 하는 필수적인 보안 조치임

3. 서버에서 검증 실패 시 사용자 경험(UX) 측면에서 권장되는 일반적인 처리 방식은 무엇일까요?

   a. 오류 메시지와 함께 입력 데이터 유지 및 폼 다시 표시

   - 사용자가 오류 내용을 확인하고 수정할 수 있도록, 어떤 항목이 잘못되었는지 표시하고 이전에 입력했던 값은 유지해주는 것이 사용자 친화적인 방식임

4. Spring MVC에서 컨트롤러로 전달되는 데이터를 바인딩하거나 검증하는 과정에서 발생한 오류를 수집하여 담는 데 주로 사용되는 객체는 무엇일까요?

   a. BindingResult

   - BindingResult는 Spring이 제공하는 객체로, 컨트롤러 메서드의 @ModelAttribute 객체 바로 뒤에 위치하여 해당 객체의 바인딩 및 검증 오류를 담음

5. 컨트롤러 메서드 시그니처에 BindingResult 객체가 없을 때, 숫자 필드에 숫자가 아닌 텍스트를 입력하여 데이터 바인딩에 실패하면 Spring MVC에서 일반적으로 어떤 일이 발생하나요?

   a. 타입 오류가 발생하며, 일반 오류 페이지가 표시된다.

   - BindingResult가 없으면 Spring은 바인딩 실패 시 해당 오류를 즉시 처리하며 컨트롤러 메서드를 호출하지 않고 오류 페이지로 이동시킴

6. Spring 검증에서 특정 필드에 대한 검증 실패 시 사용자의 원래 잘못된 입력 값을 유지하고 폼에 다시 채워주는 데 도움이 되는 오류 타입은 무엇일까요?

   a. FieldError

   - `FieldError`는 객체 이름, 필드 이름뿐만 아니라 사용자가 입력한 잘못된 값(`Rejected Value`)을 함께 저장하여 폼에 오류 발생 시 이전 입력 값을 보여줄 수 있게 함

7. 검증 오류 메시지를 코드 내에 직접 작성하는 대신 외부 속성 파일(예: errors.properties)에서 관리할 때 얻을 수 있는 주요 장점은 무엇일까요?

   a. 코드 수정 없이 메시지 변경

   - 메시지를 외부 파일에서 관리하면 개발 코드를 변경하거나 재배포하지 않고도 기획이나 디자인 변경에 따라 유연하게 메시지를 수정할 수 있음

8. 오류 코드를 설계하고 해당하는 오류 메시지를 찾는 과정에서 일반적으로 권장되는 메시지 검색 우선순위 전략은 무엇일까요?

   a. 구체적인 코드에서 일반적인 코드로

   - `MessageCodesResolver`는 `required.item.itemName`과 같이 가장 구체적인 오류 코드부터 시작하여 `required`와 같이 가장 일반적인 코드 순으로 메시지를 검색함

9. 검증 로직을 별도의 Validator 클래스로 분리하는 주된 목적은 무엇일까요?

   a. 컨트롤러 코드 간소화 및 재사용성 향상

   - 컨트롤러는 요청 처리라는 주 역할에 집중하고, 검증 로직은 `Validator`에서 담당하게 분리함으로써 코드의 응집도를 높이고 재사용하기 쉽게 만듦

10. Spring MVC에서 등록된 Validator가 특정 객체(@ModelAttribute 등으로 받은 객체)에 대해 자동으로 실행되도록 해당 컨트롤러 메서드의 파라미터에 추가할 수 있는 어노테이션은 무엇일까요?

    a. @Valid 또는 @Validated

    - `@Valid` (표준 자바) 또는 `@Validated` (Spring) 어노테이션을 사용하면 Spring이 `WebDataBinder`에 등록된 `Validator`를 찾아 해당 객체에 대한 검증을 자동으로 수행함

<br/><br/>

## 요약 정리

| 개념 | 설명 |
|------|------|
| **BindingResult** | 스프링의 검증 오류 보관 객체 |
| **FieldError** | 필드 오류 표현 (입력 값 유지 기능 포함) |
| **ObjectError** | 글로벌 오류 표현 |
| **rejectValue()** | 필드 오류 간편 등록 (MessageCodesResolver 사용) |
| **MessageCodesResolver** | 검증 오류 코드로 메시지 코드들을 생성 |
| **Validator** | 검증 로직을 분리하기 위한 스프링 표준 인터페이스 |
| **@Validated** | 검증기를 자동으로 실행하도록 설정하는 애노테이션 |

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
