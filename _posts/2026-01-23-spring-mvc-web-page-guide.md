---
title: '[김영한의 스프링 MVC 1편 백엔드 웹 개발 핵심 기술] 스프링 MVC 웹 페이지 만들기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-23 15:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, thymeleaf, model-attribute, prg-pattern, redirect-attributes, web-application]
math: false
mermaid: false
---
# 스프링 MVC 웹 페이지 만들기

- 김영한님의 스프링 MVC 1편 강의를 통해 타임리프를 활용한 상품 관리 웹 애플리케이션을 만들면서 스프링 MVC의 실용적인 기능들인 `@ModelAttribute`, PRG 패턴, `RedirectAttributes`의 사용법과 동작 원리를 정리함

<br/><br/>

## 프로젝트 구조 및 설정

### 프로젝트 생성

- **빌드 도구**
  - Gradle
- **언어**
  - Java 21
- **Spring Boot**
  - 4.0.1
- **패키징**
  - Jar (내장 톰캣 사용)
- **Dependencies**
  - Spring Web
  - Thymeleaf
  - Lombok

- [build.gradle 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/build.gradle)

### Welcome 페이지

- **위치**
  - `/resources/static/index.html`

- [Welcome 페이지 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/resources/static/index.html)

- **동작 확인**
  - `http://localhost:8080` 호출 시 Welcome 페이지 표시

<br/><br/>

## 요구사항 분석

### 상품 도메인 모델

- **상품 (Item)**
  - ID (Long)
  - 상품명 (String)
  - 가격 (Integer)
  - 수량 (Integer)

### 상품 관리 기능

- **상품 목록**
  - 전체 상품 조회
- **상품 상세**
  - 개별 상품 조회
- **상품 등록**
  - 새 상품 추가
- **상품 수정**
  - 기존 상품 정보 변경

### 서비스 제공 흐름

- **타임리프 사용 시 (서버 사이드 렌터링)**
  - 백엔드 개발자가 HTML 템플릿을 작성하고 동적 데이터 바인딩
  - 서버에서 모든 HTML을 완성해서 클라이언트에 전달
  - 브라우저는 완성된 HTML을 받아서 바로 렌더링
  - 장점
    - 초기 로딩 속도가 빠름
    - SEO(검색 엔진 최적화)에 유리
    - 페이지별 전체 새로고침
  - 단점
    - 페이지 전환 시 서버 요청 필요
    - 동적인 사용자 경험 제공에 제한적

- **React, Vue.js 사용 시 (클라이언트 사이드 렌더링)**
  - 백엔드는 데이터만 JSON 형태로 제공 (HTTP API)
  - 프론트엔드가 브라우저에서 JavaScript로 HTML을 동적 생성
  - 화면 흐름과 렌더링을 프론트엔드가 완전히 제어
  - 장점
    - 페이지 전환 없이 부드러운 사용자 경험
    - 화면과 비즈니스 로직의 명확한 분리
  - 단점
    - 초기 로딩이 느릴 수 있음
    - SEO 처리에 별도 작업 필요

- **선택 기준**
  - 관리자 페이지, 내부 시스템 등 간단한 웹 애플리케이션 → 타임리프
  - 복잡한 사용자 인터랙션이 필요한 서비스 → React/Vue.js
  - 둘을 혼합해서 사용하는 것도 가능

<br/><br/>

## 도메인 개발

### Item - 상품 객체

```java
@Data
public class Item {
    private Long id;
    private String itemName;
    private Integer price;
    private Integer quantity;
}
```

- **@Data (Lombok)**
  - `@Getter`, `@Setter`, `@ToString`, `@EqualsAndHashCode`, `@RequiredArgsConstructor`

- **주의**
  - `Integer` 사용 이유
    - `null` 값 허용 필요
    - `int`는 0이 기본값이라 null과 구분 불가

- [Item 클래스 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/java/hello/itemservice/domain/item/Item.java)

### ItemRepository - 상품 저장소

