# Tasks

## 阶段一：基础设施与依赖升级

- [x] Task 1: 升级 Maven 编译目标到 Java 25
  - [x] 1.1: 修改根 `pom.xml` 中 `maven.compiler.source` 和 `maven.compiler.target` 为 `25`
  - [x] 1.2: 更新 `maven-compiler-plugin` 版本到支持 Java 25 的版本
  - [x] 1.3: 验证所有 55 个模块编译配置一致

- [x] Task 2: 升级核心依赖到 Jakarta EE 兼容版本
  - [x] 2.1: 将 `javaee-api` 8.0.1 替换为 `jakartaee-api` 11.0.0
  - [x] 2.2: 升级 Jersey 2.45 → 4.0.0-M2
  - [x] 2.3: 升级 Jetty 9.4.58 → 12.0.22
  - [x] 2.4: 升级 OpenJPA 3.2.2 → 4.0.1
  - [x] 2.5: 升级 H2 1.4.200 → 2.3.232
  - [x] 2.6: 升级 CXF 3.6.9 → 4.1.1
  - [x] 2.7: 升级 Swagger 2.2.25 → 2.2.30
  - [x] 2.8: 升级 javax.mail→jakarta.mail, javax.activation→jakarta.activation, javax.cache→jakarta.cache
  - [x] 2.9: 升级 Gson 2.8.9→2.12.1, Log4j2 2.17.2→2.24.3, SLF4J 1.7.32→2.0.17, Jedis 3.3.0→5.2.0, Druid 1.2.8→1.2.24, GraalVM 22.3.4→24.2.1

- [x] Task 3: javax → jakarta 命名空间批量迁移
  - [x] 3.1: `javax.ws.rs.*` → `jakarta.ws.rs.*`（421 文件）
  - [x] 3.2: `javax.persistence.*` → `jakarta.persistence.*`（1080 文件）
  - [x] 3.3: `javax.servlet.*` → `jakarta.servlet.*`（1193 文件）
  - [x] 3.4: `javax.xml.ws/bind.*` → `jakarta.xml.ws/bind.*`（5 文件）
  - [x] 3.5: `javax.mail.*` → `jakarta.mail.*`（1 文件）
  - [x] 3.6: `javax.activation.*` → `jakarta.activation.*`（4 文件）
  - [x] 3.7: `javax.jms/validation/websocket.*` → `jakarta.*`（额外迁移）
  - [x] 3.8: 验证无残留 `javax.*` 引用（除 JDK 内置包）

## 阶段二：废弃 API 修复

- [x] Task 4: 修复 `Class.newInstance()` 废弃调用
  - [x] 4.1: 全局搜索并替换（18 处，15 文件）
  - [x] 4.2: EntityManagerContainer.java 已使用 getDeclaredConstructor()，无需修改
  - [x] 4.3: WrapCopier.java 已使用 getConstructor()，无需修改
  - [x] 4.4: 异常声明已兼容（所有方法均声明 throws Exception）

- [x] Task 5: 修复 `com.sun.*` 内部 API 访问
  - [x] 5.1: OperatingSystem.java — 使用 instanceof 模式匹配安全检查 com.sun.management.OperatingSystemMXBean
  - [x] 5.2: LdapTools.java — 字符串常量，属于公共 API，无需修改

## 阶段三：性能优化 — 虚拟线程

- [x] Task 6: 重构线程池工厂为虚拟线程
  - [x] 6.1: ProcessPlatformKeyClassifyExecutorFactory — 使用虚拟线程执行器
  - [x] 6.2: AbstractQueue — Thread.ofVirtual().name(...).unstarted(...)
  - [x] 6.3: ThisApplication — 保留 ForkJoinPool（CPU 密集型），I/O 密集型改用虚拟线程
  - [x] 6.4: 其他线程池 — 替换为虚拟线程（20 个文件）
  - [x] 6.5: synchronized → ReentrantLock（避免 pinning）

- [x] Task 7: 重构结构化并发场景
  - [x] 7.1: 识别 27 个多任务并发场景
  - [x] 7.2: 使用 StructuredTaskScope.ShutdownOnFailure() 重构
  - [x] 7.3: 使用 joinUntil(Instant) 添加超时控制
  - [x] 7.4: 覆盖 5 个模块（processplatform, portal, cms, console, query）

## 阶段四：性能优化 — Stream Gatherers

