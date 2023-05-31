import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Button, Card, CardActions, CardContent, Paper, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { styled, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

// project imports
import ResourceList from 'components/application/aifactory/ResourceList';
import Page from 'components/ui-component/Page';
import LAYOUT from 'constant';
import Layout from 'layout';
import React, { ReactElement } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import { DataGridPremium } from '@mui/x-data-grid-premium';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import AppCard from 'components/application/aifactory/AppCard';

const MyApps = () => {
  const theme = useTheme();

  const [tabValue, setTabValue] = React.useState('openai');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };


  return (
    <Page title="My Apps">
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h2" component="h2">
              我的应用
            </Typography>
          </Stack>
        }
      >
        <Grid container spacing={2}>
          <Grid xs={3}>
          <AppCard/>
          </Grid>

        </Grid>
      </MainCard>
    </Page>
  );
};

MyApps.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default MyApps;
