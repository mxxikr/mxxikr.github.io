---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 부록 C DB로 분산 잠금 구현하기'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-31 07:00:00 +0900
category: [Book, Backend]
tags: [backend, distributed-lock, database, concurrency, transaction, book-review]
math: false
mermaid: false
---

- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 부록 C에서 다루는 내용

- 분산 잠금의 필요성
- 잠금 정보 저장 테이블 설계
- 분산 잠금 동작 원리
- DB 기반 잠금 구현
- 사용 예시

<br/><br/>

## 분산 잠금의 필요성

### 배경

- 여러 노드에서 실행되는 애플리케이션이 동일한 작업을 동시에 실행하면 데이터 문제가 발생할 수 있음
- 동시에 두 개 이상의 프로세스가 실행되더라도 그중 하나의 프로세스, 하나의 스레드만 작업을 실행해야 함

### 문제 상황

![분산 잠금 문제 상황](/assets/img/books/backend-basics-appendix-c/distributed-lock-problem.png)

- **동시 실행 문제**
    - 여러 노드에서 동시에 같은 작업을 실행하면 데이터 충돌이 발생함
    - 분산 환경에서 하나의 스레드만 작업을 실행하도록 제어해야 함

### 해결 방안

- **분산 잠금 방법**
    - Redis나 Zookeeper 같은 기술을 사용할 수 있음
    - 구조를 단순하게 유지하고 싶다면 DB를 분산 잠금 수단으로 사용할 수 있음

<br/><br/>

## 잠금 정보 저장 테이블

### 테이블 설계

- 분산 잠금을 구현하기 위해 잠금 정보를 저장하는 테이블이 필요함

    ```sql
    CREATE TABLE dist_lock
    (
        name    varchar(100) NOT NULL COMMENT '락 이름',
        owner   varchar(100) COMMENT '락 소유자',
        expiry  datetime     COMMENT '락 만료 시간',
        primary key (name)
    )
    ```

### 컬럼 설명

| 컬럼 | 타입 | 설명 |
|------|------|------|
| **name** | varchar(100) | 개별 잠금을 구분하기 위한 값 (Primary Key) |
| **owner** | varchar(100) | 잠금 소유자를 구분하기 위한 값 |
| **expiry** | datetime | 잠금 소유 만료 시간 |

<br/><br/>

## 분산 잠금 동작

### 잠금 획득 절차

![분산 잠금 동작 흐름](/assets/img/books/backend-basics-appendix-c/distributed-lock-flow.png)

1. 트랜잭션을 시작함
2. 선점 잠금 쿼리(`FOR UPDATE`)를 이용해서 해당 행을 점유함
3. 행이 없으면 잠금 테이블에 새로운 데이터를 추가함
4. owner가 다르고 expiry가 지나지 않았다면, 잠금 획득에 실패함
5. owner가 다르고 expiry가 지났다면, owner와 expiry 값을 변경한 후 잠금을 획득함
6. owner가 같다면 잠금을 획득함 (만료 시간 연장)
7. 트랜잭션을 커밋하고 결과를 리턴함
8. 트랜잭션 커밋에 실패하면 잠금 획득도 실패함

### 주요 포인트

- **`SELECT FOR UPDATE`**
    - 행 레벨 잠금으로 동시 접근 방지
- **owner 비교**
    - 같은 스레드의 재진입 허용
- **expiry 확인**
    - 만료된 잠금 재획득 가능
- **트랜잭션**
    - 원자성 보장

<br/><br/>

## DB 잠금 구현

### LockOwner 타입

- 잠금 소유자를 표현하는 타입

    ```java
    // 잠금 소유자 정보를 담는 레코드 타입
    public record LockOwner(String owner, LocalDateTime expiry) {
        
        // 특정 소유자가 현재 잠금을 소유 중인지 확인
        public boolean isOwnedBy(String owner) {
            return this.owner.equals(owner);
        }
        
        // 잠금 만료 시간이 지났는지 확인
        public boolean isExpired() {
            return expiry.isBefore(LocalDateTime.now());
        }
    }
    ```

