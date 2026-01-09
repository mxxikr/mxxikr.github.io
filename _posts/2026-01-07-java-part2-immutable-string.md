---
title: "독하게 시작하는 Java Part 2 - 불변 객체와 String 클래스"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-07 00:00:00 +0900
category:
  - [Language, Java]
tags: [java, immutable, string, stringbuilder, wrapper, boxing, unboxing, constant-pool, string-buffer]
math: false
---

# 불변 객체와 String 클래스

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 불변 객체의 필요성과 정의, 자바의 대표적인 불변 객체인 `String`의 내부 구조와 메모리 최적화 기법(Constant Pool), 가변 문자열 처리를 위한 `StringBuilder`, 그리고 기본 데이터 타입을 객체로 다루기 위한 `Wrapper` 클래스와 오토 박싱/언박싱 개념을 정리함

<br/><br/>

## 불변 객체와 데이터 무결성

- **사이드 이펙트와 데이터 보호**

  - 자바에서는 특정 인스턴스에 대한 다중 참조를 문법적으로 막을 수 없음
  - 참조 변수를 통해 필드 값을 변경하면, 동일한 객체를 참조하는 다른 로직에서 의도치 않게 변경된 값을 사용하게 되는 사이드 이펙트(Side Effect)가 발생할 수 있음
  - 데이터 무결성이 중요한 시스템에서는 이러한 의도치 않은 상태 변경을 방지하기 위해 불변 객체(Immutable Object) 설계가 필수적임

- **불변 객체(Immutable Object)란?**

  - **정의**
    - 생성 시점 이후에는 **상태(필드 값)를 변경할 수 없는 객체**를 의미함
  - **구현 방법**
    - 모든 필드를 `private final`로 선언하여 수정을 원천 차단함
    - Setter 메서드를 제공하지 않음
    - 상태 변경이 필요한 경우, 값을 수정하는 대신 **변경된 값을 가진 새로운 객체**를 생성하여 반환함
  - **장점**
    - 멀티스레드 환경에서 동기화 없이도 안전하게 공유 가능함 (Thread-safe)
    - 사이드 이펙트가 없어 코드의 예측 가능성이 높아짐

  ![String Immutability Diagram](/assets/img/java-part2/string-wrapper/string_immutability.png)

### 불변 객체 구현 예제

```java
class Score {
    // 모든 필드를 final로 선언하여 무결성 확보
    private final int value;

    public Score(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    // 상태를 변경하는 대신 새로운 사본 인스턴스를 생성하여 반환함
    public Score addBonus(int bonus) {
        return new Score(this.value + bonus);
    }
}
```

<br/><br/>

## String 클래스의 구조와 효율성

- **String의 내부 구조**

  - `String`은 자바의 대표적인 불변 클래스임
  - 한 번 생성된 `String` 인스턴스의 문자열 내용은 절대 변경되지 않음
  - **Java 8 이전**
    - `char[]` 배열로 문자열을 저장함
    - 모든 문자를 UTF-16으로 인코딩하여 2바이트씩 사용함
    - 영어 문자도 2바이트를 사용하여 메모리 낭비가 발생함
  - **Java 9 이후 (Compact Strings)**

    - `byte[]` 배열 + encoding flag로 전환됨
    - Latin-1 문자만 있으면 1바이트로 저장하고, 그 외는 2바이트(UTF-16) 사용함
    - 메모리 사용량이 평균 50% 감소함
    - 내부 필드 구조

      ```java
      public final class String {
          private final byte[] value;  // 문자 데이터
          private final byte coder;    // LATIN1(0) or UTF16(1)
          private int hash;            // 해시코드 캐시
      }
      ```

  - **Compact Strings의 장점**
    - 메모리 절약
      - ASCII 문자열은 크기가 절반으로 줄어듦
    - GC 압력 감소
      - 힙 사용량 감소로 Garbage Collection 빈도가 낮아짐
    - 캐시 효율성
      - 데이터가 작아져 CPU 캐시 활용도가 증가함

- **문자열 연산의 성능 문제**

  - 불변성으로 인해 `+` 연산자를 사용하여 문자열을 연결할 때마다 **새로운 임시 객체**가 생성됨
  - 반복문 내부에서 문자열 덧셈을 수행하면 수많은 임시 String 객체가 생성되어 GC(Garbage Collection)를 유발하여 성능이 급격히 저하됨