```java
@Repository
public class ItemRepository {
    private static final Map<Long, Item> store = new HashMap<>();
    private static long sequence = 0L;
    
    public Item save(Item item) {  }
    public Item findById(Long id) {  }
    public List<Item> findAll() {  }
    public void update(Long itemId, Item updateParam) {  }
}
```

- **설계 특징**
  - `static` 사용
    - 싱글톤 보장
  - `HashMap` 사용
    - 실무에서는 `ConcurrentHashMap` 권장
  - `sequence`
    - ID 자동 생성

- [ItemRepository 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/java/hello/itemservice/domain/item/ItemRepository.java)

<br/><br/>

## 타임리프 기본

### 타임리프 사용 선언

```html
<html xmlns:th="http://www.thymeleaf.org">
```

### 타임리프 기본 개념

- **Natural Templates (네츄럴 템플릿)**
  - 순수 HTML 파일을 브라우저에서 직접 열어도 내용 확인 가능
  - 서버를 통해 뷰 템플릿을 거치면 동적으로 변경된 결과 확인
  - JSP와의 차이
    - JSP는 브라우저에서 직접 열면 소스코드와 HTML이 섞여 정상 확인 불가

- **동작 원리**
  - `th:xxx` 속성
    - 서버사이드에서 렌더링되어 기존 속성 대체
  - `th:xxx` 없으면
    - 기존 HTML 속성 그대로 사용
  - 브라우저는 `th:` 속성을 모르므로 무시

### 주요 타임리프 문법

- **속성 변경 - th:href**

  ```html
  <!-- 정적 -->
  <link href="../css/bootstrap.min.css" rel="stylesheet">
  
  <!-- 타임리프 -->
  <link href="../css/bootstrap.min.css" th:href="@{/css/bootstrap.min.css}" rel="stylesheet">
  ```

- **URL 링크 표현식 - @{}**

  ```html
  th:href="@{/css/bootstrap.min.css}"
  ```

  - **특징**
    - URL 링크 사용 시 `@{}` 사용
    - 서블릿 컨텍스트 자동 포함
    - 경로 변수, 쿼리 파라미터 지원

  - **경로 변수 예시**

    ```html
    th:href="@{/basic/items/{itemId}(itemId=${item.id})}"
    <!-- 결과: /basic/items/1 -->
    ```

  - **쿼리 파라미터 예시**

    ```html
    th:href="@{/basic/items/{itemId}(itemId=${item.id}, query='test')}"
    <!-- 결과: /basic/items/1?query=test -->
    ```

- **리터럴 대체 - ||**

  ```html
  <!-- 복잡한 방식 -->
  th:onclick="'location.href=' + '\'' + @{/basic/items/add} + '\''"
  
  <!-- 리터럴 대체 사용 -->
  th:onclick="|location.href='@{/basic/items/add}'|"
  ```

  - **리터럴 대체 간단 URL**

    ```html
    th:href="@{|/basic/items/${item.id}|}"
    ```

- **반복 출력 - th:each**

  ```html
  <tr th:each="item : ${items}">
      <td th:text="${item.id}">1</td>
      <td th:text="${item.itemName}">상품명</td>
      <td th:text="${item.price}">10000</td>
      <td th:text="${item.quantity}">10</td>
  </tr>
  ```

  - **동작**
    - `items` 컬렉션의 데이터를 `item` 변수에 하나씩 할당
    - 컬렉션 수만큼 `<tr>` 태그와 하위 태그 생성

- **변수 표현식 - ${}**

  ```html
  <td th:text="${item.price}">10000</td>
  ```

  - **특징**
    - 모델에 포함된 값 또는 타임리프 변수 조회
    - 프로퍼티 접근법 사용 (`item.getPrice()`)

- **내용 변경 - th:text**

  ```html
  <td th:text="${item.price}">10000</td>
  ```

  - 태그 내용을 `th:text` 값으로 변경
  - 여기서는 `10000`을 `${item.price}` 값으로 변경

- **속성 변경 - th:value**

  ```html
  <input type="text" id="itemId" name="itemId" value="1" th:value="${item.id}" readonly>
  ```