### DistLock 클래스 - tryLock() 메서드

- 실제 잠금 로직을 구현하는 클래스

    ```java
    public class DistLock {
        
        private final DataSource dataSource;
        
        public DistLock(DataSource dataSource) {
            this.dataSource = dataSource;
        }
        
        // 분산 잠금 획득 시도 메서드
        public boolean tryLock(String name, String owner, Duration duration) {
            Connection conn = null;
            boolean owned;
            
            try {
                // 트랜잭션 시작
                conn = dataSource.getConnection();
                conn.setAutoCommit(false);
                
                // 잠금 정보 조회 (행 레벨 잠금)
                LockOwner lockOwner = getLockOwner(conn, name);
                
                if (lockOwner == null || lockOwner.owner() == null) {
                    // 아직 소유자가 없음 - 잠금 소유 시도
                    insertLockOwner(conn, name, owner, duration);
                    owned = true;
                } else if (lockOwner.isOwnedBy(owner)) {
                    // 소유자 검증 - 만료 시간 연장
                    updateLockOwner(conn, name, owner, duration);
                    owned = true;
                } else if (lockOwner.isExpired()) {
                    // 소유자 다름 && 만료 시간 지남 - 잠금 소유 시도
                    updateLockOwner(conn, name, owner, duration);
                    owned = true;
                } else {
                    // 소유자 다름 && 만료 시간 안 지남 - 잠금 소유 실패
                    owned = false;
                }
                
                // 트랜잭션 커밋
                conn.commit();
            } catch (Exception e) {
                owned = false;
                rollback(conn);
            } finally {
                close(conn);
            }
            
            return owned;
        }
    }
    ```

### 주요 메서드

- **getLockOwner()**

    ```java
    // SELECT FOR UPDATE로 잠금 정보를 조회하고 행 잠금 획득
    private LockOwner getLockOwner(Connection conn, String name) 
            throws SQLException {
        
        try (PreparedStatement pstmt = conn.prepareStatement(
                "select * from dist_lock where name = ? for update")) {
            
            pstmt.setString(1, name);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new LockOwner(
                        rs.getString("owner"),
                        rs.getTimestamp("expiry").toLocalDateTime()
                    );
                }
            }
        }
        return null;
    }
    ```

- **insertLockOwner()**

    ```java
    // 새로운 잠금 정보를 테이블에 삽입
    private void insertLockOwner(
            Connection conn, String name, String ownerId, Duration duration)
            throws SQLException {
        
        try (PreparedStatement pstmt = conn.prepareStatement(
                "insert into dist_lock values (?, ?, ?)")) {
            
            pstmt.setString(1, name);           // 잠금 이름
            pstmt.setString(2, ownerId);        // 소유자 ID
            pstmt.setTimestamp(3, getExpiry(duration));  // 만료 시간
            pstmt.executeUpdate();
        }
    }
    ```

- **updateLockOwner()**

    ```java
    // 잠금 소유자 및 만료 시간 갱신
    private void updateLockOwner(
            Connection conn, String name, String owner, Duration duration) 
            throws SQLException {
        
        try (PreparedStatement pstmt = conn.prepareStatement(
                "update dist_lock set owner = ?, expiry = ? where name = ?")) {
            
            pstmt.setString(1, owner);          // 새로운 소유자
            pstmt.setTimestamp(2, getExpiry(duration));  // 새로운 만료 시간
            pstmt.setString(3, name);           // 잠금 이름
            pstmt.executeUpdate();
        }
    }
    ```

### unlock() 메서드

