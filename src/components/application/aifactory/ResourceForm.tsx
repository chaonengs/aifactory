
import * as Yup from 'yup';


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
  hostUrl: Yup.string().nullable().when('type', {
    is: 'AZ_OPENAI',
    then: (schema) => schema.required('Azure资源必须输入Url')
  }),
  apiVersion: Yup.string().nullable().when('type', {
    is: 'AZ_OPENAI',
    then: (schema) => schema.required('Azure资源必须输入API版本')
  }),
  tokenRemains:Yup.number().positive().min(0, '剩余额度不能为负'),
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


