import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFoundPage({ code = "404", title = "Page not found", body }: {
  code?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="font-display text-7xl font-semibold text-brand">{code}</span>
      <h1 className="mt-4 font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-muted">
        {body ?? "The page you're looking for doesn't exist or has moved."}
      </p>
      <Link to="/" className="mt-7">
        <Button variant="outline">Back home</Button>
      </Link>
    </div>
  );
}