```java
// 잠금 해제 메서드
public void unlock(String name, String owner) {
    Connection conn = null;
    
    try {
        // 트랜잭션 시작
        conn = dataSource.getConnection();
        conn.setAutoCommit(false);
        
        // 현재 잠금 정보 조회
        LockOwner lockOwner = getLockOwner(conn, name);
        
        // 소유자 검증
        if (lockOwner == null || !lockOwner.isOwnedBy(owner)) {
            throw new IllegalStateException("no lock owner");
        }
        
        // 만료 여부 확인
        if (lockOwner.isExpired()) {
            throw new IllegalStateException("lock is expired");
        }
        
        // 잠금 해제 (owner와 expiry를 null로 설정)
        clearOwner(conn, name);
        conn.commit();
        
    } catch (SQLException e) {
        rollback(conn);
        throw new RuntimeException("fail to unlock: " + e.getMessage());
    } finally {
        close(conn);
    }
}
```

<br/><br/>

## 사용 예시

### 기본 사용법

```java
// 분산 잠금 사용 예시
DistLock lock = new DistLock(ds);
String owner = "owner1";

// 잠금 획득 시도
if (lock.tryLock("lockName", owner, Duration.ofMinutes(1))) {
    try {
        // 잠금에 성공한 경우 작업 수행
        // 코드 실행
    } finally {
        // 작업 완료 후 반드시 잠금 해제
        lock.unlock("lockName", owner);
    }
}
```

### 스케줄러와 함께 사용

```java
// 스케줄러에서 분산 잠금을 사용하는 예시
@Component
public class ScheduledTaskService {
    
    private final DistLock distLock;
    
    @Scheduled(cron = "0 * * * * *")  // 매 분마다 실행
    public void executeTask() {
        String taskName = "scheduled-task";
        // 호스트명을 소유자로 사용
        String owner = InetAddress.getLocalHost().getHostName();
        
        // 잠금 획득 시도 (1분 동안 유효)
        if (distLock.tryLock(taskName, owner, Duration.ofMinutes(1))) {
            try {
                // 하나의 인스턴스에서만 작업 수행
                performTask();
            } finally {
                // 작업 완료 후 잠금 해제
                distLock.unlock(taskName, owner);
            }
        } else {
            // 다른 인스턴스가 이미 작업 중
            log.info("Task is running on another instance");
        }
    }
}
```

<br/><br/>

## 잠금 획득 조건 정리

| 조건 | 소유자 없음 | 같은 소유자 | 다른 소유자 (만료) | 다른 소유자 (미만료) |
|------|------------|------------|------------------|-------------------|
| **결과** | 획득 | 획득 (연장) | 획득 (재획득) | 실패 |
| **동작** | INSERT | UPDATE | UPDATE | ROLLBACK |

<br/><br/>

## DB 기반 분산 잠금의 장단점

### 장점

- DB만 있으면 구현 가능 (추가 인프라 불필요)
- 구조가 단순함
- 트랜잭션으로 원자성 보장
- `SELECT FOR UPDATE`로 동시성 제어

### 단점

- DB 부하 발생 가능
- Redis/Zookeeper보다 성능 낮음
- 네트워크 지연 영향

<br/><br/>

## 대안 기술 비교

| 기술 | 장점 | 단점 | 사용 시기 |
|------|------|------|----------|
| **DB 기반** | 추가 인프라 불필요, 단순한 구조 | 성능 낮음, DB 부하 | 소규모, 단순한 요구사항 |
| **Redis** | 빠른 성능, 다양한 기능 | 별도 인프라, 설정 복잡 | 중대규모, 고성능 필요 |
| **Zookeeper** | 안정적, 분산 코디네이션 | 운영 복잡, 학습 곡선 | 대규모, 복잡한 분산 시스템 |

<br/><br/>

## 배운 점

- 분산 환경에서 동시성 제어의 필요성을 이해하게 됨
- DB의 `SELECT FOR UPDATE`를 활용한 행 레벨 잠금 방식을 익힘
- 만료 시간을 통해 데드락을 방지하고 비정상 종료 시 자동 해제하는 전략을 배움
- 단순한 구조를 유지하면서도 분산 잠금을 구현할 수 있다는 점을 알게 됨

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
