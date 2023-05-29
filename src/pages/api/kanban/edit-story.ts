import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanUserStory } from 'types/kanban';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userStory, story } = req.body;
  userStory.splice(
    userStory.findIndex((s: KanbanUserStory) => s.id === story.id),
    1,
    story
  );

  const result = {
    userStory
  };
  return res.status(200).json({ ...result });
}
