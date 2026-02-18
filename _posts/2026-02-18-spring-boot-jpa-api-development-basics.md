---
title: '[실전! 스프링 부트와 JPA 활용2] API 개발 기본'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-18 16:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, api, rest, dto, member-api]
math: false
mermaid: false
---

# API 개발 기본

- 김영한님의 실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화 강의를 기반으로 회원 API의 등록, 수정, 조회 기능을 엔티티 직접 사용 방식과 DTO 사용 방식으로 비교하며, API 개발의 표준적인 접근 방식을 정리함

<br/><br/>

## API 전체 구조

![API 전체 구조](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/api-structure.png)

- **MemberApiController**가 회원 등록, 수정, 조회 API를 담당함
- 각 API는 V1(비권장)과 V2(권장) 두 가지 버전으로 구현됨
    - V1은 엔티티를 직접 사용하는 방식
    - V2는 DTO를 사용하는 방식

<br/><br/>

## 회원 등록 API

### V1: 엔티티를 직접 Request Body에 매핑 (비권장)

![V1 회원 등록 시퀀스](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/member-register-v1-sequence.png)

```java
@PostMapping("/api/v1/members")
public CreateMemberResponse saveMemberV1(@RequestBody @Valid Member member) {
    Long id = memberService.join(member);
    return new CreateMemberResponse(id);
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/MemberApiController.java)

- **문제점**
    - 엔티티에 API 검증 로직(`@NotEmpty` 등)이 추가되어 프레젠테이션 계층과 도메인 계층이 결합됨
    - API가 다양해질수록 하나의 엔티티에 모든 요구사항을 담기 어려움
    - 엔티티가 변경되면 API 스펙도 함께 변경됨

### V2: DTO를 Request Body에 매핑 (권장)

![V2 회원 등록 시퀀스](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/member-register-v2-sequence.png)

```java
@PostMapping("/api/v2/members")
public CreateMemberResponse saveMemberV2(@RequestBody @Valid CreateMemberRequest request) {
    Member member = new Member();
    member.setName(request.getName());
    Long id = memberService.join(member);
    return new CreateMemberResponse(id);
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/MemberApiController.java)

- **장점**
    - 별도의 `CreateMemberRequest` DTO를 통해 엔티티와 API 스펙을 완전히 분리함
    - 엔티티가 변해도 API 스펙이 변하지 않음
    - API마다 독립적인 요청 스펙을 유지할 수 있음

<br/><br/>

## 회원 수정 API

### V2: DTO를 요청 파라미터에 매핑 (권장)

![회원 수정 시퀀스](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/member-update-sequence.png)

```java
memberService.update(id, request.getName());
Member findMember = memberService.findOne(id);
return new UpdateMemberResponse(findMember.getId(), findMember.getName());
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/MemberApiController.java)

- **서비스 - 변경 감지**

    ```java
    @Transactional
    public void update(Long id, String name) {
        Member member = memberRepository.findOne(id);
        member.setName(name); // 변경 감지로 자동 UPDATE 쿼리 실행
    }
    ```
    - [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/service/MemberService.java)

- **REST 방식 주의**
    - `PUT`은 전체 업데이트에 사용하는 것이 원칙임
    - 부분 업데이트에는 `PATCH` 또는 `POST`를 사용하는 것이 REST 스타일에 맞음

<br/><br/>

## 회원 조회 API

### V1: 엔티티를 직접 외부에 노출 (비권장)

![V1 회원 조회 시퀀스](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/member-list-v1-sequence.png)

```java
@GetMapping("/api/v1/members")
public List<Member> membersV1() {
    return memberService.findMembers();
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/MemberApiController.java)

- **문제점**
    - 엔티티의 모든 필드가 외부에 노출됨
    - 응답 스펙 조정을 위해 `@JsonIgnore` 등 뷰 관련 로직이 엔티티에 추가됨
    - 엔티티가 변경되면 API 스펙도 함께 변함
    - 컬렉션을 직접 반환하면 향후 API 스펙을 변경하기 어려움

### V2: DTO를 통해 반환 (권장)

![V2 회원 조회 시퀀스](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/member-list-v2-sequence.png)

