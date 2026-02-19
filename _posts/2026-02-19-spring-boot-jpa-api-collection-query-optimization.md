---
title: '[실전! 스프링 부트와 JPA 활용2] API 개발 고급 - 컬렉션 조회 최적화'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-19 18:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, api, collection, fetch-join, batch-size, dto, paging, performance]
math: false
mermaid: false
---

# API 개발 고급 - 컬렉션 조회 최적화

- 김영한님의 실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 강의를 기반으로 `Order` 기준으로 `OrderItem`과 `Item`(일대다 관계) 컬렉션을 함께 조회하는 API를 6단계 버전으로 발전시키며, 컬렉션 조회 시 발생하는 성능 문제를 단계적으로 해결하는 과정을 정리함

<br/><br/>

## 전체 구조 개요

![버전별 발전 흐름](/assets/img/jpa/2026-02-19-spring-boot-jpa-api-collection-query-optimization/version-overview.png)

- V1에서 V6까지 단계적으로 성능 문제를 해결함
    - **V1** → 엔티티 직접 노출 (프록시 직렬화, 순환참조 문제)
    - **V2** → DTO 변환 (N+1 쿼리 문제)
    - **V3** → 페치 조인 최적화 (1번 쿼리, 페이징 불가)
    - **V3.1** → `batch_fetch_size` (1+1 쿼리, 페이징 가능)
    - **V4** → DTO 직접 조회 (1+N 쿼리)
    - **V5** → IN절 최적화 (1+1 쿼리)
    - **V6** → 플랫 데이터 조회 (1쿼리, 페이징 불가)

<br/><br/>

## 도메인 연관관계

![도메인 연관관계](/assets/img/jpa/2026-02-19-spring-boot-jpa-api-collection-query-optimization/domain-relation.png)

- `toOne` 관계는 조인해도 row 수가 증가하지 않음
- `toMany`(일대다) 관계는 조인 시 row 수가 증가하여 페이징이 불가능해짐

<br/><br/>

## V1 - 엔티티 직접 노출

