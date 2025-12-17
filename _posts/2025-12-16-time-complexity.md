---
title: 시간 복잡도란?
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-16 00:00:00 +0900
category:
  - [Computer Science, Algorithm]
tags: [algorithm, big-o]
math: true
mermaid: true
---

## 개요

- 시간 복잡도는 알고리즘이 문제를 해결하는 데 걸리는 시간과 입력 크기의 함수 관계를 나타내는 개념임
- 입력 크기가 증가함에 따라 알고리즘의 실행 시간이 어떻게 증가하는지를 측정함
- 같은 결과를 내는 여러 알고리즘이 있을 때 시간 복잡도가 낮은 알고리즘이 더 효율적임

</br>

## 시간 복잡도를 측정하는 이유

- 실제 실행 시간은 하드웨어, 프로그래밍 언어, 컴파일러 등 여러 환경 요소에 의존하기 때문에 직접 측정하기 어려움
- 대신 알고리즘이 수행하는 기본 연산의 횟수로 시간을 평가함
- 기본 연산에는 데이터 입출력, 산술 연산, 비교 연산, 대입 연산 등이 포함됨
- 일반적으로 1억 번의 연산을 약 1초의 시간으로 간주하여 예측함


</br>

## Big-O 표기법

- Big-O 표기법은 알고리즘의 시간 복잡도를 나타내는 가장 표준적인 방식임
- 실행 시간의 상한선을 나타내며, 최고차항만 남기고 계수와 낮은 차수의 항들을 제거함

### 표기 규칙

- 최고차항만 유지 - 가장 높은 차수의 항만 남기고 낮은 차수 항들을 제거
- 계수 생략 - 최고차항의 계수를 생략
- 상수 제외 - 상수 항은 시간 복잡도 계산에서 제외

### 변환 예시

- $T(n) = n^2 + 2n + 1$ → $O(n^2)$
- $T(n) = 2n$ → $O(n)$
- $T(n) = 4n + 5$ → $O(n)$
- $T(n) = 3n^2 + 5n + 10$ → $O(n^2)$


</br>

## 시간 복잡도 표기법

### 빅-오메가 (Ω(n))

- 최선일 때(best case)의 연산 횟수를 나타낸 표기법
- 알고리즘이 가장 빠르게 실행될 때의 성능을 나타냄

### 빅-세타 (Θ(n))

- 보통일 때(average case)의 연산 횟수를 나타낸 표기법
- 알고리즘의 평균적인 성능을 나타냄

### 빅-오 (O(n))

- 최악일 때(worst case)의 연산 횟수를 나타낸 표기법
- 엄밀히 말하면 알고리즘의 점근적 상한선(Asymptotic Upper Bound)을 의미함
- 입력 데이터의 상태와 관계없이 실행 시간이 이를 넘지 않음을 보장함
- 일반적으로 최악의 경우 성능을 표현할 때 Big-O 표기법을 사용함

### 코딩 테스트에서의 활용

- 빅-오 표기법(O(n))을 기준으로 수행 시간을 계산하는 것이 좋음
- 실제 테스트는 다양한 테스트 케이스를 수행해 모든 케이스를 통과해야 합격함
- 따라서 시간 복잡도를 판단할 때는 항상 최악일 때를 염두에 둬야 함


</br>

## 주요 시간 복잡도 종류

- 성능이 좋은 순서대로 정렬하면 다음과 같음

$$O(1) < O(\log n) < O(n) < O(n \log n) < O(n^2) < O(2^n) < O(n!)$$

- 오른쪽으로 갈수록 시간 복잡도가 크고 실행 시간이 길어짐

![Time Complexity Comparison](/assets/img/algorithm/Time_Complexity_Comparison__How_Different_Algorithms_Scale_with_Input_Size.png)



### $O(1)$ - 상수 시간 (Constant Time)

