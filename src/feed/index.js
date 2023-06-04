import useSWR from 'swr'

const fetcher = (...args) => fetch(...args).then(res => res.json())

function useOrganization (id) {
  const { data, error, isLoading } = useSWR(`/api/rest/organizations/${id}?include=apps,aiResources`, fetcher)
 
  return {
    organization: data,
    isLoading,
    isError: error
  }
}


function useApp(id) {
  const { data, error, isLoading } = useSWR(`/api/rest/apps/${id}`, fetcher)
 
  return {
    app: data,
    isLoading,
    isError: error
  }
}


function useAIResource(id) {
  const { data, error, isLoading } = useSWR(`/api/rest/airesources/${id}`, fetcher)
 
  return {
    aiResource: data,
    isLoading,
    isError: error
  }
}

function useMessages(organizationId) {
  const url = `/api/rest/messages?where={"organizationId":{"$eq":"${organizationId}"}}&include=usage`
  const { data, error, isLoading } = useSWR(url, fetcher)
 
  return {
    messages: data,
    isLoading,
    isError: error
  }
}

export {useOrganization, useApp, useAIResource, useMessages}


 
// function Profile () {
//   const { data, error, isLoading } = useSWR('/api/user/123', fetcher)
 
//   if (error) return <div>failed to load</div>
//   if (isLoading) return <div>loading...</div>
 
//   // render data
//   return <div>hello {data.name}!</div>
// }