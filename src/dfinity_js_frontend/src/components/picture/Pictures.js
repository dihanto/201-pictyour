import React, { useCallback, useEffect, useState } from "react";
import {
  getPictures as getPicturesList,
  updatePicture,
} from "../../utils/picture";
import { toast } from "react-toastify";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";
import Loader from "../utils/Loader";
import Picture from "./Picture";
import AddPicture from "./AddPicture";
const Pictures = () => {
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewPicture, setIsNewPicture] = useState(false);

  const getPictures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPicturesList();
      if (res) {
        setPictures(res);
      }
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  });

  const handleNewPicture = () => {
    setIsNewPicture(!isNewPicture);
  };

  const update = async (data) => {
    try {
      setLoading(true);
      updatePicture(data).then((response) => {
        getPictures();
        toast(<NotificationSuccess text="Picture update successfully" />);
      });
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to update picture" />);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getPictures();
  }, [isNewPicture]);

  return (
    <div>
      {!loading ? (
        <>
          <div className="">
            <h1 className="text-2xl text-blue-300">Pictures</h1>
            <h2 className="right-0">Users</h2>
            <div className="m-3">
              <AddPicture setNewPicture={handleNewPicture} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {pictures.map((_picture, index) => (
                <Picture
                  key={index}
                  picture={{ ..._picture }}
                  update={update}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <Loader />
      )}
    </div>
  );
};

export default Pictures;
