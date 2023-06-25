import { App,Prisma} from '@prisma/client';
// Import necessary modules
const axios = require('axios');
const hostUrl=process.env.DINGTALK_URL;
// Define function to get access token
const AccessToken=async(app:App) =>{
const config = app.config as Prisma.JsonObject;
  const appKey = config['appId'] as string;
  const appSecret = config['appSecret'] as string;
  const url = hostUrl+'/v1.0/oauth2/accessToken';
  const headerConfig={
    headers:{
        'Content-Type':'application/json'
    }
  }
  const data = {
    "appKey": appKey,
    "appSecret": appSecret
  };
  try {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const json= await result.json();

    const accessToken = json.accessToken;
    // Store access token in local cache

    console.log('Access token stored in local cache');
    return accessToken;
  } catch (error) {
    console.error(error);
  }
}

// Define function to send message to DingTalk robot
const sendMessageToRobot=async(app:App, message:String,feishu:JSON)=> {
    if(feishu.conversationType==1){
      SingleChatSend(app,message,feishu);
    }else{
      GroupChatSend(app,message,feishu);
    }
 
  }

const SingleChatSend=async(app:App, message:String,feishu:JSON)=>{
  const token= await AccessToken(app);
  const url = hostUrl+`/v1.0/robot/oToMessages/batchSend`;
  const data = {
    msgParam: '{"title":"'+message+'","text":"'+message+'"}',
    msgKey: 'sampleMarkdown',
    userIds:[feishu.senderStaffId],
    robotCode:feishu.robotCode
  };

  try {
    const result=   await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-acs-dingtalk-access-token':token
      },
      body: JSON.stringify(data)
    });
    console.log(await result.json());
  } catch (error) {
    console.error(error);
  }
}
const GroupChatSend=async(app:App, message:String,feishu:JSON)=>{
  const token= await AccessToken(app);
  const url = hostUrl+`/v1.0/robot/groupMessages/send`;
  const data = {
    msgParam: '{"title":"'+message+'","text":"'+message+'"}',
    msgKey: 'sampleMarkdown',
    openConversationId:feishu.conversationId,
    robotCode:feishu.robotCode
  };
  try {
 const result=   await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-acs-dingtalk-access-token':token
      },
      body: JSON.stringify(data)
    });
    console.log(await result.json());
  } catch (error) {
    console.error(error);
  }
}


export default sendMessageToRobot;
