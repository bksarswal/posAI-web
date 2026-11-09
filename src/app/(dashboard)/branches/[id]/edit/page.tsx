import { RequireRole } from '../../../_components/RequireRole';
import { BranchEditForm } from '@/modules/branch/components/BranchEditForm';

interface EditBranchPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const { id } = await params;
  return (
    <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
      <BranchEditForm branchId={id} />
    </RequireRole>
  );
}
