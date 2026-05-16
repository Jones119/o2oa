# O2OA Java 25 全面重构规格

## Why
当前 O2OA 后端基于 Java 11 构建，使用 `javax.*` 命名空间、传统线程池、`if-instanceof-cast` 模式、可变 DTO 等旧范式，存在并发性能瓶颈、SQL 注入风险、线程泄漏隐患及类型安全缺陷。需利用 Java 25 正式特性进行深度重构，在保证 API 契约 100% 兼容的前提下，显著提升性能、安全性与稳定性。

## What Changes
- **BREAKING**: `javax.*` → `jakarta.*` 命名空间全面迁移（影响 2000+ import 语句、1000+ 文件）
- **BREAKING**: 依赖库大版本升级（Jersey 2.x→4.x, Jetty 9→12, OpenJPA 3→4, H2 1.4→2.x, javaee-api→jakartaee-api 10+）
- 将传统线程池重构为虚拟线程（Virtual Threads）
- 将复杂集合处理重构为 Stream Gatherers
- 将 SQL/日志拼接重构为字符串模板（String Templates）
- 将 `if-instanceof-cast` 重构为 Switch 模式匹配
- 将领域模型重构为密封类（Sealed Classes）
- 将多子任务并发重构为结构化并发（Structured Concurrency）
- 将 `ThreadLocal` 重构为作用域值（Scoped Values）
- 将 DTO/VO 重构为 Record
- 修复 `Class.newInstance()` 废弃调用（58 处）
- Maven 编译目标从 Java 11 升级到 Java 25

## Impact
- Affected specs: 全部 55 个 Maven 模块
- Affected code:
  - `x_base_core_project` — 核心框架层（线程池、缓存、JPA 容器、JAX-RS 基础类、WrapCopier）
  - `x_*_core_entity` — 17 个实体模块（JPA 实体定义）
  - `x_*_core_express` — 5 个表达模块（业务逻辑封装）
  - `x_*_assemble_control` / `x_*_service_processing` — 32 个应用/服务模块（REST 接口、业务处理）
  - `x_console` / `x_program_center` / `x_program_init` — 运维模块

---

## ADDED Requirements

### Requirement: Java 25 编译与运行环境
系统 SHALL 在 Java 25 JDK 上编译并运行，Maven 编译目标设置为 25。

#### Scenario: 编译成功
- **WHEN** 执行 `mvn compile -DskipTests`
- **THEN** 所有 55 个模块编译成功，无错误

#### Scenario: 运行时兼容
- **WHEN** 应用在 Java 25 JRE 上启动
- **THEN** 所有服务正常启动，无 `UnsupportedClassVersionError` 或 `NoSuchMethodError`

### Requirement: javax → jakarta 命名空间迁移
系统 SHALL 将所有 `javax.*` 命名空间迁移到对应的 `jakarta.*` 命名空间。

#### Scenario: JAX-RS 迁移
- **WHEN** 代码使用 JAX-RS 注解（`@Path`, `@GET`, `@POST` 等）
- **THEN** import 来源为 `jakarta.ws.rs.*`，而非 `javax.ws.rs.*`

#### Scenario: JPA 迁移
- **WHEN** 代码使用 JPA API（`EntityManager`, `@Entity`, `@Table` 等）
- **THEN** import 来源为 `jakarta.persistence.*`，而非 `javax.persistence.*`

#### Scenario: Servlet 迁移
- **WHEN** 代码使用 Servlet API（`HttpServletRequest`, `HttpServletResponse` 等）
- **THEN** import 来源为 `jakarta.servlet.*`，而非 `javax.servlet.*`

### Requirement: 依赖库升级到 Jakarta EE 兼容版本
系统 SHALL 将以下核心依赖升级到与 Java 25 和 Jakarta EE 兼容的版本：

| 依赖 | 当前版本 | 目标版本 |
|------|---------|---------|
| Jersey | 2.45 | 4.x |
| Jetty | 9.4.58 | 12.x |
| OpenJPA | 3.2.2 | 4.x |
| H2 | 1.4.200 | 2.x |
| javaee-api | 8.0.1 | jakartaee-api 10+ |
| CXF | 3.6.9 | 4.x |
| Swagger | 2.2.25 | 2.2.25+（Jakarta 兼容版） |

#### Scenario: 依赖解析成功
- **WHEN** 执行 `mvn dependency:resolve`
- **THEN** 所有依赖成功解析，无版本冲突

