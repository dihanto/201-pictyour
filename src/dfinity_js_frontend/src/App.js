import React, { useCallback, useEffect, useState } from "react";
import { Container, Nav } from "react-bootstrap";
import "./App.css";
import Wallet from "./components/Wallet";
import coverImg from "./assets/img/pictyour.png";
import { login, logout as destroy } from "./utils/auth";
import Cover from "./components/utils/Cover";
import { Notification } from "./components/utils/Notifications";
import Pictures from "./components/picture/Pictures";
import Users from "./components/user/Users";
import { balance as principalBalance } from "./utils/ledger";
import { getPrincipalAddress } from "./utils/picture";

const App = function AppWrapper() {
  const isAuthenticated = window.auth.isAuthenticated;
  const principal = window.auth.principalText;

  const [balance, setBalance] = useState("0");
  const [userId, setUserId] = useState("");
  const [address, setAddress] = useState("");

  const handleUserId = (data) => {
    setUserId(data);
  };

  const getBalance = useCallback(async () => {
    if (isAuthenticated) {
      setBalance(await principalBalance());
      setAddress(await getPrincipalAddress());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    getBalance();
  }, [getBalance]);

  console.log(isAuthenticated);
  console.log(userId);

  return (
    <>
      <Notification />
      {isAuthenticated ? (
        <Container fluid="md">
          <Nav className="justify-content-end pt-3 pb-5">
            <Nav.Item>
              <Users onHandleUserId={handleUserId} />
              <Wallet
                principal={principal}
                balance={balance}
                symbol={"ICP"}
                isAuthenticated={isAuthenticated}
                destroy={destroy}
                address={address}
              />
            </Nav.Item>
          </Nav>
          <main>
            <Pictures userId={userId} />
          </main>
        </Container>
      ) : (
        <Cover name="PictYour" login={login} coverImg={coverImg} />
      )}
    </>
  );
};

export default App;
