---
title:  "GCP Compute Engine 생성 및 설정"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-19 14:30:00 +0900
category:
  - [Cloud, GCP]
tags:
  - [compute engine, gcp]
math: true
mermaid: true
---
# VM 인스턴스 생성 및 설정
---
### **VM 인스턴스 생성**
1. 프로젝트 선택
2. 탐색 → Compute Engine → VM 인스턴스 → 인스턴스 만들기  
    ![image](/assets/img/cloud/gcp/vm-1.jpg)  
    ![image](/assets/img/cloud/gcp/vm-2.jpg)
3. 인스턴스 구성 설정  
    ![image](/assets/img/cloud/gcp/vm-3.jpg)  
    ![image](/assets/img/cloud/gcp/vm-4.jpg) 
      - 인스턴스명 설정
      - 리전
      - 머신 유형
      - 부팅 디스크
      - 서비스 계정
4. 만들기 → 인스턴스 생성 확인
5. 우측 SSH 클릭해 인스턴스 웹콘솔 접속
6. root 비밀번호 생성
    ```bash
    sudo passwd
    ```
7. root 계정으로 접속
    ```bash
    su -
    ```
8. OS 버전 확인
    ```bash
    cat /etc/*-release
    ```

### **VM 인스턴스 SSH 키 등록**
1. SSH 키 생성
    ```powershell
    ssh-keygen -t rsa -f {INSTANCE_NAME} -C {SERVICE_ACCOUNT} -b 2048 
    ```
    - `-t`
        - 타입명
        - key 생성 type 선택
    - `-b`
        - 숫자
        - type 의 bytes 설정
        - rsa 암호화 방식은 기본 2048인데 보다 안전한 4096으로 설정
    - `-f`
        - 파일명
        - 생성할 key의 이름
    - `-C`
        - 내용
        - 주석 입력
        - gcp의 메일 계정 입력
2. 프로젝트 선택
3. 탐색 → Compute Engine → VM 인스턴스 선택 → 메타데이터
    ![image](/assets/img/cloud/gcp/vm-5.jpg) 
4. 수정 → 항목 추가 → Public Key 메타데이터 복사 후 입력 → 저장
5. Private 키 사용해 접속
<br/><br/>

# 방화벽(FireWall) 규칙 설정 및 연결
---
### **VPC 방화벽 규칙 생성**
1. 탐색 메뉴 → 네트워킹 → VPC 네트워크 → 방화벽
    ![image](/assets/img/cloud/gcp/vm-6.jpg) 
2. 방화벽 규칙 만들기   
    ![image](/assets/img/cloud/gcp/vm-7.jpg) 
3. 방화벽 규칙 설정
    - 방화벽 이름 설정
    - 네트워크 선택
      - 수신/송신
    - 대상 태그 선택   
      - GCE 연결할 때 설정한 태그 입력   
          <span style="color:rgb(203, 171, 237)">ex) mxxikr-test</span>
    - 소스 IP 범위 설정   
      <span style="color:rgb(203, 171, 237)">ex) 0.0.0.0/0</span>
    - 포트 설정   
      <span style="color:rgb(203, 171, 237)">ex) 8080</span>
4. 방화벽 규칙 생성 확인

### **VPC 인스턴스에 방화벽 연결**
---
1. 탐색 메뉴 → Compute Engine → VM 인스턴스
    ![image](/assets/img/cloud/gcp/vm-8.jpg) 
2. 방화벽 설정할 인스턴스 선택 → VM 인스턴스 세부정보 → 수정
    ![image](/assets/img/cloud/gcp/vm-9.jpg) 
4. 방화벽 연결하기 위해 생성한 **네트워크 태그** 입력 → 저장
    ![image](/assets/img/cloud/gcp/vm-10.jpg) 

<br/><br/>

## **Reference**
* [Google Cloud Compute Engine](https://cloud.google.com/compute/docs)
