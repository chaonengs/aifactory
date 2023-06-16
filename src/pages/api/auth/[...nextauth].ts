import { PrismaClient, User as DBUser } from '@prisma/client';
import NextAuth, { Account, NextAuthOptions, Profile, User as AuthUser } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import EmailProvider from "next-auth/providers/email"
import FeiShuProvider from 'nextauth/providers/feishu';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { OAuthConfig } from "next-auth/providers"
import { sendVerificationRequest } from 'nextauth/providers/email';

const prisma = new PrismaClient();

// const createUser = (account:Account, profile:Profile, user:AuthUser) => {
//   return prisma.user.create(
//     {
//       data:{
//         username: user.name || profile.name || profile.login,
//         provider: account.provider,
//         providerAccountId: account.providerAccountId,
//         email: user.email || profile.email || null,
//         avatar: user.image || profile.image || null,
//         organizations: {
//           create:{
//             name: user.name || profile.name || profile.login,
//           }
//         }
//       }
//     }
//   )
// }

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', 
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,

      sendVerificationRequest: sendVerificationRequest,
      // maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    // FeiShuProvider({
    //   clientId: process.env.FEISHU_APP_ID as string,
    //   clientSecret: process.env.FEISHU_APP_SECRET as string,
    // }),
  ],
  events: {
    async createUser(authuser) {
      const regex = /@\S+\.\S+/gm;
      if(!authuser.user.name && authuser.user.email) {
        authuser.user.name = authuser.user.email.replace(regex, '');
        const user = await prisma.user.update({
          where: {
            id: authuser.user.id
          },
          data: {
            name: authuser.user.name
          }
        })
        
      }

      const org = await prisma.organization.findUnique({
        where: {
          id: authuser.user.id
        }
      })
      if(org === null || org === undefined){
        await prisma.organization.create({
          data: {
            id: authuser.user.id,
            name: authuser.user.name as string,
            users: {
              create: [
                {
                  role: 'OWNER',
                  user: {
                    connect: {
                      id: authuser.user.id
                    }
                  }
                }
              ]
            }
          }
        })
      }
    }
  },
  callbacks: {
    async session({ session, token, user }) {
      session.user.id = user.id
      return session
    }
  }

    // FeiShuProvider({
    //   clientId: process.env.FEISHU_APP_ID as string,
    //   clientSecret: process.env.FEISHU_APP_SECRET as string,
    // })
  // callbacks: {
  //   async signIn({ user, account, profile, email, credentials }) {
  //     if(account?.provider && account?.providerAccountId){
  //       const dbUser = await prisma.user.findUnique({where:{
  //         provider_providerAccountId:{provider:account?.provider, providerAccountId:account?.providerAccountId}
  //       }})
  //       if(dbUser === null){
  //         await createUser(account, profile!, user)
  //       }
  //     }
  //     return true
  //   },
  //   async redirect({ url, baseUrl }) {
  //     return baseUrl
  //   },
  //   async session({ session, user, token }) {
  //     return session
  //   },
  //   async jwt({ token, user, account, profile, isNewUser }) {
  //     return token
  //   }
  // }
  /*
  account:
  {
    provider: "github",
    type: "oauth",
    providerAccountId: "99374138",
    access_token: "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",
    token_type: "bearer",
    scope: "read:user,user:email",
  }
  profile
  {
    login: "chaonengs",
    id: 99374138,
    node_id: "U_kgDOBexUOg",
    avatar_url: "https://avatars.githubusercontent.com/u/99374138?v=4",
    gravatar_id: "",
    url: "https://api.github.com/users/chaonengs",
    html_url: "https://github.com/chaonengs",
    followers_url: "https://api.github.com/users/chaonengs/followers",
    following_url: "https://api.github.com/users/chaonengs/following{/other_user}",
    gists_url: "https://api.github.com/users/chaonengs/gists{/gist_id}",
    starred_url: "https://api.github.com/users/chaonengs/starred{/owner}{/repo}",
    subscriptions_url: "https://api.github.com/users/chaonengs/subscriptions",
    organizations_url: "https://api.github.com/users/chaonengs/orgs",
    repos_url: "https://api.github.com/users/chaonengs/repos",
    events_url: "https://api.github.com/users/chaonengs/events{/privacy}",
    received_events_url: "https://api.github.com/users/chaonengs/received_events",
    type: "User",
    site_admin: false,
    name: null,
    company: null,
    blog: "",
    location: null,
    email: "chaoneng@talentorg.com",
    hireable: null,
    bio: null,
    twitter_username: null,
    public_repos: 12,
    public_gists: 0,
    followers: 0,
    following: 2,
    created_at: "2022-02-10T01:18:54Z",
    updated_at: "2023-05-29T02:53:34Z",
    private_gists: 0,
    total_private_repos: 10,
    owned_private_repos: 9,
    disk_usage: 11228,
    collaborators: 2,
    two_factor_authentication: false,
    plan: {
      name: "free",
      space: 976562499,
      collaborators: 0,
      private_repos: 10000,
    },
  }
  plan:
  {
    name: "free",
    space: 976562499,
    collaborators: 0,
    private_repos: 10000,
  }
  user:
  {
    id: "99374138",
    name: "chaonengs",
    email: "chaoneng@talentorg.com",
    image: "https://avatars.githubusercontent.com/u/99374138?v=4",
  }
  */

  // callbacks: {
  //   async signIn({ user, account, profile, email, credentials }) {
  //     const prisma = new PrismaClient();
  //     credentials.


  //     const isAllowedToSignIn = true
  //     if (isAllowedToSignIn) {
  //       return true
  //     } else {
  //       // Return false to display a default error message
  //       return false
  //       // Or you can return a URL to redirect to:
  //       // return '/unauthorized'
  //     }
  //   }
  // }
};

export default NextAuth(authOptions);



