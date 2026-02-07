---
title: '[스프링 MVC 2편 백엔드 웹 개발 활용 기술] 타임리프 기본 기능'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-24 12:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, thymeleaf, template-engine, ssr, natural-template, spring-el, template-fragment, template-layout]
math: false
mermaid: false
---
# 타임리프 기본 기능

- 김영한님의 스프링 MVC 2편 강의를 통해 타임리프의 주요 기능인 텍스트 출력, 변수 표현식, 기본 객체, 유틸리티, URL 링크, 리터럴, 연산, 속성 설정, 반복과 조건부 평가, 주석, 블록, 자바스크립트 인라인, 템플릿 조각과 레이아웃 기능을 정리함

<br/><br/>

## 타임리프 소개

### 특징

- **서버 사이드 HTML 렌더링 (SSR)**
  - 백엔드 서버에서 HTML을 동적으로 렌더링
- **네츄럴 템플릿 (Natural Templates)**
  - 순수 HTML을 최대한 유지
  - 파일을 브라우저에서 직접 열어도 내용 확인 가능
  - 서버를 통하면 동적으로 변경된 결과 확인 가능
  - JSP는 브라우저에서 직접 열면 소스코드가 뒤섞여 정상 확인 불가
- **스프링 통합 지원**
  - 스프링의 다양한 기능을 편리하게 사용 가능

### 타임리프 사용 선언

```html
<html xmlns:th="http://www.thymeleaf.org">
```

### 기본 표현식

- **간단한 표현**
  - 변수
    - `${}`
  - 선택 변수
    - `*{}`
  - 메시지
    - `#{}`
  - 링크 URL
    - `@{}`
  - 조각
    - `~{}`
- **리터럴**
  - 텍스트
    - `'text'`
  - 숫자
    - `0`, `34`
  - 불린
    - `true`, `false`
  - 널
    - `null`
- **연산자**
  - 문자 연산
    - `+`, `||`
  - 산술 연산
    - `+`, `-`, `*`, `/`
  - 비교
    - `>`, `<`, `>=`, `<=`
  - 조건
    - `(if) ? (then) : (else)`

<br/><br/>

## 텍스트 출력

### 기본 텍스트 출력

- **`th:text` 속성**

  ```html
  <span th:text="${data}">기본 텍스트</span>
  ```

- **인라인 표현식**

  ```html
  컨텐츠 안에서 직접 출력 = [[${data}]]
  ```

### Escape와 Unescape

- **HTML 엔티티 (HTML Entities)**
    - 웹 브라우저는 `<`를 HTML 태그의 시작으로 인식함
    - 문자로 `<`를 표현하고 싶을 때 `&lt;` 같은 특수 문자로 변환하는 것을 HTML 엔티티라 함
  - 주요 엔티티
    - `<`
      - `&lt;`
    - `>`
      - `&gt;`
    - `"`
      - `&quot;`
    - `&`
      - `&amp;`

- **Escape (기본 동작)**
    - 특수 문자를 HTML 엔티티로 변경하는 것
    - 타임리프의 `th:text`, `[[...]]`는 기본적으로 Escape 제공 
    - 서버에서 `${data}` 값을 `Hello <b>Spring!</b>`으로 전달한 경우

      ```html
      <!-- th:text 사용 -->
      <span th:text="${data}"></span>
      
      <!-- 인라인 표현식 사용 -->
      [[${data}]]
      ```

      - 소스 코드
        - `Hello &lt;b&gt;Spring!&lt;/b&gt;`
      - 웹 브라우저
        - `Hello <b>Spring!</b>` 
        - 태그가 아닌 문자로 보임

- **Unescape**
    - 이스케이프 기능을 사용하지 않고 HTML 태그를 그대로 출력하는 것
    - `th:utext`, `[(...)]` 사용

      ```html
      <!-- th:utext 사용 -->
      <span th:utext="${data}"></span>
      
      <!-- 인라인 Unescape 표현식 사용 -->
      [(${data})]
      ```

      - 소스 코드
        - `Hello <b>Spring!</b>`
      - 웹 브라우저
        - Hello **Spring!**
        - Spring이 진하게 표시됨, 태그 적용