-입력 크기에 관계없이 일정한 시간에 실행되는 알고리즘
- 가장 효율적인 시간 복잡도
- 배열의 인덱스를 사용한 접근, 해시 테이블 조회 등에 사용

```java
int getFirstElement(int[] array) {
    return array[0];  // 배열의 크기와 상관없이 항상 O(1)
}

int getValueByKey(HashMap<String, Integer> map, String key) {
    return map.get(key);  // 해시맵 조회는 평균적으로 O(1)
    // 해시 충돌이 많이 발생하면 최악의 경우 O(N) 또는 O(log N)까지 느려질 수 있음
}
```



### $O(\log n)$ - 로그 시간 (Logarithmic Time)

- 입력 데이터 크기가 커질수록 처리 시간이 로그 함수만큼 증가함
- 입력값이 2배가 되면 연산 단계는 1단계만 증가함
- 이진 탐색, 힙 삽입/삭제, 균형 이진 트리 연산 등에 사용

```java
// 이진 탐색 (Binary Search)
int binarySearch(int[] sortedArray, int target) {
    int left = 0, right = sortedArray.length - 1;
    
    while (left <= right) {
        int mid = (left + right) / 2;
        
        if (sortedArray[mid] == target) 
            return mid;
        
        if (sortedArray[mid] < target) 
            left = mid + 1;
        else 
            right = mid - 1;
    }
    return -1;
}
```



### $O(n)$ - 선형 시간 (Linear Time)

- 입력 크기와 실행 시간이 선형 관계를 가짐
- 문제 해결을 위한 단계 수와 입력 데이터 크기가 1:1 관계임
- 단일 반복문이 전형적인 예

```java
// 배열의 모든 요소 출력
void printAllElements(int[] array) {
    for (int i = 0; i < array.length; i++) {
        System.out.println(array[i]);  // O(n)
    }
}

// 배열에서 최댓값 찾기
int findMax(int[] array) {
    int max = array[0];
    for (int i = 1; i < array.length; i++) {
        if (array[i] > max) {
            max = array[i];
        }
    }
    return max;  // O(n)
}
```



### $O(n \log n)$ - 선형 로그 시간 (Linearithmic Time)

- 입력 데이터 크기가 커질수록 처리 시간이 $n \log n$ 배로 증가함
- 입력값이 10배 증가하면 시간은 약 20배 증가함
- 병합 정렬, 퀵 정렬(평균), 힙 정렬 등에 사용

```java
// 병합 정렬 (Merge Sort)
void mergeSort(int[] array, int left, int right) {
    if (left < right) {
        int mid = (left + right) / 2;
        
        mergeSort(array, left, mid);      // 왼쪽 절반 정렬
        mergeSort(array, mid + 1, right); // 오른쪽 절반 정렬
        merge(array, left, mid, right);    // 병합
    }
}

void merge(int[] array, int left, int mid, int right) {
    // 병합 로직 (O(n))
}
```



### $O(n^2)$ - 제곱 시간 (Quadratic Time)

- 이중 반복문 내에서 입력 데이터를 처리할 때 나타남
- 버블 정렬, 삽입 정렬, 선택 정렬 같은 기초적인 정렬 알고리즘에 해당됨
- 입력 크기가 커지면 급격히 느려짐

```java
// 버블 정렬 (Bubble Sort)
void bubbleSort(int[] array) {
    int n = array.length;
    for (int i = 0; i < n; i++) {           // O(n)
        for (int j = 0; j < n - 1; j++) {   // O(n)
            if (array[j] > array[j + 1]) {
                // 교환
                int temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }  // O(n^2) 총 시간 복잡도
    }
}
```



### $O(n^3)$ - 세제곱 시간 (Cubic Time)

- 3중 반복문을 돌게 되는 알고리즘
- 삼중 반복문 구조에서 나타나며 일반적으로 권장되지 않음
- 행렬 곱셈의 단순 구현 등에 사용

