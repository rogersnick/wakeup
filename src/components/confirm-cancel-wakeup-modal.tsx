import { Button } from "@/components/ui/button";

export function ConfirmCancelWakeupModal({
  onConfirm,
  onDismiss,
}: {
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="mx-4 w-full max-w-sm border-2 border-foreground bg-background p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Confirm
        </p>
        <h2 className="mt-2 font-sans text-2xl font-extrabold tracking-tight text-foreground">
          Cancel this wake-up?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This call will be cancelled and won&apos;t ring. You can always
          schedule a new one.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="hover:bg-foreground hover:text-red-500"
            onClick={onConfirm}
          >
            Yes, cancel it
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onDismiss}>
            Keep it
          </Button>
        </div>
      </div>
    </div>
  );
}
