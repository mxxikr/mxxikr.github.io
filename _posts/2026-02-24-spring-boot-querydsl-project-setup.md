---
title: '[실전! Querydsl] 프로젝트 환경설정'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-24 16:11:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, querydsl, project-setup, h2]
math: false
mermaid: false
---

# 프로젝트 환경설정

- 인프런 김영한님의 실전! Querydsl 강의를 바탕으로 스프링 부트 프로젝트 생성 및 Querydsl 환경을 연동하고 H2 데이터베이스와 JPA 동작 설정을 통합 구성하는 과정을 정리함


<br/><br/>

## Querydsl 설정과 Q타입 컴파일 검증

- `build.gradle`에 Querydsl 모듈 의존성 내용 추가 반영

  ```groovy
  dependencies {
      // Querydsl 추가
      implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
      annotationProcessor "com.querydsl:querydsl-apt:${dependencyManagement.importedProperties['querydsl.version']}:jakarta"
      annotationProcessor "jakarta.annotation:jakarta.annotation-api"
      annotationProcessor "jakarta.persistence:jakarta.persistence-api"
  }

  // Gradle 빌드 라이프사이클 중 generated 대상 캐시 삭제용 클린 훅
  clean {
      delete file('src/main/generated')
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/build.gradle)

- Q타입 생성 여부 확인 및 검증
  - 동작 확인을 돕기 위해 테스트용 `Hello` 엔티티를 하나 임의로 구축함

  ```java
  package study.querydsl.entity;

  import lombok.Getter;
  import lombok.Setter;
  import jakarta.persistence.Entity;
  import jakarta.persistence.GeneratedValue;
  import jakarta.persistence.Id;

  @Entity
  @Getter @Setter
  public class Hello {
      @Id @GeneratedValue
      private Long id;
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/main/java/study/querydsl/entity/Hello.java)

  - Gradle 콘솔이나 IntelliJ Tasks 도구를 사용해 `./gradlew clean compileQuerydsl` 명령어를 수행하면 빌드 동작이 실행됨
  - 명령이 완료되면 `build/generated/querydsl/study/querydsl/entity/QHello.java` 경로에 타입 파일이 생성된 것을 확인할 수 있음
  - Q타입은 컴파일 시점에 자동 생성되는 결과물이므로 버전 관리 도구 지침에 따라 Git 형상 관리에 포함하지 않도록 배제해야 함 (`build` 폴더는 `.gitignore` 기본 반영 대상임)

- 테스트 케이스를 구축해서 실제 Querydsl 동작과 롬복 바인딩 정상 여부를 판별함

  ```java
  @SpringBootTest
  @Transactional
  class QuerydslApplicationTests {

      @Autowired
      EntityManager em;

      @Test
      void contextLoads() {
          Hello hello = new Hello();
          em.persist(hello);

          JPAQueryFactory query = new JPAQueryFactory(em);
          QHello qHello = QHello.hello; // Querydsl Q타입 동작 확인

          Hello result = query
                  .selectFrom(qHello)
                  .fetchOne();

          Assertions.assertThat(result).isEqualTo(hello);
          // lombok 동작 확인 (hello.getId())
          Assertions.assertThat(result.getId()).isEqualTo(hello.getId());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/query-dsl/blob/master/querydsl/src/test/java/study/querydsl/QuerydslApplicationTests.java)

<br/><br/>

## H2 데이터베이스 및 스프링 부트 JPA 연동 설정

- H2 데이터베이스 실행 및 접속 설정
  - 최초 접속 시에는 파일 생성을 위해 `jdbc:h2:~/querydsl` (파일 모드)로 접근해야 함
  - 파일 모드로 데이터베이스 파일이 생성된 이후부터는 `jdbc:h2:tcp://localhost/~/querydsl` (TCP 모드)로 접속해야 여러 애플리케이션에서 파일 락(Lock) 없이 원활한 동시 접근이 가능함

