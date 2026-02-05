---
title: '[김영한의 스프링 DB 2편 - 데이터 접근 활용 기술] 데이터 접근 기술 - MyBatis'
author: {name: mxxikr, link: 'https://github.com/mxxikr'}
date: 2026-02-05 15:00:00 +0900
category: [Framework, Spring]
tags: [spring, java, database, mybatis, sql-mapper, xml, dynamic-query]
math: false
mermaid: false
---

# 데이터 접근 기술 - MyBatis

- 김영한님의 스프링 DB 2편 강의를 통해 MyBatis의 개념, 설정 방법, 기본 사용법, 그리고 동적 쿼리와 다양한 고급 기능을 정리함

<br/><br/>

## MyBatis

### MyBatis란?

![mybatis_overview](/assets/img/springdb/mybatis_overview.png)

- **MyBatis 특징**
    - SQL Mapper 기술
    - JdbcTemplate의 모든 기능 + 추가 기능
    - XML 기반 SQL 관리
    - 강력한 동적 쿼리 지원

### JdbcTemplate과 MyBatis 비교

- **SQL 여러 줄 작성**

    - **JdbcTemplate**
        - 자바 코드 내에서 문자열 더하기 연산(`+`)이 필요하여 가독성이 떨어지고 수정이 번거로움

        ```java
        String sql = "update item " +
                    "set item_name=:itemName, price=:price, quantity=:quantity " +
                    "where id=:id";
        ```

    - **MyBatis**
        - XML 파일에 SQL을 있는 그대로 작성하므로 가독성이 좋고 관리가 편리함

        ```xml
        <update id="update">
            update item
            set item_name=#{itemName},
                price=#{price},
                quantity=#{quantity}
            where id=#{id}
        </update>
        ```

- **동적 쿼리 비교**

    - **JdbcTemplate (복잡함)**
        - 조건 확인, 쿼리 조립, 파라미터 관리를 모두 자바 코드로 작성해야 함

        ```java
        String sql = "select * from item";
        if (StringUtils.hasText(itemName)) {
            sql += " where item_name like ...";
        }
        ```

    - **MyBatis (간편함)**
        - 전용 태그(`if`, `where`)를 사용하면 조건에 따라 SQL이 자동 완성됨

        ```xml
        <select id="findAll" resultType="Item">
            select * from item
            <where>
                <if test="itemName != null">
                    and item_name like concat('%',#{itemName},'%')
                </if>
            </where>
        </select>
        ```


<br/><br/>

## 설정

### 의존성 추가

- `mybatis-spring-boot-starter`를 추가하면 다음 라이브러리들이 자동으로 포함됨
    - `mybatis-spring-boot-autoconfigure`
        - 스프링 부트 자동 설정
    - `mybatis-spring`
        - 스프링과 MyBatis 연동
    - `mybatis`
        - MyBatis 핵심 라이브러리

- **build.gradle**

    ```groovy
    dependencies {
        // MyBatis 추가
        implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.0.1'
    }
    ```
    - 스프링 부트 공식 라이브러리가 아니므로 버전 명시가 필요함


### application.properties 설정

```properties
# MyBatis 설정
mybatis.type-aliases-package=hello.itemservice.domain
mybatis.configuration.map-underscore-to-camel-case=true
logging.level.hello.itemservice.repository.mybatis=trace
```
- **`type-aliases-package`**
    - XML에서 `resultType` 지정 시 패키지명을 생략할 수 있게 해줌
    - ex) `hello.itemservice.domain.Item` → `Item`

- **`map-underscore-to-camel-case`**
    - DB 컬럼(`item_name`)을 자바 필드(`itemName`)로 자동 매핑해줌
    - `snake_case` → `camelCase` 자동 변환

- **`mapper-locations`** (선택)
    - XML 매퍼 파일의 위치를 지정함
    - 기본값
        - `resources/패키지경로/Mapper.xml`
- **`logging.level`**
    - 실행되는 SQL 로그를 출력

<br/><br/>

## 기본 사용법

### 전체 구조

![mybatis_structure](/assets/img/springdb/mybatis_structure.png)

### Mapper 인터페이스 작성

```java
@Mapper  // MyBatis 매퍼 인터페이스 표시
public interface ItemMapper {
    void save(Item item);
    
    void update(@Param("id") Long id, 
                @Param("updateParam") ItemUpdateDto updateParam);
    
    Optional<Item> findById(Long id);
    
    List<Item> findAll(ItemSearchCond itemSearch);
}
```
- **`@Mapper`**
    - MyBatis가 스캔하여 구현체를 생성하도록 함
- **`@Param`**
    - 파라미터가 2개 이상일 때 이름을 지정해야 함

- [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/java/hello/itemservice/repository/mybatis/ItemMapper.java)

### Mapper XML 작성

