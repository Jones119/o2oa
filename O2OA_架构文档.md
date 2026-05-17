# O2OA 企业级协同办公平台 - 架构文档

## 项目概述

**O2OA (翱途)** 是一个100%开源的企业级协同办公与低代码开发平台，基于JavaEE分布式架构，提供完整的前后端API和模块定制能力。

### 核心特性

- **开源协议**：AGPL-3.0
- **技术栈**：Java 21 + Jetty + OpenJPA + JavaScript
- **架构**：分布式微服务架构
- **支持**：流程引擎、表单定制、页面定制、业务数据服务
- **平台**：Web端、Android、iOS多端支持

---

## 目录结构

```
/workspace/
├── o2server/          # Java后端服务端
├── o2web/             # Web前端应用
├── o2android/         # Android客户端(已迁移)
├── o2ios/             # iOS客户端(已迁移)
└── target_o2server/   # 服务器部署产物
```

---

## 整体系统架构

### 系统分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    客户端层                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │ Web 前端  │  │ Android   │  │ iOS  App  │          │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘          │
└────────┼──────────────┼──────────────┼─────────────────┘
         │              │              │
┌────────┼──────────────┼──────────────┼─────────────────┐
│        │              │              │                 │
│        ▼              ▼              ▼                 │
│                  RESTful API 层                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Jetty Web Server + Jersey JAX-RS               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │              业务服务层                            │  │
│  ├─────────────────────────────────────────────────┤  │
│  │  组织管理 | 流程平台 | 内容管理 | 门户管理 | ... │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │              数据持久层                            │  │
│  │  OpenJPA + H2/MySQL/Oracle + Redis 缓存           │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 核心模块架构

O2OA采用模块化设计，每个业务模块相对独立，通过RESTful API进行交互。主要模块包括：

1. **组织管理模块** (`x_organization_*`)
2. **流程平台模块** (`x_processplatform_*`)
3. **内容管理模块** (`x_cms_*`)
4. **门户管理模块** (`x_portal_*`)
5. **数据查询模块** (`x_query_*`)
6. **文件管理模块** (`x_file_*`)
7. **消息沟通模块** (`x_message_*`)
8. **会议管理模块** (`x_meeting_*`)
9. **考勤管理模块** (`x_attendance_*`)
10. **AI功能模块** (`x_ai_*`)

---

## 后端技术架构 (o2server)

### 核心依赖与技术栈

| 技术组件 | 版本/说明 |
|---------|---------|
| Java    | 21 |
| Web容器 | Jetty |
| JPA实现 | Apache OpenJPA |
| REST框架 | Jersey + JAX-RS |
| JSON处理 | Gson |
| 定时任务 | Quartz |
| 缓存 | JCache (支持Redis) |
| 搜索引擎 | Apache Lucene |
| 脚本引擎 | GraalVM |
| 构建工具 | Maven |

### 模块命名规范

后端模块命名遵循以下规范：

- `*_core_entity`：实体定义模块，包含JPA实体类
- `*_core_express`：接口调用模块，用于模块间通信
- `*_assemble_control`：控制层模块，提供REST API
- `*_assemble_designer`：设计器模块，提供设计器API
- `*_assemble_surface`：展示层模块，面向终端用户
- `*_service_processing`：服务处理模块，后台业务处理

### 核心基础模块 - x_base_core_project

这是整个平台的基础模块，所有其他模块都依赖它。

**主要功能**：
- 提供项目级别的公共类和工具
- JPA实体基类定义
- 缓存管理
- 配置管理
- 异常处理
- HTTP连接工具
- 脚本执行引擎
- 日志管理

**核心类**：
- `com.x.base.core.project.Application`：应用信息类
- `com.x.base.core.project.Context`：应用上下文
- `com.x.base.core.entity.JpaObject`：JPA实体基类
- `com.x.base.core.project.cache.CacheManager`：缓存管理器

### 典型业务模块结构

以组织管理模块 `x_organization_assemble_control` 为例：

```
x_organization_assemble_control/
├── src/main/java/com/x/organization/assemble/control/
│   ├── ThisApplication.java              # 应用初始化类
│   ├── Business.java                     # 业务逻辑聚合
│   ├── AbstractFactory.java              # 工厂基类
│   ├── factory/                          # 工厂类
│   │   ├── PersonFactory.java
│   │   ├── UnitFactory.java
│   │   └── ...
│   └── jaxrs/                            # REST资源类
│       ├── ActionApplication.java
│       ├── PersonJaxrsFilter.java
│       └── ...
└── pom.xml
```

**关键流程**：
1. 应用启动时通过 `ThisApplication.init()` 初始化
2. REST请求通过JAX-RS资源类接收
3. 业务逻辑通过Business类和Factory类处理
4. 数据持久化通过JPA实体完成

### 构建与部署

使用Maven进行构建，主要构建步骤：
1. 元模型生成 (`MetaModelBuilder`)
2. 实体增强 (`EnhanceBaseBuilder`)
3. API文档生成 (`ApiBuilder`)
4. 描述文档生成 (`DescribeBuilder`)
5. Web.xml生成 (`CreateWebXml`)
6. 打包为WAR文件

---

## 前端技术架构 (o2web)

### 技术栈

| 技术 | 说明 |
|-----|-----|
| JavaScript | 核心编程语言 |
| Gulp | 构建工具 |
| 模块化 | 自定义模块化加载系统 |
| 国际化 | 多语言支持 (zh-cn, en, es等) |

### 前端模块结构

