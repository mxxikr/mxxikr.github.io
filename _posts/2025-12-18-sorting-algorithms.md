---
title: 정렬 알고리즘이란?
date: 2025-12-18 00:00:00 +0900
category:
  - [Computer Science, Algorithm]
tags: [algorithm, sorting, bubble sort, selection sort, insertion sort, merge sort, quick sort, heap sort]
math: true
mermaid: true
---

## 개요

- 정렬 알고리즘은 데이터를 일정한 순서로 배치하는 알고리즘임
- 코딩 테스트와 실무 프로젝트에서 매우 자주 사용됨
- 데이터의 크기와 특성에 따라 적절한 알고리즘을 선택하는 것이 성능을 크게 좌우함

<br/><br/>

## 정렬 알고리즘의 분류

### 비교 정렬

- 데이터 간의 상대적 크기 관계를 비교하여 정렬하는 방식임
- 버블 정렬, 선택 정렬, 삽입 정렬, 병합 정렬, 퀵 정렬, 힙 정렬이 해당됨
- 이론적 하한선은 $O(n \log n)$임

### 비교하지 않는 정렬

- 데이터의 특성을 활용하여 직접 위치를 결정함
- 계수 정렬, 기수 정렬이 해당됨
- 특정 조건에서 $O(n)$까지 가능함

<br/><br/>

## 정렬 알고리즘 성능 비교

| 알고리즘 | 평균 시간 복잡도 | 최악 시간 복잡도 | 최선 시간 복잡도 | 공간 복잡도 | 안정성 |
|---------|----------------|----------------|----------------|------------|--------|
| 버블 정렬 | $O(n^2)$ | $O(n^2)$ | $O(n)$ | $O(1)$ | 안정 |
| 선택 정렬 | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | 불안정 |
| 삽입 정렬 | $O(n^2)$ | $O(n^2)$ | $O(n)$ | $O(1)$ | 안정 |
| 병합 정렬 | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | 안정 |
| 퀵 정렬 | $O(n \log n)$ | $O(n^2)$ | $O(n \log n)$ | $O(\log n)$ | 불안정 |
| 힙 정렬 | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | 불안정 |
| 계수 정렬 | $O(n + k)$ | $O(n + k)$ | $O(n + k)$ | $O(k)$ | 안정 |
| 기수 정렬 | $O(d \times n)$ | $O(d \times n)$ | $O(d \times n)$ | $O(n + k)$ | 안정 |

<br/><br/>

## 주요 정렬 알고리즘

### 버블 정렬

- 인접한 두 요소를 비교하여 크기 순서가 맞지 않으면 교환하는 방식임
- 거품이 수면으로 올라오는 것처럼 큰 요소가 배열의 끝으로 이동함
- 각 패스마다 가장 큰 요소가 맨 뒤로 정렬됨
- 시간 복잡도
    - 평균: $O(n^2)$
    - 최악: $O(n^2)$
    - 최선: $O(n)$
- 공간 복잡도
    - $O(1)$ (추가 메모리 불필요)
- 안정성
    - 안정적임
- 구현이 단순하지만 성능이 매우 떨어짐

```java
void bubbleSort(int[] array) {
    int n = array.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (array[j] > array[j + 1]) {
                // 교환
                int temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                swapped = true;
            }
        }
        // 교환이 없으면 이미 정렬된 상태
        if (!swapped) break;
    }
}
```

<br/><br/>

### 선택 정렬

- 현재 위치부터 끝까지 배열을 탐색하여 최솟값을 찾은 후, 현재 위치의 값과 교환함
- 가장 작은 요소부터 차례로 앞으로 이동함
- 각 패스마다 정렬되지 않은 부분에서 최솟값을 선택함
- 시간 복잡도
    - 모든 경우: $O(n^2)$
- 공간 복잡도
    - $O(1)$
- 안정성
    - 불안정적임
- 버블 정렬보다 교환 횟수가 적어 조금 더 빠름

```java
void selectionSort(int[] array) {
    int n = array.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
        }
        // 최솟값과 교환
        int temp = array[i];
        array[i] = array[minIdx];
        array[minIdx] = temp;
    }
}
```

