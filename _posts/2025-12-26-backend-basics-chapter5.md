---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 5장 비동기 연동, 언제 어떻게 써야 할까'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-12-26 17:45:00 +0900
category: [Book, Backend]
tags: [backend, architecture, async, messaging, outbox-pattern, batch, cdc, book-review]
math: true
mermaid: false
---
- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 5장에서 다루는 내용

- 비동기 연동
- 별도 스레드를 이용한 비동기 연동
- 메시징을 이용한 비동기 연동
- 트랜잭션 아웃박스 패턴
- 배치 전송
- CDC

<br/><br/>

## 동기 연동과 비동기 연동

### 동기 방식

- 특징

  - 순차적으로 실행되는 전형적인 방식임
  - 한 작업이 끝날 때까지 다음 작업이 진행되지 않음
  - 코드의 순서가 곧 실행 순서가 됨

- 장점

  - 프로그램의 흐름을 직관적으로 이해할 수 있음
  - 디버깅이 용이함

- 단점

  - 외부 서비스 연동 시 실패가 전체 기능의 실패로 이어질 수 있음
  - 외부 서비스의 응답 시간이 길어질수록 전체 응답 시간이 늘어남
  - 심한 경우 외부 연동 서비스로 인해 전체 서비스가 먹통이 될 수 있음

    ```java
    public boolean login(String id, String password) {
        Optional<User> opt = findUser(id);
        if (opt.isEmpty()) return false;

        User u = opt.get();
        if (!u.matchPassword(password)) return false;

        PointResult result = pointClient.giveLoginPoint(id); // 동기 호출
        if (result.isFailed()) {
            throw new PointException();  // 포인트 실패 시 로그인 실패
        }

        appendLoginHistory(id);
        return true;
    }
    ```

    - 포인트 시스템 문제가 로그인 기능 전체에 영향을 줌
    - 포인트 적립은 핵심 기능이 아니므로 실패 시에도 로그인이 성공해야 함

### 비동기 방식

- 작업이 끝날 때까지 기다리지 않고 바로 다음 작업을 처리함
- 사용자에게 빠른 응답을 제공할 수 있음
- 외부 연동 결과가 즉시 필요하지 않을 경우 고려함

![동기 vs 비동기 비교](/assets/img/books/backend-basics-ch5/sync_async_comparison.png)

<br/><br/>

## 별도 스레드로 실행하기

### Thread를 이용한 비동기 처리

- 비동기 연동의 가장 간단한 방법임
- 별도 스레드에서 코드 실행 시 메인 스레드는 바로 다음 작업을 수행함
- 응답을 기다리지 않고 다음 로직을 수행할 수 있음

  ```java
  public OrderResult placeOrder(OrderRequest req) {
      // 주문 생성 처리

      // 별도 스레드로 비동기 실행
      new Thread(() -> pushClient.sendPush(pushData)).start();

      return successResult(...);
  }
  ```

### ExecutorService를 이용한 개선

- 매번 스레드 생성 시 자원이 낭비됨
- 스레드 풀로 효율적으로 관리함

  ```java
  ExecutorService executor = Executors.newFixedThreadPool(10);

  public OrderResult placeOrder(OrderRequest req) {
      // 주문 생성 처리

      // 스레드 풀을 이용해 효율적으로 비동기 작업 실행
      executor.submit(() -> pushClient.sendPush(pushData));

      return successResult(...);
  }
  ```

### 프레임워크 기능 활용

- 프레임워크가 제공하는 비동기 실행 기능을 활용할 수 있음
- 스프링의 `@Async` 애너테이션을 이용한 비동기 실행 기능도 제공됨

  ```java
  public class PushService {
      @Async
      public void sendPushAsync(PushData pushData) {
          pushClient.sendPush(pushData);
      }
  }
  ```

  ```java
  public OrderResult placeOrder(OrderRequest req) {
      // 주문 생성 처리

      pushService.sendPushAsync(pushData);

      return successResult(...); // 푸시 발송을 기다리지 않고 바로 리턴
  }
  ```

  - `@Async` 애너테이션이 붙은 메서드는 이름에서 비동기임을 명확히 드러내는 것이 좋음
  - `sendPush()` 메서드 호출은 `@Async` 애너테이션 안이 아니므로 비동기로 실행되지 않음
  - try-catch로 예외를 잡을 수 없으므로 메서드 내부에서 직접 처리해야 함

  ```java
  public OrderResult placeOrder(OrderRequest req) {
      // 주문 생성 처리
   try {
        pushService.sendPushAsync(pushData);
    } catch(Exception ex) {
        // sendPush()가 비동기로 실행되므로 catch 블록은 동작하지 않는다
        // 예외 처리 코드
    }

    return successResult(...);
  }
  ```

