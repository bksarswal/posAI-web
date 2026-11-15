'use client';

import { useState } from 'react';
import { Modal } from 'antd';
import { Copy, Check, AlertTriangle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

export interface TempPasswordDialogProps {
  open: boolean;
  staffName?: string;
  temporaryPassword?: string;
  onClose: () => void;
}

export function TempPasswordDialog({
  open,
  staffName,
  temporaryPassword,
  onClose,
}: TempPasswordDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (!open || !temporaryPassword) {
    return null;
  }

  const handleCopy = async () => {
    setCopyError(false);
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      mask={{ closable: false }}
      keyboard={false}
      footer={null}
      destroyOnHidden
      centered
      title={
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
          <KeyRound className="h-5 w-5 text-blue-600" />
          <span>Temporary Password Generated</span>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <p className="text-sm text-slate-600">
          Staff member {staffName ? <strong className="text-slate-900">{staffName}</strong> : ''}{' '}
          has been created successfully. Share this temporary password so they can log in.
        </p>

        {/* Temporary password display with copy button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <code
              data-testid="temporary-password-display"
              className="font-mono text-base font-bold text-slate-900 tracking-wider select-all"
            >
              {temporaryPassword}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs text-green-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
          {copyError && (
            <p className="text-xs text-red-600 font-medium">
              Couldn&apos;t copy automatically. Select and copy the password manually.
            </p>
          )}
        </div>

        {/* Prominent warning: shown only once */}
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-900">This is shown only once</AlertTitle>
          <AlertDescription className="text-xs text-amber-800 mt-1">
            For security, this password will never be displayed again. If lost, an administrator
            will need to reset the staff member&apos;s password.
          </AlertDescription>
        </Alert>

        <div className="pt-2">
          <Button type="button" onClick={onClose} className="w-full">
            I&apos;ve saved it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