> **주의**
> 
> - **Escape(이스케이프)를 기본으로 사용해야 함**
> - Unescape를 사용하면 XSS(Cross-Site Scripting) 같은 보안 문제에 취약해질 수 있음
> - 사용자가 입력한 게시글 내용 등을 보여줄 때 Unescape를 섣불리 사용하면, 악의적인 스크립트가 실행될 수 있음
> - 꼭 필요한 경우에만 제한적으로 사용해야 함

- [텍스트 출력 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/text-basic.html)

<br/><br/>

## 변수 - SpringEL

### 변수 표현식

```
${}
```

### SpringEL 표현식 사용법

- **Object 접근**

  ```html
  <!-- 프로퍼티 접근 -->
  ${user.username}          <!-- user.getUsername() -->
  ${user['username']}       <!-- user.getUsername() -->
  ${user.getUsername()}     <!-- 메서드 직접 호출 -->
  ```

- **List 접근**

  ```html
  <!-- 인덱스로 접근 -->
  ${users[0].username}      <!-- list.get(0).getUsername() -->
  ${users[0]['username']}   <!-- list.get(0).getUsername() -->
  ${users[0].getUsername()} <!-- 메서드 직접 호출 -->
  ```

- **Map 접근**

  ```html
  <!-- 키로 접근 -->
  ${userMap['userA'].username}      <!-- map.get("userA").getUsername() -->
  ${userMap['userA']['username']}   <!-- map.get("userA").getUsername() -->
  ${userMap['userA'].getUsername()} <!-- 메서드 직접 호출 -->
  ```

### 지역 변수 선언

```html
<div th:with="first=${users[0]}">
    <p>처음 사람의 이름은 <span th:text="${first.username}"></span></p>
</div>
```

- 선언한 태그 안에서만 사용 가능

- [SpringEL 표현식 사용 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/variable.html)

<br/><br/>

## 기본 객체들

### 타임리프 기본 객체
- **제공되는 객체**
  - 타임리프는 렌더링 시점에 기본적으로 접근 가능한 객체들을 제공함
  - `#request`
    - `HttpServletRequest` 객체
  - `#response`
    - `HttpServletResponse` 객체
  - `#session`
    - `HttpSession` 객체
  - `#servletContext`
    - `ServletContext` 객체
  - `#locale`
    - 현재 로케일 정보

- **스프링 부트 3.0 이상 주의사항**
  - 스프링 부트 3.0부터는 `#request`, `#response`, `#session`, `#servletContext`를 타임리프에서 바로 사용할 수 없음
  - 해결 방법
    - 컨트롤러에서 필요한 객체를 `Model`에 직접 담아서 넘겨주어야 함
    - ex) `model.addAttribute("request", request);`
  - 예외
    - `#locale`은 스프링 부트 3.0 이상에서도 여전히 직접 사용 가능

- [기본 객체 사용 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/basic-objects.html)

### 편의 객체

- **HTTP 요청 파라미터 접근**

  ```html
  ${param.paramData}
  ```

- **HTTP 세션 접근**

  ```html
  ${session.sessionData}
  ```

- **스프링 빈 접근**

  ```html
  ${@helloBean.hello('Spring!')}
  ```

<br/><br/>

## 유틸리티 객체와 날짜

### 타임리프 유틸리티 객체

- **`#message`**
  - 메시지, 국제화
- **`#uris`**
  - URI 이스케이프
- **`#dates`**
  - Date 서식
- **`#calendars`**
  - Calendar 서식
- **`#temporals`**
  - Java8 날짜 서식
- **`#numbers`**
  - 숫자 서식
- **`#strings`**
  - 문자 편의 기능
- **`#objects`**
  - 객체 관련 기능
- **`#bools`**
  - boolean 기능
- **`#arrays`**
  - 배열 기능
- **`#lists`, `#sets`, `#maps`**
  - 컬렉션

### 자바8 날짜 (#temporals)

- **기본 사용**

  ```html
  <span th:text="${#temporals.format(localDateTime, 'yyyy-MM-dd HH:mm:ss')}"></span>
  ```

- **다양한 메서드**
  - 날짜 정보
    - `day()`, `month()`, `monthName()`, `year()`
  - 요일 정보
    - `dayOfWeek()`, `dayOfWeekName()`
  - 시간 정보
    - `hour()`, `minute()`, `second()`

