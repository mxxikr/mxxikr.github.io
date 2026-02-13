---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 값 타입'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-13 19:00:00 +0900
category: [Framework, JPA]
tags: [jpa, value-type, embedded-type, immutable-object, collection-value-type, orm]
math: false
mermaid: false
---

# 값 타입 (Value Type)

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 JPA의 데이터 타입 분류와 값 타입, 임베디드 타입, 값 타입 컬렉션 등 주요 개념을 정리함

<br/><br/>

## 기본값 타입

### JPA의 데이터 타입 분류

![jpa-value-type-1](/assets/img/jpa/jpa-value-type-1.png)

- **엔티티 타입과 값 타입**

    | 구분 | 엔티티 타입 | 값 타입 |
    |------|------------|---------|
    | 정의 | `@Entity`로 정의하는 객체 | `int`, `Integer`, `String` 같은 단순 값 |
    | 식별자 | 있음 | 없음 |
    | 추적 | 데이터가 변해도 식별자로 추적 가능 | 값만 있으므로 변경 시 추적 불가 |
    | 예시 | 회원의 키/나이 변경해도 같은 회원 | 숫자 100이 200으로 변경되면 완전히 다른 값 |

### 값 타입의 분류

![jpa-value-type-2](/assets/img/jpa/jpa-value-type-2.png)

- **기본값 타입**

    - **특징**
        - 자바 기본 타입 (`int`, `double`)
        - 래퍼 클래스 (`Integer`, `Long`)
        - `String`
    
    - **생명주기**
        
        ```java
        @Entity
        public class Member {
            @Id
            private Long id;
            
            private String name; // 기본값 타입
            private int age;     // 기본값 타입
        }
        ```
        
        - 생명주기를 엔티티에 의존함
        - 회원을 삭제하면 이름, 나이 필드도 함께 삭제됨
    
    - **공유 금지**
        - 값 타입은 공유하면 안 됨
        - ex) 회원 이름 변경 시 다른 회원의 이름도 함께 변경되면 안 됨

### 자바 기본 타입의 안전성

- **기본 타입 (Primitive Type)**

    ```java
    int a = 10;
    int b = a;  // 값을 복사
    b = 20;
    
    System.out.println(a);  // 10 (변경 안됨)
    System.out.println(b);  // 20
    ```

    - **특징**
        - `int`, `double` 같은 기본 타입은 **절대 공유되지 않음**
        - 항상 값을 복사함

- **참조 타입 (Reference Type)**

    ```java
    Integer a = new Integer(10);
    Integer b = a;  // 참조를 전달
    
    // Integer는 불변 객체라서 안전
    ```

    - **특징**
        - `Integer`, `String` 같은 래퍼 클래스는 공유 가능한 객체
        - 하지만 **변경 불가능**(Immutable)하므로 안전함

<br/><br/>

## 임베디드 타입 (복합 값 타입)

### 임베디드 타입이란

- 새로운 값 타입을 직접 정의할 수 있음

- JPA에서는 **임베디드 타입**(Embedded Type)이라 함
- 주로 기본 값 타입을 모아서 만들기 때문에 **복합 값 타입**이라고도 함
- `int`, `String`과 같은 값 타입임

### 임베디드 타입의 필요성

- **Before**
    - 평면적인 구조

    ![jpa-value-type-3](/assets/img/jpa/jpa-value-type-3.png)

    - **문제점**
        - 응집력 없는 필드들
        - 비즈니스 의미 불명확
        - 재사용 불가

- **After**
    - 의미 있는 구조

    ![jpa-value-type-4](/assets/img/jpa/jpa-value-type-4.png)

    - **장점**
        - 높은 응집도
        - 명확한 비즈니스 의미
        - 재사용 가능
        - 의미 있는 메서드 추가 가능

### 임베디드 타입 사용법

- **어노테이션**

    | 어노테이션 | 위치 | 설명 |
    |-----------|------|------|
    | `@Embeddable` | 값 타입 정의 클래스 | 값 타입을 정의하는 곳 |
    | `@Embedded` | 엔티티에서 사용하는 필드 | 값 타입을 사용하는 곳 |

