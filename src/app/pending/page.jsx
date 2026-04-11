import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from "@/components/layout/Navbar";

export default function PendingPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100 text-center">
        <div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Account Not Linked
          </h2>
          <p className="mt-4 text-sm text-gray-600">
            Your Google account has not yet been linked to an official employee profile in our system.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Please contact the Administrator to verify your employment and link your account.
          </p>
        </div>
        <div className="mt-8">
          <Link href="/login">
            <Button className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
