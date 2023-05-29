import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.body;
  return res.status(200).json({ billing: address! });
}
