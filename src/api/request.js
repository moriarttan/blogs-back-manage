import axios from 'axios'
import { Message } from 'element-ui'
import { getToken, removeToken } from '@/utils/auth'
import router from 'vue-router'
import Qs from 'qs'

// 默认配置
axios.defaults.timeout = 10000
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'
axios.defaults.responseType = 'json'
// 配置请求地址公共部分
// axios.defaults.baseURL = process.env.VUE_APP_URL

// 请求拦截器
axios.interceptors.request.use(config => {
  if (getToken()) {
    config.headers.timestamp = 10000
    config.headers.Authorization = 'Bearer ' + getToken()
  }
  console.log('request ===============> ', config)
  return config
},
error => {
  return Promise.reject(error)
})

// 响应拦截器
axios.interceptors.response.use(
  response => {
    console.log('axios.interceptors.response ----> ', response)
    if (response.status === 200) {
      // return Promise.resolve(response)
      const { data, config } = response
      // 文件流：直接返回
      if (config.responseType === 'blob') {
        return data
      }
      if (data.code === 200) {
        return Promise.resolve(data)
      } else if (data.code === 401) {
        Message.error({
          message: data.message,
          onClose: () => {
            removeToken()
            router.push('/')
          }
        })
      } else {
        Message.error(data.message)
        return null
      }
    } else {
      return Promise.reject(response)
    }
  },
  // 服务器状态码不是200的情况
  error => {
    console.log('axios.interceptors.error ----> ', error)
    if (error.response.status) {
      switch (error.response.status) {
        // 401:未登录或token过期
        case 401:
          Message.error({
            message: '登录过期，请重新登录',
            onClose: () => {
              removeToken()
              router.push('/')
            }
          })
          break
        // 404请求不存在
        case 404:
          Message.error('网络请求不存在')
          break
        // 其他错误，直接抛出错误提示
        default:
          Message.error(error.response.data.message || '请求出错')
      }
    }
    return Promise.reject(error.response.data.message)
  }
)

/* 处理url请求：当https访问时，接口请求也使用https去请求
* */
function urlToHttps(url) {
  if (process.env.NODE_ENV === 'production' && window.location.href.indexOf('https') > -1) {
    return url.replace('http', 'https')
  }
  return url
}

export default {
  // get 请求
  get(url, data, responseType) {
    url = urlToHttps(url)
    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url,
        params: data,
        responseType: responseType || 'json'
      }).then(res => resolve(res)).catch(err => reject(err))
    })
  },
  // 默认json请求
  post(url, data, responseType) {
    url = urlToHttps(url)
    console.log(url)
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url,
        data,
        responseType: responseType || 'json'
      }).then(res => resolve(res)).catch(err => reject(err))
    })
  },
  // 表单请求
  xForm(url, data, responseType) {
    url = urlToHttps(url)
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url,
        data: Qs.stringify(data),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        responseType: responseType || 'json'
      }).then(res => resolve(res)).catch(err => reject(err))
    })
  },
  // formDate 请求
  formDate(url, data, responseType) {
    url = urlToHttps(url)
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url,
        data,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: responseType || 'json'
      }).then(res => resolve(res)).catch(err => reject(err))
    })
  }
}
