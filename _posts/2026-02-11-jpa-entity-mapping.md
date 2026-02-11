---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 엔티티 매핑'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-11 15:55:00 +0900
category: [Framework, JPA]
tags: [jpa, entity-mapping, orm, hibernate, primary-key, ddl, annotation]
math: false
mermaid: false
---

# 엔티티 매핑

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 JPA에서 객체와 테이블을 매핑하는 방법, 데이터베이스 스키마 자동 생성 기능, 필드와 컬럼 매핑, 기본 키 생성 전략, 그리고 예제를 통한 설계 패턴을 정리함

<br/><br/>

## 객체와 테이블 매핑

### @Entity 어노테이션

- **기본 사용법**
    - `@Entity`가 붙은 클래스는 JPA가 관리하는 엔티티가 됨
    - JPA를 사용해서 테이블과 매핑할 클래스는 `@Entity` 필수

    ```java
    @Entity
    public class Member {
        @Id
        private Long id;
        private String name;
    }
    ```

- **필수 조건**
    - `public` 또는 `protected` 기본 생성자 필수 (JPA 스펙)
    - `final` 클래스, `enum`, `interface`, `inner` 클래스 사용 불가
    - 저장할 필드에 `final` 사용 불가

    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/ex1-hello-jpa/src/main/java/hellojpa/Member.java)

    ```java
    // 올바른 예
    @Entity
    public class Member {
        
        @Id
        private Long id;
        
        private String name;
        
        // 기본 생성자 필수 (JPA 스펙)
        public Member() {
        }
        
        public Member(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }
    
    // 잘못된 예
    @Entity
    public final class Member {  // final 클래스 X
        
        @Id
        private Long id;
        
        private final String name;  // 필드에 final X
        
        // 기본 생성자 없음 - 오류 발생
    }
    ```

### @Entity 속성

- **name 속성**
    - JPA에서 사용할 엔티티 이름 지정
    - 기본값은 클래스 이름
    - 같은 클래스 이름이 없으면 기본값 사용 권장

    ```java
    @Entity(name = "Member")
    public class Member {
        // ...
    }
    ```

### @Table 어노테이션

- **기본 사용법**
    - 엔티티와 매핑할 테이블 지정
    - [전체 코드](https://github.com/mxxikr/jpa-programming-basic/blob/master/ex1-hello-jpa/src/main/java/hellojpa/Member.java)

    ```java
    @Entity
    @Table(name = "MBR")
    public class Member {
        // ...
    }
    ```

- **주요 속성**
    - `name`
        - 매핑할 테이블 이름 (기본값: 엔티티 이름)
    - `catalog`
        - 데이터베이스 catalog 매핑
    - `schema`
        - 데이터베이스 schema 매핑
    - `uniqueConstraints`
        - DDL 생성 시 유니크 제약 조건 생성

- **유니크 제약조건**

    ```java
    @Entity
    @Table(
        name = "MEMBER",
        uniqueConstraints = {
            @UniqueConstraint(
                name = "NAME_AGE_UNIQUE",
                columnNames = {"NAME", "AGE"}
            )
        }
    )
    public class Member {
        // ...
    }
    ```

<br/><br/>

## 데이터베이스 스키마 자동 생성

### 스키마 자동 생성 기능

- **특징**
    - 애플리케이션 실행 시점에 DDL 자동 생성
    - DB 방언별 적절한 DDL 생성
    - 개발 환경에서만 사용 권장 (운영 서버 사용 금지)

### hibernate.hbm2ddl.auto 옵션

- **설정 방법**

    ```xml
    <property name="hibernate.hbm2ddl.auto" value="create"/>
    ```

- **옵션별 상세 설명**
    - `create`
        - 기존 테이블 삭제 후 다시 생성 (`DROP` + `CREATE`)
    - `create-drop`
        - `create`와 같으나 종료 시점에 테이블 `DROP`
    - `update`
        - 변경분만 반영
    - `validate`
        - 엔티티와 테이블이 정상 매핑되었는지만 확인
    - `none`
        - 사용하지 않음

- **환경별 권장 전략**
    - **로컬 개발**
        - `create` 또는 `update`
    - **테스트 서버**
        - `update` 또는 `validate`
    - **운영 서버**
        - `validate` 또는 `none`
        - 절대 `create`, `create-drop`, `update` 사용 금지
        - `update`는 변경 감지를 위해 락을 걸 수 있어 서비스 중단 위험 존재
        - 운영 환경에서는 DDL을 직접 작성하여 적용하는 것을 권장

### DDL 생성 기능

- **제약조건 추가**

    ```java
    @Entity
    public class Member {
        
        @Id
        private Long id;
        
        // 필수, 10자 초과 X
        @Column(nullable = false, length = 10)
        private String name;
        
        private Integer age;
    }
    ```

    - 생성되는 DDL

        ```sql
        CREATE TABLE Member (
            id BIGINT NOT NULL,
            name VARCHAR(10) NOT NULL,
            age INTEGER,
            PRIMARY KEY (id)
        );
        ```

- **DDL 생성 기능의 특징**
    - DDL 자동 생성 시에만 사용됨
    - JPA 실행 로직에는 영향 없음
    - ex) `@Column(nullable = false, length = 10)`은 DDL에만 적용되고 JPA 실행 시에는 무시됨

