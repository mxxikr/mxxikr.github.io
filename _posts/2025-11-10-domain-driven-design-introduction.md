---
title: "도메인 주도 설계(DDD)란?"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-11-10 09:00:00 +0900
category:
  - [Software Engineering, Design]
tags:
  - [ddd, domain-driven-design, architecture]
math: false
mermaid: true
---

## 개요

> 이 포스팅은 DDD 시리즈의 두 번째 글입니다. [도메인 스토리텔링(DST)이란?](https://mxxikr.github.io/posts/domain-storytelling-for-ddd/)을 먼저 읽는 것을 권장합니다.

- 이전 포스팅에서 도메인 스토리텔링(DST)을 통해 비즈니스 프로세스를 시각화하는 방법을 다룸
- DST는 DDD를 시작하기 위한 도구 중 하나지만, DDD 자체에 대한 이해가 필요
- 이번 포스팅에서는 DDD의 개념, 전략적/전술적 설계 패턴, 그리고 적용 예시를 정리


<br/><br/>

## 도메인 주도 설계란

### 정의

- 도메인 주도 설계(Domain-Driven Design, DDD)는 복잡한 소프트웨어 개발에서 **도메인(비즈니스 영역)**을 중심에 두고 설계하는 방법론
- Eric Evans가 2003년 출간한 『Domain-Driven Design』에서 처음 제시
- 소프트웨어의 핵심 가치는 비즈니스 도메인 문제를 해결하는 데 있으며, 기술은 이를 구현하는 수단일 뿐이라는 철학

### 핵심 철학

- **도메인 전문가와 개발자의 긴밀한 협업**
  - 비즈니스 지식을 가진 사람과 기술을 가진 사람이 함께 모델을 만들어감
  - 도메인 전문가의 지식이 코드에 직접 반영되어야 함
- **유비쿼터스 언어(Ubiquitous Language)**
  - 팀 전체가 사용하는 공통 언어
  - 회의, 문서, 코드에서 동일한 용어 사용
- **모델과 구현의 긴밀한 연결**
  - 도메인 모델이 코드에 직접적으로 반영
  - 모델이 변경되면 코드도 함께 변경


<br/><br/>

## DDD가 필요한 이유

### 복잡성 관리

- 비즈니스 요구사항이 증가하면서 애플리케이션의 복잡도가 높아지는 경향이 있음
- 단순한 CRUD 중심 개발로는 복잡한 비즈니스 로직을 다루기 어려울 수 있음
- DDD는 도메인 로직을 구조화하는 하나의 방법론을 제시

### 비즈니스와 코드의 괴리 해소

- 전통적인 개발 방식에서는 비즈니스 용어와 코드의 용어가 달라 의사소통에 문제가 발생할 수 있음
- DDD는 유비쿼터스 언어를 통해 이 괴리를 줄이는 것을 목표로 함
- 도메인 전문가와 개발자가 같은 언어로 소통하는 것이 핵심

### 변화에 대한 유연성

- 비즈니스 요구사항은 지속적으로 변화함
- 도메인 중심의 설계는 비즈니스 변화에 대응하기 위한 구조를 제공
- 컨텍스트 경계가 명확하면 한 부분의 변경이 다른 부분에 미치는 영향을 줄일 수 있음


<br/><br/>

## 전략적 설계 (Strategic Design)

- 전략적 설계는 큰 그림을 그리고 시스템의 경계를 정하는 단계

### 유비쿼터스 언어 (Ubiquitous Language)

- **정의**
  - 도메인 전문가와 개발자가 공통으로 사용하는 언어
  - 비즈니스 용어가 그대로 코드의 클래스명, 메서드명으로 사용됨
- **중요성**
  - 의사소통 비용 감소
  - 오해와 누락 최소화
  - 코드 가독성 향상
- ex)
  - `processOrder()` → `placeOrder()` (주문을 처리하는 것이 아니라 접수하는 것)
  - `User` → `Student`, `Instructor` (역할에 따라 명확히 구분)

### 바운디드 컨텍스트 (Bounded Context)

