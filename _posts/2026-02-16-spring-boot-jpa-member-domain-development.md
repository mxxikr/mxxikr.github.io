---
title: '[실전! 스프링 부트와 JPA 활용1] 회원 도메인 개발'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-16 15:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, member-domain, repository, service, test]
math: false
mermaid: true
---

# 회원 도메인 개발

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 기반으로 회원 엔티티, 리포지토리, 서비스 계층의 개발 과정과 테스트 작성을 정리함

<br/><br/>

## 개발 개요

### 구현 기능

- **회원 등록**
    - 중복 회원을 검증함
    - 회원 정보를 저장함
- **회원 조회**
    - 전체 회원을 조회함
    - 회원 ID로 단건 조회함
    - 이름으로 회원을 검색함

### 개발 순서

1. **회원 엔티티 확인**
    - `Member.java` 코드를 확인함
2. **회원 리포지토리 개발**
    - `MemberRepository.java`를 개발함
    - 데이터 접근 계층을 구현함
3. **회원 서비스 개발**
    - `MemberService.java`를 개발함
    - 비즈니스 로직을 구현함
4. **회원 기능 테스트**
    - `MemberServiceTest.java`를 작성함
    - 구현한 기능을 검증함

<br/><br/>

## 회원 리포지토리 개발

### 리포지토리 역할

- **데이터 저장**
    - `save` 메서드를 통해 엔티티를 저장함
- **데이터 조회**
    - `findOne`, `findAll`, `findByName` 메서드를 제공함
- **EntityManager 사용**
    - JPA의 핵심인 `EntityManager`를 주입받아 사용함

### MemberRepository 코드

