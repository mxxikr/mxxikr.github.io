---
title: '[김영한의 스프링 MVC 1편 백엔드 웹 개발 핵심 기술] 스프링 MVC 메시지, 국제화'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-25 16:30:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, message, i18n, locale, message-source, accept-language]
math: false
mermaid: true
---
# 스프링 MVC 메시지, 국제화

- 김영한님의 스프링 MVC 1편 강의를 통해 하드코딩된 텍스트 관리의 문제점을 해결하는 메시지 기능과, 다양한 언어를 지원하기 위한 국제화 기능의 원리와 적용 방법을 정리함

<br/><br/>

## 메시지, 국제화의 필요성

### 메시지 (Message) 도입
- **상황**
  - 다양한 화면에서 보이는 문구가 여러 파일에 하드코딩되어 분산되어 있음
  - 동일한 문구를 변경하거나 관리할 때 모든 파일을 일일이 찾아 수정해야 하는 번거로움 발생

- **문제점**
  - **유지보수 어려움**
    - 텍스트가 코드에 박혀 있어 수정 시 여러 파일을 건드려야 함
  - **일관성 부족**
    - 같은 용어를 다른 화면에서 다르게 표기할 위험 존재

- **해결책**
  - `messages.properties`와 같은 별도 파일에 텍스트를 모아둠
  - 각 HTML에서 키(key) 값으로 불러와서 사용
  - 텍스트 변경 시 프로퍼티 파일 한 곳만 수정하면 모든 화면에 즉시 반영

### 국제화

- **배경**
  - 애플리케이션을 한국어 사용자뿐만 아니라 영어 사용자에게도 제공해야 하는 경우
  - 각 언어별로 별도의 HTML 파일을 만드는 것은 비효율적

- **해결책**
  - `messages_ko.properties`, `messages_en.properties` 등 언어별 메시지 파일 관리
  - 사용자의 언어 설정(Locale)에 따라 알맞은 파일에서 메시지를 꺼내 사용

<br/><br/>

## 스프링 메시지 소스 설정

### MessageSource 인터페이스

- **개요**
  - 스프링은 메시지 관리 기능을 `MessageSource` 인터페이스로 통합하여 제공
  - `getMessage(code, args, defaultMessage, locale)` 메서드를 통해 메시지 조회

   ```java
   public interface MessageSource {
      String getMessage(String code, Object[] args, String defaultMessage, Locale locale);
      String getMessage(String code, Object[] args, Locale locale) throws NoSuchMessageException;
   }
   ```

- 스프링 부트를 사용하면 `MessageSource`를 자동으로 빈으로 등록

### 스프링 부트 자동 설정

- **application.properties**

  ```properties
  spring.messages.basename=messages,config.i18n.messages
  ```

   - `application.properties` 설정만으로 구성 가능

   - **기본값**
      - `messages` (`/resources/messages.properties`)
      - 여러 파일을 지정할 수 있으며, 콤마(`,`)로 구분

### 메시지 파일 만들기
- `hello`
   - 리터럴 텍스트
- `hello.name`
   - 파라미터를 받는 텍스트

- **한국어 (기본값)**
  - `/resources/messages.properties`

  ```properties
  hello=안녕
  hello.name=안녕 {0}
  ```

- **영어**
  - `/resources/messages_en.properties`

  ```properties
  hello=hello
  hello.name=hello {0}
  ```
### 메시지 사용 예시

- **사용 코드**
  - `MessageSource`를 주입받아 사용
  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/message/src/test/java/hello/itemservice/message/MessageSourceTest.java)

  ```java
  @Autowired
  MessageSource messageSource;
  
  void helloMessage() {
      // 기본 로케일 또는 시스템 로케일 (안녕)
      String result = messageSource.getMessage("hello", null, null);
      
      // 영어 로케일 (hello)
      String resultEn = messageSource.getMessage("hello", null, Locale.ENGLISH);
  }
  ```

<br/><br/>

## 웹 애플리케이션과 국제화

### 웹에서의 Locale 결정

