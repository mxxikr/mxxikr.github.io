---
title: "[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 6장 동시성, 데이터가 꼬이기 전에 잡아야한다"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-30 23:00:00 +0900
category:
  - [Book, Backend]
tags: [backend, concurrency, lock, mutex, semaphore, deadlock, atomic, db-lock, book-review]
math: true
mermaid: true
---

- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 6장에서 다루는 내용

- 동시성 문제
- 잠금을 이용한 동시 접근 제어
- 원자적 타입과 동시성 지원 컬렉션
- DB와 동시성 선점 잠금과 비선점 잠금
- 잠금 주의 사항

<br/><br/>

## 동시성 문제의 이해

### 서버와 동시성 실행

- 서버는 동시에 여러 클라이언트의 요청을 처리함

  ![서버 클라이언트 구조](/assets/img/books/backend-basics-ch6/client-server-db.png)

- 서버는 클라이언트의 요청을 처리하기 위해 DB에 쿼리를 보내고 그 결과를 받음
- 여러 클라이언트가 서버에 연결하는 만큼, 서버도 동시에 여러 쿼리를 DB에 보냄
- 동시에 여러 클라이언트가 요청을 보내기 때문에, 서버는 각 요청을 동시에 처리해야 함
- 만약 동시에 처리하지 못하고 각 요청을 순차적으로 처리한다면 서버의 전체적인 성능, 즉 처리량과 응답 시간이 나빠짐

<br/><br/>

## 동시성 문제

### 송금 처리

```java
public class Counter {
    private int value = 0;

    public void increment() {
        value = value + 1;
    }

    public int getValue() {
        return value;
    }
}
```

```java
Counter counter = new Counter();
Thread[] threads = new Thread[100];

for (int i = 0; i < 100; i++) {
    Thread t = new Thread(() -> {
        for (int j = 0; j < 100; j++) {
            counter.increment();
        }
    });
    threads[i] = t;
    t.start();
}

for (Thread t : threads) {
    t.join();
}

System.out.println(counter.getValue());
```

- 동시에 100개의 스레드를 생성하고 각 스레드는 100번 반복해서 동일한 `counter` 객체의 `increment()` 메서드를 실행함
- 모든 스레드의 실행이 끝난 뒤 `getValue()`로 `value` 값을 출력함
- 문제가 없다면 10000을 출력해야하지만 여러 번 실행해 보면 잘못된 값을 출력함
- **JMM(Java Memory Model) 관점**
  - `value = value + 1`은 읽기(Read), 수정(Modify), 쓰기(Write) 3단계로 구성됨
  - 여러 스레드가 동시에 같은 값을 읽고 수정하면 일부 증가가 유실됨
  - 이를 경쟁 상태(Race Condition)라고 함

![동시성 문제 시퀀스](/assets/img/books/backend-basics-ch6/concurrency-problem.png)

- 조회 후 수정 후 저장하는 단계에서 동시성 문제가 발생함

### 송금 서비스

- 이 예제는 필드 공유 시 발생하는 동시성 문제를 보여주는 안티 패턴(anti-pattern)임

```java
public class TransferService {
    private Long transferId; // 인스턴스 필드로 선언되어 모든 스레드가 공유함

    public TransferResult transfer(TransferRequest req) {
        this.transferId = generateId(); // 단계 1
        saveTransferLog(this.transferId, req); // 단계 2
        TransferResult result = executeTransfer(this.transferId, req); // 단계 3
        updateAccountBalance(result); // 단계 4
        return result;
    }

    private void updateAccountBalance(TransferResult result) {
        AccountInfo account = getAccountInfo(result); // 단계 4-1
        saveBalance(this.transferId, account); // 단계 4-2
    }
}
```

- 문제가 있는 설계

  - `transferId`를 인스턴스 필드로 선언함
  - 여러 요청이 동시에 들어오면 같은 인스턴스의 필드를 공유함
  - 한 요청이 필드를 읽는 사이 다른 요청이 값을 변경할 수 있음

