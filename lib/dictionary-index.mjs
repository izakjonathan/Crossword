// One index per fill: candidate arrays are immutable and retain bank order.
// A position index supports crossing letters anywhere, including prefixes,
// without rescanning every answer for each regular-expression pattern.
export function createDictionaryIndex(bank) {
  const lengths = Map.groupBy(bank, word => word.answer.length);
  const cache = new WeakMap(), empty = [];
  function info(domain) {
    let value = cache.get(domain);
    if (!value) {
      value = { answers: null, positions: new Map(), exclusions: new Map() };
      cache.set(domain, value);
    }
    return value;
  }
  function letters(domain, position, allowSpecialist = true) {
    const value = info(domain);
    let groups = value.positions.get(position);
    if (!groups) {
      const all = new Map();
      for (const word of domain) {
        const letter = word.answer[position];
        if (!all.has(letter)) all.set(letter, []);
        all.get(letter).push(word);
      }
      groups = { all, nonspecialist: null };
      value.positions.set(position, groups);
    }
    if (allowSpecialist) return groups.all;
    // Most searches only need the full index. Build fairness-restricted
    // groups only when a specialist crossing actually requests them.
    if (!groups.nonspecialist) {
      groups.nonspecialist = new Map();
      for (const [letter, words] of groups.all) {
        const ordinary = words.filter(word => word.vocabularyLevel !== 3);
        if (ordinary.length) groups.nonspecialist.set(letter, ordinary);
      }
    }
    return groups.nonspecialist;
  }
  function without(domain, answer) {
    const value = info(domain);
    value.answers ||= new Set(domain.map(word => word.answer));
    if (!value.answers.has(answer)) return domain;
    if (value.exclusions.has(answer)) return value.exclusions.get(answer);
    const filtered = domain.filter(word => word.answer !== answer);
    // Bound retained variants rather than caching every possible subset.
    if (value.exclusions.size < 16) value.exclusions.set(answer, filtered);
    return filtered;
  }
  return { forLength: length => lengths.get(length) || empty, letters, without };
}
