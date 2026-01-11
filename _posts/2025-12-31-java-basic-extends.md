---
title: "[김영한의 실전 자바 기본편] 상속"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-31 23:50:00 +0900
category:
  - [Language, java]
tags: [java, inheritance, extends, override, super, access-modifier, final]
math: false
---

# 상속

- 김영한님의 실전 자바 강의 중 상속 챕터를 학습하며 상속의 개념, 메모리 구조, 메서드 오버라이딩, super 키워드, 접근 제어자의 동작 원리를 정리함

<br/><br/>

## 상속이란?

- 상속은 기존 클래스의 필드와 메서드를 새로운 클래스에서 재사용하는 것을 말함

- **부모 클래스 (Super Class)**
  - 상속을 통해 자신의 필드와 메서드를 다른 클래스에 제공하는 클래스
- **자식 클래스 (Sub Class)**
  - 부모 클래스로부터 필드와 메서드를 상속받는 클래스

### 상속이 필요한 이유

- **코드 중복 문제**

  - 여러 클래스에 동일한 기능(메서드)과 속성(필드)이 반복해서 작성됨

- **문제점**
  - **유지보수 어려움**
    - 공통 로직이 변경되면 관련된 모든 클래스를 일일이 수정해야 함
  - **오류 발생 가능성**
    - 수정 과정에서 일부 클래스를 누락하면 버그가 발생할 수 있음
- **해결책**
  - 상속을 사용하여 공통 기능을 부모 클래스로 추출하고 재사용함

<br/><br/>

## 상속의 기본 구조

### extends 키워드로 상속 구현

```java
package extends1.ex2;

public class Airplane {
    public void fly() {
        System.out.println("비행기가 날아갑니다.");
    }
}
```

```java
package extends1.ex2;

public class FighterJet extends Airplane {
    public void fire() {
        System.out.println("미사일을 발사합니다.");
    }
}
```

```java
package extends1.ex2;

public class PrivateJet extends Airplane {
    public void service() {
        System.out.println("기내 서비스를 제공합니다.");
    }
}
```

### 상속 관계 다이어그램

![Airplane Class Diagram](/assets/img/java-basic/extends/class-diagram-airplane.png)

- `extends` 키워드
  - 자식 클래스가 부모 클래스를 상속받음
- 기능 상속
  - 자식 클래스는 부모 클래스의 모든 기능을 사용할 수 있음
- 단일 상속
  - 자바는 단일 상속만 지원함 (하나의 부모 클래스만 상속 가능)
- 용어 정리
  - 부모 클래스 (Parent Class) = 상위 클래스 (Super Class) = 기반 클래스
  - 자식 클래스 (Child Class) = 하위 클래스 (Sub Class) = 파생 클래스

<br/><br/>

## 상속과 메모리 구조

### 객체 생성 시 메모리 동작

```java
FighterJet fighterJet = new FighterJet();
```

![Memory Creation](/assets/img/java-basic/extends/memory-creation.png)

- 핵심 원리
  - 자식 객체를 생성하면 부모 객체도 함께 메모리에 생성됨
  - 하나의 참조값으로 부모와 자식 영역 모두에 접근 가능함
  - 물리적으로는 하나의 인스턴스지만 논리적으로는 부모와 자식으로 구분됨

### 메모리 구조 시각화

![Memory Structure](/assets/img/java-basic/extends/memory-structure.png)

### 메서드 호출 순서

- **Case 1** (`fighterJet.fire()` 호출)
  - 호출한 변수의 타입 `FighterJet`에서 메서드를 검색함
  - `FighterJet`에 `fire()` 메서드가 존재함
  - 해당 메서드를 실행함
- **Case 2** (`fighterJet.fly()` 호출)
  - 호출한 변수의 타입 `FighterJet`에서 메서드를 검색함
  - `FighterJet`에 `fly()` 메서드가 없음
  - 부모 타입인 `Airplane`으로 이동하여 검색함
  - `Airplane`에 `fly()` 메서드가 존재함
  - 해당 메서드를 실행함

![Method Call](/assets/img/java-basic/extends/method-call.png)

- 메서드 검색 원칙
  - 자기 자신의 타입에서 먼저 검색함
  - 없으면 부모 타입으로 올라가며 검색함
  - 최상위 부모까지 찾지 못하면 컴파일 오류 발생함

<br/><br/>

## 상속을 통한 기능 확장

- **부모 클래스에 기능 추가의 효과**

- **상황**

  - 모든 비행기에 '착륙' 기능이 필요해졌다면?

- **상속 없이 구현 시**

