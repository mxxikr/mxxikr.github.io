---
title: '[김영한의 스프링 DB 2편 - 데이터 접근 활용 기술] 스프링 JdbcTemplate'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-04 15:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, jdbctemplate, sql, rowmapper, namedparameterjdbctemplate, simplejdbcinsert]
math: false
---

# 스프링 JdbcTemplate

- 김영한님의 스프링 DB 2편 강의를 통해 JdbcTemplate의 기본 사용법부터 실무 활용 팁까지 정리함

<br/><br/>

## JdbcTemplate

### 소개

- 스프링 프레임워크가 제공하는 가장 기본적인 데이터 접근 기술임
- JDBC의 복잡하고 반복적인 코드를 대부분 제거하여 개발자가 SQL 작성에만 집중할 수 있도록 도움
- 별도의 복잡한 설정 없이 바로 사용할 수 있음

### 주요 특징

- **순수 JDBC와 비교**

    | 기능 | JDBC | JdbcTemplate |
    |------|------|--------------|
    | `Connection` 획득 | 개발자가 직접 관리 | 자동 획득 및 반환 |
    | `Statement` 준비 | 개발자가 직접 생성 | SQL과 파라미터만 전달하면 자동 생성 |
    | 예외 처리 | `SQLException` 체크 예외 처리 필요 | 언체크 예외로 자동 변환 (`DataAccessException`) |
    | 리소스 정리 | 개발자가 직접 `close()` 호출 | 자동 종료 |

- **장점**
    - `spring-jdbc` 라이브러리만 있으면 별도의 설정 없이 바로 사용 가능함
    - 커넥션 연결, 종료, 예외 처리 등 지루한 반복 작업을 대신 처리해줌
    - 스프링의 트랜잭션 매니저와 완벽하게 연동되어 트랜잭션 관리가 용이함

- **단점**
    - SQL을 자바 코드 내에 문자열로 작성해야 하므로 복잡한 동적 쿼리를 작성하기 어려움
    - JPA와 달리 개발자가 직접 모든 SQL을 작성해야 함

### 설정

- build.gradle

    ```groovy
    dependencies {
        // JdbcTemplate 추가
        implementation 'org.springframework.boot:spring-boot-starter-jdbc'
        
        // H2 데이터베이스 추가
        runtimeOnly 'com.h2database:h2'
    }
    ```

<br/><br/>

## 기본 사용법 (V1)

### 전체 구조

![jdbctemplate-2](/assets/img/springdb/jdbctemplate-2.png)

### 리포지토리 구현

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jdbctemplate/JdbcTemplateItemRepositoryV1.java)

    ```java
    @Slf4j
    @Repository
    public class JdbcTemplateItemRepositoryV1 implements ItemRepository {
        
        private final JdbcTemplate template;
        
        // DataSource를 주입받아 JdbcTemplate 생성
        public JdbcTemplateItemRepositoryV1(DataSource dataSource) {
            this.template = new JdbcTemplate(dataSource);
        }
    }
    ```

### 주요 메서드 구현

- **`save()`**
    - **데이터 저장 및 자동 생성 키 조회**
        - `KeyHolder`를 사용하여 DB에서 자동 생성된 키(Auto Increment)를 조회함

    ```java
    @Override
    public Item save(Item item) {
        String sql = "insert into item (item_name, price, quantity) values (?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder(); // DB에서 생성된 키를 받기 위한 객체
        
        template.update(connection -> {
            // 자동 증가 키 사용 설정 (id 컬럼 지정)
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, item.getItemName());
            ps.setInt(2, item.getPrice());
            ps.setInt(3, item.getQuantity());
            return ps;
        }, keyHolder);
        
        // DB가 생성한 ID 값 조회 및 할당
        long key = keyHolder.getKey().longValue();
        item.setId(key);
        return item;
    }
    ```

    - **`KeyHolder` 동작 흐름**
        1. `update()` 호출 (SQL + `KeyHolder`)
        2. DB INSERT 실행
        3. DB ID 자동 생성 (Auto Increment)
        4. 생성된 ID를 `KeyHolder`에 저장
        5. `keyHolder.getKey()`로 ID 조회