- **구현 예제**

    - **값 타입 정의 (@Embeddable)**

        ```java
        @Embeddable
        public class Period {
            private LocalDate startDate;
            private LocalDate endDate;
            
            // 기본 생성자 필수
            protected Period() {
            }
            
            public Period(LocalDate startDate, LocalDate endDate) {
                this.startDate = startDate;
                this.endDate = endDate;
            }
            
            // 의미 있는 메서드
            public boolean isWork() {
                // 근무 기간인지 체크하는 비즈니스 로직
                return LocalDate.now().isAfter(startDate) 
                    && LocalDate.now().isBefore(endDate);
            }
        }
        ```
        ```java
        @Embeddable
        public class Address {
            private String city;
            private String street;
            private String zipcode;
            
            protected Address() {
            }
            
            public Address(String city, String street, String zipcode) {
                this.city = city;
                this.street = street;
                this.zipcode = zipcode;
            }
            
            public String fullAddress() {
                return zipcode + " " + city + " " + street;
            }
        }
        ```

    - **엔티티에서 사용 (@Embedded)**

        ```java
        @Entity
        public class Member {
            @Id
            @GeneratedValue
            private Long id;
            
            private String name;
            
            @Embedded
            private Period workPeriod;
            
            @Embedded
            private Address homeAddress;
        }
        ```

### 임베디드 타입과 테이블 매핑

![jpa-value-type-5](/assets/img/jpa/jpa-value-type-5.png)

- **테이블 구조**
    ```sql
    CREATE TABLE MEMBER (
        ID BIGINT PRIMARY KEY,
        NAME VARCHAR(255),
        -- Period 필드들
        START_DATE DATE,
        END_DATE DATE,
        -- Address 필드들
        CITY VARCHAR(255),
        STREET VARCHAR(255),
        ZIPCODE VARCHAR(255)
    );
    ```

- **참고사항**
    - **임베디드 타입은 엔티티의 값일 뿐임**
    - 임베디드 타입 사용 전과 후에 **매핑 테이블은 동일함**
    - 객체와 테이블을 **세밀하게 매핑** 가능
    - 잘 설계한 ORM은 클래스 수가 테이블 수보다 많음

### 임베디드 타입과 연관관계

- 임베디드 타입은 다른 임베디드 타입이나 엔티티를 참조할 수 있음

![jpa-value-type-6](/assets/img/jpa/jpa-value-type-6.png)

- **코드 예시**

    ```java
    @Embeddable
    public class Address {
        private String city;
        private String street;
        
        @Embedded
        private Zipcode zipcode;  // 임베디드 타입 포함
    }
    
    @Embeddable
    public class Zipcode {
        private String code;
        private String plus4;
    }
    
    @Embeddable
    public class PhoneNumber {
        private String areaCode;
        private String localNumber;
        
        @ManyToOne
        private PhoneEntity phoneEntity;  // 엔티티 참조 가능
    }
    ```

### @AttributeOverride 속성 재정의

- **문제 상황**
    - 한 엔티티에서 같은 값 타입을 여러 번 사용하면 컬럼명이 중복됨

    ```java
    @Entity
    public class Member {
        @Embedded
        private Address homeAddress;
        
        @Embedded
        private Address workAddress;  // 컬럼명 중복 에러 발생
    }
    ```

- **해결 방법**

    ```java
    @Entity
    public class Member {
        @Embedded
        private Address homeAddress;
        
        @Embedded
        @AttributeOverrides({
            @AttributeOverride(name = "city", 
                              column = @Column(name = "WORK_CITY")),
            @AttributeOverride(name = "street", 
                              column = @Column(name = "WORK_STREET")),
            @AttributeOverride(name = "zipcode", 
                              column = @Column(name = "WORK_ZIPCODE"))
        })
        private Address workAddress;
    }
    ```

- **생성되는 테이블**
    ```sql
    CREATE TABLE MEMBER (
        ID BIGINT PRIMARY KEY,
        -- homeAddress
        CITY VARCHAR(255),
        STREET VARCHAR(255),
        ZIPCODE VARCHAR(255),
        -- workAddress
        WORK_CITY VARCHAR(255),
        WORK_STREET VARCHAR(255),
        WORK_ZIPCODE VARCHAR(255)
    );
    ```

### 임베디드 타입과 null

```java
Member member = new Member();
member.setHomeAddress(null);
em.persist(member);
```

- **결과**
    - 임베디드 타입의 값이 `null`이면 매핑한 컬럼 값은 **모두 null**이 됨

    ```sql
    INSERT INTO MEMBER 
    VALUES (1, NULL, NULL, NULL);
    -- city, street, zipcode 모두 null
    ```

<br/><br/>

## 값 타입과 불변 객체

### 값 타입 공유 참조의 위험성

