---
title: "[독하게 시작하는 Java Part 2]  상속과 관계"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-05 00:00:00 +0900
category:
  - [Language, Java]
tags: [java, inheritance, extends, super, override, polymorphism, binding, uml]
math: false
---

# 상속과 관계

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 상속의 기본 개념과 `extends` 키워드 사용법, 생성자 호출 스택과 `super` 키워드의 역할, 메서드 재정의와 프레임워크 패턴 구현 방법, 클래스 간의 관계를 UML로 표현하는 방법, 정적 바인딩과 동적 바인딩의 차이를 학습하며 객체 지향 프로그래밍의 상속 개념을 정리함

<br/><br/>

## 상속의 기본 이론

### 상속이란

- 객체 단위의 코드를 재사용하고 확장하는 문법으로 `extends` 키워드를 사용함
- 클래스 간의 관계를 `is-a`(상속) 또는 `has-a`(포함) 관계로 설명할 수 있음
- Java는 C++와 달리 다중 상속을 허용하지 않으며 모든 클래스는 최상위 클래스인 `Object`의 파생 형식임
- 파생 클래스 인스턴스는 내부적으로 부모 클래스의 인스턴스를 포함하는 구조를 가짐

### 기본 구조

```java
class BaseClass {
    protected int baseValue = 100;  // 부모 멤버 변수

    public BaseClass() {
        System.out.println("BaseClass 생성자 호출됨");
    }
}

class DerivedClass extends BaseClass {
    private int derivedValue = 200;  // 자식 멤버 변수

    public DerivedClass() {
        super();  // 부모 클래스 생성자 명시적 호출
        System.out.println("DerivedClass 생성자 호출됨");
    }

    public void display() {
        System.out.println("Base: " + baseValue);  // 부모 변수 접근
        System.out.println("Derived: " + derivedValue);
    }
}
```

- **상속 관계의 특징**
  - `DerivedClass`는 `BaseClass`의 모든 `protected` 및 `public` 멤버에 접근 가능함
  - 파생 클래스 인스턴스는 부모 클래스의 인스턴스를 내부에 포함함
  - `DerivedClass` 객체를 생성하면 `baseValue`와 `derivedValue` 모두 메모리에 할당됨

### 상속과 메모리 구조

```
[Heap 영역]
DerivedClass 객체 {
    BaseClass 부분 {
        baseValue: 100
    }
    DerivedClass 부분 {
        derivedValue: 200
    }
    vtable 참조
}
```

- **객체 생성 시 메모리 레이아웃**
  - 자식 클래스의 객체를 생성하면 힙 메모리에는 부모 클래스의 멤버 변수 공간과 자식 클래스의 멤버 변수 공간이 모두 할당됨
  - 논리적으로는 상속이지만 물리적으로는 하나의 큰 객체 안에 부모의 데이터 영역이 포함되는 형태임

### is-a vs has-a

- **is-a 관계 (상속)**
  - `Bicycle` **is-a** `Vehicle`
  - 파생 클래스가 부모 클래스의 한 종류임을 의미함

```java
class Vehicle {
    protected String brand;

    public void move() {
        System.out.println("이동 중...");
    }
}

class Bicycle extends Vehicle {
    private int gearCount;

    @Override
    public void move() {
        System.out.println("페달을 밟아 이동 중...");
    }
}
```

- **사용 예제**

  - `Vehicle vehicle = new Bicycle();` (Bicycle is-a Vehicle)
  - `vehicle.move();` 호출 시 "페달을 밟아 이동 중..." 출력 (동적 바인딩)

- **has-a 관계 (포함)**
  - 한 클래스가 다른 클래스를 멤버로 포함함

```java
class Processor {
    private int coreCount;  // 코어 개수
}

class Computer {
    private Processor cpu;  // Processor를 멤버로 포함함 (포함 관계)
}
```

<br/><br/>

## 생성자 호출 스택과 super

### 생성자 호출 순서

- 파생 클래스의 생성자가 호출될 때 부모 클래스의 생성자가 가장 먼저 실행됨
- `super()` 구문을 사용하여 부모 클래스의 여러 생성자 중 특정 생성자를 강제로 호출할 수 있음
- 부모 클래스의 필드가 `private`인 경우 파생 클래스에서 직접 접근할 수 없으므로 `protected`를 사용하거나 메서드를 통해 접근해야 함