- **조건부 렌더링 - th:if**

  ```html
  <h2 th:if="${param.status}" th:text="'저장 완료!'"></h2>
  ```

  - 조건이 참일 때만 렌더링
  - `${param.status}`
    - 쿼리 파라미터 조회 (타임리프 내장 기능)

- **Form 액션 - th:action**

  ```html
  <form action="item.html" th:action method="post">
  ```

  - **특징**
    - `action`에 값이 없으면 현재 URL에 데이터 전송
    - 동일 URL에서 GET(폼), POST(처리) 구분 가능

<br/><br/>

## 상품 목록 기능

### 컨트롤러

```java
@Controller
@RequestMapping("/basic/items")
@RequiredArgsConstructor
public class BasicItemController {
    
    private final ItemRepository itemRepository;
    
    @GetMapping
    public String items(Model model) {
        List<Item> items = itemRepository.findAll();
        model.addAttribute("items", items);
        return "basic/items";
    }
    
    @PostConstruct
    public void init() {
        itemRepository.save(new Item("testA", 10000, 10));
        itemRepository.save(new Item("testB", 20000, 20));
    }
}
```

- **@RequiredArgsConstructor**
  - `final` 멤버변수로 생성자 자동 생성
  - 생성자가 1개면 `@Autowired` 자동 적용

- **@PostConstruct**
  - 빈의 의존관계가 모두 주입된 후 초기화 용도로 호출
  - 테스트 데이터 추가용

### 뷰 템플릿

- **주요 부분**

  ```html
  <tr th:each="item : ${items}">
      <td th:text="${item.id}">회원id</td>
      <td th:text="${item.itemName}">상품명</td>
      <td th:text="${item.price}">10000</td>
      <td th:text="${item.quantity}">10</td>
  </tr>
  ```

- [상품 목록 뷰 템플릿 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/resources/templates/basic/items.html)

<br/><br/>

## 상품 상세 기능

### 컨트롤러

```java
@GetMapping("/{itemId}")
public String item(@PathVariable Long itemId, Model model) {
    Item item = itemRepository.findById(itemId);
    model.addAttribute("item", item);
    return "basic/item";
}
```

- **동작**
  1. `@PathVariable`로 상품 ID 받기
  2. Repository에서 상품 조회
  3. 모델에 담기
  4. 뷰 템플릿 호출

### 뷰 템플릿

- **주요 부분**

  ```html
  <!-- 저장 완료 메시지 (PRG 패턴 사용 시) -->
  <h2 th:if="${param.status}" th:text="'저장 완료!'"></h2>
  
  <input type="text" th:value="${item.id}" readonly>
  <input type="text" th:value="${item.itemName}" readonly>
  ```

- [상품 상세 뷰 템플릿 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/resources/templates/basic/item.html)

<br/><br/>

## 상품 등록 기능

### 등록 폼 컨트롤러

```java
@GetMapping("/add")
public String addForm() {
    return "basic/addForm";
}
```

- 단순히 뷰 템플릿만 호출

### 등록 폼 뷰

- **핵심 부분**

  ```html
  <form action="item.html" th:action method="post">
      <input type="text" name="itemName" placeholder="이름을 입력하세요">
      <input type="text" name="price" placeholder="가격을 입력하세요">
      <input type="text" name="quantity" placeholder="수량을 입력하세요">
      <button type="submit">상품 등록</button>
  </form>
  ```

- **th:action 특징**
  - `action` 값이 없으면 현재 URL에 데이터 전송
  - 상품 등록 폼
    - `GET /basic/items/add`
  - 상품 등록 처리
    - `POST /basic/items/add`
  - 하나의 URL로 폼과 처리를 깔끔하게 분리

- [등록 폼 뷰 템플릿 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/resources/templates/basic/addForm.html)

### 등록 처리 컨트롤러 구현 방식

- **v1 - @RequestParam 사용**

  ```java
  @PostMapping("/add")
  public String addItemV1(@RequestParam String itemName,
                         @RequestParam int price,
                         @RequestParam Integer quantity,
                         Model model) {
      Item item = new Item();
      item.setItemName(itemName);
  }
  ```

  - **특징**
    - 요청 파라미터를 하나하나 받아서 처리
    - 객체 생성 과정이 번거로움

