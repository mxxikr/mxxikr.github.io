---
title: "한 PC에서 GitHub 계정 여러개 쓰기"
author:
  name: mxxikr
  link: https://github.com/mxxikr
date: 2025-10-15 09:00:00 +0900
category:
  - [Version Control]
tags:
  - [git, github]
math: false
mermaid: false
---

## 배경

- 하나의 PC에서 GitHub 계정을 두 개 사용해야 하는 상황
- 기존에는 HTTPS 방식으로 인증 정보를 키체인에 저장해서 사용
- 특정 저장소에서 푸시할 때 다른 계정으로 인증이 시도되면서 403 (Permission Denied) 에러가 발생

## 해결 목표

- 두 개의 저장소에서 각각 다른 GitHub 계정을 자동으로 사용하도록 설정
- 프로젝트마다 수동으로 계정을 변경하지 않고, 저장소별로 올바른 계정이 자동 적용되도록 구성
- SSH를 이용해 계정을 분리하고 관리

## 해결 과정

### 새 SSH 키 생성

- 계정별로 사용할 SSH 키를 새로 만듦
- 기존 키를 덮어쓰지 않도록 `-f` 옵션으로 파일 이름을 명확히 지정

    ```bash
    # 첫 번째 계정용 SSH 키 생성
    ssh-keygen -t ed25519 -C "account1@example.com" -f ~/.ssh/id_ed25519_account1

    # 두 번째 계정용 SSH 키 생성
    ssh-keygen -t ed25519 -C "account2@example.com" -f ~/.ssh/id_ed25519_account2
    ```

- 키를 생성하는 중간에 `passphrase` (비밀암호)를 입력함
  - 이건 키 파일 자체를 보호하는 비밀번호라 푸시할 때마다 물어보게 됨

### GitHub 계정에 공개 키 등록

- 생성한 공개 키(`.pub`) 파일의 내용을 클립보드로 복사

    ```bash
    # 첫 번째 계정용 공개 키 복사
    pbcopy < ~/.ssh/id_ed25519_account1.pub

    # 두 번째 계정용 공개 키 복사
    pbcopy < ~/.ssh/id_ed25519_account2.pub
    ```

- 각 GitHub 계정에 로그인
- `Settings` > `SSH and GPG keys` 메뉴로 이동
- `New SSH key`를 눌러 복사한 키를 붙여넣고 등록

### SSH Config 파일 설정

- SSH가 특정 주소로 접속할 때, 어떤 키를 사용해야 할지 알려주는 설정 파일이 필요
- `~/.ssh/config` 파일을 열어서 (없으면 새로 만들어) 아래 내용을 추가

    ```bash
    vim ~/.ssh/config
    ```

- `Host` 부분에 `github.com`이 아닌, 계정별 별명(Alias)을 지정해야 함

```
# 첫 번째 계정
Host github.com-account1
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_account1
    IdentitiesOnly yes

# 두 번째 계정
Host github.com-account2
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_account2
    IdentitiesOnly yes
```

### 로컬 저장소의 원격 주소 변경

- 각 프로젝트가 해당 SSH 설정을 사용하도록 원격 주소를 변경
- 각 프로젝트 폴더로 이동해서 `git remote set-url` 명령어를 사용
- 기존 `https://...` 주소 대신, `config` 파일에서 만든 `Host` 별명을 사용한 SSH 주소로 변경

```bash
# 첫 번째 계정 저장소
git remote set-url origin git@github.com-account1:username1/repository.git

# 두 번째 계정 저장소
git remote set-url origin git@github.com-account2:username2/repository.git
```

- 콜론(:) 앞부분이 config 파일의 Host 별명과 일치해야 함

## 결과 확인

- `git push`를 다시 시도
- SSH 키의 `passphrase` (비밀번호)를 물어봄
- 비밀번호를 입력하면 해당 계정으로 푸시 성공
- 각 프로젝트가 올바른 계정으로 자동 인증되어 분리되는 것 확인

## 추가 활용

### SSH 연결 테스트

- 설정이 제대로 되었는지 확인하려면 다음 명령어로 테스트

    ```bash
    # 첫 번째 계정 테스트
    ssh -T git@github.com-account1

    # 두 번째 계정 테스트
    ssh -T git@github.com-account2
    ```

- 정상적으로 연결되면 다음과 같은 메시지가 출력됨

    ```
    Hi username! You've successfully authenticated, but GitHub does not provide shell access.
    ```

### passphrase 매번 입력하기 귀찮다면

- SSH 키의 passphrase를 매번 입력하기 싫다면 ssh-agent에 키를 추가

    ```bash
    ssh-add ~/.ssh/id_ed25519_account1
    ssh-add ~/.ssh/id_ed25519_account2
    ```

- Mac의 경우 키체인에 저장하려면 다음 명령어 사용

    ```bash
    ssh-add --apple-use-keychain ~/.ssh/id_ed25519_account1
    ssh-add --apple-use-keychain ~/.ssh/id_ed25519_account2
    ```

### 기존 저장소의 원격 주소 확인

- 현재 저장소가 어떤 원격 주소를 사용하는지 확인

    ```bash
    git remote -v
    ```

### 새 저장소 클론할 때

- 처음부터 SSH 주소로 클론하려면 Host 별명을 사용

    ```bash
    # 첫 번째 계정 저장소 클론
    git clone git@github.com-account1:username1/repository.git

    # 두 번째 계정 저장소 클론
    git clone git@github.com-account2:username2/repository.git
    ```

## Trouble Shooting

### Key is already in use

- 키를 등록할 때 "Key is already in use" (키가 이미 사용 중) 메시지가 뜸
- 다른 계정에 이 키를 먼저 등록했기 때문
- GitHub는 SSH 키 하나를 여러 계정에서 중복으로 사용할 수 없음
- **해결**
  - 다른 계정에서 그 키를 `Delete`
  - SSH 키를 사용할 계정에 다시 접속해서 키를 정상적으로 등록

### Permission denied (publickey)

- SSH 연결 시도 시 "Permission denied (publickey)" 에러 발생
- **원인**
  - SSH Config 파일의 `IdentityFile` 경로가 잘못됨
  - 공개 키가 GitHub에 등록되지 않음
  - SSH agent에 키가 추가되지 않음
- **해결**
  - `~/.ssh/config` 파일의 경로 확인
  - GitHub 계정 설정에서 SSH 키 등록 여부 확인
  - `ssh-add -l` 명령어로 등록된 키 확인

### Host 별명을 잊어버렸을 때

- `~/.ssh/config` 파일을 열어서 확인

    ```bash
    cat ~/.ssh/config
    ```

## Reference

- [GitHub Docs: Generating a new SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [GitHub Docs: Adding a new SSH key to your GitHub account](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
- [GitHub Docs: Testing your SSH connection](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection)