### 비동기 스레드 사용 시 주의 사항

- 가독성을 위해 메서드 이름에 `Async` 표시를 권장함
- 예외 처리 주의 필요
  - 비동기 실행 시 호출부의 `try-catch` 블록으로 예외를 잡을 수 없음
  - 비동기 코드 내부에서 직접 오류를 처리해야 함
- 트랜잭션 범위 주의 필요
  - `@Transactional` 범위 내에서 비동기 메서드 호출 시 트랜잭션이 공유되지 않음
  - 롤백 불가 문제가 발생할 수 있음

### 스레드와 메모리 고려 사항

- 스레드는 자체적으로 메모리를 사용함
- 스레드 하나당 최소 수백 KB의 메모리를 점유함
- 너무 많은 스레드 생성 시 메모리 부족이 발생함
- 10만 개의 스레드 생성 시 수십 GB의 메모리가 필요할 수 있음
- 스레드 스케줄링에 많은 CPU 시간을 사용하여 실행 시간이 느려질 수 있음

### 대안 기술

- 자바의 가상 스레드(Virtual Thread)
- Go 언어의 고루틴(Goroutine)

<br/><br/>

## 메시징을 이용한 비동기 연동

### 메시징 시스템의 동작 방식

![메시징 시스템 개요](/assets/img/books/backend-basics-ch5/messaging_system.png)

- 시스템 A가 시스템 B에 메시지를 전달하고자 할 때 메시지를 생성해서 메시징 시스템에 전송함
- 시스템 B는 메시징 시스템에 연결해서 메시지를 읽어옴
- 시스템 A와 시스템 B가 직접 연동할 필요가 없음

### 메시징 시스템의 장점

- 시스템 A는 메시지 전송 후 바로 다음 작업을 수행할 수 있음
- 시스템 B의 상태와 무관하게 메시지를 전송할 수 있음
- 메시징 시스템이 메시지를 보관하므로 유실 위험이 낮음
- 여러 시스템이 메시지를 구독할 수 있어 확장성이 있음
- 시스템 간 결합도를 낮춤
- 버퍼 역할로 트래픽 급증 시 성능 저하를 방지함
- 새로운 시스템 추가 시 기존 코드 수정이 불필요함

### 주요 메시징 기술

- 카프카(Kafka)
  - 높은 처리량, 초당 백만 개 이상 메시지 처리가 가능함
  - 메시지를 파일에 보관하여 유실 위험이 적음
  - Pull 모델을 사용함
  - 재처리가 가능함
- 래빗MQ(RabbitMQ)
  - 다양한 프로토콜과 게시 구독 패턴을 지원함
  - 정교한 메시지 라우팅 기능을 제공함
  - Push 모델을 사용함
- 레디스(Redis) pub/sub
  - 짧은 지연 시간으로 실시간 처리에 유리함
  - 영구 메시지를 지원하지 않으며 구독자 부재 시 메시지가 유실됨

<br/><br/>

## 메시지 생성 및 소비 고려 사항

### 메시지 전송과 트랜잭션 연동

- 메시지 생성 시 유실에 대비한 전략이 필요함 (무시, 재시도, 실패 로그)
- DB 트랜잭션과 메시지 전송 순서가 중요함
  - DB 변경 중에 메시지 전송 시 DB 트랜잭션 롤백에도 메시지는 이미 발송되는 문제가 발생할 수 있음
  - 반드시 DB 트랜잭션 커밋 후 메시지를 전송하여 데이터 일관성을 유지해야 함
- 2PC를 지원하는 글로벌 트랜잭션을 사용할 수 있으나 성능 저하가 발생함

### 메시지 소비와 멱등성

- 소비자는 동일한 메시지를 중복 처리할 수 있음을 가정해야 함
  - 생산자가 중복 전송하거나 처리 과정에서 오류로 재수신할 수 있음
  - 네트워크 문제로 동일한 메시지가 두 번 이상 전송될 수 있음
- 대응 방법

  - API가 멱등성을 갖도록 구현함
  - 고유한 메시지 ID로 중복 처리를 방지함

  ```java
  // 대기 중인 메시지 처리
  public void processMessages() {
      List<Message> waitingMessages = selectWaitingMessages();

      for (Message m : waitingMessages) {
          try {
              sendMessage(m);
              markDone(m.getId());
          } catch (Exception ex) {
              handleError(m.getId(), ex);
              break;
          }
      }
  }
  ```

- 예외 발생 시 재처리를 위한 체계가 필요함
- 비동기 메시지도 전달 보장이 필요한 경우 재시도 로직이 필수임

### 메시지 전송 실패 처리

