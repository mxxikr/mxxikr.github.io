---
title:  "[파이썬 프로그래밍 기초] 7강 - 반복 구조"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2025-04-14 00:00:00 +0900
category:
  - [Knou, 파이썬 프로그래밍 기초]
tags:
  - [knou, python]
math: true
mermaid: true
---

**<center>💡해당 게시글은 방송통신대학교 정재화 교수님의 '파이썬 프로그래밍 기초' 강의를 개인 공부 목적으로 메모하였습니다. </center>**

<br/><br/>

 # 학습 목표
---

- **반복 구조**의 개념과 필요성을 설명할 수 있음
- **반복 구조 설계 전략**을 통해 반복문을 작성할 수 있음
- **리스트**의 개념에 대해 설명할 수 있음

<br/><br/>

# 주요 용어

---

- **조건 제어 반복**
    - 참과 거짓 조건에 의해 반복 여부가 결정되는 반복 구조
- **계수 제어 반복**
    - 특정 계수만큼 반복 횟수가 정해진 반복 구조
- **인덱스 연산자**
    - 시퀀스 타입의 원소에 접근하는 연산자
- **중첩 반복 구조**
    - 반복 구조 내 다른 반복 구조를 내포한 형식

<br/><br/>

# 강의록

---

## 반복 구조의 정의

### 반복 구조의 개념

- 특정 영역의 명령문을 여러 번 실행하는 구조
    - 반복 횟수를 조건에 따라 결정
    - loop, iterate, repeat 용어가 혼용
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image.png)
    

### 반복 출력 프로그램(`while`문 미사용)

- '저는 파이썬을 잘 다룰 수 있습니다'를 5번 출력하는 프로그램을 작성하시오.
    
    ```python
    # 메시지 저장
    msg = "저는 파이썬을 잘 다룰 수 있습니다."
    
    # 5번 반복 출력 (개선 전)
    print(msg)
    print(msg)
    print(msg)
    print(msg)
    print(msg)
    ```
    

### 반복 구조의 구문 형식

- 구문 형식
    - 조건 제어 반복 (`while`)
        
        ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image1.png)
        
- 구문 형식
    - 계수 제어 반복 (`for`)
        
        ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image2.png)
        

### 반복 구조의 실행 흐름

- 조건 제어 반복
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image3.png)
    
    - **흐름**
        1. 반복-계속-조건을 검사함
        2. 조건이 True이면, 명령 블록을 실행함
        3. 다시 반복-계속 조건을 검사함
        4. 조건이 False가 될 때까지 2-3 단계를 반복함
        5. 조건이 False이면, 반복 구조를 종료함

### 반복 출력 프로그램 (`while` 사용)

- '저는 파이썬을 잘 다룰 수 있습니다'를 5번 출력하는 프로그램을 `while`을 사용하여 작성하시오.
    
    ```python
    # 메시지 저장
    msg = "저는 파이썬을 잘 다룰 수 있습니다."
    
    # 5번 반복 출력 (while 사용)
    count = 1
    while count <= 5:
        print(msg)
        count = count + 1 # 추가하지않으면 무한 반복함
    ```
    

### **반복 구조 설계 전략**

1. 반복 되어야 하는 명령 블록을 작성
2. 반복 되어야 하는 명령문을 다음과 같이 반복 구조로 작성
    
    ```python
    while True:
        명령 블록
    ```
    
3. 반복-계속-조건을 작성하고 반복 구조를 제어하기 위해 반복 제어 명령문을 추가
    
    ```python
    while 반복-계속-조건:
        명령 블록
        반복 제어 명령문
    ```
    

### n까지 합 계산 프로그램(반복 구조 설계 전략 적용)

- 1부터 사용자가 입력한 값 n까지 합을 구하는 프로그램을 작성하시오
    
    ```python
    sum_value = sum_value + i
    ```
    
    ```python
    while True:
        sum_value = sum_value + i
    ```
    
    ```python
    # 초기값 설정
    sum_value = 0
    i = 1
    
    # 사용자 입력 받기
    last = int(input("어디까지 더할까요?: ")) # 입력값을 정수로 변환
    
    # 합 계산 (while 사용)
    while i <= last: # 종결 조건
        sum_value = sum_value + i
        i = i + 1
    
    # 결과 출력
    print(f"1부터 {last}까지의 합은 {sum_value}입니다.")
    ```
    
    1. **반복** 되어야 할 것이 무엇인가?
    2. 1번 명령문을 **반복 구조** 안에 작성
    3. True 부분에 **종결 조건**을 작성하고, 반복 제어 명령문 추가