<br/><br/>

### 삽입 정렬

- 배열의 두 번째 요소부터 시작하여, 각 요소를 이미 정렬된 부분 배열의 올바른 위치에 삽입함
- 카드 게임에서 카드를 정렬하는 방식과 유사함
- 현재 요소를 이미 정렬된 부분과 비교하며 적절한 위치를 찾음
- 시간 복잡도
    - 평균: $O(n^2)$
    - 최악: $O(n^2)$
    - 최선: $O(n)$
- 공간 복잡도
    - $O(1)$
- 안정성
    - 안정적임
- 작은 데이터셋에 효율적이며, 거의 정렬된 상태의 데이터에서 매우 빠름
- 온라인 정렬(streaming data)에 적합함

```java
void insertionSort(int[] array) {
    for (int i = 1; i < array.length; i++) {
        int key = array[i];
        int j = i - 1;
        
        // key보다 큰 요소들을 한 칸씩 뒤로 이동
        while (j >= 0 && array[j] > key) {
            array[j + 1] = array[j];
            j--;
        }
        array[j + 1] = key;
    }
}
```

<br/><br/>

### 병합 정렬

- 분할 정복 기법을 사용함
- 배열을 반으로 나누어 각각 정렬한 후, 정렬된 두 배열을 병합함
- 재귀적으로 배열을 분할하고 결합하는 과정을 반복함

![image](/assets/img/algorithm/image3.png)

- 시간 복잡도
    - 모든 경우: $O(n \log n)$
- 공간 복잡도
    - $O(n)$ (추가 배열 필요)
- 안정성
    - 안정적임
- 항상 일정한 성능을 보장함
- 대규모 데이터셋에 적합하지만 추가 메모리가 필요함

```java
void mergeSort(int[] array) {
    if (array.length <= 1) return;
    
    int mid = array.length / 2;
    int[] left = new int[mid];
    int[] right = new int[array.length - mid];
    
    System.arraycopy(array, 0, left, 0, mid);
    System.arraycopy(array, mid, right, 0, array.length - mid);
    
    mergeSort(left);
    mergeSort(right);
    merge(array, left, right);
}

void merge(int[] array, int[] left, int[] right) {
    int i = 0, j = 0, k = 0;
    
    // 두 배열을 비교하며 병합
    while (i < left.length && j < right.length) {
        array[k++] = left[i] <= right[j] ? left[i++] : right[j++];
    }
    
    // 남은 요소 복사
    while (i < left.length) array[k++] = left[i++];
    while (j < right.length) array[k++] = right[j++];
}
```

<br/><br/>

### 퀵 정렬

- 분할 정복 기법을 사용함
- 피벗(pivot)이라는 기준값을 선택하여 배열을 분할한 후, 각 부분을 재귀적으로 정렬함
- 피벗보다 작은 요소는 왼쪽, 큰 요소는 오른쪽으로 이동함

![image](/assets/img/algorithm/image4.png)

- 시간 복잡도
    - 평균: $O(n \log n)$
    - 최악: $O(n^2)$
    - 최악의 경우는 이미 정렬된 배열이나 역순 배열에서 피벗을 잘못 선택했을 때 발생함
    - 단순히 마지막 요소를 피벗으로 잡을 경우, 정렬된 데이터에서 성능이 급격히 저하됨
    - 실무에서는 난수 분할(Randomized Partition)이나 중앙값(Median-of-Three) 방식을 사용하여 해결함
- 공간 복잡도
    - $O(\log n)$ (재귀 스택)
    - 제자리 정렬(In-place sort)이 가능하여 추가 메모리가 거의 필요 없음
- 안정성
    - 불안정적임
- 대부분의 경우 매우 빠르지만, 피벗 선택이 부적절하면 최악의 성능을 보임
- 평균적으로 가장 많이 사용되는 정렬임

