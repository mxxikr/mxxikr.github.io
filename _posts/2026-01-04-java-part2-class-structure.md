---
title: "독하게 시작하는 Java Part 2 - 클래스1"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-04 06:00:00 +0900
category:
  - [Language, java]
tags: [java, class, object, instance, oop, encapsulation, access-modifier]
math: false
---

# 클래스

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 Java 클래스의 구조, 객체와 인스턴스의 개념, 접근 제어와 캡슐화, 그리고 JVM 메모리 구조를 학습하며 객체 지향 프로그래밍의 핵심 원리를 정리함

<br/><br/>

## Java 프로그램의 논리적 계층 구조

### 가장 작은 단위부터 최상위까지

- **항(Term)**

  - 가장 기초적인 구성 요소
  - 변수, 상수, 리터럴 등이 해당됨

- **식(Expression)**

  - 여러 항이 모여 계산이나 연산을 수행하는 평가의 대상
  - `a + b`, `x * 2` 등의 연산식

- **구문(Statement)**

  - 여러 식이 모여 하나의 실행 단위를 형성함
  - 위에서 아래로 순차 실행됨
  - 세미콜론(`;`)으로 종료됨

- **메서드(Method)**

  - 특정 기능을 수행하는 구문들의 집합
  - 코드의 재사용성과 모듈화를 제공함

- **클래스(Class)**

  - 변수(필드)와 메서드의 논리적 집합체
  - 객체를 기술하는 설계도 역할

- **패키지(Package)**
  - 관련된 클래스들을 그룹화하여 관리하는 최상위 단위
  - 네임스페이스를 제공하여 이름 충돌 방지

### 계층 구조의 의미

![Java Program Hierarchy](/assets/img/java-part2/class-structure/java_hierarchy.png)

- Java는 체계적인 포함 관계를 통해 코드를 조직화함
- 각 계층은 명확한 역할과 책임을 가짐

<br/><br/>

## 클래스와 객체 그리고 인스턴스의 정의

### 객체(Object)란 무엇인가?

- **OOP 환경에서의 객체**

  - 소프트웨어를 구성하는 단위 요소
  - 필드(상태)와 메서드(행동)로 구성됨
  - 실세계의 개념을 소프트웨어로 모델링한 것

- **객체 설계의 원칙**

  - 클래스는 반드시 존재 이유와 목적이 명확해야 함
  - Java에서는 클래스(Class)로 객체를 기술함

### 클래스(Class)

- **정의**

  - 변수와 같은 일종의 타입으로 이해할 수 있음
  - 객체를 기술하는 문법이자 객체를 생성하기 위한 틀
  - 사용자 정의 타입

- **기본 문법**

  ```java
  class 클래스이름 {
      // 필드(변수) - 객체의 상태
      // 메서드(함수) - 객체의 행동
  }
  ```

- **작성 규칙**

  - 클래스 이름은 영문 대문자로 시작하는 것이 관례(`PascalCase`)
  - 저장되는 파일명(`.java`)과 대소문자까지 정확히 일치해야 함
  - 내부에 필드(변수)와 메서드(함수)를 멤버로 포함함

- **예시**

  ```java
  public class Member {
      // 멤버의 이름을 저장함
      private String memberName;
      // 멤버의 등급을 저장함
      private int level;

      // 활동 메서드
      public void participate() {
          System.out.println(memberName + "님이 활동 중입니다");
      }

      // 정보 출력 메서드
      public void displayInfo() {
          System.out.println("이름: " + memberName + ", 레벨: " + level);
      }
  }
  ```

### 인스턴스(Instance)

- **개념**

  - 클래스라는 타입을 통해 실제로 메모리에 구현된 예시 또는 경우
  - 클래스를 바탕으로 메모리에 실제로 생성된 실체
  - `new` 연산자를 통해 동적으로 생성됨

- **생성 방법**

  ```java
  Member member1 = new Member();  // 첫 번째 멤버 객체 생성
  Member member2 = new Member();  // 두 번째 멤버 객체 생성
  ```

  - 하나의 클래스로부터 여러 개의 독립적인 인스턴스를 생성할 수 있음
  - 각 인스턴스는 고유한 메모리 공간을 가짐