- **v2 - @ModelAttribute 사용**

  ```java
  @PostMapping("/add")
  public String addItemV2(@ModelAttribute("item") Item item) {
      itemRepository.save(item);
      return "basic/item";
  }
  ```

  - **@ModelAttribute 기능**
    1. 요청 파라미터 처리
       - Item 객체 생성 + 프로퍼티 접근법(setXxx)으로 값 입력
    2. Model 자동 추가
       - `@ModelAttribute("item")`로 지정한 이름으로 모델에 자동 추가

- **v3 - @ModelAttribute 이름 생략**

  ```java
  @PostMapping("/add")
  public String addItemV3(@ModelAttribute Item item) {
      itemRepository.save(item);
      return "basic/item";
  }
  ```

  - **클래스명 → 모델 이름 변환 규칙**
    - 클래스의 첫 글자를 소문자로 변경
    - camelCase 형식 유지
    
- **v4 - @ModelAttribute 완전 생략**

  ```java
  @PostMapping("/add")
  public String addItemV4(Item item) {
      itemRepository.save(item);
      return "basic/item";
  }
  ```

  - **애노테이션 생략 규칙**
    - 단순 타입(`String`, `int`, `Integer` 등) → `@RequestParam` 적용
    - 나머지 → `@ModelAttribute` 적용

- [등록 처리 컨트롤러 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/java/hello/itemservice/web/item/basic/BasicItemController.java)

<br/><br/>

## 상품 수정 기능

### 수정 처리 컨트롤러

```java
@PostMapping("/{itemId}/edit")
public String edit(@PathVariable Long itemId, @ModelAttribute Item item) {
    itemRepository.update(itemId, item);
    return "redirect:/basic/items/{itemId}";
}
```

- **URL 구조**
  - `GET /items/{itemId}/edit`
    - 상품 수정 폼
  - `POST /items/{itemId}/edit`
    - 상품 수정 처리

- **리다이렉트**
  - `redirect:/basic/items/{itemId}`
  - `@PathVariable`의 값을 redirect에도 사용 가능
  - 뷰 템플릿 대신 상품 상세 화면으로 리다이렉트

- **참고**
  - HTML Form은 PUT, PATCH 미지원 (GET, POST만 가능)

- [수정 기능 전체 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/item-service/src/main/java/hello/itemservice/web/item/basic/BasicItemController.java)

<br/><br/>

## PRG 패턴 (Post/Redirect/Get)

### 발생 가능한 문제

- **예시: 상품 등록 후 새로고침 시 중복 등록**
  - 웹 브라우저의 새로고침은 마지막 서버 전송 데이터를 다시 전송
  - POST 요청 후 새로고침 시 POST 데이터가 재전송됨
  - 같은 상품이 여러 번 등록되는 문제 발생

### PRG 패턴

- **동작 과정**
  1. POST로 상품 등록
  2. 상세 화면으로 리다이렉트 (302 응답)
  3. 브라우저가 자동으로 GET 요청
  4. 마지막 요청이 GET이므로 새로고침 시 조회만 반복

### PRG 패턴 적용 코드

```java
/**
 * PRG - Post/Redirect/Get
 */
@PostMapping("/add")
public String addItemV5(Item item) {
    itemRepository.save(item);
    return "redirect:/basic/items/" + item.getId();
}
```

- **주의사항**

  ```java
  "redirect:/basic/items/" + item.getId()
  ```
    - URL에 변수를 `+`로 더하는 방식은 URL 인코딩이 안되어 위험
    - `RedirectAttributes` 사용 권장

<br/><br/>

## RedirectAttributes

### 활용

- 상품 저장 후 상세 화면으로 이동 시 저장 성공 메시지 표시
  - 사용자에게 작업 완료 확인 제공
  - 일회성 데이터를 쿼리 파라미터로 전달

### RedirectAttributes 사용

```java
/**
 * RedirectAttributes
 */
@PostMapping("/add")
public String addItemV6(Item item, RedirectAttributes redirectAttributes) {
    Item savedItem = itemRepository.save(item);
    redirectAttributes.addAttribute("itemId", savedItem.getId());
    redirectAttributes.addAttribute("status", true);
    return "redirect:/basic/items/{itemId}";
}
```

