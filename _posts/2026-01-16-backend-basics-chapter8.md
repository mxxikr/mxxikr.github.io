---
title: '[주니어 백엔드 개발자가 반드시 알아야 할 실무 지식] 8장 실무에서 꼭 필요한 보안 지식'
author: { name: mxxikr, link: 'https://github.com/mxxikr' }
date: 2026-01-16 10:45:00 +0900
category: [Book, Backend]
tags: [backend, security, authentication, authorization, encryption, hmac, firewall, audit-log, secure-coding, book-review]
math: false
mermaid: false
---

- **💡해당 게시글은 최범균님의 '주니어 백엔드 개발자가 반드시 알아야 할 실무 지식'을 개인 공부목적으로 메모하였습니다.**

<br/><br/>

## 8장에서 다루는 내용

- 중요한 보안
- 인증과 인가
- 암호화
- HMAC을 이용한 데이터 검증
- 방화벽으로 트래픽 제한
- 감사 로그(Audit Log) 남기기
- 데이터 노출 줄이기
- 비정상 접근 처리
- 시큐어 코딩
- 개인 보안

<br/><br/>

## 중요한 보안

### 보안 취약점의 공통 패턴

- 인증(Authentication)과 인가(Authorization)의 혼동
- 클라이언트에서 전달받은 값을 맹목적으로 신뢰
- 서버 측에서 적절한 권한 검증 로직 누락


<br/><br/>

## 인증과 인가

### 개념

- 서버 개발에서 가장 기본적인 보안은 인증과 인가임
- 인증(Authentication)
  - 사용자가 누구인지 확인하는 과정
- 인가(Authorization)
  - 사용자에게 자원에 접근할 수 있는 권한을 부여하는 것

![인증과 인가 프로세스](/assets/img/books/backend-basics-ch8/authentication-authorization.png)

### 로그인과 2단계 인증

- 아이디와 암호를 입력하는 로그인은 인증의 한 형태임
- 보안을 강화하기 위해 2단계 인증(Two-Factor Authentication)을 사용하기도 함
  - SMS 인증 코드
  - 이메일 인증 링크
  - OTP(One-Time Password) 앱
  - 생체 인증(지문, 안면 인식)

### 토큰 기반 인증
- 인증 성공 시
  - 서버는 클라이언트에게 토큰 발급
  - 클라이언트는 매 요청마다 토큰 전송
  - 서버는 토큰을 이용해 사용자 식별

![토큰 기반 인증](/assets/img/books/backend-basics-ch8/token-authentication.png)

### 토큰 저장 방식 (Stateful)

- **서버 저장소 활용 (DB/Redis)**
  - 동작 방식
    - 서버는 발급한 토큰과 사용자 매핑 정보를 DB/Redis에 저장
    - 클라이언트 요청 시 저장소를 조회하여 유효성 검증
  - 장점
    - 토큰 제어(무효화, 블랙리스트 등)가 용이함
  - 단점
    - 별도 저장소 운영 비용 발생
    - 트래픽 증가 시 저장소 부하 발생 가능

- **서버 메모리 (세션)**
  - 동작 방식
    - 톰캣 등 서블릿 컨테이너의 메모리(HttpSession)에 저장
  - 단점
    - 서버 재시작 시 데이터 소실
    - 메모리 크기 제한으로 인한 동시 접속자 수 제한
    - 멀티 서버 환경에서 **고정 세션(Sticky Session)** 설정 필요
  - 해결책
    - Spring Session 등을 이용해 세션 저장소를 외부(Redis 등)로 분리

### 토큰 자체에 정보 저장 (Stateless - JWT)

- 토큰 자체에 사용자 식별 정보와 유효성 검증 데이터를 포함함 (JWT)
- **동작 과정**
  1. 서버는 비밀 키로 서명한 토큰 생성 후 발급
  2. 클라이언트는 매 요청 시 헤더/쿠키로 토큰 전송
  3. 서버는 비밀 키로 서명 검증 및 파싱하여 사용자 식별

  ```java
  // JWT 파싱 및 검증
  try {
      Jws<Claims> jwt = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
      String userId = jwt.getPayload().getSubject();
  } catch (JwtException e) {
      throw new AuthenticationException(e);
  }
  ```

