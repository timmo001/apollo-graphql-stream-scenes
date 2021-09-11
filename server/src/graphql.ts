import { IResolvers } from "@graphql-tools/utils";
import { ApiClient } from "@twurple/api";
import { AuthProvider } from "@twurple/auth";
import { gql } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";
import { format as formatWithTZ, utcToZonedTime } from "date-fns-tz";
import { subHours, addHours, format } from "date-fns";

const FOLLOW = "FOLLOW";
const SUBSCRIBE = "SUBSCRIBE";
const CHAT_MESSAGE = "CHAT_MESSAGE";
const RAID = "RAID";
const SOUND_PLAYED = "SOUND_PLAYED";
const DISPLAY_MEME = "DISPLAY_MEME";

export const typeDefs = gql`
  type Query {
    channel: Channel!
    streams(limit: Int): [Stream!]!
  }

  type Channel {
    id: ID!
    title: String!
    category: String!
    views: Int!
    followers: Int!
    currentStream: Stream
    currentViewers: Int!
  }

  type Stream {
    id: ID!
    title: String!
    description: String!
    date: String!
    startTime: String!
    streamers: [String!]!
  }

  type ChatMessage {
    displayName: String!
    message: String!
    emotes: [[String!]!]
  }

  type RaidMessage {
    userName: String!
    viewers: Int!
  }

  type SubscriptionMessage {
    isGift: Boolean!
    userName: String!
    gifterName: String
  }

  type Subscription {
    chat: ChatMessage!
    follow: String!
    sub: SubscriptionMessage!
    raid: RaidMessage!
    sound: String!
    meme: String!
  }
`;

export class GraphQL {
  private apiClient: ApiClient;
  private pubsub: PubSub;

  constructor(pubsub: PubSub) {
    this.pubsub = pubsub;
  }

  public async setup(authProvider: AuthProvider) {
    this.apiClient = new ApiClient({ authProvider });
  }

  async createResolvers(): Promise<IResolvers | Array<IResolvers>> {
    return {
      Query: {
        // streams: async (_: any, { limit = 5 }: any) => {
        //   return null;
        // },
        channel: async () => {
          try {
            console.log("Get channel data");
            const user = await this.apiClient.users.getUserByName(
              process.env.CHANNEL
            );
            const channel = await this.apiClient.channels.getChannelInfo(user);
            const stream = await this.apiClient.streams.getStreamByUserName(
              user
            );

            const data = {
              id: parseInt(channel.id, 10),
              title: channel.title,
              views: user.views,
              followers: (await user.getFollows()).total,
              currentStream: {
                id: parseInt(channel.id, 10),
                title: channel.title,
                startTime: stream
                  ? formatWithTZ(
                      utcToZonedTime(stream.startDate, "Europe/London"),
                      "ha zzz",
                      { timeZone: "Europe/London" }
                    )
                  : null,
                date: stream ? format(stream.startDate, "MMM do") : null,
              },
            };

            console.log("Channel data:", data);

            return data;
          } catch (e) {
            console.error("Error getting channel data:", e);
          }
        },
      },
      Subscription: {
        meme: {
          subscribe: () => this.pubsub.asyncIterator([DISPLAY_MEME]),
        },
        chat: {
          subscribe: () => this.pubsub.asyncIterator([CHAT_MESSAGE]),
        },
        follow: {
          subscribe: () => this.pubsub.asyncIterator([FOLLOW]),
        },
        sub: {
          subscribe: () => this.pubsub.asyncIterator([SUBSCRIBE]),
        },
        raid: {
          subscribe: () => this.pubsub.asyncIterator([RAID]),
        },
        sound: {
          subscribe: () => this.pubsub.asyncIterator([SOUND_PLAYED]),
        },
      },
      Channel: {
        currentStream: async () => {
          console.log("Get current stream data");

          try {
            const user = await this.apiClient.users.getUserByName(
              process.env.CHANNEL
            );
            const channel = await this.apiClient.channels.getChannelInfo(user);
            const stream = await this.apiClient.streams.getStreamByUserName(
              user
            );

            const data = {
              id: parseInt(channel.id, 10),
              title: channel.title,
              startTime: stream
                ? formatWithTZ(
                    utcToZonedTime(stream.startDate, "Europe/London"),
                    "ha zzz",
                    { timeZone: "Europe/London" }
                  )
                : null,
              date: stream ? format(stream.startDate, "MMM do") : null,
            };

            console.log("Current stream:", data);

            return data;
          } catch (e) {
            console.error("Error getting current stream data:", e);
            return null;
          }
        },
        currentViewers: async ({ id }) => {
          console.log("Get current viewers data");

          const stream = await this.apiClient.streams.getStreamByUserName(
            process.env.CHANNEL
          );

          const data = stream ? stream.viewers : 0;

          console.log("Current viewers:", data);

          return data;
        },
      },
      Stream: {
        streamers: async ({ description }) => {
          return description.match(/@\w+/gm);
        },
      },
    };
  }
}
