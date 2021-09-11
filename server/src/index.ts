import { ApolloServer } from "apollo-server-express";
import { config } from "dotenv";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { existsSync, promises as fs } from "fs";
import express from "express";

import { createChatClient } from "./chat";
import { createWebhooks } from "./webhooks";
import { typeDefs, createResolvers } from "./graphql";

config();

const PORT = 4000;

// const SCOPES = ["channel:read:subscriptions", "chat:edit", "chat:read"];

async function main() {
  try {
    let tokenData = {
      accessToken: "INITIAL_ACCESS_TOKEN",
      refreshToken: "INITIAL_REFRESH_TOKEN",
      expiresIn: 0,
      obtainmentTimestamp: 0,
    };

    if (!existsSync("./tokens.json"))
      await fs.writeFile("./tokens.json", JSON.stringify(tokenData, null, 4), {
        encoding: "utf8",
      });
    tokenData = JSON.parse(
      await fs.readFile("./tokens.json", { encoding: "utf-8" })
    );

    const authProvider = new RefreshingAuthProvider(
      {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        onRefresh: async (token: AccessToken): Promise<void> => {
          console.log("New token:", token);
          await fs.writeFile("./tokens.json", JSON.stringify(token, null, 4), {
            encoding: "utf-8",
          });
        },
      },
      tokenData
    );

    await authProvider.getAccessToken();

    console.log("authProvider.currentScopes:", authProvider.currentScopes);
    console.log("authProvider.tokenType:", authProvider.tokenType);

    const app = express();
    const pubsub = new PubSub();
    const resolvers = await createResolvers(authProvider, pubsub);

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

      createChatClient(authProvider, pubsub);
      // createWebhooks(authProvider, app, pubsub);
    });
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
