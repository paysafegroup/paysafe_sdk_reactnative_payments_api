import React, { forwardRef } from 'react';
import { requireNativeComponent } from 'react-native';
const NativeCvvView = requireNativeComponent('PSCvvView');
const CvvView = forwardRef((props, ref) => {
    return React.createElement(NativeCvvView, Object.assign({}, props, { ref: ref }));
});
export default CvvView;
//# sourceMappingURL=CvvView.js.map