- **장점**
  - 별도 저장소 조회 불필요 (Stateless)
  - 서버 확장성(Scale-out) 유리
- **단점**
  - 토큰 크기가 커질수록 네트워크 트래픽 증가
  - 이미 발급된 토큰의 강제 만료(제어)가 어려움

### 토큰 보안 고려사항

- **전송 방식**
  - Authorization 헤더 사용 (앱/API)
  - 쿠키 사용 (웹 사이트)
- **유효 시간 제한**
  - 탈취 피해 최소화
  - Access Token의 유효 시간을 짧게 설정
- **리프레시 토큰 (Refresh Token)**
  - 보안(짧은 만료)과 편의성(자동 갱신)을 동시에 만족
  - Access Token 만료 시 Refresh Token으로 재발급
- **보안 강화**
  - 토큰 생성 IP와 사용 IP 불일치 시 차단
  - 로그아웃된 토큰 등을 DB/Redis에 저장하여 접근 차단 (Stateless의 단점 보완)
### 인가와 접근 제어 모델

- **접근 제어의 기본**
  - 접근한 사용자를 토큰이나 세션으로 식별해야 함
  - API 요청 파라미터로 사용자 식별자를 받으면 보안에 취약함 (파라미터 변조 가능)

  ```java
  @GetMapping("/myinfo")
  public ResponseEntity<?> getMyInfo(@RequestHeader("token") String token) {
      String userId = getUserIdByToken(token); // 토큰에서 추출
  }
  ```

### 역할 기반 접근 제어 (RBAC)

- 사용자에게 역할(Role)을 부여하고, 역할에 권한(Permission)을 할당하는 방식
- **장점**
  - 권한 관리가 체계적이고 용이함 (역할만 변경하면 됨)
- **주의점**
  - 역할의 무분별한 생성 주의 (관리 복잡도 증가)

![RBAC 구조](/assets/img/books/backend-basics-ch8/rbac-structure.png)

### 사용자 기반 접근 제어 (User-Based Access Control)

- 역할 없이 사용자에게 개별적으로 권한을 직접 부여
- **특징**
  - 구현이 단순함
  - 시스템 규모가 작거나 역할 구분이 모호할 때 적합

### 속성 기반 접근 제어 (ABAC)

- 사용자의 속성(IP, 위치, 부서, 시간 등)을 기반으로 접근 제어
- **특징**
  - 매우 정교한 제어 가능
  - 구현 및 규칙 정의가 복잡함

<br/><br/>

## 암호화

- 암호화는 데이터를 특정한 규칙으로 변환하여 원본 유추를 어렵게 만드는 것
- 유출되면 가장 큰 피해로 이어질 수 있는 데이터 중 하나가 로그인 비밀번호임

![암호화 개념](/assets/img/books/backend-basics-ch8/encryption-concept.png)

### 단방향 암호화

- 암호화한 데이터를 복호화할 수 없는 암호화 방식
- 해시 함수를 사용해서 데이터를 해시 값으로 변환함
- 주요 사용처
  - 로그인 비밀번호 암호화
- 주요 알고리즘
  - SHA-256, SHA-512, MD5, BCrypt

![단방향 암호화](/assets/img/books/backend-basics-ch8/one-way-encryption.png)

- **해시 함수 동작 원리**
  - 원본 데이터가 조금만 달라도 완전히 다른 해시 값을 생성함
  - 바이트 데이터 기반으로 동작하며, 문자열은 바이트 배열로 변환하여 처리함 (UTF-8 등 캐릭터셋 사용)
  - 해시 결과를 저장할 때는 16진수 또는 Base64로 인코딩함

  ```java
  public static String encrypt(String input) {
      try {
          MessageDigest digest = MessageDigest.getInstance("SHA-256");
          byte[] hash = digest.digest(input.getBytes("UTF-8"));
          StringBuilder hexString = new StringBuilder();
          for (byte b : hash) {
              String hex = Integer.toHexString(0xff & b);
              if (hex.length() == 1) hexString.append('0');
              hexString.append(hex);
          }
          return hexString.toString();
      } catch (Exception e) {
          throw new RuntimeException(e);
      }
  }
  ```

