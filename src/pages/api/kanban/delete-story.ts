import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanUserStory } from 'types/kanban';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userStory, storyId, userStoryOrder } = req.body;
  userStory.splice(
    userStory.findIndex((story: KanbanUserStory) => story.id === storyId),
    1
  );

  userStoryOrder.splice(
    userStoryOrder.findIndex((s: string) => s === storyId),
    1
  );
  const result = {
    userStory,
    userStoryOrder
  };
  return res.status(200).json({ ...result });
}
