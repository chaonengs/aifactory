import { Theme } from 'next-auth';
import * as React from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { Stack } from '@mui/system';
import Logo from 'ui-component/Logo';

interface VerifyRequestPageProps {
  url: URL;
  theme: Theme;
}

export default function VerifyRequestPage(props: VerifyRequestPageProps) {
  // const { url, theme } = props;

  return (
    <>
      {/* {theme.brandColor && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --brand-color: ${theme.brandColor}
          }
        `
          }}
        />
      )} */}
      
      <Box className="verify-request card"  display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh">
        {/* {theme.logo && <img src={theme.logo} alt="Logo" className="logo" />} */}
        <Stack spacing={5} sx={{padding: 24, border: 1}}>
          <Logo></Logo>
        <Typography variant='h1' component={'h1'}>        检查你的邮箱</Typography>
        <Typography variant='h3' component={'h3'}>           登录邮件已发送到你的邮箱，请点击邮件中的链接登录</Typography>
        </Stack>

     
        <p>
          {/* <a className="site" href={url.origin}>
            {url.host}
          </a> */}
        </p>
      </Box>
      </>
  );
}
