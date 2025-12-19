---
title: "Windows Event Viewer"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-25 04:00:00 +0900
category:
  - [OS, Windows]
tags:
  - [os, windows, event viewer]
math: true
mermaid: true
---
# 이벤트 로그 확인 및 추출
---
### **이벤트 뷰어**
* Windows는 계속해서 시스템을 감시하다가 비정상적이거나 따로 기록해야 할 만한 이벤트가 발생하면 로그로 기록함
    * 현재 겪고 있는 오류 원인을 모를 때 참고
    * 사고 발생 시 추적 가능

### **이벤트 필터링**
1. win+R에 아래 명령어 입력해 이벤트 뷰어 접속 
    ```powershell
    eventvwr.msc
    ``` 
    ![image](/assets/img/windows/event-viewer-1.jpg)  
2. 확인할 로그 선택 → 우클릭 → 현재 로그 필터링  
    ![image](/assets/img/windows/event-viewer-2.jpg)
3. 필터링 구성 입력 → 확인  
    ![image](/assets/img/windows/event-viewer-3.jpg)
    * **로그 기간**
    * **이벤트 수준**
4. 이벤트 뷰어 로그 확인   
    ![image](/assets/img/windows/event-viewer-4.jpg)  
    ![image](/assets/img/windows/event-viewer-5.jpg)
    * `일반`
        * 이벤트의 공급자, 이벤트 이름 및 ID에 대한 설명
    * `Provider Name`
        * 이벤트 소스
    * `EventSourceName`
        * 해당 공급자가 지정한 이벤트
    * `TimeCreated SystemTime`
        * 이벤트가 발생한 시간
    * `Provider GUID`
        * 이벤트 공급자의 ID
    * `EventID`
        * 이벤트의 ID
    * `ProcessID`
        * 이벤트가 발생한 프로세스
    * `ThreadID`
        * 이벤트가 발생한 스레드의 ID

### **이벤트 로그 추출**
1. 확인할 로그 선택 → 필터링 된 로그파일을 다른이름으로 저장  
    ![image](/assets/img/windows/event-viewer-6.jpg)
2. 파일 이름 입력후 이벤트 파일 저장
<br/><br/>

# 블루 스크린 로그
---
### **블루 스크린 로그 확인**
1. win+R에 아래 명령어 입력해 이벤트 뷰어 접속 
    ```powershell
    eventvwr.msc
    ``` 
2. 사용자 지정 보기 → 관리 이벤트 → 이벤트 ID 1001 확인
    ```
    컴퓨터가 오류 검사 후 다시 부팅 되었습니다. 오류 검사 : 0x00000050
    덤프 저장 위치 : C:\Windows\MEMORY.DMP
    ```
    - `C:\Windows\MEMORY.DMP`
        - 블루 스크린 발생 상황 덤프 저장 위치
    - `오류 검사 50`
        - 블루 스크린
    - `이벤트 ID 1001`
        - 블루 스크린
    - `원본 BugCheck`
        - 블루 스크린
<br/><br/>

## **Reference**
* [Microsoft Learn](https://learn.microsoft.com/ko-kr/security-updates/security/20214103)
