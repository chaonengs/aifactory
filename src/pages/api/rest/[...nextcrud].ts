import NextCrud, { PrismaAdapter } from '@premieroctet/next-crud'
import { Prisma, PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"




const prismaClient = new PrismaClient()
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        res.status(401).json({ message: "You must be logged in." });
        return;
      }
    
  const nextCrudHandler = await NextCrud({
    adapter: new PrismaAdapter({
      prismaClient: prismaClient,
    }),
  })
  return nextCrudHandler(req, res)
}
export default handler