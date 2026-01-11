---
title: "[김영한의 실전 자바 기본편] 접근 제어자"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-30 22:10:00 +0900
category:
  - [Language, java]
tags: [java, access-modifier, encapsulation, private, public, protected, default, oop]
math: false
mermaid: true
---

# 접근 제어자

- 김영한님의 실전 자바 강의 중 접근 제어자 챕터를 학습하며 private, public, protected, default의 차이와 활용법, 그리고 캡슐화를 통한 데이터 보호와 객체 지향 설계 원칙을 정리함

<br/><br/>

## 왜 접근 제어자가 필요한가

### 데이터 보호의 필요성

- 객체의 필드에 직접 접근을 허용하면 검증 로직을 우회할 수 있음
- 데이터 무결성을 보장하려면 클래스가 정의한 규칙을 따르도록 강제해야 함

<br/><br/>

## private으로 데이터 보호하기

### AirConditioner 예제

- 에어컨 온도를 관리하는 클래스
- 온도는 최저 18도 이상, 최대 30도 이하로 설정 가능해야 함

#### 문제 상황

```java
package climate;

public class AirConditioner {
    int temperature; // 온도 저장 (18~30도)

    // 생성자: 초기 온도 설정
    AirConditioner(int temperature) {
        this.temperature = temperature;
    }

    // 온도 상승 (최대 30도)
    void increaseTemp() {
        if (temperature >= 30) {
            System.out.println("온도 상승 불가: 최대 30도입니다.");
        } else {
            temperature += 1;
            System.out.println("온도 1도 상승");
        }
    }

    // 온도 하강 (최저 18도)
    void decreaseTemp() {
        if (temperature <= 18) {
            System.out.println("온도 하강 불가: 최저 18도입니다.");
        } else {
            temperature -= 1;
            System.out.println("온도 1도 하강");
        }
    }

    // 현재 온도 출력
    void showTemperature() {
        System.out.println("현재 온도: " + temperature + "도");
    }
}
```

```java
package climate;

public class AirConditionerMain {
    public static void main(String[] args) {
        AirConditioner aircon = new AirConditioner(28);

        // 필드에 직접 접근하여 검증 로직 우회
        aircon.temperature = 50; // 온도 범위를 벗어난 값 설정 가능
        aircon.showTemperature(); // 현재 온도: 50도
    }
}
```

- `temperature` 필드에 직접 접근하여 50도로 변경 가능
- `increaseTemp()` 메서드의 검증 로직을 우회
- 데이터 무결성이 깨짐

#### private으로 해결

```java
package climate;

public class AirConditioner {
    private int temperature; // private으로 외부 접근 차단
}
```

- `private` 키워드를 사용하면 해당 클래스 내부에서만 접근 가능
- 외부에서 `aircon.temperature = 50` 시도 시 컴파일 오류 발생

```
temperature has private access in climate.AirConditioner
```

#### private 키워드의 효과

- 필드를 private으로 선언하면 클래스 외부에서 직접 접근 차단
- 온도 변경이 필요하면 반드시 `increaseTemp()`, `decreaseTemp()` 메서드 사용
- 메서드 내부의 검증 로직을 우회할 수 없음
- 18~30도 범위를 벗어나는 값 설정 불가
- 데이터 무결성 보장

<br/><br/>

## 접근 제어자의 종류

### 4가지 접근 제어자

- **private**
  - 모든 외부 호출을 막음
  - 같은 클래스 내부에서만 접근 가능
- **default (package-private)**
  - 같은 패키지 안에서만 호출 허용
  - 접근 제어자를 명시하지 않으면 default 적용
- **protected**
  - 같은 패키지 안에서 호출 허용
  - 패키지가 달라도 상속 관계의 호출 허용
- **public**
  - 모든 외부 호출 허용

### 접근 제어자 범위

```
private -> default -> protected -> public
```

- 왼쪽에서 오른쪽으로 갈수록 접근 범위가 넓어짐

### 접근 제어자 사용 위치

```java
public class AirConditioner {
    private int temperature;        // 필드

    public AirConditioner(int temp) {}  // 생성자

    public void increaseTemp() {}   // 메서드
    public void decreaseTemp() {}
    public void showTemperature() {}
}
```

- 필드와 메서드에 모든 접근 제어자 사용 가능
- 클래스 레벨에서는 `public`, `default`만 사용 가능
- `public` 클래스는 반드시 파일명과 이름이 같아야 함

<br/><br/>

## 접근 제어자 비교

### DataContainer 예제

```java
package security.level1;

public class DataContainer {
    public int openValue;      // 어디서나 접근
    int packageValue;          // 같은 패키지만
    private int hiddenValue;   // 클래스 내부만
}
```

### 접근 테스트 결과

| 위치        | public | default | private |
| ----------- | :----: | :-----: | :-----: |
| 같은 클래스 |   O    |    O    |    O    |
| 같은 패키지 |   O    |    O    |    X    |
| 다른 패키지 |   O    |    X    |    X    |

### 같은 패키지에서 접근

```java
package security.level1;

public class SamePackageTest {
    public static void main(String[] args) {
        DataContainer container = new DataContainer();

        container.openValue = 1;      // public 접근 가능
        container.packageValue = 2;   // default 접근 가능
        // container.hiddenValue = 3; // private 컴파일 오류
    }
}
```

- 같은 패키지(`security.level1`)에서는 `public`, `default` 접근 가능
- `private`은 접근 불가

### 다른 패키지에서 접근

