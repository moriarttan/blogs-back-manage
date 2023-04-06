import url from '@/api/url'
import request from '../request'

const user = {
  login: (params) => request.post(`${url.base}/v1/back/user/login`)
}
export default user
