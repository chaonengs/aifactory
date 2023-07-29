import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client/edge";

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],

});
const handler = async (req: NextRequest) => {
    const userCount = await prisma.user.findMany();
    return new Response(userCount.toString());
    
}
export default handler

export const config = {
    runtime: 'edge',
  };
  