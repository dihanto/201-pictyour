import React, { useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { Card, CardBody, CardFooter, CardText } from "react-bootstrap";
import UpdatePicture from "./UpdatePicture";
import BuyPicture from "./BuyPicture";
import LikePicture from "./LikePicture";
import { getLikes } from "../../utils/picture";

const Picture = ({ picture, update, userId }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLikes = async () => {
    const likes = await getLikes();
    if (likes) {
      console.log(likes);
    }
  };

  useEffect(() => {
    handleLikes();
  }, []);

  const { id, caption, like, pictureUrl, seller, price, owned } = picture;
  console.log(typeof price);
  return (
    <Card style={{ width: "22rem", padding: "3px" }}>
      <div className="text-white">{Principal.from(seller).toText()}</div>
      <img src={pictureUrl} alt={id} style={{ maxHeight: "400px" }} />
      <CardBody>
        <CardText>
          <LikePicture pictureId={id} userId={userId} /> : {like} || price :{" "}
          {price.toString()}{" "}
        </CardText>
        <CardText>{caption}</CardText>
        <CardText>owned by : {owned}</CardText>
      </CardBody>
      <CardFooter>
        <UpdatePicture picture={picture} save={update} />
        <BuyPicture picture={picture} userId={userId} />
      </CardFooter>
    </Card>
  );
};

export default Picture;
