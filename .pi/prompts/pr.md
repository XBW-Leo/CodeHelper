---
description: 基于当前分支创建或更新 Pull Request
argument-hint: "[title]"
---
请基于当前分支的改动创建或更新 Pull Request。标题：${@:-自动生成}

步骤：
1. 确认当前分支、已提交改动与远端状态（`git status`、`git log`、`git diff origin/main...HEAD`）。
2. 生成规范化的 PR 标题与描述：背景、改动内容、测试方式、相关 issue（如需自动关闭使用 `closes #N`）。
3. 若远端没有对应分支，先推送：`git push -u origin <branch>`。
4. 用 `gh pr create` 创建 PR；若 PR 已存在，用 `gh pr edit` 更新标题与描述。
5. 报告 PR 链接。

推荐模型档位：light（flash 级）。
