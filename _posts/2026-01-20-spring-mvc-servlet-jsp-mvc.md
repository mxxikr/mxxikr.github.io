---
title: '[스프링 MVC 1편 백엔드 웹 개발 핵심 기술] 서블릿, JSP, MVC 패턴'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-20 18:40:00 +0900
category: [Framework, Spring]
tags: [spring, java, servlet, jsp, mvc, pattern, request, response]
math: false
mermaid: false
---
# 서블릿, JSP, MVC 패턴

- 김영한님의 스프링 MVC 1편 백엔드 웹 개발 핵심 기술 강의를 통해 서블릿에서 JSP, 그리고 MVC 패턴으로 발전하는 과정을 정리함

<br/><br/>

## 회원 관리 웹 애플리케이션

### 요구사항

- **회원 정보**
  - 이름 (username)
  - 나이 (age)
- **기능**
  - 회원 저장
  - 회원 목록 조회

### 도메인 모델

```java
@Getter @Setter
public class Member {
    private Long id;
    private String username;
    private int age;
    
    public Member() { }
    
    public Member(String username, int age) {
        this.username = username;
        this.age = age;
    }
}
```

### 회원 저장소 (싱글톤)

```java
public class MemberRepository {
    // 저장소 - 동시성 문제 고려 필요
    private static Map<Long, Member> store = new HashMap<>();
    private static long sequence = 0L;
    
    // 싱글톤 패턴
    private static final MemberRepository instance = new MemberRepository();
    public static MemberRepository getInstance() {
        return instance;
    }
    private MemberRepository() { }
    
    // 회원 저장
    public Member save(Member member) {
        member.setId(++sequence);
        store.put(member.getId(), member);
        return member;
    }
    
    // 회원 조회
    public Member findById(Long id) {
        return store.get(id);
    }
    
    // 전체 회원 조회
    public List<Member> findAll() {
        return new ArrayList<>(store.values());
    }
    
    // 테스트용
    public void clearStore() {
        store.clear();
    }
}
```

- **설계 특징**
  - 싱글톤 패턴 적용
  - 생성자를 `private`으로 제한
  - 실무에서는 `ConcurrentHashMap`, `AtomicLong` 사용 권장

- [Member 클래스 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/domain/member/Member.java)
- [MemberRepository 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/domain/member/MemberRepository.java)

<br/><br/>

## Servlet을 활용한 구현

### 회원 등록 폼

```java
@WebServlet(name = "memberFormServlet", urlPatterns = "/servlet/members/new-form")
public class MemberFormServlet extends HttpServlet {
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) {
        // 응답 타입 설정
        response.setContentType("text/html");
        response.setCharacterEncoding("utf-8");
        
        // Java 코드로 HTML 생성
        PrintWriter w = response.getWriter();
        w.write("<!DOCTYPE html>\n<html>\n<head>");
        // HTML 폼 생성 코드
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/servlet/MemberFormServlet.java)

### 회원 저장

```java
@WebServlet(name = "memberSaveServlet", urlPatterns = "/servlet/members/save")
public class MemberSaveServlet extends HttpServlet {
    private MemberRepository memberRepository = MemberRepository.getInstance();
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) {
        // 파라미터 조회
        String username = request.getParameter("username");
        int age = Integer.parseInt(request.getParameter("age"));
        
        // 비즈니스 로직
        Member member = new Member(username, age);
        memberRepository.save(member);
        
        // HTML 응답 생성 (Java 코드로 HTML 작성)
        response.setContentType("text/html");
        PrintWriter w = response.getWriter();
        w.write("<html><body>성공");
    }
}
```

- **동작 순서**
  - 파라미터 조회하여 `Member` 객체 생성
  - `MemberRepository`를 통해 저장
  - 결과 HTML을 동적으로 생성하여 응답

- [전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/servlet/MemberSaveServlet.java)

### 회원 목록 조회

```java
@WebServlet(name = "memberListServlet", urlPatterns = "/servlet/members")
public class MemberListServlet extends HttpServlet {
    private MemberRepository memberRepository = MemberRepository.getInstance();
    
    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) {
        List<Member> members = memberRepository.findAll();
        
        // Java 코드로 HTML 테이블 생성
        PrintWriter w = response.getWriter();
        w.write("<html><body><table>");
        
        for (Member member : members) {
            w.write("<tr><td>" + member.getId() + "</td>");
        }
    }
}
```

- [전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/servlet/MemberListServlet.java)

### 서블릿의 문제점

- **Java 코드로 HTML 작성의 어려움**
  - 코드가 복잡하고 비효율적
  - HTML 수정이 매우 어려움
  - 뷰와 로직이 섞여 있음
  - 유지보수가 어려움
- **템플릿 엔진의 필요성**
  - HTML 문서에 동적으로 변경이 필요한 부분만 Java 코드 삽입
  - JSP, Thymeleaf, Freemarker, Velocity 등

<br/><br/>

## JSP를 활용한 구현

### JSP 라이브러리 추가

```groovy
implementation 'org.apache.tomcat.embed:tomcat-embed-jasper'
implementation 'jakarta.servlet:jakarta.servlet-api'
implementation 'jakarta.servlet.jsp.jstl:jakarta.servlet.jsp.jstl-api'
implementation 'org.glassfish.web:jakarta.servlet.jsp.jstl'
  ```

### 회원 등록 폼 JSP

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<body>
<form action="/jsp/members/save.jsp" method="post">
    username: <input type="text" name="username" />
    age: <input type="text" name="age" />
    <button type="submit">전송</button>
</form>
</body>
</html>
```

