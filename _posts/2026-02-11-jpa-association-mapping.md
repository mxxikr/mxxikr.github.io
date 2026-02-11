---
title: '[자바 ORM 표준 JPA 프로그래밍 기본편] 연관관계 매핑 기초'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-11 18:20:00 +0900
category: [Framework, JPA]
tags: [jpa, association-mapping, many-to-one, one-to-many, bidirectional, mappedby, orm]
math: false
mermaid: false
---

# 연관관계 매핑 기초

- 김영한님의 자바 ORM 표준 JPA 프로그래밍 기본편을 통해 객체와 테이블의 연관관계 차이, 단방향 및 양방향 연관관계 매핑 방법, 연관관계의 주인 개념, 그리고 예제를 통한 올바른 설계 패턴을 정리함

<br/><br/>

## 연관관계가 필요한 이유

### 예제 시나리오

- **요구사항**
    - 회원과 팀이 있음
    - 회원은 하나의 팀에만 소속될 수 있음
    - 회원과 팀은 다대일 관계임

### 테이블 중심 모델링의 문제점

- **잘못된 설계 방식**

    ```java
    @Entity
    public class Member {
        @Id @GeneratedValue
        private Long id;
        
        @Column(name = "USERNAME")
        private String name;
        
        @Column(name = "TEAM_ID")
        private Long teamId;  // 외래 키를 그대로 사용
    }
    ```

- **외래 키 식별자를 직접 다룸**
    - `member.setTeamId(team.getId())`와 같이 외래 키 값을 직접 설정해야 함
    ```java
    Team team = new Team();
    team.setName("TeamA");
    em.persist(team);
    
    Member member = new Member();
    member.setName("member1");
    member.setTeamId(team.getId());  // 외래 키 직접 설정
    em.persist(member);
    ```

- **객체 그래프 탐색 불가능**
    - `member.getTeam()`으로 연관된 팀을 조회할 수 없고, `teamId`로 다시 조회해야 함
    ```java
    Member findMember = em.find(Member.class, member.getId());
    
    // 연관관계가 없어서 식별자로 다시 조회해야 함
    Long findTeamId = findMember.getTeamId();
    Team findTeam = em.find(Team.class, findTeamId);
    ```

### 객체와 테이블의 차이

- **객체와 테이블의 패러다임 불일치**
    - **테이블**
        - 외래 키로 조인하여 연관 테이블 찾음
    - **객체**
        - 참조를 통해 연관 객체 찾음
    - 외래 키를 직접 다르면 `member.getTeam()` 같은 **객체 그래프 탐색이 불가능**해짐

<br/><br/>

## 단방향 연관관계

### 객체 지향 모델링

- **객체 참조 사용**

    ```java
    @Entity
    public class Member {
        
        @Id
        @GeneratedValue
        private Long id;
        
        @Column(name = "USERNAME")
        private String name;
        
        private int age;
        
        // 객체 참조
        @ManyToOne
        @JoinColumn(name = "TEAM_ID")
        private Team team;
        
        // Getter, Setter
    }
    ```

### 어노테이션 설명

- **@ManyToOne**
    - 다대일(N:1) 관계 설정 (`Member` 입장에서 `Team`)
- **@JoinColumn(name = "TEAM_ID")**
    - 조인할 외래 키 컬럼명 지정
    ```java
    @ManyToOne
    @JoinColumn(name = "TEAM_ID")
    private Team team;
    ```

### 연관관계 저장

```java
// 팀 저장
Team team = new Team();
team.setName("TeamA");
em.persist(team);

// 회원 저장
Member member = new Member();
member.setName("member1");
member.setTeam(team);  // 객체 참조 저장
em.persist(member);
```

- **실행 SQL**

    ```sql
    INSERT INTO TEAM (TEAM_ID, NAME) VALUES (1, 'TeamA');
    INSERT INTO MEMBER (MEMBER_ID, USERNAME, TEAM_ID) 
    VALUES (1, 'member1', 1);
    ```

### 참조로 연관관계 조회

- **객체 그래프 탐색**

    ```java
    // 조회
    Member findMember = em.find(Member.class, member.getId());
    
    // 참조를 사용해서 연관관계 조회
    Team findTeam = findMember.getTeam();  // 객체 그래프 탐색
    ```

    - 한 줄로 연관된 객체 조회 가능

### 연관관계 수정

