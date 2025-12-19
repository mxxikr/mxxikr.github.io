---
title:  "[오픈 소스 기반 데이터 분석] 10강 - 데이터 시각화"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-09-17 00:00:00 +0900
category:
  - [KNOU, Data Analysis]
tags:
  - [knou, data analysis]
math: true
mermaid: true
---

**<center>💡해당 게시글은 방송통신대학교 정재화 교수님의 '오픈 소스 기반 데이터 분석' 강의를 개인 공부 목적으로 메모하였습니다. </center>**

<br/><br/>

# 학습 개요

---

- 데이터 시각화는 복잡한 데이터를 시각적으로 표현함으로써 데이터의 구조, 패턴, 변동 등을 직관적으로 이해할 수 있도록 돕는 기술임
- 단순한 수치 나열은 사람의 인지적 부담을 증가 시키지만, 시각화는 인간의 시각 인지 체계를 활용하여 정보를 효과적으로 전달하며, 의사 결정 및 커뮤니케이션에 핵심적인 도구로 기능함
- 특히 데이터 탐색 초기 단계에서는 분석 방향을 설정하고 이상치나 추세를 식별하는 데 큰 기여를 하며, 결과 전달 단계에서는 청중의 직관적 이해를 유도하는 역할을 함
- 데이터 시각화의 개념과 필요성, 그리고 이를 실제 구현하기 위한 대표적인 오픈소스 도구인 Matplotlib에 대해 학습함
- 데이터 시각화가 다양한 영역에 걸쳐 어떤 기여를 하는지 확인하고, 인간이 시각적 대상을 어떻게 인식하는 지를 설명하는 심리학 이론인 게슈탈트 원리와 그 시각화 적용 방식에 대해 이해함
- Matplotlib 라이브러리의 구조와 기능 그리고 다양한 시각화 유형을 데이터 속성과 목적에 따라 적절히 선택하고 활용하는 방법을 학습함

<br/><br/>

# 학습 목표

---

- 데이터 시각화의 기본 개념과 필요성을 이해하고 인간의 시각 인지 원리를 데이터 시각화에 적용할 수 있음
- Matplotlib 등의 시각화 라이브러리를 활용하여 다양한 유형의 그래프와 차트를 작성할 수 있음
- 데이터의 유형과 분석 목적에 적합한 시각화 방법을 선택하고 적용할 수 있음

<br/><br/>

# 강의록

---

## 데이터 시각화의 이해

### 데이터 시각화의 개념과 필요성

- 복잡한 데이터를 시각적인 형태로 표현하는 과정
- 데이터 시각화의 필요성
    - 데이터 이해도 향상
        - 패턴과 추세를 한눈에 파악
    - 효과적인 의사소통
        - 정보를 빠르게 전달하고 직관적인 이해를 촉진
    - 의사 결정 지원
        - 데이터 기반 의사 결정에 필요한 통찰력 제공
    - 탐색적 데이터 분석에 응용

### 게슈탈트 원리와 데이터 시각화

- 데이터 시각화는 인간의 시각 인지 체계에 기반하여 설계 시 효과성 및 전달력이 향상
- 게슈탈트 원리
    - 1920년대 독일 심리학자(베르트하이머, 볼프강 쾰러, 코프카, 쿠르트 레빈)들이 20세기 전반에 걸쳐 완성한 이론
    - "전체는 부분의 합보다 크다"라는 철학을 바탕
    - 개별 데이터 포인트보다 이들이 형성하는 패턴과 관계를 통해 더 깊은 통찰을 얻을 수 있음을 강조
    - 인간이 시각적 정보를 어떻게 인식하는지 설명

### 게슈탈트 원리의 8요소

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image.png)

### 근접성(proximity)

- 서로 가까운 위치의 요소는 하나의 그룹으로 인식
- 데이터, 제목, 범례 등은 관련된 차트와 인접 배치 권장

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image1.png)

### 유사성(similarity)

- 색상, 모양, 크기 등이 유사하면 동일 그룹으로 인식
- 유사한 데이터 요소를 일관된 시각 속성으로 표현 권장

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image2.png)

### 폐쇄성(closure)

- 불완전한 형태도 완전하게 인식하려는 인지적 특성
- 최소한의 시각 정보로도 이해 가능한 구성 설계

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image3.png)

### 연속성(continuity)

- 정렬된 요소는 하나의 흐름으로 인식
- 시간 순 정렬, 오름차순/내림차순 정렬로 데이터 패턴 강조

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image4.png)

### 공동 운명(common fate)

- 같은 방향으로 움직이거나 변화하는 요소들을 동일한 그룹으로 인식

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image5.png)

### 대칭성(symmetry)

- 대칭적으로 배치된 형태를 보다 안정적이고 정돈된 구조로 인식

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image6.png)

### 단순성(prägnanz)

- 복잡하고 모호한 시각적 정보를 가장 단순하고 안정적이며 의미 있는 형태로 해석

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image7.png)

### 전경-배경(figure-ground)

- 중심(전경, figure)에 대한 명확한 초점이 형성되어야 사람들이 어떤 요소에 주목해야 하는지 판단
    - 배경(ground)은 이를 보완하거나 강조하는 역할
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image8.png)

### 데이터 유형에 따른 시각화 방법