- **`update()`**
    - **데이터 수정**

    ```java
    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        String sql = "update item set item_name=?, price=?, quantity=? where id=?";
        template.update(sql, 
            updateParam.getItemName(), 
            updateParam.getPrice(), 
            updateParam.getQuantity(), 
            itemId); // ? 순서대로 바인딩
    }
    ```

    - **순서 주의**
    - 파라미터는 `?` 순서대로 바인딩됨

- **`findById()`**
    - **단건 조회**

    ```java
    @Override
    public Optional<Item> findById(Long id) {
        String sql = "select id, item_name, price, quantity from item where id = ?";
        try {
            // 결과가 없거나 2개 이상이면 예외 발생
            Item item = template.queryForObject(sql, itemRowMapper(), id);
            return Optional.of(item);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty(); // 결과가 없을 때 빈 Optional 반환
        }
    }
    ```

    - **`queryForObject`**
        - 결과가 0개면 `EmptyResultDataAccessException` 발생
        - 결과가 2개 이상이면 `IncorrectResultSizeDataAccessException` 발생

- **`findAll()`**
    - **목록 조회**

    ```java
    @Override
    public List<Item> findAll(ItemSearchCond cond) {
        String itemName = cond.getItemName();
        Integer maxPrice = cond.getMaxPrice();
        
        String sql = "select id, item_name, price, quantity from item";
        
        // 동적 쿼리 (문제점)
        if (StringUtils.hasText(itemName) || maxPrice != null) {
            sql += " where";
        }
        
        boolean andFlag = false;
        List<Object> param = new ArrayList<>();
        
        if (StringUtils.hasText(itemName)) {
            sql += " item_name like concat('%',?,'%')";
            param.add(itemName);
            andFlag = true;
        }
        
        if (maxPrice != null) {
            if (andFlag) {
                sql += " and";
            }
            sql += " price <= ?";
            param.add(maxPrice);
        }
                
        return template.query(sql, itemRowMapper(), param.toArray()); // 목록 조회 (결과 없으면 빈 리스트)
    }
    ```

    - **문제점**
        - 문자열 조합으로 인해 복잡하고 실수하기 쉬움

- **`RowMapper`**
    - **결과 매핑**

    ```java
    private RowMapper<Item> itemRowMapper() {
        return (rs, rowNum) -> {
            Item item = new Item();
            item.setId(rs.getLong("id"));
            item.setItemName(rs.getString("item_name"));
            item.setPrice(rs.getInt("price"));
            item.setQuantity(rs.getInt("quantity"));
            return item; // ResultSet을 객체로 변환
        };
    }
    ```

<br/><br/>

## 이름 지정 파라미터 (V2)

### 순서 바인딩의 문제점

- **SQL 파라미터 순서 의존**
    - `?`를 사용하는 방식은 파라미터의 순서에 전적으로 의존함
    - SQL의 컬럼 순서가 변경되거나, 파라미터 추가 시 자바 코드의 전달 순서를 실수하면 심각한 데이터 정합성 문제가 발생할 수 있음

### NamedParameterJdbcTemplate

- **이름 기반 파라미터 바인딩**
    - `?` 대신 `:파라미터명`을 사용하여 파라미터를 이름으로 매핑함
    - 순서가 바뀌어도 이름이 일치하면 정상적으로 바인딩되므로 안전함
    - `BeanPropertySqlParameterSource`나 `MapSqlParameterSource` 등을 활용해 객체나 `Map`을 쉽게 파라미터로 전달할 수 있음

- 리포지토리 생성

  - [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jdbctemplate/JdbcTemplateItemRepositoryV2.java)

      ```java
      @Slf4j
      @Repository
      public class JdbcTemplateItemRepositoryV2 implements ItemRepository {
          
          private final NamedParameterJdbcTemplate template;
          
          public JdbcTemplateItemRepositoryV2(DataSource dataSource) {
              // NamedParameterJdbcTemplate 사용 (이름 기반 파라미터 바인딩)
              this.template = new NamedParameterJdbcTemplate(dataSource);
          }
      }
      ```

### 파라미터 바인딩 방법