### super를 이용한 생성자 선택

```java
class Test {
    public Test(int param) {
        System.out.println("Test(int)");
    }
}

class TestEx extends Test {
    public TestEx(int param) {
        super(param); // 부모의 특정 생성자 호출
        System.out.println("TestEx(int)");
    }
}
```

- **실행 결과**

```
Test(int)
TestEx(int)
```

- **주의사항**
  - `super()` 호출은 생성자의 첫 번째 문장이어야 함
  - 명시적으로 `super()`를 호출하지 않으면 컴파일러가 자동으로 부모의 기본 생성자 `super()`를 삽입함
  - **중요**: 부모 클래스에 기본 생성자가 없고 매개변수가 있는 생성자만 있다면, 자식 클래스 생성자에서 반드시 `super(인자)`로 부모 생성자를 명시적으로 호출해야 함
  - 그렇지 않으면 컴파일러가 자동 삽입하려는 기본 생성자 `super()`를 부모 클래스에서 찾을 수 없어 **컴파일 에러**가 발생함

### protected 접근 제어자

```java
class Parent {
    private int privateData;
    protected int protectedData;

    protected void setPrivateData(int data) {
        this.privateData = data;
    }
}

class Child extends Parent {
    public void accessData() {
        // this.privateData = 10;    // 컴파일 에러
        this.protectedData = 20;      // 가능
        this.setPrivateData(30);      // 가능
    }
}
```

<br/><br/>

## 메서드 재정의와 프레임워크 구조

### 메서드 재정의(Overriding)

- 부모의 기능을 대체하거나 새로운 코드를 추가하기 위해 사용함
- `@Override` 어노테이션을 사용하여 컴파일러의 검증을 받는 것이 권장됨
- `final`로 선언된 메서드는 파생 클래스에서 재정의할 수 없음

### 메서드 재정의와 기능 확장

```java
class Test {
    protected int data;

    public void setData(int param) {
        this.data = param;
    }
}

class TestEx extends Test {
    @Override
    public void setData(int param) {
        if(param < 0) param = 0; // 기능 추가(필터링)
        super.setData(param);    // 부모의 기존 로직 호출
    }
}
```

- **재정의의 장점**
  - 부모의 기존 기능을 유지하면서 추가 로직을 삽입할 수 있음
  - `super.메서드명()`으로 부모의 원본 구현을 호출할 수 있음

### 프레임워크 스타일의 메서드 호출

- 부모 클래스에서 흐름을 정의하고 파생 클래스에서 세부 동작(추상 메서드 등)을 구현하는 방식을 활용함
- 템플릿 메서드 패턴의 기본 구조임

```java
abstract class DataProcessor {
    // 템플릿 메서드 - 처리 흐름 정의
    // final로 선언하여 하위 클래스에서 흐름을 변경하지 못하도록 함
    public final void process() {
        readData();
        processData();
        writeData();
    }

    // 하위 클래스에서 구현할 추상 메서드 (protected)
    protected abstract void readData();
    protected abstract void processData();
    protected abstract void writeData();
}

class CSVProcessor extends DataProcessor {
    @Override
    protected void readData() {
        System.out.println("CSV 파일 읽기");
    }

    @Override
    protected void processData() {
        System.out.println("CSV 데이터 처리");
    }

    @Override
    protected void writeData() {
        System.out.println("CSV 파일 쓰기");
    }
}
```

- **패턴의 핵심**

  - 부모 클래스가 알고리즘의 골격(`process`)을 정의함
  - 자식 클래스는 세부 단계(`readData` 등)를 구현함
  - `final` 키워드로 템플릿 메서드를 보호하여 전체 흐름이 변경되는 것을 방지함

- **Called by framework 패턴**
  - 프레임워크가 흐름을 제어하고, 개발자는 필요한 메서드(Hook 등)만 구현함
  - Android의 `onCreate()`, `onDestroy()` 등이 대표적인 예시임
  - 제어의 역전(IoC, Inversion of Control) 원칙을 따름

<br/><br/>

## 클래스 관계와 UML

### UML이란

- 클래스 간의 관계를 시각화하기 위해 UML(Unified Modeling Language) 표준을 사용함
- 소프트웨어 설계를 문서화하고 의사소통하는 표준 방법임

### 주요 관계 유형

