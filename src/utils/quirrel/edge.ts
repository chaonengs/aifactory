import { EnqueueJobOptions, QuirrelClient, QuirrelJobHandler, QuirrelOptions } from "quirrel/client";
import { type NextRequest } from 'next/server';
import { IncomingHttpHeaders, IncomingMessage } from "http";

export type Queue<Payload> = Omit<
  QuirrelClient<Payload>,
  "respondTo" | "makeRequest"
>;

export function Queue<Payload>(
  route: string,
  handler: QuirrelJobHandler<Payload>,
  options?: QuirrelOptions,
): Queue<Payload>  {
  const quirrel = new QuirrelClient<Payload>({
    options,
    handler,
    route,
  });

  async function edgeHandler(req: NextRequest) {
    let body = await req.json();
    let headers : { [key: string]: any } = {};
    console.log(JSON.stringify(body));
    // for (const [header, value] of Object.entries(req.headers)) {
    //   headers[header] = value;
    // }
    req.headers.forEach((v,k,p) => {
      headers[k] = v;
    })
    console.log(JSON.stringify(headers));
    const response = await quirrel.respondTo(body, headers);
    console.log(response);
    return new Response(
      response.body,
      {
        status:response.status,
        headers:response.headers
      }
    )
  }

  edgeHandler.enqueue = (payload: Payload, options: EnqueueJobOptions) =>
    quirrel.enqueue(payload, options);

    edgeHandler.enqueueMany = (
    jobs: { payload: Payload; options?: EnqueueJobOptions }[]
  ) => quirrel.enqueueMany(jobs);

  edgeHandler.delete = (jobId: string) => quirrel.delete(jobId);

  edgeHandler.invoke = (jobId: string) => quirrel.invoke(jobId);

  edgeHandler.get = () => quirrel.get();

  edgeHandler.getById = (jobId: string) => quirrel.getById(jobId);

  return edgeHandler;
}




  