- **클래스와 인스턴스의 관계**

  - 클래스는 설계도, 인스턴스는 그 설계도로 만든 실제 제품
  - 클래스 타입으로 선언된 변수는 모두 참조형임
  - 인스턴스가 존재하지 않을 때는 `null` 값을 가질 수 있음

<br/><br/>

## 멤버 구성 요소 및 초기화 규칙

### 필드와 초기화 우선순위

- **필드(Field)**

  ```java
  public class Item {
      private String itemName = "기본 상품";  // 필드 선언 시 초기값 지정
      private int cost;  // 초기값 지정 안하면 0으로 자동 초기화됨

      public Item(String itemName, int cost) {
          this.itemName = itemName;  // 생성자가 최종 값을 설정함
          this.cost = cost;
      }

      public void showDetails() {
          System.out.println(itemName + ": " + cost + "원");
      }
  }
  ```

  - 객체의 상태 정보를 담는 변수
  - 선언 시 초깃값을 직접 정의할 수 있음
  - 지정하지 않으면 자료형에 따른 기본값이 할당됨

- **기본 값 규칙**

  | 자료형          | 기본값 |
  | --------------- | ------ |
  | 정수형 (int 등) | 0      |
  | 실수형 (double) | 0.0    |
  | boolean         | false  |
  | 참조형 (Object) | null   |

- **초기화 우선순위**

  - 필드 선언문에서 직접 할당한 값보다 생성자 내부에서 할당한 값이 최종적으로 적용됨
  - 생성자가 가장 높은 우선순위를 가짐
  - 초기화 순서
    - 필드 선언 시 초깃값 설정 → 생성자 실행

### 생성자(Constructor)의 특징

- **자동 호출**

  ```java
  Item item = new Item("노트북", 1500000);  // 생성자 호출
  // new 연산자를 사용하면 생성자가 자동으로 실행됨
  ```

  - `new` 연산자를 통해 객체가 생성되는 시점에 단 한 번 자동으로 실행됨
  - 객체 초기화를 담당함

- **명명 규칙**

  ```java
  public class Item {
      // 올바른 생성자 - 클래스명과 동일하며 반환 타입 없음
      public Item() {
          // 초기화 코드
      }

      // 잘못된 예 - 반환 타입이 있으면 일반 메서드가 됨
      // public void Item() { }  // 이것은 생성자가 아님
  }
  ```

  - 반드시 클래스 이름과 동일하게 작성해야 함
  - 반환 자료형이 존재하지 않음 (void도 쓰지 않음)

- **컴파일러의 역할**

  ```java
  public class Item {
      private String itemName;

      // 생성자를 정의하지 않으면
      // 컴파일러가 자동으로 다음을 추가함
      // public Item() { }
  }
  ```

  - 개발자가 생성자를 정의하지 않으면 매개변수가 없는 기본 생성자가 자동으로 추가됨
  - 하나라도 생성자를 정의하면 기본 생성자는 자동 추가되지 않음

- **생성자 오버로딩**

  ```java
  public class Item {
      private String itemName;
      private int cost;

      // 기본 생성자
      public Item() {
          this.itemName = "기본 상품";
          this.cost = 0;
      }

      // 매개변수 1개 생성자
      public Item(String itemName) {
          this.itemName = itemName;
          this.cost = 0;
      }

      // 매개변수 2개 생성자
      public Item(String itemName, int cost) {
          this.itemName = itemName;
          this.cost = cost;
      }
  }
  ```

<br/><br/>

## C/C++ 개발자를 위한 Java 참조형 분석

### 참조형 변수의 특징

- **포인터와의 유사성**

  ```java
  Item item1 = new Item();  // C++의 Item* item1 = new Item(); 과 유사함
  Item item2 = item1;       // 참조 복사 (같은 객체를 가리킴)
  ```

  - Java의 클래스 타입 변수는 모두 참조자
  - C/C++의 포인터와 유사한 개념으로 이해하면 빠른 습득 가능
  - 모든 클래스 객체는 힙 영역에 생성됨

### 메모리 관리(Garbage Collection)

- **자동 메모리 관리**

  ```java
  public void processItem() {
      Item item = new Item();  // 임시 객체 생성
      item.setName("일시 상품");
      // 메서드 종료 시 item 참조가 사라짐
      // 나중에 GC가 메모리를 자동으로 회수함
  }
  // C++처럼 delete를 호출할 필요가 없음
  ```

  - Java는 소멸자가 존재하지 않음
  - JVM의 가비지 컬렉터가 메모리를 자동 관리함
  - 더 이상 참조되지 않는 객체를 자동으로 회수함

