
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
import Link from 'next/link';

const registerSchema = z.object({
  email: z.string().email({ message: '無效的電郵地址。' }),
  password: z.string().min(6, { message: '密碼至少需要6個字元。' }),
  confirmPassword: z.string().min(6, { message: '確認密碼至少需要6個字元。' }),
}).refine(data => data.password === data.confirmPassword, {
  message: '兩次輸入的密碼不一致。',
  path: ['confirmPassword'], // path of error
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    form.clearErrors();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      console.log('User registered:', userCredential.user);
      
      toast({
        title: '註冊成功',
        description: `帳戶 ${values.email} 已成功創建。請登入。`,
      });
      router.push('/login'); // Redirect to login page after successful registration
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = '註冊失敗，請稍後再試。';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = '此電郵地址已被註冊。';
            form.setError("email", { type: "manual", message: errorMessage });
            break;
          case 'auth/invalid-email':
            errorMessage = '無效的電郵地址格式。';
            form.setError("email", { type: "manual", message: errorMessage });
            break;
          case 'auth/weak-password':
            errorMessage = '密碼強度不足，請使用更強的密碼。';
            form.setError("password", { type: "manual", message: errorMessage });
            break;
          default:
            errorMessage = '註冊時發生未知錯誤。';
        }
      }
      toast({
        variant: 'destructive',
        title: '註冊失敗',
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>確認密碼</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "隱藏確認密碼" : "顯示確認密碼"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '註冊中...' : '註冊'}
        </Button>
      </form>
    </Form>
  );
}
