import React, { useState } from "react";
import {
  Button,
  FloatingLabel,
  Form,
  FormControl,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "react-bootstrap";

export default function AddUser({ save }) {
  const [name, setName] = useState("");

  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleClick = () => {
    save(name);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleShow}
        variant="secondary"
        className="btn btn-primary btn-md rounded-3 border border-info shadow-lg display-4 fw-bold text-body-emphasis"
      >
        Add User
      </Button>
      <Modal show={show} onHide={handleClose} centered className="text-center">
        <ModalHeader closeButton>
          <ModalTitle>New User</ModalTitle>
        </ModalHeader>
        <Form>
          <ModalBody
            className="rounded-2 border-info shadow-lg"
            style={{ backgroundColor: "#041059" }}
          >
            <FloatingLabel controlId="name" label="name" className="mb-3">
              <FormControl
                type="text"
                onChange={(e) => {
                  setName(e.target.value);
                }}
                placeholder="name"
              />
            </FloatingLabel>
          </ModalBody>
          <ModalFooter>
            <button variant="dark" disabled={!name} onClick={handleClick}>
              Add
            </button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  );
}
