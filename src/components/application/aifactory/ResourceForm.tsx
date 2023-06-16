import { Button, FormControl, LinearProgress, MenuItem, Stack } from '@mui/material';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { Select, TextField } from 'formik-mui';
import * as React from 'react';
import * as Yup from 'yup';
import { OpenAIModels, ResourceTypes } from 'constant';
import useConfig from 'hooks/useConfig';

export type ResourceValues = {
  name: string;
  type: 'OPENAI' | 'AZ_OPENAI' | 'SELF_HOST_OPENAI';
  model: string | null | undefined;
  apiKey: string;
  hostUrl: string | null | undefined;
  quota: number | null | undefined;
  builtIn: boolean;
  apiVersion: string | null | undefined;
};

export const ResourceSchema = Yup.object().shape({
  name: Yup.string().min(2, '名称太短！').max(50, '名称太长！').required('名称是必须的！'),
  type: Yup.string().required('类型是必须的！'),
  model: Yup.string().when('type', {
    is: 'OPENAI',
    then: (schema) => schema.required()
  }),
  apiKey: Yup.string().when('builtIn', {
    is: false,
    then: (schema) => schema.required('API Key是必须的')
  }),
  builtIn: Yup.boolean(),
  hostUrl: Yup.string().when('type', {
    is: 'AZ_OPENAI',
    then: (schema) => schema.required('Azure资源必须输入Url')
  }),
  apiVersion: Yup.string().when('type', {
    is: 'AZ_OPENAI',
    then: (schema) => schema.required('Azure资源必须输入API版本')
  }),
  quota: Yup.number().nullable()
});

export const createResource = (organizationId: string, formValues: ResourceValues) => {
  const url = `/api/rest/aIResources`;

  const data = {
    organizationId,
    ...formValues
  };
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};

export const updateResource = (id: string, formValues: ResourceValues) => {
  const url = `/api/rest/aIResources/${id}`;
  const data = {
    organizationId: useConfig().organization,
    ...formValues
  };
  return fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};



export const deleteResource = (id: string) => {
  const url = `/api/rest/aIResources/${id}`;
  return fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
  }).then(response => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response;
  });
};


function ResourceForm({
  initialvalues,
  onSubmit
}: {
  initialvalues: Values;
  onSubmit: (values: Values, formikHelpers: FormikHelpers<Values>) => void | Promise<any>;
}) {
  return (
    <Formik
      initialValues={
        initialvalues || {
          name: '',
          type: '',
          model: '',
          apiKey: '',
          url: '',
          builtIn: false,
          quota: 1000000
        }
      }
      validationSchema={ResourceSchema}
      onSubmit={onSubmit}
    >
      {({ values, submitForm, isSubmitting }) => (
        <FormControl fullWidth>
          <Stack spacing={2}>
            <Field component={TextField} name="name" label="名称" />
            <Field component={Select} label="类型" name="type">
              {ResourceTypes.map((v, i) => (
                <MenuItem key={v.code} value={v.code}>
                  {v.name}
                </MenuItem>
              ))}
            </Field>
            {values.type === 'openai' && (
              <Field component={Select} name="model" label="模型">
                {OpenAIModels.map((v, i) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Field>
            )}
            {values.type === 'az-openai' && <Field component={TextField} name="url" label="URL"></Field>}
            <Field component={TextField} name="apiKey" label="API Key" />
            <Field component={TextField} name="quota" type="number" label="配额" />

            {isSubmitting && <LinearProgress />}
            <br />
          </Stack>
          <Button variant="contained" color="primary" disabled={isSubmitting} onClick={submitForm}>
            Submit
          </Button>
        </FormControl>
      )}
    </Formik>
  );
}

export { ResourceForm };
