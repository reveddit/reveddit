import React, {useState} from 'react'
import { EmbeddedTweet } from 'react-tweet'
import { NewWindowLink, SocialLinks } from 'components/Misc'
import BlankUser from 'components/BlankUser'
import Highlight from 'pages/common/Highlight'
import { convertPathSub_reverse, get, put, shuffle } from 'utils'

const BlankUserBlurb = () => (<>
  <p>Look up your account's history:</p>
  <BlankUser message=' '
              placeholder='username'
              bottomMessage={<>
                <Highlight showMobile={true}/>
                <SocialLinks/>
              </>}
  />
</>)

export const Banned = () => {
  const redditPath = convertPathSub_reverse(window.location.pathname).split('/').slice(0,3).join('/')
  return (
    <>
      <h3>Historical view</h3>
      <p><NewWindowLink reddit={redditPath}>{redditPath}</NewWindowLink> is either private, banned, or does not exist. This historical view may show some of the top removed content.</p>
      <BlankUserBlurb/>
    </>
  )
}

const hasVisitedSite = 'hasVisitedSite'
// This value has to change for new users to see it
// BETTER: Instead using 'SpreadWord', describe the content shown.
//         That way in the future it will be more clear that I need to use a different value for new content
// NOTE: Var vals for first two uses should remain the same
//         'hasSeenSpreadWord' -> Faithfully Engaged podcast, 1st appearance
//         'hasSeenSpreadWord_v2' -> Demo of YouTube comment shadow removals
const hasSeenFaithfullyEngaged = 'hasSeenSpreadWord'
export const hasSeenYoutubeShadowRemovals = 'hasSeenSpreadWord_v2'
export const hasSeenSpreadWord = hasSeenYoutubeShadowRemovals
const hasSeenWyden = 'hasSeenWyden'
const startTimes = ['1372', '1538', '2073', '3438', '3887', '4319']
const widespread = <p>Shadowbanning is more widespread than you think. Spread the word!</p>
export const YoutubeShadowRemovals = ({topMessage = widespread}) => {
  return (<>
    {topMessage}
    <iframe className="video" src={`https://www.youtube-nocookie.com/embed/8e6BIkKBZpg`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
  </>)
}

const wydenTweetData = {"data":{"__typename":"Tweet","lang":"en","favorite_count":0,"possibly_sensitive":false,"created_at":"2023-09-17T15:52:15.000Z","display_text_range":[0,277],"entities":{"hashtags":[],"urls":[{"display_url":"reddit.com/r/technology/c…","expanded_url":"https://reddit.com/r/technology/comments/16jlhj7/we_are_senator_ron_wyden_fight_for_the_future/","indices":[206,229],"url":"https://t.co/JLoLiR5BcW"}],"user_mentions":[{"id_str":"250188760","indices":[8,17],"name":"Ron Wyden","screen_name":"RonWyden"}],"symbols":[]},"id_str":"1703436713362870723","text":"Senator @RonWyden is doing an AMA on r/technology on Monday. I hope someone asks if he supports Reddit's shadow bans:\n\n\"Reddit lets moderators shadow remove users' comments. Do you support this practice?\"\n\nhttps://t.co/JLoLiR5BcW…\n\nI'll be asleep at the time of the AMA. 1/2 🧵","user":{"id_str":"1047412980948713472","name":"Robert Hawkins","profile_image_url_https":"https://pbs.twimg.com/profile_images/1390117915584720904/oKtYaDO5_normal.jpg","screen_name":"rhaksw","verified":false,"is_blue_verified":false,"profile_image_shape":"Circle"},"edit_control":{"edit_tweet_ids":["1703436713362870723"],"editable_until_msecs":"1694969535000","is_edit_eligible":false,"edits_remaining":"5"},"conversation_count":1,"news_action_type":"conversation","card":{"card_platform":{"platform":{"audience":{"name":"production"},"device":{"name":"iPhone","version":"13"}}},"name":"summary_large_image","url":"https://t.co/JLoLiR5BcW","binding_values":{"photo_image_full_size_large":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":419,"width":800,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=800x419"},"type":"IMAGE"},"thumbnail_image":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":146,"width":280,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=280x150"},"type":"IMAGE"},"description":{"string_value":"Explore this post and more from the technology community","type":"STRING"},"domain":{"string_value":"www.reddit.com","type":"STRING"},"thumbnail_image_large":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":313,"width":600,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=600x600"},"type":"IMAGE"},"summary_photo_image_small":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":202,"width":386,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=386x202"},"type":"IMAGE"},"thumbnail_image_original":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":584,"width":1120,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=orig"},"type":"IMAGE"},"site":{"scribe_key":"publisher_id","type":"USER","user_value":{"id_str":"811377","path":[]}},"photo_image_full_size_small":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":202,"width":386,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=386x202"},"type":"IMAGE"},"summary_photo_image_large":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":419,"width":800,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=800x419"},"type":"IMAGE"},"thumbnail_image_small":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":75,"width":144,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=144x144"},"type":"IMAGE"},"thumbnail_image_x_large":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":584,"width":1120,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=png&name=2048x2048_2_exp"},"type":"IMAGE"},"photo_image_full_size_original":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":584,"width":1120,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=orig"},"type":"IMAGE"},"photo_image_full_size_alt_text":{"string_value":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","type":"STRING"},"vanity_url":{"scribe_key":"vanity_url","string_value":"reddit.com","type":"STRING"},"photo_image_full_size":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":314,"width":600,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=600x314"},"type":"IMAGE"},"summary_photo_image_alt_text":{"string_value":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","type":"STRING"},"thumbnail_image_color":{"image_color_value":{"palette":[{"rgb":{"blue":255,"green":255,"red":255},"percentage":91.57},{"rgb":{"blue":127,"green":124,"red":118},"percentage":6.18},{"rgb":{"blue":220,"green":203,"red":134},"percentage":0.91},{"rgb":{"blue":7,"green":75,"red":255},"percentage":0.48},{"rgb":{"blue":80,"green":127,"red":255},"percentage":0.31}]},"type":"IMAGE_COLOR"},"title":{"string_value":"From the technology community on Reddit: We are Senator Ron Wyden, Fight for the Future, ACLU, EFF...","type":"STRING"},"summary_photo_image_color":{"image_color_value":{"palette":[{"rgb":{"blue":255,"green":255,"red":255},"percentage":91.57},{"rgb":{"blue":127,"green":124,"red":118},"percentage":6.18},{"rgb":{"blue":220,"green":203,"red":134},"percentage":0.91},{"rgb":{"blue":7,"green":75,"red":255},"percentage":0.48},{"rgb":{"blue":80,"green":127,"red":255},"percentage":0.31}]},"type":"IMAGE_COLOR"},"summary_photo_image_x_large":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":584,"width":1120,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=png&name=2048x2048_2_exp"},"type":"IMAGE"},"summary_photo_image":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":314,"width":600,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=600x314"},"type":"IMAGE"},"photo_image_full_size_color":{"image_color_value":{"palette":[{"rgb":{"blue":255,"green":255,"red":255},"percentage":91.57},{"rgb":{"blue":127,"green":124,"red":118},"percentage":6.18},{"rgb":{"blue":220,"green":203,"red":134},"percentage":0.91},{"rgb":{"blue":7,"green":75,"red":255},"percentage":0.48},{"rgb":{"blue":80,"green":127,"red":255},"percentage":0.31}]},"type":"IMAGE_COLOR"},"photo_image_full_size_x_large":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":584,"width":1120,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=png&name=2048x2048_2_exp"},"type":"IMAGE"},"card_url":{"scribe_key":"card_url","string_value":"https://t.co/JLoLiR5BcW","type":"STRING"},"summary_photo_image_original":{"image_value":{"alt":"From the technology community on Reddit: \"We are Senator Ron Wyden, Fight for the Future, ACLU, EFF and advocates opposing the Kids Online Safety Act and other #BadInternetBills. Join our AMA in r/technology this Monday, 9/18 at 3pm EST! Ask us anything\"","height":584,"width":1120,"url":"https://pbs.twimg.com/card_img/1702940668891377664/wjPofjBa?format=jpg&name=orig"},"type":"IMAGE"}}},"isEdited":false,"isStaleEdit":false}}

