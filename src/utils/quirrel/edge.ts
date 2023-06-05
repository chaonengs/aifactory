import { EnqueueJobOptions, QuirrelClient, QuirrelJobHandler, QuirrelOptions } from "quirrel/client";
import { NextApiRequest } from "next/types";

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




  