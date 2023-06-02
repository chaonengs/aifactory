import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent, 
  DialogContentText,
  DialogTitle,
  Divider,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
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
import ResourceCard from 'components/application/aifactory/ResourceCard';
import { useSession } from 'next-auth/react';
import { useOrganization } from 'feed';

const Resources = () => {
  const theme = useTheme();
  const { data: session } = useSession();
  const { organization } = useOrganization(session?.user.id);
  const [alertOpen, setAlertOpen] = React.useState(false);

  const [tabValue, setTabValue] = React.useState('openai');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleAlertClickOpen = () => {
    setAlertOpen(true);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  return (
    <Page title="Resources">
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h2" component="h2">
              AI 资源
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAlertClickOpen}>
              Add
            </Button>
          </Stack>
        }
      >
        {organization ? (
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleTabChange} aria-label="lab API tabs example">
                <Tab label="Open AI" value="openai" />
                <Tab label="Azure Open AI" value="auzre-openai" />
                <Tab label="Others" value="others" />
              </TabList>
            </Box>
            <TabPanel value="openai">
              <Stack spacing={2} divider={<Divider flexItem />}>
                {organization.aiResources.map((resource) => {
                  return <ResourceCard aiResource={resource} key={resource.id} />;
                })}
              </Stack>
            </TabPanel>
            <TabPanel value="auzre-openai">{/* <ResourceList /> */}</TabPanel>
            <TabPanel value="others">{/* <ResourceList /> */}</TabPanel>
          </TabContext>
        ) : (
          <Skeleton animation="wave" sx={{ height: 300 }} />
        )}

        <Dialog
          open={alertOpen}
          onClose={handleAlertClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">联系客服添加资源</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">请联系客服帮你添加资源和应用</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAlertClose} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </MainCard>
    </Page>
  );
};

Resources.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default Resources;
