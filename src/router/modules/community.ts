import { AppRouteRecord } from '@/types/router'

export const communityRoutes: AppRouteRecord = {
  path: '/community',
  name: 'Community',
  component: '/index/index',
  meta: {
    title: 'menus.community.title',
    icon: 'ri:group-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'groups',
      name: 'CommunityGroups',
      component: '/community/groups',
      meta: { title: 'menus.community.groups', icon: 'ri:team-line', keepAlive: true }
    },
    {
      path: 'challenges',
      name: 'CommunityChallenges',
      component: '/community/challenges',
      meta: { title: 'menus.community.challenges', icon: 'ri:trophy-line', keepAlive: true }
    }
  ]
}