```java
// 새로운 팀B
Team teamB = new Team();
teamB.setName("TeamB");
em.persist(teamB);

// 회원1에 새로운 팀B 설정
member.setTeam(teamB);  // 참조만 변경하면 됨
```

- **실행 SQL**

    ```sql
    UPDATE MEMBER 
    SET TEAM_ID = 2  -- teamB의 ID
    WHERE MEMBER_ID = 1;
    ```

<br/><br/>

## 양방향 연관관계

### 양방향 매핑

- **`Member` 엔티티 (단방향과 동일)**

    ```java
    @Entity
    public class Member {
        
        @Id
        @GeneratedValue
        private Long id;
        
        @Column(name = "USERNAME")
        private String name;
        
        private int age;
        
        @ManyToOne
        @JoinColumn(name = "TEAM_ID")
        private Team team;
        
        // Getter, Setter
    }
    ```

- **`Team` 엔티티 (컬렉션 추가)**

    ```java
    @Entity
    public class Team {
        
        @Id
        @GeneratedValue
        private Long id;
        
        private String name;
        
        @OneToMany(mappedBy = "team")
        private List<Member> members = new ArrayList<>();
        
        // Getter, Setter
    }
    ```

    - `@OneToMany`
      - 일대다 관계
    - `mappedBy = "team"`
      - `Member` 엔티티의 `team` 필드와 연결

- **테이블 구조는 변경 없음**
    - 테이블은 외래 키 하나로 양방향 조인 가능

### 반대 방향으로 객체 그래프 탐색

```java
// 조회
Team findTeam = em.find(Team.class, team.getId());

// 역방향 조회
int memberSize = findTeam.getMembers().size();

// 역방향 탐색
for (Member member : findTeam.getMembers()) {
    System.out.println("member = " + member.getName());
}
```

<br/><br/>

## 연관관계의 주인


### 객체와 테이블 연관관계 차이

- **연관관계의 수**
    - **객체**
        - 2개의 단방향 관계 (`A` -> `B`, `B` -> `A`)
        - 객체 양방향 관계는 사실 서로 다른 단방향 관계 2개임
    - **테이블**
        - 1개의 양방향 관계 (`A` <-> `B`)
        - 외래 키 하나로 양쪽 조인 가능

- **참조와 외래 키의 차이**
    - `Member`는 `Team` 참조 필요, `Team`은 `Member` 리스트 참조 필요 (단방향 2개)
    - `MEMBER` 테이블의 `TEAM_ID` 외래 키 하나로 `MEMBER JOIN TEAM`, `TEAM JOIN MEMBER` 모두 가능

### 연관관계의 주인 (Owner)

- **양방향 매핑 규칙**
    - 객체의 두 관계 중 하나를 연관관계의 주인으로 지정
    - **연관관계의 주인**
        - 외래 키를 관리 (등록, 수정)
    - **주인이 아닌 쪽**
        - 읽기만 가능 (mappedBy 속성으로 주인 지정)

    ```java
    // 주인: `Member.team` (외래 키 관리)
    @ManyToOne
    @JoinColumn(name = "TEAM_ID")
    private Team team;

    // 주인이 아님: `Team.members` (읽기 전용, mappedBy)
    @OneToMany(mappedBy = "team")
    private List<Member> members;
    ```

### 누구를 주인으로?

- **외래 키가 있는 곳을 주인으로 정함**
    - `MEMBER` 테이블에 외래 키(`TEAM_ID`)가 있으므로 `Member.team`이 주인
    - 비즈니스 로직을 기준으로 주인을 선택하면 안 됨
    - 외래 키가 없는 곳을 주인으로 하면 불필요한 UPDATE 쿼리가 발생하여 성능 저하 및 유지보수 어려움

<br/><br/>

## 양방향 매핑 실수와 주의사항

### 가장 많이 하는 실수

- **연관관계의 주인에 값을 입력하지 않음**

    ```java
    Team team = new Team();
    team.setName("TeamA");
    em.persist(team);
    
    Member member = new Member();
    member.setName("member1");
    
    // 역방향(주인이 아닌 방향)만 연관관계 설정
    team.getMembers().add(member);
    
    em.persist(member);
    ```

    - `MEMBER` 테이블의 `TEAM_ID`가 null로 저장됨

