"use client";

import React from "react";
import { Form as AntdForm, type FormProps as AntdFormProps } from "antd";

export type FormProps<T> = AntdFormProps<T>;

export const Form = AntdForm;

export default Form;
