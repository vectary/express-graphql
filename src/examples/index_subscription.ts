import { createServer } from 'http';

import express from 'express';
import { execute, subscribe } from 'graphql';
import ws from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { graphqlHTTP } from '..';

import { schema, roots, rootValue } from './schema';

const PORT = 12000;
const subscriptionEndpoint = `ws://localhost:${PORT}/subscriptions`;

const app = express();
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: { subscriptionEndpoint },
  }),
);

const server = createServer(app);

const wsServer = new ws.Server({
  server,
  path: '/subscriptions',
});

server.listen(PORT, () => {
  useServer(
    {
      schema,
      roots,
      execute,
      subscribe,
    },
    wsServer,
  );
  console.info(
    `Running a GraphQL API server with subscriptions at http://localhost:${PORT}/graphql`,
  );
});