- **충돌 저항성**
  - 해시 함수는 원본 데이터에 상관없이 일정한 길이의 해시 값을 생성함
  - 서로 다른 데이터가 동일한 해시 값을 가질 수 있으나, 찾기 어려울수록 충돌 저항성이 높음
  - 해시 길이가 길수록 충돌 가능성이 낮음
    - SHA-256: 256비트(32바이트)
    - SHA-512: 512비트(64바이트) - 충돌 가능성 더 낮음

- **비밀번호 검증**
  - 사용자 입력 비밀번호를 해시화하여 DB에 저장된 해시 값과 비교함

  ```java
  String inputPwdHash = encodePassword(inputPwd);
  String dbPwdHash = selectDbPwd(userId);
  if (inputPwdHash.equals(dbPwdHash)) {
      // 인증 성공
  }
  ```

- **Salt를 이용한 보안 강화**
  - 같은 입력값에 대해 항상 같은 해시가 생성되는 것을 방지함
  - Salt(임의 값)를 추가하여 같은 원본 데이터라도 다른 해시 값을 생성하게 함

  ![Salt 사용](/assets/img/books/backend-basics-ch8/salt-usage.png)

  ```java
  public static String encryptWithSalt(String input, String salt) {
      try {
          MessageDigest digest = MessageDigest.getInstance("SHA-256");
          digest.update(salt.getBytes());
          byte[] hash = digest.digest(input.getBytes("UTF-8"));
          StringBuilder hexString = new StringBuilder();
          for (byte b : hash) {
              String hex = Integer.toHexString(0xff & b);
              if (hex.length() == 1) hexString.append("0");
              hexString.append(hex);
          }
          return hexString.toString();
      } catch (Exception e) {
          throw new RuntimeException(e);
      }
  }
  ```

### 양방향 암호화

- 암호화와 복호화가 모두 가능한 방식
- 키(Key)를 사용하며, 키에 따라 암호화 결과가 달라짐
- 주요 사용처
  - SSH, HTTPS 등 보안이 중요한 데이터 송수신
- 주요 알고리즘
  - 대칭 키
    - AES
  - 비대칭 키
    - RSA

![양방향 암호화](/assets/img/books/backend-basics-ch8/two-way-encryption.png)

- **대칭 키 암호화**
  - 암호화와 복호화에 동일한 키를 사용함
  - 키를 공유해야 하므로 키 유출 시 보안에 취약함

- **비대칭 키 암호화**
  - 암호화와 복호화에 서로 다른 키를 사용함
  - 공개 키(Public Key)
    - 누구에게나 공개 가능, 암호화에 사용
  - 개인 키(Private Key)
    - 소유자만 접근 가능, 복호화에 사용
  - 공개 키로 암호화한 데이터는 개인 키로만 복호화 가능하므로 대칭 키보다 안전함

### AES 대칭 키 암호화

- AES는 키(Key)와 IV(Initialization Vector)를 사용함
- 키는 128/192/256비트(16/24/32바이트) 중 하나를 무작위로 생성함
- IV는 같은 키로 암호화 시 매번 다른 결과를 생성하여 패턴 노출을 방지함 (16바이트)

  ```java
  // 키 생성 (256비트)
  public static byte[] generateSecretKey() throws Exception {
      KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
      keyGenerator.init(256);
      SecretKey secretKey = keyGenerator.generateKey();
      return secretKey.getEncoded();
  }

  // IV 생성
  public static byte[] generateIV() {
      byte[] iv = new byte[16];
      new SecureRandom().nextBytes(iv);
      return iv;
  }

  // 바이트 배열로부터 SecretKey 생성 (저장된 키 재사용)
  SecretKey key = new SecretKeySpec(bytes, "AES");
  ```

- **AES 암호화/복호화**
  - `AES/CBC/PKCS5Padding`
    - 알고리즘/모드/패딩 방식

  ```java
  // 암호화
  public static String encrypt(String plain, SecretKey key, byte[] iv) throws Exception {
      Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
      IvParameterSpec parameterSpec = new IvParameterSpec(iv);
      cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);
      byte[] encrypted = cipher.doFinal(plain.getBytes("UTF-8"));
      return Base64.getEncoder().encodeToString(encrypted);
  }

  // 복호화
  public static String decrypt(String encrypted, SecretKey key, byte[] iv) throws Exception {
      Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
      IvParameterSpec parameterSpec = new IvParameterSpec(iv);
      cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);
      byte[] decoded = Base64.getDecoder().decode(encrypted);
      byte[] decrypted = cipher.doFinal(decoded);
      return new String(decrypted, "UTF-8");
  }
  ```

