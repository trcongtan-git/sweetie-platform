"use client";

import React from "react";
import { Input as AntdInput, InputProps as AntdInputProps } from "antd";

export type InputProps = AntdInputProps;
export type TextInputProps = AntdInputProps;

export const Input: React.FC<InputProps> = (props) => {
  return <AntdInput {...props} />;
};

export const TextInput: React.FC<TextInputProps> = (props) => {
  return <AntdInput {...props} />;
};

export const PasswordInput: React.FC<TextInputProps> = (props) => {
  return <AntdInput.Password {...props} />;
};

export default Input;
