---
title: 깊이 우선 탐색 (DFS, Depth-First Search) 알고리즘
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-01-09 09:00:00 +0900
category: [Computer Science, Algorithm]
tags: [dfs, graph-traversal, stack, recursion, backtracking]
math: true
mermaid: true
---
- 깊이 우선 탐색(DFS)은 그래프 완전 탐색 기법 중 하나로, 그래프의 시작 노드에서 출발하여 한 쪽 분기를 정해 최대 깊이까지 탐색을 마친 후 다른 쪽 분기로 이동하는 알고리즘임
- 스택(Stack) 자료구조나 재귀 함수를 이용해 구현하며, 백트래킹과 연계되어 다양한 문제 해결의 기초가 됨

### 주요 특징 비교

| 구분            | DFS (Depth-First Search)   | BFS (Breadth-First Search)   |
| :-------------- | :------------------------- | :--------------------------- |
| **탐색 방식**   | 깊이 우선 (한 우물 파기)   | 너비 우선 (여러 우물 동시에) |
| **자료구조**    | 스택 (Stack), 재귀         | 큐 (Queue)                   |
| **시간 복잡도** | $O(V + E)$ (인접 리스트)   | $O(V + E)$ (인접 리스트)     |
| **메모리**      | 상대적으로 적음 (깊이만큼) | 상대적으로 많음 (큐에 적재)  |
| **최단 경로**   | 보장 안 됨                 | 보장됨 (가중치 없는 그래프)  |
| **주요 용도**   | 경로 특징 저장, 백트래킹   | 최단 거리, 레벨 순회         |

<br/><br/>

## 문제 식별 방법

### 깊이 우선 탐색 (DFS)

- **모든 노드를 방문**해야 하거나 **특정 경로(해)의 존재 여부**를 판별해야 하는 완전 탐색 상황
- **경로의 특징**을 저장하고 이동해야 하는 경우
  - ex) 경로에 특정 숫자가 포함되면 안 되는 조건
- 검색 대상 그래프가 매우 커서 **메모리 효율성**이 중요한 경우
  - BFS는 너비가 넓을수록 큐 메모리 소모가 큼
- **사이클 탐지**나 **위상 정렬** 등 순서와 관계성을 파악해야 하는 문제
- **백트래킹**을 통해 유망하지 않은 경로를 조기에 차단(가지치기)해야 하는 상황

<br/><br/>

## 깊이 우선 탐색 (DFS)

- 시작 노드에서 갈 수 있는 한 방향으로 **끝까지 탐색**하고, 더 이상 갈 곳이 없으면 가장 가까운 갈림길로 돌아와 다른 방향을 탐색함
- **후입선출(LIFO)** 방식의 스택이나 **재귀 함수**의 콜 스택을 이용함

### 시간 및 공간 복잡도

- **시간 복잡도**
  - $O(V + E)$ (인접 리스트 기준)
  - **V (Vertex)**
    - 모든 노드를 한 번씩 방문함
  - **E (Edge)**
    - 인접 리스트에서 각 간선을 순회하는 비용
    - 방향 그래프: 각 간선을 1번 확인 → $O(E)$
    - 무방향 그래프: 각 간선을 양방향으로 저장하므로 2번 확인 → $O(2E) = O(E)$
  - 인접 행렬 사용 시에는 모든 노드를 순회해야 하므로 $O(V^2)$가 됨
- **공간 복잡도**
  - $O(V)$
  - **재귀 스택**
    - $O(H)$ (H는 그래프의 높이)
    - 최선
      - $O(\log V)$ (균형 트리)
    - 최악
      - $O(V)$ (편향 트리, 1→2→3→...→V)
  - **명시적 스택**
    - $O(V)$
    - 최악의 경우 모든 노드가 스택에 들어갈 수 있음
  - **Visited 배열**
    - $O(V)$
    - 모든 노드의 방문 여부 저장

### DFS 용어 및 동작 원리

