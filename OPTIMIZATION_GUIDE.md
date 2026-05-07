# Hyperion 优化使用指南

## 快速开始

### 1. 开发模式
```bash
npm run dev
```

### 2. 生产构建
```bash
npm run build
```

---

## 新增功能使用

### 一、控制台 API

在浏览器控制台中使用以下命令：

#### 1.1 关闭向导
```javascript
// 方法一：直接调用
window.closeWizard()

// 方法二：通过 hyperion API
window.hyperion.closeWizard()
```

#### 1.2 重置向导
```javascript
// 重置向导状态（下次运行时显示）
window.resetWizard()
window.hyperion.resetWizard()
```

#### 1.3 显示向导
```javascript
// 立即显示向导
window.showWizard()
window.hyperion.showWizard()
```

#### 1.4 查看版本
```javascript
console.log(window.hyperion.version)
// 输出: "0.5.0"
```

---

### 二、设置页面控制

#### 2.1 重新启动向导
1. 打开设置页面（`/settings`）
2. 滚动到"向导"部分
3. 点击"重新启动向导"按钮

#### 2.2 查看向导状态
- 在设置页面"向导"部分
- 查看状态徽章：
  - 绿色"已完成"：向导已完成
  - 黄色"未完成"：向导未完成

---

### 三、键盘快捷键

#### 3.1 关闭向导
- 按 `ESC` 键关闭向导

#### 3.2 关闭确认
- 如果向导未完成，会弹出确认对话框
- 点击"确定跳过"关闭向导
- 点击"取消"继续向导

---

### 四、日志工具

#### 4.1 开发模式日志
在开发模式下，所有日志都会输出到控制台：

```javascript
import { logger, logEmoji } from '@/utils/logger';

logger.log(`${logEmoji.success} 操作成功`);
logger.info(`${logEmoji.info} 提示信息`);
logger.warn(`${logEmoji.warning} 警告信息`);
logger.error(`${logEmoji.error} 错误信息`);
logger.debug(`${logEmoji.debug} 调试信息`);
```

#### 4.2 生产模式
在生产模式下，只有 `error` 会输出到控制台。

---

### 五、localStorage 缓存

#### 5.1 使用缓存
```javascript
import { LocalStorageCache } from '@/utils/cache';

// 读取（带缓存）
const settings = LocalStorageCache.get('hyperion-settings');

// 写入（自动缓存）
LocalStorageCache.set('hyperion-settings', { theme: 'dark' });

// 删除
LocalStorageCache.remove('hyperion-settings');

// 清空缓存
LocalStorageCache.clear();

// 使缓存失效
LocalStorageCache.invalidate('hyperion-settings');
```

#### 5.2 缓存特性
- TTL: 5 秒
- 自动失效
- 错误处理

---

### 六、向导进度管理

#### 6.1 保存进度
```javascript
import { WizardProgressManager } from '@/utils/wizard-progress';

// 保存进度
WizardProgressManager.save({
  currentStep: 'configure',
  completedSteps: ['welcome', 'detect'],
  timestamp: Date.now(),
  data: { host: '127.0.0.1', port: 9090 }
});
```

#### 6.2 加载进度
```javascript
// 加载进度
const progress = WizardProgressManager.load();
console.log(progress.currentStep); // 'configure'
```

#### 6.3 标记步骤完成
```javascript
// 标记步骤完成
WizardProgressManager.markStepCompleted('detect');
```

#### 6.4 清除进度
```javascript
// 清除进度
WizardProgressManager.clear();
```

---

## 性能优化说明

### 一、localStorage 缓存
- **优化前**：每次读取都访问 localStorage
- **优化后**：5 秒内重复读取使用缓存
- **效果**：减少 I/O 操作，提高响应速度

### 二、日志优化
- **优化前**：所有环境都输出日志
- **优化后**：生产环境只输出错误日志
- **效果**：减少控制台输出，提高性能

### 三、组件渲染优化
- **优化前**：不必要的 createEffect
- **优化后**：合并 effect，减少渲染
- **效果**：更快的页面加载

---

## 用户体验改进

### 一、向导交互
- ✅ 添加关闭按钮（右上角 X）
- ✅ 添加关闭确认对话框
- ✅ 支持 ESC 快捷键
- ✅ 添加帮助提示
- ✅ 添加退出动画

### 二、设置页面
- ✅ 添加向导控制部分
- ✅ 显示向导完成状态
- ✅ 重新启动向导按钮

### 三、动画效果
- ✅ 模态框进入动画
- ✅ 模态框退出动画
- ✅ 平滑过渡效果

---

## 故障排除

### 问题 1：向导无法关闭
**解决方案：**
```javascript
// 在控制台运行
window.closeWizard()
```

### 问题 2：向导一直显示
**解决方案：**
```javascript
// 在控制台运行
window.resetWizard()
// 然后刷新页面
```

### 问题 3：设置无法保存
**解决方案：**
```javascript
// 清除缓存
LocalStorageCache.clear()
// 刷新页面
```

### 问题 4：日志不显示
**说明：**
- 生产环境只显示错误日志
- 开发环境显示所有日志
- 检查 `import.meta.env.DEV` 是否为 true

---

## 开发者工具

### 查看所有 API
```javascript
console.log(window.hyperion)
// 输出: { version: "0.5.0", closeWizard: ƒ, resetWizard: ƒ, showWizard: ƒ }
```

### 查看缓存状态
```javascript
// 查看缓存大小
console.log(LocalStorageCache.cache.size)
```

### 查看向导进度
```javascript
const progress = WizardProgressManager.load()
console.log(progress)
```

---

## 最佳实践

### 1. 使用日志工具
```javascript
// ✅ 推荐
import { logger, logEmoji } from '@/utils/logger';
logger.log(`${logEmoji.success} 操作成功`);

// ❌ 不推荐
console.log('操作成功');
```

### 2. 使用缓存工具
```javascript
// ✅ 推荐
import { LocalStorageCache } from '@/utils/cache';
const settings = LocalStorageCache.get('hyperion-settings');

// ❌ 不推荐
const settings = JSON.parse(localStorage.getItem('hyperion-settings') || '{}');
```

### 3. 使用向导进度管理
```javascript
// ✅ 推荐
import { WizardProgressManager } from '@/utils/wizard-progress';
WizardProgressManager.save(progress);

// ❌ 不推荐
localStorage.setItem('wizard-progress', JSON.stringify(progress));
```

---

## 更新日志

### v0.5.0+ (2026-05-07)
- ✅ 添加日志工具
- ✅ 添加 localStorage 缓存
- ✅ 添加向导进度管理
- ✅ 优化向导交互
- ✅ 添加设置页面控制
- ✅ 添加键盘快捷键
- ✅ 添加动画效果
- ✅ 改进错误处理
- ✅ 添加类型安全

---

**优化完成！🎉**
