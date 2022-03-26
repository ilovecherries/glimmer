import type { RequestSearchParameter } from "./RequestSearchParameter";

export class RequestParameter {
  values: any;
  requests: Array<RequestSearchParameter>;

  constructor(values: any = {}, requests: Array<RequestSearchParameter> = []) {
    this.values = values;
    this.requests = requests;
  }
}
