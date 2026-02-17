---
title: '[실전! 스프링 부트와 JPA 활용1] 웹 계층 개발'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-17 16:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, web-layer, thymeleaf, form-validation, dirty-checking]
math: false
mermaid: false
---

# 웹 계층 개발

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 기반으로 홈 화면, 회원 관리, 상품 관리, 주문 관리 등 웹 계층 전반의 개발 과정과 변경 감지 및 병합 메커니즘을 정리함

<br/><br/>

## 홈 화면과 레이아웃

### 홈 컨트롤러 등록

```java
@Controller
@Slf4j
public class HomeController {
    @RequestMapping("/")
    public String home() {
        log.info("home controller");
        return "home";
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/HomeController.java)

- `@Controller`
    - 스프링 MVC 컨트롤러로 등록됨
- `@RequestMapping("/")`
    - 루트 URL 요청을 처리함
- `return "home"`
    - `resources/templates/home.html`을 렌더링함

### 스프링 부트 Thymeleaf 설정

```yaml
spring:
  thymeleaf:
    prefix: classpath:/templates/
    suffix: .html
```

- **ViewName 매핑 규칙**
    - `resources:templates/` + `{ViewName}` + `.html`
        - `"home"` 반환 → `resources:templates/home.html` 렌더링

### 타임리프 템플릿 구조

- **templates/home.html**
    - 메인 화면
    - 회원 기능
        - 회원 가입
        - 회원 목록
    - 상품 기능
        - 상품 등록
        - 상품 목록
    - 주문 기능
        - 상품 주문
        - 주문 내역
    - 공통 템플릿 포함
        - `fragments/header.html` (Bootstrap CSS 링크, 공통 meta 태그)
        - `fragments/bodyHeader.html` (상단 네비게이션, 홈 링크)
        - `fragments/footer.html` (하단 저작권 정보)

### 개발 편의 기능

- **뷰 템플릿 변경사항 즉시 반영**
    - `spring-boot-devtools` 추가
    - `html` 파일 build → Recompile
- **view 리소스 등록**
    - Bootstrap v4.3.1 사용
    - `resources/static/css/jumbotron-narrow.css` 추가
    - `resources/static/js` 폴더

<br/><br/>

## 회원 관리

### 회원 등록

- **폼 객체 (MemberForm)**

    ```java
    @Getter @Setter
    public class MemberForm {
        @NotEmpty(message = "회원 이름은 필수 입니다")
        private String name;
        private String city;
        private String street;
        private String zipcode;
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/MemberForm.java)

- **컨트롤러 흐름**

    ![회원 등록 흐름](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/member-registration-flow.png)

- **주요 로직**

    ```java
    @PostMapping(value = "/members/new")
    public String create(@Valid MemberForm form, BindingResult result) {
        if (result.hasErrors()) {
            return "members/createMemberForm";
        }
        
        Address address = new Address(form.getCity(), form.getStreet(), form.getZipcode());
        Member member = new Member();
        member.setName(form.getName());
        member.setAddress(address);
        
        memberService.join(member);
        return "redirect:/";
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/MemberController.java)

    - `@Valid`
        - 유효성 검증을 수행함
    - `BindingResult`
        - 검증 오류 정보를 담음
        - `hasErrors()` 메서드로 오류 여부를 확인함

### 회원 목록 조회

```java
@GetMapping(value = "/members")
public String list(Model model) {
    List<Member> members = memberService.findMembers();
    model.addAttribute("members", members);
    return "members/memberList";
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/MemberController.java)

- **화면 표시**
    - 회원 ID
    - 이름
    - 도시
    - 주소
    - 우편번호
- **타임리프 `?.` 연산자**
    - null 안전 접근

### 폼 객체와 엔티티 직접 사용 비교

- **폼 객체 사용 권장 이유**
    - 화면 요구사항과 엔티티 분리
    - 엔티티는 비즈니스 로직만 포함
    - 화면 종속적인 기능 제거
    - 유지보수성 향상
