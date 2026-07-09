# Init_Agent — AI 技能收集与评估系统

每日自动从 GitHub 发现高质量的 AI Agent 技能仓库与实战方案，增量去重，输出 Markdown 日报。

## Agent 角色

| Agent | 触发方式 | 技能文件 | 职责 |
|-------|---------|---------|------|
| **收集器 (Collector)** | 每日 9:00 cron | `.cursor/skills/ai-skills-collector/` | 搜索 GitHub → 去重 → 写入日报 |
| **评估器 (Evaluator)** | 每周 cron（第二阶段） | `.cursor/skills/ai-skills-evaluator/` | 对新项目评分，与已有优质项对比 |

## 数据

- **账本 (Ledger):** [`data/seen-items.json`](data/seen-items.json) — 所有已发现项目，去重的唯一数据源
- **模式 (Schema):** [`data/schema.json`](data/schema.json) — 字段定义；由 `npm run validate-ledger` 执行校验
- **报告 (Reports):** [`reports/YYYY-MM-DD.md`](reports/) — 增量日报（仅当日新增）

## 前置条件

1. **GitHub MCP** — 在 [Cursor MCP 设置](https://cursor.com/docs/mcp) 中连接并授权。这是 Cursor Automation 中 `mcp` 动作的必要依赖。
2. **`gh` CLI** — 可选备用工具，当 MCP 触发搜索频率限制时使用（如 `gh search repos`, `gh repo view`）。
3. **Cursor Automation** — 首次提交后参考 [`automations/daily-collector.md`](automations/daily-collector.md) 创建自动化。

## 收集器每日流程

1. 加载 `data/seen-items.json`，构建已知 ID 集合
2. 通过 GitHub MCP 按当日轮换关键词组搜索（详见技能文件中的搜索策略）
3. 按质量启发规则过滤；跳过账本中已存在的项目
4. 新项目以 `status: "pending_review"` 追加至账本
5. 写入 `reports/YYYY-MM-DD.md`（仅当天新增项）
6. 将账本与日报提交到本仓库

## 评估器流程（第二阶段）

1. 读取账本中 `status == "pending_review"` 的项目
2. 与已提升 (`promoted`) 的同类项目对比评分（扎实度、新颖性、维护度、社区影响力）
3. 将状态转换为 `promoted`、`duplicate_of` 或 `archived`
4. 写入 `reports/evaluations/YYYY-MM-DD.md`

## 验证账本

```bash
npm run validate-ledger      # 校验账本 ID 唯一性与字段合法性
npm run smoke-test           # 验证增量追加、去重拦截与报告生成
```

## 项目结构

```
Init_Agent/
├── .cursor/skills/
│   ├── ai-skills-collector/       # 收集器技能 + 搜索关键词轮转
│   └── ai-skills-evaluator/       # 评估器技能 + 评分细则
├── data/
│   ├── seen-items.json            # 增量账本
│   └── schema.json                # 字段定义（validate-ledger 执行校验）
├── reports/
│   ├── TEMPLATE.md                # 日报模板
│   └── evaluations/               # 周评报告目录
├── automations/
│   ├── daily-collector.md         # 自动化配置说明
│   └── daily-collector-workflow.json  # 自动化预填 JSON
├── scripts/
│   ├── validate-ledger.ts         # 账本校验脚本
│   └── smoke-test.ts              # 冒烟测试脚本
├── .gitignore
├── README.md                      # 英文入口
└── README.zh-CN.md                # 本文件
```

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 去重存储 | Git 跟踪的 JSON | 简单、可 Diff、无需数据库；自动化可直接 commit |
| 报告格式 | Markdown 文件 | 永久可搜索的历史记录 |
| 日报内容 | 增量（仅新增） | 避免重复信息淹没有价值内容 |
| 评估器执行频率 | 每周一次 | 降低 GitHub API 调用量；允许批量对比 |
| Agent 拆分 | 收集器 + 评估器 | 职责分离；评估器可独立优化评分逻辑 |

## 风险与缓解

- **GitHub MCP 未配置** → README 中提供配置指引；收集器技能兼容 `gh` CLI 降级
- **自动化无法提交** → 确保自动化 `gitConfig` 指向本仓库且有推送权限
- **搜索结果噪音** → 轮换关键词 + 星标/活跃度过滤 + 评估器归档低质项目
- **API 频率限制** → 每次运行上限：5 个搜索查询 × 20 条结果

## 第二阶段启用步骤

1. 确保第一阶段收集器稳定运行至少一周
2. 按 `automations/daily-collector.md` 中的说明创建第二个 Cursor Automation
3. 触发条件：`0 10 * * 1`（每周一 10:00）
4. 提示词引用 `.cursor/skills/ai-skills-evaluator/SKILL.md`
