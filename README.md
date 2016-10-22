# URI:teller


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

Install Node.js dependencies:

```sh
$ npm install
```


## Development

### Client

Watch and rebuild client side assets on changes:

```sh
$ npm run build -- --watch
```

### Server

If you want to run the server components you can use the [Application Default
Credentials](https://cloud.google.com/docs/authentication#getting_credentials_for_server-centric_flow) -
note that you need to get these only once for your environment:

```sh
$ gcloud beta auth application-default login
```

Run `app.js` in port 8080:

```sh
$ GCLOUD_PROJECT=<PROJECT_ID> BASE_URL=http://localhost:8080/ npm start
```

Run `worker.js` in port 8081:

```sh
$ GCLOUD_PROJECT=<PROJECT_ID> SCRIPT=worker.js npm start
```


## Deployment

```sh
$ npm run deploy
```
