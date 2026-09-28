# 打点计时器场景审计

日期：2026-09-27  
项目：`office-ubuntu-vm:/home/tdcasual/codework/HighSchoolPyhsics`

## 参考

Dmit 公共实验目录没有打点计时器同款演示：[Dmit 实验目录](https://dmit.20030624.xyz/labs.html)。教学结构参考[享物理：用打点计时器测速度](https://enjoyphysics.cn/Article1993)，其中区分电磁打点器 4–6 V AC 与电火花计时器专用 220 V AC，并说明 50 Hz 的点间隔为 0.020 s。逐差法和速度—时间图参考[IOP Spark：Finding average acceleration with a ticker-timer](https://spark.iop.org/finding-average-acceleration-ticker-timer)。

本地场景将低电压漏点与高电压拖尾作为定性故障演示，阈值不是器材标定值。匀速模式把速度作为外部拉动约束；匀加速模式扣除纸带阻力；静止模式模拟计时器在纸带未移动时叠点。

## 审计发现与修复

1. **漏点使图表时间轴失真。** 旧图按样本索引均匀排点。现按各纸带点的真实时间计算区间速度及区间中点，图上横轴采用真实秒数，纵轴采用 m/s。
2. **静止记录无法停止。** 零位移不会触发长度上限。现按 240 个周期结束记录，结束后必须重置才可重新通电。
3. **纸带几何与记录长度不一致。** 纸带长度按 1.2 m 行程和 0.5 m 尾纸统一计算，移除纸带末端的红色假挡块。点迹改为贴纸面的平面印迹和拖尾。
4. **电火花结构遮挡和接触不明。** 将不透明头部改为开放框架，墨粉盘压在纸带边缘并随纸带无滑动转动；增加 220 V 专用脉冲电源与教师指导安全提示。
5. **信息浮层遮住装置。** 三块浮层初始折叠，桌面展开后排成两列，窄屏不横向溢出。全部展开时仍覆盖部分画布，用户可折叠或拖动；默认态优先展示三维装置。
6. **实验控制锁与数据分析边界。** 通电或已有点迹时不能改实验参数。漏点造成时间间隔不等时，不提供等间隔逐差加速度；实测时间仍进入速度—时间图。

## 验收记录

- Playwright 桌面/手机流程覆盖默认与展开浮层、50 Hz 清晰点迹、低压漏点、非均匀时间轴、高压拖尾、静止记录结束和复位、电火花警示、运动态装置变化，以及 390 px 横向溢出和浏览器错误。
- `npx vitest run src/scenes/ticker-timer src/ui/layout --reporter=dot`：6 个测试文件、34 项通过。
- 场景与共享布局 ESLint、`npm run build`、`git diff --check` 通过。
- 构建输出保留仓库已有提示：Three.js 共享 chunk 超过 500 kB，Browserslist 数据过旧。
- 浏览器截图：远端 `output/playwright/ticker-timer-audit/`。