```java
// 행렬 곱셈
void matrixMultiplication(int[][] A, int[][] B, int[][] C, int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            for (int k = 0; k < n; k++) {
                C[i][j] += A[i][k] * B[k][j];  // O(n^3)
            }
        }
    }
}
```



### $O(2^n)$ - 지수 시간 (Exponential Time)

- 입력 크기에 따라 실행 시간이 지수적으로 증가함
- 매우 비효율적이며 작은 입력 크기에서도 빠르게 실행 불가능함
- 재귀 피보나치 수열 계산, 부분 집합 생성 등에 사용

```java
// 재귀 피보나치 (비효율적인 예시)
int fibonacci(int n) {
    if (n <= 1) 
        return n;
    return fibonacci(n - 1) + fibonacci(n - 2);  // O(2^n)
    // 동적 계획법(DP)이나 메모이제이션을 사용하면 O(n)으로 개선 가능함
}
```

</br>

## 시간 복잡도 계산 방법

- 시간 복잡도를 구하는 과정은 다음과 같음

### 기본 원칙

- 상수는 시간 복잡도 계산에서 제외함
- 가장 많이 중첩된 반복문의 수행 횟수가 시간 복잡도의 기준이 됨

### 단계별 프로세스

- 1단계 - 알고리즘의 기본 연산 실행 횟수를 파악하고 시간 함수를 도출함
- 2단계 - 가장 높은 차수의 항만 남기고 낮은 차수 항들을 제거함
- 3단계 - 최고차항의 계수를 생략하고 Big-O 표기법으로 표현함

### 계산 흐름

- 어떤 알고리즘이 $4n + 5$번 연산을 수행한다면
    - 1단계: $T(n) = 4n + 5$
    - 2단계: 최고차항만 남기기 → $4n$
    - 3단계: 계수 제거 → $O(n)$

### 연산 횟수 N vs 3N

```java
// 연산 횟수가 N인 경우
public class 시간복잡도_판별원리1 {
    public static void main(String[] args) {
        int N = 100000;
        int cnt = 0;
        for (int i = 0; i < N; i++) {
            System.out.println("연산 횟수:" + cnt++);
        }
    }
}

// 연산 횟수가 3N인 경우
public class 시간복잡도_판별원리2 {
    public static void main(String[] args) {
        int N = 100000;
        int cnt = 0;
        for (int i = 0; i < N; i++) {
            System.out.println("연산 횟수:" + cnt++);
        }
        for (int i = 0; i < N; i++) {
            System.out.println("연산 횟수:" + cnt++);
        }
        for (int i = 0; i < N; i++) {
            System.out.println("연산 횟수:" + cnt++);
        }
    }
}
```

- 두 코드는 연산 횟수가 3배 차이 남
- 코딩 테스트에서는 일반적으로 상수를 무시하므로 두 코드 모두 시간 복잡도는 $O(n)$으로 동일함

### 연산 횟수 N²

```java
public class 시간복잡도_판별원리3 {
    public static void main(String[] args) {
        int N = 100000;
        int cnt = 0;
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                System.out.println("연산 횟수:" + cnt++);
            }
        }
    }
}
```

- 이중 for 문이 전체 코드의 시간 복잡도 기준이 됨
- 만약 일반 for 문이 10개 더 있다 하더라도 도출 원리에 따라 시간 복잡도는 변함없이 $O(n^2)$으로 유지됨

</br>

## 계산 시 고려사항

### 순차적 반복문

- 두 개의 서로 다른 단일 반복문을 순차적으로 사용하면 $O(n + m) \to O(n)$ (m ≤ n인 경우)가 됨

```java
for (int i = 0; i < n; i++) {
    // O(n) 연산
}
for (int i = 0; i < m; i++) {
    // O(m) 연산
}
// 총 시간 복잡도: O(n + m) → O(n) (m ≤ n인 경우)
```

### 중첩 vs 순차

