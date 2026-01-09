"use client";

import React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd/es/button";
import { LoadingOutlined } from "@ant-design/icons";

export interface ButtonProps extends AntButtonProps {
  // Giữ nguyên tất cả props của Ant Design Button
  children?: React.ReactNode;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  size?: "small" | "middle" | "large";
  shape?: "default" | "circle" | "round";
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  danger?: boolean;
  ghost?: boolean;
  htmlType?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;

  // Thêm một số props tiện ích
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = "default",
  size = "middle",
  shape = "default",
  disabled = false,
  loading = false,
  block = false,
  danger = false,
  ghost = false,
  htmlType = "button",
  icon,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  variant = "default",
  fullWidth = false,
  leftIcon,
  rightIcon,
  tooltip,
  className,
  style,
  ...restProps
}) => {
  // Xử lý variant để map với type của Ant Design
  const getButtonType = () => {
    if (type !== "default") return type;

    switch (variant) {
      case "primary":
        return "primary";
      case "secondary":
        return "default";
      case "success":
        return "primary";
      case "warning":
        return "primary";
      case "danger":
        return danger ? "primary" : "default";
      case "info":
        return "default";
      default:
        return "default";
    }
  };

  // Xử lý danger cho variant
  const getDanger = () => {
    if (danger) return true;
    return variant === "danger";
  };

  // Xử lý icon
  const getIcon = () => {
    if (loading) return <LoadingOutlined />;
    if (icon) return icon;
    if (leftIcon) return leftIcon;
    return undefined;
  };

  // Xử lý children với rightIcon
  const getChildren = () => {
    if (!children && !rightIcon) return undefined;

    if (rightIcon && children) {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {children}
          {rightIcon}
        </span>
      );
    }

    return children;
  };

  // Xử lý style
  const getButtonStyle = () => {
    const baseStyle: React.CSSProperties = {
      fontFamily: "Inter, sans-serif",
      fontWeight: 500,
      ...style,
    };

    // Full width
    if (fullWidth || block) {
      baseStyle.width = "100%";
    }

    // Variant-specific styles
    switch (variant) {
      case "success":
        if (type === "default") {
          baseStyle.color = "#52c41a";
          baseStyle.borderColor = "#52c41a";
        }
        break;
      case "warning":
        if (type === "default") {
          baseStyle.color = "#faad14";
          baseStyle.borderColor = "#faad14";
        }
        break;
      case "info":
        if (type === "default") {
          baseStyle.color = "#1890ff";
          baseStyle.borderColor = "#1890ff";
        }
        break;
    }

    return baseStyle;
  };

  // Xử lý className
  const getClassName = () => {
    const classes = ["kf-button"];

    if (variant !== "default") {
      classes.push(`kf-button-${variant}`);
    }

    if (fullWidth) {
      classes.push("kf-button-full-width");
    }

    if (className) {
      classes.push(className);
    }

    return classes.join(" ");
  };

  return (
    <AntButton
      type={getButtonType()}
      size={size}
      shape={shape}
      disabled={disabled}
      loading={loading}
      block={block}
      danger={getDanger()}
      ghost={ghost}
      htmlType={htmlType}
      icon={getIcon()}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className={getClassName()}
      style={getButtonStyle()}
      title={tooltip}
      {...restProps}
    >
      {getChildren()}
    </AntButton>
  );
};

// Export các variant buttons tiện ích
export const PrimaryButton: React.FC<Omit<ButtonProps, "type" | "variant">> = (
  props
) => <Button {...props} type="primary" />;

export const SecondaryButton: React.FC<
  Omit<ButtonProps, "type" | "variant">
> = (props) => <Button {...props} type="default" variant="secondary" />;

export const SuccessButton: React.FC<Omit<ButtonProps, "type" | "variant">> = (
  props
) => <Button {...props} variant="success" />;

export const WarningButton: React.FC<Omit<ButtonProps, "type" | "variant">> = (
  props
) => <Button {...props} variant="warning" />;

export const DangerButton: React.FC<Omit<ButtonProps, "type" | "variant">> = (
  props
) => <Button {...props} variant="danger" />;

export const InfoButton: React.FC<Omit<ButtonProps, "type" | "variant">> = (
  props
) => <Button {...props} variant="info" />;

export default Button;
