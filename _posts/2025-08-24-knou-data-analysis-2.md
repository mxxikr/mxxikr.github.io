---
title: '[오픈 소스 기반 데이터 분석] 2강 - 데이터 분석을 위한 파이썬 프로그래밍'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2025-08-24 00:00:00 +0900
category: [Data Science, Data Analysis]
tags: [knou, data-analysis]
math: true
mermaid: true
---
**<center>💡해당 게시글은 방송통신대학교 정재화 교수님의 '오픈 소스 기반 데이터 분석' 강의를 개인 공부 목적으로 메모하였습니다. </center>**

<br/><br/>

# 학습 개요

---

- 현실 세계의 다양한 데이터를 효과적으로 분석하기 위해서는 데이터를 구조적으로 저장하고 조작할 수 있는 프로그래밍 기법에 대한 이해가 필요함
- 특히, 분석 대상 데이터의 일부를 선택하거나 조건에 따라 새로운 데이터 구조를 생성해야 하는 상황이 자주 발생함
- 이러한 요구를 간결하고 효율적으로 처리하기 위해 파이썬은 시퀀스 슬라이싱과 컴프리헨션 같은 강력한 표현 기법을 제공함
- 리스트나 딕셔너리와 같은 시퀀스 데이터를 부분적으로 선택하거나, 조건에 따라 가공된 데이터를 생성하는 기법인 슬라이싱과 컴프리헨션을 학습함
- 다양한 데이터 출력 형식을 유연하게 지정할 수 있는 문자열 포맷팅 방식(C 스타일, `str.format()`, `f-문자열`)을 비교하고 실습을 통해 익힘
- 파일과 같은 외부 자원을 안전하게 관리하는 방법으로 `with`문을 활용한 컨텍스트 관리의 개념과 사용법에 대해서도 학습함

<br/><br/>

# 학습 목표

---

- 리스트와 딕셔너리를 효율적으로 조작할 수 있음
- 문자열 형식 지정 기법을 통해 데이터를 명확하게 형식화 할 수 있음
- `with`문을 활용하여 파일 및 자원을 안전하게 관리할 수 있음

<br/><br/>

# 강의록

---

## 시퀀스 슬라이싱과 컴프리헨션

### 데이터 분석과 파이썬

- 2021년 Anaconda Inc.의 데이터 과학자 3,104명 대상 조사에서 63%가 파이썬을 항상 또는 자주 사용
- 데이터 분석에 단순한 파이썬 프로그래밍 능력 이상이 요구
    - **데이터를 효과적으로 다루고 변환에 필요한 적절한 데이터 구조의 활용**
    - **처리 과정의 효율적인 표현 방법이 요구**
- 파이썬 환경에서 시퀀스(리스트, 딕셔너리 등)와 같은 데이터 구조에 대한 깊은 이해
- 오류가 없는 간결한 문법적 표현으로 보다 효율적이고 가독성 높은 코드를 작성하는 방법 필요

### 리스트 슬라이싱

- 대상 리스트의 부분 리스트를 생성 또는 수정
- **문법 형식**
    - `리스트이름[시작 인덱스: 끝 인덱스: 간격]`
    
    ![image.png](/assets/img/knou/data-analysis/2025-08-24-knou-data-analysis-2/image.png)
    
    ```python
    numbers = [10, 20, 30, 40, 50, 60, 70]
    subset1 = numbers[ :3]
    print(subset1)
    ```
    
- 리스트 슬라이싱 응용
    
    ```python
    numbers = [10, 20, 30, 40, 50, 60, 70]
    subset1 = numbers[-3 :]
    print(subset2)
    ```
    
    ![image.png](/assets/img/knou/data-analysis/2025-08-24-knou-data-analysis-2/image1.png)
    
    ```python
    numbers = [10, 20, 30, 40, 50, 60, 70]
    list1 = numbers[ : : 2]
    print(list1)
    list2 = numbers[ : : -1]
    print(list2)
    ```
    
    ![image.png](/assets/img/knou/data-analysis/2025-08-24-knou-data-analysis-2/image2.png)

### 리스트 컴프리헨션

- 리스트를 간결하게 생성 · 조작
- **문법 형식 1**
    - `[표현식 for 변수 in 반복가능한 객체]`
- **문법 형식 2**
    - `[표현식 for 변수 in 반복가능한 객체 if 조건]`
- **반복가능한 객체**
    - 리스트, 튜플, 딕셔너리, 문자열, 집합, range 객체
- 리스트 컴프리헨션 응용
    - **리스트 생성**
        
        ```python
        numbers = []
        for i in range(5):
            numbers.append(i)
        print(numbers)
        ```
        
        ```python
        numbers = [i for i in range(5)]
        print(numbers)
        ```
        
