---
title: "[김영한의 실전 자바 기본편] 다형성 2"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-01 19:00:00 +0900
category:
  - [Language, java]
tags: [java, polymorphism, abstract-class, interface, multiple-inheritance]
math: false
---

# 다형성

- 김영한님의 실전 자바 강의 중 다형성 2 챕터를 학습하며 추상 클래스와 인터페이스를 활용한 다형성 구현 방법의 발전 과정과 설계 원칙을 정리함

<br/><br/>

## 다형성 구현의 발전

### 문제와 해결 과정

- **문제**

  - 타입이 다른 객체들을 하나로 묶어서 처리해야 함
  - 배열과 반복문으로 통합 처리가 필요함

- **해결 과정**
  - **상속**
    - 부모 클래스를 만들어 타입 통일
    - 문제
      - 부모 클래스를 직접 인스턴스화할 수 있음 (의미 없음)
  - **추상 클래스**
    - 인스턴스화를 막고 자식에게 구현을 강제함
    - 문제
      - 모든 메서드가 추상이면 클래스의 의미가 약함
  - **인터페이스**
    - 순수한 규약만 정의함
    - 다중 구현이 가능함

<br/><br/>

## 다형성의 필요성

### 문제 상황

```java
Piano dog = new Piano();
Guitar cat = new Guitar();
Drum caw = new Drum();

// 타입이 다르면 배열에 담을 수 없음
// 반복문 사용 불가
// 메서드로 통합 처리 불가
```

- **문제**

  - 각 객체의 타입이 달라서 하나로 묶을 수 없음

  ![Type Problem](/assets/img/java-basic/poly2/type-problem.png)

<br/><br/>

## 상속을 통한 다형성 구현

### 부모 클래스 생성

```java
public class Instrument {
    public void play() {
        System.out.println("악기 소리");
    }
}
```

### 자식 클래스들

```java
public class Piano extends Instrument {
    @Override
    public void play() {
        System.out.println("피아노 소리");
    }
}

public class Guitar extends Instrument {
    @Override
    public void play() {
        System.out.println("기타 소리");
    }
}
```

### 다형성 활용

```java
// 부모 타입으로 자식 객체 참조(다형적 참조)
Instrument[] instruments = {new Piano(), new Guitar(), new Drum()};

// 반복문으로 통합 처리
for (Instrument instrument : instruments) {
    instrument.play(); // 메서드 오버라이딩으로 각자의 소리 출력
}
```

![Instrument Class](/assets/img/java-basic/poly2/animal-class.png)

- **다형성의 두 기둥**
  - **다형적 참조**
    - 부모 타입으로 자식 객체를 참조함
  - **메서드 오버라이딩**
    - 자식의 메서드가 우선 호출됨

<br/><br/>

## 추상 클래스 (Abstract Class)

### 왜 필요한가

- **문제점**

  - `Instrument` 자체를 인스턴스화하는 것은 의미 없음
  - 악기라는 추상적인 개념만 존재하고 실제 "악기 그 자체"는 존재하지 않음
  - `Instrument`의 `play()`는 구현할 필요가 없음
  - 어차피 자식 클래스들이 오버라이딩할 것임

  ```java
  Instrument instrument = new Instrument(); // 의미 없는 코드
  instrument.play(); // 어떤 소리를 내야 하나?
  ```

### 추상 클래스 정의

```java
public abstract class AbstractInstrument {
    // 추상 메서드는 구현 없이 선언만
    public abstract void play();

    // 일반 메서드는 구현 가능
    public void move() {
        System.out.println("악기를 이동합니다.");
    }
}
```

![Abstract Features](/assets/img/java-basic/poly2/abstract-features.png)

### 추상 클래스 상속

```java
public class Piano extends AbstractInstrument {
    @Override
    public void play() { // 반드시 구현해야 함
        System.out.println("피아노 소리");
    }
    // move()는 상속받아 그대로 사용
}
```

