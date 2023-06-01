import { useEffect } from 'react';
import { useRouter } from 'next/router';

// project imports
import useAuth from 'hooks/useAuth';
import { DASHBOARD_PATH } from 'config';
import { GuardProps } from 'types';
import Loader from 'components/ui-component/Loader';
import { useSession, signIn, signOut } from "next-auth/react"

// ==============================|| GUEST GUARD ||============================== //

/**
 * Guest guard for routes having no auth required
 * @param {PropTypes.node} children children element/node
 */

const GuestGuard = ({ children }: GuardProps) => {
  // const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      router.push(DASHBOARD_PATH);
    }
    // eslint-disable-next-line
  }, [session]);

  if (session) return <Loader />;

  return children;
};

export default GuestGuard;
