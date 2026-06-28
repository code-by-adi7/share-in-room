export function containsSQLInjection(input: string): boolean {
  if (!input) return false
  // Check for common SQL injection patterns like --, ;, OR 1=1, UNION, DROP
  const sqlInjectionPattern = /(--|;|' OR '|" OR "|'='|"="|UNION SELECT|DROP TABLE|INSERT INTO|DELETE FROM|UPDATE .+ SET)/i;
  return sqlInjectionPattern.test(input)
}