- 네트워크 장애나 메시징 시스템의 일시적 오류로 전송이 실패할 수 있음
- 별도의 재시도 로직을 사용해 재전송 체계 구축이 필요함
- 재전송 횟수 제한으로 무한 재시도를 방지해야 함

<br/><br/>

## 메시징 종류

### 이벤트와 커맨드의 차이

| 구분          | 이벤트              | 커맨드              |
| :------------ | :------------------ | :------------------ |
| **전달 방식** | 소비자를 모름       | 특정 소비자 지정    |
| **목적**      | 상태 변경 알림      | 특정 처리 요청      |
| **예시**      | 주문 완료 알림      | 포인트 지급 요청    |
| **특징**      | 과거 발생 사건 전파 | 특정 기능 실행 명령 |

- 이벤트(Event)
  - 과거에 발생한 사건을 표현함
  - 수신자가 정해져 있지 않으며 관심 있는 누구나 수신할 수 있음
  - 소비자 확장에 유리함
  - 한 개 이상의 소비자가 처리할 수 있음
- 커맨드(Command)
  - 무언가를 실행하라는 요청을 표현함
  - 수신자가 명확히 정해져 있음
  - 처리 대상이 명확함

<br/><br/>

## 궁극적 일관성

### Eventual Consistency의 개념

- 비동기 메시징 사용 시 데이터 정합성이 즉시 맞지 않을 수 있음
- 일시적으로 데이터가 달라도 시스템은 정상 동작함
- 나중에 메시지가 전달되면 일관성이 유지됨
- 일정 시간 후 시스템 간 상태가 맞춰지는 모델을 수용함

### 비동기 처리의 트레이드오프

- 즉각적인 응답 속도를 얻는 대신 일시적인 불일치를 감수함
- 대부분의 경우 몇 초에서 몇 분의 지연은 크게 문제 삼지 않음
- 시스템 전체의 성능과 안정성을 위한 선택임

<br/><br/>

## 트랜잭션 아웃박스 패턴

### 메시지 발행 실패 문제

- DB 트랜잭션 커밋 후 메시지 전송 실패 시 데이터 불일치가 발생함
- 메시지 시스템 장애로 인한 실패를 복구하기 어려움

### 아웃박스 패턴의 해결책

![트랜잭션 아웃박스 패턴](/assets/img/books/backend-basics-ch5/outbox_pattern.png)

- 동일한 DB 트랜잭션 내에서 비즈니스 로직 처리와 메시지 저장을 함께 수행함
- 트랜잭션 내에서 DB에 아웃박스 레코드를 저장함
- 별도 프로세스가 아웃박스 테이블을 읽어서 메시지 전송을 처리함
- DB 트랜잭션 성공 시 반드시 메시지 전송을 보장함
- 메시지 데이터 유실을 방지함

### 아웃박스 패턴 동작 프로세스

![트랜잭션 아웃박스 상세](/assets/img/books/backend-basics-ch5/outbox_pattern_detailed.png)

### 아웃박스 테이블 구조

```sql
-- 대기 중인 메시지만 조회
select * from outbox
where status = 'WAITING'
order by id asc
limit 100;

-- 발송 완료 상태로 갱신
update outbox
set status = 'DONE'
where id = ?;
```

### 아웃박스 테이블 예시 구조

| 칼럼            | 타입      | 설명                                                                                           |
| :-------------- | :-------- | :--------------------------------------------------------------------------------------------- |
| **Id**          | big int   | 단순 증가 값(PK), 저장된 순서대로 증가하는 값을 사용함                                         |
| **messageId**   | varchar   | 메시지 고유 ID(고유키)                                                                         |
| **messageType** | varchar   | 메시지 타입                                                                                    |
| **payload**     | clob      | 메시지 데이터                                                                                  |
| **status**      | varchar   | 이벤트 처리 상태로 다음 세 값을 가짐<br/>- WAITING(대기)<br/>- DONE(완료)<br/>- FAILED(실패함) |
| **failCount**   | int       | 실패 횟수                                                                                      |
| **occuredAt**   | timestamp | 메시지 발생 시간                                                                               |
| **processedAt** | timestamp | 메시지 처리 시간                                                                               |
| **failedAt**    | timestamp | 마지막 실패 시간                                                                               |

<br/><br/>

## 배치 전송

### 배치 처리의 필요성

- 데이터를 비동기로 연동하는 방법임
- 대량의 데이터를 주기적으로 처리할 때 사용함
- 특정 시간대에 모아서 처리하면 효율적임
- 파일 단위(JSON, CSV 등)로 데이터를 모아 정해진 시간에 전송함

### 배치 작업 구현 방법

