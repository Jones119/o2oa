# Java 21 全面重构验证清单

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

## 阶段三：依赖版本修复
- [ ] GraalVM 版本从 `24.2.1` 降级为 `23.1.2`
- [ ] `javax.cache:cache-api` 替换为 `jakarta.cache:jakarta.cache-api`
- [ ] 源码中无 `javax.cache` import 残留
- [ ] maven-compiler-plugin 使用 `<release>21</release>` 而非 `<source>` + `<target>`

## 阶段四：启动脚本更新
- [ ] 所有 .sh 脚本中 `java11` 替换为 `java21`
- [ ] 所有 .bat 脚本中 `java11` 替换为 `java21`
- [ ] `module_java11` 替换为 `module_java21`

## 阶段五：编译与日志
- [ ] 全局搜索无 `Gatherers`/`Gatherer`/`ScopedValue` 引用（除注释）
- [ ] `mvn compile -DskipTests` 全量编译通过
- [ ] `refactor-log-java21.md` 已创建，包含完整变更记录