- **원소 조작**
    
    ```python
    numbers = [1, 2, 3, 4, 5]
    squares = [num ** 2 for num in numbers]
    print(squares)
    ```
    
- **조건 적용**
    
    ```python
    numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    even_numbers = [num for num in numbers if num % 2 == 0]
    print(even_numbers)
    ```

### 딕셔너리 컴프리헨션

- 대상 딕셔너리를 간결하게 생성 · 조작
- 리스트의 `[]` 연산자 대신 딕셔너리의 `{}` 연산자를 사용
- **문법 형식 1**
    - `{키: 표현식 for 변수 in 반복가능 객체}`
- **문법 형식 2**
    - `{키: 표현식 for 키변수, 값변수 in 딕셔너리.items()}`
- **딕셔너리 컴프리헨션 응용**
    - 딕셔너리 생성
        
        ```python
        # for문을 사용한 일반적인 딕셔너리 생성
        squares = {}
        for i in range(5):
            squares[i] = i ** 2
        print(squares)
        ```
        
        ```python
        # 딕셔너리 컴프리헨션을 사용한 방식
        squares = {i: i ** 2 for i in range(5)}
        print(squares)
        ```

## 문자열 형식 지정

### 문자열 형식 지정의 개념

- 데이터 분석 과정에서 특정 형식의 데이터를 출력하거나 변수 값을 포함한 문자열을 생성하는 상황이 자주 발생
    - 문자열 포맷팅(string formatting) 기능 사용
    - 처리 과정의 효율적인 표현 방법이 요구
- 오류가 없는 간결한 문법적 표현으로 보다 효율적이고 가독성 높은 코드를 작성하는 방법 필요
    - C 스타일(% 연산자) 포맷팅
    - `str.format()` 메서드를 이용한 포맷팅
    - f-문자열 포맷팅

### C 스타일(% 연산자) 포맷팅

- C 언어의 `printf()` 스타일과 유사
    - C 언어를 배운 사람이라면 쉽게 이해하고 사용
    - C와 파이썬을 함께 사용하는 환경에서 일관된 스타일 유지
    - **문법 형식**
        - `"형식 지정자를 포함한 문자열" % (변수 리스트)`
- **C 스타일의 단점**
    - 변수의 개수가 증가할 수록 복잡해지고 가독성이 저하
    - 변수의 개수가 잘못되거나 순서 불일치 시 오류 발생
    - 딕셔너리, 리스트 등 중첩된 데이터 구조를 직접 활용하기 어려움

### 주요 형식 지정자

| 형식 지정자 | 설명 |
| --- | --- |
| `%d` | 정수(decimal) 출력 |
| `%i` | 정수(integer) 출력 (`%d`와 동일) |
| `%o` | 8진수(octal) 출력 |
| `%x` | 16진수(lowercase) 출력 |
| `%X` | 16진수(uppercase) 출력 |
| `%f` | 소수점이 있는 실수(float) 출력 |
| `%.nf` | 소수점 이하 n자리까지 출력 |
| `%c` | 단일 문자 출력 (정수의 ASCII 문자 변환) |
| `%s` | 문자열(string) 출력 |
| `%%` | `%`문자 자체를 출력 |

### C 스타일 포맷팅 활용

- C 스타일 포맷팅 활용 예
    
    ```python
    item = "프린터"
    price = 360000
    print("상품명: %s, 가격: %d" % (item, price))
    ```
    
- 새로운 포맷팅
    
    ```python
    item = "프린터"
    price = 360000
    print("상품명: {}, 가격: {}".format(item, price))
    ```

### `str.format()` 메서드를 이용한 포맷팅

- 중괄호`{}`로 표시된 자리 표시자를 사용하여 문자열 내의 특정 위치에 값을 삽입하는 방식
- **문법 형식**
    - `"문자열 {위치 또는 이름}".format(인자)`
- % 연산자 방식보다 가독성이 낫고 유연
- `str.format()` 메서드의 단점
    - 복잡한 문자열 형식 지정이 필요한 경우 코드가 장황
    - 여러 줄의 복잡한 형식을 지정할 때 중괄호와 형식 지정자의 조합 시 가독성 저하

### `str.format()` 메서드 활용

- 중괄호 내에는 인덱스, 키워드 또는 속성 이름을 지정
- 형식 지정자를 통해 정렬, 패딩, 소수점 자릿수, 천 단위 구분자 등 다양한 출력 형식을 지정
    
    ```python
    # 위치 기반 포맷팅
    basic_format = '이름: {}, 나이: {}, 월급: {}원'.format(name, age, salary)
    
    # 인덱스 기반 포맷팅
    index_format = '직원 {0}의 나이는 {1}세이고, {0}의 세후 월급은 {2}원입니다.'.format(name, age, int(salary * (1 - tax_rate)))
    
    # 키워드 기반 포맷팅
    keyword_format = '직원정보: 이름: {employee} 나이: {years}세 월급: {income:,}원 세금: {tax:.1%} 실수령액: {net_income:,}원'.format(
        employee=name, 
        years=age, 
        income=salary, 
        tax=tax_rate, 
        net_income=int(salary * (1 - tax_rate))
    )
    ```

