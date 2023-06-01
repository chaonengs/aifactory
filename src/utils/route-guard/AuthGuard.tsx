import { useRouter } from 'next/router';
// project imports
// import useAuth from 'hooks/useAuth';
import { GuardProps } from 'types';
import { useEffect } from 'react';
import Loader from 'components/ui-component/Loader';
import { useSession, signIn, signOut } from "next-auth/react"

// ==============================|| AUTH GUARD ||============================== //

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AuthGuard = ({ children }: GuardProps) => {
  
  const { data: session } = useSession()
  const router = useRouter();
  useEffect(() => {
    if (!session) {
      router.push('/auth/signIn');
    }
    // eslint-disable-next-line
  }, [session]);

  if (!session) return <Loader />;

  return children;
};

export default AuthGuard;
