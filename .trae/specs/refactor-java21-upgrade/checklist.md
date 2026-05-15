# Checklist — O2Server Java 21 深度重构

## 构建系统
- [ ] 根 pom.xml 中 maven.compiler.source/target/release 已设置为 21
- [ ] maven-compiler-plugin 配置了 --enable-preview 参数
- [ ] maven-surefire-plugin 配置了 --enable-preview 参数
- [ ] 所有模块在 Java 21 下 `mvn clean compile` 编译通过
- [ ] 不兼容 Java 21 的依赖已升级至兼容版本

## 启动脚本
- [ ] 所有 start_*.sh 脚本包含 `-XX:+UseZGC -XX:+ZGenerational` 参数
- [ ] start_windows.bat 包含对应 GC 参数
- [ ] 启动脚本包含 `--enable-preview` 运行时参数
- [ ] 启动脚本显式声明 `-XX:+ShowCodeDetailsInExceptionMessages`

## 虚拟线程
- [ ] ProcessPlatformKeyClassifyExecutorFactory 使用虚拟线程执行器，保留按 key 分类串行语义
- [ ] 各模块 ThisApplication 中的 ExecutorService 已替换为虚拟线程执行器
- [ ] AbstractQueue 中守护线程已替换为 Thread.startVirtualThread()
- [ ] 直接 new Thread().start() 调用已替换为 Thread.startVirtualThread()
- [ ] JAX-RS AsyncResponse 异步处理使用虚拟线程

## Switch 模式匹配
- [ ] ResponseFactory.java 中 if-instanceof 链已重构为 switch 类型模式匹配
- [ ] Activity.java 中 if-instanceof 链已重构为 switch 类型模式匹配
- [ ] MapTools.java 中 if-instanceof-cast 已重构为 switch 类型模式匹配
- [ ] Plan.java 中 if-instanceof-cast 已重构为 switch 类型模式匹配
- [ ] 全局扫描无遗漏的 if-instanceof-cast 模式（可重构的场景均已处理）

## 密封类
- [ ] Activity 类已声明为 sealed abstract class，permits 列出所有子类
- [ ] JAX-RS 响应类型已定义 sealed interface WoResponse，permits WoFile/WoText/WoContentType
- [ ] 其他限定扩展的领域模型基类已使用 sealed 声明

## Record 不可变对象
- [ ] WrapBoolean 已重构为 Record，Gson 序列化字段名一致
- [ ] WoId 已重构为 Record，Gson 序列化字段名一致
- [ ] WrapString 已重构为 Record，Gson 序列化字段名一致
- [ ] WrapCount 已重构为 Record，Gson 序列化字段名一致
- [ ] 各模块简单 Wo/Wi DTO 类已重构为 Record，Gson 序列化字段名一致
- [ ] JPA 实体类未错误重构为 Record

## 字符串模板
- [ ] 自定义 JPQL 模板处理器已创建，实现自动参数化转义
- [ ] ActionListRowSelectWhere.java 中 JPQL 拼接已重构为字符串模板
- [ ] ActionListRowNext.java 中 JPQL 拼接已重构为字符串模板
- [ ] ActionRowCountWhere.java 中 JPQL 拼接已重构为字符串模板
- [ ] ActionRowDeleteAll.java 中 JPQL 拼接已重构为字符串模板
- [ ] 其他 JPQL/SQL 拼接场景已重构为字符串模板

## 结构化并发
- [ ] 并行调用多个外部接口/服务的场景已使用 StructuredTaskScope 重构
- [ ] StructuredTaskScope 使用保证子任务生命周期与父任务绑定
- [ ] 子任务异常通过 StructuredTaskScope 正确传播

## 作用域值
- [ ] ServerRequestLog 中 ThreadLocal<StringBuilder> 已重构为 ScopedValue
- [ ] 其他 ThreadLocal 上下文传递已重构为 ScopedValue
- [ ] 虚拟线程间无 ThreadLocal 状态串用风险

## API 契约兼容性
- [ ] 所有 JAX-RS Controller 的 @Path 路径未改变
- [ ] 所有 Controller 的 HTTP 方法（@GET/@POST/@PUT/@DELETE）未改变
- [ ] 请求 DTO 字段名和类型未改变
- [ ] 响应 DTO 的 JSON 序列化字段名与重构前完全一致
- [ ] Record DTO 使用 @SerializedName 或组件名保证 JSON 字段名兼容
- [ ] 前端代码无需任何修改即可正常工作

## 集成验证
- [ ] `mvn clean compile` 全量编译通过
- [ ] `mvn test` 全量测试通过
- [ ] 应用可正常启动并响应 API 请求
