import { ReactNode } from "react";
import { Card, CardContent } from "./card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className = "",
}: StatsCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
            
            {trend && (
              <div className="mt-2 flex items-center text-sm">
                <span
                  className={`font-medium ${
                    trend.isPositive ? "text-success" : "text-error"
                  }`}
                >
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
                <span className="ml-2 text-gray-500">from last month</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="ml-4 p-3 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 text-gray-600">{icon}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}