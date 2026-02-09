---
title: '[스프링 DB 2편 - 데이터 접근 활용 기술] 스프링 트랜잭션 전파2 - 활용'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-09 15:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, transaction, propagation, practice]
math: false
mermaid: false
---

# 스프링 트랜잭션 전파2 - 활용

- 김영한님의 스프링 DB 2편 강의를 통해 스프링 트랜잭션 전파의 다양한 옵션을 실제 비즈니스 시나리오(회원 가입과 로그 저장)에 적용해보며, 트랜잭션 전파가 필요한 이유와 해결 방법을 실전 예제로 정리함

<br/><br/>

## 예제 프로젝트 소개

### 비즈니스 요구사항

- 요구사항
    1. 회원 등록
    2. 회원 등록 시 변경 이력을 LOG 테이블에 기록
    3. 회원과 로그는 데이터 정합성 유지 필요


### 도메인 모델

![도메인 모델](/assets/img/springdb/practice_01_domain.png)


### 엔티티 코드

- **Member 엔티티**

    ```java
    @Entity
    @Getter
    @Setter
    public class Member {
        
        @Id
        @GeneratedValue
        private Long id;
        
        private String username;
        
        public Member() {
        }
        
        public Member(String username) {
            this.username = username;
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/propagation/Member.java)

- **Log 엔티티**

    ```java
    @Entity
    @Getter
    @Setter
    public class Log {
        
        @Id
        @GeneratedValue
        private Long id;
        
        private String message;
        
        public Log() {
        }
        
        public Log(String message) {
            this.message = message;
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/propagation/Log.java)


### 리포지토리

- **MemberRepository**

    ```java
    @Slf4j
    @Repository
    @RequiredArgsConstructor
    public class MemberRepository {
        
        private final EntityManager em;
        
        @Transactional
        public void save(Member member) {
            log.info("member 저장");
            em.persist(member);
        }
        
        public Optional<Member> find(String username) {
            return em.createQuery(
                "select m from Member m where m.username=:username", Member.class)
                .setParameter("username", username)
                .getResultList()
                .stream()
                .findAny();
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/propagation/MemberRepository.java)

- **LogRepository**

    ```java
    @Slf4j
    @Repository
    @RequiredArgsConstructor
    public class LogRepository {
        
        private final EntityManager em;
        
        @Transactional
        public void save(Log logMessage) {
            log.info("log 저장");
            em.persist(logMessage);
            
            // 예외 발생 시나리오
            if (logMessage.getMessage().contains("로그예외")) {
                log.info("log 저장시 예외 발생");
                throw new RuntimeException("예외 발생");
            }
        }
        
        public Optional<Log> find(String message) {
            return em.createQuery(
                "select l from Log l where l.message = :message", Log.class)
                .setParameter("message", message)
                .getResultList()
                .stream()
                .findAny();
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/propagation/LogRepository.java)

### 서비스

- **MemberService**

    ```java
    @Slf4j
    @Service
    @RequiredArgsConstructor
    public class MemberService {
        
        private final MemberRepository memberRepository;
        private final LogRepository logRepository;
        
        // V1: 예외를 그대로 던짐
        public void joinV1(String username) {
            Member member = new Member(username);
            Log logMessage = new Log(username);
            
            log.info("== memberRepository 호출 시작 ==");
            memberRepository.save(member);
            log.info("== memberRepository 호출 종료 ==");
            
            log.info("== logRepository 호출 시작 ==");
            logRepository.save(logMessage);
            log.info("== logRepository 호출 종료 ==");
        }
        
        // V2: 예외를 잡아서 복구 시도
        public void joinV2(String username) {
            Member member = new Member(username);
            Log logMessage = new Log(username);
            
            log.info("== memberRepository 호출 시작 ==");
            memberRepository.save(member);
            log.info("== memberRepository 호출 종료 ==");
            
            log.info("== logRepository 호출 시작 ==");
            try {
                logRepository.save(logMessage);
            } catch (RuntimeException e) {
                log.info("log 저장에 실패했습니다. logMessage={}", 
                    logMessage.getMessage());
                log.info("정상 흐름 변환");
            }
            log.info("== logRepository 호출 종료 ==");
        }
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/main/java/hello/springtx/propagation/MemberService.java)

<br/><br/>

## 트랜잭션 없는 경우

### 모두 성공하는 경우

- 설정
    - MemberService
        - `@Transactional` 없음
    - MemberRepository
        - `@Transactional` 있음
    - LogRepository
        - `@Transactional` 있음

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: OFF
     * MemberRepository @Transactional: ON
     * LogRepository    @Transactional: ON
     */
    @Test
    void outerTxOff_success() {
        // given
        String username = "outerTxOff_success";
        
        // when
        memberService.joinV1(username);
        
        // then: 모든 데이터가 정상 저장
        assertTrue(memberRepository.find(username).isPresent());
        assertTrue(logRepository.find(username).isPresent());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L35)

- **실행 흐름**

    ![모두 성공하는 경우 실행 흐름](/assets/img/springdb/practice_02_success_flow.png)

    - Member
        - 저장됨
    - Log
        - 저장됨
    - 각각 독립적인 트랜잭션

<br/>

### Log 실패하는 경우

- 설정
    - MemberService
        - `@Transactional` 없음
    - MemberRepository
        - `@Transactional` 있음
    - LogRepository
        - `@Transactional` 있음
        - LogRepository에서 예외 발생

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: OFF
     * MemberRepository @Transactional: ON
     * LogRepository    @Transactional: ON Exception
     */
    @Test
    void outerTxOff_fail() {
        // given
        String username = "로그예외_outerTxOff_fail";
        
        // when
        assertThatThrownBy(() -> memberService.joinV1(username))
            .isInstanceOf(RuntimeException.class);
        
        // then: member는 저장되고, log는 롤백됨
        assertTrue(memberRepository.find(username).isPresent());
        assertTrue(logRepository.find(username).isEmpty());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L52)

- **실행 흐름**

    ![Log 실패하는 경우 실행 흐름](/assets/img/springdb/practice_03_log_fail.png)

- **결과**
    - Member
        - 저장됨
    - Log
        - 롤백됨
    - 데이터 정합성 문제 발생

<br/><br/>

## 단일 트랜잭션

### 하나의 트랜잭션으로 묶기

- 설정
    - `MemberService`
        - `@Transactional` 있음
    - `MemberRepository`
        - `@Transactional` 없음
    - `LogRepository`
        - `@Transactional` 없음

- **코드 변경**

    ```java
    // MemberService
    @Transactional  // 추가
    public void joinV1(String username) {
        Member member = new Member(username);
        Log logMessage = new Log(username);
        
        memberRepository.save(member);
        logRepository.save(logMessage);
    }

    // MemberRepository
    //@Transactional  // 제거
    public void save(Member member) {
        em.persist(member);
    }

    // LogRepository
    //@Transactional  // 제거
    public void save(Log logMessage) {
        em.persist(logMessage);
    }
    ```

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: ON
     * MemberRepository @Transactional: OFF
     * LogRepository    @Transactional: OFF
     */
    @Test
    void singleTx() {
        // given
        String username = "singleTx";
        
        // when
        memberService.joinV1(username);
        
        // then: 모든 데이터가 정상 저장
        assertTrue(memberRepository.find(username).isPresent());
        assertTrue(logRepository.find(username).isPresent());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L70)

- **실행 흐름**

    ![단일 트랜잭션 실행 흐름](/assets/img/springdb/practice_04_single_tx.png)

- **특징**
    - 하나의 물리 트랜잭션
    - 하나의 커넥션 사용
    - 전체가 함께 커밋/롤백
    - 간단하고 명확

<br/>

### 단일 트랜잭션의 한계

![단일 트랜잭션의 한계](/assets/img/springdb/practice_05_single_tx_limit.png)

- **문제**
    - Client A
        - MemberService 전체를 하나의 트랜잭션으로
    - Client B
        - MemberRepository만 단독으로 사용
    - Client C
        - LogRepository만 단독으로 사용

- **해결**
    - 트랜잭션 전파 사용 필요

<br/><br/>

## 전파 커밋

### REQUIRED 전파

- 설정
    - `MemberService`
        - `@Transactional` 있음
    - `MemberRepository`
        - `@Transactional` 있음
    - `LogRepository`
        - `@Transactional` 있음

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: ON
     * MemberRepository @Transactional: ON
     * LogRepository    @Transactional: ON
     */
    @Test
    void outerTxOn_success() {
        // given
        String username = "outerTxOn_success";
        
        // when
        memberService.joinV1(username);
        
        // then: 모든 데이터가 정상 저장
        assertTrue(memberRepository.find(username).isPresent());
        assertTrue(logRepository.find(username).isPresent());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L87)

- **실행 흐름**

    ![REQUIRED 전파 실행 흐름](/assets/img/springdb/practice_06_required_propagation.png)

- **논리/물리 트랜잭션**

    ![논리/물리 트랜잭션](/assets/img/springdb/practice_07_logical_physical_tx.png)

    - 3개의 논리 트랜잭션
    - 1개의 물리 트랜잭션
    - 외부 트랜잭션만 물리 커밋 수행

<br/><br/>

## 전파 롤백

### 내부 트랜잭션 예외 발생

- 설정
    - `MemberService`
        - `@Transactional` 있음
    - `MemberRepository`
        - `@Transactional` 있음
    - `LogRepository`
        - `@Transactional` 있음
        - `LogRepository`에서 예외 발생

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: ON
     * MemberRepository @Transactional: ON
     * LogRepository    @Transactional: ON Exception
     */
    @Test
    void outerTxOn_fail() {
        // given
        String username = "로그예외_outerTxOn_fail";
        
        // when
        assertThatThrownBy(() -> memberService.joinV1(username))
            .isInstanceOf(RuntimeException.class);
        
        // then: 모든 데이터가 롤백됨
        assertTrue(memberRepository.find(username).isEmpty());
        assertTrue(logRepository.find(username).isEmpty());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L104)

- **실행 흐름**

    ![내부 트랜잭션 예외 발생 실행 흐름](/assets/img/springdb/practice_08_inner_exception.png)

- **rollbackOnly 설정**

    ![rollbackOnly 설정 흐름](/assets/img/springdb/practice_09_rollbackonly.png)

- **결과**
    - Member
        - 롤백됨
    - Log
        - 롤백됨
    - 데이터 정합성 유지

<br/><br/>

## 복구 시도 - REQUIRED

### 요구사항 변경

- 새로운 요구사항
    - 로그 저장 실패해도 회원 가입은 유지되어야 함
    - 로그는 나중에 복구 가능

### 복구 시도 코드

- **MemberService.joinV2()**

    ```java
    public void joinV2(String username) {
        Member member = new Member(username);
        Log logMessage = new Log(username);
        
        memberRepository.save(member);
        
        try {
            logRepository.save(logMessage);  // 예외 발생 가능
        } catch (RuntimeException e) {
            log.info("log 저장에 실패했습니다. logMessage={}", 
                logMessage.getMessage());
            log.info("정상 흐름 변환");  // 예외 복구 시도
        }
    }
    ```

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: ON
     * MemberRepository @Transactional: ON
     * LogRepository    @Transactional: ON Exception
     */
    @Test
    void recoverException_fail() {
        // given
        String username = "로그예외_recoverException_fail";
        
        // when
        assertThatThrownBy(() -> memberService.joinV2(username))
            .isInstanceOf(UnexpectedRollbackException.class);  // 예외 발생!
        
        // then: 모든 데이터가 롤백됨
        assertTrue(memberRepository.find(username).isEmpty());
        assertTrue(logRepository.find(username).isEmpty());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L121)

### 실패 흐름

![실패 흐름](/assets/img/springdb/practice_10_fail_flow.png)

### 왜 실패하는가?

![왜 실패하는가](/assets/img/springdb/practice_11_why_fail.png)

- **원칙**
    - 논리 트랜잭션 중 하나라도 롤백되면 전체 물리 트랜잭션은 롤백 됨

- **문제**
    - 내부 트랜잭션이 rollbackOnly 설정
    - 외부 트랜잭션이 커밋 시도
    - 커밋과 롤백 충돌
    - UnexpectedRollbackException 발생

<br/><br/>

## 복구 성공 - REQUIRES_NEW

### 물리 트랜잭션 분리

- 설정
    - MemberService
        - `@Transactional` 있음
    - MemberRepository
        - `@Transactional` 있음
    - LogRepository
        - `@Transactional(propagation = Propagation.REQUIRES_NEW)`

- **코드 변경**

    ```java
    // LogRepository
    @Transactional(propagation = Propagation.REQUIRES_NEW)  // 변경
    public void save(Log logMessage) {
        log.info("log 저장");
        em.persist(logMessage);
        
        if (logMessage.getMessage().contains("로그예외")) {
            log.info("log 저장시 예외 발생");
            throw new RuntimeException("예외 발생");
        }
    }
    ```

- **테스트 코드**

    ```java
    /**
     * MemberService    @Transactional: ON
     * MemberRepository @Transactional: ON
     * LogRepository    @Transactional(REQUIRES_NEW) Exception
     */
    @Test
    void recoverException_success() {
        // given
        String username = "로그예외_recoverException_success";
        
        // when
        memberService.joinV2(username);
        
        // then: member 저장, log 롤백
        assertTrue(memberRepository.find(username).isPresent());
        assertTrue(logRepository.find(username).isEmpty());
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part2/blob/master/springtx/src/test/java/hello/springtx/propagation/MemberServiceTest.java#L138)

### 성공 흐름

![REQUIRES_NEW 성공 흐름](/assets/img/springdb/practice_12_success_flow_new.png)

### 물리 트랜잭션 분리

![물리 트랜잭션 분리](/assets/img/springdb/practice_13_physical_tx_split.png)
- 2개의 물리 트랜잭션
- 2개의 DB 커넥션 동시 사용
- 서로 독립적으로 커밋/롤백
- **결과**
    - Member
        - 저장됨
    - Log
        - 롤백됨
    - 예외
        - 복구됨

<br/><br/>

## REQUIRES_NEW 주의사항

### 커넥션 사용

![커넥션 사용](/assets/img/springdb/practice_14_connection_usage.png)

- **문제점**
    - 커넥션 2개 동시 사용
    - a커넥션 풀 크기 고려 필요
    - 성능 저하 가능성
    - 데드락 위험


<br/><br/>

## 연습 문제

1. 스프링 트랜잭션의 기본 전파(Propagation) 옵션은 무엇일까요?

   a. REQUIRED (기본값)
   
   - `REQUIRED`는 기존 트랜잭션이 있으면 참여하고, 없으면 새로 시작하는 가장 많이 사용되는 기본 옵션임

2. REQUIRED 전파 옵션 사용 시, 외부와 내부 논리 트랜잭션은 물리적 데이터베이스 트랜잭션과 어떻게 관계맺나요?

   a. 외부 트랜잭션이 시작한 하나의 물리 트랜잭션을 함께 사용(참여)합니다.
   
   - `REQUIRED`에서 내부 트랜잭션은 외부가 시작한 물리 트랜잭션에 참여만 하며, 실제 물리 트랜잭션의 커밋과 롤백은 외부 트랜잭션이 관리함

3. REQUIRED 전파 옵션에서 외부 트랜잭션 진행 중 내부 논리 트랜잭션에서 롤백이 발생하면, 전체 물리 트랜잭션의 최종 결과는 무엇일까요?

   a. 전체 물리 트랜잭션이 롤백됩니다.
   
   - 논리 트랜잭션 중 하나라도 롤백되면 `rollbackOnly`가 마크되어, 외부 트랜잭션이 커밋을 시도해도 `UnexpectedRollbackException`이 발생하며 전체가 롤백됨

4. REQUIRES_NEW 전파 옵션이 REQUIRED와 가장 크게 다른 점은 무엇인가요?

   a. 기존 트랜잭션 참여 여부를 무시하고 항상 새로운 물리 트랜잭션을 시작합니다.
   
   - `REQUIRED`는 하나의 물리 트랜잭션으로 묶이지만, `REQUIRES_NEW`는 기존 트랜잭션을 잠시 중단시키고 항상 새로운 물리 트랜잭션을 시작하여 독립적으로 운영됨

5. REQUIRES_NEW 전파 옵션에서 내부 트랜잭션이 롤백될 경우, 이전에 시작된 외부 트랜잭션은 어떻게 될까요?

   a. 외부 트랜잭션은 내부 롤백의 영향을 받지 않고 독립적으로 커밋 또는 롤백될 수 있습니다.
   
   - `REQUIRES_NEW`는 외부와 독립된 물리 트랜잭션을 사용함
   - 따라서 내부에서 롤백이 발생해도 외부 트랜잭션의 성공 여부에는 영향을 주지 않음

<br/><br/>

## 요약 정리

- `REQUIRED` 전파 옵션은 트랜잭션을 하나로 묶어 정합성을 보장하며, `REQUIRES_NEW`는 로그 저장 등 실패해도 메인 로직에 영향을 주지 않아야 하는 경우에 유용함
- `REQUIRED` 내부에서 예외가 발생하면 `rollbackOnly`로 인해 복구가 불가능하지만, `REQUIRES_NEW`를 사용하면 물리 트랜잭션이 분리되어 예외 복구가 가능함
- `REQUIRES_NEW` 사용 시 DB 커넥션이 2개 필요하므로 트래픽이 많은 경우 성능 저하나 커넥션 풀 부족 현상이 발생할 수 있어 주의가 필요함

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
