---
title: '[독하게 시작하는 Java Part 2]  JVM 기본 이론'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-06 13:00:00 +0900
category: [Language, Java]
tags: [java, jvm, garbage-collection, class-loader, heap, stack, memory-management]
math: false
---
# JVM 기본 이론

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 Java와 C++의 메모리 관리 차이, JVM의 구성 요소와 클래스 로딩 과정, 런타임 데이터 영역의 구조, 가비지 컬렉션의 동작 원리를 학습하며 JVM 내부 메커니즘을 정리함

<br/><br/>

## Java와 C++의 메모리 관리 차이

### C++ 메모리 관리

- 객체에 대한 모든 관리 책임이 개발자에게 있음
- 소유권, 메모리 할당 및 해제를 직접 관리해야 함
- 객체의 생명주기에 모두 개입하는 구조임

### Java 메모리 관리

- 객체 메모리 해제는 전적으로 JVM의 몫임
- 개발자에게는 소유권도 책임도 없음
- Garbage Collector가 자동으로 메모리를 관리함

### 주요 차이점

- C++는 명시적 메모리 관리로 성능은 높지만 메모리 누수 위험이 있음
- Java는 자동 메모리 관리로 안전하지만 GC로 인한 성능 오버헤드가 있음
- 문제 발생 시 JVM 구조를 알아야 적절한 대응이 가능함

<br/><br/>

## JVM 구성 요소

### 전체 구조

### 전체 구조

- **전체 구조**
  ![JVM Architecture](/assets/img/java-part2/jvm/jvm_architecture.png)
  - **Class Loader**
    - 클래스 파일을 로드하고 링크하여 초기화함
  - **Runtime Data Area**
    - JVM이 프로그램을 수행하기 위해 OS로부터 할당받은 메모리 공간
  - **Execution Engine**
    - 로드된 클래스의 바이트코드를 실행하는 엔진 (Interpreter, JIT, GC)

### 프로세스 메모리 구조

- **프로세스 메모리 구조**
  - `User Mode Process (JVM)`
    - **Stack**
      - 스레드 제어 및 실행 정보
    - **Heap Area**
      - 객체 및 인스턴스 저장
    - **Method Area**
      - 클래스 정보 및 상수 저장

<br/><br/>

## 클래스 로더

### 역할

- **역할**

  - 이름을 알고 있는 특정 클래스에 대한 정의(Byte stream)를 가져오는 역할을 수행함
  - 계층적 구조로 되어 있으며 **위임 모델**을 따름
    - 하위 로더가 상위 로더에게 로딩을 위임하는 방식
    - **동작 방식**
      - Application → Platform → Bootstrap 순으로 위임 후, 상위가 실패하면 하위가 로드 시도
    - **장점**
      - 핵심 클래스 무결성 보장 및 중복 로드 방지

- **클래스 로더 종류**

  - **부트스트랩 클래스 로더(Bootstrap Class Loader)**
    - JVM에서 라이브러리로 취급되는 핵심 클래스를 로드함
    - `rt.jar`, `tools.jar` 등을 담당함
    - HotSpot에서는 C++로 구현됨
  - **플랫폼 클래스 로더(Platform Class Loader)**
    - 기존 확장 클래스 로더를 대체함
    - 클래스 라이브러리를 로드함
    - `java.sql`, `java.xml` 등의 모듈을 담당함
  - **애플리케이션 클래스 로더(Application Class Loader)**
    - `sun.misc.Launcher$AppClassLoader`를 의미함
    - 사용자가 작성한 애플리케이션 클래스를 로드함
    - ClassPath에 지정된 클래스를 담당함

- **담당 모듈**
  - **Bootstrap**
    - `java.base`, `java.desktop`, `java.logging`, `java.naming`
  - **Platform**
    - `java.compiler`, `java.sql`, `java.xml`, `java.security.auth`
  - **Application**
    - `jdk.compiler`, `jdk.hotspot.agent`, `jdk.jartool`, `jdk.jcmd`

<br/><br/>

## 클래스 로딩 과정

### 로딩 단계

