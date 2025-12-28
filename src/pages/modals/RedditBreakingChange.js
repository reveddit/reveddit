import React from 'react'
import { NewWindowLink, SocialLinks, ExtensionLinks, redditChangePostUrl } from 'components/Misc'
import { get } from 'utils'
import { Link } from 'react-router-dom'

export const RedditBreakingChange = () => {
    const hasExtension = get('hasNotifierExtension', false)

    return (
        <>
            <h3>Important: Reddit Changed How Removals Work</h3>
            <p>
                A recent Reddit update makes mod-removed content disappear from profile pages, which breaks Reveddit's website.
            </p>
            {hasExtension ? (
                <p>
                    <Link to="/add-ons/direct">Reveddit's extension</Link>, which you have installed, continues to work.
                </p>
            ) : (
                <>
                    <p>
                        Install the browser extension to receive removal alerts.
                    </p>
                    <ExtensionLinks
                        containerStyle={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: '15px' }}
                        linkStyle={{ marginRight: '15px' }}
                    />
                </>
            )}
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
                <NewWindowLink href={redditChangePostUrl}>What changed?</NewWindowLink>
            </p>
            <SocialLinks />
        </>
    )
}

export default RedditBreakingChange
