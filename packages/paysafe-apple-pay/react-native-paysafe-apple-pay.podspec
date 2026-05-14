require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "react-native-paysafe-apple-pay"
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => 'https://github.com/paysafe/paysafe-sdk.git', :tag => "#{s.version}" }

  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.requires_arc = true

  s.frameworks   = 'PassKit'

  pod_xcconfig = {}

  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency 'React-Core'

    if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
      s.compiler_flags = folly_compiler_flags + ' -DRCT_NEW_ARCH_ENABLED=1'
      pod_xcconfig = {
        'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/boost"',
        'OTHER_CPLUSPLUSFLAGS' => '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1',
        'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
      }
      s.dependency 'React-Codegen'
      s.dependency 'RCT-Folly'
      s.dependency 'RCTRequired'
      s.dependency 'RCTTypeSafety'
      s.dependency 'ReactCommon/turbomodule/core'
    end
  end

  s.dependency 'PaysafePaymentsSDK'

  s.pod_target_xcconfig = pod_xcconfig unless pod_xcconfig.empty?
end