```java
@GetMapping("/api/v1/orders")
public List<Order> ordersV1() {
    List<Order> all = orderRepository.findAllByString(new OrderSearch());
    for (Order order : all) {
        order.getMember().getName();      // Lazy 강제 초기화
        order.getDelivery().getAddress(); // Lazy 강제 초기화
        List<OrderItem> orderItems = order.getOrderItems();
        orderItems.stream().forEach(o -> o.getItem().getName()); // Lazy 강제 초기화
    }
    return all;
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **문제점**
    - 엔티티를 직접 노출하면 API 스펙이 엔티티에 종속됨
    - 양방향 연관관계에서 무한 루프가 발생하므로 한쪽에 반드시 `@JsonIgnore`를 설정해야 함
    - 지연 로딩 프록시를 직렬화하려면 `Hibernate5Module`을 등록해야 함

<br/><br/>

## V2 - 엔티티를 DTO로 변환

```java
@GetMapping("/api/v2/orders")
public List<OrderDto> ordersV2() {
    List<Order> orders = orderRepository.findAllByString(new OrderSearch());
    return orders.stream()
            .map(o -> new OrderDto(o))
            .collect(toList());
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **DTO**

    ```java
    @Data
    static class OrderDto {
        private Long orderId;
        private String name;
        private LocalDateTime orderDate;
        private OrderStatus orderStatus;
        private Address address;
        private List<OrderItemDto> orderItems;

        public OrderDto(Order order) {
            orderId = order.getId();
            name = order.getMember().getName();          // Lazy 초기화
            orderDate = order.getOrderDate();
            orderStatus = order.getStatus();
            address = order.getDelivery().getAddress();  // Lazy 초기화
            orderItems = order.getOrderItems().stream()
                    .map(orderItem -> new OrderItemDto(orderItem))
                    .collect(toList());
        }
    }

    @Data
    static class OrderItemDto {
        private String itemName;
        private int orderPrice;
        private int count;

        public OrderItemDto(OrderItem orderItem) {
            itemName = orderItem.getItem().getName(); // Lazy 초기화
            orderPrice = orderItem.getOrderPrice();
            count = orderItem.getCount();
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **N+1 문제**
    - `1(주문) + N(회원) + N(배송) + N(주문상품) + N(상품)` 번의 쿼리가 실행됨
    - 엔티티를 직접 노출하지 않는다는 점에서 V1보다 나은 방법이지만, 성능 문제는 그대로 존재함

<br/><br/>

## V3 - 페치 조인 최적화

```java
@GetMapping("/api/v3/orders")
public List<OrderDto> ordersV3() {
    List<Order> orders = orderRepository.findAllWithItem();
    return orders.stream()
            .map(o -> new OrderDto(o))
            .collect(toList());
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **페치 조인 리포지토리**

    ```java
    public List<Order> findAllWithItem() {
        return em.createQuery(
                "select distinct o from Order o" +
                " join fetch o.member m" +
                " join fetch o.delivery d" +
                " join fetch o.orderItems oi" +
                " join fetch oi.item i", Order.class)
                .getResultList();
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/OrderRepository.java)

- **`distinct` 사용 이유**
    - 일대다 조인으로 인해 DB row가 증가하고, 같은 `Order` 엔티티가 중복 조회됨
    - JPA의 `distinct`는 SQL에 `DISTINCT`를 추가하고, 애플리케이션 레벨에서 중복 엔티티를 제거함
- **쿼리 실행 수**
    - 1번
- **단점**
    - 컬렉션 페치 조인 사용 시 **페이징이 불가능**함
    - 하이버네이트는 경고 로그를 남기고 모든 데이터를 메모리에 올려 페이징하므로 매우 위험함
    - 컬렉션 페치 조인은 1개만 사용할 수 있음

<br/><br/>

## V3.1 - 페이징 + 배치 사이즈 최적화

![배치 사이즈 최적화 흐름](/assets/img/jpa/2026-02-19-spring-boot-jpa-api-collection-query-optimization/batch-optimization.png)

- **최적화 전략**
    - `toOne` 관계는 페치 조인으로 한번에 조회함 (row 수가 증가하지 않으므로 페이징에 영향 없음)
    - `toMany` 관계는 지연 로딩을 유지하고, `default_batch_fetch_size`를 설정하여 IN 쿼리로 한번에 조회함

- **리포지토리**

    ```java
    public List<Order> findAllWithMemberDelivery(int offset, int limit) {
        return em.createQuery(
                "select o from Order o" +
                " join fetch o.member m" +
                " join fetch o.delivery d", Order.class)
                .setFirstResult(offset)
                .setMaxResults(limit)
                .getResultList();
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/OrderRepository.java)

- **컨트롤러**

    ```java
    @GetMapping("/api/v3.1/orders")
    public List<OrderDto> ordersV3_page(
            @RequestParam(value = "offset", defaultValue = "0") int offset,
            @RequestParam(value = "limit", defaultValue = "100") int limit) {

        List<Order> orders = orderRepository.findAllWithMemberDelivery(offset, limit);
        return orders.stream()
                .map(o -> new OrderDto(o))
                .collect(toList());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **배치 사이즈 설정 (application.yml)**

    ```yaml
    spring:
      jpa:
        properties:
          hibernate:
            default_batch_fetch_size: 1000
    ```

- **설정 관련 참고 사항**
    - 개별 설정이 필요한 경우 `@BatchSize` 애노테이션을 사용함
        - 컬렉션은 컬렉션 필드에, 엔티티는 클래스에 적용함
    - 권장 사이즈는 100~1000 사이
        - 1000으로 설정하면 성능이 가장 좋지만 DB 순간 부하가 증가할 수 있음

> - 스프링 부트 3.1부터 하이버네이트 6.2에서는 `where in` 대신 `array_contains`를 사용함
> - `where in`은 파라미터 수에 따라 SQL 구문 자체가 변해 캐시 효율이 떨어지지만, `array_contains`는 배열 1개를 바인딩하므로 SQL 구문이 항상 동일해 파싱 캐시를 재사용할 수 있음

<br/><br/>

## V4 - JPA에서 DTO 직접 조회 (1+N 쿼리)

```java
@GetMapping("/api/v4/orders")
public List<OrderQueryDto> ordersV4() {
    return orderQueryRepository.findOrderQueryDtos();
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **조회 전용 리포지토리**

    ```java
    // 루트 1번 + 컬렉션 N번 조회
    public List<OrderQueryDto> findOrderQueryDtos() {
        List<OrderQueryDto> result = findOrders(); // ToOne 한번에 조회
        result.forEach(o -> {
            List<OrderItemQueryDto> orderItems = findOrderItems(o.getOrderId());
            o.setOrderItems(orderItems); // 컬렉션 별도 조회
        });
        return result;
    }

    // ToOne 관계 한번에 조회
    private List<OrderQueryDto> findOrders() {
        return em.createQuery(
                "select new jpabook.jpashop.repository.order.query.OrderQueryDto" +
                "(o.id, m.name, o.orderDate, o.status, d.address)" +
                " from Order o" +
                " join o.member m" +
                " join o.delivery d", OrderQueryDto.class)
                .getResultList();
    }

    // ToMany 관계 별도 조회
    private List<OrderItemQueryDto> findOrderItems(Long orderId) {
        return em.createQuery(
                "select new jpabook.jpashop.repository.order.query.OrderItemQueryDto" +
                "(oi.order.id, i.name, oi.orderPrice, oi.count)" +
                " from OrderItem oi" +
                " join oi.item i" +
                " where oi.order.id = :orderId", OrderItemQueryDto.class)
                .setParameter("orderId", orderId)
                .getResultList();
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/order/query/OrderQueryRepository.java)

- **쿼리 실행 수**
    - 루트 1번 + 컬렉션 N번

<br/><br/>

## V5 - IN절 활용 컬렉션 조회 최적화 (1+1 쿼리)

```java
@GetMapping("/api/v5/orders")
public List<OrderQueryDto> ordersV5() {
    return orderQueryRepository.findAllByDto_optimization();
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **조회 전용 리포지토리**

    ```java
    // 루트 1번 + 컬렉션 1번 (IN 쿼리로 한번에 조회)
    public List<OrderQueryDto> findAllByDto_optimization() {
        List<OrderQueryDto> result = findOrders();

        // 모든 orderId를 추출하여 IN 쿼리로 한번에 조회
        Map<Long, List<OrderItemQueryDto>> orderItemMap =
                findOrderItemMap(toOrderIds(result));

        // MAP으로 매칭 (O(1) 성능)
        result.forEach(o -> o.setOrderItems(orderItemMap.get(o.getOrderId())));
        return result;
    }

    private List<Long> toOrderIds(List<OrderQueryDto> result) {
        return result.stream()
                .map(o -> o.getOrderId())
                .collect(Collectors.toList());
    }

    private Map<Long, List<OrderItemQueryDto>> findOrderItemMap(List<Long> orderIds) {
        List<OrderItemQueryDto> orderItems = em.createQuery(
                "select new jpabook.jpashop.repository.order.query.OrderItemQueryDto" +
                "(oi.order.id, i.name, oi.orderPrice, oi.count)" +
                " from OrderItem oi" +
                " join oi.item i" +
                " where oi.order.id in :orderIds", OrderItemQueryDto.class)
                .setParameter("orderIds", orderIds)
                .getResultList();

        return orderItems.stream()
                .collect(Collectors.groupingBy(OrderItemQueryDto::getOrderId));
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/order/query/OrderQueryRepository.java)

- **쿼리 실행 수**
    - 루트 1번 + 컬렉션 1번 (IN절로 한번에)

<br/><br/>

## V6 - 플랫 데이터 조회 (쿼리 1번, 페이징 불가)

```java
@GetMapping("/api/v6/orders")
public List<OrderQueryDto> ordersV6() {
    List<OrderFlatDto> flats = orderQueryRepository.findAllByDto_flat();

    return flats.stream()
            .collect(groupingBy(
                o -> new OrderQueryDto(o.getOrderId(), o.getName(),
                        o.getOrderDate(), o.getOrderStatus(), o.getAddress()),
                mapping(
                    o -> new OrderItemQueryDto(o.getOrderId(), o.getItemName(),
                            o.getOrderPrice(), o.getCount()),
                    toList())
            ))
            .entrySet().stream()
            .map(e -> new OrderQueryDto(
                    e.getKey().getOrderId(), e.getKey().getName(),
                    e.getKey().getOrderDate(), e.getKey().getOrderStatus(),
                    e.getKey().getAddress(), e.getValue()))
            .collect(toList());
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderApiController.java)

- **리포지토리**

    ```java
    public List<OrderFlatDto> findAllByDto_flat() {
        return em.createQuery(
                "select new jpabook.jpashop.repository.order.query.OrderFlatDto" +
                "(o.id, m.name, o.orderDate, o.status, d.address, i.name, oi.orderPrice, oi.count)" +
                " from Order o" +
                " join o.member m" +
                " join o.delivery d" +
                " join o.orderItems oi" +
                " join oi.item i", OrderFlatDto.class)
                .getResultList();
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/order/query/OrderQueryRepository.java)

- **쿼리 실행 수**
    - 1번
- **단점**
    - 조인으로 인해 중복 데이터가 많고 데이터 전송량이 증가함
    - 애플리케이션에서 데이터를 다시 가공해야 하는 부담이 있음
    - 주문 단위의 페이징이 불가능함

<br/><br/>

## 버전별 비교

![버전별 비교](/assets/img/jpa/2026-02-19-spring-boot-jpa-api-collection-query-optimization/version-comparison.png)

| 버전 | 방식 | 쿼리 수 | 페이징 | 코드 복잡도 |
|------|------|---------|--------|------------|
| V1 | 엔티티 직접 노출 | 1+N+... | 가능 | 낮음 |
| V2 | DTO 변환 | 1+N+N+N | 가능 | 낮음 |
| V3 | 페치 조인 | 1 | 불가 | 낮음 |
| V3.1 | `batch_fetch_size` | 1+1 | 가능 | 낮음 |
| V4 | DTO 직접 조회 | 1+N | 가능 | 중간 |
| V5 | IN절 최적화 | 1+1 | 가능 | 높음 |
| V6 | 플랫 데이터 | 1 | 불가 | 높음 |

<br/><br/>

## 권장 선택 순서

![권장 선택 순서](/assets/img/jpa/2026-02-19-spring-boot-jpa-api-collection-query-optimization/query-strategy.png)

- 엔티티 조회 방식은 코드 변경 없이 옵션 설정만으로 성능 최적화가 가능함
- DTO 직접 조회 방식은 성능 최적화 시 많은 코드 변경이 필요함
- V6은 쿼리가 1번이지만 중복 데이터 전송과 페이징 불가 문제로 실무에서 선택하기 어려움

<br/><br/>

## 연습 문제

1. API에서 엔티티 직접 노출(V1) 방식의 가장 큰 문제는 무엇일까요?

   a. 엔티티 변경이 API 스펙 변경으로 이어짐

   - 엔티티를 직접 노출하면 엔티티의 필드명을 바꾸는 것만으로도 API 응답 구조가 바뀌어, 이를 사용하는 모든 클라이언트 코드가 깨지게 됨
   - API 스펙이 내부 구현체인 엔티티에 종속되는 이 심각한 문제 때문에 V2에서는 DTO 변환 방식이 필수적으로 도입됨

2. JPA 페치 조인을 사용하여 일대다(One-to-Many) 관계의 컬렉션을 함께 조회할 때 발생하는 주요 한계점은 무엇일까요?

   a. 페이징(Paging) 처리가 어렵거나 불가능함

   - 일대다 관계에서 페치 조인을 사용하면 데이터베이스 레벨에서 데이터 뻥튀기(Inflation)가 발생하여 JPA가 정확한 페이징 위치를 계산할 수 없음
   - 하이버네이트가 모든 데이터를 메모리로 읽어와 페이징을 시도하지만, 대용량 데이터에서 OutOfMemory 오류를 유발할 수 있어 실무에서는 절대 피해야 함

3. 컬렉션 지연 로딩 + 페이징 적용 시 N+1 문제를 개선하기 위한 효과적인 JPA/Hibernate 설정 옵션은 무엇일까요?

   a. `@BatchSize` 또는 `default_batch_fetch_size`

   - `default_batch_fetch_size` 옵션은 지연 로딩된 컬렉션을 사용할 때, 설정된 사이즈만큼 엔티티 ID를 모아 IN절로 한 번에 조회함
   - 쿼리 횟수를 획기적으로 줄여 N+1 문제를 효과적으로 완화하며, 기존 코드를 거의 수정하지 않고도 적용할 수 있는 가장 실무적인 최적화 도구임

4. JPA에서 DTO를 직접 조회하는 방법(V4 vs V5) 중, V5 방식이 V4 방식에 비해 컬렉션 N+1을 해결한 주된 원리는 무엇일까요?

   a. Order ID 목록으로 컬렉션을 IN절로 한 번에 조회함

   - V4는 각 항목의 컬렉션을 조회할 때마다 매번 쿼리를 날려 N+1 문제가 발생하지만, V5는 주문 ID들을 미리 수집하여 IN절 쿼리 한 번으로 연관된 모든 컬렉션을 가져옴
   - 쿼리 횟수를 1+1로 줄여 데이터 로딩 성능을 비약적으로 향상시킴

5. 플랫 DTO 조회(V6) 방식의 주요 실무 단점은 무엇일까요?

   a. 주문 단위의 페이징 처리가 어려움

   - V6은 조인을 통해 중복된 데이터를 한 번에 가져오는 방식이라 결과 집합 기준의 페이징은 가능하지만, 개발자가 의도한 원본 엔티티(주문) 단위의 페이징을 구현하기는 매우 까다로움
   - 데이터 전송량 증가와 더불어 애플리케이션 단에서 데이터를 다시 가공해야 하는 부담이 있어 대용량 처리 시 성능 한계가 올 수 있음

<br/><br/>

## 요약 정리

- V1(엔티티 직접 노출)은 프록시 직렬화 오류와 순환참조 문제가 발생하며, 엔티티 변경이 API 스펙 변경으로 직결되어 비권장됨
- V2(DTO 변환)는 엔티티를 직접 노출하지 않지만, 지연 로딩으로 인한 N+1 문제가 그대로 존재하여 `1 + N + N + N + N`번의 쿼리가 실행됨
- V3(페치 조인)은 `join fetch`로 연관 엔티티를 1번의 쿼리로 조회하지만, 일대다 컬렉션 조인 시 데이터 뻥튀기로 인해 페이징이 불가능함
- V3.1(`batch_fetch_size`)은 `toOne` 관계만 페치 조인하고 `toMany` 관계는 `default_batch_fetch_size`로 IN 쿼리 최적화하여 페이징과 성능을 모두 확보하는 권장 방식임
- V4(DTO 직접 조회)는 JPQL의 `new` 명령으로 필요한 필드만 조회하지만, 컬렉션 조회 시 루트 1번 + N번의 쿼리가 발생함
- V5(IN절 최적화)는 주문 ID를 미리 수집하여 IN절로 컬렉션을 한 번에 조회하여 쿼리 횟수를 1+1로 줄임
- V6(플랫 데이터)은 쿼리 1번이지만 중복 데이터 전송과 페이징 불가 문제로 실무에서 선택하기 어려움
- 권장 선택 순서는 V2(기본) → V3.1(`batch_fetch_size`) → V5(IN절 최적화) → 네이티브 SQL 순으로, 대부분의 성능 이슈는 V3.1에서 해결됨

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화](https://www.inflearn.com/course/스프링부트-JPA-API개발-성능최적화)
