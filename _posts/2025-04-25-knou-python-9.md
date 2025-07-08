---
title:  "[파이썬 프로그래밍 기초] 9강 - 함수"
author:
  name: mxxikr
  link: https://github.com/mxxikr"
date: 2025-04-25 00:00:00 +0900
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

- **함수의 개념**에 대해 설명할 수 있음
- **반환 값이 없는 함수**와 **반환 값이 있는 함수**의 차이점을 설명할 수 있음
- **변수가 참조 될 수 있는 영역**을 파악할 수 있음

<br/><br/>

# 주요 용어

---

- **동시 할당**
    - 복수 개의 변수에 값을 동시에 할당하는 명령
- **스코프**
    - 프로그램에서 변수가 참조될 수 있는 영역
- **기본 매개 변수**
    - 함수 호출 시 매개 변수가 전달되지 않을 경우 기본 값이 전달되는 매개 변수
- **가변 매개 변수**
    - 함수 호출 시 매개 변수를 사용자가 원하는 개수 만큼 지정할 수 있는 매개 변수

<br/><br/>

# 강의록

---

## **함수의 이해**

### 원뿔 계산 프로그램 개선

- 원뿔 계산을 불규칙적으로 다른 환경에서 요청하는 상황이면?
    
    ```python
    #반지름 rad = 10, 높이 hei = 20
    
    #반지름 radius = 20, 높이 height = 30
    
    #반지름 r = 5,  h = 50
    vol = 1/3 * 3.14 * r ** 2 * h
    suf = 3.14 * r ** 2 + 3.14 * r * h
    print("원뿔의 부피는", vol, "입니다.")
    print("원뿔의 겉넓이는", suf, "입니다")
    ```
    
    - 반지름과 높이가 무조건 10으로 한정 되어 있는 좋지 않은 함수
        - **다른 반지름과 높이**를 적용하려면 r, h를 수정해야 함
    
        ```python
        #반지름 rad = 10, 높이 hei = 20 
        prt_cone_vol(rad, hei)
        
        #반지름 radius = 20, 높이 height = 30 
        prt_cone_vol(radius, height)
        
        #반지름 r = 5, h = 50 
        prt_cone_vol(r, h)
        ```

### 함수의 개념

- 특정 작업을 수행하는 명령문의 집합
    - 특정 작업을 함수의 이름으로 대체
    - 유사한 유형의 문제를 해결할 수 있도록 고려
- 사용자 정의 함수
    - 내장 함수와 달리 사용자의 목적에 따라 정의된 함수
- 반환 값에 따른 함수의 종류
    - 반환 값이 없는 함수
        - `print`
    - 반환 값이 있는 함수
        - `input`, `format`, `int` 등

### 반환 값이 없는 함수 정의

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image.png)
    
    - 함수 이름은 식별자
    - 매개 변수 리스트는 0개 이상의 값을 함수 내부로 전달
    - 함수 내부에서 매개 변수 리스트는 변수와 동일하게 사용

### 원뿔 계산 함수 정의

```python
# 원뿔 계산 함수 정의
def prt_cone_vol():
    r = 10 
    h = 10 
    if r > 0 and h > 0:
        # r,h 모두 양수일 때
        vol = 1 / 3 * 3.14 * r ** 2 * h 
        print("원뿔의 부피는", vol, "입니다.")
    else:
        # r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")
```

```python
# 원뿔 계산 함수 정의
def prt_cone_vol(r, h):
    if r > 0 and h > 0:
        # r, h 모두 양수일 때
        vol= 1 / 3 * 3.14 * r ** 2 * h
        print("원뿔의 부피는", vol, "입니다.")
    else:
        # r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")
```

- 프로그램을 구성하는 하나의 코드 블럭이기 때문에 단독 실행 불가
  - 함수 호출해야 사용 가능

### 함수의 호출과 실행 흐름

```python
# 원뿔 계산 함수 정의
def prt_cone_vol(r, h):
    if r > 0 and h > 0:
        #r,h 모두 양수일 때
        vol = 1/3 * 3.14 * r ** 2 * h
        print("원뿔의 부피는", vol, "입니다.")
    else :
        #r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")

#반지름 30, 높이 50
rad = 30 
hei = 50 
prt_cone_vol(rad, hei)
```

- 함수 호출
    - 만들어진 함수를 **별도로 사용**할 수 있는 방법

### 숫자 역순 출력 프로그램

