---
title: '[실전! 스프링 데이터 JPA] 확장 기능'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-23 13:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, spring-data-jpa, custom-repository, auditing, web-support, paging]
math: false
mermaid: false
---

# 확장 기능

- 김영한님의 실전! 스프링 데이터 JPA 강의를 기반으로 사용자 정의 리포지토리, Auditing 단일 추적, 도메인 클래스 컨버터, 페이징과 정렬 등 스프링 데이터 JPA의 여러 확장 기능 설정 및 활용 방법을 정리함

<br/><br/>

## 사용자 정의 리포지토리 구현

- Spring Data JPA 리포지토리는 인터페이스만으로 구현체가 자동 생성되지만, JPA 직접 사용(`EntityManager`), Spring JDBC Template, MyBatis, Querydsl 등 다양한 기술과 혼합하여 쿼리를 병합 구현해야 할 때 사용됨

  ![사용자 정의 리포지토리 구조](/assets/img/jpa/2026-02-23-spring-data-jpa-extensions/ext-custom.png)

- 사용자 정의 인터페이스 선언
  - 확장하고자 하는 쿼리 메서드들의 명세를 정의하는 추가 인터페이스를 선언함

  ```java
  public interface MemberRepositoryCustom {
      List<Member> findMemberCustom();
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberRepositoryCustom.java)

- 구현 클래스 작성 (`인터페이스 이름 + Impl`)
  - Spring Data 규약에 따라 반드시 인터페이스 이름에 `Impl` 접미사를 붙여 구현체를 작성해야 스프링 데이터 JPA가 이를 인식하고 기능을 연결해 줌

  ```java
  @RequiredArgsConstructor
  public class MemberRepositoryImpl implements MemberRepositoryCustom {
      
      private final EntityManager em;

      @Override
      public List<Member> findMemberCustom() {
          return em.createQuery("select m from Member m", Member.class)
                   .getResultList();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberRepositoryImpl.java)

- JpaRepository에 사용자 정의 인터페이스 상속
  - 기본 제공 인터페이스와 커스텀 인터페이스를 모두 상속하여 한 곳에서 통일된 리포지토리 접근을 가능하게 만듦

  ```java
  public interface MemberRepository extends JpaRepository<Member, Long>, MemberRepositoryCustom {
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/repository/MemberRepository.java)

<br/><br/>

## Auditing

- 엔티티가 생성되거나 변경될 때 누가, 언제 수행했는지(등록 시간, 수정 시간, 등록자, 수정자)를 자동으로 추적하여 데이터베이스에 기록하는 기능임

- 순수 JPA 방식 사용
  - JPA 표준 이벤트 어노테이션인 `@PrePersist`와 `@PreUpdate`를 직접 활용해 시간을 세팅하고 상속받아 사용하는 방식임

  ```java
  @MappedSuperclass
  public class JpaBaseEntity {

      @Column(updatable = false)
      private LocalDateTime createdDate;
      private LocalDateTime updatedDate;

      @PrePersist
      public void prePersist() {
          LocalDateTime now = LocalDateTime.now();
          createdDate = now;
          updatedDate = now;
      }

      @PreUpdate
      public void preUpdate() {
          updatedDate = LocalDateTime.now();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/entity/JpaBaseEntity.java)

- Spring Data JPA 방식 사용
  - 스프링 부트 애플리케이션에 Auditing 기능을 활성화한 후 등록자 및 수정자 정보를 공급하는 빈을 구성하는 형태로 이루어짐

  ![Auditing 동작 흐름](/assets/img/jpa/2026-02-23-spring-data-jpa-extensions/ext-auditing.png)

  - 등록 클래스의 상단에 `@EnableJpaAuditing`을 등록하고, `AuditorAware` 스프링 빈을 등록하여 현재의 클라이언트 정보를 제공함

  ```java
  @EnableJpaAuditing
  @SpringBootApplication
  public class DataJpaApplication {
      public static void main(String[] args) {
          SpringApplication.run(DataJpaApplication.class, args);
      }

      @Bean
      public AuditorAware<String> auditorProvider() {
          return () -> Optional.of(UUID.randomUUID().toString());
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/DataJpaApplication.java)

  - 등록일자, 수정일자 전용 기초 역할을 수행할 `BaseTimeEntity`를 생성 후 이를 다른 엔티티에서 상속받아 사용함

  ```java
  @EntityListeners(AuditingEntityListener.class)
  @MappedSuperclass
  public class BaseTimeEntity {

      @CreatedDate
      @Column(updatable = false)
      private LocalDateTime createdDate;

      @LastModifiedDate
      private LocalDateTime lastModifiedDate;
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/entity/BaseTimeEntity.java)

<br/><br/>

## Web 확장 - 도메인 클래스 컨버터

- HTTP 파라미터로 명시적으로 전달받은 식별자(`id`) 값을 리포지토리에 조회 기능을 연계해 자동으로 엔티티 객체 인스턴스로 대치해 주는 기능임

  ![도메인 클래스 컨버터 흐름](/assets/img/jpa/2026-02-23-spring-data-jpa-extensions/ext-web-domain.png)

- 도메인 클래스 컨버터 적용
  - 컨트롤러에서 `id`를 이용해 리포지토리를 직접 호출하지 않고, 매개변수로 명시된 엔티티 타입 선언을 통해 내부에서 처리되도록 위임함

  ```java
  @RestController
  @RequiredArgsConstructor
  public class MemberController {

      private final MemberRepository memberRepository;

      @GetMapping("/members/{id}")
      public String findMember(@PathVariable("id") Member member) {
          return member.getUsername();
      }
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/controller/MemberController.java)

  - 영속성 컨텍스트 범위 외의 조회일 가능성이 있으므로 트랜잭션과 무관하게 읽기 작업 등 단순 조회용도로만 사용해야 하며, 데이터를 변경해도 데이터베이스에 반영되지 않음에 주의해야 함

<br/><br/>

## Web 확장 - 페이징과 정렬

- 스프링 데이터가 제공하는 페이징 및 정렬 편의 유틸리티를 스프링 MVC에서 `Pageable` 파라미터 단 하나로 간편하게 바인딩하여 처리할 수 있음

- 컨트롤러에 기본 페이징 적용 (`Pageable` 파라미터 활용)
  - `/members?page=0&size=3&sort=id,desc`

  ```java
  @GetMapping("/members")
  public Page<Member> list(Pageable pageable) {
      return memberRepository.findAll(pageable);
  }
  ```

- 페이징 정보 기본값 설정
  - 글로벌 설정은 `application.yml`의 `spring.data.web.pageable.default-page-size` 설정을 통해 프로젝트 전체에 기본값을 지정함

    ```yaml
    spring:
        data:
        web:
            pageable:
            default-page-size: 20
            max-page-size: 2000
    ```
  - 개별 설정이 필요한 경우 컨트롤러의 매개변수 부분에 `@PageableDefault(size = 12, sort = "username", direction = Sort.Direction.DESC)` 어노테이션을 직접 부여하여 처리함

    ```java
    @GetMapping("/members")
    public Page<Member> list(@PageableDefault(size = 12, sort = "username", direction = Sort.Direction.DESC) Pageable pageable) {
        return memberRepository.findAll(pageable);
    }
    ```

- 내부 정보 노출을 막기 위한 DTO 변환 반환
  - 엔티티를 곧바로 반환하면 데이터베이스 테이블 구조가 강결합되어 노출되고 유연성이 극히 떨어지므로, `map()` 메서드를 활용해 API 스펙과 일치하는 DTO 형태를 구성하여 반환해야 함

  ```java
  @GetMapping("/members")
  public Page<MemberDto> list(Pageable pageable) {
      return memberRepository.findAll(pageable).map(MemberDto::new);
  }
  ```
  - [전체 코드 보기](https://github.com/mxxikr/spring-data-jpa/blob/master/data-jpa/src/main/java/study/datajpa/controller/MemberController.java)

- 시작 페이지를 1부터 구성해야 할 때의 고려 사항
  - Spring Data의 기반이 0 페이지로 이루어져 있기 때문에 1 페이지 시작 요건을 맞출 때 내부 처리에 각별한 주의가 필요함

  ![Page 1 인덱스 시작 방식 차이](/assets/img/jpa/2026-02-23-spring-data-jpa-extensions/ext-web-paging.png)

  - 속성 파일의 `one-indexed-parameters=true` 설정은 웹 요청 단락에서 값만 변경 적용할 뿐 응답 `Page` 객체 내부는 여전히 인덱스가 일치하지 않는 상태로 통지되는 한계가 존재함
  - 완전히 어긋남 없는 1 시작 페이지의 결괏값을 클라이언트에 반환해야 한다면 `Pageable`을 사용하지 않고 `PageRequest`를 직접 생성하고 최종 응답 객체 역시 직접 만들어 반환하는 방식이 권장됨

<br/><br/>

## 연습 문제

1. Spring Data JPA 리포지토리의 사용자 정의 메서드를 구현하는 주된 이유는 무엇일까요?

    a. 복잡한 쿼리나 JDBC, MyBatis 등 특정 기술을 사용해야 할 때

    - 사용자 정의 리포지토리는 Spring Data JPA가 지원하지 않는 복잡한 쿼리나 순수 JPA, JDBC 템플릿, MyBatis 등 다른 기술을 사용할 때 필요함. Spring Data JPA의 한계를 극복하기 위한 방법임

2. Spring Data JPA Auditing에서 엔티티의 생성 시간과 수정 시간을 자동으로 기록하기 위해 주로 사용하는 어노테이션 쌍은 무엇일까요?

    a. @CreatedDate, @LastModifiedDate

    - `@CreatedDate`는 엔티티가 생성될 때 시간을 자동 주입하고, `@LastModifiedDate`는 생성 및 수정될 때마다 시간을 갱신해 줌
    - `AuditorAware`는 사용자 정보를 기록할 때 필요한 인터페이스임

3. Spring Data JPA Auditing 설정 시, 현재 사용자(Auditor) 정보를 가져오기 위해 구현해야 하는 Spring Data 인터페이스는 무엇일까요?

    a. AuditorAware

    - `AuditorAware` 인터페이스를 구현하고 스프링 빈으로 등록해야 Spring Data Auditing이 `@CreatedBy`나 `@LastModifiedBy` 필드에 현재 사용자 정보를 채울 수 있음

4. Spring MVC 컨트롤러 메서드에서 웹 요청 파라미터(페이지 번호, 크기, 정렬)를 받아 페이징 및 정렬 기능을 쉽게 적용하도록 도와주는 Spring Data 인터페이스는 무엇일까요?

    a. Pageable

    - 컨트롤러 메서드 파라미터로 `Pageable` 타입을 사용하면 Spring이 자동으로 웹 요청 파라미터(`page`, `size`, `sort` 등)를 바인딩하여 페이징 및 정렬 정보를 제공해 줌

5. Spring 웹 컨트롤러에서 데이터베이스에서 조회한 엔티티 목록 또는 페이지를 클라이언트에 반환할 때, 내부 구현 정보 노출을 막고 유연성을 확보하기 위해 권장되는 방식은 무엇일까요?

    a. 엔티티를 DTO로 변환하여 반환

    - 엔티티를 외부에 직접 노출하면 내부 구조가 드러나고 변경이 어려워짐. API 계약 유지를 위해 엔티티를 DTO (Data Transfer Object)로 변환하여 반환하는 것이 가장 권장되는 좋은 설계 방식임

<br/><br/>

## 요약 정리

- Spring Data JPA가 기본으로 제공하지 못하는 복잡한 쿼리나 JDBC 연동 요건을 달성하기 위해 사용자 정의 리포지토리를 선언하고 인터페이스(`Custom`)와 구현체(`Impl`)를 병합 연결함
- 데이터의 생성 및 수정 이력(`createdDate`, `lastModifiedDate`) 등을 자동으로 추적하려면 진입 클래스에 `@EnableJpaAuditing`을 활성화한 후, 각 엔티티에 `AuditingEntityListener`를 적용한 `BaseTimeEntity`를 상속 활용하면 편리함
- 도메인 클래스 컨버터는 식별자 파라미터에서 엔티티 매개변수로 변환을 알아서 지원하지만, 영속성 컨텍스트 범위 외의 조회일 수 있어 반드시 단순 조회 용도로만 사용해야 함
- 컨트롤러 부분에서는 `Pageable` 객체를 활용해 페이징 파라미터를 손쉽게 바인딩하고, `Page` 객체의 `map()` 기능을 통해 반환용 DTO로 변환 과정을 거쳐 응답 구조를 구성하는 것이 안전함

<br/><br/>

## Reference

- [실전! 스프링 데이터 JPA](https://www.inflearn.com/course/스프링-데이터-JPA-실전)