- [날짜 유틸리티 사용 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/date.html)

> **참고**
>
> - 스프링 부트 3.2 이상은 자바8 날짜 지원 라이브러리 자동 포함

<br/><br/>

## URL 링크

### @{} 문법

- **단순한 URL**

  ```html
  <a th:href="@{/hello}">basic url</a>
  <!-- /hello -->
  ```

- **쿼리 파라미터**

  ```html
  <a th:href="@{/hello(param1=${param1}, param2=${param2})}">query param</a>
  <!-- /hello?param1=data1&param2=data2 -->
  ```

- **경로 변수 (Path Variable)**

  ```html
  <a th:href="@{/hello/{param1}/{param2}(param1=${param1}, param2=${param2})}">path variable</a>
  <!-- /hello/data1/data2 -->
  ```

- **경로 변수 + 쿼리 파라미터**

  ```html
  <a th:href="@{/hello/{param1}(param1=${param1}, param2=${param2})}">combined</a>
  <!-- /hello/data1?param2=data2 -->
  ```

### URL 경로 표현

- `/hello`
  - 절대 경로
- `hello`
  - 상대 경로

- [URL 링크 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/link.html)

<br/><br/>

## 리터럴 (Literals)

### 리터럴 종류

- 문자
  - `'hello'`
- 숫자
  - `10`
- 불린
  - `true`, `false`
- null
  - `null`

### 문자 리터럴 규칙

- **기본 규칙**

  ```html
  <!-- 작은 따옴표로 감싸야 함 -->
  <span th:text="'hello'">
  ```

- **생략 가능한 경우**

  ```html
  <!-- 공백 없이 이어지면 생략 가능 -->
  <span th:text="hello">
  
  <!-- 허용되는 문자: A-Z, a-z, 0-9, [], ., -, _ -->
  ```

- **오류 예시**

  ```html
  <!-- 오류: 공백이 있어서 생략 불가 -->
  <span th:text="hello world!"></span>
  
  <!-- 수정: 따옴표로 감싸기 -->
  <span th:text="'hello world!'"></span>
  ```

### 리터럴 대체 (Literal Substitutions)

```html
<!-- 기존 방식 -->
<span th:text="'hello ' + ${data}"></span>

<!-- 리터럴 대체 (권장) -->
<span th:text="|hello ${data}|"></span>
```

- 템플릿처럼 편리하게 사용 가능

- [리터럴 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/literal.html)

<br/><br/>

## 연산

### 산술 연산

```html
<li>10 + 2 = <span th:text="10 + 2"></span></li>
<li>10 % 2 == 0 = <span th:text="10 % 2 == 0"></span></li>
```

### 비교 연산

- **기호**
  - `>`, `<`, `>=`, `<=`
- **문자**
  - `gt`, `lt`, `ge`, `le`
- **동등**
  - `==`, `!=`
- **문자**
  - `eq`, `ne`

```html
<!-- HTML 엔티티 사용 -->
<li>1 &gt; 10 = <span th:text="1 &gt; 10"></span></li>

<!-- 문자 사용 (권장) -->
<li>1 gt 10 = <span th:text="1 gt 10"></span></li>
<li>1 ge 10 = <span th:text="1 ge 10"></span></li>
```

### 조건식

```html
<span th:text="(10 % 2 == 0)? '짝수':'홀수'"></span>
```

### Elvis 연산자

```html
<!-- 데이터가 있으면 표시, 없으면 기본값 -->
<span th:text="${data}?: '데이터가 없습니다.'"></span>
<span th:text="${nullData}?: '데이터가 없습니다.'"></span>
```

### No-Operation (_)

```html
<!-- _ 사용 시 타임리프가 실행되지 않은 것처럼 동작 -->
<span th:text="${data}?: _">데이터가 없습니다.</span>
<span th:text="${nullData}?: _">데이터가 없습니다.</span>
<!-- nullData가 null이면 "데이터가 없습니다." 그대로 출력 -->
```

- [연산 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/operation.html)

<br/><br/>

## 속성 값 설정

### 속성 설정 (th:*)

