---
title: "김영한의 실전 자바 - final"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-31 15:00:00 +0900
category:
  - [Language, java]
tags: [java, final, constant, immutability, static-final]
math: false
---

# final

- 김영한님의 실전 자바 강의 중 final 챕터를 학습하며 final 키워드의 개념, 지역 변수와 필드에서의 사용법, 그리고 상수(Constant) 정의 방법을 정리함

<br/><br/>

## final 키워드란?

### 기본 개념

- `final` 키워드는 **변경 불가능**을 의미함

- `final`이 붙은 변수는 최초 한 번만 값을 할당할 수 있음
- 이후 값을 변경하려고 하면 컴파일 오류가 발생함

  ```java
  final int value = 10;
  // value = 20;  // 컴파일 오류 발생
  ```

- 적용 범위

  - **지역 변수/매개변수**
    - 값 재할당 방지
  - **인스턴스 필드**
    - 객체별 불변 값 생성
  - **클래스(static) 필드**
    - 전역 상수 선언
  - **메서드**
    - 오버라이딩 방지
  - **클래스**
    - 상속 방지

<br/><br/>

## final 지역 변수

### 지역 변수에 final 적용

```java
package final1;

public class FinalLocalMain {
    public static void main(String[] args) {
        // final 지역 변수 - 선언과 초기화 분리
        final int data1;
        data1 = 10; // 최초 한 번만 할당 가능
        // data1 = 20; // 컴파일 오류 발생

        // final 지역 변수 - 선언과 동시에 초기화
        final int data2 = 10;
        // data2 = 20; // 컴파일 오류 발생

        method(10);
    }

    // final 매개변수
    static void method(final int parameter) {
        // parameter = 20; // 컴파일 오류 발생
    }
}
```

- 규칙

  - `final` 변수는 최초 한 번만 할당 가능함
  - 선언과 초기화를 분리할 수 있지만, 최초 할당 이후 값 변경 불가함
  - `final` 매개변수는 메서드 내에서 값을 변경할 수 없음

<br/><br/>

## final 필드

### 생성자를 통한 초기화

```java
package final1;

// final 필드 - 생성자 초기화
public class Settings {
    final int threshold;

    public Settings(int threshold) {
        this.threshold = threshold;
    }
}
```

- 생성자에서 `final` 필드를 초기화함
- 각 인스턴스마다 서로 다른 `final` 값을 가질 수 있음

### 필드 선언 시 초기화

```java
package final1;

public class SharedSettings {
    final int limit = 10;              // 인스턴스 필드
    static final int MAX_LIMIT = 10; // 클래스 필드
}
```

- **인스턴스 final 필드 (`final int limit`)**

  - 모든 인스턴스가 동일한 값 `10`을 가짐
  - 각 인스턴스마다 별도의 메모리 공간을 차지함
    - 객체가 100개면 동일한 값 `10`이 100번 저장됨 (메모리 낭비)

- **클래스 final 필드 (`static final int MAX_LIMIT`)**
  - 메서드 영역(static 영역)에 단 1개만 존재함
  - 모든 인스턴스가 이 하나의 값을 공유함
  - 메모리 효율적이며, 전역 상수로 사용하기 적합함

> **메모리 비교**(객체 1000개 생성 시)
>
> - `final int limit = 10`은 4KB 사용 (4byte × 1000)
> - `static final int MAX_LIMIT = 10`은 4byte만 사용

### 초기화 방식 비교

- **비교 표**

  | 초기화 방식   | 메모리 위치          | 특징                     | 사용 시기                      |
  | ------------- | -------------------- | ------------------------ | ------------------------------ |
  | 생성자 초기화 | 힙 (각 인스턴스)     | 객체마다 다른 값 가능    | 객체별로 다른 final 값 필요 시 |
  | 필드 초기화   | 힙 (각 인스턴스)     | 모든 객체가 같은 값 공유 | 비효율적, static 사용 권장     |
  | static final  | 메서드 영역 (단 1개) | 전역 공유                | 상수 정의에 적합               |

