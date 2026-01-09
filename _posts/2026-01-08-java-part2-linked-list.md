---
title: "독하게 시작하는 Java Part 2 - 연결 리스트와 객체 지향 설계"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2026-01-08 05:00:00 +0900
category:
  - [Language, Java]
tags: [java, data structure, linked list, iterator, design pattern, oop]
math: false
---

# 연결 리스트와 객체 지향 설계

- 널널한 개발자님의 독하게 시작하는 Java Part 2에서 연결 리스트의 기본 개념부터 시작하여, 이를 객체지향적으로 리팩토링하며 Iterator 패턴과 프레임워크 구조로 발전시키는 과정을 정리함

<br/><br/>

## 연결 리스트 (Linked List)

### 연결 리스트의 구조와 특징

- **구조**

  - 데이터를 담고 있는 노드(Node)들이 포인터(참조)로 서로 연결된 형태임
  - 각 노드는 데이터(`Data`)와 다음 노드를 가리키는 주소(`Next`)를 가짐

  ![Linked List Structure](/assets/img/java-part2/linked-list/linked-list-structure.png)

- **배열과의 차이점**
  - 배열은 메모리가 연속적이지만, 연결 리스트는 불연속적으로 흩어져 있을 수 있음
  - **삽입/삭제의 효율성**
    - 배열: 중간 요소를 삭제하거나 추가할 때 뒤의 요소들을 모두 이동시켜야 하므로 비용이 큼
    - 연결 리스트: 요소의 이동 없이 **연결 고리(Next 포인터)만 변경**하면 되므로 매우 효율적임

### 연결 리스트의 동작 원리

- **새 노드 추가**

  - 새로운 노드를 생성하고, 이전 노드의 `Next`가 새 노드를 가리키게 하며, 새 노드의 `Next`가 기존의 다음 노드를 가리키도록 함

  ![Linked List Add](/assets/img/java-part2/linked-list/linked-list-add.png)

- **노드 삭제**

  - 삭제할 노드의 이전 노드가 삭제할 노드의 다음 노드를 가리키도록 연결을 변경함
  - 삭제된 노드는 더 이상 참조되지 않으므로 가비지 컬렉터(GC)의 대상이 됨

  ![Linked List Delete](/assets/img/java-part2/linked-list/linked-list-delete.png)

<br/><br/>

## 객체 지향 설계

### 객체화 요령

- **관심사의 분리**
  - 자료구조, 사용자 인터페이스(UI), 기능(제어) 로직은 반드시 분리함
- **단위 객체화**
  - 입/출력의 단위가 되는 자료(VO/DTO)는 객체로 정의함
- **관리의 분리**
  - 자료구조 자체와 그 자료구조가 관리하는 대상 데이터를 분리함

![Evolution Graph](/assets/img/java-part2/linked-list/evolution-graph.png)

1. 기초적인 객체화 (기능 분리)

   - 모든 코드가 `main` 함수에 섞여 있던 절차 지향적 방식에서 벗어나, 역할별로 클래스를 분리하는 단계임

2. 컨테이너 구현 (추상화와 일반화)

   - 구체적인 데이터 대신 추상적인 노드를 관리하도록 하여 범용성을 확보하는 단계임

   - **특징**
     - **범용 컨테이너**
       - 로직이 데이터의 구체적인 내용과 분리됨
     - **개방-폐쇄 원칙(OCP)**
       - 새로운 데이터 타입을 추가해도 코드는 수정할 필요가 없음

3. 반복자(Iterator) 패턴 (캡슐화와 무결성)

   - 자료구조의 내부 구현을 완벽히 숨기고, 안전하게 데이터를 순회할 수 있는 방법을 제공함

<br/><br/>

## 반복자(Iterator) 패턴

- 반복자 패턴(Iterator Pattern)은 **컬렉션의 내부 구조를 노출하지 않고, 저장된 모든 요소에 순차적으로 접근할 수 있는 방법을 제공**하는 디자인 패턴임

  ![Iterator Concept](/assets/img/java-part2/linked-list/iterator-concept.png)

### 패턴의 필요성

- **문제점**

  - 리스트, 트리, 그래프 등 다양한 자료구조가 존재하며, 각각 데이터를 저장하는 방식이 다름
  - 클라이언트가 각 자료구조의 **내부 구조를 알아야만** 요소에 접근할 수 있다면 코드가 복잡해짐

  ```java
  // 리스트는 인덱스로 접근
  List<String> list = new ArrayList<>();
  for (int i = 0; i < list.size(); i++) {
      String item = list.get(i);
  }

  // 트리는 별도의 탐색 알고리즘 필요
  Tree<String> tree = new Tree<>();
  // 내부 구조에 의존적인 순회 로직 작성 필요
  ```

- **해결책**

  - **Iterator 인터페이스**로 순회 방법을 통일함

    ```java
    // 어떤 컬렉션이든 동일한 방식으로 순회
    for (String item : collection) {
        System.out.println(item);
    }
    ```

### 패턴의 구조

![Iterator Structure](/assets/img/java-part2/linked-list/iterator-structure.png)

- **Iterator (인터페이스)**
  - 요소를 순회하는 데 필요한 메서드(`hasNext`, `next`)를 정의함
