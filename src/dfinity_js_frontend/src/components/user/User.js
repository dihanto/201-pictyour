import React from "react";
import { Button, Form } from "react-bootstrap";

export default function User({ user, onHandleUserId }) {
  const handleClick = () => {
    onHandleUserId(user.id);
  };

  return (
    <Form>
      <Button onClick={handleClick}>{user.name}</Button>;
    </Form>
  );
}