### Requirement: 虚拟线程重构
系统 SHALL 将传统平台线程池重构为虚拟线程，实现轻量级并发。

#### Scenario: 线程池工厂迁移
- **WHEN** 代码使用 `Executors.newFixedThreadPool()`、`Executors.newCachedThreadPool()` 等传统线程池
- **THEN** 替换为 `Executors.newVirtualThreadPerTaskExecutor()` 或 `Thread.ofVirtual().factory()`

#### Scenario: synchronized 替换
- **WHEN** 虚拟线程执行路径中存在 `synchronized` 块
- **THEN** 替换为 `ReentrantLock` 以避免 pinning 问题

#### Scenario: AbstractQueue 守护线程迁移
- **WHEN** `AbstractQueue` 使用 `new Thread()` 创建守护线程
- **THEN** 替换为虚拟线程 `Thread.ofVirtual().name(...).start()`

#### Scenario: ForkJoinPool 保留
- **WHEN** 代码使用 `ForkJoinPool` 进行 CPU 密集型并行计算
- **THEN** 保留 `ForkJoinPool`，不替换为虚拟线程（虚拟线程适用于 I/O 密集型场景）

### Requirement: Stream Gatherers 重构
系统 SHALL 将复杂的、无法用标准 Stream API 表达的集合处理逻辑重构为基于 `Gatherers` 的流操作。

#### Scenario: 自定义分组/窗口操作
- **WHEN** 代码中存在手动循环实现的分组、滑动窗口等中间操作
- **THEN** 使用 `Gatherers.windowFixed()`、`Gatherers.fold()` 等内置 Gatherer 替代

#### Scenario: 并行流中间操作
- **WHEN** 代码中存在需要自定义中间操作的并行流处理
- **THEN** 使用自定义 `Gatherer` 接口实现，提升可读性与性能

### Requirement: 字符串模板重构
系统 SHALL 将 SQL 拼接、日志拼接等操作重构为字符串模板（`STR."..."`），利用编译期自动转义机制防范注入风险。

#### Scenario: SQL 拼接安全化
- **WHEN** 代码使用字符串拼接构建 SQL/JPQL 语句
- **THEN** 使用 `STR."SELECT ... FROM \{tableName} WHERE \{column} = ?"` 格式，变量自动转义

#### Scenario: 日志拼接模板化
- **WHEN** 代码使用字符串拼接构建日志消息
- **THEN** 使用 `STR."..."` 模板替代

#### Scenario: 参数化查询保留
- **WHEN** SQL 语句已使用参数化查询（`?` 占位符 + `setParameter`）
- **THEN** 保留参数化查询机制不变，仅用字符串模板改善动态表名/列名拼接部分

### Requirement: Switch 模式匹配重构
系统 SHALL 使用 Switch 模式匹配替代 `if-instanceof-cast` 模式，消除强制转换异常风险。

#### Scenario: Activity 类型判断
- **WHEN** 代码中存在 14 个连续 `if-instanceof` 判断 Activity 类型
- **THEN** 重构为 `switch (this) { case Agent a -> ...; case Begin b -> ...; }` 模式

#### Scenario: 响应类型分发
- **WHEN** `ResponseFactory` 中使用 `instanceof` 判断响应数据类型
- **THEN** 重构为 Switch 模式匹配

#### Scenario: 基本类型模式匹配
- **WHEN** Switch 中匹配基本类型（int, double, float, boolean 等）
- **THEN** 使用基本类型模式匹配，消除装箱拆箱开销

### Requirement: 密封类重构
系统 SHALL 使用 `sealed class/interface` 严格限定领域模型的继承树，防止外部恶意扩展。

#### Scenario: Activity 继承树密封
- **WHEN** `Activity` 类有 14 个已知子类（Agent, Begin, Cancel, Choice 等）
- **THEN** 将 `Activity` 声明为 `sealed interface`，`permits` 列出所有子类，子类声明为 `final` 或 `non-sealed`

#### Scenario: Wo 响应类型密封
- **WHEN** `WoFile`, `WoText`, `WoContentType` 等响应类型继承自同一基类
- **THEN** 将基类声明为 `sealed interface`，限定已知子类型

### Requirement: 结构化并发重构
系统 SHALL 对多子任务并发且需保证一致性的场景，使用 `StructuredTaskScope` 重构，确保子任务生命周期强绑定。

#### Scenario: 多数据源并发查询
- **WHEN** 业务逻辑需要并发查询多个数据源并汇总结果
- **THEN** 使用 `StructuredTaskScope.ShutdownOnFailure()` 确保任一失败时取消全部子任务