- 실행 시나리오

  - 단계 1
    - `generateId()`로 생성한 값을 `transferId` 필드에 할당함
  - 단계 2
    - `transferId` 필드를 이용해서 송금 로그를 저장함
  - 단계 3
    - `executeTransfer()`를 호출하고 리턴 결과인 `result`를 받음
  - 단계 4
    - `updateAccountBalance()`를 실행함
  - 단계 4-1
    - 파라미터로 받은 `result`를 이용해서 `AccountInfo`를 생성함
  - 단계 4-2
    - `saveBalance()` 메서드에 `transferId` 필드를 전달함
  - 스레드 1이 단계 4-2를 실행할 때 기대하는 `transferId` 값은 1이지만, 단계 1과 단계 4-2 사이에 스레드 2가 단계 1을 실행해 `transferId` 값을 2로 바꿔버림
  - 스레드 1의 송금 결과를 처리한 후에 스레드 2의 송금 ID(2)에 대한 데이터를 변경하게 됨

![TransferService 문제 시퀀스](/assets/img/books/backend-basics-ch6/payservice-problem.png)

- 올바른 설계

  - `transferId`를 지역 변수로 사용함
  - 또는 메서드 파라미터로 전달함
  - 각 요청이 독립적인 데이터를 가지도록 설계함

<br/><br/>

## 프로세스 수준에서의 동시 접근 제어

### 잠금(Lock)을 이용한 접근 제어

- 잠금을 사용하면 공유 자원에 접근하는 스레드를 한 번에 하나로 제한할 수 있음
  ![잠금 흐름](/assets/img/books/backend-basics-ch6/lock-flow.png)

- 잠금은 한 번에 한 스레드만 획득할 수 있음
- 여러 스레드가 동시에 잠금을 시도하면 그 중 하나만 잠금을 획득함
- 잠금을 획득한 스레드는 공유 자원에 접근한 뒤 사용을 마치면 잠금을 해제함
- 잠금이 해제된 때 대기 중이던 스레드 중 하나가 잠금을 획득해 자원에 접근함

- **임계 영역(Critical Section)**
  - 동시에 둘 이상의 스레드가 접근하면 안 되는 공유 자원에 접근하는 코드 영역

### ReentrantLock 사용

```java
public class SessionStore {
    private Lock lock = new ReentrantLock();
    private Map<String, SessionData> store = new HashMap<>();

    public void addSession(SessionData data) {
        lock.lock(); // 잠금 획득 먼저 대기
        try {
            store.put(data.getId(), data); // 공유 자원 접근
        } finally {
            lock.unlock(); // 잠금 해제
        }
    }

    public SessionData getSession(String id) {
        lock.lock();
        try {
            return store.get(id); // 한 번에 한 스레드만 읽기 가능
        } finally {
            lock.unlock();
        }
    }
}
```

![ReentrantLock 시퀀스](/assets/img/books/backend-basics-ch6/reentrant-lock-seq.png)

- `HashMap`의 `put()`을 실행할 때 여러 스레드가 동시에 데이터를 수정하면 데이터가 유실되거나 값이 잘못 저장될 수 있음
- `ReentrantLock`을 사용해 `store` 필드에 동시 접근 제한

- **`synchronized`와 `ReentrantLock`**
  - `synchronized`는 더 간단하지만 `ReentrantLock`은 타임아웃 설정 가능
  - 자바 21 가상 스레드에서는 `ReentrantLock` 사용 권장

### 읽기 쓰기 잠금

- 자바 `ReentrantLock`은 한 번에 1개 스레드만 잠금을 획득할 수 있음
  - 한 번에 한 스레드만 공유 자원에 접근할 수 있음
- `HashMap`의 값이 바뀌지 않는다면 `get()` 메서드는 여러 스레드가 동시에 실행해도 문제없음
- 따라서 읽기 쓰기 잠금을 사용하면 읽기 성능 문제를 완화할 수 있음

