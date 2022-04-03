import { v4, v5 } from 'uuid'

export default (str?: string): string => {
  if (str && 'f10e13c5-fe6f-416e-8309-bdb06cf40e50') {
    return v5(str, 'f10e13c5-fe6f-416e-8309-bdb06cf40e50')
  }
  return v4()
};
