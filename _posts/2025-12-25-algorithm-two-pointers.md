---
title: "투 포인터 알고리즘"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-12-25 16:30:00 +0900
category:
  - [Computer Science, Algorithm]
tags: [algorithm, two-pointers, time-complexity, sliding-window, java]
math: true
mermaid: true
---

## 개요

- 투 포인터(Two Pointers)는 1차원 배열에서 두 개의 포인터를 조작하여 원하는 결과를 얻는 알고리즘 기법임
- 완전 탐색 적용 시 $O(N^2)$이 소요되는 문제를 $O(N)$으로 최적화할 때 주로 활용함
- 연속된 구간의 합을 구하거나 정렬된 배열에서 특정 조건을 만족하는 쌍을 찾는 문제에 효과적임

<br/><br/>

## 투 포인터의 필요성

### 완전 탐색의 한계

- $N$개의 데이터에서 조건을 만족하는 부분 배열을 찾기 위해 이중 반복문을 사용할 경우 비효율이 발생함
- $N=100,000$일 때 $O(N^2)$ 연산량은 약 100억 번에 달하여 시간 초과(Time Limit Exceeded)를 유발함

### 투 포인터의 해결 방식

- 두 개의 포인터(`start`, `end`)를 사용하여 배열을 한 번만 순회하는 선형 탐색을 수행함
- 포인터 이동 규칙을 설정하여 불필요한 연산을 건너뛰고 효율성을 확보함

![투 포인터 시간 복잡도 시각화](/assets/img/algorithm/two-pointers-complexity-viz.png)

<br/><br/>

## 투 포인터 이동 원칙

- 현재 구간의 상태(sum)와 목표값(target)을 비교하여 포인터 이동 방향을 결정함

### 구간 합이 목표보다 클 때 (`sum > target`)

- 현재 부분 합이 목표치보다 크므로 구간 범위를 축소해야 함
- 동작 원리
  - 현재 `start_index`가 가리키는 값을 `sum`에서 차감함
  - `start_index`를 오른쪽으로 한 칸 이동 시킴 (`start_index++`)

### 구간 합이 목표보다 작을 때 (`sum < target`)

- 현재 부분 합이 목표치보다 작으므로 구간 범위를 확장해야 함
- 동작 원리
  - `end_index`를 오른쪽으로 한 칸 이동 시킴 (`end_index++`)
  - 새롭게 포함된 값을 `sum`에 합산함

### 구간 합이 목표와 같을 때 (`sum == target`)

- 조건을 만족하는 해를 발견한 경우임
- 동작 원리
  - 결과 카운트를 증가 시킴
  - 다음 탐색을 위해 `end_index`를 확장 시킴

<br/><br/>

## 반대 방향 패턴 (Converging Pointers)

- 포인터가 배열의 양 끝에서 시작하여 중심을 향해 좁혀오는 방식임
- 전제 조건
  - 반드시 배열이 **정렬**되어 있어야 함
  - 정렬되지 않은 경우 $O(N \log N)$의 정렬 과정을 거친 후 적용함

![반대 방향 투 포인터](/assets/img/algorithm/two-pointers-converging.png)

### Java 구현 예시 (두 수의 합 찾기)

- 정렬된 배열에서 두 수의 합이 target인 경우를 찾는 로직임

```java
int left = 0;
int right = arr.length - 1;

while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) {
        count++;
        // 중복 데이터 처리 시 추가적인 while 문 활용 가능
        left++;
        right--;
    } else if (sum > target) {
        right--; // 합을 줄이기 위해 큰 값 쪽 포인터 이동
    } else {
        left++;  // 합을 키우기 위해 작은 값 쪽 포인터 이동
    }
}
```

### 중복 데이터 처리 방법

- 같은 숫자가 여러 개 존재할 경우 단순히 포인터를 이동하면 누락되는 쌍이 생길 수 있음
- `while` 문을 사용하여 이전 값과 동일한 인덱스를 건너뛰는 처리가 필요함

