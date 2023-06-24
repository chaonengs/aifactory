import { App,Prisma} from '@prisma/client';
// Import necessary modules
const axios = require('axios');
const fs = require('fs');

// Define function to get access token
const AccessToken=async(app:App) =>{
const config = app.config as Prisma.JsonObject;
  const appKey = config['appId'] as string;
  const appSecret = config['appSecret'] as string;
  const url = 'https://api.dingtalk.com/v1.0/oauth2/accessToken';
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
    const response = await axios.post(url,data,headerConfig);
    const accessToken = response.data.accessToken;
    // Store access token in local cache
   // fs.writeFileSync('access_token.txt', accessToken);
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
  const url = `https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend`;
  const data = {
    msgParam: '{"title":"'+message+'","text":"'+message+'"}',
    msgKey: 'sampleMarkdown',
    userIds:[feishu.senderStaffId],
    robotCode:feishu.robotCode
  };
  const headerConfig={
      headers:{
          'x-acs-dingtalk-access-token':token,
          'Content-Type':'application/json',
          
      }
    }
  try {
    const response = await axios.post(url, data, headerConfig);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
const GroupChatSend=async(app:App, message:String,feishu:JSON)=>{
  const token= await AccessToken(app);
  const url = `https://api.dingtalk.com/v1.0/robot/groupMessages/send`;
  const data = {
    msgParam: '{"title":"'+message+'","text":"'+message+'"}',
    msgKey: 'sampleMarkdown',
    openConversationId:feishu.conversationId,
    robotCode:feishu.robotCode
  };
  const headerConfig={
      headers:{
          'x-acs-dingtalk-access-token':token,
          'Content-Type':'application/json',
          
      }
    }
  try {
    const response = await axios.post(url, data, headerConfig);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}


export default sendMessageToRobot;