- **원칙**
    - 엔티티
        - 비즈니스 로직만
    - 폼 객체/DTO
        - 화면/API 요구사항 처리

<br/><br/>

## 상품 관리

### 상품 등록

- **폼 객체 (BookForm)**

    ```java
    @Getter @Setter
    public class BookForm {
        private Long id;
        private String name;
        private int price;
        private int stockQuantity;
        private String author;
        private String isbn;
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/controller/BookForm.java)

- **컨트롤러 흐름**

    ![상품 등록 흐름](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/item-registration-flow.png)

### 상품 목록 조회

```java
@GetMapping(value = "/items")
public String list(Model model) {
    List<Item> items = itemService.findItems();
    model.addAttribute("items", items);
    return "items/itemList";
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/ItemController.java)

- **화면 표시**
    - 상품 ID
    - 상품명
    - 가격
    - 재고수량
- **수정 버튼**
    - `/items/{id}/edit`

### 상품 수정

- **수정 폼 이동**

    ![상품 수정 폼](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/item-edit-form.png)

- **수정 실행**

    ![상품 수정 실행](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/item-edit-execute.png)

<br/><br/>

## 변경 감지와 병합(merge)

### 준영속 엔티티

- **정의**
    - 영속성 컨텍스트가 더 이상 관리하지 않는 엔티티
    - 이미 DB에 저장되어 식별자가 존재하는 엔티티
    - 임의로 만들어낸 엔티티도 기존 식별자를 가지면 준영속 엔티티
- ex)

    ```java
    Book book = new Book();
    book.setId(form.getId()); // 기존 식별자 존재 → 준영속 엔티티
    book.setName(form.getName());
    ```

### 준영속 엔티티 수정 방법

- **변경 감지 (권장)**

    ```java
    @Transactional
    void update(Item itemParam) {
        Item findItem = em.find(Item.class, itemParam.getId()); // 영속 상태 조회
        findItem.setPrice(itemParam.getPrice()); // 데이터 수정
        // 트랜잭션 커밋 시 자동으로 변경 감지 → UPDATE SQL 실행
    }
    ```

    - **동작 과정**

        ![변경 감지 과정](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/dirty-checking.png)

    - **장점**
        - 원하는 속성만 선택적으로 변경 가능
        - null 업데이트 위험 없음
        - 명확한 변경 지점

- **병합 (비권장)**

    ```java
    @Transactional
    void update(Item itemParam) {
        Item mergeItem = em.merge(itemParam);
    }
    ```

    - **병합 동작 방식**

        ![병합 동작 과정](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/merge-operation.png)

    - **단점**
        - 모든 필드를 교체 (선택적 수정 불가)
        - 값이 없으면 null로 업데이트될 위험
        - 변경 폼에서 모든 데이터를 유지해야 함

### ItemRepository의 save 메서드

```java
public void save(Item item) {
    if (item.getId() == null) {
        em.persist(item); // 신규 등록
    } else {
        em.merge(item); // 수정 (병합)
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/ItemRepository.java)

- **판단 기준**
    - 식별자 null → 새로운 엔티티 → `persist`
    - 식별자 존재 → 준영속 엔티티 → `merge`

### 권장 해결 방법

- **원칙**
    - 엔티티 변경 시 항상 변경 감지 사용
    - 컨트롤러에서 엔티티 생성 지양
    - 서비스 계층에 식별자와 변경 데이터 전달
    - 서비스 계층에서 영속 엔티티 조회 후 데이터 변경
- **권장 코드**

    ```java
    // Controller
    @PostMapping(value = "/items/{itemId}/edit")
    public String updateItem(@PathVariable Long itemId, @ModelAttribute("form") BookForm form) {
        itemService.updateItem(itemId, form.getName(), form.getPrice(), form.getStockQuantity());
        return "redirect:/items";
    }
    
    // Service
    @Transactional
    public void updateItem(Long id, String name, int price, int stockQuantity) {
        Item item = itemRepository.findOne(id); // 영속 엔티티 조회
        item.setName(name);
        item.setPrice(price);
        item.setStockQuantity(stockQuantity);
        // 트랜잭션 커밋 시 변경 감지 자동 동작
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/service/ItemService.java)