```java
package security.level2;

import security.level1.DataContainer;

public class DifferentPackageTest {
    public static void main(String[] args) {
        DataContainer container = new DataContainer();

        container.openValue = 1;       // public 접근 가능
        // container.packageValue = 2; // default 컴파일 오류
        // container.hiddenValue = 3;  // private 컴파일 오류
    }
}
```

- 다른 패키지(`security.level2`)에서는 `public`만 접근 가능
- `default`, `private`은 접근 불가

<br/><br/>

## 캡슐화

### 캡슐화의 개념과 장점

- 데이터와 해당 데이터를 처리하는 메서드를 하나로 묶어서 외부 접근을 제한하는 것
- 객체의 내부 구현을 숨기고 필요한 기능만 외부에 제공

**데이터 보호**

- 외부에서 임의로 데이터를 변경하지 못하도록 막음
- 데이터 무결성 유지

**내부 구현 은닉**

- 내부 구현을 변경해도 외부 코드에 영향을 주지 않음
- 유지보수성 향상

**사용 편의성**

- 복잡한 내부 로직을 숨기고 간단한 인터페이스만 제공
- 사용자는 세부 구현을 몰라도 사용 가능

### Wallet 예제

```java
package payment;

public class Wallet {
    private int amount; // 잔액을 외부에서 직접 수정 불가

    public Wallet() {
        amount = 0;
    }

    // 충전 시 유효성 검증
    public void charge(int value) {
        if (isValidValue(value)) {
            amount += value;
        } else {
            System.out.println("올바르지 않은 금액");
        }
    }

    // 사용 시 유효성 및 잔액 검증
    public void spend(int value) {
        if (isValidValue(value) && amount - value >= 0) {
            amount -= value;
        } else {
            System.out.println("금액 오류 또는 잔액 부족");
        }
    }

    // 잔액 확인
    public int checkAmount() {
        return amount;
    }

    // 내부에서만 사용하는 검증 로직
    private boolean isValidValue(int value) {
        return value > 0;
    }
}
```

**private 멤버**

- `amount` 필드: 외부에서 직접 접근 불가, 메서드를 통해서만 접근
- `isValidValue()` 메서드: 내부에서만 사용하는 검증 로직, 외부 노출 불필요

**public 메서드**

- `charge()`: 충전
- `spend()`: 사용
- `checkAmount()`: 잔액 확인

**캡슐화의 효과**

- `Wallet`은 3개의 public 메서드만 외부에 제공
- 내부 검증 로직(`isValidValue`)은 외부에서 알 필요 없음
- 내부 구현을 변경해도 외부 코드는 영향받지 않음
- 예를 들어 최대 충전 금액 제한을 추가하려면 `charge()` 메서드만 수정하면 됨

<br/><br/>

## 접근 제어자 사용 원칙

### 기본 원칙

- 데이터는 `private`으로 선언
- 기능은 필요한 경우에만 `public`으로 공개
- 내부에서만 사용하는 기능은 `private`으로 선언
- 불필요한 공개는 최소화

### 접근 제어자 선택 가이드

| 멤버          | 권장 접근 제어자 | 이유           | 예시                        |
| ------------- | ---------------- | -------------- | --------------------------- |
| 필드          | private          | 데이터 보호    | `private int amount;`       |
| 생성자        | public           | 객체 생성 허용 | `public Wallet() {}`        |
| 메서드 (공개) | public           | 외부에서 사용  | `public void charge() {}`   |
| 메서드 (내부) | private          | 구현 은닉      | `private boolean isValid()` |

<br/><br/>

## 연습 문제

1. 접근 제어자가 필요한 가장 주된 이유는 무엇일까요?

   a. 데이터를 외부에서 마음대로 변경하는 것을 막기 위해

   - 데이터가 외부에서 무분별하게 수정되는 것을 막아 데이터 무결성을 지키기 위함
   - 내부 로직을 따르도록 강제할 수 있음

2. 자바에서 가장 엄격하게 접근을 제한하는 접근 제어자는 무엇인가요?

   a. private

   - private는 선언된 클래스 내부에서만 접근을 허용해서 가장 엄격함
   - 외부에서는 접근할 수 없음

3. 어떤 필드를 private으로 선언했을 때, 이 필드에 외부 클래스에서 직접 접근하려 하면 어떻게 될까요?

   a. 컴파일 단계에서 오류가 발생하여 실행되지 않는다.

   - private 멤버는 외부에서 직접 접근할 수 없다는 규칙 때문에 컴파일러가 이를 막음
   - 따라서 프로그램이 실행되지 않음

4. 자바에서 클래스 자체에 적용할 수 있는 접근 제어자는 무엇인가요?

   a. public과 default

   - 클래스에는 public과 default 접근 제어자만 사용 가능
   - private나 protected는 클래스 레벨에 사용할 수 없음

5. 객체 지향 프로그래밍에서 '캡슐화'의 가장 중요한 목표는 무엇인가요?

   a. 데이터를 숨기고 필요한 기능만 외부에 노출하는 것

   - 캡슐화는 데이터를 외부에서 직접 접근하지 못하게 숨기고, 데이터를 다루는 기능만 공개하는 것이 핵심
   - 데이터 보호가 주 목적ㄴ

<br/><br/>

## 요약 정리

### 접근 제어자 범위

- `private` < `default` < `protected` < `public`

### 캡슐화 3원칙

- 데이터는 `private`으로 보호
- 필요한 기능만 `public`으로 제공
- 내부 구현은 숨김

### 기본 설계 규칙

| 대상        | 권장 방식           |
| ----------- | ------------------- |
| 필드        | private             |
| 생성자      | public              |
| 공개 메서드 | public              |
| 내부 메서드 | private             |
| 클래스      | public 또는 default |

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
