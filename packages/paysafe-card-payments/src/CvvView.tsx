import React, { forwardRef, type Component } from 'react';
import { requireNativeComponent, ViewProps, NativeMethods } from 'react-native';

export interface CvvViewProps extends ViewProps {
  cardType?: string;
}

const NativeCvvView = requireNativeComponent<CvvViewProps>('PSCvvView');

const CvvView = forwardRef<(Component<CvvViewProps> & NativeMethods) | null, CvvViewProps>(
  (props, ref) => {
    return <NativeCvvView {...props} ref={ref} />;
  }
);

export default CvvView;