- **문제 상황**

    ```java
    Address address = new Address("OldCity", "Street", "10000");
    
    Member member1 = new Member();
    member1.setHomeAddress(address);
    em.persist(member1);
    
    Member member2 = new Member();
    member2.setHomeAddress(address);  // 같은 인스턴스 공유
    em.persist(member2);
    
    // 회원1의 주소만 변경하려 했지만
    member1.getHomeAddress().setCity("NewCity");
    ```

    - **실행 결과**
        ```sql
        -- 회원1, 회원2 모두 업데이트됨
        UPDATE MEMBER SET CITY='NewCity' WHERE ID=1;
        UPDATE MEMBER SET CITY='NewCity' WHERE ID=2;
        ```

    - **문제점**
        - 임베디드 타입을 여러 엔티티에서 공유하면 위험함
        - **부작용(Side Effect)** 발생

### 값 타입 복사

- **올바른 방법**

    ```java
    Address address = new Address("OldCity", "Street", "10000");
    
    Member member1 = new Member();
    member1.setHomeAddress(address);
    em.persist(member1);
    
    // 값을 복사해서 사용
    Address copyAddress = new Address(
        address.getCity(),
        address.getStreet(),
        address.getZipcode()
    );
    
    Member member2 = new Member();
    member2.setHomeAddress(copyAddress);
    em.persist(member2);
    
    // 이제 회원1만 변경됨
    member1.getHomeAddress().setCity("NewCity");
    ```

### 객체 타입의 한계

- **문제**
    - 참조 값 복사를 막을 방법이 없음

    ```java
    // 기본 타입 (Primitive Type)
    int a = 10;
    int b = a;  // 값을 복사
    b = 4;
    // a = 10, b = 4 (독립적)
    
    // 객체 타입 (Reference Type)
    Address a = new Address("Old");
    Address b = a;  // 참조를 전달
    b.setCity("New");
    // a와 b 모두 "New" (공유됨)
    ```

- **한계**
    - 항상 값을 복사해서 사용하면 공유 참조 부작용 피할 수 있음
    - 하지만 임베디드 타입은 **객체 타입**임
    - 자바 기본 타입이 아니므로 **참조 값 대입을 막을 방법이 없음**
    - **객체의 공유 참조는 피할 수 없음**

### 불변 객체 (Immutable Object)

- **해결책**
    - 객체를 수정할 수 없게 만들기

    ![jpa-value-type-7](/assets/img/jpa/jpa-value-type-7.png)

- **불변 객체**
    - 생성 시점 이후 **절대 값을 변경할 수 없는** 객체
    - 생성자로만 값을 설정
    - **Setter를 만들지 않음** (또는 private)

- **구현**

    ```java
    @Embeddable
    public class Address {
        private String city;
        private String street;
        private String zipcode;
        
        // 기본 생성자
        protected Address() {
        }
        
        // 생성자로만 값 설정
        public Address(String city, String street, String zipcode) {
            this.city = city;
            this.street = street;
            this.zipcode = zipcode;
        }
        
        // Getter만 제공
        public String getCity() {
            return city;
        }
        
        // Setter 없음
    }
    ```

- **사용**

    ```java
    Address address = new Address("OldCity", "Street", "10000");
    
    // 값 변경 불가
    // address.setCity("NewCity");  // 컴파일 에러
    
    // 새로운 객체 생성
    Address newAddress = new Address("NewCity", "Street", "10000");
    member.setHomeAddress(newAddress);
    ```

<br/><br/>

## 값 타입의 비교

### 동일성과 동등성

```java
int a = 10;
int b = 10;
System.out.println(a == b);  // true

Address addr1 = new Address("서울시", "강남구", "12345");
Address addr2 = new Address("서울시", "강남구", "12345");
System.out.println(addr1 == addr2);  // false (다른 인스턴스)
```

- **값 타입**
    - 인스턴스가 달라도 그 안에 **값이 같으면 같은 것**으로 봐야 함

### 비교 방법

| 비교 방법 | 영문 | 연산자/메서드 | 설명 |
|----------|------|---------------|------|
| 동일성 비교 | Identity | `==` | 인스턴스의 **참조 값** 비교 |
| 동등성 비교 | Equivalence | `equals()` | 인스턴스의 **값** 비교 |

### equals() 재정의

- **값 타입의 equals() 재정의**

    ```java
    @Embeddable
    public class Address {
        private String city;
        private String street;
        private String zipcode;
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            
            Address address = (Address) o;
            return Objects.equals(city, address.city) &&
                   Objects.equals(street, address.street) &&
                   Objects.equals(zipcode, address.zipcode);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(city, street, zipcode);
        }
    }
    ```

