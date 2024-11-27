import type { ReactNode } from "react";

type Props = {
  header: string;
  children: ReactNode;
  closable?: boolean;
  onClose?: () => void;
};

export const Modal = ({ header, children, closable = true, onClose }: Props) => {
  return (
    <>
      <div className="w-screen h-screen fixed top-0 left-0 bg-black opacity-30 z-10" />
      <dialog open className="max-w-96 w-full text-black bg-white p-4 rounded-lg fixed top-1/4 z-20">
        <div className="flex justify-between">
          <p className="text-lg font-bold mb-4">{header}</p>

          {closable && (
            <div className="cursor-pointer" onClick={onClose}>
              ✕
            </div>
          )}
        </div>

        {children}
      </dialog>
    </>
  );
};
