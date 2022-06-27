# GraphQL HTTP Server Middleware

[![NPM version](https://badgen.net/npm/v/@bluesialia/express-graphql)](https://www.npmjs.com/package/@bluesialia/express-graphql)
[![Build Status](https://github.com/graphql/express-graphql/workflows/CI/badge.svg?branch=master)](https://github.com/graphql/express-graphql/actions?query=branch%3Amaster)
[![Coverage Status](https://codecov.io/gh/graphql/express-graphql/branch/master/graph/badge.svg)](https://codecov.io/gh/graphql/express-graphql)

Create a GraphQL HTTP server with [Express](https://expressjs.com).

## Installation

```sh
npm install --save @bluesialia/express-graphql
```

This package needs [Express](https://www.npmjs.com/package/express) and [GraphQL](https://www.npmjs.com/package/graphql) as peer dependencies. So if you don't have those installed yet, install them with:
```sh
npm install --save express graphql
```

### TypeScript

This module includes a [TypeScript](https://www.typescriptlang.org/) declaration file to enable auto complete in compatible editors and type information for TypeScript projects.

## Simple Setup

Just mount `express-graphql` as a route handler:

```js
const express = require('express');
const { graphqlHTTP } = require('@bluesialia/express-graphql');

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema: MyGraphQLSchema,
    graphiql: true,
  }),
);

app.listen(4000);
```

## Setup with Subscription Support

```js
const { graphqlHTTP } = require('@bluesialia/express-graphql');
const express = require('express');
const { execute, subscribe } = require('graphql');
const { useServer } = require('graphql-ws/lib/use/ws');
const { createServer } = require('http');
const ws = require('ws');
const { schema } = require('./schema');

const PORT = 4000;
const subscriptionEndpoint = `ws://localhost:${PORT}/subscriptions`;

const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: { subscriptionEndpoint },
  }),
);

const server = createServer(app);

const wsServer = new ws.Server({
  server,
  path: '/subscriptions',
});

server.listen(PORT, () => {
  // Set up the WebSocket for handling GraphQL subscriptions.
  useServer(
    {
      schema,
      execute,
      subscribe,
    },
  );
});
```

## Options

The `graphqlHTTP` function accepts the following options:

- **`schema`**: A `GraphQLSchema` instance from [`GraphQL.js`](https://github.com/graphql/graphql-js/blob/main/src/type/schema.ts#L135). A `schema` _must_ be provided.

- **`graphiql`**: If `true`, presents [GraphiQL](https://github.com/graphql/graphiql/tree/main/packages/graphiql) when the GraphQL endpoint is loaded in a browser. We recommend that you set `graphiql` to `true` when your app is in development, because it's quite useful. You may or may not want it in production. Alternatively, instead of `true` you can pass in an options object:

  - **`defaultQuery`**: An optional GraphQL string to use when no query is provided and no stored query exists from a previous session. If `undefined` is provided, GraphiQL will use its own default query.

  - **`headerEditorEnabled`**: An optional boolean which enables the header editor when `true`. Defaults to `false`.

  - **`subscriptionEndpoint`**: An optional GraphQL string contains the WebSocket server url for subscription.

- **`rootValue`**: A value to pass as the `rootValue` to the `execute()` function from [`GraphQL.js/src/execution/execute.ts`](https://github.com/graphql/graphql-js/blob/main/src/execution/execute.ts#148).

- **`context`**: A value to pass as the `contextValue` to the `execute()` function from [`GraphQL.js/src/execution/execute.ts`](https://github.com/graphql/graphql-js/blob/main/src/execution/execute.ts#L149). If `context` is not provided, the `request` object is passed as the context.

- **`pretty`**: If `true`, any JSON response will be pretty-printed.

- **`extensions`**: An optional function for adding additional metadata to the GraphQL response as a key-value object. The result will be added to the `"extensions"` field in the resulting JSON. This is often a useful place to add development time metadata such as the runtime of a query or the amount of resources consumed. This may be an async function. The function is given one object as an argument: `{ document, variables, operationName, result, context }`.

- **`validationRules`**: Optional additional validation rules that queries must satisfy in addition to those defined by the GraphQL spec.

- **`customValidateFn`**: An optional function which will be used to validate instead of default `validate` from `graphql-js`.

- **`customExecuteFn`**: An optional function which will be used to execute instead of default `execute` from `graphql-js`.

- **`customFormatErrorFn`**: An optional function which will be used to format any errors produced by fulfilling a GraphQL operation. If no function is provided, GraphQL's default spec-compliant [`formatError`][] function will be used.

- **`customParseFn`**: An optional function which will be used to create a document instead of the default `parse` from `graphql-js`.

- **`formatError`**: is deprecated and replaced by `customFormatErrorFn`. It will be removed in version 1.0.0.

In addition to an object defining each option, options can also be provided as a function (or async function) which returns this options object. This function is provided the arguments `(request, response, graphQLParams)` and is called after the request has been parsed.

The `graphQLParams` is provided as the object `{ query, variables, operationName, raw }`.

```js
app.use(
  '/graphql',
  graphqlHTTP(async (request, response, graphQLParams) => ({
    schema: MyGraphQLSchema,
    rootValue: await someFunctionToGetRootValue(request),
    graphiql: true,
  })),
);
```

## HTTP Usage

Once installed at a path, `express-graphql` will accept requests with the parameters:

- **`query`**: A string GraphQL document to be executed.

- **`variables`**: The runtime values to use for any GraphQL query variables as a JSON object.

- **`operationName`**: If the provided `query` contains multiple named operations, this specifies which operation should be executed. If not provided, a 400 error will be returned if the `query` contains multiple named operations.

- **`raw`**: If the `graphiql` option is enabled and the `raw` parameter is provided, raw JSON will always be returned instead of GraphiQL even when loaded from a browser.

GraphQL will first look for each parameter in the query string of a URL:

```
/graphql?query=query+getUser($id:ID){user(id:$id){name}}&variables={"id":"4"}
```

If not found in the query string, it will look in the POST request body.

If a previous middleware has already parsed the POST body, the `request.body` value will be used. Use [`multer`](https://www.npmjs.com/package/multer) or a similar middleware to add support for `multipart/form-data` content, which may be useful for GraphQL mutations involving uploading files. See an [example using multer](https://github.com/bluesialia/express-graphql/blob/main/src/__tests__/http-test.ts#L857-L892).

If the POST body has not yet been parsed, `express-graphql` will interpret it depending on the provided _Content-Type_ header.

- **`application/json`**: the POST body will be parsed as a JSON object of parameters.

- **`application/x-www-form-urlencoded`**: the POST body will be parsed as a url-encoded string of key-value pairs.

- **`application/graphql`**: the POST body will be parsed as GraphQL query string, which provides the `query` parameter.

## Combining with Other Express Middleware

By default, the express request is passed as the GraphQL `context`. Since most express middleware operates by adding extra data to the request object, this means you can use most express middleware just by inserting it before `graphqlHTTP` is mounted. This covers scenarios such as authenticating the user, handling file uploads, or mounting GraphQL on a dynamic endpoint.

This example uses [`express-session`][] to provide GraphQL with the currently logged-in session.

```js
const session = require('express-session');
const { graphqlHTTP } = require('@bluesialia/express-graphql');

const app = express();

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

app.use(
  '/graphql',
  graphqlHTTP({
    schema: MySessionAwareGraphQLSchema,
    graphiql: true,
  }),
);
```

Then in your type definitions, you can access the request via the third "context" argument in your `resolve` function:

```js
new GraphQLObjectType({
  name: 'MyType',
  fields: {
    myField: {
      type: GraphQLString,
      resolve(parentValue, args, request) {
        // use `request.session` here
      },
    },
  },
});
```

## Providing Extensions

The GraphQL response allows for adding additional information in a response to a GraphQL query via a field in the response called `"extensions"`. This is added by providing an `extensions` function when using `graphqlHTTP`. The function must return a JSON-serializable Object.

When called, this is provided an argument which you can use to get information about the GraphQL request:

`{ document, variables, operationName, result, context }`

This example illustrates adding the amount of time consumed by running the provided query, which could perhaps be used by your development tools.

```js
const { graphqlHTTP } = require('@bluesialia/express-graphql');

const app = express();

const extensions = ({
  document,
  variables,
  operationName,
  result,
  context,
}) => {
  return {
    runTime: Date.now() - context.startTime,
  };
};

app.use(
  '/graphql',
  graphqlHTTP((request) => {
    return {
      schema: MyGraphQLSchema,
      context: { startTime: Date.now() },
      graphiql: true,
      extensions,
    };
  }),
);
```

When querying this endpoint, it would include this information in the result, for example:

```jsonc
{
  "data": { /*...*/ },
  "extensions": {
    "runTime": 135
  }
}
```

## Additional Validation Rules

GraphQL's [validation phase](https://spec.graphql.org/#sec-Validation) checks the query to ensure that it can be successfully executed against the schema. The `validationRules` option allows for additional rules to be run during this phase. Rules are applied to each node in an AST representing the query using the Visitor pattern.

A validation rule is a function which returns a visitor for one or more node Types. Below is an example of a validation preventing the specific field name `metadata` from being queried. For more examples, see the [`specifiedRules`](https://github.com/graphql/graphql-js/tree/main/src/validation/rules) in the [graphql-js](https://github.com/graphql/graphql-js) package.
0
```js
import { GraphQLError } from 'graphql';

export function DisallowMetadataQueries(context) {
  return {
    Field(node) {
      const fieldName = node.name.value;

      if (fieldName === 'metadata') {
        context.reportError(
          new GraphQLError(
            `Validation: Requesting the field ${fieldName} is not allowed`,
          ),
        );
      }
    },
  };
}
```

### Disabling introspection

Disabling introspection does not reflect best practices and does not necessarily make your application any more secure. Nevertheless, disabling introspection is possible by utilizing the `NoSchemaIntrospectionCustomRule` provided by the [graphql-js](https://github.com/graphql/graphql-js) package.

```js
import { NoSchemaIntrospectionCustomRule } from 'graphql';

app.use(
  '/graphql',
  graphqlHTTP((request) => {
    return {
      schema: MyGraphQLSchema,
      validationRules: [NoSchemaIntrospectionCustomRule],
    };
  }),
);
```

## Other Exports

**`getGraphQLParams(request: Request): Promise<GraphQLParams>`**

Given an HTTP Request, this returns a Promise for the parameters relevant to running a GraphQL request. This function is used internally to handle the incoming request, you may use it directly for building other similar services.

```js
const { getGraphQLParams } = require('@bluesialia/express-graphql');

getGraphQLParams(request).then((params) => {
  // do something...
});
```

## Debugging Tips

During development, it's useful to get more information from errors, such as stack traces. Providing a function to `customFormatErrorFn` enables this:

```js
customFormatErrorFn: (error) => ({
  message: error.message,
  locations: error.locations,
  stack: error.stack ? error.stack.split('\n') : [],
  path: error.path,
});
```
