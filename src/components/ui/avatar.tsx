import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

/**
 * 🪩 Advanced Avatar Component
 * - Supports hover glow
 * - Optional status ring (online / offline)
 * - Smooth transition and glassy gradient
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    status?: "online" | "offline" | "none";
  }
>(({ className, status = "none", ...props }, ref) => (
  <div className="relative group">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#1b1b27] via-[#151525] to-[#0f0f18] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-purple-600/30 backdrop-blur-md",
        className
      )}
      {...props}
    />

    {/* Status ring (optional) */}
    {status !== "none" && (
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-[#0d0d15] transition-all",
          status === "online" && "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]",
          status === "offline" && "bg-gray-500 shadow-[0_0_6px_rgba(107,114,128,0.6)]"
        )}
      />
    )}
  </div>
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn(
      "aspect-square h-full w-full object-cover rounded-full transition-all duration-300 group-hover:brightness-110",
      className
    )}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-purple-600/30 to-purple-800/40 text-sm font-semibold text-white/80 backdrop-blur-md animate-pulse",
      className
    )}
    {...props}
  >
    {children || "?"}
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
