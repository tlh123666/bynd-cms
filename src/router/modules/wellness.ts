import { AppRouteRecord } from '@/types/router'

export const wellnessRoutes: AppRouteRecord = {
  path: '/wellness',
  name: 'Wellness',
  component: '/index/index',
  meta: {
    title: 'menus.wellness.title',
    icon: 'ri:heart-pulse-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'sleep',
      name: 'WellnessSleep',
      component: '/wellness/sleep',
      meta: { title: 'menus.wellness.sleep', icon: 'ri:moon-line', keepAlive: true }
    },
    {
      path: 'journals',
      name: 'WellnessJournals',
      component: '/wellness/journals',
      meta: { title: 'menus.wellness.journals', icon: 'ri:book-open-line', keepAlive: true }
    },
    {
      path: 'heart-rate',
      name: 'WellnessHeartRate',
      component: '/wellness/heart-rate',
      meta: { title: 'menus.wellness.heartRate', icon: 'ri:pulse-line', keepAlive: true }
    }
  ]
}
