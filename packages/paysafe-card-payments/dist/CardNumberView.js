import React, { forwardRef } from 'react';
import { requireNativeComponent } from 'react-native';
const NativeCardNumberView = requireNativeComponent('PSCardNumberView');
const CardNumberView = forwardRef((props, ref) => {
    return React.createElement(NativeCardNumberView, Object.assign({}, props, { ref: ref }));
});
export default CardNumberView;
//# sourceMappingURL=CardNumberView.js.map