- 구성 요소
  - `Node` (노드/정점, Vertex)
    - 탐색해야 할 지점을 의미함
  - `Edge` (간선)
    - 노드와 노드를 연결하는 선을 의미함
  - `Visited Array` (방문 배열)
    - 노드의 방문 여부를 기록하여 중복 방문 및 무한 루프를 방지함
- 동작 흐름
  1. 시작 노드를 방문 처리함
  2. 현재 노드와 연결된 인접 노드 중 방문하지 않은 노드를 찾아 방문함 (재귀/스택)
  3. 더 이상 방문할 인접 노드가 없으면 이전 노드(부모)로 되돌아감 (Backtracking)

![DFS 기본 동작 원리](/assets/img/algorithm/dfs/dfs-principle.png)

![DFS 기본 동작 플로우차트](/assets/img/algorithm/dfs/dfs-principle-flowchart.png)

### DFS의 활용처와 패턴

- **백트래킹 (Backtracking)**

  - N-Queen, 미로 찾기 등 해를 찾는 도중 막히면 되돌아가는 기법

    ```java
    // 백트래킹 기법 예시 (모든 경로 탐색)
    static ArrayList<Integer> path = new ArrayList<>();
    static ArrayList<ArrayList<Integer>> allPaths = new ArrayList<>();

    public static void findAllPaths(int node, int target) {
        visited[node] = true;
        path.add(node);

        // 목표에 도달하면 경로 저장
        if (node == target) {
            allPaths.add(new ArrayList<>(path));
        } else {
            // 인접 노드 탐색
            for (int next : graph[node]) {
                if (!visited[next]) {
                    findAllPaths(next, target);
                }
            }
        }

        // 백트래킹: 상태 복구 (다른 경로에서 재방문 가능하게)
        path.remove(path.size() - 1);
        visited[node] = false;
    }
    ```

- **사이클 탐지 (Cycle Detection)**

  - 그래프 내 순환 구조가 존재하는지 확인

    ```java
    // 무방향 그래프 사이클 탐지
    public static boolean hasCycle(int node, int parent) {
        visited[node] = true;

        for (int next : graph[node]) {
            if (!visited[next]) {
                // 미방문 노드 탐색
                if (hasCycle(next, node)) {
                    return true;
                }
            } else if (next != parent) {
                // 방문했지만 부모가 아니면 사이클
                return true;
            }
        }
        return false;
    }
    ```

- **위상 정렬 (Topological Sort)**

  - 작업의 선후 관계가 있는 그래프를 정렬 (DFS 완료 역순)

    ```java
    // 위상 정렬 (스택 이용)
    static Stack<Integer> resultStack = new Stack<>();

    public static void topologicalSort(int node) {
        visited[node] = true;

        for (int next : graph[node]) {
            if (!visited[next]) {
                topologicalSort(next);
            }
        }
        // 더 이상 갈 곳이 없을 때 스택에 추가 (역순)
        resultStack.push(node);
    }
    ```

- **단절점/단절선 찾기**

  - 네트워크에서 특정 지점이 고장 났을 때 분리되는지 판단

    ```java
    // 단절점 찾기 알고리즘 (핵심 로직 예시)
    static int[] discoveryTime; // 방문 순서 기록
    static int time = 0;

    public static int findArticulationPoint(int node, boolean isRoot) {
        discoveryTime[node] = ++time; // 방문 순서 기록
        int minDiscovery = discoveryTime[node]; // 자식들이 도달 가능한 가장 빠른 방문 순서
        int children = 0;

        for (int next : graph[node]) {
            if (discoveryTime[next] == 0) { // 미방문 노드
                children++;
                // 자식 노드가 도달할 수 있는 가장 빠른 순서 확인
                int low = findArticulationPoint(next, false);
                minDiscovery = Math.min(minDiscovery, low);

                // 루트가 아니고, 자식이 현재 노드보다 더 빠른 순서로 갈 수 없다면 단절점
                if (!isRoot && low >= discoveryTime[node]) {
                    System.out.println("단절점 발견: " + node);
                }
            } else {
                // 이미 방문한 노드라면 방문 순서 갱신
                minDiscovery = Math.min(minDiscovery, discoveryTime[next]);
            }
        }
        return minDiscovery;
    }
    ```