```java
public class SessionStoreRW {
    private ReadWriteLock lock = new ReentrantReadWriteLock();
    private Lock writeLock = lock.writeLock();
    private Lock readLock = lock.readLock();
    private Map<String, SessionData> store = new HashMap<>();

    public void addSession(SessionData data) {
        writeLock.lock();
        try {
            store.put(data.getId(), data);
        } finally {
            writeLock.unlock();
        }
    }

    public SessionData getSession(String id) {
        readLock.lock();
        try {
            return store.get(id);
        } finally {
            readLock.unlock();
        }
    }
}
```

- `addSession()`은 쓰기 잠금, `getSession()`은 읽기 잠금 사용
- 여러 스레드가 동시에 읽기는 가능하지만 쓰기는 한 번에 하나만 가능

### 세마포어(Semaphore)

- 세마포어는 동시에 실행할 수 있는 스레드 수를 제한함
- 자원에 대한 접근을 일정 수준으로 제한하고 싶을 때 세마포어를 사용함

```java
public class ApiClient {
    private Semaphore semaphore = new Semaphore(5);

    public String fetchData() {
        try {
            semaphore.acquire(); // 퍼밋 획득 시도
            // 외부 API 호출 코드
            String response = callExternalApi();
            return response;
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            semaphore.release(); // 퍼밋 반환
        }
    }
}
```

- 허용 개수를 5로 지정한 세마포어를 생성함
- 외부 API 호출 코드는 동시에 최대 5개 스레드까지만 실행할 수 있음

- **이진 세마포어와 카운팅 세마포어**
  - 세마포어는 이진(binary) 세마포어와 카운팅(counting) 세마포어가 있음
  - 이진 세마포어는 동시에 1개만 접근 가능하므로 개수를 1로 지정함
  - **이진 세마포어와 뮤텍스의 차이**
    - 세마포어는 소유권 개념이 없어 어떤 스레드든 `release()` 가능
    - 뮤텍스는 잠금을 획득한 스레드만 해제할 수 있음

<br/><br/>

## 원자적 타입(Atomic Type)

### AtomicInteger 사용

- 동시성 문제가 발생하는 코드

  ```java
  public class Counter {
      private int value = 0;

      public void increment() {
          value = value + 1; // 여러 스레드가 동시에 실행하면 값이 유실됨
      }

      public int getValue() {
          return value;
      }
  }
  ```

- 잠금을 사용하면 동시성 문제를 해결할 수 있음

  ```java
  public class Counter {
      private Lock lock = new ReentrantLock();
      private int value = 0;

      public void increment() {
          lock.lock();
          try {
              value = value + 1;
          } finally {
              lock.unlock();
          }
      }

      public int getValue() {
          return value;
      }
  }
  ```

- 잠금 없이 더 간단하게 해결하는 방법이 존재함

  - 원자적 타입을 사용하는 것

  ```java
  import java.util.concurrent.atomic.AtomicInteger;

  public class Counter {
      private AtomicInteger value = new AtomicInteger(0);

      public void increment() {
          value.incrementAndGet(); // 다중 스레드 환경에서 안전하게 값을 1 증가시킴
      }

      public int getValue() {
          return value.get();
      }
  }
  ```

- `AtomicInteger`는 내부적으로 CAS 연산을 사용해 잠금을 사용하지 않으면서 안전하게 값 변경 가능

- **CAS(Compare And Swap)**

  - 값을 변경하기 전에 현재 값이 예상값과 같은지 비교하고, 같을 때만 교체하는 연산

  - `int`, `long`, `boolean` 타입의 공유 데이터 변경 시 잠금 대신 원자적 타입 사용 권장
  - **ABA 문제**

    - CAS 연산의 한계로, 값이 A → B → A로 변경되면 변경을 감지하지 못함
    - 해결책: `AtomicStampedReference`를 사용하여 버전(스탬프)과 함께 비교

  - **원자적 타입 종류**

    - `AtomicInteger`, `AtomicLong`
      - 정수형 변수에 대해 원자적인 증가, 감소, 업데이트 연산 제공
    - `AtomicBoolean`
      - 논리형 변수에 대해 원자적인 상태 변경 제공
    - `AtomicReference`
      - 객체 참조 자체를 원자적으로 교체할 때 사용

  - **원자적 타입의 특징**
    - **Non-blocking**
      - 특정 스레드가 자원을 점유하여 다른 스레드를 대기 상태(Blocked)로 만들지 않음
    - **성능**
      - 저수준의 하드웨어 명령(CAS)을 직접 사용하므로, 락을 획득하고 해제하는 오버헤드가 없어 성능상 유리함
    - **잠금 방식별 성능 비교**
      - `Atomic 타입` > `ReentrantLock` ≈ `synchronized` (경합이 적은 경우)
      - 경합이 심한 경우, 상황에 따라 잠금이 더 효율적일 수 있음
      - 단순 카운터나 플래그는 Atomic 타입, 복잡한 로직은 잠금 사용 권장

