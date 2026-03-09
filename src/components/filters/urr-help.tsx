import React from 'react'
import { Help } from 'components/ui/Modals'
import { NewWindowLink } from 'components/ui/Links'

export const urr_title = 'Karma Removal Rate'
export const own_page_text = 'items preview page'

export const urr_help = (
  <Help
    title={urr_title}
    content={
      <>
        <p>
          This shows highly upvoted removed content for any subreddit. Code that
          generates the data is available here:{' '}
          <NewWindowLink href="https://github.com/reveddit/ragger">
            github.com/reveddit/ragger
          </NewWindowLink>
        </p>
        <p>
          <b>How is it calculated?</b>
        </p>
        <p>
          The rate shown is the percentage of karma removed in periods of either
          1,000 comments or 1,000 posts over time. Each item represents the
          summed score of removed items in that period divided by the summed
          score of all items for that period. The comment or post next to the
          rate is a preview of the removed item with the highest score in the
          period.
        </p>
        <p>
          For example, if 1,000 items have a combined score of 20,000 and the
          removed items have a combined score of 10,000, then the removal rate
          for that period is 50%, and the previewed item may have had a high
          score such as 7,000.
        </p>
        <p>
          <b>How do I view items on their own page?</b>
        </p>
        <p>
          Visit /r/subreddit/history or use the '{own_page_text}' link below the{' '}
          {urr_title} graph found under filters.
        </p>
        <p>
          <b>How do I use the graph?</b>
        </p>
        <p>
          Hover the mouse to show a preview of the highest-scored removed item.
          Click on a point to show that item. The 'period' link on the next page
          will load all items for that period. This may take a minute to load.
        </p>
        <p>
          <b>How up-to-date is this?</b>
        </p>
        <p>Sort by 'new' to see the most recent data.</p>
      </>
    }
  />
)
