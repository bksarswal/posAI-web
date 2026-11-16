'use client';

import { useState } from 'react';
import { Modal } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { parseApiError } from '@/shared/lib/apiError';
import { useUpdateStaff } from '../staff.hooks';
import type { StaffItem } from '../staff.types';

export interface StaffDeactivateDialogProps {
  open: boolean;
  staff: StaffItem | null;
  onClose: () => void;
}

export function StaffDeactivateDialog({ open, staff, onClose }: StaffDeactivateDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateMutation = useUpdateStaff(staff?.id ?? '');

  const isActive = staff?.status === 'ACTIVE';
  const action = isActive ? 'Deactivate' : 'Activate';
  const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';

  const handleConfirm = async () => {
    if (!staff) return;
    setErrorMessage(null);

    try {
      await updateMutation.mutateAsync({ status: newStatus });
      onClose();
    } catch (err) {
      if (err) {
        setErrorMessage(
          parseApiError(err).message || `Failed to ${action.toLowerCase()} staff member.`,
        );
      }
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      centered
      title={
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
          <AlertTriangle className={`h-5 w-5 ${isActive ? 'text-red-500' : 'text-green-600'}`} />
          <span>{action} Staff Member</span>
        </div>
      }
    >
      <div className="pt-2 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-medium text-red-900">Error</AlertTitle>
            <AlertDescription className="text-sm text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-slate-600">
          {isActive ? (
            <>
              Are you sure you want to deactivate{' '}
              <strong className="text-slate-900">{staff?.name}</strong>? Their active sessions will
              be revoked and they will not be able to log in.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{' '}
              <strong className="text-slate-900">{staff?.name}</strong>? They will regain access to
              the system.
            </>
          )}
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 ${isActive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? `${action}ing...` : `${action}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