```java
void quickSort(int[] array, int left, int right) {
    if (left < right) {
        int pivot = partition(array, left, right);
        quickSort(array, left, pivot - 1);
        quickSort(array, pivot + 1, right);
    }
}

int partition(int[] array, int left, int right) {
    int pivot = array[right];  // 마지막 요소를 피벗으로 선택
    int i = left - 1;
    
    for (int j = left; j < right; j++) {
        if (array[j] < pivot) {
            i++;
            // 교환
            int temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
    
    // 피벗을 중간 위치로 이동
    int temp = array[i + 1];
    array[i + 1] = array[right];
    array[right] = temp;
    
    return i + 1;
}
```

<br/><br/>

### 힙 정렬

- 최대 힙(max heap)을 구성한 후, 힙의 루트(최댓값)를 배열의 끝으로 이동함
- 나머지 요소들로 다시 힙을 구성하는 과정을 반복함
- 힙 자료구조의 특성을 활용한 정렬임
- 시간 복잡도
    - 모든 경우: $O(n \log n)$
- 공간 복잡도
    - $O(1)$
- 안정성
    - 불안정적임
- 추가 메모리 없이 항상 $O(n \log n)$을 보장함
- 최악의 경우에도 일정한 성능을 유지하지만, 실제로는 퀵 정렬보다 느린 편임

```java
void heapSort(int[] array) {
    int n = array.length;
    
    // 최대 힙 구성
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(array, n, i);
    }
    
    // 힙에서 요소를 하나씩 추출하여 정렬
    for (int i = n - 1; i > 0; i--) {
        // 루트(최댓값)를 끝으로 이동
        int temp = array[0];
        array[0] = array[i];
        array[i] = temp;
        
        // 나머지 요소로 힙 재구성
        heapify(array, i, 0);
    }
}

void heapify(int[] array, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    
    // 왼쪽 자식이 더 크면
    if (left < n && array[left] > array[largest]) {
        largest = left;
    }
    
    // 오른쪽 자식이 더 크면
    if (right < n && array[right] > array[largest]) {
        largest = right;
    }
    
    // 가장 큰 값이 루트가 아니면 교환
    if (largest != i) {
        int temp = array[i];
        array[i] = array[largest];
        array[largest] = temp;
        
        // 재귀적으로 힙 재구성
        heapify(array, n, largest);
    }
}
```

<br/><br/>

## 비교하지 않는 정렬

### 계수 정렬

- 데이터의 크기 범위가 정해져 있을 때, 각 값이 몇 개씩 있는지 세어 정렬함
- 비교 연산 없이 인덱스를 활용하여 정렬함
- 정수 데이터에 특화된 정렬 알고리즘임
- 시간 복잡도
    - $O(n + k)$ (k는 최댓값)
- 공간 복잡도
    - $O(k)$
- 안정성
    - 안정적임
    - 안정성을 보장하기 위해 입력 배열을 뒤에서부터 순회하여 결과 배열에 채움
- 시간 복잡도가 매우 낮음
- 음수나 매우 큰 범위의 숫자에는 부적합함

```java
void countingSort(int[] array) {
    if (array.length == 0) return;
    
    // 최댓값 찾기
    int max = array[0];
    for (int num : array) {
        if (num > max) max = num;
    }
    
    // 카운팅 배열 생성
    int[] count = new int[max + 1];
    for (int num : array) {
        count[num]++;
    }
    
    // 정렬된 결과 생성
    int idx = 0;
    for (int i = 0; i <= max; i++) {
        while (count[i] > 0) {
            array[idx++] = i;
            count[i]--;
        }
    }
}
```

<br/><br/>

### 기수 정렬

- 낮은 자리수부터 높은 자리수까지 차례로 정렬함
- 각 자리수마다 안정한 정렬(보통 계수 정렬)을 사용함
- 정수의 자리수를 기준으로 분류하여 정렬함
- 시간 복잡도
    - $O(d \times n)$ (d는 자리수)
- 공간 복잡도
    - $O(n + k)$
- 안정성
    - 안정적임
- 정수 정렬에서 매우 빠름
- 추가 메모리가 필요함

