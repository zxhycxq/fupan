# VIP 功能集成示例

本文档提供各个页面集成VIP功能的具体代码示例。

---

## 1. 考试记录上传页面

**文件**：`src/pages/UploadPage.tsx`

### 实现要点
- 上传前检查记录数量限制
- 免费用户最多3条记录
- 达到限制时显示VIP升级弹窗

### 代码示例

```typescript
import { useState } from 'react'
import { Button, message } from 'antd'
import { Upload } from 'lucide-react'
import { canCreateExamRecord } from '@/db/api'
import { VipBenefitsModal } from '@/components/common/VipBenefitsModal'
import { VipBadge } from '@/components/common/VipBadge'

export function UploadPage() {
  const [showVipModal, setShowVipModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    try {
      setUploading(true)

      // 检查是否可以创建新记录
      const permission = await canCreateExamRecord()
      
      if (!permission.canCreate) {
        // 显示VIP升级提示
        message.warning({
          content: (
            <div className="flex items-center gap-2">
              <VipBadge size="sm" />
              <span>{permission.reason}</span>
            </div>
          ),
          duration: 5,
        })
        setShowVipModal(true)
        return
      }

      // 继续上传流程
      // ... 你的上传逻辑
      
    } catch (error) {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Button
        type="primary"
        icon={<Upload />}
        onClick={handleUpload}
        loading={uploading}
      >
        上传考试成绩
      </Button>

      <VipBenefitsModal
        open={showVipModal}
        onClose={() => setShowVipModal(false)}
        currentFeature="unlimited-records"
      />
    </div>
  )
}
```

---

## 2. 数据总览页面 - 导出Excel

**文件**：`src/pages/DataOverview.tsx`

### 实现要点
- 导出按钮需要VIP权限
- 使用 VipFeatureWrapper 包装
- 点击时自动显示VIP弹窗

### 代码示例

```typescript
import { Button } from 'antd'
import { Download } from 'lucide-react'
import { VipFeatureWrapper } from '@/components/common/VipFeatureWrapper'
import { exportToExcel } from '@/utils/excel'

export function DataOverview() {
  const handleExport = async () => {
    try {
      // 导出Excel逻辑
      await exportToExcel(data, '考试记录总览')
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  return (
    <div>
      <VipFeatureWrapper 
        featureName="export-excel"
        tooltip="导出Excel需要VIP会员"
      >
        <Button
          type="primary"
          icon={<Download />}
          onClick={handleExport}
        >
          导出Excel
        </Button>
      </VipFeatureWrapper>
    </div>
  )
}
```

---

## 3. 模块分析页面 - 导出Excel

**文件**：`src/pages/ModuleAnalysis.tsx`

### 代码示例

```typescript
import { Button, Space } from 'antd'
import { Download } from 'lucide-react'
import { VipFeatureWrapper } from '@/components/common/VipFeatureWrapper'

export function ModuleAnalysis() {
  const handleExportModuleData = async () => {
    // 导出模块详细数据
    await exportToExcel(moduleData, '模块详细数据')
  }

  const handleExportTrendChart = async () => {
    // 导出趋势图表
    await exportChartToExcel(chartData, '模块趋势分析')
  }

  return (
    <div>
      <Space>
        <VipFeatureWrapper featureName="export-excel">
          <Button icon={<Download />} onClick={handleExportModuleData}>
            导出模块数据
          </Button>
        </VipFeatureWrapper>

        <VipFeatureWrapper featureName="export-excel">
          <Button icon={<Download />} onClick={handleExportTrendChart}>
            导出趋势图表
          </Button>
        </VipFeatureWrapper>
      </Space>
    </div>
  )
}
```

---

## 4. 设置页面 - 主题肤色设置

**文件**：`src/pages/Settings.tsx`

### 实现要点
- 主题设置区域需要VIP权限
- 使用 VipFeatureWrapper 包装整个设置区域
- 显示VIP标识在标题旁

### 代码示例