- **기본 설정**

  ```html
  <!-- 기존 속성을 대체 -->
  <input type="text" name="mock" th:name="userA" />
  <!-- <input type="text" name="userA" /> -->
  ```

- **동작 방식**
  - 기존 속성이 있으면 대체
  - 기존 속성이 없으면 새로 생성

### 속성 추가

- **th:attrappend**

  ```html
  <!-- 속성 값 뒤에 추가 -->
  <input type="text" class="text" th:attrappend="class=' large'" />
  <!-- class="text large" -->
  ```

- **th:attrprepend**

  ```html
  <!-- 속성 값 앞에 추가 -->
  <input type="text" class="text" th:attrprepend="class='large '" />
  <!-- class="large text" -->
  ```

- **th:classappend**

  ```html
  <!-- class 속성에 추가 -->
  <input type="text" class="text" th:classappend="large" />
  <!-- class="text large" -->
  ```

### checked 처리

- **HTML의 문제점**

  ```html
  <!-- HTML에서는 값과 관계없이 checked 속성만 있으면 체크됨 -->
  <input type="checkbox" checked="false" />
  <!-- 체크됨 (문제) -->
  ```

- **타임리프 사용해 해결**

  ```html
  <!-- false면 checked 속성 자체를 제거 -->
  <input type="checkbox" th:checked="true" />
  <!-- <input type="checkbox" checked="checked" /> -->
  
  <input type="checkbox" th:checked="false" />
  <!-- <input type="checkbox" /> -->
  ```

- [속성 값 설정 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/attribute.html)

<br/><br/>

## 반복 (th:each)

### 기본 반복

```java
List<User> users = Arrays.asList(
    new User("userA", 10),
    new User("userB", 20),
    new User("userC", 30)
);
```

```html
<tr th:each="user : ${users}">
    <td th:text="${user.username}">username</td>
    <td th:text="${user.age}">0</td>
</tr>
```

### 반복 상태 유지

```html
<tr th:each="user, userStat : ${users}">
    <td th:text="${userStat.count}">count</td>
    <td th:text="${user.username}">username</td>
    <td th:text="${user.age}">age</td>
</tr>
```

- 상태 변수 생략 가능
  - `user` + `Stat` = `userStat` (자동 생성)

- **반복 상태 속성**
  - `index`
    - 0부터 시작
  - `count`
    - 1부터 시작
  - `size`
    - 전체 사이즈
  - `even`
    - 짝수 여부
  - `odd`
    - 홀수 여부
  - `first`
    - 첫번째 여부
  - `last`
    - 마지막 여부
  - `current`
    - 현재 객체

- [반복 처리 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/each.html)

### 반복 가능 타입

- List
- 배열
- `java.util.Iterable`
- `java.util.Enumeration`
- Map (변수에 `Map.Entry` 담김)

<br/><br/>

## 조건부 평가

### if, unless

```html
<span th:text="'미성년자'" th:if="${user.age lt 20}"></span>
<span th:text="'미성년자'" th:unless="${user.age ge 20}"></span>
```

- 조건이 맞지 않으면 태그 자체를 렌더링하지 않음

### switch

```html
<td th:switch="${user.age}">
    <span th:case="10">10살</span>
    <span th:case="20">20살</span>
    <span th:case="*">기타</span>  <!-- 디폴트 -->
</td>
```

- `*`는 만족하는 조건이 없을 때 사용하는 디폴트

- [조건부 평가 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/condition.html)

<br/><br/>

## 주석

### 표준 HTML 주석

```html
<!--
<span th:text="${data}">html data</span>
-->
```

- 타임리프가 렌더링하지 않고 그대로 남김

### 타임리프 파서 주석

```html
<!--/* [[${data}]] */-->
<!--/*-->
<span th:text="${data}">html data</span>
<!--*/-->
```

- 렌더링에서 주석 부분 완전 제거

### 타임리프 프로토타입 주석

```html
<!--/*/
<span th:text="${data}">html data</span>
/*/-->
```
- HTML 파일을 브라우저에서 직접 열면 주석 처리됨
- 타임리프 렌더링을 거치면 정상 렌더링됨

- [주석 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/comments.html)

<br/><br/>

## 블록 (th:block)

