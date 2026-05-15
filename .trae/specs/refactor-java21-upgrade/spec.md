# O2Server Java 21 深度重构 Spec

## Why
当前 O2Server 项目基于 Java 11 构建，存在大量 `if-instanceof-cast` 模式、JPQL 字符串拼接、传统线程池阻塞式并发、可变 DTO 对象等 Java 11 时代代码特征。升级至 Java 21 并充分利用虚拟线程、Switch 模式匹配、密封类、Record、结构化并发等新特性，可显著提升系统的并发吞吐量、类型安全性和运行稳定性。

## What Changes
- **构建系统升级**：Maven 编译目标从 Java 11 升级至 Java 21，启用 `--enable-preview` 支持预览特性
- **虚拟线程重构**：将传统 `ExecutorService`/`ThreadPoolExecutor`/`new Thread()` 替换为虚拟线程，实现 thread-per-request
- **Switch 模式匹配**：将所有 `if-instanceof-cast` 链重构为 `switch` 类型模式匹配
- **密封类**：对领域模型基类（如 `Activity`、`Wo` 响应类型）使用 `sealed interface/class`
- **Record 不可变对象**：将 DTO/VO 数据载体类重构为 `Record`，保证 JSON 序列化兼容
- **字符串模板 [Preview]**：将 JPQL/SQL 拼接重构为字符串模板，防范注入
- **结构化并发 [Preview]**：将多子任务并发场景重构为 `StructuredTaskScope`
- **作用域值 [Preview]**：将 `ThreadLocal` 上下文传递重构为 `Scoped Values`
- **Generational ZGC**：启动脚本中推荐使用 `-XX:+UseZGC -XX:+ZGenerational`
- **API 契约不变**：所有 JAX-RS Controller 的路径、HTTP 方法、请求/响应 DTO 字段保持 100% 兼容

## Impact
- Affected specs: 全部 56 个 Maven 模块
- Affected code:
  - `x_base_core_project` — 核心基础设施（线程池工厂、队列、JAX-RS 基类、异常体系、工具类）
  - 所有 `*_core_entity` 模块 — 实体/DTO/VO 类
  - 所有 `*_assemble_control` / `*_service_processing` 模块 — Controller、业务逻辑、线程池使用
  - `x_console` — 启动入口、JVM 参数
  - 各模块 `ThisApplication` — 线程池初始化

---

## ADDED Requirements

### Requirement: 构建系统升级至 Java 21
系统 SHALL 将 Maven 编译目标升级为 Java 21，并在 `maven-compiler-plugin` 中配置 `--enable-preview`，在 `maven-surefire-plugin` 中配置 `--enable-preview`，以支持字符串模板、结构化并发、作用域值等预览特性。

#### Scenario: 构建成功
- **WHEN** 执行 `mvn clean compile`
- **THEN** 所有模块在 Java 21 下编译通过，预览特性可用

#### Scenario: 测试通过
- **WHEN** 执行 `mvn test`
- **THEN** 所有测试在 Java 21 下运行通过

---

### Requirement: 虚拟线程替换传统线程池
系统 SHALL 将以下场景中的传统线程替换为虚拟线程：
1. `ProcessPlatformKeyClassifyExecutorFactory` 中的 `Executors.newFixedThreadPool()` → `Executors.newVirtualThreadPerTaskExecutor()`
2. 各模块 `ThisApplication` 中初始化的 `ExecutorService` → 虚拟线程执行器
3. `AbstractQueue` 中守护线程消费循环 → `Thread.startVirtualThread()`
4. 直接 `new Thread().start()` 调用 → `Thread.startVirtualThread()`
5. JAX-RS `@Suspended AsyncResponse` 的异步处理 → 虚拟线程 thread-per-request

#### Scenario: 高并发 I/O 场景吞吐量提升
- **WHEN** 系统处理大量阻塞式 I/O 请求（数据库查询、网络调用）
- **THEN** 虚拟线程自动挂起/恢复，不占用平台线程，吞吐量显著提升

