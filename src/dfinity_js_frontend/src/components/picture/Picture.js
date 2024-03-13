import React from "react";
import { Principal } from "@dfinity/principal";
import { Card, CardBody, CardFooter, CardText } from "react-bootstrap";
import UpdatePicture from "./UpdatePicture";
import BuyPicture from "./BuyPicture";

const Picture = ({ picture, update }) => {
  const { id, caption, like, pictureUrl, seller, price } = picture;
  console.log(typeof price);
  return (
    <Card style={{ width: "22rem", padding: "3px" }}>
      <div className="text-white">{Principal.from(seller).toText()}</div>
      <img src={pictureUrl} alt={id} style={{ maxHeight: "400px" }} />
      <CardBody>
        <CardText>
          like : {like} || price : {price.toString()}{" "}
        </CardText>
        <CardText>{caption}</CardText>
      </CardBody>
      <CardFooter>
        <UpdatePicture picture={picture} save={update} />
        <BuyPicture picture={picture} />
      </CardFooter>
    </Card>
  );
};

export default Picture;