- **`Map` 사용**

    ```java
    @Override
    public Optional<Item> findById(Long id) {
        String sql = "select id, item_name, price, quantity from item where id = :id";
        
        try {
            // Map으로 파라미터 전달 (키=파라미터명)
            Map<String, Object> param = Map.of("id", id);
            Item item = template.queryForObject(sql, param, itemRowMapper());
            return Optional.of(item);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
    ```

- `MapSqlParameterSource` 사용

    ```java
    @Override
    public void update(Long itemId, ItemUpdateDto updateParam) {
        String sql = "update item " +
                     "set item_name=:itemName, price=:price, quantity=:quantity " +
                     "where id=:id";
        
        // MapSqlParameterSource - 메서드 체인 방식, SQL 타입 지정 가능
        SqlParameterSource param = new MapSqlParameterSource()
            .addValue("itemName", updateParam.getItemName())
            .addValue("price", updateParam.getPrice())
            .addValue("quantity", updateParam.getQuantity())
            .addValue("id", itemId);  // 별도로 추가 필요
        
        template.update(sql, param);
    }
    ```

- `BeanPropertySqlParameterSource` 사용

    ```java
    @Override
    public Item save(Item item) {
        String sql = "insert into item (item_name, price, quantity) " +
                     "values (:itemName, :price, :quantity)";
        
        // 자바빈 프로퍼티 자동 매핑 (getter 메서드 사용)
        SqlParameterSource param = new BeanPropertySqlParameterSource(item);
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        template.update(sql, param, keyHolder);
        
        Long key = keyHolder.getKey().longValue();
        item.setId(key);
        return item;
    }
    ```

  - **자동 매핑 원리**
    - 자바빈 규약에 따라 `getItemName()` -> `:itemName`으로 자동 매핑됨

### **파라미터 바인딩 선택 가이드**
- **객체의 모든 필드 사용 (가장 권장)**
    - `BeanPropertySqlParameterSource`
- **객체 + 추가 파라미터**
    - `MapSqlParameterSource`
- **단순 파라미터 1-2개**
    - `Map`

### BeanPropertyRowMapper

- **자동 매핑 (V2)**

    ```java
    private RowMapper<Item> itemRowMapper() {
        // BeanPropertyRowMapper: DB 컬럼(snake_case)을 자바 프로퍼티(camelCase)로 자동 매핑
        return BeanPropertyRowMapper.newInstance(Item.class);
    }
    ```

- **snake_case ↔ camelCase 자동 변환**
  - `item_name` (DB) → `itemName` (Java)
  - `max_price` (DB) → `maxPrice` (Java)

<br/><br/>

## SimpleJdbcInsert (V3)

### **INSERT SQL 자동 생성**
  - `SimpleJdbcInsert`는 DB 테이블의 메타데이터를 조회하여 `INSERT` SQL을 자동으로 생성함
  - 개발자가 직접 SQL을 작성할 필요 없이, 테이블 이름과 키 컬럼만 지정하면 됨


### SimpleJdbcInsert 생성

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/jdbctemplate/JdbcTemplateItemRepositoryV3.java)

    ```java
    @Slf4j
    @Repository
    public class JdbcTemplateItemRepositoryV3 implements ItemRepository {
        
        private final NamedParameterJdbcTemplate template;
        private final SimpleJdbcInsert jdbcInsert;
        
        public JdbcTemplateItemRepositoryV3(DataSource dataSource) {
            this.template = new NamedParameterJdbcTemplate(dataSource);
            
            // SimpleJdbcInsert 설정 (INSERT SQL 자동 생성)
            this.jdbcInsert = new SimpleJdbcInsert(dataSource)
                .withTableName("item")                  // 테이블명
                .usingGeneratedKeyColumns("id");        // PK 컬럼명
        }
    }
    ```

### `save()` 구현

```java
@Override
public Item save(Item item) {
    // S자바빈 프로퍼티를 이용해 INSERT 실행
    SqlParameterSource param = new BeanPropertySqlParameterSource(item);
    Number key = jdbcInsert.executeAndReturnKey(param); // PK 반환
    item.setId(key.longValue());
    return item;
}
```

<br/><br/>

## JdbcTemplate 기능 정리

### 주요 메서드 비교표