- **JSP 기본 구조**
  - `<%@ page ... %>`
    - JSP 문서 선언
  - HTML 중심으로 작성

### 회원 저장 JSP

```jsp
<%@ page import="hello.servlet.domain.member.MemberRepository" %>
<%@ page import="hello.servlet.domain.member.Member" %>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    // 비즈니스 로직
    MemberRepository memberRepository = MemberRepository.getInstance();
    
    String username = request.getParameter("username");
    int age = Integer.parseInt(request.getParameter("age"));
    
    Member member = new Member(username, age);
    memberRepository.save(member);
%>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
성공
<ul>
    <!-- JSP 표현식으로 데이터 출력 -->
    <li>id=<%=member.getId()%></li>
    <li>username=<%=member.getUsername()%></li>
    <li>age=<%=member.getAge()%></li>
</ul>
<a href="/index.html">메인</a>
</body>
</html>
```

- **JSP 문법**
  - `<%@ page import="" %>`
    - Java import 문
  - `<% ... %>`
    - Java 코드 입력
  - `<%= ... %>`
    - Java 코드 출력

### 회원 목록 JSP

```jsp
<%@ page import="java.util.List" %>
<%@ page import="hello.servlet.domain.member.MemberRepository" %>
<%@ page import="hello.servlet.domain.member.Member" %>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    MemberRepository memberRepository = MemberRepository.getInstance();
    List<Member> members = memberRepository.findAll();
%>
<html>
<body>
<table>
    <tbody>
<%
    for (Member member : members) {
        out.write("<tr><td>" + member.getId() + "</td>");
    }
%>
    </tbody>
</table>
</body>
</html>
```

- [전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/webapp/jsp/members/members.jsp)

### JSP의 한계

- **역할 과다 문제**
  - 상위 절반은 비즈니스 로직 (회원 저장)
  - 하위 절반은 HTML 뷰 렌더링
  - 너무 많은 역할을 담당
  - 유지보수 어려움
- **해결 방향**
  - 비즈니스 로직은 서블릿에서 처리
  - JSP는 HTML 렌더링에만 집중
  - MVC 패턴 도입 필요

<br/><br/>

## MVC 패턴

### MVC가 필요한 이유

- **너무 많은 역할**
  - 하나의 서블릿/JSP가 비즈니스 로직과 뷰 렌더링 모두 처리
  - 유지보수 어려움
  - 코드 변경 시 영향 범위가 넓음
- **변경의 라이프 사이클**
  - UI 수정과 비즈니스 로직 수정은 별개
  - 각각 다르게 발생할 가능성이 높음
  - 서로 영향을 주지 않음
  - 하나의 코드로 관리하면 유지보수 어려움
- **기능 특화**
  - JSP는 화면 렌더링에 최적화
  - 해당 업무만 담당하는 것이 효과적

### MVC 패턴 구조

- **Controller**
  - HTTP 요청 수신
  - 파라미터 검증
  - 비즈니스 로직 실행
  - 뷰에 전달할 데이터를 모델에 담음
- **Model**
  - 뷰에 출력할 데이터 보관
  - 뷰가 필요한 데이터를 모두 담아 전달
  - 뷰는 비즈니스 로직이나 데이터 접근을 몰라도 됨
- **View**
  - 모델의 데이터를 사용하여 화면 렌더링
  - HTML 생성에 집중

> **Service 계층**
> 
> - 일반적으로 비즈니스 로직을 별도의 Service 계층으로 분리함
> - Controller
>   - HTTP 요청/응답 처리, Service 호출
> - Service
>   - 비즈니스 로직 처리
> - Repository
>   - 데이터 접근
> 
> - 이를 통해 Controller의 책임이 명확해지고, 비즈니스 로직 재사용 및 트랜잭션 관리가 용이해짐

### MVC 요청 처리 흐름

![MVC 요청 처리 흐름](/assets/img/spring/mvc-request-flow.png)

