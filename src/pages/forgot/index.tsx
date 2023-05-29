import { ReactElement } from 'react';
import Link from 'Link';
// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider, Grid, Typography, useMediaQuery } from '@mui/material';

// project imports
import LAYOUT from 'constant';
import Layout from 'layout';
import Page from 'components/ui-component/Page';
import AuthWrapper1 from 'components/authentication/AuthWrapper1';
import AuthCardWrapper from 'components/authentication/AuthCardWrapper';
import Logo from 'ui-component/Logo';
import AuthForgotPassword from 'components/authentication/auth-forms/AuthForgotPassword';
import AuthFooter from 'ui-component/cards/AuthFooter';

// ============================|| AUTH3 - FORGOT PASSWORD ||============================ //

const ForgotPassword = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Page title="Forgot Password">
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
                      <Grid container alignItems="center" justifyContent="center" textAlign="center" spacing={2}>
                        <Grid item xs={12}>
                          <Typography color={theme.palette.secondary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
                            Forgot password?
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" fontSize="16px" textAlign="center">
                            Enter your email address below and we&apos;ll send you password reset OTP.
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <AuthForgotPassword />
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Grid item container direction="column" alignItems="center" xs={12}>
                        <Typography component={Link} href="/login" variant="subtitle1" sx={{ textDecoration: 'none' }}>
                          Already have an account?
                        </Typography>
                      </Grid>
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

ForgotPassword.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.noauth}>{page}</Layout>;
};

export default ForgotPassword;
