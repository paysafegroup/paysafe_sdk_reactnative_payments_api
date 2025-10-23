require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "react-native-paysafe-apple-pay"
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/paysafegroup/paysafe_sdk_react_native_payments_api.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,swift}"
  s.requires_arc = true

  s.dependency "React-Core", ">= 0.68.0"
  s.dependency "Paysafe_SDK", "~> 3.0"
end
