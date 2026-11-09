import { RequireRole } from '../_components/RequireRole';
import { RestaurantSettingsForm } from '@/modules/restaurant';

export default function RestaurantSettingsPage() {
  return (
    <RequireRole allowedRoles={['OWNER', 'ADMIN']}>
      <RestaurantSettingsForm />
    </RequireRole>
  );
}
