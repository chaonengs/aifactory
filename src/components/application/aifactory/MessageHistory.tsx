import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { useMessages } from 'feed';
import { Skeleton, styled } from '@mui/material';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { Message } from '@prisma/client';
import { useSession } from 'next-auth/react';


const columns:GridColDef[] = [
  // { field:'id', headerName:'ID' },
  {
    field:'appName',
    headerName:'应用名称',
    valueGetter: (params) =>  {
      return params.row.app.name || params.row.app.appType
    },
    sortable: false,
  },
  {
    field:'sender',
    headerName:'用户名称',
    sortable: false,

  },
  {
    field:'content',
    headerName:'问题',
    width:350,
    sortable: false,

  },
  {
    field:'answer',
    headerName:'回答',
    width:800,
    sortable: false,


  },
  {
    field:'token',
    headerName:'Token消耗',
    valueGetter: (params) =>  `${params.row.usage.totalTokens}`,
    sortable: false,

  },
  {
    field:'sensitive',
    headerName:'敏感词',
    valueGetter: (params) =>  ` 马上上线 `,
    sortable: false,

  },
  {
    field:'createdAt',
    headerName:'时间',
    width:200,
    sortable: false,

  },
];

const StyledTextarea = styled(TextareaAutosize)(
  ({ theme }) => `
  width: '100%'
  `,
  );


export default function MessageHistory( ) {

  const { data: session } = useSession();

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const {data} = useMessages(session?.user.id, paginationModel.page + 1, paginationModel.pageSize);



  return (
    <Box sx={{  width:'100%' }}>
      { data? 
      // (<StyledTextarea defaultValue={JSON.stringify(messages)} disabled ></StyledTextarea>) :
      (<DataGrid
    
        disableColumnFilter 
        columns={columns}
        rows={data.data}
        rowCount={data.pagination.total}
        loading={data?.messages === null}
        pageSizeOptions={[10,20]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={setPaginationModel}
        // checkboxSelection
        disableRowSelectionOnClick
        
      />) :
      (
          <Skeleton animation="wave" sx={{ height: 300 }} />
      )
      }
    </Box>
  );
}