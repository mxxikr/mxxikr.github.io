---
title: '[김영한의 실전 자바 기본편] 자바 메모리 구조와 static'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-12-30 23:50:00 +0900
category: [Language, Java]
tags: [java, static, memory, stack, heap, method-area, class-variable, static-method]
math: false
mermaid: false
---
# 자바 메모리 구조와 static

- 김영한님의 실전 자바 강의 중 static 챕터를 학습하며 자바 메모리 구조, static 변수와 메서드의 개념, 그리고 static의 사용법을 정리함

<br/><br/>

## 자바 메모리 구조

### 메모리 영역 3가지

- **메서드 영역 (Method Area)**
  - 클래스 정보를 보관함
  - 프로그램 실행 시 클래스 정보가 메서드 영역에 로드됨
  - `static` 키워드가 붙은 정적 변수도 이 영역에 저장됨
  - 런타임 상수 풀(Runtime Constant Pool)도 이 영역에 위치함
    - Java 7부터 문자열 풀(String Pool)은 힙 영역으로 이동함
- **스택 영역 (Stack Area)**
  - 메서드 호출 시 사용되는 지역 변수와 매개변수를 저장함
  - 메서드 종료 시 해당 메모리 공간 제거됨
  - 스택 프레임이라는 단위로 관리됨
  - 각 스레드별로 하나의 실행 스택이 생성됨 (스레드 수만큼 스택 영역 존재)
- **힙 영역 (Heap Area)**
  - `new` 키워드로 생성된 객체(인스턴스)가 저장됨
  - 가비지 컬렉터(GC)가 더 이상 참조되지 않는 객체를 자동으로 제거함

![JVM 메모리 구조](/assets/img/java-basic/java-memory-structure.png)

### 스택 영역의 동작 원리 (LIFO)

- 스택은 후입선출 구조 (LIFO, Last In First Out)
- 나중에 들어온 데이터가 먼저 나감
- 메서드 호출 시 스택 프레임이 쌓이고, 메서드 종료 시 제거됨

![Stack LIFO](/assets/img/java-basic/stack-lifo.png)

### 큐 (Queue)

- 선입선출 구조 (FIFO, First In First Out)
- 먼저 들어온 데이터가 먼저 나감

![Queue FIFO](/assets/img/java-basic/queue-fifo.png)

<br/><br/>

## 메서드 호출과 메모리

### 기본 타입과 스택 영역

```java
package memory;

public class MemoryExample1 {
    public static void main(String[] args) {
        System.out.println("main start");
        calculate(10);
        System.out.println("main end");
    }

    // 값을 2배로 계산
    static void calculate(int num) {
        System.out.println("calculate start");
        int result = num * 2;
        display(result);
        System.out.println("calculate end");
    }

    // 결과 출력
    static void display(int value) {
        System.out.println("display start");
        System.out.println("value: " + value);
        System.out.println("display end");
    }
}
```

```
main start
calculate start
display start
value: 20
display end
calculate end
main end
```

- **스택 영역 동작 과정**

  - `main()` 메서드가 호출되면 `main()` 스택 프레임이 생성됨
  - `main()`에서 `calculate(10)` 호출 시 `calculate()` 스택 프레임이 `main()` 위에 쌓임
  - `calculate()`에서 `display(result)` 호출 시 `display()` 스택 프레임이 최상단에 쌓임
  - `display()` 종료 시 해당 스택 프레임 제거됨
  - `calculate()` 종료 시 해당 스택 프레임 제거됨
  - `main()` 종료 시 프로그램 종료됨

### 참조 타입과 힙 영역

```java
package memory;

public class Product {
    private int price;

    public Product(int price) {
        this.price = price;
    }

    public int getPrice() {
        return price;
    }
}
```

```java
package memory;

public class MemoryExample2 {
    public static void main(String[] args) {
        System.out.println("main start");
        createProduct();
        System.out.println("main end");
    }

    // Product 객체 생성
    static void createProduct() {
        System.out.println("createProduct start");
        Product product1 = new Product(15000);
        showPrice(product1);
        System.out.println("createProduct end");
    }

    // 가격 출력
    static void showPrice(Product product2) {
        System.out.println("showPrice start");
        System.out.println("price=" + product2.getPrice());
        System.out.println("showPrice end");
    }
}
```