- **일반화(Generalization)**

  ![Generalization](/assets/img/java-part2/inheritance/uml_generalization.png)

  - 상속 관계를 나타냄
  - 삼각형 화살표로 표시함
  - 자식 → 부모 방향

- **실체화(Realization)**

  ![Realization](/assets/img/java-part2/inheritance/uml_realization.png)

  - 인터페이스 상속을 나타냄
  - 점선 삼각형 화살표로 표시함

- **집합(Aggregation)**

  ![Aggregation](/assets/img/java-part2/inheritance/uml_aggregation.png)

  - 부분이 전체와 독립적으로 존재할 수 있는 관계
  - 빈 다이아몬드로 표시함

- **합성(Composition)**

  ![Composition](/assets/img/java-part2/inheritance/uml_composition.png)

  - 부분이 전체에 종속되어 전체가 사라지면 부분도 사라지는 관계
  - 채워진 다이아몬드로 표시함

- **의존(Dependency)**

  ![Dependency](/assets/img/java-part2/inheritance/uml_dependency.png)

  - 한 클래스가 다른 클래스를 사용하는 관계
  - 점선 화살표로 표시함

- **연관(Association)**

  ![Association](/assets/img/java-part2/inheritance/uml_association.png)

  - 클래스 간의 참조 관계
  - 실선 화살표로 표시함

### 합성 관계 구현

```java
class Heart {
    // 심장 기능
}

class Person {
    private final Heart heart = new Heart();  // Person과 함께 생성되고 소멸됨

    public Person() {
        // 내부에서 직접 Heart 객체를 생성함
    }
}
```

- **특징**
  - `Person`이 삭제되면 `Heart` 인스턴스도 함께 소멸됨
  - 강한 결합(Strong Coupling)을 나타냄
  - 빈 수명주기를 공유함

### 집합 관계 구현

```java
class Student {
    private String name;  // 학생 정보
}

class School {
    private List<Student> students;  // 외부에서 생성된 객체를 참조함

    // 외부에서 생성된 Student 객체를 받아서 사용함
    public School(List<Student> students) {
        this.students = students;
    }

    public void addStudent(Student student) {
        students.add(student);  // 외부 객체를 추가
    }
}
```

- **특징**
  - `School`이 삭제되어도 `Student` 인스턴스는 독립적으로 존재할 수 있음
  - 약한 결합(Loose Coupling)을 나타냄
  - 객체를 외부에서 주입받음(Dependency Injection)

<br/><br/>

## 바인딩과 동적 바인딩

### 바인딩이란

- 함수 호출 관계가 맺어지는 것을 바인딩이라고 함
- 시점에 따라 정적 바인딩과 동적 바인딩으로 구분됨

### 정적 바인딩 (Static Binding)

- **특징**
  - 컴파일 시점에 호출될 메서드가 결정됨
  - `static`, `private`, `final` 메서드와 생성자가 해당됨
  - 이들은 오버라이딩이 불가능하거나(private, final), 클래스 레벨에 속하므로(static) 컴파일러가 호출 대상을 확정할 수 있음

```java
// 정적 메서드는 오버라이딩되지 않고 숨겨짐(Hiding)
class Parent {
    public static void print() {
        System.out.println("Parent static");
    }
}

class Child extends Parent {
    // 오버라이딩 아님, 단순히 같은 이름의 메서드를 정의한 것(Hiding)
    public static void print() {
        System.out.println("Child static");
    }
}

// 참조 변수의 타입에 따라 호출 대상이 정해짐
Parent p = new Child();
p.print(); // "Parent static" (정적 바인딩)

Child c = new Child();
c.print(); // "Child static"
```

### 동적 바인딩 (Dynamic Binding)

- **정의**

  - 실행 시점(Run-time)에 호출될 메서드가 결정되는 메커니즘
  - 부모 타입의 참조 변수가 자식 객체를 가리킬 때, 오버라이딩된 메서드 호출이 실제 객체 타입에 따라 연결되는 것

- **발생 조건**
  - 상속 관계가 존재해야 함
  - 메서드가 오버라이딩되어 있어야 함
  - 부모 타입의 참조 변수로 메서드를 호출해야 함

```java
class Animal {
    public void sound() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    public void sound() { System.out.println("Bark"); }
}

// 동적 바인딩 발생
Animal animal = new Dog();
animal.sound(); // "Bark" - 런타임에 Dog의 vtable을 확인하여 호출
```