#### Scenario: 子任务超时控制
- **WHEN** 并发子任务需要超时控制
- **THEN** 使用 `StructuredTaskScope` 配合 `joinUntil(deadline)` 实现超时取消

### Requirement: 作用域值重构
系统 SHALL 将 `ThreadLocal` 上下文传递重构为 `Scoped Values`，适配虚拟线程，避免内存泄漏和状态串用。

#### Scenario: ThreadLocal 迁移
- **WHEN** 代码使用 `ThreadLocal` 存储请求上下文（如 `ServerRequestLog` 中的 `StringBuilder`）
- **THEN** 替换为 `ScopedValue.newInstance()`，通过 `ScopedValue.where(boundVar, value).run(() -> {...})` 传递

#### Scenario: EffectivePerson 上下文传递
- **WHEN** `EffectivePerson` 等请求上下文通过方法参数层层传递
- **THEN** 使用 `ScopedValue` 隐式传递，减少方法签名污染

### Requirement: Record 不可变对象重构
系统 SHALL 将 DTO/VO 重构为 `Record`，杜绝并发修改异常。

#### Scenario: Wo/Wi DTO 重构
- **WHEN** 现有 Wo（输出 DTO）和 Wi（输入 DTO）类为可变 POJO
- **THEN** 重构为 `record` 类型，字段名与原 DTO 完全一致

#### Scenario: JSON 序列化兼容
- **WHEN** Record 类被 Gson/Jackson 序列化/反序列化
- **THEN** JSON 字段名与原 DTO 完全一致，前端无感知

#### Scenario: WrapCopier 兼容
- **WHEN** `WrapCopierFactory` 进行 Entity ↔ Record 转换
- **THEN** 转换逻辑正常工作，字段映射正确

### Requirement: 废弃 API 修复
系统 SHALL 修复所有已废弃 API 的调用。

#### Scenario: Class.newInstance 替换
- **WHEN** 代码使用 `Class.newInstance()`（Java 9 起废弃，共 58 处）
- **THEN** 替换为 `cls.getDeclaredConstructor().newInstance()`

#### Scenario: 内部 API 访问
- **WHEN** 代码使用 `com.sun.*` 内部 API
- **THEN** 替换为公共 API 或使用 `--add-opens` JVM 参数显式声明

### Requirement: API 契约绝对兼容
系统 SHALL 保证对外暴露的 API 接口契约 100% 兼容，前端代码无需任何改动。

#### Scenario: API 路径不变
- **WHEN** 前端调用原有 API 路径（如 `/jaxrs/table/list`）
- **THEN** 后端响应路径、HTTP 方法、请求/响应格式完全不变

#### Scenario: 响应字段不变
- **WHEN** Record 重构后的 DTO 被 JSON 序列化
- **THEN** 字段名、字段类型、嵌套结构与原 DTO 完全一致

#### Scenario: HTTP 状态码不变
- **WHEN** 前端收到 API 响应
- **THEN** HTTP 状态码与原实现完全一致

---

## MODIFIED Requirements

### Requirement: Maven 构建配置
Maven 编译目标从 Java 11 升级到 Java 25，所有依赖版本同步升级到 Jakarta EE 兼容版本。`maven-compiler-plugin` 的 `<source>` 和 `<target>` 设置为 `25`。

### Requirement: 线程模型
系统线程模型从平台线程池切换为虚拟线程。I/O 密集型任务使用虚拟线程，CPU 密集型任务保留 `ForkJoinPool`。`synchronized` 块在虚拟线程路径中替换为 `ReentrantLock`。

### Requirement: JPA 实体基类
`JpaObject` 等 JPA 实体基类保持可变（JPA 规范要求），不强制重构为 Record。但纯数据传输对象（DTO/VO/Wo/Wi）应重构为 Record。

---

## REMOVED Requirements

### Requirement: javaee-api 8.0.1 依赖
**Reason**: Java 25 不支持 Java EE 8 命名空间，必须迁移到 Jakarta EE 10+
**Migration**: 替换为 `jakartaee-api` 10.x，所有 `javax.*` import 替换为 `jakarta.*`

### Requirement: H2 1.4.200 数据库
**Reason**: H2 1.4.200 不兼容 Java 25，必须升级到 H2 2.x
**Migration**: 升级到 H2 2.x，注意 SQL 语法差异（如 `SET PASSWORD` 语法变化）
