import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-primary/10">
        <CardHeader className="text-center">
          <SettingsIcon className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">設定</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            管理您的帳戶及應用程式偏好設定。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-foreground">設定頁面正在建置中。</p>
          <p className="text-muted-foreground mt-2">
            您很快就能自訂您的體驗、管理通知等功能。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
