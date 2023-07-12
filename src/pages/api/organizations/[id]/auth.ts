import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient, Provider } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', 
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    // FeiShuProvider({
    //   clientId: process.env.FEISHU_APP_ID as string,
    //   clientSecret: process.env.FEISHU_APP_SECRET as string,
    // }),
  ],

}

const generateProviders = (providers : Provider[]) => {
  
}


export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions)
  const organization = await prisma.organization.findUniqueOrThrow(req.query.id);

  console.log(req)
  if (session) {
    res.send({
      content:
        "This is protected content. You can access this content because you are signed in.",
    })
  } else {
    res.send({
      error: "You must be signed in to view the protected content on this page.",
    })
  }
}
