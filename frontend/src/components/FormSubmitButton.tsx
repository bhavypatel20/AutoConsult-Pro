"use client";

import { useFormStatus } from "react-dom";
import AutoLoader from "./AutoLoader";

interface FormSubmitButtonProps {
  label: string;
  pendingLabel?: string;
  style?: React.CSSProperties;
}

export default function FormSubmitButton({ label, pendingLabel = "Processing...", style }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
        style={style}
      >
        {pending ? pendingLabel : label}
      </button>
      {pending && <AutoLoader fullscreen={true} message={pendingLabel} />}
    </>
  );
}
