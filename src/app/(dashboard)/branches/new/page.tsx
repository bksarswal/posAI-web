import { RequireRole } from '../../_components/RequireRole';
import { BranchCreateForm } from '@/modules/branch/components/BranchCreateForm';

export default function NewBranchPage() {
  return (
    <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
      <BranchCreateForm />
    </RequireRole>
  );
}
