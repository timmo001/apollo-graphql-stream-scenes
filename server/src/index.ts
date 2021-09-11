import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { ApolloServer } from "apollo-server-express";
import { config } from "dotenv";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { existsSync, promises as fs } from "fs";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { SubscriptionServer } from "subscriptions-transport-ws";
import express from "express";
import queryString from "query-string";

import { createChatClient } from "./chat";
import { createWebhooks } from "./webhooks";
import { typeDefs, GraphQL } from "./graphql";
import axios from "axios";
import open from "open";

config();

const PORT = 4000;

const SCOPES = ["chat:edit", "chat:read"];

async function main() {
  const app = express();
  const pubsub = new PubSub();

  const graphQL = new GraphQL(pubsub);

  const resolvers = await graphQL.createResolvers();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await server.start();

  server.applyMiddleware({ app });

  const ws = createServer(app);
  ws.listen(PORT, async () => {
    console.log(`Server is now running on http://localhost:${PORT}`);

    let tokenData = {
      accessToken: "",
      refreshToken: "",
      expiresIn: 0,
      obtainmentTimestamp: 0,
    };

    try {
      if (!existsSync("./tokens.json"))
        await fs.writeFile(
          "./tokens.json",
          JSON.stringify(tokenData, null, 4),
          {
            encoding: "utf8",
          }
        );
      tokenData = JSON.parse(
        await fs.readFile("./tokens.json", { encoding: "utf-8" })
      );

      if (!tokenData.refreshToken || tokenData.expiresIn === 0) {
        const authUrl = queryString.stringifyUrl(
          {
            url: "https://id.twitch.tv/oauth2/authorize",
            query: {
              client_id: process.env.CLIENT_ID,
              redirect_uri: `http://localhost:${PORT}/authorize`,
              response_type: "code",
              scope: SCOPES.join("+"),
            },
          },
          { encode: false }
        );
        console.log("Opening", authUrl);
        open(authUrl);

        const code = await new Promise<string>((resolve) => {
          app.get("/authorize", (req): void => {
            console.log("Authorization code:", req.query.code);
            resolve(req.query.code as string);
          });
        });

        const { status, data: authData } = await axios.post(
          `https://id.twitch.tv/oauth2/token?${queryString.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: `http://localhost:4000/authorize`,
          })}`
        );

        if (status !== 200) {
          console.error("Authentication error:", status, authData);
          return;
        }

        console.log("authData:", authData);

        tokenData = {
          ...authData,
          accessToken: authData.access_token,
          expiresIn: authData.expires_in,
          obtainmentTimestamp: Date.now(),
          refreshToken: authData.refresh_token,
        };

        await fs.writeFile(
          "./tokens.json",
          JSON.stringify(tokenData, null, 4),
          {
            encoding: "utf8",
          }
        );
      }

      const authProvider = new RefreshingAuthProvider(
        {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          onRefresh: async (token: AccessToken): Promise<void> => {
            console.log("New token:", token);
            await fs.writeFile(
              "./tokens.json",
              JSON.stringify(token, null, 4),
              {
                encoding: "utf-8",
              }
            );
          },
        },
        tokenData
      );

      await authProvider.getAccessToken();

      console.log("authProvider.currentScopes:", authProvider.currentScopes);
      console.log("authProvider.tokenType:", authProvider.tokenType);

      graphQL.setup(authProvider);

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
      createWebhooks(authProvider, app, pubsub);
    } catch (e) {
      console.error("Error:", e);
    }
  });
}

main();
