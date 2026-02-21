---
title: '[실전! 스프링 데이터 JPA] 프로젝트 환경설정'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-21 11:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, spring-data-jpa, h2, gradle, setup]
math: false
mermaid: false
---

# 프로젝트 환경설정

- 김영한님의 실전! 스프링 데이터 JPA 강의를 기반으로 프로젝트 기본 환경설정, 라이브러리 추가, H2 데이터베이스 연동, 그리고 순수 JPA와 스프링 데이터 JPA의 기본 동작 및 차이점 등을 정리함

<br/><br/>

## 프로젝트 생성

### build.gradle

```groovy
plugins {
    id 'org.springframework.boot' version '2.2.1.RELEASE'
    id 'io.spring.dependency-management' version '1.0.8.RELEASE'
    id 'java'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    
    // 파라미터 로깅용
    implementation 'com.github.gavlyukovskiy:p6spy-spring-boot-starter:1.5.7'
    
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.h2database:h2'
    
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/build.gradle)



<br/><br/>

## 라이브러리 구조

![라이브러리 구조](/assets/img/jpa/2026-02-21-spring-data-jpa-project-setup/lib.png)

```bash
# gradle 의존관계 확인 명령어
./gradlew dependencies --configuration compileClasspath
```

<br/><br/>

## H2 데이터베이스 설정

- [H2 데이터베이스 다운로드](https://www.h2database.com) 후 파일 압축 해제
- 압축 해제 후 `bin` 디렉토리로 이동하여 `h2.sh` 파일에 실행 권한(`chmod 755`)을 부여하고 스크립트를 실행함

    ```bash
    # 실행 권한 부여
    chmod 755 h2.sh

    # 실행
    ./h2.sh
    ```

- 데이터베이스 파일 생성 순서

  ![데이터베이스 파일 생성 순서](/assets/img/jpa/2026-02-21-spring-data-jpa-project-setup/db-sequence.png)

<br/><br/>

## application.yml 설정

```yaml
spring:
  datasource:
    url: jdbc:h2:tcp://localhost/~/datajpa
    username: sa
    password:
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create       # 실행 시 테이블 drop 후 재생성
    properties:
      hibernate:
        # show_sql: true     # System.out으로 SQL 출력 (비권장)
        format_sql: true     # SQL 포맷팅

logging.level:
  org.hibernate.SQL: debug   # 로거를 통해 SQL 출력 (권장)
  # org.hibernate.type: trace  # 바인딩 파라미터 출력
```

<br/><br/>

## 동작 확인

### 테스트 컨트롤러

```java
@RestController
public class HelloController {

    @RequestMapping("/hello")
    public String hello() {
        return "hello";
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/controller/HelloController.java)

### 회원 엔티티

```java
@Entity
@Getter @Setter
public class Member {

    @Id @GeneratedValue
    private Long id;
    private String username;
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/entity/Member.java)

### 순수 JPA 리포지토리

```java
@Repository
public class MemberJpaRepository {

    @PersistenceContext
    private EntityManager em;

    public Member save(Member member) {
        em.persist(member);
        return member;
    }

    public Member find(Long id) {
        return em.find(Member.class, id);
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberJpaRepository.java)

### 스프링 데이터 JPA 리포지토리

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberRepository.java)

### 순수 JPA 테스트

```java
@SpringBootTest
@Transactional
@Rollback(false)
public class MemberJpaRepositoryTest {

    @Autowired MemberJpaRepository memberJpaRepository;

    @Test
    public void testMember() {
        Member member = new Member("memberA");
        Member savedMember = memberJpaRepository.save(member);
        Member findMember = memberJpaRepository.find(savedMember.getId());

        assertThat(findMember).isEqualTo(member); // JPA 엔티티 동일성 보장
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/test/java/study/datajpa/MemberJpaRepositoryTest.java)

### 스프링 데이터 JPA 테스트

```java
@SpringBootTest
@Transactional
@Rollback(false)
public class MemberRepositoryTest {

    @Autowired MemberRepository memberRepository;

