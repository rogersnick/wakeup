import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="bg-muted min-h-[calc(100vh-4rem)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-6 py-16">
        <div className="w-full rounded-lg bg-background p-6">
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        </div>
      </div>
    </main>
  );
}
