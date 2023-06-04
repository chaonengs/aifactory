import { NextApiRequest, NextApiResponse } from "next/types";

export function withFireAndForget(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        let promiseResolve: () => void = ()=>{throw Error("promiseResolved was not reassigned!")}
        const finishedPromise = new Promise<void>((resolve) => {
            promiseResolve = resolve;
        });
        const origEnd = res.end;
        //@ts-ignore
        res.end = async function newEnd(this: NextApiResponse, ...args: unknown[]) {
            await finishedPromise;
            //@ts-ignore
            return origEnd.call(this, ...args);
        };

        const result = await handler(req, res);
        promiseResolve();
        return result;
    };
}

// export function runAfterEndHandler(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,  ended: (req: NextApiRequest, res: NextApiResponse) => Promise<void>){
//     return async (req: NextApiRequest, res: NextApiResponse) => {
    
//         res.end = async function newEnd(this: NextApiResponse, ...args: unknown[]) {
//             await ended(res,req);
//             //@ts-igno
//             this.finished = false;

//             return origEnd.call(this, ...args);
//         };
//         const handlerResult = await origHandler(req, res);
//     }
// }