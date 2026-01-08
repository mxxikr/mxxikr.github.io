---
title: "독하게 시작하는 Java Part 2 - 클래스2"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-04 12:00:00 +0900
category:
  - [Language, Java]
tags: [java, class, constructor, static, copy, deep copy, shallow copy]
math: true
---

# 클래스

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 생성자 다중 정의와 `this()` 활용법, 객체 복사 방식(얕은 복사, 깊은 복사)의 차이와 복사 생성자 구현 방법, 정적 멤버의 특성과 메모리 구조, 인스턴스 생성 통제 기법을 학습하며 클래스의 개념을 정리함

<br/><br/>

## 생성자 다중 정의

### 개념

- 일반 메서드와 마찬가지로 매개변수 구성을 다르게 하여 생성자를 여러 개 정의할 수 있음
- 여러 개가 정의되어 있어도 `new` 연산 시 실제로 호출되는 생성자는 단 하나임
- 생성자 내부에서 `this()` 구문을 사용하면 다른 생성자를 호출할 수 있음
- **중요**

  - `this()` 호출은 반드시 생성자의 첫 번째 문장이어야 하며, 그 전에 다른 코드가 오면 컴파일 에러가 발생함

- **사용 예제**

  - 기본 생성자와 이름, 나이를 받는 생성자를 동시에 정의하여 초기화 방식을 다양화함

    ```java
    class Account {
        private String accountName;  // 계정 이름
        private int level;  // 계정 레벨

        // 기본 생성자
        Account() {
            System.out.println("Account() 호출됨");
        }

        // 매개변수가 있는 생성자
        Account(String accountName, int level) {
            this();  // 기본 생성자를 먼저 호출함
            System.out.println("Account(String, int) 호출됨");
            this.accountName = accountName;
            this.level = level;
        }
    }
    ```

  - 문자열이나 정수를 인자로 받는 생성자를 추가하여 편의성을 높임

    ```java
    class TextData {
        private String content;  // 텍스트 내용 저장

        // 문자열을 받는 생성자
        TextData(String text) {
            this.content = text;
        }

        // 정수를 문자열로 변환하는 생성자
        TextData(int value) {
            this.content = String.valueOf(value);
        }
    }
    ```

<br/><br/>

## 객체의 복사 방식

### 얕은 복사(Shallow Copy)

- **개념**

  - 실제 인스턴스는 새로 생성하지 않고 참조값(주소)만 복사하여 늘리는 방식임
  - 여러 참조자가 하나의 대상 인스턴스를 가리키게 되어 의도치 않은 데이터 변경(사이드 이펙트)이 발생할 수 있음

- **구현 예제**

  ```java
  public class Person {
      private String personName;  // 사람 이름
      private Location location;  // 위치 정보

      // 얖은 복사 - 참조값만 복사함
      public void shallowCopy(Person  rhs) {
          this.personName =  rhs.personName;
          this.location =  rhs.location;  // 주소만 복사됨
      }
  }
  ```

- **문제점**
  - 복사된 객체에서 `address`를 수정하면 원본 객체의 `address`도 함께 변경됨
  - 하나의 `Address` 인스턴스를 두 개의 `User` 객체가 공유하게 됨

### 깊은 복사(Deep Copy)

- **개념**

  - 원본 인스턴스의 내용을 바탕으로 새로운 메모리 공간을 할당하여 사본을 만드는 방식임
  - 원본과 사본이 별도의 참조와 인스턴스를 가지므로 사이드 이펙트 오류 가능성이 없음
  - 참조형 멤버를 가진 클래스에서 인스턴스를 동적 할당하여 직접 구현해야 함

- **구현 예제**

  ```java
  public class Person {
      private String personName;  // 사람 이름
      private Location location;  // 위치 정보

      // 깊은 복사 - 하위 객체도 새롭게 생성하여 복사함
      public void deepCopy(Person rhs) {
          this.personName = rhs.personName;
          // 참조 객체도 새로운 인스턴스로 생성해야 완전한 깊은 복사가 됨
          if (rhs.location != null) {
              this.location = new Location(
                  rhs.location.getAddress(),
                  rhs.location.getPhoneNumber()
              );
          }
      }
  }
  ```

- **장점**
  - 원본과 사본이 완전히 독립적임
  - 한쪽의 수정이 다른 쪽에 영향을 주지 않음

