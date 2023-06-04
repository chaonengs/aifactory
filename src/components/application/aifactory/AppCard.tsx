import EditIcon from '@mui/icons-material/Edit';
import ForumIcon from '@mui/icons-material/Forum';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import Collapse from '@mui/material/Collapse';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import * as React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { App } from '@prisma/client';
import { setConfig } from 'next/config';
import { configureStore } from '@reduxjs/toolkit';

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

export default function AppCard({ app }) {
  const [expanded, setExpanded] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [feishuOpen, setFeishuOpen] = React.useState(false);

  const [configForm, setConfigForm] = React.useState(app.config);
  const host = process.env.NEXTAUTH_URL;
  const handleFeishuOpen = () => {
    setFeishuOpen(true);
  }

  const handleConfigOpen = () => {
    setConfigOpen(true);
  };

  const handleConfigClose = () => {
    setConfigOpen(false);
  };

  const handleFeishuClose = () => {
    setFeishuOpen(false);
  };

  const handleFormOnChange = (event: { target: { id: string; value: string; }; }) => {
    // event.target.id, event.target.value
    let config = {};
    Object.assign(config, configForm);

    const k = event.target.id as string;
    const v = event.target.value as string;

    config[k] = v;
    setConfigForm(config);
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleConfigSave = async () => {
    const body = JSON.stringify({ config: configForm });

    await fetch('/api/rest/apps/' + app.id, {
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      method: 'PATCH',
      body: body
    });

    setConfigOpen(false);
  };

  return (
    <>
      <Card sx={{ maxWidth: 1000 }}>
        <CardHeader
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title={app.name || app.appType}
        />
                <CardContent>
          <Typography variant="body2" color="text.secondary">{app.aiResource.model}</Typography>
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
      <Dialog open={configOpen} onClose={handleConfigOpen}>
        <DialogTitle>配置飞书机器人</DialogTitle>
        <DialogContent>
          <DialogContentText>请填写飞书机器人中的相关配置</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="appdId"
            label="AppId"
            fullWidth
            variant="standard"
            onChange={handleFormOnChange}
            value={configForm.appId}
          />
          <TextField
            autoFocus
            margin="dense"
            id="appSecret"
            label="AppSecret"
            fullWidth
            variant="standard"
            onChange={handleFormOnChange}
            value={configForm.appSecret}
          />
          <TextField
            autoFocus
            margin="dense"
            id="appEncryptKey"
            label="App Encrypt Key"
            fullWidth
            variant="standard"
            onChange={handleFormOnChange}
            value={configForm.appEncryptKey}
          />
          <TextField
            autoFocus
            margin="dense"
            id="appVerificationToken"
            label="App Verification Token"
            fullWidth
            variant="standard"
            onChange={handleFormOnChange}
            value={configForm.appVerificationToken}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfigClose}>取消</Button>
          <Button onClick={handleConfigSave}>保存</Button>
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
            sx={{minWidth:500}}
            value={window.location.origin + '/api/feishu/' + app.id}
          />
         
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeishuClose}>关闭</Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
