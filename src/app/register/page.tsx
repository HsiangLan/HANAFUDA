
import { RegisterForm } from '@/components/auth/register-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
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
          <CardTitle className="text-3xl font-bold text-primary">創建帳戶</CardTitle>
          <CardDescription className="text-muted-foreground">
            歡迎加入花札道場！請填寫以下資訊以註冊。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            已經有帳戶了嗎？{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              前往登入
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
