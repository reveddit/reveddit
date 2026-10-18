import React from 'react'
import { InternalPage } from 'components/Misc'
import { NewWindowLink } from 'components/ui/Links'
import { browserStore } from 'components/ui/Extensions'
import { ext_urls } from 'utils'
import { ContentWithHeader } from 'pages/about'
import {
  useExtensionVersion,
  isStuckVersion,
  STUCK_MAX_VERSION,
} from 'hooks/useExtensionVersion'
import { useExtensionUpdate } from 'hooks/useExtensionUpdate'
import { useRunningExtensionVersion } from 'api/reddit/extensionStatus'

const ChromiumSteps = ({ page, toggle }: { page: string; toggle: string }) => (
  <ol>
    <li>Type {page} into your address bar.</li>
    <li>Turn on Developer mode ({toggle}).</li>
    <li>Press Update and wait a few seconds.</li>
    <li>Check the version shown for reveddit real-time.</li>
  </ol>
)

// Keyed like browserStore and ext_urls
const STEPS = {
  c: {
    browser: 'Chrome, Brave, Opera and other Chromium browsers',
    store: 'Chrome Web Store',
    steps: <ChromiumSteps page="chrome://extensions" toggle="top right" />,
  },
  e: {
    browser: 'Edge',
    store: 'Edge Add-ons store',
    steps: (
      <ChromiumSteps page="edge://extensions" toggle="in the left sidebar" />
    ),
  },
  f: {
    browser: 'Firefox',
    store: 'Firefox Add-ons site',
    steps: (
      <ol>
        <li>Type about:addons into your address bar.</li>
        <li>
          Click the gear icon at the top of the page and choose Check for
          Updates.
        </li>
        <li>
          If reveddit real-time then shows under Available Updates, press
          Install.
        </li>
        <li>Click reveddit real-time in the list to see its version.</li>
      </ol>
    ),
  },
}

// This browser's steps first
const stepsOrder = (['c', 'e', 'f'] as const)
  .slice()
  .sort((a, b) => Number(b === browserStore) - Number(a === browserStore))
const reinstallStore = stepsOrder[0]

const UpdateHelp = props => {
  // Chromium's answer covers ?stuck_test previews; the page mark or stamp
  // covers every browser
  const chromiumVersion = useExtensionVersion()
  const runningVersion = useRunningExtensionVersion()
  const version = chromiumVersion || runningVersion
  const update = useExtensionUpdate()
  let status: React.ReactNode
  if (!version) {
    status = (
      <p>
        The extension was not detected in this browser. If you installed it in
        another browser, the steps below apply there.
      </p>
    )
  } else if (isStuckVersion(version)) {
    status = (
      <p>
        <b>
          You are on version {version}, which stopped updating for some users in
          August.
        </b>{' '}
        Please follow the steps below.
      </p>
    )
  } else if (update) {
    status = (
      <p>
        <b>
          You are on version {update.installed}, and {update.available} is out.
        </b>{' '}
        The steps below install it now.
      </p>
    )
  } else if (update === null) {
    status = (
      <p>
        <b>You are on version {version} and up to date.</b> No action is needed.
      </p>
    )
  } else {
    status = (
      <p>
        <b>You are on version {version}.</b>
      </p>
    )
  }
  return (
    <InternalPage props={props}>
      <ContentWithHeader header="Extension update help">
        {status}
        <p>
          Browsers install extension updates on their own schedule. Chrome and
          Edge check every few hours, and Firefox about once a day. To get a new
          version sooner, check for updates by hand.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header="Check for updates now">
        {stepsOrder.map(key => (
          <React.Fragment key={key}>
            <h3>{STEPS[key].browser}</h3>
            {STEPS[key].steps}
          </React.Fragment>
        ))}
        <p>
          {update
            ? `You should then see version ${update.available} or newer. `
            : ''}
          If it updated, you are done.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header={`Stuck on version ${STUCK_MAX_VERSION}?`}>
        <p>
          Around 1 in 5 Chrome installs stopped receiving updates in early
          August 2026 and are frozen on version {STUCK_MAX_VERSION}, while
          everyone else updates normally. Google's store is serving the update
          correctly, so the failure happens on affected machines, and reports
          from affected users are the fastest way to find the cause. Anything
          newer than {STUCK_MAX_VERSION} means you are no longer stuck.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header="If it did not update, please tell us">
        <p>
          Report by opening an issue on{' '}
          <NewWindowLink href="https://github.com/reveddit/real-time-extension/issues">
            GitHub
          </NewWindowLink>
          , including:
        </p>
        <ul>
          <li>
            Your browser and its version: type chrome://version into the address
            bar and copy the first line, or in Firefox, open the menu, then
            Help, then About Firefox
          </li>
          <li>Your operating system</li>
          <li>
            What happened when you checked for updates: nothing at all, an error
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
          <NewWindowLink href={ext_urls.rt[reinstallStore]}>
            {STEPS[reinstallStore].store}
          </NewWindowLink>{' '}
          may get you current. If the reinstall itself fails, that failure is
          also useful to report.
        </p>
      </ContentWithHeader>
    </InternalPage>
  )
}

export default UpdateHelp
