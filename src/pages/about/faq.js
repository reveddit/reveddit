import React from 'react'
import { InternalPage, NewWindowLink } from 'components/Misc'
import { Link } from 'react-router-dom'
import {ExtensionLink, MessageMods, SamePageHashLink, RedditOrLocalLink} from 'components/Misc'
import {TwitterLink} from 'pages/common/svg'
import {ContentWithHeader} from 'pages/about'
import { unarchived_search_help_content, unarchived_search_button_word, unarchived_search_button_word_code } from 'data_processing/RestoreComment'
import { unarchived_label_text } from 'pages/common/RemovedBy'
import {shuffle} from 'utils'
import {www_reddit} from 'api/reddit'
import {NewsItem} from 'pages/about'
import Time from 'pages/common/Time'
import { bookmarklet } from 'pages/about/AddOns'

export const pinPostLink = '/user/me/submit?title=See+which+comments+of+yours+have+been+removed&url=https%3A%2F%2Fwww.reveddit.com%2Fabout%2F'


const reasons = [
  <li key='m'>In many cases, reddit sends no message about removals. Messages can <i>optionally</i> be sent by subreddit moderators.</li>,
  <li key='i'>Reddit shows you your removed comments, and sometimes posts<SamePageHashLink id='reddit-does-not-say-post-removed'><sup>2</sup></SamePageHashLink>, as if they are not removed.<div style={{textAlign:'center'}}><img src="/images/removed-views.png" style={{maxWidth:'100%'}}/></div></li>
]
const cantSayAnything_modlogConfig = '/r/CantSayAnything/wiki/modlog_config'
const unarchived_search_button_word_lc = unarchived_search_button_word.toLowerCase()
const publicmodlogs = <NewWindowLink reddit='/user/publicmodlogs'>u/publicmodlogs</NewWindowLink>
const modlogs = <NewWindowLink reddit='/user/modlogs'>u/modlogs</NewWindowLink>
const modlogs_example = <NewWindowLink reddit={cantSayAnything_modlogConfig}>{cantSayAnything_modlogConfig}</NewWindowLink>
const add_mod = 'add this bot as a moderator'
const control = 'lets you fine-tune what is shared'
const modlogs_example_string = `[${cantSayAnything_modlogConfig}](${www_reddit}${cantSayAnything_modlogConfig})`
const modlogs_detail = `${add_mod}, give it wiki permissions, and create a config page such as`
const modlogs_detail_suffix = 'The bot will not have access to the AutoModerator config as that requires the "Manage Settings" permission.'
const publicmodlogs_detail = `${add_mod} with no permissions.`
const add_modlogs_message = <MessageMods innerText='pre-filled message'
  message_subject='Will you show context for removed content?'
  message_body={
    'Dear mods,\n\n'
    +`Would you turn on mod logs so users can see the context of removed content? There are two ways to do this, u/publicmodlogs and u/modlogs. The latter ${control},\n\n`
    +`* for u/publicmodlogs: ${publicmodlogs_detail}\n`
    +`* for u/modlogs: ${modlogs_detail} ${modlogs_example_string}. ${modlogs_detail_suffix}\n`
    +'\nThank you.'
}/>
const suppressedRemovalNoticeLink = '/r/ModSupport/comments/e6llgl/sorry_this_post_was_removed_by_reddits_spam/f9rbryk/'
const id_doesntSayPostRemoved = 'reddit-does-not-say-post-removed'
const old_removed_post = '/r/ProgrammerHumor/comments/9emzhp/turk_tv_found_the_reason_for_chromes_memory_usage/'