- **로딩 단계**

  ![Class Loading Process](/assets/img/java-part2/jvm/class_loading_process.png)

  - `Loading` → `Linking` (`Verification` → `Preparation` → `Resolution`) → `Using`(`Initialization` → `Using`) → `Unloading`

- **Loading(로딩)**

  - 바이트코드를 읽어 힙 영역에 `java.lang.Class` 인스턴스(메타데이터)를 생성함
  - 클래스 파일의 바이너리 데이터를 메서드 영역에 저장함

- **Verification(검증)**

  - JVM 명세가 정하는 규칙과 제약을 만족하는지 확인함
  - 파일 형식(`.class`), 메타데이터, 바이트코드, 심벌 참조를 검증함
  - 보안 위협에 대한 검증도 포함함

- **Preparation(준비)**

  - `java.lang.Class` 인스턴스가 힙 영역에 생성됨
  - 클래스 변수(정적 멤버) 메모리를 0으로 초기화함
  - `final` 선언된 변수는 코드에서 정의한 초깃값으로 설정됨

- **Resolution(해석)**

  - 상수 풀의 심볼 참조를 직접 참조로 대체함
  - 두 가지 방식
    - **Eager Resolution**
      - 로딩 시점에 즉시 수행
    - **Lazy Resolution**
      - 실제 사용 시점까지 지연 (일반적)
  - **주의**
    - Resolution과 **동적 바인딩**(Dynamic Binding)은 구별됨
    - Resolution은 심볼을 주소로 바꾸는 과정 (Linking/Loading)
    - 동적 바인딩은 런타임에 실제 객체 타입에 따라 메서드를 결정하는 메커니즘 (vtable 사용)

- **Initialization(초기화)**
  - 정적 필드에 실제 값을 할당함
  - `static` 블록을 실행함

### 런타임 로딩의 장점

- 클래스 로딩 및 링킹 과정이 모두 런타임에 이루어짐
- 실행 성능이 일부 저하될 수 있으나 높은 확장성과 유연성을 제공하는 근간이 됨
- 인터페이스만 맞으면 런타임에 구현 클래스를 결정하지 않을 수 있음
- 클래스 로더는 실행할 프로그램 코드를 네트워크로 수신하는 것도 가능함

<br/><br/>

## 힙 영역에서의 객체 생성

### 생성 과정

1. **클래스 로딩 확인**
   - 해당 클래스가 이미 로드되었는지 확인하고, 없으면 로딩 수행
2. **메모리 할당**
   - 힙에서 객체 크기만큼 메모리 확보 (Bump-the-Pointer, Free List)
   - 멀티스레드 환경에서는 TLAB(Thread Local Allocation Buffer) 사용하여 동기화 오버헤드 감소
3. **메모리 초기화**
   - 할당된 메모리를 0으로 초기화 (객체 헤더 제외)
4. **객체 헤더 설정**
   - Mark Word(해시코드, 락 정보 등)와 Class Pointer 설정
5. **생성자 실행**
   - 실제 생성자 메서드(`<init>`)를 호출하여 필드 초기화 및 `super()` 호출

<br/><br/>

## 클래스 파일 구조

### 클래스 파일 기본 구조

```
lassFile {
 u4                 magic;
 u2                 minor_version;
 u2                 major_version;
 u2                 constant_pool_count;
 cp_info            constant_pool[constant_pool_count-1];
 u2                 access_flags;
 u2                 this_class;
 u2                 super_class;
 u2                 interfaces_count;
 u2                 interfaces[interfaces_count];
 u2                 fields_count;
 field_info         fields[fields_count];
 u2                 methods_count;
 method_info        methods[methods_count];
 u2                 attributes_count;
 attribute_info     attributes[attributes_count];
}
```

- **주요 구성 요소**

  1. **매직 넘버 (Magic Number)**
     - `0xCAFEBABE`, 클래스 파일 식별자
  2. **버전 정보**
     - Java 컴파일러 버전 (major, minor)
  3. **상수 풀 (Constant Pool)**
     - 클래스의 모든 상수(문자열, 참조 등) 저장
  4. **접근 제어자 (Access Flags)**
     - public, abstract, final 등 정보
  5. **클래스 정보**
     - this_class, super_class, interfaces
  6. **필드 및 메서드**
     - 클래스의 변수와 함수 정의
  7. **속성 (Attributes)**
     - 메타데이터 및 디버깅 정보

