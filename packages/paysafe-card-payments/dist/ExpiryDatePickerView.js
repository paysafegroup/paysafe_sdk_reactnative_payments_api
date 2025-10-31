import React, { forwardRef } from 'react';
import { requireNativeComponent } from 'react-native';
const NativeExpiryDatePickerView = requireNativeComponent('PSExpiryDatePickerView');
const ExpiryDatePickerView = forwardRef((props, ref) => {
    return React.createElement(NativeExpiryDatePickerView, Object.assign({}, props, { ref: ref }));
});
export default ExpiryDatePickerView;
//# sourceMappingURL=ExpiryDatePickerView.js.map