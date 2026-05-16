# Tasks

## 阶段一：Gatherers 回退为传统 Stream API

- [ ] Task 1: 删除 ProjectGatherers.java 并将功能迁移到 ListTools
  - [ ] 1.1: 在 ListTools 中添加 `distinctByKey()` 静态方法（使用 `Collectors.toMap()` 实现）
  - [ ] 1.2: 在 ListTools 中添加 `distinctWithNullFilter()` 静态方法（使用 filter + distinct 实现）
  - [ ] 1.3: 删除 `ProjectGatherers.java` 文件
  - [ ] 1.4: 更新 ListTools 中 `extractProperty()` 和 `extractField()` 方法，移除 `ProjectGatherers` 引用

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
  - [ ] 6.1: 将 `ScopedValue<EffectivePerson> SCOPED` 替换为 `ThreadLocal<EffectivePerson> SCOPED`
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

## 阶段三：验证与日志

- [ ] Task 9: 验证编译目标为 Java 21
  - [ ] 9.1: 检查根 pom.xml `maven.compiler.source` 和 `maven.compiler.target` 为 `21`
  - [ ] 9.2: 搜索确认无 `Gatherers`/`Gatherer`/`ScopedValue` 残留引用

- [ ] Task 10: 创建重构日志
  - [ ] 10.1: 生成 `refactor-log-java21.md`，记录所有变更文件、变更内容、变更原因

- [ ] Task 11: 全量编译验证
  - [ ] 11.1: 执行 `mvn compile -DskipTests` 确保全量编译通过
  - [ ] 11.2: 分析构建日志，修复编译错误

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
- [Task 9] depends on [Task 2, Task 3, Task 4, Task 5, Task 7, Task 8]
- [Task 10] depends on [Task 9]
- [Task 11] depends on [Task 10]

# Parallelizable Work
- Task 2 ∥ Task 3 ∥ Task 4 ∥ Task 5 (after Task 1)
- Task 7 ∥ Task 8 (after Task 6)
