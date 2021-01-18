import React, {useEffect} from 'react'
import { InternalPage, NewWindowLink } from 'components/Misc'
import {ContentWithHeader} from 'pages/about'
import {Row} from 'pages/about'

const number = 61036703
const About_privacy = () => {
  return (
    <InternalPage>
    <Row>
      <ContentWithHeader header='Feedback' half={true}>
        <ul>
          <li><NewWindowLink reddit='/r/reveddit/'>/r/reveddit</NewWindowLink></li>
          <li><NewWindowLink href='https://github.com/reveddit/reveddit'>github.com/reveddit/reveddit</NewWindowLink></li>
        </ul>
      </ContentWithHeader>
      <ContentWithHeader header='Credits' half={true}>
        <p>
          Created by <NewWindowLink href='https://github.com/rhaksw/'>Rob Hawkins</NewWindowLink> using:
        </p>
        <ul>
          <li><NewWindowLink href='https://github.com/JubbeArt/removeddit'>Removeddit</NewWindowLink> by Jesper Wrang</li>
          <li><NewWindowLink reddit='/r/pushshift/'>Pushshift</NewWindowLink> by Jason Baumgartner</li>
        </ul>
      </ContentWithHeader>
    </Row>
    <Row>
      <ContentWithHeader header='Privacy' id='privacy' half={true}>
        <Iubenda id={number} title='privacy policy'>
          Privacy Policy
        </Iubenda>
      </ContentWithHeader>
    </Row>
    </InternalPage>
  )
}

const Iubenda = ({ id, title, children }) => {
    useEffect(() => {
        var s = document.createElement("script");
        let tag = document.getElementsByTagName("script")[0];
        s.src="https://cdn.iubenda.com/iubenda.js";

        tag.parentNode.insertBefore(s,tag);
    }, []);

    return <a href={`https://www.iubenda.com/privacy-policy/${id}`} className="iubenda-nostyle iubenda-embed" title={title}>{children}</a>
}

export default About_privacy
