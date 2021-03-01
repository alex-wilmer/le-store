import { useState, useEffect } from 'react'
import {
  useElements,
  useStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js'
import { Box, Heading, Button, Input, Text, Spinner, useToast } from "@chakra-ui/react"

let api = process.env.REACT_APP_API || 'http://localhost:5555'
let get = endpoint => fetch(api + endpoint).then(r => r.json())
let post = (endpoint, body) => fetch(api + endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
}).then(r => r.json())

function App() {
  let [email, setEmail] = useState('')
  let [products, setProducts] = useState([])
  let [prices, setPrices] = useState([])
  let [selectedPriceId, setSelectedPriceId] = useState()
  let [loading, setLoading] = useState(false)

  const stripe = useStripe()
  const elements = useElements()
  const toast = useToast()

  useEffect(() => {
    Promise.all([get('/products'), get('/prices')])
      .then(([products, prices]) => {
        setProducts(products.data)
        setPrices(prices.data)
        setSelectedPriceId(prices.data[0].id)
      })
  }, [])


  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    // setCreditCardLoading(true)

    // if (session.loggedIn) {
    const customer = await post('/create-customer', { email })

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
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
      const subscriptionData = await post('/create-subscription', {
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        priceId: selectedPriceId
      })

      setLoading(false)

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
    <div>
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
            <Text mb="8px">Expiry Date (MM/YY)</Text>
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
        {loading ? <Spinner /> : 'Continue'}
      </Button>

      <br />
      <br />

      <div>
        ...put Pay Now button here...
      </div>
    </div>
  );
}

export default App;
