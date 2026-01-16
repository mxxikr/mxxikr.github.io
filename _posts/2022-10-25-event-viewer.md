---
title: Windows Event Viewer
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-10-25 04:00:00 +0900
category: [OS, Windows]
tags: [os, windows, event-viewer, troubleshooting, logging]
math: true
mermaid: false
---
<br/><br/>

## Event Viewer 개요
- Windows 운영체제와 애플리케이션의 상태를 기록하는 핵심 로깅 도구
- 시스템 오류, 보안 감사, 애플리케이션 충돌 등 모든 주요 이벤트 기록
- 트러블슈팅 및 보안 감사의 출발점


<br/><br/>

## Event Viewer 실행 방법


### 실행 방법

- **Win + R** 단축키로 실행 창 열기
  ```
  eventvwr.msc
  ```
  ![image](/assets/img/windows/event-viewer-1.jpg)

- 또는 시작 메뉴에서 검색
  - "이벤트 뷰어" 또는 "Event Viewer" 검색


<br/><br/>

## 5가지 핵심 로그 카테고리 (Windows Logs)


### Windows Logs 구조

![mermaid-diagram](/assets/img/windows/2022-10-25-event-viewer-diagram-1.png)

![image](/assets/img/windows/image.png)

### 로그 카테고리 상세 설명

| 로그 이름 | 설명 | 주요 사용 시나리오 | 예시 이벤트 |
|-----------|------|---------------------|-------------|
| **System** | Windows OS 구성 요소 로그 | OS 자체의 문제 진단 | 부팅 실패, 드라이버 오류, Blue Screen, 서비스 시작/중단 |
| **Application** | 설치된 애플리케이션 로그 | 프로그램 오류 추적 | 프로그램 충돌(Crash), DB 연결 실패, 애플리케이션 예외 |
| **Security** | 보안 감사 로그 | 보안 이벤트 모니터링 | 로그인 성공/실패, 권한 변경, 계정 잠김, 파일 접근 |
| **Setup** | Windows 설치 및 업데이트 로그 | 업데이트 문제 해결 | Windows Update 성공/실패, 기능 추가/제거 |
| **Forwarded Events** | 다른 컴퓨터로부터 전송받은 로그 | 중앙 집중식 로그 관리 | 여러 서버/PC 로그 통합 모니터링 |



### 각 로그 사용 가이드

- **System 로그**
  - Windows에 이상 증상이 있을 때 최우선 확인
  - 블루스크린, 예기치 않은 재부팅, 하드웨어 오류 진단
  - 드라이버 충돌 및 시스템 서비스 문제 추적

- **Application 로그**
  - 특정 프로그램이 비정상 종료될 때 확인
  - 개발한 애플리케이션의 로그 확인
  - 서드파티 소프트웨어 오류 분석

- **Security 로그**
  - 누가 언제 로그인했는지 감시
  - 무차별 대입 공격(Brute Force) 탐지
  - 파일 접근 권한 변경 추적
  - 보안 정책 위반 확인


<br/><br/>

## 이벤트 레벨 (심각도)


### 심각도 레벨 분류

![image](/assets/img/windows/image1.png)

### 레벨별 상세 설명

| 레벨 | 의미 | 조치 필요성 | 예시 |
|------|------|-------------|------|
| **Critical** | 시스템 중단 또는 치명적 오류 | 즉각 조치 필수 | 시스템 충돌, 데이터 손실 |
| **Error** | 기능 수행 실패 | 빠른 조치 권장 | 서비스 시작 실패, 파일 저장 오류 |
| **Warning** | 잠재적 위험 존재 | 모니터링 필요 | 디스크 용량 80% 초과, 메모리 부족 경고 |
| **Information** | 정상 작업 기록 | 조치 불필요 | 서비스 정상 시작, 업데이트 완료 |
| **Audit Success** | 보안 감사 성공 | 정상 동작 확인 | 로그인 성공, 권한 부여 성공 |
| **Audit Failure** | 보안 감사 실패 | 보안 위협 검토 | 로그인 실패, 권한 거부 (주의: 단순 실수도 포함됨) |