### 구구단 출력 프로그램

- 출력할 단을 입력 받아 해당 단의 구구단을 출력하는 프로그램을 작성하시오.
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image4.png)
    
    ```python
    # 단 입력 받기
    base = int(input("출력할 단을 입력하세요: "))
    
    # 구구단 출력 (while 사용)
    i = 1
    while i <= 9: # 종결 조건 작성
        print(base, "X", i, "=", base * i)
        i = i + 1
    ```
    

## 리스트

### 원뿔 계산 프로그램 개선

- 반지름은 10이고 높이가 1, 5, 14, 26, 31인 원뿔의 부피와 겉넓이를 각각 출력하시오.
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image5.png)
    
    - 원뿔 계산 프로그램을 여러 개의 높이 값에 대해 반복적으로 실행하는 것은 비효율적임

### 리스트의 개념

- 순서화 된 값의 집합체를 저장할 수 있는 데이터 타입
    - 단일 식별자로 연속된 저장 공간 접근 수단 제공
    - 개별 원소의 값을 수정, 추가, 삭제 가능
    - 원소(element)의 나열을 저장할 수 있는 시퀀스 타입 중 하나
        - 리스트, 세트, 투플, 딕셔너리 등

### 리스트의 구성

- 원소들의 순서를 표현
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image6.png)
    
    - **참조 변수**
        - 리스트 객체를 가리키는 변수
    - **리스트 객체**
        - 여러 개의 값을 순서대로 담고 있는 실체
    - **요소 (Element)**
        - 리스트 내부에 저장된 각각의 값

### 리스트의 생성

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image7.png)
    
    - 인용 부호 [ 와 ]를 사용하여 표현
        
        ```python
        [1, 4, 14, 26, 31]
        ```
        
        ```python
        hei_list = [1, 4, 14, 26, 31]
        ```
        
    - 원소는 콤마(,)로 나열
        
        ```python
        # 다양한 자료형을 포함하는 리스트 생성
        body = [181, 78, "dark brown", "black"]
        ```
        

### 인덱스 연산자

- 시퀀스 타입의 원소에 접근하는 연산자
    - 접근 연산자 [, ] 사용
    - 원소에 부여된 인덱스 번호로 지칭
        
        ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image8.png)
        
        - 리스트의 각 요소는 0부터 시작하는 고유한 번호(인덱스)를 가짐
        - `리스트변수[인덱스]` 형식으로 특정 위치의 요소에 접근하거나 값을 변경할 수 있음
        
        ```python
        print(hei_list[2])  # 출력: 14
        ```
        
        ```python
        hei_list[4] = 45
        print(hei_list)     # 출력: [1, 5, 14, 26, 45]
        ```
        

### 계수 제어 반복의 사용

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image9.png)
    
    - 계수-제어 변수와 시퀀스 사용
    - 반복 시 계수-제어-변수에 시퀀스의 원소 할당
- `for` 루프는 리스트와 같은 시퀀스 자료형의 요소를 하나씩 순차적으로 변수에 할당하며 반복 함
    
    ```python
    # 리스트 생성
    hei_list = [1, 4, 14, 26, 31]
    
    # 리스트의 각 요소를 순회하며 출력
    for hei in hei_list:
        print(hei)
    ```
    

### 원뿔 계산 프로그램 개선

- 반지름은 10이고 높이가 1, 5, 14, 26, 31인 원뿔의 부피와 겉넓이를 각각 출력하시오.
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image10.png)
    
- 높이 값들을 리스트에 저장하고, `for` 루프를 사용하여 각 높이에 대한 원뿔 계산을 반복 수행
    
    ```python
    rad = 10
    hei_list = [1, 4, 14, 26, 31]
    
    # 리스트의 각 요소를 순회하며 출력
    for hei in hei_list:
        # 부피 & 겉넓이 계산
        vol = 1 / 3 * 3.14 * rad ** 2 + 3.14 * rad * hei
        surf = 3.14 * rad ** 2 + 3.14 * rad * hei
        print("반지름", rad, "높이", hei, "원뿔")
        print("원뿔의 부피는", vol, "입니다.")
        print("원뿔의 겉넓이는", surf, "입니다.")
    ```
    

