---
title: "DDD와 마이크로서비스 아키텍처"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-11-10 09:00:00 +0900
category:
  - [Software Engineering, Design]
tags:
  - [ddd, microservices, architecture]
math: false
mermaid: true
---

## 개요

> 이 포스팅은 DDD 시리즈의 세 번째 글입니다. [도메인 스토리텔링(DST)이란?](https://mxxikr.github.io/posts/domain-storytelling-for-ddd/)과 [도메인 주도 설계(DDD)란?](https://mxxikr.github.io/posts/domain-driven-design-introduction/)을 먼저 읽는 것을 권장합니다.

- 이전 포스팅에서 도메인 주도 설계(DDD)의 핵심 개념과 전략적/전술적 설계를 다룸
- DDD의 바운디드 컨텍스트는 마이크로서비스 아키텍처의 경계 설정 시 참고할 수 있는 논리적 단위
- 이번 포스팅에서는 DDD로 정의한 바운디드 컨텍스트를 마이크로서비스로 전환하는 방법과 실전 고려사항을 다룸


<br/><br/>

## DDD와 마이크로서비스

- 온라인 강의 플랫폼 예시([도메인 주도 설계(DDD)란?](https://mxxikr.github.io/posts/domain-driven-design-introduction/) 포스팅 참고)에서 3개의 바운디드 컨텍스트가 명확히 구분됨
- 이러한 컨텍스트 경계는 마이크로서비스 아키텍처의 경계 설정 시 참고할 수 있음

### 바운디드 컨텍스트와 마이크로서비스

- **바운디드 컨텍스트**는 논리적인 경계이고 **마이크로서비스**는 물리적인 배포 단위
- 바운디드 컨텍스트는 마이크로서비스의 좋은 경계가 될 수 있음
- 하지만 항상 1:1 대응은 아님

### 1:1 대응이 적절한 경우

- 각 컨텍스트의 독립적 배포가 필요할 때
- 팀이 컨텍스트 단위로 분리되어 있을 때
- 각 컨텍스트의 기술 스택이 다를 때
- 확장성 요구사항이 컨텍스트마다 다를 때

### 1:N 대응이 적절한 경우

- 여러 컨텍스트가 밀접하게 협력해야 할 때
- 분산 트랜잭션 관리의 복잡도가 높을 때
- 팀 규모가 작아 독립적 운영이 어려울 때
- 시스템 초기 단계로 복잡도를 낮춰야 할 때

### 온라인 강의 플랫폼의 마이크로서비스 전환

- 3개의 바운디드 컨텍스트를 독립적인 마이크로서비스로 전환
- 각 서비스는 독립 배포 가능하며 명확한 책임을 가짐

![image](/assets/img/design/domain/image2.png)


<br/><br/>

## 전환 시 고려사항

### 데이터 분리

- **원칙**
  - 각 서비스는 자신의 데이터베이스 소유
  - 다른 컨텍스트의 데이터는 API나 이벤트로만 접근
  
- **적용 예시**

    ```java
    // Enrollment Service의 데이터베이스
    public class ConfirmedEnrollment {
        private EnrollmentId id;
        private StudentId studentId;  // 학생의 ID만 보관
        private CourseId courseId;    // 강의의 ID만 보관
        private EnrollmentTicket ticket;
    }

    // Learning Service의 데이터베이스
    public class LearningProgress {
        private ProgressId id;
        private StudentId studentId;  // 학생의 ID만 보관
        private CourseId courseId;    // 강의의 ID만 보관
        private int completionRate;
    }
    ```

- **주의사항**
  - JOIN 쿼리 불가 → API 조합 패턴이나 CQRS 활용
  - 데이터 중복 허용 (각 서비스의 관점에서 필요한 데이터만 보관)

### 트랜잭션 처리

- **분산 트랜잭션의 문제**
  - 2PC(Two-Phase Commit)는 복잡하고 가용성 저하
  - 마이크로서비스에서는 권장하지 않음

- **이벤트 기반 최종 일관성**
  - 각 서비스는 로컬 트랜잭션만 관리
  - 도메인 이벤트로 다른 서비스에 알림
  - 최종적으로 일관성 달성

    ```java
    // 수강 관리 서비스
    @Transactional
    public class EnrollmentService {
        public void completePayment(PaymentCommand command) {
            // 로컬 트랜잭션: 확정 수강 생성
            ConfirmedEnrollment enrollment = new ConfirmedEnrollment(
                command.getStudentId(),
                command.getCourseId()
            );
            enrollmentRepository.save(enrollment);
            
            // 이벤트 발행
            eventPublisher.publish(new PaymentCompleted(
                enrollment.getId(),
                enrollment.getStudentId(),
                enrollment.getCourseId()
            ));
            // 트랜잭션 커밋
        }
    }

    // 강의 제공 서비스
    @EventListener
    @Transactional
    public class LearningProgressEventHandler {
        public void on(PaymentCompleted event) {
            // 별도의 트랜잭션: 학습 진도 초기화
            LearningProgress progress = LearningProgress.initialize(
                event.getStudentId(),
                event.getCourseId()
            );
            progressRepository.save(progress);
        }
    }
    ```

- **Saga 패턴**
  - 여러 서비스에 걸친 비즈니스 프로세스 관리
  - 각 단계마다 보상 트랜잭션(Compensating Transaction) 정의

    ```java
    // Choreography Saga - 이벤트 기반 조율
    public class EnrollmentSaga {
        // 결제 완료
        @EventListener
        public void onPaymentCompleted(PaymentCompleted event) {
            // 수강권 발급 시도
            try {
                ticketService.issueTicket(event.getEnrollmentId());
                eventPublisher.publish(new TicketIssued(event));
            } catch (Exception e) {
                // 실패 시 보상: 결제 취소
                paymentService.refund(event.getPaymentId());
            }
        }
        
        // 수강권 발급 완료
        @EventListener
        public void onTicketIssued(TicketIssued event) {
            // 학습 진도 초기화 시도
            try {
                learningService.initializeProgress(
                    event.getStudentId(),
                    event.getCourseId()
                );
            } catch (Exception e) {
                // 실패 시 보상: 수강권 취소
                ticketService.cancelTicket(event.getTicketId());
                paymentService.refund(event.getPaymentId());
            }
        }
    }
    ```

### 서비스 간 통신

- **동기 통신 (REST API)**
  - 읽기 작업에 적합
  - 즉각적인 응답이 필요할 때
  - 단순한 데이터 조회

    ```java
    @RestController
    public class EnrollmentController {
        private final CourseServiceClient courseClient;  // Feign Client
        
        @GetMapping("/api/enrollments/{enrollmentId}/details")
        public EnrollmentDetailsResponse getDetails(@PathVariable String enrollmentId) {
            ConfirmedEnrollment enrollment = enrollmentService.findById(enrollmentId);
            
            // 강의 서비스에서 강의 정보 조회 (동기)
            CourseInfo courseInfo = courseClient.getCourseInfo(enrollment.getCourseId());
            
            return EnrollmentDetailsResponse.of(enrollment, courseInfo);
        }
    }
    ```

- **비동기 통신 (도메인 이벤트)**
  - 쓰기 작업에 적합
  - 느슨한 결합 필요
  - 여러 서비스에 동시 알림

    ```java
    // 이벤트 발행
    @Service
    public class EnrollmentService {
        @Transactional
        public void issueTicket(EnrollmentId enrollmentId) {
            ConfirmedEnrollment enrollment = enrollmentRepository.findById(enrollmentId);
            enrollment.issueTicket();
            
            // 이벤트 발행 (비동기)
            eventPublisher.publish(new TicketIssued(
                enrollment.getTicket(),
                enrollment.getStudentId(),
                enrollment.getCourseId()
            ));
        }
    }
    ```

- **통신 패턴 선택 기준**
  - 동기 (REST)
    - 장점: 단순하고 직관적, 즉각 응답
    - 단점: 결합도 높음, 가용성 영향
    - 사용: 조회, 단순 검증
  - 비동기 (Event)
    - 장점: 낮은 결합도, 확장성, 장애 격리
    - 단점: 복잡도 증가, 디버깅 어려움
    - 사용: 상태 변경, 여러 서비스 협력


<br/><br/>

## 언제 마이크로서비스로 전환할까?

### 전환 시기

- **바운디드 컨텍스트가 명확할 때**
  - DDD로 경계를 먼저 정의한 후
  - 각 컨텍스트의 책임이 분명히 구분됨
  
- **독립적인 배포가 필요할 때**
  - 각 컨텍스트의 배포 주기가 다를 때
  - 부분적 장애가 전체 시스템에 영향을 주지 않아야 할 때
  
- **팀이 준비되었을 때**
  - 분산 시스템 운영 역량 확보
  - 모니터링, 추적 인프라 구축
  - DevOps 문화 정착

### 모놀리스에서 시작하는 전략

- **단계별 접근**
  1. 모놀리스로 시작하여 바운디드 컨텍스트 명확화
  2. 모듈형 모놀리스(Modular Monolith) 구조 적용
  3. 컨텍스트별 독립적 배포 필요성 검토
  4. 우선순위 높은 컨텍스트부터 분리

- **모듈형 모놀리스 예시**

    ```
    // 단일 애플리케이션이지만 패키지로 컨텍스트 분리
    com.example.education/
    ├── enrollment/           // 수강 관리 컨텍스트
    │   ├── domain/
    │   ├── application/
    │   └── infrastructure/
    ├── learning/             // 강의 제공 컨텍스트
    │   ├── domain/
    │   ├── application/
    │   └── infrastructure/
    └── shared/               // 공유 커널
        └── event/
    
    // 컨텍스트 간 의존성 규칙 적용
    // enrollment는 learning을 직접 참조하지 않음
    // 이벤트나 인터페이스를 통해서만 통신
    ```


<br/><br/>

## 실전 적용 패턴

### API Gateway 패턴

- 클라이언트와 마이크로서비스 사이의 단일 진입점
- 라우팅, 인증, 응답 조합 등의 역할

![image](/assets/img/design/domain/image4.png)

### Circuit Breaker 패턴

- 서비스 장애 전파 방지
- 일정 횟수 실패 시 빠른 실패(Fail Fast)로 전환

    ```java
    @Service
    public class EnrollmentService {
        @CircuitBreaker(name = "learningService", fallbackMethod = "getDefaultProgress")
        public LearningProgressDTO getLearningProgress(StudentId studentId, CourseId courseId) {
            // Learning Service 호출
            return learningServiceClient.getProgress(studentId, courseId);
        }
        
        // Circuit이 열렸을 때 대체 메서드
        private LearningProgressDTO getDefaultProgress(StudentId studentId, CourseId courseId, Exception ex) {
            return LearningProgressDTO.notAvailable();
        }
    }
    ```

### CQRS (Command Query Responsibility Segregation)

- 명령(쓰기)과 조회(읽기) 모델 분리
- 마이크로서비스 환경에서 조회 성능 향상

    ```java
    // Command Model (쓰기) - Enrollment Service
    @Service
    public class EnrollmentCommandService {
        @Transactional
        public void enrollStudent(EnrollCommand command) {
            ConfirmedEnrollment enrollment = new ConfirmedEnrollment(
                command.getStudentId(),
                command.getCourseId()
            );
            enrollmentRepository.save(enrollment);
            
            eventPublisher.publish(new StudentEnrolled(enrollment));
        }
    }

    // Query Model (읽기) - 별도의 읽기 전용 데이터베이스
    @Service
    public class EnrollmentQueryService {
        private final EnrollmentReadRepository readRepository;
        
        // 여러 서비스의 데이터를 미리 조합해둔 읽기 모델 조회
        public EnrollmentDetailsDTO getEnrollmentDetails(EnrollmentId id) {
            return readRepository.findDetailsById(id);
        }
    }

    // 이벤트 핸들러가 읽기 모델 동기화
    @EventListener
    public class EnrollmentReadModelUpdater {
        public void on(StudentEnrolled event) {
            // 읽기 모델 업데이트 (비정규화된 데이터)
            EnrollmentDetailsReadModel readModel = new EnrollmentDetailsReadModel(
                event.getEnrollmentId(),
                event.getStudentName(),
                event.getCourseName(),
                event.getEnrollmentDate()
            );
            readRepository.save(readModel);
        }
    }
    ```


<br/><br/>

## 주의사항

### 적절한 서비스 크기 유지

- 너무 작게 쪼개면 문제
  - 분산 트랜잭션 증가
  - 네트워크 호출 오버헤드
  - 운영 복잡도 증가
  
- 적절한 크기 판단 기준
  - 단일 팀이 관리 가능한 규모
  - 명확한 비즈니스 경계
  - 독립적 배포의 실질적 이점

### 비즈니스 경계 우선

- 기술적 이유보다 비즈니스 경계를 먼저 고려
- "데이터베이스 분리"가 목적이 아님
- "비즈니스 변화에 독립적으로 대응"이 목적

### 점진적 접근

- 한 번에 모든 것을 마이크로서비스로 전환하지 말 것
- 모놀리스로 시작하여 바운디드 컨텍스트를 명확히 한 후
- 필요에 따라 점진적으로 분리하는 것을 권장

### 인프라 준비

- **필수 인프라**
  - 서비스 디스커버리 (Eureka, Consul)
  - API Gateway (Spring Cloud Gateway, Kong)
  - 분산 추적 (Zipkin, Jaeger)
  - 중앙 로깅 (ELK Stack, Splunk)
  - 서킷 브레이커 (Resilience4j, Hystrix)
  - 메시지 브로커 (Kafka, RabbitMQ)

- **관찰 가능성(Observability)**
  - Metrics: 각 서비스의 성능 지표
  - Logging: 중앙 집중식 로그 관리
  - Tracing: 요청 흐름 추적


<br/><br/>

## 정리

### 핵심 원칙

- DDD의 바운디드 컨텍스트는 마이크로서비스의 좋은 경계가 될 수 있음
- 하지만 항상 1:1 대응은 아니며, 비즈니스 요구사항과 팀 상황을 고려해야 함
- 바운디드 컨텍스트는 논리적 경계, 마이크로서비스는 물리적 배포 단위

### 실전 적용 시 고려사항

- **전환 시기**
  - 바운디드 컨텍스트가 명확히 정의된 후
  - 독립적 배포의 실질적 이점이 있을 때
  - 팀이 분산 시스템 운영 역량을 갖췄을 때

- **전환 전략**
  - 모놀리스로 시작하여 점진적으로 전환
  - 기술보다 비즈니스 경계를 우선하여 결정
  - 우선순위 높은 컨텍스트부터 분리

- **필수 준비사항**
  - 인프라: 모니터링, 로깅, 추적 시스템
  - 통신: 동기/비동기 통신 전략
  - 데이터: 서비스별 데이터베이스 분리 방안
  - 트랜잭션: Saga 패턴 등 분산 트랜잭션 처리


<br/><br/>

## Reference

- [Microservices Patterns - Chris Richardson](https://microservices.io/patterns/index.html)
- [Building Microservices - Sam Newman](https://samnewman.io/books/building_microservices/)
- [Domain-Driven Design Distilled - Vaughn Vernon](https://www.amazon.com/Domain-Driven-Design-Distilled-Vaughn-Vernon/dp/0134434420)

