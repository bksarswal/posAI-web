import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TempPasswordDialog } from './TempPasswordDialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TempPasswordDialog (src/modules/staff/components/TempPasswordDialog.tsx)', () => {
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalClipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('renders nothing when open is false or temporaryPassword is missing', () => {
    const { container, rerender } = render(
      <TempPasswordDialog
        open={false}
        staffName="Jane Doe"
        temporaryPassword="secret-password"
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <TempPasswordDialog
        open={true}
        staffName="Jane Doe"
        temporaryPassword={undefined}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders staff name, password, "This is shown only once" warning, and copy button when open', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(
      <TempPasswordDialog
        open={true}
        staffName="Jane Doe"
        temporaryPassword="MyTempPass123!"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('MyTempPass123!')).toBeInTheDocument();
    expect(screen.getByText(/this is shown only once/i)).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('MyTempPass123!');
  });

  it('handles clipboard failure: displays manual copy fallback message and keeps password visible', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(
      <TempPasswordDialog
        open={true}
        staffName="Jane Doe"
        temporaryPassword="MyTempPass123!"
        onClose={vi.fn()}
      />,
    );

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    await user.click(copyBtn);

    // Visible fallback note must appear
    expect(
      await screen.findByText(
        /couldn't copy automatically\. select and copy the password manually\./i,
      ),
    ).toBeInTheDocument();

    // Password must remain visible
    expect(screen.getByText('MyTempPass123!')).toBeInTheDocument();
  });

  it('does not close on Escape key or mask; only the explicit "I\'ve saved it" button closes it', async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(
      <TempPasswordDialog
        open={true}
        staffName="Jane Doe"
        temporaryPassword="MyTempPass123!"
        onClose={onCloseMock}
      />,
    );

    // No close (X) button rendered
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();

    // Pressing Escape does not close
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onCloseMock).not.toHaveBeenCalled();

    // Clicking mask does not close
    const mask = document.querySelector('.ant-modal-wrap');
    if (mask) {
      fireEvent.click(mask);
      expect(onCloseMock).not.toHaveBeenCalled();
    }

    // Only explicit "I've saved it" button closes it
    const saveBtn = screen.getByRole('button', { name: /i've saved it/i });
    await user.click(saveBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
