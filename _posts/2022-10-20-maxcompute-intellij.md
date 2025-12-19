---
title: "IntelliJ MaxCompute Plugin 설치 및 사용"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-10-20 04:30:00 +0900
category:
  - [Cloud, Alicloud]
tags:
  - [alicloud, maxcompute, intellij, plugin]
math: true
mermaid: true
---
# MaxCompute Plugin 설치 및 프로젝트 연동
---
### **IntelliJ 및 MaxCompute Plugin 설치**
1. [IntelliJ 설치](https://www.jetbrains.com/idea/)
2. **File** → **Settings** → **Plugins** → **MaxCompute Studio** 검색 후 **Install → IntelliJ restart**  
    ![image](/assets/img/cloud/alicloud/mx_plugin_1.jpg)  
    ![image](/assets/img/cloud/alicloud/mx_plugin_2.jpg)   
3. File → New → Project  
    ![image](/assets/img/cloud/alicloud/mx_plugin_3.jpg)  
4. **MaxCompute Studio** → **Next** → **프로젝트명 입력**(임의 지정 가능) → **Finish**  
    ![image](/assets/img/cloud/alicloud/mx_plugin_4.jpg)  
5. **View → Tool Windows → Project Explorer**  
    ![image](/assets/img/cloud/alicloud/mx_plugin_5.jpg)  
6. **➕ 아이콘 클릭 → Add project from MaxCompute**  
    ![image](/assets/img/cloud/alicloud/mx_plugin_6.jpg)  
7. **Add MaxCompute Project 대화상자 Connectoin 탭**에서 **매개변수 입력 → OK**  
    ![image](/assets/img/cloud/alicloud/mx_plugin_7.jpg)  
    1. `Access id` : Ali Cloud Access ID
    2. `Access Key` : Ali Cloud Access Key
    3. `Project Name` : MaxCompute 프로젝트 명

### **MaxCompute 프로젝트 데이터 관리**
1. **Project Explorer** → **프로젝트명** → **Tables & Views** → **테이블명 및 프로젝트 정보 확인**
2. **테이블명 더블 클릭** 시 **칼럼 확인** 및 **테이블 세부 정보 확인**
3. 하단 **Table Details** → **Partitions**:조회할 날짜 선택 → **Preview rows** 설정 → **Data Preview** → 테이블 데이터 미리보기

### **쿼리 작성**  
1. Project Explorer → 해당하는 프로젝트 우클릭 → **New sql editor**  
    ![image](/assets/img/cloud/alicloud/mx_plugin_8.jpg)
2. 쿼리 작성 → **Ctrl + Shift + S** / ▶ → 실행
    - `where`절 사용한 ds 파티셔닝 조회 필수  
        <span style="color:rgb(203, 171, 237)">ex) `where ds >= '2022-10-01'`</span>
    - 쿼리문 결과 확인

<br/><br/>

## **Reference**
* [Ali Cloud MaxCompute](https://www.alibabacloud.com/help/en/maxcompute)
