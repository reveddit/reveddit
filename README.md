# revddit
[revddit](https://revddit.com) is a site for reviewing removed content on [reddit](https://www.reddit.com) user pages.
Visit any `reddit.com/user/<username>` page and add a `v` to the URL to see all removed content.

This is done by comparing the content shown on a reddit user page to what is displayed elsewhere publicly on reddit. The code uses
Jason Baumgartner's [Pushshift API](https://github.com/pushshift/api) to determine whether content was removed immediately (by automod)
or whether it was removed later (likely by a moderator).

The frontend is written in [React](https://reactjs.org/), leveraging the [removeddit](https://github.com/JubbeArt/removeddit) framework by Jesper Wrang.

# Development
Download either [yarn](https://yarnpkg.com/en/docs/install) or [npm](https://www.npmjs.com/get-npm)

```bash
git clone git@github.com:rhaksw/revddit.git && cd revddit

# npm...
npm install
npm start

# or yarn
yarn
yarn start
```

This will build the Javascript files and launch a local server for development. Visit http://localhost:8080 and make sure the site is running.

CSS is built separately by running

```bash
# npm
npm run build-sass

# yarn
yarn run build-sass
```