```java
class FighterJet {
    void fly() { }
    void fire() { }
    void land() { }  // 추가
}

class PrivateJet {
    void fly() { }
    void service() { }
    void land() { }  // 추가
}
```

- 모든 비행기 클래스를 각각 수정해야 함
- 비행기 타입이 많을수록 수정 범위가 넓어짐 (실수 가능성 증가)

- **상속 활용 시**

```java
class Airplane {
    void fly() { }
    void land() { }  // ← 여기 한 곳만 추가!
}

class FighterJet extends Airplane {
    void fire() { }
}

class PrivateJet extends Airplane {
    void service() { }
}
```

- 부모 클래스인 `Airplane`에만 `land()`를 추가하면 됨
- 모든 자식 클래스(`FighterJet`, `PrivateJet` 등)에 자동으로 기능이 반영됨
- 유지보수 효율성이 극대화됨

<br/><br/>

## 접근 제어자와 상속

### 접근 제어자의 범위

![Access Modifier](/assets/img/java-basic/extends/access-modifier.png)

| 접근 제어자 | 같은 클래스 | 같은 패키지 | 자식 클래스 (다른 패키지) | 외부 |
| ----------- | ----------- | ----------- | ------------------------- | ---- |
| `private`   | 가능        | 불가        | 불가                      | 불가 |
| `default`   | 가능        | 가능        | 불가                      | 불가 |
| `protected` | 가능        | 가능        | 가능                      | 불가 |
| `public`    | 가능        | 가능        | 가능                      | 가능 |

### 상속에서 protected의 역할

```java
package extends1.access.child;

import extends1.access.parent.Parent;

public class Child extends Parent {
    public void call() {
        // 접근 가능
        publicValue = 1;
        protectedValue = 1;
        publicMethod();
        protectedMethod();

        // 컴파일 오류
        // defaultValue = 1;
        // privateValue = 1;
        // defaultMethod();
        // privateMethod();
    }
}
```

- **접근 가능 여부**
  - `public`, `protected`
    - 접근 가능함 (다른 패키지의 자식 클래스라도 `protected` 접근 허용함)
  - `default`
    - 다른 패키지이므로 접근 불가함 (상속과 무관하게 패키지 범위임)
  - `private`
    - 상속과 관계없이 접근 불가함

<br/><br/>

## 메서드 오버라이딩

### 오버라이딩이 필요한 상황

- 부모 클래스의 메서드를 자식 클래스에 맞게 변경하고 싶을 때 사용함

````java
package extends1.overriding;