- **StringBuilder를 이용한 최적화**

  - `String`의 성능 문제를 해결하기 위해 제공되는 **가변(Mutable)** 문자열 클래스임
  - 내부 버퍼(Buffer)를 가지고 있어 데이터를 직접 수정하므로 새로운 객체를 생성하지 않음
  - `append()` 등의 메서드를 사용하여 효율적인 문자열 조작이 가능함

- **StringBuilder와 StringBuffer 비교**

  | 특징              | StringBuilder               | StringBuffer       |
  | ----------------- | --------------------------- | ------------------ |
  | **Thread Safety** | 불안전 (Unsafe)             | 안전 (Safe)        |
  | **동기화**        | 없음                        | synchronized 사용  |
  | **성능**          | 빠름                        | 상대적으로 느림    |
  | **도입 버전**     | Java 5                      | Java 1.0           |
  | **권장 용도**     | 단일 스레드 (대부분의 경우) | 멀티스레드 공유 시 |

- **선택 가이드**

  ```java
  // 대부분의 경우 StringBuilder 사용
  public String buildMessage() {
      StringBuilder sb = new StringBuilder();
      sb.append("Hello");
      sb.append(" World");
      return sb.toString();
  }

  // 여러 스레드가 동일 인스턴스를 공유하는 경우만 StringBuffer
  public class SharedLogger {
      private StringBuffer buffer = new StringBuffer();  // 여러 스레드 접근

      public synchronized void log(String message) {
          buffer.append(message);
      }
  }

  // 대부분의 경우 메서드 지역 변수로 해결하는 것이 더 나음
  public String buildMessage() {
      // 메서드 지역 변수는 스레드 안전
      StringBuilder sb = new StringBuilder();
      sb.append("Hello");
      return sb.toString();
  }
  ```

<br/><br/>

## 문자열 상수 풀과 intern()

- **String Constant Pool**

  - 자바는 메모리 효율성을 위해 소스 코드에 포함된 **문자열 리터럴**을 별도의 `String Constant Pool` 영역에서 관리함
  - 동일한 리터럴이 여러 번 등장해도 풀에 있는 하나의 인스턴스만 재사용됨 (`new` 연산자로 생성 시에는 항상 힙에 새 객체가 생성됨)

  ![String Constant Pool](/assets/img/java-part2/string-wrapper/string_pool.png)

- **String Constant Pool의 위치 변화**

  - **Java 7 이전**
    - PermGen 영역에 위치함
    - 고정 크기로 인한 `OutOfMemoryError` 위험이 있음
    - `-XX:MaxPermSize`로 크기가 제한됨
  - **Java 7 이후**
    - Heap 영역 내의 특수한 영역으로 이동함
    - 동적으로 크기 조정이 가능함
    - 일반 객체와 동일하게 GC 대상이 됨
  - **장점**
    - 더 큰 문자열 풀 사용이 가능함
    - `OutOfMemoryError: PermGen space` 문제가 해결됨
    - Full GC 시 사용되지 않는 문자열을 회수할 수 있음

- **문자열 비교와 intern() 메서드**
  - **문자열 비교**
    - **`==` 연산자**
      - 객체의 **메모리 주소**를 비교함
    - **`equals()` 메서드**
      - 문자열의 **내용**(값)을 비교함
    - 내용 비교 시에는 반드시 `equals()`를 사용해야 함
  - **`intern()` 메서드**
    - 해당 문자열이 상수 풀에 이미 존재하면 그 참조를 반환하고, 없으면 풀에 등록한 후 참조를 반환함
    - 힙에 생성된 문자열 객체를 상수 풀의 객체와 공유하게 하여 메모리를 절약할 수 있음
  - **`intern()` 사용 시 주의사항**
    - **성능 고려사항**
      - 메모리 절약 (중복 문자열 제거)
      - `intern()` 호출 비용 발생
      - 문자열 풀은 해시 테이블이므로 조회 비용이 존재함
    - **사용 가이드**
      - 사용 권장
        - 같은 문자열이 많이 중복되는 경우
        - 메모리가 제한적인 환경
        - 문자열 비교가 빈번한 경우 (`==` 사용 가능)
      - 사용 지양
        - 동적으로 생성되는 고유 문자열
        - 일회성 문자열
        - 이미 리터럴로 정의된 문자열

### intern() 활용

