---
title: '[실전! 스프링 부트와 JPA 활용1] 주문 도메인 개발'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-16 17:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, order-domain, business-logic, dynamic-query, test, querydsl]
math: false
mermaid: true
---

# 주문 도메인 개발

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 기반으로 주문 엔티티의 핵심 비즈니스 로직, 리포지토리, 서비스 계층 개발 과정과 테스트, 그리고 검색 기능 구현을 정리함

<br/><br/>

## 개발 개요

### 구현 기능

- **상품 주문**
    - 주문 생성
    - 재고 감소
    - 배송 정보 생성
- **주문 취소**
    - 상태 변경
    - 재고 복구
    - 배송 검증
- **주문 조회**
    - 전체 조회
    - 검색 조회
    - 가격 계산

### 개발 순서

1. **주문/주문상품 엔티티 개발**
    - 엔티티 비즈니스 로직을 구현함 (생성 메서드, 비즈니스 로직, 조회 로직)
2. **주문 리포지토리 개발**
    - 데이터 접근 계층을 구현함 (저장, 조회, 검색)
3. **주문 서비스 개발**
    - 서비스 계층을 구현함 (트랜잭션 관리, 엔티티 조율)
4. **주문 검색 기능 개발**
    - 동적 쿼리를 구현함 (JPQL, Criteria)
5. **주문 기능 테스트**
    - 테스트를 작성함 (주문, 취소, 재고 검증)

<br/><br/>

## 주문 엔티티 개발

### 주문 엔티티 구조

![order-class-diagram](/img/jpa/order-class-diagram.png)

### Order 엔티티 코드

```java
@Entity
@Table(name = "orders")
@Getter @Setter
public class Order {
    
    @Id @GeneratedValue
    @Column(name = "order_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id")
    private Delivery delivery;
    
    private LocalDateTime orderDate;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    //==연관관계 편의 메서드==//
    public void setMember(Member member) {
        this.member = member;
        member.getOrders().add(this);
    }
    
    public void addOrderItem(OrderItem orderItem) {
        orderItems.add(orderItem);
        orderItem.setOrder(this);
    }
    
    public void setDelivery(Delivery delivery) {
        this.delivery = delivery;
        delivery.setOrder(this);
    }
    
    //==생성 메서드==//
    public static Order createOrder(Member member, Delivery delivery, OrderItem... orderItems) {
        Order order = new Order();
        order.setMember(member);
        order.setDelivery(delivery);
        for (OrderItem orderItem : orderItems) {
            order.addOrderItem(orderItem);
        }
        order.setStatus(OrderStatus.ORDER);
        order.setOrderDate(LocalDateTime.now());
        return order;
    }
    
    //==비즈니스 로직==//
    
    /**
     * 주문 취소
     */
    public void cancel() {
        if (delivery.getStatus() == DeliveryStatus.COMP) {
            throw new IllegalStateException("이미 배송완료된 상품은 취소가 불가능합니다.");
        }
        
        this.setStatus(OrderStatus.CANCEL);
        for (OrderItem orderItem : orderItems) {
            orderItem.cancel();
        }
    }
    
    //==조회 로직==//
    
    /**
     * 전체 주문 가격 조회
     */
    public int getTotalPrice() {
        int totalPrice = 0;
        for (OrderItem orderItem : orderItems) {
            totalPrice += orderItem.getTotalPrice();
        }
        return totalPrice;
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/Order.java)

### 주문 생성 메서드

![order-create-sequence](/img/jpa/order-create-sequence.png)    
- `static` 메서드로 생성 로직 캡슐화
- 가변 인자(`OrderItem...`)로 여러 주문상품 처리
- 초기 상태 설정 (ORDER, 현재 시간)

### 주문 취소 로직

![order-cancel-flow](/img/jpa/order-cancel-flow.png)

- **취소 프로세스**

    ![order-cancel-sequence](/img/jpa/order-cancel-sequence.png)

### 전체 주문 가격 조회

```java
public int getTotalPrice() {
    int totalPrice = 0;
    for (OrderItem orderItem : orderItems) {
        totalPrice += orderItem.getTotalPrice();
    }
    return totalPrice;
}
```

- **계산 로직**
    ```
    총 주문 가격 = Σ(각 주문상품의 가격 × 수량)
    ```

> - 실무에서는 성능을 위해 `totalPrice` 필드를 추가하고 역정규화하는 경우가 많음

<br/><br/>

## 주문상품 엔티티 개발

### OrderItem 엔티티 코드

```java
@Entity
@Table(name = "order_item")
@Getter @Setter
public class OrderItem {
    
