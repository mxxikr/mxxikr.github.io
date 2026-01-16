---
title: Cisco Packet Tracer 설정 및 CLI 명령어
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2022-11-10 23:40:00 +0900
category: [Network]
tags: [network, packet-tracer]
math: true
mermaid: false
---
# Cisco Packet Tracer 구성
--- 
### **Cisco Packet Tracer**
- Cisco에서 제공하는 네트워크 실습 프로그램
- [Cisco Packet Tracer Download](https://www.netacad.com/portal/resources/packet-tracer)

### **Cable 구성**
- Packet Tracer Cable   
  ![image](/assets/img/network/packet-tracer-1.jpg)    
  - **실선**
    - 다른 계층 장비 연결 시 direct cable 연결
  - **점선**
    - 같은 계층 장비 연결시 cross cable 연결
<br/><br/>

#  Router 내부 구조 및 부팅 순서
---
### **Router 내부 구조**
- **<span style="color:#F26C6C">ROM</span>**(Read Only Memory)
	- 읽기 전용, 비휘발성
  - **<span style="color:#F26C6C">POST</span>**(Power On Self Test)
    - CPU, 메모리, 인터페이스 운영 상태 점검
    - `0x2102` : 로드 하는 값
    - `0x2142` : 로드 하지 않는 값
  - **<span style="color:#F26C6C">BootStrap</span>**
    - 시스코 장비 부트로더, ROM을 활성화함
- **<span style="color:#F26C6C">RAM</span>**(Random-Access Memory)
	- 읽기 쓰기 가능, 현재 운영 중인 설정, 휘발성
  - **<span style="color:#F26C6C">running-config</span>**
    - 라우터 부팅 후 작업 설정 내용
- **<span style="color:#F26C6C">NVRAM</span>**(Non-volatile Random-Access Memory)
	- 비휘발성 RAM, 저장 된 설정
  - **<span style="color:#F26C6C">startup config</span>**
    - 실제 라우터 부팅 시 설정 내용
  - **<span style="color:#F26C6C">config-register</span>**
    - Router Mode 결정
    - `0x2102` : 기본 값
    - `0x2142` : 복구 모드
- **<span style="color:#F26C6C">Flash Memory</span>**(IOS)
	-  읽고 쓰기가 가능한 비휘발성 memory
  - **<span style="color:#F26C6C">IOS</span>**(Internetwork Operating System)
    - 운영 체제, 프로그램

### **Router 부팅 순서**  
1. POST(Power On Self Test)
2. Bootstrap Load(Boot Loader)
3. config-register
4. IOS locate(Flash 저장된 IOS 찾기)
5. IOS loading
6. router 제어권을 IOS가 획득
7. startup-config에 내용 적용
8. CLI 창을 진행하는 내용이 runnig-config에 임시 저장됨    
<br/><br/>

#  Router Prompt Mode
---
### **Router mode 설정**

|prompt|mode|description|
|:--:|:--:|:--:|
|`>`|user mode|사용자 모드|
|`#`|privilege mode|관리자 모드 (장비 사용, 권한 부여)|
|`config)#`|global mode|전역 설정 모드 (실제 장비 설정)|
|`config-if)#`|config-interface|인터페이스 설정 모드| 
|`config-line)#`|line configuration mode|관리 포트 설정 모드|
|`config-router)#`|router configuration mode|라우팅 프로토콜 설정 모드|  

- 모드 변경
  ```shell
  # user mode → privilege mode
  enable 
  # privilege mode → user mode
  exit
  ```
  ```shell
  # privilege mode → global mode
  config terminal 
  # global mode → privilege mode
  exit
  ```
  ```shell
  # global mode → config-interface
  interface fast ethernet 0/0 
  # config-interface → global mode 
  exit
  ```  

### **interface mode 확인 명령어**
- 인터페이스 장치 상태 확인
  ```shell
  # config-interface mode
  do show ip int bri 
  ```
- RAM 정보 확인
  ```shell
  # config-interface mode
  do show running-config
  ```
- NVRAM 정보 확인
  ```shell
  # config-interface mode
  do show startup-config
  ```
- routing table 정보 확인
  ```shell
  # config-interface mode
  do show ip route
  ```
- router의 전체적인 정보 확인
  ```shell
  # config-interface mode
  do show run
  ```
  - `do`
    - 일시적으로 관리자 모드 사용 가능  
  
### **privilege mode 확인 명령어**
- 인터페이스 장치 상태 확인
  ```shell
  # privilege mode
  how ip int bri
  ```
- RAM 정보 확인
  ```shell
  # privilege mode
  how running-config
  ```
- NVRAM 정보 확인
  ```shell
  # privilege mode
  how startup-config
  ```
- routing table 정보 확인
  ```shell
  # privilege mode
  how ip route
  ```
- router의 전체적인 정보 확인
  ```shell
  # privilege mode
  how run 
  ```
<br/><br/>

#  Router 복구
---
### **Router 복구 모드 (모든 설정 초기화)**
-  라우터 재부팅 하면서 `ctrl + c` 버튼으로 Rommon 모드 진입
  ```shell
  confreg 0x2142 # reg 값 복구 모드로 변경
  reset # 장비 재부팅 
  enable
  conf t
  config-register 0x210
  end
  copy run star
  ```

### **Router 고급 복구 모드(설정 유지 = 비번만 없애기)**
-  라우터 재부팅 하면서 `ctrl + c` 버튼으로 **<span style="color:#F26C6C">Rommon 모드</span>** 진입
  ```shell
  confreg 0x2142 # reg 값 복구 모드로 변경
  reset # 장비 재부팅 
  enable
  conf t
  config-register 0x2102
  end
  copy start run
  conf t
  no enable password/secret
  lint console 0
  no login local # 비번 없애기 적용
  no enable password # 비번 없애기
  end
  copy run start # 불러온 내용 수정 후 다시 저장
  # 재부팅
  ```
<br/><br/>

#  Router hostname 및 password 설정
---
### **Router hostname 설정**
```shell
# global mode
hostname {HOST_NAME}
```

### **Router 관리자 비밀번호 설정**
```shell
# global mode
enable password {PASSWORD}
enable secret {PASSWORD}
service password-encryption # 모두 암호화
```

### **Router 관리자 비밀번호 해제**
```shell
# global mode
no enable password-encryption
```  

### **저장 명령어**
```shell
# privilege mode
copy running-config startup-config # 휘발성 메모리를 비휘발성 메모리에 복사
reload # 재부팅해서 확인
```
<br/><br/>

#  Router IP 설정
---
### **ip 설정**
```shell
# user mode	
enable
# privilege mode
conf t
# global mode
int fa0/0 # ip 설정 할 인터페이스에 진입
# config-interface
ip add {IP} {NETMASK} # ip와 netmask 입력
no shut # 인터페이스 활성화
```

### **ip 자동 할당**
```shell
# user mode	
enable
# privilege mode
conf t
# global mode
int fa0/0 #  ip 설정 할 인터페이스에 진입
ip add dhcp # ip 자동 할당
```

### **ip 설정 삭제**
```shell
# user mode	
enable
# privilege mode
conf t
# global mode
int fa0/0 # ip 삭제 할 인터페이스에 진입
# config-interface
no ip add # ip 삭제
no shut # 인터페이스 활성화   
```  
```shell
# user mode	
enable
# privilege mode
conf t
# global mode
int fa0/0 # ip 삭제할 인터페이스에 진입
# config-interface
shut # 비활성화  
```    
<br/><br/>

#  Router Console 설정
---
### **CDP(Cisco Discovery Protocol) 명령어**
- **CDP**
  - 시스코 장비들이 동일 링크 상에 있는 다른 장비 등을 찾는 시스코 독점 프로토콜 (표준 프로토콜 : LLDP)  
  ```shell
  # privilege mode
  show cdp neighbors # 인접해있는 장비 확인 가능
  show cdp entry * # cisco 장비의 인접해있는 장비를 자세히 보여줌
  ```

### **Console(장비) 설정**
1. console mode 진입
  ```shell
  # global mode
  line console 0
  ```
2. 비밀번호 설정 여부 확인
  ```shell
  # line configuration mode
  login
  ```
  - Password 인증
    ```shell
    # line configuration mode
    password {PASSWORD} # console 접속시 비밀번호 설정           
    login # 비밀번호 설정 적용
    ```
  - Local 인증
    ```shell
    # global mode
    username {USER_NAME}   password {PASSWORD} # ID와 PW 설정
    # line configuration mode
    login local # config 모드에서 설정한 ID/PW 설정 적용 
    ```
  - 미인증
    ```shell
    # line configuration mode
    no password                                                   
    no login                                          
    ```
3. 오랜시간 자리를 비워도 세션이 끊기지 않도록 설정(분 초)
  ```shell
  # line configuration mode
  exec-timeout 0 0
4. 명령어 입력 도중에 시스템 메시지 표시하지 않도록 설정
  ```shell
  # line configuration mode
  logging synchronous
  ```

### **Telnet 설정**
1. telnet 같은 서비스가 접속할 수 있는 가상포트 0~4(5개) 설정
  ```shell
  # global mode
  line vty 0 4
  ```
2. 비밀번호 설정 여부 확인
  ```shell
  # line configuration mode 
  login
  ```
  * Password 인증
    ```shell
    # line configuration mode
    password {PASSWORD} # 가상 포트 접속시 비밀번호 설정 
    login # config 모드에서 설정한 비밀번호 설정 적용
    ```
  * Local 인증
    ```shell
    # global mode  
    username {USER_NAME}   password {PASSWORD} # ID와 PW설정
    # line configuration mode
    login local # ID/PW 설정 적용 
    ```
  * 미인증
    ```shell
    # line configuration mode
    no password                                                   
    # line configuration mode
    no login                                          
    ```
4. 오랜시간 자리를 비워도 세션이 끊기지 않도록 설정(분 초)
  ```shell
  exec-timeout 0 0
  ```
5. 명령어 입력 도중에 시스템 메시지 표시하지 않도록 설정
  ```shell
  logging synchronous
  ````  
​<br/><br/>

#  IOS 백업 및 복구
---
### **IOS 백업(TFTP에 설정 파일 저장)**  
1. 버전 확인
  ```shell
  # privilege mode
  show version
  ```
2. Flash 메모리를 TFTP 서버로 백업
  ```shell
  # privilege mode
  copy flash: tftp:
  ```
3. show flash로 Flash 메모리명 확인해 입력
  ```shell
  # privilege mode
  source filename []? # c2600-i-mz.122-28.bin  
  ```
4. 복사할 서버 ip 입력
  ```shell
  # privilege mode
  address or name of remote host[] # xxx.xxx.xxx.xxx 
  ```
5. 파일 이름 정해서 입력
  ```shell
  # privilege mode
  Destination filename[c2600-i-mz.122-28.bin]? # R1_IOS 
  ```
6. TFTP에 설정 파일 복사
  ```shell
  # privilege mode
  copy start tftp:  
  ```   


### **IOS 복구 (TFTP 사용)**   
1. Rommon Mode로 접속
2. router의 IP 주소 입력
  ```shell
  IP_ADDRESS=192.168.1.254
  ```
3. router의 서브넷 마스크
  ```shell
  IP_SUBNET_MASK=255.255.255.0
  ```
4. tftp 서버의 IP/router의 IP
  ```shell
  DEFAULT_GATEWAY=192.168.1.254 
  ```
5. tftp 서버의 IP
  ```shell
  TFTP_SERVER=192.168.1.100
  ```
6. IOS 파일 이름
  ```shell
  TFTP_FILE=R1_IOS
  ```
7. 복구 모드
  ```shell
  tftpdnld
  ```
  - `tftpdnld`
    - router의 IOS 이미지가 깨져서 Rommon Mode로 부팅했을 경우 사용하는 복구 모드
8. 재부팅  
<br/><br/>

#  원격 접속
---
### **SSH 암호화 원격 접속**
1. global mode로 진입
  ```shell
  # user mode	
  enable
  # privilege mode
  conf t
  ```
2. ssh 접속 시 사용 될 user ID/PW 설정
  ```shell
  # global mode
  username {USER_NAME}  password {PASSWORD}
  ```
3. RSA 공개 키 만들기 위해 도메인명 지정 (보통 라우터 이름 사용)
  ```shell
  # global mode
  ip domian-name {DOMAIN_NAME}
  ```
4. 암호화 키(RSA) 생성 (1024byte 이상에서만 가능)
  ```shell
  # global mode
  crypto key generate rsa
  ```
5. ssh2 버전 사용 (보안성 높음)
  ```shell
  # global mode
  ip ssh version 
  ```
6. telnet 설정
  ```shell
  # global mode
  line vty 0 4
  ```
6. config 모드에서 설정한 ID/PW 적용
  ```shell
  # line configuration mode
  login local
  ```
7. 가상 터미널 (원격) 접속 프로토콜을 ssh만 허용, 암호화 key 적용
  ```shell
  # line configuration mode
  transport input ssh
  ```
8. 키 값 생성 확인
  ```shell
  # privilege mode
  show crypto key mypubkey rsa
  show ssh
  ```
9. telent 접속 확인
  ```shell
  # privilege mode
  telnet {ROUTER_IP} # ssh만 허용했기 때문에 telnet 접속 제한 상태
  ```
10. ssh telnet 이용해 접속
  ```shell
  # privilege mode
  ssh -l [] {ROUTER_IP}
  ```
  - `-l`
    - 로그인 시 사용될 유저 ID
11. 설정 저장
  ```shell
  # privilege mode
  exit
  copy running-config startup-config
  ```