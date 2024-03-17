import React from "react";
import { buyPicture } from "../../utils/picture";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

export default function BuyPicture({ picture, userId }) {
  const handleClick = () => {
    if (!userId) {
      toast(
        <NotificationError text="add/choose an user first"></NotificationError>
      );
      return;
    }
    buyPicture(picture, userId);
  };

  return (
    <>
      <Button onClick={handleClick} variant="secondary">
        Buy
      </Button>
    </>
  );
}
