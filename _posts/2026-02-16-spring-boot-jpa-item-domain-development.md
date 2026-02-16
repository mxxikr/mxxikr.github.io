---
title: '[실전! 스프링 부트와 JPA 활용1] 상품 도메인 개발'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-16 16:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, item-domain, entity-business-logic, ddd]
math: false
mermaid: true
---

# 상품 도메인 개발

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 기반으로 상품 엔티티의 비즈니스 로직, 리포지토리, 서비스 계층 개발 과정을 정리함

<br/><br/>

## 개발 개요

### 구현 기능

- **상품 등록**
    - 신규 상품을 등록함
    - 초기 재고를 설정함
- **상품 수정**
    - 상품 정보를 변경함
    - 재고 수량을 조정함
- **상품 조회**
    - 전체 상품을 조회함
    - 상품 ID로 단건 조회함
- **재고 관리**
    - 비즈니스 로직으로 재고를 증가시킴
    - 비즈니스 로직으로 재고를 감소시킴

### 개발 순서

1. **상품 엔티티 비즈니스 로직 추가**
    - 도메인 모델 패턴을 적용하여 엔티티 내에 로직을 구현함
2. **상품 리포지토리 개발**
    - 데이터 접근 계층을 구현함
3. **상품 서비스 개발**
    - 리포지토리에 단순히 위임하는 방식으로 구현함
4. **상품 기능 테스트**
    - 기능 검증을 위해 테스트 코드를 작성함

<br/><br/>

## 상품 엔티티 개발

### Item 엔티티 코드

```java
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype")
@Getter @Setter
public abstract class Item {
    
    @Id @GeneratedValue
    @Column(name = "item_id")
    private Long id;
    
    private String name;
    private int price;
    private int stockQuantity;
    
    @ManyToMany(mappedBy = "items")
    private List<Category> categories = new ArrayList<>();
    
    //==비즈니스 로직==//
    
    /**
     * 재고 증가
     */
    public void addStock(int quantity) {
        this.stockQuantity += quantity;
    }
    
    /**
     * 재고 감소
     */
    public void removeStock(int quantity) {
        int restStock = this.stockQuantity - quantity;
        if (restStock < 0) {
            throw new NotEnoughStockException("need more stock");
        }
        this.stockQuantity = restStock;
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/domain/item/Item.java)


- `addStock()` 메서드

    ```java
    public void addStock(int quantity) {
        this.stockQuantity += quantity;
    }
    ```

    - **사용 시점**
        - 상품이 입고될 때 사용함
        - 주문 취소로 인해 재고를 복구할 때 사용함
    - **동작**
        - 현재 재고 수량에 파라미터로 넘어온 수량을 더함

- `removeStock()` 메서드

    ```java
    public void removeStock(int quantity) {
        int restStock = this.stockQuantity - quantity;
        if (restStock < 0) {
            throw new NotEnoughStockException("need more stock");
        }
        this.stockQuantity = restStock;
    }
    ```

    - **사용 시점**
        - 상품을 주문할 때 사용함
        - 재고를 출고할 때 사용함
    - **동작**
        - 재고가 부족하면 `NotEnoughStockException` 예외를 발생시킴
        - 재고가 충분하면 현재 재고에서 요청 수량을 차감함

### NotEnoughStockException 예외

```java
public class NotEnoughStockException extends RuntimeException {
    