<br/><br/>

## 가시성(Visibility) 문제

### volatile 키워드

- 한 스레드가 변수를 수정해도 다른 스레드에서 즉시 보이지 않을 수 있음
- CPU 캐시와 메인 메모리 간의 불일치로 인해 발생함
- `volatile` 키워드를 사용하면 변수의 가시성을 보장함

  ```java
  public class StopFlag {
      private volatile boolean stopped = false;

      public void stop() {
          stopped = true; // 다른 스레드에서 즉시 확인 가능
      }

      public void run() {
          while (!stopped) {
              // 작업 수행
          }
      }
  }
  ```

- `volatile`은 가시성만 보장하며 원자성은 보장하지 않음
- 단순 플래그나 상태 확인에 적합하며, 복합 연산에는 `Atomic` 타입이나 잠금 사용 권장

<br/><br/>

## 동시성 지원 컬렉션

### 동기화된 컬렉션

- 스레드에 안전하지 않은 컬렉션 객체를 여러 스레드가 공유하면 데이터가 깨짐
- 예를 들어 자바에서 `HashMap`이나 `HashSet`은 여러 스레드가 공유하면서 데이터를 변경하면 데이터가 깨짐
- 동기화된 컬렉션 객체는 변경이나 조회와 관련된 메서드 모두 동기화된 블록에서 실행되어 동시성 문제를 해결함

  ```java
  Map<String, String> map = new HashMap<>();
  Map<String, String> syncMap = Collections.synchronizedMap(map);
  syncMap.put("key1", "value1"); // put 메서드는 내부적으로 synchronized로 처리됨
  ```

- **복합 연산 주의**
  - 개별 메서드는 스레드 안전하지만 복합 연산은 별도 동기화 필요
  - ex) `if (!map.containsKey(key)) map.put(key, value)`는 여전히 경쟁 상태(race condition) 발생 가능
  - 복합 연산 시 `putIfAbsent()`, `computeIfAbsent()` 등 원자적 메서드 사용 권장

### ConcurrentHashMap

- 동시성 문제를 해결하는 또 다른 방법은 동시성을 지원하는 컬렉션 타입을 사용하는 것임

  ```java
  ConcurrentMap<String, String> map = new ConcurrentHashMap<>();
  map.put("key1", "value1"); // 동시성 지원 클래스로 잠금 범위를 최소화함
  ```

- `ConcurrentHashMap` 타입은 데이터를 변경할 때 잠금 범위를 최소화함
- 따라서 키의 해시 분포가 균등하고 동시 수정이 많으면, 동기화된 맵을 사용하는 것보다 더 나은 성능을 제공함

- **불변(Immutable) 값**
  - 동시성 문제를 피하기 위한 방법 중 하나는 불변 값을 사용하는 것임
  - 불변 값은 데이터 변경이 필요할 경우, 기존 값을 수정하는 대신 새로운 값을 생성해서 사용함
  - 예를 들어 자바의 `CopyOnWriteArrayList`는 요소를 추가하거나 삭제할 때마다 내부 배열을 새로 생성함
  - 읽기는 잠금 없이 수행하고, 쓰기만 복사 후 수정하는 특징이 있음
  - 읽기가 쓰기보다 훨씬 많은 경우에 적합함

