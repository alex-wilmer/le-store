import { useState, useEffect } from 'react'
import {
  useElements,
  useStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js'
import {
  Divider,
  Box,
  Flex,
  Heading,
  Button,
  Input,
  Text,
  Spinner,
  useToast
} from "@chakra-ui/react"
import { get, post } from './api'

function App() {
  let [email, setEmail] = useState('')
  let [products, setProducts] = useState([])
  let [prices, setPrices] = useState([])
  let [selectedPriceId, setSelectedPriceId] = useState()
  let [loading, setLoading] = useState(false)
  let [paymentRequest, setPaymentRequest] = useState(null);

  let stripe = useStripe()
  let elements = useElements()
  let toast = useToast()


  useEffect(() => {
    if (stripe) {
      async function handlePaymentMethodReceived(event) {
        // Send the payment details to our function.
        const paymentDetails = {
          payment_method: event.paymentMethod.id,
          shipping: {
            name: event.shippingAddress.recipient,
            phone: event.shippingAddress.phone,
            address: {
              line1: event.shippingAddress.addressLine[0],
              city: event.shippingAddress.city,
              postal_code: event.shippingAddress.postalCode,
              state: event.shippingAddress.region,
              country: event.shippingAddress.country,
            },
          },
        };
        const response = await post('/create-payment-intent', {
          paymentDetails,
        })
        if (response.error) {
          // Report to the browser that the payment failed.
          console.log(response.error);
          event.complete('fail');
        } else {
          // Report to the browser that the confirmation was successful, prompting
          // it to close the browser payment method collection interface.
          event.complete('success');
          // Let Stripe.js handle the rest of the payment flow, including 3D Secure if needed.
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            response.paymentIntent.client_secret
          );
          if (error) {
            console.log(error);
            return;
          }
          if (paymentIntent.status === 'succeeded') {
            // history.push('/success');
          } else {
            console.warn(
              `Unexpected status: ${paymentIntent.status} for ${paymentIntent}`
            );
          }
        }
      }

      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Demo total',
          amount: 1350,
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestShipping: true,
        shippingOptions: [
          {
            id: 'standard-global',
            label: 'Global shipping',
            detail: 'Arrives in 5 to 7 days',
            amount: 350,
          },
        ],
      });

      // Check the availability of the Payment Request API first.
      pr.canMakePayment().then((result) => {
        if (result) {
          pr.on('paymentmethod', handlePaymentMethodReceived);
          setPaymentRequest(pr);
        }
      });
    }
  }, [stripe])

  useEffect(() => {
    Promise.all([get('/products'), get('/prices')])
      .then(([products, prices]) => {
        setProducts(products.data)
        setPrices(prices.data)
        setSelectedPriceId(prices.data[0].id)
      })
  }, [])

  function handlePaymentThatRequiresCustomerAction({
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

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    const customer = await post('/create-customer', { email })
    const cardElement = elements.getElement(CardNumberElement)

    // // If a previous payment was attempted, get the latest invoice
    // const latestInvoicePaymentIntentStatus = localStorage.getItem(
    //   'latestInvoicePaymentIntentStatus',
    // )

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (error) {
      console.log('[createPaymentMethod error]', error)
    } else {
      const subscription = await post('/create-subscription', {
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        priceId: selectedPriceId
      })

      setLoading(false)

      await handlePaymentThatRequiresCustomerAction({
        subscription: subscription,
        priceId: selectedPriceId,
        paymentMethodId: paymentMethod.id,
      }).then(handleRequiresPaymentMethod)

      toast({
        title: "Purchase successful!",
        description: "We've created your account for you.",
        status: "success",
        duration: 9000,
        isClosable: true,
      })
    }
    //   // console.log({ paymentMethod })
    //   const paymentMethodId = paymentMethod.id

    //   if (latestInvoicePaymentIntentStatus === 'requires_payment_method') {
    //     // Update the payment method and retry invoice payment
    //     // const invoiceId = localStorage.getItem('latestInvoiceId')
    //     // retryInvoiceWithNewPaymentMethod({
    //     //   customerId,
    //     //   paymentMethodId,
    //     //   invoiceId,
    //     //   priceId,
    //     // });
    //   } else {
    //     // Create the subscription
    //     try {
    //       const subscriptionData = await createStripeSubscription({
    //         customerId: createCustomerData.body.customer,
    //         paymentMethodId,
    //         priceId: selectedPrice.stripe_id,
    //       })

    //       if (!subscriptionData.success) {
    //       }

    //       navigate(
    //         `/control-panel/account${session.resolver?.status ? '' : '?helpPane=platform'
    //         }`,
    //       )
    //     } catch (err) {
    //       setCreditCardLoading(false)
    //       setSubError(err)
    //     }
    //   }
    // }
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
            <h3>{product.name}: <em>{product.description}</em></h3>
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

      <div>
        <Text mb="8px">Email</Text>
        <Input
          placeholder="Enter email address.."
          onChange={e => setEmail(e.target.value)}
          value={email}
        />
      </div>

      <br />

      <Box border="1px solid #ddd" borderRadius="8px" p="12px">
        <Text mb="8px">Credit Card Number</Text>
        <div className="card-input">
          <CardNumberElement />
        </div>
        <br />
        <div
          className="stripe-row"
          style={{
            display: 'flex',
          }}
        >
          <div style={{ paddingRight: 20 }}>
            <Text mb="8px">Expiry Date</Text>
            <div className="card-input">
              <CardExpiryElement />
            </div>
          </div>
          <div>
            <Text mb="8px">CVC</Text>
            <div className="card-input">
              <CardCvcElement />
            </div>
          </div>
        </div>
      </Box>

      <br />

      <Button
        onClick={handleSubmit}
      >
        {loading ? <Spinner /> : 'Pay With Credit Card'}
      </Button>

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
    </Box>
  );
}

export default App;
