// Copyright Paysafe 2025. All rights reserved.

package com.DemoAppExpo.savedCards

import com.DemoAppExpo.R as DemoAppRes
import com.DemoAppExpo.savedCards.ui.mapper.payment.PSCreditCardType
import com.DemoAppExpo.savedCards.data.domain.card.Card
import com.DemoAppExpo.savedCards.data.domain.card.CardExpiry
import com.DemoAppExpo.savedCards.data.domain.payment.PaymentHandle
import com.DemoAppExpo.savedCards.ui.mapper.payment.PaymentHandleMapper
import org.junit.Assert.assertEquals
import kotlin.test.Test

class PaymentHandleMapperTest {

  @Test
  fun `should map MASTERCARD payment handle to UiSavedCardData`() {
    // given
    val paymentHandle = PaymentHandle(
      paymentHandleToken = "testToken",
      card = Card(
        cardType = PSCreditCardType.MASTERCARD.value,
        lastDigits = "1234",
        holderName = "John Doe",
        cardExpiry = CardExpiry(month = "08", year = "2025")
      )
    )

    // when
    val uiData = PaymentHandleMapper.toUI(paymentHandle, "customerToken")

    // then
    assertEquals(DemoAppRes.drawable.ic_cc_mastercard, uiData.cardBrandRes)
    assertEquals(PSCreditCardType.MASTERCARD, uiData.cardBrandType)
    assertEquals("1234", uiData.lastDigits)
    assertEquals("John Doe", uiData.holderName)
    assertEquals("08", uiData.expiryMonth)
    assertEquals("2025", uiData.expiryYear)
    assertEquals("08-2025", uiData.expiryDate)
    assertEquals("testToken", uiData.paymentHandleTokenFrom)
    assertEquals("customerToken", uiData.singleUseCustomerToken)
  }

  @Test
  fun `should map VISA payment handle and fallback singleUseCustomerToken`() {
    // given
    val paymentHandle = PaymentHandle(
      paymentHandleToken = "visaToken",
      card = Card(
        cardType = PSCreditCardType.VISA.value,
        lastDigits = "5678",
        holderName = "Jane Smith",
        cardExpiry = CardExpiry(month = "11", year = "2024")
      )
    )

    // when
    val uiData = PaymentHandleMapper.toUI(paymentHandle, null)

    // then
    assertEquals(DemoAppRes.drawable.ic_cc_visa, uiData.cardBrandRes)
    assertEquals(PSCreditCardType.VISA, uiData.cardBrandType)
    assertEquals("5678", uiData.lastDigits)
    assertEquals("Jane Smith", uiData.holderName)
    assertEquals("11", uiData.expiryMonth)
    assertEquals("2024", uiData.expiryYear)
    assertEquals("11-2024", uiData.expiryDate)
    assertEquals("visaToken", uiData.paymentHandleTokenFrom)
    assertEquals("SP5PhDcXzlI8qEoP", uiData.singleUseCustomerToken)
  }

  @Test
  fun `should fallback values when card is null`() {
    // given
    val paymentHandle = PaymentHandle(
      paymentHandleToken = null,
      card = null
    )

    // when
    val uiData = PaymentHandleMapper.toUI(paymentHandle, null)

    // then
    assertEquals(DemoAppRes.drawable.ic_cc_discover, uiData.cardBrandRes)
    assertEquals(PSCreditCardType.UNKNOWN, uiData.cardBrandType)
    assertEquals("0000", uiData.lastDigits)
    assertEquals("Holder Name", uiData.holderName)
    assertEquals("12", uiData.expiryMonth)
    assertEquals("2099", uiData.expiryYear)
    assertEquals("12-2099", uiData.expiryDate)
    assertEquals("Cmfy9rokKZRyFmI", uiData.paymentHandleTokenFrom)
    assertEquals("SP5PhDcXzlI8qEoP", uiData.singleUseCustomerToken)
  }

  @Test
  fun `should map AMEX payment handle`() {
    // given
    val paymentHandle = PaymentHandle(
      paymentHandleToken = "amexToken",
      card = Card(
        cardType = PSCreditCardType.AMEX.value,
        lastDigits = "9999",
        holderName = "Alice Johnson",
        cardExpiry = CardExpiry(month = "01", year = "2030")
      )
    )

    // when
    val uiData = PaymentHandleMapper.toUI(paymentHandle, "amexCustomerToken")

    // then
    assertEquals(DemoAppRes.drawable.ic_cc_amex, uiData.cardBrandRes)
    assertEquals(PSCreditCardType.AMEX, uiData.cardBrandType)
    assertEquals("9999", uiData.lastDigits)
    assertEquals("Alice Johnson", uiData.holderName)
    assertEquals("01", uiData.expiryMonth)
    assertEquals("2030", uiData.expiryYear)
    assertEquals("01-2030", uiData.expiryDate)
    assertEquals("amexToken", uiData.paymentHandleTokenFrom)
    assertEquals("amexCustomerToken", uiData.singleUseCustomerToken)
  }

  @Test
  fun `should map DISCOVER payment handle`() {
    // given
    val paymentHandle = PaymentHandle(
      paymentHandleToken = "discoverToken",
      card = Card(
        cardType = PSCreditCardType.DISCOVER.value,
        lastDigits = "7777",
        holderName = "Bob Brown",
        cardExpiry = CardExpiry(month = "07", year = "2026")
      )
    )

    // when
    val uiData = PaymentHandleMapper.toUI(paymentHandle, "discoverCustomerToken")

    // then
    assertEquals(DemoAppRes.drawable.ic_cc_discover, uiData.cardBrandRes)
    assertEquals(PSCreditCardType.DISCOVER, uiData.cardBrandType)
  }

  @Test
  fun `should map unknown cardType to UNKNOWN and discover icon`() {
    // given
    val paymentHandle = PaymentHandle(
      paymentHandleToken = "unknownToken",
      card = Card(
        cardType = "RANDOM_TYPE",
        lastDigits = "1111",
        holderName = "Unknown User",
        cardExpiry = CardExpiry(month = "03", year = "2027")
      )
    )

    // when
    val uiData = PaymentHandleMapper.toUI(paymentHandle, null)

    // then
    assertEquals(DemoAppRes.drawable.ic_cc_discover, uiData.cardBrandRes)
    assertEquals(PSCreditCardType.UNKNOWN, uiData.cardBrandType)
  }
}
