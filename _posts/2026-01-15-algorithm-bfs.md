---
title: 너비 우선 탐색 (BFS, Breadth-First Search) 알고리즘
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-15 08:00:00 +0900
category: [Computer Science, Algorithm]
tags: [algorithm, bfs, breadth-first-search, graph, queue, java, shortest-path]
math: true
mermaid: false
---


- 너비 우선 탐색(BFS, Breadth-First Search)은 그래프의 시작 노드에서 가까운 노드부터 차례대로 탐색하는 알고리즘임
- 큐(Queue) 자료구조를 사용하여 구현하며 가중치가 없는 그래프에서 최단 경로를 보장함

<br/><br/>

## BFS 알고리즘

### 알고리즘 개념
- 시작 노드에서 가까운 노드부터 먼저 방문하고 멀리 있는 노드는 나중에 방문하는 방식임
- 두 노드 사이의 최단 경로 혹은 임의의 경로를 찾고 싶을 때 사용함
- 큐(Queue) 자료구조를 사용함

### 동작 흐름

1. 초기 상태
  - 시작 노드인 1번 노드를 큐에 넣고 방문 처리를 함
  - 큐: `[1]`
  - 방문 배열: `[T, F, F, F, ...]`
2. 1번 노드 처리
  - 큐에서 1을 꺼내고 방문하지 않은 인접 노드 2, 3을 큐에 넣고 방문 처리함
  - 큐: `[2, 3]`
  - 방문 배열: `[T, T, T, F, ...]`
3. 2번 노드 처리
  - 큐에서 2를 꺼내고 방문하지 않은 인접 노드 4, 5를 큐에 넣고 방문 처리함
  - 큐: `[3, 4, 5]`
  - 방문 배열: `[T, T, T, T, T, ...]`
4. 3번 노드 처리
  - 큐에서 3을 꺼내고 방문하지 않은 인접 노드 6, 7을 큐에 넣고 방문 처리함
  - 큐: `[4, 5, 6, 7]`
  - 방문 배열: `[T, T, T, T, T, T, T, ...]`
5. 종료
  - 더 이상 방문하지 않은 인접 노드가 없으면 큐가 빌 때까지 반복하고 종료함

<br/><br/>

## 판단 기준

- 어떤 문제에서 BFS를 사용해야 하는지 판단하는 기준임

### 최단 경로
- 최소 이동 횟수, 가장 빠른 시간, 최단 거리 등의 키워드가 있을 때
- 단, 간선의 가중치가 모두 1이거나 동일해야 함 (가중치가 다르면 다익스트라 사용)

### 레벨 탐색
- 시작점으로부터 거리(Hop)가 같은 노드들을 그룹으로 묶어서 처리해야 할 때
- ex)
  - 바이러스가 매 초마다 인접한 곳으로 퍼질 때, X초 후의 상태는?

### 상태 공간 탐색
- 2차원 배열(격자)에서의 이동 문제, 퍼즐 맞추기 등
- 현재 상태에서 변화 가능한 다음 상태들을 탐색하며 목표 상태에 도달하는 최소 횟수를 구할 때

<br/><br/>

## 동작 원리

- BFS는 큐(Queue)의 선입선출(FIFO) 특성을 이용하여 레벨별로 탐색을 진행함

- **초기화**
  - 시작 노드를 큐에 넣고 방문 처리를 함
- **반복 (While Queue is not empty)**
  - 큐에서 노드 하나를 꺼냄 (`poll`)
  - 해당 노드의 인접한 모든 노드를 확인
  - 방문하지 않은 인접 노드라면 방문 처리 후 큐에 넣음 (`offer`)
    - *큐에 넣을 때 방문 처리를 해야 중복 방문을 막을 수 있음*

<br/><br/>

## 풀이 접근법 

- 문제를 만났을 때 BFS로 해결하기 위한 구체적인 접근 방법임

### 그래프 모델링
  - **노드(Vertex)**
    - 현재의 상태
    - ex) (x, y) 좌표, 퍼즐의 모양, 물통의 물 양
  - **간선(Edge)**
    - 상태의 변화
    - ex) 상하좌우 이동, 퍼즐 조각 이동, 물 붓기

### 상태 정의
  - 중복 방문을 방지하기 위해 `visited` 배열을 어떻게 정의할지 결정해야 함
  - **1차원 그래프**
    - `boolean[] visited = new boolean[N]`
  - **2차원 격자**
    - `boolean[][] visited = new boolean[Rows][Cols]`
  - **추가 조건이 있는 경우**
    - 3차원 배열 등을 사용
    - ex) 벽을 1번 부술 수 있다 -> `visited[x][y][broken]`

### **방향 벡터 (Direction Vectors)**
- 격자 문제의 경우 상하좌우 이동을 위해 방향 배열을 미리 선언하면 편리함
  ```java
  static int[] dx = {-1, 1, 0, 0}; // 상하
  static int[] dy = {0, 0, -1, 1}; // 좌우

  // 반복문으로 4방향 탐색
  for(int i=0; i<4; i++) {
      int nx = cx + dx[i];
      int ny = cy + dy[i];
      // 범위 체크 및 방문 체크
  }
  ```

<br/><br/>

## 시간 복잡도

### 인접 리스트
  - $O(V + E)$
  - 모든 정점($V$)을 한 번씩 큐에 넣고 빼며 모든 간선($E$)을 한 번씩 확인함

### 인접 행렬
  - $O(V^2)$
  - 연결된 노드를 찾기 위해 매번 모든 노드를 순회해야 함

### 결론
  - 코딩 테스트에서는 대부분 $V$가 크므로 $O(V^2)$을 피하기 위해 인접 리스트를 사용하는 것이 좋음

<br/><br/>

## Java 구현

- 문제의 조건에 따라 `graph` 구성 방식이나 `visited` 처리만 변경하여 사용함

### 기본 구현
```java
import java.io.*;
import java.util.*;

public class Main {

    // 문제에 필요한 변수 선언 (Static)
    static boolean[] visited;
    static ArrayList<Integer>[] graph;
    static int N, M;

    public static void main(String[] args) throws IOException {
        // 입력 처리
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());

        // 문제의 기본 파라미터 입력
        N = Integer.parseInt(st.nextToken());
        M = Integer.parseInt(st.nextToken());

        // 초기화
        visited = new boolean[N + 1];
        graph = new ArrayList[N + 1];
        for (int i = 1; i <= N; i++) graph[i] = new ArrayList<>();

        // 그래프 구성
        for (int i = 0; i < M; i++) {
            st = new StringTokenizer(br.readLine());
            int u = Integer.parseInt(st.nextToken());
            int v = Integer.parseInt(st.nextToken());
            graph[u].add(v);
            graph[v].add(u); // 양방향의 경우
        }

        // 알고리즘 실행
        bfs(1); // 시작 노드 1
    }

    private static void bfs(int start) {
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(start);
        visited[start] = true;

        while (!queue.isEmpty()) {
            int current = queue.poll();
            
            // 현재 노드 처리 로직
            // System.out.print(current + " ");

            // 인접 노드 탐색
            for (int next : graph[current]) {
                if (!visited[next]) {
                    visited[next] = true;
                    queue.offer(next);
                }
            }
        }
    }
}
```

<br/><br/>

## Reference

- [Do it! 알고리즘 코딩 테스트 - 자바 편](https://www.yes24.com/product/goods/148122935)
- [Breadth-First Search - Wikipedia](https://en.wikipedia.org/wiki/Breadth-first_search)

