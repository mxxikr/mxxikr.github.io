---
title: "Linux 명령어"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2022-08-31 19:27:00 +0900
category:
  - [OS, Linux]
tags:
  - [os, linux]
math: true
mermaid: true
---
# Linux 명령어
---
### **명령어 법칙**
1. 명령어 뒤에는 반드시 띄어 쓰기를 한다.
2. `명령어 --option traget` 순서를 지킨다.
    * `-` : 간소화, 단축 옵션  
    <span style="color:rgb(203, 171, 237)">ex) `-h`</span>
    * `--` : 풀옵션  
    <span style="color:rgb(203, 171, 237)">ex) `--help`</span>
3. 명령어 옵션은 조합이 가능하다 
    * 옵션 순서가 적용될 시 마지막 옵션 적용  
    <span style="color:rgb(203, 171, 237)">ex) 청기들어 청기내려 청기들어 **청기내려** → 마지막 청기내려 적용</span>
    * 정반대되는 옵션 : 옵션에 대한 순서 영향 보고 판단
4. 경로가 중간에 누락되면 안된다.
    * 하나의 경로는 절대 띄어쓰지 않는다
    * 경로 띄어쓸 경우 2개로 인식
    ```bash
    pwd # 현재 위치 /home/test
    mkdir /home/test/a/b # a 디렉토리가 없어 에러 발생
    mkdir /home/test/a   # a 디렉토리가 생성
    mkdir /home/test/a/b # 정상적으로 생성 가능
    ls -lR # 하위 디렉토리 목록까지 확인하는 명령어
    ```  

### **기본 명령어**  
* `pwd`
    * prompt work directory 약자
    * 경로 확인 명령어
    * prompt(명령어 입력받을 수 있는 상태)가 대기하고 있는 directory 확인
    * prompt 창 상태  
        ![image](/assets/img/linux/directory.jpg)
        * `ID`@`네트워크 명` `현재 위치 dir` `권한` 형태  
        - `[root@localhost 바탕 화면]#`
            - `root` : ID, localhost에 가입되어 있는 root 계정  
            - `@localhost` : 가입 되어 있는 네트워크 명  
            - `바탕 화면` : 현재 위치 dir, pwd  
            - `#` : 관리자 권한  
        - `[mxxikr@localhost 바탕 화면]$` 
            - `mxxikr` : ID, localhost에 가입되어있는 mxxikr 계정
            - `@localhost` : 가입되어 있는 네트워크 이름  
            - `바탕 화면` : 현재 위치 dir(pwd) = /home/mxxikr/바탕화면  
            - `$` : 사용자 권한
* `ls`  
    * list 약자
    * 디렉토리 목록 확인 명령어
    * `-q`        
    * `-l`(`--long`)  
        * 자세한 내용 출력
        * 권한, 포함된 파일 수, 소유자, 그룹, 파일 크기, 파일 이름, 수정 일자
    * `-a`(`--all`)
        * 숨김 파일(`.`) 포함에서 모든 내용 출력
    * `-dl`
        * 디렉토리 정보만 표시
    * `-S`(`--size`)
        * 파일 크기 순으로 정렬하여 출력
    * `-r`(`--reverse`)
        * 거꾸로 출력 (기본값은 알파벳 순서 출력)
    * `-R`(`--recursive`)
        * 하위 디렉토리까지 출력
    * `-h`(`--human`)
        * K, M, G단위 사용하여 사람이 보기 좋게 파일 크기 표시
* mkdir
    * make directory 약자
    * directory 생성
    * `-p`
        * parents 약자
        * 누락된 상위 디렉토리까지 한번에 생성  
* `touch`
    * 파일 생성  
* `rm`
    ```bash
    rm -rf 
    ```
    * remove 약자
    * 파일 삭제 명령어
    * `-r` (recursive)
        * 디렉토리를 하위 내용부터 삭제
    * `-f` (force)
        * 확인 메세지 없이 강제 삭제
    * `-i` (interactive)
        * 삭제 할 때 매번 삭제 여부 사용자에게 물어봄
    * `-v` (verbose)
        * 삭제하는 동안 삭제되는 내용 보여줌