<br/><br/>

## 필드와 컬럼 매핑

### 매핑 어노테이션 종류

- **주요 어노테이션**
    - `@Column`
        - 컬럼 매핑
    - `@Temporal`
        - 날짜 타입 매핑
    - `@Enumerated`
        - `enum` 타입 매핑
    - `@Lob`
        - `BLOB`, `CLOB` 매핑
    - `@Transient`
        - 특정 필드를 컬럼에 매핑하지 않음 (매핑 무시)

### 전체 예제 코드

```java
package hellojpa;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Entity
public class Member {
    
    @Id
    private Long id;
    
    @Column(name = "name")
    private String username;
    
    private Integer age;
    
    @Enumerated(EnumType.STRING)
    private RoleType roleType;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastModifiedDate;
    
    @Lob
    private String description;
    
    @Transient
    private Integer temp;
    
    // Getter, Setter...
}
```

### @Column 어노테이션

- **기본 사용법**

    ```java
    @Column(
        name = "name",
        nullable = false,
        length = 10,
        unique = true,
        columnDefinition = "varchar(100) default 'EMPTY'"
    )
    private String username;
    ```

- **주요 속성**
    - `name`
        - 필드와 매핑할 테이블의 컬럼 이름 (기본값: 객체의 필드 이름)
    - `insertable`
        - 등록 가능 여부 (기본값: true)
    - `updatable`
        - 변경 가능 여부 (기본값: true)
    - `nullable`
        - null 허용 여부 (DDL) (기본값: true)
    - `unique`
        - 유니크 제약조건 (DDL)
    - `columnDefinition`
        - 데이터베이스 컬럼 정보 직접 지정 (DDL)
    - `length`
        - 문자 길이 제약조건 (String 타입만, DDL) (기본값: 255)
    - `precision`, `scale`
        - BigDecimal 타입에서 사용 (DDL) (기본값: precision=19, scale=2)

- **상세 속성**

    ```java
    // updatable = false
    @Column(updatable = false)
    private String username;
    
    Member member = new Member();
    member.setUsername("A");
    em.persist(member);
    
    member.setUsername("B");  // UPDATE 안 됨 (updatable = false)
    
    // nullable = false
    @Column(nullable = false)
    private String name;
    // 생성 DDL: name VARCHAR(255) NOT NULL
    
    // columnDefinition
    @Column(columnDefinition = "varchar(100) default 'EMPTY'")
    private String username;
    // 생성 DDL: username VARCHAR(100) DEFAULT 'EMPTY'
    
    // precision, scale
    @Column(precision = 19, scale = 2)
    private BigDecimal balance;
    // 생성 DDL: balance NUMERIC(19, 2)
    ```

### @Enumerated 어노테이션

- **기본 사용법**

    ```java
    public enum RoleType {
        USER, ADMIN
    }
    
    @Entity
    public class Member {
        
        @Id
        private Long id;
        
        @Enumerated(EnumType.STRING)
        private RoleType roleType;
    }
    
    // 사용
    member.setRoleType(RoleType.ADMIN);
    ```

