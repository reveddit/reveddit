import React from 'react'
import { connect } from 'state'

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

export class Donate extends React.Component {
  state = {
    stripe: null
  }
  componentDidMount() {
    const stripe = Stripe(STRIPE_PUBLISHABLE_KEY)
    this.setState({stripe})
  }

  formSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const amount = data.get('amount')
    const frequency = data.get('frequency')

    if (amount < 0.5) {
      return
    }

    const sessionId = await getSessionID(amount, frequency)
    this.state.stripe.redirectToCheckout(sessionId)
  }

  render() {
    const props = this.props
    document.title = 'Donate'

    return (this.state.stripe &&
      <div className="donate-form-container">
        <form id="donate-form" onSubmit={this.formSubmit}>
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
        </form>
        <div className="more-ways">
          <a href={`bitcoin:${btc}`}>BTC</a>
          <a href={`bitcoincash:${bch}`}>BCH</a>
          <a href={`ethereum:pay-${eth}`}>ETH</a>
        </div>
      </div>
    )
  }
}

export default Donate
