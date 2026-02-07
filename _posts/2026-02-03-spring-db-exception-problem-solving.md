---
title: '[스프링 DB 1편 데이터 접근 핵심 원리] 스프링 예외 추상화와 반복 문제 해결'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-03 14:30:00 +0900
category: [Framework, Spring]
tags: [spring, java, exception, jdbc, jdbctemplate, data-access-exception, checked-exception, runtime-exception]
math: false
mermaid: false
---

# 스프링과 문제 해결 - 예외 처리, 반복

- 김영한님의 스프링 DB 1편 강의를 통해 체크 예외의 문제점과 이를 해결하기 위한 런타임 예외 적용, 그리고 스프링의 예외 추상화 및 JDBC 반복 문제 해결 방법(JdbcTemplate)을 정리함

<br/><br/>

## 체크 예외와 인터페이스의 문제

### 문제 상황

- 서비스 계층을 순수하게 유지하려면 특정 구현 기술(JDBC 등)에 대한 의존을 제거해야 함

![서비스 계층 의존 관계](/assets/img/springdb/service_dependency.png)

- **목표**
  - 구현 기술 변경 시 서비스 계층 코드는 그대로 유지

### 체크 예외의 문제

- **문제점**

    ![체크 예외 문제점](/assets/img/springdb/checked_exception_problem.png)

    ```java
    // 인터페이스가 특정 기술(JDBC)에 종속됨
    public interface MemberRepositoryEx {
        Member save(Member member) throws SQLException;      // JDBC 예외
        Member findById(String memberId) throws SQLException;
        void update(String memberId, int money) throws SQLException;
        void delete(String memberId) throws SQLException;
    }
    ```
    - 체크 예외는 인터페이스에도 선언되어야 함
    - 인터페이스가 특정 기술(JDBC)에 종속됨
    - 구현 기술 변경 시 인터페이스도 변경해야 함

<br/><br/>

## 런타임 예외 적용으로 해결

### 런타임 예외 전환

![런타임 예외 전환](/assets/img/springdb/runtime_exception_conversion.png)

### 구현 단계

- **순수한 인터페이스 정의**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepository.java)

    ```java
    // 예외에 대한 선언 없음 (순수한 인터페이스)
    public interface MemberRepository {
        Member save(Member member);           // throws 없음
        Member findById(String memberId);     // throws 없음
        void update(String memberId, int money);
        void delete(String memberId);
    }
    ```

- **런타임 예외 생성**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/ex/MyDbException.java)

    ```java
    // 런타임 예외 정의
    public class MyDbException extends RuntimeException {
        public MyDbException() {
        }
        
        public MyDbException(String message) {
            super(message);
        }
        
        public MyDbException(String message, Throwable cause) {
            super(message, cause);  // 기존 예외 포함
        }
        
        public MyDbException(Throwable cause) {
            super(cause);
        }
    }
    ```

- **리포지토리 구현 (예외 전환)**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/repository/MemberRepositoryV4_1.java)

    ```java
    @Slf4j
    public class MemberRepositoryV4_1 implements MemberRepository {

        @Override
        public Member save(Member member) {
            
            try {
                pstmt.executeUpdate();
                return member;
            } catch (SQLException e) {
                // 체크 예외 -> 런타임 예외 전환
                throw new MyDbException(e);  // 기존 예외 포함
            } finally {
                close(con, pstmt, null);
            }
        }
    }
    ```

- **순수한 서비스 계층**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/service/MemberServiceV4.java)

    ```java
    @Slf4j
    @RequiredArgsConstructor
    public class MemberServiceV4 {
        private final MemberRepository memberRepository;  // 인터페이스에 의존
        
        @Transactional
        public void accountTransfer(String fromId, String toId, int money) {
            bizLogic(fromId, toId, money);
        }
        
        private void bizLogic(String fromId, String toId, int money) {
            Member fromMember = memberRepository.findById(fromId);
            Member toMember = memberRepository.findById(toId);
            
            memberRepository.update(fromId, fromMember.getMoney() - money);
            validation(toMember);
            memberRepository.update(toId, toMember.getMoney() + money);
        }
    }
    ```
    - throws SQLException 제거됨
    - 특정 기술에 의존하지 않음
