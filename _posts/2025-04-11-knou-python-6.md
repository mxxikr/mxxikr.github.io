---
title:  "[파이썬 프로그래밍 기초] 6강 - 선택 구조"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2025-04-11 00:00:00 +0900
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

- 선택 구조를 설명할 수 있음
- 비교 연산자와 논리 연산자를 사용하여 불리언 식을 작성할 수 있음

<br/><br/>

# 주요 용어
---

- **선택 구조**
    - 특정 영역 내의 명령문에 대한 실행 여부를 판단에 따라 결정하는 구조
- **불리언 타입**
    - 논리 값인 참(True)과 거짓(False)의 값만 표현할 수 있는 데이터 타입
- **불리언 식**
    - 비교 연산자를 사용하여 결과가 불리언 타입으로 생성되는 표현 식
- **논리 연산자**
    - 두 개의 논리 값(불리언 식)을 연산하여 참 또는 거짓을 결과로 얻는 연산자

<br/><br/>

# 강의록

---

## 선택 구조

### 선택 구조의 개념

- 특정 영역 내의 명령문에 대한 실행 여부를 판단에 따라 결정하는 구조
    - 실행 여부는 조건에 따라 결정
        
        ![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image.png)
        

### 선택 구조의 구문 형식

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image1.png)
    
    - 들여 쓰기는 코드 블록을 표현
    - 특정 동작을 수행하는 한 라인 이상의 명령문의 집합
    - 스페이스 4칸 권고(PEP-8)

### 선택 구조의 실행 흐름

![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image2.png)

### 불리언 식

- 비교 연산자를 사용하여 결과가 불리언 타입으로 생성되는 표현 식
    
    
    | 연산자 | 수학적 표현 | 의미 |
    | --- | --- | --- |
    | < | < | 작음 |
    | <= | ≤ | 작거나 같음 |
    | > | > | 큼 |
    | >= | ≥ | 크거나 같음 |
    | == | = | 같음 |
    | != | ≠ | 같지 않음 |

### 불리언 타입

- 논리 값인 참(True)과 거짓(False)의 값만 표현할 수 있는 데이터 타입
    - True 또는 False 예약어를 사용하여 표현
    - 비교 연산자를 사용한 표현 식의 결과로 생성
    
    ```python
    3 > 6
    ```
    
    ```python
    light_on = 3 > 6
    ```
    
    ```python
    suf == vol
    ```
    
    ```python
    isStop = suf == vol
    ```
    

### 원뿔 계산 프로그램 개선

- 사용자가 반지름 값에 음수를 입력하면?
    
    ```python
    # 반지름 사용자 입력
    rad = int(input("반지름을 입력하세요: "))
    
    # 높이 사용자 입력
    hei = int(input("높이를 입력하세요: "))
    
    # 부피 & 겉넓이 계산
    vol = 1/3 * 3.14 * rad ** 2 * hei
    suf = 3.14 * rad ** 2 + 3.14 * rad * hei
    print("원뿔의 부피는", vol, "입니다.")
    print("원뿔의 겉넓이는", suf, "입니다.")
    ```
    

## 논리 연산자

### 논리 연산자의 개념

- 두 개의 논리 값(불리언 식)을 연산하여 참 또는 거짓을 결과로 얻는 연산자
    - 참, 거짓을 구별할 수 있는 명제를 대상으로 명제의 집합을 위해 고안한 연산자
    - 두 개의 피연산자를 갖는 이항 연산자
    - and(논리곱), or(논리합), not(논리부정) 연산자 사용
    - 왼쪽에서 오른쪽의 방향으로 결합

### and

- 두 논리 값이 모두 True 일 때 True이고 어느 하나 False일 경우 False를 반환
- 진리표
    
    
    | b1 | b2 | b1 and b2 |
    | --- | --- | --- |
    | False | False | False |
    | False | True | False |
    | True | False | False |
    | True | True | True |
    
    ```python
    temp >= 27 and fruit == "apple"
    ```
    
    ```python
    rad > 0 and hei > 0
    ```
    

### or

- 두 논리 값이 모두 False 일 때 False이고 어느 하나 True일 경우 True를 반환
- 진리표
    
    
    | b1 | b2 | b1 or b2 |
    | --- | --- | --- |
    | False | False | False |
    | False | True | True |
    | True | False | True |
    | True | True | True |
    
    ```python
    temp >= 27 or fruit == "apple"
    ```
    
    ```python
    rad > 0 or hei > 0
    ```
    

### not

- 단항 연산자로 논리 값을 반전하여 **False는 True로, True는 False로 반환**
- 진리표
    
    
    | b1 | Not b1 |
    | --- | --- |
    | False | True |
    | True | False |
    
    ```python
    not temp >= 21
    ```
    

### 단락 평가

- short-circuit evaluation
- 첫 번째 논리 값 만으로 전체 연산 결과가 판별 가능할 때 두 번째 논리 값은 확인(평가)하지 않는 기법
    
    ```python
    temp >= 27 and season == "summer"
    ```
    
    ```python
    temp >= 27 or season == "summer"
    ```
    

### 원뿔 계산 프로그램 개선

