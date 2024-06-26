import { HttpRequest } from '@azure/functions';

export const azureFunctionGetHttpRequest = new HttpRequest({
  method: 'GET',
  url: 'http://localhost/?parameter1=value1&parameter2=value2',
  params: {
    parameter1: 'value1',
    parameter2: 'value2',
  },
  headers: {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'content-type': 'application/json',
  },
});

export const azureFunctionPostHttpRequest = new HttpRequest({
  method: 'POST',
  url: 'http://localhost/post',
  body: { string: '{"foo":"bar"}' },
  headers: {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'content-type': 'application/json',
  },
});