<br/><br/>

## DB와 동시성

### DB 트랜잭션

- DB 트랜잭션은 여러 쿼리를 논리적으로 하나로 묶어 모두 커밋 또는 모두 롤백
- 하지만 모든 동시성 문제를 해결하지는 못함
- DB 데이터를 동시 수정 시 발생하는 문제는 DB 잠금 기능 활용 필요

![DB 동시성 문제](/assets/img/books/backend-basics-ch6/db-concurrency-problem.png)

### 선점 잠금 (비관적 잠금, Pessimistic Lock)

- 선점 잠금과 비관적 잠금은 같은 개념을 지칭하는 용어임
- 선점 잠금은 데이터에 먼저 접근한 트랜잭션이 잠금을 획득하는 방식임
- 선점 잠금을 획득하기 위한 쿼리는 다음 형식을 갖음

  - 오라클과 MySQL 기준이며 DB에 따라 쿼리 방식은 다를 수 있음

  ```sql
  select * from 테이블 where 조건
  for update
  ```

  - `for update`로 조회하면서 잠금 획득
  - 트랜잭션 종료(커밋/롤백) 시 잠금 반환

![선점 잠금 시퀀스](/assets/img/books/backend-basics-ch6/pessimistic-lock.png)

### 비선점 잠금 (낙관적 잠금, Optimistic Lock)

- 비선점 잠금과 낙관적 잠금은 같은 개념을 지칭하는 용어임
- 비선점 잠금은 명시적 잠금 없이 `version` 칼럼으로 동시성 처리
- 조회 시점의 `version`과 수정 시점의 `version`을 비교해 충돌 감지

```sql
-- SELECT 쿼리로 실행할 때 version 칼럼을 함께 조회함
select .., version from 테이블 where id = 아이디

-- 로직을 수행함

-- UPDATE 쿼리로 실행할 때 version 칼럼을 1 증가시킴
-- 이때 version 칼럼 값이 1에서 조회한 값과 같은지 비교하는 조건을 where 절에 추가함
UPDATE 테이블 SET .., version = version + 1
WHERE id = 아이디 AND version = [1에서 조회한 version 값]

-- UPDATE 결과로 변경된 행 개수가 0이면, 이미 다른 트랜잭션에서 version 칼럼 증가시킨 것이므로 데이터 변경에 실패한 것이므로 이 경우 트랜잭션을 롤백함
```

- 다음은 위 과정을 코드로 표현한 것임

```java
@Transactional
public void startShipping(String orderId) {
    OrderData order = getOrder(orderId);

    // order 유효한지 검사
    order.startShipping(); // state를 'SHIPPING'으로 변경

    // UPDATE 쿼리 실행 시 다른 트랜잭션에서의 충돌을 막기 위해
    // 조회한 version을 비교하고 version을 1 증가시킴
    int updatedCount = jdbcTemplate.update(
        "update orders set version=version+1, state = 'SHIPPING' " +
        "where id = ? and version=?",
        order.getId(), order.getVersion());

    if (updatedCount == 0) {
        // 변경이 실패
        throw new RuntimeException("비선점 잠금 오류 발생 및 트랜잭션 롤백");
    }
}

private Order getOrder(String orderId) {
    return jdbcTemplate.queryForObject("select * from orders where id = ?",
        (rs, rowNum) -> {
            return Order.builder()
                .id(rs.getString("id"))
                .state(rs.getString("state"))
                .version(rs.getLong("version")) // version 조회
                .build()
        }, orderId);
}
```

![비선점 잠금 시퀀스](/assets/img/books/backend-basics-ch6/optimistic-lock.png)

- 비선점 잠금은 동시 읽기 가능하여 읽기 성능 개선
- **충돌 시 재시도 전략**
  - 비선점 잠금 실패(`version` 불일치) 시 재시도 로직 구현 필요
  - 지수 백오프(exponential backoff)로 재시도 간격을 점진적으로 늘림
  - 최대 재시도 횟수를 설정하여 무한 재시도 방지

