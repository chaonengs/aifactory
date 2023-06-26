import { App, Prisma } from '@prisma/client';
import { DINGTALK_URL } from 'utils/server/const';
// Import necessary modules

// Define function to get access token
const AccessToken = async (app: App) => {
  const config = app.config as Prisma.JsonObject;
  const appKey = config['appId'] as string;
  const appSecret = config['appSecret'] as string;
  const url = DINGTALK_URL + `/v1.0/oauth2/accessToken`;
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
    const json = await result.json();

    const accessToken = json.accessToken;
    // Store access token in local cache

    //console.log('Access token stored in local cache');
    return accessToken;
  } catch (error) {
    console.error(error);
  }
}

// Define function to send message to DingTalk robot
const sendMessageToRobot = async (app: App, message: String, json: JSON) => {
  if (json.conversationType == 1) {
    SingleChatSend(app, message, json);
  } else {
    GroupChatSend(app, message, json);
  }

}

const SingleChatSend = async (app: App, message: String, json: JSON) => {
  const token = await AccessToken(app);
  const url = DINGTALK_URL + `/v1.0/robot/oToMessages/batchSend`;
  const data = {
    msgParam: '{"title":"' + message + '","text":"' + message + '"}',
    msgKey: 'sampleMarkdown',
    userIds: [json.senderStaffId],
    robotCode: json.robotCode
  };

  try {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-acs-dingtalk-access-token': token
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error(error);
  }
}
const GroupChatSend = async (app: App, message: String, json: JSON) => {
  const token = await AccessToken(app);
  const url = DINGTALK_URL + `/v1.0/robot/groupMessages/send`;
  const data = {
    msgParam: '{"title":"' + message + '","text":"' + message + '"}',
    msgKey: 'sampleMarkdown',
    openConversationId: json.conversationId,
    robotCode: json.robotCode
  };
  try {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-acs-dingtalk-access-token': token
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error(error);
  }
}


export default sendMessageToRobot;
