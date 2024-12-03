import { Placement } from "@popperjs/core";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";

type Props = {
  children: ReactNode;
  triggerNode: ReactNode;
  closeOnClickOutside?: boolean;
  placement?: Placement;
};

export const Popover = ({ triggerNode, children, closeOnClickOutside = true, placement }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(triggerElement, popperElement, {
    placement,
    modifiers: [{ name: "offset", options: { offset: [0, 5] } }],
  });

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        closeOnClickOutside &&
        popperElement &&
        !popperElement.contains(event.target as Node) &&
        triggerElement &&
        !triggerElement.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    },
    [popperElement, triggerElement, closeOnClickOutside]
  );

  const handleKeydown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("keydown", handleKeydown);
    } else {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeydown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, handleClickOutside, handleKeydown]);

  return (
    <>
      <div ref={setTriggerElement} onClick={() => setIsOpen((prev) => !prev)}>
        {triggerNode}
      </div>

      {isOpen &&
        createPortal(
          <div ref={setPopperElement} className="w-fit" style={styles.popper} {...attributes.popper}>
            {children}
          </div>,
          document.querySelector("#popover") as Element
        )}
    </>
  );
};
