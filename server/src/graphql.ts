import { IResolvers } from "@graphql-tools/utils";
import { ApiClient } from "@twurple/api";
import { AuthProvider } from "@twurple/auth";
import { gql } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";
// import { format as formatWithTZ, utcToZonedTime } from "date-fns-tz";
// import { subHours, addHours, format } from "date-fns";
// import axios from "axios";

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
        streams: async (_: any, { limit = 5 }: any) => {
          // const today = new Date();
          // const URL = `https://www.googleapis.com/calendar/v3/calendars/${
          //   process.env.GOOGLE_CALENDAR_ID
          // }/events?key=${
          //   process.env.GOOGLE_API_KEY
          // }&orderBy=startTime&singleEvents=true&timeMin=${today.toISOString()}&maxResults=${limit}`;
          // try {
          //   const { data: events } = await axios.get(URL);
          //   const streamEvents = events.items.filter((event) => {
          //     if (
          //       event.summary.includes("Mission Briefing") ||
          //       event.summary.includes("Launch Pad") ||
          //       event.summary.includes("Orbit")
          //     ) {
          //       return true;
          //     }
          //     return false;
          //   });
          //   return streamEvents.map((event) => {
          //     return {
          //       id: event.id,
          //       title: event.summary.replace(/^.+:\s/, ""),
          //       description: event.description,
          //       startTime: formatWithTZ(
          //         utcToZonedTime(
          //           new Date(event.start.dateTime),
          //           "America/Los_Angeles"
          //         ),
          //         "ha zzz",
          //         { timeZone: "America/Los_Angeles" }
          //       ),
          //       date: format(new Date(event.start.dateTime), "MMM do"),
          //     };
          //   });
          // } catch (error) {
          //   console.error(error);
          //   return null;
          // }
          return null;
        },
        channel: async () => {
          try {
            console.log("Get user");
            const user = await this.apiClient.users.getUserByName(
              process.env.CHANNEL
            );

            console.log("Get channel info");
            const channel = await this.apiClient.channels.getChannelInfo(user);

            const data = {
              id: parseInt(channel.id, 10),
              title: channel.title,
              views: user.views,
              followers: (await user.getFollows()).total,
            };

            console.log("Channel info:", data);

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
          // const now = new Date();
          // const start = subHours(now, 2);
          // const end = addHours(now, 2);
          // const URL = `https://www.googleapis.com/calendar/v3/calendars/${
          //   process.env.GOOGLE_CALENDAR_ID
          // }/events?key=${
          //   process.env.GOOGLE_API_KEY
          // }&orderBy=startTime&singleEvents=true&timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&maxResults=1`;
          // try {
          //   const { data: events } = await axios.get(URL);
          //   const [event] = events.items;
          //   if (!event) {
          //     return null;
          //   }
          //   return {
          //     id: event.id,
          //     title: event.summary.replace(/^.+:\s/, ""),
          //     description: event.description,
          //     startTime: formatWithTZ(
          //       utcToZonedTime(
          //         new Date(event.start.dateTime),
          //         "America/Los_Angeles"
          //       ),
          //       "ha zzz",
          //       { timeZone: "America/Los_Angeles" }
          //     ),
          //     date: format(new Date(event.start.dateTime), "MMM do"),
          //   };
          // } catch (error) {
          //   console.error(error);
          //   return null;
          // }
          return null;
        },
        currentViewers: async ({ id }) => {
          // const {
          //   data: { stream },
          // } = await axios.get(`https://api.twitch.tv/v5/streams/${id}`, {
          //   headers: {
          //     authorization: `Bearer ${authData["access_token"]}`,
          //     "Client-ID": process.env.CLIENT_ID,
          //   },
          // });
          const stream = await this.apiClient.streams.getStreamByUserId(id);

          return stream ? stream.viewers : 0;
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
