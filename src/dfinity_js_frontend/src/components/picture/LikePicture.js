import React from "react";
import { likePicture } from "../../utils/picture";
import { toast } from "react-toastify";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";
import { Button } from "react-bootstrap";

export default function LikePicture({ pictureId, userId }) {
  const likePayload = {
    pictureId: pictureId,
    userId: userId,
  };

  const handleClick = async () => {
    if (!userId) {
      toast(<NotificationError text="add/choose user to like picture" />);
      return;
    }

    const resp = await likePicture(likePayload);
    if (resp.Ok) {
      toast(<NotificationSuccess text="like picture success" />);
    } else {
      toast(<NotificationError text="like picture failed" />);
    }
  };

  return (
    <>
      <Button onClick={handleClick}>like</Button>
    </>
  );
}