- **속성**
    - `EnumType.ORDINAL`
        - enum 순서를 데이터베이스에 저장 (기본값, **사용 금지**)
    - `EnumType.STRING`
        - enum 이름을 데이터베이스에 저장 (**권장**)

- **ORDINAL 사용 금지 이유**

    ```java
    // 절대 사용 금지
    @Enumerated(EnumType.ORDINAL)
    private RoleType roleType;
    
    // 초기 상태
    public enum RoleType {
        USER,   // 0
        ADMIN   // 1
    }
    
    // DB에 저장
    // USER = 0, ADMIN = 1
    
    // 나중에 enum 추가
    public enum RoleType {
        GUEST,  // 0 (새로 추가)
        USER,   // 1 (순서 변경)
        ADMIN   // 2
    }
    
    // 문제
    // 기존 DB의 0(USER)이 GUEST로 조회됨
    ```

- **STRING 사용 (권장)**

    ```java
    // 항상 STRING 사용
    @Enumerated(EnumType.STRING)
    private RoleType roleType;
    
    // 저장 예
    // DB에 "USER" 문자열로 저장
    
    // 장점
    // - enum 순서가 바뀌어도 안전
    // - DB에서 값 확인 가능
    // - 가독성 좋음
    ```

### @Temporal 어노테이션

- **기본 사용법**

    ```java
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;
    
    @Temporal(TemporalType.DATE)
    private Date birthDate;
        
    @Temporal(TemporalType.TIME)
    private Date loginTime;
    ```

- **타입**
    - `TemporalType.DATE`
        - 날짜 매핑 
        - ex) 2013-10-11
    - `TemporalType.TIME`
        - 시간 매핑 
        - ex) 11:11:11
    - `TemporalType.TIMESTAMP`
        - 날짜 + 시간 매핑
        - ex) 2013-10-11 11:11:11

- **LocalDate, LocalDateTime 사용 (권장)**

    ```java
    // 최신 방식 (Java 8+)
    private LocalDate birthDate;           // DATE
    private LocalDateTime createdDateTime; // TIMESTAMP
    
    // 과거 방식
    @Temporal(TemporalType.DATE)
    private Date birthDate;
    ```

    - LocalDate, LocalDateTime 사용 시 `@Temporal` 생략 가능
    - 하이버네이트가 자동으로 타입 매핑

### @Lob 어노테이션

- **기본 사용법**

    ```java
    @Entity
    public class Member {
        
        @Id
        private Long id;
        
        @Lob
        private String description;  // CLOB
        
        @Lob
        private byte[] image;  // BLOB
    }
    ```

- **매핑 규칙**
    - `CLOB`
        - 문자 타입 (String, char[], java.sql.CLOB)
    - `BLOB`
        - 나머지 타입 (byte[], java.sql.BLOB)
    - `@Lob`에는 지정 가능한 속성 없음

### @Transient 어노테이션

- **기본 사용법**

    ```java
    @Transient
    private Integer temp;
    ```

- **용도**
    - 필드를 데이터베이스에 매핑하지 않음
    - 데이터베이스 저장 X, 조회 X
    - 메모리상에서만 임시로 값 보관

- **사용 예제**

    ```java
    @Entity
    public class Member {
        @Id
        private Long id;
        
        private String firstName;
        private String lastName;
        
        @Transient
        private String fullName;  // 계산 필드
        
        public String getFullName() {
            return firstName + " " + lastName;
        }
    }
    ```

<br/><br/>

## 기본 키 매핑

### 기본 키 매핑 방법

- **직접 할당**
    - `@Id`만 사용
    - 개발자가 직접 ID 값 설정

    ```java
    @Entity
    public class Member {
        
        @Id
        private Long id;
        
        // 사용
        Member member = new Member();
        member.setId(1L);  // 직접 할당
        em.persist(member);
    }
    ```

- **자동 생성 (`@GeneratedValue`)**
    - `IDENTITY`
        - 데이터베이스에 위임 (MySQL의 `AUTO_INCREMENT`)
    - `SEQUENCE`
        - 데이터베이스 시퀀스 오브젝트 사용 (Oracle)
    - `TABLE`
        - 키 생성용 테이블 사용 (모든 DB)
    - `AUTO`
        - 방언에 따라 자동 지정 (기본값)