- **올바른 방법**

    ```java
    Team team = new Team();
    team.setName("TeamA");
    em.persist(team);
    
    Member member = new Member();
    member.setName("member1");
    
    // 연관관계의 주인에 값 설정
    member.setTeam(team);
    
    em.persist(member);
    ```

    - `MEMBER` 테이블의 `TEAM_ID`가 정상적으로 저장됨

### 양쪽 다 값을 입력해야 하는 이유

```java
Team team = new Team();
team.setName("TeamA");
em.persist(team);

Member member = new Member();
member.setName("member1");

// 양쪽 다 설정
member.setTeam(team);  // 주인에 값 설정 (필수)
team.getMembers().add(member);  // 역방향에도 설정 (권장)

em.persist(member);
```

- **순수 객체 상태 고려**

    ```java
    // 테스트 코드에서 JPA 없이 순수 Java 코드만 사용
    Team team = new Team();
    team.setName("TeamA");
    
    Member member = new Member();
    member.setName("member1");
    member.setTeam(team);
    
    // team.getMembers().add(member);  // 이게 없으면?
    
    List<Member> members = team.getMembers();
    System.out.println(members.size());  // 0 출력
    ```

- **영속성 컨텍스트(flush, clear) 없이 조회 시 문제**

    ```java
    Team team = new Team();
    team.setName("TeamA");
    em.persist(team);
    
    Member member = new Member();
    member.setName("member1");
    member.setTeam(team);
    em.persist(member);
    
    // flush, clear 없이 바로 조회
    Team findTeam = em.find(Team.class, team.getId());
    List<Member> members = findTeam.getMembers();  // 1차 캐시에서 조회
    
    // team.getMembers().add(member)가 없었다면
    System.out.println(members.size());  // 0 출력
    ```

### 연관관계 편의 메서드

- **양쪽에 값 설정 누락**

    ```java
    member.setTeam(team);
    team.getMembers().add(member);  // 깜빡하기 쉬움
    ```

- **연관관계 편의 메서드 사용**

    ```java
    @Entity
    public class Member {
        
        @ManyToOne
        @JoinColumn(name = "TEAM_ID")
        private Team team;
        
        // 연관관계 편의 메서드
        public void changeTeam(Team team) {
            this.team = team;
            team.getMembers().add(this);  // 양쪽 설정
        }
    }
    
    // 사용
    member.changeTeam(team);  // 한 번에 양쪽 설정
    ```

- **또는 Team에 작성**

    ```java
    @Entity
    public class Team {
        
        @OneToMany(mappedBy = "team")
        private List<Member> members = new ArrayList<>();
        
        // 연관관계 편의 메서드
        public void addMember(Member member) {
            members.add(member);
            member.setTeam(this);  // 양쪽 설정
        }
    }
    
    // 사용
    team.addMember(member);  // 한 번에 양쪽 설정
    ```

    - Member 또는 Team 중 한 곳에만 작성

### 무한 루프 조심

- **toString()**

    ```java
    @Entity
    public class Member {
        @ManyToOne
        private Team team;
        
        @Override
        public String toString() {
            return "Member{" +
                    "id=" + id +
                    ", username='" + username + '\'' +
                    ", team=" + team +  // team.toString() 호출
                    '}';
        }
    }
    
    @Entity
    public class Team {
        @OneToMany(mappedBy = "team")
        private List<Member> members;
        
        @Override
        public String toString() {
            return "Team{" +
                    "id=" + id +
                    ", name='" + name + '\'' +
                    ", members=" + members +  // members.toString() 호출
                    '}';
        }
    }
    ```

    - StackOverflowError 발생

- **Lombok**

    ```java
    @Entity
    @Getter
    @ToString  // 무한 루프 발생
    public class Member {
        @ManyToOne
        private Team team;
    }
    
    @Entity
    @Getter
    @ToString  // 무한 루프 발생
    public class Team {
        @OneToMany(mappedBy = "team")
        private List<Member> members;
    }
    ```

- **JSON 생성 라이브러리**

    ```java
    @RestController
    public class MemberController {
        
        @GetMapping("/members/{id}")
        public Member getMember(@PathVariable Long id) {
            return memberRepository.findById(id);  // 무한 루프
        }
    }
    ```

    - JSON 변환 시 무한 루프 발생

