---
title: '[김영한의 스프링 MVC 2편 백엔드 웹 개발 활용 기술] 스프링 타입 컨버터'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-30 12:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, mvc, converter, formatter, conversion-service]
math: false
mermaid: true
---

# 스프링 타입 컨버터

- 김영한님의 스프링 MVC 2편 강의를 통해 스프링이 제공하는 타입 컨버터의 개념과 다양한 구현 방법(`Converter`, `Formatter`)을 이해하고, 이를 스프링에 적용하여 웹 애플리케이션에서 효율적으로 데이터를 변환하는 방법을 정리함

<br/><br/>

## 타입 컨버터 소개

### 타입 변환의 필요성

- 애플리케이션을 개발하다 보면 문자, 숫자, 불린, Enum 등 다양한 타입 간의 변환이 필요함
- HTTP 요청 파라미터는 모두 문자열로 처리되므로, 이를 적절한 자바 객체로 변환하는 작업이 필수적임

### 서블릿 방식의 타입 변환

- **기본 방식 (HttpServletRequest)**
  - HTTP 요청 파라미터(`request.getParameter()`)는 모두 문자(String)로 조회됨
  - 따라서 숫자로 사용하려면 `Integer.valueOf()` 같은 수동 변환 과정이 필요함


    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/controller/HelloController.java)

### 스프링의 타입 변환

- **스프링 방식 (@RequestParam)**
  - 스프링이 중간에서 타입을 자동으로 변환해줌
  - `@RequestParam Integer data`와 같이 선언하면, 문자 "10"을 자동으로 숫자 10으로 변환함


    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/controller/HelloController.java)

### 스프링의 다양한 타입 변환 지원

- **스프링 MVC 요청 파라미터**
    - `@RequestParam`, `@ModelAttribute`, `@PathVariable`
- **설정 정보**
    - `@Value` 등으로 YML/Properties 정보 읽기
- **XML 스프링 빈 설정**
- **뷰 렌더링**

![스프링 타입 컨버터](/assets/img/spring-type-converter-overview.png)

### 컨버터 인터페이스

- **Converter 인터페이스**
  - 스프링은 확장 가능한 컨버터 인터페이스를 제공함
  - 모든 타입에 대해 적용 가능하며, 양방향 변환이 필요하면 두 개의 컨버터를 구현하면 됨

    ```java
    package org.springframework.core.convert.converter;

    public interface Converter<S, T> {
        T convert(S source);
    }
    ```

> - 과거에는 `PropertyEditor`를 사용했으나, 동시성 문제가 있어 현재는 스레드 안전한 `Converter`를 주로 사용함

<br/><br/>

## 타입 컨버터 구현

### 기본 컨버터 구현

> - `org.springframework.core.convert.converter.Converter`를 임포트해야 함

- **StringToIntegerConverter**
  - 문자를 숫자로 변환

```java
public class StringToIntegerConverter implements Converter<String, Integer> {
    
    @Override
    public Integer convert(String source) {
        return Integer.valueOf(source);
    }
}
```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/converter/StringToIntegerConverter.java)

- **IntegerToStringConverter**
  - 숫자를 문자로 변환

    ```java
    public class IntegerToStringConverter implements Converter<Integer, String> {
        
        @Override
        public String convert(Integer source) {
            return String.valueOf(source);
        }
    }
    ```


    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/converter/IntegerToStringConverter.java)

### 사용자 정의 타입 컨버터

- **IpPort 클래스**
  - "127.0.0.1:8080" 같은 문자열을 객체로 변환하거나 그 반대로 변환하는 경우

  - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/type/IpPort.java)

- **StringToIpPortConverter**
  - 문자열 분리 후 객체 생성

  ```java
  public class StringToIpPortConverter implements Converter<String, IpPort> {
      
      @Override
      public IpPort convert(String source) {
          String[] split = source.split(":");
          String ip = split[0];
          int port = Integer.parseInt(split[1]);
          return new IpPort(ip, port);
      }
  }
  ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/converter/StringToIpPortConverter.java)

- **IpPortToStringConverter**
  - 객체 정보를 문자열로 결합

  ```java
  public class IpPortToStringConverter implements Converter<IpPort, String> {
      
      @Override
      public String convert(IpPort source) {
          return source.getIp() + ":" + source.getPort();
      }
  }
  ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/converter/IpPortToStringConverter.java)

