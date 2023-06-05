import {
    QuirrelClient,
    EnqueueJobOpts,
    EnqueueJobOptions,
    Job,
    DefaultJobOptions,
    QuirrelJobHandler,
    QuirrelOptions,
  } from "quirrel/client";
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
  
  export type NextApiHandler = (
    req: NextApiRequest,
    res: NextApiResponse
  ) => void | Promise<void>;
  
  export type {
    Job,
    EnqueueJobOpts,
    EnqueueJobOptions,
    DefaultJobOptions,
    QuirrelJobHandler,
  };
  
 
  
  export type Queue<Payload> = Omit<
    QuirrelClient<Payload>,
    "respondTo" | "makeRequest"
  >;


  async function enqueue(payload, options = {}) {
    const body = await this.payloadAndOptionsToBody(payload, options);
    if (this.oldBaseUrl && !options.override && options.id) {
        const res = await this.fetchAgainstOld(`/${encodeURIComponent(options.id)}`);
        if (res.status === 200) {
            return await this.toJob(await res.json());
        }
    }
    const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
        },
        credentials: "omit",
        body: JSON.stringify(body),
    });
    if (res.status === 201) {
        if (this.oldBaseUrl && options.override && options.id) {
            await this.fetchAgainstOld(`/${encodeURIComponent(options.id)}`, {
                method: "DELETE",
            });
        }
        return await this.toJob(await res.json());
    }
    throw new Error(`Unexpected response while trying to enqueue "${JSON.stringify(body)}" to ${this.applicationBaseUrl}: ${await res.text()}`);
  }
  
  
  export function Queue<Payload>(
    route: string,
    handler: QuirrelJobHandler<Payload>,
    options?: QuirrelOptions,
  ): Queue<Payload> & NextApiHandler {
    const quirrel = new QuirrelClient<Payload>({
      options,
      handler,
      route,
    });

    quirrel.enqueue = enqueue;
  
    async function nextApiHandler(req: NextApiRequest, res: NextApiResponse) {
      const response = await quirrel.respondTo(req.body, req.headers);
      res.status(response.status);
      for (const [header, value] of Object.entries(response.headers)) {
        res.setHeader(header, value);
      }
      res.send(response.body);
    }
  
    nextApiHandler.enqueue = (payload: Payload, options: EnqueueJobOptions) =>
      quirrel.enqueue(payload, options);
  
    nextApiHandler.enqueueMany = (
      jobs: { payload: Payload; options?: EnqueueJobOptions }[]
    ) => quirrel.enqueueMany(jobs);
  
    nextApiHandler.delete = (jobId: string) => quirrel.delete(jobId);
  
    nextApiHandler.invoke = (jobId: string) => quirrel.invoke(jobId);
  
    nextApiHandler.get = () => quirrel.get();
  
    nextApiHandler.getById = (jobId: string) => quirrel.getById(jobId);
  
    return nextApiHandler;
  }
  
  export function CronJob(
    route: string,
    cronSchedule: NonNullable<NonNullable<EnqueueJobOptions["repeat"]>["cron"]>,
    handler: () => Promise<void>,
    options?: QuirrelOptions
  ) {
    return Queue(route, handler, options) as unknown;
  }