- **메모리 동작 과정**

  - `main()` 스택 프레임 생성
  - `createProduct()` 호출 시 스택 프레임 생성
  - `new Product(15000)` 실행 시 힙 영역에 `Product` 객체 생성
  - `product1` 변수는 스택에 저장되고 힙의 객체 참조(주소)를 가짐
  - `showPrice(product1)` 호출 시 참조값이 복사되어 `product2`에 전달됨
  - `showPrice()` 종료 시 `product2` 변수만 제거되고 힙의 객체는 유지됨
  - `createProduct()` 종료 시 `product1` 변수 제거됨
  - 힙의 `Product` 객체는 더 이상 참조되지 않으므로 GC 대상이 됨

<br/><br/>

## static의 이해

### static 변수의 필요성

- **인스턴스 변수의 문제점**

```java
package demo;

public class Student {
    public String name;
    public int count; // 학생 수를 세려는 의도

    public Student(String name) {
        this.name = name;
        count++;
    }
}
```

```java
package demo;

public class StudentMain1 {
    public static void main(String[] args) {
        Student student1 = new Student("철수");
        System.out.println("철수 count=" + student1.count);

        Student student2 = new Student("영희");
        System.out.println("영희 count=" + student2.count);

        Student student3 = new Student("민수");
        System.out.println("민수 count=" + student3.count);
    }
}
```

```
철수 count=1
영희 count=1
민수 count=1
```

- 각 인스턴스마다 별도의 `count` 변수를 가지므로 전체 학생 수를 셀 수 없음

- **외부 카운터 객체 사용**

```java
package demo;

public class Counter {
    public int count;
}
```

```java
package demo;

public class Student {
    public String name;

    public Student(String name, Counter counter) {
        this.name = name;
        counter.count++;
    }
}
```

```java
package demo;

public class StudentMain2 {
    public static void main(String[] args) {
        Counter counter = new Counter();

        Student student1 = new Student("철수", counter);
        System.out.println("철수 count=" + counter.count);

        Student student2 = new Student("영희", counter);
        System.out.println("영희 count=" + counter.count);

        Student student3 = new Student("민수", counter);
        System.out.println("민수 count=" + counter.count);
    }
}
```

```
철수 count=1
영희 count=2
민수 count=3
```

- `Counter` 객체를 공유하여 전체 학생 수를 셀 수 있음
- 하지만 매번 `Counter` 객체를 생성하고 전달해야 하는 번거로움이 있음

### static 변수

- **static 변수 사용**

```java
package demo;

public class Student {
    public String name;
    public static int count; // static 변수

    public Student(String name) {
        this.name = name;
        count++;
    }
}
```

```java
package demo;

public class StudentMain3 {
    public static void main(String[] args) {
        Student student1 = new Student("철수");
        System.out.println("철수 count=" + Student.count);

        Student student2 = new Student("영희");
        System.out.println("영희 count=" + Student.count);

        Student student3 = new Student("민수");
        System.out.println("민수 count=" + Student.count);
    }
}
```

```
철수 count=1
영희 count=2
민수 count=3
```

- **static 변수의 특징**

  - `static` 키워드가 붙은 변수는 메서드 영역에 단 하나만 존재함
  - 모든 인스턴스가 같은 `static` 변수를 공유함
  - 클래스명을 통해 접근함 (`Student.count`)
  - 인스턴스 생성 없이도 접근 가능함

- **메모리 구조**

  - 인스턴스 변수
    - 힙 영역에 인스턴스마다 생성됨
  - static 변수 (정적 변수, 클래스 변수)
    - 메서드 영역에 딱 1개만 존재함

- **접근 방법**

  - 클래스를 통한 접근 (권장)
    - `Student.count`
  - 인스턴스를 통한 접근 (비권장)
    - `student4.count` → IDE에서 경고 표시됨

<br/><br/>

## static 메서드

### static 메서드의 필요성

```java
package util;

public class TextFormatter1 {
    // 문자열을 대괄호로 감싸는 메서드
    public String format(String text) {
        return "[" + text + "]";
    }
}
```

```java
package util;

public class FormatMain1 {
    public static void main(String[] args) {
        String message = "Hello Java";
        TextFormatter1 formatter = new TextFormatter1();
        String formatted = formatter.format(message);

        System.out.println("before: " + message);
        System.out.println("after: " + formatted);
    }
}
```

- `format()` 메서드는 인스턴스 변수를 사용하지 않음
- 단순히 입력값을 처리하는 기능만 수행함
- 매번 객체를 생성하는 것이 비효율적임

### static 메서드 사용

```java
package util;

public class TextFormatter2 {
    // static 메서드로 변경
    public static String format(String text) {
        return "[" + text + "]";
    }
}
```