<br/><br/>

## 이벤트 필터링 및 검색


### 이벤트 조회 프로세스

![image](/assets/img/windows/image2.png)

### 로그 필터링 방법

- 원하는 로그 선택 후 우클릭
  - **현재 로그 필터링(Filter Current Log)** 선택
    ![image](/assets/img/windows/event-viewer-2.jpg)

- 필터 조건 설정
    ![image](/assets/img/windows/event-viewer-3.jpg)
  - **로그 기간(Logged)**
    - 언제
      - 조회할 시간 범위 선택
    - 사용자 지정 범위
      - 시작일/종료일 지정
  
  - **이벤트 수준(Event level)**
    - Critical
      - 치명적 오류만
    - Error
      - 오류만
    - Warning
      - 경고만
    - Information
      - 정보성 이벤트만
    - 다중 선택 가능
  
  - **이벤트 소스(Event sources)**
    - 특정 공급자(Provider) 선택
  
  - **이벤트 ID(Event IDs)**
    - 특정 Event ID 입력 (쉼표로 구분)
    - 예시
      - `41, 1000, 4625` 입력하면 해당 ID만 표시

- 확인 클릭하여 필터 적용



### 필터링 예시

- **오류만 보기**
  - Event level에서 `Critical`, `Error` 체크

- **특정 시간대 이벤트**
  - Logged에서 시작/종료 시간 지정

- **부팅 관련 문제 찾기**
  - Event IDs에 `41, 6008` 입력


<br/><br/>

## 커스텀 뷰 (Custom View) 생성


### 커스텀 뷰 필요성
- 반복적으로 동일한 필터링 작업 수행 시 비효율적
- 자주 확인하는 조건을 뷰로 저장하여 재사용
- 여러 로그 카테고리를 통합하여 한 번에 조회 가능


### 커스텀 뷰 생성 방법

- Event Viewer 우측 패널에서 **Create Custom View** 클릭

- 필터 조건 설정
  - By log
    - 특정 Windows Logs 선택
  - By source
    - 특정 Event source 선택
  
- 조건 예시
  - "최근 24시간 동안 발생한 System 및 Application 오류"
    - Logged
      - Last 24 hours
    - Event level
      - Critical, Error 체크
    - Event logs
      - System, Application 선택

- 뷰 이름 및 설명 입력
  - Name
    - 예: "Critical Errors - Last 24h"
  - Description
    - 설명 추가 (선택사항)

- 저장 위치 선택
  - Custom Views 폴더 또는 하위 폴더

- 생성 후 좌측 **Custom Views** 메뉴에 고정



### 유용한 커스텀 뷰 예시

| 뷰 이름 | 조건 | 용도 |
|---------|------|------|
| **All Errors** | Critical + Error, 모든 로그, 최근 7일 | 전체 시스템 오류 모니터링 |
| **Security Audit** | Security 로그, Event ID 4624, 4625 | 로그인 성공/실패 추적 |
| **Application Crashes** | Application 로그, Event ID 1000, 1001 | 프로그램 충돌 분석 |
| **System Boot Issues** | System 로그, Event ID 41, 6008 | 부팅 문제 진단 |


<br/><br/>

## 이벤트 상세 정보 확인


### 이벤트 필드 설명

- 이벤트 선택 후 하단 세부 정보 확인
    ![image](/assets/img/windows/event-viewer-4.jpg)
    ![image](/assets/img/windows/event-viewer-5.jpg)

- **일반(General) 탭**
  - 이벤트 설명 및 기본 정보

- **세부 정보(Details) 탭**
  - XML 형식의 상세 정보


### 주요 필드

