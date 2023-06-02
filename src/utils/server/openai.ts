import { App, Prisma } from "@prisma/client";

const { Configuration, OpenAIApi } = require("openai");

// "usage": {
//     "prompt_tokens": 5,
//     "completion_tokens": 7,
//     "total_tokens": 12
//   }

const chat = (configuration: any, prompt:string, model:string) => {
  const openai = new OpenAIApi(configuration);

  const completion = openai.createCompletion({
    model: model,
    prompt: prompt,
  });



  return completion;
}

const createConfiguration = (apiKey: string) =>{
  return new Configuration({
    apiKey: apiKey
  });
}

export {chat, createConfiguration};