```java
package util;

public class FormatMain2 {
    public static void main(String[] args) {
        String message = "Hello Java";
        String formatted = TextFormatter2.format(message);

        System.out.println("before: " + message);
        System.out.println("after: " + formatted);
    }
}
```

- 객체 생성 없이 클래스명으로 바로 메서드 호출
- 메모리 효율적이고 코드가 간결함

### static import

```java
TextFormatter2.format("A");
TextFormatter2.format("B");
TextFormatter2.format("C");
```

```java
package util;

import static util.TextFormatter2.*;

public class FormatMain3 {
    public static void main(String[] args) {
        String message = "Hello Java";
        String formatted = format(message); // 클래스명 생략

        System.out.println("before: " + message);
        System.out.println("after: " + formatted);
    }
}
```

- `import static` 사용 시 클래스명 생략 가능
- 특정 메서드만 import 하거나 `*`로 전체 import 가능

<br/><br/>

## static 사용 규칙

### 접근 제한 규칙

```java
package util;

public class Calculator {
    private int instanceValue;
    private static int staticValue;

    // static 메서드
    public static void staticMethod() {
        // instanceValue++; // 컴파일 오류
        // instanceMethod(); // 컴파일 오류

        staticValue++; // 가능
        staticMethodCall(); // 가능
    }

    // 인스턴스 메서드
    public void instanceMethod() {
        instanceValue++; // 가능
        instanceMethodCall(); // 가능

        staticValue++; // 가능
        staticMethodCall(); // 가능
    }

    private void instanceMethodCall() {
        System.out.println("instanceValue=" + instanceValue);
    }

    private static void staticMethodCall() {
        System.out.println("staticValue=" + staticValue);
    }
}
```

- **`static` 메서드는 `static`만 접근 가능**
  - `static` 메서드는 인스턴스 변수, 인스턴스 메서드에 접근할 수 없음
  - `static` 변수, `static` 메서드만 접근 가능함
- **인스턴스 메서드는 모든 것에 접근 가능**
  - 인스턴스 변수, 인스턴스 메서드 접근 가능
  - `static` 변수, `static` 메서드도 접근 가능

| 메서드 타입     | static 멤버 | 인스턴스 멤버 |
| --------------- | ----------- | ------------- |
| static 메서드   | 접근 가능   | 접근 불가     |
| 인스턴스 메서드 | 접근 가능   | 접근 가능     |

- **이유**
  - `static` 메서드는 클래스 이름만으로 호출 가능함
  - 인스턴스가 존재하지 않을 수 있으므로 인스턴스 멤버에 접근할 수 없음
  - 인스턴스 메서드는 인스턴스가 반드시 존재하므로 모든 멤버에 접근 가능함

### 사용 시기와 주의사항

- **static 메서드 사용 시기**

  - 객체 생성이 필요 없는 단순 유틸리티 메서드
  - 인스턴스 변수를 사용하지 않는 메서드
  - 수학 계산, 문자열 처리 등 독립적인 기능

- **static 변수 사용 시기**

  - 모든 인스턴스가 공유해야 하는 값
  - 전역 설정값이나 카운터
  - 프로그램 전체에서 하나만 존재해야 하는 값

- **주의사항**
  - `static` 변수는 프로그램 종료까지 메모리에 유지되므로 과도한 사용은 메모리 낭비
  - 멀티스레드 환경에서 `static` 변수는 동시성 문제 발생 가능
  - 인스턴스를 통한 `static` 멤버 접근은 피해야 함

### main() 메서드 예시

```java
public class Application {
    public static void main(String[] args) {
        // 프로그램 시작점
    }
}
```

- `main()` 메서드는 프로그램의 시작점임
- 객체 생성 없이 실행되어야 하므로 `static`이어야 함
- JVM이 클래스명만으로 `main()` 메서드를 호출함

```java
public class Application {
    public static void main(String[] args) {
        Product product = new Product();
        process(product);
    }

    // 인스턴스를 매개변수로 받음
    static void process(Product product) {
        product.price++;
        System.out.println("price=" + product.price);
    }
}
```

- `static` 메서드에서 인스턴스를 사용하려면 매개변수로 전달받아야 함

<br/><br/>

## 요약 정리

### 메모리 영역

- 메서드 영역
  - 클래스 정보, `static` 변수 저장
- 스택 영역
  - 지역 변수, 매개변수 저장
  - LIFO 구조, 스레드별 생성
- 힙 영역
  - 객체(인스턴스) 저장

### static 키워드

