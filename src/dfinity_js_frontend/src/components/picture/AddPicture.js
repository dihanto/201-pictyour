import React, { useState } from "react";
import { addPicture } from "../../utils/picture";
import {
  Button,
  FloatingLabel,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "react-bootstrap";

export default function AddPicture({ setNewPicture }) {
  const [likeStr, setLikeStr] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [caption, setCaption] = useState("");

  const isFormFilled = likeStr && pictureUrl && caption;

  const [show, setShow] = useState(false);

  const like = parseInt(likeStr, 10);

  const picturePayload = {
    like,
    pictureUrl,
    caption,
  };

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleClick = () => {
    addPicture(picturePayload);
    setNewPicture();
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleShow}
        variant="secondary"
        className="btn btn-primary btn-md rounded-3 border border-info shadow-lg display-4 fw-bold text-body-emphasis"
      >
        Add Picture
      </Button>
      <Modal show={show} onHide={handleClose} centered className="text-center">
        <ModalHeader closeButton>
          <ModalTitle>New Picture</ModalTitle>
        </ModalHeader>
        <Form>
          <ModalBody
            className="rounded-2 border-info shadow-lg"
            style={{ backgroundColor: "#041059" }}
          >
            <FloatingLabel
              controlId="like"
              label="picture like"
              className="mb-3"
            >
              <Form.Control
                type="number"
                onChange={(e) => {
                  setLikeStr(e.target.value);
                }}
                placeholder="picture likes"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="pictureUrl"
              label="picture Url"
              className="mb-3"
            >
              <Form.Control
                type="text"
                onChange={(e) => {
                  setPictureUrl(e.target.value);
                }}
                placeholder="picture Url"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="caption"
              label="picture Caption"
              className="mb-3"
            >
              <Form.Control
                type="text"
                onChange={(e) => {
                  setCaption(e.target.value);
                }}
                placeholder="picture Caption"
              />
            </FloatingLabel>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="dark"
              disabled={!isFormFilled}
              onClick={handleClick}
            >
              Add Picture
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
}