### 예외 전환 시 주의사항

- **중요**
  - 절대 기존 예외를 버리면 안됨

```java
// 잘못된 예: 기존 예외 무시
catch (SQLException e) {
    throw new MyDbException();  // e를 포함하지 않음 -> 원인 추적 불가
}
```
```java
// 올바른 예: 기존 예외 포함
catch (SQLException e) {
    throw new MyDbException(e);  // e를 포함 -> 완전한 스택 트레이스
}
```


<br/><br/>

## 데이터 접근 예외 직접 만들기

### 예외 복구가 필요한 시나리오

![예외 복구 시나리오](/assets/img/springdb/exception_recovery_scenario.png)

### 데이터베이스 오류 코드

![DB별 오류 코드](/assets/img/springdb/db_error_codes.png)

- **문제점**
  - 각 DB마다 오류 코드가 다름

    | 오류 종류 | H2 | MySQL |
    |----------|-----|--------|
    | 키 중복 | 23505 | 1062 |
    | SQL 문법 오류 | 42000 | 1064 |

### 의미있는 예외 계층 구조
- **Exception**
    - 커스텀 예외 계층

    ![커스텀 예외 계층](/assets/img/springdb/custom_exception_hierarchy.png)


    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/ex/MyDuplicateKeyException.java)

        ```java
        // 키 중복 전용 예외
        public class MyDuplicateKeyException extends MyDbException {
            public MyDuplicateKeyException() {
            }
            
            public MyDuplicateKeyException(String message) {
                super(message);
            }
            
            public MyDuplicateKeyException(String message, Throwable cause) {
                super(message, cause);
            }
            
            public MyDuplicateKeyException(Throwable cause) {
                super(cause);
            }
        }
        ```

### 예외 구분 및 복구 로직

- **Repository**
    - 오류 코드 확인 후 적절한 예외로 전환

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/service/MemberServiceV4Test.java)

        ```java
        public Member save(Member member) {
            String sql = "insert into member(member_id, money) values(?, ?)";
            
            try {
                
                pstmt.executeUpdate();
                return member;
            } catch (SQLException e) {
                // H2 DB의 키 중복 오류 코드 확인
                if (e.getErrorCode() == 23505) {
                    throw new MyDuplicateKeyException(e);
                }
                throw new MyDbException(e);
            } finally {
                close(con, pstmt, null);
            }
        }
        ```

- **Service**
    - 특정 예외만 잡아서 복구

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/service/MemberServiceV4Test.java)

        ```java
        @Slf4j
        @RequiredArgsConstructor
        static class Service {
            private final Repository repository;
            
            public void create(String memberId) {
                try {
                    repository.save(new Member(memberId, 0));
                    log.info("saveId={}", memberId);
                    
                } catch (MyDuplicateKeyException e) {
                    // 키 중복 예외만 잡아서 복구
                    log.info("키 중복, 복구 시도");
                    String retryId = generateNewId(memberId);
                    log.info("retryId={}", retryId);
                    repository.save(new Member(retryId, 0));
                    
                } catch (MyDbException e) {
                    // 기타 DB 예외는 로그만 남기고 던짐
                    log.info("데이터 접근 계층 예외", e);
                    throw e;
                }
            }
            
            private String generateNewId(String memberId) {
                return memberId + new Random().nextInt(10000);
            }
        }
        ```

        ```
        saveId=myId
        키 중복, 복구 시도
        retryId=myId492
        ```

<br/><br/>

## 스프링 예외 추상화

### 스프링의 해결책

![스프링 예외 계층](/assets/img/springdb/spring_exception_hierarchy.png)

