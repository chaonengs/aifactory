import { ReactElement } from 'react';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Button, Card, CardContent, CardMedia, Grid, TextField, Typography } from '@mui/material';

// third party
import { useTimer } from 'react-timer-hook';

// project imports
import LAYOUT from 'constant';
import Layout from 'layout';
import Page from 'components/ui-component/Page';

import { gridSpacing } from 'store/constant';

// assets
const imageGrid = '/assets/images/maintenance/img-soon-grid.svg';
const imageDarkGrid = '/assets/images/maintenance/img-soon-grid-dark.svg';
const imageBlock = '/assets/images/maintenance/img-soon-block.svg';
const imageBlueBlock = '/assets/images/maintenance/img-soon-blue-block.svg';
const imagePurpleBlock = '/assets/images/maintenance/img-soon-purple-block.svg';

import NotificationsActiveTwoToneIcon from '@mui/icons-material/NotificationsActiveTwoTone';

// styles
const CardMediaWrapper = styled('div')({
  maxWidth: 720,
  margin: '0 auto',
  position: 'relative'
});

const PageContentWrapper = styled('div')({
  maxWidth: 450,
  margin: '0 auto',
  textAlign: 'center'
});

const TimerWrapper = styled('div')({
  maxWidth: 450,
  margin: '0 auto'
});

const ComingSoonCard = styled(Card)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const TimeBlock = styled('div')(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.secondary.light,
  color: theme.palette.mode === 'dark' ? theme.palette.dark.light : theme.palette.secondary.main,
  borderRadius: '12px',
  padding: '24px 0',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: '3rem'
}));

const CardMediaBlock = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  animation: '8s blink ease-in-out infinite'
});

const CardMediaBlue = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  animation: '15s wings ease-in-out infinite'
});

const CardMediaPurple = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  animation: '12s wings ease-in-out infinite'
});

// ===========================|| COMING SOON 2 ||=========================== //

const ComingSoon3 = () => {
  const theme = useTheme();
  const time = new Date();
  time.setSeconds(time.getSeconds() + 3600 * 24 * 2 - 3600 * 15.5);

  const { seconds, minutes, hours, days } = useTimer({ expiryTimestamp: time });

  return (
    <Page title="Coming Soon">
      <ComingSoonCard>
        <CardContent>
          <Grid container justifyContent="center" spacing={gridSpacing}>
            <Grid item xs={12}>
              <PageContentWrapper>
                <Grid container spacing={gridSpacing}>
                  <Grid item xs={12}>
                    <Typography variant="h1">Coming Soon</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1">Something new is on it&apos;s way</Typography>
                  </Grid>
                </Grid>
              </PageContentWrapper>
            </Grid>
            <Grid item xs={12}>
              <CardMediaWrapper>
                <CardMedia component="img" image={theme.palette.mode === 'dark' ? imageDarkGrid : imageGrid} title="Slider5 image" />
                <CardMediaBlock src={imageBlock} title="Slider 1 image" />
                <CardMediaBlue src={imageBlueBlock} title="Slider 2 image" />
                <CardMediaPurple src={imagePurpleBlock} title="Slider 3 image" />
              </CardMediaWrapper>
            </Grid>
            <Grid item xs={12}>
              <TimerWrapper>
                <Grid container spacing={gridSpacing}>
                  <Grid item xs={3}>
                    <TimeBlock>{days}</TimeBlock>
                  </Grid>
                  <Grid item xs={3}>
                    <TimeBlock>{hours}</TimeBlock>
                  </Grid>
                  <Grid item xs={3}>
                    <TimeBlock>{minutes}</TimeBlock>
                  </Grid>
                  <Grid item xs={3}>
                    <TimeBlock>{seconds}</TimeBlock>
                  </Grid>
                </Grid>
              </TimerWrapper>
            </Grid>

          </Grid>
        </CardContent>
      </ComingSoonCard>
    </Page>
  );
};

ComingSoon3.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.minimal}>{page}</Layout>;
};

export {ComingSoon3 as ComingSoon};

export default ComingSoon3;
