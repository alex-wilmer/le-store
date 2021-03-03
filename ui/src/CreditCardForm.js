import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js'
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Spinner
} from "@chakra-ui/react"

export default function CreditCardForm({
  processing,
  email,
  setEmail,
  handleSubmit
}) {
  return (
    <>
      <div>
        <Text mb="8px">Email</Text>
        <Input
          id="email-input"
          placeholder="Enter email address.."
          onChange={e => setEmail(e.target.value)}
          value={email}
        />
      </div>

      <br />

      <Box border="1px solid #ddd" borderRadius="8px" p="12px">
        <Text mb="8px">Credit Card Number</Text>
        <div data-test="number">
          <CardNumberElement />
        </div>
        <br />
        <Flex>
          <Box data-test="expiry" pr="20px">
            <Text mb="8px">Expiry Date</Text>
            <div>
              <CardExpiryElement />
            </div>
          </Box>
          <Box data-test="cvc">
            <Text mb="8px">CVC</Text>
            <div>
              <CardCvcElement />
            </div>
          </Box>
        </Flex>
      </Box>

      <br />

      <Button id="submit" onClick={handleSubmit}>
        {processing ? <Spinner /> : 'Submit'}
      </Button>
    </>
  )
}