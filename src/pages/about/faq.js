import React from 'react'
import { InternalPage, NewWindowLink } from 'components/Misc'
import { Link } from 'react-router-dom'
import {ExtensionLink, MessageMods} from 'components/Misc'
import {ContentWithHeader} from 'pages/about'
import { unarchived_search_help_content, unarchived_search_button_word, unarchived_search_button_word_code } from 'data_processing/FindCommentViaAuthors'
import { unarchived_label_text } from 'pages/common/RemovedBy'
import {shuffle} from 'utils'
import {www_reddit} from 'api/reddit'

const reasons = [
  <li key='m'>In many cases, reddit sends no message about removals. Messages can <i>optionally</i> be sent by subreddit moderators.</li>,
  <li key='i'>Reddit shows you your removed comments, and sometimes posts, as if they are not removed.</li>
]
const cantSayAnything_modlogConfig = '/r/CantSayAnything/wiki/modlog_config'
const unarchived_search_button_word_lc = unarchived_search_button_word.toLowerCase()
const publicmodlogs = <NewWindowLink reddit='/user/publicmodlogs'>u/publicmodlogs</NewWindowLink>
const modlogs = <NewWindowLink reddit='/user/modlogs'>u/modlogs</NewWindowLink>
const modlogs_example = <NewWindowLink reddit={cantSayAnything_modlogConfig}>{cantSayAnything_modlogConfig}</NewWindowLink>
const add_mod = 'add this bot as a moderator'
const control = 'gives more control over what is shared'
const modlogs_example_string = `[${cantSayAnything_modlogConfig}](${www_reddit}${cantSayAnything_modlogConfig})`
const modlogs_detail = `${add_mod}, give it wiki permissions, and create a config page such as`
const modlogs_detail_suffix = 'The bot will not have access to the AutoModerator config as that requires the "Manage Settings" permission.'
const publicmodlogs_detail = `${add_mod} with no permissions`
const add_modlogs_message = <MessageMods innerText='pre-filled message'
  message_subject='Will you show context for mod logs?'
  message_body={
    'Dear mods,\n\n'
    +`Would you turn on mod logs so users can see the context of removed content? There are two options, u/modlogs and u/publicmodlogs. The former ${control},\n\n`
    +`* for u/modlogs: ${modlogs_detail} ${modlogs_example_string}. ${modlogs_detail_suffix}\n`
    +`* for u/publicmodlogs: ${publicmodlogs_detail}\n\n`
    +'Thank you.'
}/>

