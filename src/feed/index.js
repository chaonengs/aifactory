import useSWR from 'swr'
import { mutate } from "swr"

const fetcher = (...args) => fetch(...args).then(res => res.json())

export function useOrganization (id) {
  const url = `/api/rest/organizations/${id}?include=apps,aiResources`;
  const { data, error, isLoading } = useSWR(url, fetcher)
 
  return {
    url,
    organization: data,
    isLoading,
    isError: error
  }
}


export function useOrganizationUsers(userId) {
  const { data, error, isLoading } = useSWR(`/api/rest/organizationUsers?where={"userId":{"$eq":"${userId}"}}&include=organization`, fetcher)
  return {
    organizationUsers: data,
    isLoading,
    isError: error
  }
}


export function useApp(id) {
  const { data, error, isLoading } = useSWR(`/api/rest/apps/${id}`, fetcher)
 
  return {
    app: data,
    isLoading,
    isError: error
  }
}

export function useApps(organizationId) {
  const url = `/api/rest/apps?where={"organizationId":{"$eq":"${organizationId}"}}&include=aiResource`;
  const { data, error, isLoading } = useSWR(url, fetcher)
 
  return {
    url,
    apps: data,
    isLoading,
    isError: error
  }
}

export function useSensitiveWords(organizationId) {
  const { data, error, isLoading } = useSWR(`/api/rest/sensitiveWords?where={"organizationId":{"$eq":"${organizationId}"}}`, fetcher)
 
  return {
    sensitiveWords: data,
    isLoading,
    isError: error
  }
}

export function usePagedSensitiveWords(organizationId, page, size) {
  const url = `/api/rest/sensitiveWords?where={"organizationId":{"$eq":"${organizationId}"}}&orderBy={"createdAt":"$desc"}&page=${page}&limit=${size}`;
  const { data, error, isLoading } = useSWR(url, fetcher)
 
  return {
    url: url,
    page: data,
    isLoading,
    isError: error
  }
}

export function useAIResources(organizationId){
  const url = `/api/rest/aIResources?where={"organizationId":{"$eq":"${organizationId}"}}&include=apps`;
  const { data, error, isLoading } = useSWR(url, fetcher)
 
  return {
    url,
    aiResources: data,
    isLoading,
    isError: error
  }
}


export function useAIResource(id) {
  const { data, error, isLoading } = useSWR(`/api/rest/airesources/${id}`, fetcher)
 
  return {
    aiResource: data,
    isLoading,
    isError: error
  }
}

export function usePagedMessages(organizationId, page=1, size=10) {
  const url = `/api/rest/messages?where={"organizationId":{"$eq":"${organizationId}"}}&include=usage,sensitiveWordInMessage,app&orderBy={"createdAt":"$desc"}&page=${page}&limit=${size}`
  const { data, error, isLoading } = useSWR(url, fetcher)
 
  return {
    url,
    data: data,
    isLoading,
    isError: error
  }
}



 
// export function Profile () {
//   const { data, error, isLoading } = useSWR('/api/user/123', fetcher)
 
//   if (error) return <div>failed to load</div>
//   if (isLoading) return <div>loading...</div>
 
//   // render data
//   return <div>hello {data.name}!</div>
// }