- **ItemMapper.xml**

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
            "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
    
    <mapper namespace="hello.itemservice.repository.mybatis.ItemMapper">
        
        <insert id="save" useGeneratedKeys="true" keyProperty="id">
            insert into item (item_name, price, quantity)
            values (#{itemName}, #{price}, #{quantity})
        </insert>
        
        <select id="findById" resultType="Item">
            select id, item_name, price, quantity
            from item
            where id = #{id}
        </select>
    </mapper>
    ```
    - namespace는 매퍼 인터페이스의 전체 경로와 일치해야 함
    - `#{}` 구문은 PreparedStatement를 사용하여 파라미터를 바인딩함 (안전)
    
    - [전체 코드](https://github.com/mxxikr/spring-db-part2/blob/master/itemservice-db/src/main/resources/hello/itemservice/repository/mybatis/ItemMapper.xml)


### MyBatis 동작 원리

- **매퍼 구현체 자동 생성**
    - 개발자는 인터페이스만 작성하고 구현체를 만들지 않음
    - MyBatis 스프링 연동 모듈이 애플리케이션 로딩 시점에 `@Mapper`가 붙은 인터페이스를 스캔함
    - **JDK 동적 프록시** 기술을 사용하여 해당 인터페이스의 구현체(프록시)를 메모리 상에서 자동으로 생성함
    - 생성된 프록시 객체를 스프링 빈으로 등록하여 의존성 주입(DI)에 사용함

- **실행 흐름**
    1. 애플리케이션에서 `ItemMapper` 인터페이스의 메서드(예: `save()`)를 호출
    2. 동적 프록시 객체가 호출을 가로챔
    3. 프록시 객체는 XML 매퍼 파일에서 해당 메서드 이름(`id="save"`)과 일치하는 SQL을 찾음
    4. 파라미터를 바인딩하고 SQL을 실행한 후 결과를 반환

<br/><br/>

## 동적 쿼리

### 주요 태그

- **if 태그**
    - 조건에 따라 SQL 조각을 포함함

    ```xml
    <if test="title != null">
        AND title like #{title}
    </if>
    ```

- **where 태그**
    - 내부에 포함된 쿼리가 있으면 `WHERE`를 추가함
    - 만약 `AND`나 `OR`로 시작하면 자동으로 제거해줌

    ```xml
    <select id="findAll" resultType="Item">
        select * from item
        <where>
            <if test="itemName != null">
                and item_name like concat('%',#{itemName},'%')
            </if>
            <if test="maxPrice != null">
                and price &lt;= #{maxPrice}
            </if>
        </where>
    </select>
    ```

- **choose, when, otherwise**
    - Java의 switch문과 유사함

    ```xml
    <choose>
        <when test="title != null"> ... </when>
        <otherwise> ... </otherwise>
    </choose>
    ```

- **trim 태그**
    - `where` 태그와 유사하지만 더 유연한 기능을 제공함
    - `prefix`
        - 실행 쿼리 앞에 추가할 문구
    - `prefixOverrides`
        - 실행 쿼리 맨 앞에 해당 문구가 있으면 제거함

    ```xml
    <trim prefix="WHERE" prefixOverrides="AND |OR ">
        <if test="title != null">
            AND title like #{title}
        </if>
    </trim>
    ```

- **set 태그**
    - UPDATE 문에서 변경할 컬럼을 동적으로 포함할 때 사용함
    - 맨 마지막의 콤마(`,`)를 자동으로 제거해줌

    ```xml
    <update id="updateAuthorIfNecessary">
        update Author
        <set>
            <if test="username != null">username=#{username},</if>
            <if test="password != null">password=#{password},</if>
            <if test="email != null">email=#{email},</if>
        </set>
        where id=#{id}
    </update>
    ```

- **foreach 태그**
    - 컬렉션을 반복하여 SQL을 생성함 (주로 `IN` 조건에 사용)
    - `collection`
        - 반복할 컬렉션 파라미터 이름
    - `item`
        - 반복되는 항목의 변수명
    - `open`
        - 반복 시작 문자열
    - `close`
        - 반복 종료 문자열
    - `separator`
        - 각 항목 사이의 구분자

    ```xml
    <select id="selectPostIn" resultType="domain.blog.Post">
        SELECT *
        FROM POST P
        <where>
            <foreach item="item" index="index" collection="list"
                     open="ID in (" separator="," close=")" nullable="true">
                #{item}
            </foreach>
        </where>
    </select>
    ```

<br/><br/>

## 고급 기능

### XML 특수문자 처리

- `<` 같은 특수문자는 XML 태그와 충돌하므로 사용할 수 없음

1. **엔티티 참조 사용**
    - `<` → `&lt;`, `>` → `&gt;`
2. **CDATA 사용**
    - `<![CDATA[ ... ]]>` 안에 작성하면 문자 그대로 인식됨

### 애노테이션으로 SQL 작성


- XML 대신 인터페이스에 직접 작성 가능

    ```java
    @Select("select * from item where id=#{id}")
    Optional<Item> findById(Long id);
    ```

### 문자열 대체 (${})

- `#{}`는 파라미터 바인딩(`?`), `${}`는 문자열 직접 치환
- `${}`는 SQL Injection 위험이 있으므로 가급적 사용하지 말아야 함

### 재사용 가능한 SQL 조각

- `<sql>`로 정의하고 `<include>`로 포함시킬 수 있음

    ```xml
    <sql id="userColumns">id, username, password</sql>

    <select id="selectUsers" resultType="User">
        select <include refid="userColumns"/> from user
    </select>
    ```

### Result Maps

- **복잡한 결과 매핑**
    - DB 컬럼명과 자바 필드명이 다를 때 별칭(`AS`) 대신 사용할 수 있음
    - `id`
        - 기본 키 매핑
    - `result`
        - 일반 컬럼 매핑 (column=DB컬럼, property=자바필드)

    ```xml
    <resultMap id="userResultMap" type="User">
        <id property="id" column="user_id" />
        <result property="userName" column="user_name"/>
        <result property="hashedPassword" column="hashed_password"/>
    </resultMap>

    <select id="selectUsers" resultMap="userResultMap">
        select user_id, user_name, hashed_password
        from some_table
        where id = #{id}
    </select>
    ```

- **연관 관계 매핑**
    - `association`
        - 1:1 관계 매핑
    - `collection`
        - 1:N 관계 매핑 (성능 이슈 발생 가능성 있음)


<br/><br/>

## 연습 문제

1. MyBatis를 JDBC Template 대신 사용할 때 얻을 수 있는 주요 이점은 무엇일까요?

   a. 복잡한 동적 쿼리 작성을 XML에서 편리하게 처리할 수 있다.

   - MyBatis는 SQL을 XML 파일에 분리하여 작성하며, 특히 `<if>`, `<where>` 등 동적 쿼리 처리를 위한 다양한 태그를 제공하며 복잡한 SQL 작성을 JdbcTemplate보다 훨씬 간편하게 만듦

2. MyBatis Spring 통합 모듈이 구현체 없는 매퍼 인터페이스를 스프링 빈으로 등록하는 방식은 무엇일까요?

   a. 런타임에 동적 프록시 객체를 생성하여 스프링 빈으로 등록한다.

   - `@Mapper` 어노테이션이 붙은 인터페이스는 MyBatis Spring 통합 모듈에 의해 스캔되며, 런타임에 해당 인터페이스의 메서드 호출을 가로채는 동적 프록시 객체가 만들어지고 스프링 빈으로 등록됨

3. MyBatis 설정 시, 데이터베이스 컬럼 이름의 snake_case를 자바 객체 속성 이름의 camelCase로 자동 매핑해 주는 속성은 무엇일까요?

   a. `map-underscore-to-camel-case`

   - `map-underscore-to-camel-case` 속성을 true로 설정하면, SELECT 결과의 `item_name`과 같은 컬럼 이름을 자동으로 `itemName`과 같은 자바 객체 속성에 매핑시켜주는 기능을 제공함

4. MyBatis XML에서 동적 쿼리 작성 시, 여러 조건이 붙을 때 첫 조건 앞에 불필요한 'AND'나 'OR'를 자동으로 제거하고, 조건이 하나도 없을 때 'WHERE' 키워드 자체를 생략해주는 태그는 무엇인가요?

   a. `<where>`

   - `<where>` 태그는 내부에 포함된 `<if>`나 다른 조건문 중 하나라도 만족되면 'WHERE' 키워드를 추가하고, 첫 조건 앞의 'AND' 또는 'OR'를 자동으로 제거하여 동적 WHERE 절 생성 오류를 방지함

5. MyBatis XML에서 '#' 문법 대신 '$' 문법을 사용할 때 발생할 수 있는 가장 심각한 보안 문제는 무엇일까요?

   a. SQL 인젝션 공격에 취약해진다.

   - `${}`는 파라미터 값을 SQL 문자열에 그대로 삽입하므로 악의적인 문자열 입력 시 SQL 구조 변조가 가능해져 SQL 인젝션 공격의 위험이 있음. `#{}`는 Prepared Statement를 사용해 안전함

<br/><br/>

## 요약 정리

- **MyBatis**는 JdbcTemplate이 제공하는 기능에 더해 XML 기반의 SQL 관리와 강력한 동적 쿼리 기능을 추가로 제공하는 SQL Mapper 기술임
- SQL을 자바 코드가 아닌 **XML 파일로 분리**하여 관리하므로 복잡한 쿼리의 가독성이 뛰어나고 수정 및 관리가 용이함
- `<if>`, `<where>`, `<choose>`, `<foreach>` 등의 태그를 제공하여 **동적 쿼리**를 매우 직관적이고 편리하게 작성할 수 있어 JdbcTemplate의 단점을 보완함
- `@Mapper` 애노테이션을 사용하면 구현체 없이 **인터페이스만으로** 리포지토리를 개발할 수 있으며, 스프링 부트가 자동으로 동적 프록시 객체를 생성하여 빈으로 등록해줌
- `application.properties` 설정으로 스네이크 케이스와 카멜 케이스 자동 매핑, 엔티티 패키지명 생략, XML 위치 지정 등 다양한 편의 기능을 제공함
- SQL이 단순하고 동적 쿼리가 없다면 JdbcTemplate이 빠를 수 있지만, **복잡한 SQL이나 동적 쿼리**가 필요한 환경에서는 MyBatis가 대안이 됨

<br/><br/>

## Reference

- [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/스프링-db-2)
