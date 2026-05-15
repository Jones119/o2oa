# Tasks

## 阶段一：构建系统升级与基础验证

- [ ] Task 1: 升级 Maven 编译配置至 Java 21
  - [ ] SubTask 1.1: 修改根 `pom.xml` 中 `maven.compiler.source`/`maven.compiler.target` 为 21，添加 `maven.compiler.release=21`
  - [ ] SubTask 1.2: 在 `maven-compiler-plugin` 配置中添加 `--enable-preview` 编译参数
  - [ ] SubTask 1.3: 在 `maven-surefire-plugin` 配置中添加 `--enable-preview` 运行参数
  - [ ] SubTask 1.4: 验证并升级不兼容 Java 21 的依赖版本（Jetty、OpenJPA、Jersey、Druid 等）
  - [ ] SubTask 1.5: 执行 `mvn clean compile` 确认所有模块编译通过

- [ ] Task 2: 更新启动脚本 JVM 参数
  - [ ] SubTask 2.1: 在所有 `start_*.sh` 脚本中添加 `-XX:+UseZGC -XX:+ZGenerational` GC 参数
  - [ ] SubTask 2.2: 在 `start_windows.bat` 中添加对应 GC 参数
  - [ ] SubTask 2.3: 在启动脚本中添加 `--enable-preview` 参数（支持预览特性运行时）
  - [ ] SubTask 2.4: 添加 `-XX:+ShowCodeDetailsInExceptionMessages` 参数（JDK 14+ 默认开启，显式声明）

## 阶段二：核心基础设施重构（x_base_core_project）

- [ ] Task 3: 重构 ResponseFactory — Switch 模式匹配
  - [ ] SubTask 3.1: 将 `ResponseFactory.java` 中 `if-instanceof` 链（WoFile/WoText/WoContentType 等）重构为 `switch` 类型模式匹配
  - [ ] SubTask 3.2: 验证重构后所有响应类型的处理逻辑不变

- [ ] Task 4: 重构简单 DTO/VO 为 Record
  - [ ] SubTask 4.1: 将 `WrapBoolean` 重构为 Record，验证 Gson 序列化兼容
  - [ ] SubTask 4.2: 将 `WoId` 重构为 Record，验证 Gson 序列化兼容
  - [ ] SubTask 4.3: 将 `WrapString` 重构为 Record，验证 Gson 序列化兼容
  - [ ] SubTask 4.4: 将 `WrapCount` 重构为 Record，验证 Gson 序列化兼容
  - [ ] SubTask 4.5: 编写 Gson Record 序列化/反序列化兼容性测试，确认字段名一致

- [ ] Task 5: 重构 MapTools — Switch 模式匹配
  - [ ] SubTask 5.1: 将 `MapTools.java` 中 `if-instanceof-cast` 模式重构为 `switch` 类型模式匹配

- [ ] Task 6: 重构 AbstractQueue — 虚拟线程
  - [ ] SubTask 6.1: 将 `AbstractQueue.java` 中守护线程消费循环重构为 `Thread.startVirtualThread()`
  - [ ] SubTask 6.2: 验证队列消费逻辑不变

- [ ] Task 7: 重构 ServerRequestLog — 作用域值
  - [ ] SubTask 7.1: 将 `ServerRequestLog.java` 中 `ThreadLocal<StringBuilder>` 重构为 `ScopedValue<StringBuilder>`
  - [ ] SubTask 7.2: 验证请求日志功能不变

- [ ] Task 8: 定义密封接口 — JAX-RS 响应类型
  - [ ] SubTask 8.1: 创建 `sealed interface WoResponse permits WoFile, WoText, WoContentType`（或根据实际类层次调整）
  - [ ] SubTask 8.2: 让 `WoFile`、`WoText`、`WoContentType` 实现 `WoResponse` 密封接口
  - [ ] SubTask 8.3: 更新 `ResponseFactory` 中的 switch 模式匹配使用密封接口

## 阶段三：流程平台核心重构（x_processplatform）

- [ ] Task 9: 重构 Activity 类层次 — 密封类 + Switch 模式匹配
  - [ ] SubTask 9.1: 将 `Activity` 声明为 `sealed abstract class` permits 所有子类（Agent, Begin, Cancel, Choice, Delay, Embed, End, Invoke, Manual, Merge, Parallel, Service, Split）
  - [ ] SubTask 9.2: 将 `Activity.java` 中 `if-instanceof` 链重构为 `switch` 类型模式匹配
  - [ ] SubTask 9.3: 验证流程引擎的活动类型分发逻辑不变

- [ ] Task 10: 重构 ProcessPlatformKeyClassifyExecutorFactory — 虚拟线程
  - [ ] SubTask 10.1: 将 `Executors.newFixedThreadPool(1, threadFactory)` 替换为虚拟线程执行器，保留按 key 分类的逻辑
  - [ ] SubTask 10.2: 验证按 key 串行执行的语义不变（同一 key 的任务仍需串行执行）

