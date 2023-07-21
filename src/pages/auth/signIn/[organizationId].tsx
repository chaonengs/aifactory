import { ReactElement, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import Link from '../../../Link';
import { useRouter } from 'next/router'


// project imports
import LAYOUT from 'constant';
import Layout from 'layout';
import Page from 'components/ui-component/Page';
import AuthWrapper1 from 'components/authentication/AuthWrapper1';
import AuthCardWrapper from 'components/authentication/AuthCardWrapper';
import AuthLogin from 'components/authentication/auth-forms/AuthLogin';
import Logo from 'ui-component/Logo';
import AuthFooter from 'ui-component/cards/AuthFooter';
import { useOrganizationWithProviders, useProviders } from 'feed';
import AuthLoginOrg from 'components/authentication/auth-forms/AuthLoginOrg';

// ================================|| SignIn ||================================ //

const SignIn = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const {organization ,isLoading} = useOrganizationWithProviders(router.query.organizationId)

  return (
    <Page title="SignIn">
      <AuthWrapper1>
        <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
          <Grid item xs={12}>
            <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 68px)' }}>
              <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
                <AuthCardWrapper>
                  <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item sx={{ mb: 3 }}>
                      <Link href="#">
                        <Logo />
                      </Link>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container direction={matchDownSM ? 'column-reverse' : 'row'} alignItems="center" justifyContent="center">
                        <Grid item>
                          <Stack alignItems="center" justifyContent="center" spacing={1}>
                            <Typography color={theme.palette.secondary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
                              {!isLoading && organization ? organization.name : ''} 欢迎你
                            </Typography>
                            <Typography variant="caption" fontSize="16px" textAlign={matchDownSM ? 'center' : 'inherit'}>
                              {/* 请登录 */}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                     {!isLoading && organization && <AuthLoginOrg providers={organization.providers} />}
                    </Grid>
                  </Grid>
                </AuthCardWrapper>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ m: 3, mt: 1 }}>
            <AuthFooter />
          </Grid>
        </Grid>
      </AuthWrapper1>
    </Page>
  );
};

SignIn.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.noauth}>{page}</Layout>;
};

export default SignIn;
