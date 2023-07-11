import { ReactElement, ReactNode, useEffect } from 'react';

// global styles
import '../styles/globals.css';
import '../scss/style.scss';

// next
import { NextPage } from 'next';
import type { AppProps } from 'next/app';

// third-party
import { Provider } from 'react-redux';

// project-import
import ThemeCustomization from '../themes';
import NavigationScroll from '../layout/NavigationScroll';
import RTLLayout from 'ui-component/RTLLayout';
import Locales from 'ui-component/Locales';
import { ConfigProvider } from '../contexts/ConfigContext';
import { SessionProvider } from "next-auth/react"
import { store } from '../store';
import Snackbar from 'ui-component/extended/Snackbar';
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import useConfig from 'hooks/useConfig';

import Script from 'next/script'
import { init } from "imean-sdk"
import { env } from 'process';



// types
type LayoutProps = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

interface Props {
  Component: LayoutProps;
}

function MyApp({ Component, pageProps: { session, ...pageProps }, }: AppProps & Props) {
  const getLayout = Component.getLayout ?? ((page: any) => page);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IMEAN_ENABLE){
      init({
        projectId: 'wNlfTXpjYv1qBj6swF-FW', // 项目id
        baseUrl: 'https://useimean.com', // 请求服务器地址
        onStepChange:function ({
          recording, // 经验对象
          currentIndex, // 当前步骤数组下标
        }) { }, // 引导中步骤变化
        onFinish:function ({
          recording, // 经验对象
        }) { }, // 引导步骤完成
        onExit:function ({
          recording, // 经验对象
        }) { }, // 引导中主动退出
        identity:function () {
          return {}
        }, // 返回用户信息
        hideHelp: false, // 设置为false即展示帮助中心
        })

    }
    
}, []);

  return (
    <>
    <Provider store={store}>
      <ConfigProvider>
        <ThemeCustomization>
          <RTLLayout>
            <Locales>
              <NavigationScroll>
                <SessionProvider session={session}>
                  <>
                    {getLayout(<Component {...pageProps} />)}
                    <ToastContainer theme={useConfig().navType || 'light'}/>
                    <Snackbar />
                  </>
                </SessionProvider>
              </NavigationScroll>
            </Locales>
          </RTLLayout>
        </ThemeCustomization>
      </ConfigProvider>
    </Provider>
    </>
  );
}

export default MyApp;
