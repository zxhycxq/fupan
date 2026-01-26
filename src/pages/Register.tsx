import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card, Checkbox, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { checkUsernameAvailability, updateUsername } from '@/db/api';

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
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [usernameMessage, setUsernameMessage] = useState('');
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
     * 实时检查用户名可用性
     */
    useEffect(() => {
        if (!username) {
            setUsernameStatus('idle');
            setUsernameMessage('');
            return;
        }

        // 检查格式
        if (!validateUsername(username)) {
            setUsernameStatus('invalid');
            setUsernameMessage('❌ 用户名只能包含字母、数字和下划线，长度3-20位');
            return;
        }

        // 延迟检查，避免频繁请求
        const timer = setTimeout(async () => {
            setUsernameStatus('checking');
            setUsernameMessage('⏳ 检查中...');

            try {
                const result = await checkUsernameAvailability(username);

                if (result.available) {
                    setUsernameStatus('valid');
                    setUsernameMessage('✅ 该用户名可用');
                } else {
                    setUsernameStatus('invalid');
                    setUsernameMessage(`❌ ${result.message || '用户名不可用'}`);
                }
            } catch (error: any) {
                setUsernameStatus('invalid');
                setUsernameMessage('❌ 检查失败，请稍后重试');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    /**
     * 发送验证码
     */
    const handleSendOtp = async () => {
        if (!validatePhone(phone)) {
            message.error('请输入正确的手机号');
            return;
        }

        if (!agreedToTerms) {
            message.warning('请先同意用户条款和隐私协议');
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

        if (usernameStatus !== 'valid') {
            message.error('请输入有效的用户名');
            return;
        }

        setLoading(true);
        try {
            await updateUsername(username);
            message.success('注册成功');
            navigate('/dashboard');
        } catch (error: any) {
            if (error.message?.includes('duplicate') || error.message?.includes('已存在')) {
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
        navigate('/dashboard');
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
            <Card
                className="w-full max-w-md"
                title={
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">注册</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {step === 'phone' && '输入手机号获取验证码'}
                            {step === 'otp' && '输入收到的验证码'}
                            {step === 'username' && '设置用户名（可选）'}
                        </p>
                    </div>
                }
            >
                <div className="space-y-4">
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
                                    size="large"
                                />
                            </div>

                            {/* 条款勾选框 */}
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                >
                  <span className="text-sm text-muted-foreground">
                    我已阅读并同意{' '}
                      <a
                          href="https://www.kaogongfupanji.com/help/docs/law/user-agreement/"
                          target="_blank"
                          title={"考公复盘记-用户条款"}
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                      >
                      用户条款
                    </a>
                      {' '}和{' '}
                      <a
                          href="https://www.kaogongfupanji.com/help/docs/law/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={"考公复盘记-隐私协议"}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                      >
                      隐私协议
                    </a>
                  </span>
                                </Checkbox>
                            </div>

                            {/* 提示文案 */}
                            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                                💡 提示：未注册的手机号将自动创建账户
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleSendOtp}
                                disabled={loading || !phone || !agreedToTerms}
                                loading={loading}
                            >
                                获取验证码
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
                                    size="large"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="large"
                                    className="flex-1"
                                    onClick={handleBack}
                                    disabled={loading}
                                >
                                    返回
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    className="flex-1"
                                    onClick={handleVerifyOtp}
                                    disabled={loading || !otp}
                                    loading={loading}
                                >
                                    下一步
                                </Button>
                            </div>
                            <div className="text-center">
                                <Button
                                    type="link"
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
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="字母、数字、下划线，3-20位"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
                                        maxLength={20}
                                        size="large"
                                        status={
                                            usernameStatus === 'valid' ? 'success' :
                                                usernameStatus === 'invalid' ? 'error' : undefined
                                        }
                                        suffix={
                                            usernameStatus === 'checking' ? <LoadingOutlined className="text-blue-500" /> :
                                                usernameStatus === 'valid' ? <CheckCircleOutlined className="text-green-500" /> :
                                                    usernameStatus === 'invalid' ? <CloseCircleOutlined className="text-red-500" /> : null
                                        }
                                    />
                                </div>
                                {usernameMessage && (
                                    <p className={`text-xs ${
                                        usernameStatus === 'valid' ? 'text-green-600' :
                                            usernameStatus === 'invalid' ? 'text-red-600' :
                                                'text-muted-foreground'
                                    }`}>
                                        {usernameMessage}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="large"
                                    className="flex-1"
                                    onClick={handleSkip}
                                    disabled={loading}
                                >
                                    跳过
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    className="flex-1"
                                    onClick={handleSetUsername}
                                    disabled={loading || !username || usernameStatus !== 'valid'}
                                    loading={loading}
                                >
                                    完成
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
                </div>
            </Card>
        </div>
    );
}