```java
void radixSort(int[] array) {
    if (array.length == 0) return;
    
    // 최댓값 찾기
    int max = array[0];
    for (int num : array) {
        if (num > max) max = num;
    }
    
    // 각 자리수마다 정렬
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countingSortByDigit(array, exp);
    }
}

void countingSortByDigit(int[] array, int exp) {
    int n = array.length;
    int[] output = new int[n];
    int[] count = new int[10];
    
    // 현재 자리수의 숫자 카운팅
    for (int i = 0; i < n; i++) {
        count[(array[i] / exp) % 10]++;
    }
    
    // 누적 카운트
    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }
    
    // 정렬된 결과 생성
    for (int i = n - 1; i >= 0; i--) {
        int digit = (array[i] / exp) % 10;
        output[count[digit] - 1] = array[i];
        count[digit]--;
    }
    
    // 원본 배열에 복사
    System.arraycopy(output, 0, array, 0, n);
}
```

<br/><br/>

## 상황별 정렬 알고리즘 선택 가이드

### 데이터 크기에 따른 선택

- 작은 데이터셋 (n < 50)
    - 삽입 정렬이 효율적임
- 중간 크기 데이터셋
    - 퀵 정렬이 일반적으로 가장 빠름
- 대규모 데이터셋
    - 병합 정렬이나 힙 정렬로 안정적인 성능 보장

### 데이터 특성에 따른 선택

- 거의 정렬된 데이터
    - 삽입 정렬이나 버블 정렬의 최적화 버전이 좋음
- 역순으로 정렬된 데이터
    - 퀵 정렬은 피하고 병합 정렬 사용
- 중복이 많은 데이터
    - 3-way 퀵 정렬이나 계수 정렬 고려

### 요구사항에 따른 선택

- 일반적인 경우
    - 퀵 정렬 - 대부분의 프로그래밍 언어의 표준 라이브러리가 퀵 정렬 기반임
- 최악의 경우 보장 필요
    - 병합 정렬이나 힙 정렬
- 안정한 정렬 필요
    - 병합 정렬이나 삽입 정렬
- 메모리 제약이 심할 때
    - 힙 정렬 (제자리 정렬)
- 정수 범위가 제한적
    - 계수 정렬이나 기수 정렬

![image](/assets/img/algorithm/image5.png)

<br/><br/>

## 안정성의 의미

- 안정성이란 동일한 값을 가진 요소들이 정렬 후에도 정렬 전의 상대적 순서를 유지하는 특성임
- 예를 들어, 여러 학생의 성적을 이름으로 정렬할 때 같은 성적을 받은 학생들은 원래 순서대로 유지되어야 한다면 안정한 정렬이 필요함

![image](/assets/img/algorithm/image6.png)`

### 안정성이 중요한 경우

- 여러 기준으로 순차적으로 정렬할 때
- 데이터의 원래 순서가 의미를 가질 때
- 정렬 전 인덱스 정보를 보존해야 할 때

### 안정한 정렬과 불안정한 정렬

**안정한 정렬**
- 버블 정렬, 삽입 정렬, 병합 정렬, 계수 정렬, 기수 정렬

**불안정한 정렬**
- 선택 정렬, 퀵 정렬, 힙 정렬

<br/><br/>

## 정리

- 정렬 알고리즘은 데이터를 일정한 순서로 배치하는 핵심 알고리즘임
- 비교 정렬은 $O(n \log n)$, 비교하지 않는 정렬은 특정 조건에서 $O(n)$까지 가능함
- 각 알고리즘은 시간 복잡도, 공간 복잡도, 안정성 면에서 서로 다른 특성을 가짐
- 작은 데이터는 삽입 정렬, 일반적인 경우는 퀵 정렬, 최악 보장이 필요하면 병합/힙 정렬을 사용함
- 정수 범위가 제한적이면 계수 정렬이나 기수 정렬로 $O(n)$ 성능을 얻을 수 있음
- 정렬 알고리즘의 선택은 시간 복잡도뿐만 아니라 데이터 특성, 메모리 상황, 안정성 요구사항을 종합적으로 고려해야 함

<br/><br/>

## Reference

- [Do it! 알고리즘 코딩 테스트 - 자바 편](https://www.yes24.com/product/goods/148122935)
