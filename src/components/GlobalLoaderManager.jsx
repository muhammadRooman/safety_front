import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useLoader } from "./LoaderContext";
import PublicApi from "../config/PublicApi";
import TokenApi from "../config/TokenApi";

const apis = [axios, PublicApi, TokenApi];

const GlobalLoaderManager = () => {
  const location = useLocation();
  const { setLoading, incrementRequests, decrementRequests } = useLoader();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading]);

  useEffect(() => {
    const interceptorIds = apis.map((api) => {
      const requestId = api.interceptors.request.use(
        (config) => {
          if (config?.showGlobalLoader === false) return config;
          config.__globalLoaderTracked = true;
          incrementRequests();
          return config;
        },
        (error) => Promise.reject(error)
      );

      const responseId = api.interceptors.response.use(
        (response) => {
          if (response?.config?.__globalLoaderTracked) {
            decrementRequests();
          }
          return response;
        },
        (error) => {
          if (error?.config?.__globalLoaderTracked) {
            decrementRequests();
          }
          return Promise.reject(error);
        }
      );

      return { api, requestId, responseId };
    });

    return () => {
      interceptorIds.forEach(({ api, requestId, responseId }) => {
        api.interceptors.request.eject(requestId);
        api.interceptors.response.eject(responseId);
      });
    };
  }, [incrementRequests, decrementRequests]);

  return null;
};

export default GlobalLoaderManager;