const About_faq = () => {
  return (
    <InternalPage>
      <ContentWithHeader header='Why do I need this?' id='need'>
        <p>
          Two reasons,
        </p>
        <ol>
          {shuffle(reasons)}
        </ol>
      </ContentWithHeader>
      <ContentWithHeader header='Is that true?' id='true'>
        <p>
          Yes, try it! Visit <NewWindowLink reddit='/r/CantSayAnything/about/sticky'>r/CantSayAnything</NewWindowLink> and create any comment or post.
          It will be removed, you will not receive a message, and it will appear to you as if it is not removed while you are logged in.
        </p>
        <p>
          You can verify this by opening the link to your content in an incognito window or while logged out. Your comment (or post's body) will not appear.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header='Can I be notified of removals?' id='extension'>
        <p>Yes, <ExtensionLink/> notifies you when any of your content on reddit has been removed.</p>
      </ContentWithHeader>
      <ContentWithHeader header='How can I switch between sites?' id='linker-extension'>
        <p><ExtensionLink extensionID='linker'/> adds a button that lets you alternate between reddit and reveddit. The button is also accessible by right-clicking a link. Find <Link to='/add-ons/'>more add-ons here</Link>.</p>
      </ContentWithHeader>
      <ContentWithHeader header='How do people react?' id='react'>
        <p>Here are some examples of how people react when they discover the way reddit handles removals:</p>
        <ul>
          <li><a href='/v/InternetIsBeautiful/comments/jp8xbg/you_can_see_which_commentsposts_of_yours_have/'>a post in r/InternetIsBeautiful</a></li>
          <li><NewWindowLink reddit='/r/technology/comments/jp4j76/google_admits_to_censoring_the_world_socialist/gbckafs/?sort=top&limit=500'>a thread in r/technology</NewWindowLink></li>
          <li><Link to='/about/#say'>Selected comments: What people say</Link></li>
        </ul>
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
      <ContentWithHeader header='Why is javascript required?' id='javascript'>
        <p>Javascript is required so the site can operate with minimal costs.
          See <NewWindowLink reddit='/r/reveddit/comments/n3q106/new_features_added_umodlogs_data_and_a_date/h2dmcrq?context=1'>reducing time and money</NewWindowLink>.
        </p>
      </ContentWithHeader>
      <ContentWithHeader header='Does reveddit show user-deleted content?' id='user-deleted'>
        <p>No, user-deleted content does not appear on reveddit. See <NewWindowLink reddit='/r/reveddit/comments/ih86wk/whats_it_mean_when_a_comment_has_been_restored/g75nxjx/'>this discussion on r/reveddit</NewWindowLink> and <NewWindowLink reddit='/r/removeddit/comments/ir1oyw/rip_removeddit_ceddit_reveddit/g5fgxgl/?context=3#thing_t1_g5fgxgl'>this one on r/removeddit</NewWindowLink> for more info.</p>
        <p>Please note,</p>
        <ul>
          <li>Only reddit's <code>delete</code> button removes content from reveddit. A moderator can also use the <code>remove</code> button on their own content in subs they moderate. In that case the content will still appear on reveddit.</li>
          <li>If a moderator removes a comment, and then later the author deletes the comment, that comment will not appear on reveddit user pages and may still appear in reveddit threads. The reddit API does not have a way to show when authors delete mod-removed comments.</li>
        </ul>
      </ContentWithHeader>
      <ContentWithHeader header='Reddit does not say my post is removed. Why does reveddit say it is?' id='reddit-does-not-say-post-removed'>
        <p><ExtensionLink/> always shows post removal notices on both old and new reddit.</p>
        <p>Reddit does not tell you when posts (links) are removed if:</p>
          <ul>
            <li>you visit the page using a link to a comment, <NewWindowLink redesign={true} reddit='/r/CantSayAnything/comments/oiizmf/a_removed_post/h4vrp2v/'>here for example</NewWindowLink>.</li>
            <li>the subreddit has set "spam filter strength" to remove all posts, and the post is less than 24 hours old.
              <ul>
                <li>You can <NewWindowLink reddit='/r/CantSayAnything/submit'>post in r/CantSayAnything</NewWindowLink> to see how this works.</li>
                <li><NewWindowLink reddit='/r/reveddit/comments/ndbwag/reveddit_logs_me_out_winchromereveddit_realtime/gyaphsb/#thing_t1_gyaphsb'>See here</NewWindowLink> for more info.</li>
              </ul>
            </li>
            <li>you visit the page using <code>old.reddit.com</code>. Only <code>new.reddit.com</code> shows post removal notices.</li>
          </ul>
      </ContentWithHeader>
      <ContentWithHeader header='How can I find out why something was removed?' id='removal-reason'>
        <p>Some subreddits publish their mod logs through {modlogs} or {publicmodlogs}. Reveddit merges information from these sources when possible. Clicking the <code>[removed] by</code> label on reveddit may show more details such as the mod's name and a reason.</p>
        <p>Using this {add_modlogs_message}, you can ask mods to make logs available. {modlogs} {control}. To set it up on a subreddit you moderate,</p>
        <ul>
          <li>for {modlogs}: {modlogs_detail} {modlogs_example}. {modlogs_detail_suffix}</li>
          <li>for {publicmodlogs}: {publicmodlogs_detail}</li>
        </ul>
        <p>You can inquire about a specific post or comment using the <code>message mods</code> button. This prepares a pre-filled message to the subreddit's moderators.</p>
        <p>Removal reasons may also appear in flair or in a message on the new reddit layout.</p>
      </ContentWithHeader>
      <ContentWithHeader header='Why is removed content sometimes not visible?' id='unarchived'>
        <p>Viewing removed content for subreddits and threads relies on an archive service called Pushshift which can fall behind. If a comment is removed before it is archived then it may not appear on reveddit. It may be possible to <a href={'#'+unarchived_search_button_word_lc}>restore</a> it from a user page.</p>
        <p>Your /user page will always be up to date since that only relies on data from reddit.</p>
      </ContentWithHeader>
      <ContentWithHeader header={<>What does the {unarchived_search_button_word_code} button on removed comments do?</>} id={unarchived_search_button_word_lc}>
        {unarchived_search_help_content}
      </ContentWithHeader>
      <ContentWithHeader header='What does the "unknown removed" label mean?' id='unknown-removed'>
        <p>The <code>unknown</code> label is applied when reveddit cannot determine if something was removed by a mod or by automod. Pushshift, a database that captures reddit data as it is created, and which reveddit queries, can fall behind retrieving data. When that happens, any removed items are marked as <code>[removed] by unknown</code>. When Pushshift captures content soon after creation, and the content has already been removed, then it is marked as <code>[removed] by automod</code>. If Pushshift has a record of a removed comment's body then the comment is labeled <code>[removed] by mod</code>. More detail can be found in the <a href='https://github.com/reveddit/reveddit/blob/60a34a28c5133fd54777d189fc9997afe89a2f39/src/data_processing/comments.js#L131'>source code</a>.</p>
        <p>Note, when an account is suspended by reddit, all the posts and comments for that account may be removed. The reddit API does not indicate where suspension-related removals occur and so reveddit cannot see or mark where this happens. You can check if an account has been suspended on its reddit or reveddit user page. Temporary suspensions may also remove content created before the suspension.</p>
      </ContentWithHeader>
      <ContentWithHeader header='Any limitations?' id='limits'>
        <p>The following content is unavailable on reddit user pages and therefore cannot be tracked with reveddit user pages,</p>
        <ul>
          <li>Content from banned subreddits. The <Link to='/r/?contentType=top'>subreddit top page</Link> may display some content.</li>
          <li>Reddit live/chat comments</li>
        </ul>
      </ContentWithHeader>
    </InternalPage>
  )
}

export default About_faq