- 숫자를 입력 받고 역순으로 출력하는 함수를 사용한 프로그램을 작성하시오.
    
    ```powershell
    역순으로 출력할 숫자를 입력하세요: 4567
    7654
    ```
    
    ```python
    digits = 1234
    
    def reverse_number(num):
        while num != 0:
            digit = num % 10
            num = num // 10
            print(digit, end="") # 개행 문자 대신 한 줄에 이어서 출력
                
    reverse_number(digits)
    ```
    

## **반환 값이 있는 함수**

### 원뿔 계산 프로그램 개선

- 원뿔 계산 결과 출력 결과 형식을 상황에 따라 변경하고 싶다면?
    
    ```python
    # 원뿔 계산 함수 정의
    def prt_cone_vol(r, h)
        if r > 0 and h > 0 :
            # r, h 모두 양수일 때
            vol = 1 / 3 * 3.14 * r ** 2 * h
            print("원뿔의 부피는" , vol, "입니다.")
        else :
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    ```
    
    ```python
    # 원뿔 계산 함수 정의
    def prt_cone_vol(r, h):
        if r > 0 and h > 0 :
            # r, h 모두 양수일 때
            vol = 1 / 3 * 3.14 * r ** 2 * h
            return vol
        else:
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    ```
    

### 반환 값이 있는 함수 정의

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image1.png)
    
- 실행 후 결과 값을 남기는 함수
    - `return` 명령어와 반환 값을 열거
    - 함수 내부에 여러 개의 `return` 사용 가능

### `format` 함수

- 실수 데이터 형식화
    - 형식 지정자
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/b2c262a5-6123-473b-8ab8-9bf44231e524.png)
    

```python
def rtn_cone_vol(r, h): # 원뿔의 부피를 출력해주는 함수 정의
    if r > 0 and h > 0 :
        # r, h 모두 양수일 때
        vol = 1/3 * 3.14 * r ** 2 * h
        return vol
    else:
        # r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")

# 원뿔 부피 계산 함수 호출
rtn_cone_vol(10, 20)
print(rtn_cone_vol(10, 20), "입니다")
print(format(rtn_cone_vol(10, 20), ">20.3f"), "입니다")
print(format(rtn_cone_vol(10, 20), "<20.3f"), "입니다")
```

```python
# 원뿔 계산 함수 정의
def prt_cone_vol(r, h) :
    if r > 0 and h > 0 :
        # r, h 모두 양수일 때
        vol = 1/3 * 3.14 * r ** 2 * h
        r, h = 0, 0
        return vol
    else :
        # r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")

#반지름 10, 높이 50
rad = 10
hei = 50
print(format( prt_cone_vol(rad, hei) , ">10.3f"))
print(rad, hei)
```

### 원뿔 계산 프로그램 개선

- 부피와 겉넓이를 모두 반환하려면?
    
    ```python
    # 원뿔 계산 함수 정의
    def prt_cone_vol(r, h)
        if r > 0 and h > 0:
            # r, h 모두 양수일 때
            vol = 1/3 * 3.14 * r ** 2 * h
            return vol
        else:
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    ```
    
    ```python
    def rtn_cone_vol_surf(r, h): # 원뿔의 부피를 출력해주는 함수 정의
        if r > 0 and h > 0 :
            # r, h 모두 양수일 때
            vol = 1/3 * 3.14 * r ** 2 * hei
            surf = 3.14 * r ** 2 + 3.14 * r * h
            return vol, surf # vol과 surf 동시 리턴
        else:
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    
    print(rtn_cone_vol_surf(50, 100))
    vol1, surf1 = rtn_cone_vol_surf(50, 100)
    print(vol1, "입니다.")
    print(surf1, "입니다.")
    ```
    

### 동시 할당의 개념

- 복수 개의 변수에 값을 동시에 할당
    - 변수의 개수에 상응하는 값을 **콤마**(,)로 나열
        
        ```python
        temp = 27
        season = "summer"
        ```
        
        ```python
        temp, season = 27, "summer"
        ```
        

### 교환(swap)

- 복수 개의 변수에 할당하는 값을 맞바꿈
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image2.png)
    
    ```python
    temp = hei
    hei = rad
    rad = temp
    ```
    
    ```python
    rad, hei = hei, rad
    ```
    

### 정렬 프로그램