- **ConcreteIterator (구체적 반복자)**
  - 실제 순회 방법을 구현함 (예: `ListIterator`, `TreeIterator`)
- **Collection (인터페이스)**
  - `iterator()` 메서드를 통해 반복자를 생성하고 반환하는 인터페이스
- **ConcreteCollection (구체적 컬렉션)**
  - 실제 반복자 객체를 생성하여 반환함

### Java 구현 예제

```java
// Iterator 인터페이스 (Java 내장)
public interface Iterator<T> {
    boolean hasNext();  // 다음 요소가 있는가?
    T next();           // 다음 요소 반환
}

// 컬렉션 인터페이스
public interface Collection<T> {
    Iterator<T> iterator();  // Iterator 반환
}

// 구체적 구현: List에 대한 반복자
class ListIterator<T> implements Iterator<T> {
    private List<T> list;
    private int currentIndex = 0;

    public ListIterator(List<T> list) {
        this.list = list;
    }

    @Override
    public boolean hasNext() {
        return currentIndex < list.size();
    }

    @Override
    public T next() {
        if (!hasNext()) throw new NoSuchElementException();
        return list.get(currentIndex++);
    }
}
```

### 장점과 단점

- **장점**
  - **단일 책임 원칙(SRP)**
    - 컬렉션은 데이터 저장, Iterator는 순회 역할을 담당하여 책임이 분리됨
  - **확장성**
    - 컬렉션 코드를 수정하지 않고도 새로운 방식의 순회(역순, 필터링 등)를 추가할 수 있음
  - **통일된 인터페이스**
    - List, Set, Tree 등 어떤 자료구조든 동일한 코드로 순회할 수 있음
- **단점**
  - 간단한 컬렉션에 사용하기에는 클래스가 늘어나 복잡도가 증가할 수 있음

<br/><br/>

## 연습 문제

1. 연결 리스트가 배열에 비해 중간 요소 삽입/삭제 시 가지는 주요 장점은 무엇일까요?

   - a. 요소 이동 없이 연결만 변경

   - 연결 리스트는 요소 연결만 변경하면 되지만, 배열은 중간 삽입/삭제 시 많은 요소 이동이 필요해 비효율적임
   - 이 차이를 이해하는 것이 자료구조 선택의 중요한 기준임

2. 절차 지향 코드를 객체 지향으로 변환할 때, 유지보수성을 높이기 위해 분리하는 주요 관심사들에는 무엇이 있을까요?

   - a. 데이터 구조, 사용자 인터페이스, 제어 시스템

   - 객체 지향 변환은 보통 데이터 자체(Data), 이를 관리하는 데이터 구조(Structure), 사용자 입출력을 담당하는 UI, 전체 흐름을 제어하는 부분으로 분리함
   - 이를 통해 각자의 역할에 집중할 수 있음

3. OOP 2단계에서 사용자 데이터(`UserData`)와 리스트 관리 로직(`MyList`)을 분리하기 위해 도입한 추상 데이터 타입(ADT)의 역할은 무엇일까요?

   - a. 데이터 구조가 관리할 대상 데이터의 종류에 독립적으로 동작하게 한다.
   - ADT를 사용하면 `MyList`는 `UserData`의 세부 내용을 몰라도 `MyNode` 인터페이스만으로 데이터를 다룰 수 있음
   - 다른 종류의 데이터도 동일한 `MyList`로 관리 가능해짐

4. 주소록 예제에서 '이름'처럼 데이터 항목을 식별하고 검색/삭제 시 사용되는 고유한 기준을 무엇이라고 할까요?

   - a. 키 (Key)
   - 키는 데이터 구조 내에서 특정 데이터 항목을 빠르고 고유하게 식별하는 데 사용되는 값임
   - 검색이나 삭제 시 기준이 됨

5. 데이터 구조의 내부 구현을 노출하지 않고 데이터 항목에 순차적으로 접근할 수 있도록 하는 디자인 패턴은 무엇이며, 그 주요 장점은 무엇일까요?

   - a. 이터레이터 패턴: 데이터 구조와 순회 로직을 분리하여 유연성을 높인다.
   - 이터레이터는 데이터 구조의 내부 구현을 숨긴 채 외부에서 데이터에 안전하게 접근하고 순회할 수 있도록 돕는 객체임
   - 코드의 결합도를 낮춰줌

<br/><br/>

## 정리

- OOP 리팩토링 단계
  - **1단계 (기능 분리)**
    - 클래스를 나누어 역할을 분리하여야함
  - **2단계 (추상화)**
    - 추상 클래스를 도입하여 다양한 데이터를 담을 수 있는 **범용 컨테이너**로 발전시켜야함
  - **3단계 (반복자)**
    - 자료구조 내부를 숨기고(캡슐화), 반복자를 통해 안전하게 접근하며, 프레임워크 패턴으로 확장성을 확보해야함

<br/><br/>

## Reference

- [독하게 시작하는 Java - Part 2 강의](https://www.inflearn.com/course/%EB%8F%85%ED%95%98%EA%B2%8C-%EC%8B%9C%EC%9E%91%ED%95%98%EB%8A%94-java-part2)
