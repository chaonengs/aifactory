import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { kv } from '@vercel/kv';

// const redis = new Redis({
//   url: "REPLACE",
//   token: "REPLACE",
// });

// type Query =         {
//     content: string,
//     createAt: Date
// };

// type QueryHistory = {
//     user: string,
//     queries: [
//         query
//     ]
// }


// const isExceedLimit = (queryHistory: QueryHistory, limit: number, duration: number): boolean => {
//     if(queryHistory.queries.length < limit){
//         return false;
//     } else {
//        return queryHistory.queries[0].createAt.getTime() > new Date().getTime() - duration * 1000
//     }
// }

// const getQueryHistory = async (userId: string): QueryHistory | null => {
//    const result =  await redis.get(userId);
//    if( result ){
//     return {
//         user: userId,
//         queries: result
//     }
//    }
//    return null;
// }

// const updateQueryHistory = async (userId: strinfg, query: QueryHistory): QueryHistory | null => {
//     const result =  await redis.get(userId);


// }


const handler = async (req: NextRequest) => {
    await kv.lpush("chaoneng", new Date())
    const result = await kv.lrange('chaoneng', 0, 0);
    return new Response(result.toString());
    
}
export default handler

export const config = {
    runtime: 'edge',
  };
  
  
  