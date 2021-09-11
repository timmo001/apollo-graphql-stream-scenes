import { ApolloServer } from "apollo-server-express";
import { config } from "dotenv";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import {
  AccessToken,
  AuthProvider,
  ClientCredentialsAuthProvider,
  RefreshingAuthProvider,
  StaticAuthProvider,
} from "@twurple/auth";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { existsSync, promises as fs } from "fs";
import axios from "axios";
import express from "express";
import queryString from "query-string";

import { createChatClient } from "./chat";
import { createWebhooks } from "./webhooks";
import { typeDefs, createResolvers } from "./graphql";

config();

const PORT = 4000;

const SCOPES = ["channel:read:subscriptions", "chat:edit", "chat:read"];

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

    // const authProvider = new ClientCredentialsAuthProvider(
    //   process.env.CLIENT_ID,
    //   process.env.CLIENT_SECRET
    //   // [
    //   //   "channel:moderate",
    //   //   "channel:read:subscriptions",
    //   //   "chat:edit",
    //   //   "chat:read",
    //   // ]
    // );

    try {
      // const clientAuthProvider = new ClientCredentialsAuthProvider(
      //   process.env.CLIENT_ID,
      //   process.env.CLIENT_SECRET
      // );

      // console.log(
      //   "clientAuthProvider.currentScopes:",
      //   clientAuthProvider.currentScopes
      // );
      // console.log(
      //   "clientAuthProvider.tokenType:",
      //   clientAuthProvider.tokenType
      // );

      // const clientAuthToken = await clientAuthProvider.getAccessToken();

      // console.log("clientAuthToken:", clientAuthToken);

      // const staticAuthProvider = new StaticAuthProvider(
      //   process.env.CLIENT_ID,
      //   process.env.ACCESS_TOKEN,
      //   SCOPES
      // );

      // console.log(
      //   "staticAuthProvider.currentScopes:",
      //   staticAuthProvider.currentScopes
      // );
      // console.log(
      //   "staticAuthProvider.tokenType:",
      //   staticAuthProvider.tokenType
      // );

      // const { status, data: authData } = await axios.post(
      //   `https://id.twitch.tv/oauth2/token?${queryString.stringify({
      //     client_id: process.env.CLIENT_ID,
      //     client_secret: process.env.CLIENT_SECRET,
      //     code: process.env.CODE,
      //     grant_type: "authorization_code",
      //     redirect_uri: `http://localhost:4000`,
      //     // scope: SCOPES.join(" "),
      //   })}`
      // );

      // if (status !== 200) {
      //   console.error("Authentication error:", status, authData);
      //   return;
      // }

      // console.log("authData:", authData);

      // let tokenData = await staticAuthProvider.getAccessToken();

      // console.log("tokenData:", tokenData);

      let tokenData = {
        accessToken: "INITIAL_ACCESS_TOKEN",
        refreshToken: "INITIAL_REFRESH_TOKEN",
        expiresIn: 0,
        obtainmentTimestamp: 0,
      };

      if (!existsSync("./tokens.json"))
        await fs.writeFile(
          "./tokens.json",
          JSON.stringify(tokenData, null, 4),
          { encoding: "utf8" }
        );
      tokenData = JSON.parse(
        await fs.readFile("./tokens.json", { encoding: "utf-8" })
      );

      const authProvider = new RefreshingAuthProvider(
        {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          onRefresh: async (token: AccessToken): Promise<void> => {
            console.log("New token:", token);
            await fs.writeFile(
              "./tokens.json",
              JSON.stringify(token, null, 4),
              { encoding: "utf-8" }
            );
          },
        },
        tokenData
      );

      // const authProvider: AuthProvider = {
      //   clientId: process.env.CLIENT_ID,
      //   // clientSecret: process.env.CLIENT_SECRET,
      //   currentScopes: SCOPES,
      //   tokenType: "user",
      //   getAccessToken: async (): Promise<AccessToken> => {
      //     const { status, data: authData } = await axios.post(
      //       `https://id.twitch.tv/oauth2/token?${queryString.stringify({
      //         client_id: process.env.CLIENT_ID,
      //         client_secret: process.env.CLIENT_SECRET,
      //         code: process.env.CODE,
      //         grant_type: "authorization_code",
      //         redirect_uri: `http://localhost:4000`,
      //         // scope: SCOPES.join(" "),
      //       })}`
      //     );
      //     console.log("status:", status);
      //     console.log("authData:", authData);
      //     return authData;
      //   },
      // };

      // console.log("tokenData:", tokenData);

      // console.log("authProvider.currentScopes:", authProvider.currentScopes);
      // console.log("authProvider.tokenType:", authProvider.tokenType);

      // await authProvider.refresh();

      const authToken = await authProvider.getAccessToken();

      console.log("authToken:", authToken);

      // const apiClient = new ApiClient({ authProvider });

      // const user = await apiClient.users.getUserByName("curvyelephant");
      // console.log("Live:", (await apiClient.streams.getStreamByUserId(user?.id)).title);

      console.log("authProvider.currentScopes:", authProvider.currentScopes);
      console.log("authProvider.tokenType:", authProvider.tokenType);

      createChatClient(authProvider, pubsub);
      // createWebhooks(authProvider, app, pubsub);
    } catch (e) {
      console.error("Error:", e);
    }
  });
}

main();
