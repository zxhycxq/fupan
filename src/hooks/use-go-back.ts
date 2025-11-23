import { useNavigate } from "react-router-dom";

const useGoBack = () => {
  const navigate = useNavigate();

  const goBack = () => {
    try {
      // 安全地检查历史记录
      if (typeof window !== 'undefined' && window.history?.state && window.history.state.idx > 0) {
        navigate(-1); // 返回上一页
      } else {
        navigate("/"); // 如果没有历史记录，重定向到首页
      }
    } catch (error) {
      // 如果访问 window.history 失败，默认返回首页
      console.warn('访问历史记录时出错:', error);
      navigate("/");
    }
  };

  return goBack;
};

export default useGoBack;
