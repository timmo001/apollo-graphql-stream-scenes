import { useQuery, gql } from "@apollo/client";

function UpcomingStreams() {
  const { data, error } = useQuery(gql`
    query UpcomingStreams {
      streams {
        id
        title
        startTime
        date
      }
    }
  `);

  if (error) {
    console.error(error);
  }

  return data?.streams;
}

export default UpcomingStreams;