    public NotEnoughStockException(String message) {
        super(message);
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/exception/NotEnoughStockException.java)

- `RuntimeException`을 상속받아 실행 예외(Unchecked Exception)로 정의함
- 트랜잭션 롤백 대상이 됨

### 도메인 모델 패턴

- **개념**
    - 엔티티가 비즈니스 로직을 직접 가지고 있음
    - 객체 지향적인 설계를 따르며 코드의 응집도를 높임
- **장점**
    - 데이터와 로직이 같은 곳에 있어 관리가 용이함
    - 서비스 계층이 단순해짐

<br/><br/>

## 상품 리포지토리 개발

### ItemRepository 코드

```java
@Repository
@RequiredArgsConstructor
public class ItemRepository {
    
    private final EntityManager em;
    
    public void save(Item item) {
        if (item.getId() == null) {
            em.persist(item);
        } else {
            em.merge(item);
        }
    }
    
    public Item findOne(Long id) {
        return em.find(Item.class, id);
    }
    
    public List<Item> findAll() {
        return em.createQuery("select i from Item i", Item.class).getResultList();
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/ItemRepository.java)

- `save()` 메서드

    ```java
    public void save(Item item) {
        if (item.getId() == null) {
            em.persist(item);
        } else {
            em.merge(item);
        }
    }
    ```

    - **ID가 없는 경우 (신규 저장)**
        - `id`가 `null`이면 새로운 엔티티로 판단함
        - `persist()`를 호출하여 영속성 컨텍스트에 저장함
    - **ID가 있는 경우 (수정)**
        - `id`가 있으면 이미 DB에 저장된 엔티티를 수정하는 것으로 판단함
        - `merge()`를 호출하여 병합함

<br/><br/>

## 상품 서비스 개발

### ItemService 코드

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ItemService {
    
    private final ItemRepository itemRepository;
    
    @Transactional
    public void saveItem(Item item) {
        itemRepository.save(item);
    }
    
    public List<Item> findItems() {
        return itemRepository.findAll();
    }
    
    public Item findOne(Long itemId) {
        return itemRepository.findOne(itemId);
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/service/ItemService.java)

### 서비스 계층 역할

- **단순 위임**
    - 대부분의 비즈니스 로직(재고 관리 등)이 엔티티에 있기 때문에 상품 서비스는 리포지토리 메서드를 단순히 호출하는 역할만 수행함
- **트랜잭션 관리**
    - `@Transactional`을 통해 트랜잭션 경계를 설정함
    - 조회 메서드에는 `readOnly=true`를 적용하여 최적화함

<br/><br/>

## 도메인 주도 설계

### 도메인 모델 패턴과 트랜잭션 스크립트 패턴

- **도메인 모델 패턴 (권장)**

    ```java
    // 엔티티에 로직 위치
    public class Item {
        public void removeStock(int quantity) {
            if (this.stockQuantity < quantity) {
                throw new NotEnoughStockException("need more stock");
            }
            this.stockQuantity -= quantity;
        }
    }
    ```

    - 엔티티가 핵심 비즈니스 로직을 가지고 있음
    - 서비스 계층은 엔티티의 비즈니스 로직을 호출하거나 리포지토리에 위임하는 역할만 수행함
    - 객체 지향적인 스타일임

- **트랜잭션 스크립트 패턴**

    ```java
    // 서비스에 로직 위치
    public class ItemService {
        public void remoteStock(Long itemId, int quantity) {
            Item item = itemRepository.findOne(itemId);
            if (item.getStockQuantity() < quantity) {
                throw new NotEnoughStockException("need more stock");
            }
            item.setStockQuantity(item.getStockQuantity() - quantity);
        }
    }
    ```

    - 엔티티에는 비즈니스 로직이 거의 없고, 서비스 계층에서 모든 로직을 처리함
    - 절차 지향적인 스타일임

### 선택 기준

- **도메인 모델 패턴**
    - 로직이 복잡하고 객체 지향적인 설계가 필요할 때 유리함
    - 유지보수성과 재사용성이 높음
- **트랜잭션 스크립트 패턴**
    - 단순한 로직이나 SQL 위주의 개발에서 빠르고 간편할 수 있음

<br/><br/>

## 연습 문제

1. 재고 관리와 같은 비즈니스 로직은 어느 곳에 위치하는 것이 선호되나요?

   a. 엔티티

   - 객체 지향 설계 원칙과 응집도를 높이기 위해, 재고 수량 정보가 있는 엔티티 내부에 재고 증가 및 감소 로직을 두는 것이 효과적임
   - 데이터와 관련 로직을 함께 관리하는 것이 좋음

2. 재고를 감소시키기 전에 현재 수량을 확인하는 주된 이유는 무엇인가요?

   a. 재고 부족 예외 처리

   - 재고 감소 시 수량을 확인하는 것은 재고가 0 미만으로 내려가는 것을 방지하고, 부족할 경우 예외를 발생시켜 시스템의 데이터 일관성을 유지하기 위함임

3. JPA를 사용하여 ID가 아직 없는 새로운 엔티티를 저장할 때 주로 사용되는 메서드는 무엇일까요?

   a. `em.persist`

   - JPA에서 새로운 엔티티를 영속성 컨텍스트에 관리되도록 하고 데이터베이스에 저장할 때 `em.persist`를 사용함
   - 이미 ID가 있는 엔티티를 업데이트할 때는 `em.merge`가 사용될 수 있음

4. 상품 서비스(Service) 계층의 주요 역할은 무엇인가요?

   a. 리포지토리에 데이터 접근 작업 위임

   - 서비스 계층은 컨트롤러와 리포지토리 사이에서 비즈니스 로직을 수행하거나, 여러 리포지토리 작업을 조율하며, 주로 데이터베이스 접근은 리포지토리에 위임하는 역할을 함

5. 상품 서비스 클래스 레벨에 `@Transactional(readOnly = true)`를 적용하는 주된 목적은 무엇인가요?

   a. 읽기 작업 성능 최적화

   - `@Transactional(readOnly = true)`는 해당 트랜잭션이 데이터를 변경하지 않음을 알려주어 JPA 같은 ORM 프레임워크가 내부적으로 읽기 전용에 맞는 최적화를 수행하게 하여 성능을 개선함

<br/><br/>

## 요약 정리

- **상품 엔티티**는 `addStock`, `removeStock`과 같은 비즈니스 로직을 직접 가지고 있어 객체 지향적인 설계를 따름
- **도메인 모델 패턴**은 엔티티가 비즈니스 로직을 담당하고 서비스는 위임만 하는 방식으로, 로직의 재사용성과 유지보수성이 높음
- **상품 리포지토리**의 `save()` 메서드는 `id` 유무에 따라 `persist`(신규)와 `merge`(수정)를 구분하여 처리함
- **상품 서비스**는 리포지토리에 로직을 위임하는 단순한 구조를 가지며, `@Transactional`을 통해 트랜잭션을 관리함

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