- **동작 원리**
  - 웹 브라우저는 클라이언트가 선호하는 언어 정보를 HTTP 헤더에 담아 전송
- **Accept-Language**
  - 클라이언트가 선호하는 자연 언어 목록

- **요청 예시**

  ```http
  GET /items HTTP/1.1
  Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
  ```

### 스프링의 LocaleResolver

- **개요**
  - 스프링 MVC는 `LocaleResolver` 인터페이스를 통해 요청으로부터 Locale을 결정
  - `resolveLocale(request)`, `setLocale(request, response, locale)` 메서드 제공

- **구현체 종류**
  - **AcceptHeaderLocaleResolver** (기본값)
    - `Accept-Language` 헤더 사용
  - **CookieLocaleResolver**
    - 쿠키에 Locale 저장
  - **SessionLocaleResolver**
    - 세션에 Locale 저장
  - **FixedLocaleResolver**
    - 특정 Locale로 고정

- **참고**
  - 사용자가 직접 언어를 선택(버튼 클릭 등)하여 변경하려면 쿠키나 세션 방식의 Resolver를 별도로 설정해야 함

<br/><br/>

## 타임리프 메시지 적용

### 타임리프 메시지 표현식

- **문법**
  - `#{}`

- **기존 HTML**

  ```html
  <label for="itemName">상품명</label>
  ```

- **타임리프 적용**

  ```html
  <label for="itemName" th:text="#{label.item.itemName}">상품명</label>
  ```

- **동작**
  - `#{label.item.itemName}`
    - `messageSource.getMessage("label.item.itemName", ...)` 호출
    - 현재 Locale에 맞는 텍스트로 자동 렌더링

<br/><br/>

## 연습 문제

1. 웹 애플리케이션에서 사용자에게 보여질 텍스트(예: 버튼 라벨)를 코드 안에 직접 작성하는 것(하드코딩)의 주요 문제점은 무엇일까요?

   a. 텍스트 수정 시 여러 파일을 일일이 변경해야 해서 비효율적이에요.

   - 코드에 텍스트를 직접 넣으면 문구 변경 시 관련 코드를 모두 찾아 수정해야 해서 불편하고 실수하기도 쉬워짐
   - 별도 관리의 필요성이 생김

2. 메시지 국제화와 지역화를 위해 여러 언어의 텍스트 메시지를 효율적으로 관리하는 일반적인 방법은 무엇인가요?
   
   a. 키-값 쌍 형태의 별도 프로퍼티 파일로 관리하기

   - `messages.properties`와 같은 파일에 키와 값 형태로 저장하면 중앙 집중 관리가 가능
   - 언어별 파일 분리로 지역화가 쉬워짐

3. 스프링 부트 환경에서 메시지 소스(MessageSource) 설정이 다른 스프링 환경보다 간단해지는 주된 이유는 무엇일까요?

   a. 개발자가 MessageSource 빈을 직접 등록할 필요 없이 자동 설정돼요.

   - 스프링 부트는 관례에 따라 `messages.properties` 파일을 자동으로 찾아 MessageSource 빈으로 등록
   - 개발자가 직접 설정할 일이 줄어 편리함

4. 스프링에서 MessageSource 빈을 이용해 메시지를 가져올 때, 어떤 정보가 제공되어야 요청한 언어에 맞는 메시지를 선택할 수 있을까요?

   a. 현재 사용자의 Locale 정보

   - MessageSource는 `getMessage()` 메서드에 전달된 Locale 정보를 이용
   - 해당 Locale에 맞는 메시지 파일(`messages_en.properties` 등)에서 키에 해당하는 값을 찾아 반환

5. 웹 애플리케이션 사용자의 선호 언어를 감지하기 위해 스프링이 기본적으로 사용하는 HTTP 요청 헤더는 무엇일까요?

   a. Accept-Language (클라이언트가 지원하는 언어)

   - 웹 브라우저는 사용자가 설정한 언어 목록을 Accept-Language 헤더에 담아 서버에 전송
   - 스프링은 기본적으로 이 헤더 값을 이용해 사용자의 Locale을 결정

<br/><br/>

## Reference

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