- [ ] Task 11: 重构 ThisApplication 线程池 — 虚拟线程
  - [ ] SubTask 11.1: 重构 `x_processplatform_service_processing/ThisApplication.java` 中的 ExecutorService 初始化
  - [ ] SubTask 11.2: 重构其他模块 `ThisApplication.java` 中的 ExecutorService 初始化（x_program_center 等）

## 阶段四：查询模块 SQL 注入防护（x_query）

- [ ] Task 12: 重构 JPQL 字符串拼接 — 字符串模板
  - [ ] SubTask 12.1: 创建自定义 `JPQL` 模板处理器，实现自动参数化转义
  - [ ] SubTask 12.2: 重构 `ActionListRowSelectWhere.java` 中的 JPQL 拼接为字符串模板
  - [ ] SubTask 12.3: 重构 `ActionListRowNext.java` 中的 JPQL 拼接
  - [ ] SubTask 12.4: 重构 `ActionRowCountWhere.java` 中的 JPQL 拼接
  - [ ] SubTask 12.5: 重构 `ActionRowDeleteAll.java` 中的 JPQL 拼接
  - [ ] SubTask 12.6: 扫描并重构其他模块中的 JPQL/SQL 拼接场景

- [ ] Task 13: 重构 Plan.java — Switch 模式匹配
  - [ ] SubTask 13.1: 将 `Plan.java` 中 `if-instanceof-cast` 类型判断链重构为 `switch` 类型模式匹配

## 阶段五：全局模式扫描与重构

- [ ] Task 14: 全局扫描并重构 if-instanceof-cast 模式
  - [ ] SubTask 14.1: 扫描所有模块中的 `instanceof` 使用，识别可重构为 switch 模式匹配的场景
  - [ ] SubTask 14.2: 逐模块重构识别出的 if-instanceof-cast 模式

- [ ] Task 15: 全局扫描并重构简单 DTO 为 Record
  - [ ] SubTask 15.1: 扫描所有 `*_core_entity` 模块中的简单 DTO/VO 类（仅含字段+getter/setter 的类）
  - [ ] SubTask 15.2: 逐模块将符合条件的 DTO/VO 重构为 Record，确保 Gson 序列化兼容
  - [ ] SubTask 15.3: 对不适合重构为 Record 的类（JPA 实体、有复杂逻辑的类）保留原样

- [ ] Task 16: 全局扫描并重构线程池为虚拟线程
  - [ ] SubTask 16.1: 扫描所有模块中的 `ExecutorService`/`ThreadPoolExecutor`/`new Thread()` 使用
  - [ ] SubTask 16.2: 逐模块将阻塞式 I/O 线程池替换为虚拟线程执行器

- [ ] Task 17: 识别并重构结构化并发场景
  - [ ] SubTask 17.1: 扫描业务逻辑中并行调用多个外部接口/服务的场景
  - [ ] SubTask 17.2: 使用 `StructuredTaskScope` 重构识别出的并行调用场景

- [ ] Task 18: 识别并重构 ThreadLocal 为 ScopedValue
  - [ ] SubTask 18.1: 扫描所有模块中的 `ThreadLocal` 使用
  - [ ] SubTask 18.2: 将上下文传递类 ThreadLocal 重构为 `ScopedValue`

## 阶段六：集成验证

- [ ] Task 19: API 契约兼容性验证
  - [ ] SubTask 19.1: 对比重构前后所有 JAX-RS Controller 的 API 路径、HTTP 方法
  - [ ] SubTask 19.2: 对比重构前后关键 API 的请求/响应 JSON 结构
  - [ ] SubTask 19.3: 验证 Record DTO 的 Gson 序列化输出与原 DTO 完全一致

- [ ] Task 20: 全量编译与测试
  - [ ] SubTask 20.1: 执行 `mvn clean compile` 确认所有模块编译通过
  - [ ] SubTask 20.2: 执行 `mvn test` 确认所有测试通过
  - [ ] SubTask 20.3: 修复编译或测试中发现的问题

# Task Dependencies
- Task 1 是所有后续 Task 的前置依赖（必须先升级 Java 21 编译配置）
- Task 2 独立于代码重构，可与 Task 3-18 并行
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1（需要 Java 21 编译环境）
- Task 8 依赖 Task 3（密封接口定义后更新 ResponseFactory 的 switch）
- Task 9 依赖 Task 1
- Task 10, 11 依赖 Task 1
- Task 12 依赖 Task 1（字符串模板为预览特性）
- Task 14-18 依赖 Task 1，且建议在 Task 3-13 完成后执行（避免重复工作）
- Task 19, 20 依赖所有代码重构 Task 完成