### 구현 방식과 차이

- **재귀 함수 (Recursion)**

  - 코드가 간결하고 직관적임
  - 시스템 스택(Call Stack)을 사용하므로 깊이가 매우 깊어지면 `StackOverflowError` 발생 가능함

    ```java
    import java.util.*;

    public class DFSRecursive {
        static ArrayList<Integer>[] graph;
        static boolean[] visited;

        public static void dfs(int node) {
            // 현재 노드 방문 처리
            visited[node] = true;
            System.out.print(node + " "); // 방문 순서 출력

            // 인접한 미방문 노드를 재귀적으로 탐색
            for (int next : graph[node]) {
                if (!visited[next]) {
                    dfs(next);  // 깊이 우선으로 탐색
                }
            }
        }

        public static void main(String[] args) {
            int n = 6;  // 노드 개수
            graph = new ArrayList[n + 1];
            visited = new boolean[n + 1];

            // 그래프 초기화
            for (int i = 1; i <= n; i++) {
                graph[i] = new ArrayList<>();
            }

            // 간선 추가 (무방향 그래프)
            addEdge(1, 2);
            addEdge(1, 3);
            addEdge(2, 5);
            addEdge(2, 6);
            addEdge(3, 4);
            addEdge(4, 6);

            dfs(1);
        }

        // 무방향 그래프 간선 추가 헬퍼 메서드
        static void addEdge(int u, int v) {
            graph[u].add(v);
            graph[v].add(u);
        }
    }
    ```

- **동작 흐름**

![DFS 재귀 호출 흐름](/assets/img/algorithm/dfs/recursive-flow.png)

![DFS 재귀 플로우차트](/assets/img/algorithm/dfs/recursive-flowchart.png)

- **반복문 + 스택 (Iterative Stack)**

  - 명시적인 `Stack` 자료구조를 사용함
  - 재귀 깊이 제한에서 자유로우며, 힙 메모리를 사용하여 대규모 그래프 탐색에 유리함
  - 방문 순서가 재귀와 미세하게 다를 수 있음 (인접 노드 삽입 순서에 따라)

  ```java
  // 스택을 이용한 반복문 구현 (Push 시 방문 처리)
  public static void dfsIterative(int start) {
      Stack<Integer> stack = new Stack<>();
      stack.push(start);
      visited[start] = true; // push 시점에 방문 처리

      while (!stack.isEmpty()) {
          int node = stack.pop();
          System.out.print(node + " ");

          // 인접 노드를 역순으로 스택에 삽입 -> 스택은 후입선출(LIFO)이므로 나중에 넣은 것이 먼저 나옴
          // 작은 번호를 먼저 방문하려면 큰 번호부터 넣어야 함
          for (int i = graph[node].size() - 1; i >= 0; i--) {
              int next = graph[node].get(i);
              // 방문하지 않은 노드만 스택에 추가
              if (!visited[next]) {
                  visited[next] = true; // 중복 push 방지를 위해 여기서 방문 처리
                  stack.push(next);
              }
          }
      }
  }

  // Pop 시 방문 처리 방식 (재귀 DFS와 순서 동일, 중복 Push 가능성 있음)
  public static void dfsIterativeAlt(int start) {
      Stack<Integer> stack = new Stack<>();
      stack.push(start);

      while (!stack.isEmpty()) {
          int node = stack.pop();

          if (visited[node]) continue; // pop 후 방문 확인

          visited[node] = true; // pop 시점에 방문 처리
          System.out.print(node + " ");

          // 역순 삽입은 동일
          for (int i = graph[node].size() - 1; i >= 0; i--) {
              int next = graph[node].get(i);
              if (!visited[next]) {
                  stack.push(next); // 방문 체크 없이 push
              }
          }
      }
  }
  ```