- **사용**

    ```java
    Address addr1 = new Address("서울시", "강남구", "12345");
    Address addr2 = new Address("서울시", "강남구", "12345");
    
    System.out.println(addr1 == addr2);        // false (동일성)
    System.out.println(addr1.equals(addr2));   // true (동등성)
    ```

- **주의사항**
    - **모든 필드**를 사용해서 비교
    - `equals()`를 재정의하면 **`hashCode()`도 재정의** 필수
    - IDE 자동 생성 기능 활용 권장

<br/><br/>

## 값 타입 컬렉션

### 값 타입 컬렉션이란?

- **값 타입을 하나 이상 저장**할 때 사용함

![jpa-value-type-8](/assets/img/jpa/jpa-value-type-8.png)

### 테이블 매핑

- **문제**
    - 데이터베이스는 컬렉션을 같은 테이블에 저장할 수 없음
    - **별도의 테이블이 필요함**

    ```sql
    -- Member 테이블
    CREATE TABLE MEMBER (
        ID BIGINT PRIMARY KEY,
        USERNAME VARCHAR(255)
    );
    
    -- FavoriteFood 컬렉션 테이블
    CREATE TABLE FAVORITE_FOOD (
        MEMBER_ID BIGINT,
        FOOD_NAME VARCHAR(255),
        PRIMARY KEY (MEMBER_ID, FOOD_NAME),
        FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(ID)
    );
    
    -- Address 컬렉션 테이블
    CREATE TABLE ADDRESS (
        MEMBER_ID BIGINT,
        CITY VARCHAR(255),
        STREET VARCHAR(255),
        ZIPCODE VARCHAR(255),
        PRIMARY KEY (MEMBER_ID, CITY, STREET, ZIPCODE),
        FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(ID)
    );
    ```

### 값 타입 컬렉션 사용

- **어노테이션**

    ```java
    @Entity
    public class Member {
        @Id
        @GeneratedValue
        private Long id;
        
        private String username;
        
        // 기본값 타입 컬렉션
        @ElementCollection
        @CollectionTable(
            name = "FAVORITE_FOOD",
            joinColumns = @JoinColumn(name = "MEMBER_ID")
        )
        @Column(name = "FOOD_NAME")
        private Set<String> favoriteFoods = new HashSet<>();
        
        // 임베디드 타입 컬렉션
        @ElementCollection
        @CollectionTable(
            name = "ADDRESS",
            joinColumns = @JoinColumn(name = "MEMBER_ID")
        )
        private List<Address> addressHistory = new ArrayList<>();
    }
    ```

### 값 타입 컬렉션 저장

```java
Member member = new Member();
member.setUsername("member1");

// 임베디드 값 타입
member.setHomeAddress(new Address("Seoul", "Street", "10000"));

// 기본값 타입 컬렉션
member.getFavoriteFoods().add("치킨");
member.getFavoriteFoods().add("피자");
member.getFavoriteFoods().add("족발");

// 임베디드 타입 컬렉션
member.getAddressHistory().add(new Address("Old1", "Street", "10001"));
member.getAddressHistory().add(new Address("Old2", "Street", "10002"));

em.persist(member);  // member만 persist
```

- **실행 쿼리**
    ```sql
    -- Member INSERT
    INSERT INTO MEMBER (ID, USERNAME) VALUES (1, 'member1');
    
    -- FavoriteFood INSERT (3개)
    INSERT INTO FAVORITE_FOOD (MEMBER_ID, FOOD_NAME) VALUES (1, '치킨');
    INSERT INTO FAVORITE_FOOD (MEMBER_ID, FOOD_NAME) VALUES (1, '피자');
    INSERT INTO FAVORITE_FOOD (MEMBER_ID, FOOD_NAME) VALUES (1, '족발');
    
    -- Address INSERT (2개)
    INSERT INTO ADDRESS (MEMBER_ID, CITY, STREET, ZIPCODE) 
    VALUES (1, 'Old1', 'Street', '10001');
    INSERT INTO ADDRESS (MEMBER_ID, CITY, STREET, ZIPCODE) 
    VALUES (1, 'Old2', 'Street', '10002');
    ```

### 값 타입 컬렉션 조회

```java
Member findMember = em.find(Member.class, member.getId());

// 값 타입 컬렉션은 지연 로딩 (LAZY)
List<Address> addressHistory = findMember.getAddressHistory();
for (Address address : addressHistory) {
    System.out.println("address = " + address.getCity());
}
```

