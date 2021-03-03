// https://stripe.com/docs/billing/subscriptions/overview
// https://www.netlify.com/tags/stripe/
// https://github.com/stripe-samples/react-elements-card-payment/blob/master/client/src/components/CheckoutForm.js

import { useState, useEffect, useCallback } from 'react'
import {
  useElements,
  useStripe,
  CardNumberElement,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js'
import {
  Divider,
  Box,
  Flex,
  Heading,
  Text,
  useToast
} from "@chakra-ui/react"
import { get, post } from './api'
import usePaymentRequest from './usePaymentRequest'
import CreditCardForm from './CreditCardForm'

function App() {
  const [email, setEmail] = useState('')
  const [products, setProducts] = useState([])
  const [prices, setPrices] = useState([])
  const [selectedPriceId, setSelectedPriceId] = useState()
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const stripe = useStripe()
  const elements = useElements()
  const toast = useToast()
  const paymentRequest = usePaymentRequest()

  const showSuccessToast = useCallback(() => {
    toast({
      title: "Purchase successful!",
      description: "We've created your account for you.",
      status: "success",
      duration: 9000,
      isClosable: true,
    })
  }, [toast])

  useEffect(() => {
    Promise.all([get('/products'), get('/prices')])
      .then(([products, prices]) => {
        setProducts(products.data)
        setPrices(prices.data)
        setSelectedPriceId(prices.data[0].id)
      })
  }, [])

  async function handlePaymentThatRequiresCustomerAction({
    subscription,
    invoice,
    priceId,
    paymentMethodId,
    isRetry,
  }) {
    if (subscription && subscription.status === 'active') {
      // Subscription is active, no customer actions required.
      return { subscription, priceId, paymentMethodId };
    }

    // If it's a first payment attempt, the payment intent is on the subscription latest invoice.
    // If it's a retry, the payment intent will be on the invoice itself.
    let paymentIntent = invoice ? invoice.payment_intent : subscription.latest_invoice.payment_intent;

    if (
      paymentIntent.status === 'requires_action' ||
      (isRetry === true && paymentIntent.status === 'requires_payment_method')
    ) {
      return stripe
        .confirmCardPayment(paymentIntent.client_secret, {
          payment_method: paymentMethodId,
        })
        .then((result) => {
          if (result.error) {
            // Start code flow to handle updating the payment details.
            // Display error message in your UI.
            // The card was declined (i.e. insufficient funds, card has expired, etc).
            throw result;
          } else {
            if (result.paymentIntent.status === 'succeeded') {
              // Show a success message to your customer.
              return {
                priceId: priceId,
                subscription: subscription,
                invoice: invoice,
                paymentMethodId: paymentMethodId,
              };
            }
          }
        })
        .catch((error) => {
          // displayError(error);
        });
    } else {
      // No customer action needed.
      return { subscription, priceId, paymentMethodId };
    }
  }

  function handleRequiresPaymentMethod({
    subscription,
    paymentMethodId,
    priceId,
  }) {
    if (subscription.status === 'active') {
      // subscription is active, no customer actions required.
      return { subscription, priceId, paymentMethodId };
    } else if (
      subscription.latest_invoice.payment_intent.status ===
      'requires_payment_method'
    ) {
      // Using localStorage to manage the state of the retry here,
      // feel free to replace with what you prefer.
      // Store the latest invoice ID and status.
      localStorage.setItem('latestInvoiceId', subscription.latest_invoice.id);
      localStorage.setItem(
        'latestInvoicePaymentIntentStatus',
        subscription.latest_invoice.payment_intent.status
      );
      // eslint-disable-next-line no-throw-literal
      throw { error: { message: 'Your card was declined.' } };
    } else {
      return { subscription, priceId, paymentMethodId };
    }
  }

  // eslint-disable-next-line no-unused-vars
  async function retryInvoiceWithNewPaymentMethod({
    customerId,
    paymentMethodId,
    invoiceId,
    priceId
  }) {
    const response = await post('/retry-invoice', {
      customerId: customerId,
      paymentMethodId: paymentMethodId,
      invoiceId: invoiceId,
    })

    await handlePaymentThatRequiresCustomerAction({
      invoice: response,
      paymentMethodId: paymentMethodId,
      priceId: priceId,
      isRetry: true,
    })

    showSuccessToast()
  }

  async function processOrder() {
    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    const customer = await post('/create-customer', { email })
    const cardElement = elements.getElement(CardNumberElement)

    // TODO: handle retry logic
    // If a previous payment was attempted, get the latest invoice
    const latestInvoicePaymentIntentStatus = localStorage.getItem(
      'latestInvoicePaymentIntentStatus',
    )

    if (latestInvoicePaymentIntentStatus === 'requires_payment_method') {
      // Update the payment method and retry invoice payment
      // const invoiceId = localStorage.getItem('latestInvoiceId')
      // await retryInvoiceWithNewPaymentMethod({
      //   customerId,
      //   paymentMethodId,
      //   invoiceId,
      //   priceId,
      // });
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (error) {
      console.log('[createPaymentMethod error]', error?.message)
    } else {
      const subscription = await post('/create-subscription', {
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        priceId: selectedPriceId
      })

      await handlePaymentThatRequiresCustomerAction({
        subscription: subscription,
        priceId: selectedPriceId,
        paymentMethodId: paymentMethod.id,
      }).then(handleRequiresPaymentMethod)

      setProcessing(false)
      setSuccess(true)
      showSuccessToast()
    }
  }

  return (
    <Box maxWidth="30rem">
      <Heading>Le Store</Heading>

      <div>
        <Heading size="md">
          Products
        </Heading>
        {products.map(product =>
          <div key={product.id}>
            <h3>
              <Text data-test="product-name">
                {product.name}
              </Text>: <em>{product.description}</em></h3>
            <div onChange={e => {
              setSelectedPriceId(e.target.value)
            }}>
              {prices.map(price => (
                <div key={price.id}>
                  <input
                    name="price"
                    value={price.id}
                    type="radio"
                  /> {price.unit_amount} cents per {price.recurring.interval}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <br />

      <Flex alignItems="center">
        <Divider />
        <Text mx="2rem" width="40rem" fontWeight="bold" fontSize="12px">
          USE CREDIT CARD FORM
        </Text>
        <Divider />
      </Flex>

      <br />

      <CreditCardForm
        processing={processing}
        email={email}
        setEmail={setEmail}
        handleSubmit={processOrder}
      />

      <br />
      <br />

      {paymentRequest &&
        <Box>
          <Flex alignItems="center">
            <Divider />
            <Text mx="2rem" width="15rem" fontWeight="bold" fontSize="12px">
              OR PAY WITH
              </Text>
            <Divider />
          </Flex>
          <br />
          <PaymentRequestButtonElement options={{ paymentRequest }} />
        </Box>
      }

      {success && <div id="success">Success!</div>}
    </Box>
  );
}

export default App;
