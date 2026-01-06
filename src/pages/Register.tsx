import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { message } from 'antd';

/**
 * 注册页面
 */
export default function Register() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'username'>('phone');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { signInWithPhone, verifyOtp, updateProfile } = useAuth();
  const navigate = useNavigate();

  /**
   * 验证手机号格式
   */
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  /**
   * 验证用户名格式（只允许字母、数字、下划线）
   */
  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  /**
   * 发送验证码
   */
  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      message.error('请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      await signInWithPhone(`+86${phone}`);
      message.success('验证码已发送');
      setStep('otp');
      
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      message.error(error.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 验证验证码
   */
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(`+86${phone}`, otp);
      message.success('验证成功');
      setStep('username');
    } catch (error: any) {
      message.error(error.message || '验证码错误');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 设置用户名并完成注册
   */
  const handleSetUsername = async () => {
    if (!username) {
      message.error('请输入用户名');
      return;
    }

    if (!validateUsername(username)) {
      message.error('用户名只能包含字母、数字、下划线，长度3-20位');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ username });
      message.success('注册成功');
      navigate('/');
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        message.error('用户名已被使用');
      } else {
        message.error(error.message || '设置用户名失败');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 跳过设置用户名
   */
  const handleSkip = () => {
    navigate('/');
  };

  /**
   * 返回上一步
   */
  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
    } else if (step === 'username') {
      setStep('otp');
      setUsername('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">
            {step === 'phone' && '输入手机号获取验证码'}
            {step === 'otp' && '输入收到的验证码'}
            {step === 'username' && '设置用户名（可选）'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendOtp}
                disabled={loading || !phone}
              >
                {loading ? '发送中...' : '获取验证码'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">验证码</label>
                <Input
                  type="text"
                  placeholder="请输入6位验证码"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={loading}
                >
                  返回
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerifyOtp}
                  disabled={loading || !otp}
                >
                  {loading ? '验证中...' : '下一步'}
                </Button>
              </div>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-sm"
                >
                  {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送验证码'}
                </Button>
              </div>
            </>
          )}

          {step === 'username' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">用户名</label>
                <Input
                  type="text"
                  placeholder="字母、数字、下划线，3-20位"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  用户名只能包含字母、数字、下划线
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  跳过
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSetUsername}
                  disabled={loading || !username}
                >
                  {loading ? '设置中...' : '完成'}
                </Button>
              </div>
            </>
          )}

          <div className="text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <Link to="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