### 관계 연산의 의미

- **주소 비교**

  ```java
  Item item1 = new Item("노트북", 1000000);  // 첫 번째 객체 생성
  Item item2 = new Item("노트북", 1000000);  // 두 번째 객체 생성
  Item item3 = item1;  // item1과 같은 객체를 가리킴

  System.out.println(item1 == item2);  // false - 다른 객체임
  System.out.println(item1 == item3);  // true - 같은 객체임
  ```

  - 참조형 변수에 `==` 또는 `!=` 연산자를 사용하면 객체의 내부 값이 아닌 메모리 주소를 비교함
  - 내용 비교는 `equals()` 메서드를 사용해야 함

- **equals() 메서드**

  ```java
  Item i1 = new Item("노트북", 1000000);
  Item i2 = new Item("노트북", 1000000);
  Item i3 = i1;

  // == 연산자 - 참조(주소) 비교
  System.out.println(i1 == i2);        // false - 서로 다른 객체
  System.out.println(i1 == i3);        // true - 동일한 객체

  // equals() - 내용 비교 (기본 구현은 ==와 동일)
  System.out.println(i1.equals(i2));   // false - 기본 구현은 주소 비교
  System.out.println(i1.equals(i3));   // true - 동일 객체
  ```

- **equals() 오버라이드**

  ```java
  public class Item {
      private String itemName;
      private int cost;

      public Item(String itemName, int cost) {
          this.itemName = itemName;
          this.cost = cost;
      }

      // equals() 메서드 재정의
      @Override
      public boolean equals(Object obj) {
          if (this == obj) return true;  // 동일 객체면 true 반환
          if (obj == null || getClass() != obj.getClass()) return false;

          Item item = (Item) obj;  // 타입 변환
          return cost == item.cost &&
                 itemName != null && itemName.equals(item.itemName);
      }

      @Override
      public int hashCode() {
          // equals()를 재정의하면 hashCode()도 함께 재정의해야 함
          return Objects.hash(itemName, cost);
      }
  }
  ```

  ```java
  // equals() 재정의 후 사용 예제
  Item i1 = new Item("노트북", 1000000);
  Item i2 = new Item("노트북", 1000000);

  System.out.println(i1 == i2);        // false - 여전히 다른 객체
  System.out.println(i1.equals(i2));   // true - 내용이 동일함
  ```

  - `Object` 클래스의 `equals()` 기본 구현은 `==`와 동일하게 참조를 비교함
  - 내용 비교가 필요하면 `equals()` 메서드를 오버라이드해야 함
  - `equals()`를 오버라이드할 때는 `hashCode()`도 함께 오버라이드하는 것이 권장됨

### null의 사용과 주의점

- **`null`의 의미**

  ```java
  Item item = null;  // 인스턴스가 연결되지 않은 상태

  // item.setName("테스트");  // NullPointerException 발생

  if (item != null) {  // null 체크는 필수
      item.setName("테스트");
  }
  ```

  - 참조형 변수에만 대입 가능함
  - 인스턴스가 연결되지 않은 상태를 의미함

- **`NullPointerException`**

  ```java
  int cost = 0;       // 정수형에는 null 불가능
  // int value = null; // 컴파일 오류 발생

  Item item = null;  // 참조형만 가능
  item.getCost();    // NullPointerException 발생
  ```

  - `null` 상태인 참조자로 멤버에 접근하려 하면 발생함
  - Java에서 가장 흔한 런타임 오류 중 하나

<br/><br/>

## 접근 제어와 캡슐화 전략

### 접근 제어의 필요성

- **복잡성 은닉**

  - 내부의 복잡한 구현을 감춤
  - 사용자에게 간소화된 인터페이스를 제공

- **데이터 보호**
  - 잘못된 값 할당 방지
  - 데이터 무결성 유지

### 접근 제어 지시자 종류