- **매직 넘버 (0xCAFEBABE)**
  - 해당 파일이 Java Virtual Machine에 의해 실행 가능한 클래스 파일임을 나타내는 식별자
  - 컴파일러가 생성한 파일의 유효성을 가장 먼저 확인하는 장치

<br/><br/>

## Runtime Data Area

### Method Area

- **역할**

  - JVM이 읽어 들인 **각종 타입 정보, 상수, 정적 변수 정보가 저장**되는 영역임
  - JIT(Just In Time) 컴파일러가 번역한 기계어 코드를 캐싱하기 위한 메모리 공간으로 활용됨

- **Metaspace (Java 8+)**
  - Java 7 이전의 PermGen은 논리적으로는 JVM 힙의 일부로 간주되었으나 물리적으로는 별도 영역이었고, Java 8 이후의 Metaspace는 **Native Memory**를 사용함 (Heap 외부)
  - JVM 힙 크기 제한에서 벗어나 OS 레벨의 가용 메모리를 동적으로 활용할 수 있게 됨
  - **장점**
    - 클래스 메타데이터 공간이 동적으로 확장되어 `OutOfMemoryError: PermGen space` 해결
  - **주의**
    - OS 메모리가 허용하는 한도까지 늘어날 수 있으므로 `MaxMetaspaceSize` 설정 필요

### Runtime Constant Pool

- 클래스 버전, 필드, 메서드, 인터페이스 등 클래스 파일에 포함된 정보가 저장됨
- 각종 리터럴, 심볼 참조가 저장되는 영역임
- 클래스 로더가 클래스를 로드할 때 상기 정보들을 저장함
- 동적으로 운영되며 런타임에 새로운 상수가 추가될 수 있음

- Constant Pool 확인

  - `javap -v ClassName` 명령어로 상수 풀 정보를 확인할 수 있음

    ```bash
    javap -v Main

    Constant pool:
    #1 = Methodref   #2.#3     // java/lang/Object."<init>":()V
    #2 = Class       #4        // java/lang/Object
    #7 = Fieldref    #8.#9     // java/lang/System.out:Ljava/io/PrintStream;
    #13 = String     #14       // Hello
    #15 = Methodref  #16.#17   // java/io/PrintStream.println:(Ljava/lang/String;)V
    ```

### Stack Area

- **구조**

  - 지역변수 테이블, 피연산자 스택, 메서드 반환값 등을 저장함
  - C/C++의 Stack보다 더 복잡한 구조를 가짐
  - 스레드별로 독립적으로 생성됨

- **지역변수 테이블**
  - 슬롯으로 이루어지며 기본형 변수 하나가 슬롯 한 개(혹은 2개)를 사용함
  - Java 스택의 크기는 메모리 용량이 아니라 슬롯의 개수로 측정됨
  - JVM이 허용하는 스택의 크기를 초과할 경우 `StackOverflowError` 발생함

### Stack Frame 구조

- **Stack Frame 구조**

  ![Stack Frame Structure](/assets/img/java-part2/jvm/stack_frame_structure.png)

  - **구성 요소**
    - **지역변수 테이블(Local Variable Table)**
      - 메서드의 인자와 지역변수 저장
    - **피연산자 스택(Operand Stack)**
      - 연산 과정의 중간 결과 저장
    - **동적 링크(Dynamic Link)**
      - 런타임 상수 풀에 대한 참조
    - **반환 주소(Return Address)**
      - 메서드 완료 후 돌아갈 위치

- **특징**

  - **지역변수 테이블(Local Variable Table)**

  - 메서드의 지역변수와 매개변수를 저장함
  - **인스턴스 메서드**
    - 0번 인덱스에 `this` 참조가 저장되고, 1번부터 매개변수가 할당됨
  - **정적 메서드 (static)**
    - 인스턴스 참조가 없으므로 0번 인덱스부터 실제 매개변수가 할당됨
  - 매개변수와 지역변수가 순차적으로 할당됨