### RSA 비대칭 키 암호화

- 공개 키와 개인 키 쌍을 생성하여 공개 키를 공유함
- 키 크기는 일반적으로 2048비트를 사용함

![비대칭 키 암호화](/assets/img/books/backend-basics-ch8/asymmetric-encryption.png)

```java
// 키 쌍 생성
KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
keyGen.initialize(2048);
KeyPair keyPair = keyGen.generateKeyPair();
PublicKey publicKey = keyPair.getPublic();
PrivateKey privateKey = keyPair.getPrivate();

// 키를 Base64 또는 바이너리 파일로 저장 후 재사용 시 변환
public static KeyPair getKeyPairFromBytes(byte[] publicKeyBytes, byte[] privateKeyBytes) 
    throws NoSuchAlgorithmException, InvalidKeySpecException {
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
    PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(publicKeyBytes));
    PrivateKey privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privateKeyBytes));
    return new KeyPair(publicKey, privateKey);
}
```

- **RSA 암호화/복호화**

  ```java
  // 공개키로 암호화
  public static String encrypt(String plain, PublicKey publicKey) {
      Cipher cipher = Cipher.getInstance("RSA");
      cipher.init(Cipher.ENCRYPT_MODE, publicKey);
      byte[] encryptedBytes = cipher.doFinal(plain.getBytes("UTF-8"));
      return Base64.getEncoder().encodeToString(encryptedBytes);
  }

  // 개인키로 복호화
  public static String decrypt(String encrypted, PrivateKey privateKey) {
      Cipher cipher = Cipher.getInstance("RSA");
      cipher.init(Cipher.DECRYPT_MODE, privateKey);
      byte[] decodedBytes = Base64.getDecoder().decode(encrypted);
      byte[] decryptedBytes = cipher.doFinal(decodedBytes);
      return new String(decryptedBytes, "UTF-8");
  }
  ```

  - **개인 키를 이용한 인증**
    - 개인 키로 암호화하고 공개 키로 복호화하는 방식
    - 신원 확인이나 서명 등 인증 목적으로 사용됨 (예: SSH 인증)
    - SSH는 서버에 공개 키를 등록하고 클라이언트가 개인 키로 인증함
      1. 클라이언트가 키 ID 전송
      2. 서버가 공개 키로 임의 숫자 암호화하여 전송
      3. 클라이언트가 개인 키로 복호화
      4. 복호화한 값과 세션 키를 결합한 해시로 인증

<br/><br/>

## HMAC을 이용한 데이터 검증

- HMAC(Hash-based Message Authentication Code)은 메시지의 무결성과 인증을 보장하는 암호화 기술
- API 통신 시 데이터 위변조를 방지하기 위해 사용됨

![HMAC 프로세스](/assets/img/books/backend-basics-ch8/hmac-process.png)

- **동작 방식**
  - 발신자와 수신자는 비밀 키(Secret Key)를 공유함 (외부 노출 금지)
  - 발신자는 메시지와 비밀 키로 MAC(Message Authentication Code)을 생성하여 메시지와 함께 전송함
  - 수신자는 받은 메시지와 비밀 키로 MAC을 재생성한 뒤 발신자가 보낸 MAC과 비교함
  - 두 값이 일치하면 메시지 무결성 보장, 불일치하면 위변조로 판단함

- **주요 용도**
  - 메시지 무결성 검증 (중간 위변조 방지)
  - 발신자 인증 (비밀 키 보유자만 유효한 MAC 생성 가능)

- **구현 예제**

  ```java
  public static class HMAC {
      private String secretKey;

      public HMAC(String secretKey) {
          this.secretKey = secretKey;
      }

      public String hmac(String message) {
          try {
              Mac mac = Mac.getInstance("HmacSHA256");
              SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), "HmacSHA256");
              mac.init(secretKeySpec);
              byte[] hash = mac.doFinal(message.getBytes("UTF-8"));
              return Base64.getEncoder().encodeToString(hash);
          } catch (Exception e) {
              throw new RuntimeException(e);
          }
      }
  }
  ```