#### Scenario: 线程创建开销降低
- **WHEN** 系统创建新线程处理请求
- **THEN** 虚拟线程的创建和调度开销远低于平台线程

---

### Requirement: Switch 模式匹配替代 if-instanceof-cast
系统 SHALL 将所有 `if (x instanceof T) { T t = (T) x; ... }` 模式重构为 `switch` 类型模式匹配 `case T t -> ...`，消除手动强制类型转换。

重点重构目标：
1. `ResponseFactory.java` 中的 `WoFile`/`WoText`/`WoContentType` 类型判断链
2. `Activity.java` 中的 `Agent`/`Begin`/`Cancel`/`Choice`/`Delay` 等子类型判断链
3. `MapTools.java` 中的 `CharSequence`/`Iterable` 类型判断
4. `Plan.java` 中的 `Integer`/`Double`/`Float`/`Boolean`/`Date` 类型判断
5. 其他模块中所有类似的 `if-instanceof-cast` 模式

#### Scenario: 类型安全增强
- **WHEN** 代码执行类型判断和转换
- **THEN** 编译器保证类型安全，消除 `ClassCastException` 风险

---

### Requirement: 密封类限制继承
系统 SHALL 对以下类型的层次结构使用 `sealed interface/class` + `permits` 声明：
1. 流程活动类型：`Activity` → `sealed` permits `Agent, Begin, Cancel, Choice, Delay, Embed, End, Invoke, Manual, Merge, Parallel, Service, Split`
2. JAX-RS 响应包装类型：`WoFile, WoText, WoContentType` 等实现 `sealed interface WoResponse`
3. 领域模型中限定扩展的抽象基类

#### Scenario: 防止非法继承
- **WHEN** 外部代码尝试继承密封类
- **THEN** 编译器拒绝编译，防止业务逻辑被恶意扩展破坏

---

### Requirement: Record 不可变对象重构
系统 SHALL 将 DTO/VO 数据载体类重构为 `Record`，条件为：
1. 类仅包含字段 + getter/setter + 构造器，无复杂业务逻辑
2. 类不需要 JPA 实体注解（JPA 实体暂不重构为 Record）
3. 重构后 JSON 序列化/反序列化的字段名必须与原类完全一致

重点重构目标：
1. `x_base_core_project/jaxrs/` 下的简单包装类：`WrapBoolean`, `WoId`, `WrapString`, `WrapCount` 等
2. 各模块 Action 内部类中的 `Wo`/`Wi` 类（仅含字段和 `WrapCopier` 的简单类）
3. `GsonPropertyObject` 的简单子类

#### Scenario: JSON 序列化兼容
- **WHEN** Record 类被 Gson 序列化
- **THEN** 输出的 JSON 字段名与原 DTO 类完全一致

#### Scenario: 并发安全
- **WHEN** 多线程同时读取 Record 对象
- **THEN** Record 的不可变性保证无并发修改异常

---

### Requirement: 字符串模板防范注入 [Preview]
系统 SHALL 将 JPQL/SQL 字符串拼接重构为 Java 21 字符串模板（`STR` 或自定义模板处理器），利用模板处理器的自动转义机制防范注入。

重点重构目标：
1. `x_query_assemble_surface` 中动态表查询的 JPQL 拼接
2. 其他模块中的 JPQL/SQL 拼接场景
3. 日志消息拼接中涉及外部输入的场景

#### Scenario: SQL 注入防护
- **WHEN** 外部输入通过字符串模板嵌入 SQL/JPQL
- **THEN** 模板处理器自动转义特殊字符，防止注入攻击

---

### Requirement: 结构化并发 [Preview]
系统 SHALL 对存在多个子任务并发执行且需保证一致性的场景，使用 `StructuredTaskScope` 重构：
1. 并行调用多个外部接口后聚合结果的场景
2. 流程处理中并行执行多个服务调用的场景

