"use client";

import React from "react";
import { GoogleOutlined } from "@ant-design/icons";
import Button from "./Button";

type GoogleButtonProps = {
  onClick?: () => void;
};

export const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick }) => {
  return (
    <Button block onClick={onClick} icon={<GoogleOutlined />}>
      Đăng nhập với Google Workspace
    </Button>
  );
};

export default GoogleButton;