- **동작 흐름**

![DFS 반복문 스택 흐름](/assets/img/algorithm/dfs/iterative-flow.png)

![DFS 반복문 플로우차트](/assets/img/algorithm/dfs/iterative-flowchart.png)

### 구현 시 주의사항 및 팁

- **StackOverflowError 주의**

  - 재귀 깊이가 시스템 스택(약 1MB)의 한계(통상 5천~1만)를 넘으면 발생함
  - 그래프가 일직선으로 깊게 연결된 경우(편향 트리 등) 위험함
  - **해결**
    - JVM 옵션(`-Xss`)으로 스택 크기를 늘리거나, **반복문 + 스택** 구현을 권장함

- **단순 백트래킹과 백트래킹 기법**

  - **자동 백트래킹**
    - 재귀 함수가 종료(`return`)되면 자연스럽게 이전 노드로 돌아가는 흐름
  - **기법으로서의 백트래킹**
    - `visited`를 `false`로 다시 돌려놓아 다른 경로에서 해당 노드를 재방문할 수 있게 하는 가지치기 테크닉

- **사이클 탐지 주의**
  - 무방향 그래프에서 `방문한 노드`를 만났을 때, 그것이 바로 직전의 `부모 노드`라면 사이클이 아님 (단순 회귀)
  - `방문한 노드`가 `부모 노드`가 아닐 때만 사이클로 판정해야 함

<br/><br/>

## DFS 실행 과정 시각화

![DFS Example Graph](/assets/img/algorithm/dfs/dfs-example-graph.png)

- **예제 그래프 구조 (무방향)**

  - **노드**
    - 1, 2, 3, 4, 5, 6
  - **간선**
    - (1-2), (1-3), (2-5), (2-6), (3-4), (4-6)

- **탐색 시나리오 (노드 1 시작, 작은 번호 우선)**
  1. **Node 1**
     - 방문
     - 인접(2, 3)
     - 2로 이동 (작은 번호)
  2. **Node 2**
     - 방문
     - 인접(5, 6)
     - 5로 이동
  3. **Node 5**
     - 방문
     - 인접 없음
     - 2로 복귀 (Back)
  4. **Node 2 복귀**
     - 남은 인접(6)으로 이동
  5. **Node 6**
     - 방문
     - 인접(4)로 이동
  6. **Node 4**
     - 방문
     - 인접(3)으로 이동
  7. **Node 3**
     - 방문
     - 인접(1)은 이미 방문
     - 더 갈 곳 없음 -> 4 -> 6 -> 2 -> 1로 복귀 및 종료

![DFS Flow Graph](/assets/img/algorithm/dfs/dfs-flow-graph.png)

## 실제 서비스 환경의 활용

- **웹 크롤러 (Web Crawler)**
  - 특정 페이지에서 시작하여 링크를 타고 깊이 들어가며 데이터를 수집함
  - 사이트의 계층 구조를 파악할 때 유용함
- **게임 AI 및 퍼즐 솔루션**
  - 미로 찾기, 사다리 타기 등의 경로 존재 여부 판별
  - 체스나 바둑 같은 게임에서 가능한 수를 탐색할 때(Minimax 알고리즘 등) 사용됨
- **네트워크 연결성 테스트**
  - 특정 컴퓨터(노드) 간의 통신 가능 여부(경로 존재 여부)를 확인함
- **의존성 해결 (Dependency Resolution)**
  - 소프트웨어 패키지 설치 시 의존 관계를 파악하고 순서를 결정할 때(위상 정렬) 활용됨

<br/><br/>

## Reference

- [Do it! 알고리즘 코딩 테스트 - 자바 편](https://www.yes24.com/product/goods/148122935)