- **규칙**
  - `abstract class`는 직접 생성 불가함
  - 추상 메서드를 하나라도 구현하지 않으면 컴파일 에러가 발생함
  - 일반 메서드와 추상 메서드를 혼용할 수 있음

<br/><br/>

## 인터페이스 (Interface)

### 추상 클래스의 한계

```java
public abstract class AbstractInstrument {
    public abstract void play();
    public abstract void move();
}
```

- **문제**
  - 모든 메서드가 추상이면 클래스를 쓸 이유가 없음

### 인터페이스 등장

```java
public interface InterfaceInstrument {
    void play(); // public abstract 자동
    void move();  // public abstract 자동
}
```

![Interface Evolution](/assets/img/java-basic/poly2/interface-evolution.png)

### 인터페이스 특징

```java
public interface InterfaceInstrument {
    // 모든 메서드는 public abstract (생략 가능)
    void play();
    void move();

    // 상수는 public static final (생략 가능)
    double MY_PI = 3.14;
}
```

- **자동으로 추가되는 키워드**
  - 메서드
    - `public abstract` 자동 추가
  - 변수
    - `public static final` 자동 추가

<br/><br/>

## 인터페이스 구현

### implements 키워드 사용

```java
// implements 키워드 사용
public class Piano implements InterfaceInstrument {
    @Override
    public void play() {
        System.out.println("피아노 소리");
    }

    @Override
    public void move() {
        System.out.println("피아노를 운반합니다");
    }
}
```

![Interface Class](/assets/img/java-basic/poly2/interface-class.png)

- **사용 방법은 추상 클래스와 동일**

  ```java
  InterfaceInstrument instrument = new Piano();
  instrument.play(); // 다형성 활용
  ```

<br/><br/>

## 추상 클래스와 인터페이스

![Abstract 대 Interface](/assets/img/java-basic/poly2/abstract-vs-interface.png)

| 구분          | 추상 클래스           | 인터페이스                   |
| ------------- | --------------------- | ---------------------------- |
| 상속/구현     | 단일 상속 (`extends`) | 다중 구현 (`implements`)     |
| 메서드        | 일반 + 추상 혼용      | 추상 메서드만 (default 제외) |
| 인스턴스 변수 | 가능                  | 불가 (상수만 가능)           |
| 생성자        | 가능                  | 불가                         |
| 목적          | 공통 기능 제공 + 규약 | 순수 규약 정의               |

<br/><br/>

## 다중 구현 (Multiple Implements)

### 왜 인터페이스는 다중 구현이 가능한가

```java
// 인터페이스는 구현이 없음
public interface Playable {
    void perform(); // 선언만
}

public interface Tuneable {
    void tune(); // 선언만
}

// 쉼표로 구분해 다중 구현
public class ElectricPiano extends AbstractInstrument implements Playable, Tuneable {
    @Override
    public void play() { /* ... */ }

    @Override
    public void perform() { /* ... */ }

    @Override
    public void tune() { /* ... */ }
}
```

![Multiple Implements](/assets/img/java-basic/poly2/multiple-implements.png)

- **이유**
  - 인터페이스는 구현이 없음 → 어떤 부모의 코드를 쓸지 모호하지 않음
  - 자식 클래스에서 모두 구현하므로 충돌이 없음

<br/><br/>

## 다이아몬드 문제 해결

### 같은 이름의 메서드를 가진 인터페이스

```java
public interface InterfaceA {
    void methodCommon();
}

public interface InterfaceB {
    void methodCommon();
}

// 같은 이름의 메서드를 두 인터페이스가 가져도 OK
public class Child implements InterfaceA, InterfaceB {
    @Override
    public void methodCommon() {
        // 하나만 구현하면 둘 다 만족
        System.out.println("Child.methodCommon");
    }
}
```

![Diamond Problem](/assets/img/java-basic/poly2/diamond-problem.png)

- **왜 문제없나**
  - 인터페이스는 구현이 없음
  - Child가 직접 구현하므로 어떤 메서드를 호출할지 명확함

