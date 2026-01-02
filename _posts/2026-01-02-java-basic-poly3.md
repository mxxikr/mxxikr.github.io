---
title: "김영한의 실전 자바 - 다형성과 설계"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-02 19:00:00 +0900
category:
  - [Language, java]
tags: [java, polymorphism, ocp, strategy-pattern, design-principle]
math: false
---

# 다형성과 설계

- 김영한님의 실전 자바 강의 중 다형성과 설계 챕터를 학습하며 OCP(개방-폐쇄 원칙)와 전략 패턴을 활용한 설계 방법을 정리함

<br/><br/>

## 좋은 객체 지향 설계

### 객체 지향의 본질

- **객체들의 협력**

  - 프로그램을 독립적인 객체들의 협력으로 봄
  - 각 객체는 메시지를 주고받으며 데이터를 처리함

- **역할과 구현의 분리**
  - **역할(Role)**
    - 인터페이스로 정의함
  - **구현(Implementation)**
    - 구체 클래스로 구현함
  - 클라이언트는 역할만 알면 구현을 몰라도 됨

<br/><br/>

## 문제 상황 - 구현에 의존

### 구체 클래스에 직접 의존하는 코드

- **문제 코드**

  ```java
  public class ReportService {
      private PDFReport pdfReport;  // 구체 클래스에 직접 의존

      public void createReport(String data) {
          pdfReport = new PDFReport();
          pdfReport.generate(data);
          pdfReport.format();
          pdfReport.save();
      }
  }
  ```

- **문제점**
  - Excel 리포트가 필요하면 `ReportService` 코드를 수정해야 함
  - 리포트 타입이 바뀔 때마다 클래스 변경이 필요함
  - 확장에 닫혀있고 변경에 열려있음 (OCP 위반)

### 새로운 리포트 타입 추가 시

- **변경 사항**

  ```java
  public class ReportService {
      private PDFReport pdfReport;
      private ExcelReport excelReport;  // 필드 추가

      public void setExcelReport(ExcelReport excelReport) {  // 메서드 추가
          this.excelReport = excelReport;
      }

      public void createReport(String data, String type) {
          if (type.equals("pdf")) {  // 분기 추가
              pdfReport.generate(data);
              // ...
          } else if (type.equals("excel")) {
              excelReport.generate(data);
              // ...
          }
      }
  }
  ```

- **문제**
  - 새로운 리포트 타입이 추가될 때마다 `ReportService`를 계속 수정해야 함

<br/><br/>

## 해결책 - 인터페이스 도입

### ReportGenerator 인터페이스 정의

- **역할 정의**

  ```java
  public interface ReportGenerator {
      void generate(String data);
      void format();
      void save();
  }
  ```

### 개선된 ReportService

- **인터페이스에 의존**

  ```java
  public class ReportService {
      private ReportGenerator reportGenerator;  // 인터페이스에 의존

      public void setReportGenerator(ReportGenerator reportGenerator) {
          this.reportGenerator = reportGenerator;
      }

      public void createReport(String data) {
          reportGenerator.generate(data);  // 다형성
          reportGenerator.format();
          reportGenerator.save();
      }
  }
  ```

- **개선점**
  - `ReportService`는 `ReportGenerator` 인터페이스만 의존함
  - 새로운 리포트 타입 추가해도 `ReportService` 변경 불필요함
  - 런타임에 실제 구현체 선택됨

![Loose Coupling](/assets/img/java-basic/poly3/loose_coupling.png)

<br/><br/>

## OCP (Open-Closed Principle)

### 개방-폐쇄 원칙

![OCP Principle](/assets/img/java-basic/poly3/ocp_principle.png)

- **원칙**
  - **Open (열림)**
    - 확장에는 열려있음 - 새 기능 추가 자유로움
  - **Closed (닫힘)**
    - 변경에는 닫혀있음 - 기존 코드 수정하지 않음

### OCP 위반 사례

- **문제 코드**

  ```java
  public class NotificationService {
      public void send(String type, String message) {
          if (type.equals("email")) {
              EmailSender emailSender = new EmailSender();  // 구체 클래스 직접 생성
              emailSender.send(message);
          } else if (type.equals("sms")) {
              SmsSender smsSender = new SmsSender();  // 구체 클래스 직접 생성
              smsSender.send(message);
          }
          // Push 알림 추가하려면 이 코드를 수정해야 함
      }
  }
  ```