| 지시자      | 접근 범위                                                     |
| ----------- | ------------------------------------------------------------- |
| `public`    | 모든 외부 접근을 무제한 허용함                                |
| `protected` | 동일 패키지 내부와 상속받은 하위 클래스에서만 접근 가능       |
| `default`   | 지시자를 생략한 경우로, 동일 패키지 내의 클래스들만 접근 허용 |
| `private`   | 클래스 내부에서만 접근 가능하도록 철저히 격리                 |

### 접근 제어

```java
public class BankAccount {
    // private 외부에서 직접 접근 불가
    private String accountNumber;
    private long balance;

    // public 어디서든 접근 가능
    public BankAccount(String accountNumber) {
        this.accountNumber = accountNumber;
        this.balance = 0;
    }

    // protected 같은 패키지 또는 상속받은 클래스에서 접근 가능
    protected void validateAmount(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("금액은 0보다 커야 합니다.");
        }
    }

    // default (package-private) 같은 패키지에서만 접근 가능
    void updateBalance(long amount) {
        this.balance += amount;
    }
}
```

### protected 접근 제어와 상속

- **protected의 특징**

  - 같은 패키지 내의 클래스에서 접근 가능
  - 다른 패키지라도 상속받은 하위 클래스에서 접근 가능
  - `default`보다는 넓고 `public`보다는 제한적인 접근 범위

- **상속을 통한 protected 접근**

  ```java
  // com.example 패키지
  package com.example;

  public class BankAccount {
      private String accountNumber;
      private long balance;

      public BankAccount(String accountNumber) {
          this.accountNumber = accountNumber;
          this.balance = 0;
      }

      protected void validateAmount(long amount) {
          if (amount <= 0) {
              throw new IllegalArgumentException("금액은 0보다 커야 합니다.");
          }
      }

      void updateBalance(long amount) {  // default (package-private)
          this.balance += amount;
      }

      public long getBalance() {
          return balance;
      }
  }
  ```

  ```java
  // com.example.sub 패키지 (다른 패키지)
  package com.example.sub;

  import com.example.BankAccount;

  public class SavingsAccount extends BankAccount {
      private double interestRate;

      public SavingsAccount(String accountNumber, double interestRate) {
          super(accountNumber);
          this.interestRate = interestRate;
      }

      public void deposit(long amount) {
          validateAmount(amount);  // protected 메서드 접근 가능
          // updateBalance(amount);   // 컴파일 오류, default는 다른 패키지에서 접근 불가

          // public 메서드를 통해 간접 접근해야 함
      }

      public void addInterest() {
          long interest = (long) (getBalance() * interestRate);
          validateAmount(interest);  // protected 메서드 사용
      }
  }
  ```

  - `validateAmount()`
    - `protected`이므로 다른 패키지의 하위 클래스에서 접근 가능
  - `updateBalance()`
    - `default`이므로 같은 패키지에서만 접근 가능
  - 상속받은 클래스는 `protected` 멤버를 자신의 멤버처럼 사용할 수 있음

### Getter와 Setter의 활용

- **데이터 무결성 보호**

  ```java
  public class BankAccount {
      private long balance;

      // Getter 읽기만 허용
      public long getBalance() {
          return balance;
      }

      // Setter 검증 로직 추가
      public void deposit(long amount) {
          if (amount <= 0) {
              throw new IllegalArgumentException("입금액은 0보다 커야 합니다.");
          }
          this.balance += amount;
      }
  }
  ```

  - 필드를 `private`으로 감춤
  - 메서드를 통해 접근하게 함으로써 유효성 검증이 가능함

- **읽기/쓰기 권한 분리**

  ```java
  public class Employee {
      private String id;  // 사번은 변경 불가
      private String name;

      // id는 읽기만 가능 (Getter만 제공)
      public String getId() {
          return id;
      }

      // name은 읽기/쓰기 모두 가능
      public String getName() {
          return name;
      }

      public void setName(String name) {
          this.name = name;
      }
  }
  ```

  - 필요에 따라 수정은 불가능하고 조회만 가능한 형태로 접근 통제
  - Getter만 제공하면 읽기 전용이 됨

<br/><br/>

## 주요 키워드 및 메모리 구조

### this와 static의 관계

- **`this` 키워드**

  ```java
  public class Product {
      private String name;

      public void setName(String name) {
          this.name = name;  // this는 현재 인스턴스를 가리킴
      }

      public Product getThis() {
          return this;  // 자기 자신의 참조 반환
      }
  }
  ```

  - 현재 실행 중인 인스턴스 자신을 가리키는 참조
  - 메서드 호출 시 자동으로 전달됨
  - 매개변수와 필드명이 같을 때 구분하는 용도로 사용

