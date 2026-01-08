---
title: "독하게 시작하는 Java Part 2 - 다형성"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-05 00:00:00 +0900
category:
  - [Language, Java]
tags: [java, polymorphism, abstract, interface, enum, casting, instanceof]
math: false
---

# 다형성

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 다형성의 개념과 클래스 형변환(업캐스팅, 다운캐스팅), 추상 클래스와 인터페이스의 차이점, 열거형을 활용한 심볼릭 상수 정의 방법을 학습하며 객체 지향 프로그래밍의 원리를 정리함

<br/><br/>

## 다형성

### 다형성의 개념

- **정의**
  - 같은 종의 생물이지만 형태나 형질이 다양하게 나타나는 현상을 프로그래밍에 접목한 것임
- **프로그래밍적 의미**
  - 하나의 타입(부모 클래스/인터페이스)으로 여러 형태의 객체를 다루는 능력
- **장점**
  - **유연성**
    - 새로운 파생 클래스 추가 시 기존 코드를 수정할 필요가 없음
  - **확장성**
    - 인터페이스를 통해 다양한 구현체를 쉽게 교체할 수 있음
  - **유지보수성**
    - 추상화된 타입으로 일관된 로직 처리가 가능함

![Polymorphism Diagram](/assets/img/java-part2/polymorphism/polymorphism_class_diagram.png)

### 다형성 활용 예제

- 객체 지향 프로그래밍에서 다형성을 활용하면, 구체적인 자식 클래스에 의존하지 않고 추상화된 부모 타입으로 코드를 작성할 수 있음

  ```java
  // 다형성의 실용적 활용
  class ZooKeeper {
      private List<Animal> animals = new ArrayList<>();

      public void addAnimal(Animal animal) {
          animals.add(animal);  // 어떤 동물이든 추가 가능
      }

      public void makeAllSounds() {
          for (Animal animal : animals) {
              animal.sound();  // 각자의 방식으로 소리 내기 (동적 바인딩)
          }
      }
  }

  // 사용
  ZooKeeper zoo = new ZooKeeper();
  zoo.addAnimal(new Dog()); // 개 추가
  zoo.addAnimal(new Cat()); // 고양이 추가
  zoo.addAnimal(new Rabbit()); // 토끼 추가
  zoo.makeAllSounds(); // 일괄 처리
  ```

- **인스턴스 메모리 구조**
  ![Instance Memory Structure](/assets/img/java-part2/polymorphism/memory_structure_diagram.png)

  - **구조 설명**
    - **Heap 영역**
      - 객체 인스턴스가 생성됨
      - 부모 클래스의 멤버(`Animal Members`)와 자식 클래스의 멤버(`Dog Members`)가 모두 포함됨
    - **Method 영역**
      - 클래스 메타정보, 메서드 바이트코드, 상속 정보 등이 저장됨
  - **특징**
    - `private` 멤버도 메모리에는 존재하지만 접근이 차단됨
    - `protected` 멤버는 파생 클래스에서 접근 허용됨
    - 메서드 코드는 객체마다 중복되지 않고 메서드 영역의 코드를 공유함

<br/><br/>

## 형변환

### 클래스 형변환

- **업캐스팅**

  - 파생 클래스의 인스턴스를 부모 클래스 형식의 참조자로 가리키는 것임
  - 모든 파생 형식은 부모 형식으로 안전하게 캐스팅될 수 있음

  ```java
  class Animal {
      void eat() {
          System.out.println("Animal eating...");
      }
  }

  class Dog extends Animal {
      @Override
      void eat() {
          System.out.println("Dog eating..."); // 오버라이딩
      }

      void bark() {
          System.out.println("Barking...");
      }
  }

  // 업캐스팅
  Animal animal = new Dog(); // 자동 변환
  animal.eat();              // "Dog eating..." 출력 (동적 바인딩)
  // animal.bark();          // 컴파일 에러, Animal 타입에는 bark() 없음
  ```

- **특징**
  - **자동 형변환**
    - 명시적 캐스팅 없이 부모 타입으로 대입 가능함
  - **접근 제한**
    - 부모 클래스에 선언된 멤버만 접근 가능함
  - **동적 바인딩**
    - 오버라이딩된 메서드는 참조 변수의 타입이 아닌, **실제 객체**(Dog)의 메서드가 실행됨

![Casting Flow](/assets/img/java-part2/polymorphism/casting_flow_diagram.png)