- **실행 쿼리**
    ```sql
    -- Member 조회 (즉시 로딩)
    SELECT * FROM MEMBER WHERE ID = 1;
    
    -- Address 컬렉션 조회 (지연 로딩 - 실제 사용 시점)
    SELECT * FROM ADDRESS WHERE MEMBER_ID = 1;
    ```

- **특징**
    - 값 타입 컬렉션도 **지연 로딩 전략** 사용
    - `fetch = FetchType.LAZY`가 기본

### 값 타입 컬렉션 수정

- **기본값 타입 컬렉션 수정**

    ```java
    Member member = em.find(Member.class, 1L);
    
    // 치킨 → 한식
    member.getFavoriteFoods().remove("치킨");
    member.getFavoriteFoods().add("한식");
    ```

- **임베디드 타입 컬렉션 수정**

    ```java
    // 값 타입은 불변이어야 함
    // member.getAddressHistory().get(0).setCity("NewCity");
    
    // 삭제 후 추가
    member.getAddressHistory().remove(
        new Address("Old1", "Street", "10001")
    );
    member.getAddressHistory().add(
        new Address("NewCity", "Street", "10001")
    );
    ```

    - **실행 쿼리**
        ```sql
        -- 모든 데이터 삭제
        DELETE FROM ADDRESS WHERE MEMBER_ID = 1;
        
        -- 남은 데이터 다시 INSERT
        INSERT INTO ADDRESS (MEMBER_ID, CITY, STREET, ZIPCODE) 
        VALUES (1, 'Old2', 'Street', '10002');
        INSERT INTO ADDRESS (MEMBER_ID, CITY, STREET, ZIPCODE) 
        VALUES (1, 'NewCity', 'Street', '10001');
        ```

### 값 타입 컬렉션의 제약사항

- **문제점**

    - **식별자 개념이 없음**
       - 값 타입은 엔티티와 다르게 식별자 개념 없음
       - 값 변경 시 추적 어려움
    
    - **변경 시 모두 삭제 후 재저장**
       - 값 타입 컬렉션 변경 시 주인 엔티티와 연관된 **모든 데이터 삭제** 후 현재 값을 **모두 다시 저장**
    
    - **복합 키 필수**
       - 모든 컬럼을 묶어서 기본 키 구성
       - `null` 입력 불가
       - 중복 저장 불가

### 값 타입 컬렉션 대안

- **값 타입 컬렉션 사용 (비권장)**

    ```java
    @Entity
    public class Member {
        @ElementCollection
        @CollectionTable(name = "ADDRESS")
        private List<Address> addressHistory = new ArrayList<>();
    }
    ```

- **일대다 관계 + 엔티티 사용 (권장)**

    ```java
    @Entity
    public class Member {
        @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
        @JoinColumn(name = "MEMBER_ID")
        private List<AddressEntity> addressHistory = new ArrayList<>();
    }
    
    @Entity
    @Table(name = "ADDRESS")
    public class AddressEntity {
        @Id
        @GeneratedValue
        private Long id;  // 식별자 추가
        
        @Embedded
        private Address address;  // 값 타입 활용
        
        // 생성자, getter, setter
    }
    ```

- **장점**
    - 식별자가 있어 추적 가능
    - 변경 시 해당 row만 UPDATE
    - 일대다 단방향 매핑
    - CASCADE + orphanRemoval로 값 타입 컬렉션처럼 사용

### 값 타입 컬렉션 사용 시점

- **사용 가능한 경우**
    - 정말 단순한 경우
        - ex) 체크박스에서 선택한 값들
    - 추적 필요 없음
    - 업데이트 거의 없음

- **사용하지 말아야 할 경우**
    - 식별이 필요한 경우
    - 쿼리가 복잡한 경우
    - 변경이 잦은 경우
    - **일대다 엔티티 매핑 사용 권장**

<br/><br/>

## 엔티티 타입과 값 타입 예제

### 도메인 모델

![jpa-value-type-10](/assets/img/jpa/jpa-value-type-10.png)

### Address 값 타입 적용

```java
@Embeddable
public class Address {
    private String city;
    private String street;
    private String zipcode;
    
    // 기본 생성자
    protected Address() {
    }
    
    // 생성자
    public Address(String city, String street, String zipcode) {
        this.city = city;
        this.street = street;
        this.zipcode = zipcode;
    }
    
    // Getter만 제공 (불변)
    public String getCity() { return city; }
    public String getStreet() { return street; }
    public String getZipcode() { return zipcode; }
    
    // equals & hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Address)) return false;
        Address address = (Address) o;
        return Objects.equals(city, address.city) &&
               Objects.equals(street, address.street) &&
               Objects.equals(zipcode, address.zipcode);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(city, street, zipcode);
    }
}
```

