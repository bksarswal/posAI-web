import { RequireRole } from '../_components/RequireRole';
import { StaffListView } from '@/modules/staff/components/StaffListView';

export default function StaffPage() {
  return (
    <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
      <StaffListView />
    </RequireRole>
  );
}
