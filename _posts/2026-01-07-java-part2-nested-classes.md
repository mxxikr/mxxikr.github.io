---
title: "[독하게 시작하는 Java Part 2]  내부 클래스와 익명 객체"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-07 13:00:00 +0900
category:
  - [Language, Java]
tags: [java, nested-class, inner-class, static-nested-class, anonymous-object, package, import]
math: false
---

# 내부 클래스와 익명 객체

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 중첩 클래스의 종류와 설계 목적, 정적 중첩 클래스와 내부 클래스의 차이, 익명 객체를 활용한 인터페이스 구현, 그리고 패키지를 통한 클래스 관리 방법을 정리함

<br/><br/>

## 중첩 클래스 (Nested Class)

### **중첩 클래스의 분류와 목적**

- **정의**
  - 클래스 내부에 또 다른 클래스를 선언하는 것을 의미함
  - 논리적으로 연관된 클래스들을 묶어 코드의 캡슐화를 높이고 복잡성을 제어하기 위해 사용함
- **분류**

  ![Nested Class Taxonomy](/assets/img/java-part2/nested/nested_class_taxonomy.png)

  - **정적 중첩 클래스 (Static Nested Class)**
    - 외부 클래스의 `static` 멤버처럼 동작함
  - **비정적 중첩 클래스 (Inner Class)**
    - 외부 클래스의 인스턴스 멤버처럼 동작함
    - **내부 클래스 (Member Inner Class)**
      - 외부 클래스의 멤버 변수 위치에 선언됨
    - **지역 클래스 (Local Class)**
      - 메서드 내부나 초기화 블록 내부에 선언됨
    - **익명 클래스 (Anonymous Class)**
      - 이름 없이 선언과 동시에 객체를 생성함

### **중첩 클래스 선택 가이드**

- **정적 중첩 클래스 사용**
  - 외부 클래스의 인스턴스 멤버 접근이 필요 없는 경우
  - 외부 클래스보다 오래 살아남을 가능성이 있는 경우
  - 스레드, 리스너 등 비동기 작업
  - ex)
    - `Thread`, `Runnable`, `Comparator` 구현
- **비정적 내부 클래스 사용**
  - 외부 클래스의 인스턴스 멤버 접근이 반드시 필요한 경우
  - 생명주기가 외부 클래스와 동일한 경우
  - `Iterator`, `Entry` 등의 헬퍼 클래스
- **기본 원칙**

  - 외부 참조가 필요 없으면 `static` 사용
  - 메모리 누수 방지를 위해 기본적으로 정적 중첩 클래스 사용을 권장함

### **정적 중첩 클래스 (Static Nested Class)**

- `static` 키워드가 붙은 중첩 클래스임
- 외부 클래스의 인스턴스 없이도 독립적으로 생성 가능함
- 외부 클래스의 `private static` 멤버에는 접근 가능하지만, 인스턴스 멤버에는 접근할 수 없음
- 사실상 다른 클래스이지만, 논리적 그룹화를 위해 내부에 위치시킨 형태임

  ```java
  class Outer {
      private int data = 5;
      private static int dataStatic = 10;

      // 정적 중첩 클래스
      static class Inner {
          private int inData = 50;

          // 외부 클래스의 정적 멤버에는 접근 가능
          int getOuterDataStatic() {
              return Outer.dataStatic;
          }

          // 외부 클래스의 인스턴스 멤버 접근 불가 (컴파일 에러)
          // int getOuterData() { return Outer.data; }
      }

      int getInnerData() {
          Inner inner = new Inner();
          return inner.inData;
      }
  }
  ```

### **내부 클래스 (Inner Class)**