```java
public class Main {
    public static void main(String[] args) {
        String s1 = "Hello";
        String s2 = "Hello";
        // 리터럴이므로 상수 풀의 동일 인스턴스를 가리킴 (true)
        System.out.println(s1 == s2);

        String s3 = new String("World"); // 힙에 새로운 객체 생성
        String s4 = s3.intern();         // 상수 풀에서 "World"를 찾아 참조 반환

        // s3은 힙의 개별 객체, s4는 상수 풀의 객체이므로 주소가 다름 (false)
        System.out.println(s3 == s4);

        // "World" 리터럴은 상수 풀에 있으므로 s4와 주소가 같음 (true)
        System.out.println("World" == s4);

        // intern() 사용 예제
        String unique = UUID.randomUUID().toString().intern();  // 나쁜 예: 고유 값
        String country = inputCountry.intern();  // 좋은 예: 제한된 값 집합
    }
}
```

<br/><br/>

## Wrapper 클래스

- **래퍼 클래스(Wrapper Class)의 역할**

  - 자바의 기본 데이터 타입(`int`, `double` 등)은 객체가 아니므로 메서드를 가질 수 없고 `null`을 담을 수 없음
  - 기본 타입을 객체처럼 다뤄야 하는 경우(컬렉션 제네릭 사용 등)를 위해 제공되는 클래스들을 말함 (`Integer`, `Long`, `Boolean` 등)
  - 데이터 타입 처리에 유용한 상수(`MAX_VALUE` 등)와 메서드(`parseInt` 등)를 제공함

- **박싱(Boxing)과 언박싱(Unboxing)**

  ![Boxing Unboxing](/assets/img/java-part2/string-wrapper/boxing_unboxing.png)

  - **박싱(Boxing)**
    - 기본 타입의 값을 래퍼 클래스의 인스턴스로 변환하는 것
  - **언박싱(Unboxing)**
    - 래퍼 클래스의 인스턴스에서 기본 타입의 값을 꺼내는 것
  - **오토 박싱/언박싱**
    - JDK 1.5부터 컴파일러가 이 과정을 자동으로 처리해 줌

- **오토박싱/언박싱 주의사항**

  - **NPE 위험**

    ```java
    Integer count = null;
    int value = count;  // NullPointerException! (언박싱 시도)
    ```

  - **성능 저하**

    ```java
    // 나쁜 예: 매번 박싱/언박싱 발생
    Long sum = 0L;
    for (long i = 0; i < 1000000; i++) {
        sum += i;  // 매우 느림! (Long -> long -> Long 반복)
    }

    // 좋은 예: 기본형 사용
    long sum = 0L;
    for (long i = 0; i < 1000000; i++) {
        sum += i;  // 빠름
    }
    ```

  - **`==` 비교**

    ```java
    Integer a = 1000;
    Integer b = 1000;
    if (a == b) {  // false (캐시 범위 초과)
        System.out.println("Equal");
    }
    if (a.equals(b)) {  // true (올바른 비교)
        System.out.println("Equal");
    }
    ```

- **사용 가이드**

  - **사용 권장**
    - 컬렉션에 기본형 저장 시 (`List<Integer>`)
    - 제네릭 타입 파라미터
    - `null` 가능성이 필요한 경우
  - **사용 지양**
    - 반복문 내부 (성능 저하)
    - `==` 비교 (예상치 못한 결과)
    - `null` 체크 없는 언박싱 (NPE 위험)
  - **권장 사항**
    - 래퍼 객체 비교는 항상 `equals()` 사용
    - `null` 가능성이 없으면 기본형 사용
    - 성능이 중요한 코드에서는 기본형 우선

- **래퍼 클래스 비교 주의사항**

  - 래퍼 클래스도 객체이므로 `==` 비교 시 주소값을 비교하게 됨
  - **Integer Cache**
    - `Integer`의 경우 -128 ~ 127 범위의 값은 내부 캐시(IntegerCache)를 사용하여 동일한 객체를 반환하므로 `==` 비교가 `true`일 수 있으나, 이 범위를 벗어나면 `false`가 됨
  - 따라서 래퍼 객체끼리의 값 비교는 반드시 `.equals()` 메서드를 사용해야 함

