const { concat, difference, filter, flatMap, has, isArray, isEqual, isNumber, isObject, now, random, sampleSize, sortBy, shuffle } = require('lodash');
const uuid = require('uuid');

class Captcha {
  constructor() {
    this.captcha = {};
    this.options = {
      dataset: null,
      expires: 1000 * 60,
      solveIn: 1000 * 30,
    };
  }

  consume(id) {
    if (has(this.captcha, id) === false) {
      throw `Captcha with id '${id}' was not found`;
    }

    if (this.captcha[id].solvedAt === null) {
      return false;
    }

    if (this.captcha[id].solvedAt + this.options.expires <= now()) {
      return false;
    }

    delete this.captcha[id];
    return true;
  }

  generate() {
    const id = uuid.v4();

    if (has(this.captcha, id)) {
      return this.generate();
    }

    this.captcha[id] = {
      answer: null,
      category: null,
      data: null,
      example: null,
      generatedAt: null,
      id,
      solvedAt: null,
    };

    return this.regenerate(id);
  }

  regenerate(id) {
    if (has(this.captcha, id) === false) {
      throw `Captcha with id '${id}' was not found`;
    }

    if (this.options.dataset === null) {
      throw "Cannot generate captchas without a dataset";
    }

    const index = random(this.options.dataset.length - 1);
    const group = this.options.dataset[index];
    
    this.captcha[id].answer = sampleSize(group.data, random(2, 6));
    this.captcha[id].answer = sortBy(this.captcha[id].answer);

    const example = difference(group.data, this.captcha[id].answer);
    this.captcha[id].example = sampleSize(example, 3);

    let data = filter(this.options.dataset, (_, jindex) => jindex !== index);
    data = flatMap(data, (group) => group.data);
  
    this.captcha[id].data = sampleSize(data, 9 - this.captcha[id].answer.length);
    this.captcha[id].data = concat(this.captcha[id].data, this.captcha[id].answer);
    this.captcha[id].data = shuffle(this.captcha[id].data);

    this.captcha[id].category = group.category;
    this.captcha[id].generatedAt = now();
  
    this.captcha[id].solvedAt = null;
    return this.captcha[id];
  }

  revoke(id) {
    if (has(this.captcha, id) === false) {
      throw `Captcha with id '${id}' was not found`;
    }

    this.captcha[id].generatedAt = 0;
  }

  setOptions(options) {
    if (isObject(options) === false) {
      throw `Invalid argument 'options' (expected: object | found: ${typeof(options)})`;
    }

    if (has(options, 'dataset')) {
      if (isArray(options.dataset) === false) {
        throw `Invalid argument 'options.dataset' (expected: array | found: ${typeof(options.dataset)})`;
      }

      if (options.dataset.length < 2) {
        throw "Dataset should have at least 2 items";
      }
  
      for (const [index, item] of options.dataset.entries()) {
        if (isObject(item) === false) {
          throw `Invalid argument 'options.dataset[${index}]' (expected: object | found: ${typeof(item)})`;
        }

        if (has(item, 'category') === false) {
          throw `Invalid argument 'options.dataset[${index}].category' (expected: string | found: ${typeof(item.category)})`;
        }

        if (has(item, 'data') === false) {
          throw `Invalid argument 'options.dataset[${index}].data' (expected: array | found: ${typeof(item.data)})`;
        }

        if (item.data.length < 9) {
          throw `Dataset item options.dataset[${index}].data should have at least 9 items`;
        }
      }

      this.options.dataset = options.dataset;
    }

    if (has(options, 'expires')) {
      if (isNumber(options.expires) === false) {
        throw `Invalid argument 'options.expires' (expected: number | found: ${typeof(options.expires)})`;
      }

      this.options.expires = options.expires;
    }

    if (has(options, 'solveIn')) {
      if (isNumber(options.solveIn) === false) {
        throw `Invalid argument 'options.solveIn' (expected: number | found: ${typeof(options.solveIn)})`;
      }

      this.options.solveIn = options.solveIn;
    }
  }

  solve(id, answer) {
    if (has(this.captcha, id) === false) {
      throw `Captcha with id '${id}' was not found`;
    }

    if (this.captcha[id].generatedAt + this.options.solveIn <= now()) {
      this.revoke(id);
      return false;
    }

    if (isEqual(this.captcha[id].answer, sortBy(answer))) {
      this.captcha[id].solvedAt = now();
      return true;
    }
  
    this.revoke(id);
    return false;
  }
}

module.exports = Captcha;
