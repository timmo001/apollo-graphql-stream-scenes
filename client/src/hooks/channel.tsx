import { useQuery, gql } from "@apollo/client";

function Channel() {
  const { data, error } = useQuery(gql`
    query CurrentStream {
      channel {
        currentStream {
          id
          title
          streamers
        }
      }
    }
  `);

  if (error) {
    console.error(error);
  }

  return data?.channel;
}

export default Channel;
