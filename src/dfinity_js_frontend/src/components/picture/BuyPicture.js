import React from "react";
import { buyPicture } from "../../utils/picture";
import { Button, ToastContainer } from "react-bootstrap";
import { toast } from "react-toastify";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";

export default function BuyPicture({ picture, userId }) {
  const handleClick = () => {
    if (!userId) {
      toast(
        <NotificationError text="add/choose an user first"></NotificationError>
      );
      return;
    }
    buyPicture(picture, userId);
    toast(
      <NotificationSuccess text="success buy picture"></NotificationSuccess>
    );
  };

  return (
    <>
      <Button onClick={handleClick} variant="secondary">
        Buy
      </Button>
    </>
  );
}
