export function similarLangs(targetLang: string, candidateLangs: string[]): string[] {
  const [targetName, targetDetail] = targetLang.split(" ", 2);
  const selectedLangs: [string, number][] = candidateLangs.filter(candidateLang => {
    const [name, _] = candidateLang.split(" ", 2);
    return name == targetName;
  }).map(candidateLang => {
    const [_, detail] = candidateLang.split(" ", 2);
    return [candidateLang, similarity(detail, targetDetail)];
  });
  return selectedLangs.sort((a, b) => a[1] - b[1]).map(([lang, _]) => lang);
}

function similarity(s: string, t: string): number {
  const n = s.length, m = t.length;
  let dp = new Array(m + 1).fill(0);
  for (let i = 0; i < n; i++) {
    const dp2 = new Array(m + 1).fill(0);
    for (let j = 0; j < m; j++) {
      const cost = (s.charCodeAt(i) - t.charCodeAt(j))**2;
      dp2[j + 1] = Math.min(dp[j] + cost, dp[j + 1] + cost * 0.25, dp2[j] + cost * 0.25);
    }
    dp = dp2;
  }
  return dp[m];
}