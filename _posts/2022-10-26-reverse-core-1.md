---
title: '[리버싱 핵심 원리] 기초 리버싱'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-10-26 23:55:00 +0900
category: [Security, Reversing]
tags: [reversing]
math: true
mermaid: false
---
**<center>💡해당 게시글은 이승원 님의 '리버싱 핵심 원리'를 개인 공부 목적으로 메모하였습니다. </center>**
<br/><br/>

# 기초 리버싱
---
### 리버스 엔지니어링
- **Reverse Engineering**(RE, 역공학)
    - 시스템의 **<span style="color:#F26C6C">구조</span>**, **<span style="color:#F26C6C">기능</span>**, **<span style="color:#F26C6C">동작 분석</span>**하여 **<span style="color:#F26C6C">원리 이해</span>**하며 **<span style="color:#F26C6C">단점 보완</span>**하고 **<span style="color:#F26C6C">새로운 아이디어를 추가</span>**하는 작업

### 리버스 코드 엔지니어링
- **Reverse Code Engineering**(RCE)
    - 소프트웨어 분야의 리버스 엔지니어링
    - **<span style="color:#F26C6C">분석</span>**
    - **<span style="color:#F26C6C">상세분석</span>**
    - **<span style="color:#F26C6C">소프트웨어</span>**를 **<span style="color:#F26C6C">리버싱 관점</span>**에서 **<span style="color:#F26C6C">상세하게 분석</span>**

### 리버싱(분석) 방법
- 실행 파일의 분석 방법
    1. **<span style="color:#F26C6C">정적 분석</span>**
        - **<span style="color:#F26C6C">파일 실행 없이 파일 겉모습 관찰</span>**하여 분석
            - 정보 수집해 해당 **<span style="color:#F26C6C">프로그램 구조와 동작 원리에 대해 예측</span>** 가능
            - 이후 수행될 동적 분석 방법에 대한 아이디어 제공
            - 파일 종류(exe, dll, doc, zip 등), 크기, 헤더(PE) 정보, Import/Export API, 내부 문자열, 실행 압축 여부, 등록 정보, 디버깅 정보, 디지털 인증서 등 다양한 내용 확인
        - **<span style="color:#F26C6C">디스어셈블러(Disassembler) 이용</span>**해 **<span style="color:#F26C6C">내부코드와 구조 확인</span>**
            - **디스어셈블러**
                - **<span style="color:#F26C6C">기계어</span>**(컴퓨터 언어)를 **<span style="color:#F26C6C">어셈블리어</span>**(인간 언어)로 **<span style="color:#F26C6C">변환하는 컴퓨터 프로그램</span>**
            - **기계어**
                - 컴퓨터가 읽을 수 있는 **<span style="color:#F26C6C">2진 숫자</span>**로 이루어진 언어 (**<span style="color:#F26C6C">0</span>**과 **<span style="color:#F26C6C">1</span>**)
            - **어셈블리어**
                - **<span style="color:#F26C6C">기계어</span>**를 **<span style="color:#F26C6C">사람이 보기 쉽게 문자를 기호화</span>**해서 나타낸 것
                - **<span style="color:#F26C6C">기계어와 일대일 대응</span>**이 되는 컴퓨터 프로그래밍의 저급언어
                - 컴퓨터와 가까운 언어이기 때문에 컴파일 시 **<span style="color:#F26C6C">실행 속도가 빠름</span>**
    2. **동적 분석**
        - **<span style="color:#F26C6C">파일을 직접 실행</span>**시켜 **<span style="color:#F26C6C">행위 분석</span>**, **<span style="color:#F26C6C">디버깅 통해 코드 흐름과 메모리 상태</span>** 등을 자세하게 살펴보는 방법
        - 파일, 레지스트리(Registry), 네트워크 등 관찰하며 **<span style="color:#F26C6C">프로그램 행위 분석</span>**
        - **<span style="color:#F26C6C">디버거(Debugger) 이용</span>**해 **<span style="color:#F26C6C">프로그램 내부 구조와 동작 원리 분석</span>** 가능
            - 디버깅은 리버싱의 하위 개념

