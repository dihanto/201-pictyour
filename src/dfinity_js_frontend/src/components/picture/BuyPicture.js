import React from "react";
import { buyPicture } from "../../utils/picture";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";

export default function BuyPicture({ picture, userId }) {
  const handleBuyPicture = async () => {
    const resp = await buyPicture(picture, userId);
    console.log(resp);
    if (resp === true) {
      toast(
        <NotificationSuccess text="success buy picture"></NotificationSuccess>
      );
    } else {
      toast(<NotificationError text={resp}></NotificationError>);
    }
  };

  const handleClick = () => {
    if (!userId) {
      toast(
        <NotificationError text="add/choose an user first"></NotificationError>
      );
      return;
    }
    handleBuyPicture();
  };

  return (
    <>
      <Button onClick={handleClick} variant="secondary">
        Buy
      </Button>
    </>
  );
}