* `rmdir`
    * remove directory 약자
    * 디렉토리 삭제 명령어
    * `-p`  
        * 필요한 경우 경로 상의 상위 디렉토리도 삭제  
* `mv`
    ```bash
    mv  /movetest/a  /movetest/b  /mvtest  # /movetest/a를 /movetest/b로 이름 변경하여 /mvtest에 이동
    ```
    * move 약자
    * **파일/디렉토리 이동** 명령어
    * **파일/디렉토리 이름 변경** 명령어
    * 경로에 따른 `mv` 명령 결과
        * 원본과 target이 이름이 같을 경우 **하위 dir로 위치** (이름 생략 가능)
        * 원본과 target의 이름이 다를 경우 **복사 이동과 동시에 이름 변경**
        * 여러 경로 존재 시 **가장 마지막 경로가 target**
* `cp`
    * copy 약자
    * 파일 복사
    * `-r`
        * 파일 포함한 dir 복사
    * `-p`
        * 보존 복사 (속성 값, 시간 그대로 복사)
    * `-f`
        * 복사 대상 파일이 이미 그 위치에 존재 한다면 파일 삭제 후 강제 복사
    * `-i`
        * 복사 대상 파일이 이미 그 위치에 존재 한다면 덮어쓸 것인가를 사용자에게 확인(`y/n`)
    * 경로에 따른 `cp` 명령 결과  
        * 원본과 target이 이름이 같을 경우 **하위 dir로 위치** (이름 생략 가능)
        * 원본과 target의 이름이 다를 경우 **복사 이동과 동시에 이름 변경**
        * 여러 경로 존재 시 **가장 마지막 경로가 target**
* `.`
    ```bash
    pwd # /root/
    cd .
    pwd # /root/ 
    # 계속 현재위치에 머물러 있음
    ```
    * 현재위치
* `..`
    ```bash
    pwd # /root/
    cd ..
    pwd # / 
    # 상위 디렉토리로 경로 이동
    ```
    * 상위 디렉토리 
* `~` 
    ```bash
    # mxxikr@localhost 바탕화면
    pwd # /home/mxxikr/바탕화면
    cd ~
    pwd # /home/mxxikr
    ```
    * 로그인 계정의 home dir
* `cd`
    ```bash
    pwd # /root/
    cd /home/mxxikr
    pwd # /home/mxxikr
    # /root/에서 /home/mxxikr로 디렉토리 이동
    ```
    * change directory
    * 디렉토리 변경, 이동   
    <span style="color:rgb(203, 171, 237)">ex) /home/mxxikr/c/d 위치에서 디렉토리 이동</span>  
    ![image](/assets/img/linux/directory-2.jpg)
        ```bash
        cd ./  # /home/mxxikr/c/d
        cd ..  # /home/mxxikr/c
        cd ../../..  # /
        cd home # /home
        cd ./home   # /home
        cd test/a/b  # /home/test/a/b
        cd ../../../mxxikr/c/d  # /home/mxxikr/c/d
        ```
* `stat`
    * **파일 속성 내용, 접근 내용 확인** 명령어
    * mac(modify/access/change) time 확인
        * access(파일에 대한 접근), modify, change(변조) 확인 가능
* `vmstat`
    * **시스템 메모리 확인** 명령어
    * 시스템 리소스 모니터링
* `cat`
    ```bash
    cat /etc/passwd
    ```
    * **파일 내용 출력** 명령어
    * 문서 전체 보기
* `head`
    ```bash
    cat test.txt | head -n 3 # test.txt 문서 상단부터 3줄만 출력
    head -3 /etc/passwd | cat -n  # 줄 앞에 번호를 붙이고 /etc/passwd 문서 상단부터 3줄만 출력
    ```
    * **파일 내용 앞부분만 출력**하는 명령어
    * 문서 **상단부터 기본 10줄 출력**
    * `-n`
        * 출력하는 줄 수 입력 (defalt 10줄)  