```java
@Repository
public class MemberRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    public void save(Member member) {
        em.persist(member);
    }
    
    public Member findOne(Long id) {
        return em.find(Member.class, id);
    }
    
    public List<Member> findAll() {
        return em.createQuery("select m from Member m", Member.class)
                .getResultList();
    }
    
    public List<Member> findByName(String name) {
        return em.createQuery("select m from Member m where m.name = :name", Member.class)
                .setParameter("name", name)
                .getResultList();
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/repository/MemberRepository.java)

- `@Repository`
    - 컴포넌트 스캔 대상이 되어 스프링 빈으로 등록됨
    - JPA 예외를 스프링 기반 예외로 변환함
- `@PersistenceContext`
    - 스프링이 생성한 `EntityManager`를 주입받음
    - 트랜잭션과 생명주기를 스프링이 관리함
- `@PersistenceUnit`
    - `EntityManagerFactory`를 직접 주입받을 때 사용함

### 메서드별 기능

- `save()` - 회원 저장

    ```java
    public void save(Member member) {
        em.persist(member);
    }
    ```

    - 엔티티를 영속성 컨텍스트에 저장함
    - 트랜잭션 커밋 시점에 DB에 INSERT 쿼리가 실행됨

- `findOne()` - 단건 조회

    ```java
    public Member findOne(Long id) {
        return em.find(Member.class, id);
    }
    ```

    - PK(Primary Key)를 사용하여 엔티티를 조회함
    - 1차 캐시에서 먼저 조회하여 성능을 최적화함

- `findAll()` - 전체 조회

    ```java
    public List<Member> findAll() {
        return em.createQuery("select m from Member m", Member.class)
                .getResultList();
    }
    ```

    - JPQL을 사용하여 엔티티 대상으로 쿼리함
    - SQL이 아닌 객체 지향 쿼리를 사용함

- `findByName()` - 이름으로 검색

    ```java
    public List<Member> findByName(String name) {
        return em.createQuery("select m from Member m where m.name = :name", Member.class)
                .setParameter("name", name)
                .getResultList();
    }
    ```

    - 파라미터 바인딩(`:name`)을 사용하여 SQL Injection을 방지함
    - 중복 회원 검증 로직에서 주로 사용됨

### EntityManager 주입 방식 비교

- **전통적 방식 (@PersistenceContext)**

    ```java
    @Repository
    public class MemberRepository {
        
        @PersistenceContext
        private EntityManager em;
        
    }
    ```

- **Spring Data JPA 사용 시 (권장)**

    ```java
    @Repository
    @RequiredArgsConstructor
    public class MemberRepository {
        
        private final EntityManager em;
        
    }
    ```
    - 스프링 부트와 Spring Data JPA를 사용하면 `@PersistenceContext` 대신 생성자 주입을 사용할 수 있음

<br/><br/>

## 회원 서비스 개발

### 서비스 계층 역할

- **비즈니스 로직**
    - 회원 가입, 중복 검증, 회원 조회 등 로직을 수행함
- **트랜잭션 관리**
    - `@Transactional`을 사용하여 데이터 일관성을 보장함
- **Repository 호출**
    - 데이터 접근 계층을 호출하여 데이터를 조작함

### MemberService 코드

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberService {
    
    private final MemberRepository memberRepository;
    
    /**
     * 회원 가입
     */
    @Transactional
    public Long join(Member member) {
        validateDuplicateMember(member);
        memberRepository.save(member);
        return member.getId();
    }
    
    private void validateDuplicateMember(Member member) {
        List<Member> findMembers = memberRepository.findByName(member.getName());
        if (!findMembers.isEmpty()) {
            throw new IllegalStateException("이미 존재하는 회원입니다.");
        }
    }
    
    /**
     * 전체 회원 조회
     */
    public List<Member> findMembers() {
        return memberRepository.findAll();
    }
    
    /**
     * 회원 단건 조회
     */
    public Member findOne(Long memberId) {
        return memberRepository.findOne(memberId);
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/service/MemberService.java)

- `@Service`
    - 서비스 계층의 컴포넌트임을 명시함
- `@Transactional`
    - `readOnly=true`
        - 읽기 전용 트랜잭션으로 최적화함 (조회 메  서드에 적용)
    - `readOnly=false`
        - 쓰기 가능한 트랜잭션 (등록, 수정, 삭제 메서드에 적용)

- `@Transactional(readOnly = true)` 효과

    - **영속성 컨텍스트 flush 생략**
        - 변경 감지를 위한 스냅샷 비교를 하지 않아 성능이 향상됨
    - **DB 드라이버 최적화**
        - 읽기 전용 모드로 동작하여 리소스를 절약함

### 생성자 주입 방식을 사용하는 이유

- **필드 주입 대신 생성자 주입을 권장함**
    - 필드 주입은 테스트가 어렵고 불변성을 보장할 수 없음
    - 생성자 주입은 `final` 키워드를 사용하여 불변 객체를 보장하고, 테스트 시 Mock 객체 주입이 용이함
- **Lombok `@RequiredArgsConstructor` 적용**
    - `final`이 붙은 필드의 생성자를 자동으로 생성해주어 코드를 깔끔하게 유지할 수 있음

### 비즈니스 로직 흐름

- **회원 가입 프로세스**

    1. **join 호출**
        - 컨트롤러에서 `join(member)`를 호출함
    2. **트랜잭션 시작**
        - 서비스 계층 진입 시 트랜잭션이 시작됨
    3. **중복 검증**
        - `validateDuplicateMember` 메서드로 이름 중복을 확인함
        - 중복 시 `IllegalStateException` 예외가 발생함
    4. **저장**
        - 검증 통과 시 `memberRepository.save(member)`를 호출함
    5. **트랜잭션 커밋**
        - 메서드 종료 시 트랜잭션이 커밋되고 DB에 반영됨

### 중복 검증 로직 주의사항

- **멀티 스레드 환경**
    - 동시에 같은 이름으로 가입을 시도하면 중복 검증을 통과할 수 있음
- **해결 방법**
    - 데이터베이스의 회원명 컬럼에 `UNIQUE` 제약조건을 추가해야 함

<br/><br/>

## 회원 기능 테스트

### 테스트 요구사항

- **정상 케이스**
    - 회원 가입이 성공하고, 저장된 회원이 조회되어야 함
- **예외 케이스**
    - 중복 회원 가입 시 예외가 발생해야 함

### MemberServiceTest 코드

```java
@SpringBootTest
@Transactional
public class MemberServiceTest {
    
    @Autowired MemberService memberService;
    @Autowired MemberRepository memberRepository;
    
    @Test
    public void 회원가입() throws Exception {
        // Given
        Member member = new Member();
        member.setName("kim");
        
        // When
        Long saveId = memberService.join(member);
        
        // Then
        assertEquals(member, memberRepository.findOne(saveId));
    }
    
