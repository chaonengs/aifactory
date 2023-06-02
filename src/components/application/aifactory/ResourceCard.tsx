import { AccordionDetails, AccordionProps, AccordionSummaryProps, Stack, Typography, styled } from '@mui/material';

// project imports
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AlarmIcon from '@mui/icons-material/Alarm';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import { AIResource } from '@prisma/client';

const ResourceCard = ({aiResource}) => {
  const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    }
  }));

  const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />} {...props} />
  ))(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)'
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1)
    }
  }));

  const [expanded, setExpanded] = React.useState<string | false>('panel1');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <Stack spacing={2} useFlexGap flexWrap="wrap">
      <Stack direction={'row'} spacing={2} alignItems={'center'}>
        <Typography variant="h2" component="h2" >
          {aiResource.name}
        </Typography>
        <Typography flexGrow={1}>
          {aiResource.type}
        </Typography>
        <Stack direction={'row'}> 
          <IconButton color="primary" aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
 
      <Stack direction={'row'} useFlexGap flexWrap="wrap">
        <Stack flexGrow={1}>
          <Typography variant='subtitle1'>剩余Token</Typography>
          <Typography variant='h3'>{aiResource.tokenRemains}</Typography>
        </Stack>
        <Stack flexGrow={1}>
          <Typography  variant='subtitle1'>模型</Typography>
          <Typography  variant='h3'>{aiResource.model}</Typography>
        </Stack>
        <Stack flexGrow={1}>
          <Typography variant='subtitle1'>累计调用次数</Typography>
          <Typography  variant='h3'>开发中</Typography>
        </Stack>
        <Stack flexGrow={1}>
          <Typography variant='subtitle1'>累计消耗Token</Typography>
          <Typography variant='h3'>{aiResource.tokenUsed}</Typography>
        </Stack>
        <Stack flexGrow={1}>
          <Typography variant='subtitle1'>使用应用</Typography>
          <Typography variant='h3'>开发中</Typography>
        </Stack>
        </Stack>
      {/* 
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          <Typography>详细配置</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Stack direction={'row'} spacing={2}>
              <Typography>服务域名</Typography>
              <Typography>proxy.forkway.cn/azure</Typography>
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <Typography>API版本</Typography>
              <Typography>2023-03-15-preview</Typography>
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <Typography>模型部署名称</Typography>
              <Typography>gpt-3.5-turbo</Typography>
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <Typography>Token</Typography>
              <Typography>connect-AI-E-f7e4009509104d6285db584356cca799-SFPGE4gp</Typography>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion> */}
    </Stack>
  );
};

export default ResourceCard;
