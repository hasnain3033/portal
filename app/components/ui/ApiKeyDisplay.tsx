import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "./button";

interface ApiKeyDisplayProps {
  apiKey: string;
  label?: string;
  prefix?: string;
  maskByDefault?: boolean;
}

export function ApiKeyDisplay({ 
  apiKey, 
  label = "API Key",
  prefix = "sk_",
  maskByDefault = true 
}: ApiKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(!maskByDefault);
  const [copied, setCopied] = useState(false);

  const maskedKey = `${prefix}${'•'.repeat(8)}...${apiKey.slice(-4)}`;
  const displayKey = isVisible ? apiKey : maskedKey;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        <div className="flex-1 font-mono text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 select-all">
          {displayKey}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsVisible(!isVisible)}
          title={isVisible ? "Hide API key" : "Show API key"}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}