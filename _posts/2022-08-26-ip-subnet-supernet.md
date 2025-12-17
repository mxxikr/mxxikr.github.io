---
title:  "IP 주소 체계와 Subnet, Supernet"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-08-26 00:24:00 +0900
category:
  - Network
tags:
  - [ip, network]
math: true
mermaid: true
---

# IP
--- 
### **IP(Internet Protocol)**
* PC 간 연결하기 위한 통신 규약 (인터넷 규약)
* 인터넷 상에 있는 컴퓨터 고유의 주소
* 인터넷 상의 한 컴퓨터에서 다른 컴퓨터로 데이터 주고 받기 가능
* IPv4와 IPv6로 나뉨  

### **IPv4**
* 32 bit
* 10진수와 2진수 사용
* 0.0.0.0 ~ 255.255.255.255 = 2^8 * 4 = 2^32 = 약 43억개의 IP 생성 가능  

### **IPv6**
* 128 bit
* 16진수 사용(0~f)
* 0.0.0.0.0.0.0.0 ~ ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff = 2^123 = 43억 * 43억 * 43억 * 43억 IP 생성 가능
* IPv4의 고갈로 인해 생성  

<br/><br/>

# IP 주소 체계와 클래스
---
### **Class**
  * IP의 사용에 따라 분류된 구분 값  
  * **Classful**
    * Network ID 고정
    * 따로 알려주지않아도 어디까지가 Net ID인지를 인식
    * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">홍</span><span style="color:#5A9EFF">길동</span>  <span style="color:#F26C6C">02</span>-<span style="color:#5A9EFF">123-4567</span>​</span>​
    * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#5A9EFF">192.168.1.0</span>​ → <span style="color:#F26C6C">255.255.255​</span>​<span style="color:#5A9EFF">.0</span>​</span>​
  * **Classless**
    * Network ID 유동적 → 관리 효율
    * 따로 알려주지 않으면 어디까지가 Net ID인지 인식 불가능
    * Net Mask / Wildcard Mask / Prefix로 구분 가능
    * <span style="color:rgb(203, 171, 237)"> ex) 연개소문 → <span style="color:#F26C6C">연개</span>​ <span style="color:#5A9EFF">소문</span>​/<span style="color:#F26C6C">연</span>​ <span style="color:#5A9EFF">개소문</span>​</span>​
    * <span style="color:rgb(203, 171, 237)"> ex) 192.168.1.0 대역 255.255.255.128 → 192.168.1.0 ~ 127, 192.168.128 ~ 192.168.255</span>​  

### **Class별 IP 주소**  

|Class|Net ID|Bit|사용 규모|사용 용도|IP|Net mask|사설 고정 IP|
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
**A** Class|<span style="color:#F26C6C">0 ~ 127​</span><span style="color:#5A9EFF">​.0.0.0</span>|<span style="color:#F26C6C">128bit</span>|대규모 network|국가|<span style="color:#F26C6C">0</span><span style="color:#5A9EFF">.0.0.0</span> ~ <span style="color:#F26C6C">127</span><span style="color:#5A9EFF">.0.0.0</span>|<span style="color:#F26C6C">255</span><span style="color:#5A9EFF">.0.0.0</span>|<span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.0.0.0</span>
**B** Class|<span style="color:#F26C6C">128 ~ 191.X</span><span style="color:#5A9EFF">.0.0</span>|<span style="color:#F26C6C">64bit</span>|중소규모 network|공공기관|<span style="color:#F26C6C">128.X</span><span style="color:#5A9EFF">.0.0</span> ​~ <span style="color:#F26C6C">191.X</span><span style="color:#5A9EFF">.0.0</span>|<span style="color:#F26C6C">255.255</span><span style="color:#5A9EFF">.0.0</span>|<span style="color:#F26C6C">172.16</span><span style="color:#5A9EFF">.0.0</span>, <span style="color:#F26C6C">172.31</span><span style="color:#5A9EFF">.0.0​</span>
**​C** Class​|<span style="color:#F26C6C">192 ~ 223.X.X</span><span style="color:#5A9EFF">.0</span>​|<span style="color:#F26C6C">32bit</span>​|일반 network​|통신사​|<span style="color:#F26C6C">192.X.X</span><span style="color:#5A9EFF">.0</span> ~ <span style="color:#F26C6C">223.X.X</span><span style="color:#5A9EFF">.0</span>​|<span style="color:#F26C6C">255.255.255</span><span style="color:#5A9EFF">.0</span>​|<span style="color:#F26C6C">192.168.X</span><span style="color:#5A9EFF">.0​</span>
**​D** Class​|<span style="color:#F26C6C">224 ~ 239.X.X</span><span style="color:#5A9EFF">.0</span>​|<span style="color:#F26C6C">16bit</span>​|Multicast​|network 장비​|​|​|
**​E** Class​|<span style="color:#F26C6C">240 ~ 254.X.X</span><span style="color:#5A9EFF">.0</span>​|<span style="color:#F26C6C">16bit</span>​|연구, 특수 목적으로 예약된 주소​|​|​|​​  

