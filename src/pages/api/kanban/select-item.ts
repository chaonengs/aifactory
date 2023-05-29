import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { selectedItem } = req.body;
  return res.status(200).json({ selectedItem });
}
