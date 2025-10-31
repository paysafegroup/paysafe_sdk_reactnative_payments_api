import React, { forwardRef, type Component } from 'react';
import { requireNativeComponent, ViewProps, NativeMethods } from 'react-native';

export type ExpiryDatePickerViewProps = ViewProps;

const NativeExpiryDatePickerView = requireNativeComponent<ExpiryDatePickerViewProps>('PSExpiryDatePickerView');

const ExpiryDatePickerView = forwardRef<(Component<ViewProps> & NativeMethods) | null, ExpiryDatePickerViewProps>(
  (props, ref) => {
    return <NativeExpiryDatePickerView {...props} ref={ref} />;
  }
);

export default ExpiryDatePickerView;
