import React, { useEffect, useState } from "react";
import { addUser, getUsers as getUserList } from "../../utils/picture";
import User from "./User";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Stack,
} from "react-bootstrap";
import AddUser from "./AddUser";
import { toast } from "react-toastify";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";

export default function Users({ onHandleUserId }) {
  const [users, setUsers] = useState([]);

  const getUsers = async () => {
    try {
      const res = await getUserList();
      if (res) {
        setUsers(res);
      }
    } catch (error) {
      console.log({ error });
    }
  };

  const createUser = async (data) => {
    try {
      const res = await addUser(data);
      if (res) {
        getUsers();
        toast(<NotificationSuccess text="user add successfully " />);
      }
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="failed to add user" />);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <>
      <Dropdown>
        <DropdownToggle variant="light" align="end" id="dropdown-user">
          User list
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem>
            <Stack direction="horizontal" gap={2}>
              {users.map((_user, index) => (
                <User
                  key={index}
                  user={_user}
                  onHandleUserId={onHandleUserId}
                />
              ))}
            </Stack>
          </DropdownItem>
          <DropdownItem>
            <AddUser save={createUser} />
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
