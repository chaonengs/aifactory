import { Add, Clear, Done } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import * as Yup from 'yup';

import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowId,
  GridRowModesModel,
  GridRowsProp,
  GridToolbarContainer
} from '@mui/x-data-grid';
import * as React from 'react';

// project imports
import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import LAYOUT from 'constant';
import { useOrganization, usePagedSensitiveWords } from 'feed';
import { useFormik } from 'formik';
import useConfig from 'hooks/useConfig';
import Layout from 'layout';
import { ReactElement, useEffect } from 'react';
import { toast } from 'react-toastify';
import { mutate } from 'swr';
import Page from 'ui-component/Page';
import MainCard from 'ui-component/cards/MainCard';

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (newModel: (oldModel: GridRowModesModel) => GridRowModesModel) => void;
}

const addProvider = ({type, name, clientId, clientSecret}) => {
  const url = `/api/rest/providers`;
  const data = {type, name, clientId, clientSecret};

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

const deleteMember = (organizationUserId: string) => {
  const url = `/api/rest/organizationUsers/${organizationUserId}`;

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


const Organizations = () => {
  const organizationId = useConfig().organization;
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState('');
  const [openPanel, setOpenPanel] = React.useState('');
  const [organizationNameEditMode, setOrganizationNameEditMode] = React.useState(false);
  const [organizationName, setOrganizationName] = React.useState();
  const [providerOpen, setProviderOpen] = React.useState(false);
  const { organization } = useOrganization(organizationId);
  const [provider, setProvider] = React.useState({ id: '', clientId: '', clientSecret: '', type: '', name:'' });

  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0
  });

  const ProviderSchema = Yup.object().shape({
    clientId: Yup.string().required(),
    clientSecret: Yup.string().required(),
    name: Yup.string().required(),
    type: Yup.string().required()
  });

  const formik = useFormik({
    initialValues: {
      type: provider?.clientId || '',
      clientId: provider?.type || '',
      clientSecret: provider?.clientSecret || '',
      name: provider?.name || '', 
      organizationId: provider?.id || organizationId
    },
    validationSchema: ProviderSchema,
    enableReinitialize: true,

    onSubmit: async (values, { setSubmitting }) => {
      if (provider.id && provider.id !== '') {
        //   await toast.promise(updateResource(aiResource.id, values), {
        //     pending: '保存中',
        //     success: '保存成功 👌',
        //     error: '保存失败 🤯'
        //   });
        // } else {
        //   await toast.promise(createResource(organizationId, values), {
        //     pending: '保存中',
        //     success: '保存成功 👌',
        //     error: '保存失败 🤯'
        //   });
      }
      setSubmitting(false);
      // onDone();
    }
  });

  const handleOpenPanel = (name: string) => {
    setOpenPanel(name);
  };

  useEffect(() => {
    if (organization) {
      setOrganizationName(organization.name);
    }
  }, [organization]);

  const { url, page } = usePagedSensitiveWords(organizationId, paginationModel.page + 1, paginationModel.pageSize);

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

  const handleCreateSWord = async () => {
    await toast.promise(createOrganization(session.user.id, newWord), {
      pending: '创建中',
      success: '已创建 👌',
      error: '创建失败 🤯'
    });
    handleCreateClose();
    await mutate(url);
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await toast.promise(deleteMember(selectedId), {
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
          添加
        </Button>
      </GridToolbarContainer>
    );
  }

  const columns: GridColDef[] = [
    { field: 'value', headerName: '敏感词', flex: 1, editable: false, sortable: false },
    { field: 'createdAt', headerName: '创建时间', flex: 1, editable: false, sortable: false },

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
    <Page title="团队设置">
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h2" component="h2">
              团队设置
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
            <Stack spacing={2}>
              <Typography variant="h3" component="h3">
                团队名称
              </Typography>
              <Stack direction={'row'} spacing={2} alignItems={'center'} justifyItems={'center'}>
                <TextField disabled={!organizationNameEditMode} value={organizationName}></TextField>
                {!organizationNameEditMode && (
                  <IconButton aria-label="edit" onClick={() => setOrganizationNameEditMode(true)}>
                    <EditIcon />
                  </IconButton>
                )}

                {organizationNameEditMode && (
                  <>
                    <IconButton aria-label="cancel" onClick={() => setOrganizationNameEditMode(false)}>
                      <Clear />
                    </IconButton>
                    <IconButton aria-label="ok" onClick={() => setOrganizationNameEditMode(true)}>
                      <Done />
                    </IconButton>
                  </>
                )}
              </Stack>
              <Divider />
              <Typography variant="h3" component="h3">
                第三方登录
              </Typography>
              <Stack direction={'row'} spacing={2}>
                <Button variant="outlined" startIcon={<Add />} onClick={() => setProviderOpen(true)}>
                  添加
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Skeleton animation="wave" sx={{ height: 300 }} />
          )}
        </Box>
        <Dialog open={providerOpen} onClose={() => {}} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">第三方登录</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                select
                id="type"
                name="type"
                label="服务商"
                value={formik.values.type}
                onChange={formik.handleChange}
                error={formik.touched.type && Boolean(formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
              >
                <MenuItem key={'FEISHU'} value={'FEISHU'}>
                  飞书
                </MenuItem>
                <MenuItem key={'DINGTALK'} value={'DINGTALK'}>
                  钉钉
                </MenuItem>
                <MenuItem key={'WEWORK'} value={'WEWORK'}>
                  企业微信
                </MenuItem>
              </TextField>
              <TextField
                label="name"
                id="name"
                fullWidth
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              ></TextField>
              <TextField
                label="clientId"
                id="clientId"
                fullWidth
                name="clientId"
                value={formik.values.clientId}
                onChange={formik.handleChange}
                error={formik.touched.clientId && Boolean(formik.errors.clientId)}
                helperText={formik.touched.clientId && formik.errors.clientId}
              ></TextField>
              <TextField
                label="clientSecret"
                id="clientSecret"
                fullWidth
                name="clientId"
                value={formik.values.clientSecret}
                onChange={formik.handleChange}
                error={formik.touched.clientSecret && Boolean(formik.errors.clientSecret)}
                helperText={formik.touched.clientSecret && formik.errors.clientSecret}
              ></TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={isDeleting} onClick={()=>setProviderOpen(false)}>
              取消
            </Button>
            <LoadingButton loading={isDeleting} onClick={handleDelete}>
              确认
            </LoadingButton>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteOpen}
          onClose={handleDeleteClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">删除敏感词</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">确认要删除该敏感词吗？无法恢复</DialogContentText>
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
      </MainCard>
    </Page>
  );
};

Organizations.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant={LAYOUT.MainLayout}>{page}</Layout>;
};

export default Organizations;
