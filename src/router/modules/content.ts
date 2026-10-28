import { AppRouteRecord } from '@/types/router'

export const contentRoutes: AppRouteRecord = {
  path: '/content',
  name: 'ContentManagement',
  component: '/index/index',
  meta: { title: 'menus.content.title', icon: 'ri:book-open-line', roles: ['R_SUPER', 'R_ADMIN'] },
  children: [
    {
      path: 'reading',
      name: 'ReadingManagement',
      component: '/content/reading',
      meta: { title: 'menus.content.reading', icon: 'ri:book-2-line', keepAlive: true }
    },
    {
      path: 'guidance',
      name: 'GuidanceManagement',
      component: '/content/guidance',
      meta: { title: 'menus.content.guidance', icon: 'ri:guide-line', keepAlive: true }
    }
  ]
}
