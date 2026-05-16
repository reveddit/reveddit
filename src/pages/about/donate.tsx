import React from 'react'
import { InternalPage } from 'components/Misc'
import { ContentWithHeader } from 'pages/about'
import { Row } from 'pages/about'

const bch = 'qqfpw6cxep2tp53wcqws38j828mjlyw045rcrllckq'
const eth = '0x22437792F98DFEecd0C59cBcAE042109c88309aC'
const btc = '16GYNx9koeynunSjvNsVwch6wBs9bbnQGw'

const About_donate = props => {
  document.title = 'Donate to reveddit'

  return (
    <InternalPage props={props}>
      <Row>
        <ContentWithHeader header="Donate" half={true}>
          <div className="donate-form-container">
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