### Native Method Stack

- C++로 개발된 Native 코드(함수 단위)가 실행될 때 사용하는 스택 메모리임
- 지역변수 및 자동변수가 사용하는 스택 메모리임
- 구현하기에 따라 JVM stack과 합쳐서 사용하기도 함

### Heap Area

- **역할**

  - GC(Garbage Collector)가 관리하는 메모리 영역임
  - Java에서 사용되는 객체의 인스턴스 및 배열이 저장되는 공간임
  - 설정에 따라 크기를 변경하거나 고정할 수 있음

- **OutOfMemoryError**

  - 힙 메모리가 부족할 경우 발생함
  - JVM 옵션으로 최대 힙 크기를 조정할 수 있음

- **세대별 구조**
  - 세대별 컬렉션 이론(Generational Collection Theory)을 기반으로 설계됨
  - **Young Generation**
    - Eden, Survivor 0/1 영역
  - **Old Generation**
    - 장기 생존 객체 보관
  - **참고**
    - PermGen(Java 7 이전)은 힙과 논리적으로 연결되었으나 물리적으로 분리되었고, Metaspace(Java 8+)는 힙 외부에 존재함

<br/><br/>

## Garbage Collection

### 개념

- 힙 영역에서 참조되지 않는 객체를 수집 및 제거해 메모리를 회수함
- 프로그램 실행 중 자동으로 수행되어 메모리 누수를 방지함

### GC 종류

- **Minor GC**

  - Young Generation에서 발생함
  - **트리거 조건**
    - Eden 영역이 가득 찼을 때 발생함
  - **특징**
    - 일반적으로 수 밀리초 ~ 수십 밀리초 내로 완료됨
  - 상대적으로 짧은 Stop-The-World 발생함

- **Major/Full GC**
  - Old Generation을 포함한 전체 힙을 수집함
  - 수 초 이상 진행되기도 함
  - 긴 Stop-The-World로 인해 DB 연결이 끊기는 등 운영 문제가 발생할 수 있음

### Stop-The-World

- GC 수행 시 애플리케이션이 일시 정지되는 현상임
- 모든 GC에서 발생하지만 시간이 다름
- GC 튜닝의 주요 목표는 이 시간을 최소화하는 것임

### GC가 처리해야할 문제의 핵심 3요소

1. **회수 대상 메모리를 판단하는 기준**

   - 참조되지 않는 객체를 식별하는 알고리즘

2. **메모리 회수 시점**

   - 언제 GC를 수행할 것인지 결정

3. **구체적인 메모리 회수 방법**
   - Mark and Sweep, Compaction 등의 알고리즘

### JVM Heap 영역 구조

- **JVM Heap 영역 구조**

  - ![Heap Structure](/assets/img/java-part2/jvm/heap_structure_diagram.png)
  - **Young Generation**
    - **Eden**: 새로운 객체가 최초로 생성되는 공간
    - **Survivor 0/1**: Minor GC 후 살아남은 객체가 이동하는 공간
  - **Old Generation**
    - Minor GC 과정을 여러 번(Threshold 도달) 생존한 객체가 이동하는 공간
    - Major/Full GC의 대상이 됨

<br/><br/>

## GC 기술의 역사

### 시작

- Java에서 (거의) 모든 인스턴스는 힙 영역에 저장됨
- Garbage Collection 기술은 1960년대 리스프(Lisp)에서 시작됨
- 리스프 창시자 존 맥카시(John McCarthy)가 제안한 개념임

### 발전

- 초기에는 단순한 Mark and Sweep 알고리즘 사용
- 현재는 다양한 GC 알고리즘이 존재함
  - **Serial GC**
    - 단일 스레드, 소형 앱 적합
  - **Parallel GC**
    - 멀티 스레드, 처리량(Throughput) 중심
  - **CMS GC**
    - 응답 시간(Latency) 중심 (Deprecated)
  - **G1 GC**
    - Region 단위 메모리 관리, 예측 가능한 중단 시간 (Java 9+ 기본)
  - **ZGC / Shenandoah**
    - 초저지연 대용량 처리 목표

