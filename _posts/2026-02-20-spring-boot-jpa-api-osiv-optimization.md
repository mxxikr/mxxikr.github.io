---
title: '[실전! 스프링 부트와 JPA 활용2] API 개발 고급 - 실무 필수 최적화'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-20 13:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, api, osiv, open-session-in-view, connection-pool, cqrs, performance]
math: false
mermaid: false
---

# API 개발 고급 - OSIV와 성능 최적화

- 김영한님의 실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 강의를 기반으로 OSIV(Open Session In View) 전략의 동작 원리와 ON/OFF에 따른 영속성 컨텍스트 및 DB 커넥션 관리 방식의 차이를 정리하고, OSIV OFF 시 커맨드와 쿼리 분리 패턴을 통한 최적화 전략을 정리함

<br/><br/>

## OSIV란

- OSIV(Open Session In View)는 영속성 컨텍스트와 데이터베이스 커넥션을 얼마나 오래 유지할지를 결정하는 전략임
    - 하이버네이트에서는 Open Session In View
    - JPA에서는 Open EntityManager In View
- 스프링 부트의 기본값은 `true`(ON)이며, 애플리케이션 시작 시 `warn` 로그를 출력함

<br/><br/>

## OSIV ON (기본값)

![OSIV ON 시퀀스](/assets/img/jpa/2026-02-20-spring-boot-jpa-api-osiv-optimization/osiv-on-sequence.png)

- **설정**

    ```yaml
    spring:
      jpa:
        open-in-view: true  # 기본값
    ```

- **동작 방식**
    - 요청이 들어오면 Filter/Interceptor 시점에 영속성 컨텍스트를 생성하고 DB 커넥션을 획득함
    - 트랜잭션이 종료되어도 영속성 컨텍스트와 커넥션은 응답이 완료될 때까지 유지됨
    - 컨트롤러와 View Template에서도 지연 로딩이 자유롭게 가능함

