require("dotenv").config();

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { execute, subscribe } from "graphql";
import { createServer } from "http";
import { PubSub } from "graphql-subscriptions";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "graphql-tools";

import { createChatClient } from "./chat";
import { createWebhooks } from "./webhooks";
import { typeDefs, createResolvers } from "./graphql";

const PORT = 4000;

async function main() {
  const app = express();
  const pubsub = new PubSub();
  const resolvers = createResolvers(pubsub);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // uploads: false,
    // playground: true,
    introspection: true,
  });

  await server.start();

  server.applyMiddleware({ app });

  const ws = createServer(app);
  ws.listen(PORT, async () => {
    console.log(`Server is now running on http://localhost:${PORT}`);
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema: makeExecutableSchema({ typeDefs, resolvers }),
      },
      {
        server: ws,
        path: "/subscriptions",
      }
    );

    createChatClient(pubsub);
    createWebhooks(app, pubsub);
  });
}

main();