- `application.yml` 데이터베이스 및 JPA 기본 설정

  ```yaml
  spring:
    datasource:
      url: jdbc:h2:tcp://localhost/~/querydsl
      username: sa
      password:
      driver-class-name: org.h2.Driver
    jpa:
      hibernate:
        ddl-auto: create
      properties:
        hibernate:
          format_sql: true

  logging.level:
    org.hibernate.SQL: debug
  ```

  - `ddl-auto: create`
    - 애플리케이션이 실행될 때 기존 테이블을 삭제하고 엔티티 정보를 바탕으로 테이블을 새로 생성해 주는 개발/테스트용 초기화 옵션임
  - `show_sql: true`
    - SQL을 System.out으로 출력하므로 운영 환경과 맞지 않음
    - `org.hibernate.SQL: debug` 로깅 레벨 설정을 통해 스프링 공식 로거를 사용하는 것이 권장됨
  - 쿼리의 파라미터 바인딩 값(`?`)을 실제 데이터로 치환해서 로그에 출력해 주는 `p6spy` 라이브러리는 유용하지만 운영 서버에서는 성능 저하를 유발할 수 있으므로 성능 테스트 후 적용을 결정해야 함

- 컨트롤러 동작 최종 확인
  - 애플리케이션 실행 후 웹 브라우저 등을 통해 `http://localhost:8080/hello`에 접속하여 서버가 정상적으로 응답하는지 테스트함
  - 만약 `application.yml`에 데이터베이스 커넥션 설정이 빠져있다면, 스프링 부트가 일시적으로 내장 H2 데이터베이스(메모리 모드)를 구동하여 대신 연결해 줍니다.

<br/><br/>

## 연습 문제

- Spring Boot 및 Querydsl 활용 문제 정리

  - Spring Boot 프로젝트 초기 설정 시, Lombok과 H2 데이터베이스를 사용하는 주된 목적은 무엇일까요?
    - 개념 편의성 증대 및 테스트 환경 간소화를 위해서임
    - Lombok은 Getter/Setter 같은 반복 코드를 줄여주고, H2는 가볍고 테스트에 편리한 인메모리/파일 DB로서 둘 다 설정 및 테스트를 편리하게 만들어 줌

  - Querydsl이 엔티티 클래스를 기반으로 생성하는 Q 타입 파일의 주된 역할은 무엇인가요?
    - 컴파일 시점 오류를 잡는 타입 세이프 쿼리를 지원함
    - Q 파일은 엔티티 기반으로 생성되어 컴파일 시점 오류를 잡는 타입 세이프 쿼리 작성을 가능하게 함으로써 런타임 오류를 줄여주는 필수 역할을 함

  - Gradle을 사용하는 Spring Boot 프로젝트에서 Querydsl Q 타입 파일은 주로 어떻게 생성되나요?
    - 빌드 과정 중 특정 Gradle 태스크(예: Compile Querydsl) 실행을 통해 통제됨
    - Querydsl Q 파일은 Gradle 빌드 시 Querydsl 플러그인에 의해 생성되므로 이를 위해 해당 컴파일 목적의 태스크 실행이 요구됨

  - Spring Boot에서 JPA와 데이터베이스 설정 시 일반적으로 사용되는 파일과, `spring.jpa.hibernate.ddl-auto=create-drop` 설정의 의미는 무엇인가요?
    - `application.yml`을 설정 매체로 삼고 애플리케이션 시작 시 기존 테이블을 파괴하고 새로 생성했다가 소멸시킴을 의미함
    - Spring Boot에서 JPA/DB 설정은 주로 `application.yml` 영역에 구축하며, 'create-drop'은 시작 시 테이블을 모두 삭제하고 다시 생성하며 종료 시에도 스키마를 삭제하므로 테스트 환경 구축 목적으로 특화됨

  - H2 데이터베이스 파일(`*.mv.db`)을 Spring Boot 애플리케이션 실행과 H2 콘솔에서 동시에 접근하려고 할 때, 파일 모드 대신 TCP 모드로 전환하는 주요 이유는 무엇일까요?
    - TCP 모드를 사용해야 여러 프로세스의 동시 접근 시 돌출되는 파일 잠금(Lock) 문제를 회피할 수 있기 때문임
    - H2 파일 모드는 동시 접근 시 파일 락오류를 분출하지만 TCP 모드로 전환하면 네트워크 서버 모드로 동작하여 다수 프로세스와 문제없이 접속을 조율하는 역할로 활용됨

<br/><br/>

## Reference

- [실전! Querydsl](https://www.inflearn.com/course/querydsl-실전)
