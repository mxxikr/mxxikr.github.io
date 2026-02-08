---
title: '[스프링 DB 2편 - 데이터 접근 핵심 원리] 트랜잭션 원리 및 설정'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-08 16:30:00 +0900
category: [Framework, Spring]
tags: [spring, java, transaction, jdbc, jpa, aop]
math: false
mermaid: false
---

# 트랜잭션 원리 및 설정

- 김영한님의 스프링 DB 2편 강의를 통해 스프링 트랜잭션의 개념, 추상화, AOP 적용 원리, 그리고 다양한 옵션과 예외 처리 전략을 정리함

<br/><br/>

## 스프링 트랜잭션 소개

### 트랜잭션 추상화의 필요성

- **JDBC 트랜잭션 (기술 종속적)**
    - JDBC 기술에 종속된 코드가 비즈니스 로직에 포함됨
    - 기술 변경 시 모든 트랜잭션 관련 코드를 수정해야 함

    ```java
    public void accountTransfer(String fromId, String toId, int money) throws SQLException {
        Connection con = dataSource.getConnection();
        try {
            con.setAutoCommit(false); // 트랜잭션 시작
            // 비즈니스 로직
            bizLogic(con, fromId, toId, money);
            con.commit(); // 성공 시 커밋
        } catch (Exception e) {
            con.rollback(); // 실패 시 롤백
            throw new IllegalStateException(e);
        } finally {
            release(con);
        }
    }
    ```

- **JPA 트랜잭션 (다른 방식)**
    - JPA 기술에 종속된 코드가 필요함
    - JDBC에서 JPA로 변경 시 트랜잭션 코드를 전면 수정해야 함

    ```java
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("jpabook");
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin(); // 트랜잭션 시작
            logic(em); // 비즈니스 로직
            tx.commit(); // 트랜잭션 커밋
        } catch (Exception e) {
            tx.rollback(); // 트랜잭션 롤백
        } finally {
            em.close();
        }
        emf.close();
    }
    ```

<br/><br/>

## 트랜잭션 추상화

### PlatformTransactionManager

- 스프링은 트랜잭션 기술의 공통점을 묶어 `PlatformTransactionManager`라는 인터페이스를 제공함
- 이를 통해 기술이 변경되어도 서비스 코드를 변경하지 않아도 됨

![PlatformTransactionManager Hierarchy](/assets/img/springdb/spring-tx-hierarchy.png)

- **인터페이스 정의**
    - `getTransaction()`
        - 트랜잭션 시작 (또는 기존 트랜잭션 참여)
    - `commit()`
        - 트랜잭션 커밋
    - `rollback()`
        - 트랜잭션 롤백

    ```java
    public interface PlatformTransactionManager extends TransactionManager {
        TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
        void commit(TransactionStatus status) throws TransactionException;
        void rollback(TransactionStatus status) throws TransactionException;
    }
    ```

### 스프링 부트 자동 설정

- 스프링 부트는 데이터 접근 기술에 따라 적절한 트랜잭션 매니저를 자동으로 등록해 줌
- **자동 선택 규칙**
    - JdbcTemplate, MyBatis 사용 시 `DataSourceTransactionManager` 등록
    - JPA 사용 시 `JpaTransactionManager` 등록

<br/><br/>

## 트랜잭션 AOP

### 선언적 방식과 프로그래밍 방식

- **프로그래밍 방식 (비추천)**
    - 트랜잭션 매니저를 직접 주입받아 코드 내에서 시작, 커밋, 롤백을 호출함
    - 트랜잭션 코드와 비즈니스 로직이 혼재되어 유지보수가 어려움

- **선언적 방식 (권장)**
    - `@Transactional` 애노테이션을 사용하여 트랜잭션을 선언적으로 관리함
    - 비즈니스 로직에만 집중할 수 있고 코드가 간결해짐

### 프록시 방식 AOP

- **프록시 도입 전**
    - 서비스 코드에 트랜잭션 로직이 포함되어 있음
    - 비즈니스 로직과 기술 로직이 섞여 있음

- **프록시 도입 후**
    - 프록시가 트랜잭션 로직을 처리하고 실제 서비스는 순수 비즈니스 로직만 수행함
    - 클라이언트는 프록시를 호출하게 됨

![Transaction Proxy Sequence](/assets/img/springdb/spring-tx-proxy.png)

<br/><br/>

## 트랜잭션 적용 확인

### 프록시 확인