const questions = {
  description: {
    header: 'What is this?',
    content: <>
      <p>Reveddit reveals content removed from reddit by moderators. It does not show user-deleted content.<SamePageHashLink id='user-deleted'><sup>1</sup></SamePageHashLink></p>
      <p>To use it, insert <span className='v'>ve</span> or just <span className='v'>v</span> into the URL of any page on reddit, including user pages, subreddits, threads and more.</p>
  </>},
  need: {
    header: 'Why do I need it?',
    content: <>
      <p>
        Two reasons,
      </p>
      <ol>
        {shuffle(reasons)}
      </ol>
  </>},
  true: {
    header: 'Is that true?',
    content: <>
      <p>
        Yes, try it! Visit <NewWindowLink reddit='/r/CantSayAnything/about/sticky'>r/CantSayAnything</NewWindowLink> and create any comment or post.
        It will be removed, you will not receive a message, and it will appear to you as if it is not removed while you are logged in.
      </p>
      <p>
        You can verify this by opening the link to your content in an incognito window or while logged out. Your comment (or post's body) will not appear.
      </p>
      <p>
        Moderators may also silently ban users from a subreddit using what Reddit's Automoderator docs call a <NewWindowLink reddit='/r/AutoModerator/wiki/library#wiki_user_bot_ban_list'>"bot ban"</NewWindowLink>:
      </p>
      <blockquote>
        With a bot ban, <em>some</em> users won't realize they've been banned.
      </blockquote>
  </>},
  extension: {
    header: 'Can I be notified of removals?',
    content: <>
      <p>Yes, <ExtensionLink/> notifies you when any of your content on reddit has been removed.</p>
  </>},
  'linker-extension': {
    header: 'How can I switch between sites?',
    content: <>
      <p><ExtensionLink extensionID='linker'/> adds buttons that let you alternate between reddit and reveddit. Alternatively, you can drag the bookmarklet {bookmarklet} to your bookmarks bar. Find <Link to='/add-ons/'>more add-ons here</Link>.</p>
  </>},
  react: {
    header: 'How do people react?',
    content: <>
      <p>Here are some examples of how people react when they discover the way reddit handles removals:</p>
      <ul className='news'>
        <NewsItem reddit='/r/technology/comments/jp4j76/google_admits_to_censoring_the_world_socialist/gbckafs/?sort=top&limit=500' created_utc='1604673578' title='r/technology' newsText="Wow. Can they remove your comment and it still shows up on your side as if it wasn't removed?"/>
        <NewsItem href='/v/InternetIsBeautiful/comments/jp8xbg/you_can_see_which_commentsposts_of_yours_have/' created_utc='1604682454' title='r/InternetIsBeautiful' newsText="Today I learned that the reason noone ever replies to my posts is because they all get removed."/>
        <NewsItem href='/v/mildlyinfuriating/comments/owm7pj/i_posted_this_on_facebook_and_now_im_banned_for_3/h7ht06g/?ps_after=1627946797,1627966896,1627983960,1627999109,1628847752#t1_h7k144g' created_utc='1627950249' title='r/mildlyinfuriating' newsText="Wow. I’ve been on here 12 years and always thought it was a cool place where people could openly share ideas. Turns out it’s more censored than China. Being removed in 3,2,1…"/>
        <NewsItem reddit='/r/InternetIsBeautiful/comments/oqe6qy/tool_to_see_which_commentsposts_of_yours_have/' created_utc='1627082942' title='r/InternetIsBeautiful' newsText="I've got so many comments deleted and they aren't even controversial. That's bizarre."/>
        <NewsItem reddit='/r/science/comments/duwdco/should_moderators_provide_removal_explanations/f79o1yr/' created_utc='1573496256' title='r/science' newsText="Isn't that a no brainer? Feedback makes you better, no feedback discourages you and you don't learn anything."/>
        <NewsItem to='/about/#say' created_utc='1549684242' suffix=' — present' title='Selected comments: What people say'/>
      </ul>
  </>},
  firefox: {
    header: 'Why should I disable tracking protection in Firefox?',
    content: <>
      <p>A Firefox partner named disconnect.me maintains a list of domains that it calls trackers.
         Reddit is <NewWindowLink href='https://github.com/disconnectme/disconnect-tracking-protection/blob/b3f9cdcea541ab876e63970daadc490f9de2befa/services.json#L10851'>on that list</NewWindowLink>, so requests to reddit are blocked.
         The only way to fix this right now is to disable the feature. <NewWindowLink reddit='/r/technology/comments/jp4j76/_/gbfqdf2/?context=1'>more info</NewWindowLink>
      </p>
  </>},
  javascript: {
    header: 'Why is javascript required?',
    content: <>
      <p>Javascript is required so the site can operate with minimal costs.
        See <NewWindowLink reddit='/r/reveddit/comments/n3q106/new_features_added_umodlogs_data_and_a_date/h2dmcrq?context=1'>reducing time and money</NewWindowLink>.
      </p>
  </>},
  'user-deleted': {
    header: 'Does reveddit show user-deleted content?',
    content: <>
      <p>No, user-deleted content does not appear on reveddit. See <NewWindowLink reddit='/r/reveddit/comments/ih86wk/whats_it_mean_when_a_comment_has_been_restored/g75nxjx/'>this discussion on r/reveddit</NewWindowLink> and <NewWindowLink reddit='/r/removeddit/comments/ir1oyw/rip_removeddit_ceddit_reveddit/g5fgxgl/?context=3#thing_t1_g5fgxgl'>this one on r/removeddit</NewWindowLink> for more info.</p>
      <p>Please note,</p>
      <ul>
        <li>Only reddit's <code>delete</code> button removes content from reveddit. A moderator can also use the <code>remove</code> button on their own content in subs they moderate. In that case the content will still appear on reveddit.</li>
        <li>If a moderator removes a comment, and then later the author deletes the comment, that comment will not appear on reveddit user pages and may still appear in reveddit threads. The reddit API does not have a way to show when authors delete mod-removed comments.</li>
      </ul>
  </>},
  [id_doesntSayPostRemoved]: {
    header: 'Reddit does not say my post is removed. Why does reveddit say it is?',
    content: <>
      <p><ExtensionLink/> always shows post removal notices on both old and new reddit.</p>
      <p>Reddit does not tell you when posts (links) are removed if:</p>
        <ul>
          <li>reddit's spam filter removed the post, and the post is <NewWindowLink reddit={suppressedRemovalNoticeLink}>less than 24 hours old.</NewWindowLink>
            <ul>
              <li>A subreddit's "spam filter strength" setting may impact how often this occurs. Some subreddits set this to remove all posts up front.</li>
              <li>You can <NewWindowLink reddit={'/r/CantSayAnything/submit?title=A post that will be auto-removed without showing a removal notice.'+'&text='+encodeURIComponent(`Reddit's removal notice will not appear on this post [for 24 hours](${www_reddit+suppressedRemovalNoticeLink}). No evidence of its removal will be presented to the logged-in author. For the author:\n\n* It will appear in r/CantSayAnything/new\n* Its contents will be visible. Other users would see `+"`[removed]` if they could find the link to the post."+`\n\nThis post was created via https://www.reveddit.com/about/faq/#${id_doesntSayPostRemoved}`)}>post in r/CantSayAnything</NewWindowLink> to see how this works.</li>
              <li><NewWindowLink reddit='/r/reveddit/comments/ndbwag/reveddit_logs_me_out_winchromereveddit_realtime/gyaphsb/#thing_t1_gyaphsb'>See here</NewWindowLink> for more info.</li>
            </ul>
          </li>
          <li>you visit the page using a link to a comment, <NewWindowLink redesign={true} reddit='/r/CantSayAnything/comments/oiizmf/a_removed_post/h4vrp2v/'>here for example</NewWindowLink>.</li>
          <li>the post was removed prior to December 2019 when reddit announced <NewWindowLink reddit='/r/changelog/comments/e66fql/post_removal_details_on_the_new_design_redesign/'>Post removal details</NewWindowLink>. Here is an example of an old removed post <NewWindowLink reddit={old_removed_post}>on reddit</NewWindowLink> and on <a href={old_removed_post}>on reveddit</a>.</li>
          <li>you visit the page using <code>old.reddit.com</code>. Only <code>new.reddit.com</code> shows post removal notices.</li>
        </ul>
  </>},
  'removal-reason': {
    header: 'How can I find out why something was removed?',
    content: <>
      <p>You can inquire about a specific post or comment using the <code>message mods</code> button. This prepares a pre-filled message to the subreddit's moderators. A post's removal reason may appear in its flair or in a message on the new reddit layout.</p>
      <p>In addition, some subreddits publish their mod logs through {modlogs} or {publicmodlogs}. Reveddit merges information from these sources when possible. Clicking the <code>[removed] by</code> label on reveddit may show more details such as the mod's name and a reason.</p>
      <p>Using this {add_modlogs_message}, you can ask mods to make logs available. {modlogs} {control}. To set it up on a subreddit you moderate,</p>
      <ul>
        <li>for {publicmodlogs}: {publicmodlogs_detail}</li>
        <li>for {modlogs}: {modlogs_detail} {modlogs_example}. {modlogs_detail_suffix}</li>
      </ul>
  </>},
  unarchived: {
    header: 'Why is removed content sometimes not visible?',
    content: <>
      <p>Viewing removed content for subreddits and threads relies on an archive service called Pushshift which can fall behind, fail to archive content, or go offline. If a comment is removed before it is archived then it may not appear on reveddit. It may be possible to <a href={'#'+unarchived_search_button_word_lc}>restore</a> comments from a user page. Your /user page will always be up to date since that only relies on data from reddit.</p>
      <p>Pushshift may also completely miss content resulting in <NewWindowLink reddit='/r/pushshift/comments/jplcs1/growing_pains_and_moving_forward_to_bigger_and'>data gaps</NewWindowLink>. If a subreddit exposes <a href='#removal-reason'>mod logs</a>, reveddit may be able to surface removed content that does not exist within Pushshift.</p>
  </>},
  [unarchived_search_button_word_lc]: {
    header: <>What does the {unarchived_search_button_word_code} button on removed comments do?</>,
    content: <>
      {unarchived_search_help_content}
  </>},
  'unknown-removed': {
    header: 'What does the "unknown removed" label mean?',
    content: <>
      <p>The <code>unknown</code> label is applied when reveddit cannot determine if something was removed manually by a mod or removed automatically by automod, reddit's spam filter, or another bot. Pushshift, a database that captures reddit data as it is created, and which reveddit queries, can fall behind or fail to retrieve data. When that happens, any removed items are marked as <code>[removed] by unknown</code>. When Pushshift captures content soon after creation, and the content has already been removed, then it is marked as <code>[removed] automatically</code>. If Pushshift has a record of a removed comment's body then the comment is labeled <code>[removed] by mod</code>. More detail can be found in the <a href='https://github.com/reveddit/reveddit/blob/60a34a28c5133fd54777d189fc9997afe89a2f39/src/data_processing/comments.js#L131'>source code</a>.</p>
      <p>Note, when an account is suspended by reddit, all the posts and comments for that account may be removed. The reddit API does not indicate where suspension-related removals occur and so reveddit cannot see or mark where this happens. You can check if an account has been suspended on its reddit or reveddit user page. Temporary suspensions may also remove content created before the suspension.</p>
  </>},
  limits: {
    header: 'Any limitations?',
    content: <>
      <h3>I. Untracked content</h3>
      <p>The following content is unavailable on reddit user pages and therefore cannot be tracked with reveddit user pages,</p>
      <ul>
        <li>Content from banned subreddits. The <Link to='/r/?contentType=history'>subreddit history page</Link> may display some content.</li>
        <li>Reddit live/chat comments</li>
      </ul>
      <h3>II. Archive overwrites</h3>
      <p>The archive service on which reveddit relies changed its comment retention behavior around September 2021. As a result, now comments in threads may not be visible after about 1.5 days. <NewWindowLink reddit='/pgzf7g'>This post</NewWindowLink> explains what is going on. That change does not impact <ExtensionLink/> or user pages on reveddit.</p>
      <h3>III. Collapsed comments on user pages</h3>
      <p>Collapsed comments may or may not be marked on user pages. It seems to work for some accounts and not for others. See <NewWindowLink reddit='/qgajxq'>here</NewWindowLink> for more info.</p>
  </>},
  heard: {
    header: "Why haven't I heard about this?",
    content: <>
      <p>
        Subreddits such as LifeProTips, todayilearned, and YouShouldKnow <NewWindowLink href='/info/?id=t3_peya4z,t3_jzyx2t,t3_eulr25,t3_eovmxf,t3_dbad5a,t3_cullyo,t3_cs9hsb,t3_crrf7u,t3_fr65qj,t3_gdxli5,t3_gnt7vc,t3_geravh,t3_h0lp80,t3_hl4mj7,t3_f7sbyx,t3_evedjn,t3_bdauo6,t3_ak4m28,t3_a7nnxs,t3_9ikef8,t3_5l8ls1,t3_5jum2v'>rarely approve</NewWindowLink> submissions about reveddit because of rules against posts related to software, social media, or self-promotion. And, most subreddits <NewWindowLink reddit='/r/assholedesign/wiki/common_topics'>forbid posts about reddit</NewWindowLink>, including AssholeDesign, MildlyInfuriating, and CrappyDesign.
      </p>
      <p>
        Sometimes reddit's spam filter <NewWindowLink href='/info/?id=t3_oqwg44,t3_rr0z7x,t3_see2yw,t3_or2hru,t3_o5d5yg,t3_lh6ghm'>marks such posts as spam</NewWindowLink>.
        Places where reveddit has been successfully shared are <SamePageHashLink id='react'>listed here</SamePageHashLink>.
      </p>
  </>},
  share: {
    header: 'How can I share it?',
    content: <>
      <p>
        Tell people that <em>reviewable moderation</em> is important. You can <TwitterLink>tweet</TwitterLink> about it, <NewWindowLink old={true} reddit={pinPostLink}>pin it</NewWindowLink> to your reddit profile, and post or comment in a subreddit as <SamePageHashLink id='react'>many others have done</SamePageHashLink>.
      </p>
  </>},
  altered: {
    header: "How else does reddit appear differently for me?",
    content: <>
      <p>As of January 2022, "blocking" allows users to prevent other users from seeing or replying to their content. See the following posts for more information:</p>
      <ul className='news'>
        <NewsItem created_utc='1642523415' timePrefix='r/blog ' title='Announcing Blocking Updates' reddit='/r/blog/comments/s71g03/announcing_blocking_updates'/>
        <NewsItem created_utc='1643221832' timePrefix='r/TheoryOfReddit ' title="Reddit's new block feature and its effects on spreading misinformation and propaganda." href='/v/TheoryOfReddit/comments/sdcsx3/testing_reddits_new_block_feature_and_its_effects?ps_after=1643319803%2C1643807744'/>
        <NewsItem created_utc='1643209440' timePrefix='r/ModSupport ' title='We need to talk about people weaponizing the block feature.' href='/v/ModSupport/comments/sd7zsa/we_need_to_talk_about_people_weaponizing_the'/>
        <NewsItem created_utc='1645373607' timePrefix='r/ModSupport ' title='This new block feature is nothing but trouble and not just for mods. Users are complaining about being locked out of conversation by bad faith accounts blocking them.' reddit='/r/ModSupport/comments/swzqy4/war_against_the_block_and_report_features/hxptoih'/>
        <NewsItem created_utc='1643777017' timePrefix='r/bestof ' title="...a major flaw" reddit='/r/bestof/comments/sifqkr/uconversationcold8641_tests_out_reddits_new'/>
        <NewsItem created_utc='1643073643' timePrefix='r/Austin ' title="...it's easily abusable by trolls and misinformation spreaders" reddit='/r/Austin/comments/sc18ob/dear_mods_please_complain_about_the_new_blocking'/>
        <NewsItem created_utc='1643583564' timePrefix='r/help ' title='...it gives trolls and users spreading harmful misinformation an enormous amount of power.' reddit='/r/help/comments/sglh3q/block_feature_constantly_being_abused_how_do_we'/>
        <NewsItem created_utc='1643818294' timePrefix='r/skeptic ' title="...reddit's new block feature is a nightmare that trolls can use" reddit='/r/skeptic/comments/sisg8l/given_reddits_new_block_feature_is_a_nightmare'/>
        <NewsItem created_utc='1642972951' timePrefix='r/Scotland ' title='This sub is about to devolve into two echo Chambers' reddit='/r/Scotland/comments/sb49rj/this_sub_is_about_to_devolve_into_two_echo?sort=top'/>
        <NewsItem created_utc='1643319787' timePrefix='r/mormon ' title='...I think it will destroy reddit communities' reddit='/r/mormon/comments/se9ixe/new_blocking_function_for_reddit'/>
      </ul>
    </>},
}

export const FaqLink = ({id, children}) => <RedditOrLocalLink to={'/about/faq/#'+id}>{children ? children : <em>{questions[id].header}</em>}</RedditOrLocalLink>

const About_faq = () => {
  return (
    <InternalPage>
      {
        Object.entries(questions).map(([id, obj]) => {
          return <ContentWithHeader key={id} id={id} header={obj.header}>
            {obj.content}
          </ContentWithHeader>
        })
      }
    </InternalPage>
  )
}

export default About_faq