```typescript
import { Card, Radio, Space } from 'antd'
import { Palette } from 'lucide-react'
import { VipFeatureWrapper } from '@/components/common/VipFeatureWrapper'
import { VipBadge } from '@/components/common/VipBadge'
import { useVipFeature } from '@/hooks/useVipStatus'

export function Settings() {
  const { hasAccess } = useVipFeature('theme-settings')
  const [theme, setTheme] = useState('default')

  return (
    <div className="space-y-6">
      {/* 主题肤色设置 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5" />
          <h3 className="text-lg font-semibold">主题肤色设置</h3>
          {!hasAccess && <VipBadge size="sm" showText />}
        </div>

        <VipFeatureWrapper 
          featureName="theme-settings"
          showBadge={false}
        >
          <Radio.Group 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="default">默认主题</Radio>
              <Radio value="blue">蓝色主题</Radio>
              <Radio value="green">绿色主题</Radio>
              <Radio value="purple">紫色主题</Radio>
            </Space>
          </Radio.Group>
        </VipFeatureWrapper>
      </Card>

      {/* 等级称谓设置 */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5" />
          <h3 className="text-lg font-semibold">等级称谓设置</h3>
          {!hasAccess && <VipBadge size="sm" showText />}
        </div>

        <VipFeatureWrapper 
          featureName="rank-settings"
          showBadge={false}
        >
          <Radio.Group 
            value={rankTheme} 
            onChange={(e) => setRankTheme(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="theme1">学霸系列</Radio>
              <Radio value="theme2">武侠系列</Radio>
              <Radio value="theme3">军衔系列</Radio>
              <Radio value="theme4">段位系列</Radio>
            </Space>
          </Radio.Group>
        </VipFeatureWrapper>
      </Card>
    </div>
  )
}
```

---

## 5. 考试记录列表 - 显示VIP状态

**文件**：`src/pages/ExamRecords.tsx`

### 实现要点
- 显示当前记录数和限制
- VIP用户显示无限制标识
- 免费用户显示升级提示

### 代码示例

```typescript
import { useEffect, useState } from 'react'
import { Alert, Button, Space } from 'antd'
import { Crown, AlertCircle } from 'lucide-react'
import { canCreateExamRecord } from '@/db/api'
import { VipBadge } from '@/components/common/VipBadge'

export function ExamRecords() {
  const [permission, setPermission] = useState<any>(null)
  const [showVipModal, setShowVipModal] = useState(false)

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    const result = await canCreateExamRecord()
    setPermission(result)
  }

  return (
    <div className="space-y-4">
      {/* VIP状态提示 */}
      {permission && (
        <Alert
          type={permission.isVip ? 'success' : 'info'}
          icon={permission.isVip ? <Crown /> : <AlertCircle />}
          message={
            <div className="flex items-center justify-between">
              <span>
                {permission.isVip ? (
                  <>
                    <VipBadge size="sm" className="mr-2" />
                    VIP会员 - 无限制上传考试记录
                  </>
                ) : (
                  <>
                    当前记录：{permission.currentCount}/{permission.maxCount}
                    {permission.currentCount >= permission.maxCount && (
                      <span className="text-red-500 ml-2">
                        已达上限
                      </span>
                    )}
                  </>
                )}
              </span>
              {!permission.isVip && (
                <Button
                  type="link"
                  icon={<Crown />}
                  onClick={() => setShowVipModal(true)}
                >
                  升级VIP
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* 考试记录列表 */}
      {/* ... */}
    </div>
  )
}
```

---

## 6. 用户中心 - VIP状态展示

**文件**：`src/pages/Profile.tsx`

### 实现要点
- 显示VIP类型和到期时间
- 显示剩余天数
- 提供续费入口

### 代码示例