* <span style="color:#F26C6C">네트워크(Net ID)</span>가 일치해야 통신 가능  
![image](/assets/img/network/id.jpg)
* <span style="color:#F26C6C">X(0~255)</span> = <span style="color:#F26C6C">Net ID</span> : 상위 네트워크에서 지정된 값 (사용자 변경 불가)
* <span style="color:#5A9EFF">0(0~255)</span> = <span style="color:#5A9EFF">Host ID</span> : 하위 네트워크에서 지정된 값 (사용자 변경 가능)

### **공인 IP** 
* Internet 상에서 사용하는 IP
* 유일한 IP 

### **사설 IP** 
* ISP(Internet Service Provider) 업체를 통해서 제공 받음
* 인터넷이 가능한 IP
* 같은 IP 여러개 존재
* NAT(통신망의 주소 변환기)를 통해 사설 IP를 공인 IP 주소로 변환해 인터넷에 접속
* 단독 인터넷 사용 불가능
![image](/assets/img/network/internet.jpg)
  * <span style="color:#9999FF">공유기나 내부 네트워크를 사용해 인터넷에 접속할 경우 **사설 IP라고 하는 특정 주소 범위(192.168.0.1~192.168.255.254)가 내부적으로 사용**되고 **공인 IP를 알아 낼 수 없다.**</span>   
  * <span style="color:#B9E0A5">port forwarding이나 VPN 사용 시 사설 IP끼리 통신 가능</span>  
  
<br/><br/>

# IP 표기법
---
### **Net Mask**
  * <span style="color:#F26C6C">Net ID</span>와 <span style="color:#5A9EFF">Host ID</span>를 구분해주는 구분자 (기준값)
  * <span style="color:#F26C6C">변하지 않는 부분(Net ID)</span>를 2진수 1로 표기
  * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.0.0.0</span> (<span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.0.0.0</span> ~ <span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.255.255.255</span>) 대역 → <span style="color:#F26C6C">1111 1111</span><span style="color:#5A9EFF">.X.X.X</span> → <span style="color:#F26C6C">255</span><span style="color:#5A9EFF">.0.0.0</span>​</span>​
  * **A** Class : <span style="color:#F26C6C">255</span><span style="color:#5A9EFF">.0.0.0</span>
  * **B** Class : <span style="color:#F26C6C">255.255</span><span style="color:#5A9EFF">.0.0</span>
  * **C** Class : <span style="color:#F26C6C">255.255.255</span><span style="color:#5A9EFF">.0</span>

### **Wildcard Mask**
  * NetMask를 거꾸로 주는 형태 (1111 1100 → 0000 0011)
  * 연속되지 않은 네트워크를 표현하기 위하여 오류검사를 통해 표현하는 표기법
    * <span style="color:#F26C6C">0</span> : 검사 시행 (바뀌지 않음) 
    * <span style="color:#5A9EFF">1</span> : 검사 미시행 (바꿀 수 있음)
  * <span style="color:#5A9EFF">변하는 부분(Host ID)</span>을 2진수 1로 표기
  * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.0.0.0</span> (<span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.0.0.0</span> ~ <span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.255.255.255</span>) 대역 → <span style="color:#F26C6C">X</span><span style="color:#5A9EFF">.1111 1111.1111 1111.1111 1111</span> → <span style="color:#F26C6C">0</span><span style="color:#5A9EFF">.255.255.255</span></span>​
  * **A** Class : <span style="color:#F26C6C">0</span><span style="color:#5A9EFF">.255.255.255</span>
  * **B** Class : <span style="color:#F26C6C">0.0</span><span style="color:#5A9EFF">.255.255</span>
  * **C** Class : <span style="color:#F26C6C">0.0.0</span><span style="color:#5A9EFF">.255</span>  

### **Prefix**
  * 앞을 고정
  * Network-ID 부분의 1의 개수를 숫자로 표기
  * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">10</span><span style="color:#5A9EFF">.0.0.0</span> → <span style="color:#F26C6C">1111 1111</span><span style="color:#5A9EFF">.0.0.0</span> → <span style="color:#F26C6C">**/8**</span></span>  
  
