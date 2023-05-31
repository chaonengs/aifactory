import pages from './pages';
import other from './other';
import { NavItemType } from 'types';




// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { IconApps, IconAsset, IconBrain, IconBrandChrome, IconBuildingStore, IconHelp, IconHistory, IconSitemap, IconSquareAsterisk } from '@tabler/icons-react';
import { IconMessage2 } from '@tabler/icons-react';


// ==============================|| SAMPLE PAGE & DOCUMENTATION MENU ITEMS ||============================== //

const menus = {
  id: 'main-items',
  type: 'group',
  children: [
    {
      id: 'ai-resources',
      title: <FormattedMessage id="ai-resources" />,
      type: 'item',
      url: '/resources',
      icon: IconBrain,
      breadcrumbs: false
    },
    {
      id: 'messages',
      type: 'collapse',
      icon: IconMessage2,
      title: <FormattedMessage id="messages" />,
      children: [
        {
          id: 'message-history',
          title: <FormattedMessage id="message-history" />,
          type: 'item',
          url: '/messages/history',
          icon: IconHistory,
          breadcrumbs: false
        },
        {
          id: 'sensitive-words',
          title: <FormattedMessage id="sensitive-words" />,
          type: 'item',
          url: '/messages/sensitive',
          icon: IconSquareAsterisk,
          breadcrumbs: false
        }
      ]
    },
    {
      id: 'ai-apps',
      type: 'collapse',
      icon: IconApps,
      title: <FormattedMessage id="ai-apps" />,
      children: [
        {
          id: 'my-apps',
          title: <FormattedMessage id="my-apps" />,
          type: 'item',
          url: '/apps/my',
          icon: IconAsset,
          breadcrumbs: false
        },
        {
          id: 'app-market',
          title: <FormattedMessage id="app-market" />,
          type: 'item',
          url: '/apps/market',
          icon: IconBuildingStore,
          breadcrumbs: false
        }
      ]
    }
  ]
};


const messages = {
  id: 'messages',
  type: 'collapse',
  title: <FormattedMessage id="messages" />,
  children: [
    {
      id: 'message-history',
      title: <FormattedMessage id="message-history" />,
      type: 'item',
      url: '/messages/history',
      icon: IconHistory,
      breadcrumbs: false
    },
    {
      id: 'sensitive-words',
      title: <FormattedMessage id="sensitive-words" />,
      type: 'item',
      url: '/messages/sensitive',
      icon: IconSquareAsterisk,
      breadcrumbs: false
    }
  ]
}

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [menus]
};

export default menuItems;