- **실행 결과**

  ```
  http://localhost:8080/basic/items/3?status=true
  ```

### RedirectAttributes 동작

```java
return "redirect:/basic/items/{itemId}";
```

- **파라미터 처리**
  - `{itemId}`
    - PathVariable로 바인딩
  - 나머지(`status`)
    - 쿼리 파라미터로 처리

- **자동 처리 기능**
  1. URL 인코딩
  2. PathVariable 바인딩
  3. 쿼리 파라미터 생성

### 뷰 템플릿에 메시지 추가

- **위치**
  - `resources/templates/basic/item.html`

  ```html
  <div class="container">
      <div class="py-5 text-center">
          <h2>상품 상세</h2>
      </div>
      
      <!-- 추가 -->
      <h2 th:if="${param.status}" th:text="'저장 완료!'"></h2>
      
      <!-- 나머지 내용 -->
  </div>
  ```

- **타임리프 문법**
  - `th:if="${param.status}"`
    - 조건이 참이면 실행
  - `${param.status}`
    - 쿼리 파라미터를 편리하게 조회하는 타임리프 기능

- **동작**
  - 상품 등록 후 이동 시 `?status=true` → "저장 완료!" 메시지 표시
  - 상품 목록에서 상세 이동 시 쿼리 파라미터 없음 → 메시지 표시 안 됨

<br/><br/>

## 연습 문제

1. 스프링 MVC로 동적 웹 페이지를 만들 때, 기본 템플릿 엔진 중 HTML 텍스트를 그대로 유지하면서 동적 처리를 가능하게 하는 템플릿 엔진은 무엇인가요?

   a. Web, Thymeleaf

   - 동적 웹 페이지를 만들려면 템플릿 엔진이 필요함
   - Spring Boot Web 의존성은 웹 기능을, Thymeleaf 의존성은 서버사이드 HTML을 동적으로 만들어줌

2. MVC 패턴에서 사용자의 요청을 처음 받아 처리할 컨트롤러를 결정하는 중심적인 역할은 무엇인가요?

   a. Controller

   - MVC에서 컨트롤러는 클라이언트의 요청을 받아 적절한 서비스나 로직을 호출하고, 그 결과를 모델에 담아 뷰에게 전달하는 중심역할을 함

3. 애플리케이션에서 내에서 데이터를 저장소에 넣기 가거나 가져오는 등의 데이터 접근 로직을 추상화하여 담당하는 역할은 무엇인가요?

   a. Repository

   - 레포지토리는 데이터 저장소(DB 등)에 접근하는 로직을 추상화하여, 데이터 관리와 관련된 일관된 인터페이스를 제공하는 역할을 맡음

4. 타임리프(Thymeleaf)의 '내츄럴 템플릿(Natural Template)'이라고 부르는 이유는 무엇인가요?

   a. 순수 HTML 파일을 브라우저에서 바로 열어도 레이아웃을 확인할 수 있기 때문

   - 타임리프의 가장 큰 특징 중 하나는 순수 HTML 구조를 유지하면서 동적인 요소를 추가할 수 있어, 웹 서버 없이도 브라우저에서 레이아웃을 확인할 수 있다는 점임

5. 컨트롤러 모델에서 담아 뷰로 전달한 데이터의 속성 값을 타임리프 템플릿에서 사용하려면 어떤 표현식을 쓸까요?

   a. `${}`

   - `${}`형태의 변수 표현식은 타임리프에서 모델에 담긴 객체나 데이터의 속성 값에 접근하고 출력할 때 사용되는 기본적인 문법임

6. 다중 스레드 환경에서 여러 쓰레드가 동시에 읽고 쓸 때 안전하게 데이터를 수정할 수 있는 환경에서 사용하기 어려운 맵은 무엇인가요?

   a. HashMap

   - `HashMap`은 여러 스레드가 동시에 읽고 쓰면 데이터 변형이 발생할 수 있음
   - 안전하게 사용하려면 `ConcurrentHashMap`같은 자료구조를 써야 함