### **CIDR 표기법 (Classless Inter Domain Routing)**
  * 네트워크 대역 표기법
  * 2진수로 표기
  * <span style="color:rgb(203, 171, 237)"> ex) **1111 1111.1111 1111.1111 1111**.0000 0000  → 1의 개수 : 24개</span>
    * <span style="color:rgb(203, 171, 237)"> **Prefix** : 192.168.1.0/24</span>
    * <span style="color:rgb(203, 171, 237)"> **IP** : 192.168.1.1 ~ 192.168.1.254</span>
    * <span style="color:rgb(203, 171, 237)"> **Net Mask** : 255.255.255.0</span>  
  
<br/><br/>

# Subnet
---
### **Subnet**
  * IP 손실 줄이고 IP 보호하기 위해 **Network를 나누는 개념**
    ![image](/assets/img/network/subnet.jpg)
  * 서로 같은 Network 영역일 때는 Switching 했지만 **다른 Network 영역이 되어 Routing** 하게 됨
  * 균등 Subnetting과 비균등 Subnetting으로 나눠짐
  * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">홍</span> <span style="color:#5A9EFF">길동</span> → <span style="color:#F26C6C">홍ㄱ</span> <span style="color:#5A9EFF">ㅣㄹ동</span>
  * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">남양 홍씨 홍</span> <span style="color:#5A9EFF">길동</span> → <span style="color:#F26C6C">남양군파 남양 홍씨 홍</span> <span style="color:#5A9EFF">길동</span> →<span style="color:#F26C6C"> 길자 돌림 남양군파 남양 홍씨 홍</span> <span style="color:#5A9EFF">길동</span>

### **균등 Subnettnig**
  * 새로 생성된 Subnet에 속하는 Host 수가 일정
  * <span style="color:rgb(203, 171, 237)"> ex) 회사 사용 network 200.1.1.0/24 → Network 1개
  * <span style="color:rgb(203, 171, 237)"> ex) 8개의 부서별로 Network를 분리(Subnet 8개 필요)해야함</span>
    * <span style="color:rgb(203, 171, 237)"> **Subnet 8개** = 2^**3** = subnet-bit : **3**</span>       
    * <span style="color:rgb(203, 171, 237)"> 8bit - **3**bit = 5bit : **host-bit  = Host 32개 = 2^5**</span>  
    
|부서|IP 범위|CIDR 표기법|사용 가능 host|
|:--:|:--:|:--:|:--:|
A 부서|200.1.1.0 ~ 200.1.1.31|255.255.255.224|1~30 (0은 대표 주소, 31는 direct broadcast 주소)
B 부서|200.1.1.32 ~ 200.1.1.63|255.255.255.224|33~62 (32는 대표 주소, 63는direct broadcast 주소)
C 부서|200.1.1.64 ~ 200.1.1.95|255.255.255.224|65~94 (64는 대표 주소, 95는 direct broadcast 주소)
D 부서|200.1.1.96 ~ 200.1.1.127|255.255.255.224|97~126 (96은 대표 주소, 127은direct broadcast 주소)
E 부서|200.1.1.128 ~ 200.1.1.159|255.255.255.224|129~158 (128은 대표 주소, 159는 direct broadcast 주소)
F 부서|200.1.1.160 ~ 200.1.1.191|255.255.255.224|161~190 (160은 대표 주소, 191은 direct broadcast 주소)
G 부서|200.1.1.192 ~ 200.1.1.223|255.255.255.224|193~222 (192는 대표 주소, 223은 direct broadcast 주소)
H 부서|200.1.1.224 ~ 200.1.1.255|255.255.255.224|225~254(224은 대표 주소, 255은 direct broadcast 주소)

### **비균등 Subnetting(=VLSM)**
  * 새로 생성된 Subnet에 속하는 Host수가 다름
  * 다양한 길이의 Subnet
  * 가변 길이 Subnet Mask
  * **하나의 네트워크 영역을 서로 다른 크기로 Subnetting**하는 기법
  * VLSM (Variable Length Subnet Mask)라고 부름  
  ![image](/assets/img/network/bit.jpg)
  * <span style="color:rgb(203, 171, 237)"> ex) 회사 사용 network 201.10.1.0/24 Main Network 1개)</span>
    * <span style="color:rgb(203, 171, 237)">4개의 부서별로 Network를 분리 (Subnet 4개 필요)해야 함</span>
    * <span style="color:rgb(203, 171, 237)">영업부는 120개, 인사부는 60개, 관리부와 홍보부는 20개씩 Host 사용)</span>

|부서|사용 가능 host|IP 범위|CIDR 표기법|
|:--:|:--:|:--:|:--:|
영업부|host 120개 < 2^**7**(128) → **host-bit : 7**|201.10.1.0 ~ 201.10.1.127|255.255.255.128
인사부|host 60개 < 2^**6**(64) → host-bit : **6**|201.10.1.128 ~ 201.10.1.191|255.255.255.64
관리부|host 20개 < 2^**5**(32) → host-bit : **5**|201.10.1.192 ~ 201.10.1.223|255.255.255.32
홍보부|host 20개 < 2^**5**(32) → host-bit : **5**|201.10.1.224 ~ 201.10.1.255|255.255.255.32  
  
