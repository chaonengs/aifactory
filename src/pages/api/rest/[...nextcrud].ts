import NextCrud, { PrismaAdapter } from '@premieroctet/next-crud'
import { Prisma, PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"


import { totp } from 'otplib';
// const token = totp.generate(process.env.REST_TOTP_SECRET);
// const isValid = totp.check(token, secret);
// const isValid = totp.verify({ token, secret });


const prismaClient = new PrismaClient()
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const nextCrudHandler = await NextCrud({
    adapter: new PrismaAdapter({
      prismaClient: prismaClient,
    }),
  })

  if(process.env.DEVELOPMENT_MODE === 'true'){
    return nextCrudHandler(req,res);
  }
  if (req.headers['totp']) {
    const secret = process.env.REST_TOTP_SECRET;
    if(totp.check(req.headers['totp'], process.env.REST_TOTP_SECRET)){
      return nextCrudHandler(req, res)
    }
  }

  res.status(401).send('not permitted');
  return;
}
export default handler