### Source Code, Hex Code, Assembly Code
- 리버싱에서 취급하는 대상 → 보통 **<span style="color:#F26C6C">실행 파일</span>**
    - 소스 코드 없이 **<span style="color:#F26C6C">실행 파일의 바이너리 자체를 분석 ⇒ 소스 코드와 바이너리 코드 사이 관계</span>** 살펴보기 중요
- **Source Code**
    
    ```c
    #include "windows.h"
    #include "tchar.h"
    
    int _tmain(int argc, TCHAR* argv[])
    {
    	MessageBox(NULL, L"Hello World!", L"www.reversecore.com", MB_OK);
    
    	return 0;
    }
    ```
    
    - **<span style="color:#F26C6C">개발도구</span>**로 **<span style="color:#F26C6C">소스 코드 빌드</span>** 시 **<span style="color:#F26C6C">실행 파일 생성</span>**   
        ![image](\assets\img\reverse\reverse1-1.jpg)
        
- **Hex Code**
    - 생성된 실행 파일 ⇒ 컴퓨터가 이해할 수 있는 **<span style="color:#F26C6C">2진수(Binary) 형식</span>**
        - **<span style="color:#F26C6C">해석</span>**하기 위해 2진수 → **<span style="color:#F26C6C">16진수 형식 변환</span>** 필요
    - **Hex Editor**
        - **<span style="color:#F26C6C">binary 형식 파일을 hex 형식으로</span>** 보여주는 유틸리티
        - `_tmain()` **<span style="color:#F26C6C">소스코드 =빌드과정⇒ Hex Code</span>** 변환
            
            ```c
            int _tmain(int argc, TCHAR* argv[])
            {
            	MessageBox(NULL, L"Hello World!", L"www.reversecore.com", MB_OK);
            
            	return 0;
            }
            ```
            ![image](\assets\img\reverse\reverse1-2.jpg)
            
- **Assembly Code**
    - Hex Code도 사람에게 직관적인 형태가 아니기 때문에 **<span style="color:#F26C6C">사람이 이해하기 쉬운 어셈블리(Assembly) 코드 형태</span>**로 변환 필요
    - **<span style="color:#F26C6C">디버거를 이용</span>**해 helloworld.exe **<span style="color:#F26C6C">실행 파일 open</span>**
    - **OllyDbg**
        - **<span style="color:#F26C6C">디스어셈블리</span>**와 **<span style="color:#F26C6C">디버그</span>** 두가지 모두 가능한 툴
        - **<span style="color:#F26C6C">Hex Code</span>**를 **<span style="color:#F26C6C">디스어셈블</span>** 과정을 거쳐 **<span style="color:#F26C6C">어셈블리 코드로 변환</span>**
        - 동적 분석 툴
        - 실행 코드 분석

### 패치와 크랙

- **패치**(patch)
    - **<span style="color:#F26C6C">프로그램 파일</span>** 혹은 **<span style="color:#F26C6C">실행 중인 프로세스 메모리 내용</span>**을 **<span style="color:#F26C6C">변경</span>**하는 작업
        ![image](\assets\img\reverse\reverse1-3.jpg)
    - 프로그램의 **<span style="color:#F26C6C">취약점 수정</span>**과 **<span style="color:#F26C6C">기능 개선</span>**이 목적   
    <span style="color:rgb(203, 171, 237)">ex) MS의 windows 업데이트</span>
    
- **크랙**(crack)
    - 패치와 같은 개념이지만 **<span style="color:#F26C6C">의도가 비합법적이고 비도덕적인 경우</span>**
    - 저작권을 침해하는 행위(불법 복제/사용)에 사용

<br/><br/>

## **Reference**
* [리버싱 핵심 원리](http://www.yes24.com/Product/Goods/7529742)
