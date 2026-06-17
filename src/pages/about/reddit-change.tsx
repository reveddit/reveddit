import React from 'react'
import { Link } from 'react-router-dom'
import { InternalPage } from 'components/Misc'
import { NewWindowLink } from 'components/ui/Links'
import Time from 'components/common/Time'
import { ContentWithHeader, Row } from 'pages/about'

const title =
  'A recent Reddit update breaks Reveddit and makes moderator removals much harder to track.'

const About_redditChange = props => {
  return (
    <InternalPage props={props}>
      <Row>
        <ContentWithHeader header={title}>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginTop: '-4px',
              fontSize: '0.9em',
            }}
          >
            <Time created_utc={1757807520} />
          </p>
          <p>
            Reddit recently changed how moderator removals work, and the change
            broke the main Reveddit.com website's ability to track your removed
            content. The{' '}
            <Link to="/add-ons/direct">
              Reveddit real-time browser extension
            </Link>{' '}
            has since been updated and works again for this purpose, so for now,
            please use the browser extension to check the removal status of your
            posts and comments. Here is the full story.
          </p>
          <p>
            Hi everyone, I'm the creator of <Link to="/">Reveddit.com</Link>.
            I'm making this post to inform the community, including Reveddit's
            250,000 monthly users and 10,000 extension users, about a
            fundamental platform change that has broken the site and has serious
            implications for transparency on Reddit.
          </p>

          <h3>What Changed?</h3>
          <p>
            This week, Reddit announced an update that gives subreddit
            moderators a power previously reserved only for Reddit admins: the
            ability to permanently remove content from your public user profile.
            Here is the key quote from their{' '}
            <NewWindowLink reddit="/r/modnews/duplicates/1ncn0go/evolving_moderation_on_reddit_reshaping_boundaries/">
              official announcement
            </NewWindowLink>
            :
          </p>
          <blockquote>
            ...with this update, the action you take in your community is now
            the final word; you’ll no longer need to appeal to admins to fully
            remove that content across Reddit.
          </blockquote>
          <p>
            In plain English: before, if a mod removed your comment, it still
            existed on your profile. Now, a mod can delete it from their
            subreddit <i>and</i> your profile, effectively erasing it from
            public view entirely.
          </p>

          <h3>Why This is a Massive Change</h3>
          <ul>
            <li>
              <b>Harder-to-Detect Removals:</b> You will receive no notification
              when this happens. The removed content will still appear perfectly
              normal <b>to you</b> when logged in. To everyone else, and to you
              when logged out, it will be gone. While you can still manually
              check your comments in an incognito window, this change breaks the
              only easy, automated way of doing so.
            </li>
            <li>
              <b>Reveddit.com is Broken:</b> Because of this change, Reveddit's
              website can no longer detect when your content is removed this
              way. The core function of the site, to give you a simple overview
              of your removed content, is, for the moment, non-operational.
            </li>
            <li>
              <b>Strengthening Echo Chambers:</b> This gives moderators a
              powerful tool to silence dissenting or inconvenient opinions. They
              can shape their community's reality without ever having to justify
              a removal, because most users will never know it happened.
            </li>
          </ul>
          <p>
            This is not a right or left issue; it's a matter of extremism versus
            healthy moderation. This change will benefit the most extreme
            elements on all sides, allowing them to create perfectly curated
            echo chambers. I expect it may even increase user growth, as we all
            naturally gravitate towards information that confirms our beliefs.
            While much of the media is focusing on how this update affects
            subscriber counts, the real story is the loss of transparency. In
            effect, this brings the platform back to pre-2019 levels of
            transparency, before tools like Reveddit existed.
          </p>

          <h3>See This Effect for Yourself</h3>
          <p>
            To help people understand what this kind of removal looks like, I
            created a subreddit,{' '}
            <NewWindowLink reddit="/r/CantSayAnything/">
              r/CantSayAnything
            </NewWindowLink>
            , where all posts and comments are automatically removed.
          </p>
          <p>
            If you comment or post there, it will still appear for you on the
            subreddit and your profile while logged in. But if you view the page
            in a private/incognito browser window (while logged out), you'll see
            it's not there. Nobody else can see it.
          </p>

          <h3>What's Next?</h3>
          <p>
            The goal of Reveddit has always been to provide transparency, and
            I'll keep looking for ways to do that. This update is a major blow
            to that mission, and I wanted to make you all aware of the new
            reality of posting on Reddit.
          </p>

          <h3>For a deeper dive...</h3>
          <p>
            I write a free Substack newsletter,{' '}
            <NewWindowLink href="https://www.removednews.com/">
              RemovedNews.com
            </NewWindowLink>
            , where I discuss topics like this, focusing on transparency and
            censorship on major platforms. If you're interested in following my
            work and staying informed about these issues, please consider
            subscribing.
          </p>

          <p>
            <b>
              TL;DR: A Reddit update now lets mods delete comments from your
              profile (a power previously held by admins). You get no
              notification. This breaks Reveddit.com's ability to easily track
              your removed content, but the{' '}
              <Link to="/add-ons/direct">browser extension</Link> still works.
              I'll keep looking for ways to surface hidden removals.
            </b>
          </p>
        </ContentWithHeader>
      </Row>
    </InternalPage>
  )
}

export default About_redditChange