<br/><br/>

## 복사 생성자

### 특징

- `클래스이름(클래스이름 rhs)` 형식으로 정의하며 객체의 사본을 생성할 때 사용함
- Java에서 제공하는 `clone()` 메서드는 다음과 같은 단점이 있어 복사 생성자 사용이 권장됨

  - 규약이 모호하고 예외 처리(`CloneNotSupportedException`)가 불편함
  - 기본적으로 얖은 복사를 수행하므로 깊은 복사를 위해 재정의가 필요함
  - `final` 필드를 초기화할 수 없음 (복사 생성자는 가능)

- **구현 예제**

  ```java
  class DataArray {
      private int[] numbers = null;  // 배열 저장 필드

      // 기본 생성자 - 크기를 받아 배열 생성
      public DataArray(int size) {
          numbers = new int[size];
      }

      // 복사 생성자
      public DataArray(DataArray rhs) {
          this(rhs.numbers.length);  // 다른 생성자 호출
          this.copyData(rhs);  // 데이터 복사 메서드 호출
      }

      // 깊은 복사 메서드
      public void copyData(DataArray rhs) {
          for(int i = 0; i < rhs.numbers.length; ++i)
              numbers[i] = rhs.numbers[i];
      }
  }
  ```

- **사용 예제**

  ```java
  DataArray original = new DataArray(5);  // 원본 생성
  DataArray copied = new DataArray(original);  // 복사 생성자로 복제본 생성
  ```

<br/><br/>

## 보이지 않는 임시 객체

### 개념

- 클래스 형식이 함수의 반환 자료형이 되거나 `String` 클래스의 덧셈 연산을 수행할 때 이름 없는 임시 객체가 생성됨
- 이러한 임시 객체는 프로그램 성능 저하 및 비효율의 직접적인 원인이 될 수 있음

- **발생 예제**

  ```java
  public String concatenate(String a, String b) {
      return a + b; // 임시 String 객체 생성
  }

  public MyClass createObject() {
      return new MyClass(); // 임시 객체 생성 후 반환
  }
  ```

- **주의사항**
  - 반복문 내에서 임시 객체가 빈번하게 생성되면 성능이 크게 저하됨
  - 가능하면 `StringBuilder` 등을 사용하여 임시 객체 생성을 최소화해야 함
  - 단순 `a + b` 연산은 Java 9+ 에서 `StringConcatFactory`로 최적화됨

<br/><br/>

## 정적(static) 멤버

### 기본 특성

- 클래스 인스턴스가 없어도 독립적으로 존재하며 모든 인스턴스가 해당 데이터를 공유함
- 정적 메서드 내부에서는 `this` 참조자를 사용할 수 없음
- 주로 `final`과 결합하여 심볼릭 상수를 정의하는 용도로 활용됨

### 정적(static) 필드를 이용한 데이터 공유

```java
class MyScore {
    private static int limit = 80;

    public void setLimit(int limit) {
        MyScore.limit = limit; // 정적 필드 수정
    }

    public int getLimit() {
        return limit;
    }
}
```

- **특징**
  - 모든 `MyScore` 인스턴스가 하나의 `limit` 값을 공유함
  - 어느 한 인스턴스에서 `limit`을 변경하면 다른 모든 인스턴스에도 반영됨

### 메모리 구조 및 접근 제약

- **메모리 구조**

  - 정적 필드는 논리적으로 메서드 영역(Method Area)에 속하지만, Java 8+ HotSpot JVM에서는 실제로 **Heap 영역의 Class 객체**에 저장됨
  - 클래스 메타데이터는 Metaspace(Native Memory)에, 정적 필드 데이터는 GC 관리 대상인 Heap에 위치함
  - 프로그램 시작 시 할당되고 프로그램 종료 시까지 유지됨

- **접근 제약**
  - 정적 메서드 내에서 인스턴스 멤버(non-static variable)에 직접 접근하려고 하면 컴파일 에러가 발생함
  - 접근이 필요한 경우 해당 객체의 참조를 매개변수로 명시적으로 받아야 함

```java
class MyTest {
    private int data;

    // 정적 메서드에서 인스턴스 필드에 접근하는 올바른 방법
    public static void printData(MyTest obj) {
        System.out.println(obj.data);
    }
}
```

### 인스턴스 생성 통제

