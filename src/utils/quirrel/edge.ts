import { EnqueueJobOptions, QuirrelClient, QuirrelJobHandler, QuirrelOptions } from "quirrel/client";
import { type NextRequest } from 'next/server';
import { IncomingHttpHeaders, IncomingMessage } from "http";

 async function respondTo(body, headers) {
  var _a;
  // if (process.env.NODE_ENV === "production") {
  //     const signature = headers["x-quirrel-signature"];
  //     if (typeof signature !== "string") {
  //         return {
  //             status: 401,
  //             headers: {},
  //             body: "Signature missing",
  //         };
  //     }
  //     if (!this.isValidSignature(body, signature)) {
  //         return {
  //             status: 401,
  //             headers: {},
  //             body: "Signature invalid",
  //         };
  //     }
  // }
  const payload = await this.decryptAndDecodeBody(body);
  const { id, count, retry, nextRepetition, exclusive } = JSON.parse((_a = headers["x-quirrel-meta"]) !== null && _a !== void 0 ? _a : "{}");
  this.logger.receivedJob(this.route, payload);
  try {
      const stream =  await this.handler(payload, {
          id,
          count,
          retry,
          nextRepetition,
          exclusive,
      });
      return new Response(stream);
      // return {
      //     status: 200,
      //     headers: {},
      //     body: "OK",
      // };
  }
  catch (error) {
      this.logger.processingError(this.route, payload, error);
      return new Response(String(error),  { status: 500 });
  }
}

async function enqueue(payload, options = {}) {
  const body = await this.payloadAndOptionsToBody(payload, options);
  if (this.oldBaseUrl && !options.override && options.id) {
      const res = await this.fetchAgainstOld(`/${encodeURIComponent(options.id)}`);
      if (res.status === 200) {
          return await this.toJob(await res.json());
      }
  }
  const res = await this.fetch(this.baseUrl, {
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


  
  
  // QuirrelClient.prototype.respondTo = respondTo;
  quirrel.respondTo = respondTo;
  quirrel.enqueue = enqueue;
  
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
    const response = await quirrel.respondTo(JSON.stringify(body), headers);
    console.log(response);
    return response;
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




  