- **해결 방법**

    ```java
    // toString() 제거 또는 연관관계 필드 제외
    @Override
    public String toString() {
        return "Member{" +
                "id=" + id +
                ", username='" + username + '\'' +
                // team 제외
                '}';
    }
    
    // Lombok 사용 시
    @ToString(exclude = "team")  // 연관관계 필드 제외
    public class Member {
        @ManyToOne
        private Team team;
    }
    
    // JSON: DTO 사용 (권장)
    @GetMapping("/members/{id}")
    public MemberDto getMember(@PathVariable Long id) {
        Member member = memberRepository.findById(id);
        return new MemberDto(member);  // DTO로 변환
    }
    ```

<br/><br/>

## 양방향 매핑 설계 가이드

### 단방향 매핑만으로도 충분

- 단방향 매핑만으로도 이미 연관관계 매핑은 완료됨
- 양방향 매핑은 반대 방향 조회 기능만 추가한 것
- 테이블에는 전혀 영향을 주지 않음

### 양방향 매핑이 필요한 경우

```java
// JPQL에서 역방향 탐색이 필요한 경우

// 단방향만 있을 때
String jpql = "select m from Member m join m.team t where t.name = :teamName";

// 양방향이 있을 때
String jpql = "select m from Team t join t.members m where m.username = :username";
```

- JPQL에서 역방향 탐색할 일이 많으면 양방향 추가

### 설계 권장사항

- **권장 순서**
    1. 단방향 매핑으로 설계 완료
    2. 개발하면서 역방향 조회 필요하면 양방향 추가
    3. 테이블에는 영향 없으므로 언제든 추가 가능

- **연관관계의 주인 선택 기준**
    - **잘못된 기준**
        - 비즈니스 로직
    - **올바른 기준**
        - 외래 키의 위치
    - ex)
        - 자동차와 바퀴 관계
        - 비즈니스상 자동차가 더 중요해 보임
        - 하지만 `WHEEL` 테이블에 `CAR_ID`(FK)가 있음
        - 따라서 `Wheel.car`가 연관관계의 주인

<br/><br/>

## 연관관계 매핑 예제

### 객체 구조 (참조 사용)

