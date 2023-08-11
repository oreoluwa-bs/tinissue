import React from "react";
import { cn } from "~/lib/utils";

export interface FormErrorProps
  extends React.BaseHTMLAttributes<HTMLParagraphElement> {}

export const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, ...props }, ref) => {
    return (
      <p className={cn("mt-1 text-sm text-red-500", className)}>
        {props.children}
      </p>
    );
  },
);

FormError.displayName = "FormError";
