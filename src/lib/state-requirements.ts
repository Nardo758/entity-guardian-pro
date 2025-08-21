export const stateRequirements = {
  CA: {
    name: 'California',
    sole_proprietorship: { fee: 0 },
    partnership: { fee: 0 },
    llc: { fee: 20 },
    c_corp: { fee: 25 },
    s_corp: { fee: 25 }
  },
  TX: {
    name: 'Texas',
    sole_proprietorship: { fee: 0 },
    partnership: { fee: 0 },
    llc: { fee: 0 },
    c_corp: { fee: 0 },
    s_corp: { fee: 0 }
  },
  FL: {
    name: 'Florida',
    sole_proprietorship: { fee: 0 },
    partnership: { fee: 0 },
    llc: { fee: 138.75 },
    c_corp: { fee: 150 },
    s_corp: { fee: 150 }
  },
  NY: {
    name: 'New York',
    sole_proprietorship: { fee: 0 },
    partnership: { fee: 0 },
    llc: { fee: 9 },
    c_corp: { fee: 9 },
    s_corp: { fee: 9 }
  },
  DE: {
    name: 'Delaware',
    sole_proprietorship: { fee: 0 },
    partnership: { fee: 0 },
    llc: { fee: 300 },
    c_corp: { fee: 175 },
    s_corp: { fee: 175 }
  }
} as const;