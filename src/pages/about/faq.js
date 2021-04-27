import React from 'react'
import { InternalPage, NewWindowLink } from 'components/Misc'
import { Link } from 'react-router-dom'
import {ExtensionLink, MessageMods} from 'components/Misc'
import {ContentWithHeader} from 'pages/about'
import { unarchived_search_help_content, unarchived_search_button_word } from 'data_processing/FindCommentViaAuthors'
import {shuffle} from 'utils'
import {www_reddit} from 'api/reddit'

const reasons = [
  <li key='m'>In many cases, reddit sends no message about removals. Messages can <i>optionally</i> be sent by subreddit moderators.</li>,
  <li key='i'>Reddit shows you your removed comments as if they are not removed.</li>
]
const cantSayAnything_modlogConfig = '/r/CantSayAnything/wiki/modlog_config'
const unarchived_search_button_word_lc = unarchived_search_button_word.toLowerCase()
const publicmodlogs = <NewWindowLink reddit='/user/publicmodlogs'>u/publicmodlogs</NewWindowLink>
const modlogs = <NewWindowLink reddit='/user/modlogs'>u/modlogs</NewWindowLink>
const modlogs_example = <NewWindowLink reddit={cantSayAnything_modlogConfig}>{cantSayAnything_modlogConfig}</NewWindowLink>
const add_mod = 'add this bot as a moderator'
const control = 'gives more control over what is shared'
const modlogs_example_string = `[${cantSayAnything_modlogConfig}](${www_reddit}${cantSayAnything_modlogConfig})`
const modlogs_detail = `${add_mod}, give it wiki permissions, and create a /r/<subreddit>/wiki/modlog_config such as`
const publicmodlogs_detail = `${add_mod} with no permissions`
const add_modlogs_message = <MessageMods innerText='pre-filled message'
  message_title='Will you show context for mod logs?'
  message_body={
    'Dear mods,\n\n'
    +`Would you turn on mod logs so users can see the context of removed content? There are two options, u/modlogs and u/publicmodlogs. The former ${control},\n\n`
    +`* for u/modlogs: ${modlogs_detail} ${modlogs_example_string}.\n`
    +`* for u/publicmodlogs: ${publicmodlogs_detail}\n\n`
    +'Thank you.'
}/>

const About_faq = () => {
  return (
    <InternalPage>
      <ContentWithHeader header='Why do I need this?' id='message'>
        <p>
          Two reasons,
        </p>
        <ol>
          {shuffle(reasons)}
        </ol>
      </ContentWithHeader>
      <ContentWithHeader header='Is that true?' id='true'>
        <p>
          Yes, try it! Visit <NewWindowLink reddit='/r/CantSayAnything/about/sticky'>r/CantSayAnything</NewWindowLink> and write any comment.
          It will be removed, you will not receive a message, and it will appear to you as if it is not removed while you are logged in.
        </p>
        <p>
          You can verify this by opening the above link in an incognito window or while logged out. Your comment will not appear.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header='Any limitations?' id='limits'>
        <p>The following content is unavailable on reddit user pages and therefore cannot be tracked with reveddit user pages,</p>
        <ul>
          <li>Content from banned subreddits. The <Link to='/r/?contentType=top'>subreddit top page</Link> may display some content.</li>
          <li>Reddit live/chat comments</li>
        </ul>
      </ContentWithHeader>
      <ContentWithHeader header='How can I receive a message about removals?' id='extension'>
        <p><ExtensionLink/> notifies you when any of your content on reddit has been removed.</p>
      </ContentWithHeader>
      <ContentWithHeader header='Why does this site exist?' id='exist'>
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
        <p>No, user-deleted content does not appear on reveddit. Please note,</p>
        <ul>
          <li>Only reddit's <code>delete</code> button removes content from reveddit. A moderator can also use the <code>remove</code> button on their own content in subs they moderate. In that case the content will still appear on reveddit.</li>
          <li>If a moderator removes a comment, and then later the author deletes the comment, that comment will not appear on reveddit user pages and may still appear in reveddit threads. The reddit API does not have a way to show when authors delete mod-removed comments.</li>
        </ul>
      </ContentWithHeader>
      <ContentWithHeader header='Why are removed comments or posts sometimes not visible?' id='unarchived'>
        <p>Viewing removed content for subreddits and threads relies on an archive service called Pushshift which can fall behind. If a comment is removed before it is archived then it may not appear on reveddit. It may be possible to <a href={'#'+unarchived_search_button_word_lc}>restore</a> it from a user page.</p>
        <p>Your /user page will always be up to date since that only relies on data from reddit.</p>
      </ContentWithHeader>
      <ContentWithHeader header={'What does the "'+unarchived_search_button_word+'" button on removed comments in thread pages do?'} id={unarchived_search_button_word_lc}>
        {unarchived_search_help_content}
      </ContentWithHeader>
      <ContentWithHeader header='What does it mean when a removed comment has been "restored via user page"?' id='restored'>
        <p>It means the comment was not archived but able to be copied from the author's /user page. For more information, see the answer about the <a href={'#'+unarchived_search_button_word_lc}><code>{unarchived_search_button_word}</code> button</a>.</p>
      </ContentWithHeader>
      <ContentWithHeader header='What does the "unknown removed" label mean?' id='unknown-removed'>
        <p>Note, when an account is suspended by reddit, all the posts and comments for that account may be removed. The reddit API does not indicate where suspension-related removals occur and so reveddit cannot see or mark where this happens. You can check if an account has been suspended on its reddit or reveddit user page. Temporary suspensions may also remove content created before the suspension.</p>
        <p>The <code>unknown</code> label is applied when reveddit cannot determine if something was removed by a mod or by automod. Pushshift, a database that captures reddit data as it is created, and which reveddit queries, can fall behind retrieving data. When that happens, any removed items are marked as <code>[removed] by unknown</code>. When Pushshift captures content soon after creation, and the content has already been removed, then it is marked as <code>[removed] by automod</code>. If Pushshift has a record of a removed comment's body then the comment is labeled <code>[removed] by mod</code>. More detail can be found in the <a href='https://github.com/reveddit/reveddit/blob/60a34a28c5133fd54777d189fc9997afe89a2f39/src/data_processing/comments.js#L131'>source code</a>.</p>
      </ContentWithHeader>
      <ContentWithHeader header='How can I find out why something was removed?' id='removal-reason'>
        <p>Some subreddits publish their mod logs through {modlogs} or {publicmodlogs}. Reveddit merges information from these sources when possible. Clicking the <code>[removed] by</code> label on reveddit may show more details such as the mod's name and a reason.</p>
        <p>Using this {add_modlogs_message}, you can ask mods to make logs available. {modlogs} {control}. To set it up on a subreddit you moderate,</p>
        <ul>
          <li>for {modlogs}: {modlogs_detail} {modlogs_example}</li>
          <li>for {publicmodlogs}: {publicmodlogs_detail}</li>
        </ul>
        <p>You can inquire about a specific post or comment using the <code>message mods</code> button. This prepares a pre-filled message to the subreddit's moderators.</p>
        <p>Removal reasons also appear in flair or in a message on the new reddit layout.</p>
      </ContentWithHeader>
    </InternalPage>
  )
}

export default About_faq