- [x] Task 8: 重构复杂集合处理为 Stream Gatherers
  - [x] 8.1: ListTools.batch() → Gatherers.windowFixed()
  - [x] 8.2: ListTools.trim() → Gatherers.fold()
  - [x] 8.3: NaturalLanguageProcessing.word() → Gatherers.fold()
  - [x] 8.4: 新建 ProjectGatherers.java — distinctWithNullFilter(), distinctByKey()

## 阶段五：安全性增强

- [x] Task 9: 重构 SQL/日志拼接为字符串模板
  - [x] 9.1: StandardJaxrsAction.java — 7 个方法 JPQL 拼接全部重构
  - [x] 9.2: MissionSetSecret.java — ALTER USER 拼接重构
  - [x] 9.3: JdbcConsumeQueue.java — INSERT 拼接重构
  - [x] 9.4: 全局 14+ 文件 SQL 拼接重构
  - [x] 9.5: 全局 35+ 文件日志拼接重构

- [x] Task 10: 重构 if-instanceof 为 Switch 模式匹配
  - [x] 10.1: Activity.getActivityType() — 14 个 instanceof → switch 表达式
  - [x] 10.2: Plan.java — 6 个类型判断 → switch 表达式
  - [x] 10.3: ResponseFactory.java — 4 处 Wo 类型分发 → switch 表达式
  - [x] 10.4: 全局 8+ 个额外文件 instanceof 重构
  - [x] 10.5: 使用 when 守卫和 _ 无名模式

- [x] Task 11: 重构领域模型为密封类
  - [x] 11.1: Activity → sealed abstract class permits 14 个子类
  - [x] 11.2: 14 个 Activity 子类 → non-sealed class（因有 Wrap 继承）
  - [x] 11.3: Wo 响应类型体系 — 不适合 sealed（子类分散在 20+ 模块）
  - [x] 11.4: Tuple 层次结构 — 8 个 sealed abstract class + 8 个 final Immutable 类

## 阶段六：稳定性提升

- [x] Task 12: 重构 ThreadLocal 为 Scoped Values
  - [x] 12.1: ServerRequestLog._buffers → ScopedValue<StringBuilder>
  - [x] 12.2: EffectivePerson — 新增 ScopedValue 隐式传递 + 8 个 JAX-RS 过滤器绑定
  - [x] 12.3: 向后兼容 — AbstractJaxrsAction.effectivePerson() 保留 request attribute 回退

- [x] Task 13: 重构 DTO/VO 为 Record
  - [x] 13.1: 识别 19 个纯数据 DTO 适合重构
  - [x] 13.2: 19 个 DTO 重构为 record（WoTemporaryRedirect, WoContentType, WrapBoolean 等）
  - [x] 13.3: Gson 序列化兼容 — 字段名完全一致
  - [x] 13.4: WrapCopier 兼容 — 不影响（Record DTO 未被 WrapCopier 使用）
  - [x] 13.5: JPA 实体类保持可变 — 未重构
  - [x] 13.6: 新建 GsonRecord 接口替代 GsonPropertyObject

## 阶段七：验证与回归

- [ ] Task 14: 全量编译验证
  - [ ] 14.1: 执行 `mvn clean compile` 确保全量编译通过
  - [ ] 14.2: 检查无 `javax.*` 残留引用（除 JDK 内置包）
  - [ ] 14.3: 检查无废弃 API 调用

- [ ] Task 15: API 契约兼容性验证
  - [ ] 15.1: 对比重构前后 API 响应 JSON 结构
  - [ ] 15.2: 验证所有 API 路径、HTTP 方法不变
  - [ ] 15.3: 验证 HTTP 状态码不变
  - [ ] 15.4: 验证 Record 序列化字段名与原 DTO 一致

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 3]
- [Task 6] depends on [Task 3]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 3]
- [Task 9] depends on [Task 3]
- [Task 10] depends on [Task 3]
- [Task 11] depends on [Task 3]
- [Task 12] depends on [Task 6]
- [Task 13] depends on [Task 3]
- [Task 14] depends on [Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12, Task 13]
- [Task 15] depends on [Task 14]

# Parallelizable Work
- Task 6 ∥ Task 8 ∥ Task 9 ∥ Task 10 ∥ Task 11 ∥ Task 13 (after Task 3)
- Task 7 after Task 6
- Task 12 after Task 6