- **정의**
  - 특정 도메인 모델이 유효한 경계
  - 같은 용어라도 컨텍스트에 따라 다른 관점과 책임을 가질 수 있음
    - ex) `Course`는 수강 관리에서는 "가격, 정원", 강의 제공에서는 "영상, 진도율"에 집중
  - 또는 완전히 다른 의미로 사용될 수도 있음
    - ex) `Account`는 은행 컨텍스트에서는 "계좌", 회계 컨텍스트에서는 "계정"
- **특징**
  - 각 컨텍스트는 독립적인 모델 소유
  - 컨텍스트 간 명확한 경계와 통합 방식 정의 필요
- **온라인 강의 플랫폼 시스템 예시**
  - **수강 관리 컨텍스트**
    - `Course`: 수강 신청 가능 여부, 가격, 정원에 관심
  - **강의 제공 컨텍스트**
    - `Course`: 강의 영상, 커리큘럼, 학습 자료, 수료 조건, 진도율에 관심
  - 같은 `Course` 엔티티지만 각 컨텍스트의 관점과 필요에 따라 다른 속성에 집중

### 컨텍스트 맵 (Context Map)

- **정의**
  - 바운디드 컨텍스트 간의 관계를 시각화한 지도
  - 시스템 전체의 아키텍처를 한눈에 파악 가능
- **관계 패턴**
  - **Shared Kernel**
    - 두 팀이 공유하는 도메인 모델의 일부
    - 변경 시 양쪽 합의 필요
  - **Customer-Supplier**
    - 상류(Supplier)와 하류(Customer) 관계
    - 하류 팀의 요구사항을 상류 팀이 반영
  - **Conformist**
    - 하류 팀이 상류 팀의 모델을 그대로 따름
    - 상류 팀과 협상력이 없을 때
  - **Anticorruption Layer**
    - 하류 팀이 상류 팀의 모델로부터 자신을 보호
    - 번역 계층을 두어 독립성 유지
  - **Published Language**
    - 공개된 표준 언어 사용
    - ex) JSON, XML
  - **Separate Ways**
    - 통합하지 않고 완전히 독립적으로 운영


<br/><br/>

## 전술적 설계 (Tactical Design)

- 전술적 설계는 바운디드 컨텍스트 내부를 구현하는 구체적인 패턴

### 엔티티 (Entity)

- **정의**
  - 고유한 식별자를 가진 객체
  - 속성이 변해도 식별자로 동일성 판단
- **특징**
  - 생명주기 동안 연속성 유지
  - 상태 변화 추적 가능
- ex)

    ```java
    public class Student {
        private StudentId id;  // 식별자
        private String name;
        private Email email;
        private EnrollmentStatus status;
        
        // 동일성은 id로 판단
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Student)) return false;
            Student student = (Student) o;
            return id.equals(student.id);
        }
    }
    ```

### 값 객체 (Value Object)

- **정의**
  - 식별자가 없고 속성 값으로만 구별되는 객체
  - 불변(Immutable) 객체로 설계
- **특징**
  - 측정, 수량화, 설명을 위한 객체
  - 교체 가능
- ex)

    ```java
    public class Money {
        private final BigDecimal amount;
        private final Currency currency;
        
        public Money(BigDecimal amount, Currency currency) {
            if (amount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("금액은 음수일 수 없습니다");
            }
            this.amount = amount;
            this.currency = currency;
        }
        
        public Money add(Money other) {
            if (!this.currency.equals(other.currency)) {
                throw new IllegalArgumentException("통화가 다릅니다");
            }
            return new Money(this.amount.add(other.amount), this.currency);
        }
        
        // 불변 객체이므로 setter 없음
    }
    ```

### 애그리게이트 (Aggregate)

- **정의**
  - 관련된 엔티티와 값 객체의 묶음
  - 하나의 트랜잭션 단위
  - 애그리게이트 루트(Root)를 통해서만 외부 접근 가능
- **특징**
  - 불변식(Invariant) 보호
  - 경계 내부의 일관성 보장
  - 다른 애그리게이트는 ID로만 참조