```typescript
import { Card, Tag, Button, Progress } from 'antd'
import { Crown, Calendar, Clock } from 'lucide-react'
import { useVipStatus } from '@/hooks/useVipStatus'

export function Profile() {
  const { vipStatus, loading } = useVipStatus()

  const getVipTypeLabel = (type?: string) => {
    switch (type) {
      case 'quarter':
        return '季度会员'
      case 'year':
        return '年度会员'
      default:
        return '免费用户'
    }
  }

  const getProgressPercent = () => {
    if (!vipStatus.daysRemaining) return 0
    const totalDays = vipStatus.vipType === 'quarter' ? 90 : 365
    return Math.round((vipStatus.daysRemaining / totalDays) * 100)
  }

  return (
    <div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crown className={`w-8 h-8 ${vipStatus.isVip ? 'text-yellow-600 fill-yellow-500' : 'text-gray-400'}`} />
            <div>
              <h3 className="text-xl font-semibold">
                {vipStatus.isVip ? 'VIP会员' : '免费用户'}
              </h3>
              <Tag color={vipStatus.isVip ? 'gold' : 'default'}>
                {getVipTypeLabel(vipStatus.vipType)}
              </Tag>
            </div>
          </div>

          {!vipStatus.isVip && (
            <Button
              type="primary"
              size="large"
              icon={<Crown />}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600"
            >
              升级VIP
            </Button>
          )}
        </div>

        {vipStatus.isVip && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>到期时间：{vipStatus.vipEndDate}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>剩余天数：{vipStatus.daysRemaining} 天</span>
            </div>

            <Progress 
              percent={getProgressPercent()} 
              strokeColor={{
                '0%': '#faad14',
                '100%': '#fa8c16',
              }}
            />

            <Button type="default" block>
              续费VIP
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
```

---

## 7. 通用提示组件

### 创建全局VIP提示Hook

**文件**：`src/hooks/useVipPrompt.ts`

```typescript
import { message } from 'antd'
import { VipBadge } from '@/components/common/VipBadge'

export function useVipPrompt() {
  const showVipRequired = (featureName: string) => {
    const featureNames: Record<string, string> = {
      'export-excel': '导出Excel',
      'theme-settings': '主题肤色设置',
      'rank-settings': '等级称谓设置',
      'unlimited-records': '无限考试记录',
    }

    message.warning({
      content: (
        <div className="flex items-center gap-2">
          <VipBadge size="sm" />
          <span>{featureNames[featureName] || '该功能'}需要VIP会员权限</span>
        </div>
      ),
      duration: 5,
    })
  }

  return { showVipRequired }
}
```

### 使用示例

```typescript
import { useVipPrompt } from '@/hooks/useVipPrompt'
import { useVipFeature } from '@/hooks/useVipStatus'

export function MyComponent() {
  const { hasAccess } = useVipFeature('export-excel')
  const { showVipRequired } = useVipPrompt()

  const handleExport = () => {
    if (!hasAccess) {
      showVipRequired('export-excel')
      return
    }

    // 执行导出逻辑
  }

  return <Button onClick={handleExport}>导出</Button>
}
```

---

## 8. 路由守卫示例

### 保护VIP专属页面

**文件**：`src/components/VipRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom'
import { useVipStatus } from '@/hooks/useVipStatus'
import { Spin } from 'antd'

interface VipRouteProps {
  children: React.ReactNode
}

export function VipRoute({ children }: VipRouteProps) {
  const { vipStatus, loading } = useVipStatus()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  if (!vipStatus.isVip) {
    return <Navigate to="/vip" replace />
  }

  return <>{children}</>
}
```

### 在路由中使用

```typescript
import { VipRoute } from '@/components/VipRoute'

const routes = [
  {
    path: '/advanced-analysis',
    element: (
      <VipRoute>
        <AdvancedAnalysisPage />
      </VipRoute>
    ),
  },
]
```

---

## 总结

以上示例涵盖了VIP功能在各个页面的集成方式。关键要点：

1. **上传限制**：使用 `canCreateExamRecord()` 检查
2. **功能限制**：使用 `VipFeatureWrapper` 包装
3. **状态显示**：使用 `useVipStatus` Hook
4. **提示信息**：使用 `VipBenefitsModal` 弹窗
5. **视觉标识**：使用 `VipBadge` 组件

所有组件和Hook都已实现，可以直接在项目中使用。