### 특징
- **타임리프 자체 태그**
  - `<th:block>`은 HTML 태그가 아닌 타임리프의 유일한 자체 태그임
  - 타임리프의 기능(속성)을 사용하고 싶지만, 렌더링 결과에 어떠한 HTML 태그도 남기고 싶지 않을 때 사용
- **렌더링 결과**
  - 타임리프 엔진이 처리하고 난 후에는 태그 자체가 완전히 제거됨
  - 내부의 텍스트나 자식 요소들만 남게 됨

### 사용 예시
  - `div` 같은 태그 2개를 한 번에 반복해야 하는 경우
  - 기준이 되는 상위 태그가 딱히 없을 때 유용함

```html
<th:block th:each="user : ${users}">
    <div>
        사용자 이름 <span th:text="${user.username}"></span>
        사용자 나이 <span th:text="${user.age}"></span>
    </div>
    <div>
        요약 <span th:text="${user.username} + ' / ' + ${user.age}"></span>
    </div>
</th:block>
```

- [블록 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/block.html)

<br/><br/>

## 자바스크립트 인라인

### 사용 선언

```html
<script th:inline="javascript">
```

### 텍스트 렌더링

- **인라인 사용 전**

  ```javascript
  var username = [[${user.username}]];
  // var username = userA; (오류)
  ```

- **인라인 사용 후**

  ```javascript
  var username = [[${user.username}]];
  // var username = "userA"; (정상)
  ```

- **장점**
  - 문자 타입에 `"` 자동 포함
  - 자바스크립트 문제 문자 이스케이프 처리

### 자바스크립트 내추럴 템플릿

- **인라인 사용 전**

  ```javascript
  var username2 = /*[[${user.username}]]*/ "test username";
  // var username2 = /*userA*/ "test username"; (주석 처리됨)
  ```

- **인라인 사용 후**

  ```javascript
  var username2 = /*[[${user.username}]]*/ "test username";
  // var username2 = "userA";
  ```

### 객체 처리

- **인라인 사용 전**

  ```javascript
  var user = [[${user}]];
  // var user = BasicController.User(username=userA, age=10);
  ```

- **인라인 사용 후**

  ```javascript
  var user = [[${user}]];
  // var user = {"username":"userA","age":10};
  ```

- 객체를 JSON으로 자동 변환

- [자바스크립트 인라인 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/basic/javascript.html)

<br/><br/>

## 템플릿 조각

### 템플릿 조각 정의

```html
<footer th:fragment="copy">
    푸터 자리 입니다.
</footer>

<footer th:fragment="copyParam (param1, param2)">
    <p>파라미터 자리 입니다.</p>
    <p th:text="${param1}"></p>
    <p th:text="${param2}"></p>
</footer>
```

### 템플릿 조각 사용

- **th:insert (태그 내부에 추가)**

  ```html
  <div th:insert="~{template/fragment/footer :: copy}"></div>
  ```

  - **결과**

    ```html
    <div>
        <footer>푸터 자리 입니다.</footer>
    </div>
    ```

- **th:replace (태그 대체)**

  ```html
  <div th:replace="~{template/fragment/footer :: copy}"></div>
  ```

  - **결과**

    ```html
    <footer>푸터 자리 입니다.</footer>
    ```

- **단순 표현식 (~ 생략 가능)**

  ```html
  <div th:replace="template/fragment/footer :: copy"></div>
  ```

  - **결과**
    - 파라미터와 함께 렌더링된 조각이 삽입됨

- [템플릿 조각 사용 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/template/fragment/fragmentMain.html)

<br/><br/>

## 템플릿 레이아웃

- **동작 방식**
  - `~{::title}`
    - 현재 페이지의 title 태그 전달
  - `~{::link}`
    - 현재 페이지의 link 태그들 전달
  - 공통 부분은 유지, 추가 부분은 전달받은 내용으로 채움

- [head 레벨 레이아웃 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/template/layout/layoutMain.html)

- **동작 방식**
  - `<html>` 전체에 `th:replace` 적용
  - 레이아웃 파일의 기본 구조 유지
  - 필요한 부분만 전달하여 부분적으로 변경
  - 헤더, 푸터 등 공통 부분은 레이아웃에서 관리