- **다운캐스팅**

  - 부모 형식의 참조자가 가리키는 대상을 특정 파생 형식으로 변환하는 것임
  - 부모 클래스가 자식 클래스에 의존하게 되는 의존성 역전이 발생할 수 있어 주의가 필요함
  - **다운캐스팅 조건**
    - 참조 변수가 실제로 가리키는 객체가 다운캐스팅하려는 타입이거나 그 하위 타입이어야 함
    - 컴파일 시점에는 타입 체크만 수행하고, 실제 유효성은 런타임에 검사됨

  ```java
  Animal animal = new Dog(); // 실제 객체는 Dog
  Dog dog = (Dog) animal;    // 가능 (명시적 형변환)
  dog.bark();

  // 잘못된 다운캐스팅 - 런타임 에러
  Animal animal2 = new Animal(); // 실제 객체는 Animal
  // Dog dog2 = (Dog) animal2;   // ClassCastException 발생
  ```

  - **주의사항 및 생략 권고**
    - **추상화 파괴**
      - 부모 타입으로 다루는 것이 다형성의 핵심인데, 다시 자식 타입으로 되돌리는 것은 설계적 한계를 드러냄
    - **OCP 위반**
      - 타입별로 분기하여 다운캐스팅을 수행하면 새로운 클래스 추가 시 코드를 수정해야 함
    - 가능하면 다운캐스팅 없이 메서드 오버라이딩(다형성)을 통해 문제를 해결하는 것이 좋음

- **instanceof 연산자**

  - 다운캐스팅이 가능한지 실행 시점에 확인(RTTI, Run Time Type Information)하는 연산자

  ```java
  public class Main {
      public static void main(String[] args) {
          Scanner s = new Scanner(System.in);
          int input = s.nextInt();
          Animal animal;

          // 업캐스팅 활용
          if(input == 0)
              animal = new Dog();
          else
              animal = new Cat();

          // 다형성을 통한 메서드 호출 (권장)
          animal.sound();

          // 다운캐스팅 활용
          // 자식 클래스만의 고유 기능이 필요한 경우에 한정적으로 사용 (OCP 관점에서는 지양 대상)
          if(animal instanceof Dog) {
              Dog dog = (Dog) animal;
              // Dog에만 있는 guardHouse() 메서드 호출
              dog.guardHouse();
              System.out.println("강아지입니다.");
          } else if(animal instanceof Cat) {
              Cat cat = (Cat) animal;
              // Cat에만 있는 groom() 메서드 호출
              cat.groom();
              System.out.println("고양이입니다.");
          }
      }

      // 다형성 활용 (OCP 준수)
      void makeAnimalSound(Animal animal) {
          animal.sound();  // 각 클래스가 알아서 처리
      }

      // 타입별 분기 (OCP 위반)
      void makeAnimalSoundBad(Animal animal) {
          if(animal instanceof Dog) {
              // ...
          } else if(animal instanceof Rabbit) {
              // ...
          }
          // 새로운 동물 추가 시 메서드 수정 필요!
      }
  }
  ```

  - **사용법**
    - `객체 instanceof 클래스명` 형식으로 사용
    - `true` 또는 `false` 반환
    - 다운캐스팅 전 항상 확인하는 것이 권장됨

<br/><br/>

## 추상 클래스

### 개념

- 설계적인 관점에서만 존재하며 `new` 연산자로 직접 인스턴스를 생성할 수 없음
- 추상 메서드(구현부가 없는 메서드)를 포함하는 것이 일반적임
- 파생 클래스에서 반드시 특정 메서드를 재정의하도록 강제하는 역할을 함

### 문법

```java
public abstract class ClassName {
    // 추상 메서드
    abstract void methodName();

    // 일반 메서드도 포함 가능
    public void concreteMethod() {
        System.out.println("Implemented method");
    }
}
```

### 구현 예제

```java
abstract class Animal {
    // 파생 클래스에서 반드시 구현해야 함
    abstract public void sound();
}

class Dog extends Animal {
    @Override
    public void sound() {
        System.out.println("Bow Wow");
    }
}

class Cat extends Animal {
    @Override
    public void sound() {
        System.out.println("Meow");
    }
}
```

- **특징**
  - C++의 순수 가상 클래스 개념과 유사함
  - 오직 파생 클래스를 위해 존재하는 클래스임
  - 추상 메서드를 하나라도 포함하면 클래스도 `abstract`로 선언해야 함

<br/><br/>

## 인터페이스

### 개념

