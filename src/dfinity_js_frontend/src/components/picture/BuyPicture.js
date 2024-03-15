import React from "react";
import { buyPicture } from "../../utils/picture";
import { Button } from "react-bootstrap";

export default function BuyPicture({ picture, userId }) {
  const handleClick = () => {
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
