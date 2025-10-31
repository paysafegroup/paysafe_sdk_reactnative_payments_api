import React, { forwardRef, type Component } from 'react';
import { requireNativeComponent, ViewProps, NativeMethods } from 'react-native';

export type CardholderNameViewProps = ViewProps;

const NativeCardholderNameView = requireNativeComponent<CardholderNameViewProps>('PSCardholderNameView');

const CardholderNameView = forwardRef<(Component<ViewProps> & NativeMethods) | null, CardholderNameViewProps>(
  (props, ref) => {
    return <NativeCardholderNameView {...props} ref={ref} />;
  }
);

export default CardholderNameView;