- `static` 키워드 없이 선언된 중첩 클래스임
- 외부 클래스의 인스턴스가 생성되어야만 내부 클래스의 인스턴스를 생성할 수 있음
- 외부 클래스의 `private` 멤버를 포함한 모든 멤버에 직접 접근할 수 있음
- **외부 참조 메커니즘**

  - 컴파일러가 자동으로 외부 클래스 참조(`this$0`)를 내부 클래스에 저장함
  - 바이트코드에서는 숨겨진 필드로 외부 클래스 참조를 유지함

  ```java
  // 소스 코드
  class Outer {
      private String data = "Outer Data";

      class Inner {
          public void printData() {
              System.out.println(data);  // 외부 클래스 필드 접근
          }
      }
  }

  // 바이트코드에서 실제 구조 (개념적 표현)
  class Outer$Inner {
      final Outer this$0;  // 패키지-프라이빗 synthetic 필드

      Outer$Inner(Outer outer) {
          this.this$0 = outer;  // 외부 참조 저장
      }

      public void printData() {
          System.out.println(this$0.data);  // 외부 참조를 통한 접근
      }
  }
  ```

  ![Inner Class Reference](/assets/img/java-part2/nested/inner_class_reference.png)

- **메모리 누수 주의사항**

  ```java
  // 비정적 내부 클래스로 인한 메모리 누수
  class Activity {
    private byte[] largeData = new byte[10 * 1024 * 1024];  // 10MB

    class MyRunnable implements Runnable {
        @Override
        public void run() {
            // 외부 Activity 참조를 자동으로 유지함
            System.out.println("Running");
        }
    }

    public void startTask() {
        // Activity가 종료되어도 Runnable이 Activity를 참조하므로
        // 10MB 메모리가 GC되지 않음
        new Thread(new MyRunnable()).start();
    }
  }
  ```

  ```java
    // 정적 중첩 클래스 사용
    class Activity {
        private byte[] largeData = new byte[10 * 1024 * 1024];

        static class MyRunnable implements Runnable {
            @Override
            public void run() {
                // 외부 참조 없음 - 메모리 누수 방지
                System.out.println("Running");
            }
        }

        public void startTask() {
            new Thread(new MyRunnable()).start();
        }
    }
  ```

### **지역 클래스 (Local Class)**

- 메서드 내부나 블록 내부에 선언되는 클래스임
- 선언된 블록 내에서만 사용 가능함
- 접근 제어자(`public`, `protected`, `private`)를 사용할 수 없음
- 메서드의 지역 변수에 접근 가능하지만 `final` 또는 effectively final이어야 함
- **Effectively Final**

  - Java 8+에서 도입된 개념임
  - 선언 후 값이 **한 번도 재할당되지 않으면** `final` 키워드 없이도 접근 가능함
  - 코드상 재할당 구문이 존재하면(실행되지 않더라도) effectively final이 아님

  ```java
  class Outer {
      public void method() {
          final int localVar = 10;  // final 변수
          int effectivelyFinalVar = 20;  // effectively final

          // 메서드 내부에 선언
          class LocalInner {
              public void print() {
                  // 외부 클래스 멤버 및 지역 변수 접근 가능
                  System.out.println(localVar);
                  System.out.println(effectivelyFinalVar);
              }
          }

          LocalInner local = new LocalInner();
          local.print();

          // effectivelyFinalVar = 30;  // 컴파일 에러 (값 변경 시도)
      }
  }
  ```

- **지역 변수가 final이어야 하는 이유**

  - **메모리 생명주기 차이**
    - 지역 변수는 **스택**(Stack)에 저장되어 메서드 종료 시 사라짐
    - 지역 클래스 객체는 **힙**(Heap)에 저장되어 메서드 종료 후에도 남아있을 수 있음
  - **값 복사 메커니즘**
    - 지역 클래스는 외부 지역 변수의 **값을 복사**하여 내부에 저장함
    - 원본이 변경 가능하면 복사본과 원본이 달라져 혼란을 초래함
    - 따라서 `final` 또는 effectively final만 허용하여 값의 일관성을 보장함

  ![Local Class Memory Lifecycle](/assets/img/java-part2/nested/local_class_memory.png)

  ```java
  public List<String> filterNames(List<String> names, String prefix) {
    // 지역 클래스
    class NameFilter {
      boolean matches(String name) {
        // prefix는 effectively final이므로 접근 가능
        return name.startsWith(prefix);
          }
      }

      NameFilter filter = new NameFilter();
      List<String> result = new ArrayList<>();
      for (String name : names) {
          if (filter.matches(name)) {
              result.add(name);
          }
      }
      return result;
  }
  ```

