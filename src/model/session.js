import { MongoModel, string, arrayOf, shape, object, bool } from 'phnq-lib';

class Session extends MongoModel {
  static schema = {
    active: bool,
    accountId: string.isRequired,
    subscriptions: arrayOf(shape({ type: string, data: object })),
  };

  static defaultValues = {
    active: false,
    subscriptions: [],
  };

  addSubscription(type, data = {}) {
    this.subscriptions = [...this.subscriptions.filter(s => s.type !== type), { type, data }];
  }

  removeSubscription(type) {
    this.subscriptions = this.subscriptions.filter(s => s.type !== type);
  }
}

export default Session;
