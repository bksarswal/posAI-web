import { RequireRole } from '../../_components/RequireRole';
import { StaffCreateForm } from '@/modules/staff/components/StaffCreateForm';

export default function NewStaffPage() {
  return (
    <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
      <StaffCreateForm />
    </RequireRole>
  );
}