- ex)

    ```java
    // Order 애그리게이트
    public class Order {  // Aggregate Root
        private OrderId id;
        private CustomerId customerId;  // 다른 애그리게이트는 ID로만 참조
        private List<OrderLine> orderLines;  // 애그리게이트 내부 엔티티
        private OrderStatus status;
        private Money totalAmount;
        
        // 외부에서는 Order를 통해서만 OrderLine 추가 가능
        public void addOrderLine(Product product, int quantity) {
            if (status != OrderStatus.PREPARING) {
                throw new IllegalStateException("주문 준비 중에만 상품을 추가할 수 있습니다");
            }
            OrderLine line = new OrderLine(product, quantity);
            orderLines.add(line);
            calculateTotalAmount();  // 불변식 유지
        }
        
        private void calculateTotalAmount() {
            // 모든 주문 항목의 금액을 합산
            Money sum = new Money(BigDecimal.ZERO, Currency.getInstance("KRW"));
            for (OrderLine line : orderLines) {
                sum = sum.add(line.getAmount());
            }
            this.totalAmount = sum;
        }
    }

    class OrderLine {  // 애그리게이트 내부 엔티티
        private Product product;
        private int quantity;
        private Money amount;
        
        public Money getAmount() {
            return amount;
        }
    }
    ```

### 도메인 서비스 (Domain Service)

- **정의**
  - 엔티티나 값 객체에 속하지 않는 도메인 로직
  - 여러 애그리게이트에 걸친 비즈니스 규칙
- **특징**
  - 무상태(Stateless)
  - 도메인 용어로 네이밍
- ex)

    ```java
    public class TransferService {
        public void transfer(Account from, Account to, Money amount) {
            // 두 계좌에 걸친 송금 로직
            if (!from.canWithdraw(amount)) {
                throw new InsufficientBalanceException();
            }
            
            from.withdraw(amount);
            to.deposit(amount);
            
            // 송금 수수료 계산 등 복잡한 비즈니스 규칙
        }
    }
    ```

### 리포지토리 (Repository)

- **정의**
  - 애그리게이트의 영속화를 담당
  - 컬렉션처럼 사용 가능한 인터페이스 제공
- **특징**
  - 애그리게이트 루트 단위로만 생성
  - 도메인 계층의 인터페이스, 인프라 계층의 구현
- ex)

    ```java
    public interface OrderRepository {
        Order findById(OrderId id);
        List<Order> findByCustomerId(CustomerId customerId);
        void save(Order order);
        void delete(Order order);
    }
    ```

### 도메인 이벤트 (Domain Event)

- **정의**
  - 도메인에서 발생한 중요한 사건
  - 과거형으로 네이밍 (OrderPlaced, PaymentCompleted)
- **특징**
  - 이벤트 기반 아키텍처의 핵심
  - 느슨한 결합 실현
- ex)

    ```java
    public class OrderPlaced {
        private final OrderId orderId;
        private final CustomerId customerId;
        private final Money totalAmount;
        private final LocalDateTime occurredOn;
        
        // 불변 객체
    }

    // 이벤트 발행
    public class Order {
        private List<DomainEvent> domainEvents = new ArrayList<>();
        
        public void place() {
            this.status = OrderStatus.PLACED;
            this.domainEvents.add(new OrderPlaced(this.id, this.customerId, this.totalAmount));
        }
    }
    ```


<br/><br/>

## 온라인 강의 플랫폼 설계 예시

