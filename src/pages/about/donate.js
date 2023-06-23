import React, {useState, useEffect} from 'react'
import { connect } from 'state'
import {loadStripe} from '@stripe/stripe-js/pure'
import { InternalPage } from 'components/Misc'
import {ContentWithHeader} from 'pages/about'
import {Row} from 'pages/about'

const bch = 'qqfpw6cxep2tp53wcqws38j828mjlyw045rcrllckq'
const eth = '0x22437792F98DFEecd0C59cBcAE042109c88309aC'
const btc = '16GYNx9koeynunSjvNsVwch6wBs9bbnQGw'

async function getSessionID(amount, frequency) {
  const response =  await fetch(LAMBDA_ENDPOINT+'donate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, frequency }),
  })

  return await response.json()
}

let stripePromise
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

const About_donate = (props) => {
  // const [stripe, setStripe] = useState(null)
  // useEffect(() => {
  //   getStripe().then(setStripe)
  // }, [])
  //
  // const formSubmit = async (e) => {
  //   e.preventDefault()
  //   const data = new FormData(e.target)
  //   const amount = data.get('amount')
  //   const frequency = data.get('frequency')
  //
  //   if (amount < 0.5) {
  //     return
  //   }
  //
  //   const sessionId = await getSessionID(amount, frequency)
  //   stripe.redirectToCheckout(sessionId)
  // }

  const stripe = undefined

  document.title = 'Donate to reveddit'

  return (
    <InternalPage props={props}>
      <Row>
        <ContentWithHeader header='Donate' half={true}>
          <div className="donate-form-container">
            {stripe &&
              <form id="donate-form" onSubmit={formSubmit}>
                <label htmlFor="amount">
                  <span>Donation amount</span>
                  <div className="amount-container">
                    <span className="dollar-sign">$ </span>
                    <input type="number" name="amount" placeholder="1" className="donate-amount field" step="1" min="1" required />
                  </div>
                </label>
                <div id='frequency'>
                  <label>
                    <input name='frequency' type='radio' value='once' defaultChecked />
                    one time
                  </label>
                  <label id="monthly">
                    <input name='frequency' type='radio' value='monthly' />
                    monthly
                  </label>
                </div>
                <input type="submit" value="Donate!" className="donate-btn"/>
                <div  style={{"marginTop":"14px", textAlign:"center", color: "white"}}>
                  <p>(not tax deductible)</p>
                  <img src="/images/stripe.png"/>
                </div>
              </form>
            }
            <hr style={{width:'100%'}}/>
            <div className="more-ways">
              <a href={`bitcoin:${btc}`}>BTC</a>
              <a href={`bitcoincash:${bch}`}>BCH</a>
              <a href={`ethereum:pay-${eth}`}>ETH</a>
            </div>
          </div>
        </ContentWithHeader>
      </Row>
    </InternalPage>
  )
}

export default About_donate
