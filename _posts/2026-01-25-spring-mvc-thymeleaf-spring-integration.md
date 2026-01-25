---
title: '[김영한의 스프링 MVC 1편 백엔드 웹 개발 핵심 기술] 타임리프 스프링 통합과 폼 처리'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-25 15:30:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, thymeleaf, form, checkbox, radio-button, select-box, model-attribute]
math: false
mermaid: true
---
# 타임리프 - 스프링 통합과 폼 처리

- 김영한님의 스프링 MVC 1편 강의를 통해 타임리프와 스프링의 통합 기능, 그리고 체크박스, 라디오 버튼, 셀렉트 박스 같은 다양한 폼 요소를 효율적으로 처리하는 방법을 정리함

<br/><br/>

## 타임리프 스프링 통합

### 타임리프 메뉴얼

- **기본 메뉴얼**
  - https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html
- **스프링 통합 메뉴얼**
  - https://www.thymeleaf.org/doc/tutorials/3.0/thymeleafspring.html

### 스프링 통합으로 추가되는 기능

![타임리프 스프링 통합 기능](/assets/img/spring/thymeleaf-integration-overview.png)

### 설정 방법

- **build.gradle**
  - `implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'`

- **application.properties**
  - 타임리프 관련 설정은 공식 문서 참고
  - [Spring Boot Reference](https://docs.spring.io/spring-boot/appendix/application-properties/index.html#appendix.application-properties.templating)

<br/><br/>

## 입력 폼 처리

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **th:object** | 커맨드 객체를 지정 |
| ***{...}** | 선택 변수 식, `th:object`에서 선택한 객체에 접근 |
| **th:field** | HTML 태그의 `id`, `name`, `value` 속성을 자동으로 처리 |

### th:field의 자동 처리

- **렌더링 전**

  ```html
  <input type="text" th:field="*{itemName}" />
  ```

- **렌더링 후**

  ```html
  <input type="text" id="itemName" name="itemName" value="" />
  ```

### 등록 폼 구현

- **FormItemController**
  - `addForm` 메서드에서 빈 객체를 모델에 담아서 전달
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/java/hello/itemservice/web/form/FormItemController.java)

- **addForm.html**
  - `th:object`, `th:field`를 사용하여 폼 구성
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/resources/templates/form/addForm.html)

### 수정 폼 구현

- **FormItemController**
  - `editForm` 메서드에서 기존 객체를 모델에 담아서 전달

- **editForm.html**
  - `th:object`, `th:field` 사용
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/resources/templates/form/editForm.html)

- **렌더링 결과 (수정 폼)**
  - `value` 속성에 기존 값이 자동으로 채워짐

  ```html
  <input type="text" id="itemName" class="form-control" name="itemName" value="itemA">
  ```

<br/><br/>

## 요구사항 추가

### 새로운 필드 추가

- 상품
  - 판매 여부
    - 체크 박스 단일
  - 등록 지역
    - 체크 박스 멀티
  - 상품 종류
    - 라디오 버튼
  - 배송 방식
    - 셀렉트 박스

### 도메인 모델

- **ItemType (ENUM)**
  - 상품 종류 (도서, 식품, 기타)
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/java/hello/itemservice/domain/item/ItemType.java)
- **DeliveryCode**
  - 배송 방식 (FAST, NORMAL, SLOW)
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/java/hello/itemservice/domain/item/DeliveryCode.java)
- **Item**
  - 상품 엔티티에 필드 추가
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/java/hello/itemservice/domain/item/Item.java)

<br/><br/>

## 체크 박스 - 단일

### HTML 체크박스의 문제점

![HTML 체크박스 문제점](/assets/img/spring/checkbox-issue.png)

- **실행 로그 비교**
  - 체크 선택 `item.open=true`
  - 체크 미선택 `item.open=null`

### 히든 필드를 이용한 해결

- **HTML 코드**
  - `_open` 히든 필드 추가

  ```html
  <input type="checkbox" id="open" name="open" class="form-check-input">
  <input type="hidden" name="_open" value="on"/> <!-- 히든 필드 추가 -->
  ```

- **동작 원리**
  - **체크 선택시** `open=on&_open=on`으로 전송되어 스프링 MVC가 `open` 값 사용
  - **체크 미선택시** `_open=on`으로 전송되어 스프링 MVC가 `open=false`로 인식

### 타임리프 자동 처리

- **타임리프 코드**
  - `th:field` 사용 시 히든 필드 자동 생성

  ```html
  <input type="checkbox" id="open" th:field="*{open}" class="form-check-input">
  ```

- **상품 상세 페이지 (item.html)**
  - `disabled` 속성을 사용하여 보여주기만 함
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/resources/templates/form/item.html)

### ItemRepository 업데이트

- **update 메서드**
  - 추가된 필드들도 업데이트 되도록 수정
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/java/hello/itemservice/domain/item/ItemRepository.java)

<br/><br/>

## 체크 박스 - 멀티

### @ModelAttribute의 특별한 사용법

