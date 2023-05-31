import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Button, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

// project imports
import ResourceList from 'components/application/aifactory/ResourceList';
import Page from 'components/ui-component/Page';
import LAYOUT from 'constant';
import Layout from 'layout';
import React, { ReactElement } from 'react';
import MainCard from 'ui-component/cards/MainCard';

const Resources = () => {
  const theme = useTheme();

  const [tabValue, setTabValue] = React.useState('openai');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Page title="Resources">
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h2" component="h2">
              AI 资源
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />}>
              Add
            </Button>
          </Stack>
        }
      >
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleTabChange} aria-label="lab API tabs example">
              <Tab label="Open AI" value="openai" />
              <Tab label="Azure Open AI" value="auzre-openai" />
              <Tab label="Others" value="others" />
            </TabList>
          </Box>
          <TabPanel value="openai">
            <ResourceList />
          </TabPanel>
          <TabPanel value="auzre-openai">
            <ResourceList />
          </TabPanel>
          <TabPanel value="others">
            <ResourceList />
          </TabPanel>
        </TabContext>
      </MainCard>
    </Page>
  );
};

Resources.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default Resources;