### f-문자열 (Formatted String Literal)

- 파이썬 3.6 버전부터 도입된 문자열 포멧팅 방식
- 문자열 앞에 'f' 또는 'F' 접두사를 붙이고, 문자열 내부에 중괄호({})를 사용하여 변수나 표현식을 표현
- **문법 형식**
    - `f"문자열 {표현식}"`
- 직관적 표현으로 코드의 길이가 줄고 가독성 향상
    
    ```python
    name = "홍길동"
    age = 30
    print(f"이름: {name}, 나이: {age}")
    ```

### f-문자열 활용 예

```python

<br/><br/>

# 기본 f-string
basic_format = f'이름: {name}, 나이: {age}, 월급: {salary}원'

<br/><br/>

# f-string 내 연산 포함
index_format = f'직원 {name}의 나이는 {age}세이고, {name}의 세후 월급은 {int(salary * (1 - tax_rate))}원입니다.'

<br/><br/>

# f-string 내 다양한 형식 지정
keyword_format = f'직원정보: 이름: {name} 나이: {age}세 월급: {salary:,}원 세금: {tax_rate:.1%} 실수령액: {int(salary * (1 - tax_rate)):,}원'
```

## 컨텍스트 관리

### 리소스의 사용

- 리소스는 획득 및 사용 후 명시적으로 폐기
- **리소스**
    - 파일, 데이터베이스 연결, 네트워크 소켓 등
- 폐기하지 않을 시 메모리 누수나 데이터 손상과 같은 문제 발생
    
    ```python
    file = open("output.txt", "w")
    file.write("Hello, world!\\n")
    file.close()
    ```

### 컨텍스트 관리의 이해

- **컨텍스트 관리(context management) 정의**
    - 자원을 효율적이고 안전하게 사용할 수 있도록 하는 메커니즘
    - 자원을 사용 후 명시적으로 폐기해 주어야 하는 자원의 획득과 해제를 자동으로 처리
    - `with` 키워드를 사용
    
    ```python
    file = open("output.txt", "w")
    file.write("Hello, world!\\n")
    file.close()
    ```
    
    ```python
    with open("output.txt", "w") as file:
    	file.write("Hello, world!\\n")
    ```

## 정리 하기

- 리스트 슬라이싱을 통해 배열의 특정 부분을 효율적으로 추출함
- 리스트 컴프리헨션으로 간결한 코드 작성이 가능함
- 딕셔너리 컴프리헨션으로 키-값 데이터를 효율적으로 처리함
- C 스타일 포맷팅은 간단한 형식 지정에 유용함
- `str.format()` 메서드는 `{}`를 사용한 자리 표시자로 유연한 형식 지정을 제공함
- f-문자열은 변수를 직접 문자열에 삽입 가능한 가장 직관적인 방법임
- `with`문은 파일, 네트워크 연결 등 자원의 안전한 관리를 보장함
- 예외 처리는 예외 발생 시에도 자원이 적절히 해제되어 코드 안정성을 향상 시킴

<br/><br/>

# 연습 문제

---

1. 다음 중 리스트 슬라이싱의 기본 문법 형식으로 옳은 것은?
    a. 리스트이름[시작 인덱스:끝 인덱스:간격]

2. 다음 코드 실행 결과로 올바른 것은?
    
    ```python
    
    numbers = [1, 2, 3, 4, 5]
    result = [x ** 2 for x in numbers]
    print(result)
    ```
    
    a. [1, 4, 9, 16, 25]

3. 다음 중 `str.format()`을 사용할 때 올바른 구문은?

    a. `"이름: {}, 나이: {}".format(name, age)`

<br/><br/>

# 정리 하기

---

- 리스트 슬라이싱을 통해 배열의 특정 부분을 효율적으로 추출
- 리스트 컴프리헨션으로 간결한 코드 작성이 가능함
- 딕셔너리 컴프리헨션으로 키-값 데이터를 효율적으로 처리함
- C 스타일 포맷팅은 간단한 형식 지정에 유용함
- `str.format()` 메서드는 `{}`를 사용한 자리 표시자로 유연한 형식 지정을 제공함
- `f-문자열`은 변수를 직접 문자열에 삽입 가능한 가장 직관적인 방법임
- `with`문은 파일, 네트워크 연결 등 자원의 안전한 관리를 보장함