<br/><br/>

# Supernet
---
### **Supernet**
  * 축약 (Summary)
  * 공통되는 호스트를 구해 Subnet 지정
  * 연산부하 줄이거나 상세정보를 감추려고 **Network를 합치는 개념**
    ![image](/assets/img/network/subnet.jpg)
  * 서로 다른 Network 영역일 때는 Routing 하지만 **같은 Network 영역이 되기 때문에 Switching** 하게 됨

  * <span style="color:rgb(203, 171, 237)"> ex) <span style="color:#F26C6C">홍</span> <span style="color:#5A9EFF">길동</span> → <span style="color:#F26C6C">호</span> <span style="color:#5A9EFF">ㅇ길동</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.0.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">000</span></span><span style="color:#5A9EFF">.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.1.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">001</span>​</span><span style="color:#5A9EFF">​.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.2.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">010</span>​</span><span style="color:#5A9EFF">.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.3.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">011</span>​</span><span style="color:#5A9EFF">​.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.4.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">100</span>​</span><span style="color:#5A9EFF">​.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.5.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">101</span>​</span><span style="color:#5A9EFF">​.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.6.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">110</span>​</span><span style="color:#5A9EFF">.0000 0000</span>
  * <span style="color:rgb(203, 171, 237)"> ex) 11.1.7.0/24</span> → <span style="color:#F26C6C"><span style="background-color:#C3D8D9">0000 1011.0000 0001.0000 0</span><span style="background-color:#D7BFD9">111</span>​</span><span style="color:#5A9EFF">​.0000 0000</span>
    * <span style="color:#F26C6C">Net-ID</span>
    * <span style="color:#5A9EFF">Host-ID → 0으로 표기</span>
    * <span style="color:#F26C6C"><span style="background-color:#C3D8D9">변하지 않는 Network-ID</span></span> → 1로 표기
    * <span style="color:#F26C6C"><span style="background-color:#D7BFD9">변하는 Network-ID</span></span> → 0으로 표기
  * <span style="color:rgb(203, 171, 237)"> ex) supernetting → 1111 1111.1111 1111.1111 1000.0000 0000</span>
    * <span style="color:rgb(203, 171, 237)"> Net Mask → 255.255.248.0</span>
    * <span style="color:rgb(203, 171, 237)">wildcard Mask → 0.0.7.255</span>
    * <span style="color:rgb(203, 171, 237)">prefix → 21</span>
* <span style="color:rgb(203, 171, 237)"> ex) 192.168.1.0 ⇒ 1111 1111.1111 1111.0000 0001.0000 0000</span>
* <span style="color:rgb(203, 171, 237)"> ex) 192.168.2.0 ⇒ 1111 1111.1111 1111.0000 0010.0000 0000</span>
* <span style="color:rgb(203, 171, 237)"> ex) 192.168.3.0 ⇒ 1111 1111.1111 1111.0000 0011.0000 0000</span>
* <span style="color:rgb(203, 171, 237)"> ex) 192.168.4.0 ⇒ 1111 1111.1111 1111.0000 0100.0000 0000</span>
 * <span style="color:rgb(203, 171, 237)"> ex) 192.168.5.0 ⇒ 1111 1111.1111 1111.0000 0101.0000 0000</span>
* <span style="color:rgb(203, 171, 237)"> ex) 1111 1111.1111 1111.0000 0111.0000 0000 ⇒ 255.255.**248(256-2^3)**.0</span>  
  
<br/><br/>

# **통신 발송 방식**
---
![image](/assets/img/network/cast.jpg)  

### **BroadCast**             
* NetWork 상 불특정 다수에게 통신 발송
* IPv4에서만 사용 
* <span style="color:rgb(203, 171, 237)"> ex) 라디오, TV</span>

### **Multicast**
* NetWork 상 특정 다수에게 통신 발송
* 특정 그룹 통신
* <span style="color:rgb(203, 171, 237)"> ex) 부산방송, 서울방송, 학교에서 1반만 수업</span>

### **UniCast**
* 1 : 1 통신 발송 방식 
* <span style="color:rgb(203, 171, 237)"> ex) 통화</span>

### **AnyCast**
* 가장 가까운 곳에 있는 불특정 다수 랜덤으로 통신 발송 
* 근거리 통신
* IPv6에서만 사용 
* <span style="color:rgb(203, 171, 237)"> ex) 무전기</span>