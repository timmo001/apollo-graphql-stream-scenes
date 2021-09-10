import { useQuery, gql } from "@apollo/client";

function CurrentViewerCount() {
  const { data, error } = useQuery(
    gql`
      query Channel {
        channel {
          currentViewers
        }
      }
    `,
    {
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error(error);
  }

  return data?.channel?.currentViewers;
}

export default CurrentViewerCount;