## 반복 구조의 확장

### 원뿔 계산 프로그램 개선

- 반지름과 높이가 (10, 1), (20, 5), (30, 14)인 원뿔의 부피와 겉넓이를 각각 출력하시오.
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image11.png)
    
    - 반지름들 사이에 나름의 규칙이 있는 경우 → 리스트 생성 자동화

### 리스트 생성 자동화

- 리스트 내 원소에 규칙성이 있는 경우 생성 자동화를 위해 함수 사용 가능
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image12.png)
    
    - a부터 b보다 작은 값까지 k씩 증가 시켜 시퀀스 생성
- `range(start, stop, step)`
    - 연속된 숫자를 생성하는 객체를 만듬
    - `start`: 시작 숫자 (포함, 생략 시 기본값 0)
    - `stop`: 끝 숫자 (**미포함**)
    - `step`: 증가 간격 (생략 시 기본값 1)

### `range` 함수의 사용

- 1부터 99까지의 숫자를 생성
    
    ```python
    range(1, 100, 1)
    ```
    
    ```python
    range(1, 100)
    ```
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image13.png)
    
- 10부터 30까지 10씩 증가하는 숫자를 생성
    
    ```python
    rad_list = range(10, 40, 10)
    ```
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image14.png)
    

### 반복 출력 프로그램 개선 (`for` 와 `range` 사용)

- ‘저는 파이썬을 잘 다룰 수 있습니다’를 5번 출력하는 프로그램을 작성하시오
    
    ```python
    # 메시지 저장
    msg = "저는 파이썬을 잘 다룰 수 있습니다."
    
    # 5번 반복 출력
    for count in range(1, 6): # 1부터 5까지 반복
        print(msg)
    ```
    

### 원뿔 계산 프로그램 개선 (`for` 와 `range` 활용)

- 반지름과 높이가 (10, 1), (20, 5), (30, 14)인 원뿔의 부피와 겉넓이를 각각 출력하시오.
    
    ```python
    rad_list = range(10, 31, 10)
    hei_list = [1, 5, 14]
    
    for rad, hei in zip(rad_list, hei_list):
        vol = 1 / 3 * 3.14 * rad ** 2 + 3.14 * rad * hei
        surf = 3.14 * rad ** 2 + 3.14 * rad * hei
        print("반지름", rad, "높이", hei, "원뿔")
        print("원뿔의 부피는", vol, "입니다.")
        print("원뿔의 겉넓이는", surf, "입니다.")
    ```
    
    - zip 함수
        - 여러 리스트의 값들을 하나씩 엮어서 가져옴

### 구구단 출력 프로그램 개선 (전체 구구단표 출력)

- 구구단 표 출력
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image15.png)
    

### 중첩 반복 구조

- 반복 구조 내 다른 반복 구조를 내포한 형식
- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image16.png)
    
    - 바깥쪽 반복이 한 번 실행될 때마다 안쪽 반복은 전체 사이클을 모두 실행함

### 중첩 반복 구조의 실행 흐름

![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image17.png)

1. 바깥쪽 루프 시작
2. 바깥쪽 루프 조건 검사 (True)
3. 안쪽 루프 시작
4. 안쪽 루프 조건 검사 (True)
5. 안쪽 루프 코드 블록 실행
6. 안쪽 루프 조건 다시 검사
    - False가 될 때까지 4-5 반복
7. 안쪽 루프 종료
8. 바깥쪽 루프 코드 블록 (안쪽 루프 이후 부분) 실행 (있다면)
9. 바깥쪽 루프 조건 다시 검사
    -  False가 될 때까지 3-8 반복
10. 바깥쪽 루프 종료

### `format` 함수

- 데이터를 양식에 맞춰 형식화
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/e2086f21-4262-4d63-b654-110ad98bd733.png)
    
    - 문자열 내에서 값의 형식을 지정하여 표현할 때 사용
        - `format(값, "형식지정자")` 형태로 사용 가능함
    - **형식 지정자 구성**
        - `[정렬방향][필드폭][데이터타입]`
        - **정렬 방향**
            - `<` (왼쪽 정렬), `>` (오른쪽 정렬), `^` (가운데 정렬)
        - **필드 폭**
            - 해당 값이 차지할 최소 너비 (칸 수)
        - **데이터 타입**
            - `d` (정수), `s` (문자열), `f` (실수) 등