* `tail`
    ```bash
    cat test.txt | tail -n 5 # test.txt 문서 하단부터 5줄만 출력
    tail -15 /etc/passwd | cat -n  # 줄 앞에 번호를 붙이고 /etc/passwd 문서 하단부터 15줄만 출력
    ```
    * **파일 내용 하단부터 출력** 명령어
    * 문서 **하단부터 기본 10줄 출력**
    * `-F`
        * 파일 변경 감시해 내용 추가 될 때마다 변경 점 실시간 출력
    * `-n`
        * 출력하는 줄 수 입력 (defalt 10줄)  
* `more`
    ```bash
    more -3 /etc/passwd  #  /etc/passwd 3줄씩 끊어 보기
    ```
    * **파일 내용을 잘라서 출력**
    * 문서 끊어 보기 (= less 명령)
    * [Enter] : 한줄씩 출력
    * [Spacebar] : 단위 출력  
* `grep`
    ```bash
    cat test.txt | grep "test" # test.txt에서 test 문자열 포함한 줄 출력
    ```
    * **문자열 검색** 명령어
    * **문자가 포함된 열 추출**
    * `-r`
        * 디렉토리 내의 **모든 디렉토리, 파일까지 검색**하도록 지정
    * `-i`
        * **대문자, 소문자 차이 무시** 
    * `-v`
        * 검색할 **문자열이 포함되지 않은 줄만** 출력
    * `-n`
        * **라인 수 출력**  
* `find`
    ```bash
    find [PATH] -name [FILE_NAME] -type [FILE/DIRECTORY] -perm [PERMISSION] 
    find / -name [FILE_NAME] -exec rm {  } \; # 일치하는 파일 찾아 삭제
    # { } : find 명령 진행
    # \ : 실행
    # ; : 마침표
    ```
    ```bash
    find /home -name mxxikr  # /home에 있는 파일 중 파일명이 mxxikr인 파일 검색       
    find /home -name mxxikr -o -name mxxikr2 # /home에 있는 파일 중 파일명이 mxxikr, mxxikr2인 파일 검색      
    find / -perm +4000  # setuid (관리자 권한 확인)
    find /find -name 'te*' -exec rm {} \;  # /find에서 파일명이 te로 시작하는 모든 파일 찾아서 삭제
    ```
    * **하위 폴더에 존재하는 파일 찾아주는** 명령어
    * `-name`
        * **대소문자 구분**하여 파일명 검색
    * `-iname`
        * **대소문자 구분하지않고** 파일명 검색
    * `-o`
        * **여러 개 검색할 때** 삽입
    * `-type`
        * **파일 타입** 검색
    * `-perm`
        * **권한** 검색 
    * `-exec`
        * **함수, 실행 결과**
    * `-atime +n`
        * 파일에 접근한지 `+n`일 이상인 경우 검색 
    * `-atime -n`
        * 파일에 접근한지 `-n`일 이내인 경우 검색 
    * `-ctime +n`
        * 파일 생성한지 `+n`일 이상인 경우 검색 
    * `-ctime -n`
        * 파일 생성한지 `-n`일 이내인 경우 검색 
    * `-mtime +n`
        * 파일 변경한지 `+n`일 이상인 경우 검색 
    * `-mtime -n`
        * 파일 변경한지 `-n`일 이내인 경우 검색 
    * `-amin +n`
        * 파일에 접근한지 `+n`분 이상인 경우 검색 
    * `-amin -n`
        * 파일에 접근한지 `-n`분 이내인 경우 검색 
    * `-cmin +n`
        * 파일 생성한지 `+n`분 이상인 경우 검색 
    * `-cmin -n`
        * 파일 생성한지 `-n`분 이내인 경우 검색 
    * `-mmin +n`
        * 파일 변경한지 `+n`분 이상인 경우 검색 
    * `-mmin -n`
        * 파일 변경한지 `-n`분 이내인 경우 검색 
    * `-newer target`
        * 타겟 파일 생성 후에 수정된 모든 디렉토리 및 파일 (문서 수정) 검색  
* `ifconfig`, `ip addr`
    * ip 확인
* `free -m`
    * 메모리 상태 확인  