### IDENTITY 전략

- **특징**
    - 기본 키 생성을 데이터베이스에 위임
    - MySQL, PostgreSQL, SQL Server, DB2에서 사용
    - MySQL의 `AUTO_INCREMENT` 사용

    ```java
    @Entity
    public class Member {
        
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
    }
    ```

- **IDENTITY 전략의 특이점**
    - `em.persist()` 시점에 즉시 INSERT SQL 실행
        - AUTO_INCREMENT는 데이터베이스에 INSERT SQL을 실행해야 ID 값을 알 수 있음
        - 일반적인 JPA는 트랜잭션 커밋 시점에 INSERT SQL 실행
        - IDENTITY 전략만 예외적으로 `persist()` 호출 시점에 즉시 실행

    ```java
    Member member = new Member();
    member.setUsername("A");
    
    System.out.println("=== BEFORE PERSIST ===");
    em.persist(member);  // 이 시점에 INSERT SQL 실행
    System.out.println("member.id = " + member.getId());
    System.out.println("=== AFTER PERSIST ===");
    
    tx.commit();  // 커밋 시점에는 아무것도 안 함
    ```

- **IDENTITY와 쓰기 지연**
    - `persist()` 시점에 즉시 INSERT 실행으로 쓰기 지연 버퍼링 불가능
    - 하지만 한 트랜잭션 내에서 여러 번 `persist()` 호출 가능하며 성능 저하는 미미함

### SEQUENCE 전략

- **기본 사용법**
    - Oracle, PostgreSQL, DB2, H2 데이터베이스에서 사용

    ```java
    @Entity
    @SequenceGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        sequenceName = "MEMBER_SEQ",  // 매핑할 시퀀스 이름
        initialValue = 1,
        allocationSize = 1
    )
    public class Member {
        
        @Id
        @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "MEMBER_SEQ_GENERATOR"
        )
        private Long id;
    }
    ```

- **SEQUENCE 생성**

    ```sql
    CREATE SEQUENCE MEMBER_SEQ START WITH 1 INCREMENT BY 1;
    ```

- **@SequenceGenerator 속성**
    - `name`
        - 식별자 생성기 이름 (필수)
    - `sequenceName`
        - 데이터베이스에 등록되어 있는 시퀀스 이름 (기본값: hibernate_sequence)
    - `initialValue`
        - DDL 생성 시에만 사용됨, 시퀀스 DDL을 생성할 때 처음 시작하는 수 (기본값: 1)
    - `allocationSize`
        - 시퀀스 한 번 호출에 증가하는 수 (성능 최적화에 사용) (기본값: 50)
    - `catalog`, `schema`
        - 데이터베이스 catalog, schema 이름

- **allocationSize 최적화**

    ```java
    @SequenceGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        sequenceName = "MEMBER_SEQ",
        initialValue = 1,
        allocationSize = 50  // 성능 최적화
    )
    ```

    - 동작 방식
        1. 첫 번째 `persist()`
            - DB 시퀀스 1에서 51로 증가 (50 증가)
            - 메모리에서 1에서 50까지 사용
        2. 두 번째 `persist()`
            - DB 조회 안 함
            - 메모리에서 2 사용
        3. 51번째 `persist()`
            - DB 시퀀스 51에서 101로 증가
            - 메모리에서 51에서 100까지 사용
    - 장점
        - DB 시퀀스 호출 횟수 대폭 감소

- **allocationSize 주의사항**
    - DB 시퀀스가 1씩 증가하도록 설정된 경우 `allocationSize`를 반드시 1로 설정

    ```java
    // DB 시퀀스가 1씩 증가하도록 설정된 경우
    CREATE SEQUENCE MEMBER_SEQ INCREMENT BY 1;
    
    // allocationSize를 반드시 1로 설정
    @SequenceGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        sequenceName = "MEMBER_SEQ",
        allocationSize = 1  // 1로 설정
    )
    ```

### TABLE 전략

