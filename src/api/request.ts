import { message } from 'antd';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

// Create axios instance
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Use env variable or default
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from local storage or state management
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    // You can customize the response checking logic here
    // For example, if your API returns a custom code for errors:
    // if (res.code !== 200) {
    //   message.error(res.message || 'Error');
    //   return Promise.reject(new Error(res.message || 'Error'));
    // }
    return res;
  },
  (error) => {
    console.error('Request Error:', error);
    const msg = error.response?.data?.message || error.message || 'Request Failed';
    message.error(msg);
    return Promise.reject(error);
  }
);

// Generic request wrapper to ensure type safety
export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return service.request<any, T>(config);
};

export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return service.get<any, T>(url, config);
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return service.post<any, T>(url, data, config);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return service.put<any, T>(url, data, config);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return service.delete<any, T>(url, config);
};

export default service;
