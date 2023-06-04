import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { useMessages } from 'feed';
import flatten from 'flat';
import { Skeleton, styled } from '@mui/material';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { Message } from '@prisma/client';


const columns:GridColDef[] = [
  { field:'id', headerName:'ID' },
  {
    field:'appName',
    headerName:'应用名称',
  },
  {
    field:'username',
    headerName:'用户名称',
  },
  {
    field:'question',
    headerName:'问题',
    width:350,
  },
  {
    field:'answer',
    headerName:'回答',
    width:800,

  },
  {
    field:'model',
    headerName:'模型',
    width:150,
  },
  {
    field:'token',
    headerName:'Token消耗',
  },
  {
    field:'sensitive',
    headerName:'敏感词',
  },
  {
    field:'createdAt',
    headerName:'时间',
    width:150,
  },
];

const StyledTextarea = styled(TextareaAutosize)(
  ({ theme }) => `
  width: '100%'
  `,
  );


export default function MessageHistory( {messages}) {
  return (
    <Box sx={{  width:'100%' }}>
      { messages? 
      (<StyledTextarea defaultValue={JSON.stringify(messages)} disabled ></StyledTextarea>) :
      // (<DataGrid
      //   rows={flatten(messages)}
      //   columns={columns}
      //   initialState={{
      //     pagination:{
      //       paginationModel:{
      //         pageSize:10,
      //       },
      //     },
      //   }}
      //   pageSizeOptions={[5]}
      //   checkboxSelection
      //   disableRowSelectionOnClick
      // />) :
      (
          <Skeleton animation="wave" sx={{ height: 300 }} />
      )
      }
    </Box>
  );
}