```
o2web/source/
├── o2_core/              # 核心框架
│   ├── o2.js            # 核心入口
│   ├── polyfill.js      # 兼容性填充
│   └── scriptWorker.js  # 脚本工作器
├── x_component_*/       # 业务组件 (40+个组件)
│   ├── x_component_process_*      # 流程相关
│   ├── x_component_cms_*          # CMS相关
│   ├── x_component_portal_*       # 门户相关
│   ├── x_component_org_*          # 组织相关
│   ├── x_component_query_*        # 查询相关
│   └── ...
└── x_init/              # 初始化模块
```

### 主要业务组件

| 组件模块 | 功能说明 |
|---------|---------|
| x_component_process_* | 流程设计、任务管理、表单设计 |
| x_component_cms_* | 内容管理、文档发布 |
| x_component_portal_* | 门户设计、页面管理 |
| x_component_org | 组织人员管理 |
| x_component_query_* | 数据查询、统计分析 |
| x_component_meeting | 会议管理 |
| x_component_attendance | 考勤管理 |
| x_component_AI | AI智能助手 |
| x_component_IMV2 | 即时通讯 |

### 构建系统

使用Gulp作为构建工具，主要功能：
- 模块合并与压缩
- 源地图生成
- 语言包生成
- 部署支持 (本地、FTP、SFTP)

**构建命令**：
```bash
npm install
npm install -g gulp-cli
gulp                          # 完整构建
gulp --upload ftp --host ...  # 构建并FTP部署
```

### 核心框架 (o2_core)

`o2.js` 提供以下核心功能：
- 模块加载系统 (`o2.load`)
- CSS加载 (`o2.loadCss`)
- 工具函数 (`o2.typeOf`, `o2.uuid`等)
- 国际化支持
- 调试模式支持

---

## 移动端 (o2android & o2ios)

当前移动端代码已迁移至独立仓库：
- **Android**: [https://gitee.com/o2oa/o2oa-android](https://gitee.com/o2oa/o2oa-android)
- **iOS**: [https://gitee.com/o2oa/o2oa-ios](https://gitee.com/o2oa/o2oa-ios)

---

## 服务部署架构 (target_o2server)

### 目录结构

```
target_o2server/
├── commons/          # 公共依赖库
├── config/           # 配置文件
├── configSample/     # 配置示例
├── localSample/      # 本地配置示例
├── servers/          # 服务器组件
│   └── webServer/   # Web服务器
├── store/            # 应用存储
│   └── jars/        # JAR包
└── 启动脚本          # Windows/Linux/Mac启动脚本
```

### 支持的操作系统

- Windows (64位)
- Linux (CentOS, RedHat, Ubuntu等)
- MacOS
- AIX
- 树莓派
- ARM Linux
- MIPS Linux
- 国产操作系统 (统信UOS, 麒麟等)

### 端口说明

- 80: Web服务端口
- 20020: 中心服务端口
- 20030: 应用服务端口

---

## 核心工作流程

### 1. 应用启动流程

```
1. 执行启动脚本 (start_*.sh/bat)
2. Jetty容器启动
3. 加载x_program_center初始化环境
4. 扫描并部署各WAR模块
5. 每个模块调用ThisApplication.init()
6. 初始化缓存、数据库连接
7. 服务注册到中心
8. 系统就绪
```

### 2. 典型业务请求流程

```
前端请求 
  → Jetty Web服务器 
  → Jersey JAX-RS分发 
  → *JaxrsFilter权限过滤
  → Business业务处理
  → Factory数据访问
  → JPA持久化
  → 返回响应
```

### 3. 流程引擎工作流

```
1. 启动流程实例 (Work创建)
2. 生成待办任务 (Task)
3. 处理人办理任务
4. 路由决策 (Route)
5. 流转至下一活动 (Activity)
6. 执行自动任务 (Script/Agent/Service)
7. 流程结束 (End)
8. 生成已办记录 (TaskCompleted/WorkCompleted)
```

---

## 主要依赖关系

### 后端模块依赖树

```
x_base_core_project (基础)
    ├── x_*_core_entity (各业务实体)
    │     └── x_*_core_express (接口封装)
    │           ├── x_*_assemble_control (控制层)
    │           ├── x_*_assemble_designer (设计器)
    │           └── x_*_service_processing (后台服务)
    └── x_program_center (程序中心)
          └── x_program_init (初始化)
```

### 模块间通信

模块间通过REST API进行通信，主要依赖：
- `x_organization_core_express`：组织服务调用
- `x_processplatform_core_express`：流程服务调用
- `x_query_core_express`：数据查询服务调用

---

## 配置与扩展

### 主要配置文件

- `config/node_127.0.0.1.json`：节点配置
- `config/manifest.json`：应用清单
- `config/web.json`：Web服务配置
- `config/externalStorageSources.json`：外部存储配置

### 扩展点

1. **自定义流程活动**：通过扩展Activity实现
2. **自定义表单组件**：前端组件扩展
3. **服务集成**：通过Service/Agent/Invoke实现
4. **消息推送**：支持Kafka、ActiveMQ、RESTful等

---

## 安全机制

- Token-based认证
- 权限分级管理 (用户、管理者、系统管理者)
- 接口访问过滤 (JaxrsFilter)
- 数据加密存储
- 操作审计日志

---

## 总结

O2OA是一个架构完善、模块化程度高的企业级协同办公平台，采用前后端分离的设计，提供了从流程管理、内容管理到门户定制的完整解决方案。其分布式架构、可扩展的设计使其能够适应各种企业级应用场景。
