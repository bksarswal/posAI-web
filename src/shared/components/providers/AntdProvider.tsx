'use client';

import type { ReactNode } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb', // Brand primary accent
          colorSuccess: '#16a34a',
          colorWarning: '#eab308',
          colorError: '#dc2626',
          colorInfo: '#2563eb',
          colorTextBase: '#0f172a',
          colorBgBase: '#ffffff',
          colorBorder: '#cbd5e1',
          borderRadius: 8,
          fontFamily: 'inherit',
          controlHeight: 44, // 44px min-height touch targets for tablet/mobile
          fontSize: 14,
        },
        components: {
          Input: {
            controlHeight: 44,
            borderRadius: 8,
            activeBorderColor: '#2563eb',
            hoverBorderColor: '#3b82f6',
            colorBgContainer: '#ffffff',
            colorTextPlaceholder: '#94a3b8',
          },
          Button: {
            controlHeight: 44,
            borderRadius: 8,
            fontWeight: 500,
          },
          Select: {
            controlHeight: 44,
            borderRadius: 8,
          },
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