### `format` 함수의 사용

- **문자열 형식**
    - **문자 타입**은 **왼쪽 정렬**이 기본
    - 문자열 "구구단표"를 10칸 너비에 오른쪽 정렬하여 출력
        
        ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image18.png)
        
- **정수 형식**
    - **정수 타입**은 우측 **정렬**이 기본
    - 정수 1234를 10칸 너비에 왼쪽 정렬하여 출력
        
        ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image19.png)
        

### 구구단 출력 프로그램 개선 (중첩 반복 및 `format` 사용)

![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image20.png)

```python
# 구구단표 헤더 출력
print(format("구구단표", ">20s")) # 제목 가운데 정렬 느낌으로

# 표 머리 출력
print("|", end="")
for j in range(1, 10):
    print(" ", j, end = "") # 각 숫자 헤더 4칸 오른쪽 정렬
# 새로운 행 삽입
print()
print("-" * 40) # 구분선

# 구구단표 본문 출력
for i in range(1, 10): # 단 (1단 ~ 9단)
    print(i, "|", end = "")) # 단 표시
    for j in range(1, 10): # 곱하는 수 (1 ~ 9)
        print(format(i * j, ">4d"), end="") # 결과값 4칸 오른쪽 정렬
    print() # 다음 단으로 넘어갈 때 줄바꿈
```

- 줄바꿈 없이 연달아 같은 라인에 출력할 수 있게 하는 옵션 end
- 반복해야 할 구간 찾기
    1. 하나의 단 안에서 곱셈하는 구간
    2. 2~9단까지 반복

### 중첩 반복 구조의 공포

- 중첩 단계가 깊어질수록 반복 횟수가 기하급수적으로 증가하여 실행 시간이 매우 길어질 수 있음
    
    ```python
    #  3중첩 for 루프 (각 1000번 반복 시): 1000 * 1000 * 1000 = 1,000,000,000 (10억) 번의 내부 연산 수행
    for i in range(1000):
        for j in range(1000):
            for k in range(1000):
                result = i * j * k # 10억 번 실행됨
    ```

<br/><br/>

# 연습 문제

---

1. 계수 제어 반복 구조에서 특정 반복 횟수와 반복 시 계수의 값을 정하기 위해 사용하는 데이터 타입은?
    a. 시퀀스
2. 다음과 같이 반복 구조 내부에 또 다른 반복 구조가 포함되어 실행 흐름을 만드는 구조를 무엇이라고 하는가? 
    
    ![image.png](/assets/img/knou/python/2025-04-14-knou-python-7/image21.png)
    
    a. 중첩 반복 구조
3. 다음 코드의 출력 값으로 옳은 것은?
    ```python
    for i in range(1, 11):
        print(i, end = " ")
    ```    
    a. 1 2 3 4 5 6 7 8 9 10

<br/><br/>

# 학습 정리

---

- **반복 구조**란 동일한 명령문에 대해서 사용자가 지정한 횟수만큼 또는 조건을 만족하는 동안 동일한 코드를 반복하여 수행할 때 사용하는 구조임
- whlie 문은 조건이 참(True)인 동안 while 문 블럭 내부의 명령문을 수행하며 조건이 거짓(False)이 될 때 while문을 빠져나오는 **조건 제어 반복 구조**임
- **리스트는 순서화 된 값의 집합체를 저장할 수 있는 시퀀스 데이터 타입의 일종임**
- for 문은 리스트 등과 같은 시퀀스의 첫 번째 요소부터 마지막 요소까지 하나 씩 변수에 대입하여 블럭의 명령문을 수행하며 마지막 요소까지 수행한 후 종료하는 **계수 제어 반복**임
- **중첩 반복 구조**는 하나의 외부 반복 구조에 여러 개의 내부 반복 구조가 중첩되어 사용되는 구조를 말하며, 외부 반복 구조가 매 반복될 때마다 내부 반복 구조에 재 진입하여 새롭게 실행됨