- 스프링은 데이터 접근 계층에 대한 수십 가지 예외를 정리해서 일관된 예외 계층을 제공함
- 각각의 데이터 접근 기술(JDBC, JPA 등)에 따라 다르게 발생하는 예외를 스프링이 제공하는 예외 계층으로 변환해서 제공함
- 예외의 최고 상위는 `org.springframework.dao.DataAccessException`이며, 런타임 예외를 상속받음
- 스프링이 제공하는 데이터 접근 계층 예외는 모두 런타임 예외임

### 스프링 데이터 접근 예외 계층의 특징

| 특징 | 설명 |
|------|------|
| **기술 독립적** | JDBC, JPA 등 기술에 종속되지 않음 |
| **런타임 예외** | 모든 예외가 RuntimeException 상속 |
| **일관된 계층** | 수십 가지 예외를 체계적으로 분류 |

- **NonTransient와 Transient**

    ![예외 분류](/assets/img/springdb/exception_classification.png)

### 스프링 예외 변환기 사용

- **직접 ErrorCode 확인하는 기존 방식**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/exception/translator/SpringExceptionTranslatorTest.java)

    ```java
    @Test
    void sqlExceptionErrorCode() {
        String sql = "select bad grammar";
        
        try {
            
            stmt.executeQuery();
        } catch (SQLException e) {
            assertThat(e.getErrorCode()).isEqualTo(42122);
            // 각 DB마다 다른 코드를 일일이 확인해야 함
        }
    }
    ```

- **스프링 예외 변환기 사용 (권장)**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/test/java/hello/jdbc/exception/translator/SpringExceptionTranslatorTest.java)

    ```java
    @Test
    void exceptionTranslator() {
        String sql = "select bad grammar";
        
        try {
            Connection con = dataSource.getConnection();
            PreparedStatement stmt = con.prepareStatement(sql);
            stmt.executeQuery();
        } catch (SQLException e) {
            assertThat(e.getErrorCode()).isEqualTo(42122);
            
            // 스프링 예외 변환기 생성
            SQLExceptionTranslator exTranslator = 
                new SQLErrorCodeSQLExceptionTranslator(dataSource);
            
            // SQLException -> 스프링 예외로 자동 변환
            DataAccessException resultEx = exTranslator.translate("select", sql, e);
            
            log.info("resultEx", resultEx);
            
            // BadSqlGrammarException으로 변환됨
            assertThat(resultEx.getClass())
                .isEqualTo(BadSqlGrammarException.class);
            }
        }
    ```

### 스프링 예외 변환기

![예외 변환 원리](/assets/img/springdb/exception_translation_mechanism.png)

- **sql-error-codes.xml 내용**

    ```xml
    <!-- H2 데이터베이스 -->
    <bean id="H2" class="org.springframework.jdbc.support.SQLErrorCodes">
        <property name="badSqlGrammarCodes">
            <value>42000,42001,42101,42102,42111,42112,42121,42122,42132</value>
        </property>
        <property name="duplicateKeyCodes">
            <value>23001,23505</value>
        </property>
    </bean>

    <!-- MySQL 데이터베이스 -->
    <bean id="MySQL" class="org.springframework.jdbc.support.SQLErrorCodes">
        <property name="badSqlGrammarCodes">
            <value>1054,1064,1146</value>
        </property>
        <property name="duplicateKeyCodes">
            <value>1062</value>
        </property>
    </bean>
    ```

    - **스프링이 10개 이상의 주요 DB를 지원**

### 예외 변환기 적용

- **MemberRepositoryV4_2**

    - [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV4_2.java)

    ```java
    @Slf4j
    public class MemberRepositoryV4_2 implements MemberRepository {
        private final DataSource dataSource;
        private final SQLExceptionTranslator exTranslator;
        
        public MemberRepositoryV4_2(DataSource dataSource) {
            this.dataSource = dataSource;
            // 예외 변환기 생성
            this.exTranslator = new SQLErrorCodeSQLExceptionTranslator(dataSource);
        }
        
        @Override
        public Member save(Member member) {
            
            try {
                
                pstmt.executeUpdate();
                return member;
            } catch (SQLException e) {
                // 스프링 예외로 자동 변환
                throw exTranslator.translate("save", sql, e);
            } finally {
                close(con, pstmt, null);
            }
        }
    }
    ```

