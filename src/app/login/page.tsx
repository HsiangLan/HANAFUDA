
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Image 
              src="https://placehold.co/100x100.png" 
              alt="花札道場 Logo" 
              width={80} 
              height={80} 
              className="rounded-full"
              data-ai-hint="logo hanafuda" 
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">花札道場</CardTitle>
          <CardDescription className="text-muted-foreground">
            掌握花札的藝術。請登入以繼續。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            還沒有帳戶嗎？{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              立即註冊
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
