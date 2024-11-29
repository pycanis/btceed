import { ReactNode, useCallback, useEffect, useState } from "react";
import { usePopper } from "react-popper";

type Props = {
  children: ReactNode;
  triggerNode: ReactNode;
};

export const Popover = ({ triggerNode, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(triggerElement, popperElement, { placement: "left-start" });

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        popperElement &&
        !popperElement.contains(event.target as Node) &&
        triggerElement &&
        !triggerElement.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    },
    [popperElement, triggerElement]
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

      {isOpen && (
        <div ref={setPopperElement} className="w-fit" style={styles.popper} {...attributes.popper}>
          {children}
        </div>
      )}
    </>
  );
};