- 생성자를 `private`으로 제한하여 사용자가 `new` 연산자로 인스턴스를 직접 생성하지 못하게 막음
- 대신 정적 메서드인 `newString()`을 통해서만 인스턴스를 생성하게 하고 정적 필드 `count`를 통해 생성된 개수를 관리함

  ```java
  class StringWrapper {
      private static int instanceCount; // 생성된 객체 개수

      // private 생성자 - 외부에서 직접 생성 불가
      private StringWrapper(String text) {
          instanceCount++;
      }

      // 정적 팩토리 메서드
      public static StringWrapper create(String text) {
          return new StringWrapper(text);
      }

      public static int getInstanceCount() {
          return instanceCount;
      }
  }
  ```

- **사용 예제**

  ```java
  // StringWrapper str = new StringWrapper("text"); // 컴파일 에러
  StringWrapper str1 = StringWrapper.create("Hello");  // 팩토리 메서드 사용
  StringWrapper str2 = StringWrapper.create("World");
  System.out.println(StringWrapper.getInstanceCount()); // 2
  ```

- **장점**
  - 인스턴스 생성을 통제하여 개수를 제한하거나 추적할 수 있음
  - 싱글톤 패턴 등의 디자인 패턴 구현에 활용됨

<br/><br/>

## 연습 문제

1. 클래스 생성자의 주된 역할은 무엇일까요?

   a. 객체의 상태를 초기화합니다.

   - 생성자의 핵심 역할은 객체가 생성될 때 필드를 초기화하는 것임
   - `new` 연산자로 객체를 만들 때 자동으로 호출됨

2. 다른 객체의 참조를 포함한 객체를 '얕은 복사' 할 때, 무엇이 복사됩니까?

   a. 포함된 객체의 참조 값

   - 얕은 복사는 객체 내부의 다른 객체에 대한 '참조'(주소)만 복사함
   - 따라서 원본과 복사본이 같은 객체를 공유하게 됨
   - 깊은 복사와는 달리 새로운 객체를 만들지 않음

3. Java의 static 멤버에 대한 설명 중 옳은 것은 무엇일까요?

   a. 클래스의 모든 인스턴스가 하나의 복사본을 공유합니다.

   - static 멤버는 클래스 자체에 속하며, 해당 클래스의 어떤 인스턴스를 통해서든 접근할 수 있지만 실제로는 모든 인스턴스가 하나의 static 멤버를 공유함
   - `this`는 인스턴스를 가리키므로 사용할 수 없음

4. Java에서 눈에 보이지 않는 임시 객체가 가장 흔하게 암묵적으로 생성되는 경우는 언제일까요?

   a. 메서드가 새 객체를 반환하거나 연산 결과로 객체가 생성될 때

   - 연산의 중간 결과나 메서드 반환 값으로 생성된 객체가 변수에 할당되지 않으면 임시 객체가 됨
   - 이 객체는 해당 문장이 끝날 때까지 존재하다 사라짐
   - `new`는 명시적 생성임

5. 어떤 클래스의 생성자가 모두 private으로 선언되어 있다면, 외부 코드에서 해당 클래스의 인스턴스를 얻는 일반적인 방법은 무엇일까요?

   a. public static 팩토리 메서드를 호출합니다.

   - 생성자가 private이면 `new`로 직접 만들 수 없기에, 클래스 내부에 인스턴스를 만들어 반환하는 public static 메서드를 통해 객체 생성을 제어함
   - 이를 팩토리 메서드 패턴이라 함

<br/><br/>

## 정리

- 생성자 다중 정의를 통해 다양한 초기화 방식을 제공할 수 있음
- 얕은 복사는 참조만 복사하여 사이드 이펙트가 발생할 수 있고, 깊은 복사는 완전히 독립적인 사본을 생성함
- 복사 생성자는 `clone()` 메서드보다 명확하고 안전한 객체 복사 방법임
- 임시 객체는 성능 저하의 원인이 될 수 있으므로 주의해야 함
- 정적 멤버는 인스턴스 없이 존재하며 모든 인스턴스가 공유함
- 정적 메서드 내에서는 인스턴스 멤버에 직접 접근할 수 없으며 매개변수로 전달받아야 함
- 정적 팩토리 메서드를 사용하여 인스턴스 생성을 통제할 수 있음

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2 강의](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