### 익명 클래스 (Anonymous Class)

- **정의**
  - 이름이 없는 일회용 클래스를 선언과 동시에 인스턴스화하는 기법임
  - 클래스 선언과 객체 생성이 하나의 표현식으로 이루어짐
- **특징**

  - 생성자를 선언할 수 없음 (이름이 없기 때문)
  - 주로 인터페이스나 추상 클래스를 즉석에서 구현하여 매개변수로 전달하거나 필드에 할당할 때 사용함
  - GUI 이벤트 리스너나 스레드 생성 시 자주 활용됨

  ```java
  class MyWindow {
      interface OnClickListener {
          public void onClick();
      }

      // 필드 선언과 동시에 인터페이스를 구현하는 익명 객체 할당
      OnClickListener listener = new OnClickListener() {
          @Override
          public void onClick() {
              System.out.println("Anonymous listener clicked");
          }
      };

      // 메서드 인자로 익명 객체 전달
      public void setButtonListener() {
          // (버튼 연결 로직)
      }
  }
  ```

- **람다 표현식과의 비교 (Java 8+)**

  ```java
  interface OnClickListener {
      void onClick();
  }

  // 익명 클래스 (Java 7 이전) - 장황함
  OnClickListener listener1 = new OnClickListener() {
      @Override
      public void onClick() {
          System.out.println("Clicked");
      }
  };

  // 람다 표현식 (Java 8+) - 간결함
  OnClickListener listener2 = () -> System.out.println("Clicked");

  // 메서드 참조는 시그니처가 맞지 않아 사용 불가
  // onClick()은 인자가 없으므로 System.out::println 사용 불가
  ```

