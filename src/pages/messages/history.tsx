import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Button, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

// project imports
import Page from 'components/ui-component/Page';
import LAYOUT from 'constant';
import Layout from 'layout';
import React, { ReactElement } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import { DataGridPremium } from '@mui/x-data-grid-premium';
import MessageHistory from 'components/application/aifactory/MessageHistory';
import { usePagedMessages } from 'feed';
import { useSession } from 'next-auth/react';
import { Message } from '@prisma/client';


const History = () => {
  const theme = useTheme();

  const [tabValue, setTabValue] = React.useState('openai');
  const { data: session } = useSession()
  // const {messages} = usePagedMessages(session?.user.id);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Page title="Resources">
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h2" component="h2">
              消息历史
            </Typography>
          </Stack>
        }
      >
      <MessageHistory />
      </MainCard>
    </Page>
  );
};

History.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default History;
