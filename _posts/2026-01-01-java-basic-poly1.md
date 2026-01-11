---
title: "[김영한의 실전 자바 기본편] 다형성 1"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-01 18:00:00 +0900
category:
  - [Language, java]
tags: [java, polymorphism, casting, overriding, instanceof]
math: false
---

# 다형성 1

- 김영한님의 실전 자바 강의 중 다형성 1 챕터를 학습하며 다형성이 필요한 이유, 다형적 참조, 캐스팅, instanceof, 메서드 오버라이딩의 동작 원리를 정리함

<br/><br/>

## 다형성이 필요한 이유

### 타입이 다른 객체를 처리하는 문제

- **문제 상황**

  - 프로그램에서 여러 종류의 객체를 처리해야 하는 경우가 많음
  - 각 객체의 타입이 다르면 개별적으로 처리해야 함
  - 코드 중복이 발생하고 확장성이 떨어짐

- **예시**

  ```java
  Piano piano = new Piano();
  Guitar guitar = new Guitar();
  Drum drum = new Drum();

  // 각각 개별적으로 호출해야 함
  piano.play();
  guitar.play();
  drum.play();

  // 배열에 담을 수 없음 (타입이 다름)
  // 반복문을 사용할 수 없음
  ```

### 기존 방식의 한계

- **불가능한 작업들**

  - 서로 다른 타입의 객체를 하나의 배열에 담을 수 없음
  - 반복문으로 통합 처리할 수 없음
  - 메서드 파라미터로 공통 처리할 수 없음

- **해결 방법**
  - 상속 관계를 활용함
  - 부모 타입으로 자식 객체를 참조함
  - 다형성을 통해 통합 처리가 가능해짐

<br/><br/>

## 다형성(Polymorphism)이란

### 기본 개념

- **다형성(Polymorphism)**

  - "poly"(많은) + "morph"(형태) = "많은 형태"
  - 객체지향 프로그래밍의 주요 개념 중 하나
  - 하나의 객체가 여러 타입으로 취급될 수 있는 능력

- **다형성의 주요 요소**
  - **다형적 참조**
    - 부모 타입의 변수가 자식 인스턴스를 참조할 수 있음
  - **메서드 오버라이딩**
    - 부모 타입으로 호출해도 실제 자식 메서드가 실행됨

<br/><br/>

## 다형적 참조

### 부모 타입으로 자식 인스턴스 참조

```java
package instrument.basic;

public class Instrument {
    public void play() {
        System.out.println("Instrument.play");
    }
}
```

```java
package instrument.basic;

public class Piano extends Instrument {
    public void tune() {
        System.out.println("Piano.tune");
    }
}
```

```java
package instrument.basic;

public class PolyMain {
    public static void main(String[] args) {
        // 부모 변수가 부모 인스턴스 참조
        Instrument instrument = new Instrument();
        instrument.play();

        // 자식 변수가 자식 인스턴스 참조
        Piano piano = new Piano();
        piano.play();  // 상속받은 메서드
        piano.tune();   // 자식 고유 메서드

        // 다형적 참조는 부모 변수가 자식 인스턴스 참조
        Instrument poly = new Piano();
        poly.play();

        // poly.tune();  // 컴파일 오류
    }
}
```

```
Instrument.play
Instrument.play
Piano.tune
Instrument.play
```

### 메모리 구조

![Polymorphism Memory Reference](/assets/img/java-basic/poly1/poly-reference.png)

### 다형적 참조의 원리

- **가능한 경우**

  ```java
  Instrument poly = new Piano();       // 부모는 자식을 담을 수 있음
  Instrument poly = new GrandPiano();  // 부모는 손자도 담을 수 있음
  ```

- **불가능한 경우**

  ```java
  Piano piano = new Instrument();  // 자식은 부모를 담을 수 없음
  ```

- **이유**
  - 부모 타입은 자식 타입을 포함할 수 있음 (더 넓은 범위임)
  - 자식 타입은 부모 타입보다 더 많은 기능을 가질 수 있음 (더 구체적임)