### 컨버터의 한계와 해결

- **한계**
  - 개발자가 직접 컨버터를 하나하나 생성해서 사용하는 것은 불편함
- **해결책**
  - 컨버터를 등록하고 관리하면서, 필요할 때 자동으로 변환해주는 서비스인 **ConversionService**가 필요함

<br/><br/>

## 컨버전 서비스 (ConversionService)

### ConversionService 인터페이스

```java
public interface ConversionService {
    boolean canConvert(@Nullable Class<?> sourceType, Class<?> targetType);
    boolean canConvert(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType);
    <T> T convert(@Nullable Object source, Class<T> targetType);
    Object convert(@Nullable Object source, @Nullable TypeDescriptor sourceType, TypeDescriptor targetType);
}
```
- **등록 가능 여부 확인**
  - `canConvert()`
- **변환 실행**
  - `convert()`


### 사용 구조

- **동작 원리**
  - 클라이언트는 `ConversionService`에 변환을 요청함
  - `ConversionService`는 내부에 등록된 적절한 컨버터를 찾아 실행함

    ![ConversionService 구조](/assets/img/conversion-service-structure.png)

### 등록과 사용 분리 (ISP 원칙)

- **인터페이스 분리 원칙 (ISP)**
  - `DefaultConversionService`는 `ConversionService`(사용)와 `ConverterRegistry`(등록) 인터페이스를 모두 구현함
- **장점**
  - 컨버터를 사용하는 클라이언트는 등록에 대해 몰라도 됨
  - 컨버터를 등록하는 설정 코드는 사용에 대해 몰라도 됨
  - 관심사의 명확한 분리가 가능함


> HttpMessageConverter와 구분
> - JSON(`@RequestBody`) 변환은 Jackson 라이브러리가 담당하므로 `ConversionService`와 관련 없음
> - JSON 포맷 변경은 `@JsonFormat` 등을 사용해야 함

<br/><br/>

## 스프링에 Converter 적용하기

### WebConfig 설정

