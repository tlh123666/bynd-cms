import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { communityRoutes } from './community'
import { wellnessRoutes } from './wellness'
import { contentRoutes } from './content'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  communityRoutes,
  wellnessRoutes,
  contentRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