<br/><br/>

## 주문 관리

### 상품 주문

- **컨트롤러 구조**

    ```java
    @Controller
    @RequiredArgsConstructor
    public class OrderController {
        private final OrderService orderService;
        private final MemberService memberService;
        private final ItemService itemService;
        
        // 주문 폼
        // 주문 실행
        // 주문 목록
        // 주문 취소
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/OrderController.java)

- **주문 폼 흐름**

    ![주문 폼 흐름](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/order-form-flow.png)

- **주문 실행 흐름**

    ![주문 실행 흐름](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/order-execution-flow.png)

- **주요 로직**

    ```java
    @PostMapping(value = "/order")
    public String order(@RequestParam("memberId") Long memberId,
                       @RequestParam("itemId") Long itemId,
                       @RequestParam("count") int count) {
        orderService.order(memberId, itemId, count);
        return "redirect:/orders";
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/OrderController.java)

### 주문 목록 검색

```java
@GetMapping(value = "/orders")
public String orderList(@ModelAttribute("orderSearch") OrderSearch orderSearch, Model model) {
    List<Order> orders = orderService.findOrders(orderSearch);
    model.addAttribute("orders", orders);
    return "order/orderList";
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/web/OrderController.java)

- **검색 기능**
    - 회원명으로 검색
    - 주문 상태로 필터링 (ORDER, CANCEL)
- **화면 표시**
    - 주문 ID
    - 회원명
    - 대표상품 정보
    - 주문 상태
    - 주문 일시
- **주문 상태가 ORDER인 경우**
    - 취소 버튼 표시

### 주문 취소

- **흐름**

    ![주문 취소 흐름](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/order-cancel-flow.png)

- **주요 로직**

    ```java
    @PostMapping(value = "/orders/{orderId}/cancel")
    public String cancelOrder(@PathVariable("orderId") Long orderId) {
        orderService.cancelOrder(orderId);
        return "redirect:/orders";
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/controller/OrderController.java)

<br/><br/>

## 전체 아키텍처

![전체 아키텍처](/assets/img/jpa/2026-02-17-spring-boot-jpa-web-layer-development/architecture.png)

### 계층별 역할

- **Controller Layer**
    - HTTP 요청/응답 처리
    - 폼 객체/DTO 사용
    - 서비스 계층 호출
    - 뷰 이름 반환
- **Service Layer**
    - 비즈니스 로직 처리
    - 트랜잭션 관리
    - 엔티티 조작
    - 변경 감지 활용
- **Repository Layer**
    - 데이터 접근
    - 엔티티 영속화/조회
    - JPQL/QueryDSL 사용
- **View Layer**
    - Thymeleaf 템플릿
    - 프래그먼트 재사용
    - 데이터 바인딩

<br/><br/>

## 연습 문제

1. 회원 가입 시 화면 입력 데이터를 엔티티 객체 대신 별도의 Form 객체로 받는 주된 이유는 무엇일까요?

   a. 화면 종속적인 데이터나 유효성 검증 로직을 분리하기 위해서

   - 화면에서 넘어오는 데이터 형식이나 유효성 검증 규칙은 비즈니스 로직을 담은 엔티티와 다를 수 있음
   - Form 객체는 UI 계층의 요구사항에 맞춰 데이터를 받고 처리함으로써 엔티티의 순수성을 유지하고 코드 구조를 깔끔하게 만드는 데 도움을 줌

