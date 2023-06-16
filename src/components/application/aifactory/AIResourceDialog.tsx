import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  FormControl,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';

// project imports
import {LoadingButton} from '@mui/lab';
import { AZApiVersions, OpenAIModels, ResourceTypes } from 'constant';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import { ResourceSchema, ResourceValues, createResource, updateResource } from './ResourceForm';
import { AIResource } from '@prisma/client';
import { useEffect, useState } from 'react';

const AIResourceDialog = (props: DialogProps & { aiResource: AIResource; organizationId: string; onCancel:()=>void }) => {
  const newResourceValues: ResourceValues = {
    name: '',
    type: 'OPENAI',
    model: '',
    apiKey: '',
    hostUrl: null,
    builtIn: false,
    quota: null,
    apiVersion: null
  };

  const updateResourceValues: ResourceValues = {
    name: props.aiResource.name,
    type: props.aiResource.type,
    model: props.aiResource.model,
    apiKey: props.aiResource.apiKey,
    hostUrl: props.aiResource.hostUrl,
    builtIn: props.aiResource.builtIn,
    quota: props.aiResource.quota,
    apiVersion: props.aiResource.apiVersion,
  };

  const formik = useFormik({
    initialValues: props.aiResource?.id ? updateResourceValues: newResourceValues,
    validationSchema: ResourceSchema,

    onSubmit: async (values, { setSubmitting }) => {
      if (props.aiResource) {
        await toast.promise(updateResource(props.aiResource.id, values), {
          pending: '保存中',
          success: '保存成功 👌',
          error: '保存失败 🤯'
        });
      } else {
        await toast.promise(createResource(props.organizationId, values), {
          pending: '保存中',
          success: '保存成功 👌',
          error: '保存失败 🤯'
        });
      }
      setSubmitting(false);
    }
  });

  useEffect(() => {
    formik.resetForm();
  }, [props.aiResource]);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      aria-labelledby="resource-dialog-title"
      aria-describedby="resource-dialog-description"
      fullWidth
    >
      <DialogTitle id="resource-dialog-title">{props.aiResource ? '编辑资源' : '新建资源'}</DialogTitle>
      <DialogContent>
        <br></br>

        <FormControl fullWidth>
          <Stack spacing={2}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="名称"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              id="type"
              name="type"
              label="类型"
              select
              value={formik.values.type}
              onChange={formik.handleChange}
              error={formik.touched.type && Boolean(formik.errors.type)}
              helperText={formik.touched.type && formik.errors.type}
            >
              {ResourceTypes.map((v, i) => (
                <MenuItem key={v.code} value={v.code}>
                  {v.name}
                </MenuItem>
              ))}
            </TextField>
            {formik.values.type === 'OPENAI' && (
              <TextField
                fullWidth
                id="model"
                name="model"
                label="模型"
                select
                value={formik.values.model}
                onChange={formik.handleChange}
                error={formik.touched.model && Boolean(formik.errors.model)}
                helperText={formik.touched.model && formik.errors.model}
              >
                {OpenAIModels.map((v, i) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {formik.values.type === 'AZ_OPENAI' && (
              <TextField
                fullWidth
                id="hostUrl"
                name="hostUrl"
                label="URL"
                value={formik.values.hostUrl}
                onChange={formik.handleChange}
                error={formik.touched.hostUrl && Boolean(formik.errors.hostUrl)}
                helperText={formik.touched.hostUrl && formik.errors.hostUrl}
              />
            )}
            {formik.values.type === 'AZ_OPENAI' && (
              <TextField
                fullWidth
                select
                id="apiVersion"
                name="apiVersion"
                label="API版本"
                value={formik.values.apiVersion}
                onChange={formik.handleChange}
                error={formik.touched.apiVersion && Boolean(formik.errors.apiVersion)}
                helperText={formik.touched.apiVersion && formik.errors.apiVersion}
              >
                {AZApiVersions.map((v, i) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              id="apiKey"
              name="apiKey"
              label="API Key"
              value={formik.values.apiKey}
              onChange={formik.handleChange}
              error={formik.touched.apiKey && Boolean(formik.errors.apiKey)}
              helperText={formik.touched.apiKey && formik.errors.apiKey}
            />
            {/* <TextField
          fullWidth
          id="quota"
          name="quota"
          label="配额"
          type='number'
          value={formik.values.quota}
          onChange={formik.handleChange}
          error={formik.touched.quota && Boolean(formik.errors.quota)}
          helperText={formik.touched.quota && formik.errors.quota}
        /> */}
            {/* {formik.isSubmitting && <LinearProgress />} */}
            <br />
          </Stack>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>{
          props.onCancel();
        }}>取消</Button>
        <LoadingButton loading={formik.isSubmitting} onClick={formik.submitForm}>
          保存
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default AIResourceDialog;
