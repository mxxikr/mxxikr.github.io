---
title: '[실전! 스프링 부트와 JPA 활용1] 애플리케이션 구현 준비'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-16 14:00:00 +0900
category: [Framework, Spring]
tags: [spring-boot, jpa, application-architecture, requirements-analysis]
math: false
mermaid: true
---

# 애플리케이션 구현 준비

- 김영한님의 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발 강의를 기반으로 애플리케이션 요구사항 분석, 아키텍처 설계, 그리고 개발 전략 수립 과정을 정리함

<br/><br/>

## 구현 요구사항

### HELLO SHOP 기능 개요

- **회원 기능**
    - 회원 가입
    - 회원 목록
- **상품 기능**
    - 상품 등록
    - 상품 수정
    - 상품 목록
- **주문 기능**
    - 상품 주문
    - 주문 내역

### 기능 상세

- **회원 기능 (Member)**

    - **회원 등록**
        - 새로운 회원 정보를 저장함
        - 이름과 주소는 필수 입력 항복임
    - **회원 조회**
        - 등록된 회원 목록을 전체 조회함

- **상품 기능 (Item)**

    - **상품 등록**
        - 새로운 상품 정보를 저장함
        - 상품 종류는 도서만 사용함
    - **상품 수정**
        - 기존 상품 정보를 변경함
        - 가격 및 재고 수량을 수정할 수 있음
    - **상품 조회**
        - 등록된 상품 목록을 전체 조회함

- **주문 기능 (Order)**

    - **상품 주문**
        - 상품을 선택하고 주문을 생성함
        - 회원, 상품, 주문 수량이 필요함
    - **주문 내역 조회**
        - 주문 이력을 확인함
        - 검색 조건을 적용할 수 있음
    - **주문 취소**
        - 주문 취소 처리를 수행함
        - 취소 시 재고 수량이 복구됨


<br/><br/>

## 애플리케이션 아키텍처

### 계층형 아키텍처

- **Presentation Layer**
    - `Controller`, `Web`
    - 사용자 요청과 응답을 담당함
- **Business Layer**
    - `Service`
    - 비즈니스 로직을 수행함
- **Persistence Layer**
    - `Repository`
    - 데이터베이스 접근을 담당함
- **Database Layer**
    - `DB`
    - 데이터 저장소
- **Domain Layer**
    - `Domain`, `Entity`
    - 비즈니스 도메인 객체

### 각 계층의 역할

- **Controller (웹 계층)**
    - HTTP 요청 및 응답 처리를 담당함
    - 파라미터 검증 및 DTO 변환을 수행함
    - `Spring MVC`, `Thymeleaf` 기술을 사용함
- **Service (비즈니스 계층)**
    - 핵심 비즈니스 로직을 처리함
    - 트랜잭션을 관리하며 계층 간 조율을 담당함
    - `@Service`, `@Transactional` 어노테이션을 사용함
- **Repository (영속성 계층)**
    - 엔티티를 조회하거나 저장함
    - `JPQL`, `QueryDSL`을 활용하여 데이터에 접근함
    - `JPA`, `Spring Data JPA` 기술을 사용함
- **Domain (도메인 계층)**
    - 비즈니스 도메인을 표현함
    - 엔티티 및 값 타입, 도메인 로직을 포함함
    - `JPA Entity`, `Value Object`를 사용함

### 계층 간 의존성

- **의존성 흐름**
    - `Controller`는 `Service`에 의존함
    - `Service`는 `Repository`에 의존함
    - `Repository`는 `Database`에 의존함
    - 모든 계층은 `Domain`에 의존할 수 있음
- **의존성 규칙**
    - 상위 계층은 하위 계층에 의존할 수 있음
    - 하위 계층은 상위 계층에 의존하면 안 됨

### 패키지 구조

- **jpabook.jpashop**
    - **domain**
        - 엔티티 클래스 (`Member`, `Order`, `OrderItem` 등)
        - 값 타입 (`Address`)
    - **exception**
        - 커스텀 예외 클래스
    - **repository**
        - 데이터 접근 계층 (`MemberRepository` 등)
    - **service**
        - 비즈니스 로직 (`MemberService` 등)
    - **web**
        - 웹 계층 (`MemberController` 등)

<br/><br/>

## 요약 정리

- **애플리케이션 요구사항**은 회원, 상품, 주문 기능을 포함함
- **아키텍처**는 Presentation, Business, Persistence, Database, Domain의 5계층 구조를 따름
- **패키지 구조**는 기능별이 아닌 계층별로 나누어(`domain`, `service`, `repository`, `web`) 관리함
- **개발 순서**는 핵심 도메인인 회원, 상품, 주문 순으로 진행하며, 도메인 모델 설계 후 엔티티와 테이블을 매핑함

<br/><br/>

## Reference

- [실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발](https://www.inflearn.com/course/스프링부트-JPA-활용-1)