- **개념**
    - 키 생성 전용 테이블을 만들어서 데이터베이스 시퀀스를 흉내내는 전략
    - 모든 데이터베이스에 적용 가능
    - 성능이 떨어짐

- **테이블 생성**

    ```sql
    CREATE TABLE MY_SEQUENCES (
        sequence_name VARCHAR(255) NOT NULL,
        next_val BIGINT,
        PRIMARY KEY (sequence_name)
    );
    ```

- **사용 예제**

    ```java
    @Entity
    @TableGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        table = "MY_SEQUENCES",
        pkColumnValue = "MEMBER_SEQ",
        allocationSize = 1
    )
    public class Member {
        
        @Id
        @GeneratedValue(
            strategy = GenerationType.TABLE,
            generator = "MEMBER_SEQ_GENERATOR"
        )
        private Long id;
    }
    ```

- **@TableGenerator 속성**
    - `name`
        - 식별자 생성기 이름 (필수)
    - `table`
        - 키 생성 테이블명 (기본값: hibernate_sequences)
    - `pkColumnName`
        - 시퀀스 컬럼명 (기본값: sequence_name)
    - `valueColumnName`
        - 시퀀스 값 컬럼명 (기본값: next_val)
    - `pkColumnValue`
        - 키로 사용할 값 이름 (기본값: 엔티티 이름)
    - `initialValue`
        - 초기 값 (기본값: 0)
    - `allocationSize`
        - 시퀀스 한 번 호출에 증가하는 수 (기본값: 50)
- **장단점**
    - 장점
        - 모든 데이터베이스에 적용 가능
    - 단점
        - 성능이 떨어지며, 테이블을 직접 사용하므로 락 등의 문제 발생 가능

### AUTO 전략

- **기본 사용법**

    ```java
    @Entity
    public class Member {
        
        @Id
        @GeneratedValue(strategy = GenerationType.AUTO)
        private Long id;
    }
    ```

- **특징**
    - 방언에 따라 자동으로 전략 선택
        - ex) Oracle → SEQUENCE, MySQL → IDENTITY
    - 기본값 (생략 가능)

### 권장하는 식별자 전략

- **기본 키 제약 조건**
    - null 아님
    - 유일함
    - 변하면 안 됨

- **자연키와 대리키 비교**
    - **자연키 (Natural Key)**
        - 비즈니스에 의미 있는 키 (주민등록번호, 이메일 등)
        - **권장하지 않음**
    - **대리키 (Surrogate Key)**
        - 비즈니스와 무관한 키 (auto_increment, sequence 등)
        - **권장**



- **권장 전략**

    ```java
    // 좋은 예 (대리키 사용)
    @Entity
    public class Member {
        
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;  // 대리키
        
        private String ssn;  // 일반 필드로 변경
        private String name;
    }
    ```

    - **Long형 + 대리키 + 키 생성 전략**
        - `Long`형
            - 10억이 넘어도 문제없는 충분히 큰 범위
        - 대리키
            - 비즈니스와 무관하여 요구사항 변경에 영향을 받지 않음
        - 키 생성 전략
            - `AUTO_INCREMENT`, `SEQUENCE` 등으로 자동 생성

<br/><br/>

## 실전 예제 - 엔티티 설계

### 도메인 모델 분석

- **요구사항**
    - 회원은 상품을 주문할 수 있음
    - 주문 시 여러 종류의 상품을 선택할 수 있음

- **기능 목록**
    - 회원 기능
        - 회원 등록, 회원 조회
    - 상품 기능
        - 상품 등록, 상품 수정, 상품 조회
    - 주문 기능
        - 상품 주문, 주문 내역 조회, 주문 취소

- **도메인 관계**
    - 회원에서 주문으로의 관계
        - 1대다 관계
    - 주문에서 주문상품으로의 관계
        - 1대다 관계
    - 주문상품에서 상품으로의 관계
        - 다대1 관계

### 테이블 설계

![엔티티 매핑 ERD](/assets/img/jpa/entity_mapping_erd.png)

### 엔티티 코드 (데이터 중심 설계)

