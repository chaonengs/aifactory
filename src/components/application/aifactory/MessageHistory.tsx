import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridCellParams, GridColDef, GridEventListener, GridValueGetterParams, MuiEvent } from '@mui/x-data-grid';
import { usePagedMessages } from 'feed';
import { Dialog, DialogContent, DialogContentText, DialogTitle, Hidden, Skeleton, styled } from '@mui/material';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { Message } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { height } from '@mui/system';
import useConfig from 'hooks/useConfig';

const columns: GridColDef[] = [
  // { field:'id', headerName:'ID' },
  {
    field: 'appName',
    headerName: '应用名称',
    valueGetter: (params) => {
      return params.row.app.name || params.row.app.appType;
    },
    sortable: false
  },
  {
    field: 'sender',
    headerName: '用户名称',
    sortable: false,
    width: 100
  },
  {
    field: 'content',
    headerName: '问题',
    flex: 1,
    sortable: false,
    editable: false,
  },
  {
    field: 'answer',
    headerName: '回答',
    flex: 1,
    sortable: false,
    editable: false,
  },
  {
    field: 'sensitive',
    headerName: '敏感词',
    valueGetter: (params) => ` ${params.row.sensitiveWordInMessage ? params.row.sensitiveWordInMessage.map((s) => s.plainText).toString() : '无'} `,
    sortable: false,
    flex: 1
  },
  {
    field: 'token',
    headerName: 'Token消耗',
    valueGetter: (params) => `${params.row.usage.totalTokens}`,
    sortable: false,
    width: 80
  },

  {
    field: 'createdAt',
    headerName: '时间',
    width: 150,
    sortable: false
  }
];

const StyledTextarea = styled(TextareaAutosize)(
  ({ theme }) => `
  width: '100%'
  `
);

export default function MessageHistory() {
  const { data: session } = useSession();
  const organizationId = useConfig().organization;

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0
  });

  const { data } = usePagedMessages(organizationId, paginationModel.page + 1, paginationModel.pageSize);

  const [open, setOpen] = React.useState(false);
  const [dialogContext, setDialogContext] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  
  // const handleEvent: GridEventListener<'cellClick'> = (
  //   params,  // GridCellParams<any>
  //   event,   // MuiEvent<React.MouseEvent<HTMLElement>>
  //   details, // GridCallbackDetails
  // ) => {...}
  
  // // Imperative subscription
  // apiRef.current.subscribeEvent(
  //   'cellClick',
  //   handleEvent,
  // );
  
  // // Hook subscription (only available inside the scope of the grid)
  // useGridApiEventHandler(apiRef, 'cellClick', handleEvent);
  
  // // Component prop (available on DataGrid, DataGridPro, DataGridPremium)
  // <DataGrid
  //   onCellClick={handleEvent}
  //   {...other}
  // />

  return (
    <Box sx={{ height: `${data?.pagination.total > 0 ? 'auto' : '500px'}`, overflow: 'hidden' }}>
      {data ? (
        // (<StyledTextarea defaultValue={JSON.stringify(messages)} disabled ></StyledTextarea>) :
        <DataGrid
        onCellClick={(params: GridCellParams, event: MuiEvent<React.MouseEvent>) => {
          event.defaultMuiPrevented = true;
          if(params.field === 'content' || params.field === 'answer'){
            setDialogContext(params.value);
            handleClickOpen();
          }
          console.log(params);
        }}
          disableColumnFilter
          columns={columns}
          rows={data.data}
          rowCount={data.pagination.total}
          loading={data?.data === null}
          pageSizeOptions={[10, 20]}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          // checkboxSelection
          disableRowSelectionOnClick
        />
      ) : (
        <Skeleton animation="wave" sx={{ height: 300 }} />
      )}

<Dialog onClose={handleClose} open={open}>
      <DialogTitle></DialogTitle>
      <DialogContent>
          <DialogContentText id="dialog-description">
            {dialogContext}
          </DialogContentText>
        </DialogContent>
    </Dialog>
    </Box>
  );
}
