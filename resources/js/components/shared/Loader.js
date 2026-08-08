import { useEffect } from 'react';
import { message } from 'antd';
import { useLoadingStore } from "../../states/loadingState";

export const useLoader = () => {
  const { isLoading, loadingMessage } = useLoadingStore();

  useEffect(() => {
    let hideMessage;
    
    if (isLoading) {
      hideMessage = message.loading(loadingMessage, 0);
    }

    return () => {
      if (hideMessage) {
        hideMessage();
      }
    };
  }, [isLoading, loadingMessage]);
};