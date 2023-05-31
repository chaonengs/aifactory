import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

const columns:GridColDef[] = [
  { field:'id', headerName:'ID' },
  {
    field:'appName',
    headerName:'应用名称',
  },
  {
    field:'username',
    headerName:'用户名称',
  },
  {
    field:'question',
    headerName:'问题',
    width:350,
  },
  {
    field:'answer',
    headerName:'回答',
    width:800,

  },
  {
    field:'model',
    headerName:'模型',
    width:150,
  },
  {
    field:'token',
    headerName:'Token消耗',
  },
  {
    field:'sensitive',
    headerName:'敏感词',
  },
  {
    field:'createdAt',
    headerName:'时间',
    width:150,
  },
];

const rows =[
{ 
  id:1, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'你可以简述一下自己的工作经历吗？', 
  answer:'我从事人力资源工作已经超过十年了，期间在多家公司工作过，包括初创公司和大型企业，我在招聘、员工关系、培训和发展等各个领域都有丰富的经验。', 
  model:'gpt-4', 
  token:'2345', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:00:00'
},
{ 
  id:2, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'你认为自己的优势和弱点是什么？', 
  answer:'我的优势在于我有很强的人际交往能力和解决问题的能力，能有效地协调各种人际关系，解决复杂的人力资源问题。我的弱点可能是对技术细节不够精通，我正在努力学习和提升这方面的知识。', 
  model:'gpt-4', 
  token:'2456', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:05:00'
},
{ 
  id:3, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'你对于这个职位有什么期望？', 
  answer:'我期望这个职位能让我更好地发挥我的专业技能，同时也能提供足够的挑战，让我有机会不断学习和成长。', 
  model:'gpt-4', 
  token:'2567', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:10:00'
},
{ 
  id:4, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'如果你遇到工作中的问题或困难，你通常会如何处理？', 
  answer:'我会首先尝试分析问题的根源，然后寻找可能的解决方案，如果需要，我会寻求同事或上级的帮助，共同找到解决问题的最佳方案。', 
  model:'gpt-4', 
  token:'2678', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:15:00'
},
{ 
  id:5, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'你对自己未来的职业发展有什么规划？', 
  answer:'我希望能继续深入研究人力资源管理的各个领域，不断提升我的专业能力，同时也希望有机会承担更大的责任，如担任人力资源部门的主管或管理者。', 
  model:'gpt-4', 
  token:'2789', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:20:00'
},
{ 
  id:6, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'你能否描述一下，在上一份工作中你对团队合作的理解和实践？', 
  answer:'在我看来，团队合作是达成目标的重要手段。在我上一份工作中，我积极协调团队成员，建立有效的沟通机制，让每个人都能发挥他们的优势。', 
  model:'gpt-4', 
  token:'2890', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:25:00'
},
{ 
  id:7, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'你对于我们公司的了解有多少？你为什么选择我们公司？', 
  answer:'我对贵公司的文化、业务和价值观有深入的了解。我选择贵公司是因为我认为这里有很好的发展机会，同时贵公司的价值观也和我个人的职业理念相吻合。', 
  model:'gpt-4', 
  token:'2901', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:30:00'
},
{ 
  id:8, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'在处理工作压力和平衡生活中，你有什么特别的方法吗？', 
  answer:'我通常会制定清晰的工作计划，并保持良好的生活习惯，如规律的饮食和运动，保持足够的休息，这些都有助于我处理工作压力和保持生活平衡。', 
  model:'gpt-4', 
  token:'3012', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:35:00'
},
{ 
  id:9, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'在上一份工作中，你认为自己最大的成就是什么？', 
  answer:'我认为我的最大成就是帮助公司建立了一个高效的招聘系统，大大提高了公司的招聘效率，同时也提高了员工的满意度。', 
  model:'gpt-4', 
  token:'3123', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:40:00'
},
{ 
  id:10, 
  appName:'FeishuBot', 
  username:'袁佩璋', 
  question:'在过去的工作经验中，你有过和上级或同事产生严重分歧的情况吗？你是如何处理的？', 
  answer:'在过去的工作中，我确实遇到过和同事有分歧的情况。我通常会尝试理解他们的观点，寻找共同点，通过开放和坦诚的沟通解决问题。', 
  model:'gpt-4', 
  token:'3234', 
  sensitive:'无', 
  createdAt:'2023-05-30 10:45:00'
}
]

export default function MessageHistory() {
  return (
    <Box sx={{  width:'100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination:{
            paginationModel:{
              pageSize:10,
            },
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
}