```java
package extends1.overriding;

public class FighterJet extends Airplane {
    @Override
    public void fly() {
        System.out.println("전투기가 빠르게 비행합니다.");
    }

    public void fire() {
        System.out.println("미사일을 발사합니다.");
    }
}
````

- `Airplane`의 `fly()` 메서드를 `FighterJet`에서 재정의함

![Override Sequence](/assets/img/java-basic/extends/override-sequence.png)

- **@Override 애노테이션**
  - 컴파일러에게 메서드 오버라이딩을 명시적으로 알림
  - 오버라이딩 조건을 만족하지 않으면 컴파일 오류가 발생
  - 실수 방지와 코드 가독성 향상을 위해 **필수로 사용을 권장**

### 오버라이딩과 오버로딩

| 구분        | 오버로딩 (Overloading)            | 오버라이딩 (Overriding)      |
| ----------- | --------------------------------- | ---------------------------- |
| 정의        | 같은 이름의 메서드를 여러 개 정의 | 상속받은 메서드를 재정의     |
| 발생 위치   | 같은 클래스 내                    | 상속 관계 (부모-자식)        |
| 메서드 이름 | 동일                              | 동일                         |
| 매개변수    | **다름** (타입, 개수, 순서)       | **동일**                     |
| 반환 타입   | 상관없음                          | 동일 (또는 하위 타입)        |
| 목적        | 같은 기능을 다양한 방식으로 제공  | 부모 기능을 자식에 맞게 변경 |

### 오버라이딩 규칙

- **메서드 시그니처**

  - 메서드 이름이 동일해야 함
  - 매개변수 타입, 순서, 개수가 모두 동일해야 함

- **반환 타입**

  - 동일하거나 하위 타입(공변 반환 타입)이어야 함

- **접근 제어자**

  - 부모보다 더 제한적일 수 없음
  - 허용 방향
    - `private → default → protected → public`
    - 부모가 `protected`면 자식은 `protected` 또는 `public`만 가능함

- **예외**

  - 부모보다 더 많은 체크 예외를 선언할 수 없음
  - 런타임 예외는 제약 없음

- **오버라이딩 불가능한 경우**
  - `static` 메서드, `final` 메서드, `private` 메서드, 생성자

<br/><br/>

## super 키워드

### super - 부모 멤버 참조

- 부모와 자식에 같은 이름의 필드나 메서드가 있을 때 명확하게 구분하기 위해 사용함

  ```java
  package extends1.super1;

  public class Parent {
      public String value = "parent";

      public void hello() {
          System.out.println("Parent.hello");
      }
  }
  ```

  ```java
  package extends1.super1;

  public class Child extends Parent {
      public String value = "child";

      @Override
      public void hello() {
          System.out.println("Child.hello");
      }

      public void call() {
          System.out.println("this value = " + this.value);    // child
          System.out.println("super value = " + super.value);  // parent

          this.hello();   // Child.hello
          super.hello();  // Parent.hello
      }
  }
  ```

### super() - 부모 생성자 호출

- **생성자 호출 규칙**

  - 자식 생성자는 반드시 부모 생성자를 호출
  - `super()`를 명시하지 않으면 컴파일러가 자동으로 `super()`를 추가
  - `super()`는 생성자의 첫 번째 줄에 위치

  ```java
  public class ClassA {
      public ClassA() {
          System.out.println("ClassA 생성자");
      }
  }

  public class ClassB extends ClassA {
      public ClassB(int a, int b) {
          super();  // 생략 가능 (컴파일러가 자동 추가)
          System.out.println("ClassB 생성자 a=" + a + " b=" + b);
      }
  }

  public class ClassC extends ClassB {
      public ClassC() {
          super(10, 20);  // 명시적으로 부모 생성자 선택
          System.out.println("ClassC 생성자");
      }
  }
  ```

- **생성자 호출 순서**

![Super Constructor Sequence](/assets/img/java-basic/extends/super-constructor-sequence.png)

- **실행 결과**

  ```
  ClassA 생성자
  ClassB 생성자 a=10 b=20
  ClassC 생성자
  ```

### this()와 super()의 관계

- **규칙**

  - 둘 다 생성자의 첫 번째 줄에만 올 수 있음
  - 한 생성자에서 둘 중 하나만 사용 가능함

- **왜 하나만 가능한가?**

  - 생성자 첫 줄에는 하나의 명령문만 올 수 있기 때문
  - 결국 생성자 체인의 끝에서는 반드시 `super()`가 호출됨

    ```java
    public ClassB(int a) {
        this(a, 0);  // 다른 생성자 호출 (super() 호출 지연)
    }

    public ClassB(int a, int b) {
        super();  // 이 생성자에서 비로소 부모 생성자 호출
        // 초기화 로직
    }
    ```

  - `this()`로 생성자를 위임하면, 최종적으로 호출되는 생성자에서 `super()`가 실행됨

<br/><br/>

## 상속 설계 원칙

- **언제 상속을 사용해야 하는가?**

  - **IS-A 관계가 명확할 때**

    ```java
    // 전투기는 비행기다
    class FighterJet extends Airplane { }

    // 비행기는 날개를 가진다 (HAS-A 관계)
    class Airplane extends Wing { }  // 잘못된 설계, 컴포지션 사용 권장
    ```

    - "A는 B이다"라는 문장이 자연스러우면 상속을 고려
    - "A는 B를 가진다"라면 상속이 아닌 컴포지션(포함)을 사용

  - **코드 재사용과 확장이 필요할 때**

    ```java
    // 공통 기능: 로그인, 권한 체크
    abstract class User {
        void login() { }
        void checkPermission() { }
    }

    // 각 역할별 고유 기능 추가
    class Admin extends User {
        void manageUsers() { }
    }

    class Customer extends User {
        void purchaseItem() { }
    }
    ```

  - **다형성이 필요할 때**

    ```java
    // 부모 타입으로 여러 자식 객체를 동일하게 처리
    List<Item> items = new ArrayList<>();
    items.add(new Book(...));
    items.add(new Album(...));
    items.add(new Movie(...));

    for (Item item : items) {
        item.print();  // 다형성으로 각 타입에 맞게 실행
    }
    ```

- **상속을 피해야 하는 경우**

  - **단순히 코드를 재사용하기 위한 경우**

    - 컴포지션(구성)을 사용하는 것이 더 유연함

  - **부모 클래스가 자주 변경될 때**

    - 부모의 변경이 모든 자식에게 강하게 영향을 줌 (강한 결합도)
    - 유지보수가 어려워질 수 있음

  - **IS-A 관계가 아닐 때**

    ```java
    // 정사각형은 직사각형이다? (수학적으로는 맞지만 코드로는 문제)
    class Square extends Rectangle {
        @Override
        void setWidth(int width) {
            super.setWidth(width);
            super.setHeight(width);  // 정사각형은 가로=세로
        }
    }
    ```

    - 리스코프 치환 원칙(LSP) 위반 가능성이 있음
    - 부모 타입을 자식 타입으로 대체했을 때 프로그램이 올바르게 동작하지 않을 수 있음

<br/><br/>ㄴ

## final 키워드로 상속 제어

### final 클래스

```java
public final class MyFinalClass {
    // 더 이상 상속할 수 없는 클래스
}
```

- **사용 목적**
  - **보안**
    - 중요한 클래스가 변경되는 것을 방지함
  - **설계 의도**
    - 더 이상 확장하지 않겠다는 명확한 의사 표현함

### final 메서드

```java
public class Parent {
    public final void myFinalMethod() {
        System.out.println("변경 불가능한 메서드");
    }
}
```

- **사용 목적**
  - **핵심 로직 보호**
    - 자식 클래스에서 변경하면 안 되는 중요한 메서드
  - **성능 최적화**
    - 컴파일러가 메서드 인라이닝 등 최적화 수행 가능함

<br/><br/>

## 연습 문제

1. 상속을 사용하는 주된 목적은 무엇일까요?

   a. 코드 재사용을 통해 중복을 줄이기 위해

   - 상속은 부모 클래스의 필드와 메소드를 자식 클래스에서 물려받아 사용할 수 있게 함
   - 이를 통해 코드 중복을 줄이고 재사용성을 높이는 것이 핵심 목적임

2. 자바 상속에 대한 설명 중 올바른 것은 무엇인가요?

   a. 하나의 자식 클래스는 오직 하나의 부모 클래스만 상속할 수 있다.

   - 자바는 단일 상속만을 지원함
   - 이는 복잡성을 줄이기 위함이며, 한 자식 클래스는 반드시 하나의 부모 클래스만 상속받을 수 있음

3. 상속 관계의 자식 객체에서 메소드를 호출할 때, 자바는 해당 메소드를 어떤 순서로 찾을까요?

   a. 자식 클래스에서 먼저 찾고, 없으면 부모 클래스에서 찾는다.

   - 메소드 호출 시 자바는 항상 실제 객체 타입인 자식 클래스부터 검색함
   - 해당 메소드가 없으면 부모 클래스로 올라가 찾고, 최상위까지 없으면 컴파일 오류가 발생함

4. 메소드 오버라이딩(Overriding)은 무엇을 의미할까요?

   a. 부모 클래스로부터 상속받은 메소드의 내용을 자식 클래스에서 재정의하는 것

   - 오버라이딩은 부모 클래스의 메소드를 자식 클래스에서 동일한 시그니처(이름, 매개변수)로 재정의하는 것
   - 이를 통해 자식 클래스만의 특정 동작을 구현할 수 있음

5. 자식 클래스의 생성자 첫 줄에서 `super()`를 호출하는 가장 주된 이유는 무엇인가요?

   a. 부모 클래스의 생성자를 호출하여 부모 부분을 초기화하기 위해

   - 객체 생성 시 자식 클래스 객체 내부에는 부모 클래스 부분도 함께 생성됨
   - `super()`는 이 부모 부분을 올바르게 초기화하기 위해 부모 클래스의 생성자를 호출하는 역할을 함

<br/><br/>

## 요약 정리

### 개념

- 상속 (Inheritance)
  - `extends` 키워드로 부모의 필드와 메서드를 물려받음
  - 코드 중복을 줄이고 재사용성을 높임
- 단일 상속
  - 자바는 하나의 부모만 상속 가능함
- 메모리 구조
  - 자식 객체 생성 시 부모 인스턴스도 함께 생성됨
  - 하나의 참조로 두 영역 관리함
- 오버라이딩 (Overriding)
  - 부모의 기능을 자식에 맞게 재정의함
  - `@Override` 애노테이션 사용 권장
- super
  - 부모의 멤버나 생성자를 호출할 때 사용함

### 주요 규칙

- 생성자 호출
  - 자식 생성자는 반드시 부모 생성자를 호출해야 함 (첫 줄)
- 접근 제어
  - `private`은 상속되지 않음 (접근 불가)
  - `protected`는 상속 관계에서 접근 허용
- final 제어
  - `final class`: 상속 불가
  - `final method`: 오버라이딩 불가

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
