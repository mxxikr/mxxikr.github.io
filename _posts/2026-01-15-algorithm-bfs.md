---
title: 너비 우선 탐색 (BFS, Breadth-First Search) 알고리즘
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-15 08:00:00 +0900
category: [Computer Science, Algorithm]
tags: [algorithm, bfs, breadth-first-search, graph, queue, java, shortest-path]
math: true
mermaid: true
---
- 너비 우선 탐색(BFS, Breadth-First Search)은 그래프를 완전 탐색하는 방법 중 하나로, 시작 노드에서 출발해 시작 노드를 기준으로 가까운 노드를 먼저 방문하면서 탐색하는 알고리즘임
- 큐(Queue) 자료구조를 이용해 구현하며, 최단 경로를 보장하는 특징이 있음
- 그래프의 모든 정점을 한 번씩 방문하며, 레벨 순회(Level-Order Traversal) 방식으로 동작함

### 주요 특징 비교

| 구분            | BFS                       | DFS                         |
| :-------------- | :------------------------ | :-------------------------- |
| **탐색 방식**   | 넓게(Breadth) 탐색        | 깊게(Depth) 탐색            |
| **자료구조**    | 큐(Queue)                 | 스택(Stack) 또는 재귀       |
| **시간 복잡도** | $O(V + E)$                | $O(V + E)$                  |
| **공간 복잡도** | $O(V)$                    | $O(V)$                      |
| **최단 경로**   | 보장 (가중치 없는 그래프) | 보장 안 됨                  |
| **주요 용도**   | 최단 거리, 레벨 탐색      | 경로 존재 여부, 사이클 탐지 |

<br/><br/>

## 문제 식별 방법

### BFS를 사용해야 하는 경우

- 최단 경로를 찾아야 하는 문제 (가중치가 없거나 모두 동일한 경우)
- 레벨별 탐색이 필요한 문제 (거리별로 그룹화)
- 가장 가까운 목표를 찾는 문제
- 그래프가 너무 깊지 않고 넓은 경우
- 모든 경로를 동시에 탐색해야 하는 경우

### 대표적인 문제 유형

- 미로 탈출 최단 경로
- 게임 맵 최단 거리
- 단어 변환 최소 단계
- 토마토 익히기 (시뮬레이션)
- 네트워크 연결 여부
- 이진 트리 레벨 순회

<br/><br/>

## 개념과 동작 원리

### BFS의 흐름

![BFS 흐름도](/assets/img/algorithm/bfs/bfs-flow.png)

### 동작 원리

1. **시작할 노드를 정한 후 사용할 자료구조 초기화하기**

   - 방문했던 노드는 다시 방문하지 않으므로 방문 배열 필요
   - 그래프를 인접 리스트로 표현
   - 큐 자료구조 사용 (FIFO)

2. **큐에서 노드를 꺼낸 후 꺼낸 노드의 인접 노드를 다시 큐에 삽입하기**

   - 큐에서 노드를 꺼내면서 인접 노드를 큐에 삽입
   - 방문 배열을 체크하여 이미 방문한 노드는 큐에 삽입하지 않음
   - 큐에서 꺼낸 노드는 탐색 순서에 기록

3. **큐 자료구조에 값이 없을 때까지 반복하기**

   - 큐에 노드가 없을 때까지 위 과정 반복
   - 선입선출 방식으로 탐색하므로 탐색 순서가 DFS와 다름
   - 레벨 순서로 탐색이 보장됨

<br/><br/>

## 동작 과정 상세 분석

### 예제 그래프

![BFS 예제 그래프](/assets/img/algorithm/bfs/example-graph.png)

### 단계별 실행 과정

- **초기 상태**

  ```
  시작 노드: 1
  인접 리스트:
  1 → [2, 3]
  2 → [1, 5, 6]
  3 → [1, 4]
  4 → [3, 6]
  5 → [2]
  6 → [2, 4]
  ```

1. **시작 노드(1) 방문**

![1단계 초기 상태](/assets/img/algorithm/bfs/step1-init.png)

- 노드 1을 큐에 삽입
- 방문 배열 체크: `visited[1] = true`

2. **노드 1 꺼내고 인접 노드(2, 3) 삽입**

![2단계](/assets/img/algorithm/bfs/step2.png)

- 노드 1 꺼냄 → 탐색 순서: `1`
- 인접 노드 2, 3을 큐에 삽입
- `visited[2] = true`, `visited[3] = true`

