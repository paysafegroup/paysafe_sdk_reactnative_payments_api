import React, { forwardRef } from 'react';
import { requireNativeComponent } from 'react-native';
const NativeCardholderNameView = requireNativeComponent('PSCardholderNameView');
const CardholderNameView = forwardRef((props, ref) => {
    return React.createElement(NativeCardholderNameView, Object.assign({}, props, { ref: ref }));
});
export default CardholderNameView;
//# sourceMappingURL=CardholderNameView.js.map