- **기본 정의**
  - 전통적으로는 구현부가 없는 순수한 추상 메서드의 집합이었으나, Java 8 이후 기능이 확장됨
  - 인스턴스 필드(상태)는 가질 수 없으며 `public static final` 상수만 가질 수 있음
  - **Java 8+**
    - `default` 메서드와 `static` 메서드를 통해 구현 코드를 포함할 수 있음
  - **Java 9+**
    - `private` 메서드를 통해 내부 로직을 캡슐화할 수 있음
- **마커 인터페이스 (Marker Interface)**
  - 메서드 없이 단지 해당 타입임을 표시하는 용도의 인터페이스 (`Serializable`, `Cloneable` 등)

![Abstract vs Interface](/assets/img/java-part2/polymorphism/abstract_vs_interface_diagram.png)

### 문법

```java
[public] interface InterfaceName {
    // 상수 정의 (public static final 생략 가능)
    int MAX_VALUE = 100;

    // 메서드 선언 (public abstract 생략 가능)
    void methodName();
}
```

### 구현 예제

```java
interface Animal {
    // public abstract가 생략된 형태
    void sound();
}

class Dog implements Animal {
    @Override
    public void sound() {
        System.out.println("Bow Wow");
    }
}

class Cat implements Animal {
    @Override
    public void sound() {
        System.out.println("Meow");
    }
}
```

- **인터페이스와 추상 클래스**

  | 구분                | 인터페이스                                        | 추상 클래스                      |
  | :------------------ | :------------------------------------------------ | :------------------------------- |
  | **인스턴스 필드**   | 불가능 (상수만 가능)                              | 가능                             |
  | **메서드**          | 추상 메서드, default, static, private (Java 8+)   | 추상 메서드 + 일반 메서드        |
  | **상속/구현**       | 다중 구현 가능 (`implements`)                     | 단일 상속만 가능 (`extends`)     |
  | **생성자**          | 불가능                                            | 가능 (자식이 `super()`로 호출)   |
  | **설계 의도**       | "can-do" 능력(기능) 정의                          | "is-a" 본질/공통 구현 공유       |
  | **접근 제어자**     | 메서드는 기본적으로 public (Java 9+ private 가능) | 다양한 접근 제어자 사용 가능     |
  | **다이아몬드 문제** | 해결 가능 (`default` 메서드 충돌 시 명시 필요)    | 불가능 (단일 상속으로 원천 차단) |

<br/><br/>

## 다중 인터페이스 구현

```java
interface Drawable {
    void draw();
}

interface Resizable {
    void resize(int width, int height);
}

// 다중 인터페이스 구현
class Window implements Drawable, Resizable {
    @Override
    public void draw() {
        System.out.println("Drawing window");
    }

    @Override
    public void resize(int width, int height) {
        System.out.println("Resizing to " + width + "x" + height);
    }
}
```

- **장점**
  - 여러 역할을 동시에 수행할 수 있음
  - 유연한 설계가 가능함
  - 코드 재사용성이 높아짐

### default 메서드 활용 예제

```java
interface Logger {
    void log(String message);

    // 하위 호환성을 유지하며 기능 추가 가능
    default void logError(String message) {
        log("ERROR: " + message);
    }
}

class ConsoleLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println(message);
    }
    // logError는 구현하지 않아도 default 구현이 사용됨
}
```

<br/><br/>

## 열거형

### 개념

- 심볼릭 상수를 정의하는 문법으로 코드의 가독성과 형 안전성을 높여줌
- `java.lang.Enum` 클래스의 파생 형식으로 취급됨
- `values()`, `valueOf()`, `ordinal()` 등 유용한 메서드를 제공함

### 문법

```java
public enum EnumName {
    VALUE1, VALUE2, VALUE3
}
```

### 기본 사용 예제

```java
enum Season {
    SPRING, SUMMER, AUTUMN, WINTER
}

public class Main {
    public static void main(String[] args) {
        Season season = Season.WINTER;

        // 서수(인덱스) 출력
        System.out.println(Season.valueOf("SPRING").ordinal()); // 0

        // 이름 출력
        System.out.println(season.name()); // WINTER

        // 서수 출력
        System.out.println(season.ordinal()); // 3

        // 전체 항목 순회
        for(Season s : Season.values()) {
            System.out.println(s.name());
        }
    }
}
```