### 가상 함수 테이블 (vtable)

- **JVM의 메서드 디스패치**

  - JVM 구현에 따라 다를 수 있지만, 대부분 vtable과 유사한 메커니즘을 사용함
  - 각 클래스는 자신의 메서드 테이블 정보를 유지함
  - 객체는 자신의 클래스 메타데이터를 가리키는 참조를 포함함
  - **주의**
    - Java 언어 스펙은 구체적인 구현 방식을 명시하지 않음

- **동작 방식 (HotSpot JVM 기준)**
  - 오버라이딩된 메서드는 vtable에서 자식 클래스의 메서드 주소로 갱신됨
  - `animal.sound()` 호출 시
    1. `animal` 변수가 가리키는 실제 객체(`Dog`)의 헤더에서 클래스 정보를 확인
    2. `Dog` 클래스의 vtable 조회
    3. `sound()` 메서드의 실제 주소로 점프하여 실행
  - 이 과정이 런타임에 일어나므로 동적 바인딩이라 함

<br/><br/>

## 연습 문제

1. 객체 지향 프로그래밍에서 상속의 주된 목적은 무엇일까요?

   a. 코드 재사용 및 확장성을 높이기 위함

   - 상속은 부모 클래스의 기능을 물려받아 코드를 재사용하고, 거기에 새로운 기능을 추가하여 확장성을 얻는 핵심 기법임
   - 이는 객체 지향의 중요한 원칙임

2. 상속 관계에서 자식 클래스의 인스턴스를 생성할 때, 생성자 실행 순서는 어떻게 될까요?

   a. 자식 생성자가 부모 생성자를 호출하고, 부모 생성자가 먼저 실행된 후 자식 생성자의 코드가 실행된다.

   - 자식 생성자가 먼저 호출되지만, 실제 코드는 자식 생성자 안에서 부모 생성자를 먼저 호출하여 부모 생성자의 코드가 실행 완료된 후 자식 생성자의 코드가 실행됨

3. 부모 클래스의 특정 멤버를 자식 클래스에서는 접근할 수 있지만, 외부에서는 접근하지 못하게 하려면 어떤 접근 제어자를 사용할까요?

   a. protected

   - `protected`는 해당 클래스 내, 같은 패키지 내, 그리고 상속받은 자식 클래스 내에서 접근을 허용함
   - 상속 관계에서 자식에게만 멤버를 공개할 때 유용함

4. 객체 지향에서 메서드 오버라이딩(Overriding)은 무엇을 의미할까요?

   a. 부모 클래스의 메서드를 자식 클래스에서 같은 이름으로 재정의하는 것

   - 오버라이딩은 상속받은 부모 클래스의 메서드를 자식 클래스에서 동일한 시그니처로 다르게 구현하는 재정의 기법임
   - 기존 기능을 변경하거나 확장할 때 사용됨

5. 부모 클래스 타입의 참조 변수로 자식 클래스 인스턴스를 가리킬 때, 오버라이딩된 메서드를 호출하면 어떤 메서드가 실행될까요?

   a. 실제 생성된 객체 인스턴스 타입에 해당하는 자식 클래스의 오버라이딩된 메서드

   - 오버라이딩된 메서드 호출 시, 실제 실행되는 코드는 참조 변수의 타입이 아닌 인스턴스(객체)의 타입에 따라 런타임에 결정됨
   - 이것이 동적 바인딩의 특징임

<br/><br/>

## 정리

- 상속은 `extends` 키워드를 사용하여 코드를 재사용하고 확장하는 문법임
- 파생 클래스 생성자 호출 시 부모 클래스의 생성자가 먼저 실행되며 `super()`로 제어할 수 있음
- 메서드 재정의는 `@Override` 어노테이션을 사용하여 부모의 기능을 확장하거나 대체함
- 프레임워크 패턴은 부모가 흐름을 정의하고 자식이 세부 동작을 구현하는 구조임
- UML은 클래스 간의 관계를 시각화하는 표준 방법이며 다양한 관계 유형이 존재함
- 정적 바인딩은 컴파일 시점에, 동적 바인딩은 실행 시점에 함수 호출이 결정됨
- Java의 다형성은 vtable을 통한 동적 바인딩으로 구현되어 유연한 코드 작성이 가능함

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