- 세 개의 사용자 입력을 오름차순으로 정렬하는 함수를 이용하여 정렬된 값을 출력하는 프로그램을 작성하시오.
    
    ```python
    첫번째 숫자를 입력하세요: 59
    두번째 숫자를 입력하세요: 1
    세번째 숫자를 입력하세요: 103
    정렬된 숫자는 1, 59, 103 입니다.
    ```
    
    ```python
    a = int(input("첫번째 숫자를 입력하세요: "))
    b = int(input("두번째 숫자를 입력하세요: "))
    c = int(input("세번째 숫자를 입력하세요: "))
    
    def sort3(a, b, c):
        if a > b:
            a, b = b, a
        if a > c:
            a, c = c, a
        if b > c:
            b, c = c, b
                
        print(a, b, c)
    
    sort3(a, b, c)
    print("출력 이후" , a, b, c) # 함수 내부에는 값만 전달되므로, 변수에는 영향이 가지 않음
    ```
    

## **함수의 확장**

### 반환 값이 있는 함수의 호출

```python
# 원뿔 계산 함수 정의
def prt_cone_vol(r, h) :
    if r > 0 and h > 0 :
        # r, h 모두 양수일 때
        vol = 1/3 * 3.14 * r ** 2 * h
        return vol
    else :
        # r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")
        
#반지름 10, 높이 50
rad = 10
hei = 50
format(prt_cone_vol(rad, hei) , ">10.3f")
```

```python
# 원뿔 계산 함수 정의
def prt_cone_vol(r, h) :
    if r > 0 and h > 0 :
        # r, h 모두 양수일 때
        vol = 1/3 * 3.14 * r ** 2 * h
        r, h = 0, 0
        return vol
    else :
        # r, h가 음수일 때
        print("반지름과 높이 값에 양수를 입력하세요")

#반지름 10, 높이 50
rad = 10
hei = 50
print(format(prt_cone_vol(rad, hei) , ">10.3f"))
print(rad, hei)
```

### 값의 전달

- 함수가 호출될 때, 값이 매개 변수에 전달
    
    ```python
    x = 1
    print("x의 값은", x)
    inc(x) # inc 함수 정의 전이기 때문에 오류 발생
    
    def inc(x):
        x = x + 1 
        print("x의 값은", x)
    
    print("x의 값은", x)
    ```
    
    - 값에 의한 전달이므로 함수 내부에서 계산된 값이 함수 외부에는 반영 되지 않음
    - 변수가 전달 되는 것이 아니라 값이 전달됨
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image3.png)
    

### 변수의 스코프

- 프로그램에서 변수가 참조될 수 있는 영역
    
    ```python
    x = 1
    print("x의 값은", x)
    
    def inc(x):
        x = x + 1
        print("x의 값은", x)
    		
    inc(x)
    print("x의 값은", x)
    ```
    
    - **전역 변수**
        - 프로그램 전체 영역에서 접근
    - **지역 변수**
        - 선언된 함수 내부에서만 접근
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image4.png)
    
    - y 호출 부분에 오류 발생
- 함수 내부에서의 변수와 함수 외부에서의 변수는 다름
    
    ```python
    def rtn_cone_vol(r, h): # 원뿔의 부피를 출력해주는 함수 정의
        if r > 0 and h > 0 :
            # r, h 모두 양수일 때
            vol = 1/3 * 3.14 * r ** 2 * hei
            r, h = 0, 0 # 0으로 초기화
            return vol 
        else:
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    
    radius = 50
    height = 100
    print(format(rtn_cone_vol(radius, height), ">10.3f"))
    print("함수 사용 후 ", radius, height)
    ```
    

### 원뿔 계산 프로그램 개선

- 단위 원뿔(반지름 20, 높이 30)의 부피와 겉넓이를 출력하려면?
    
    ```python
    # 원뿔 계산 함수 정의
    def prt_cone_vol_surf(r, h) :
        if r > 0 and h > 0 :
            # r, h 모두 양수일 때
            vol = 1/3 * 3.14 * r ** 2 * h
            suf = 3.14 * r ** 2 + 3.14 * r * h
            return vol, surf
        else :
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    ```
    

### 기본 매개 변수

- 함수 호출 시 매개 변수가 전달되지 않을 경우 기본 값이 전달되는 매개 변수
    
    ```python
    print("Hello", "I am Python")
    ```
    
    ```python
    print("Hello", "I am Python", sep = " ")
    ```
    

### 기본 매개 변수의 정의

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image5.png)
    
    - 일반 매개 변수 앞에 위치할 수 없음
- 매개 변수를 입력하지 않으면 기본 값이 적용되는 프로그램
    
    ```python
    def rtn_cone_vol_surf(r = 20, h = 30): # 함수 정의 부분에 기본 값 지정
        if r > 0 and h > 0 :
            # r, h 모두 양수일 때
            vol = 1/3 * 3.14 * r ** 2 * hei
            surf = 3.14 * r ** 2 + 3.14 * r * h
            return vol, surf # vol과 surf 동시 리턴
        else:
            # r, h가 음수일 때
            print("반지름과 높이 값에 양수를 입력하세요")
    
    print(rtn_cone_vol_surf(100, 200))
    print(rtn_cone_vol_surf())
    ```
    

