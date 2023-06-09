import { encode } from 'gpt-tokenizer';
import MessageQueue from 'pages/api/queues/messages';
import { OpenAIChatComletion, OpenAIRequest } from 'utils/server/openai';
import { totp } from 'otplib';


export default async function handler(req: Request): Promise<Response> {
  const { appId, messages, temperature } = (await req.json())
  const app = await (await fetch( `${process.env.NEXTAUTH_URL}/api/rest/apps/${appId}?include=aiResource`, {
    method: 'GET',
    headers: {
      'totp': totp.generate(process.env.REST_TOTP_SECRET)
    }
  })).json()
  const params:OpenAIRequest = {
    key: app.aiResource.apiKey,
    apiType: 'AZ_OPENAI',
    messages: messages
  }
  try{
   return (await OpenAIChatComletion(params));
  }catch(e){
    console.error(e);
    return new Response(JSON.stringify(e),{status:500});
  }
};


export const config = {
  runtime: 'edge',
};



