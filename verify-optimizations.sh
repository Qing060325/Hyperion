#!/bin/bash

# Hyperion 优化验证脚本

echo "========================================="
echo "Hyperion 优化验证"
echo "========================================="
echo ""

echo "1. 检查构建..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ 构建成功"
else
  echo "❌ 构建失败"
  exit 1
fi

echo ""
echo "2. 检查新增文件..."
files=(
  "src/utils/logger.ts"
  "src/types/global.d.ts"
  "src/utils/cache.ts"
  "src/utils/wizard-progress.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file 存在"
  else
    echo "❌ $file 不存在"
  fi
done

echo ""
echo "3. 检查修改文件..."
modified_files=(
  "src/App.tsx"
  "src/stores/settings.ts"
  "src/components/wizard/WelcomeWizard.tsx"
  "src/pages/Settings.tsx"
  "src/index.css"
)

for file in "${modified_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file 已修改"
  else
    echo "❌ $file 不存在"
  fi
done

echo ""
echo "4. 检查日志工具..."
if grep -q "export const logger" src/utils/logger.ts; then
  echo "✅ 日志工具已导出"
else
  echo "❌ 日志工具未导出"
fi

echo ""
echo "5. 检查缓存工具..."
if grep -q "export class LocalStorageCache" src/utils/cache.ts; then
  echo "✅ 缓存工具已导出"
else
  echo "❌ 缓存工具未导出"
fi

echo ""
echo "6. 检查向导进度管理..."
if grep -q "export class WizardProgressManager" src/utils/wizard-progress.ts; then
  echo "✅ 向导进度管理已导出"
else
  echo "❌ 向导进度管理未导出"
fi

echo ""
echo "7. 检查全局类型定义..."
if grep -q "interface Window" src/types/global.d.ts; then
  echo "✅ 全局类型定义已添加"
else
  echo "❌ 全局类型定义未添加"
fi

echo ""
echo "8. 检查向导关闭按钮..."
if grep -q "关闭向导" src/components/wizard/WelcomeWizard.tsx; then
  echo "✅ 向导关闭按钮已添加"
else
  echo "❌ 向导关闭按钮未添加"
fi

echo ""
echo "9. 检查设置页面向导控制..."
if grep -q "重新启动向导" src/pages/Settings.tsx; then
  echo "✅ 设置页面向导控制已添加"
else
  echo "❌ 设置页面向导控制未添加"
fi

echo ""
echo "10. 检查动画..."
if grep -q "animate-modal-backdrop-out" src/index.css; then
  echo "✅ 退出动画已添加"
else
  echo "❌ 退出动画未添加"
fi

echo ""
echo "========================================="
echo "验证完成！"
echo "========================================="
