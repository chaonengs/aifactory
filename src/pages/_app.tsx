import { ReactElement, ReactNode } from 'react';

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

// types
type LayoutProps = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

interface Props {
  Component: LayoutProps;
}

function MyApp({ Component, pageProps: { session, ...pageProps }, }: AppProps & Props) {
  const getLayout = Component.getLayout ?? ((page: any) => page);

  return (
    <Provider store={store}>
      <ConfigProvider>
        <ThemeCustomization>
          <RTLLayout>
            <Locales>
              <NavigationScroll>
                <SessionProvider session={session}>
                  <>
                    {getLayout(<Component {...pageProps} />)}
                    <Snackbar />
                  </>
                </SessionProvider>
              </NavigationScroll>
            </Locales>
          </RTLLayout>
        </ThemeCustomization>
      </ConfigProvider>
    </Provider>
  );
}

export default MyApp;