### 잠금 방식 선택 가이드라인

- **선점 잠금 권장 상황**
  - 충돌이 빈번하게 발생하는 경우
  - 외부 시스템 연동이 포함된 트랜잭션
  - 데이터 정합성이 최우선인 경우
- **비선점 잠금 권장 상황**

  - 충돌이 드물게 발생하는 경우
  - 읽기 작업이 쓰기보다 훨씬 많은 경우
  - 응답 시간이 중요한 경우

### 외부 연동과 잠금

- 트랜잭션 내에서 외부 시스템 연동 시 비선점 잠금보다 선점 잠금 권장
- ex) PG 환불 후 DB 변경 실패 시 환불만 되고 데이터는 롤백되는 문제

![외부 연동 잠금 문제](/assets/img/books/backend-basics-ch6/external-lock-problem.png)

<br/><br/>

## 중복 쿼리

- 다음 코드는 참여자 수 카운트에서 동시성 문제가 발생할 수 있음

  ```java
  // 이벤트 조회
  Event event = jdbcTemplate.queryForObject(
      "select id, participantCount, .. from EVENT where id = ?", 매퍼, id
  );

  // 참여 데이터 추가
  addParticipant(participantData, event); // EVENT_PARTICIPANT 테이블에 추가

  // 이벤트 데이터의 참여자 수 증가
  jdbcTemplate.update(
      "update EVENT set participantCount = ? where id = ?",
      event.getParticipantCount() + 1, event.getId()
  );
  ```

- 조회 후 애플리케이션에서 값을 증가시키는 방식은 동시성 문제 발생
- DB에서 직접 원자적 연산 사용 권장

  ```sql
  UPDATE EVENT SET participantCount = participantCount + 1 WHERE id = ?
  ```

<br/><br/>

## 잠금 사용 시 주의 사항

### 잠금 해제하기

- 잠금 획득 후 반드시 해제 필수, 그렇지 않으면 무한 대기
- `finally` 블록에서 잠금 해제하는 습관 권장

### 대기 시간 지정하기

- `tryLock(timeout)`으로 지정 시간 내 잠금 획득 시도, 실패 시 예외 처리
- 대기 시간 없이 즉시 결과를 반환하는 `tryLock()`도 사용 가능

```java
// 타임아웃 지정
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try {
        // 임계 영역
    } finally {
        lock.unlock();
    }
} else {
    throw new RuntimeException("Failed to acquire lock");
}

// 즉시 반환
if (lock.tryLock()) {
    try {
        // 임계 영역
    } finally {
        lock.unlock();
    }
}
```

### 잠금 범위(Lock Granularity)

- **거친 잠금(Coarse-grained Lock)**
  - 넓은 범위를 하나의 잠금으로 보호
  - 구현이 단순하지만 동시성이 낮아 성능 저하 가능
- **세밀한 잠금(Fine-grained Lock)**
  - 좁은 범위를 여러 잠금으로 보호
  - 동시성이 높지만 구현 복잡도 증가 및 교착 상태 위험 증가
- 잠금 범위는 임계 영역의 크기와 동시 접근 빈도에 따라 결정함

### 교착 상태(deadlock) 피하기

- 2개 이상의 자원 잠금을 획득하는 코드 구조는 교착 상태에 빠지기 쉬움
- 교착 상태
  - 스레드들이 서로 획득한 잠금을 대기하며 무한히 기다리는 상황

![교착 상태 시퀀스](/assets/img/books/backend-basics-ch6/deadlock.png)

- 해결책
  - 잠금 획득 순서를 항상 일정하게 유지

![교착 상태 해결](/assets/img/books/backend-basics-ch6/deadlock-solved.png)

- **기아(starvation) 상태**

  - 우선 순위가 높은 작업만 계속 실행되어 우선 순위가 낮은 작업이 실행 기회를 얻지 못하는 상태가 발생할 수 있음
  - 이렇게 프로세스나 스레드가 자원을 할당 받지 못해 작업을 진행하지 못하는 상황을 기아상태라고 부름