3. **노드 2 꺼내고 인접 노드(5, 6) 삽입**

   ![3단계](/assets/img/algorithm/bfs/step3.png)

   - 노드 2 꺼냄 → 탐색 순서: `1 → 2`
   - 인접 노드 중 미방문: 5, 6
   - 노드 1은 이미 방문했으므로 스킵
   - `visited[5] = true`, `visited[6] = true`

4. **노드 3 꺼내고 인접 노드(4) 삽입**

   ![4단계](/assets/img/algorithm/bfs/step4.png)

   - 노드 3 꺼냄 → 탐색 순서: `1 → 2 → 3`
   - 인접 노드 중 미방문: 4
   - 노드 1은 이미 방문
   - `visited[4] = true`

5. **노드 5 꺼내기**

   ![5단계](/assets/img/algorithm/bfs/step5.png)

   - 노드 5 꺼냄 → 탐색 순서: `1 → 2 → 3 → 5`
   - 인접 노드(2)는 이미 방문
   - 큐에 추가할 노드 없음

6. **노드 6 꺼내기**

   ![6단계](/assets/img/algorithm/bfs/step6.png)

   - 노드 6 꺼냄 → 탐색 순서: `1 → 2 → 3 → 5 → 6`
   - 인접 노드(2, 4)는 이미 방문
   - 큐에 추가할 노드 없음

7. **노드 4 꺼내고 탐색 완료**

   ![7단계 완료](/assets/img/algorithm/bfs/step7-final.png)

   - 노드 4 꺼냄 → 탐색 순서: `1 → 2 → 3 → 5 → 6 → 4`
   - 인접 노드(3, 6)는 이미 방문
   - 큐가 비어 탐색 종료

### 레벨별 분석

```
Level 0: [1]          ← 시작 노드
Level 1: [2, 3]       ← 1과 인접한 노드
Level 2: [5, 6, 4]    ← 2, 3과 인접한 노드
```

- BFS는 레벨 순서로 탐색하므로 최단 경로를 보장함

<br/><br/>

## 시간 및 공간 복잡도

### 시간 복잡도: $O(V + E)$

- **V**
  - 정점(Vertex)의 개수
- **E**
  - 간선(Edge)의 개수
- 모든 정점을 한 번씩 방문
  - $O(V)$
- 모든 간선을 한 번씩 확인

  - $O(E)$

- **분석**

  ```java
  for each vertex v in Graph:     // O(V)
      if not visited[v]:
          visit v
          for each edge (v, u):   // O(E)
              if not visited[u]:
                  enqueue u
  ```

### 공간 복잡도: $O(V)$

- 방문 배열
  - $O(V)$
- 큐
  - 최악의 경우 모든 노드 저장 $O(V)$
- 인접 리스트

  - $O(V + E)$

- **최악의 경우**

  - 완전 그래프(Complete Graph)에서 큐에 모든 정점이 동시에 들어갈 수 있음

<br/><br/>

## Java 구현

### 기본 구현 (인접 리스트)

```java
import java.util.*;

public class BFS {

    /**
     * BFS를 이용한 그래프 탐색
     * @param graph 인접 리스트로 표현된 그래프
     * @param start 시작 노드
     * @return 탐색 순서를 담은 리스트
     */
    public static List<Integer> bfs(List<List<Integer>> graph, int start) {
        List<Integer> result = new ArrayList<>();
        boolean[] visited = new boolean[graph.size()];
        Queue<Integer> queue = new LinkedList<>();

        // 시작 노드를 큐에 삽입하고 방문 처리
        queue.offer(start);
        visited[start] = true;

        // 큐가 빌 때까지 반복
        while (!queue.isEmpty()) {
            // 큐에서 노드 꺼내기
            int current = queue.poll();
            result.add(current);

            // 인접한 노드들을 큐에 삽입
            for (int neighbor : graph.get(current)) {
                if (!visited[neighbor]) {
                    queue.offer(neighbor);
                    visited[neighbor] = true;
                }
            }
        }

        return result;
    }

    public static void main(String[] args) {
        // 그래프 생성 (1~6번 노드)
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            graph.add(new ArrayList<>());
        }

        // 간선 추가 (양방향)
        graph.get(1).addAll(Arrays.asList(2, 3));
        graph.get(2).addAll(Arrays.asList(1, 5, 6));
        graph.get(3).addAll(Arrays.asList(1, 4));
        graph.get(4).addAll(Arrays.asList(3, 6));
        graph.get(5).add(2);
        graph.get(6).addAll(Arrays.asList(2, 4));

        List<Integer> result = bfs(graph, 1);
        System.out.println("BFS 탐색 순서: " + result);
        // 출력: [1, 2, 3, 5, 6, 4]
    }
}
```

