# Java 21 降级重构验证清单

## 阶段一：Gatherers 回退
- [ ] `ProjectGatherers.java` 已删除
- [ ] `ListTools.distinctByKey()` 使用 `Collectors.toMap()` 实现，功能与原 `ProjectGatherers.distinctByKey()` 一致
- [ ] `ListTools.distinctWithNullFilter()` 使用 filter + distinct 实现，功能与原 `ProjectGatherers.distinctWithNullFilter()` 一致
- [ ] `ListTools.trim()` 不再使用 `Gatherers.fold()`，回退为传统实现
- [ ] `ListTools.batch()` 不再使用 `Gatherers.windowFixed()`，回退为 `subList()` 循环分批
- [ ] `EntityManagerContainerTools.batchDelete()` 不再使用 `Gatherers.windowFixed()`，回退为 `subList()` 循环分批
- [ ] `NaturalLanguageProcessing.word()` 不再使用 `Gatherers.fold()`，回退为传统实现
- [ ] `LanguageProcessingHelper.word()` 不再使用 `Gatherers.fold()`，回退为传统实现
- [ ] 所有文件中无 `import java.util.stream.Gatherers` 或 `import java.util.stream.Gatherer` 残留

## 阶段二：ScopedValue 回退
- [ ] `EffectivePerson.SCOPED` 类型从 `ScopedValue<EffectivePerson>` 改为 `ThreadLocal<EffectivePerson>`
- [ ] `EffectivePerson.java` 无 `import java.lang.ScopedValue` 残留
- [ ] 所有 JaxrsFilter 中 `ScopedValue.where(...).run(...)` 替换为 `ThreadLocal.set()` + try-finally 清理
- [ ] `AbstractJaxrsAction.effectivePerson()` 中 `SCOPED.isBound()` 替换为 `SCOPED.get() != null`
- [ ] 所有文件中无 `import java.lang.ScopedValue` 残留

## 阶段三：编译目标与构建
- [ ] 根 pom.xml `maven.compiler.source=21` 和 `maven.compiler.target=21`
- [ ] 全局搜索无 `Gatherers`/`Gatherer`/`ScopedValue` 引用（除注释）
- [ ] `mvn compile -DskipTests` 全量编译通过

## 阶段四：重构日志
- [ ] `refactor-log-java21.md` 已创建，包含完整变更记录
