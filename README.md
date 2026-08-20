# DSH Plugin Builder

DSH Plugin Builder 是一个面向开发者的 DSH Agent 模式。用户描述业务需求，它负责完成需求澄清、DSH 能力映射、影响评审、测试驱动实现、运行验证和交付说明，不要求用户先判断插件类型。

当前 MVP 提供：

- 可直接出现在 DSH 模式列表中的“插件构建器” Agent preset；
- 面向 DSH Tool、Service/Provider、Settings、Credential、Remote、Client UI、Session Event、Artifact、Job/Workflow、Approval、Skill 和 Bundle 的能力映射；
- 设计、安装和发布三个独立审批门禁；
- 安全的安装、状态查询、显式替换和卸载命令；
- 无运行时依赖、无安装脚本，不修改 DSH 核心代码和现有会话。

完整架构见 [设计基线](docs/plugin-builder-design.md)。

## 环境要求

- DSH `0.1.0-rc.5` 或兼容版本；
- Node.js `^22.19.0` 或 `>=24.0.0`；
- DSH Web 模式已经能够正常启动。

## 安装

从当前源码目录安装：

```powershell
node .\src\cli.mjs install
```

命令按以下顺序寻找 DSH Home：

1. `--dsh-home <路径>`；
2. `DSH_HOME` 环境变量；
3. 当前用户目录下的 `.dsh`。

指定一个 DSH Home：

```powershell
node .\src\cli.mjs install --dsh-home "D:\my-dsh-home"
```

仓库发布后也可以直接从 GitHub 执行：

```powershell
npx --yes github:zhanglinruo/dsh-plugin-builder install
```

安装命令只会写入：

```text
<DSH_HOME>/.agent-presets/plugin-builder/
```

如果目标已经存在，命令会拒绝覆盖。确认要用当前版本替换时显式执行：

```powershell
node .\src\cli.mjs install --replace
```

## 第一次使用

安装后不需要修改配置文件，也不会切换正在运行的会话：

1. 回到 DSH Web 页面并刷新模式列表；
2. 新建会话；
3. 选择“插件构建器”；
4. 直接描述业务结果。

例如：

```text
帮我做一个 DSH 插件：用户输入 MySQL 连接信息后，Agent 可以查询数据库，
前台能维护连接，并且所有查询都要保留可追溯证据。
```

Plugin Builder 会依次完成：

```text
环境发现 → 需求澄清 → 能力设计 → 影响评审
→ 测试驱动实现 → 验证 → 安装评审 → 安装 → 验收 → 交付
```

设计阶段会在目标项目中维护 `.dsh/plugin-builder/` 工作流文件。它不会在未完成设计评审时开始写实现代码，也不会把设计批准自动当作安装或发布批准。

## 状态与卸载

查看是否已经安装：

```powershell
node .\src\cli.mjs status
```

卸载：

```powershell
node .\src\cli.mjs uninstall
```

卸载只删除 `plugin-builder` preset，不删除其他模式、项目中的工作流记录、用户设置或凭据。

## 开发验证

```powershell
npm test
npm run check
npm pack --dry-run
```

测试全部使用临时 DSH Home，不会碰真实用户目录。

## 当前边界

- MVP 面向能阅读和修改代码的开发者；普通用户向导是后续阶段。
- 当前通过 DSH 官方用户 preset 目录安装。等 DSH 提供原生的外部 preset 分发接口后，再迁移为标准 bundle/preset 组合。
- 真实 DSH 已完成 preset 发现、会话挂载、skill 可见性和卸载验收；需要模型凭据的完整 LLM 开发场景仍待后续验收。
