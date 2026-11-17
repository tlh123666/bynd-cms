# 健康数据管理同步

管理后台继续使用独立 CMS 登录：浏览器 → `bynd-cms-backend` → `BYND-backend /api/v1/internal/cms/*`。内部令牌只由两个 Go 服务保存。

## 页面入口

- 健康数据 → 睡眠管理：每日汇总、会话，以及用户当前保存的睡眠目标和显示偏好。
- 健康数据 → 心率管理：每日汇总详情新增设置、主动测量元信息；“用户主动测量记录”标签页可独立分页查找没有每日汇总的测量，按波形类型、测量场景、用户、UTC 日期筛选。
- 健康数据 → 日记管理：身体故事、用户笔记、字符串形式的版本号、事件回答/数值/营养记录及当前保存的追踪器配置。列表支持搜索笔记。展开事件可查看详情；照片仅显示上传标记，不返回私有存储键或绕过授权的链接。
- 健康数据 → 恢复与精力：已保存的真实同步观测，可按指标、用户、UTC 日期、训练设置、算法版本分页筛选。详情同时显示历史观测及用户当前偏好，两者可能不同。

以上接口均为只读，不生成评分、默认设置、故事或通知。恢复/精力评分是规则估算；统计按筛选后的观测记录计算，不是按用户等权平均。缺失评分为 `null`，有效的 `0` 保留。PPG 与电极 ECG 分开显示，不提供心律诊断。

## 公共实现

```text
src/api/wellness.ts                         类型和 API
src/views/wellness/
  components/StatCards.vue                  统计卡片
  components/WellnessDetailDrawer.vue       加载、错误、重试与响应式抽屉
  components/WellnessDetails.vue            只读字段、布尔值、枚举、时间偏好
  components/HeartMeasurements.vue          主动测量分页列表
  useWellnessDetail.ts                      请求竞态和关闭保护
  shared.ts                                中英葡日期格式化
  vitality/index.vue                       恢复与精力管理
src/locales/langs/{zh,en,pt}.json            三语言文案
```

页面沿用 `ArtSearchBar`、`ArtTable`、`ArtTableHeader`、`useTable` 和 Element Plus CSS 变量。用户原始笔记及自定义名称保留原文。

## 部署和检查

1. 主后端应已执行 `000061`–`000065`，再按现有迁移流程执行 `000066_cms_vitality_observation_index.up.sql`，为跨用户的观测查询增加时间索引。回滚 SQL 仅删除该索引，不删除观测记录。
2. 同时更新并重启 `BYND-backend`、`bynd-cms-backend`，再发布 CMS 前端。代理服务没有自己的健康数据表，无需配置第二份数据库。
3. 前端检查：`pnpm exec vue-tsc --noEmit`、`pnpm test:wellness`、`pnpm build`。
4. CMS 网关：`go test ./...`。主后端：`go test ./internal/module/cmshealth/...`。
5. 设置 `BYND_TEST_MYSQL_DSN` 后可运行主后端的 `TestCMSExperienceMySQL`。测试会创建并删除独立测试库，验证索引升降级、用户隔离、时区边界、空值/零值、新字段以及私有字段过滤；凭据需有创建和删除数据库权限。

心率每日详情最多返回最近 500 个采样点、100 次主动测量，同时返回总数并在界面提示。主动测量独立列表可分页查阅其他测量，不加载原始波形大字段。
