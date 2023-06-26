import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { styled, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

// project imports
import Page from 'components/ui-component/Page';
import LAYOUT from 'constant';
import Layout from 'layout';
import React, { ReactElement } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import AppCard from 'components/application/aifactory/AppCard';
import { useApps} from 'feed';
import { useSession} from "next-auth/react"
import useConfig from 'hooks/useConfig';
import { toast } from 'react-toastify';
import useSWR, { useSWRConfig } from 'swr'


const MyApps = () => {
  const { mutate } = useSWRConfig();

  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState('openai');
  // const [apps, setApps] = React.useState([]);
  const { data: session } = useSession()

  // const {organization} = useOrganization(session?.user.id);
  const {organization} = useConfig();
  const {url, apps} = useApps(organization);
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newApp, setNewApp] = React.useState({name:'', appType:'FEISHU_BOT'});

  const handleCreateOpen = () => {
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
  };




  const createApp = (organizationId: string, name: string, appType: string) => {
    const url = `/api/rest/apps`;
  
    const data = {
      organizationId,
      name,
      appType,
      tokenLimitation: null,
      tokenUsed: 0,
      builtIn: false,
      // aiResource: null,
      // organization: organizationId,
      // organization:{
      //   connect:{
      //     id:organizationId
      //   }
      // },
      config:{appId:''},
    };
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(response => {
      if (!response.ok) {
        return Promise.reject(response);
      }
      return response;
    });
  };

  const handleCreateApp = async () => {
    await toast.promise(createApp(organization, newApp.name, newApp.appType), {
      pending: '创建中',
      success: '已创建 👌',
      error: '创建失败 🤯'
    });
    handleCreateClose();
    await mutate(url)
  }



  return (
    <Page title="我的应用">
      <MainCard
        title={
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Stack flexGrow={1} direction={'row'} alignItems={'center'}>
              <Typography variant="h2" component="h2">
                我的应用
              </Typography>
            </Stack>

            <Button variant="outlined" startIcon={<AddIcon />} onClick={()=>{
              handleCreateOpen();
            }}>
              添加
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2} >
          {
            apps ? apps.map((app)=>{
                return <Grid xs={3} key={app.id}><AppCard app={app} />  </Grid>
              })
            :
            (
              <Grid xs={12}>
                <Skeleton animation="wave" sx={{height: 300}} />
              </Grid>
            )
          }


        </Grid>

        <Dialog open={createOpen} onClose={handleCreateClose} fullWidth>
        <DialogTitle>新建应用 </DialogTitle>
        <DialogContent>
          <DialogContentText>
          </DialogContentText>
          <TextField
            select
            autoFocus
            margin="dense"
            id="type"
            label="应用类型"
            fullWidth
            variant="standard"
            value={newApp.appType}
            onChange={e => setNewApp({...newApp, appType: e.target.value})}
          >
            <MenuItem value="FEISHU">
              飞书机器人
            </MenuItem>
            <MenuItem value="DINGTALK">
              钉钉机器人
            </MenuItem>
            <MenuItem value="WEWORK">
              企业微信机器人
            </MenuItem>
            </TextField>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="应用名称"
            fullWidth
            variant="standard"
            value={newApp.name}
            onChange={
              (e)=>{
                //console.log(e);
                setNewApp({
                  name: e.target.value.trim(),
                  appType: newApp.appType
                })
              }
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>取消</Button>
          <Button disabled={!newApp.name || newApp.name.trim() === ''} onClick={handleCreateApp}>创建</Button>
        </DialogActions>
      </Dialog>
      </MainCard>
    </Page>
  );
};

MyApps.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default MyApps;