### 최단 거리 구하기

```java
import java.util.*;

public class BFSShortestPath {

    /**
     * BFS를 이용한 최단 거리 계산
     * @param graph 인접 리스트
     * @param start 시작 노드
     * @return 각 노드까지의 최단 거리 배열
     */
    public static int[] bfsDistance(List<List<Integer>> graph, int start) {
        int n = graph.size();
        int[] distance = new int[n];
        boolean[] visited = new boolean[n];
        Queue<Integer> queue = new LinkedList<>();

        // 초기화: 거리를 무한대로 설정
        Arrays.fill(distance, Integer.MAX_VALUE);

        // 시작 노드 설정
        queue.offer(start);
        visited[start] = true;
        distance[start] = 0;

        while (!queue.isEmpty()) {
            int current = queue.poll();

            for (int neighbor : graph.get(current)) {
                if (!visited[neighbor]) {
                    queue.offer(neighbor);
                    visited[neighbor] = true;
                    // 현재 노드까지의 거리 + 1
                    distance[neighbor] = distance[current] + 1;
                }
            }
        }

        return distance;
    }

    public static void main(String[] args) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            graph.add(new ArrayList<>());
        }

        graph.get(1).addAll(Arrays.asList(2, 3));
        graph.get(2).addAll(Arrays.asList(1, 5, 6));
        graph.get(3).addAll(Arrays.asList(1, 4));
        graph.get(4).addAll(Arrays.asList(3, 6));
        graph.get(5).add(2);
        graph.get(6).addAll(Arrays.asList(2, 4));

        int[] distances = bfsDistance(graph, 1);

        System.out.println("노드 1로부터의 최단 거리:");
        for (int i = 1; i < distances.length; i++) {
            System.out.println("노드 " + i + ": " +
                (distances[i] == Integer.MAX_VALUE ? "도달 불가" : distances[i]));
        }
        /* 출력:
        노드 1: 0
        노드 2: 1
        노드 3: 1
        노드 4: 2
        노드 5: 2
        노드 6: 2
        */
    }
}
```

<br/><br/>

## 2차원 배열에서의 BFS

### 미로 탐색 (상하좌우 이동)

```java
import java.util.*;

public class BFS2D {

    // 상, 하, 좌, 우 이동 방향
    static int[] dx = {-1, 1, 0, 0};
    static int[] dy = {0, 0, -1, 1};

    static class Point {
        int x, y, distance;

        Point(int x, int y, int distance) {
            this.x = x;
            this.y = y;
            this.distance = distance;
        }
    }

    /**
     * 2D 그리드에서 BFS를 이용한 최단 경로 찾기
     * @param grid 0: 이동 가능, 1: 벽
     * @param startX 시작 x 좌표
     * @param startY 시작 y 좌표
     * @param endX 목표 x 좌표
     * @param endY 목표 y 좌표
     * @return 최단 거리 (도달 불가 시 -1)
     */
    public static int bfs2D(int[][] grid, int startX, int startY,
                            int endX, int endY) {
        int n = grid.length;
        int m = grid[0].length;
        boolean[][] visited = new boolean[n][m];
        Queue<Point> queue = new LinkedList<>();

        // 시작점 초기화
        queue.offer(new Point(startX, startY, 0));
        visited[startX][startY] = true;

        while (!queue.isEmpty()) {
            Point current = queue.poll();

            // 목표 지점 도착
            if (current.x == endX && current.y == endY) {
                return current.distance;
            }

            // 4방향 탐색
            for (int i = 0; i < 4; i++) {
                int nx = current.x + dx[i];
                int ny = current.y + dy[i];

                // 범위 체크
                if (nx >= 0 && nx < n && ny >= 0 && ny < m) {
                    // 이동 가능하고 미방문
                    if (grid[nx][ny] == 0 && !visited[nx][ny]) {
                        queue.offer(new Point(nx, ny, current.distance + 1));
                        visited[nx][ny] = true;
                    }
                }
            }
        }

        return -1; // 도달 불가
    }

    public static void main(String[] args) {
        int[][] grid = {
            {0, 0, 1, 0, 0},
            {0, 1, 1, 0, 1},
            {0, 0, 0, 0, 0},
            {1, 0, 1, 1, 0},
            {0, 0, 0, 0, 0}
        };

        int distance = bfs2D(grid, 0, 0, 4, 4);
        System.out.println("최단 거리: " + distance);
        // 출력: 최단 거리: 8
    }
}
```

### 시각화

