import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridRowsProp,
  GridToolbarContainer
} from '@mui/x-data-grid';
import * as React from 'react';

// project imports
import LAYOUT from 'constant';
import Layout from 'layout';
import { ReactElement } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import Page from 'ui-component/Page';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { toast } from 'react-toastify';
import { mutate } from 'swr';
import useConfig from 'hooks/useConfig';
import { usePagedOrganizationUsers } from 'feed';
import { LoadingButton } from '@mui/lab';

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (newModel: (oldModel: GridRowModesModel) => GridRowModesModel) => void;
}

const addOrganizationUser = (organizationId: string, userId: string) => {
  const url = `/api/rest/organizationUsers`;
  const data = { userId, organizationId, role: 'MEMBER' };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};

const createOrganizationUser = (organizationId: string, userId: string) => {
  const url = `/api/rest/organizationUsers`;
  const data = { userId, organizationId, role: 'MEMBER' };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};

const findUser = (email: string) => {
  const url = `/api/rest/users?where={"email":{"$eq":"${email}"}}`;

  return fetch(url, {
    method: 'GET',
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

const createOrganization = (userId: string, name: string) => {
  const url = `/api/rest/organizations`;
  const data = {
    name,
    users: {
      create: [
        {
          role: 'OWNER',
          user: {
            connect: {
              id: userId
            }
          }
        }
      ]
    }
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};

const deleteMember = (organizationId: string, userId:string) => {
  const url = `/api/rest/organizationUsers/${organizationId}/userId`;

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

const OrganizationUsers = () => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0
  });

  const organizationId = useConfig().organization;
  const { url, page } = usePagedOrganizationUsers(organizationId, paginationModel.page + 1, paginationModel.pageSize);

  const handleDeleteOpen = () => {
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };

  const handleCreateOpen = () => {
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
  };

  const handleAddOrganizationUser = async () => {
    const result = await (await findUser(newUserEmail)).json();
    if (result.length === 1) {
      await toast.promise(createOrganizationUser(organizationId, result[0].id), {
        pending: '创建中',
        success: '已创建 👌',
        error: '创建失败 🤯'
      });
      await mutate(url);
    } else {
      toast.warning('找不到该邮箱用户');
    }
    handleCreateClose();
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setSelectedId(id as string);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await toast.promise(deleteMember(organizationId, selectedId), {
      pending: '删除中',
      success: '已删除 👌',
      error: '删除失败 🤯'
    });
    handleDeleteClose();
    await mutate(url);
    setIsDeleting(false);
  };

  function EditToolbar(props: EditToolbarProps) {
    const handleClick = () => {
      handleCreateOpen();
    };

    return (
      <GridToolbarContainer>
        <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
          添加成员
        </Button>
      </GridToolbarContainer>
    );
  }

  const columns: GridColDef[] = [
    {
      field: 'user_email',
      valueGetter: (params) => {
        return `${params.row.user.email || ''}`;
      },
      headerName: '成员邮箱',
      flex: 1,
      editable: false,
      sortable: false
    },
    {
      field: 'role',
      headerName: '角色',
      flex: 1,
      editable: false,
      sortable: false
    },

    {
      field: 'actions',
      type: 'actions',
      headerName: '操作',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        return [<GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(id)} color="inherit" />];
      }
    }
  ];

  return (
    <Page title="团队成员">
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h2" component="h2">
              团队成员
            </Typography>
          </Stack>
        }
      >
        <Box
          sx={{
            height: `${page?.pagination?.total > 0 ? 'auto' : '500px'}`,
            width: '100%',
            '& .actions': {
              color: 'text.secondary'
            },
            '& .textPrimary': {
              color: 'text.primary'
            }
          }}
        >
          {page ? (
            <DataGrid
              rows={page.data}
              columns={columns}
              disableColumnFilter
              rowCount={page.pagination.total}
              loading={page.data === null}
              pageSizeOptions={[10, 20]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              getRowId={(row) => row.userId}
              // checkboxSelection
              disableRowSelectionOnClick
              slots={{
                toolbar: EditToolbar
              }}
            />
          ) : (
            <Skeleton animation="wave" sx={{ height: 300 }} />
          )}
        </Box>
        <Dialog open={createOpen} onClose={handleCreateClose} fullWidth>
          <DialogTitle>添加成员 </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="邮箱"
              fullWidth
              variant="standard"
              value={newUserEmail}
              type="email"
              onChange={(e) => {
                setNewUserEmail(e.target.value.trim());
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCreateClose}>取消</Button>
            <Button disabled={!newUserEmail || newUserEmail.trim() === ''} onClick={handleAddOrganizationUser}>
              创建
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteOpen}
          onClose={handleDeleteClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">移除成员</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">确认移除？无法恢复</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button disabled={isDeleting} onClick={handleDeleteClose}>
              取消
            </Button>
            <LoadingButton loading={isDeleting} onClick={handleDelete}>
              移除
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </MainCard>
    </Page>
  );
};

OrganizationUsers.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default OrganizationUsers;
