'use client';

import { useState } from 'react';
import { Modal } from 'antd';
import { KeyRound } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { parseApiError } from '@/shared/lib/apiError';
import { useResetStaffPassword } from '../staff.hooks';
import { TempPasswordDialog } from './TempPasswordDialog';
import type { StaffItem } from '../staff.types';

export interface StaffResetPasswordDialogProps {
  open: boolean;
  staff: StaffItem | null;
  onClose: () => void;
}

export function StaffResetPasswordDialog({ open, staff, onClose }: StaffResetPasswordDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tempPasswordState, setTempPasswordState] = useState<{
    staffName: string;
    temporaryPassword: string;
  } | null>(null);

  const resetMutation = useResetStaffPassword(staff?.id ?? '');

  const handleConfirm = async () => {
    if (!staff) return;
    setErrorMessage(null);

    try {
      const res = await resetMutation.mutateAsync();
      const temporaryPassword = res?.data?.temporaryPassword;
      const staffName = staff.name;

      // Immediately wipe from mutation state so the password does not linger in TanStack cache
      resetMutation.reset();

      if (temporaryPassword) {
        setTempPasswordState({ staffName, temporaryPassword });
      } else {
        onClose();
      }
    } catch (err) {
      if (err) {
        setErrorMessage(
          parseApiError(err).message || 'Failed to reset password. Please try again.',
        );
      }
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  if (tempPasswordState) {
    return (
      <TempPasswordDialog
        open={true}
        staffName={tempPasswordState.staffName}
        temporaryPassword={tempPasswordState.temporaryPassword}
        description="has had their password reset. Share this temporary password so they can log in."
        onClose={() => {
          setTempPasswordState(null);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      centered
      title={
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
          <KeyRound className="h-5 w-5 text-amber-600" />
          <span>Reset Password</span>
        </div>
      }
    >
      <div className="pt-2 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <KeyRound className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-medium text-red-900">Error</AlertTitle>
            <AlertDescription className="text-sm text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-slate-600">
          This will generate a new temporary password for{' '}
          <strong className="text-slate-900">{staff?.name}</strong>. The temporary password will be
          shown once and must be shared with them immediately.
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={resetMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