- **주요 메서드**

  - `values()`
    - 모든 열거 상수를 배열로 반환함
    - `for-each` 문으로 순회할 때 사용함
  - `valueOf(String name)`
    - 문자열에 해당하는 열거 상수를 반환함
    - 존재하지 않는 이름이면 `IllegalArgumentException` 발생
  - `name()`
    - 열거 상수의 이름을 문자열로 반환함
  - `ordinal()`

    - 열거 상수의 서수(0부터 시작하는 인덱스)를 반환함
    - **주의**

      - 열거 상수의 선언 순서가 바뀌면 반환되는 정수 값이 바뀌어 버그를 초래할 수 있음
      - `Alternative`

        - 별도의 필드를 정의하여 사용

        ```java
        // ordinal() 사용
        enum Priority {
            LOW, MEDIUM, HIGH
        }
        // Priority.HIGH.ordinal() // 2 (순서 변경 시 값 변동 위험)

        // 명시적 필드 사용
        enum Priority {
            LOW(1), MEDIUM(5), HIGH(10);

            private final int level;

            Priority(int level) {
                this.level = level;
            }

            public int getLevel() {
                return level;
            }
        }
        Priority.HIGH.getLevel() // 10 (순서와 무관하게 고정)
        ```

### 활용 예제

```java
enum Status {
    READY("준비"),
    RUNNING("실행 중"),
    COMPLETED("완료");

    private final String description;

    // 생성자
    Status(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

// 사용
Status status = Status.RUNNING;
System.out.println(status.getDescription()); // "실행 중"
```

- **특징**
  - 필드와 메서드를 추가할 수 있음
  - 생성자는 `private`만 가능함
  - 각 상수에 추가 데이터를 연결할 수 있음

<br/><br/>

## 연습 문제

1. 부모 타입으로 참조되는 다양한 자식 객체가 동일한 메소드 호출에 다르게 반응하는 객체지향 특성은 무엇일까요?

   a. 다형성

   - 다형성은 하나의 타입으로 여러 형태의 객체를 다루며, 실제 객체에 따라 다른 결과(메소드 재정의)를 얻는 특성임
   - 이는 객체지향 프로그래밍의 핵심 강점 중 하나임

2. 자바에서 부모 클래스 타입을 자식 클래스 타입으로 변환하려 할 때 항상 성공한다고 보장할 수 없는 형변환은 무엇일까요?

   a. 다운캐스팅

   - 다운캐스팅은 부모 타입을 자식 타입으로 변환하며, 실제 객체가 해당 자식 타입이 아닐 경우 런타임 오류가 발생할 수 있음
   - 업캐스팅은 항상 안전함

3. 인스턴스를 직접 생성할 수 없으며, 주로 상속을 통해 자식 클래스가 미완성된 부분을 완성하도록 설계된 클래스 유형은 무엇일까요?

   a. 추상 클래스

   - 추상 클래스는 `abstract` 키워드로 선언되며, 불완전한(추상) 메소드를 가질 수 있어 객체를 직접 만들 수 없음
   - 자식 클래스가 추상 메소드를 반드시 재정의하여 완성해야 함

4. 자바에서 클래스는 불가능하지만, 여러 개의 상위 타입 명세를 `implements`하여 다중 상속과 유사한 효과를 제공하는 기능은 무엇일까요?

   a. 인터페이스

   - 자바는 클래스의 다중 상속은 허용하지 않지만, 인터페이스는 여러 개를 구현(`implements`)함으로써 다중 상위 타입의 기능을 클래스에 부여할 수 있음

5. 서로 관련된 여러 상수 값들을 하나의 이름으로 묶어 관리하며 코드의 가독성과 안전성을 높이는 데 주로 사용되는 자바의 기능은 무엇일까요?

   a. 열거형(Enum)

   - 열거형(Enum)은 관련된 상수들의 집합을 효과적으로 정의하고 관리하기 위한 특별한 타입임
   - 코드에서 의미를 명확히 하고 오타로 인한 오류를 방지하는 데 유용함

<br/><br/>

## 정리

- 다형성은 같은 타입의 참조자로 여러 형태의 객체를 다룰 수 있게 하는 개념임
- 업캐스팅은 자동으로 이루어지며 안전하지만, 다운캐스팅은 `instanceof`로 확인 후 수행해야 함
- 추상 클래스는 공통 기능을 제공하면서 일부 메서드의 구현을 강제할 수 있음
- 인터페이스는 순수한 명세를 정의하며 다중 구현이 가능함
- 열거형은 타입 안전한 상수 정의 방법으로 가독성과 유지보수성을 높여줌
- 이러한 기능들은 프레임워크 설계와 유연한 코드 작성의 기반이 됨

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2 강의](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
