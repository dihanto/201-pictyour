import React from "react";
import { buyPicture } from "../../utils/picture";
import { Button } from "react-bootstrap";

export default function BuyPicture({ picture }) {
  const handleClick = () => {
    buyPicture(picture);
  };

  return (
    <>
      <Button onClick={handleClick} variant="secondary">
        Buy
      </Button>
    </>
  );
}
