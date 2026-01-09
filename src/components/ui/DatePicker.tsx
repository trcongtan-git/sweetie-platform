"use client";

import React from "react";
import { DatePicker as AntdDatePicker } from "antd";
import type { DatePickerProps as AntdDatePickerProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";

export interface DatePickerProps extends Omit<AntdDatePickerProps, "value" | "onChange"> {
  value?: Dayjs | string | null;
  onChange?: (date: Dayjs | null) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, ...props }) => {
  const dateValue = typeof value === "string" ? dayjs(value) : value;

  const handleChange = (date: Dayjs | null) => {
    onChange?.(date);
  };

  return <AntdDatePicker value={dateValue} onChange={handleChange} {...props} />;
};

export default DatePicker;