```java
@GetMapping("/api/v2/members")
public Result membersV2() {
    List<Member> findMembers = memberService.findMembers();
    List<MemberDto> collect = findMembers.stream()
            .map(m -> new MemberDto(m.getName()))
            .collect(Collectors.toList());
    return new Result(collect);
}
```
- [전체 코드 보기](https://github.com/mxxikr/springboot-jpa-part2/blob/master/jpashop/src/main/java/jpabook/jpashop/api/MemberApiController.java)

- **장점**
    - 엔티티를 `MemberDto`로 변환하여 필요한 필드만 노출함
    - `Result` 래퍼 클래스로 컬렉션을 감싸 향후 필드 추가가 용이함
    - 엔티티가 변해도 API 스펙이 변경되지 않음

<br/><br/>

## 엔티티와 DTO 사용 비교

![엔티티와 DTO 비교](/assets/img/jpa/2026-02-18-spring-boot-jpa-api-development-basics/entity-vs-dto.png)

| 구분 | 엔티티 직접 사용 | DTO 사용 |
|------|----------------|----------|
| API 스펙 안정성 | 엔티티 변경 시 스펙 변경됨 | 엔티티 변경에 독립적 |
| 필드 노출 제어 | 모든 필드가 노출됨 | 필요한 필드만 노출 |
| 계층 분리 | 도메인-프레젠테이션 결합 | 계층 분리 가능 |
| 다양한 API 지원 | 하나의 엔티티로 대응 어려움 | API별 독립적 DTO 설계 가능 |
| 실무 적합성 | 비권장 | 권장 |

<br/><br/>

## 연습 문제

1. API 개발에서 JPA 엔티티 객체를 요청 파라미터나 응답 값으로 직접 사용하는 것을 지양해야 하는 주된 이유는 무엇일까요?

   a. API의 스펙이 엔티티의 변화에 직접적으로 영향을 받기 때문

   - API 스펙이 엔티티 변화에 묶여버리면, 엔티티 수정 시 클라이언트 API가 깨지는 문제가 발생함

2. API 요청/응답에서 DTO(Data Transfer Object)를 사용하면 어떤 이점을 얻을 수 있나요?

   a. 엔티티와 API 스펙을 분리하고 필요한 데이터만 선별적으로 노출할 수 있음

   - DTO를 사용하면 엔티티 내부 구현이 외부에 노출되지 않아 안전하며, API별로 필요한 데이터만 정확히 전달하고 스펙을 독립적으로 관리할 수 있음

3. 강의에서 'API 개발의 표준적인 접근 방식'으로 가장 강조된 내용은 무엇인가요?

   a. API 입/출력 시 엔티티를 직접 사용하지 않고 항상 DTO를 활용하여 분리해야 함

   - 엔티티는 내부 로직에 집중하고, 외부와의 통신(API)에는 항상 DTO를 사용하여 분리하는 것이 바람직한 설계임

4. 회원 정보 수정을 위한 API를 RESTful 방식으로 설계할 때, 일반적으로 어떤 HTTP 메서드를 사용하는 것이 권장될까요?

   a. PUT

   - RESTful API 설계에서 리소스를 생성할 때는 `POST`, 기존 리소스 전체를 갱신할 때는 `PUT` 메서드를 사용하는 것이 일반적인 규약임

5. API로 목록 데이터를 조회할 때, 응답을 단순 JSON 배열로 반환하는 대신 별도의 'Wrapper' 객체(예: Result 클래스) 안에 배열을 담아 반환하는 방식의 장점은 무엇인가요?

   a. 응답 데이터에 목록 외의 부가 정보(예: 총 개수, 상태 코드)를 유연하게 추가할 수 있음

   - 단순 배열로는 메타데이터(총 개수 등)를 함께 보내기 어렵지만, 객체로 감싸면 데이터 목록 외에 필요한 추가 정보를 유연하게 담을 수 있어 편리함

<br/><br/>

## 요약 정리

- **회원 등록 API**는 V1(엔티티 직접 사용)에서 V2(DTO 사용)로 개선하여 엔티티와 API 스펙을 분리하고, API별 독립적인 요청 스펙을 유지함
- **회원 수정 API**는 `PUT` 메서드를 사용하며, 변경 감지(Dirty Checking)를 통해 데이터를 수정함
- **회원 조회 API**는 엔티티 직접 노출 대신 DTO로 변환하여 반환하고, `Result` 래퍼 클래스로 컬렉션을 감싸 확장성을 확보함
- 엔티티를 API 스펙에 직접 노출하지 않고, 요청과 응답 모두 별도의 DTO를 사용하여 도메인 모델을 안정적으로 유지하는 것이 원칙임

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용2 - API 개발과 성능 최적화](https://www.inflearn.com/course/스프링부트-JPA-API개발-성능최적화)