7. 스프링 MVC의 `@ModelAttribute`는 HTTP 요청 파라미터를 자바 객체로 자동으로 만들면서 동시에 어떤 객체에 자동으로 추가해 줄까요?

   a. 폼 데이터 받아 객체 속성에 자동 바인딩

   - `@ModelAttribute`는 HTTP 요청 파라미터를 분석하여 지정된 객체의 속성에 자동으로 값을 채워주는 기능을 함
   - 이를 통해 컨트롤러에서 폼 데이터를 객체로 쉽게 다룰 수 있음

8. 표준 HTML `<form>` 태그의 `method` 속성에서 직접 지원하여 데이터를 전송할 수 있는 HTTP 메서드는 보통 어떤 것인가요?

   a. GET, POST

   - 표준 HTML 폼 태그는 데이터 전송을 위해 GET 방식과 POST 방식만 기본적으로 지원함
   - PUT이나 DELETE는 다른 HTTP 메서드는 직접 사용할 수 없음

9. 웹 페이지에서 폼 데이터를 POST로 제출한 후, 브라우저 새로고침 시 동일한 데이터가 다시 제출되어 중복 생성을 유발하는 문제를 방지하기 위한 디자인 패턴은 무엇인가요?

   a. PRG 패턴

   - PRG 패턴은 POST 요청 처리 후 Redirect 응답으로 리다이렉트하여, 새로고침 시 마지막 GET 요청이 아닌 GET 요청을 반복하게 만들어 중복 제출을 방지하는 방법임

10. 스프링 MVC에서 POST 요청 처리 후 리다이렉트할 때, 리다이렉트된 페이지에 성공 메시지 같은 일회성 데이터를 함께 전달하고 싶을 때 사용하는 기능은 무엇인가요?

    a. RedirectAttributes

    - `RedirectAttributes`는 리다이렉트 시 URL 경로 변수에 값을 추가하거나, 쿼리 파라미터 형태로 데이터를 자동으로 인코딩하여 다음 페이지에 전달할 수 있게 도와줌

<br/><br/>

## 요약 정리

- **프로젝트 설정**
  - Spring Boot, Thymeleaf, Lombok
  - Jar 패키징으로 내장 톰캣 사용
  - Welcome 페이지로 진입점 제공
- **도메인 개발**
  - Item
    - 상품 엔티티 클래스
  - ItemRepository
    - 싱글톤 패턴
    - HashMap으로 메모리 저장소 구현
- **타임리프 기본**
  - Natural Templates
    - 순수 HTML 유지
  - 주요 문법
    - `th:text`, `th:value`, `th:href`, `th:action`
    - `@{}`, `${}`, `||`
    - `th:each`, `th:if`
- **CRUD 기능 구현**
  - 상품 목록
    - `@GetMapping`으로 조회
  - 상품 상세
    - `@PathVariable`로 ID 받기
  - 상품 등록
    - `@ModelAttribute`로 객체 자동 생성
  - 상품 수정
    - `@PathVariable` + `@ModelAttribute`
- **@ModelAttribute 구현 방식**
  - `@RequestParam`으로 개별 파라미터
  - `@ModelAttribute("item")`로 객체 + 모델 추가
  - `@ModelAttribute`로 이름 생략
  - 완전 생략 (단순 타입 외 객체)
  - PRG 패턴 적용
  - RedirectAttributes 사용
- **PRG 패턴**
  - 문제
    - POST 후 새로고침 시 중복 등록
  - 해결
    - POST → Redirect → GET
    - 마지막 요청을 GET으로
  - 구현
    - `redirect:/basic/items/{itemId}`
- **RedirectAttributes**
  - URL 인코딩 자동
  - PathVariable 바인딩
  - 쿼리 파라미터 생성
  - 일회성 데이터 전달
- **주요 원칙**
  - 역할 분리
    - Controller, Model, View
  - 타임리프로 뷰 렌더링
  - 스프링 MVC의 편리한 기능 활용

<br/><br/>

## Reference

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