    @Test
    public void 중복_회원_예외() throws Exception {
        // Given
        Member member1 = new Member();
        member1.setName("kim");
        
        Member member2 = new Member();
        member2.setName("kim");
        
        // When
        memberService.join(member1);
        
        // Then
        assertThrows(IllegalStateException.class, () -> 
            memberService.join(member2));
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/test/java/jpabook/jpashop/service/MemberServiceTest.java)

- `@SpringBootTest`
    - 스프링 부트 통합 테스트를 실행함
    - 스프링 컨테이너를 띄우고 의존성을 주입받음
- `@Transactional` (테스트 환경)
    - 각 테스트 실행 후 자동으로 롤백함
    - 반복적인 테스트 실행을 가능하게 함

### Given-When-Then 패턴

- **Given (준비)**
    - 테스트를 위한 데이터와 환경을 준비함
- **When (실행)**
    - 테스트할 동작을 수행함
- **Then (검증)**
    - 실행 결과를 검증함

### JUnit 5 예외 테스트

- `assertThrows` 사용
    - JUnit 5에서는 `assertThrows` 메서드를 사용하여 예외 발생을 검증함
    - 람다 표현식을 통해 예외가 발생하는 로직을 감쌈

<br/><br/>

## 연습 문제

1. JPA에서 SQL과 JPQL 쿼리의 주요 차이점은 무엇인가요?

   a. 테이블 기반과 엔티티 객체 기반의 차이

   - JPQL은 데이터베이스 테이블이 아닌 엔티티 객체를 대상으로 쿼리하며, SQL과 문법 차이가 있음
   - JPA는 이 쿼리를 적절한 SQL로 변환하여 실행함

2. JPA를 사용하여 데이터를 수정하는 메서드에 `@Transactional` 어노테이션이 필요한 주된 이유는 무엇인가요?

   a. 데이터 변경 작업의 일관성 및 영속성 컨텍스트 관리

   - JPA는 트랜잭션 범위 안에서 영속성 컨텍스트를 관리하고 데이터 변경사항을 DB에 반영함
   - 데이터 정합성을 유지하기 위해 트랜잭션 설정은 필수적임

3. Spring에서 서비스와 같은 클래스에서 의존성을 주입받을 때 권장되는 방식은 무엇일까요?

   a. 생성자 주입 (Constructor Injection)

   - 생성자 주입은 필수 의존성을 명확히 하고 객체의 불변성을 확보하여 테스트하기 용이함
   - 최근 Spring에서 가장 권장하는 주입 방식임

4. Spring Boot 애플리케이션 테스트 시, In-Memory 데이터베이스(예: H2)를 사용하는 주된 이점은 무엇인가요?

   a. 테스트 간 데이터 독립성 및 빠른 초기화

   - 테스트 시작 시 DB를 초기화하고 종료 후 롤백하여 다른 테스트에 영향을 주지 않음
   - 빠르고 독립적인 테스트 환경 구축에 유리함

5. Spring 테스트 클래스에서 `@Transactional` 어노테이션의 기본 동작은 무엇인가요?

   a. 각 테스트 메서드 후 데이터베이스 롤백

   - Spring 테스트의 `@Transactional`은 기본적으로 각 테스트 메서드가 끝날 때 변경사항을 DB에 반영하지 않고 자동으로 롤백시켜 테스트 데이터가 남는 것을 방지함

<br/><br/>

## 요약 정리

- **회원 엔티티**는 이름(`name`)과 임베디드 타입인 주소(`Address`)를 가지며, `@Entity`로 매핑함
- **회원 리포지토리**는 `EntityManager`를 주입받아 회원을 저장(`persist`)하고 조회(`find`, JPQL)하는 역할을 수행함
- **회원 서비스**는 `@Transactional`을 적용하여 데이터 변경을 관리하며, 중복 회원 검증과 같은 핵심 비즈니스 로직을 처리함
- **회원 테스트**는 `@SpringBootTest`와 `@Transactional`을 사용하여 실제 DB 환경과 유사하게 통합 테스트를 수행하며, 예외 상황(`IllegalStateException`)을 검증함

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