- `@Transactional`이 적용된 빈은 실제로 프록시 객체가 등록됨
- `AopUtils.isAopProxy()` 등을 통해 확인할 수 있음

    ```java
    @Slf4j
    @SpringBootTest
    public class TxBasicTest {

        @Autowired BasicService basicService;

        @Test
        void proxyCheck() {
            // AOP 프록시 적용 여부 확인
            log.info("aop class={}", basicService.getClass());
            assertThat(AopUtils.isAopProxy(basicService)).isTrue();
        }

        @Test
        void txTest() {
            basicService.tx();
            basicService.nonTx();
        }

        @TestConfiguration
        static class TxApplyBasicConfig {
            @Bean
            BasicService basicService() {
                return new BasicService();
            }
        }

        @Slf4j
        static class BasicService {

            @Transactional
            public void tx() {
                log.info("call tx");
                // 현재 쓰레드의 트랜잭션 활성화 여부 확인
                boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
                log.info("tx active={}", txActive);
            }

            public void nonTx() {
                log.info("call nonTx");
                // 트랜잭션이 없는 메서드 호출 시 확인
                boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
                log.info("tx active={}", txActive);
            }
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/apply/TxApplyBasicTest.java)

### 트랜잭션 활성화 확인

- `TransactionSynchronizationManager.isActualTransactionActive()`를 사용하여 현재 쓰레드에 트랜잭션이 적용되어 있는지 확인할 수 있음

    ```java
    @Transactional
    public void tx() {
        boolean txActive = TransactionSynchronizationManager.isActualTransactionActive();
        log.info("tx active={}", txActive); // true
    }
    ```

<br/><br/>

## 트랜잭션 적용 위치

### 우선순위 규칙

- 스프링의 `@Transactional`은 더 구체적인 설정이 우선순위를 가짐
    1.  클래스의 메서드 (최우선)
    2.  클래스의 타입
    3.  인터페이스의 메서드
    4.  인터페이스의 타입 (최하위)

    ```java
    @Slf4j
    @Transactional(readOnly = true)  // 클래스 레벨 (읽기 전용)
    static class LevelService {

        @Transactional(readOnly = false)  // 메서드 레벨 (쓰기 가능, 우선순위 높음)
        public void write() {
            log.info("call write");
            printTxInfo();
        }

        public void read() {
            log.info("call read");
            printTxInfo();  // 클래스 레벨 설정 적용
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/apply/TxLevelTest.java)

- **인터페이스 사용 주의사항**
    - 인터페이스에 `@Transactional`을 붙이면 AOP 방식에 따라 적용되지 않을 수 있음
    - 가급적 구체 클래스(구현체)에 적용하는 것을 권장함

<br/><br/>

## 프록시 내부 호출 문제

### 문제 상황

- 같은 서비스 클래스 내부의 메서드를 호출할 때 발생함
- `external()` 메서드가 `this.internal()`을 호출하면 프록시를 거치지 않고 실제 대상 객체(Target)의 메서드를 직접 호출하게 됨
- 결과적으로 `internal()`에 `@Transactional`이 있어도 트랜잭션이 적용되지 않음

    ```java
    @Slf4j
    static class CallService {

        public void external() {
            log.info("call external");
            printTxInfo();
            internal();  // 내부 호출 (this.internal())
        }

        @Transactional
        public void internal() {
            log.info("call internal");
            printTxInfo();
        }

        private void printTxInfo() {
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/apply/InternalCallV1Test.java)

### 클래스 분리

- 내부 호출을 외부 호출로 변경하기 위해 기능을 별도의 클래스로 분리함
- 분리된 클래스를 주입받아 호출하면 프록시를 통해 트랜잭션이 정상적으로 적용됨

    ```java
    @Slf4j
    @RequiredArgsConstructor
    static class CallService {

        private final InternalService internalService;  // 별도 클래스로 분리

        public void external() {
            log.info("call external");
            printTxInfo();
            internalService.internal();  // 외부 호출 (프록시 적용됨)
        }
    }

    @Slf4j
    static class InternalService {

        @Transactional
        public void internal() {
            log.info("call internal");
            printTxInfo();
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/apply/InternalCallV2Test.java)

### public 메서드만 트랜잭션 적용

- 스프링 트랜잭션 AOP는 기본적으로 `public` 메서드에만 적용됨
- `protected`, `private`, `package-visible` 메서드에는 적용되지 않음 (스프링 부트 3.0부터는 `protected` 등에도 적용 가능)
- 의도하지 않은 내부 구현 메서드까지 트랜잭션이 걸리는 것을 방지하기 위함

<br/><br/>

## 초기화 시점 주의사항

- [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/apply/InitTxTest.java)

### @PostConstruct와 트랜잭션

- `@PostConstruct`는 빈 객체가 생성되고 의존관계 주입이 완료된 직후에 호출됨
- 이 시점에는 아직 트랜잭션 AOP 프록시가 완벽하게 적용되지 않았을 수 있음
- 따라서 `@PostConstruct` 메서드에 `@Transactional`을 붙여도 트랜잭션이 적용되지 않음


    ```java
    @Slf4j
    static class Hello {

        @PostConstruct
        @Transactional
        public void initV1() {
            boolean isActive = TransactionSynchronizationManager.isActualTransactionActive();
            log.info("Hello init @PostConstruct tx active={}", isActive); // false (미적용)
        }
    }
    ```

### ApplicationReadyEvent

- `ApplicationReadyEvent` 이벤트를 리스닝하여 초기화 코드를 실행함
- 이 이벤트는 컨테이너와 AOP를 포함한 모든 빈이 완전히 준비된 후에 발생하므로 트랜잭션이 정상적으로 적용됨

    ```java
    @EventListener(value = ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        boolean isActive = TransactionSynchronizationManager.isActualTransactionActive();
        log.info("Hello init ApplicationReadyEvent tx active={}", isActive); // true (적용됨)
    }
    ```

<br/><br/>

## 트랜잭션 옵션

### 주요 속성

- **`value` / `transactionManager`**
    - 사용할 트랜잭션 매니저를 지정함 (다중 DB 사용 시 유용)
- **`rollbackFor`**
    - 기본적으로 런타임 예외와 에러만 롤백됨
    - 체크 예외도 롤백하고 싶은 경우 지정함 (예: `rollbackFor = Exception.class`)
- **`noRollbackFor`**
    - 런타임 예외가 발생해도 롤백하지 않고 싶을 때 지정함
- **`propagation` (전파)**
    - `REQUIRED` (기본값)
        - 기존 트랜잭션에 참여, 없으면 생성
    - `REQUIRES_NEW`
        - 항상 새로운 트랜잭션 생성
    - 그 외 `SUPPORTS`, `MANDATORY`, `NOT_SUPPORTED`, `NEVER`, `NESTED` 등이 있음
- **`isolation` (격리 수준)**
    - `DEFAULT`, `READ_UNCOMMITTED`, `READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`
    - 대부분 DB의 기본 설정을 따르는 `DEFAULT`를 사용함
- **`timeout`**
    - 트랜잭션 수행 시간을 제한함
- **`readOnly`**
    - 읽기 전용 트랜잭션으로 설정하여 성능 최적화를 함

### readOnly 옵션의 이점

- **프레임워크 레벨 최적화**
    - JPA 사용 시 스냅샷 생성이나 변경 감지를 하지 않아 메모리와 CPU를 절약함
- **DB 레벨 최적화**
    - 읽기 전용 트랜잭션에 대한 DB 내부의 최적화를 활용할 수 있음
    - 읽기 전용 복제본(Slave) DB로 부하를 분산할 수 있음 (드라이버 지원 시)

<br/><br/>

## 예외와 롤백

### 기본 정책

- **언체크 예외 (RuntimeException, Error)**
    - 복구 불가능한 시스템 오류로 간주하여 **롤백**함
- **체크 예외 (Exception)**
    - 비즈니스 의미가 있는 예외로 간주하여 **커밋**함

### 비즈니스 예외 처리

- 비즈니스 로직상 예외 상황이지만 데이터는 저장해야 하는 경우 체크 예외를 사용함
- ex) "잔고 부족" 상황에서 주문 상태를 "대기"로 저장하고 예외를 던져야 할 때

- **비즈니스 예외 클래스**

    ```java
    public class NotEnoughMoneyException extends Exception {
        public NotEnoughMoneyException(String message) {
            super(message);
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/order/NotEnoughMoneyException.java)

- **서비스 로직**

    ```java
    @Slf4j
    @Service
    @RequiredArgsConstructor
    public class OrderService {

        private final OrderRepository orderRepository;

        @Transactional
        public void order(Order order) throws NotEnoughMoneyException {
            log.info("order 호출");
            orderRepository.save(order);

            log.info("결제 프로세스 진입");
            if (order.getUsername().equals("예외")) {
                log.info("시스템 예외 발생");
                throw new RuntimeException("시스템 예외"); // 런타임 예외 -> 롤백

            } else if (order.getUsername().equals("잔고부족")) {
                log.info("잔고 부족 비즈니스 예외 발생");
                order.setPayStatus("대기");
                throw new NotEnoughMoneyException("잔고가 부족합니다"); // 체크 예외 -> 커밋

            } else {
                log.info("정상 승인");
                order.setPayStatus("완료");
            }
            log.info("결제 프로세스 완료");
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/order/OrderService.java)


<br/><br/>

## 연습 문제

1. 스프링이 다양한 데이터 접근 기술(JDBC, JPA 등)의 트랜잭션을 일관되게 관리하기 위해 제공하는 기능은 무엇일까요?
    
    a. 트랜잭션 추상화
    
    - 스프링 트랜잭션 추상화는 저수준 기술 차이를 감추고 `PlatformTransactionManager` 인터페이스를 통해 통일된 프로그래밍 모델을 제공함

2. `@Transactional` 애노테이션을 사용하여 트랜잭션을 적용하는 방식은 무엇에 해당할까요?

    a. 선언적 트랜잭션 관리
    
    - `@Transactional` 애노테이션은 코드를 직접 수정하지 않고 메타데이터를 통해 트랜잭션 적용 방식을 선언하는 선언적 방식임

3. `@Transactional` 애노테이션이 적용된 메서드 호출 시, 실제 트랜잭션 로직을 처리하기 위해 스프링이 사용하는 메커니즘은 무엇일까요?

    a. AOP 프록시
    
    - `@Transactional`이 붙으면 스프링은 해당 객체의 AOP 프록시를 생성하고, 프록시가 트랜잭션 시작/커밋/롤백 로직을 가로채어 처리함

4. 스프링 AOP를 통한 트랜잭션 적용 여부를 코드로 확인할 때 사용할 수 있는 방법 중 하나는 무엇일까요?

    a. `TransactionSynchronizationManager`를 통해 활성 트랜잭션 확인
    
    - `TransactionSynchronizationManager`는 현재 스레드에 바인딩된 트랜잭션 정보를 관리하며, `isActualTransactionActive()` 등으로 활성 여부를 확인함

5. `@Transactional` 애노테이션을 클래스와 그 내부의 특정 메서드에 모두 적용했을 때, 어떤 설정이 우선순위를 가질까요?

    a. 메서드 레벨 설정
    
    - 스프링 트랜잭션 애노테이션은 더 구체적인 설정이 우선함. 따라서 메서드 레벨에 적용된 설정이 클래스 레벨 설정보다 우선함

6. 동일 서비스 클래스 내의 `@Transactional`이 붙은 메서드를 'this'를 사용하여 내부 호출할 경우, 트랜잭션이 적용되지 않는 주된 이유는 무엇일까요?

    a. 'this'는 AOP 프록시를 거치지 않고 실제 대상 객체를 직접 참조하기 때문
    
    - 스프링 트랜잭션은 AOP 프록시를 통해 적용되는데, 'this' 호출은 프록시를 우회하고 실제 객체를 바로 호출하여 트랜잭션 로직이 실행되지 않음

7. 기본 설정에서 스프링 트랜잭션 AOP 프록시는 어떤 접근 제어자를 가진 메서드에만 트랜잭션을 적용할까요?

    a. public
    
    - 스프링 트랜잭션 AOP의 기본 설정은 public 메서드에만 트랜잭션을 적용하도록 되어 있음. 이는 외부에서 노출되는 주요 비즈니스 로직에 적용하기 위함임

8. `@Transactional` 애노테이션이 붙은 메서드를 `@PostConstruct` 라이프사이클 메서드에서 호출했을 때 트랜잭션이 적용되지 않을 수 있는 이유는 무엇일까요?

    a. AOP 프록시와 트랜잭션이 완전히 준비되기 전에 `@PostConstruct`가 실행될 수 있기 때문
    
    - `@PostConstruct` 시점에는 스프링 빈 초기화 과정 중이며 AOP 프록시 생성 및 트랜잭션 관련 설정이 완료되지 않았을 수 있음

9. 스프링의 기본 트랜잭션 정책에 따라, `@Transactional` 메서드 실행 중 `RuntimeException`이 발생하면 트랜잭션은 어떻게 처리될까요?

    a. 트랜잭션이 롤백된다.
    
    - 스프링은 기본적으로 `RuntimeException`(Unchecked Exception)을 복구 불가능한 시스템 오류로 간주하여 트랜잭션을 롤백함

10. `@Transactional` 애노테이션의 'readOnly = true' 옵션 사용 시 얻을 수 있는 잠재적 이점은 무엇일까요?

    a. 읽기 전용 트랜잭션으로 설정하여 성능 최적화를 기대할 수 있음
    
    - 'readOnly = true'는 JPA의 플러시 모드 변경 등 데이터베이스/ORM 차원에서 읽기 전용에 대한 성능 최적화를 가능하게 할 수 있음

<br/><br/>

## 요약 정리

- **트랜잭션 추상화**는 `PlatformTransactionManager` 인터페이스를 통해 데이터 접근 기술(JDBC, JPA 등)에 독립적인 트랜잭션 코드를 작성할 수 있게 함
- **트랜잭션 AOP**인 `@Transactional`을 사용하면 프록시 객체가 생성되어 트랜잭션 시작과 종료를 자동으로 처리함
- **프록시 내부 호출** 문제 해결을 위해 클래스 분리 등을 고려해야 하며, 초기화 시에는 `@PostConstruct`보다 `ApplicationReadyEvent`를 사용해야 함
- **옵션 활용** 시 `readOnly=true`를 활용하여 성능을 최적화하고, 예외 종류(언체크/체크)에 따른 롤백/커밋 정책을 이해하여 `rollbackFor` 옵션을 적절히 사용해야 함

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