- **장점**
  - 단순하고 효율적임 (비밀 키만 공유하면 구현 가능)
  - 낮은 비용으로 인증 보안 구현 가능
  - 사용하는 해시 알고리즘에 따라 보안성 향상

- **단점**
  - 비밀 키가 유출되면 보안에 취약함
  - 비밀 키 교체가 까다로울 수 있음

<br/><br/>

## 방화벽으로 트래픽 제한

### 방화벽의 역할

- **네트워크 공격 차단**
  - DDoS(분산 서비스 거부)나 포트 스캔 등의 네트워크 공격을 방어함
- **웹 방화벽 (WAF)**
  - SQL 인젝션, XSS 등 웹 애플리케이션 계층의 공격을 차단함
- **OS 방화벽**
  - 별도 장비가 없더라도 서버 OS 수준의 방화벽 설정은 필수임

![방화벽](/assets/img/books/backend-basics-ch8/firewall.png)

### 트래픽 제어 정책

- **인바운드 (Inbound)**
  - 외부에서 들어오는 트래픽은 **WhiteList 방식**으로 관리해야 함
  - 모든 포트를 닫고 443(HTTPS) 등 필수 포트만 개방함
  - 접속 가능한 IP 대역을 최소한으로 제한함
    - 서비스 API
      - 모든 IP 접근 허용
    - 관리자 API
      - 사내 IP만 접근 허용
- **아웃바운드 (Outbound)**
  - 서버에서 나가는 트래픽도 제한해야 함
  - 서버가 해킹당했을 때 공격 경유지로 악용되는 것을 방지함
  - 필수 목적지로의 연결만 허용하고 나머지는 차단함

  ![인바운드 아웃바운드](/assets/img/books/backend-basics-ch8/inbound-outbound.png)

<br/><br/>

## 감사 로그(Audit Log) 남기기

### 감사 로그란?

- **정의**
  - 특정 작업이나 사건에 영향을 주는 활동 내역을 입증하는 보안 기록
- **주요 기록 대상**
  - 로그인 및 로그아웃 내역
  - 설정 변경이나 권한 부여 내역
  - 기밀 문서나 중요 정보 조회 이력
- **일반 로그와의 차이점**
  - 문제 해결 목적이 아닌 컴플라이언스 준수 및 보안 감사를 위해 사용함
  - 위변조 방지가 중요하므로 보안성이 높은 별도 저장소에 보관해야 함
  - 로그 조회 권한을 엄격히 제한하고 변경 불가능하도록 관리해야 함

![감사 로그](/assets/img/books/backend-basics-ch8/audit-log.png)

<br/><br/>

## 데이터 노출 줄이기

### 노출 최소화 전략

- **백오피스 보안**
  - 운영자가 고객 정보를 조회할 때 불필요한 노출을 최소화해야 함
  - 목록 화면에서는 개인 식별 정보를 마스킹 처리하여 대량 유출을 방지함
- **API 응답 마스킹**
  - 프론트엔드가 아닌 서버 단에서 데이터를 마스킹 처리해야 함
  - 클라이언트 코드에서만 가리면 개발자 도구 등을 통해 원본 데이터가 노출될 수 있음
- **조회 권한 제한**
  - 전체 고객 목록 조회 등 민감한 기능은 소수 관리자에게만 권한을 부여함
  - 비정상적인 조회 패턴(빈번한 조회, 대량 데이터 요청) 감지 시 접근을 차단함

![데이터 노출](/assets/img/books/backend-basics-ch8/data-exposure.png)

<br/><br/>

## 비정상 접근 처리

### 비정상 접근 탐지 및 대응

- **탐지 기준**
  - 평소와 다른 IP 주소나 기기에서의 접근
  - 단시간 내 과도한 로그인 실패 시도
- **대응 정책**
  - **임시 잠금(Lockout)**
    - 일정 횟수 이상 로그인 실패 시 계정을 임시로 잠가 무차별 대입 공격(Brute Force)을 방어함
  - **사용자 알림**
    - 새로운 환경에서 로그인 시 이메일이나 SMS로 알림을 발송하여 계정 탈취 여부를 확인하게 함

![비정상 접근](/assets/img/books/backend-basics-ch8/abnormal-access.png)

<br/><br/>