export const WydenTweet = () => {
  return <EmbeddedTweet tweet={wydenTweetData.data} />
}

export const FaithfullyEngaged = ({topMessage = widespread}) => {
  const [startTime] = useState(shuffle(startTimes)[0])
  return (<>
    {topMessage}
    <iframe className="video" src={`https://www.youtube-nocookie.com/embed/ndiAl6QEA6k?start=${startTime}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    <div className='space-around' style={{marginBottom: '30px'}}>
      <NewWindowLink href="https://podcasts.apple.com/us/podcast/the-problem-with-shadowbanning-on-reddit-and/id1665487526?i=1000617548040">audio only</NewWindowLink>
      <NewWindowLink href="https://faithfullyengaged.com/blog/the-changing-landscape-of-social-media-from-community-to-censorship">write-up</NewWindowLink>
    </div>
  </>)
}

export const SpreadWord = FaithfullyEngaged

const hasSeenCensorshipWorse = 'hasSeenCensorshipWorse'
export const censorshipWorseLink = 'https://www.removednews.com/p/hate-online-censorship-its-way-worse'
export const CensorshipWorse = () => {
  return (<>
    <NewWindowLink href={censorshipWorseLink} onClick={() => put(hasSeenCensorshipWorse, true)}><img alt="Link to article titled: A new red army is here: Widespread secret suppression scales thought police to levels not seen since the days of Nazis and Communists, and it is time to speak up about it." src="/images/substack-media-2023-07-21.jpg"/></NewWindowLink>
  </>)
}
//hash -> localStorageKey
const showOneOfTheseFirst = {
  'censorship_worse': hasSeenCensorshipWorse,
  'youtube_shadow': hasSeenYoutubeShadowRemovals,
}

export const newUserModal = (props) => {
  if (window.location.hash === '#say') {
    return
  }
  const hash_options = []
  for (const [hash, localStorageKey] of Object.entries(showOneOfTheseFirst)) {
    if (! get(localStorageKey, false)) {
      hash_options.push(hash)
    }
  }
  if (! get(hasSeenWyden, false)) {
    props.openGenericModal({hash: 'wyden'})
    put(hasSeenWyden, true)
  } else if (! get(hasSeenFaithfullyEngaged, false)) {
    props.openGenericModal({hash: 'faithfully_engaged'})
    put(hasSeenFaithfullyEngaged, true)
  } else if (hash_options.length) {
    const hash = shuffle(hash_options)[0]
    props.openGenericModal({hash})
    put(showOneOfTheseFirst[hash], true)
  } else if (! get('hasNotifierExtension', false) &&
          ! get(hasVisitedSite, false)) {
    props.openGenericModal({hash: 'welcome'})
    put(hasVisitedSite, true)
  }
}

export const SubredditViewUnavailable = () => {
  return (<>
    <p>Live subreddit view is unavailable. Some historic data may appear here.</p>
    <BlankUserBlurb/>
  </>)
}
