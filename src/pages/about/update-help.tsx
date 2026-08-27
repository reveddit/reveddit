import React from 'react'
import { InternalPage } from 'components/Misc'
import { NewWindowLink } from 'components/ui/Links'
import { ContentWithHeader } from 'pages/about'
import {
  useExtensionVersion,
  isStuckVersion,
  STUCK_MAX_VERSION,
} from 'hooks/useExtensionVersion'

const UpdateHelp = props => {
  const version = useExtensionVersion()
  return (
    <InternalPage props={props}>
      <ContentWithHeader header="Extension update help">
        {version ? (
          isStuckVersion(version) ? (
            <p>
              <b>You are on version {version}, which is affected.</b> Please
              follow the steps below.
            </p>
          ) : (
            <p>
              <b>You are on version {version} and up to date.</b> No action is
              needed.
            </p>
          )
        ) : (
          <p>
            The extension was not detected in this browser. If you installed it
            in another browser, the steps below apply there.
          </p>
        )}
        <p>
          Around 1 in 5 installs stopped receiving updates in early August 2026
          and are frozen on version {STUCK_MAX_VERSION}, while everyone else
          updates normally. Google's store is serving the update correctly, so
          the failure happens on affected machines, and reports from affected
          users are the fastest way to find the cause.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header="Try this first">
        <ol>
          <li>Type chrome://extensions into your address bar.</li>
          <li>Turn on Developer mode (top right).</li>
          <li>Press Update and wait a few seconds.</li>
          <li>
            Check the version shown for reveddit real-time. Anything newer than{' '}
            {STUCK_MAX_VERSION} means you are no longer stuck.
          </li>
        </ol>
        <p>If it updated, you are done. Thank you!</p>
      </ContentWithHeader>
      <ContentWithHeader header="If it did not update, please tell us">
        <p>
          Report on{' '}
          <NewWindowLink reddit="/r/reveddit/">/r/reveddit</NewWindowLink> or{' '}
          <NewWindowLink href="https://github.com/reveddit/real-time-extension/issues">
            GitHub
          </NewWindowLink>
          , including:
        </p>
        <ul>
          <li>
            Your browser and its version: type chrome://version into the address
            bar and copy the first line
          </li>
          <li>Your operating system</li>
          <li>
            What happened when you pressed Update: nothing at all, an error
            message (include its text), or something else
          </li>
          <li>
            Whether the browser is managed by an employer or school, and whether
            you use a DNS filter, proxy, or antivirus that inspects web traffic
          </li>
        </ul>
        <p>
          Please report before reinstalling. Removing the extension deletes its
          local history and subscriptions, and a clean reinstall also removes
          the evidence of what was blocking updates. As a last resort,
          reinstalling from the{' '}
          <NewWindowLink href="https://chromewebstore.google.com/detail/ickfhlplfbipnfahjbeongebnmojbnhm">
            Chrome Web Store
          </NewWindowLink>{' '}
          may get you current. If the reinstall itself fails, that failure is
          also useful to report.
        </p>
      </ContentWithHeader>
    </InternalPage>
  )
}

export default UpdateHelp
