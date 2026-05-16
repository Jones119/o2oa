# Java 21 编译目标降级重构规格

## Why
当前 O2OA 后端代码使用了 Java 22+ 才引入的 `Gatherers`/`Gatherer` API 和 Java 21 预览版 `ScopedValue` API，导致项目无法在 Java 21（LTS）上编译运行。需将编译目标从 Java 25 降级到 Java 21 LTS，并将不兼容的 API 回退为 Java 21 兼容实现。

## What Changes
- **BREAKING**: 移除 `java.util.stream.Gatherers` 和 `java.util.stream.Gatherer` 的使用（5 个文件，22 处引用），回退为传统 Stream API + Collector 实现
- **BREAKING**: 移除 `java.lang.ScopedValue` 的使用（10 个文件，21 处引用），回退为 `ThreadLocal` 实现
- 删除 `ProjectGatherers.java` 自定义 Gatherer 工具类，替换为传统 Collector 工具方法
- Maven 编译目标确认设置为 Java 21（`maven.compiler.source=21`, `maven.compiler.target=21`）

## Impact
- Affected specs: 6 个 Maven 模块
- Affected code:
  - `x_base_core_project` — 核心框架层（ListTools, ProjectGatherers, EntityManagerContainerTools, NaturalLanguageProcessing, EffectivePerson, 8 个 JaxrsFilter, AbstractJaxrsAction）
  - `x_bbs_assemble_control` — BBS 模块（BBSAnonyJaxrsFilter, BBSJaxrsFilter）
  - `x_query_service_processing` — 查询处理模块（LanguageProcessingHelper）

---

## ADDED Requirements

### Requirement: Java 21 编译与运行环境
系统 SHALL 在 Java 21 JDK 上编译并运行，Maven 编译目标设置为 21。

#### Scenario: 编译成功
- **WHEN** 执行 `mvn compile -DskipTests`
- **THEN** 所有 56 个模块编译成功，无错误

#### Scenario: 无 Java 22+ API 引用
- **WHEN** 在源码中搜索 `java.util.stream.Gatherers`、`java.util.stream.Gatherer`、`java.lang.ScopedValue`
- **THEN** 搜索结果为 0

### Requirement: Gatherers 回退为传统 Stream API
系统 SHALL 将所有 `Gatherers`/`Gatherer` 使用回退为 Java 21 兼容的传统 Stream API + Collector 实现。

#### Scenario: ListTools.batch() 回退
- **WHEN** 调用 `ListTools.batch(list, size)` 进行分批
- **THEN** 使用传统 `subList()` 循环分批实现，功能与 `Gatherers.windowFixed()` 完全一致

#### Scenario: ListTools.trim() 回退
- **WHEN** 调用 `ListTools.trim()` 进行去重归约
- **THEN** 使用 `Collectors.toCollection(ArrayList::new)` + `distinct()` 或手动去重实现

#### Scenario: EntityManagerContainerTools.batchDelete() 回退
- **WHEN** 调用 `batchDelete()` 进行批量删除
- **THEN** 使用传统 `subList()` 循环分批实现

#### Scenario: NaturalLanguageProcessing.word() 回退
- **WHEN** 调用 `word()` 方法进行 NLP 处理
- **THEN** 使用 `Collectors.collectingAndThen()` 或手动循环替代 `Gatherers.fold()`

#### Scenario: LanguageProcessingHelper.word() 回退
- **WHEN** 调用 `word()` 方法进行 NLP 处理
- **THEN** 使用与 NaturalLanguageProcessing 相同的回退策略

#### Scenario: ProjectGatherers 替换
- **WHEN** 代码使用 `ProjectGatherers.distinctByKey()` 或 `ProjectGatherers.distinctWithNullFilter()`
- **THEN** 替换为 `ListTools` 中的静态方法，使用 `Collectors.toMap()` 或 `Stream.distinct()` + filter 实现

### Requirement: ScopedValue 回退为 ThreadLocal
系统 SHALL 将所有 `ScopedValue` 使用回退为 `ThreadLocal` 实现。

#### Scenario: EffectivePerson.SCOPED 回退
- **WHEN** 代码使用 `EffectivePerson.SCOPED`（ScopedValue 类型）
- **THEN** 替换为 `ThreadLocal<EffectivePerson>` 类型，方法签名适配

#### Scenario: JaxrsFilter 绑定回退
- **WHEN** JaxrsFilter 中使用 `ScopedValue.where(EffectivePerson.SCOPED, effectivePerson).run(() -> {...})`
- **THEN** 替换为 `EffectivePerson.SCOPED.set(effectivePerson)` + try-finally 清理模式

#### Scenario: AbstractJaxrsAction 读取回退
- **WHEN** `AbstractJaxrsAction.effectivePerson()` 使用 `EffectivePerson.SCOPED.isBound()` / `.get()`
- **THEN** 替换为 `EffectivePerson.SCOPED.get() != null` / `.get()`

### Requirement: 重构日志
系统 SHALL 创建并保存完整的重构日志文件，记录所有变更。

#### Scenario: 日志文件创建
- **WHEN** 重构完成
- **THEN** 在项目根目录生成 `refactor-log-java21.md`，包含变更摘要、文件列表、变更前后对比

---

## MODIFIED Requirements

### Requirement: Maven 构建配置
Maven 编译目标从 Java 25 降级到 Java 21。`maven.compiler.source` 和 `maven.compiler.target` 设置为 `21`。不使用 `--enable-preview` 标志。

### Requirement: 线程模型
EffectivePerson 上下文传递从 ScopedValue 回退为 ThreadLocal，保持向后兼容。ThreadLocal 在虚拟线程环境下仍可工作，但需注意及时清理避免内存泄漏。

---

## REMOVED Requirements

### Requirement: Stream Gatherers 支持
**Reason**: `Gatherers`/`Gatherer` API 在 Java 22 引入预览，Java 24 正式发布，Java 21 完全不可用
**Migration**: 使用传统 Stream API + Collector 替代所有 Gatherers 用法

### Requirement: ScopedValue 支持
**Reason**: `ScopedValue` 在 Java 21 为预览 API，需要 `--enable-preview`；在 Java 24+ 已更名为 `ScopedValues`，API 不稳定
**Migration**: 回退为 `ThreadLocal`，配合 try-finally 确保及时清理