| 필드명 | 설명 | 활용 |
|--------|------|------|
| **Provider Name** | 이벤트 소스 (이벤트를 생성한 구성 요소) | 어떤 프로그램/서비스에서 발생했는지 확인 |
| **EventSourceName** | 해당 공급자가 지정한 이벤트 이름 | 이벤트 유형 식별 |
| **TimeCreated SystemTime** | 이벤트 발생 시간 (UTC) | 시간대별 문제 패턴 분석 |
| **Provider GUID** | 이벤트 공급자의 고유 ID | 시스템 전체에서 동일 공급자 추적 |
| **EventID** | 이벤트 고유 식별자 | 문제 해결 시 가장 중요한 정보 |
| **ProcessID** | 이벤트를 발생시킨 프로세스 ID | 어떤 프로세스가 원인인지 확인 |
| **ThreadID** | 이벤트를 발생시킨 스레드 ID | 멀티스레드 애플리케이션 디버깅 |
| **Computer** | 이벤트가 발생한 컴퓨터 이름 | 원격 로그 수집 시 출처 확인 |


<br/><br/>

## 주요 Event ID 참조표


### 자주 발생하는 Event ID

![image](/assets/img/windows/image3.png)

### Event ID 상세 참조표

| Event ID | 로그 종류 | 의미 | 주요 원인 | 해결 방향 |
|----------|-----------|------|-----------|-----------|
| **41** | System | Kernel-Power (비정상 종료 후 재부팅) | 전원 공급 장치 문제, 과열, 강제 재부팅 (재부팅 직후 기록됨) | 전원 케이블 확인, 온도 점검, UPS 고려 |
| **1000** | Application | Application Error (프로그램 충돌) | 버그, DLL 충돌, 리소스 부족 | Faulting module name 확인 후 해당 프로그램/DLL 재설치 |
| **1001** | System | BugCheck (블루스크린, BSOD) | 드라이버 충돌, 하드웨어 오류, 메모리 불량 (Source: BugCheck) | 덤프 파일 분석 (`C:\Windows\MEMORY.DMP`), 드라이버 업데이트 |
| **1002** | Application | Application Hang (응답 없음) | 무한 루프, 리소스 대기, 데드락 | 프로세스 덤프 분석, 애플리케이션 패치 확인 |
| **4624** | Security | 로그인 성공 | 정상 사용자 로그인 | Logon Type 확인 (2: Interactive, 3: Network, 10: RDP) |
| **4625** | Security | 로그인 실패 | 잘못된 비밀번호, 무차별 대입 공격 | 실패 횟수 모니터링, IP 차단, 계정 잠금 정책 검토 |
| **4740** | Security | 계정 잠김 | 로그인 실패 정책 임계값 초과 | Caller Computer Name 확인, 악의적 시도인지 판단 |
| **6008** | System | 예기치 않은 시스템 종료 | 정전, 강제 종료, BSOD | 언제 켜졌고 꺼졌는지 시간 확인, 전원 로그 점검 (ID 41과 함께 발생 시 하드웨어 문제 가능성 높음) |
| **7000** | System | 서비스 시작 실패 | 종속성 문제, 권한 부족, 구성 오류 | 서비스 종속성 확인, 권한 설정 검토 |
| **7001** | System | 서비스 종속성 실패 | 선행 서비스가 시작되지 않음 | 종속 서비스 상태 확인 |
| **10016** | System | DCOM 권한 오류 | COM 구성 요소 권한 부족 | Component Services에서 권한 부여 |



### 블루스크린 관련 Event ID 상세

- **Event ID 1001 (BugCheck)**
  - 블루스크린 발생 시 기록되는 핵심 이벤트
  - 덤프 파일 위치 정보 포함
    - `C:\Windows\MEMORY.DMP`
  
- 블루스크린 로그 확인 방법
  - Event Viewer → 사용자 지정 보기 → 관리 이벤트
  - Event ID 1001 검색
  
- 덤프 파일 정보
  ```
  컴퓨터가 오류 검사 후 다시 부팅 되었습니다.
  오류 검사: 0x00000050
  덤프 저장 위치: C:\Windows\MEMORY.DMP
  ```
  
  - **오류 검사 코드**
    - `0x00000050`
      - PAGE_FAULT_IN_NONPAGED_AREA
    - 각 코드는 특정 오류 유형을 의미
  
  - **원본(Source)**
    - `BugCheck`
      - 블루스크린 발생 표시


<br/><br/>

