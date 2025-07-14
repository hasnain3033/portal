import { ReactNode } from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mb-6">
          {action.href ? (
            <a href={action.href}>
              <Button variant="default">
                {action.label}
              </Button>
            </a>
          ) : (
            <Button variant="default" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}