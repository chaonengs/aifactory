import { NextApiRequest, NextApiResponse } from 'next';
import { KanbanColumn } from 'types/kanban';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { columnId, columnsOrder, columns } = req.body;
  columns.splice(
    columns.findIndex((column: KanbanColumn) => column.id === columnId),
    1
  );

  columnsOrder.splice(
    columnsOrder.findIndex((cId: string) => cId === columnId),
    1
  );
  return res.status(200).json({ columns, columnsOrder });
}
