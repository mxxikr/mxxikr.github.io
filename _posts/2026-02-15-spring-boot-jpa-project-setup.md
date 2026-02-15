---
title: '[실전! 스프링 부트와 JPA 활용1] 프로젝트 환경설정'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-15 14:00:00 +0900
category: [Spring Boot, JPA]
tags: [spring-boot, jpa, thymeleaf, h2-database, lombok, project-setup]
math: false
mermaid: true
---

# 프로젝트 환경설정

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 통해 프로젝트 생성부터 라이브러리 구성, View 환경 설정, 데이터베이스 설정, 그리고 JPA 동작 확인까지의 과정을 정리함

<br/><br/>

## 프로젝트 생성

### Spring Initializr 설정

- **사이트**
    - https://start.spring.io/

### 기본 설정

| 항목 | 값 |
|------|-----|
| **Project** | Gradle - Groovy |
| **Spring Boot** | 3.x.x 이상(최신 버전) |
| **Java** | 17 또는 21 |
| **Group** | jpabook |
| **Artifact** | jpashop |

### Dependencies

- **필수 라이브러리**
    - Spring Web
    - Spring Data JPA
    - Thymeleaf
    - H2 Database
    - Lombok
    - Validation (JSR-303)

### build.gradle 전체 설정

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.4.4'
    id 'io.spring.dependency-management' version '1.1.7'
}


dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.h2database:h2'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/build.gradle)

<br/><br/>

## 라이브러리 구조

### 의존성 조회 명령어

```bash
./gradlew dependencies --configuration compileClasspath
```

### Spring Boot Starter 라이브러리 구조

![Spring Boot Starter 라이브러리 구조](/assets/img/jpa/2026-02-15-spring-boot-jpa-project-setup/starter-structure.png)

### 핵심 라이브러리

| 카테고리 | 라이브러리 | 설명 |
|---------|-----------|------|
| **Web** | Spring MVC | 웹 MVC 프레임워크 |
| **ORM** | Spring Data JPA | JPA 추상화 |
| | Hibernate | JPA 구현체 |
| **Database** | H2 Database | 경량 DB |
| | HikariCP | 커넥션 풀 |
| **View** | Thymeleaf | 템플릿 엔진 |
| **Logging** | SLF4J + Logback | 로깅 프레임워크 |
| **Test** | JUnit 5 | 테스트 프레임워크 |
| | Mockito | Mock 라이브러리 |
| | AssertJ | 테스트 Assertion |

<br/><br/>

## View 환경 설정

### Thymeleaf 템플릿 엔진

![Thymeleaf 동작 원리](/assets/img/jpa/2026-02-15-spring-boot-jpa-project-setup/thymeleaf-flow.png)

