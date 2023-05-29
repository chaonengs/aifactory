import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { columnsOrder } = req.body;
  return res.status(200).json({ columnsOrder });
}