- [도메인 스토리텔링(DST)이란?](https://mxxikr.github.io/posts/domain-storytelling-for-ddd/)포스팅에서 다룬 온라인 강의 플랫폼을 예시로 DDD 설계를 적용
- 가상의 시나리오를 통해 DDD의 전략적/전술적 설계가 어떻게 적용되는지 설명

### DST에서 발견한 것들

- **3개의 바운디드 컨텍스트 후보**
    - 수강 관리, 강의 제공, 결제
- **유비쿼터스 언어**
    - 확정 수강, 수강권, 학습 진도, 수료 조건
    - 각 용어의 상세 정의는 [도메인 스토리텔링(DST)이란?](https://mxxikr.github.io/posts/domain-storytelling-for-ddd/)의 '유비쿼터스 언어' 섹션을 참고하세요
- **컨텍스트 간 상호작용**
    - 수강권 정보 전달, 결제 완료 정보 전달

### 전략적 설계 적용

- **바운디드 컨텍스트 정의**

    - **수강 관리 컨텍스트**
        - 핵심 책임: 수강 신청, 결제 처리, 수강권 발급
        - 유비쿼터스 언어: ConfirmedEnrollment (확정 수강), EnrollmentTicket (수강권)
        - 외부 통신: 결제 시스템, 강의 제공 시스템
        
    - **강의 제공 컨텍스트**
        - 핵심 책임: 강의 시청, 학습 진도 관리, 수료 처리
        - 유비쿼터스 언어: LearningProgress (학습 진도), Certificate (수료증)
        - 외부 통신: 수강 관리 시스템
    
    - **결제 컨텍스트**
        - 핵심 책임: 결제 처리 (외부 시스템)
        - Anticorruption Layer 패턴 적용

### 컨텍스트 맵

![image](/assets/img/design/domain/image3.png)

### 전술적 설계 적용

- **수강 관리 컨텍스트**

    - **애그리게이트**
        - `ConfirmedEnrollment` (루트): 확정 수강 정보
            - `EnrollmentTicket` (내부 엔티티): 수강권
            - `StudentId` (ID로 참조)
            - `CourseId` (ID로 참조)
    
    - **도메인 서비스**
        - `EnrollmentService`: 수강 신청 처리
    
    - **도메인 이벤트**
        - `StudentEnrolled`: 학생이 수강 신청 완료
        - `TicketIssued`: 수강권 발급 완료

- **강의 제공 컨텍스트**

    - **애그리게이트**
        - `LearningProgress` (루트): 학습 진도
            - `VideoProgress` (값 객체): 영상 시청 진도
            - `CompletionStatus` (값 객체): 수료 상태
        - `Course` (루트): 강의
            - `Video` (내부 엔티티): 강의 영상
            - `CompletionCriteria` (값 객체): 수료 조건

    - **도메인 서비스**
        - `CertificateIssuanceService`: 수료증 발급

    - **도메인 이벤트**
        - `VideoWatched`: 영상 시청 완료
        - `CertificateIssued`: 수료증 발급 완료

### 컨텍스트 간 통합

- **수강 관리 → 강의 제공 (이벤트 기반 통신)**

- 수강 관리 컨텍스트와 강의 제공 컨텍스트는 직접 참조하지 않고 도메인 이벤트로 통신

- **흐름**
    1. 수강생이 결제를 완료하면 수강 관리 컨텍스트에서 수강권 발급
    2. 수강권 발급 시 `TicketIssued` 이벤트 발생
    3. 강의 제공 컨텍스트가 이벤트를 구독하여 학습 진도 초기화

    ```java
    // 수강 관리 컨텍스트 - 이벤트 발행
    public class ConfirmedEnrollment {  // 확정 수강
        private EnrollmentId id;
        private StudentId studentId;
        private CourseId courseId;
        private EnrollmentTicket ticket;  // 수강권
        
        public void issueTicket() {
            // 수강권 생성
            this.ticket = EnrollmentTicket.create(this.studentId, this.courseId);
            
            // 이벤트 발행 (강의 제공 시스템에 알림)
            this.domainEvents.add(new TicketIssued(this.ticket));
        }
    }

    // 강의 제공 컨텍스트 - 이벤트 구독
    @EventHandler
    public class LearningProgressEventHandler {
        public void on(TicketIssued event) {
            // 수강권이 발급되었다는 이벤트를 받으면
            // 해당 학생의 학습 진도를 초기화
            LearningProgress progress = LearningProgress.initialize(
                event.getStudentId(),
                event.getCourseId()
            );
            progressRepository.save(progress);
        }
    }
    ```

- **이점**
    - 수강 관리 컨텍스트는 강의 제공 컨텍스트의 존재를 몰라도 됨
    - 각 컨텍스트가 독립적으로 변경 가능
    - 새로운 컨텍스트가 추가되어도 기존 코드 수정 불필요


<br/><br/>

## 레이어드 아키텍처와 DDD

### 전통적인 4계층 구조

![image](/assets/img/design/domain/image1.png)

- **Presentation Layer**
  - 사용자 요청 수신 및 응답 반환
- **Application Layer**
  - 유스케이스 흐름 조율
  - 트랜잭션 관리
  - 도메인 로직 호출
- **Domain Layer**
  - 비즈니스 규칙과 로직
- **Infrastructure Layer**
  - 데이터베이스, 메시징, 외부 API 연동

- ex)

    ```java
    // Presentation Layer
    @PostMapping("/enrollments")
    public ResponseEntity<EnrollmentResponse> enroll(@RequestBody EnrollmentRequest request) {
        // Application Layer 호출
    }

    // Application Layer
    public Enrollment enrollStudent(EnrollmentCommand command) {
        // Domain Layer의 비즈니스 로직 조율
        Student student = studentRepository.findById(command.getStudentId());
        Course course = courseRepository.findById(command.getCourseId());
        return student.enroll(course);
    }

    // Domain Layer
    public Enrollment enroll(Course course) {
        // 핵심 비즈니스 규칙
        if (this.isAlreadyEnrolled(course)) {
            throw new AlreadyEnrolledException();
        }
        if (!course.hasAvailableSeats()) {
            throw new CourseFullException();
        }
        return new Enrollment(this.id, course.getId());
    }

    // Infrastructure Layer
    public Student findById(StudentId id) {
        // 영속성 관리
        return jpaRepository.findById(id.getValue())
            .map(StudentEntity::toDomain)
            .orElseThrow(() -> new StudentNotFoundException());
    }
    ```

### 헥사고날 아키텍처 (Ports and Adapters)

- DDD와 잘 어울리는 아키텍처 패턴
- 도메인을 중심에 두고 외부 의존성을 어댑터로 분리하여 기술 독립성 확보 

![image](/assets/img/design/domain/image.png)

- ex)

    ```java
    // Domain Model (순수한 비즈니스 로직)
    public class Student {
        private StudentId id;
        private List<Enrollment> enrollments;
        
        public Enrollment enroll(Course course) {
            // 비즈니스 규칙만 포함, 외부 의존성 없음
            if (this.isAlreadyEnrolled(course)) {
                throw new AlreadyEnrolledException();
            }
            if (!course.hasAvailableSeats()) {
                throw new CourseFullException();
            }
            
            Enrollment enrollment = new Enrollment(this.id, course.getId());
            this.enrollments.add(enrollment);
            return enrollment;
        }
    }

    // Application Service (유스케이스 조율)
    public class EnrollStudentUseCase {
        private final StudentRepository studentRepository; // Port (인터페이스)
        private final CourseRepository courseRepository; // Port (인터페이스)
        private final EventPublisher eventPublisher; // Port (인터페이스)
        
        public EnrollmentResult execute(EnrollCommand command) {
            // 도메인 모델 사용
            Student student = studentRepository.findById(command.getStudentId());
            Course course = courseRepository.findById(command.getCourseId());
            
            Enrollment enrollment = student.enroll(course);
            
            // Port를 통해 외부와 통신
            studentRepository.save(student);
            eventPublisher.publish(new StudentEnrolled(enrollment));
            
            return EnrollmentResult.from(enrollment);
        }
    }

    // ------------- 외부 어댑터들 -------------

    // Web Adapter (입력)
    @RestController
    public class EnrollmentController {
        private final EnrollStudentUseCase enrollStudentUseCase;
        
        @PostMapping("/api/enrollments")
        public ResponseEntity<EnrollmentResponse> enroll(@RequestBody EnrollmentRequest request) {
            EnrollCommand command = request.toCommand();
            EnrollmentResult result = enrollStudentUseCase.execute(command);
            return ResponseEntity.ok(EnrollmentResponse.from(result));
        }
    }

    // DB Adapter (출력 - Repository 구현)
    @Repository
    public class JpaStudentRepository implements StudentRepository {
        private final StudentJpaRepository jpaRepository;
        
        @Override
        public Student findById(StudentId id) {
            return jpaRepository.findById(id.getValue())
                .map(StudentEntity::toDomain)
                .orElseThrow(() -> new StudentNotFoundException());
        }
        
        @Override
        public void save(Student student) {
            StudentEntity entity = StudentEntity.fromDomain(student);
            jpaRepository.save(entity);
        }
    }

    // Message Adapter (출력 - 이벤트 발행)
    @Component
    public class KafkaEventPublisher implements EventPublisher {
        private final KafkaTemplate<String, Object> kafkaTemplate;
        
        @Override
        public void publish(DomainEvent event) {
            kafkaTemplate.send("student-events", event);
        }
    }
    ```