- **참고 문서**
    - [Thymeleaf 공식](https://www.thymeleaf.org/)
    - [Spring 가이드](https://spring.io/guides/gs/serving-web-content/)

### ViewName 매핑 규칙

- `resources/templates/{ViewName}.html`

### HelloController 작성

```java
@Controller
public class HelloController {
    
    @GetMapping("hello")
    public String hello(Model model) {
        model.addAttribute("data", "hello!!");
        return "hello";
    }
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/java/jpabook/jpashop/HelloController.java)

### hello.html 템플릿
```html
<!DOCTYPE HTML>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Hello</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
    <p th:text="'안녕하세요. ' + ${data}">안녕하세요. 손님</p>
</body>
</html>
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/resources/templates/hello.html)

### index.html 작성
```html
<!DOCTYPE HTML>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Hello</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
    Hello
    <a href="/hello">hello</a>
</body>
</html>
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/resources/static/index.html)

### 개발 편의 기능

- **spring-boot-devtools**
    - `html` 파일 수정 시 서버 재시작 없이 View 파일만 컴파일하여 즉시 반영 가능함
    - `build.gradle`에 의존성 추가 필요
    
    ```groovy
    dependencies {
        developmentOnly 'org.springframework.boot:spring-boot-devtools'
    }
    ```
- **컴파일 방법 (IntelliJ)**
    - `Build` → `Recompile`

<br/><br/>

## 데이터베이스 설정

### H2 Database 개요

![H2 Database 개요](/assets/img/jpa/2026-02-15-spring-boot-jpa-project-setup/h2-overview.png)


- 경량 데이터베이스임
- 웹 기반 관리 콘솔을 제공함
- 개발 및 테스트 용도로 적합함

### H2 Database 설치

- **다운로드**
    - https://www.h2database.com

### 데이터베이스 파일 생성

![데이터베이스 파일 생성](/assets/img/jpa/2026-02-15-spring-boot-jpa-project-setup/db-file-creation.png)

- **접속 URL**
    - **최초 실행**
        - `jdbc:h2:~/jpashop` (DB 파일 생성)
    - **이후 접속**
        - `jdbc:h2:tcp://localhost/~/jpashop`

<br/><br/>

## JPA 설정 및 동작 확인

### application.yml 설정


```yaml
spring:
  datasource:
    url: jdbc:h2:tcp://localhost/~/jpashop
    username: sa
    password:
    driver-class-name: org.h2.Driver
    
  jpa:
    hibernate:
      ddl-auto: create
    properties:
      hibernate:
        # show_sql: true
        format_sql: true

logging.level:
  org.hibernate.SQL: debug
  # org.hibernate.orm.jdbc.bind: trace
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part1/blob/master/jpashop/src/main/resources/application.yml)


| 설정 | 설명 |
|-----|------|
| `ddl-auto: create` | 애플리케이션 시작 시 테이블 drop 후 재생성 |
| `format_sql: true` | SQL 포맷팅 (가독성 향상) |
| `org.hibernate.SQL: debug` | Hibernate SQL 로거 출력 |
| `org.hibernate.orm.jdbc.bind: trace` | 파라미터 바인딩 로그 (Spring Boot 3.x) |

- **로깅 권장사항**
    - `show_sql`은 System.out 출력이므로 `org.hibernate.SQL` 사용을 권장함


### 엔티티 작성

![엔티티 클래스 다이어그램](/assets/img/jpa/2026-02-15-spring-boot-jpa-project-setup/entity-class.png)

- **Member 엔티티**


    ```java
    @Entity
    @Getter @Setter
    public class Member {
        
        @Id @GeneratedValue
        private Long id;
        private String username;
    }
    ```

- **MemberRepository**

    ```java
    @Repository
    public class MemberRepository {
        
        @PersistenceContext
        EntityManager em;
        
        public Long save(Member member) {
            em.persist(member);
            return member.getId();
        }
        
        public Member find(Long id) {
            return em.find(Member.class, id);
        }
    }
    ```

### 테스트 코드 작성

```java
@SpringBootTest
public class MemberRepositoryTest {
    
    @Autowired MemberRepository memberRepository;
    
    @Test
    @Transactional
    @Rollback(false)
    public void testMember() {
        // given
        Member member = new Member();
        member.setUsername("memberA");
        
        // when
        Long savedId = memberRepository.save(member);
        Member findMember = memberRepository.find(savedId);
        
        // then
        Assertions.assertThat(findMember.getId()).isEqualTo(member.getId());
        Assertions.assertThat(findMember.getUsername()).isEqualTo(member.getUsername());
        Assertions.assertThat(findMember).isEqualTo(member);
    }
}
```

### 테스트 실행 흐름

![테스트 실행 흐름](/assets/img/jpa/2026-02-15-spring-boot-jpa-project-setup/test-flow.png)

<br/><br/>

## 쿼리 파라미터 로그 설정

### 기본 설정 (application.yml)

```yaml
logging.level:
  org.hibernate.SQL: debug
  org.hibernate.orm.jdbc.bind: trace
```

### 외부 라이브러리 사용 (권장)

- **GitHub**
    - https://github.com/gavlyukovskiy/spring-boot-data-source-decorator
- **build.gradle에 추가**

    ```groovy
    implementation 'com.github.gavlyukovskiy:p6spy-spring-boot-starter:1.12.1'
    ```


- **운영 환경 주의**
    - 시스템 자원을 사용하므로 성능 테스트 후 적용하는 것을 권장함

<br/><br/>

## 연습 문제

1. 스프링 부트 Starter 라이브러리의 주된 목적은 무엇일까요?

   a. 자주 사용하는 라이브러리 자동 포함 및 버전 관리

   - 스프링 부트 스타터는 웹, JPA 등 특정 기능 구현에 필요한 여러 라이브러리를 모아두고 버전 호환성을 자동으로 관리해 줌
   - 덕분에 설정이 매우 편리해짐

2. 개발 중 View 템플릿(예: Thymeleaf) 수정 시 빠른 변경 확인을 위해 활용하면 좋은 Spring Boot 기능은 무엇일까요?

   a. DevTools

   - Spring Boot DevTools는 개발 중 코드나 템플릿 변경이 발생했을 때 애플리케이션을 자동으로 재시작하거나 변경 사항을 즉시 반영하여 개발 생산성을 높여주는 기능임

3. 강의에서 개발 및 테스트 환경용으로 H2 데이터베이스를 추천한 주요 이유는 무엇일까요?

   a. 설치와 설정이 간단하며 임베디드 모드 지원으로 편리해서

   - H2는 설정과 사용이 간편하고 애플리케이션에 내장(임베디드)하여 사용할 수 있어 개발 및 테스트 단계에서 매우 유용함
   - 실제 서비스에는 다른 DB를 고려해야 함

4. 스프링 부트와 JPA 설정 시 `application.yml` 파일에서 `hibernate.ddl-auto` 속성을 `create`로 설정했을 때 애플리케이션 실행 시점의 동작은 무엇일까요?

   a. 기존 테이블을 모두 삭제하고 엔티티에 맞춰 재생성

   - `create` 설정은 애플리케이션 시작 시 데이터베이스 스키마를 초기화(기존 테이블 삭제 후 재생성)함
   - `update`는 변경분만 반영하고, `none`은 자동 변경을 하지 않음

5. JPA의 EntityManager를 통해 데이터를 저장하거나 수정하는 등 변경 작업을 수행할 때 반드시 필요한 것은 무엇일까요?

   a. @Transactional 어노테이션 또는 트랜잭션 경계 설정

   - JPA를 사용한 데이터 변경(쓰기) 작업은 반드시 트랜잭션 안에서 이루어져야 함
   - Spring에서는 `@Transactional` 어노테이션으로 편리하게 트랜잭션을 관리할 수 있음

<br/><br/>

## 요약 정리

- **스프링 부트**는 Tomcat, Hibernate 등 복잡한 라이브러리 의존성을 Starter를 통해 쉽게 관리하며, `application.yml`을 통해 간편하게 설정할 수 있음
- **application.yml 설정** 시 DB 연결 정보와 DDL 생성 전략(`ddl-auto`)을 명시해야 함
- **Thymeleaf**는 스프링과 자연스럽게 통합되는 서버 사이드 템플릿 엔진으로, HTML 구조를 유지하면서 동적 컨텐츠를 렌더링함
- **H2 데이터베이스**는 가볍고 빠르며 웹 콘솔을 제공하여 학습 및 테스트 환경에 최적화된 DB임
- **테스트 환경**에서는 JUnit 5를 기반으로 `@SpringBootTest`, `@Transactional` 등을 활용하여 실제 DB와 연동된 통합 테스트를 쉽게 작성할 수 있음

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
