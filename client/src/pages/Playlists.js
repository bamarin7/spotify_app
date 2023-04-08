import { useState, useEffect } from "react";
import axios from "axios";
import { catchErrors } from "../utils";
import { getCurrentUserPlaylist } from "../spotify";
import { SectionWrapper, PlaylistGrid, Loader } from '../components';

const Playlists = () => {
  const [playlistsData, setPlaylistsData] = useState(null);
  const [playlists, setPlaylists] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const userPlaylist = await getCurrentUserPlaylist();
      setPlaylistsData(userPlaylist.data);
    };

    catchErrors(fetchData());
  }, []);

  // Since originally we only get 20 playlists and we want all of them, we fetch them and we use functionaal update to update the playlists state var. This is to avoid creating an infite loop if we added it as a dependency for the hook.

  useEffect(() => {
    if (!playlistsData) {
      return;
    }

    console.log(playlistsData.next);
    
    const fetchMoreData = async () => {
      if (playlistsData.next) {
        const { data } = await axios.get(playlistsData.next);
        setPlaylistsData(data);
      }
    };

    setPlaylists(playlists => ([
      ...playlists ? playlists : [],
      ...playlistsData.items
    ]));

    catchErrors(fetchMoreData());
  }, [playlistsData]);

  return (
    <main>
      <SectionWrapper title="Playlists" breadcrumb="true" >
        {playlists && playlists ? (
          <PlaylistGrid playlists={playlists} />
        ) : (
          <Loader />
        )}
      </SectionWrapper>
    </main>
  )
}

export default Playlists;