- 여러 루프를 사용할 때 중첩 여부가 중요함
- 중첩된 반복문은 곱셈으로 계산됨 (예: $O(n) \times O(n) = O(n^2)$)
- 순차적 반복문은 덧셈으로 계산됨 (예: $O(n) + O(n) = O(n)$)

### 절반 반복

- 반복문이 입력 크기의 절반 이상을 반복해도 상수는 제거됨

```java
for (int i = 0; i < n/2; i++) {
    // 연산
}
// O(n/2) → O(n)
```

### 다중 입력

- 입력이 두 개 이상인 경우 각각을 고려해야 함

```java
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        // 연산
    }
}
// O(n × m) - n과 m이 독립적이면 단순화하지 않음
```



</br>

## 알고리즘 선택 기준

### 배열에서 중복 찾기

- 시간 제한
  - 1초
- 데이터의 크기
  - $N$ $(1 \le N \le 100,000)$

### 판단 공식

- 연산 횟수
  - 알고리즘 시간 복잡도 × 데이터의 크기
- 시간 제한이 1초이므로 1억 번 이하의 연산 횟수로 문제를 해결해야 함

### 알고리즘 비교

- 이중 반복문 방식 ($O(n^2)$)
  - 연산 횟수
    - $(100,000)^2 = 10,000,000,000 > 100,000,000$
  - 부적합 알고리즘
- 해시셋 사용 방식 ($O(n)$)
  - 연산 횟수
    - $100,000 \approx 100,000 < 100,000,000$
  - 적합 알고리즘

- 시간 복잡도 분석으로 문제에서 사용할 수 있는 알고리즘을 선택할 수 있음
- 데이터의 크기(N)를 단서로 사용해야 하는 알고리즘을 추측하는 것이 가능함



</br>

## 코드 로직 최적화

- 시간 복잡도는 작성한 코드의 비효율적인 로직을 개선하는 바탕이 됨
- 코드의 시간 복잡도를 도출하여 시간 초과 발생 원인을 파악할 수 있음
- 문제가 되는 코드 부분을 도출하고 연산에 더욱 효율적인 구조로 수정하여 문제를 해결할 수 있음

### 개선 프로세스

- 현재 코드의 시간 복잡도 분석
- 병목 지점 파악 (가장 많은 연산이 발생하는 부분)
- 더 효율적인 알고리즘이나 자료구조로 대체
- 개선된 코드의 시간 복잡도 재계산

### 시간-공간 트레이드오프

- 시간 복잡도를 개선하면 공간 복잡도(메모리 사용량)가 증가하는 트레이드오프 관계가 있음
- 예를 들어 동적 계획법으로 시간을 줄이면 메모이제이션용 메모리가 추가로 필요함
- 해시맵을 사용해 탐색 시간을 줄이면 추가 저장 공간이 필요함
- 문제의 제약 조건에 따라 시간과 공간 중 어느 것을 우선할지 판단해야 함



</br>

## 정리

- 시간 복잡도는 알고리즘이 문제를 해결하는 데 걸리는 시간과 입력 크기의 함수 관계를 나타내는 개념임
- 기본 연산의 횟수로 시간을 평가하며, 일반적으로 1억 번의 연산을 약 1초로 간주함
- Big-O 표기법은 알고리즘의 시간 복잡도를 나타내는 가장 표준적인 방식으로, 최고차항만 유지하고 계수와 상수를 제외함
- 주요 시간 복잡도는 $O(1), O(\log n), O(n), O(n \log n), O(n^2), O(n^3), O(2^n)$ 등이 있음
- 시간 복잡도 분석을 통해 문제에 적합한 알고리즘을 선택하고 코드 로직을 최적화할 수 있음
- 백엔드 개발, 분산 시스템 설계, 대규모 데이터 처리 등 실무에서도 활용됨

</br>

## Reference

- [Do it! 알고리즘 코딩 테스트 - 자바 편](https://www.yes24.com/product/goods/148122935)
