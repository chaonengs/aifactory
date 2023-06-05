import {
    QuirrelClient,
    EnqueueJobOpts,
    EnqueueJobOptions,
    Job,
    DefaultJobOptions,
    QuirrelJobHandler,
    QuirrelOptions,
  } from "quirrel/dist/esm/src/client";
  import { registerDevelopmentDefaults } from "quirrel/dist/esm/src/client/config";
  import type { IncomingHttpHeaders } from "http";
  
  export interface NextApiRequest {
    body: any;
    headers: IncomingHttpHeaders;
  }
  
  export interface NextApiResponse {
    setHeader(key: string, value: string): void;
    status(code: number): void;
    send(body: string): void;
  }
  
  // export type EdgeHandler = (
  //   req: NextApiRequest,
  //   res: NextApiResponse
  // ) => void | Promise<void>;
  
  export type {
    Job,
    EnqueueJobOpts,
    EnqueueJobOptions,
    DefaultJobOptions,
    QuirrelJobHandler,
  };
  
  registerDevelopmentDefaults({
    applicationPort: 3000,
  });
  
  export type Queue<Payload> = Omit<
    QuirrelClient<Payload>,
    "respondTo" | "makeRequest"
  >;
  
  export function Queue<Payload>(
    route: string,
    handler: QuirrelJobHandler<Payload>,
    options?: QuirrelOptions,
  ): Queue<Payload> {
    const quirrel = new QuirrelClient<Payload>({
      options,
      handler,
      route,
    });
  
    async function edgeHandler(req: NextApiRequest) {
      const response = await quirrel.respondTo(req.body, req.headers);

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
  
  export function CronJob(
    route: string,
    cronSchedule: NonNullable<NonNullable<EnqueueJobOptions["repeat"]>["cron"]>,
    handler: () => Promise<void>,
    options?: QuirrelOptions
  ) {
    return Queue(route, handler, options) as unknown;
  }