### 스프링 예외 추상화의 장점

![예외 추상화 장점](/assets/img/springdb/exception_abstraction_benefits.png)

- 스프링은 예외 변환기 덕분에 특정 기술에 종속적이지 않은 `DataAccessException` 계층의 예외를 던짐
- 예외의 최고 상위는 `org.springframework.dao.DataAccessException`이며, 런타임 예외를 상속받음
- 서비스 계층은 JDBC, JPA 등 데이터 접근 기술의 종류와 무관하게 스프링이 제공하는 예외에만 의존하면 됨
- 데이터 접근 기술을 변경해도 서비스 계층의 코드를 변경하지 않아도 됨

<br/><br/>

## JDBC 반복 문제 해결

### JDBC 반복 코드 문제점

![JDBC 반복 코드](/assets/img/springdb/jdbc_repetition_problem.png)

- **기존 코드의 반복 패턴**

    ```java
    public Member save(Member member) {
        String sql = "insert into member(member_id, money) values(?, ?)";
        Connection con = null;              // <- 반복
        PreparedStatement pstmt = null;      // <- 반복
        
        try {
            con = getConnection();           // <- 반복
            pstmt = con.prepareStatement(sql);  // <- 반복
            pstmt.setString(1, member.getMemberId());  // SQL마다 다름
            pstmt.setInt(2, member.getMoney());        // SQL마다 다름
            pstmt.executeUpdate();           // <- 반복
            return member;
        } catch (SQLException e) {
            throw exTranslator.translate("save", sql, e);  // <- 반복
        } finally {
            close(con, pstmt, null);         // <- 반복
        }
    }
    ```
  - 모든 메서드에서 동일한 패턴 반복

### 템플릿 콜백 패턴

![템플릿 콜백 패턴](/assets/img/springdb/template_callback_pattern.png)