<br/><br/>

## 주요 JVM 옵션 예시

### 힙 메모리 설정

```bash
# 초기 힙 크기 512MB
java -Xms512m MyApp

# 최대 힙 크기 2GB
java -Xmx2g MyApp

# 초기와 최대를 같게 설정 (권장)
java -Xms1g -Xmx1g MyApp
```

### GC 로그 활성화

```bash
# GC 로그 출력
java -Xlog:gc* -jar MyApp.jar

# 상세 GC 로그
java -Xlog:gc*:file=gc.log:time,uptime,level,tags MyApp
```

### GC 선택

```bash
# G1 GC 사용
java -XX:+UseG1GC -jar MyApp.jar

# ZGC 사용 (Java 11+)
java -XX:+UseZGC -jar MyApp.jar
```

### Metaspace 설정

```bash
# Metaspace 최대 크기 256MB
java -XX:MaxMetaspaceSize=256m MyApp
```

<br/><br/>

## 연습 문제

1.  Java와 C++의 메모리 관리 방식 차이는 무엇일까요?

    a. Java는 GC가 자동 관리, C++는 개발자가 직접 관리

    - Java는 JVM의 가비지 컬렉터가 더 이상 사용되지 않는 메모리를 자동으로 정리하지만, C++은 개발자가 직접 메모리를 할당하고 해제해야 하는 차이가 있음

2.  Java 컴파일 결과물인 바이트코드(.class 파일)의 역할은 무엇일까요?

    a. JVM이 이해하고 실행하는 플랫폼 독립적인 중간 표현 형식입니다.

    - 바이트코드는 JVM이 이해하도록 컴파일된 중간 언어임
    - 덕분에 Java는 다양한 운영체제에서 동일한 코드 실행이 가능함

3.  JVM의 런타임 데이터 영역 중 객체 인스턴스와 배열이 저장되는 공간은 어디일까요?

    a. 힙 영역 (Heap Area)

    - `new` 연산자를 통해 생성된 객체 인스턴스와 배열은 힙 영역에 저장됨
    - 이 영역은 가비지 컬렉터에 의해 관리됨

4.  JVM에서 클래스 로더(Class Loader)가 하는 가장 중요한 역할은 무엇일까요?

    a. .class 파일을 읽어 JVM 메모리에 적재하고 사용할 수 있게 준비합니다.

    - 클래스 로더는 자바의 `.class` 파일 형태의 바이트코드를 찾아 읽어들여 JVM의 런타임 메모리 영역에 로딩하고 링크하는 과정을 수행함

5.  자바의 가비지 컬렉션(GC)이 필요한 주된 이유는 무엇일까요?

    a. 더 이상 유효하지 않은 객체가 점유하는 메모리를 자동으로 회수하기 위해

    - GC는 개발자의 명시적인 메모리 해제 없이, JVM이 스스로 판단하여 더 이상 참조되지 않아 접근할 수 없는 객체의 메모리를 회수함

<br/><br/>

## 정리

- Java는 JVM이 메모리를 자동 관리하여 C++보다 안전하지만 GC 오버헤드가 있음
- 클래스 로더는 계층적 구조로 되어 있으며 런타임에 동적으로 클래스를 로드함
- 클래스 로딩은 Loading → Linking(Verification, Preparation, Resolution) → Initialization 단계를 거침
- Runtime Data Area는 Method Area, Heap, Stack, PC Register, Native Method Stack으로 구성됨
- Method Area는 Java 8부터 네이티브 메모리의 Metaspace에서 관리됨
- Stack은 스레드별로 독립적이며, 인스턴스 메서드는 0번에 `this`를, 정적 메서드는 0번부터 매개변수를 저장함
- Heap은 세대별로 관리되며 Young과 Old Generation으로 구분됨
- GC는 Minor GC와 Major/Full GC로 나뉘며 Stop-The-World 현상이 발생함
- GC 튜닝의 핵심은 Stop-The-World 시간을 최소화하는 것임

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