- 차이점
    - **레이어드**
        - 상위 계층이 하위 계층에 의존 (Presentation → Application → Domain → Infrastructure)
    - **헥사고날**
        - 모든 외부 의존성이 Application Core를 향해 의존 (의존성 역전 원칙 적용)
        - Application Core(도메인 + 애플리케이션 로직)는 인터페이스(Port)만 정의
        - Adapter가 Port를 구현하여 구체적인 기술 제공
        - Domain Model은 외부 세계를 전혀 모름
        - Application Service는 Port(인터페이스)만 알고 있음
        - 이를 통해 비즈니스 로직이 기술 세부사항에 의존하지 않게 됨


<br/><br/>

## DDD 적용 단계

### 1단계 - 도메인 이해하기

- **도메인 전문가와 워크숍 진행**
  - 도메인 스토리텔링(DST) 활용
  - 이벤트 스토밍 진행
- **유비쿼터스 언어 정리**
  - 용어 사전 작성
  - 팀 전체가 동일한 용어 사용
- **핵심 도메인 식별**
  - 가장 중요한 비즈니스 가치를 제공하는 영역
  - 여기에 가장 많은 리소스 투입

### 2단계 - 전략적 설계

- **바운디드 컨텍스트 도출**
  - DST에서 발견한 경계 활용
  - 팀 구조, 비즈니스 조직 고려