- **생성자 초기화 - 객체별 다른 값**

  ```java
  Settings s1 = new Settings(10);
  Settings s2 = new Settings(20);
  System.out.println(s1.threshold); // 10
  System.out.println(s2.threshold); // 20
  ```

  - **사용 사례**

    - 주문 번호, 회원 ID처럼 객체마다 달라야 하는 불변 값

- **필드 초기화 - 모든 객체가 같은 값**

  ```java
  SharedSettings s1 = new SharedSettings();
  SharedSettings s2 = new SharedSettings();
  System.out.println(s1.limit); // 10
  System.out.println(s2.limit); // 10 (같은 값인데 메모리는 따로)
  ```

  - **문제점**
    - 모든 객체가 같은 값인데 각 객체마다 메모리를 차지함
  - **해결책**

    - `static final`을 사용함

- **static final - 상수**

  ```java
  System.out.println(SharedSettings.MAX_LIMIT); // 10 (객체 생성 없이 접근)
  ```

- **메모리 구조 비교**

  ![Memory Comparison](/assets/img/java-basic/final/memory-comparison.png)

  - **Settings**
    - 인스턴스별로 다른 `final` 값을 가질 수 있어 의미가 있음
  - **SharedSettings**
    - 모든 인스턴스가 같은 값(10)을 가지면서 메모리를 중복해서 사용함
  - **static final**
    - 메서드 영역에 하나만 존재하므로 가장 효율적임

<br/><br/>

## final 변수와 참조

### 참조형 변수에 final 적용

```java
package final1;

public class Data {
    public int value;
}
```

```java
package final1;

public class FinalRefMain {
    public static void main(String[] args) {
        final Data data = new Data();
        // data = new Data(); // final 변수이므로 참조 대상 변경 불가

        // 참조 대상의 값은 변경 가능
        data.value = 10;
        System.out.println(data.value); // 10
        data.value = 20;
        System.out.println(data.value); // 20
    }
}
```

### 메모리 구조와 final 참조

![Final Reference Memory](/assets/img/java-basic/final/final-reference-memory.png)

- **가능** (`data.value = 20`)
  - 참조하는 대상의 객체 내부 값(`value`)은 변경할 수 있음
  - `final`은 참조 변수 `data`의 값을 고정하는 것이지, 힙 영역에 있는 객체 자체를 불변으로 만드는 것이 아님
- **불가** (`data = new Data()`)
  - 참조값(주소) 자체를 변경할 수 없음
  - 한 번 가리킨 객체(x001)를 끝까지 가리켜야 함

<br/><br/>

## 상수 (Constant)

### 상수란?

- 프로그램에서 절대 변하지 않는 공용 값을 의미함
- 자바에서는 `static final` 키워드를 사용하여 정의함

- **상수 관례**
  - 대문자로 작성하고, 단어 사이는 `_` (언더스코어)로 구분함
  - 일반 변수(소문자 시작)와 명확히 구분하기 위함

### static final

- 모든 인스턴스가 같은 값을 공유할 때는 `static final`을 사용하는 것이 가장 효율적임

  ```java
  package final1;

  public class GameConfig {
      // 게임 설정 상수
      public static final int MAX_PLAYERS = 4;

      // 수학 상수
      public static final double PI = 3.14;
  }
  ```

### 상수가 필요한 이유

- **문제점**

  - **가독성 저하**
    - 코드에 있는 숫자가 정확히 어떤 용도인지 파악하기 힘듦
  - **유지보수 어려움**
    - 해당 숫자가 코드 여러 곳에 퍼져 있다면, 값을 변경할 때 모든 곳을 찾아서 수정해야 함
    - 하나라도 빠뜨리면 버그가 발생할 수 있음

- **해결책**
  - 상수를 사용하여 숫자에 의미 있는 이름을 부여하고 한 곳에서 관리해야 함

### 상수로 개선된 코드

```java
package final1;

  public class GameMain {
  public static void main(String[] args) {
  System.out.println("최대 플레이어 수: " + 4);
  int currentPlayerCount = 3;
  joinGame(currentPlayerCount++);
  joinGame(currentPlayerCount++);
  joinGame(currentPlayerCount++);
  }

      private static void joinGame(int currentPlayerCount) {
          System.out.println("참가자 수: " + currentPlayerCount);
          if (currentPlayerCount > 4) {
              System.out.println("대기열로 이동합니다.");
          } else {
              System.out.println("게임에 참가합니다.");
          }
      }
  }
```

