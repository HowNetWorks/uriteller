<img src="src/frontend/assets/img/utlogo.png" alt="URI:teller" width="80%" />

[![CircleCI](https://circleci.com/gh/HowNetWorks/uriteller.svg?style=shield)](https://circleci.com/gh/HowNetWorks/uriteller)

**NOTE: The hosted site, https:/​/uriteller.io, is no longer active. As a replacement check out [Canarytokens](https://canarytokens.org/) and [RequestBin](https://github.com/Runscope/requestbin).**

URI:teller is a service for monitoring how chat apps, social network sites and such fetch their link previews. See the companion [blog post](https://medium.com/hownetworks/uri-teller-a-call-for-the-curious-20694617db1c) talking about the original motivation and further uses.

The code in this repository is built for the Google Cloud Platform. See [Prerequisites](#prerequisites) for more info about that.

## Technical Name-dropping

URI:teller uses Google's [Cloud Datastore](https://cloud.google.com/datastore/) as the database and [Cloud Pub/Sub](https://cloud.google.com/pubsub/) for passing work between services. Stackdriver [Debugger](https://cloud.google.com/debugger/), [Trace](https://cloud.google.com/trace/) and [Error Reporting](https://cloud.google.com/error-reporting/) work if their respective APIs are enabled. The frontend service sends analytics to Google Analytics whent the `GA_TRACKING_ID` environment variable is set.

The code is written in ES2015 plus some extensions, such as modules and `.vue` component files. [Babel](https://babeljs.io/) then compiles the source to JavaScript that [Node.js](https://nodejs.org/en/) and browsers can handle. For styling: [SASS](http://sass-lang.com/).

[Vue](https://vuejs.org/) allows reusing the same view code for both server-side and in-browser rendering.

[Express](http://expressjs.com/) (with its [Helmet](https://helmetjs.github.io/) on) powers the server side code.

On the browser [Bootstrap 4](https://v4-alpha.getbootstrap.com/) makes things look nice. [Webpack 2](https://webpack.github.io/) crumples the code, styles and other assets into an easily distributable bundle.

[CircleCI](https://circleci.com/) runs the build process on every repository push. CircleCI also deploys the site whenever the `production` branch gets an update.

## Prerequisites

### Google Cloud Platform

This project is made to be hosted in the Google Cloud Platform (namely in the
[Google App Engine Node.js flexible
environment](https://cloud.google.com/appengine/docs/flexible/nodejs/)), so you
need an account: https://cloud.google.com/

Install and initialize Google Cloud SDK: https://cloud.google.com/sdk/docs/

Create a new project from the [Google Cloud Platform
Console](https://console.cloud.google.com/) or use an already existing one. Set
your project's id `PROJECT_ID` as default with:

```sh
$ gcloud config set project <PROJECT_ID>
```

### App Dependencies

Install Node.js dependencies. The following command line examples use [`yarn`](https://yarnpkg.com/) but `npm` works just as well.

```sh
$ yarn
```


## Development

### Client

Watch and rebuild client side assets on changes:

```sh
$ yarn dev
```

### Server

If you want to run the server components you can use the [Application Default
Credentials](https://cloud.google.com/docs/authentication#getting_credentials_for_server-centric_flow) -
note that you need to get these only once for your environment:

```sh
$ gcloud auth application-default login
```

Run `app.js` in port 8080:

```sh
$ GCLOUD_PROJECT=<PROJECT_ID> APP_BASE_URL=http://localhost:8080/ yarn start
```

Run `worker.js` instead:

```sh
$ GCLOUD_PROJECT=<PROJECT_ID> SCRIPT=worker.js yarn start
```