- **IntegerCache 상세 설명**
  - **캐시 범위**
    - -128 ~ 127 (기본값)
  - **이유**
    - 작은 정수는 프로그램에서 자주 사용됨
    - 메모리 절약과 성능 향상을 위해 미리 생성함
    - JVM 시작 시 미리 객체를 생성하여 재사용함
  - **캐시 범위 조정** (선택적)
    - `-XX:AutoBoxCacheMax=1000`
    - 최댓값만 조정 가능 (최솟값은 -128 고정)
  - **다른 래퍼 클래스의 캐시**
    - `Byte`, `Short`, `Long`
      - -128 ~ 127 (고정)
    - `Character`
      - 0 ~ 127 (ASCII)
    - `Boolean`
      - `true`, `false` (항상 캐시)
    - `Float`, `Double`
      - 캐시 없음 (부동소수점 특성상)

### 래퍼 클래스 활용

```java
public class Main {
    public static void main(String[] args) {
        // Integer Cache 동작 방식
        Integer a = 127;
        Integer b = 127;
        System.out.println(a == b);  // true (캐시 사용)

        Integer c = 128;
        Integer d = 128;
        System.out.println(c == d);  // false (캐시 범위 초과, 새 객체)

        // 명시적 생성 시 캐시 무시
        Integer e = new Integer(127);  // Java 9+에서 deprecated
        Integer f = 127;
        System.out.println(e == f);  // false (e는 힙, f는 캐시)

        // valueOf() 사용
        Integer g = Integer.valueOf(127);
        Integer h = 127;
        System.out.println(g == h);  // true (같은 캐시 객체)
    }
}
```

<br/><br/>

## 연습 문제

1. 불변 객체의 핵심 특징은 무엇인가요?

   a. 생성 후 상태를 변경할 수 없습니다

   - 불변 객체는 한번 생성되면 내부 상태가 변하지 않는 객체임
   - 이는 데이터 무결성 보호와 멀티스레드 환경에서 안전성을 제공함

2. 자바에서 String 객체의 내용을 자주 변경할 때 '+' 연산자 사용이 비효율적인 주된 이유는 무엇인가요?

   a. 임시 객체를 많이 생성합니다

   - String은 불변 객체이므로 '+' 연산으로 내용을 바꾸면 매번 새로운 임시 String 객체가 생성되어 메모리 낭비와 성능 저하를 초래함

3. 두 String 객체의 내용이 같은지 비교할 때 올바른 방법은 무엇인가요?

   a. equals() 메서드

   - String 객체는 참조 비교가 아닌 내용 비교 해야 할 때 `equals()` 메서드를 사용함
   - `==`는 두 객체가 메모리 상에서 동일한 인스턴스인지 비교함

4. 문자열의 내용에 대한 빈번한 수정(추가, 삭제 등) 작업이 필요한 경우, String 대신 성능 향상을 위해 주로 사용되는 클래스는 무엇인가요?

   a. StringBuilder

   - StringBuilder는 String과 달리 가변 객체로, 내용을 직접 수정할 수 있어 반복적인 문자열 변경 작업에서 String보다 효율적임

5. 자바의 래퍼 클래스(예: Integer, Boolean)를 사용하는 주된 목적은 무엇인가요?

   a. 기본 값을 객체처럼 다룰 수 있게 합니다

   - 기본 타입(primitive type)은 객체가 아니므로 메서드 호출이나 Null 표현 등이 불가능함
   - 래퍼 클래스는 기본 값을 객체화하여 이러한 제약을 해결함

<br/><br/>

## 정리

- 불변 객체는 생성 후 상태가 변하지 않으므로 사이드 이펙트가 없고 멀티스레드 환경에서 안전함
- `String`은 대표적인 불변 객체이며, Java 9+부터 Compact Strings로 메모리 효율이 크게 개선됨
- 빈번한 문자열 수정 발생 시 `StringBuilder` 사용이 권장되며, 멀티스레드 환경에서만 `StringBuffer` 사용을 고려함
- String Constant Pool은 Java 7+부터 Heap으로 이동하여 OutOfMemoryError 문제가 해결됨
- 문자열의 논리적 동등 비교는 `equals()`를 사용해야 정확함
- `intern()` 메서드는 중복 문자열이 많은 경우에만 선택적으로 사용하며, 고유 문자열에는 사용하지 않음
- 래퍼 클래스는 기본 타입을 객체로 다루기 위해 존재하며 박싱/언박싱을 통해 상호 변환됨
- 오토박싱/언박싱은 NPE 위험과 성능 저하를 유발할 수 있으므로 주의하여 사용해야 함
- Integer Cache는 -128~127 범위의 값을 재사용하므로 래퍼 객체 비교 시 반드시 `equals()` 사용해야 함

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2 강의](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
