import React, { useState } from "react";
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

export default function AddPicture({ save }) {
  const [priceStr, setPriceStr] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [caption, setCaption] = useState("");

  const isFormFilled = priceStr && pictureUrl && caption;

  const [show, setShow] = useState(false);

  const price = parseInt(priceStr, 10);

  const picturePayload = {
    price,
    pictureUrl,
    caption,
  };

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleClick = () => {
    save(picturePayload);
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
              controlId="price"
              label="picture price"
              className="mb-3"
            >
              <Form.Control
                type="number"
                onChange={(e) => {
                  setPriceStr(e.target.value);
                }}
                placeholder="picture price"
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
