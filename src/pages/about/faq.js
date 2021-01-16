import React from 'react'
import { www_reddit } from 'api/reddit'
import { InternalPage, NewWindowLink } from 'components/Misc'
import {ExtensionLink} from 'components/Misc'
import {ContentWithHeader} from 'pages/about'
import { unarchived_search_help_content, unarchived_search_button_word } from 'data_processing/FindCommentViaAuthors'

const About_faq = () => {
  return (
    <InternalPage>
      <ContentWithHeader header='I receive a message when my comments are removed. Why do I need this?' id='why'>
        <p>
          This is a common misunderstanding. Two things to know are,
        </p>
        <ol>
          <li>In many cases, reddit sends no message about removals. A message can <i>optionally</i> be sent by subreddit moderators.</li>
          <li>Reddit shows you your removed comments as if they are not removed.</li>
        </ol>
        <p>
          Try it! Visit <NewWindowLink reddit='/r/CantSayAnything/about/sticky'>r/CantSayAnything</NewWindowLink> and write any comment.
          It will be removed, you will not receive a message, and it will appear to you as if it is not removed while you are logged in.
        </p>
        <p>
          You can verify this by opening the above link in an incognito window or while logged out. Your comment will not appear.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header='How can I receive a message about removals?' id='extension'>
        <p><ExtensionLink/> notifies you when any of your content on reddit has been removed.</p>
        <p>
          Conversations are better when users <NewWindowLink reddit='/r/science/comments/duwdco/should_moderators_provide_removal_explanations/f79o1yr/'>receive feedback</NewWindowLink> about removed content.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header='Why should I disable tracking protection in Firefox?' id='firefox'>
        <p>A Firefox partner named disconnect.me maintains a list of domains that it calls trackers.
           Reddit is <NewWindowLink href='https://github.com/disconnectme/disconnect-tracking-protection/blob/b3f9cdcea541ab876e63970daadc490f9de2befa/services.json#L10851'>on that list</NewWindowLink>, so requests to reddit are blocked.
           The only way to fix this right now is to disable the feature. <NewWindowLink reddit='/r/technology/comments/jp4j76/_/gbfqdf2/?context=1'>more info</NewWindowLink>
        </p>
      </ContentWithHeader>
      <ContentWithHeader header='Does reveddit show user-deleted content?' id='user-deleted'>
        <p>No, user-deleted content does not appear on reveddit.</p>
      </ContentWithHeader>
      <ContentWithHeader header='Why are removed comments sometimes not visible in threads?' id='unarchived'>
        <p>Thread pages rely on an archive service called Pushshift which sometimes falls behind. If a comment is removed before it is archived then it may not appear on reveddit.</p>
        <p>Your /user page will always be up to date since that only relies on data from reddit.</p>
      </ContentWithHeader>
      <ContentWithHeader header={'What does the "'+unarchived_search_button_word+'" button on removed comments in thread pages do?'} id='refresh'>
        {unarchived_search_help_content}
      </ContentWithHeader>
      <ContentWithHeader header='What does it mean when a removed comment has been "restored via user page"?' id='restored'>
        <p>It means the comment was not archived but able to be copied from the author's /user page. For more information, see the answer about the <a href='#refresh'>"{unarchived_search_button_word}" button</a>.</p>
      </ContentWithHeader>
      <ContentWithHeader header='What does the "unknown removed" label mean?' id='unknown-removed'>
        <p>The "unknown" label is applied when reveddit cannot determine if something was removed by a mod or by automod. Pushshift, a database that captures reddit data as it is created, and which reveddit queries, can fall behind retrieving data. When that happens, any removed items are marked as removed by "unknown." When Pushshift captures content soon after creation, and the content has already been removed, then it is marked as removed by automod.</p>
        <p>Note, when an account is suspended by reddit, all the posts and comments for that account are removed. The reddit API does indicate where suspension-related removals occur and so reveddit cannot see or mark where this happens. You can check if an account has been suspended on its reddit or reveddit user page. Temporary suspensions may also remove content created before the suspension.</p>
      </ContentWithHeader>
      <ContentWithHeader header='How can I find out which mod removed something?' id='which-mod'>
        <p>Reddit does not provide this information by default. Some subreddits expose it through feeds from <NewWindowLink reddit='/user/publicmodlogs'>u/publicmodlogs</NewWindowLink> or <NewWindowLink reddit='/user/modlogs'>u/modlogs</NewWindowLink>. Reveddit fills in details from these feeds where possible.</p>
        <p>You can use the <code>message mods</code> button to send a message to the relevant subreddit's moderators regarding the post.</p>
      </ContentWithHeader>
    </InternalPage>
  )
}

export default About_faq