- **설정 방법**
  - `WebMvcConfigurer` 인터페이스의 `addFormatters` 메서드를 구현하여 등록함
  - 스프링이 내부에서 사용하는 `ConversionService`에 컨버터가 추가됨

  ```java
  @Configuration
  public class WebConfig implements WebMvcConfigurer {
      
      @Override
      public void addFormatters(FormatterRegistry registry) {
          registry.addConverter(new StringToIntegerConverter());
          registry.addConverter(new IntegerToStringConverter());
          registry.addConverter(new StringToIpPortConverter());
          registry.addConverter(new IpPortToStringConverter());
      }
  }
  ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/WebConfig.java)

### 동작 확인 및 우선순위

- **동작 확인**
  - `@RequestParam` 등으로 파라미터를 받을 때, 등록한 컨버터가 자동으로 적용됨
  - ex) `?ipPort=127.0.0.1:8080` 요청 시 `IpPort` 객체로 자동 변환됨

- **우선순위**
  - 스프링이 내부적으로 제공하는 기본 컨버터보다 사용자가 직접 등록한 컨버터가 우선순위가 높음

### 처리 과정

![처리 과정 상세](/assets/img/processing-detail.png)

<br/><br/>

## 뷰 템플릿에 컨버터 적용하기

### 타임리프 지원

- **표현식**
  - `${...}`
    - 변수 그대로 출력 (컨버터 미적용)
  - `${{...}}`
    - 컨버전 서비스를 적용하여 변환된 결과 출력 (이중 중괄호)

### 사용 예시

- **객체 출력**
  - `${{ipPort}}` 사용 시 `IpPortToStringConverter`가 실행되어 "127.0.0.1:8080" 문자열로 출력됨

- **폼 적용 (`th:field`)**
  - `th:field="*{ipPort}"`는 자동으로 컨버전 서비스를 사용하여 화면에 출력할 때 문자열로 변환해줌
  - 값을 입력하고 전송할 때도 자동으로 객체로 변환됨

    ```html
    <!-- 뷰 템플릿 -->
    <ul>
        <li>${ipPort}: <span th:text="${ipPort}"></span></li>
        <li>${{ipPort}}: <span th:text="${{ipPort}}"></span></li>
    </ul>
    ```

<br/><br/>

## 포맷터 (Formatter)

### Converter와 Formatter 비교

- **Converter**
  - 범용적인 타입 변환 (객체 ↔ 객체)
  - 입력/출력 타입에 제한이 없음

- **Formatter**
  - 문자에 특화된 변환 (객체 ↔ 문자)
  - **Locale(현지화)** 정보를 활용할 수 있음
  - ex) 숫자 1000 → "1,000" (쉼표 추가), 날짜 포맷팅

### Formatter 인터페이스

- **구조**
  - `Printer<T>`
    - 객체를 문자로 변환 (`print`)
  - `Parser<T>`
    - 문자를 객체로 변환 (`parse`)

    ```java
    public interface Formatter<T> extends Printer<T>, Parser<T> {
    }
    ```

### 포맷터 구현

- **MyNumberFormatter**
  - `NumberFormat`을 사용하여 쉼표가 들어간 숫자 포맷 처리

  ```java
  public class MyNumberFormatter implements Formatter<Number> {
      
      @Override
      public Number parse(String text, Locale locale) throws ParseException {
            // "1,000" -> 1000
            return NumberFormat.getInstance(locale).parse(text);
      }
      
      @Override
      public String print(Number object, Locale locale) {
            // 1000 -> "1,000"
            return NumberFormat.getInstance(locale).format(object);
      }
  }
  ```

 - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/formatter/MyNumberFormatter.java)

<br/><br/>

## 포맷터를 지원하는 컨버전 서비스

### FormattingConversionService

- **역할**
  - `ConversionService`에는 `Formatter`를 직접 등록할 수 없음
  - `FormattingConversionService`는 포맷터를 컨버터처럼 사용할 수 있도록 어댑터 역할을 수행하며 지원함
  - 내부에서 `Formatter`를 `Converter`로 감싸서 등록함

![FormattingConversionService](/assets/img/formatting-conversion-service.png)

<br/><br/>

## 포맷터 적용하기

### 설정 등록

- **등록 방법**
  - `addFormatters` 메서드에서 `registry.addFormatter()`를 사용

  ```java
      @Override
      public void addFormatters(FormatterRegistry registry) {
          // 포맷터 등록
          registry.addFormatter(new MyNumberFormatter());
      }
  ```
    - [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/WebConfig.java)

- **주의사항**
  - 컨버터와 포맷터가 같은 타입 변환을 담당하면, **컨버터가 우선순위**를 가짐
  - 포맷터를 적용하려면 겹치는 컨버터를 제거하거나 주석 처리해야 함

<br/><br/>

## 스프링이 제공하는 기본 포맷터

### 애노테이션 기반 포맷터

- **필요성**
  - 포맷터를 전역으로 등록하면 모든 필드에 동일한 형식이 적용됨
  - 필드마다 다른 형식(예: 날짜 패턴)을 적용하고 싶을 때 애노테이션 방식이 유용함

- **제공 애노테이션**
  - `@NumberFormat`
    - 숫자 관련 형식 지정 패턴
  - `@DateTimeFormat`
    - 날짜/시간 관련 형식 지정 패턴

### 사용

```java
    @Data
    static class Form {
        @NumberFormat(pattern = "###,###")
        private Integer number;
        
        @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime localDateTime;
    }
