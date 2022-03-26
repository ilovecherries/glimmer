export class RequestSearchParameter {
  type: string;
  fields: string;
  query: string;
  order: string;
  limit: number;
  skip: number;
  name: undefined | string;

  constructor(
    type: string,
    fields = "*",
    query = "",
    order = "",
    limit = 1000,
    skip = 0,
    name: string | undefined = undefined
  ) {
    this.type = type;
    this.fields = fields;
    this.query = query;
    this.order = order;
    this.limit = limit;
    this.skip = skip;
    this.name = name;
  }
};
