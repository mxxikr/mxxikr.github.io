---
title: "Google Colab 환경의 Matplotlib 한글 폰트 깨짐 현상"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-10-19 09:00:00 +0900
category:
  - [Data Science, Analysis]
tags:
  - [data, colab, python, 시각화]
math: false
mermaid: true
---

## 개요

  - Google Colab 환경에서 `matplotlib` 라이브러리 사용 시 한글 폰트가 네모(ㅁㅁㅁ) 형태로 깨지는 현상 해결 방법을 설명함
  - 폰트 설치, `matplotlib` 폰트 캐시 갱신, 런타임 자동 재시작을 통해 문제를 해결함

## 문제 현상

  - `matplotlib`을 사용한 시각화 시 그래프의 제목, 축 라벨 등 한글 텍스트가 네모(ㅁㅁㅁ)로 표시됨
  - 폰트가 설치되지 않은 상태에서 폰트를 지정하면 다음과 같은 경고가 발생함

    ```python
    # WARNING:matplotlib.font_manager:findfont: Font family 'NanumGothic' not found.
    # UserWarning: Glyph 54620 (한) missing from font(s) DejaVu Sans.
    ```

## 핵심 원인

  - 문제의 원인은 폰트 부재와 `matplotlib`의 폰트 캐시 관리 방식에 있음

### 한글 폰트 부재

  - Google Colab의 기본 리눅스 실행 환경에는 한글 렌더링에 필요한 폰트가 기본적으로 설치되어 있지 않음

### Matplotlib 폰트 캐시

  - `matplotlib`은 라이브러리를 처음 `import` 하는 시점에 시스템에 설치된 폰트 목록을 스캔하여 캐시(임시 저장) 파일을 생성함
  - 런타임 도중 `apt-get` 명령어를 사용해 새 폰트를 설치하더라도 `matplotlib`은 이미 생성된 캐시 파일을 참조하기 때문에 새로 설치된 폰트를 인식하지 못함
  - 이로 인해 사용자가 직접 '런타임 다시 시작'을 해야 하는 번거로움이 발생하며 때로는 캐시가 꼬여 재시작만으로 해결되지 않는 경우도 있음

## 해결 방법

  - 가장 안정적인 해결책은 다음 과정을 코드로 한 번에 처리하는 것임
      - 폰트 설치
      - `matplotlib` 폰트 캐시 강제 갱신
      - 런타임 자동 재시작
  - 이 과정은 두 개의 개별 코드 셀로 나누어 실행해야 함

### 폰트 설치 및 런타임 재시작
  - 나눔고딕 폰트 설치와 캐시 갱신 후 런타임이 자동으로 종료(재시작)됨

    ```python
    import subprocess
    import os
    import matplotlib.font_manager as fm

    # 나눔고딕 폰트 패키지 설치
    subprocess.run(['apt-get', 'update', '-qq'], check=True) # 조용한 모드로 업데이트
    subprocess.run(['apt-get', 'install', '-y', 'fonts-nanum*'], check=True) # 자동 설치, 나눔 폰트 관련 모든 패키지 설치

    print(">> matplotlib 폰트 캐시를 갱신합니다.")
    fm._load_fontmanager(try_read_cache=False) # 캐시 파일을 읽지 않고 시스템의 폰트 목록을 처음부터 다시 스캔하여 캐시를 재생성함

    # 런타임 재시작
    os.kill(os.getpid(), 9)
    ```

### 폰트 적용 및 시각화

  - 런타임이 재시작된 후 새로운 셀에서 다음 코드를 실행함
  - 이 시점에는 폰트가 정상적으로 설치되었고 캐시도 갱신되었으므로, `plt.rc`를 통해 폰트를 지정하면 즉시 적용됨

    ```python
    import matplotlib.pyplot as plt
    import platform

    # 런타임 재시작 후 폰트 설정 적용
    if platform.system() == 'Linux':
        plt.rc('font', family='NanumGothic') # Colab 환경의 경우 NanumGothic 폰트를 기본값으로 설정
    else:
        pass 

    # 나눔고딕 폰트에 마이너스(-) 부호가 없어 유니코드 마이너스로 대체되어 깨질 수 있음
    plt.rcParams['axes.unicode_minus'] = False # 마이너스 부호 깨짐 방지

    # 시각화 코드 실행
    plt.figure(figsize=(10, 5))
    plt.title('한글 제목 테스트')
    plt.xlabel('X축 라벨 (한글)')
    plt.ylabel('Y축 라벨 (한글)')
    plt.plot([-1, 0, 1], [1, 2, 0])
    plt.grid(True)
    plt.show()
    ```

## Reference

  - [Matplotlib 공식 문서 - 폰트 관리](https://matplotlib.org/stable/users/explain/fonts.html)
  - [Colab 공식 GitHub (관련 이슈)](https://github.com/googlecolab/colabtools/issues)