## 이벤트 로그 추출 및 저장


### 로그 저장 목적
- 장기 보관 및 아카이빙
- 오프라인 분석
- 보안 감사 증거 자료
- 다른 시스템과 공유


### 로그 저장 방법

- 저장할 로그 선택 후 우클릭
  - **다른 이름으로 모든 이벤트 저장(Save All Events As)**
    ![image](/assets/img/windows/event-viewer-6.jpg)

- 파일 형식 선택
  - **이벤트 파일 (*.evtx)**
    - 권장 형식
    - Event Viewer에서 직접 열 수 있음
  - **XML**
    - 다른 도구로 파싱 가능
  - **CSV**
    - Excel 등에서 분석 가능
  - **Text**
    - 텍스트 에디터로 열람

- 파일명 입력 후 저장


### 저장된 로그 열기

- Event Viewer 실행
- **작업(Action)** 메뉴 → **저장된 로그 열기(Open Saved Log)**
- `.evtx` 파일 선택


<br/><br/>

## 원격 컴퓨터 로그 확인


### 원격 로그 접근 시나리오
- 서버실에 가지 않고 사무실에서 서버 로그 확인
- 여러 컴퓨터의 로그를 한곳에서 모니터링
- 중앙 집중식 로그 관리


### 원격 연결 프로세스

![image](/assets/img/windows/image4.png)

### 원격 연결 설정

- Event Viewer 최상위 노드 우클릭
  - **Event Viewer (Local)** 우클릭
  - **Connect to Another Computer** 선택

- 원격 컴퓨터 정보 입력
  - Another computer
    - 컴퓨터 이름 또는 IP 주소 입력
  - Connect as another user (선택사항)
    - 다른 계정으로 연결 시 체크


### 전제 조건

- **네트워크 요구사항**
  - 양쪽 컴퓨터가 같은 도메인에 속하거나 신뢰 관계 설정
  - 또는 동일한 로컬 계정 정보 사용

- **방화벽 설정**
  - 원격 컴퓨터에서 **Remote Event Log Management** 규칙 허용
  - Windows Defender 방화벽 → 인바운드 규칙 확인
  - 규칙 활성화
    ```
    규칙 이름: Remote Event Log Management (NP-In)
    규칙 이름: Remote Event Log Management (RPC)
    규칙 이름: Remote Event Log Management (RPC-EPMAP)
    ```

- **서비스 실행**
  - 원격 컴퓨터에서 **Remote Registry** 서비스 실행 중이어야 함
  - 서비스 시작 방법
    ```powershell
    # PowerShell 관리자 권한으로 실행
    Start-Service RemoteRegistry
    
    # 자동 시작 설정
    Set-Service RemoteRegistry -StartupType Automatic
    ```

- **권한**
  - 원격 컴퓨터의 **Event Log Readers** 그룹 또는 **Administrators** 그룹 멤버십 필요


<br/><br/>

## 활용 가이드


### 트러블슈팅 워크플로우

![mermaid-diagram](/assets/img/windows/2022-10-25-event-viewer-diagram-3.png)

![image](/assets/img/windows/image5.png)

### 로그 분석 핵심 포인트

- **오류 우선 확인**
  - 항상 필터링으로 Critical과 Error만 먼저 확인
  - Warning은 필요 시 추가 검토

- **시간대 패턴 찾기**
  - 특정 시간에 반복되는 오류는 스케줄 작업이나 배치 프로세스 의심
  - 부팅 직후 발생하는 오류는 시작 프로그램 관련

- **Event ID 중심 분석**
  - 동일한 Event ID가 반복되면 근본 원인 파악 필요
  - Microsoft 문서에서 Event ID로 검색하여 상세 정보 확인

- **연관성 찾기**
  - 여러 로그 카테고리에서 동일 시간대 이벤트 확인
  - 한 이벤트가 다른 이벤트를 촉발할 수 있음



### 정기 점검 체크리스트

