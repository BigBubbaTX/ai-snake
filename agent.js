class Agent {
  constructor() {
    this.q = {};
    this.alpha = 0.15;     // learn a bit faster
this.gamma = 0.95;     // value future more
this.epsilon = 1.0;
this.minEpsilon = 0.05;
this.decay = 0.999;    // MUCH slower decay (key!)

  }

  getKey(state) {
    return state.join(",");
  }

  getQ(state, action) {
    const key = this.getKey(state);
    if (!this.q[key]) this.q[key] = [0, 0, 0];
    return this.q[key][action];
  }

  chooseAction(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * 3);
    }
    const key = this.getKey(state);
    if (!this.q[key]) this.q[key] = [0, 0, 0];
    return this.q[key].indexOf(Math.max(...this.q[key]));
  }

  learn(s, a, r, s2) {
    const key = this.getKey(s);
    if (!this.q[key]) this.q[key] = [0, 0, 0];

    const maxNext = Math.max(...(this.q[this.getKey(s2)] || [0, 0, 0]));
    this.q[key][a] += this.alpha * (r + this.gamma * maxNext - this.q[key][a]);

    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decay);
  }

  reset() {
    this.q = {};
    this.epsilon = 1.0;
  }
}