- **익명 클래스의 제약사항**

  ````java
  // 불가능: 생성자 선언
  OnClickListener listener = new OnClickListener() {
  // public OnClickListener() { }  // 컴파일 에러

      @Override
      public void onClick() { }
  };

  // 불가능: 여러 인터페이스 동시 구현
  // Runnable r = new Runnable(), Serializable() { };  // 구문 오류

  // 불가능: 인터페이스와 클래스 동시 상속/구현
  // Object obj = new Object(), Runnable() { };  // 불가능

  // 가능: 필드와 메서드 추가 (단, 외부에서는 인터페이스 타입으로만 접근)
  OnClickListener listener = new OnClickListener() {
      private int count = 0;  // 필드 추가 가능

      @Override
      public void onClick() {
          count++;
          System.out.println("Clicked " + count + " times");
      }

  // 추가 메서드 (단, 외부에서 호출 불가)
      private void reset() {
          count = 0;
      }
  };
  ```
  ````

### **중첩 클래스의 바이트코드 이름**

- **명명 규칙**

  - 정적 중첩 클래스
    - `Outer$StaticNested.class`
  - 멤버 내부 클래스
    - `Outer$Inner.class`
  - 지역 클래스
    - `Outer$1Local.class` (숫자는 선언 순서)
  - 익명 클래스
    - `Outer$1.class`, `Outer$2.class`, ...
  - `$` 기호로 구분되며, 각각 독립적인 `.class` 파일로 컴파일됨

    ```java
    class Outer {
        static class StaticNested { }      // Outer$StaticNested.class
        class Inner { }                     // Outer$Inner.class

        void method() {
            class Local { }                 // Outer$1Local.class

            Runnable r = new Runnable() {   // Outer$2.class (지역 클래스와 번호 공유)
                @Override
                public void run() { }
            };
        }
    }
    ```

- **바이트코드 번호 매기기 규칙**

  - 지역 클래스와 익명 클래스는 **같은 카운터를 공유**함
  - 메서드 내에서 선언 순서대로 번호가 매겨짐

  ```java
  class Outer {
      void method() {
          Runnable r1 = new Runnable() { };  // Outer$1.class
          class Local { }                     // Outer$2Local.class
          Runnable r2 = new Runnable() { };  // Outer$3.class
      }
  }
  ```

<br/><br/>

## 패키지와 접근 제어 관리

### **패키지 (Package)**

- **개념**
  - 관련된 클래스와 인터페이스를 그룹화하는 폴더 구조임
  - 파일 시스템의 디렉토리 구조와 일치하며 소문자로 명명하는 것이 표준임 (`com.company.project`)
  - 클래스 이름 충돌(Naming Conflict)을 방지하는 네임스페이스 역할을 함
- **선언과 임포트**
  - `package` 문
    - 소스 파일의 첫 줄에 선언하여 해당 클래스의 소속을 명시함
  - `import` 문
    - 다른 패키지의 클래스를 사용할 때 선언함
  - 상위 패키지를 임포트(예: `import java.util.*`)해도 하위 패키지(`java.util.regex` 등)는 자동으로 포함되지 않음

### **패키지 명명 규칙**

- **규칙**

  - 모두 소문자 사용 (`com.company.project` 사용, `com.Company.Project` 사용 안 함)
  - 역순 도메인 이름 사용
    - 회사
      - `com.google.guava`
    - 개인
      - `io.github.username`
    - 오픈소스
      - `org.apache.commons`
  - 예약어 피하기 권장 (`com.company.class`는 기술적으로 가능하지만 매우 권장되지 않음)
    - `import com.company.class.MyClass;`처럼 `class` 키워드와 혼동 가능
  - 언더스코어 사용 지양 (`com.company.my_project` 사용 안 함, `com.company.myproject` 사용)

### **import 문 정리**

```java
// 구체적 import (권장)
import java.util.ArrayList;
import java.util.List;

// 와일드카드 import (지양)
import java.util.*;  // 어떤 클래스를 사용하는지 불명확

// static import
import static java.lang.Math.PI;
import static java.lang.Math.sqrt;

public class Calculator {
    public double circleArea(double r) {
        return PI * r * r;  // Math.PI 대신 PI만 사용
    }

    public double distance(double x, double y) {
        return sqrt(x * x + y * y);  // Math.sqrt 대신 sqrt만 사용
    }
}
```

### **static import 주의사항**

- **남용 시 가독성 저하**
- 메서드의 출처가 불명확해져 코드 이해가 어려워짐
- ex)
  - `max(abs(-10), min(5, 3))` - 어디서 온 메서드인지 알 수 없음
- **권장 사용 패턴**

  - 상수(`PI`, `E`)처럼 출처가 명확한 경우만 사용
  - 반복적으로 사용되는 유틸리티 메서드에 제한적으로 사용

  ```java
  // static import 남용 시 가독성 저하
  import static java.lang.Math.*;

  public class Calculator {
      public double calculate() {
  // max가 어디서 온 건지 불명확
          return max(abs(-10), min(5, 3));
      }
  }

  // 명확한 상수만 static import
  import static java.lang.Math.PI;
  import static java.lang.Math.E;

  public class Calculator {
      public double area(double r) {
          return PI * r * r;  // PI는 너무 명확하여 괜찮음
      }
  }
  ```

### **패키지와 접근 제어자**

| 접근 제어자 | 같은 클래스 | 같은 패키지 | 하위 클래스 | 전체 |
| ----------- | ----------- | ----------- | ----------- | ---- |
| `private`   | O           | X           | X           | X    |
| `default`   | O           | O           | X           | X    |
| `protected` | O           | O           | O           | X    |
| `public`    | O           | O           | O           | O    |

```java
// 같은 패키지
package com.example;

class PackagePrivateClass {  // default 접근 제어자
    void packagePrivateMethod() { }  // 같은 패키지에서만 접근 가능
}
```

```java
// 다른 패키지
package com.other;