- **Member 엔티티**

    ```java
    @Entity
    public class Member {
        
        @Id
        @GeneratedValue
        @Column(name = "MEMBER_ID")
        private Long id;
        
        private String name;
        private String city;
        private String street;
        private String zipcode;
        
        // Getter, Setter
    }
    ```

- **Order 엔티티**

    ```java
    @Entity
    @Table(name = "ORDERS")
    public class Order {
        
        @Id
        @GeneratedValue
        @Column(name = "ORDER_ID")
        private Long id;
        
        @Column(name = "MEMBER_ID")
        private Long memberId;  // 객체 설계가 아님
        
        private LocalDateTime orderDate;
        
        @Enumerated(EnumType.STRING)
        private OrderStatus status;
        
        // Getter, Setter
    }
    
    public enum OrderStatus {
        ORDER, CANCEL
    }
    ```

- **OrderItem 엔티티**

    ```java
    @Entity
    public class OrderItem {
        
        @Id
        @GeneratedValue
        @Column(name = "ORDER_ITEM_ID")
        private Long id;
        
        @Column(name = "ORDER_ID")
        private Long orderId;  // 객체 설계가 아님
        
        @Column(name = "ITEM_ID")
        private Long itemId;  // 객체 설계가 아님
        
        private int orderPrice;
        private int count;
        
        // Getter, Setter
    }
    ```

- **Item 엔티티**

    ```java
    @Entity
    public class Item {
        
        @Id
        @GeneratedValue
        @Column(name = "ITEM_ID")
        private Long id;
        
        private String name;
        private int price;
        private int stockQuantity;
        
        // Getter, Setter
    }
    ```

### 데이터 중심 설계의 문제점

- **문제점**
    - 객체 설계를 테이블 설계에 맞춤
    - 테이블의 외래 키를 객체에 그대로 가져옴
    - 객체 그래프 탐색이 불가능함
    - 참조가 없으므로 UML도 잘못됨

- **외래 키를 그대로 사용**

    ```java
    // 나쁜 예
    @Entity
    public class Order {
        @Id
        private Long id;
        
        private Long memberId;  // 외래 키를 그대로 사용
    }
    
    // 사용 시
    Order order = em.find(Order.class, 1L);
    Long memberId = order.getMemberId();
    Member member = em.find(Member.class, memberId);  // 2번 조회
    ```

- **객체 그래프 탐색 불가**

    ```java
    // 불가능
    Order order = em.find(Order.class, 1L);
    Member member = order.getMember();  // 컴파일 오류
    
    // 객체 지향적 설계라면
    Order order = em.find(Order.class, 1L);
    Member member = order.getMember();  // 객체 그래프 탐색
    ```

- **올바른 설계 (연관관계 매핑)**

    ```java
    // 좋은 예
    @Entity
    public class Order {
        @Id
        private Long id;
        
        @ManyToOne
        @JoinColumn(name = "MEMBER_ID")
        private Member member;  // 객체 참조
        
        // 사용 시
        Order order = em.find(Order.class, 1L);
        Member member = order.getMember();  // 객체 그래프 탐색
    }
    ```

<br/><br/>

## 연습 문제

1. JPA에서 클래스를 엔티티로 매핑하기 위해 `@Entity` 어노테이션을 사용할 때, 해당 클래스가 기본적으로 갖춰야 할 중요한 조건은 무엇일까요?

   a. public 또는 protected 기본 생성자가 있어야 한다

   - JPA 구현체는 객체를 동적으로 생성하고 조작하기 위해 기본 생성자를 사용함
   - 따라서 엔티티 클래스에는 public 또는 protected 접근 제어자를 가진 기본 생성자가 필수임

2. JPA의 데이터베이스 스키마 자동 생성 기능(`hibernate.hbm2ddl.auto`)을 사용할 때, 데이터 손실 및 위험 때문에 운영 환경에서 사용을 가장 피해야 하는 설정은 무엇일까요?

   a. CREATE

   - CREATE, CREATE-DROP, UPDATE 설정은 운영 중인 데이터베이스의 스키마를 변경하거나 삭제할 위험이 큼
   - 운영 환경에서는 스키마 변경을 직접 관리하는 것이 안전함

