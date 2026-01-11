---
title: "[김영한의 실전 자바 기본편] 기본형과 참조형"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-24 22:20:00 +0900
category:
  - [Language, java]
tags: [java, primitive-type, reference-type, memory, garbage-collection]
math: false
mermaid: true
---

# 기본형과 참조형

- 김영한님의 실전 자바 강의 중 기본형과 참조형 챕터를 학습하며 자바의 **기본형**과 **참조형**의 차이, **메모리 관리 방식(Stack, Heap)**, 그리고 변수 대입 시 **값 복사와 참조값 복사**의 차이를 정리함

<br/><br/>

## 기본형과 참조형의 차이

### 기본형 (Primitive Type)

- 사용하는 **값을 변수에 직접 저장**하는 데이터 타입
- 종류
  - 정수형
    - `byte`, `short`, `int`, `long`
  - 실수형
    - `float`, `double`
  - 문자형
    - `char`
  - 논리형
    - `boolean`
- 특징
  - 소문자로 시작함
  - 자바 언어 차원에서 제공하며 개발자가 새로 정의할 수 없음
  - 사칙 연산(`+`, `-` 등)이 가능함
  - `null` 값을 가질 수 없음 (반드시 초기화 필요)

### 참조형 (Reference Type)

- 실제 값이 아닌 **객체의 위치**(참조값, 주소)를 저장하는 데이터 타입
- 종류
  - 배열(`[]`), 클래스(`Class`), 인터페이스(`Interface`) 등
  - 기본형 8가지를 제외한 모든 것
- 특징
  - 대문자로 시작함 (클래스명)
  - 개발자가 `class` 키워드로 직접 정의할 수 있음
  - 참조값 자체로는 연산이 불가능함
    - 객체 내부의 기본형 변수에 접근해서 계산해야 함
  - `null` 값을 가질 수 있음 (참조하는 대상이 없음)

<br/><br/>

## 변수 대입의 대원칙

- **"자바는 항상 변수의 값을 복사해서 대입한다"**
- 이 원칙은 기본형과 참조형 모두에게 동일하게 적용됨
  - 기본형
    - 변수에 들어있는 **실제 값**을 복사
  - 참조형
    - 변수에 들어있는 **참조값**(주소)을 복사

### 기본형의 대입 (값 복사)

- 원본 변수의 값이 변경되어도 복사본에는 전혀 영향을 주지 않음 (독립적)
- 예시 코드

  ```java
  int hp1 = 100;
  int hp2 = hp1; // hp1의 값 100이 복사되어 hp2에 대입됨

  hp1 = 50;      // hp1의 값만 50으로 변경됨

  System.out.println("hp1 = " + hp1); // 50
  System.out.println("hp2 = " + hp2); // 100 (영향 없음)
  ```

### 참조형의 대입 (참조값 복사)

- 실제 객체(인스턴스)가 복사되는 것이 아니라, 객체를 가리키는 **주소**만 복사됨
- 결과적으로 두 변수가 **하나의 인스턴스를 공유**하게 됨
- 메모리 구조

  ![Stack과 Heap 영역에서 참조값 복사](/assets/img/java-basic/reference-types/reference-copy.png)

- 예시 코드

  ```java
  // Adventurer 클래스 정의
  public class Adventurer {
      int level;
  }

  Adventurer player1 = new Adventurer(); // 참조값 x001 생성
  player1.level = 1;

  Adventurer player2 = player1;          // player1의 참조값(x001)이 player2에 복사됨

  // player1을 통해 레벨업을 했지만
  player1.level = 5;

  // player2도 같은 곳(x001)을 바라보므로 값이 바뀐 것으로 보임
  System.out.println("player1 level = " + player1.level); // 5
  System.out.println("player2 level = " + player2.level); // 5 (함께 변경됨)
  ```

<br/><br/>

## 메서드 호출과 파라미터 전달