- **OSIV ON 상태의 지연 로딩 예시**

    ```java
    @GetMapping("/api/v2/simple-orders")
    public List<SimpleOrderDto> ordersV2() {
        List<Order> orders = orderRepository.findAllByString(new OrderSearch());

        // 트랜잭션 밖인 컨트롤러에서도 지연 로딩 가능 (OSIV ON이기 때문)
        return orders.stream()
                .map(o -> new SimpleOrderDto(o))
                .collect(toList());
    }

    @Data
    static class SimpleOrderDto {
        private Long orderId;
        private String name;
        private Address address;

        public SimpleOrderDto(Order order) {
            orderId = order.getId();
            name = order.getMember().getName();       // 지연 로딩 - 컨트롤러에서도 동작
            address = order.getDelivery().getAddress(); // 지연 로딩 - 컨트롤러에서도 동작
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/OrderSimpleApiController.java)

- **장점**
    - 컨트롤러와 View Template에서도 지연 로딩이 자유롭게 가능함
- **단점**
    - 요청이 시작된 시점부터 응답이 끝날 때까지 DB 커넥션을 점유함
    - 실시간 트래픽이 많은 서비스에서는 커넥션 풀이 고갈되어 장애로 이어질 수 있음
    - 컨트롤러에서 외부 API를 호출하면 외부 API 응답 대기 시간 동안 DB 커넥션을 반환하지 못함

<br/><br/>

## OSIV OFF

![OSIV OFF 시퀀스](/assets/img/jpa/2026-02-20-spring-boot-jpa-api-osiv-optimization/osiv-off-sequence.png)

- **설정**

    ```yaml
    spring:
      jpa:
        open-in-view: false
    ```

- **동작 방식**
    - 트랜잭션이 시작될 때 영속성 컨텍스트를 생성하고 DB 커넥션을 획득함
    - 트랜잭션이 종료되면 영속성 컨텍스트를 닫고 DB 커넥션을 즉시 반환함
    - 컨트롤러에서는 준영속 상태이므로 지연 로딩이 불가능함

- **OSIV OFF 상태에서 지연 로딩 오류**

    ```java
    // OSIV OFF 상태에서 아래 코드는 LazyInitializationException 발생
    @GetMapping("/api/v2/simple-orders")
    public List<SimpleOrderDto> ordersV2() {
        List<Order> orders = orderRepository.findAllByString(new OrderSearch());

        return orders.stream()
                .map(o -> new SimpleOrderDto(o))
                .collect(toList());
    }

    static class SimpleOrderDto {
        public SimpleOrderDto(Order order) {
            name = order.getMember().getName();       // LazyInitializationException 발생
            address = order.getDelivery().getAddress(); // LazyInitializationException 발생
        }
    }
    ```

- **OSIV OFF 상태에서 올바른 해결 방법**
    - 트랜잭션이 끝나기 전에 지연 로딩을 모두 처리해야 함
    - 서비스 계층에서 DTO로 변환하거나, 페치 조인을 사용함

    ```java
    // 서비스에서 DTO로 변환 후 반환
    @Service
    @Transactional(readOnly = true)
    @RequiredArgsConstructor
    public class OrderQueryService {

        private final OrderRepository orderRepository;

        // 트랜잭션 안에서 지연 로딩까지 처리 완료
        public List<SimpleOrderDto> findOrders() {
            List<Order> orders = orderRepository.findAllByString(new OrderSearch());
            return orders.stream()
                    .map(SimpleOrderDto::new) // 트랜잭션 안이므로 지연 로딩 가능
                    .collect(toList());
        }
    }

    // 컨트롤러는 이미 변환된 DTO만 받음
    @GetMapping("/api/v2/simple-orders")
    public List<SimpleOrderDto> ordersV2() {
        return orderQueryService.findOrders(); // 준영속 상태지만 DTO이므로 문제 없음
    }
    ```

    ```java
    // 페치 조인으로 한번에 조회 (지연 로딩 자체를 없앰)
    public List<Order> findAllWithMemberDelivery() {
        return em.createQuery(
                "select o from Order o" +
                " join fetch o.member m" +
                " join fetch o.delivery d", Order.class)
                .getResultList();
        // member, delivery가 이미 로딩된 상태이므로 트랜잭션 밖에서도 안전
    }
    ```

- **장점**
    - 트랜잭션 종료 시 커넥션을 즉시 반환하므로 커넥션 리소스를 효율적으로 사용함
- **단점**
    - 모든 지연 로딩을 트랜잭션 안에서 처리해야 하므로 코드 구조에 제약이 생김

<br/><br/>

## OSIV ON과 OFF 비교

![OSIV ON vs OFF 비교](/assets/img/jpa/2026-02-20-spring-boot-jpa-api-osiv-optimization/osiv-comparison.png)

| 항목 | OSIV ON | OSIV OFF |
|------|---------|----------|
| 영속성 컨텍스트 범위 | 요청 ~ 응답 끝 | 트랜잭션 범위 내 |
| DB 커넥션 유지 | 응답 완료까지 | 트랜잭션 종료 즉시 반환 |
| 지연 로딩 위치 | Controller, View 가능 | 트랜잭션 내부에서만 가능 |
| 커넥션 리소스 | 비효율적 | 효율적 |
| 장애 위험 | 고트래픽 시 커넥션 고갈 위험 | 낮음 |
| 코드 편의성 | 높음 | 낮음 (지연 로딩 위치 제한) |

<br/><br/>

## OSIV OFF 시 - 커맨드와 쿼리 분리

![커맨드와 쿼리 분리 구조](/assets/img/jpa/2026-02-20-spring-boot-jpa-api-osiv-optimization/cqrs-structure.png)

- OSIV를 끈 상태에서 복잡성을 관리하는 방법으로 Command와 Query를 서비스 계층에서 분리함

- **분리 기준**
    - `OrderService`는 핵심 비즈니스 로직(등록, 수정, 삭제)을 담당함
    - `OrderQueryService`는 화면이나 API 스펙에 맞춘 조회 전용 서비스임
    - 두 서비스 모두 트랜잭션을 유지하므로 지연 로딩을 사용할 수 있음

- **비즈니스 로직 서비스**

    ```java
    @Service
    @Transactional
    @RequiredArgsConstructor
    public class OrderService {

        private final OrderRepository orderRepository;

        public Long createOrder(Long memberId, Long itemId, int count) {
            // 주문 생성 로직
        }

        public void cancelOrder(Long orderId) {
            Order order = orderRepository.findOne(orderId);
            order.cancel(); // 변경 감지로 자동 UPDATE
        }
    }
    ```

- **조회 전용 서비스**

    ```java
    @Service
    @Transactional(readOnly = true) // 읽기 전용으로 성능 최적화
    @RequiredArgsConstructor
    public class OrderQueryService {

        private final OrderRepository orderRepository;

        public List<OrderDto> findOrders() {
            List<Order> orders = orderRepository.findAllWithMemberDelivery();
            // 트랜잭션 안에서 지연 로딩 + DTO 변환 완료
            return orders.stream()
                    .map(OrderDto::new)
                    .collect(toList());
        }

        public List<SimpleOrderDto> findSimpleOrders() {
            List<Order> orders = orderRepository.findAllWithMemberDelivery();
            return orders.stream()
                    .map(SimpleOrderDto::new)
                    .collect(toList());
        }
    }
    ```

- **컨트롤러**

    ```java
    @RestController
    @RequiredArgsConstructor
    public class OrderApiController {

        private final OrderService orderService;           // 명령 (CUD)
        private final OrderQueryService orderQueryService; // 조회 (R)

        @GetMapping("/api/v2/orders")
        public List<OrderDto> ordersV2() {
            return orderQueryService.findOrders(); // 이미 DTO로 변환됨
        }

        @PostMapping("/api/v1/orders")
        public Long createOrder(@RequestBody CreateOrderRequest request) {
            return orderService.createOrder(request.getMemberId(),
                    request.getItemId(), request.getCount());
        }
    }
    ```

- **분리하는 이유**
    - 복잡한 화면용 쿼리는 성능 최적화가 중요하지만 비즈니스에 큰 영향을 주지 않음
    - 관심사를 분리하면 유지보수성이 크게 향상됨

<br/><br/>

## OSIV 선택 기준

![OSIV 선택 기준](/assets/img/jpa/2026-02-20-spring-boot-jpa-api-osiv-optimization/osiv-selection.png)

- 실시간 트래픽이 중요한 고객 서비스 API는 OSIV를 끄는 것이 권장됨
- 어드민(ADMIN)처럼 커넥션을 많이 사용하지 않는 내부 도구에서는 OSIV를 켜서 개발 편의성을 높일 수 있음
- OSIV를 끄는 경우 커맨드와 쿼리 서비스를 분리하여 복잡도를 관리하는 것이 바람직함

<br/><br/>

## 요약 정리

- OSIV(Open Session In View)는 영속성 컨텍스트와 DB 커넥션의 생존 범위를 결정하는 전략이며, 스프링 부트 기본값은 ON임
- OSIV ON은 요청부터 응답 완료까지 영속성 컨텍스트와 커넥션을 유지하여 컨트롤러에서도 지연 로딩이 가능하지만, 고트래픽 시 커넥션 풀 고갈 위험이 있음
- OSIV OFF는 트랜잭션 종료 시 커넥션을 즉시 반환하여 리소스를 효율적으로 사용하지만, 모든 지연 로딩을 트랜잭션 내부에서 처리해야 하는 제약이 있음
- OSIV OFF 시에는 `OrderService`(핵심 비즈니스 로직)와 `OrderQueryService`(조회 전용)로 커맨드와 쿼리를 분리하여 복잡도를 관리함
- 실시간 트래픽이 중요한 고객 서비스 API는 OSIV OFF, 내부 관리 도구는 OSIV ON으로 상황에 맞게 선택하는 것이 권장됨

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화](https://www.inflearn.com/course/스프링부트-JPA-API개발-성능최적화)
