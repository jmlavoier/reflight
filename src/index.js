import axios from 'axios';

export const createUrl = (endpoint, pathParams) => {
  const urlPaths = endpoint.split('/');
  const pathParamKeys = Object.keys(pathParams);

  const url = urlPaths.map((urlPath) => {
    let newPath = urlPath;

    if (typeof urlPath === 'string' && urlPath[0] === ':') {
      const urlKey = urlPath.replace(':', '');

      pathParamKeys.forEach((paramKey) => {
        newPath = (paramKey === urlKey) ? pathParams[paramKey] : newPath;
      });
    }

    return newPath;
  }).join('/');

  return url;
};

export class ApiRequestsCreator {
  constructor(apiName, parameters) {
    this.api = parameters[apiName];

    this.mapActionsToRequests();
  }

  getRequests() {
    return this.requests;
  }

  mapActionsToRequests() {
    const { actions } = this.api;
    const actionsKeys = Object.keys(actions);

    this.requests = actionsKeys.reduce((
      accumulatorActions,
      currentRequestName,
    ) => ({
      ...accumulatorActions,
      [currentRequestName]: this.createRequest(currentRequestName),
    }), {});
  }

  mockRequest = (mock, time) => new Promise((response) => {
    setTimeout(() => {
      response(mock);
    }, time);
  });

  createRequest(actionName) {
    const { actions } = this.api;
    const { endpoint, method, mock } = actions[actionName];
    const { host, headers, type } = this.api;

    return async (pathParams, data = {}, otherProps = {}) => {
      try {
        let dataKey = 'params';
        let postParams = {};

        if (mock) {
          const mockResponse = await this.mockRequest(mock, 1000);
          return JSON.parse(mockResponse);
        }

        if (typeof method === 'string' && method.toLowerCase() === 'post') {
          dataKey = 'data';
          postParams = {
            transformRequest: [dataToTransform => JSON.stringify(dataToTransform)],
          };
        }

        const otherConfigs = {
          [dataKey]: data,
          ...postParams,
          ...otherProps,
        };

        const url = `${host}${createUrl(endpoint, pathParams)}`;
        const axiosObj = {
          method,
          type,
          url,
          headers,
          ...otherConfigs,
        };

        const response = await axios(axiosObj);
        return response;
      } catch (err) {
        throw err;
      }
    };
  }
}

export const apiCreator = (parameters) => {
  const apiKeys = Object.keys(parameters);

  const api = apiKeys.reduce((accumulatorApi, currentApiName) => {
    const apiRequests = new ApiRequestsCreator(currentApiName, parameters);

    return {
      ...accumulatorApi,
      [currentApiName]: apiRequests.getRequests(),
    };
  }, {});

  return api;
};

export default apiCreator;