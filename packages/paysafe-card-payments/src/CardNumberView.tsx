import React, { forwardRef, type Component } from 'react';
import { requireNativeComponent, ViewProps, NativeMethods } from 'react-native';

export type CardNumberViewProps = ViewProps;

const NativeCardNumberView = requireNativeComponent<CardNumberViewProps>('PSCardNumberView');

const CardNumberView = forwardRef<(Component<ViewProps> & NativeMethods) | null, CardNumberViewProps>(
  (props, ref) => {
    return (
      <NativeCardNumberView
        {...props}
        ref={ref as React.LegacyRef<React.Component<ViewProps> & NativeMethods>}
      />
    );
  }
);

export default CardNumberView;
