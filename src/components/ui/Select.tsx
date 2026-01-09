"use client";

import React from "react";
import { Select as AntdSelect, SelectProps as AntdSelectProps } from "antd";

export type SelectProps = AntdSelectProps;

export const Select: React.FC<SelectProps> = (props) => {
  return <AntdSelect {...props} />;
};

export default Select;
