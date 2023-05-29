import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanColumn } from 'types/kanban';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { column, columns } = req.body;

  columns.splice(
    columns.findIndex((c: KanbanColumn) => c.id === column.id),
    1,
    column
  );
  return res.status(200).json({ columns });
}
