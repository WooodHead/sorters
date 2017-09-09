# Sorters Club

The website [sorters.club](https://sorters.club) is a website for people who want to sort themselves out based on Jordan Peterson's advice.

Support the development of this website on [patreon](https://www.patreon.com/nickredmark).

## Setup

### Prerequisites

* A running mongodb database. Please follow [the instruction](https://docs.mongodb.com/manual/administration/install-community/) on setting up mongodb locally.

### Clone

Clone this repository.

### Settings

Copy `settings.dist.js` to `settings.js` and adapt to suit your needs.

Copy `public-settings.dist.js` to `public-settings.js` and adapt to suit your need.

In principle, these settings file can be left as they are in development mode.

### Node

To get the correct node version with nvm type:

```
nvm use
```

Otherwise check `.nvmrc` and install accordingly.

### Yarn

Install yarn:

```
npm install -g yarn
```

### Install

Install with yarn:

```
yarn
```

## Run

### Development

Run:

```
yarn run dev
```

Visit `http://localhost:3000` (or the url you set up in settings.js).

### Production

Build:

```
yarn build
yarn start
```

## Testing

We test using the jest testing suite.

### Unit tests

```
yarn test
```

To run in watch mode:

```
yarn test -- --watch
```

### End-to-end tests

WARNING: this assumes the existence and will overwrite data on database `mongodb://localhost:27017/sorters_test`

A build is necessary if you changed the website code (not if you changed test code):

```
yarn build
```

Start server

```
yarn start:test
```

In an other terminal, run tests:

```
yarn run test:e2e
```

To run in watch mode:

```
yarn run test:e2e -- --watch
```