#### Scenario: 子任务生命周期绑定
- **WHEN** 父任务因异常或超时取消
- **THEN** 所有子任务自动取消，无线程泄漏

#### Scenario: 子任务异常传播
- **WHEN** 任一子任务抛出异常
- **THEN** 异常通过 `StructuredTaskScope` 正确传播至父任务

---

### Requirement: 作用域值替代 ThreadLocal [Preview]
系统 SHALL 将 `ThreadLocal` 上下文传递重构为 `Scoped Values`：
1. `ServerRequestLog` 中的 `ThreadLocal<StringBuilder>` → `ScopedValue`
2. 如需传递用户上下文（`EffectivePerson`）、链路追踪 ID 等场景，使用 `ScopedValue` 替代 `ThreadLocal`

#### Scenario: 虚拟线程间无状态串用
- **WHEN** 虚拟线程被复用
- **THEN** `ScopedValue` 保证上下文不会在线程间串用，无内存泄漏

---

### Requirement: Generational ZGC 启动参数
系统 SHALL 在所有启动脚本（`start_*.sh`, `start_windows.bat`）中推荐使用 Generational ZGC 参数 `-XX:+UseZGC -XX:+ZGenerational`，替代原有的 GC 配置。

#### Scenario: GC 停顿降低
- **WHEN** 应用在大堆内存下运行
- **THEN** Generational ZGC 显著降低 GC 停顿时间

---

### Requirement: API 契约绝对兼容
系统 SHALL 保证所有 JAX-RS Controller 层的 API 路径、HTTP 方法、请求参数、响应 DTO 字段名和结构在重构前后完全一致。

#### Scenario: 前端无感知升级
- **WHEN** 前端代码不做任何修改
- **THEN** 所有 API 调用行为与 Java 11 版本完全一致

#### Scenario: Record DTO 的 JSON 兼容
- **WHEN** 原 DTO 类被重构为 Record
- **THEN** Gson 序列化后的 JSON 字段名与原 DTO 完全一致（通过 `@SerializedName` 或 Record 组件名保证）

---

## MODIFIED Requirements

### Requirement: Maven 编译配置
原配置：
```xml
<maven.compiler.source>11</maven.compiler.source>
<maven.compiler.target>11</maven.compiler.target>
```
修改为：
```xml
<maven.compiler.source>21</maven.compiler.source>
<maven.compiler.target>21</maven.compiler.target>
<maven.compiler.release>21</maven.compiler.release>
```
并在 `maven-compiler-plugin` 和 `maven-surefire-plugin` 中添加 `--enable-preview` 编译/运行参数。

### Requirement: 依赖版本兼容性
以下依赖需验证或升级至 Java 21 兼容版本：
- Jetty 9.4.x → 需验证 Java 21 兼容性，必要时升级至 Jetty 12.x
- OpenJPA 3.2.2 → 需验证 Java 21 兼容性
- Jersey 2.45 → 需验证 Java 21 兼容性
- Druid 1.2.8 → 升级至支持 Java 21 的版本
- 其他依赖按需升级

---

## REMOVED Requirements

### Requirement: 传统线程池创建模式
**Reason**: 虚拟线程提供更轻量级的并发模型，传统 `Executors.newFixedThreadPool()`、`Executors.newCachedThreadPool()` 等模式在 I/O 密集型场景下效率低下。
**Migration**: 替换为 `Executors.newVirtualThreadPerTaskExecutor()` 或 `Thread.startVirtualThread()`，保留按 key 分类的逻辑但底层使用虚拟线程。

### Requirement: if-instanceof-cast 手动类型转换
**Reason**: Switch 模式匹配在编译期保证类型安全，消除手动强制类型转换的 `ClassCastException` 风险。
**Migration**: 重构为 `switch (obj) { case T t -> ... }` 模式。