```java
package final1;

public class GameMainRefactored {
    public static void main(String[] args) {
        System.out.println("최대 플레이어 수: " + GameConfig.MAX_PLAYERS);
        int currentPlayerCount = 3;
        joinGame(currentPlayerCount++);
        joinGame(currentPlayerCount++);
        joinGame(currentPlayerCount++);
    }

    private static void joinGame(int currentPlayerCount) {
        System.out.println("참가자 수: " + currentPlayerCount);
        if (currentPlayerCount > GameConfig.MAX_PLAYERS) {
            System.out.println("대기열로 이동합니다.");
        } else {
            System.out.println("게임에 참가합니다.");
        }
    }
}
```

- 가독성과 유지보수성이 모두 대폭 향상됨

<br/><br/>

## final 사용 가이드

### 언제 사용하는가

- 값이 변경되면 안 되는 경우
- 중앙에서 값을 관리하고 싶은 경우
- 코드의 가독성과 안정성을 높이고 싶은 경우

### 장점

- 코드 안정성 증가 (실수로 값 변경 방지)
- 의도가 명확해짐 (이 값은 변경되지 않는다는 의미)
- 유지보수성 향상 (상수를 한 곳에서 관리)

### 주의사항

- `final`은 변수 자체의 재할당을 막는 것임
- 참조형의 경우 참조 대상 객체의 내부 값은 변경 가능함
- 완전한 불변 객체를 만들려면 모든 필드를 `final`로 선언하고 setter를 제공하지 않아야 함

<br/><br/>

## 연습 문제

1. final 키워드를 변수에 사용하면 어떤 것이 제한될까요?

   - a. 값의 변경

   - final은 변수에 값이 한 번 할당되면 그 값을 다시 변경할 수 없도록 제한하는 키워드임

2. 참조 변수에 final 키워드를 붙이면 무엇이 고정될까요?

   - a. 참조 변수가 가리키는 주소값

   - 참조 변수에 final을 쓰면 변수가 가리키는 주소, 즉 다른 객체를 참조하도록 바꿀 수 없게 됨
   - 객체 자체의 속성 값은 변경 가능함

3. Java에서 static final로 선언된 변수를 무엇이라고 부를까요?

   - a. 상수

   - static은 공유, final은 변경 불가 속성이임
   - 이 둘을 함께 써서 프로그램 내내 바뀌지 않고 공유되는 '상수'를 정의함

4. MAX_USERS처럼 프로그램 전반에 걸쳐 사용되는 고정된 값에 static final을 사용하는 주된 이유는 무엇일까요?

   - a. 값의 중앙 집중식 관리와 가독성 향상

   - static final 상수는 값을 한 곳에서 관리하여 코드 이해를 돕고, 필요시 값 변경을 중앙에서 쉽게 할 수 있게 해줌

5. 변수에 final 키워드를 사용했을 때 얻을 수 있는 중요한 이점은 무엇일까요?

   - a. 개발자의 실수를 통한 값 변경 방지

   - final은 해당 변수의 값이 절대 바뀌지 않음을 보장하여, 개발자가 의도치 않게 값을 변경하는 실수를 컴파일 단계에서 미리 막아주는 이점이 있음

<br/><br/>

## 요약 정리

### final 사용 목적별 분류

| 분류               | 키워드 적용 위치 | 설명                                                         |
| ------------------ | ---------------- | ------------------------------------------------------------ |
| **재할당 방지**    | 기본형 변수      | 값을 한 번만 할당 가능, 이후 변경 불가                       |
| **참조 고정**      | 참조형 변수      | 참조하는 객체(주소)를 변경 불가, 객체 내부 상태는 변경 가능  |
| **불변 필드**      | 인스턴스 필드    | 생성자 초기화 이후 값 변경 불가 (개별 객체마다 다른 값 가능) |
| **상수**           | static 필드      | `static final`, 전역적으로 공유되는 불변의 값                |
| **확장/변경 금지** | 메서드/클래스    | 오버라이딩 불가(메서드), 상속 불가(클래스)                   |

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
