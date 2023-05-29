import { forwardRef, ReactNode, Ref } from 'react';

// next
import Head from 'next/head';

// material-ui
import { Box, BoxProps } from '@mui/material';

// ==============================|| Page - SET TITLE & META TAGS ||============================== //

interface Props extends BoxProps {
  children: ReactNode;
  meta?: ReactNode;
  title: string;
}

const Page = forwardRef<HTMLDivElement, Props>(({ children, title = '', meta, ...other }: Props, ref: Ref<HTMLDivElement>) => (
  <>
    <Head>
      <title>{`${title} | Berry - React Material Admin Dashboard Template`}</title>
      {meta}
    </Head>

    <Box ref={ref} {...other}>
      {children}
    </Box>
  </>
));

export default Page;
