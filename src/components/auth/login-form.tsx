
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase import
import { auth } from '@/lib/firebase'; // Firebase import

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: '無效的電郵地址。' }),
  password: z.string().min(6, { message: '密碼至少需要6個字元。' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    form.clearErrors(); // Clear previous errors
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      // console.log('User signed in:', userCredential.user); // 可以保留或移除此詳細日誌
      
      toast({
        title: '登入成功',
        description: `歡迎回來, ${userCredential.user.email || values.email}！`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = '登入失敗，請稍後再試。';
      let logAsCriticalError = true;

      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = '電郵地址或密碼錯誤。';
            form.setError("email", { type: "manual", message: " " }); // Add error to trigger field styling
            form.setError("password", { type: "manual", message: "電郵地址或密碼錯誤。" });
            logAsCriticalError = false; // This is a common user error, not a critical app error
            break;
          case 'auth/invalid-email':
            errorMessage = '無效的電郵地址格式。';
            form.setError("email", { type: "manual", message: errorMessage });
            logAsCriticalError = false;
            break;
          case 'auth/too-many-requests':
            errorMessage = '偵測到異常活動，您的帳戶已被暫時鎖定。請稍後再試。';
            // No specific field error, as it's a general account lock.
            logAsCriticalError = true; // Still log as error, server-side protection.
            break;
          default:
            // For unknown Firebase error codes, keep the generic message but log details
            errorMessage = `登入時發生未知錯誤。`;
            if (error.message) {
                 errorMessage = error.message; // Use Firebase's message if available
            }
            if (error.code) { // Append code if also available
                errorMessage += ` (代碼: ${error.code})`;
            }
        }
      } else {
        // If error.code is not available, but there's an error object with a message
        if (error.message) {
          errorMessage = error.message;
        }
      }

      if (logAsCriticalError) {
        console.error('Login error:', error);
      } else {
        // For common user errors, log a more informational message
        console.log(`Login attempt failed for ${values.email}: ${error.code || 'Invalid credentials'}`);
      }

      toast({
        variant: 'destructive',
        title: '登入失敗',
        description: errorMessage,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電郵地址</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密碼</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '登入中...' : '登入'}
        </Button>
      </form>
    </Form>
  );
}