- **`static`의 제약**

  ```java
  public class Counter {
      private int instanceCount = 0;
      private static int staticCount = 0;

      // 인스턴스 메서드 this 사용 가능
      public void incrementInstance() {
          this.instanceCount++;  // OK
      }

      // static 메서드 this 사용 불가
      public static void incrementStatic() {
          // this.instanceCount++;  // 컴파일 오류!
          staticCount++;  // OK
      }

      // static 메서드에서 인스턴스 멤버 접근하려면
      public static void incrementWithInstance(Counter counter) {
          counter.instanceCount++;  // 참조를 전달받아 접근
      }
  }
  ```

  - 정적 메서드는 클래스 레벨에서 동작하므로 특정 인스턴스에 속하지 않음
  - 따라서 '어떤 인스턴스의 `this`인지' 결정할 수 없어 `this`를 사용할 수 없음
  - 정적 메서드에서 인스턴스 멤버를 제어하려면 외부에서 인스턴스 참조를 직접 전달받아야 함

### JVM 메모리 영역

- **런타임 데이터 영역 구조**

  ![JVM Memory Structure](/assets/img/java-part2/class-structure/jvm_memory.png)

  - JVM의 런타임 데이터 영역은 크게 `Stack`, `Heap area`, `Method area` 등으로 구분됨
  - 각 영역은 특정 목적에 따라 메모리를 관리함
  - 스레드 공유 여부에 따라 영역이 나뉨

- **메모리 구조**

  - **메서드 영역(Method Area)**

    - 클래스 정보, `static` 변수, 상수 저장
    - 모든 스레드가 공유함
    - 정적 필드는 인스턴스 메모리와 독립적으로 관리됨
    - 모든 인스턴스가 정적 필드를 공유함

  - **힙(Heap) 영역**

    - 인스턴스(객체)가 생성되는 공간
    - `new` 연산자로 생성된 모든 객체가 저장됨
    - 가비지 컬렉션의 대상
    - 모든 스레드가 공유함

  - **스택(Stack) 영역**

    - 메서드 호출 시 지역 변수, 매개변수 저장
    - 메서드 종료 시 자동으로 제거됨
      - 실제로는 각 스레드마다 독립적인 스택을 가짐

- **메모리 영역별 특징**

  ```java
  public class MemoryExample {
      private static int staticVar = 10;  // 메서드 영역
      private int instanceVar;            // 힙 영역 (인스턴스 생성 시)

      public void method(int param) {     // param은 스택 영역
          int localVar = 20;              // 스택 영역
          MemoryExample obj = new MemoryExample();  // obj는 스택, 실제 객체는 힙
      }
  }
  ```

<br/><br/>

## 클래스 작성 및 파일 저장 규칙

### 명명 규칙

- **클래스 이름**

  ```java
  // 올바른 예
  public class ProductManager { }
  public class UserService { }
  public class OrderRepository { }

  // 잘못된 예
  public class productmanager { }  // 소문자로 시작
  public class product_manager { }  // 언더스코어 사용 (Java 관례 아님)
  ```

  - 대문자로 시작하는 PascalCase 형식을 따름
  - 명사 형태로 작성
  - 의미 있는 이름 사용

### 파일 저장 규칙

- **`public` 클래스와 파일명 일치**

  ```java
  // ProductManager.java 파일에 저장해야 함
  public class ProductManager {
      // ...
  }

  // 같은 파일에 여러 클래스 선언 가능 (public은 하나만)
  class ProductValidator {  // default 접근 지시자
      // ...
  }

  class ProductFormatter {
      // ...
  }
  ```

  - `public`으로 선언된 클래스의 이름은 저장되는 소스 파일명(.java)과 반드시 일치해야 함
  - 하나의 파일에 여러 클래스를 선언할 수 있지만, `public` 클래스는 하나만 가능
  - 파일명은 `public` 클래스의 이름과 동일해야 함

<br/><br/>

## 연습 문제

