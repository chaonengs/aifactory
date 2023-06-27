import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { TabContext, TabList, TabPanel, LoadingButton } from '@mui/lab';
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
import { AIResource, App } from '@prisma/client';
import { AppTypes } from 'constant';
import { useOrganization } from 'feed';
import { useFormik } from 'formik';
import useConfig from 'hooks/useConfig';
import * as React from 'react';
import { toast } from 'react-toastify';
import { mutate } from 'swr';
import { WeworkAppConfig, FeishuAppConfig, DingTalkAppConfig } from 'types/app';

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

export const deleteApp = (id: string) => {
  const url = `/api/rest/apps/${id}`;
  return fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};

export default function AppCard({ app }: { app: App & { aiResource: AIResource | null } }) {
  const [expanded, setExpanded] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [thirdpartyOpen, setThirdpartyOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [configTab, setConfigTab] = React.useState(app.appType.toLowerCase());
  const { url, organization } = useOrganization(useConfig().organization);
  const host = process.env.NEXTAUTH_URL;
  const handleThirdpartyOpen = () => {
    setThirdpartyOpen(true);
  };

  const handleConfigOpen = () => {
    setConfigOpen(true);
  };

  const handleConfigClose = () => {
    setConfigOpen(false);
  };

  const handleThirdpartyClose = () => {
    setThirdpartyOpen(false);
  };

  const handleDeleteOpen = () => {
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await toast.promise(deleteApp(app.id), {
      pending: '删除中',
      success: '已删除 👌',
      error: '删除失败 🤯'
    });
    handleDeleteClose();
    await mutate(url);
    setIsDeleting(false);
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleChangeConfigTab = (event: React.SyntheticEvent, newValue: string) => {
    setConfigTab(newValue);
  };

  const updateConfig = async (id: string, app: App) => {
    const response = await fetch(`/api/rest/apps/${id}`, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      method: 'PATCH',
      body: JSON.stringify(app)
    });
    if (!response.ok) {
      return Promise.reject(response);
    } else {
      setConfigOpen(false);
      return response;
    }
  };

  const appConfigInitial = (app: App) => {
    if (app.appType === 'FEISHU') {
      const config = app.config as FeishuAppConfig;
      return {
        // ...app,
        config: {
          appId: config.appId || '',
          appSecret: config.appSecret || '',
          encryptKey: config.encryptKey || '',
          verificationToken: config.verificationToken || '',
          ai: {
            temperature: config.ai?.temperature || 1,
            maxCompletionTokens: config.ai?.maxCompletionTokens || 2000,
            maxPromptTokens: config.ai?.maxPromptTokens || 2000
          }
        },
        aiResourceId: app.aiResourceId
      };
    }

    {
      /* export type AppConfig = {
    token: string;
    encodingAESKey: string;
    corpId: string;
    corpSecret: string;
    agentId: string;
    ai: AppAIConfig;
} */
    }

    if (app.appType === 'WEWORK') {
      const config = app.config as WeworkAppConfig;
      return {
        // ...app,
        config: {
          token: config.token || '',
          encodingAESKey: config.encodingAESKey || '',
          corpId: config.corpId || '',
          corpSecret: config.corpSecret || '',
          agentId: config.agentId || '',
          ai: {
            temperature: config.ai?.temperature || 1,
            maxCompletionTokens: config.ai?.maxCompletionTokens || 2000,
            maxPromptTokens: config.ai?.maxPromptTokens || 2000
          }
        },
        aiResourceId: app.aiResourceId
      };
    }
    if (app.appType === 'DINGTALK') {
      const config = app.config as DingTalkAppConfig;
      return {
        // ...app,
        config: {
          appId: config.appId || '',
          appSecret: config.appSecret || '',
          ai: {
            temperature: config.ai?.temperature || 1,
            maxCompletionTokens: config.ai?.maxCompletionTokens || 2000,
            maxPromptTokens: config.ai?.maxPromptTokens || 2000
          }
        },
        aiResourceId: app.aiResourceId
      };
    }
    throw new Error('Invalid app type: ' + app.appType);
  };

  const formik = useFormik({
    initialValues: appConfigInitial(app),

    onSubmit: async (values, { setSubmitting }) => {
      await toast.promise(updateConfig(app.id, values), {
        pending: '保存中',
        success: '保存成功 👌',
        error: '保存失败 🤯'
      });
      setSubmitting(false);
    }
  });

  return (
    <>
      <Card sx={{ maxWidth: 1000 }} variant="outlined">
        <CardHeader
          action={
            app.builtIn ? (
              <Chip label="平台内置" color="primary" />
            ) : (
              <IconButton aria-label="delete" onClick={() => handleDeleteOpen()}>
                <DeleteIcon />
              </IconButton>
            )
          }
          title={app.name || app.appType}
          subheader={AppTypes[app.appType] || app.appType}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {app.aiResource?.name || app.aiResource?.type || '资源待配置'}
          </Typography>
        </CardContent>
        {app.appType === 'FEISHU' && (
          <CardMedia
            component="img"
            image="/assets/images/logos/feishu.png"
            alt="FeiShu"
            height={124}
            width={124}
            sx={{ objectFit: 'contain' }}
          />
        )}
        {app.appType === 'WEWORK' && (
          <CardMedia
            component="img"
            image="/assets/images/logos/wework.png"
            alt="Wework"
            height={124}
            width={124}
            sx={{ objectFit: 'contain' }}
          />
        )}
        {app.appType === 'DINGTALK' && (
          <CardMedia
            component="img"
            image="/assets/images/logos/dingtalk.png"
            alt="DingTalk"
            height={124}
            width={124}
            sx={{ objectFit: 'contain' }}
          />
        )}

        <CardActions disableSpacing>
          <IconButton aria-label="edit" onClick={() => handleConfigOpen()}>
            <EditIcon />
          </IconButton>
          <IconButton aria-label="view" onClick={() => handleThirdpartyOpen()}>
            <VisibilityIcon />
          </IconButton>
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
                {app.appType === 'FEISHU' && <Tab label="飞书" value="feishu" />}
                {app.appType === 'WEWORK' && <Tab label="企业微信" value="wework" />}
                {app.appType === 'DINGTALK' && <Tab label="钉钉" value="dingtalk" />}
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
                  id="config.appSecret"
                  name="config.appSecret"
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
                  id="config.encryptKey"
                  name="config.encryptKey"
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
                  id="config.verificationToken"
                  label="VerificationToken"
                  name="config.verificationToken"
                  fullWidth
                  value={formik.values.config.verificationToken}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.verificationToken && Boolean(formik.errors.config?.verificationToken)}
                  helperText={formik.touched.config?.verificationToken && formik.errors.config?.verificationToken}
                />
              </Stack>
            </TabPanel>

            <TabPanel value="wework">
              <Stack>
                <TextField
                  margin="dense"
                  id="config.corpId"
                  name="config.corpId"
                  label="Corp Id"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.corpId}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.corpId && Boolean(formik.errors.config?.corpId)}
                  helperText={formik.touched.config?.corpId && formik.errors.config?.corpId}
                />
                <TextField
                  margin="dense"
                  id="config.corpSecret"
                  name="config.corpSecret"
                  label="Corp Secret"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.corpSecret}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.corpSecret && Boolean(formik.errors.config?.corpSecret)}
                  helperText={formik.touched.config?.corpSecret && formik.errors.config?.corpSecret}
                />
                <TextField
                  margin="dense"
                  id="config.agentId"
                  name="config.agentId"
                  label="Agent Id"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.agentId}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.agentId && Boolean(formik.errors.config?.agentId)}
                  helperText={formik.touched.config?.agentId && formik.errors.config?.agentId}
                />
                <TextField
                  margin="dense"
                  variant="standard"
                  id="config.encodingAESKey"
                  label="AES KEY"
                  name="config.encodingAESKey"
                  fullWidth
                  value={formik.values.config.encodingAESKey}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.encodingAESKey && Boolean(formik.errors.config?.encodingAESKey)}
                  helperText={formik.touched.config?.encodingAESKey && formik.errors.config?.encodingAESKey}
                />
                <TextField
                  margin="dense"
                  variant="standard"
                  id="config.token"
                  label="Token"
                  name="config.token"
                  fullWidth
                  value={formik.values.config.token}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.token && Boolean(formik.errors.config?.token)}
                  helperText={formik.touched.config?.token && formik.errors.config?.token}
                />
              </Stack>
            </TabPanel>

            <TabPanel value="dingtalk">
              <Stack>
                <TextField
                  margin="dense"
                  id="config.appId"
                  name="config.appId"
                  label="AppKey"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.appId}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.appId && Boolean(formik.errors.config?.appId)}
                  helperText={formik.touched.config?.appId && formik.errors.config?.appId}
                />
                <TextField
                  margin="dense"
                  id="config.appSecret"
                  name="config.appSecret"
                  label="AppSecret"
                  fullWidth
                  variant="standard"
                  value={formik.values.config.appSecret}
                  onChange={formik.handleChange}
                  error={formik.touched.config?.appSecret && Boolean(formik.errors.config?.appSecret)}
                  helperText={formik.touched.config?.appSecret && formik.errors.config?.appSecret}
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
                    type: 'number',
                    min: 0.1,
                    step: 0.1,
                    max: 1
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
                    type: 'number',
                    min: 1,
                    step: 1,
                    max: 4095
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
                    type: 'number',
                    min: 1,
                    step: 1,
                    max: 4095
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
                  {organization &&
                    organization.aiResources.map((v, i) => (
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
          <Button disabled={formik.isSubmitting} onClick={handleConfigClose}>
            取消
          </Button>
          <LoadingButton loading={formik.isSubmitting} onClick={formik.submitForm}>
            保存
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={thirdpartyOpen} onClose={handleThirdpartyClose}>
        <DialogTitle>查看第三方配置</DialogTitle>
        <DialogContent>
          {app.appType === 'FEISHU' && (
            <>
              <DialogContentText>飞书URL配置</DialogContentText>
              <TextField
                margin="dense"
                id="callbackurl"
                label="事件接收地址"
                fullWidth
                variant="standard"
                sx={{ minWidth: 500 }}
                value={`${window.location.origin}/api/feishu/${app.id}`}
              />
            </>
          )}
          {app.appType === 'WEWORK' && (
            <>
              <DialogContentText>企业微信配置</DialogContentText>
              <TextField
                margin="dense"
                id="callbackurl"
                label="接收消息URL"
                fullWidth
                variant="standard"
                sx={{ minWidth: 500 }}
                value={`${window.location.origin}/api/wework/${app.id}`}
              />
              <TextField
                margin="dense"
                id="callbackurl"
                label="白名单IP"
                fullWidth
                variant="standard"
                sx={{ minWidth: 500 }}
                value={`39.107.33.80`}
              />
            </>
          )}
          {app.appType === 'DINGTALK' && (
            <>
              <DialogContentText>钉钉URL配置</DialogContentText>
              <TextField
                margin="dense"
                id="callbackurl"
                label="事件接收地址"
                fullWidth
                variant="standard"
                sx={{ minWidth: 500 }}
                value={`${window.location.origin}/api/dingtalk/${app.id}`}
              />
              <TextField
                margin="dense"
                id="callbackurl"
                label="白名单IP"
                fullWidth
                variant="standard"
                sx={{ minWidth: 500 }}
                value={`143.64.17.193`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleThirdpartyClose}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">删除应用</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">确认要删除该应用吗？无法恢复</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={handleDeleteClose}>
            取消
          </Button>
          <LoadingButton loading={isDeleting} onClick={handleDelete}>
            删除
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