- **FormItemController**
  - `@ModelAttribute("regions")` 메서드 추가
  - 컨트롤러 요청 시 자동으로 모델에 담김
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/java/hello/itemservice/web/form/FormItemController.java)

### 멀티 체크박스 구현

- **addForm.html**
  - `th:each`를 사용하여 체크박스 반복 생성
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/resources/templates/form/addForm.html)

### ID 동적 생성

- **#ids.prev(...)**
  - `th:each`로 반복 생성되는 요소의 동적 `id`를 `label`의 `for` 속성에 연결

### 전송 데이터

- **서울, 부산 선택시**
  - `regions=SEOUL&_regions=on&regions=BUSAN&_regions=on`
  - 로그
    - `item.regions=[SEOUL, BUSAN]`

<br/><br/>

## 라디오 버튼

### ENUM 활용

- **FormItemController**
  - `ItemType.values()`를 모델에 담아 전달

### 라디오 버튼 구현

- **addForm.html**
  - `th:each`로 라디오 버튼 반복 생성
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/resources/templates/form/addForm.html)

### 라디오 버튼과 체크박스의 차이

- **체크박스**
  - 히든 필드 필요 (체크 해제 인식을 위해)
- **라디오 버튼**
  - 히든 필드 불필요 (수정시에도 항상 하나 선택됨)

<br/><br/>

## 셀렉트 박스

### DeliveryCode 객체 활용

- **FormItemController**
  - 배송 방식 리스트 생성하여 모델에 전달

### 셀렉트 박스 구현

- **addForm.html**
  - `select` 태그와 `th:each` 사용
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/form/src/main/resources/templates/form/addForm.html)

### 선택된 옵션 유지

- **editForm.html 렌더링 결과**
  - 선택된 옵션에 `selected="selected"` 자동 추가

<br/><br/>

## 정리

### 타임리프 폼 기능 요약

| 기능 | 설명 | 주요 속성 |
|------|------|-----------|
| **기본 입력 폼** | `id`, `name`, `value` 자동 처리 | `th:object`, `th:field` |
| **체크박스 (단일)** | 히든 필드 자동 생성, `checked` 자동 처리 | `th:field` |
| **체크박스 (멀티)** | 동적 `id` 생성, `checked` 비교 자동 처리 | `th:field`, `th:value`, `#ids.prev` |
| **라디오 버튼** | ENUM 활용, `checked` 자동 처리 | `th:field`, `th:value` |
| **셀렉트 박스** | 객체 활용, `selected` 자동 처리 | `th:field`, `th:value`, `th:text` |

### 핵심 개념

![타임리프 폼 기능 핵심](/assets/img/spring/thymeleaf-form-concepts.png)

### 장점

- **편리한 폼 개발**
  - `th:object`, `th:field` 덕분에 반복적인 속성 작성 감소
- **검증(Validation)**
  - 검증 단계에서 오류 통합 기능과 시너지 발휘
- **유지보수성**
  - 코드 중복이 줄어들고 가독성 향상

<br/><br/>

## 연습 문제

1. Spring과 Thymeleaf를 함께 사용하여 폼을 처리할 때, 어떤 점이 개발에 편리함을 더해줄까요?

   a. 폼 데이터 바인딩 및 자동화 지원

   - Spring과 연동하여 폼 데이터를 모델 객체에 쉽고 편리하게 바인딩하며, 입력 필드의 다양한 속성 생성을 자동화해 개발 효율을 높여줌

2. Thymeleaf에서 폼 입력 필드에 `th:field`를 사용하면 주로 어떤 HTML 속성들이 자동으로 생성되나요?

   a. `id`, `name`, `value`

   - 폼 요소를 모델 객체의 특정 필드와 연결하여, 해당 필드의 이름과 값은 물론, 고유한 ID까지 자동으로 생성해 HTML 코드를 간결하게 만듦

3. 일반 HTML에서 체크박스가 '선택되지 않은' 상태로 폼을 제출할 때 발생하는 문제는 무엇인가요?

   a. 서버로 해당 필드 값이 전송되지 않음

   - 일반 HTML 체크박스는 선택되지 않으면 해당 필드 이름과 값이 HTTP 요청 시 서버로 전혀 전송되지 않아, Spring이 이 상태를 인식하기 어려움

4. Thymeleaf의 `th:field`는 체크박스나 라디오 버튼 같은 복잡한 폼 요소를 다룰 때 어떤 점을 편리하게 해줄까요?

   a. 숨겨진 필드나 `checked`, `selected` 속성 관리 자동화

   - 체크박스나 라디오 버튼 사용 시 필요한 숨겨진 필드를 자동으로 처리하고, 모델 값에 따라 `checked`나 `selected`와 같은 상태 관련 HTML 속성 설정을 자동화해줌

5. 라디오 버튼과 체크박스의 주요 차이점 중 하나는 무엇인가요?

   a. 라디오 버튼은 하나만 선택 가능하다.

   - 라디오 버튼은 여러 옵션 중에서 사용자에게 '하나의 선택'만을 강제할 때 사용하는 폼 요소로, 여러 개 선택이 가능한 체크박스와 구분됨

<br/><br/>

## Reference

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