### 호출 가능한 메서드의 제한

```java
Instrument poly = new Piano();
poly.play();  // 호출 가능
poly.tune();  // 컴파일 오류
```

- **규칙**
  - 호출 가능한 메서드는 **변수의 타입**에 의해 결정됨
  - `poly`는 `Instrument` 타입이므로 `Instrument`에 선언된 메서드만 호출 가능
  - 실제 인스턴스가 `Piano`라도 `Instrument` 타입으로 선언되었다면 `tune()`는 보이지 않음

<br/><br/>

## 캐스팅

### 다운캐스팅의 필요성

```java
Instrument poly = new Piano();
poly.tune();  // 컴파일 오류
```

- `poly`는 `Instrument` 타입이므로 `tune()`을 호출할 수 없음
- 하지만 실제 인스턴스는 `Piano`이므로 `tune()`가 존재함
- 이럴 때 **다운캐스팅**을 사용함

### 다운캐스팅 사용법

```java
package instrument.basic;

public class CastingMain1 {
    public static void main(String[] args) {
        // 다형적 참조
        Instrument poly = new Piano();

        // poly.tune();  // 컴파일 오류

        // 다운캐스팅 (부모 타입 -> 자식 타입)
        Piano piano = (Piano) poly;
        piano.tune();  // 호출 가능
    }
}
```

```
Piano.tune
```

### 캐스팅 과정 상세 분석

```java
Piano piano = (Piano) poly;
```

![Casting Process](/assets/img/java-basic/poly1/casting-process.png)

- **단계별 과정**
  - `poly`는 `Instrument` 타입이지만 `x001` 참조값을 가짐
  - `(Piano)` 캐스팅으로 `Instrument` 타입을 `Piano` 타입으로 변환
  - `piano` 변수는 `Piano` 타입으로 `x001` 참조
  - 이제 `piano.tune()` 호출 가능함

### 일시적 다운캐스팅

```java
((Piano) poly).tune();
```

- 변수 선언 없이 일시적으로 캐스팅하여 메서드 호출
- 한 번만 사용할 때 유용함

### 업캐스팅

```java
Piano piano = new Piano();

// 명시적 업캐스팅
Instrument instrument1 = (Instrument) piano;

// 업캐스팅 생략 (권장)
Instrument instrument2 = piano;
```

- **원리**
  - 업캐스팅(자식 → 부모)은 항상 안전함
  - 자식 타입은 부모 타입의 모든 기능을 포함하기 때문임
  - 따라서 캐스팅 생략 가능함 (자바 컴파일러가 자동 처리)
  - 다운캐스팅(부모 → 자식)은 명시적으로 캐스팅이 필요함

![Casting Direction](/assets/img/java-basic/poly1/casting-direction.png)

### 다운캐스팅의 위험성

```java
package instrument.basic;

public class CastingMain4 {
    public static void main(String[] args) {
        // 안전한 다운캐스팅
        Instrument instrument1 = new Piano();
        Piano piano1 = (Piano) instrument1;
        piano1.tune();  // 정상 실행

        // 위험한 다운캐스팅
        Instrument instrument2 = new Instrument();
        Piano piano2 = (Piano) instrument2;  // ClassCastException
        piano2.tune();  // 실행되지 않음
    }
}
```

```
Piano.tune
Exception in thread "main" java.lang.ClassCastException:
    class instrument.basic.Instrument cannot be cast to class instrument.basic.Piano
```

### 메모리 구조로 이해하기

- **성공하는 다운캐스팅**

  ![Safe Downcasting](/assets/img/java-basic/poly1/downcasting-safe.png)

- **실패하는 다운캐스팅**

  ![Unsafe Downcasting](/assets/img/java-basic/poly1/downcasting-unsafe.png)

### 다운캐스팅 가능 여부 판단 원칙

- **규칙**

  - `new` 키워드로 생성한 인스턴스의 실제 타입이 기준
  - 업캐스팅으로 부모 타입 변수에 담겨있더라도, 실제 인스턴스 타입이 중요