- [html 레벨 레이아웃 예제 전체 코드](https://github.com/mxxikr/spring-mvc-part2/blob/master/thymeleaf-basic/src/main/resources/templates/template/layoutExtend/layoutExtendMain.html)

<br/><br/>

## 연습 문제

1. 타임리프의 주된 역할은 무엇일까요?

   a. 서버에서 데이터 조합 HTML 생성

   - 타임리프는 서버 측에서 데이터를 받아 HTML을 동적으로 만들어 클라이언트에 전송하는 템플릿 엔진임
   - 이는 클라이언트에서 HTML을 변경하는 방식과 구별됨

2. 타임리프의 "내추럴 템플릿"이란 특징은 무엇을 의미하나요?

   a. 순수 HTML 구조 유지

   - 내추럴 템플릿은 타임리프 파일의 순수한 HTML 구조를 유지하여 서버 실행 없이 브라우저에서 기본 모습을 볼 수 있게 해줌
   - 타임리프 속성은 추가적으로 역할을 담당함

3. HTML 태그 사이에 변수 값을 간단히 출력할 때 주로 사용하는 타임리프 속성은 무엇일까요?

   a. th:text

   - `th:text`는 요소의 내용을 주어진 텍스트로 설정하며, HTML 엔티티를 자동으로 이스케이프함
   - `th:utext`는 이스케이프 없이 HTML을 그대로 출력함

4. `th:text`는 텍스트 출력 시 자동으로 처리되지만, `th:utext`는 처리하지 않는 것은 무엇일까요?

   a. HTML 엔티티 이스케이프

   - `th:text`는 출력되는 문자열에 포함된 `<`, `>` 등의 HTML 특수 문자를 자동으로 이스케이프하여 안전하게 텍스트로 표시함
   - `th:utext`는 이스케이프 없이 그대로 출력함

5. 타임리프에서 모델(Model)에 담긴 변수나 객체에 접근할 때 사용하는 기본 표현식 문법은 무엇일까요?

   a. `${}`

   - 모델에 담긴 데이터를 참조할 때는 `${}` 문법을 사용함
   - `#`, `@`, `~`는 다른 용도로 사용됨

6. 타임리프 템플릿에서 스프링 빈(Bean)에 직접 접근할 때 사용하는 기호는 무엇일까요?

   a. @

   - 스프링 컨테이너에 등록된 스프링 빈 객체에 직접 접근할 때는 `@` 기호를 사용함
   - 이를 통해 서비스나 컴포넌트 등의 빈 메서드를 타임리프 템플릿에서 바로 호출 수 있음

7. `th:if` 속성의 조건이 거짓(false)일 경우, 해당 HTML 요소는 어떻게 처리됩니까?

   a. 요소 내용 전체 렌더링 안함

   - `th:if` 조건이 거짓이면 해당 HTML 태그 자체가 렌더링 결과물에서 완전히 제거됨
   - 조건이 참일 경우에만 태그가 유지됨

8. 컬렉션(List, Array 등) 항목을 순회하며 HTML 요소를 반복 렌더링할 때 사용하는 속성은 무엇일까요?

   a. th:each

   - `th:each` 속성은 컬렉션이나 배열의 각 요소에 대해 HTML 태그와 그 안의 내용을 반복해서 렌더링하는 데 사용됨

9. 타임리프 템플릿 조각(Fragment)이나 레이아웃(Layout) 사용의 주된 목적은 무엇일까요?

   a. 코드 재사용성 및 모듈화

   - 템플릿 조각과 레이아웃은 공통 부분을 분리하여 여러 페이지에서 재사용하고, 전체적인 구조를 관리하여 유지보수나 효율을 높이는 데 목적이 있음

10. `th:inline="javascript"` 속성을 사용할 때 얻을 수 있는 주요 이점은 무엇일까요?

    a. 타임리프 표현식 사용 시 데이터 타입별 자동 처리

    - `th:inline="javascript"`를 사용하면 자바스크립트 코드 안에 타임리프 표현식을 안전하게 사용할 수 있음
    - 타임리프가 문자열, 숫자, 객체, 특수 문자 이스케이핑 등을 자동으로 처리해줌

<br/><br/>

## 요약 정리

- **타임리프 특징**
  - 서버 사이드 HTML 렌더링 (SSR)
  - 네츄럴 템플릿
    - 순수 HTML 구조 유지
    - 브라우저에서 직접 열어도 확인 가능
  - 스프링 통합 지원
  - 사용 선언
    - `xmlns:th="http://www.thymeleaf.org"`
- **기본 표현식**
  - 변수
    - `${}`
  - 선택 변수
    - `*{}`
  - 메시지
    - `#{}`
  - 링크 URL
    - `@{}`
  - 조각
    - `~{}`
- **텍스트 출력**
  - `th:text`
    - HTML 엔티티 Escape
  - `th:utext`
    - Unescape (주의해서 사용)
  - 인라인 표현식
    - `[[${data}]]`, `[(${data})]`
- **변수 표현식 - SpringEL**
  - Object
    - `${user.username}`, `${user['username']}`
  - List
    - `${users[0].username}`
  - Map
    - `${userMap['userA'].username}`
  - 지역 변수
    - `th:with="first=${users[0]}"`
- **기본 객체**
  - 스프링 부트 3.0 이상
    - `${#request}`, `${#session}` 등 직접 사용 불가
    - Model에 추가하여 사용
  - 편의 객체
    - `${param.xxx}`
      - HTTP 요청 파라미터
    - `${session.xxx}`
      - HTTP 세션
    - `${@bean.xxx}`
      - 스프링 빈 접근
- **유틸리티 객체**
  - `#temporals`
    - Java8 날짜 서식
  - `#message`, `#uris`, `#dates`, `#numbers`, `#strings` 등
- **URL 링크**
  - `@{}` 문법
  - 쿼리 파라미터
    - `@{/hello(param1=${param1})}`
  - 경로 변수
    - `@{/hello/{param1}(param1=${param1})}`
- **리터럴**
  - 문자
    - 공백 없으면 생략 가능, 있으면 `''`로 감싸기
  - 리터럴 대체
    - `|hello ${data}|`
- **연산**
  - 산술, 비교, 조건식
  - Elvis 연산자
    - `${data}?: '기본값'`
  - No-Operation
    - `${data}?: _`
- **속성 값 설정**
  - `th:*`
    - 속성 대체/추가
  - `th:attrappend`, `th:attrprepend`, `th:classappend`
  - `th:checked`
    - false면 속성 제거 (HTML checked 문제 해결)
- **반복**
  - `th:each`
  - 반복 상태
    - index, count, size, even, odd, first, last, current
  - 지원 타입
    - List, 배열, Iterable, Enumeration, Map
- **조건부 평가**
  - `th:if`, `th:unless`
    - 조건 불만족 시 태그 제거
  - `th:switch`, `th:case`
    - `*`로 디폴트 처리
- **주석**
  - 표준 HTML 주석
    - 그대로 남김
  - 타임리프 파서 주석
    - `<!--/* */-->`
    - 렌더링 시 완전 제거
  - 타임리프 프로토타입 주석
    - `<!--/*/ /*/-->`
    - 브라우저 직접 열면 주석, 렌더링하면 정상 표시
- **블록**
  - `th:block`
    - 타임리프 자체 태그
    - 렌더링 시 제거
    - HTML 태그로 처리하기 애매한 경우 사용
- **자바스크립트 인라인**
  - `th:inline="javascript"`
  - 문자 타입 자동 처리 (`"` 추가)
  - 객체를 JSON으로 자동 변환
  - 자바스크립트 내추럴 템플릿
  - 인라인 each
    - `[# th:each= ] [/]`
- **템플릿 조각**
  - `th:fragment`
    - 조각 정의
  - `th:insert`
    - 태그 내부에 추가
  - `th:replace`
    - 태그 대체
  - 파라미터 전달
    - `th:fragment="copy(param1, param2)"`
- **템플릿 레이아웃**
  - head 레벨
    - 공통 리소스 + 페이지별 추가 리소스
    - `~{::title}`, `~{::link}` 전달
  - html 레벨
    - 전체 페이지 구조 관리
    - 헤더/푸터 공통화
    - 컨텐츠만 교체

<br/><br/>

## Reference

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-mvc-2/dashboard)
