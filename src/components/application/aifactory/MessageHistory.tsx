import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { useMessages } from 'feed';
import flatten from 'flat';
import { Skeleton } from '@mui/material';


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



export default function MessageHistory() {
  const messages = useMessages();
  return (
    <Box sx={{  width:'100%' }}>
      { messages? 
      (<DataGrid
        rows={flatten(messages)}
        columns={columns}
        initialState={{
          pagination:{
            paginationModel:{
              pageSize:10,
            },
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />) :
      (
          <Skeleton animation="wave" sx={{ height: 300 }} />
      )
      }
    </Box>
  );
}