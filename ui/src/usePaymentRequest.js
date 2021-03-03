import { useEffect, useState } from 'react'
import { useStripe } from '@stripe/react-stripe-js'
import { post } from './api'

export default function usePaymentRequest() {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (stripe) {
      async function handlePaymentMethodReceived(event) {
        // Send the payment details to our function.
        const response = await post('/create-payment-intent', {
          paymentDetails: {
            payment_method: event.paymentMethod.id,
          },
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
            // showSuccessToast()
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
        // requestPayerName: true,
        // requestPayerEmail: true,
      });

      // Check the availability of the Payment Request API first.
      pr.canMakePayment().then((result) => {
        if (result) {
          pr.on('paymentmethod', handlePaymentMethodReceived);
          setPaymentRequest(pr);
        }
      });
    }
  }, [
    stripe,
    // showSuccessToast
  ])

  return paymentRequest
}