### JdbcTemplate 사용
- [전체 코드 보기](https://github.com/mxxikr/spring-db-part1/blob/master/jdbc/src/main/java/hello/jdbc/repository/MemberRepositoryV5.java)
    ```java
    @Slf4j
    public class MemberRepositoryV5 implements MemberRepository {
        private final JdbcTemplate template;
        
        public MemberRepositoryV5(DataSource dataSource) {
            template = new JdbcTemplate(dataSource);
        }
        
        @Override
        public Member save(Member member) {
            String sql = "insert into member(member_id, money) values(?, ?)";
            
            template.update(sql, member.getMemberId(), member.getMoney()); // 한 줄로 끝
            return member;
        }
        
        @Override
        public Member findById(String memberId) {
            String sql = "select * from member where member_id = ?";

            return template.queryForObject(sql, memberRowMapper(), memberId); // 한 줄로 끝
        }
        
    }
    ```

### 코드 비교

- **Before**
    ```java
    // 약 30줄의 반복 코드
    Connection con = null;
    PreparedStatement pstmt = null;
    try {
        con = getConnection();
        pstmt = con.prepareStatement(sql);
        pstmt.setString(1, ...);
        pstmt.executeUpdate();
        return member;
    } catch (SQLException e) {
        throw exTranslator.translate(...);
    } finally {
        close(con, pstmt, null);
    }
    ```

- **After**
    ```java
    // 약 3줄로 간소화
    String sql = "insert into member(member_id, money) values(?, ?)";
    template.update(sql, member.getMemberId(), member.getMoney());
    return member;
    ```

### JdbcTemplate의 자동 처리 항목

| 기능 | 자동 처리 여부 |
|------|---------------|
| 커넥션 조회 | 자동 |
| 커넥션 동기화 (트랜잭션) | 자동 |
| PreparedStatement 생성 | 자동 |
| 파라미터 바인딩 | 자동 |
| 쿼리 실행 | 자동 |
| 결과 집합 매핑 | 자동 |
| 예외 변환 | 자동 |
| 리소스 종료 | 자동 |

<br/><br/>

## 요약 정리

- **체크 예외의 문제**
  - 인터페이스에 특정 기술 예외(`SQLException`)가 침투하여 의존성을 만듦
- **런타임 예외 적용**
  - 체크 예외를 런타임 예외로 전환하여 인터페이스를 순수하게 유지하고 서비스 계층의 의존성을 제거
- **데이터 접근 예외 직접 만들기**
  - 복구 불가능한 예외는 로그만 남기고, 복구 가능한 예외(키 중복 등)는 별도의 런타임 예외를 만들어 처리
- **스프링 예외 추상화**
  - `DataAccessException` 계층을 통해 데이터 접근 기술에 독립적인 일관된 예외 처리가 가능해짐
- **JdbcTemplate**
  - 반복되는 JDBC 코드를 템플릿 콜백 패턴으로 제거하여 핵심 비즈니스 로직에만 집중할 수 있게 함

<br/><br/>

## 연습 문제

1. 체크 예외(Checked Exception)를 사용하는 경우, 인터페이스 설계 시 어떤 문제가 발생할 수 있나요?

   a. 인터페이스 메서드에 예외를 선언해야 하므로 특정 기술에 종속될 수 있습니다.
   
   - 체크 예외는 메서드 시그니처에 반드시 선언해야함
   - 따라서 특정 기술의 체크 예외(예: `SQLException`)가 인터페이스에 포함되면 인터페이스 자체도 그 기술에 의존하게 됨

2. 데이터 접근 기술에 종속적인 체크 예외를 Repository 계층에서 사용자 정의 런타임 예외로 변환하여 던지는 주된 이유는 무엇일까요?

   a. 서비스 계층의 순수성을 유지하고 특정 기술로부터 독립시키기 위해
   
   - 기술 종속적인 예외를 런타임 예외로 래핑하면, 서비스 계층은 특정 기술 예외를 몰라도 됨
   - 비즈니스 로직은 순수한 상태로 유지되고 유연성이 높아짐

3. Spring이 제공하는 'DataAccessException' 계층 구조의 주요 목적은 무엇인가요?

   a. 데이터 접근 기술에 독립적인 표준 런타임 예외 계층을 제공함
   
   - Spring의 `DataAccessException`은 JDBC, JPA 등 다양한 데이터 접근 기술의 예외를 추상화한 런타임 예외 계층임
   - 서비스 계층은 이 추상화된 예외만 처리하면 기술 변경에 유연해짐

4. Spring의 'SQLExceptionTranslator'가 데이터베이스별로 다른 SQL 오류 코드를 Spring의 'DataAccessException'으로 변환하는 방식은 주로 무엇을 활용하나요?

   a. 데이터베이스별 SQL 오류 코드와 Spring 예외를 매핑한 외부 설정 파일(예: sql-error-codes.xml)
   
   - Spring은 내부적으로 `sql-error-codes.xml` 파일 등을 통해 데이터베이스 종류별 SQL 오류 코드를 미리 정의된 Spring의 `DataAccessException` 서브클래스와 매핑해두고 이를 활용해 자동 변환함

5. Spring 'JdbcTemplate'을 사용함으로써 JDBC 코드에서 줄일 수 있는 주된 반복 작업은 무엇인가요?

   a. 커넥션 획득/반납, Statement 준비/실행, 결과 매핑, 자원 해제 및 예외 처리
   
   - `JdbcTemplate`은 커넥션 관리, Statement 준비 및 실행, 결과 매핑, 자원 해제(close), 예외 변환 등 JDBC 사용 시 반복적으로 필요한 대부분의 상용구 코드를 대신 처리해줌

<br/><br/>

## Reference

- [스프링 DB 1편 - 데이터 접근 핵심 원리](https://www.inflearn.com/course/스프링-db-1)