- **예시**
  - `new Piano()`로 생성
    - A, B, C 타입으로 모두 업캐스팅 가능
    - A, B, C 타입에서 모두 다시 `Piano`로 다운캐스팅 가능
  - `new Instrument()`로 생성
    - `Instrument` 타입으로만 업캐스팅 가능
    - `Piano`로 다운캐스팅 시도 시 `ClassCastException` 발생

<br/><br/>

## instanceof 연산자

### instanceof의 필요성

```java
Instrument parent1 = new Instrument();
Instrument parent2 = new Piano();
```

- 두 변수 모두 `Instrument` 타입
- 하지만 `instrument1`은 실제로 `Instrument`, `instrument2`는 실제로 `Piano`
- 다운캐스팅 전에 실제 타입을 확인해야 안전함

### instanceof 사용법

```java
package instrument.basic;

public class CastingMain5 {
    public static void main(String[] args) {
        Instrument instrument1 = new Instrument();
        System.out.println("instrument1 호출");
        call(instrument1);

        Instrument instrument2 = new Piano();
        System.out.println("instrument2 호출");
        call(instrument2);
    }

    private static void call(Instrument instrument) {
        instrument.play();

        // instanceof로 타입 확인 후 다운캐스팅
        if (instrument instanceof Piano) {
            System.out.println("Piano 인스턴스 맞음");
            Piano piano = (Piano) instrument;
            piano.tune();
        }
    }
}
```

```
instrument1 호출
Instrument.play

instrument2 호출
Instrument.play
Piano 인스턴스 맞음
Piano.tune
```

### instanceof 동작 원리

```java
// instrument1의 경우
instrument instanceof Piano  // new Instrument() instanceof Piano → false

// instrument2의 경우
instrument instanceof Piano  // new Piano() instanceof Piano → true
```

- **instanceof 규칙**

  ```java
  new Instrument() instanceof Instrument  // true
  new Piano() instanceof Instrument       // true (자식은 부모의 인스턴스이기도 함)
  new Instrument() instanceof Piano       // false (부모는 자식의 인스턴스가 아님)
  new Piano() instanceof Piano            // true
  ```

  ![Instanceof Logic](/assets/img/java-basic/poly1/instanceof-logic.png)

### Java 16 Pattern Matching (참고)

```java
private static void call(Instrument instrument) {
    instrument.play();

    // instanceof + 다운캐스팅을 한 번에
    if (instrument instanceof Piano piano) {
        System.out.println("Piano 인스턴스 맞음");
        piano.tune();
    }
}
```

- Java 16부터 지원
- `instanceof` 검사와 동시에 변수 선언 가능
- 코드가 더 간결해짐

<br/><br/>

## 다형성과 메서드 오버라이딩

### 변수와 메서드의 동작 차이

```java
package instrument.overriding;

public class Instrument {
    public String value = "parent";

    public void method() {
        System.out.println("Instrument.method");
    }
}
```

```java
package instrument.overriding;

public class Piano extends Instrument {
    public String value = "child";

    @Override
    public void method() {
        System.out.println("Piano.method");
    }
}
```

```java
package instrument.overriding;

public class OverridingMain {
    public static void main(String[] args) {
        // 자식 변수가 자식 인스턴스 참조
        Piano piano = new Piano();
        System.out.println("value = " + piano.value);     // child
        piano.method();                                    // Piano.method

        // 부모 변수가 부모 인스턴스 참조
        Instrument instrument = new Instrument();
        System.out.println("value = " + instrument.value);    // parent
        instrument.method();                                   // Instrument.method

        // 부모 변수가 자식 인스턴스 참조 (다형적 참조)
        Instrument poly = new Piano();
        System.out.println("value = " + poly.value);      // parent
        poly.method();                                     // Piano.method
    }
}
```

```
value = child
Piano.method
value = parent
Instrument.method
value = parent
Piano.method
```

### 원리

- **변수(필드)**

  - 변수는 **선언된 타입**을 따름
  - `poly.value` → `Instrument` 타입이므로 `Instrument`의 `value` 출력