- **컨텍스트 맵 작성**
  - 컨텍스트 간 관계 정의
  - 통합 전략 수립
- **컨텍스트 우선순위 결정**
  - 핵심 도메인
  - 지원 서브도메인
  - 일반 서브도메인

### 3단계 - 전술적 설계

- **애그리게이트 식별**
  - 트랜잭션 경계 고려
  - 불변식 보호 단위
- **엔티티와 값 객체 구분**
  - 식별자 필요 여부 판단
  - 불변성 고려
- **도메인 서비스 추출**
  - 여러 애그리게이트에 걸친 로직
  - 무상태 서비스
- **리포지토리 정의**
  - 애그리게이트 루트 단위
  - 도메인 계층에 인터페이스 정의

### 4단계 - 반복과 개선

- **지속적인 리팩토링**
  - 비즈니스 변화에 따라 모델 진화
  - 코드와 모델의 일치성 유지
- **도메인 전문가와 정기적 리뷰**
  - 모델이 실제 비즈니스 반영하는지 확인
  - 새로운 인사이트 발견
- **팀 내 지식 공유**
  - 페어 프로그래밍
  - 코드 리뷰
  - 정기적인 모델링 세션


<br/><br/>

## DDD 적용 시 주의사항

### 과도한 설계 지양

- 모든 프로젝트에 DDD가 필요한 것은 아님
- 단순한 CRUD 애플리케이션에는 오버엔지니어링일 수 있음
- 복잡한 비즈니스 로직이 있는 핵심 도메인에 집중

### 기술보다 도메인 우선

- 최신 프레임워크나 기술에 집착하지 말 것
- 도메인 모델이 기술에 종속되지 않도록 주의
- 인프라는 교체 가능해야 함

### 팀 전체의 참여 필요

- 개발자만의 노력으로는 부족
- 도메인 전문가의 적극적 참여 필수

### 점진적 도입

- 한 번에 모든 것을 DDD로 바꾸려 하지 말 것
- 작은 바운디드 컨텍스트부터 시작
- 성공 사례를 만들어 점진적 확대


<br/><br/>

## 다음 단계: 마이크로서비스로의 전환

DDD로 바운디드 컨텍스트를 명확히 정의했다면, 필요에 따라 마이크로서비스 아키텍처로 전환할 수 있습니다.

- 바운디드 컨텍스트는 논리적 경계, 마이크로서비스는 물리적 배포 단위
- 항상 1:1 대응은 아니며, 비즈니스 요구사항, 팀 구조, 배포 전략을 종합적으로 고려
- 모놀리스로 시작하여 바운디드 컨텍스트를 명확히 한 후, 점진적으로 분리하는 것을 권장

> 데이터 분리, 트랜잭션 처리, 서비스 간 통신, Circuit Breaker, CQRS 등 실전 전환 방법은 [DDD와 마이크로서비스 아키텍처](https://mxxikr.github.io/posts/ddd-and-microservices/) 포스팅을 참고하세요.



<br/><br/>

## Reference

- [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
- [Domain-Driven Design Community](https://www.dddcommunity.org/)
