# Tasks

## 阶段一：Gatherers 回退为传统 Stream API

- [ ] Task 1: 删除 ProjectGatherers.java 并将功能迁移到 ListTools
  - [ ] 1.1: 在 ListTools 中添加 `distinctByKey()` 静态方法（使用 `Collectors.toMap()` 实现）
  - [ ] 1.2: 在 ListTools 中添加 `distinctWithNullFilter()` 静态方法（使用 filter + distinct 实现）
  - [ ] 1.3: 删除 `ProjectGatherers.java` 文件
  - [ ] 1.4: 更新 ListTools 中 `extractProperty()` 和 `extractField()` 方法，移除 `ProjectGatherers` 引用，改用 ListTools 自身的静态方法

- [ ] Task 2: 回退 ListTools.java 中的 Gatherers 用法
  - [ ] 2.1: `trim()` 方法 — `Gatherers.fold()` 回退为 `Collectors.toCollection()` + 手动去重
  - [ ] 2.2: `batch()` 方法 — `Gatherers.windowFixed()` 回退为传统 `subList()` 循环分批
  - [ ] 2.3: 移除 `import java.util.stream.Gatherers`

- [ ] Task 3: 回退 EntityManagerContainerTools.java 中的 Gatherers 用法
  - [ ] 3.1: `batchDelete()` 方法 — `Gatherers.windowFixed()` 回退为传统 `subList()` 循环分批
  - [ ] 3.2: 移除 `import java.util.stream.Gatherers`

- [ ] Task 4: 回退 NaturalLanguageProcessing.java 中的 Gatherers 用法
  - [ ] 4.1: `word()` 方法 — `Gatherers.fold()` 回退为 `Collectors.collectingAndThen()` 或手动循环
  - [ ] 4.2: 移除 `import java.util.stream.Gatherers`

- [ ] Task 5: 回退 LanguageProcessingHelper.java 中的 Gatherers 用法
  - [ ] 5.1: `word()` 方法 — `Gatherers.fold()` 回退为与 NaturalLanguageProcessing 相同的策略
  - [ ] 5.2: 移除 `import java.util.stream.Gatherers`

## 阶段二：ScopedValue 回退为 ThreadLocal

- [ ] Task 6: 回退 EffectivePerson.SCOPED 从 ScopedValue 到 ThreadLocal
  - [ ] 6.1: 将 `ScopedValue<EffectivePerson> SCOPED` 替换为 `ThreadLocal<EffectivePerson> SCOPED = new ThreadLocal<>()`
  - [ ] 6.2: 移除 `import java.lang.ScopedValue`

- [ ] Task 7: 回退所有 JaxrsFilter 中的 ScopedValue.where() 调用
  - [ ] 7.1: UserJaxrsFilter — `ScopedValue.where(...).run(...)` → `ThreadLocal.set()` + try-finally
  - [ ] 7.2: AnonymousJaxrsFilter — 同上
  - [ ] 7.3: CipherJaxrsFilter — 同上
  - [ ] 7.4: CipherManagerJaxrsFilter — 同上
  - [ ] 7.5: CipherManagerUserJaxrsFilter — 同上
  - [ ] 7.6: ManagerUserJaxrsFilter — 同上
  - [ ] 7.7: AnonymousCipherManagerUserJaxrsFilter — 同上
  - [ ] 7.8: BBSAnonyJaxrsFilter — 同上
  - [ ] 7.9: BBSJaxrsFilter — 同上

- [ ] Task 8: 回退 AbstractJaxrsAction 中的 ScopedValue 调用
  - [ ] 8.1: `EffectivePerson.SCOPED.isBound()` → `EffectivePerson.SCOPED.get() != null`
  - [ ] 8.2: `EffectivePerson.SCOPED.get()` 保持不变（ThreadLocal 也有 `.get()`）

## 阶段三：依赖版本修复

- [ ] Task 9: GraalVM 版本降级
  - [ ] 9.1: 修改根 pom.xml 中 `<graalvm.version>` 从 `24.2.1` 改为 `23.1.2`

- [ ] Task 10: javax.cache 依赖迁移
  - [ ] 10.1: 修改根 pom.xml 中 `javax.cache:cache-api` → `jakarta.cache:jakarta.cache-api`，版本 `1.1.1`
  - [ ] 10.2: 检查源码中是否有 `javax.cache` import，如有则替换为 `jakarta.cache`

- [ ] Task 11: Maven 编译器配置优化
  - [ ] 11.1: 将 `<source>21</source>` + `<target>21</target>` 替换为 `<release>21</release>`
  - [ ] 11.2: 移除 `<maven.compiler.source>` 和 `<maven.compiler.target>` 属性（由 release 替代）

## 阶段四：启动脚本更新

- [ ] Task 12: 更新所有启动/停止/控制台脚本中的 JVM 路径
  - [ ] 12.1: 所有 .sh 脚本中 `java11` → `java21`（29 个文件，79 处引用）
  - [ ] 12.2: 所有 .bat 脚本中 `java11` → `java21`（4 个文件，10 处引用）
  - [ ] 12.3: `module_java11` → `module_java21` 路径更新

## 阶段五：验证与日志

- [ ] Task 13: 验证编译目标为 Java 21
  - [ ] 13.1: 检查根 pom.xml 编译配置正确
  - [ ] 13.2: 搜索确认无 `Gatherers`/`Gatherer`/`ScopedValue` 残留引用

- [ ] Task 14: 创建重构日志
  - [ ] 14.1: 生成 `refactor-log-java21.md`，记录所有变更文件、变更内容、变更原因

- [ ] Task 15: 全量编译验证与构建日志分析
  - [ ] 15.1: 执行 `mvn compile -DskipTests` 确保全量编译通过
  - [ ] 15.2: 分析构建日志，修复编译错误
  - [ ] 15.3: 迭代修复直到编译通过

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
- [Task 13] depends on [Task 2, Task 3, Task 4, Task 5, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12]
- [Task 14] depends on [Task 13]
- [Task 15] depends on [Task 14]

# Parallelizable Work
- Task 2 ∥ Task 3 ∥ Task 4 ∥ Task 5 (after Task 1)
- Task 7 ∥ Task 8 (after Task 6)
- Task 9 ∥ Task 10 ∥ Task 11 ∥ Task 12 (independent of each other)
