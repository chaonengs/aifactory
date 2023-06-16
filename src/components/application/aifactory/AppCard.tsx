import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { TabContext, TabList, TabPanel,LoadingButton } from '@mui/lab';
import { Box, Chip, MenuItem, Stack, Tab } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { App } from '@prisma/client';
import { AppTypes } from 'constant';
import { useOrganization } from 'feed';
import { useFormik } from 'formik';
import useConfig from 'hooks/useConfig';
import * as React from 'react';
import { toast } from 'react-toastify';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest
  })
}));

export type AppConfig = {
  appId: string;
  appSecret: string;
  encryptKey: string;
  verificationToken: string;
  ai: {
    temperature: number;
    maxPromptTokens: number;
    maxCompletionTokens: number;
  };
};

export default function AppCard({ app }) {
  const [expanded, setExpanded] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [feishuOpen, setFeishuOpen] = React.useState(false);

  const [configForm, setConfigForm] = React.useState(app.config);
  const [configTab, setConfigTab] = React.useState('feishu');
  const {organization} = useOrganization(useConfig().organization);
  const host = process.env.NEXTAUTH_URL;
  const handleFeishuOpen = () => {
    setFeishuOpen(true);
  };

  const handleConfigOpen = () => {
    setConfigOpen(true);
  };

  const handleConfigClose = () => {
    setConfigOpen(false);
  };

  const handleFeishuClose = () => {
    setFeishuOpen(false);
  };

  // const handleFormOnChange = (event: { target: { id: string; value: string } }) => {
  //   // event.target.id, event.target.value
  //   let config = {};
  //   Object.assign(config, configForm);

  //   const k = event.target.id as string;
  //   const v = event.target.value as string;

  //   config[k] = v;
  //   setConfigForm(config);
  // };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleChangeConfigTab = (event: React.SyntheticEvent, newValue: string) => {
    setConfigTab(newValue);
  };

  const updateConfig = async (id:string, app:App)=> {
    const response = await fetch(`/api/rest/apps/${id}`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      method: 'PATCH',
      body: JSON.stringify(app)
    });
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;

  };

  const appConfigInitial = (app:App): App & {config:AppConfig} => { return {
    // ...app,
    config: {
      appId: (app.config as AppConfig).appId || '',
      appSecret: (app.config as AppConfig).appSecret || '',
      encryptKey:  (app.config as AppConfig).encryptKey || '',
      verificationToken: (app.config as AppConfig).verificationToken || '',
      ai:{
        temperature: (app.config as AppConfig).ai?.temperature || 1,
        maxCompletionTokens: (app.config as AppConfig).ai?.maxCompletionTokens || 2000,
        maxPromptTokens: (app.config as AppConfig).ai?.maxPromptTokens || 2000,
      },
    },
    aiResourceId: app.aiResourceId
    }
  }

  
  const formik = useFormik({
    initialValues: appConfigInitial(app),
    // validationSchema: ResourceSchema,

    onSubmit: async (values, {setSubmitting}) => {

      await toast.promise(
        updateConfig(app.id,values),
        {
          pending: '保存中',
          success: '保存成功 👌',
          error: '保存失败 🤯'
        }
      )
      setSubmitting(false);
      // try{
      //   const result = await updateConfig(app.id,values);
      //   if (result.ok) {
      //     toast('保存成功')
      //     setConfigOpen(false);

      //   } else {
      //     toast('保存失败')
      //   }
      // } catch (e){
        
      // } finally {
       
      // }
    }
  });

  return (
    <>
      <Card sx={{ maxWidth: 1000 }}  variant="outlined">
        <CardHeader
          action={
            <Chip label="平台内置" color="primary" />

            
          }
          title={app.name || app.appType}
          subheader={AppTypes[app.appType]}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {app.aiResource.name}
          </Typography>
        </CardContent>
        <CardMedia
          component="img"
          image="/assets/images/logos/feishu.png"
          alt="FeiShu"
          height={124}
          width={124}
          sx={{ objectFit: 'contain' }}
        />

        <CardActions disableSpacing>
          <IconButton aria-label="edit" onClick={() => handleConfigOpen()}>
            <EditIcon />
          </IconButton>
          <IconButton aria-label="view" onClick={() => handleFeishuOpen()}>
            <VisibilityIcon />
          </IconButton>
          {/* <IconButton aria-label="messages">
            <ForumIcon />
          </IconButton>
          <IconButton aria-label="usages">
            <ReceiptIcon />
          </IconButton> */}
          {/* <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore> */}
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography paragraph>Method:</Typography>
            <Typography paragraph>Heat 1/2 cup of the broth in a pot until simmering, add saffron and set aside for 10 minutes.</Typography>
            <Typography paragraph>
              Heat oil in a (14- to 16-inch) paella pan or a large, deep skillet over medium-high heat. Add chicken, shrimp and chorizo, and
              cook, stirring occasionally until lightly browned, 6 to 8 minutes. Transfer shrimp to a large plate and set aside, leaving
              chicken and chorizo in the pan. Add pimentón, bay leaves, garlic, tomatoes, onion, salt and pepper, and cook, stirring often
              until thickened and fragrant, about 10 minutes. Add saffron broth and remaining 4 1/2 cups chicken broth; bring to a boil.
            </Typography>
            <Typography paragraph>
              Add rice and stir very gently to distribute. Top with artichokes and peppers, and cook without stirring, until most of the
              liquid is absorbed, 15 to 18 minutes. Reduce heat to medium-low, add reserved shrimp and mussels, tucking them down into the
              rice, and cook again without stirring, until mussels have opened and rice is just tender, 5 to 7 minutes more. (Discard any
              mussels that don&apos;t open.)
            </Typography>
            <Typography>Set aside off of the heat to let rest for 10 minutes, and then serve.</Typography>
          </CardContent>
        </Collapse>
      </Card>
      <Dialog open={configOpen} onClose={handleConfigOpen} fullWidth>
        <DialogTitle>应用配置</DialogTitle>
        <DialogContent>
          {/* <DialogContentText>请填写飞书机器人中的相关配置</DialogContentText> */}

          <TabContext value={configTab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleChangeConfigTab} aria-label="app-config-tabs">
                <Tab label="飞书机器人" value="feishu" />
                <Tab label="AI" value="ai" />
                <Tab label="资源" value="resource" />
              </TabList>
            </Box>
            <TabPanel value="feishu">
              <Stack>
                <TextField
                  margin="dense"
                  id="config.appId"
                  name="config.appId"
                  label="AppId"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.appId}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.appId && Boolean(formik.errors.config?.appId)}
                  helperText={formik.touched.config?.appId && formik.errors.config?.appId}
                />
                <TextField
                  margin="dense"
                  id="appSecret"
                  label="AppSecret"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.appSecret}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.appSecret && Boolean(formik.errors.config?.appSecret)}
                  helperText={formik.touched.config?.appSecret && formik.errors.config?.appSecret}
                />
                <TextField
                  margin="dense"
                  id="encryptKey"
                  label="EncryptKey"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.encryptKey}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.encryptKey && Boolean(formik.errors.config?.encryptKey)}
                  helperText={formik.touched.config?.encryptKey && formik.errors.config?.encryptKey}
                />
                <TextField
                  margin="dense"
                  variant="standard"                  
                  id="verificationToken"
                  label="VerificationToken"
                  fullWidth
                  value={formik.values.config.verificationToken}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.verificationToken && Boolean(formik.errors.config?.verificationToken)}
                  helperText={formik.touched.config?.verificationToken && formik.errors.config?.verificationToken}
                />
              </Stack>
            </TabPanel>
            <TabPanel value="ai">
              <Stack>
              <TextField
                  fullWidth
                  margin="dense"
                  variant="standard"      
                  type="number"
                  inputProps={{
                    type:"number",
                     min:0.1,
                     step:0.1,
                     max:1
                  }}
                  id="config.ai.temperature"
                  name="config.ai.temperature"
                  label="Temperature"
                  value={formik.values.config.ai?.temperature}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.ai?.temperature && Boolean(formik.errors.config?.ai?.temperature)}
                  helperText={formik.touched.config?.ai?.temperature && formik.errors.config?.ai?.temperature}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  variant="standard"      
                  type="number"
                  inputProps={{
                    type:"number",
                     min:1,
                     step:1,
                     max:4095
                  }}
                  id="config.ai.maxPromptTokens"
                  name="config.ai.maxPromptTokens"
                  label="最大提示词Tokens"
                  value={formik.values.config.ai?.maxPromptTokens}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.ai?.maxPromptTokens && Boolean(formik.errors.config?.ai?.maxPromptTokens)}
                  helperText={formik.touched.config?.ai?.maxPromptTokens && formik.errors.config?.ai?.maxPromptTokens}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  variant="standard"      
                  type="number"
                  inputProps={{
                    type:"number",
                     min:1,
                     step:1,
                     max:4095
                  }}
                  id="config.ai.maxCompletionTokens"
                  name="config.ai.maxCompletionTokens"
                  label="最大回复Tokens"
                  value={formik.values.config.ai?.maxCompletionTokens}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.ai?.maxCompletionTokens && Boolean(formik.errors.config?.ai?.maxCompletionTokens)}
                  helperText={formik.touched.config?.ai?.maxCompletionTokens && formik.errors.config?.ai?.maxCompletionTokens}
                />
              </Stack>
            </TabPanel>
            <TabPanel value="resource">
              <Stack>
              <TextField
                  fullWidth
                  margin="dense"
                  variant="standard"      
                  select
                  id="aiResourceId"
                  name="aiResourceId"
                  label="资源"
                  value={formik.values.aiResourceId}
                  onChange={formik.handleChange}
                  error={formik.touched.aiResourceId && Boolean(formik.errors.aiResourceId)}
                  helperText={formik.touched.aiResourceId && formik.errors.aiResourceId}
                >
                                    {organization && organization.aiResources.map((v, i) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name}
                    </MenuItem>
                  ))}
                  </TextField>
              </Stack>
            </TabPanel>
          </TabContext>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfigClose}>取消</Button>
          <LoadingButton loading={formik.isSubmitting} onClick={formik.submitForm}>保存</LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={feishuOpen} onClose={handleFeishuClose}>
        <DialogTitle>查看飞书配置</DialogTitle>
        <DialogContent>
          <DialogContentText>查看飞书URL配置</DialogContentText>
          <TextField
            margin="dense"
            id="callbackurl"
            label="事件接收地址"
            fullWidth
            variant="standard"
            sx={{ minWidth: 500 }}
            value={`${window.location.origin}/api/feishu/${app.id}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeishuClose}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