- 사용자가 높이에 음수를 입력하면?
    
    ```python
    # 반지름 사용자 입력
    rad = int(input("반지름을 입력하세요: "))
    
    # 높이 사용자 입력
    hei = int(input("높이를 입력하세요: "))
    
    if (rad > 0):
        # 부피 & 겉넓이 계산
        vol = 1/3 * 3.14 * rad ** 2 * hei
        suf = 3.14 * rad ** 2 + 3.14 * rad * hei
        print("원뿔의 부피는", vol, "입니다.")
        print("원뿔의 겉넓이는", suf, "입니다.")
    ```
    

## 선택 구조의 확장

### 원뿔 계산 프로그램 문제

- 사용자가 반지름과 높이 값에 양수를 입력할 경우 부피 겉넓이 출력
    
    ```python
    # 반지름 사용자 입력
    rad = int(input("반지름을 입력하세요: "))
    
    # 높이 사용자 입력
    hei = int(input("높이를 입력하세요: "))
    
    if (rad > 0 and hei > 0):
        # 부피 & 겉넓이 계산
        vol = 1/3 * 3.14 * rad ** 2 * hei
        suf = 3.14 * rad ** 2 + 3.14 * rad * hei
        print("원뿔의 부피는", vol, "입니다.")
        print("원뿔의 겉넓이는", suf, "입니다.")
    ```
    

### 이분 선택 구조의 구문 형식

![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image3.png)

```python
# 반지름 사용자 입력
rad = int(input("반지름을 입력하세요: "))

# 높이 사용자 입력
hei = int(input("높이를 입력하세요: "))

if (rad > 0 and hei > 0):
    # 부피 & 겉넓이 계산
    vol = 1/3 * 3.14 * rad ** 2 * hei
    suf = 3.14 * rad ** 2 + 3.14 * rad * hei
    print("원뿔의 부피는", vol, "입니다.")
    print("원뿔의 겉넓이는", suf, "입니다.")
else:
    print("반지름과 높이에 양수를 입력해주세요")
```

### 다분 선택 구조의 구문 형식

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image4.png)
    

### 다분 선택 구조의 실행 흐름

![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image5.png)

### 가장 큰 수를 찾는 프로그램

- 세 수 A, B, C를 입력 받고 그 중 가장 큰 수를 출력하는 프로그램
    
    ![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image6.png)
    
    - 내장 함수 사용
        
        ```python
        # A, B, C 사용자 입력
        A = int(input("A 입력: "))
        B = int(input("B 입력: "))
        C = int(input("C 입력: "))
        
        # A, B, C 중 가장 큰 수 출력
        max(A, B, C)
        ```
        
    - 직접 함수 만들어 사용
        
        ```python
        # A, B, C 사용자 입력
        A = int(input("A 입력: "))
        B = int(input("B 입력: "))
        C = int(input("C 입력: "))
        
        # A, B, C 중 가장 큰 수 출력
        if A > B: # 바깥쪽 if문 진입 -> True
            if A > C: # 안쪽 if문 블록 진입 -> 조건 판별
                print(A)
            else:
                print(C)
        else: # # 바깥쪽 if문 진입 -> Flase
            if B > C: # 여기서 판별
                print(B)
            else:
                print(C)
        ```
        

### 중첩 선택 구조의 구문 형식

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image7.png)
    

### 중첩 선택 구조의 실행 흐름

![image.png](/assets/img/knou/python/2025-04-11-knou-python-6/image8.png)

<br/><br/>

# 연습 문제

---

1. 파이썬에서 명령어의 논리적 집합인 명령 블록을 표현하기 위한 방법은?
    a. 들여 쓰기
2. 다음은 온도(temp)가 0 이하일 경우 "겨울입니다."를 출력하는 프로그램의 일부이다. 밑줄 친 빈 칸에 들어갈 명령문은?
    ```python
    temp = int(input("온도를 입력하세요: "))

    # _____________
        print("겨울입니다.")
    ```    
    a. `if temp <= 0:`        
3. 다음은 사용자가 입력한 수가 3과 5의 공배수일 경우 "3과 5의 공배수입니다"를, 아닐 경우 "3과 5의 공배수가 아닙니다."를 출력하는 프로그램일 일부이다. 밑줄 친 빈칸에 들어갈 연산자는?
    ```python
    guess = int(input("숫자를 입력하세요: "))

    if guess % 3 == 0 ______ guess% 5 == 0: # 빈칸
        print("3과 5의 공배수입니다.")
    else
        print("3과 5의 공배수가 아닙니다.")
    ```        
    a. `and`

<br/><br/>

# 학습 정리
---

- **선택 구조**란 특정 영역 내의 명령문에 대한 실행 여부를 조건에 따라 판단하여 결정하는 구조임
- 선택 구조의 실행 여부를 표현하는 조건은 참(True)과 거짓(False)으로 결정되는 불리언 식을 사용하며, 불리언 식은 비교 연산자를 사용하여 결과가 불리언 타입으로 생성되는 표현 식임
- **불리언 타입**은 논리 값인 참(True)과 거짓(False)의 값만 표현할 수 있는 데이터 타입임
- **논리 연산자**는 두 개의 논리 값(불리언 식)을 연산하여 참 또는 거짓을 결과로 얻는 연산자임
- **단락 평가**란 첫 번째 논리 값 만으로 전체 연산 결과가 판별 가능할 때 두 번째 논리 값은 확인(평가)하지 않는 기법임
- if, elif, else 명령어를 사용하여 이분 또는 다분 선택 구조로 확장할 수 있음
- **중첩 선택 구조**는 한 선택 구조 내부에 또 다른 선택 구조를 내포하는 구조임