3. JPA에서 Java Enum 타입을 매핑할 때 `@Enumerated(EnumType.ORDINAL)` 사용이 권장되지 않는 주된 이유는 무엇일까요?

   a. DB에 저장되는 순서 값과 Enum 정의 순서 불일치 시 문제 발생

   - Enum에 새로운 값이 추가되거나 순서가 변경될 경우, DB에 저장된 순번(숫자)과 자바 코드의 Enum 의미가 달라져 데이터 정합성 문제가 발생함
   - `EnumType.STRING` 사용이 안전함

4. JPA 기본 키 생성 전략 중 `@GeneratedValue(strategy = GenerationType.IDENTITY)`를 사용할 때 나타나는 특징적인 동작은 무엇인가요?

   a. `em.persist()` 호출 시점에 즉시 INSERT 쿼리가 실행된다

   - IDENTITY 전략은 ID 생성권을 DB에 위임하므로, ID 값을 얻기 위해 `em.persist()` 시점에 즉시 INSERT 쿼리를 날림
   - 이 때문에 쓰기 지연을 통한 배치 삽입이 어렵다는 특징이 있음

5. 실무 예제에서 초기 엔티티 설계 시 관계형 데이터베이스 테이블의 외래 키(Foreign Key)를 객체의 단순 필드로 직접 매핑했을 때 발생하는 주요 한계는 무엇이었나요?

   a. 객체 그래프 탐색이 어렵거나 불가능하다

   - 단순히 외래 키 값만 필드로 가지고 있으면, 해당 ID로 연관된 다른 객체(예시로 회원 객체)를 지연 또는 즉시 로딩하는 등의 객체 지향적인 탐색(그래프 순회)이 불가능해짐

<br/><br/>

## 요약 정리

- `@Entity` 어노테이션은 JPA가 관리하는 엔티티를 지정하며, 기본 생성자가 필수이고 `final` 클래스, `enum`, `interface`, `inner` 클래스는 엔티티로 사용할 수 없음
- 데이터베이스 스키마 자동 생성 기능은 DDL을 애플리케이스 실행 시점에 자동 생성하지만, 운영 환경에서는 절대 `create`, `create-drop`, `update`를 사용하면 안 되며 `validate` 또는 `none`을 사용해야 함
- `@Column` 어노테이션으로 컬럼 매핑 시 `nullable`, `length`, `unique` 등의 제약 조건을 지정할 수 있으며, DDL 생성 시에만 사용되고 JPA 실행 로직에는 영향을 주지 않음
- `@Enumerated` 어노테이션으로 `enum` 타입을 매핑할 때는 반드시 `EnumType.STRING`을 사용해야 하며, `EnumType.ORDINAL`은 `enum` 순서 변경 시 데이터 정합성 문제가 발생할 수 있어 절대 사용하면 안 됨
- `LocalDate`, `LocalDateTime`을 사용하면 `@Temporal` 어노테이션을 생략할 수 있으며, Java 8 이상에서 권장되는 방식임
- 기본 키 생성 전략은 `IDENTITY`(MySQL), `SEQUENCE`(Oracle), `TABLE`(모든 DB), `AUTO`(방언에 따라 자동) 4가지가 있으며, `Long`형 + 대리키 + 키 생성 전략 조합을 권장함
- `IDENTITY` 전략은 `em.persist()` 호출 시점에 즉시 `INSERT` SQL을 실행하므로 쓰기 지연 버퍼링이 불가능하지만, 트랜잭션 내에서 여러 번 `persist()`를 호출할 수 있어 성능 저하는 크지 않음
- `SEQUENCE` 전략은 `allocationSize`를 활용하여 성능 최적화가 가능하며, DB 시퀀스 호출 횟수를 대폭 감소시킬 수 있음
- 자연키보다 대리키를 사용해야 하며, 비즈니스에 의미 있는 키(주민등록번호, 이메일)는 요구사항 변경 시 문제가 발생할 수 있으므로 `Long`형 대리키 사용을 권장함
- 데이터 중심 설계는 외래 키를 객체에 그대로 가져와 객체 그래프 탐색이 불가능하므로, `@ManyToOne`, `@JoinColumn` 등을 사용한 객체 지향적 설계가 필요함

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