- `static` 변수
  - 메서드 영역에 1개만 존재
  - 모든 인스턴스가 공유
  - 클래스명으로 접근
- `static` 메서드
  - 객체 생성 없이 호출 가능
  - `static` 멤버만 접근 가능
  - 유틸리티 메서드로 적합

<br/><br/>

## 연습 문제

1. `new` 키워드로 생성된 객체 인스턴스는 어디에 저장되나요?

   a. 힙

   - 힙 영역은 new 키워드로 생성되는 객체 인스턴스와 배열이 저장되는 공간임
   - 스택은 로컬 변수, 메서드 영역은 클래스 정보, 스태틱 영역은 메서드 영역의 일부임

2. 클래스 정보와 스태틱 변수처럼 공유되는 데이터는 어디에 저장되나요?
   a. 메서드 영역

   - 메서드 영역은 클래스의 바이트 코드, 필드, 메서드 등 클래스 정보와 스태틱 변수처럼 프로그램 전반에 걸쳐 공유되는 데이터를 저장함
   - 힙은 객체, 스택은 로컬 변수 관리에 쓰임

3. 메서드 호출 시 스택 프레임이 생성되어 로컬 변수가 관리되는 곳은 어디일까요?

   a. 스택

   - 스택 영역은 메서드가 호출될 때마다 스택 프레임이 생성되어 해당 메서드의 로컬 변수와 실행 정보가 관리되는 공간임
   - 힙과 메서드 영역은 다른 목적을 가짐

4. 가장 마지막에 들어온 데이터가 가장 먼저 나가는 (LIFO) 자료구조는 무엇일까요?

   a. 스택

   - 스택은 쌓이는 구조로, 마지막에 들어간 것이 가장 먼저 나오는 LIFO 원칙을 따르는 자료구조임
   - 큐는 먼저 들어온 것이 먼저 나가는 FIFO 방식임

5. 자바 메서드 호출/반환 과정과 가장 유사한 자료구조 개념은 무엇일까요?

   a. 스택

   - 자바에서 메서드가 호출되고 완료될 때 스택 프레임이 쌓였다가 역순으로 제거되는 과정은 스택 자료구조의 LIFO 원칙과 같음
   - 큐는 FIFO 원칙을 따름

6. 힙 객체가 가비지 컬렉션 대상이 되는 경우는 언제일까요?

   a. 참조하는 변수가 없을 때

   - 힙 영역의 객체는 더 이상 어떤 스택 변수나 다른 객체에서도 참조되지 않을 때 가비지 컬렉션 대상이 되어 메모리에서 해제됨
   - 크기나 생성 시점, 메서드 호출 완료 여부와는 직접적인 관계가 없음

7. 스택 변수가 힙 객체를 가리킬 때, 스택 변수에 저장되는 값은 무엇일까요?

   a. 힙 객체 주소 (참조 값)

   - 스택 변수가 힙의 객체를 가리킬 때는 객체의 실제 값이 아닌, 힙 영역에 저장된 해당 객체의 메모리 주소인 참조 값을 저장함
   - 이를 통해 객체에 접근할 수 있음

8. Java에서 static 변수에 대한 설명으로 가장 정확한 것은 무엇인가요?

   a. 클래스에서 여러 개의 static 변수를 선언할 수 있으며, 각 변수는 메서드 영역에 하나만 존재한다

   - static 변수는 인스턴스가 아닌 클래스 레벨에서 관리되며, 메서드 영역 안의 스태틱 영역에 저장됨
   - 따라서 해당 클래스가 로딩될 때 딱 하나만 생성되어 모든 인스턴스가 공유됨

9. static 메서드가 직접 접근할 수 있는 멤버는 무엇일까요?

   a. 스태틱 변수/메서드만

   - static 메서드는 클래스에 소속되어 인스턴스의 상태를 알 수 없으므로, 자신의 클래스 안에 있는 스태틱 변수나 다른 스태틱 메서드만 직접 호출하고 접근할 수 있음
   - 인스턴스 멤버 접근은 불가능함

10. 객체 생성 없이 바로 호출되는 static 메서드는 언제 유용할까요?

    a. 인스턴스 데이터 없이 기능만 수행할 때

    - static 메서드는 인스턴스 생성 없이 호출되므로, 인스턴스 변수(객체의 상태)를 사용하지 않고 입력 값만으로 기능을 수행하는 유틸리티성 메서드에 적합함
    - 객체 상태 변경/읽기는 인스턴스 메서드의 역할임

<br/><br/>

## Reference

- [김영한의 실전 자바 - 기본편](https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94)