    @Test
    public void testMember() {
        Member member = new Member("memberA");
        Member savedMember = memberRepository.save(member);
        Member findMember = memberRepository.findById(savedMember.getId()).get();

        Assertions.assertThat(findMember).isEqualTo(member); // JPA 엔티티 동일성 보장
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/test/java/study/datajpa/MemberRepositoryTest.java)

<br/><br/>

## 쿼리 파라미터 로그 설정

- SQL 실행 시 바인딩 파라미터를 로그로 남기기위해 외부 라이브러리를 추가함 (운영 환경에서는 반드시 성능 테스트 후 적용 필수)

    ```groovy
    implementation 'com.github.gavlyukovskiy:p6spy-spring-boot-starter:1.9.0'
    ```

<br/><br/>

## 순수 JPA와 스프링 데이터 JPA 비교

![순수 JPA와 스프링 데이터 JPA 비교](/assets/img/jpa/2026-02-21-spring-data-jpa-project-setup/jpa-compare.png)

- 스프링 부트를 사용하면 `persistence.xml`이나 `LocalContainerEntityManagerFactoryBean` 설정 없이 `application.yml`만으로 JPA 설정이 완료됨

<br/><br/>

## 연습 문제

1. Spring Boot 프로젝트에서 특정 기능을 쉽고 빠르게 추가하기 위해 여러 의존성을 묶어 제공하는 것은 무엇일까요?

    a. Spring Boot Starter

    - 스프링 부트 스타터는 관련 라이브러리 묶음을 제공하여 의존성 관리를 단순화함
    - Initializr는 단순한 프로젝트 생성 도구임

2. Spring Boot 2.x 버전에서 기본적으로 사용되는 데이터베이스 커넥션 풀 라이브러리는 무엇일까요?

    a. Hikari CP

    - 스프링 부트 2.0부터는 성능이 우수한 Hikari CP를 기본 커넥션 풀로 사용함

3. H2 데이터베이스를 여러 애플리케이션에서 동시에 접근하거나 원격에서 접근할 때 권장되는 연결 모드는 무엇일까요?

    a. TCP 모드

    - TCP 모드는 네트워크를 통해 H2에 접근하므로 여러 프로세스나 원격 접속이 가능함
    - 반면, 파일 모드는 파일 잠금 문제로 동시 접근이 어려움

4. JPA 엔티티(Entity) 클래스에 `@Entity` 어노테이션 외에 필수로 필요한 요소는 무엇일까요?

    a. 매개변수 없는 기본 생성자

    - JPA 표준 명세는 프록시 기술 등을 위해 엔티티 클래스에 접근 제한자가 `protected` 이상인 기본 생성자가 있어야 한다고 요구함

5. 스프링 데이터 JPA에서 `JpaRepository` 인터페이스를 상속받아 사용하는 것의 가장 큰 장점은 무엇일까요?

    a. CRUD 기능 구현 코드 자동 생성

    - 스프링 데이터 JPA는 인터페이스 선언만으로 기본적인 CRUD 메소드 구현체를 자동으로 만들어 제공하여 개발 생산성을 크게 높임

<br/><br/>

## 요약 정리

- H2는 여러 애플리케이션의 동시 접근을 위해 TCP 모드로 연결(`jdbc:h2:tcp://localhost/~/datajpa`)하는 것이 권장됨
- `spring-boot-starter-data-jpa`를 통해 JPA 및 Hibernate 관련 라이브러리가 자동으로 포함되며, 기본 커넥션 풀로 성능이 우수한 Hikari CP가 적용됨
- JPA 엔티티는 `@Entity`와 더불어, 프록시 생성을 위해 `protected` 이상의 기본 생성자가 필수적으로 요구됨
- 순수 JPA는 `EntityManager`를 이용해 개발자가 직접 인터페이스와 쿼리 메서드를 구현해야 하지만, 스프링 데이터 JPA는 `JpaRepository` 인터페이스 상속만으로 기본 CRUD 구현체를 런타임에 자동 주입하여 반복 코드를 획기적으로 줄여줌

<br/><br/>

## Reference

- [실전! 스프링 데이터 JPA](https://www.inflearn.com/course/스프링-데이터-JPA-실전)