| 점검 항목 | 주기 | 확인 내용 |
|-----------|------|-----------|
| **Critical/Error 이벤트** | 매일 | 새로운 치명적 오류 발생 여부 |
| **로그인 실패 (4625)** | 매일 | 무차별 대입 공격 시도 확인 |
| **디스크 용량 경고** | 주간 | 디스크 공간 부족 Warning 확인 |
| **서비스 시작 실패 (7000)** | 주간 | 중요 서비스 정상 작동 여부 |
| **블루스크린 (1001)** | 발생 시 | 하드웨어/드라이버 문제 진단 |



### 커스텀 뷰 추천 세트

- **Daily Security Check**
  - Security 로그
  - Event ID 4625, 4740
  - Last 24 hours
  - 용도
    - 로그인 실패 및 계정 잠김 모니터링

- **System Health Monitor**
  - System 로그
  - Critical, Error, Warning
  - Last 7 days
  - 용도
    - 시스템 전반적인 건강 상태 확인

- **Application Errors**
  - Application 로그
  - Critical, Error
  - Last 7 days
  - 용도
    - 애플리케이션 오류 추적


<br/><br/>

## PowerShell을 통한 Event Log 조회


### 명령줄로 로그 조회

- 기본 조회
  ```powershell
  # System 로그 최근 10개 이벤트
  Get-EventLog -LogName System -Newest 10
  
  # Application 로그 오류만
  Get-EventLog -LogName Application -EntryType Error -Newest 50
  ```

- 특정 Event ID 검색
  ```powershell
  # Event ID 1000 검색
  Get-EventLog -LogName Application | Where-Object {$_.EventID -eq 1000}
  
  # Event ID 4625 (로그인 실패) 검색
  Get-EventLog -LogName Security | Where-Object {$_.EventID -eq 4625}
  ```

- 시간 범위 지정
  ```powershell
  # 최근 24시간 이내 오류
  Get-EventLog -LogName System -After (Get-Date).AddDays(-1) -EntryType Error
  ```

- CSV로 내보내기
  ```powershell
  Get-EventLog -LogName System -EntryType Error | 
      Export-Csv -Path "C:\Logs\SystemErrors.csv" -NoTypeInformation
  ```


<br/><br/>

## 요약 및 핵심 포인트


### 빠른 참조 가이드

| 상황 | 확인할 로그 | 주요 Event ID | 조치 |
|------|-------------|---------------|------|
| **PC가 갑자기 재부팅됨** | System | 41, 6008 | 전원 공급 장치 및 과열 점검 |
| **블루스크린 발생** | System | 1001 | MEMORY.DMP 분석, 드라이버 업데이트 |
| **프로그램이 자꾸 꺼짐** | Application | 1000, 1002 | Faulting module 확인 후 재설치 |
| **로그인이 안 됨** | Security | 4625, 4740 | 계정 잠김 여부 확인, 비밀번호 재설정 |
| **서비스가 시작 안 됨** | System | 7000, 7001 | 서비스 종속성 및 권한 확인 |


### 핵심 기억 사항

- **System 로그**
  - Windows 자체 문제 진단의 출발점
  - 블루스크린, 재부팅, 드라이버 오류 확인

- **Application 로그**
  - 특정 프로그램 오류 추적
  - 프로그램 충돌 시 최우선 확인

- **Security 로그**
  - 보안 감사 및 로그인 추적
  - 무차별 대입 공격 탐지

- **필터링 습관화**
  - 로그가 너무 많으니 'Critical', 'Error'만 보는 습관
  - 커스텀 뷰로 자주 쓰는 필터 저장

- **Event ID가 핵심**
  - 같은 Event ID 반복 시 근본 원인 해결 필요
  - Microsoft 문서에서 Event ID 검색하여 상세 정보 확인


<br/><br/>

## Reference
- [Microsoft Learn - Event Viewer](https://learn.microsoft.com/ko-kr/security-updates/security/20214103)
- [Windows Event Log Reference](https://learn.microsoft.com/en-us/windows/win32/eventlog/event-logging)
- [Security Auditing Events](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/security-auditing-overview)
- [Common Event IDs](https://learn.microsoft.com/en-us/troubleshoot/windows-server/application-management/event-id-descriptions)
