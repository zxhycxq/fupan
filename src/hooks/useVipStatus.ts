import { useState, useEffect } from 'react'
import { supabase } from '@/db/supabase'

export interface VipStatus {
  isVip: boolean
  vipType?: 'quarter' | 'year'
  vipEndDate?: string
  daysRemaining?: number
}

/**
 * VIP 权限检查 Hook
 * 用于检查用户的 VIP 状态和权限
 */
export function useVipStatus() {
  const [vipStatus, setVipStatus] = useState<VipStatus>({
    isVip: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkVipStatus()
  }, [])

  const checkVipStatus = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setVipStatus({ isVip: false })
        return
      }

      const { data, error } = await supabase
        .from('user_vip')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('查询VIP状态失败:', error)
        setVipStatus({ isVip: false })
        return
      }

      if (!data) {
        setVipStatus({ isVip: false })
        return
      }

      const endDate = new Date(data.vip_end_date)
      const now = new Date()
      const isExpired = endDate < now
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      setVipStatus({
        isVip: data.is_vip && !isExpired,
        vipType: data.vip_type,
        vipEndDate: data.vip_end_date,
        daysRemaining: isExpired ? 0 : daysRemaining,
      })
    } catch (error) {
      console.error('检查VIP状态失败:', error)
      setVipStatus({ isVip: false })
    } finally {
      setLoading(false)
    }
  }

  // 刷新VIP状态
  const refreshVipStatus = () => {
    checkVipStatus()
  }

  return {
    vipStatus,
    loading,
    refreshVipStatus,
  }
}

/**
 * VIP 功能权限检查
 * 用于检查特定功能是否需要 VIP 权限
 */
export function useVipFeature(featureName: string) {
  const { vipStatus, loading } = useVipStatus()

  // 定义需要 VIP 的功能列表
  const vipFeatures = [
    'export-excel',           // 导出Excel
    'theme-settings',         // 主题肤色设置
    'rank-settings',          // 等级称谓设置
    'unlimited-records',      // 无限考试记录
  ]

  const requiresVip = vipFeatures.includes(featureName)
  const hasAccess = !requiresVip || vipStatus.isVip

  return {
    requiresVip,
    hasAccess,
    vipStatus,
    loading,
  }
}