- 메서드 호출 시에도 "**값 복사**"의 대원칙은 동일함
- 매개변수(Parameter)로 무엇이 전달되느냐에 따라 **사이드 이펙트** 발생 여부가 결정됨

### 기본형 전달 (Side Effect 없음)

- 메서드로 기본형 데이터를 전달하면 **값만 복사**되어 넘어감
- 메서드 내부에서 파라미터 값을 아무리 변경해도 호출자의 원본 변수에는 영향이 없음
- 예시 코드

  ```java
  public static void main(String[] args) {
      int exp = 100;
      resetExp(exp);
      System.out.println("main exp = " + exp); // 여전히 100 (변경되지 않음)
  }

  static void resetExp(int x) {
      x = 0; // 매개변수 x의 값만 0으로 바뀜
  }
  ```

### 참조형 전달 (Side Effect 있음)

- 메서드로 참조형 데이터를 전달하면 **주소(참조값)가 복사**되어 넘어감
- 메서드 내부에서 참조값을 통해 객체에 접근하여 필드를 수정하면, **원본 객체 자체가 수정**됨
- 메서드 호출 흐름

  ![메서드 호출 시 참조값 전달 과정](/assets/img/java-basic/reference-types/method-call-flow.png)

- 예시 코드

  ```java
  public static void main(String[] args) {
      Adventurer player = new Adventurer();
      player.level = 10;

      levelUp(player);
      System.out.println("main player level = " + player.level); // 11 (변경됨!)
  }

  static void levelUp(Adventurer a) {
      // 넘어온 참조값(주소)을 통해 실제 객체에 접근하여 값을 변경
      a.level++;
  }
  ```

<br/><br/>

## 변수의 초기화

### 멤버 변수 (필드)

- 클래스 내부에 선언된 변수
- 인스턴스(`new`) 생성 시 자동으로 초기화됨
- 자동 초기화 규칙
  - 숫자형
    - `int`, `long`, `double` 등은 `0` 또는 `0.0`
  - 논리형
    - `boolean`은 `false`
  - 참조형
    - `String`, 객체, 배열은 `null`

### 지역 변수

- 메서드 내부에 선언된 변수 (매개변수 포함)
- **자동으로 초기화되지 않음**
- 초기화하지 않고 사용하려 하면 컴파일 에러 발생 (`Variable 'x' might not have been initialized`)

<br/><br/>

## null과 Garbage Collection

### null의 의미

- 참조형 변수에서 "**가리키는 객체가 없다**"는 것을 나타내는 값
- 아직 연결할 객체가 정해지지 않았거나, 기존 객체와의 연결을 끊을 때 사용

### Garbage Collection (GC)

- 아무도 참조하지 않는 인스턴스의 처리 방식
- 참조형 변수에 `null`을 할당하거나 변수의 스코프가 끝나서 참조가 끊기면, 해당 인스턴스에 접근할 방법이 사라짐
- 자바의 **JVM**(**GC**)은 이러한 "버려진 객체"를 자동으로 감지하여 메모리에서 제거함
- 개발자가 C/C++처럼 직접 메모리를 해제(`free`)할 필요가 없음
- GC 동작 과정

  ![가비지 컬렉션 동작 흐름](/assets/img/java-basic/reference-types/gc-process.png)

<br/><br/>

## NullPointerException

- `null` 값을 가진 참조 변수에 접근(`.` dot)하려고 할 때 발생함
- 즉, **"주소가 없는 곳을 찾아가려고 할 때"** 발생하는 문제

### 단순 발생 예시

- 아직 객체가 생성되지 않은 상태에서 접근할 때 발생
- 예시 코드

  ```java
  Adventurer player = null; // 아직 캐릭터가 생성되지 않음
  player.level = 1;         // 예외 발생 (null.level 접근 불가)
  ```

### 멤버 변수에서의 발생