| 유형 | 정의 | 시각화 기법 | 특징 및 용도 |
| --- | --- | --- | --- |
| 범주형 데이터 | 몇 개의 구분된 범주로 구분되는 데이터 | 막대 그래프, 파이 차트, 도넛 차트 | 범주별 빈도/비율 비교, 전체에서 각 범주의 비중 강조, 많은 범주 시 가독성 저하 |
| 수치형 데이터 | 연속적인 수치 값을 가지는 데이터 | 선 그래프, 히스토그램, 산점도, 박스 플롯, 바이올린 플롯 | 분포, 상관 관계, 변동성 등을 시각적으로 표현, 다양한 통계 지표 표현 가능 |
| 시계열 데이터 | 시간의 흐름에 따라 변화하는 데이터 | 영역 그래프, 히트맵, 선 그래프 | 시간 변화 추세 표현, 누적 변화, 주기성 등 파악에 효과적 |
| 지리 데이터 | 지리 위치 정보를 포함한 데이터 | 지도 시각화 | 공간적 패턴 분석에 유용, 특정 지역별 데이터 밀도 및 분포 시각화 가능 |

### 지리 데이터 시각화의 예

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image9.png)

## Matplotlib 라이브러리

### Matplotlib 소개

- 파이썬에서 가장 많이 사용되는 데이터 시각화 라이브러리
    - 2003년 John D. Hunter에 의해 개발
    - MATLAB의 그래프 작성 기능에서 영감을 받아 설계
    - 과학 및 공학 분야에서 데이터 표현을 위한 강력한 도구
- 주요 기능
    - 광범위한 유형의 시각화 지원 및 복합 시각화 가능
    - 그래프를 세밀하게 조정 가능한 사용자 정의 기능 제공
    - PDF, PNG, SVG, JPEG 등 다양한 이미지 형식 지원
    - Colab, GUI 애플리케이션 등 다양한 환경에서 동작

### Matplotlib 기본 구조

![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image10.png)

### Colab 한글 폰트 설정

- `matplotlib`에서 한글을 사용하기 위해서는 특별한 설정 필요
1. 나눔 폰트 설치
    
    ```bash
    ! sudo apt-get install -y fonts-nanum
    ! sudo fc-cache - fv
    !rm ~/.cache/matplotlib -rf
    ```
    
2. 런타임 → 세션 다시 시작
3. `matplotlib`의 폰트를 나눔 폰트로 지정
    
    ```python
    import matplotlib.pyplot as plt
    plt.rc('font', family='NanumBarunGothic')
    ```
    
- 런타입 연결 시 마다 재수행

### 표와 선 그래프

- 표
    - 데이터를 행과 열로 구성된 형태로 정리하여 보여주는 시각화 방법
        
        ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image11.png)
        
- 선 그래프
    - 데이터를 선으로 연결하여 변화를 시각적으로 표현
    - 시간 흐름에 따른 데이터 변화를 보여줄 때 사용
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image12.png)

### 막대 그래프와 히스토그램

- 막대 그래프
    - 범주형 데이터를 시각적으로 표현하는 대표적인 방법
    - 각 범주에 대한 값을 막대 길이로 나타내어 데이터 크기나 빈도 비교에 유용
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image13.png)
    
- 히스토그램
    - 연속형 데이터를 구간 별로 나누어 분포를 시각적으로 표현하는 그래프
    - 데이터의 중심 경향, 분산, 왜도 등 분석에 효과적
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image14.png)

### 산점도(Scatter Plot) 박스 플롯(Box Plot)

- 산점도
    - 두 개의 변수 간 관계를 시각적으로 표현
    - 데이터 포인트는 그래프 위의 한 점으로 표시, 두 변수 간 상관 관계 분석
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image15.png)
    
- 박스 플롯
    - 데이터 분포를 시각적으로 표현
    - 중앙값, 사분위수, 이상치를 효과적으로 나타내 분포를 한눈에 파악 가능
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image16.png)

### 파이 차트와 히트맵

- 파이 차트(pie chart)
    - 데이터를 비율로 나타내는 시각화 방법
    - 전체 대비 각 항목의 비중을 한눈에 파악 가능
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image17.png)
    
- 히트맵(Heatmap)
    - 행렬 형태의 데이터를 색상으로 표현
    - 데이터 간 패턴을 쉽게 파악
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image18.png)

### 레이더 차트와 3D 차트

- 레이더 차트(Radar)
    - 여러 개의 변수를 방사형으로 배치
    - 시각적으로 비교
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image19.png)
    
- 3D 차트(3D Chart)
    - 3차원 공간에서 시각화
    - 복잡한 데이터를 보다 직관적으로 표현
    
    ![image.png](/assets/img/knou/data-analysis/2025-09-17-knou-data-analysis-10/image20.png)

<br/><br/>

# 연습 문제

---

1. 데이터 시각화의 주요 목적이 아닌 것은?

    a. 복잡한 모델의 자동 튜닝

    - 데이터 시각화의 주요 목적
        - 데이터 기반 의사 결정 지원
        - 정보의 직관적 전달
        - 패턴과 추세의 명확한 인식
2. 서로 가까이 위치한 요소를 하나의 그룹으로 인식하는 시각 인지 원리는?

    a. 근접성

3. 여러 변수의 크기를 방사형으로 표현하고 비교하는 시각화 방식은?

    a. 레이더 차트

<br/><br/>

# 정리 하기

---

- 데이터 시각화는 복잡한 데이터를 시각적 형태로 표현하여 정보를 효과적으로 전달함
- 게슈탈트 원리는 인간의 시각 인지 체계를 이해하는 이론적 틀을 제공함
- 데이터 시각화는 데이터 이해도 향상, 효과적인 의사 소통, 의사 결정 지원에 중요한 역할을 함
- `Matplotlib`은 파이썬에서 가장 널리 사용되는 시각화 라이브러리임
- `Matplotlib`에서는 Figure, Axes, Axis 등의 요소로 그래프 구조를 구성함
- 데이터의 유형에 따라 적절한 시각화 기법과 원리를 선택해야 함