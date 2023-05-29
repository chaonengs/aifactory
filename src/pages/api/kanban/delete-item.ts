import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanColumn, KanbanUserStory, KanbanItem } from 'types/kanban';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { columns, itemId, userStory, items } = req.body;
  const newColumn = columns.map((column: KanbanColumn) => {
    const itemIds = column.itemIds.filter((id: string) => id !== itemId);
    return {
      ...column,
      itemIds
    };
  });

  const newUserStory = userStory.map((story: KanbanUserStory) => {
    const itemIds = story.itemIds.filter((id: string) => id !== itemId);
    return {
      ...story,
      itemIds
    };
  });

  items.splice(
    items.findIndex((item: KanbanItem) => item.id === itemId),
    1
  );

  const result = {
    items,
    columns: newColumn,
    userStory: newUserStory
  };

  return res.status(200).json({ ...result });
}
