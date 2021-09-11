import { ApiClient } from "@twurple/api";
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

const buildResponse = (user: string, message: string, msg: PrivateMessage) => {
  const emotes = [];
  let newMessage = "";

  for (const messagePart of msg.parseEmotes()) {
    // console.log(messagePart);
    if (messagePart.type === "emote") {
      const url = messagePart.displayInfo.getUrl({
        animationSettings: "default",
        backgroundType: "dark",
        size: "1.0",
      });
      emotes.push(url);
      newMessage += `<img src="${url}" alt="${messagePart.name}" style="margin: 0 2px;" />`;
    } else if (messagePart.type === "cheer")
      newMessage += `<img src="${messagePart.displayInfo.url}" alt="${messagePart.name}" style="margin-left: "4px"; margin-right: "4px";" />`;
    else newMessage += messagePart.text;
  }
  // const emotes = .map((message: ParsedMessagePart) => {
  // });

  return {
    emotes,
    message: newMessage,
    displayName: user,
  };
};

async function createChatClient(authProvider: AuthProvider, pubsub: PubSub) {
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
        _channel: string,
        user: string,
        raidInfo: ChatRaidInfo,
        _msg: UserNotice
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
        const response = buildResponse(user, message, msg);
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

              const soChannel = await apiClient.channels.getChannelInfo(user);

              await chatClient.say(
                channel,
                `Check out @${user.displayName}! ${
                  (await apiClient.streams.getStreamByUserName(user)) !== null
                    ? "They are currently streaming"
                    : "Their latest stream was"
                }: ${soChannel.title} - ${soChannel.gameName}`
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
          const response = buildResponse(user, message, msg);
          console.log("response:", response);
          pubsub.publish(CHAT_MESSAGE, { chat: response });
        }
      }
    );
  } catch (e) {
    console.error("Error:", e);
  }
}

export { createChatClient };