![Before OCP](/assets/img/java-basic/poly3/before_ocp.png)

- **문제점**
  - 새 알림 방식 추가 시 `NotificationService` 수정 필요함
  - `if-else` 분기문이 계속 늘어남

### OCP 준수 설계

- **MessageSender 인터페이스 정의**

  ```java
  public interface MessageSender {
      void send(String message);
  }
  ```

- **구현체들**

  ```java
  public class EmailSender implements MessageSender {
      @Override
      public void send(String message) {
          System.out.println("이메일 발송: " + message);
      }
  }

  public class SmsSender implements MessageSender {
      @Override
      public void send(String message) {
          System.out.println("SMS 발송: " + message);
      }
  }

  public class PushSender implements MessageSender {  // 새로 추가해도 OK
      @Override
      public void send(String message) {
          System.out.println("푸시 알림: " + message);
      }
  }
  ```

- **NotificationService 개선**

  ```java
  public class NotificationService {
      public void send(String type, String message) {
          MessageSender sender = SenderFactory.create(type);  // 팩토리 사용
          sender.send(message);  // 다형성 활용
          // NotificationService는 변경 없음
      }
  }
  ```

![After OCP](/assets/img/java-basic/poly3/after_ocp.png)

<br/><br/>

## OCP 분석

### 변경 영역과 확장 영역

- **ReportService 예제 분석**

  | 구성 요소                    | 변경 여부        | OCP 관점             |
  | ---------------------------- | ---------------- | -------------------- |
  | `ReportService` 클래스       | 변경 없음        | Closed (변경에 닫힘) |
  | `ReportGenerator` 인터페이스 | 변경 없음        | Closed (변경에 닫힘) |
  | 새 리포트 타입 추가          | 새 클래스만 추가 | Open (확장에 열림)   |
  | `main()` 메서드              | 변경 필요        | 조립 영역            |

![OCP Analysis](/assets/img/java-basic/poly3/ocp_analysis.png)

- **중요 사항**
  - 모든 코드가 OCP를 만족할 수는 없음
  - 중요한 비즈니스 로직은 변경하지 않는 것이 목표임
  - 객체 생성과 조립 코드는 변경 가능함

<br/><br/>

## 전략 패턴 (Strategy Pattern)

### 전략 패턴의 개념

![Strategy Pattern](/assets/img/java-basic/poly3/strategy_pattern.png)

- **정의**
  - 알고리즘을 객체로 캡슐화하는 패턴
  - 런타임에 전략을 교체할 수 있게 함
  - 클라이언트는 인터페이스에만 의존함

### ReportService가 전략 패턴

- **전략 인터페이스**

  ```java
  public interface ReportGenerator {
      void generate(String data);
      void format();
      void save();
  }
  ```

- **구체적 전략들**

  ```java
  public class PDFReport implements ReportGenerator {
      @Override
      public void generate(String data) {
          System.out.println("PDF 데이터 생성: " + data);
      }

      @Override
      public void format() {
          System.out.println("PDF 포맷 적용");
      }

      @Override
      public void save() {
          System.out.println("PDF 파일로 저장");
      }
  }

  public class ExcelReport implements ReportGenerator {
      @Override
      public void generate(String data) {
          System.out.println("Excel 데이터 생성: " + data);
      }

      @Override
      public void format() {
          System.out.println("Excel 포맷 적용");
      }

      @Override
      public void save() {
          System.out.println("Excel 파일로 저장");
      }
  }
  ```

- **컨텍스트 (전략 사용자)**

  ```java
  public class ReportService {
      private ReportGenerator strategy;  // 전략 참조

      public void setStrategy(ReportGenerator strategy) {  // 전략 교체
          this.strategy = strategy;
      }

      public void createReport(String data) {  // 전략 실행
          strategy.generate(data);
          strategy.format();
          strategy.save();
      }
  }
  ```

![Strategy Structure](/assets/img/java-basic/poly3/strategy_structure.png)