- 클래스 내부의 참조형 멤버 변수가 초기화되지 않아 `null` 상태일 때 자주 발생함
- 예시 코드

  ```java
  public class Guild {
      Adventurer master; // 참조형이므로 자동 초기화값은 null
      int guildLevel;
  }

  public static void main(String[] args) {
      Guild myGuild = new Guild();

      // myGuild 자체는 생성되었지만, 내부의 master는 아직 null임
      System.out.println(myGuild.guildLevel); // 0 (정상)

      // NullPointerException 발생
      // myGuild.master가 null인데 그 안의 level에 접근하려 함
      System.out.println(myGuild.master.level);
  }
  ```

### 해결 방법

- 참조형 변수를 사용하기(`.`을 찍기) 전에 반드시 유효한 객체를 참조하고 있는지 확인해야 함
- 필요한 시점에 객체를 생성(`new`)하여 할당해야 함
- 해결 예시 코드

  ```java
  Guild myGuild = new Guild();
  myGuild.master = new Adventurer(); // 객체 생성 후 연결
  System.out.println(myGuild.master.level); // 정상 동작
  ```

<br/><br/>

## 요약 정리

### 변수 대입의 대원칙

- 자바의 값 복사 원칙
  - 자바에서 변수의 대입은 항상 값을 복사해서 전달함
  - 기본형은 실제 값을 복사함
  - 참조형은 객체의 위치를 가리키는 참조 값(주소)을 복사함

### 메서드 호출과 Side Effect

- 기본형 파라미터
  - 값만 복사되므로 원본에 영향이 없음
- 참조형 파라미터
  - 참조값이 복사되므로 원본 객체를 변경할 수 있음(Side Effect)

### Null과 메모리 관리

- NullPointerException
  - 참조할 대상이 없음을 의미하며, 이 상태에서 접근하면 `NullPointerException`이 발생함
- Garbage Collection
  - 참조가 끊긴 객체는 가비지 컬렉터가 자동으로 메모리에서 정리해줌

<br/><br/>

## 연습 문제

1. Java에서 기본형과 참조형 변수가 값을 저장하는 방식의 가장 큰 차이점은 무엇일까요?

   a. 기본형은 값 직접 저장, 참조형은 주소 저장

   - 기본형 변수는 실제 사용 값을 바로 저장하지만, 참조형 변수는 객체가 있는 메모리 주소를 저장해서 그 주소로 접근함

2. Java에서 변수 대입(예: `a = b;`) 시, 실제로 복사되는 데이터는 무엇일까요?

   a. 기본형은 값 자체가, 참조형은 메모리 주소가 복사된다

   - 자바의 모든 대입은 변수 안에 저장된 '값' 자체를 복사함
   - 기본형은 실제 값이, 참조형은 객체의 주소 값이 복사되는 거임

3. 메서드에 변수를 전달할 때, 기본형과 참조형 변수의 동작 차이는 무엇일까요?

   a. 기본형 변경은 외부 영향X, 참조형 변경은 외부 영향O

   - 기본형은 값만 복사되어 원본과 분리되지만, 참조형은 주소가 복사되어 같은 객체를 가리키므로 객체 내용 변경 시 원본에 영향 줌

4. `null`이 의미하는 것은 무엇이며, 주로 어떤 타입의 변수에 사용할까요?

   a. 참조할 대상이 없음, 참조형 변수

   - `null`은 참조형 변수가 현재 어떤 유효한 객체도 가리키고 있지 않다는 특별한 상태를 나타냄
   - 기본형 변수에는 `null`을 대입할 수 없음

5. Java에서 `NullPointerException`은 주로 언제 발생할까요?

   a. null 값을 가진 참조 변수로 멤버 접근 시

   - 참조 변수가 null인 상태에서 점(.) 이음을 해당 객체의 필드나 메서드에 접근하려고 시도할 때 이 예외가 발생함
   - 대상이 없는데 접근하려 한 거라 에러가 남

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
