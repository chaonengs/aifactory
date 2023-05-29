import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanColumn, KanbanUserStory } from 'types/kanban';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { columnId, columns, item, items, storyId, userStory } = req.body;
  let newColumn = columns;
  if (columnId !== '0') {
    newColumn = columns.map((column: KanbanColumn) => {
      if (column.id === columnId) {
        return {
          ...column,
          itemIds: column.itemIds ? [...column.itemIds, item.id] : [item.id]
        };
      }
      return column;
    });
  }

  let newUserStory = userStory;
  if (storyId !== '0') {
    newUserStory = userStory.map((story: KanbanUserStory) => {
      if (story.id === storyId) {
        return { ...story, itemIds: story.itemIds ? [...story.itemIds, item.id] : [item.id] };
      }
      return story;
    });
  }

  const result = {
    items: [...items, item],
    columns: newColumn,
    userStory: newUserStory
  };

  return res.status(200).json({ ...result });
}