- DB에서 전송 대상 데이터를 조회함
- 조회한 데이터를 파일로 저장하거나 API로 전송함
- 파일로 저장하는 경우 FTP나 SFTP 등을 사용하여 공유함

### 배치 전송 프로토콜

- 파일 기반
  - FTP, SFTP
  - JSON 또는 CSV 형식으로 저장
- API 기반
  - REST API
  - 동기 방식으로 호출하나 주기적으로 실행

### 배치 처리 시 고려 사항

- 대용량 정산 데이터 처리에 적합함
- 실패 시 수동 재처리가 용이하도록 재실행 기능이 필요함

<br/><br/>

## DB로 연동하기

### DB를 이용한 데이터 공유

- 메시징이나 API 대신 DB를 통해 데이터를 공유함
- 타 시스템이 DB를 직접 조회하여 데이터를 획득함

### DB 연동의 문제점

- 서로 다른 시스템이 같은 DB 스키마에 강하게 결합됨
- DB 스키마 변경 시 영향 범위가 커짐
- 성능 문제가 발생할 가능성이 높음

### DB 연동 시 고려 사항

- 가능하면 읽기 전용 DB를 제공하는 것이 좋음
- 뷰(View)를 사용해 필요한 데이터만 노출함
- 데이터 변경은 API를 통해서만 가능하도록 제한함

<br/><br/>

## CDC (Change Data Capture)

### CDC의 개념

- DB의 변경 데이터를 실시간으로 캡처하여 다른 시스템에 전달하는 기술임
- DB의 변경 로그를 읽어서 이벤트로 발행함
- DB의 로그를 직접 추적하여 변경된 데이터를 실시간으로 전파함

![CDC 개요](/assets/img/books/backend-basics-ch5/cdc_overview.png)

### CDC의 동작 방식

- DB의 변경 로그(binlog, WAL 등)를 읽음
- 변경 사항을 메시징 시스템으로 전송함
- 다른 시스템이 메시지를 구독하여 데이터를 동기화함

### CDC 활용 사례

- 데이터 웨어하우스로 실시간 데이터 전송함
- 마이크로서비스 간 데이터 동기화함
- 레거시 시스템과 신규 시스템 간 데이터 동기화함
- 데이터 복제나 레거시 시스템과의 연동에 유용함

### CDC 주의사항

- CDC는 데이터베이스 벤더별로 지원 방식이 다름
- 변경 로그를 읽기 위한 권한 설정이 필요함
- 대량 변경 발생 시 메시징 시스템에 부하가 발생할 수 있음

### CDC가 유용한 경우

- MySQL을 사용 중이며 row 기반 binlog를 사용하는 경우
- 변경 데이터를 실시간으로 다른 시스템에 전파해야 하는 경우
- 기존 코드 수정 없이 CDC를 사용해 타 시스템에 관련 데이터 전파가 가능함

### CDC의 장점

- 애플리케이션 코드 수정 없이 데이터 변경을 감지할 수 있음
- DB 레벨에서 변경을 추적하므로 누락 가능성이 낮음
- 실시간에 가까운 데이터 동기화가 가능함

### CDC의 한계

- 단순 데이터 변경만 전달하므로 비즈니스 컨텍스트가 부족함
- 복잡한 join이나 집계가 필요한 경우 CDC만으로는 부족함
- DB 부하가 발생할 수 있음

### CDC 데이터 위치

![CDC 데이터 위치](/assets/img/books/backend-basics-ch5/cdc_data_location.png)

- 변경 데이터를 그대로 대상 시스템 DB로 전파하는 방식임
- 메시징 시스템을 경유하여 이벤트로 변환해서 전송하는 방식임

### CDC의 다양한 활용 패턴

- 단순한 DB 간 CDC
  - 변경 로그를 직접 읽어 타겟 DB에 직접 전달함
- 메시징 시스템 경유 CDC
  - 변경 데이터를 메시징 시스템(카프카)으로 전송하여 여러 소비자가 활용할 수 있음
  - 소비자를 추가해도 원본 시스템에 영향을 주지 않음

<br/><br/>

## 배운 점

- 동기 처리는 직관적이지만 외부 시스템 장애 시 전체 기능에 영향을 줄 수 있음
- 비동기 연동은 핵심이 아닌 기능을 분리하여 시스템 안정성을 높일 수 있음
- 메시징 시스템을 통해 시스템 간 결합도를 낮추고 확장성을 확보할 수 있음
- 트랜잭션 아웃박스 패턴으로 DB 트랜잭션과 메시지 전송의 일관성을 보장할 수 있음
- 비동기 연동 시 멱등성 확보와 재시도 로직이 필수임
- CDC를 통해 애플리케이션 코드 수정 없이 데이터 변경을 다른 시스템에 전파할 수 있음

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