2. Spring MVC에서 `@Valid` 어노테이션으로 폼 데이터 검증 시 오류 발생 시 컨트롤러에서 이를 처리하고 폼 화면으로 되돌아가기 위해 주로 어떤 객체를 사용할까요?

   a. BindingResult 객체

   - `@Valid` 대상 객체 바로 뒤에 `BindingResult`를 파라미터로 선언하면, 유효성 검증 중 발생한 오류가 이 객체에 담겨 컨트롤러 메서드로 넘어옴
   - 이를 확인하여 오류가 있으면 폼 화면으로 다시 이동시키면서 오류 메시지를 함께 보여줄 수 있음

3. JPA에서 영속성 컨텍스트에 의해 관리되는(Managed) 엔티티의 데이터가 변경되면, 개발자가 별도의 `update` 메서드를 명시적으로 호출하지 않아도 트랜잭션 커밋 시 자동으로 DB에 변경 내용이 반영됩니다. 이 메커니즘을 무엇이라고 할까요?

   a. Dirty Checking (변경 감지)

   - JPA는 영속성 컨텍스트가 관리하는 엔티티의 상태 변화를 추적함
   - 트랜잭션이 끝나는 시점에 엔티티의 변경된 내용을 감지하여 자동으로 DB에 UPDATE 쿼리를 실행하는데, 이를 변경 감지 또는 더티 체킹이라고 부름

4. JPA의 `merge` 기능을 사용하여 준영속(Detached) 상태의 엔티티를 영속 상태로 만들고 데이터를 업데이트할 때, 파라미터로 넘어온 준영속 객체의 특정 필드가 `null`일 경우 발생할 수 있는 주된 위험은 무엇일까요?

   a. DB에 저장된 엔티티의 해당 필드 값이 `null`로 덮어쓰여질 수 있다.

   - `merge`는 파라미터로 넘어온 준영속 엔티티의 모든 필드 값을 영속 상태 엔티티에 복사함
   - 만약 파라미터 객체의 특정 필드가 `null`이라면, DB의 해당 필드 값도 `null`로 변경될 수 있어 데이터 손실 위험이 있음

5. 최신 웹/모바일 앱 개발에서 API를 설계할 때, 백엔드의 JPA 엔티티 객체를 API 응답 값으로 외부에 직접 노출하는 것을 지양해야 하는 주된 이유는 무엇일까요?

   a. 엔티티 변경 시 API 스펙이 함께 변경되어 API의 안정성을 해치기 때문에

   - JPA 엔티티는 DB 구조와 비즈니스 로직이 결합된 내부 모델임
   - 이를 직접 노출하면 엔티티에 필드가 추가/삭제/변경될 때마다 API 사용자가 영향을 받게 되어 API 스펙이 불안정해지며, 민감한 정보가 노출될 위험도 있음
   - 따라서 API 응답은 DTO 등으로 변환하여 전달하는 것이 좋음

<br/><br/>

## 요약 정리

- **홈 화면과 레이아웃**은 Thymeleaf 템플릿을 활용하여 header, bodyHeader, footer 등 프래그먼트로 구조화함
- **회원 관리**는 `MemberForm`을 사용하여 화면 계층과 엔티티를 분리하고, `@Valid`와 `BindingResult`로 유효성 검증을 처리함
- **상품 관리**는 `BookForm`을 통해 등록/수정을 처리하며, 준영속 엔티티 수정 시 변경 감지를 사용하는 것을 권장함
- **변경 감지**(Dirty Checking)는 영속 엔티티를 조회 후 수정하는 방식으로 null 업데이트 위험이 없고, 병합(merge)은 모든 필드를 교체하므로 비권장함
- **주문 관리**는 주문 생성, 목록 조회, 검색, 취소 기능을 컨트롤러에서 처리하며, 비즈니스 로직은 서비스 계층에 위임함
- **계층 분리**는 Controller, Service, Repository로 나누어 관심사를 명확히 하고, 엔티티는 비즈니스 로직만 포함하도록 함

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