### **시간 관련 명령어**  
* `hwclock`  
    * 하드웨어 시간 확인/재설정
* `hwclock -s`
    * CMOS의 시간을 가져와 현재 운영 체제 시간 재설정
* `hwclock -r`
    * 하드웨어 시간 확인
* `date`
    * 리눅스 시스템에서 인식하고 있는 현재 시간 확인/재설정
* `rdate`
    * 시간 동기화
    * 지정한 원격 타임 서버의 시간과 현재 시스템의 운영 체제의 시간 동기화
* `rdate -p [NTP 주소]`
    * NTP(Network Time Protocol) 서버 시간 확인
* `rdate -s [NTP 주소]`
    * NTP(Network Time Protocol) 서버와 시간 동기화   

### **시간 변경 옵션**     
```bash
touch -d 07:22 1 # 07:22인 1파일 생성
touch -t 200012121212.10 2 # 2000년 12월 12일 12시 12분 10초인 2파일 생성
``` 
* `-d [시]:[분]`
    * 당일 시간 변경
* `-t [yyyy][mm][dd][hh][mm][.ss]`
    * 년도 날짜 시간 변경  

### **정규 표현식**
* `*`
    ```bash
    rm -rf  *  #  전체 파일 삭제
    rm -rf  1*  #  1로 시작하는 파일 전체 삭제
    rm -rf  *1  #  1로 끝나는 파일 전체 삭제
    ```
    * 모두, 문자전체
* `?`
    ```bash
    rm -rf  ?  #  한자리 숫자 파일 전체 삭제
    ```
    * 자리 수, 대체 문자 필터링 할 때 사용
* `|` 
    ```bash
    ls -l /etc | grep sys  #  sys 문자열을 포함한 /etc 리스트 출력 
    ```
    * pipe
    * 오른 쪽 명령을 받아 왼쪽 명령 실행
    * 프로세스 혹은 실행된 프로그램의 결과를 다른 프로그램으로 넘겨줄 때 사용
    * `(input) | (output)`  
* `<`
    ```bash
    cat < c  # cat c와 동일
    ```
    * read 읽기   
* `>`
    ```bash
    ls -l /home /ac > test3 # /home과 /ac의 list를 test3 파일로 생성
    ```
    * write 쓰기, 파일 생성, 덮어쓰기
* `>>`
    ```bash
    cat b a >> c   # c원본 아래 b,a 파일 병합 내용 추가
    ```  
    * add 추가, 파일 생성, 원본 아래 내용 추가

### **Redirection**
* 출력을 입력으로 변환
* 프로그램의 결과 혹은 출력을 파일이나 다른 스트림으로 전달하거나 남길 때 사용
```bash
< # 입력 redirection
> # 출력 redirection
>> # 추가 출력 redirection
0 # 입력, 입력부분, input
1 # success (정상출력), output(기본값)
2> # error redirection (오류출력), output
&>  # 표준 출력과 표준 에러를 동시에 redirection
cat a b d > c # 정상 내용만 입력
cat a b d 1> c # 정상 내용만 입력
cat a b d 2> c # 오류 내용만 입력
cat a b d > c 1>&2 # 정상 내용 오류 처리
cat a b d > c 2>&1 # 오류 내용 정상 처리
```

### **논리 연산자**
* `+`
    * 덧셈
* `-`
    *  뺄셈
* `*`
    * 곱셈
* `/`
    * 나눗셈
* `&&`
    * and         
    ```bash
    a && b # a 그리고 b
    # 프로그램 반복문 사용(a 성공 시 b 실행, a 실패시 b 미실행)
    ```
* `||`
    * or   
    ```bash
    a || b # a 또는 b
    # 백업 관련 사용(a 성공 시 b 미실행, a 실패시 b실행) 
    ```  

### **alias**
```bash
alias  c = 'clear' # alias 설정
alias # alias 확인
unalias c # alias 삭제
```
* 별칭 모음
* 로그 아웃하면 내용 삭제
    * 영구적 사용은 shell에 부여해야함
* `' '`
    * 함수 싱글 쿼터
* `" "`
    * 변수 싱글 쿼터
