import { NextApiRequest, NextApiResponse } from 'next';
const userStoryIdsData = {
  userStory1: `1`,
  userStory2: `2`,
  userStory3: `3`,
  userStory4: `4`
};
const userStoryOrderData: string[] = [
  userStoryIdsData.userStory1,
  userStoryIdsData.userStory2,
  userStoryIdsData.userStory3,
  userStoryIdsData.userStory4
];
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ userStoryOrder: userStoryOrderData });
}