### Member 엔티티

```java
@Entity
public class Member {
    @Id
    @GeneratedValue
    @Column(name = "MEMBER_ID")
    private Long id;
    
    private String name;
    
    @Embedded
    private Address address;  // 값 타입 사용
    
    @OneToMany(mappedBy = "member")
    private List<Order> orders = new ArrayList<>();
}
```

### Delivery 엔티티

```java
@Entity
public class Delivery {
    @Id
    @GeneratedValue
    @Column(name = "DELIVERY_ID")
    private Long id;
    
    @OneToOne(mappedBy = "delivery", fetch = FetchType.LAZY)
    private Order order;
    
    @Embedded
    private Address address;  // 값 타입 사용
    
    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;
}

public enum DeliveryStatus {
    READY, COMP
}
```

<br/><br/>

## 연습 문제

1. JPA에서 엔티티(Entity) 타입과 값 타입(Value Type)의 가장 근본적인 차이점은 무엇일까요?

   a. 식별자(Identifier) 유무

    - 엔티티는 식별자로 추적되며 생명주기를 관리하지만, 값 타입은 식별자가 없고 오직 값만 가져 추적이 어려움
    - 이 유무가 두 타입을 구분하는 핵심 기준임

2. 임베디드 타입(Embedded Type)을 사용하여 주소나 기간 같은 값을 모델링할 때 얻을 수 있는 주요 이점은 무엇인가요?

   a. 객체지향 설계 강화 및 재사용성 증진

    - 임베디드 타입은 관련 데이터와 기능을 묶어 응집도를 높이고, 도메인 모델을 객체지향적으로 표현하며, 여러 엔티티에서 재사용 가능해 설계가 깔끔해짐

3. 값 타입 객체를 안전하게 공유하고 부작용(Side Effect)을 방지하기 위해 가장 권장되는 디자인 방법은 무엇일까요?

   a. 변경 시 새로운 객체 생성 (불변 객체)

    - 값 타입은 인스턴스를 공유할 때 부작용 위험이 있음
    - 따라서 생성 후 상태를 변경할 수 없는 불변 객체로 만들어야 안전하게 사용할 수 있음

4. JPA에서 값 타입 컬렉션(Value Type Collection)이 데이터베이스에 매핑되는 일반적인 방식은 무엇인가요?

   a. 별도 테이블에 복합 키로 매핑

    - 관계형 DB는 컬렉션을 직접 담지 못해 별도 테이블이 필요하며, 값 타입 컬렉션은 식별자가 없어 소유 엔티티의 ID와 컬렉션 값으로 복합 키를 구성해 매핑함

5. 값 타입 컬렉션 대신 일반적인 일대다(One-to-Many) 관계 엔티티 매핑을 고려하는 것이 더 나은 경우는 언제일까요?

   a. 컬렉션의 값 변경 이력 추적이 필요할 때

    - 값 타입 컬렉션은 변경 추적이나 복잡한 쿼리에 약점이 있어, 값의 이력 관리, 세밀한 업데이트, 또는 복잡한 조회 및 최적화가 필요하다면 엔티티로 매핑하는 것이 유리함

<br/><br/>

## 요약 정리

- **기본값 타입**은 자바 기본 타입이나 래퍼 클래스로, 생명주기가 엔티티에 의존하며 공유되지 않음
- **임베디드 타입**은 복합 값 타입으로, 새로운 값 타입을 정의하여 응집도 높고 재사용 가능한 설계를 가능하게 함
- **값 타입은 불변 객체**로 설계해야 부작용을 막을 수 있으며, `equals`와 `hashCode`를 재정의하여 동등성 비교를 해야 함
- **값 타입 컬렉션**은 별도의 테이블로 매핑되며 식별자가 없어 추적이 어렵고 변경 시 모든 데이터를 삭제하고 재저장하므로 주의가 필요함
- 값 타입 컬렉션 대신 **일대다 관계와 엔티티를 사용**하는 것이 추적과 최적화 면에서 유리함 (식별이 필요하고 변경이 잦은 경우)
- **엔티티**는 식별자가 있어 지속적인 추적이 가능한 반면, **값 타입**은 식별자가 없고 단순히 값만 가지며 공유보다는 복사를 통해 사용해야 함

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