- **구성 요소**
  - **Strategy**
    - `ReportGenerator` 인터페이스
  - **ConcreteStrategy**
    - `PDFReport`, `ExcelReport`, `HTMLReport`
  - **Context**
    - `ReportService` - 전략을 사용하는 주체

<br/><br/>

## 연습 문제

1. 객체 지향 프로그래밍(OOP)이 기존 방식과 차별화되는 핵심 접근 방식은 무엇일까요?

   a. 독립적인 객체들의 협력을 통해 데이터 처리

   - 객체 지향은 컴퓨터 프로그램을 독립적인 객체 단위로 보고, 객체들이 서로 메시지를 주고받으며 협력하여 데이터를 처리하는 방식임
   - 명령의 나열과는 차이가 있음

2. 객체 지향에서 '역할'과 '구현'을 분리하고 '다형성'을 활용할 때 얻는 가장 중요한 이점은 무엇일까요?

   a. 클라이언트 코드를 변경하지 않고 새로운 기능 확장 용이

   - 역할(인터페이스)에 의존함으로써 클라이언트는 구체적인 구현체에 묶이지 않음
   - 따라서 새로운 구현이 추가되거나 변경되어도 클라이언트 코드를 수정할 필요가 없어 확장에 유리함

3. 다형성을 잘 활용하는 설계에서, 어떤 기능을 사용하는 '클라이언트' 코드는 주로 무엇에 의존해야 유연성이 높아질까요?

   a. 해당 기능의 '역할' 또는 '인터페이스'

   - 클라이언트가 구체 클래스가 아닌 역할(인터페이스)에 의존할 때, 클라이언트 코드는 변경 없이 다양한 구현체를 받아들여 실행할 수 있음
   - 이는 개방-폐쇄 원칙을 따르는 설계의 핵심임

4. 객체 지향 설계 5원칙 중 OCP(개방-폐쇄 원칙)에서 '폐쇄(Closed)'가 의미하는 바는 다음 중 무엇일까요?

   a. 기존의 '클라이언트' 코드는 변경 없이 유지됨

   - OCP에서 '폐쇄'는 기능 확장을 위해 기존 코드를 수정하는 것을 최소화해야 함을 뜻함
   - 특히, 기능을 사용하는 핵심 클라이언트 코드는 변경되지 않아야 함

5. 다형성이 소프트웨어의 확장성과 유연성을 높이는 근본적인 원리는 무엇일까요?

   a. 런타임에 동일 인터페이스로 다른 구현 객체 호출 가능

   - 다형성의 핵심은 동일한 인터페이스 변수가 런타임에 어떤 구현 객체를 참조하느냐에 따라 다른 동작을 한다는 것임
   - 이를 통해 클라이언트는 변경 없이 다양한 서버 구현과 상호작용할 수 있음

<br/><br/>

## 요약 정리

### OCP 달성 방법

- **3단계 접근**
  - **추상화**
    - 인터페이스로 역할 정의
  - **다형성**
    - 부모 타입으로 자식 참조
  - **의존 역전**
    - 구현이 아닌 역할에 의존

### 좋은 설계 판단 기준

- **인터페이스 의존 여부**

  ```java
  // Good
  private ReportGenerator generator;

  // Bad
  private PDFReport pdfReport;
  ```

- **확장 시 수정 범위**

  - 새 클래스만 추가
    - 좋은 설계
  - 기존 클래스 수정
    - 개선 필요

- **분기문 증가 여부**
  - `if-else` 증가
    - 구조 개선 필요
  - 다형성 활용
    - 좋은 구조

### 전략 패턴 적용이 필요한 경우

- 알고리즘이 여러 개 존재함
- 런타임에 동작 선택이 필요함
- 자주 변경되는 로직이 있음

### 설계 시 주의사항

- **팩토리의 역할**

  - 객체 생성 책임을 분리함
  - 비즈니스 로직은 순수하게 유지함
  - 변경 시 팩토리만 수정하면 됨

- **Null 객체 패턴**
  - `null` 반환 대신 기본 구현 제공
  - `NullPointerException` 방지
  - 일관된 인터페이스 유지

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
