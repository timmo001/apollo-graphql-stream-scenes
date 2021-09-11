import { ApiClient, HelixTag } from "@twurple/api";
import { AuthProvider } from "@twurple/auth";
import {
  ChatClient,
  PrivateMessage,
  ChatRaidInfo,
  UserNotice,
} from "@twurple/chat";
import { PubSub } from "graphql-subscriptions";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "apollographql",
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const CHAT_MESSAGE = "CHAT_MESSAGE";
const RAID = "RAID";
const SOUND_PLAYED = "SOUND_PLAYED";
const DISPLAY_MEME = "DISPLAY_MEME";
const COMMANDS_MAP = {
  "!bop": "playSound",
  "!horn": "playSound",
  "!meme": "generateMeme",
  "!shoutout": "shoutout",
  "!website": "https://timmo.dev",
  "!woosh": "playSound",
  "!zap": "playSound",
  // "--help": "Here are all the available commands: !uses, !schedule, !coc, !discord, !docs, !lp-project, !music, !playlist (alias)",
  // "!coc": "https://www.apollographql.com/docs/community/code-of-conduct/",
  // "!commands": "Here are all the available commands: !uses, !schedule, !coc, !discord, !docs, !lp-project, !music, !playlist (alias)",
  // "!discord": "https://go.apollo.dev/discord",
  // "!docs": "https://apollo.dev",
  // "!music": "https://open.spotify.com/playlist/4kAqBBEZQsBIXMIJl6u8tO?si=yTuT421KRbu05kcLIMWYWg",
  // "!playlist": "https://open.spotify.com/playlist/4kAqBBEZQsBIXMIJl6u8tO?si=yTuT421KRbu05kcLIMWYWg",
  // "!schedule": "https://go.apollo.dev/events-calendar",
};

const memeMap = {
  tothestars: "IMG_20200302_203929_1_encign.jpg",
  screamcat: "scream-cat_qxh9v9.jpg",
  groinshot: "ezgif-6-b472badd75c7_iteboa.gif",
  hacker: "EruVpaFXMAY2Xfz_hra4qe.jpg",
};

const sleep = (time: number) => new Promise((res) => setTimeout(res, time));

const buildResponse = (message: string, tags: Map<string, string>) => {
  let emotes = null;

  const emoteObj = tags["emotes"];

  if (emoteObj) {
    emotes = Object.keys(emoteObj).reduce((arr, emoteCode) => {
      const instances = emoteObj[emoteCode];

      const codesWithStartEnd = instances.map((instance: any) => {
        const [start, end] = instance.split("-");

        return [emoteCode, start, end];
      });

      return [...arr, ...codesWithStartEnd];
    }, []);
  }

  return {
    emotes,
    message,
    displayName: tags["display-name"],
  };
};

const createChatClient = async (authProvider: AuthProvider, pubsub: PubSub) => {
  try {
    console.log("Chat - Connect to", process.env.CHANNEL);
    const chatClient = new ChatClient({
      authProvider,
      channels: [process.env.CHANNEL],
    });
    await chatClient.connect();

    // client.on("raided", (_, username, viewers) => {
    //   pubsub.publish(RAID, { raid: { username, viewers } });
    // });
    chatClient.onRaid(
      (
        channel: string,
        user: string,
        raidInfo: ChatRaidInfo,
        msg: UserNotice
      ) => {
        pubsub.publish(RAID, {
          raid: { username: user, viewers: raidInfo.viewerCount },
        });
      }
    );

    chatClient.onMessage(
      async (
        channel: string,
        user: string,
        message: string,
        msg: PrivateMessage
      ) => {
        // console.log("New message:", { channel, user, message, msg });

        const response = buildResponse(message, msg.tags);
        // await chatClient.say(channel, message);
        pubsub.publish(CHAT_MESSAGE, { chat: response });

        if (message.match(/^(!|--)/)) {
          const [command] = message.split(" ");
          const commandResult = COMMANDS_MAP[command.toLowerCase()];

          if (!commandResult) {
            await chatClient.say(channel, "Invalid command");
            pubsub.publish(CHAT_MESSAGE, {
              chat: {
                message: "Invalid command",
                displayName: process.env.CHANNEL,
              },
            });
            return;
          }

          switch (commandResult) {
            case "generateMeme": {
              const [, template, ...text] = message.split(" ");
              const imageUrl = memeMap[template];

              if (!imageUrl) {
                await chatClient.say(
                  channel,
                  `Invalid meme template! Try these: ${Object.keys(
                    memeMap
                  ).join(", ")}`
                );
                break;
              }

              const meme = cloudinary.url(imageUrl, {
                transformation: [
                  {
                    crop: "scale",
                    width: 800,
                  },
                  {
                    gravity: "south",
                    color: "white",
                    y: 80,
                    width: 640,
                    crop: "fit",
                    overlay: {
                      font_family: "Impact",
                      font_size: 48,
                      text: text.join(" ").toUpperCase(),
                    },
                  },
                  {
                    gravity: "south_west",
                    color: "white",
                    y: 5,
                    x: 5,
                    overlay: {
                      font_family: "Arial",
                      font_size: 20,
                      text: "@ApolloGraphQL",
                    },
                  },
                ],
              });

              pubsub.publish(DISPLAY_MEME, { meme });
              break;
            }
            case "playSound":
              pubsub.publish(SOUND_PLAYED, {
                sound: message.replace("!", ""),
              });
              break;
            case "shoutout":
              const [, username, ..._] = message.split(" ");

              const apiClient = new ApiClient({ authProvider });
              const user = await apiClient.users.getUserByName(username);

              const stream = await user.getStream();

              await chatClient.say(
                channel,
                `Go follow @${user.displayName}!${
                  stream
                    ? ` They are currently playing: ${stream.gameName} - ${stream.title} (${(
                        await stream.getTags()
                      )
                        ?.map((tag): string => {
                          const name = tag.getName("en-us");
                          console.log("Tag:", tag, name);
                          return name;
                        })
                        .join(", ")})`
                    : ""
                }`
              );
              break;
            default:
              await chatClient.say(channel, commandResult);

              await sleep(500);
              pubsub.publish(CHAT_MESSAGE, {
                chat: {
                  message: commandResult,
                  displayName: "apollobot",
                },
              });
          }
        } else {
          const response = buildResponse(message, msg.tags);
          pubsub.publish(CHAT_MESSAGE, { chat: response });
        }
      }
    );
  } catch (e) {
    console.error("Error:", e);
  }
};

export { createChatClient };