### 원뿔 계산 프로그램 개선

- 반지름은 10이고 높이가 1, 5, 14, 26, 31인 원뿔의 부피와 겉넓이를 각각 출력하시오.
    
    ```
    반지름 10 , 높이 1 원뿔
    부피: 104.66666666666666 높이: 345.4
    반지름 10 , 높이 5 원뿔
    부피: 523.3333333333333 높이: 471.0
    
    반지름 10 , 높이 31 원뿔
    부피: 3244.6666666666665 높이: 1287.4
    ```
    
    - 함수를 이용해서 만들되, 리스트를 만든 것과 같은 효과가 나는 프로그램

### 가변 매개 변수

- 함수 호출 시 매개 변수를 사용자가 원하는 개수 만큼 지정할 수 있는 매개 변수
    
    ```python
    x = 10
    y = 20
    z = 30
    
    print("x는", x, "y는", y, "z는", z)
    ```
    
    - 변수의 개수가 한정되어 있지 않음
    - 실제 전달 될 때 리스트 형태로 전달 됨
        - for 문 사용
    - 시퀀스 개념을 사용하여 하나의 할당 연산자만으로 여러 값들을 한번에 전달

### 가변 매개 변수의 정의

- 구문 형식
    
    ![image.png](/assets/img/knou/python/2025-04-25-knou-python-9/image6.png)
    
    - 일반 매개 변수 앞에 위치할 수 없음
    - 가변 매개 변수는 1개만 사용 가능
- 파라미터의 개수가 가변적인 형태의 함수
- 파라미터의 개수가 정해지지 않았다면 파라미터로 넘어오는 값들은 시퀀스 형태로 전달
    - 반복이 사용 됨
    
    ```python
    def var_sum_avg(*numbers):
        sum = 0
        count = 0 # 파라미터의 개수를 알아내기 위한 변수
        for i in numbers: # 시퀀스 내에 있는 값들을 하나씩 가져오기 위해 for문 사용
            sum = sum + i 
            count = count + 1 # 평균을 구하기 위해 파라미터의 개수 구함
                
        return sum, sum/count
    
    print(var_sum_avg(10, 20, 30 , 40))
    print(var_sum_avg(20, 25, 10, 85, 100 , 150)) # 입력 값의 개수가 달라져도 정상 동작함
    ```

<br/><br/>

# 연습 문제

---

1. 다음 중 반환 값에 따른 함수의 종류를 구분할 때, 나머지와 다른 하나는?

    a. `print`
    - 반환 값에 따른 함수의 종류가 같은 것
        - `input`
        - `format`
        - `int`
2. 다음 코드의 실행 결과는?
    
    ```python
    temp, season = 27, "summer"
    season, temp = temp, season
    print(season)
    ```
    
    a. 27
3. 다음 코드의 실행 결과는?
    
    ```python
    x = 1
    def updatex():
        x = 2
        x = x + 1
    
    updatex()
    print(x)
    ```
    
    a. 1

<br/><br/>

# 학습 정리

---

- **함수**란 특정 작업을 함수의 이름 만으로 수행하는 명령문의 집합을 말함
- **반환 값의 유무**에 따라 반환 값이 없는 함수와 반환 값이 있는 함수로 구분 됨
    - **반환 값이 없는 함수**는 함수 실행 후 어떤 값도 남기지 않는 함수임
    - **반환 값이 있는 함수**는 함수 내부에서 return 명령어를 통해 값을 남김
- **동시 할당**이란 복수 개의 변수에 값을 동시에 할당하는 연산임
    - 이를 통해 단일 명령문으로 변수의 값을 맞바꿈이 가능함
- **값의 전달에 의한 호출**이란 함수 호출 시 함수 내부에는 매개 변수의 값이 전달 됨
- **변수의 스코프**는 프로그램에서 변수가 참조 될 수 있는 영역임
    - 변수의 스코프에 따라 변수는 전역 변수와 지역 변수로 구분 됨
- **기본 매개 변수**란 함수 호출 시 매개 변수가 전달되지 않을 경우 기본 값이 전달 되는 매개 변수를 말함
- 함수 호출 시 매개 변수를 사용자가 원하는 개수 만큼 지정할 수 있는 매개 변수를 **가변 매개 변수**라고 하며, 함수 정의 시 매개 변수 이름 앞에 `*`를 사용함