    @Id @GeneratedValue
    @Column(name = "order_item_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
    
    private int orderPrice;  // 주문 가격
    private int count;       // 주문 수량
    
    //==생성 메서드==//
    public static OrderItem createOrderItem(Item item, int orderPrice, int count) {
        OrderItem orderItem = new OrderItem();
        orderItem.setItem(item);
        orderItem.setOrderPrice(orderPrice);
        orderItem.setCount(count);
        
        item.removeStock(count);
        return orderItem;
    }
    
    //==비즈니스 로직==//
    
    /**
     * 주문 취소
     */
    public void cancel() {
        getItem().addStock(count);
    }
    
    //==조회 로직==//
    
    /**
     * 주문상품 전체 가격 조회
     */
    public int getTotalPrice() {
        return getOrderPrice() * getCount();
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/OrderItem.java)

### 주문상품 생성 프로세스

![orderitem-create-sequence](/img/jpa/orderitem-create-sequence.png)

### 주문상품 기능 요약

![orderitem-structure](/img/jpa/orderitem-structure.png)

<br/><br/>

## 주문 리포지토리 개발

### OrderRepository 코드

```java
@Repository
@RequiredArgsConstructor
public class OrderRepository {
    
    private final EntityManager em;
    
    public void save(Order order) {
        em.persist(order);
    }
    
    public Order findOne(Long id) {
        return em.find(Order.class, id);
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/OrderRepository.java)

### Repository 메서드

![repository-methods](/img/jpa/repository-methods.png)

<br/><br/>

## 주문 서비스 개발

### OrderService 코드

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OrderService {
    
    private final MemberRepository memberRepository;
    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    
    /**
     * 주문
     */
    @Transactional
    public Long order(Long memberId, Long itemId, int count) {
        // 엔티티 조회
        Member member = memberRepository.findOne(memberId);
        Item item = itemRepository.findOne(itemId);
        
        // 배송정보 생성
        Delivery delivery = new Delivery();
        delivery.setAddress(member.getAddress());
        delivery.setStatus(DeliveryStatus.READY);
        
        // 주문상품 생성
        OrderItem orderItem = OrderItem.createOrderItem(item, item.getPrice(), count);
        
        // 주문 생성
        Order order = Order.createOrder(member, delivery, orderItem);
        
        // 주문 저장
        orderRepository.save(order);
        
        return order.getId();
    }
    
    /**
     * 주문 취소
     */
    @Transactional
    public void cancelOrder(Long orderId) {
        // 주문 엔티티 조회
        Order order = orderRepository.findOne(orderId);
        
        // 주문 취소
        order.cancel();
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/service/OrderService.java)

### 주문 생성 프로세스

![order-service-sequence](/img/jpa/order-service-sequence.png)

### 주문 취소 프로세스

![order-service-cancel-sequence](/img/jpa/order-service-cancel-sequence.png)

### Cascade와 영속성 전이

![cascade-graph](/img/jpa/cascade-graph.png)

- **Cascade 효과**
    ```java
    // Cascade 없으면
    deliveryRepository.save(delivery);
    orderItemRepository.save(orderItem);
    orderRepository.save(order);
    
    // Cascade 있으면
    orderRepository.save(order);  // 이것만으로 모두 저장됨!
    ```

### 도메인 모델 패턴 적용

- **서비스 계층 역할**
    - **엔티티 조회**
        - Repository 호출
    - **엔티티 조율**
        - 여러 엔티티 조합
    - **트랜잭션 관리**
        - `@Transactional`
    - **비즈니스 로직 위임**
        - 엔티티 메서드 호출 (`Order.createOrder`, `Order.cancel`)

> - 서비스는 단순히 엔티티에 필요한 요청을 **위임**하는 역할만 수행

<br/><br/>

## 주문 기능 테스트

### 테스트 요구사항

- **테스트 시나리오**
    - **정상 케이스**
        - 상품 주문 성공
        - 주문 취소 성공
    - **예외 케이스**
        - 재고 수량 초과

### 상품 주문 테스트

```java
@SpringBootTest
@Transactional
public class OrderServiceTest {
    
    @PersistenceContext EntityManager em;
    @Autowired OrderService orderService;
    @Autowired OrderRepository orderRepository;
    
    @Test
    public void 상품주문() throws Exception {
        // Given
        Member member = createMember();
        Item item = createBook("시골 JPA", 10000, 10);
        int orderCount = 2;
        
        // When
        Long orderId = orderService.order(member.getId(), item.getId(), orderCount);
        
        // Then
        Order getOrder = orderRepository.findOne(orderId);
        
        assertEquals(OrderStatus.ORDER, getOrder.getStatus(), "상품 주문시 상태는 ORDER");
        assertEquals(1, getOrder.getOrderItems().size(), "주문한 상품 종류 수가 정확해야 한다.");
        assertEquals(10000 * 2, getOrder.getTotalPrice(), "주문 가격은 가격 * 수량이다.");
        assertEquals(8, item.getStockQuantity(), "주문 수량만큼 재고가 줄어야 한다.");
    }
    
    @Test
    public void 상품주문_재고수량초과() {
        // Given
        Member member = createMember();
        Item item = createBook("시골 JPA", 10000, 10);
        int orderCount = 11;  // 재고보다 많은 수량
        
        // When & Then
        assertThrows(NotEnoughStockException.class, () -> 
            orderService.order(member.getId(), item.getId(), orderCount)
        );
    }
    
    @Test
    public void 주문취소() {
        // Given
        Member member = createMember();
        Item item = createBook("시골 JPA", 10000, 10);
        int orderCount = 2;
        
        Long orderId = orderService.order(member.getId(), item.getId(), orderCount);
        
        // When
        orderService.cancelOrder(orderId);
        
        // Then
        Order getOrder = orderRepository.findOne(orderId);
        
        assertEquals(OrderStatus.CANCEL, getOrder.getStatus(), "주문 취소시 상태는 CANCEL");
        assertEquals(10, item.getStockQuantity(), "주문이 취소된 상품은 그만큼 재고가 증가해야 한다.");
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/test/java/jpabook/jpashop/service/OrderServiceTest.java)

### 테스트 시나리오 플로우

- **상품 주문 테스트**

![order-test-sequence](/img/jpa/order-test-sequence.png)

- **재고 부족 테스트**

<br/><br/>

## 연습 문제

1. 주문 취소 시 발생하는 주요 비즈니스 로직은 무엇일까요?

   a. 취소된 주문 상품의 재고가 복구됩니다.

   - 주문 취소 시 주문 상태는 '취소'로 변경되고, 주문 시 감소했던 상품의 재고 수량이 다시 원상태로 복구되는 비즈니스 로직이 중요하게 구현됨

2. JPA에서 엔티티 객체의 변경 사항을 트랜잭션 커밋 시점에 자동으로 데이터베이스에 반영하는 기능은 무엇인가요?

   a. 변경 감지(Dirty Checking)

   - 영속성 컨텍스트 내에서 조회된 엔티티의 변경이 발생하면, JPA는 트랜잭션이 커밋될 때 이를 감지하여 자동으로 해당 엔티티에 대한 UPDATE 쿼리를 생성 및 실행함
   - 이를 변경 감지라고 함

3. 핵심 비즈니스 로직의 대부분을 서비스 계층이 아닌 도메인 엔티티 자체에 포함시키는 설계 방식은 무엇이라고 부르나요?

   a. 도메인 모델 패턴

   - 도메인 모델 패턴은 엔티티가 단순히 데이터를 담는 역할을 넘어, 자신과 관련된 비즈니스 행위(로직)를 스스로 수행하도록 설계하는 방식임
   - 강의에서는 주문/주문 상품 엔티티에 생성/취소 로직을 넣는 방식으로 설명됨

4. 주문 생성 시 주문 상품의 재고 수량에는 어떤 변화가 발생하는 것이 일반적인가요?

   a. 주문 수량만큼 재고가 감소합니다.

   - 주문이 생성되어 주문 상품이 만들어지는 시점에 해당 상품의 재고는 주문 수량만큼 감소해야 함
   - 이는 재고 부족 예외 처리와도 연결되는 중요한 비즈니스 로직임

5. JPA에서 타입 안전하고 유지보수하기 좋은 동적 쿼리 개발을 위해 추천되는 기술은 무엇일까요?

   a. Querydsl 사용

   - 동적 쿼리는 조건에 따라 WHERE 절 등이 달라져 구현이 복잡함
   - JPQL 문자열 조립이나 Criteria API는 단점이 있어, 타입 안전성을 보장하고 가독성이 좋은 Querydsl이 추천됨

<br/><br/>

## 요약 정리

- **주문 엔티티**는 `createOrder`, `cancel`, `getTotalPrice`와 같은 비즈니스 로직을 포함하며, 생성 시 `static` 메서드를 사용하여 일관성을 보장함
- **영속성 전이**(Cascade)는 `Order` 저장 시 `OrderItem`과 `Delivery`까지 자동으로 저장되도록 하여 개발 생산성을 높임
- **주문 서비스**는 단순히 엔티티의 비즈니스 로직을 호출(`order`, `cancel`)하고 트랜잭션을 관리하는 역할에 집중함 (도메인 모델 패턴)
- **주문 테스트**는 상품 주문, 주문 취소, 재고 수량 초과 등 다양한 시나리오를 검증하여 비즈니스 로직의 안정성을 확인함

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
