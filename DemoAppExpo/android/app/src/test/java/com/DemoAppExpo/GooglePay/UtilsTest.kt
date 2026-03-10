// Copyright Paysafe 2025. All rights reserved.

import com.DemoAppExpo.GooglePay.GooglePayUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.every
import io.mockk.verify
import io.mockk.unmockkStatic
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class GooglePayUtilsTest {

  private val rootMap = mockk<WritableMap>(relaxed = true)
  private val billingMap = mockk<WritableMap>(relaxed = true)
  private val profileMap = mockk<WritableMap>(relaxed = true)
  private val dobMap = mockk<WritableMap>(relaxed = true)
  private val identityDocsArray = mockk<WritableArray>(relaxed = true)
  private val idDocMap = mockk<WritableMap>(relaxed = true)
  private val merchantDescriptorMap = mockk<WritableMap>(relaxed = true)
  private val shippingMap = mockk<WritableMap>(relaxed = true)
  private val threeDSMap = mockk<WritableMap>(relaxed = true)

  @Before
  fun setUp() {
    mockkStatic(Arguments::class)

    every { Arguments.createMap() } returnsMany listOf(
      rootMap,
      billingMap,
      profileMap,
      dobMap,
      idDocMap,
      merchantDescriptorMap,
      shippingMap,
      threeDSMap
    )

    every { Arguments.createArray() } returns identityDocsArray

    every { identityDocsArray.size() } returns 1
    every { identityDocsArray.getMap(0) } returns idDocMap

    every { idDocMap.getString("documentNumber") } returns "SSN123456"

    every { billingMap.getString("nickName") } returns "nickName"
    every { billingMap.getString("street") } returns "street"
    every { billingMap.getString("city") } returns "city"
    every { billingMap.getString("state") } returns "AL"
    every { billingMap.getString("country") } returns "US"
    every { billingMap.getString("zip") } returns "12345"

    every { profileMap.getString("firstName") } returns "firstName"
    every { profileMap.getString("lastName") } returns "lastName"
    every { profileMap.getString("locale") } returns "EN_GB"
    every { profileMap.getString("merchantCustomerId") } returns "merchantCustomerId"
    every { profileMap.getString("email") } returns "email@mail.com"
    every { profileMap.getString("phone") } returns "0123456789"
    every { profileMap.getString("mobile") } returns "0123456789"
    every { profileMap.getString("gender") } returns "MALE"
    every { profileMap.getString("nationality") } returns "nationality"
  }

  @After
  fun tearDown() {
    unmockkStatic(Arguments::class)
  }

  @Test
  fun `provideGooglePayTokenizeOptions calls createMap and sets all expected values`() {
    // when
    GooglePayUtils.provideGooglePayTokenizeOptions()

    // then
    verify { rootMap.putInt("amount", 1000) }
    verify { rootMap.putString("currencyCode", "USD") }
    verify { rootMap.putString("transactionType", "PAYMENT") }
    verify { rootMap.putString("merchantRefNum", "12345678") }
    verify { rootMap.putMap("billingDetails", billingMap) }
    verify { rootMap.putMap("profile", profileMap) }
    verify { rootMap.putString("accountId", "123456789") }
    verify { rootMap.putMap("merchantDescriptor", merchantDescriptorMap) }
    verify { rootMap.putMap("shippingDetails", shippingMap) }
    verify { rootMap.putString("simulator", "INTERNAL") }
    verify { rootMap.putMap("threeDS", threeDSMap) }

    verify { billingMap.putString("nickName", "nickName") }
    verify { billingMap.putString("street", "street") }
    verify { billingMap.putString("city", "city") }
    verify { billingMap.putString("state", "AL") }
    verify { billingMap.putString("country", "US") }
    verify { billingMap.putString("zip", "12345") }

    verify { profileMap.putString("firstName", "firstName") }
    verify { profileMap.putString("lastName", "lastName") }
    verify { profileMap.putString("locale", "EN_GB") }
    verify { profileMap.putString("merchantCustomerId", "merchantCustomerId") }
    verify { profileMap.putMap("dateOfBirth", dobMap) }
    verify { profileMap.putString("email", "email@mail.com") }
    verify { profileMap.putString("phone", "0123456789") }
    verify { profileMap.putString("mobile", "0123456789") }
    verify { profileMap.putString("gender", "MALE") }
    verify { profileMap.putString("nationality", "nationality") }
    verify { profileMap.putArray("identityDocuments", identityDocsArray) }

    verify { dobMap.putInt("day", 1) }
    verify { dobMap.putInt("month", 1) }
    verify { dobMap.putInt("year", 1990) }

    verify { identityDocsArray.pushMap(idDocMap) }

    verify { idDocMap.putString("documentNumber", "SSN123456") }

    verify { merchantDescriptorMap.putString("dynamicDescriptor", "dynamicDescriptor") }
    verify { merchantDescriptorMap.putString("phone", "0123456789") }

    verify { shippingMap.putString("shipMethod", "NEXT_DAY_OR_OVERNIGHT") }
    verify { shippingMap.putString("street", "street") }
    verify { shippingMap.putString("street2", "street2") }
    verify { shippingMap.putString("city", "Marbury") }
    verify { shippingMap.putString("state", "AL") }
    verify { shippingMap.putString("countryCode", "US") }
    verify { shippingMap.putString("zip", "36051") }

    verify {
      threeDSMap.putString(
        "merchantUrl",
        "https://api.qa.paysafe.com/checkout/v2/index.html#/desktop"
      )
    }
    verify { threeDSMap.putBoolean("process", true) }
  }
}
