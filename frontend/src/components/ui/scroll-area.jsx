import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

export function ScrollArea({ className, children }) {
  return (
    <ScrollAreaPrimitive.Root className={className}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="w-2 bg-gray-100">
        <ScrollAreaPrimitive.Thumb className="bg-gray-400 rounded" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}