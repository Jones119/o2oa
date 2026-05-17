# CMS内容管理与Portal门户管理模块文档

## CMS内容管理模块

### 模块组成

| 模块名 | 类型 | 说明 |
|-------|------|------|
| x_cms_core_entity | 实体模块 | CMS相关JPA实体 |
| x_cms_core_express | 接口模块 | CMS服务调用接口 |
| x_cms_assemble_control | 控制模块 | CMS管理API |

### CMS核心实体

#### 1. AppInfo (CMS应用)

**路径**: `com.x.cms.core.entity.AppInfo`

**主要属性**:
- `id`: 唯一标识
- `appName`: 应用名称
- `appAlias`: 应用别名
- `description`: 描述
- `icon`: 图标

#### 2. CategoryInfo (分类)

**路径**: `com.x.cms.core.entity.CategoryInfo`

**主要属性**:
- `id`: 唯一标识
- `appId`: 所属应用
- `categoryName`: 分类名称
- `categoryAlias`: 分类别名
- `superior`: 上级分类

#### 3. Document (文档)

**路径**: `com.x.cms.core.entity.Document`

**主要属性**:
- `id`: 唯一标识
- `title`: 标题
- `appId`: 所属应用
- `categoryId`: 所属分类
- `docType`: 文档类型
- `creatorPerson`: 创建人
- `creatorIdentity`: 创建身份
- `publishTime`: 发布时间
- `status`: 状态
- `documentType`: 文档格式
- `summary`: 摘要
- `data`: 业务数据 (JSON)

**文档状态**:
- `draft`: 草稿
- `published`: 已发布
- `archived`: 已归档

#### 4. FileInfo (附件)

**路径**: `com.x.cms.core.entity.FileInfo`

**主要属性**:
- `id`: 唯一标识
- `documentId`: 所属文档
- `name`: 文件名
- `extension`: 扩展名
- `size`: 大小
- `storage`: 存储位置

#### 5. Log (日志)

**路径**: `com.x.cms.core.entity.Log`

**说明**: 记录文档操作日志

### CMS主要功能

1. **文档管理**: 创建、编辑、发布、删除文档
2. **分类管理**: 多级分类管理
3. **表单设计**: 文档表单设计
4. **权限管理**: 文档访问权限控制
5. **评论管理**: 文档评论
6. **搜索功能**: 全文搜索

### CMS前端组件

| 组件 | 功能 |
|-----|------|
| x_component_cms_Column | CMS栏目管理 |
| x_component_cms_ColumnManager | CMS管理 |
| x_component_cms_Document | 文档展示 |
| x_component_cms_ScriptDesigner | 脚本设计 |
| x_component_cms_ViewDesigner | 视图设计 |

---

## Portal门户管理模块

### 模块组成

| 模块名 | 类型 | 说明 |
|-------|------|------|
| x_portal_core_entity | 实体模块 | Portal相关JPA实体 |
| x_portal_assemble_designer | 设计器模块 | 门户设计器API |
| x_portal_assemble_surface | 展示模块 | 门户展示API |

### Portal核心实体

#### 1. Portal (门户)

**路径**: `com.x.portal.core.entity.Portal`

**主要属性**:
- `id`: 唯一标识
- `name`: 门户名称
- `alias`: 别名
- `description`: 描述
- `creatorPerson`: 创建人

#### 2. Page (页面)

**路径**: `com.x.portal.core.entity.Page`

**主要属性**:
- `id`: 唯一标识
- `portal`: 所属门户
- `name`: 页面名称
- `alias`: 别名
- `mobile`: 是否移动端
- `data`: 页面数据 (JSON)

#### 3. Widget (部件)

**路径**: `com.x.portal.core.entity.Widget`

**主要属性**:
- `id`: 唯一标识
- `portal`: 所属门户
- `name`: 部件名称
- `alias`: 别名
- `data`: 部件数据 (JSON)

#### 4. Script (脚本)

**路径**: `com.x.portal.core.entity.Script`

**主要属性**:
- `id`: 唯一标识
- `portal`: 所属门户
- `name`: 脚本名称
- `alias`: 别名
- `text`: 脚本内容

#### 5. Dictionary (字典)

**路径**: `com.x.portal.core.entity.Dictionary`

**主要属性**:
- `id`: 唯一标识
- `portal`: 所属门户
- `name`: 字典名称
- `alias`: 别名
- `data`: 字典数据 (JSON)

#### 6. File (文件)

**路径**: `com.x.portal.core.entity.File`

**主要属性**:
- `id`: 唯一标识
- `portal`: 所属门户
- `name`: 文件名
- `data`: 文件数据

### Portal主要功能

1. **门户设计**: 拖拽式页面设计
2. **部件开发**: 自定义业务部件
3. **脚本管理**: 门户脚本
4. **菜单配置**: 门户菜单
5. **移动端适配**: 移动端页面

### Portal前端组件

| 组件 | 功能 |
|-----|------|
| x_component_portal_Portal | 门户展示 |
| x_component_portal_PortalExplorer | 门户管理 |
| x_component_portal_PortalManager | 门户设计器 |
| x_component_portal_PageDesigner | 页面设计器 |
| x_component_portal_WidgetDesigner | 部件设计器 |
| x_component_portal_ScriptDesigner | 脚本设计器 |
| x_component_portal_DictionaryDesigner | 字典设计器 |

### Portal页面设计器功能

1. **布局容器**: 行列布局
2. **通用部件**: 文本、图片、链接
3. **业务部件**: 待办、待阅、文档列表等
4. **自定义部件**: 可扩展开发

---

## CMS与Portal的集成

### 文档发布流程

1. 在CMS中创建文档
2. 编辑文档内容
3. 选择发布分类
4. 设置权限
5. 发布文档
6. 在Portal中展示

### 在Portal中展示CMS内容

Portal提供多种CMS展示部件：
- CMS文档列表部件
- CMS分类导航部件
- CMS文档详情部件
- CMS搜索部件

---

## 配置说明

### CMS配置 (config/cms.json)

```json
{
  "documentVersionEnable": true,
  "commentEnable": true,
  "documentPublishAuditEnable": false,
  "luceneIndexEnable": true,
  "maxAttachmentSize": 104857600
}
```

### Portal配置

门户配置主要通过设计器进行，无需单独配置文件。

---

## 扩展点

1. **CMS自定义表单**: 扩展CMS表单设计
2. **Portal自定义部件**: 开发自定义Portal部件
3. **文档发布事件**: 监听文档发布事件
4. **内容审核流程**: 集成流程平台进行内容审核

---

## 使用示例

### 创建CMS文档

```javascript
o2.api.cmsAction.createDocument({
    title: "文档标题",
    appId: "appId",
    categoryId: "categoryId",
    data: { ... }
}, function(json){
    console.log("创建成功");
});
```

### 发布文档

```javascript
o2.api.cmsAction.publishDocument(documentId, function(json){
    console.log("发布成功");
});
```

### Portal脚本示例

```javascript
// Portal脚本中调用CMS
var docs = this.cms.document().listWithCategory(categoryId);
return docs;
```

---

## 总结

CMS内容管理模块提供了完整的文档管理功能，Portal门户管理模块提供了灵活的门户页面设计能力。两者结合可以快速构建企业信息门户和内容管理系统。
