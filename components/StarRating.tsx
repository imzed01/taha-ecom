"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  ratingCount?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  ratingCount = 0,
  onRatingChange,
  readonly = false,
  size = "md",
  showValue = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleMouseEnter = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const handleClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground ml-2">
          {rating.toFixed(1)} ({ratingCount}{" "}
          {ratingCount === 1 ? "rating" : "ratings"})
        </span>
      )}
    </div>
  );
}
