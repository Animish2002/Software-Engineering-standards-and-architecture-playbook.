import { Outlet } from 'react-router';
import { ShieldOff } from 'lucide-react';
import { useCurrentUser } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { EmptyState } from '@/components/common/states';

export function RequirePermission({ permission }: { permission: string }) {
  const { permissionKeys } = useCurrentUser();
  if (!hasPermission(permissionKeys, permission)) {
    return <EmptyState icon={ShieldOff} title="You don't have access to this page" description="Ask an administrator if you think you should." />;
  }
  return <Outlet />;
}