1. 자바에서 '클래스'와 '인스턴스'의 관계를 가장 잘 설명한 것은 무엇일까요?

   a. 클래스는 객체의 설계도 역할을 하고, 인스턴스는 그 설계도에 따라 메모리에 생성된 실제 객체입니다.

   - 클래스는 객체의 구조와 목적을 정의하는 설계도와 같음
   - 인스턴스는 그 설계도를 바탕으로 JVM에 의해 메모리 공간에 만들어진 실제 객체를 의미함
   - `new` 연산자로 생성함

2. 자바 클래스가 일반적으로 포함하는 핵심 구성 요소로 옳은 것은 무엇일까요?

   a. 필드(Field)와 메소드(Method)를 포함하며, 생성자(Constructor)도 가질 수 있습니다.

   - 클래스는 객체의 속성을 나타내는 변수(필드)와 객체의 행동을 나타내는 함수(메소드)의 묶음임
   - 또한, 객체 생성 시 초기화를 돕는 생성자도 포함할 수 있음

3. 자바에서 생성자(Constructor)의 주된 역할은 무엇일까요?

   a. 클래스의 인스턴스가 생성될 때 자동으로 호출되어 객체의 초기화를 담당합니다.

   - 생성자는 `new` 연산자로 인스턴스를 만들 때 자동으로 호출되는 특별한 메소드임
   - 객체가 처음 생성될 때 필드에 초기 값을 설정하는 등 객체를 사용 가능한 상태로 만드는 역할을 함

4. 클래스의 필드(Field)를 `private`으로 선언하는 주된 이유는 무엇일까요?

   a. 클래스 내부에서만 직접 접근하도록 하고, 외부에서의 직접 수정을 막아 데이터 무결성을 보호하기 위해서입니다.

   - 필드를 `private`으로 선언하면 클래스 외부에서 직접 접근하거나 수정할 수 없게 됨
   - 이는 객체의 상태를 개발자가 의도한 메소드(getter/setter)를 통해서만 변경하도록 강제하여 데이터의 안정성을 높임

5. 자바에서 `this` 키워드는 무엇을 가리킬까요?

   a. 해당 메소드를 호출한 객체, 즉 현재 작업 중인 인스턴스 자신을 가리키는 참조입니다.

   - `this`는 메소드나 생성자 내에서 현재 작업 중인 객체, 즉 그 메소드나 생성자가 속한 인스턴스 자신을 가리키는 참조임
   - 인스턴스 변수와 매개변수 이름이 같을 때 구분하는 등의 용도로 사용됨

<br/><br/>

## 요약 정리

### 클래스와 객체

- **계층 구조**

  - 항 → 식 → 구문 → 메서드 → 클래스 → 패키지
  - 체계적인 포함 관계를 통한 코드 조직화

- **개념**

  - 클래스는 객체를 생성하기 위한 설계도
  - 인스턴스는 메모리에 생성된 실체
  - 하나의 클래스로 여러 인스턴스 생성 가능

### 멤버 구성 요소

- **필드**

  - 객체의 상태를 담는 변수
  - 초기값 미지정 시 기본값 자동 할당
  - 생성자가 최종 초기화 담당

- **생성자**

  - `new` 연산자 사용 시 자동 호출
  - 클래스명과 동일, 반환 타입 없음
  - 미정의 시 기본 생성자 자동 추가

- **메서드**
  - 특정 기능을 수행하는 코드 블록
  - 코드 재사용성과 모듈화 제공

### 참조형 특징

- **메모리 관리**

  - 모든 객체는 힙 영역에 생성
  - 가비지 컬렉터가 자동 메모리 회수
  - 소멸자 없음

- **주의사항**
  - `==` 연산자는 주소 비교
  - `null`은 참조형만 가능
  - `NullPointerException` 주의

### 접근 제어

- **지시자**

  - `public` 모든 접근 허용
  - `protected` 같은 패키지 + 상속 클래스
  - `default` 같은 패키지만
  - `private` 클래스 내부만

- **캡슐화**
  - 필드는 `private`으로 은닉
  - Getter/Setter로 접근 제어
  - 데이터 무결성 보장

### this와 static

- **`this`**

  - 현재 인스턴스 참조
  - 인스턴스 메서드에서만 사용 가능
  - 매개변수와 필드명 구분

- **`static`**
  - 클래스 레벨 멤버
  - 인스턴스 없이 사용 가능
  - `this` 사용 불가

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2 강의](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
