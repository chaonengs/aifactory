import { AccordionDetails, AccordionProps, AccordionSummaryProps, Chip, Stack, Typography, styled } from '@mui/material';

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
import { AIResource, App } from '@prisma/client';
import { AIResourceTypes, ResourceTypes } from 'constant';


const ResourceCard = ({
  aiResource,
  onEdit,
  onDelete
}: {
  aiResource: AIResource & {apps : App[]},
  onEdit: (aiResource: AIResource) => void;
  onDelete: (aiResource: AIResource) => void;
}) => {
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
        <Typography variant="h3" component="h3">
          {aiResource.name || ''}
        </Typography>
        <Typography flexGrow={1}>{AIResourceTypes[aiResource.type]}</Typography>
        {aiResource.builtIn ? (
          <>
            <Chip label="平台内置" color="primary" />
          </>
        ) : (
          <Stack direction={'row'}>
            <IconButton
              aria-label="edit"
              onClick={() => {
                onEdit(aiResource);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              aria-label="delete"
              onClick={() => {
                onDelete(aiResource);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        )}
      </Stack>
      {aiResource.type === 'OPENAI' && (
        <Stack direction={'row'} useFlexGap flexWrap="wrap">
            <Stack flexGrow={1}>
              <Typography variant="subtitle1">剩余Token</Typography>
              <Typography variant="h3">{aiResource.tokenRemains}</Typography>
            </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">模型</Typography>
            <Typography variant="h3">{aiResource.model}</Typography>
          </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">累计调用次数</Typography>
            <Typography variant="h3">开发中</Typography>
          </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">累计消耗Token</Typography>
            <Typography variant="h3">{aiResource.tokenUsed}</Typography>
          </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">使用应用</Typography>
            <Typography variant="h3">{aiResource.apps.length}</Typography>
          </Stack>
        </Stack>
      )}
      {aiResource.type === 'AZ_OPENAI' && (
        <Stack direction={'row'} useFlexGap flexWrap="wrap">
            <Stack flexGrow={1}>
              <Typography variant="subtitle1">剩余Token</Typography>
              <Typography variant="h3">{aiResource.tokenRemains}</Typography>
            </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">API版本</Typography>
            <Typography variant="h3">{aiResource.apiVersion}</Typography>
          </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">累计调用次数</Typography>
            <Typography variant="h3">开发中</Typography>
          </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">累计消耗Token</Typography>
            <Typography variant="h3">{aiResource.tokenUsed}</Typography>
          </Stack>
          <Stack flexGrow={1}>
            <Typography variant="subtitle1">使用应用</Typography>
            <Typography variant="h3">{aiResource.apps.length}</Typography>
          </Stack>
        </Stack>
      )}
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