<br/><br/>

## 상속과 구현의 조합

### 추상 클래스와 인터페이스 함께 사용

```java
// 추상 클래스는 공통 기능
public abstract class AbstractInstrument {
    public abstract void play();

    public void move() { // 공통 구현
        System.out.println("악기를 이동합니다.");
    }
}

// 인터페이스는 추가 능력
public interface Playable {
    void perform();
}

// 상속 + 구현
public class ElectricPiano extends AbstractInstrument implements Playable {
    @Override
    public void play() {
        System.out.println("전자 피아노 소리");
    }

    @Override
    public void perform() {
        System.out.println("전자 피아노를 연주합니다");
    }
}
```

![Inheritance Combination](/assets/img/java-basic/poly2/inheritance-combination.png)

- **원칙**
  - `extends`는 하나만, 앞에 위치함
  - `implements`는 여러 개 가능하며, 쉼표로 구분함

<br/><br/>

## 연습 문제

1. 다형성을 도입하기 전, 다양한 타입의 동물 객체(개, 고양이 등)를 하나의 목록으로 묶거나 동일한 방식으로 처리하기 어려웠던 주된 이유는 무엇입니까?

   - a. 각 객체의 타입이 달라서

   - 다형성 없이는 각기 다른 타입을 하나의 타입으로 묶을 수 없어 반복 코드가 발생함
   - 타입 불일치가 문제였음

2. Java에서 객체 지향의 다형성을 구현하고 실제 동작하게 하는 두 가지 주요 개념은 무엇입니까?

   - a. 다형적 참조와 메서드 오버라이딩

   - 부모 타입 참조로 자식 객체를 가리키는 다형적 참조와, 자식의 메서드가 우선 호출되는 오버라이딩 덕분임

3. 추상 클래스나 인터페이스 같은 '추상화' 기법을 객체 지향 프로그래밍에서 사용하는 주된 목적은 무엇입니까?

   - a. 개발자가 특정 메서드를 꼭 구현하도록 강제하기 위해

   - 하위 클래스가 특정 메서드를 반드시 구현하도록 '강제'하여 개발자의 실수를 막고 코드의 일관성을 유지함

4. Java에서 클래스는 다중 상속(여러 클래스를 동시에 extends)이 허용되지 않지만, 인터페이스는 다중 구현(여러 인터페이스를 동시에 implements)이 가능한 이유는 무엇입니까?

   - a. 인터페이스의 메서드에는 구현(본문)이 없기 때문에

   - 인터페이스는 추상 메서드만 있어 호출 시 어떤 부모의 코드를 쓸지 모호한 '다이아몬드 문제'가 발생하지 않음
   - 자식에서 무조건 구현하기 때문임

5. 다음 설명 중 '추상 클래스'에 대해 가장 올바른 것은 무엇입니까?

   - a. 객체를 직접 생성('new'로 인스턴스화)할 수 없음

   - 추상 클래스는 '미완성된' 클래스로, 구체적인 객체 생성이 목적이 아니기에 `new`로 인스턴스화할 수 없음
   - 상속받아 완성해야 함

<br/><br/>

## 요약 정리

### 다형성 구현 3단계

![Poly 3 Steps](/assets/img/java-basic/poly2/poly-3steps.png)

### 언제 무엇을 쓸까

![Decision Tree](/assets/img/java-basic/poly2/decision-tree.png)

- **선택 기준**
  - **공통 구현이 필요** → 추상 클래스
  - **순수 규약만 정의** → 인터페이스
  - **다중 상속 필요** → 인터페이스 (또는 조합)

### 참고 사항

- **설계 원칙**

  - 인터페이스로 역할 정의 → 유연한 설계
  - 추상 클래스로 공통 기능 제공 → 코드 재사용

- **실수 방지**
  - 추상 메서드 구현 누락 → 컴파일 에러로 즉시 발견
  - `@Override` 애노테이션 필수 사용

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
