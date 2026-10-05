import React from "react";
import { Button } from "@/presentation/components/ui/Button";

interface Props {
  title: string;
  className?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const CustomButton = ({ title, className = "", ...props }: Props) => {
  return <Button title={title} className={className} {...props} />;
};

export default CustomButton;
