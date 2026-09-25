'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/authprovider';
import { roleHasMemberPermission } from '@/lib/memberAccess';

export default function MemberPermissionGate({ permission, children }) {
  const { accessRole, profileLoading } = useAuth();
  const allowed = roleHasMemberPermission(accessRole, permission);

  useEffect(() => {
    if (!profileLoading && !allowed) window.location.replace('/profile');
  }, [allowed, profileLoading]);

  if (profileLoading) {
    return <div className="mt-20 text-center opacity-70">Checking access…</div>;
  }
  if (!allowed) return null;
  return children;
}
