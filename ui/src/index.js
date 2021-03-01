import React from 'react';
import ReactDOM from 'react-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ChakraProvider } from "@chakra-ui/react"
import './index.css';
import App from './App';

const pk = 'pk_test_51IOsTEGoZzZ0jWfriuVBj4uYctbeB3knifNWV1F85R3GrfBGs7T7vSPEov4qyXy0s9NeUvXeM3siskiNAFHEiMus00CQD29tok'
const stripePromise = loadStripe(pk);

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);