| 메서드 | 용도 | 반환 타입 | 결과 없을 때 |
|--------|------|-----------|--------------|
| `queryForObject()` | 단건 조회 | T | 예외 발생 |
| `query()` | 목록 조회 | List<T> | 빈 리스트 |
| `update()` | INSERT/UPDATE/DELETE | int | 0 |
| `execute()` | DDL 등 | void | - |

<br/><br/>

## 연습 문제

1. Spring JdbcTemplate 사용의 가장 큰 장점은 무엇일까요?

   a. JDBC 코딩 시 반복적인 부가 작업들을 대부분 대신 처리해 준다.
   
   - `JdbcTemplate`의 핵심은 개발자가 SQL에 집중할 수 있도록 `Connection`, `Statement`, `ResultSet` 처리 같은 반복적인 JDBC 코드를 줄여주는 것임

2. JdbcTemplate 사용 시 동적 쿼리를 다루는 것이 왜 어렵다고 언급되었나요?

   a. SQL 문자열을 코드에서 동적으로 조합해야 해서
   
   - 검색 조건에 따라 WHERE 절 등이 달라지는 동적 쿼리는 코드 내에서 SQL 문자열을 직접 조합해야 하므로 경우의 수가 많아지고 버그 발생 확률이 높아짐

3. NamedParameterJdbcTemplate은 기본적인 JdbcTemplate의 어떤 문제를 개선한 것일까요?

   a. 파라미터 바인딩 시 순서 의존성
   
   - 기본 `JdbcTemplate`은 파라미터 순서가 바뀌면 오류가 발생할 수 있지만, `NamedParameterJdbcTemplate`은 이름으로 파라미터를 바인딩하여 이 문제를 해결하고 코드 변경에 유연하게 대처할 수 있게 함

4. JdbcTemplate에서 queryForObject나 query 메서드를 사용하여 데이터를 조회할 때, RowMapper의 주요 역할은 무엇인가요?

   a. SQL 결과를 자바 객체로 변환하는 역할
   
   - `RowMapper`는 데이터베이스에서 가져온 `ResultSet`의 각 행(row) 데이터를 개발자가 정의한 자바 객체(예: `Item` 객체)로 변환하는 책임을 가짐

5. INSERT SQL 작성을 생략하고, 특히 자동 생성되는 키 값을 편리하게 얻을 수 있도록 도와주는 JdbcTemplate의 기능은 무엇일까요?

   a. SimpleJdbcInsert
   
   - `SimpleJdbcInsert`는 테이블 이름과 키 컬럼만 지정하면 INSERT SQL 작성 없이도 데이터를 삽입하고 자동 생성된 키를 쉽게 반환받도록 설계됨

<br/><br/>

## 요약 정리

- `JdbcTemplate`은 JDBC의 반복적이고 복잡한 코드를 제거하여 개발자가 SQL 작성에만 집중할 수 있게 도와주는 도구임
- 기본 `JdbcTemplate`(V1)은 `?`를 사용한 순서 기반 파라미터 바인딩을 사용하며, 파라미터 순서 변경 시 오류 발생 가능성이 있어 주의가 필요함
- `NamedParameterJdbcTemplate`(V2)은 `:파라미터명`을 사용하는 이름 기반 바인딩을 제공하여 순서 의존성 문제를 해결하고 안전성을 높여 실무에서 권장됨
- `SimpleJdbcInsert`(V3)는 테이블 메타데이터를 활용해 INSERT SQL을 자동으로 생성해주며, `NamedParameterJdbcTemplate`과 함께 사용하면 개발 생산성을 극대화할 수 있음
- 데이터 조회 시 `queryForObject()`는 단건 조회(결과 없거나 다수면 예외 발생)에, `query()`는 목록 조회(결과 없으면 빈 리스트)에 사용함
- `BeanPropertyRowMapper`를 활용하면 DB의 스네이크 케이스 컬럼명과 자바의 카멜 케이스 프로퍼티명을 자동으로 매핑해주어 편리함
- 단순한 CRUD 작업은 `JdbcTemplate`과 `SimpleJdbcInsert`로 충분히 효율적으로 처리가 가능하지만, 복잡한 동적 쿼리가 필요한 경우에는 `MyBatis`나 `Querydsl` 도입을 고려해야 함

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
