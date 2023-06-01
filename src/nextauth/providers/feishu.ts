import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

/** @see https://open.feishu.cn/document/common-capabilities/sso/api/get-user-info */
export interface FeiShuProfile extends Record<string, any> {
  sub: string
  name: string
  picture: string
  open_id: string
  union_id: string 
  en_name: string 
  tenant_key: string
  avatar_url: string
  avatar_thumb: string
  avatar_middle: string
  avatar_big: string
  email: string | null
  user_id: string | null
  employee_no: string | null
  mobile: string | null
  
}


export default function Feishu<P extends FeiShuProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "feishu",
    name: "FeiShu",
    type: "oauth",
    authorization: {
      url: "https://passport.feishu.cn/suite/passport/oauth/authorize",
      params: { scope: "read:user user:email" },
    },
    token: "https://passport.feishu.cn/suite/passport/oauth/token",
    userinfo: {
      url: "https://passport.feishu.cn/suite/passport/oauth/userinfo",
      async request({ client, tokens }) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const profile = await client.userinfo(tokens.access_token!)

        return profile
      },
    },
    profile(profile) {
      return {
        id: profile.union_id,
        name: profile.name ?? profile.en_name,
        email: profile.email,
        image: profile.avatar_url,
      }
    },
    style: {
      logo: "/assets/logs/feishu.png",
      logoDark: "/assets/logs/feishu.png",
      bg: "#fff",
      bgDark: "#000",
      text: "#000",
      textDark: "#fff",
    },
    options,
  }
}