```
- [전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/typeconverter/src/main/java/hello/typeconverter/controller/FormatterController.java)

- `number`
  - 10000 → "10,000"
- `localDateTime`
  - 날짜 객체 → "2021-01-01 00:00:00" 지정된 포맷으로 출력

<br/><br/>

## 정리

- **타입 컨버터와 포맷터**
  - `Converter`는 객체 간의 범용적인 타입 변환을 처리하고, `Formatter`는 객체와 문자 간의 변환(Locale 지원)을 담당함
- **컨버전 서비스**
  - `ConversionService`는 `Converter`와 `Formatter`를 등록하고 관리하며, 클라이언트가 일관된 방식으로 타입 변환을 할 수 있도록 지원함
  - ISP 원칙을 통해 사용(`ConversionService`)과 등록(`ConverterRegistry`)을 분리하여 관심사를 나눔
- **스프링의 적용**
  - 스프링 MVC는 내부적으로 `ConversionService`를 사용하여 `@RequestParam`, `@ModelAttribute`, `@PathVariable`, 뷰 템플릿 등에서 자동으로 타입을 변환해줌
- **참고**
  - `HttpMessageConverter`는 HTTP 메시지 본문 처리(JSON 등)를 담당하며 `ConversionService`와는 별개임

<br/><br/>

## 연습 문제
1. Spring이 기본 서블릿 요청과 달리 파라미터 타입 변환을 어떻게 편리하게 처리할까요?

   a. String으로 받은 파라미터를 필요한 타입으로 자동 변환해 줍니다.

    - Spring은 내부 변환 서비스로 문자열 파라미터를 필요한 타입으로 자동 변환해 개발자가 직접 코드를 작성할 필요가 없어 편리함

2. Spring MVC에서 @RequestParam, @PathVariable 등 요청 데이터를 받을 때, 타입 변환은 주로 어디서 일어날까요?

   a. `@RequestParam`, `@PathVariable` 등의 파라미터 처리 시

    - `@RequestParam`이나 `@PathVariable` 등으로 넘어온 문자열 요청 파라미터는 Spring의 변환 메커니즘을 거쳐 컨트롤러 메서드의 인자 타입으로 변환됨

3. 두 가지 다른 타입(S, T) 간의 일반적인 변환을 담당하는 Spring 인터페이스는 무엇일까요?

   a. Converter

   - `Converter<S, T>`는 어떤 타입 S를 다른 타입 T로 변환하는 가장 기본적인 인터페이스로, 타입 자체의 변환에 집중함

4. Spring에서 다양한 타입 변환기(`Converter`) 구현체들을 등록하고 일관되게 사용하게 돕는 핵심 요소는 무엇일까요?

   a. ConversionService

   - `ConversionService`는 여러 `Converter` 구현체들을 한데 모아 관리하며, 변환 가능 여부 확인 및 실제 변환 실행을 일관된 방식으로 제공함

5. Spring의 `ConversionService`는 주로 어떤 기능을 제공할까요?

   a. 변환 가능한지 확인하거나 실제 변환을 수행합니다.

   - `ConversionService`는 특정 변환이 가능한지 묻거나(`canConvert`), 실제 변환을 요청하는(`convert`) 두 가지 핵심 기능을 제공하며 추상화된 인터페이스임

6. Spring의 `Converter`와 `Formatter`의 가장 큰 차이점은 무엇일까요?

   a. `Converter`는 일반 타입, `Formatter`는 Locale 지원/문자열 특화입니다.

   - `Formatter`는 Locale을 지원하며 주로 객체와 '특정 형식'의 문자열 간 변환에 쓰이지만, `Converter`는 일반적인 타입 간 변환에 사용됨

7. '1,000' 같은 특정 형식의 문자열을 숫자 객체로 변환하거나 그 반대 작업을 할 때, 주로 어떤 변환 기능을 사용할까요?

   a. `Formatter`

   - `Formatter`는 숫자나 날짜 등 '형식'이 중요한 데이터를 객체와 문자열 간 변환할 때 사용되며, Locale에 따른 다양한 형식 처리에 강점이 있음

8. `Converter`와 `Formatter`를 모두 관리하고 변환 기능을 제공하는 Spring 서비스는 무엇일까요?

   a. `FormattingConversionService`

   - `FormattingConversionService`는 `ConversionService`를 확장하여 `Converter`는 물론 `Formatter`까지 모두 등록하고 관리하여 변환 기능을 통합 제공함

9. Spring 웹 애플리케이션에서 `ConversionService`가 주로 활용되는 곳은 어디일까요?

   a. 요청 파라미터, 경로 변수, 모델 속성 처리 및 뷰 템플릿

   - 요청 파라미터(`@RequestParam`), 경로 변수(`@PathVariable`), 모델 속성(`@ModelAttribute`), 그리고 뷰 템플릿(`@{...}`) 등에서 객체와 문자열 간 변환 시 `ConversionService`가 사용됨

10. HTTP 메시지 변환(JSON/XML 등)을 처리하는 `HttpMessageConverter`와 `ConversionService`의 역할 차이는 무엇일까요?

    a. `ConversionService`는 내부 타입, `HttpMessageConverter`는 HTTP 본문 변환 처리

    - `ConversionService`는 요청 파라미터, 경로 변수 등 애플리케이션 내부 타입 변환에, `HTTP Message Converter`는 HTTP 메시지 본문의 객체-바이트 변환에 쓰임

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