## 시큐어 코딩

### SQL 인젝션 공격과 방어

- **공격 메커니즘**
  - 악의적인 사용자가 입력값에 SQL 구문을 주입하여 데이터베이스를 조작하거나 정보를 탈취함
  - **발생 원인**
    - 사용자 입력값을 검증 없이 쿼리 문자열에 직접 결합할 때 발생함 

  ```java
  // 입력값 직접 결합
  String id = request.getParameter("id");
  String query = "select id, name from member where id = '" + id + "'";
  ResultSet rs = stmt.executeQuery(query); // SQL 인젝션 취약점
  ```

- **공격 시나리오 분석**
  - **정상 요청**
    - 입력값으로 `abcd`를 전달한 경우
    - 다음 쿼리가 실행됨
      - `select id, name from member where id = 'abcd'`
  - **공격 요청**
    - 입력값으로 `' or 1=1 or id = '`를 전달한 경우
    - 다음 쿼리가 실행됨
      - `select id, name from member where id = '' or 1=1 or id = ''`
    - **결과**
      - `WHERE` 절의 `1=1` 조건이 항상 참(True)이 되므로 테이블의 모든 데이터가 조회됨

- **방어 대책 (PreparedStatement)**
  - 입력값을 SQL 문법이 아닌 단순 데이터(Parameter)로만 처리함
  - 특수문자가 자동으로 이스케이프 처리되어 쿼리 구조가 보존됨

  ```java
  // 파라미터 바인딩 사용
  String query = "SELECT id, name FROM member WHERE id = ?";
  PreparedStatement pstmt = connection.prepareStatement(query);
  pstmt.setString(1, id); // 입력값은 단순 데이터로 처리됨
  ResultSet rs = pstmt.executeQuery();
  ```

### 기타 보안 코딩 수칙

- **입력값 검증**
  - 클라이언트로부터 들어오는 모든 데이터의 유효성을 서버에서 검증해야 함
- **중요 정보 암호화**
  - 비밀번호뿐만 아니라 주민번호, 여권번호 등 고유 식별 정보는 반드시 암호화하여 저장함
- **에러 메시지 관리**
  - 시스템 내부 IP, DB 구조, 스택 트레이스 등의 정보가 에러 메시지를 통해 노출되지 않도록 함
- **보안 통신 (HTTPS)**
  - 모든 통신 구간에 암호화를 적용하여 스니핑을 방지함

<br/><br/>

## 개인 보안

### 개발자 PC 보안 수칙

- **PC 보안 관리**
  - 개발자 PC는 시스템 접근 권한이 많아 해킹 시 피해가 큼
  - 백신 프로그램을 최신 상태로 유지하고 정기적인 검사를 수행함
  - 출처가 불분명한 파일 실행이나 링크 클릭을 금지하여 랜섬웨어 감염을 예방함
- **데이터 백업**
  - 중요한 데이터는 정기적으로 백업하고 백업 장치는 망을 분리하여 보관함
- **물리적 보안**
  - 자리를 비울 때는 반드시 화면 보호기를 실행하여 잠금 상태로 유지함
  - 중요 정보를 다룰 때는 보안 필름을 사용하여 타인에게 화면이 노출되는 것을 방지함

![개발자 PC 보안](/assets/img/books/backend-basics-ch8/developer-security.png)

<br/><br/>

## 배운 점

- 가장 기본적인 보안은 사용자 개인정보와 같은 민감한 정보에 대한 적절한 접근 제어임
- 인증과 인가는 서버 개발에서 가장 기본적인 보안 개념임
- 암호화는 단방향(해시)와 양방향(AES, RSA)으로 나뉘며 각각 사용 목적이 다름
- HMAC을 통해 메시지의 무결성과 인증을 보장할 수 있음
- 감사 로그는 위변조 방지가 중요하므로 일반 로그와 분리된 저장소에 보관해야 함
- SQL 인젝션 등 시큐어 코딩 취약점은 Prepared Statement 등으로 방어할 수 있음
- 개발자 PC 보안이 소홀하면 전체 시스템의 보안이 위협받을 수 있음

<br/><br/>

## Reference

- [주니어 백엔드 개발자가 반드시 알아야 할 실무 지식](http://www.yes24.com/Product/Goods/125306759)