<br/><br/>

## 같은 방향 패턴 (Sliding Window Style)

- 두 포인터가 모두 0에서 시작하여 같은 방향으로 이동하는 방식임
- 연속된 수열의 합이나 가변적인 윈도우 크기를 다루는 문제에서 활용됨

  ![같은 방향 투 포인터](/assets/img/algorithm/two-pointers-same-direction.png)

### 동작 시뮬레이션

- 배열 `[1, 2, 3, 4, 5]`에서 합이 `5`인 구간을 찾는 과정임

  ![투 포인터 시뮬레이션](/assets/img/algorithm/two-pointers-simulation.png)

### Java 구현 (연속된 자연수의 합)

- 고정되지 않은 구간의 합이 $N$인 경우를 세는 로직임

  ```java
  int start_index = 1, end_index = 1, sum = 1, count = 1;

  while (end_index != N) {
      if (sum == N) {
          count++;
          end_index++;
          sum += end_index;
      } else if (sum > N) {
          sum -= start_index;
          start_index++;
      } else {
          end_index++;
          sum += end_index;
      }
  }
  ```

### 제약 사항 및 주의점

- **양수 데이터 조건**
  - 배열의 원소가 모두 양수일 때 최적의 효율을 보장함
  - 음수가 포함된 경우 `start` 이동 시 `sum`이 반드시 줄어들지 않으므로 주의가 필요함
- **음수 포함 문제 해결**
  - 음수가 포함된 구간 합 문제는 누적 합과 해시맵을 결합한 방식 사용을 권장함

<br/><br/>

## 투 포인터 vs 슬라이딩 윈도우

| 구분            | 투 포인터 (Two Pointers)    | 슬라이딩 윈도우 (Sliding Window) |
| :-------------- | :-------------------------- | :------------------------------- |
| **윈도우 크기** | 가변적임 (조건에 따라 변화) | 고정적임 (일정한 크기 유지)      |
| **포인터 개수** | 2개 (독립적 이동 가능)      | 2개 (일정한 간격 유지)           |
| **주요 용도**   | 구간 합, 특정 수 합 찾기    | 연속된 구간의 최대/최소값        |

<br/><br/>

## 시간 복잡도 증명

- $O(N)$의 시간 복잡도가 유지되는 논리적 근거는 다음과 같음
- `start` 포인터 이동 횟수
  - 최대 $N$번
- `end` 포인터 이동 횟수
  - 최대 $N$번
- 두 포인터는 각자 독립적으로 한 방향으로만 이동하며 역행하지 않음
- 전체 연산 횟수는 최대 $2N$에 비례하므로 상수 항을 제외한 시간 복잡도는 $O(N)$임

<br/><br/>

## 알고리즘 적용 가이드

### 데이터 타입 선택

- 구간의 합을 저장하는 `sum` 변수는 오버플로우 방지를 위해 `long` 타입을 기본으로 사용하는 것이 안전함

### 인덱스 범위 체크

- `while` 문 조건에서 `end_index`가 배열 크기($N$)에 도달했을 때의 예외 처리를 철저히 해야 함
- 루프 종료 시 마지막 구간에 대한 누락 여부를 확인하는 절차가 필요함

### 추천 문제 유형

- 정렬된 배열에서의 두 수의 합 찾기
- 연속된 자연수의 합 구하기
- 부분 배열의 합이 특정 값인 경우 도출하기
- 두 배열의 공통 원소 추출하기

<br/><br/>

## 요약 정리

- `sum`과 `target`을 비교하여 구간의 확장 및 축소를 결정하는 기법임
- 작을 경우 `end`를 늘려 합을 키우고, 클 경우 `start`를 늘려 합을 줄임
- 불필요한 탐색을 제거하여 $O(N^2)$ 문제를 $O(N)$으로 최적화하는 전술적 방법임

<br/><br/>

## Reference

- [Do it! 알고리즘 코딩 테스트 - 자바 편](https://www.yes24.com/product/goods/148122935)