```
시작(0,0) → 목표(4,4)

0  0  X  0  0
0  X  X  0  X
0  0  0  0  0
X  0  X  X  0
0  0  0  0  0

최단 경로 (거리 8):
(0,0) → (0,1) → (1,0) → (2,0) → (2,1)
→ (2,2) → (2,3) → (2,4) → (3,4) → (4,4)
```

<br/><br/>

## BFS와 DFS 비교

### 동일한 그래프에서 탐색 순서 비교

![BFS vs DFS 그래프 비교](/assets/img/algorithm/bfs/compare-graph.png)

- **BFS 탐색 순서 (레벨 순회)**

  ```
  1 → 2 → 3 → 4 → 5 → 6
  Level 0: [1]
  Level 1: [2, 3]
  Level 2: [4, 5, 6]
  ```

- **DFS 탐색 순서 (깊이 우선)**

  ```
  1 → 2 → 4 → 5 → 3 → 6
  또는
  1 → 3 → 6 → 2 → 4 → 5
  (방문 순서에 따라 다름)
  ```

### 상세 비교표

| 비교 항목       | BFS                    | DFS                    |
| :-------------- | :--------------------- | :--------------------- |
| **자료구조**    | 큐(Queue)              | 스택(Stack) 또는 재귀  |
| **탐색 방식**   | 가까운 노드부터 (넓게) | 깊은 노드부터 (깊게)   |
| **최단 경로**   | 보장 (가중치 없을 때)  | 보장 안 됨             |
| **메모리 사용** | 많음 (모든 레벨 저장)  | 적음 (현재 경로만)     |
| **구현 난이도** | 중간 (큐 사용)         | 쉬움 (재귀 가능)       |
| **적용 사례**   | 최단 거리, 레벨 탐색   | 경로 존재, 사이클 탐지 |
| **완전 탐색**   | 가능                   | 가능                   |
| **무한 그래프** | 더 안전                | 스택 오버플로 위험     |

### 사용 시나리오 결정 플로우

![BFS/DFS 선택 가이드](/assets/img/algorithm/bfs/decision-flow.png)

<br/><br/>

## 주의사항 및 한계

### 주의사항

- **방문 체크 시점**

  ```java
  // 잘못된 방법: 큐에서 꺼낼 때 체크
  while (!queue.isEmpty()) {
      int cur = queue.poll();
      if (visited[cur]) continue; // 중복 방문!
      visited[cur] = true;
  }

  // 올바른 방법: 큐에 넣을 때 체크
  while (!queue.isEmpty()) {
      int cur = queue.poll();
      for (int next : neighbors) {
          if (!visited[next]) {
              visited[next] = true; // 즉시 체크
              queue.offer(next);
          }
      }
  }
  ```

- **메모리 초과 주의**

  - 완전 그래프나 밀집 그래프에서 큐가 급격히 커질 수 있음
  - 2차원 배열이 크면 방문 배열도 메모리 차지

- **무한 루프 방지**
  - 반드시 방문 체크 필수
  - 양방향 간선일 때 특히 주의

### 한계

- **가중치가 있는 그래프**

  - BFS는 가중치를 고려하지 못함
  - **해결**
    - 다익스트라(Dijkstra) 알고리즘 사용

- **메모리 사용량**

  - 넓은 그래프에서 큐가 매우 커질 수 있음
  - **해결**
    - 양방향 BFS 또는 반복적 깊이 증가 탐색(IDDFS)

- **최적 경로가 많을 때**
  - BFS는 하나의 최단 경로만 반환
  - **해결**
    - 경로를 추적하는 로직 추가

<br/><br/>

## 정리

- BFS는 큐 자료구조를 사용하여 시작점에서 가까운 노드부터 레벨 순서로 탐색하는 알고리즘임
- 가중치가 없는 그래프에서 최단 경로를 보장하는 특징이 있음
- 시간 복잡도는 $O(V + E)$, 공간 복잡도는 $O(V)$임
- DFS에 비해 메모리 사용량이 많지만 최단 경로를 찾는 문제에 적합함
- 방문 체크는 큐에 삽입할 때 즉시 수행해야 중복 방문을 방지할 수 있음
- 2D 배열 탐색, 레벨 순회, 최단 거리 문제 등에 활용됨
- 가중치가 있는 그래프에는 다익스트라 알고리즘을 사용해야 함

<br/><br/>

## Reference

- [Do it! 알고리즘 코딩 테스트 - 자바 편](https://www.yes24.com/product/goods/148122935)
- [Breadth-First Search - Wikipedia](https://en.wikipedia.org/wiki/Breadth-first_search)
- [GeeksforGeeks - BFS Algorithm](https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/)
