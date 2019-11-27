# reveddit
[www.reveddit.com](https://www.reveddit.com/about) is a site for reviewing removed content on [reddit](https://www.reddit.com) user, subreddit, and thread pages.
Visit any `reddit.com/user/<username>` or `reddit.com/r/<subreddit>` page and add `ve` to the URL to see recent removed content,

* https://reveddit.com/user/
* https://reveddit.com/r/
* https://reveddit.com/domain/economist.com,reuters.com

For user pages, reveddit compares the content shown on a reddit user page to what is displayed elsewhere publicly on reddit. For subreddit pages, it compares what is recorded in Pushshift to what appears on the subreddit page. The code uses
Jason Baumgartner's [Pushshift API](https://github.com/pushshift/api) to determine whether content was removed immediately (by automod) or whether it was removed later (likely by a moderator).

The frontend is written in [React](https://reactjs.org/), leveraging the [removeddit](https://github.com/JubbeArt/removeddit) framework by Jesper Wrang.

# Development
1. Download either [yarn](https://yarnpkg.com/en/docs/install) or [npm](https://www.npmjs.com/get-npm) and run:

```bash
git clone git@github.com:reveddit/reveddit.git && cd reveddit

# npm...
npm install
npm start

# or yarn
yarn
yarn start
```

This will build the Javascript files and launch a local server for development.

2. Visit http://localhost:8080 and make sure the site is running.

Note, CSS is built separately by running

```bash
# npm
npm run build-sass

# yarn
yarn run build-sass
```

# Extra

[ragger](https://github.com/reveddit/ragger) generates the data used in the upvote removal graph on subreddit pages.
