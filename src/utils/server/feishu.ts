const getInternalTenantAccessToken = (appId, appSecret) => {
    const url = `https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal`;

    return fetch(url, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({app_id: appId, app_secret: appSecret}), // body data type must match "Content-Type" header
      })

}

const sendMessage = (accessToken, message) => {
    const url = 'https://open.feishu.cn/open-apis/im/v1/messages';

    return fetch(url, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message), // body data type must match "Content-Type" header
      })
}

const replyMessage = (accessToken, id, message) => {
    const url = `https://open.feishu.cn/open-apis/im/v1/messages/${id}/reply`;
    return fetch(url, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message), // body data type must match "Content-Type" header
      })
}

const patchMessage = (accessToken, id, message) => {
    const url = `https://open.feishu.cn/open-apis/im/v1/messages/${id}`;

    return fetch(url, {
        method: "PATCH", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message), // body data type must match "Content-Type" header
      })
}


const getUser = (accessToken, id, idType) => {
    const url = `https://open.feishu.cn/open-apis/contact/v3/users/${id}?user_id_type=${idType}`;
    return fetch(url, {
        method: "GET", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

}


const getChatHistory = (accessToken, chatId,pageToken,startTime,endTime) => {
  let url = `https://open.feishu.cn/open-apis/im/v1/messages?container_id_type=chat&container_id=${chatId}&start_time=${startTime}&end_time=${endTime}&sort_type=ByCreateTimeDesc&page_size=50`;
  if(pageToken){
    url+=`&page_token=${pageToken}`;
  }
  return fetch(url, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    })

}


export {sendMessage,replyMessage, patchMessage, getInternalTenantAccessToken, getUser, getChatHistory};