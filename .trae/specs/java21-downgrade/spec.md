# O2OA Java 25 完整重构与构建修复规格

## Why
O2OA 后端已完成 Java 25 特性的代码重构（javax→jakarta 迁移、虚拟线程、Gatherers、ScopedValue、密封类、Record、Switch 模式匹配等），但当前 pom.xml 编译目标被设置为 21 而非 25，启动脚本仍引用 Java 11 路径，javax.cache 依赖未迁移，且项目尚未成功完成全量编译。需将编译目标恢复为 Java 25，修复所有构建问题，并创建完整的重构日志。

## What Changes
- 将 Maven 编译目标从 21 恢复为 25（`maven.compiler.source=25`, `maven.compiler.target=25`）
- 修复 `javax.cache:cache-api` → `jakarta.cache:jakarta.cache-api` 遗留依赖
- 更新所有启动/停止/控制台脚本中的 JVM 路径从 `java11` 改为 `java25`，模块路径从 `module_java11` 改为 `module_java25`
- 全量编译项目，分析构建日志，修复所有编译错误
- 创建完整的重构日志文件 `refactor-log-java25.md`

## Impact
- Affected specs: 全部 56 个 Maven 模块
- Affected code:
  - 根 `pom.xml` — 编译目标、依赖声明
  - 所有启动/停止/控制台脚本（33 个 .sh + .bat 文件）
  - 编译错误涉及的任何模块

---

## ADDED Requirements

### Requirement: Java 25 编译与运行环境
系统 SHALL 在 Java 25 JDK 上编译并运行，Maven 编译目标设置为 25。

#### Scenario: 编译成功
- **WHEN** 执行 `mvn compile -DskipTests`
- **THEN** 所有 56 个模块编译成功，无错误

### Requirement: javax.cache 依赖迁移
系统 SHALL 将 `javax.cache:cache-api` 依赖替换为 `jakarta.cache:jakarta.cache-api`。

#### Scenario: 缓存 API 迁移
- **WHEN** 检查 pom.xml 中的缓存依赖
- **THEN** 使用 `jakarta.cache:jakarta.cache-api` 而非 `javax.cache:cache-api`

### Requirement: 启动脚本 JVM 路径更新
系统 SHALL 将所有启动/停止/控制台脚本中的 JVM 路径从 `java11` 更新为 `java25`，模块路径从 `module_java11` 更新为 `module_java25`。

#### Scenario: 脚本路径一致
- **WHEN** 检查所有 .sh 和 .bat 脚本中的 JVM 路径
- **THEN** 所有路径引用 `java25` 而非 `java11`

### Requirement: 构建日志分析与问题修复
系统 SHALL 对全量编译产生的构建日志进行分析，找出所有编译错误并逐一修复，直到项目全量编译通过。

#### Scenario: 编译错误修复
- **WHEN** `mvn compile -DskipTests` 产生编译错误
- **THEN** 分析错误原因，修复代码，重新编译，直到全部通过

### Requirement: 重构日志
系统 SHALL 创建并保存完整的重构日志文件，记录所有变更。

#### Scenario: 日志文件创建
- **WHEN** 重构完成
- **THEN** 在项目根目录生成 `refactor-log-java25.md`，包含变更摘要、文件列表、变更原因、构建日志分析

---

## MODIFIED Requirements

### Requirement: Maven 构建配置
Maven 编译目标从 21 恢复为 25。`maven.compiler.source` 和 `maven.compiler.target` 设置为 `25`。maven-compiler-plugin 的 `<source>` 和 `<target>` 同步更新为 `25`。

---

## REMOVED Requirements

### Requirement: Java 21 编译目标
**Reason**: 用户决定继续在 Java 25 上，不再降级到 Java 21
**Migration**: 将编译目标恢复为 Java 25
