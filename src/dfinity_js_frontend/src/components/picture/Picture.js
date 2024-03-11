import React from "react";
import { Principal } from "@dfinity/principal";
import { Card, CardBody, CardFooter, CardText } from "react-bootstrap";
import UpdatePicture from "./UpdatePicture";

const Picture = ({ picture, update }) => {
  const { id, caption, like, pictureUrl, seller } = picture;

  return (
    <Card style={{ width: "10rem", padding: "3px" }}>
      <div className="text-white">{Principal.from(seller).toText()}</div>
      <img src={pictureUrl} alt={id} style={{ maxHeight: "400px" }} />
      <CardBody>
        <CardText>like : {like}</CardText>
        <CardText>{caption}</CardText>
      </CardBody>
      <CardFooter>
        <UpdatePicture picture={picture} save={update} />
      </CardFooter>
    </Card>
  );
};

export default Picture;