<br/><br/>

## MVC 패턴 구현

### Model로 HttpServletRequest 사용

```java
// 데이터 저장
request.setAttribute("member", member);

// 데이터 조회
Member member = (Member) request.getAttribute("member");
```

### 회원 등록 폼

- **MvcMemberFormServlet (Controller)**

  ```java
  @WebServlet(name = "mvcMemberFormServlet", urlPatterns = "/servlet-mvc/members/new-form")
  public class MvcMemberFormServlet extends HttpServlet {
      @Override
      protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
          
          // View 경로 지정
          String viewPath = "/WEB-INF/views/new-form.jsp";
          // View로 forward
          RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
          dispatcher.forward(request, response);
      }
  }
  ```

- **주요 개념**

  | 개념 | 설명 |
  |------|------|
  | `dispatcher.forward()` | 서버 내부에서 다른 서블릿/JSP 호출 |
  | `/WEB-INF/` | 외부에서 직접 JSP 호출 불가한 경로 |
  | redirect와 forward | redirect는 클라이언트 재요청<br>forward는 서버 내부 호출 |

- **new-form.jsp (View)**

  ```jsp
  <%@ page contentType="text/html;charset=UTF-8" language="java" %>
  <html>
  <body>
  <!-- 상대경로 사용 -->
  <form action="save" method="post">
      username: <input type="text" name="username" />
      age: <input type="text" name="age" />
      <button type="submit">전송</button>
  </form>
  </body>
  
- **상대경로 사용**
  - 현재 URL 
    - `/servlet-mvc/members/new-form`
  - form action 
    - `save`
  - 결과 URL 
    - `/servlet-mvc/members/save`

- [전체 코드 보기](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/servletmvc/MvcMemberFormServlet.java)

### 회원 저장

- **MvcMemberSaveServlet (Controller)**

  ```java
  @WebServlet(name = "mvcMemberSaveServlet", urlPatterns = "/servlet-mvc/members/save")
  public class MvcMemberSaveServlet extends HttpServlet {
      private MemberRepository memberRepository = MemberRepository.getInstance();
      
      @Override
      protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
          
          // 파라미터 조회
          String username = request.getParameter("username");
          int age = Integer.parseInt(request.getParameter("age"));
          
          // 비즈니스 로직
          Member member = new Member(username, age);
          memberRepository.save(member);
          
          // Model에 데이터 보관
          request.setAttribute("member", member);
          
          // View로 이동
          String viewPath = "/WEB-INF/views/save-result.jsp";
          RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
          dispatcher.forward(request, response);
      }
  }
  ```

- **save-result.jsp (View)**

  ```jsp
  <%@ page contentType="text/html;charset=UTF-8" language="java" %>
  <html>
  <head>
      <meta charset="UTF-8">
  </head>
  <body>
  성공
  <ul>
      <li>id=${member.id}</li>
      <li>username=${member.username}</li>
      <li>age=${member.age}</li>
  </ul>
  <a href="/index.html">메인</a>
  </body>
  </html>
  ```

- **JSP `${}` 문법**
  - `${member.id}` 
    - `request.getAttribute("member")`의 id 속성
  - EL (Expression Language) 표현식
  - 복잡한 코드 대신 간결한 문법 제공

- [MvcMemberSaveServlet 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/servletmvc/MvcMemberSaveServlet.java)
- [save-result.jsp 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/webapp/WEB-INF/views/save-result.jsp)

### 회원 목록 조회

- **MvcMemberListServlet (Controller)**

  ```java
  @WebServlet(name = "mvcMemberListServlet", urlPatterns = "/servlet-mvc/members")
  public class MvcMemberListServlet extends HttpServlet {
      private MemberRepository memberRepository = MemberRepository.getInstance();
      
      @Override
      protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
          
          // 비즈니스 로직
          List<Member> members = memberRepository.findAll();
          // Model에 데이터 저장
          request.setAttribute("members", members);
          
          // View로 이동
          String viewPath = "/WEB-INF/views/members.jsp";
          RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
          dispatcher.forward(request, response);
      }
  }
  ```

- **members.jsp (View)**

  ```jsp
  <%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
  <html>
  <body>
  <table>
      <thead><th>id</th><th>username</th><th>age</th></thead>
      <tbody>
          <c:forEach var="item" items="${members}">
              <tr>
                  <td>${item.id}</td>
                  <td>${item.username}</td>
                  <td>${item.age}</td>
              </tr>
          </c:forEach>
      </tbody>
  </table>
  </body>
  </html>
  ```

- **JSTL (JSP Standard Tag Library)**
  - `<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>`
    - JSTL 사용을 위한 태그 라이브러리 선언
  - `<c:forEach>` 
    - 반복문 처리
  - `var="item"` 
    - 각 요소를 item 변수에 담음
  - `items="${members}"` 
    - 반복할 컬렉션

- [MvcMemberListServlet 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/java/hello/servlet/web/servletmvc/MvcMemberListServlet.java)
- [members.jsp 코드](https://github.com/mxxikr/spring-mvc-part1/blob/master/servlet/src/main/webapp/WEB-INF/views/members.jsp)

<br/><br/>

## MVC 패턴의 한계

### 컨트롤러의 중복 코드

- **포워드 중복**

  ```java
  RequestDispatcher dispatcher = request.getRequestDispatcher(viewPath);
  dispatcher.forward(request, response);
  ```

  - 모든 컨트롤러에서 반복
  - 메서드로 공통화해도 항상 호출 필요

- **ViewPath 중복**

  ```java
  String viewPath = "/WEB-INF/views/new-form.jsp";
  ```

  - prefix
    - `/WEB-INF/views/`
  - suffix
    - `.jsp`
  - 뷰 기술 변경 시 전체 코드 수정 필요

- **사용하지 않는 코드**

  ```java
  HttpServletRequest request, HttpServletResponse response
  ```

  - response는 현재 코드에서 미사용
  - 테스트 케이스 작성 어려움

### 해결 방안

- **Front Controller 패턴 필요**
  - 컨트롤러 호출 전에 공통 기능 처리
  - 입구를 하나로 통일
- **Spring MVC의 핵심**
  - Front Controller 패턴 기반
  - `DispatcherServlet`이 프론트 컨트롤러 역할

<br/><br/>

## 연습 문제

1. 서블릿만으로 HTML 화면을 직접 만드는 것이 왜 어려울까요?

   a. 자바 코드 안에 HTML을 작성하는 것이 복잡함

   - 서블릿만으로는 자바 코드 내에서 HTML 태그를 문자열처럼 직접 출력해야 하므로 작성하기 어렵고 유지보수가 어려움
   - JSP가 이 문제를 해결하는 데 도움을 줌

2. JSP만으로 웹 애플리케이션을 개발할 때 발생하는 주요 문제점은 무엇일까요?

   a. 비즈니스 로직과 화면 표시 로직의 혼재

   - JSP는 HTML과 자바 코드 삽입이 쉬워 보이지만 비즈니스 로직이 혼재되어 복잡해지고 유지보수가 어려워짐
   - MVC 패턴이 이 문제를 해결하기 위해 등장했음

3. MVC 패턴의 주된 목적은 무엇일까요?

   a. 애플리케이션 로직을 역할에 따라 분리

   - MVC는 Model, View, Controller 세 부분으로 나누어 각자의 역할에 집중하게 함으로써 코드의 분리와 유지보수성을 높임
   - 서블릿과 JSP에 비해 관리 측면에서 효율적임

4. MVC 패턴에서 Model은 어떤 역할을 담당하나요?

   a. View에 전달할 데이터를 담는 컨테이너

   - Model은 Controller가 비즈니스 로직 처리 후 View에게 전달할 데이터를 담아두는 공간임
   - View는 이 Model에서 필요한 데이터를 꺼내 화면을 그림

5. 기본 MVC 구조에서 발생하는 반복적인 코드 및 공통 처리의 어려움을 해결하기 위해 도입된 패턴은 무엇일까요?

   a. Front Controller 패턴

   - 기본 MVC에서는 반복되는 로직이나 공통 처리가 여러 Controller에 흩어져 있었음
   - Front Controller는 요청을 한 곳에서 받아 공통 처리를 위임해서 이 문제를 개선함

<br/><br/>

## 요약 정리

### 기술 발전 과정

![기술 발전 과정](/assets/img/spring/tech-evolution.png)

- **발전 과정**
  - Servlet → JSP → MVC → Front Controller → Spring MVC
- **서블릿 방식**
  - 장점
    - 동적 HTML 생성 가능
  - 단점
    - Java 코드로 HTML 작성 어려움
    - 유지보수 매우 어려움
- **JSP 방식**
  - 장점
    - HTML 중심 작성
    - 동적 부분만 Java 코드 삽입
  - 단점
    - 비즈니스 로직과 뷰가 혼재
    - 유지보수 여전히 어려움
- **MVC 패턴**
  - 장점
    - 역할 분리 (Controller, Model, View)
    - 각 계층이 책임에 집중
    - 유지보수 용이
  - 단점
    - 중복 코드 발생
    - 공통 처리 어려움
- **핵심 원칙**
  - Controller
    - 요청 처리 및 흐름 제어
  - Model
    - 데이터 전달 역할
  - View
    - 화면 렌더링에만 집중
  - 변경의 라이프 사이클을 분리
  - 각 계층의 책임을 명확히

<br/><br/>

## Reference

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
