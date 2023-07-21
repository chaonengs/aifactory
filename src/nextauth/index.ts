import { AuthClientConfig, apiBaseUrl, fetchData } from "next-auth/client/_utils"
import { BuiltInProviderType, RedirectableProviderType } from "next-auth/providers"
import { getCsrfToken } from "next-auth/react";
import { ClientSafeProvider, LiteralUnion, SignInAuthorizationParams, SignInOptions, SignInResponse } from "next-auth/react/types"
import _logger, { proxyLogger } from "nextauth/logger";



function parseUrl(url:any) {
    var _url2;
  
    const defaultUrl = new URL("http://localhost:3000/api/auth");
  
    if (url && !url.startsWith("http")) {
      url = `https://${url}`;
    }
  
    const _url = new URL((_url2 = url) !== null && _url2 !== void 0 ? _url2 : defaultUrl);
  
    const path = (_url.pathname === "/" ? defaultUrl.pathname : _url.pathname).replace(/\/$/, "");
    const base = `${_url.origin}${path}`;
    return {
      origin: _url.origin,
      host: _url.host,
      path,
      base,
      toString: () => base
    };
  }

const __NEXTAUTH: AuthClientConfig = {
    baseUrl: parseUrl(process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL).origin,
    basePath: parseUrl(process.env.NEXTAUTH_URL).path,
    baseUrlServer: parseUrl(
      process.env.NEXTAUTH_URL_INTERNAL ??
        process.env.NEXTAUTH_URL ??
        process.env.VERCEL_URL
    ).origin,
    basePathServer: parseUrl(
      process.env.NEXTAUTH_URL_INTERNAL ?? process.env.NEXTAUTH_URL
    ).path,
    _lastSync: 0,
    _session: undefined,
    _getSession: () => {},
  }
   const logger = proxyLogger(_logger, __NEXTAUTH.basePath)

  
  /**
 * It calls `/api/auth/providers` and returns
 * a list of the currently configured authentication providers.
 * It can be useful if you are creating a dynamic custom sign in page.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#getproviders)
 */
export async function getProviders(provider:string) {
    return await fetchData<
      Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>
    >(`providers/${provider}`, __NEXTAUTH, logger)
  }

  
  /**
   * Client-side method to initiate a signin flow
   * or send the user to the signin page listing all possible providers.
   * Automatically adds the CSRF token to the request.
   *
   * [Documentation](https://next-auth.js.org/getting-started/client#signin)
   */
  export async function signIn<
    P extends RedirectableProviderType | undefined = undefined
  >(
    provider?: LiteralUnion<
      P extends RedirectableProviderType
        ? P | BuiltInProviderType
        : BuiltInProviderType
    >,
    options?: SignInOptions,
    authorizationParams?: SignInAuthorizationParams
  ): Promise<
    P extends RedirectableProviderType ? SignInResponse | undefined : undefined
  > {
    const { callbackUrl = window.location.href, redirect = true } = options ?? {}

    
  const baseUrl = apiBaseUrl(__NEXTAUTH)
  const providers = await getProviders(provider)

  if (!providers) {
    window.location.href = `${baseUrl}/error`
    return
  }

  if (!provider || !(provider in providers)) {
    window.location.href = `${baseUrl}/signin?${new URLSearchParams({
      callbackUrl,
    })}`
    return
  }

  const isCredentials = providers[provider].type === "credentials"
  const isEmail = providers[provider].type === "email"
  const isSupportingReturn = isCredentials || isEmail
  
    const signInUrl = `${baseUrl}/${
      isCredentials ? "callback" : "signin"
    }/${provider}`
  
    const _signInUrl = `${signInUrl}?${new URLSearchParams(authorizationParams)}`
  
    const res = await fetch(_signInUrl, {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // @ts-expect-error
      body: new URLSearchParams({
        ...options,
        csrfToken: await getCsrfToken(),
        callbackUrl,
        json: true,
      }),
    })
  
    const data = await res.json()
  
    // TODO: Do not redirect for Credentials and Email providers by default in next major
    if (redirect || !isSupportingReturn) {
      const url = data.url ?? callbackUrl
      window.location.href = url
      // If url contains a hash, the browser does not reload the page. We reload manually
      if (url.includes("#")) window.location.reload()
      return
    }
  
    const error = new URL(data.url).searchParams.get("error")
  
    if (res.ok) {
      await __NEXTAUTH._getSession({ event: "storage" })
    }
  
    return {
      error,
      status: res.status,
      ok: res.ok,
      url: error ? null : data.url,
    } as any
  }
  