- **라이브락(livelock)**
  - 복도에서 두 사람이 마주치는 것을 피해 이동하는 것과 유사함
  - 라이브락은 각자가 움직이는 바람에 결국 서로 부딪히게 되는 상황
  - 같은 실행은 하고 있지만 결국 대상 처리가 완료되지 않는 상황을 라이브락이라고 함

<br/><br/>

## 단일 스레드로 처리하기

- 동시성 문제를 완전히 피하려면 한 스레드만 자원에 접근하는 방식 사용
- 작업 요청 스레드는 큐에 작업을 넣고, 상태 관리 스레드가 큐에서 꺼내서 처리

- 한 스레드만 상태를 관리하는 방식으로 구현하려면 프로그램이 다음과 같은 구조를 갖음

![단일 스레드 처리 구조](/assets/img/books/backend-basics-ch6/single-thread.png)

- 상태 관리 스레드만 데이터를 조작함
- 데이터 변경이나 접근이 필요한 스레드는 작업 큐에 작업을 넣음
- 상태 관리 스레드는 작업을 꺼내어 필요한 데이터 처리를 수행함

```java
while (running) {
    // 한 스레드만 큐에서 작업을 꺼내서 실행함
    Job job = jobQueue.poll(1, TimeUnit.SECONDS);
    if (job == null) {
        continue;
    }

    // job 종류에 따라 상태 처리
    switch (job.getType()) {
        case INC:
            // modifyState()는 한 스레드만 접근하므로 동시성 문제가 없다
            obj.modifyState();
            break;
        // 다른 작업
    }
}
```

- 이 코드에서 `obj.modifyState()` 메서드는 한 스레드만 접근하기 때문에 잠금과 같은 수단이 필요 없음

- **Go 언어의 철학**
  - Go 언어에는 "메모리를 공유하는 방식으로 (고루틴) 간에 소통하지 말고 통신을 통해 메모리를 공유하라"는 말이 있음
  - Go 언어는 여러 고루틴이 동시에 접근하는 것을 권장하지 않고, 채널을 통해 고루틴 간에 데이터를 공유하는 방식으로 동시성을 구현하는 것을 권장함
  - 이는 동시성 문제를 줄여주는 데 도움 됨

### 성능 고려사항

- 단일 스레드는 교착 상태 없지만 성능은 임계 영역 실행 시간과 작업 개수에 따라 다름
- 임계 영역 실행 시간이 짧고 동시 작업이 많으면 성능 이득이 큼

<br/><br/>

## 배운 점

- 동시성 문제는 여러 스레드가 공유 자원에 동시에 접근할 때 발생함
- 잠금을 통해 임계 영역에 한 번에 하나의 스레드만 접근하도록 제어할 수 있음
- 원자적 타입은 잠금 없이도 스레드 안전한 연산을 제공하며 단순 카운터에 적합함
- DB 레벨에서는 선점 잠금과 비선점 잠금을 상황에 맞게 선택해야 함
- 교착 상태를 피하려면 잠금 획득 순서를 일관되게 유지해야 함
- 조회 후 애플리케이션에서 값을 변경하는 방식은 동시성 문제를 유발함

<br/><br/>

## 적용 방안

- 공유 자원 식별
  - 인스턴스 필드를 여러 스레드가 접근하는지 확인
  - 공유 자원에는 적절한 동기화 적용
- 잠금 전략 선택
  - 읽기가 많으면 `ReadWriteLock` 또는 비선점 잠금
  - 외부 API 연동이 포함되면 선점 잠금
  - 단순 카운터는 `AtomicInteger` 사용
- DB 업데이트 방식 개선
  - `count = count + 1` 대신 `SET count = count + 1` 사용
  - DB에서 원자적 연산 수행
- 잠금 해제 보장
  - 모든 잠금은 `finally` 블록에서 해제
  - `tryLock(timeout)` 사용으로 무한 대기 방지
- 부하 테스트
  - 동시성 문제는 테스트에서 발견되지 않을 수 있음
  - 운영 환경 배포 전 부하 테스트로 검증

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
