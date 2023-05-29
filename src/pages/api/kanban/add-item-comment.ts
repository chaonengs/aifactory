import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanItem } from 'types/kanban';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { items, itemId, comment, comments } = req.body;
  const newItems = items.map((item: KanbanItem) => {
    if (item.id === itemId) {
      return {
        ...item,
        commentIds: item.commentIds ? [...item.commentIds, comment.id] : [comment.id]
      };
    }
    return item;
  });

  const result = {
    items: newItems,
    comments: [...comments, comment]
  };
  return res.status(200).json({ ...result });
}