import com.example.PackagePrivateClass;  // 컴파일 에러 (default는 패키지 외부 접근 불가)
```

```java
// user 패키지 선언
package user;

public class UserData {
    private String name;
    public UserData(String name) { this.name = name; }
    public String getName() { return name; }
}
```

```java
// 메인 클래스에서 외부 패키지 임포트
import user.UserData;

public class Main {
    public static void main(String[] args) {
        // import한 클래스 사용
        UserData user = new UserData("Hosung");
        System.out.println(user.getName());
    }
}
```

<br/><br/>

## 연습 문제

1. 클래스 중첩(Nesting)과 상속(Inheritance)의 주요 차이점은 무엇인가요?

   a. 상속은 독립적 클래스 연결, 중첩은 구성 요소 포함입니다

   - 중첩은 한 클래스가 다른 클래스 안에 구성 요소로 포함되는 개념임
   - 상속은 독립적인 두 클래스 간의 종류 관계를 나타내는 설계 방식임

2. 외부 클래스의 인스턴스 생성 없이 직접 인스턴스화할 수 있는 중첩 클래스 유형은 무엇인가요?

   a. 정적 중첩 클래스

   - 정적 중첩 클래스는 외부 클래스의 인스턴스와 독립적으로 존재하여 인스턴스화할 수 있음
   - 마치 최상위 클래스처럼 동작함

3. 지역(Local) 또는 익명(Anonymous) 클래스가 메서드의 지역 변수에 접근할 때의 제약 사항은 무엇인가요?

   a. 지역 변수는 읽기만 가능하며 값을 변경할 수 없습니다.

   - 지역/익명 클래스는 자신을 감싸는 메서드의 지역 변수에 접근할 수 있지만, 해당 변수는 실질적으로 상수(final)가 되어 값을 변경할 수 없음
   - 이는 메모리 생명주기 차이로 인한 값 복사 메커니즘 때문임

4. 익명 클래스가 자주 사용되는 목적은 무엇인가요?

   a. GUI 이벤트 핸들러 구현 코드 간소화

   - 익명 클래스는 이름 없이 일회성으로 사용되는 클래스로, GUI 프로그래밍에서 이벤트 리스너와 같은 인터페이스 구현 시 코드를 간결하게 작성할 수 있음

5. 자바에서 패키지(Package)를 사용하는 주된 이유는 무엇인가요?

   a. 관련 클래스들의 그룹화 및 관리

   - 패키지는 관련 있는 클래스나 인터페이스를 묶어서 관리하는 논리적인 단위임
   - 이를 통해 코드 조직화 및 이름 충돌 방지가 가능함

<br/><br/>

## 정리

- 중첩 클래스는 클래스 간의 관계를 명확히 하고 캡슐화를 강화하기 위해 사용됨
- 정적 중첩 클래스는 외부 클래스의 인스턴스 없이 독립적으로 사용할 수 있음
- 내부 클래스는 외부 클래스의 인스턴스에 종속되며 외부 멤버에 자유롭게 접근 가능함
- 내부 클래스는 숨겨진 외부 참조(`this$0`)를 유지하므로 메모리 누수에 주의해야 함
- 외부 참조가 필요 없는 경우 정적 중첩 클래스 사용이 권장됨
- 지역 클래스는 메서드 내부에 선언되며 `final` 또는 effectively final 지역 변수에 접근할 수 있음
- 익명 클래스는 이름 없는 클래스로, 인터페이스나 추상 클래스를 일회성으로 구현할 때 사용됨
- Java 8+에서는 익명 클래스 대신 람다 표현식을 사용하여 코드를 간결하게 작성할 수 있음
- 패키지는 클래스를 체계적으로 관리하고 이름 충돌을 방지하는 구조임
- 접근 제어자는 패키지 단위로 적용되며 `default`는 같은 패키지 내에서만 접근 가능함

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