- **메서드**

  - 오버라이딩된 메서드는 **실제 인스턴스의 타입**을 따름
  - `poly.method()` → 실제로는 `Piano` 인스턴스이므로 `Piano.method()`가 실행됨

  ![Overriding Logic](/assets/img/java-basic/poly1/overriding-logic.png)

- **오버라이딩 우선순위**
  - 메서드 오버라이딩이 있으면 **항상 오버라이딩된 메서드가 우선**
  - 다형성의 메커니즘
  - 이를 통해 부모 타입으로 호출해도 자식의 구체적인 구현이 실행됨

<br/><br/>

## 연습 문제

1. 객체 지향 프로그래밍에서 '다형성'의 의미는 무엇일까요?

   - a. 한 객체가 다양한 형태를 가질 수 있음

   - 다형성은 객체 지향의 중요한 특징으로, 하나의 객체가 여러 가지 타입으로 취급될 수 있음을 의미함
   - 이는 코드의 유연성과 확장성을 높여줌

2. 부모 타입 변수가 자식 인스턴스를 참조하고 있을 때, 캐스팅 없이 직접 접근하여 호출할 수 있는 멤버는 무엇일까요?

   - a. 부모 클래스의 멤버만

   - 부모 타입 변수는 선언된 타입(부모)의 멤버만 알고 있기 때문에, 실제 참조하는 인스턴스가 자식이더라도 부모 클래스에 정의된 멤버만 직접 호출 가능함
   - 자식 고유 멤버는 다운캐스팅이 필요함

3. 부모 타입 변수가 참조하는 자식 인스턴스의 '자식 고유' 메소드나 필드에 접근하기 위해 주로 사용하는 방법은 무엇일까요?

   - a. 다운캐스팅

   - 부모 변수는 자식 고유의 멤버를 직접 알지 못함
   - 따라서 부모 타입 변수가 참조하는 자식 인스턴스의 자식 고유 기능을 사용하려면 다운캐스팅을 통해 자식 타입으로 형변환해야 함

4. 실제 메모리에 부모 타입 인스턴스만 생성되었는데, 이 인스턴스를 자식 타입으로 강제 형변환(다운캐스팅)하려 할 때 발생하는 예외(오류)는 무엇일까요?

   - a. ClassCastException

   - 메모리에 존재하지 않는 하위 타입으로 강제로 형변환하려 할 때 ClassCastException이 발생함
   - 이는 런타임 오류로 프로그램 실행 중 중단될 수 있으니 주의해야 함

5. 부모 타입 변수가 자식 인스턴스를 참조하고 있을 때, 부모와 자식 클래스 모두에 동일하게 정의(오버라이딩)된 메소드를 호출하면 어떤 클래스의 메소드가 실행될까요?

   - a. 자식 클래스의 메소드

   - 다형성 환경에서 메소드가 오버라이딩되면 변수의 타입이 아닌 실제 인스턴스의 타입에 따라 실행될 메소드가 결정됨
   - 오버라이딩된 자식 메소드가 항상 우선권을 가짐

<br/><br/>

## 요약 정리

### 다형성의 필요성

- 타입이 다른 객체를 통합 처리하기 위함
- 배열과 반복문으로 공통 처리 가능
- 코드의 확장성과 유연성 향상

### 주요 개념

- **다형성의 두 기둥**

  - 다형적 참조
    - `Instrument poly = new Piano()`
  - 메서드 오버라이딩
    - 부모 타입으로 호출해도 자식 메서드가 실행됨

- **캐스팅**

  - 업캐스팅 (자식 → 부모)
    - 생략 가능, 항상 안전
  - 다운캐스팅 (부모 → 자식)
    - 명시 필요, `instanceof`로 확인 권장

- **instanceof**

  - 다운캐스팅 전 안전성 확인
  - Java 16+ Pattern Matching 지원

- **메서드 오버라이딩**
  - 오버라이딩된 메서드는 항상 우선 실행
  - 변수(필드)는 타입 기준, 메서드는 인스턴스 기준

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
