import { FC } from 'react';
// project imports
import GuestGuard from 'utils/route-guard/GuestGuard';
import NavMotion from './NavMotion';
// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout: FC = ({ children }) => (
  <NavMotion>
    <GuestGuard>
      <>{children}</>
    </GuestGuard>
  </NavMotion>
);

export default MinimalLayout;
