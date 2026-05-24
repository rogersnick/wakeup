import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="bg-muted min-h-[calc(100vh-4rem)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-6 py-16">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </main>
  );
}