- **`Member` 엔티티**

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
        
        @OneToMany(mappedBy = "member")
        private List<Order> orders = new ArrayList<>();
        
        // Getter, Setter
    }
    ```

- **`Order` 엔티티**

    ```java
    @Entity
    @Table(name = "ORDERS")
    public class Order {
        
        @Id
        @GeneratedValue
        @Column(name = "ORDER_ID")
        private Long id;
        
        @ManyToOne
        @JoinColumn(name = "MEMBER_ID")
        private Member member;  // 참조 사용
        
        @OneToMany(mappedBy = "order")
        private List<OrderItem> orderItems = new ArrayList<>();
        
        private LocalDateTime orderDate;
        
        @Enumerated(EnumType.STRING)
        private OrderStatus status;
        
        // 연관관계 편의 메서드
        public void addOrderItem(OrderItem orderItem) {
            orderItems.add(orderItem);
            orderItem.setOrder(this);
        }
        
        // Getter, Setter
    }
    ```

- **`OrderItem` 엔티티**

    ```java
    @Entity
    public class OrderItem {
        
        @Id
        @GeneratedValue
        @Column(name = "ORDER_ITEM_ID")
        private Long id;
        
        @ManyToOne
        @JoinColumn(name = "ORDER_ID")
        private Order order;  // 참조 사용
        
        @ManyToOne
        @JoinColumn(name = "ITEM_ID")
        private Item item;  // 참조 사용
        
        private int orderPrice;
        private int count;
        
        // Getter, Setter
    }
    ```

- **`Item` 엔티티**

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

### 변경 전후 비교

- **변경 전 (데이터 중심)**

    ```java
    @Entity
    public class Order {
        @Id
        private Long id;
        
        private Long memberId;  // 외래 키 그대로 사용
    }
    
    // 사용
    Order order = em.find(Order.class, orderId);
    Long memberId = order.getMemberId();
    Member member = em.find(Member.class, memberId);  // 2번 조회
    ```

- **변경 후 (객체 지향)**

    ```java
    @Entity
    public class Order {
        @Id
        private Long id;
        
        @ManyToOne
        @JoinColumn(name = "MEMBER_ID")
        private Member member;  // 객체 참조
    }
    
    // 사용
    Order order = em.find(Order.class, orderId);
    Member member = order.getMember();  // 객체 그래프 탐색
    ```

<br/><br/>

## 연습 문제

1. 객체와 관계형 데이터베이스가 관계를 표현하는 방식의 근본적인 차이는 무엇일까요?

   a. 객체는 참조, 테이블은 외래 키

   - 객체는 서로 다른 객체를 '참조'하며 관계를 맺음
   - 반면에 테이블은 '외래 키(FK)' 값을 통해 다른 테이블의 데이터를 연결함
   - 이 차이 때문에 ORM 매핑이 필요함

2. JPA에서 양방향 연관관계의 '연관관계 주인'은 무엇을 기준으로 결정하는 것이 가장 중요할까요?

   a. 외래 키(Foreign Key)의 위치

   - 외래 키가 데이터베이스 테이블 어디에 위치하는지가 연관관계 주인을 결정하는 핵심 기준임
   - 보통 N대1 관계에서 N쪽에 외래 키가 있으므로 N쪽이 주인이 됨

3. JPA 양방향 연관관계에서 '연관관계 주인'의 역할은 무엇일까요?

   a. 외래 키 값을 관리(등록, 수정)

   - 연관관계 주인만이 데이터베이스에 있는 외래 키의 값을 변경하거나 등록할 수 있음
   - 주인이 아닌 쪽(mappedBy 설정된 곳)은 외래 키 값을 읽기만 가능함

4. JPA 연관관계를 설계할 때 권장되는 초기 접근 방식은 무엇일까요?

   a. 단방향으로 먼저 설계 후 필요시 양방향 추가

   - 처음부터 양방향으로 설계하면 불필요하게 복잡해질 수 있음
   - 단방향으로 충분히 설계한 후, 애플리케이션 개발 중 역방향 조회가 정말 필요할 때 양방향을 추가하는 것이 좋음

5. JPA 양방향 연관관계를 사용할 때, Lombok의 toString()이나 JSON 직렬화 라이브러리 사용 시 주의해야 할 가장 흔한 문제는 무엇일까요?

   a. 무한 루프 발생

   - 양쪽 엔티티가 서로를 참조하는 구조 때문에 toString()이나 JSON 변환 시 서로를 반복적으로 호출하며 무한히 순환할 수 있음
   - 이는 애플리케이션 오류로 이어짐

<br/><br/>

## 요약 정리

- **테이블 중심 설계**는 외래 키 값을 그대로 사용하여 객체 그래프 탐색이 불가능하므로, 객체 참조를 사용한 연관관계 매핑이 필수임
- **@ManyToOne**과 **@JoinColumn** 어노테이션을 사용하여 다대일 관계를 매핑하며, 외래 키가 있는 곳이 연관관계의 주인이 됨
- **단방향 매핑**만으로도 이미 연관관계 매핑은 완료되며, 양방향 매핑은 반대 방향 조회 기능만 추가한 것으로 테이블에는 영향을 주지 않음
- **양방향 매핑**에서는 객체의 두 관계 중 하나를 연관관계의 주인으로 지정해야 하며, 주인만이 외래 키를 관리(등록, 수정)할 수 있고 주인이 아닌 쪽은 읽기만 가능함
- **mappedBy** 속성은 연관관계의 주인이 아닌 쪽에 사용하며, 외래 키가 있는 곳을 주인으로 정하는 것이 성능과 유지보수 측면에서 권장됨
- 양방향 매핑 시 **연관관계의 주인에 값을 반드시 설정**해야 하며, 순수 객체 상태를 고려하여 양쪽 모두에 값을 설정하는 것이 권장됨
- **연관관계 편의 메서드**를 작성하면 양쪽에 값을 설정하는 것을 깜빡하지 않고 한 번에 처리할 수 있으며, 둘 중 한 곳에만 작성해야 함
- **무한 루프**를 방지하기 위해 toString(), Lombok의 @ToString, JSON 직렬화 라이브러리 사용 시 연관관계 필드를 제외하거나 DTO를 사용해야 함
- 설계 시 **단방향 매핑으로 먼저 완료**한 후, JPQL에서 역방향 탐색이 필요한 경우에만 양방향을 추가하는 것이 권장됨
- 연관관계의 주인 선택 기준은 비즈니스 로직이 아니라 **외래 키의 위치**이며, 외래 키가 있는 N쪽이 항상 연관관계의 주인이 됨

<br/><br/>

## Reference

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic)
